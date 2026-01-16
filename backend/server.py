import asyncio
import uuid
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from database import init_db, get_session, Run, Event as DBEvent
from models import CreateRunRequest, CreateRunResponse, RunStatus
from runner import StepChainRunner

# Background task tracking
background_tasks = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    await init_db()
    yield

app = FastAPI(
    title="Step-Chain Runner API",
    description="A step-by-step problem solver with real-time streaming",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Step-Chain Runner API",
        "docs": "/docs"
    }

@app.post("/api/runs", response_model=CreateRunResponse)
async def create_run(
    request: CreateRunRequest,
    session: AsyncSession = Depends(get_session)
):
    """
    Create a new problem-solving run.

    The run will be queued and processed asynchronously.
    """
    run_id = str(uuid.uuid4())

    # Create run in database
    run = Run(
        run_id=run_id,
        problem=request.problem,
        status="queued"
    )
    session.add(run)
    await session.commit()

    # Start background task
    async def run_task():
        async for session_inner in get_session():
            runner = StepChainRunner(session_inner)
            await runner.run(run_id, request.problem)
            break

    task = asyncio.create_task(run_task())
    background_tasks[run_id] = task

    return CreateRunResponse(run_id=run_id)

@app.get("/api/runs/{run_id}", response_model=RunStatus)
async def get_run_status(
    run_id: str,
    session: AsyncSession = Depends(get_session)
):
    """
    Get the current status of a run.
    """
    result = await session.execute(
        select(Run).where(Run.run_id == run_id)
    )
    run = result.scalar_one_or_none()

    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    return RunStatus(
        run_id=run.run_id,
        status=run.status,
        current_step_index=run.current_step_index,
        total_steps=run.total_steps,
        started_at=run.started_at,
        updated_at=run.updated_at,
        final_output=run.final_output,
        error=run.error
    )

@app.get("/api/runs/{run_id}/events")
async def stream_run_events(
    run_id: str,
    session: AsyncSession = Depends(get_session)
):
    """
    Stream real-time events for a run via Server-Sent Events (SSE).

    Event types:
    - plan_created: Initial plan generated
    - step_started: Step execution begins
    - step_output: Step produces output
    - verify_pass: Step verification succeeded
    - verify_fail: Step verification failed
    - run_completed: Run finished successfully
    - run_failed: Run encountered an error
    """

    async def event_generator():
        # Check if run exists
        result = await session.execute(
            select(Run).where(Run.run_id == run_id)
        )
        run = result.scalar_one_or_none()

        if not run:
            yield {
                "event": "error",
                "data": '{"error": "Run not found"}'
            }
            return

        last_event_id = 0

        while True:
            # Fetch new events
            result = await session.execute(
                select(DBEvent)
                .where(DBEvent.run_id == run_id)
                .where(DBEvent.id > last_event_id)
                .order_by(DBEvent.id)
            )
            events = result.scalars().all()

            for event in events:
                import json
                event_data = {
                    "ts": event.ts.isoformat(),
                    "type": event.type,
                    "data": event.data
                }
                yield {
                    "event": "message",
                    "data": json.dumps(event_data)
                }
                last_event_id = event.id

            # Check if run is complete
            result = await session.execute(
                select(Run).where(Run.run_id == run_id)
            )
            run = result.scalar_one()

            if run.status in ["completed", "failed"]:
                # Send final status and close connection
                break

            # Wait before polling again
            await asyncio.sleep(0.5)

    return EventSourceResponse(event_generator())

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)