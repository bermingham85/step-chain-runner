# Emergent Frontend Build Task

## Objective
Rebuild the frontend UI for the Step-Chain Runner application. **DO NOT modify the backend** - it is complete and working. Your task is to create a polished, user-friendly interface that connects to the existing backend API.

## Backend API (Already Complete - Do Not Change)

The backend is running on `http://localhost:8000` and provides these endpoints:

### 1. POST /api/runs
Create a new problem-solving run.

**Request:**
```json
{
  "problem": "string - the problem description"
}
```

**Response:**
```json
{
  "run_id": "uuid-string"
}
```

### 2. GET /api/runs/{run_id}
Get the current status of a run.

**Response:**
```json
{
  "run_id": "string",
  "status": "queued|running|completed|failed",
  "current_step_index": 0,
  "total_steps": 5,
  "started_at": "ISO8601 timestamp or null",
  "updated_at": "ISO8601 timestamp",
  "final_output": "string or null",
  "error": "string or null"
}
```

### 3. GET /api/runs/{run_id}/events
Server-Sent Events (SSE) stream for real-time progress updates.

**Event Format:**
```json
{
  "ts": "ISO8601 timestamp",
  "type": "event_type",
  "data": { /* event-specific data */ }
}
```

**Event Types:**
- `plan_created`: Initial plan with steps generated
  - Data: `{ "plan": [...], "total_steps": number }`
- `step_started`: Step execution begins
  - Data: `{ "step_number": number, "description": "string" }`
- `step_output`: Step produces output
  - Data: `{ "step_number": number, "output": "string" }`
- `verify_pass`: Step verification succeeded
  - Data: `{ "step_number": number }`
- `verify_fail`: Step verification failed
  - Data: `{ "step_number": number, "reason": "string" }`
- `run_completed`: Run finished successfully
  - Data: `{ "final_output": "string" }`
- `run_failed`: Run encountered an error
  - Data: `{ "error": "string" }`

## Required UI Layout

The UI must include these components in a single-page application:

### 1. Problem Input Section
- **Large textarea** for entering the problem description
- Placeholder text: "Describe the problem you want to solve..."
- Minimum height: 120px
- **"Run" button** to submit the problem
- Button should be disabled while a run is in progress
- Button text should change to "Running..." when active

### 2. Progress Indicator
Display when a run is active:
- **Progress bar or percentage** showing: `current_step_index / total_steps`
- **Status text** showing the current status: "queued", "running", "completed", "failed"
- Should update in real-time as steps complete

### 3. Current Step Panel
Display the currently executing step:
- **Step number** (e.g., "Step 2 of 5")
- **Step description** from the plan
- **Step output** as it arrives (from `step_output` events)
- **Verification status** (pass/fail icon or indicator)
- Should highlight/animate when a new step starts

### 4. Live Event Log
A scrollable feed showing all events as they arrive:
- **Event type** (prominently displayed)
- **Timestamp** (formatted as time, e.g., "10:23:45 AM")
- **Event data** (formatted nicely, not raw JSON)
- Auto-scroll to latest event
- Each event should be visually distinct
- Maximum height: ~400px with scroll

### 5. Final Output Section
Display when run is completed:
- **Final output text** in a prominent card/box
- **Copy to clipboard button** next to the output
- Should be clearly separated from the event log
- Use success styling (green border, etc.)

### 6. Error Handling
- Display errors prominently if run fails
- Show error message from the backend
- Use error styling (red border, warning icon)

## Technical Requirements

### Framework
- **Next.js 14** with App Router
- **TypeScript**
- **Tailwind CSS** for styling

### SSE Connection
Use native `EventSource` API:
```typescript
const eventSource = new EventSource(`${API_URL}/api/runs/${runId}/events`)

eventSource.onmessage = (event) => {
  const eventData = JSON.parse(event.data)
  // Handle event
}

eventSource.onerror = () => {
  eventSource.close()
  // Handle completion/error
}
```

### State Management
- Use React hooks (`useState`, `useEffect`)
- Track: current run ID, events array, run status, current step, final output

### Styling Guidelines
- Clean, modern design
- Responsive layout (works on mobile and desktop)
- Use a pleasant color scheme (suggest: blue primary, gray neutrals)
- Proper spacing and typography
- Loading states and animations
- Smooth transitions between states

### Docker Integration
- The UI must work in the existing Docker setup
- No changes to `docker-compose.yml` or backend Dockerfile
- Frontend should connect to backend via environment variable `NEXT_PUBLIC_API_URL`

## Definition of Done

The frontend is complete when:

1. ✅ User can enter a problem and click "Run"
2. ✅ POST request successfully creates a run and receives `run_id`
3. ✅ SSE connection establishes and receives events in real-time
4. ✅ Progress bar updates as steps complete
5. ✅ Current step panel shows active step details
6. ✅ Live event log displays all events with timestamps
7. ✅ Final output appears in a dedicated section when complete
8. ✅ Copy button successfully copies final output to clipboard
9. ✅ Errors are displayed clearly if run fails
10. ✅ UI is responsive and works on mobile devices
11. ✅ Docker build completes successfully: `docker-compose up --build`
12. ✅ All functionality works end-to-end from problem input to final output

## Files to Modify

You should only need to modify files in the `frontend/` directory:
- `frontend/app/page.tsx` - Main UI components
- `frontend/app/globals.css` - Additional styles if needed
- `frontend/app/layout.tsx` - Layout wrapper if needed
- Create new components in `frontend/app/components/` as needed

## What NOT to Do

- ❌ Do not modify any backend files (`backend/`)
- ❌ Do not change API endpoints or contracts
- ❌ Do not modify `docker-compose.yml`
- ❌ Do not change the backend Dockerfile
- ❌ Do not use the word "orchestration" anywhere in the UI or code

## Testing

After implementation, test by:
1. Running `docker-compose up --build`
2. Opening `http://localhost:3000`
3. Entering a problem like: "How do I bake a chocolate cake?"
4. Verifying all UI elements update in real-time
5. Confirming final output appears and can be copied
6. Testing error handling with an invalid API key

---

**Note to Emergent:** The backend is production-ready. Focus entirely on creating an excellent user experience that showcases the step-by-step problem-solving process. Make it delightful to watch the AI work through each step!
