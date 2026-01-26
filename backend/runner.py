import os
import json
import re
import logging
from datetime import datetime
from typing import TypedDict, Annotated, Sequence
from operator import add
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langgraph.graph import StateGraph, END
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import Run, Event as DBEvent

logger = logging.getLogger(__name__)

# Token limits for context management
MAX_PROBLEM_LENGTH = 3000  # Truncate very long problems
MAX_STEP_OUTPUT_LENGTH = 1500  # Truncate step outputs for context
MAX_CONTEXT_STEPS = 2  # Only include last N steps in context
MAX_MESSAGES_IN_CONTEXT = 4  # Only keep last N messages for API calls

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
    
    def __init__(self, session: AsyncSession):
        self.session = session
        anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        if not anthropic_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is required")
        
        self.model = ChatAnthropic(
            model=os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-5-20250929"),
            anthropic_api_key=anthropic_key,
            max_tokens=4096
        )
    
    def truncate_text(self, text: str, max_length: int) -> str:
        """Truncate text to max length with ellipsis."""
        if len(text) <= max_length:
            return text
        return text[:max_length] + "...[truncated]"
    
    async def emit_event(self, run_id: str, event_type: str, data: dict):
        """Emit an event to the database."""
        # Truncate data for storage to prevent DB issues
        safe_data = {}
        for k, v in data.items():
            if isinstance(v, str) and len(v) > 5000:
                safe_data[k] = v[:5000] + "...[truncated]"
            else:
                safe_data[k] = v
        
        event = DBEvent(
            run_id=run_id,
            type=event_type,
            data=safe_data
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
    
    def extract_json_from_response(self, text: str) -> list:
        """Extract JSON array from response text, handling various formats."""
        text = text.strip()
        
        # Try to find JSON in code blocks first
        code_block_patterns = [
            r'```json\s*([\s\S]*?)\s*```',
            r'```\s*([\s\S]*?)\s*```',
        ]
        
        for pattern in code_block_patterns:
            match = re.search(pattern, text)
            if match:
                json_str = match.group(1).strip()
                try:
                    return json.loads(json_str)
                except json.JSONDecodeError:
                    continue
        
        # Try to find JSON array directly
        array_match = re.search(r'\[\s*\{[\s\S]*\}\s*\]', text)
        if array_match:
            try:
                return json.loads(array_match.group())
            except json.JSONDecodeError:
                pass
        
        # Last resort: try parsing the whole thing
        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON: {e}")
            raise
    
    async def create_plan(self, state: StepChainState) -> StepChainState:
        """Create a plan by breaking down the problem into steps."""
        run_id = state["run_id"]
        problem = state["problem"]
        
        await self.update_run(run_id, status="running", started_at=datetime.utcnow())
        
        # Truncate very long problems
        truncated_problem = self.truncate_text(problem, MAX_PROBLEM_LENGTH)
        
        prompt = f"""You are a problem-solving assistant. Break down the following problem into 3-5 clear, actionable steps.

Problem: {truncated_problem}

For each step, provide:
1. A clear description of what needs to be done (keep descriptions concise, max 100 words)
2. A verification checklist (2-3 items) to confirm the step is complete

IMPORTANT: Return ONLY valid JSON. No markdown, no explanations.
Return a JSON array in this exact format:
[
  {{
    "step_number": 1,
    "description": "Step description here",
    "verification_checklist": ["Check item 1", "Check item 2"]
  }}
]"""
        
        message = HumanMessage(content=prompt)
        
        try:
            # Fresh call - no previous messages
            response = await self.model.ainvoke([message])
            
            plan = self.extract_json_from_response(response.content)
            
            # Validate plan structure
            if not isinstance(plan, list) or len(plan) == 0:
                raise ValueError("Plan must be a non-empty array")
            
            for i, step in enumerate(plan):
                if "step_number" not in step:
                    step["step_number"] = i + 1
                if "description" not in step:
                    raise ValueError(f"Step {i+1} missing description")
                if "verification_checklist" not in step:
                    step["verification_checklist"] = ["Verify step completion"]
            
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
            error_msg = f"Failed to create plan: {str(e)}"
            logger.error(f"[RUN {run_id}] {error_msg}")
            await self.emit_event(run_id, "run_failed", {"error": error_msg})
            await self.update_run(run_id, status="failed", error=error_msg)
            return {**state, "error": error_msg}
    
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
        
        # Build LIMITED context from previous steps (only last N)
        context = ""
        if state["step_outputs"]:
            recent_outputs = state["step_outputs"][-MAX_CONTEXT_STEPS:]
            start_idx = max(0, len(state["step_outputs"]) - MAX_CONTEXT_STEPS)
            context = "\n\nPrevious steps summary:\n"
            for i, output in enumerate(recent_outputs):
                step_num = start_idx + i + 1
                truncated_output = self.truncate_text(output, MAX_STEP_OUTPUT_LENGTH)
                context += f"Step {step_num}: {truncated_output}\n"
        
        # Truncate problem for step execution
        truncated_problem = self.truncate_text(state['problem'], MAX_PROBLEM_LENGTH)
        
        prompt = f"""Execute the following step to solve the problem.

Original Problem: {truncated_problem}

Current Step: {step['description']}
{context}

Provide a detailed response for completing this step. Be specific and thorough but concise (max 500 words)."""
        
        message = HumanMessage(content=prompt)
        
        try:
            # Use only recent messages to avoid context length issues
            recent_messages = state["messages"][-MAX_MESSAGES_IN_CONTEXT:] if len(state["messages"]) > MAX_MESSAGES_IN_CONTEXT else state["messages"]
            response = await self.model.ainvoke(recent_messages + [message])
            
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
        except Exception as e:
            error_msg = f"Failed to execute step {current_step + 1}: {str(e)}"
            logger.error(f"[RUN {run_id}] {error_msg}")
            await self.emit_event(run_id, "run_failed", {"error": error_msg})
            await self.update_run(run_id, status="failed", error=error_msg)
            return {**state, "error": error_msg}
    
    async def verify_step(self, state: StepChainState) -> StepChainState:
        """Verify the current step using the checklist."""
        run_id = state["run_id"]
        current_step = state["current_step"]
        plan = state["plan"]
        step = plan[current_step]
        step_output = state["step_outputs"][-1]
        
        checklist = step["verification_checklist"]
        
        # Truncate step output for verification
        truncated_output = self.truncate_text(step_output, MAX_STEP_OUTPUT_LENGTH)
        
        prompt = f"""Verify if the following step output satisfies all checklist items.

Step: {step['description']}
Step Output: {truncated_output}

Verification Checklist:
{chr(10).join(f'- {item}' for item in checklist)}

Respond with ONLY "PASS" if all checklist items are satisfied, or "FAIL" followed by a brief reason."""
        
        message = HumanMessage(content=prompt)
        
        try:
            # Use only recent messages
            recent_messages = state["messages"][-MAX_MESSAGES_IN_CONTEXT:] if len(state["messages"]) > MAX_MESSAGES_IN_CONTEXT else state["messages"]
            response = await self.model.ainvoke(recent_messages + [message])
            
            verification = response.content.strip()
            passed = verification.upper().startswith("PASS")
            
            if passed:
                await self.emit_event(run_id, "verify_pass", {
                    "step_number": step["step_number"]
                })
            else:
                await self.emit_event(run_id, "verify_fail", {
                    "step_number": step["step_number"],
                    "reason": self.truncate_text(verification, 500)
                })
            
            return {
                **state,
                "messages": state["messages"] + [message, response],
                "verification_results": state["verification_results"] + [passed],
                "current_step": current_step + 1
            }
        except Exception as e:
            error_msg = f"Failed to verify step {current_step + 1}: {str(e)}"
            logger.error(f"[RUN {run_id}] {error_msg}")
            # Don't fail the whole run on verification error, just mark as passed
            await self.emit_event(run_id, "verify_pass", {
                "step_number": step["step_number"]
            })
            return {
                **state,
                "verification_results": state["verification_results"] + [True],
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
        
        # Truncate step outputs for final summary
        step_summaries = []
        for i, output in enumerate(state["step_outputs"]):
            truncated = self.truncate_text(output, 300)
            step_summaries.append(f"Step {i+1}: {truncated}")
        
        truncated_problem = self.truncate_text(state['problem'], MAX_PROBLEM_LENGTH)
        
        prompt = f"""Summarize the solution to the original problem based on all completed steps.

Original Problem: {truncated_problem}

Steps Completed:
{chr(10).join(step_summaries)}

Provide a clear, concise final answer to the original problem (max 500 words)."""
        
        message = HumanMessage(content=prompt)
        
        try:
            # Use only recent messages
            recent_messages = state["messages"][-MAX_MESSAGES_IN_CONTEXT:] if len(state["messages"]) > MAX_MESSAGES_IN_CONTEXT else state["messages"]
            response = await self.model.ainvoke(recent_messages + [message])
            
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
        except Exception as e:
            error_msg = f"Failed to generate final output: {str(e)}"
            logger.error(f"[RUN {run_id}] {error_msg}")
            # Try to complete with a basic summary
            basic_output = "Solution completed. Please review the step outputs above for details."
            await self.emit_event(run_id, "run_completed", {
                "final_output": basic_output
            })
            await self.update_run(
                run_id,
                status="completed",
                final_output=basic_output
            )
            return {
                **state,
                "final_output": basic_output
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
            # Increase recursion limit for complex problems
            config = {"recursion_limit": 50}
            final_state = await graph.ainvoke(initial_state, config=config)
            
            # Save final state to database (with truncation)
            try:
                state_data = {
                    "plan": final_state["plan"],
                    "step_outputs": [self.truncate_text(o, 1000) for o in final_state["step_outputs"]],
                    "verification_results": final_state["verification_results"]
                }
                await self.update_run(
                    run_id,
                    state_data=json.dumps(state_data)
                )
            except Exception as e:
                logger.error(f"[RUN {run_id}] Failed to save state data: {e}")
            
        except Exception as e:
            logger.error(f"[RUN {run_id}] Run failed with error: {e}")
            await self.emit_event(run_id, "run_failed", {"error": str(e)})
            await self.update_run(run_id, status="failed", error=str(e))
