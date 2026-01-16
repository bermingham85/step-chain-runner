# Prompt for Emergent AI

## Context
You are working on the Step-Chain Runner project, a step-by-step problem solver powered by LangGraph and Anthropic Claude.

**GitHub Repository:** https://github.com/bermingham85/step-chain-runner  
**Default Branch:** master

## Your Task
Improve and rebuild the frontend UI ONLY, based on the specifications in `EMERGENT_FRONTEND_TASK.md`.

**CRITICAL:** Do NOT change any backend code, routes, API endpoints, or JSON response shapes. The backend is production-ready and complete.

## Steps to Complete

1. **Read the Contract**
   - Open and thoroughly review `EMERGENT_FRONTEND_TASK.md`
   - This document is your source of truth for all UI requirements
   - It contains exact API specifications, UI layout requirements, and definition of done

2. **Implement the Frontend**
   - Work exclusively in the `frontend/` directory
   - Rebuild `frontend/app/page.tsx` with the full UI specification:
     * Problem input section with textarea and run button
     * Real-time progress indicator (current_step / total_steps)
     * Current step panel showing active step details
     * Live event log with formatted events and timestamps
     * Final output section with copy-to-clipboard functionality
     * Proper error handling and display
   - Create additional components in `frontend/app/components/` as needed
   - Enhance `frontend/app/globals.css` with custom styles if necessary

3. **Connect to Backend APIs**
   - POST to `/api/runs` to create a new run
   - Connect to SSE stream at `/api/runs/{run_id}/events`
   - Handle all event types: plan_created, step_started, step_output, verify_pass, verify_fail, run_completed, run_failed
   - Display events in real-time with proper formatting

4. **Verify Your Work**
   - Ensure the frontend builds successfully
   - Test the complete flow: input → run → events → final output
   - Verify all UI elements from EMERGENT_FRONTEND_TASK.md are implemented
   - Check responsive design on mobile and desktop

5. **Save to GitHub**
   - Commit your frontend changes with a descriptive message
   - Push to the master branch
   - Include co-author line: `Co-Authored-By: Emergent <emergent@ai.dev>`

## Critical Rules

- ❌ **Do NOT modify any files in `backend/` directory**
- ❌ **Do NOT change `docker-compose.yml`**
- ❌ **Do NOT alter API endpoints or response shapes**
- ❌ **Do NOT use the word "orchestration" anywhere in UI or code**
- ✅ **Only modify files in `frontend/` directory**
- ✅ **Follow the exact specifications in EMERGENT_FRONTEND_TASK.md**
- ✅ **Maintain compatibility with existing Docker setup**

## Environment Variables
The frontend connects to the backend via:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```
This is already configured in docker-compose.yml - do not change it.

## Testing
After completing your work:
1. Run: `docker-compose up --build`
2. Open: http://localhost:3000
3. Test with problem: "How do I make chocolate chip cookies?"
4. Verify all UI elements work as specified

## Definition of Done
Your task is complete when all 12 checklist items in `EMERGENT_FRONTEND_TASK.md` (section "Definition of Done") are satisfied.

---

**Remember:** The backend is perfect and working. Your job is to create a beautiful, intuitive UI that showcases the step-by-step problem-solving process. Make it delightful to watch the AI work!
