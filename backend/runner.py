import os
import json
from datetime import datetime
from typing import TypedDict, Annotated, Sequence
from operator import add
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langgraph.graph import StateGraph, END
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import Run, Event as DBEvent

class StepChainState(TypedDict):
    """State for the step-chain runner."""
    run_id: str
    problem: str
    messages: Annotated[Sequence[BaseMessage], add]
    plan: list[dict]
    current_step: int
    step_outputs: list[str]
    verification_results: list[bool]
    final_output: str | None
    error: str | None

class StepChainRunner:
    """Runs a problem-solving process step-by-step using LangGraph."""
    
    def __init__(self, session: AsyncSession, api_key: str = None):
        self.session = session
        # Use provided API key or fall back to environment variable
        anthropic_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not anthropic_key:
            raise ValueError("Anthropic API key is required")
        
        self.model = ChatAnthropic(
            model=os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022"),
            api_key=anthropic_key
        )
    
    async def emit_event(self, run_id: str, event_type: str, data: dict):
        """Emit an event to the database."""
        event = DBEvent(
            run_id=run_id,
            type=event_type,
            data=data
        )
        self.session.add(event)
        await self.session.commit()
    
    async def update_run(self, run_id: str, **kwargs):
        """Update run status in database."""
        result = await self.session.execute(
            select(Run).where(Run.run_id == run_id)
        )
        run = result.scalar_one()
        
        for key, value in kwargs.items():
            setattr(run, key, value)
        
        run.updated_at = datetime.utcnow()
        await self.session.commit()
    
    async def create_plan(self, state: StepChainState) -> StepChainState:
        """Create a plan by breaking down the problem into steps."""
        run_id = state["run_id"]
        problem = state["problem"]
        
        await self.update_run(run_id, status="running", started_at=datetime.utcnow())
        
        prompt = f"""You are a problem-solving assistant. Break down the following problem into 3-5 clear, actionable steps.

Problem: {problem}

For each step, provide:
1. A clear description of what needs to be done
2. A verification checklist (2-3 items) to confirm the step is complete

Return ONLY a JSON array of steps in this exact format:
[
  {{
    "step_number": 1,
    "description": "Step description",
    "verification_checklist": ["Check item 1", "Check item 2"]
  }}
]

Do not include any other text, just the JSON array."""
        
        message = HumanMessage(content=prompt)
        response = await self.model.ainvoke([message])
        
        try:
            # Parse the plan from the response
            plan_text = response.content.strip()
            if plan_text.startswith("```json"):
                plan_text = plan_text.split("```json")[1].split("```")[0].strip()
            elif plan_text.startswith("```"):
                plan_text = plan_text.split("```")[1].split("```")[0].strip()
            
            plan = json.loads(plan_text)
            
            await self.emit_event(run_id, "plan_created", {
                "plan": plan,
                "total_steps": len(plan)
            })
            
            await self.update_run(run_id, total_steps=len(plan))
            
            return {
                **state,
                "messages": [message, response],
                "plan": plan,
                "current_step": 0,
                "step_outputs": [],
                "verification_results": []
            }
        except Exception as e:
            await self.emit_event(run_id, "run_failed", {"error": str(e)})
            await self.update_run(run_id, status="failed", error=f"Failed to create plan: {str(e)}")
            return {**state, "error": str(e)}
    
    async def execute_step(self, state: StepChainState) -> StepChainState:
        """Execute the current step."""
        run_id = state["run_id"]
        current_step = state["current_step"]
        plan = state["plan"]
        
        if current_step >= len(plan):
            return state
        
        step = plan[current_step]
        
        await self.emit_event(run_id, "step_started", {
            "step_number": step["step_number"],
            "description": step["description"]
        })
        
        await self.update_run(run_id, current_step_index=current_step)
        
        # Build context from previous steps
        context = ""
        if state["step_outputs"]:
            context = "\n\nPrevious steps completed:\n"
            for i, output in enumerate(state["step_outputs"]):
                context += f"Step {i+1}: {output}\n"
        
        prompt = f"""Execute the following step to solve the problem.

Original Problem: {state['problem']}

Current Step: {step['description']}
{context}

Provide a detailed response for completing this step. Be specific and thorough."""
        
        message = HumanMessage(content=prompt)
        response = await self.model.ainvoke(state["messages"] + [message])
        
        step_output = response.content
        
        await self.emit_event(run_id, "step_output", {
            "step_number": step["step_number"],
            "output": step_output
        })
        
        return {
            **state,
            "messages": state["messages"] + [message, response],
            "step_outputs": state["step_outputs"] + [step_output]
        }
    
    async def verify_step(self, state: StepChainState) -> StepChainState:
        """Verify the current step using the checklist."""
        run_id = state["run_id"]
        current_step = state["current_step"]
        plan = state["plan"]
        step = plan[current_step]
        step_output = state["step_outputs"][-1]
        
        checklist = step["verification_checklist"]
        
        prompt = f"""Verify if the following step output satisfies all checklist items.

Step: {step['description']}
Step Output: {step_output}

Verification Checklist:
{chr(10).join(f'- {item}' for item in checklist)}

Respond with ONLY "PASS" if all checklist items are satisfied, or "FAIL" followed by what's missing."""
        
        message = HumanMessage(content=prompt)
        response = await self.model.ainvoke(state["messages"] + [message])
        
        verification = response.content.strip()
        passed = verification.startswith("PASS")
        
        if passed:
            await self.emit_event(run_id, "verify_pass", {
                "step_number": step["step_number"]
            })
        else:
            await self.emit_event(run_id, "verify_fail", {
                "step_number": step["step_number"],
                "reason": verification
            })
        
        return {
            **state,
            "messages": state["messages"] + [message, response],
            "verification_results": state["verification_results"] + [passed],
            "current_step": current_step + 1
        }
    
    def should_continue(self, state: StepChainState) -> str:
        """Decide if we should continue to next step or finish."""
        if state.get("error"):
            return "error"
        if state["current_step"] >= len(state["plan"]):
            return "finish"
        return "continue"
    
    async def generate_final_output(self, state: StepChainState) -> StepChainState:
        """Generate final output summary."""
        run_id = state["run_id"]
        
        prompt = f"""Summarize the solution to the original problem based on all completed steps.

Original Problem: {state['problem']}

Steps Completed:
{chr(10).join(f'Step {i+1}: {output}' for i, output in enumerate(state['step_outputs']))}

Provide a clear, concise final answer to the original problem."""
        
        message = HumanMessage(content=prompt)
        response = await self.model.ainvoke(state["messages"] + [message])
        
        final_output = response.content
        
        await self.emit_event(run_id, "run_completed", {
            "final_output": final_output
        })
        
        await self.update_run(
            run_id,
            status="completed",
            final_output=final_output
        )
        
        return {
            **state,
            "final_output": final_output,
            "messages": state["messages"] + [message, response]
        }
    
    def build_graph(self) -> StateGraph:
        """Build the LangGraph workflow."""
        workflow = StateGraph(StepChainState)
        
        # Add nodes
        workflow.add_node("create_plan", self.create_plan)
        workflow.add_node("execute_step", self.execute_step)
        workflow.add_node("verify_step", self.verify_step)
        workflow.add_node("generate_final", self.generate_final_output)
        
        # Set entry point
        workflow.set_entry_point("create_plan")
        
        # Add edges
        workflow.add_edge("create_plan", "execute_step")
        workflow.add_edge("execute_step", "verify_step")
        
        workflow.add_conditional_edges(
            "verify_step",
            self.should_continue,
            {
                "continue": "execute_step",
                "finish": "generate_final",
                "error": END
            }
        )
        
        workflow.add_edge("generate_final", END)
        
        return workflow.compile()
    
    async def run(self, run_id: str, problem: str):
        """Run the complete step-chain process."""
        graph = self.build_graph()
        
        initial_state: StepChainState = {
            "run_id": run_id,
            "problem": problem,
            "messages": [],
            "plan": [],
            "current_step": 0,
            "step_outputs": [],
            "verification_results": [],
            "final_output": None,
            "error": None
        }
        
        try:
            final_state = await graph.ainvoke(initial_state)
            
            # Save final state to database
            await self.update_run(
                run_id,
                state_data=json.dumps({
                    "plan": final_state["plan"],
                    "step_outputs": final_state["step_outputs"],
                    "verification_results": final_state["verification_results"]
                })
            )
            
        except Exception as e:
            await self.emit_event(run_id, "run_failed", {"error": str(e)})
            await self.update_run(run_id, status="failed", error=str(e))
