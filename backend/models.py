from datetime import datetime
from typing import Optional, Literal, Any
from pydantic import BaseModel, Field

class CreateRunRequest(BaseModel):
    problem: str = Field(..., description="The problem to solve")

class CreateRunResponse(BaseModel):
    run_id: str

class RunStatus(BaseModel):
    run_id: str
    status: Literal["queued", "running", "completed", "failed"]
    current_step_index: int
    total_steps: int
    started_at: Optional[datetime] = None
    updated_at: datetime
    final_output: Optional[str] = None
    error: Optional[str] = None

class Event(BaseModel):
    ts: datetime
    type: str
    data: dict[str, Any]
