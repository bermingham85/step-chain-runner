"""Schema definitions for the LangChain Creator System."""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class ProjectRequest(BaseModel):
    """Structured project request extracted from user input."""
    
    name: str = Field(..., description="Project slug name (e.g., 'wellybox-receipt-intake')")
    goal: str = Field(..., description="High-level business goal")
    inputs: List[str] = Field(..., description="Input sources (webhooks, files, APIs)")
    outputs: List[str] = Field(..., description="Output destinations (sheets, DB, files)")
    integrations: List[str] = Field(default_factory=list, description="External services (Google, Slack, etc)")
    deterministic_rules: List[str] = Field(default_factory=list, description="Rules that don't need LLM")
    llm_tasks: List[str] = Field(default_factory=list, description="Tasks requiring LLM decisions")
    human_review_requirements: Optional[str] = Field(None, description="Human review gates")
    storage_requirements: List[str] = Field(default_factory=list, description="Persistence needs")
    error_handling_requirements: List[str] = Field(default_factory=list, description="Error handling strategy")
    token_output_constraints: Optional[str] = Field(None, description="Output size limits")
    deliverables: List[str] = Field(default_factory=list, description="Required deliverables")


class WorkflowNode(BaseModel):
    """A node in the workflow graph."""
    id: str
    type: str  # 'start', 'process', 'decision', 'integration', 'end'
    description: str
    

class WorkflowEdge(BaseModel):
    """An edge connecting workflow nodes."""
    from_node: str
    to_node: str
    condition: Optional[str] = None


class GeneratedBlueprint(BaseModel):
    """The complete blueprint for a generated LangGraph project."""
    
    project_name: str
    workflow_graph: Dict[str, Any] = Field(..., description="Nodes and edges")
    state_schema: str = Field(..., description="Pydantic state model as code string")
    file_tree: List[str] = Field(..., description="List of file paths to generate")
    files: Dict[str, str] = Field(..., description="Mapping of filepath -> content")
    env_vars: List[str] = Field(default_factory=list, description="Required environment variables")
    run_commands: List[str] = Field(default_factory=list, description="Setup and run commands")
    tests: List[str] = Field(default_factory=list, description="Test commands or descriptions")
    limitations: List[str] = Field(default_factory=list, description="Known limitations")
