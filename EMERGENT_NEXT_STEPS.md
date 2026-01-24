# NEXT STEPS FOR EMERGENT

## Current Status

✅ **Backend**: Complete and working  
✅ **Orchestration Templates**: Universal templates added  
⏳ **Frontend**: In progress - needs completion per specification

---

## Your Task

Complete the frontend UI rebuild following the **orchestration blueprint methodology**.

---

## STEP 1: Read the Blueprint Template

First, understand the system:

1. Read: `TEMPLATE_USAGE_GUIDE.md`
2. Review: `ORCHESTRATION_BLUEPRINT_TEMPLATE.md`
3. Understand: `BUILD_STATE.json` structure

**Key Principle:** One step at a time, verify completion, update state, move to next.

---

## STEP 2: Check Current BUILD_STATE.json

```bash
cat BUILD_STATE.json
```

This shows:
- Current step you're on
- What's been completed
- What remains
- Definition of Done items (12 total)

---

## STEP 3: Review Frontend Requirements

The complete specification is in: `EMERGENT_FRONTEND_TASK.md`

**Required UI Components:**

1. ✅ Problem Input Section
   - Large textarea (min 120px)
   - "Run" button with loading state

2. ⏳ Real-time Progress Indicator
   - Progress bar: `current_step / total_steps`
   - Status badge

3. ⏳ Current Step Panel
   - Step number display
   - Step description
   - Step output
   - Verification status

4. ⏳ Live Event Log
   - Formatted events (not raw JSON)
   - Timestamps
   - Auto-scroll

5. ⏳ Final Output Section
   - Prominent display
   - Copy to clipboard button
   - Success styling

6. ⏳ Error Handling
   - Clear error display
   - Error messages from backend

---

## STEP 4: Execute Following the Pattern

For each component to build:

### Pattern:
```
1. Read BUILD_STATE.json
2. Identify next incomplete item
3. Implement that ONE item
4. Verify it works (check against "Done Looks Like")
5. Update BUILD_STATE.json
6. Commit with clear message
7. Move to next item
```

### Example:

**Before:**
```json
{
  "current_step": "STEP_02",
  "definition_of_done": {
    "4_progress_bar": false
  }
}
```

**Work:**
- Implement progress bar component
- Test it updates on SSE events
- Verify percentage displays correctly

**After:**
```json
{
  "current_step": "STEP_03",
  "completed_steps": ["STEP_01", "STEP_02"],
  "definition_of_done": {
    "4_progress_bar": true
  },
  "artifacts": {
    "progress_component": "frontend/app/components/ProgressBar.tsx"
  }
}
```

**Commit:**
```bash
git add .
git commit -m "STEP_02 COMPLETE: Add real-time progress indicator

- Created ProgressBar component
- Connects to SSE stream
- Displays current_step/total_steps
- Updates in real-time

Definition of Done item 4: ✅ PASS

Co-Authored-By: Emergent <emergent@ai.dev>"
git push origin master
```

---

## STEP 5: Verify Against Definition of Done

After implementing ALL components, verify every item:

```
Definition of Done Checklist:

1. ✅ User can enter a problem and click "Run"
2. ⏳ POST request successfully creates a run and receives run_id
3. ⏳ SSE connection establishes and receives events in real-time
4. ⏳ Progress bar updates as steps complete
5. ⏳ Current step panel shows active step details
6. ⏳ Live event log displays all events with timestamps
7. ⏳ Final output appears in a dedicated section when complete
8. ⏳ Copy button successfully copies final output to clipboard
9. ⏳ Errors are displayed clearly if run fails
10. ⏳ UI is responsive and works on mobile devices
11. ✅ Docker build completes successfully
12. ⏳ All functionality works end-to-end from problem input to final output
```

**You are DONE when all 12 items are ✅**

---

## STEP 6: Test End-to-End

```bash
# Build and run
docker-compose up --build

# Test
1. Open http://localhost:3000
2. Enter: "How do I make chocolate chip cookies?"
3. Click Run
4. Watch all UI elements update in real-time
5. Verify final output appears with copy button
6. Test copy button works
```

---

## STEP 7: Final Update and Push

Update BUILD_STATE.json:
```json
{
  "current_step": "COMPLETE",
  "completed_steps": ["STEP_00", "STEP_01", ... "STEP_12"],
  "definition_of_done": {
    "1_input_working": true,
    "2_post_creates_run": true,
    "3_sse_streaming": true,
    "4_progress_bar": true,
    "5_current_step_panel": true,
    "6_event_log": true,
    "7_final_output_section": true,
    "8_copy_button": true,
    "9_error_display": true,
    "10_responsive_ui": true,
    "11_docker_builds": true,
    "12_end_to_end_working": true
  }
}
```

Final commit:
```bash
git add .
git commit -m "PROJECT COMPLETE: Frontend UI fully rebuilt

All 12 Definition of Done items verified:
✅ Problem input and Run button
✅ POST /api/runs creates run
✅ SSE streaming working
✅ Progress bar updates
✅ Current step panel displays
✅ Live event log formatted
✅ Final output section with copy
✅ Copy button functional
✅ Error handling
✅ Responsive design
✅ Docker builds
✅ End-to-end working

Tested with: 'How do I make chocolate chip cookies?'
All components render and update correctly.

Co-Authored-By: Emergent <emergent@ai.dev>"
git push origin master
```

---

## Important Rules

### ✅ DO:
- Work on ONE component at a time
- Update BUILD_STATE.json after each step
- Verify against "Done Looks Like" criteria
- Commit frequently with clear messages
- Test each component before moving on
- Only modify `frontend/` directory

### ❌ DO NOT:
- Combine multiple steps in one commit
- Skip updating BUILD_STATE.json
- Move to next step without verification
- Modify backend code
- Change docker-compose.yml
- Use the word "orchestration" in UI

---

## Files You'll Work With

**Primary:**
- `frontend/app/page.tsx` - Main UI
- `BUILD_STATE.json` - State tracking
- `EMERGENT_FRONTEND_TASK.md` - Requirements

**Optional:**
- `frontend/app/components/` - Create components here
- `frontend/app/globals.css` - Additional styles

**DO NOT TOUCH:**
- `backend/` - Complete and working
- `docker-compose.yml` - Configured correctly

---

## Getting Help

If stuck:

1. **Check BUILD_STATE.json** - Shows where you are
2. **Review EMERGENT_FRONTEND_TASK.md** - Has exact specs
3. **Look at backend/main.py** - See exact API contracts
4. **Test with curl** - Verify backend endpoints work

Example test:
```bash
# Test backend
curl -X POST http://localhost:8000/api/runs \
  -H "Content-Type: application/json" \
  -d '{"problem":"test"}'
```

---

## Success Looks Like

When you're done:

```bash
✅ docker-compose up --build - runs without errors
✅ Frontend at http://localhost:3000 - loads perfectly
✅ All 12 Definition of Done items - marked true
✅ BUILD_STATE.json current_step - "COMPLETE"
✅ End-to-end test - passes completely
```

---

## Timeline

Suggested breakdown:

- **Steps 1-2**: Progress indicator & current step panel (2-3 hours)
- **Step 3**: Live event log with formatting (2-3 hours)
- **Step 4**: Final output section with copy button (1-2 hours)
- **Step 5**: Error handling (1 hour)
- **Step 6**: Responsive design & polish (1-2 hours)
- **Step 7**: Testing & verification (1-2 hours)

**Total: ~10-15 hours of focused work**

---

**Remember:** The orchestration blueprint methodology ensures you can:
- Resume if interrupted
- Track exactly what's done
- Verify completion objectively
- Hand off at any point

Follow the pattern, update the state, and you'll have a complete, verified system!
