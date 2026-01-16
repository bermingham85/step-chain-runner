# Quick Setup Guide

## Prerequisites
- Docker and docker-compose installed
- Anthropic API key

## Quick Start

1. **Create `.env` file:**
```bash
cp .env.example .env
```

2. **Add your Anthropic API key to `.env`:**
```
ANTHROPIC_API_KEY=sk-ant-...
```

3. **Start the application:**
```bash
docker-compose up --build
```

4. **Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Development Mode

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

## Testing the System

1. Open http://localhost:3000
2. Enter a problem like: "How do I make chocolate chip cookies?"
3. Click "Run"
4. Watch the real-time event stream as the AI breaks down and solves the problem
5. View the final output when complete

## Project Structure

```
step-chain-runner/
├── backend/              # FastAPI + LangGraph backend
│   ├── main.py          # API endpoints
│   ├── runner.py        # LangGraph step-chain logic
│   ├── database.py      # SQLite models
│   ├── models.py        # Pydantic models
│   └── requirements.txt
├── frontend/            # Next.js frontend
│   ├── app/
│   │   ├── page.tsx    # Main UI
│   │   └── layout.tsx
│   └── package.json
├── docker-compose.yml
├── README.md
└── EMERGENT_FRONTEND_TASK.md  # UI rebuild contract

```

## Next Steps

The backend is production-ready. For UI improvements, see `EMERGENT_FRONTEND_TASK.md` which contains detailed specifications for rebuilding the frontend with a polished interface.
