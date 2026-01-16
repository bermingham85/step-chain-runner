# Testing Guide for Emergent

## Prerequisites

1. **Docker & Docker Compose installed**
2. **API Key**: You'll need an Anthropic API key

## Setup Steps

### 1. Clone and Configure

```bash
git clone https://github.com/bermingham85/step-chain-runner.git
cd step-chain-runner
```

### 2. Create .env File

```bash
cp .env.example .env
```

Edit `.env` and add your Anthropic API key:
```
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
BACKEND_PORT=8000
FRONTEND_PORT=3000
```

### 3. Start the Application

```bash
docker-compose up --build
```

This will:
- Build the backend (FastAPI + LangGraph)
- Build the frontend (Next.js)
- Start both services
- Backend: http://localhost:8000
- Frontend: http://localhost:3000

## Testing the Backend Directly

### Test 1: Health Check
```bash
curl http://localhost:8000/health
```

Expected: `{"status":"healthy"}`

### Test 2: API Documentation
Open: http://localhost:8000/docs

You should see FastAPI's Swagger UI with all endpoints.

### Test 3: Create a Run
```bash
curl -X POST http://localhost:8000/api/runs \
  -H "Content-Type: application/json" \
  -d '{"problem": "How do I make chocolate chip cookies?"}'
```

Expected: `{"run_id":"some-uuid"}`

### Test 4: Get Run Status
```bash
curl http://localhost:8000/api/runs/{run_id}
```

Replace `{run_id}` with the actual ID from Test 3.

Expected:
```json
{
  "run_id": "...",
  "status": "running",
  "current_step_index": 1,
  "total_steps": 4,
  "started_at": "...",
  "updated_at": "...",
  "final_output": null,
  "error": null
}
```

### Test 5: SSE Event Stream
Open in browser or use curl:
```bash
curl -N http://localhost:8000/api/runs/{run_id}/events
```

You should see events streaming in real-time:
```
data: {"ts":"...","type":"plan_created","data":{...}}

data: {"ts":"...","type":"step_started","data":{...}}

data: {"ts":"...","type":"step_output","data":{...}}
```

## Testing the Frontend

### 1. Open Frontend
Navigate to: http://localhost:3000

### 2. Visual Verification
You should see:
- ✅ Page loads without errors
- ✅ Textarea for problem input
- ✅ "Run" button

### 3. Test Complete Flow

**Step 1:** Enter a problem
```
How do I bake a chocolate cake?
```

**Step 2:** Click "Run"

**Expected behavior:**
- ✅ Button changes to "Running..."
- ✅ Button becomes disabled
- ✅ Events start appearing in the log

**Step 3:** Watch the execution

You should see events appearing:
- `plan_created` - Shows the plan with steps
- `step_started` - Each step as it begins
- `step_output` - Output from each step
- `verify_pass` - Step verification
- `run_completed` - Final output

**Step 4:** Verify final output

When complete:
- ✅ Final output appears in a dedicated section
- ✅ Copy button is present
- ✅ Clicking copy button copies the output
- ✅ Button returns to "Run" state

### 4. Test Error Handling

**Test with invalid API key:**
1. Stop docker-compose
2. Edit `.env` and set `ANTHROPIC_API_KEY=invalid`
3. Restart: `docker-compose up --build`
4. Try to run a problem

Expected:
- ✅ Error message displays prominently
- ✅ Error has red styling
- ✅ Error explains what went wrong

## Verifying Definition of Done

Go through each item in the checklist:

### Frontend Checklist

1. **User can enter a problem and click "Run"**
   - Test: Type in textarea and click button
   - ✅ Works if button triggers run

2. **POST request successfully creates a run and receives run_id**
   - Test: Open browser DevTools Network tab
   - ✅ Works if you see POST to /api/runs with 200 response

3. **SSE connection establishes and receives events in real-time**
   - Test: Check Network tab for EventSource connection
   - ✅ Works if events stream appears

4. **Progress bar updates as steps complete**
   - Test: Watch UI during run
   - ✅ Works if you see X/Y steps updating

5. **Current step panel shows active step details**
   - Test: Watch for step description and output
   - ✅ Works if current step info displays

6. **Live event log displays all events with timestamps**
   - Test: Scroll through event log
   - ✅ Works if all events have formatted timestamps

7. **Final output appears in a dedicated section when complete**
   - Test: Wait for run to finish
   - ✅ Works if final answer shows in special section

8. **Copy button successfully copies final output to clipboard**
   - Test: Click copy, paste elsewhere
   - ✅ Works if paste shows the final output

9. **Errors are displayed clearly if run fails**
   - Test: Use invalid API key
   - ✅ Works if error is visible and understandable

10. **UI is responsive and works on mobile devices**
    - Test: Resize browser or use mobile view in DevTools
    - ✅ Works if UI adapts to smaller screens

11. **Docker build completes successfully**
    - Test: `docker-compose up --build`
    - ✅ Works if both services start without errors

12. **All functionality works end-to-end from problem input to final output**
    - Test: Complete flow with a real problem
    - ✅ Works if entire process runs smoothly

## Common Issues and Solutions

### Issue: "Connection refused" errors
**Solution:** Make sure both services are running:
```bash
docker-compose ps
```

### Issue: "ANTHROPIC_API_KEY not set"
**Solution:** Check your `.env` file exists and has the key

### Issue: Frontend can't connect to backend
**Solution:** Verify NEXT_PUBLIC_API_URL is set to `http://localhost:8000`

### Issue: SSE connection fails
**Solution:** Check CORS is enabled in backend (it should be by default)

### Issue: No events appearing
**Solution:** Check browser console for errors, verify API key is valid

## Development Mode (Without Docker)

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

Make sure to set environment variables appropriately when running locally.

## Success Criteria

You've successfully completed testing when:
- ✅ Docker compose builds and runs both services
- ✅ You can enter a problem and get a final answer
- ✅ All events stream in real-time
- ✅ Progress updates as steps complete
- ✅ Copy button works
- ✅ UI is responsive
- ✅ All 12 Definition of Done items are verified

**If any item fails, do NOT mark the task as complete. Fix it first!**
