# Step-Chain Runner

A step-by-step problem solver powered by LangGraph and Anthropic Claude. The system breaks down complex problems into manageable steps, executes them sequentially with verification, and streams progress in real-time.

## Features

- **Step-by-step execution**: Breaks down problems into discrete, verifiable steps
- **Real-time streaming**: SSE (Server-Sent Events) for live progress updates
- **Verification**: Each step includes a verification checklist before proceeding
- **Persistence**: SQLite storage for runs, events, and artifacts
- **Docker ready**: Complete containerization with docker-compose

## Quick Start

### Prerequisites

- Docker and docker-compose
- Anthropic API key

### Setup

1. Clone the repository:
```bash
git clone <your-repo-url>
cd step-chain-runner
```

2. Create `.env` from example:
```bash
cp .env.example .env
```

3. Add your Anthropic API key to `.env`:
```
ANTHROPIC_API_KEY=your_key_here
```

4. Start the services:
```bash
docker-compose up --build
```

5. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## API Endpoints

### POST /api/runs
Create a new problem-solving run.

**Request:**
```json
{
  "problem": "Your problem description here"
}
```

**Response:**
```json
{
  "run_id": "uuid-string"
}
```

### GET /api/runs/{run_id}
Get the current status of a run.

**Response:**
```json
{
  "run_id": "uuid-string",
  "status": "queued|running|completed|failed",
  "current_step_index": 0,
  "total_steps": 5,
  "started_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "final_output": "string or null",
  "error": "string or null"
}
```

### GET /api/runs/{run_id}/events
Stream real-time events via Server-Sent Events (SSE).

**Event Types:**
- `plan_created`: Initial plan with steps generated
- `step_started`: Step execution begins
- `step_output`: Intermediate output from step
- `verify_pass`: Step verification succeeded
- `verify_fail`: Step verification failed
- `run_completed`: Run finished successfully
- `run_failed`: Run encountered an error

**Event Format:**
```json
{
  "ts": "2024-01-01T00:00:00Z",
  "type": "step_started",
  "data": {}
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key | (required) |
| `ANTHROPIC_MODEL` | Claude model to use | claude-3-5-sonnet-20241022 |
| `BACKEND_PORT` | Backend API port | 8000 |
| `FRONTEND_PORT` | Frontend UI port | 3000 |

## Architecture

- **Backend**: FastAPI (Python 3.11) with LangGraph for step execution
- **Frontend**: Next.js 14 (App Router) with TypeScript and Tailwind CSS
- **Database**: SQLite for persistence
- **Streaming**: SSE for real-time updates

## Development

### Backend Only
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend Only
```bash
cd frontend
npm install
npm run dev
```

## License

MIT
