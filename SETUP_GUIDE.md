# Step-Chain Runner - Setup Guide

## Prerequisites

- Python 3.11+
- Node.js 18+ and Yarn
- Anthropic API key (required for AI functionality)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/bermingham85/step-chain-runner.git
cd step-chain-runner
```

### 2. Backend Setup

```bash
cd backend

# Copy environment template
cp .env.example .env

# Edit .env and add your Anthropic API key
# Open .env in your text editor and replace:
# ANTHROPIC_API_KEY="your_anthropic_api_key_here"
# with your actual key from https://console.anthropic.com/

# Install Python dependencies
pip install -r requirements.txt

# Start the backend server
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

The backend will be available at: http://localhost:8001

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
yarn install

# Start the development server
yarn start
```

The frontend will be available at: http://localhost:3000

## Environment Configuration

### Backend Environment Variables

Edit `backend/.env`:

```bash
# Database Configuration
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
DATABASE_PATH="data/runs.db"

# API Configuration
CORS_ORIGINS="*"

# Anthropic API (Required)
ANTHROPIC_API_KEY="sk-ant-api03-..."  # Your actual API key here
ANTHROPIC_MODEL="claude-3-5-sonnet-20241022"
```

### Frontend Environment Variables

The frontend environment is already configured in `frontend/.env`:

```bash
REACT_APP_BACKEND_URL=http://localhost:8001
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
```

**Note**: For production deployment, update `REACT_APP_BACKEND_URL` to your production backend URL.

## Getting Your Anthropic API Key

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and add it to `backend/.env`

## Running the Application

### Option 1: Run Both Services Separately

**Terminal 1 - Backend:**
```bash
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
yarn start
```

### Option 2: Using Docker (Coming Soon)

Docker support will be added in a future release.

## Testing the Application

1. Open http://localhost:3000 in your browser
2. Enter a problem in the textarea (e.g., "How do I make chocolate chip cookies?")
3. Click the "Forge Chain" button
4. Watch the AI solve the problem step-by-step in real-time!

## Features

- **Chain-Link UI**: Beautiful blockchain-inspired design with glowing gradients
- **Real-Time Streaming**: SSE (Server-Sent Events) for live progress updates
- **Step-by-Step Execution**: Watch the AI break down and solve problems
- **Verification System**: Each step is verified before proceeding
- **Interactive Progress**: Live progress bar and event log
- **Copy Output**: Easy copy-to-clipboard functionality

## Troubleshooting

### Backend won't start

**Error**: `Could not resolve authentication method`

**Solution**: Make sure you've added your Anthropic API key to `backend/.env`

```bash
cd backend
cat .env  # Check if API key is set
# If not, edit .env and add: ANTHROPIC_API_KEY="your_key_here"
```

### Frontend can't connect to backend

**Error**: Connection refused or CORS errors

**Solution**: 
1. Ensure backend is running on port 8001
2. Check `REACT_APP_BACKEND_URL` in `frontend/.env`
3. Restart both services

### Database errors

**Error**: Database file issues

**Solution**: Create the data directory:
```bash
cd backend
mkdir -p data
```

## Project Structure

```
step-chain-runner/
├── backend/
│   ├── .env.example          # Environment template (commit this)
│   ├── .env                  # Your actual config (DO NOT commit)
│   ├── server.py             # FastAPI application
│   ├── main.py               # Alternative entry point
│   ├── runner.py             # LangGraph step-chain logic
│   ├── database.py           # SQLite models
│   ├── models.py             # Pydantic schemas
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.js           # Main React component
│   │   ├── App.css          # Chain-link styling
│   │   └── components/      # UI components
│   ├── package.json         # Node dependencies
│   └── .env                 # Frontend config
├── .gitignore               # Git ignore rules (includes .env)
└── README.md                # This file
```

## Security Notes

⚠️ **IMPORTANT**: 
- **Never commit** `.env` files to version control
- The `.gitignore` is configured to exclude all `.env` files
- Always use `.env.example` as a template
- Keep your API keys secret

## API Endpoints

### POST /api/runs
Create a new problem-solving run.

**Request:**
```json
{
  "problem": "Your problem description"
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

### GET /api/runs/{run_id}/events
Stream real-time events via SSE.

## Development

### Adding New Features

1. Backend changes go in `backend/` directory
2. Frontend changes go in `frontend/src/` directory
3. Update `.env.example` files if new environment variables are added
4. Test thoroughly before committing

### Code Style

- **Backend**: Follow PEP 8 for Python
- **Frontend**: Use ESLint rules (already configured)
- **Commits**: Use clear, descriptive commit messages

## Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check existing documentation
- Review the TESTING_GUIDE.md for testing procedures

## License

MIT License - See LICENSE file for details

---

**Ready to solve problems with AI?** 🚀

Start the servers and visit http://localhost:3000 to begin!
