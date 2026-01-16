# Frontend UI Rebuild - Emergent Task

## ⚠️ DEFINITION OF DONE - READ THIS FIRST

**You are DONE when ALL 12 items below are verified:**

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

**Test completion by:**
1. Run: `docker-compose up --build`
2. Open: http://localhost:3000
3. Enter: "How do I make chocolate chip cookies?"
4. Verify: All 12 items above work perfectly

---

## Context

You are working on the Step-Chain Runner project, a step-by-step problem solver powered by LangGraph and Anthropic Claude.

**GitHub Repository:** https://github.com/bermingham85/step-chain-runner  
**Default Branch:** master

## Your Task

Improve and rebuild the frontend UI ONLY, based on the specifications in `EMERGENT_FRONTEND_TASK.md`.

**CRITICAL:** Do NOT change any backend code, routes, API endpoints, or JSON response shapes. The backend is production-ready and complete.

## Steps to Complete

### 1. Read the Contract
- Open and thoroughly review `EMERGENT_FRONTEND_TASK.md`
- This document is your source of truth for all UI requirements
- It contains exact API specifications, UI layout requirements, and technical details

### 2. Implement the Frontend
Work exclusively in the `frontend/` directory.

Rebuild `frontend/app/page.tsx` with these required sections:

**a) Problem Input Section**
- Large textarea (min 120px height)
- Placeholder: "Describe the problem you want to solve..."
- "Run" button (disabled while running, shows "Running...")

**b) Real-time Progress Indicator**
- Progress bar showing: `current_step_index / total_steps`
- Status text: "queued", "running", "completed", "failed"
- Updates in real-time

**c) Current Step Panel**
- Step number display (e.g., "Step 2 of 5")
- Step description from the plan
- Step output as it arrives
- Verification status (pass/fail icon)
- Highlight/animate on new step

**d) Live Event Log**
- Scrollable feed (~400px max height)
- Event type prominently displayed
- Formatted timestamp (e.g., "10:23:45 AM")
- Event data formatted nicely (NOT raw JSON)
- Auto-scroll to latest
- Visually distinct events

**e) Final Output Section**
- Prominent card/box for final output
- Copy to clipboard button
- Success styling (green border)
- Clearly separated from event log

**f) Error Handling**
- Prominent error display
- Error message from backend
- Error styling (red border, warning icon)

**Optional:**
- Create components in `frontend/app/components/`
- Enhance `frontend/app/globals.css`

### 3. Connect to Backend APIs

**POST /api/runs**
```typescript
fetch(`${API_URL}/api/runs`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ problem })
})
```

**SSE Stream /api/runs/{run_id}/events**
```typescript
const eventSource = new EventSource(`${API_URL}/api/runs/${runId}/events`)

eventSource.onmessage = (event) => {
  const eventData = JSON.parse(event.data)
  // Handle: plan_created, step_started, step_output, 
  //         verify_pass, verify_fail, run_completed, run_failed
}

eventSource.onerror = () => {
  eventSource.close()
}
```

### 4. Verify Your Work

Before pushing, confirm:
- Frontend builds without errors
- All 12 Definition of Done items work
- Responsive on mobile and desktop
- Docker compose runs successfully

### 5. Save to GitHub

When ALL 12 items are verified:
```bash
git add frontend/
git commit -m "Rebuild frontend UI per EMERGENT_FRONTEND_TASK.md

- Complete UI with all required sections
- Real-time SSE event streaming
- Progress tracking and step display
- Copy to clipboard functionality
- Responsive design
- All 12 Definition of Done items verified

Co-Authored-By: Emergent <emergent@ai.dev>"
git push origin master
```

---

## Critical Rules

### ❌ DO NOT:
- Modify any files in `backend/` directory
- Change `docker-compose.yml`
- Alter API endpoints or response shapes
- Use the word "orchestration" anywhere in UI or code
- Push incomplete work

### ✅ DO:
- Only modify files in `frontend/` directory
- Follow exact specifications in `EMERGENT_FRONTEND_TASK.md`
- Maintain compatibility with existing Docker setup
- Test all 12 Definition of Done items before pushing
- Include co-author line in commit message

---

## Environment Variables

The frontend connects to backend via:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```
This is configured in docker-compose.yml - do not change it.

---

## How to Know You're Done

You're done when you can:
1. Run `docker-compose up --build` ✅
2. Open http://localhost:3000 ✅
3. Enter "How do I make chocolate chip cookies?" ✅
4. Watch the UI display all steps in real-time ✅
5. See the final output with a working copy button ✅
6. Verify all 12 Definition of Done checklist items ✅

**If ANY item doesn't work, you're NOT done. Fix it before pushing.**

---

**Remember:** The backend is perfect. Your job is to create a beautiful, intuitive UI that showcases the step-by-step problem-solving process. Make it delightful to watch the AI work through each step!
