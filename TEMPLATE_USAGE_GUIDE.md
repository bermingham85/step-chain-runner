# ORCHESTRATION BLUEPRINT - USAGE GUIDE

## What This Is

A reusable template system for building any project using a **state-driven, step-by-step approach** where:

- Each step is atomic and verifiable
- Progress is tracked in BUILD_STATE.json
- Conversations can be interrupted and resumed
- No hallucination - everything is on disk
- Clear "Done Looks Like" criteria for every step

## Quick Start

### For a New Project

1. **Copy the template:**
   ```bash
   cp ORCHESTRATION_BLUEPRINT_TEMPLATE.md [YOUR_PROJECT]_ORCHESTRATION_BLUEPRINT.md
   ```

2. **Fill in the placeholders:**
   - `[PROJECT_NAME]` → Your project name
   - `[ROOT_PATH]` → Project root directory
   - `[DATE]` → Current date
   - Define your config keys and questions

3. **Break down the work into steps:**
   - Each step = one discrete task
   - Add "Done Looks Like" criteria
   - Include exact commands to execute

4. **Create BUILD_STATE.json:**
   ```json
   {
     "project_name": "your-project",
     "current_step": "STEP_00",
     "completed_steps": [],
     "config": { /* your config */ },
     "artifacts": {},
     "definition_of_done": { /* your DOD items */ },
     "errors": [],
     "last_updated": ""
   }
   ```

5. **Start building:**
   - Give Claude the conversation starter from your blueprint
   - Claude reads state → executes step → updates state → outputs next prompt
   - Repeat for each step

## The Pattern

```
┌─────────────────────────┐
│  Read BUILD_STATE.json  │
└───────────┬─────────────┘
            │
            v
┌─────────────────────────┐
│   Execute STEP_XX       │
│   - Run commands        │
│   - Create artifacts    │
│   - Verify completion   │
└───────────┬─────────────┘
            │
            v
┌─────────────────────────┐
│ Update BUILD_STATE.json │
│ - Mark step complete    │
│ - Record artifacts      │
│ - Set next_step         │
└───────────┬─────────────┘
            │
            v
┌─────────────────────────┐
│  Output Next Prompt     │
└─────────────────────────┘
```

## Key Files

| File | Purpose |
|------|---------|
| `ORCHESTRATION_BLUEPRINT_TEMPLATE.md` | Universal template - copy this for new projects |
| `BUILD_STATE.json` | Tracks progress, config, artifacts for current project |
| `[PROJECT]_ORCHESTRATION_BLUEPRINT.md` | Your customized blueprint for a specific project |

## Example: Step Structure

```markdown
## STEP_03: CREATE DATABASE SCHEMA

### Task
Create SQLite database with all required tables.

### Execute
```python
import sqlite3
conn = sqlite3.connect('data.db')
# ... create tables
conn.close()
```

### Done Looks Like
- [ ] data.db file exists
- [ ] All 5 tables created (verify with SELECT)
- [ ] BUILD_STATE.json: artifacts.database_path = "data.db"
- [ ] BUILD_STATE.json: current_step = "STEP_04"

### Output Artifact
```
[ROOT_PATH]/data.db
```
```

## Benefits

### ✅ Resumable
If conversation ends, just start a new one with the same prompt - BUILD_STATE.json knows where you left off.

### ✅ Verifiable
Every step has clear success criteria you can check.

### ✅ No Hallucination
Everything goes to disk. No relying on LLM memory.

### ✅ Clear Reporting
Standardized format for progress updates.

### ✅ Reusable
One template works for any project.

## Reporting Format

After each step, you'll get:

```
✅ STEP_03 COMPLETE: Create Database Schema

What Was Done:
- Created SQLite database at /project/data.db
- Added 5 tables: users, accounts, transactions, logs, config

Artifacts Created:
- /project/data.db

Verification:
✅ Database file exists - PASS
✅ All tables created - PASS
✅ Schema matches spec - PASS

State Updated:
- current_step: STEP_04
- artifacts.database_path: /project/data.db

---

NEXT STEP PROMPT:

Execute STEP_04: Create API Server

Read state from: /project/BUILD_STATE.json
Confirm current_step = "STEP_04"

Task: Create FastAPI server with health endpoint...
```

## Tips

### Break Steps Into Atomic Units
❌ **Bad:** "Set up backend"  
✅ **Good:** Multiple steps:
- STEP_05: Create database schema
- STEP_06: Create API routes
- STEP_07: Add authentication
- STEP_08: Write tests

### Make Criteria Checkable
❌ **Bad:** "Make sure it works"  
✅ **Good:**
- [ ] Server responds to GET /health with 200
- [ ] Database file exists at expected path
- [ ] All tests pass: `pytest tests/` returns 0 exit code

### Store Everything in State
```json
{
  "artifacts": {
    "database_path": "/path/to/db",
    "server_port": 8000,
    "tests_passing": true,
    "last_build_time": "2026-01-19T10:00:00Z"
  }
}
```

## When to Use This

✅ **Use for:**
- Multi-step projects
- Projects where you might need to pause/resume
- Projects with clear deliverables and verification criteria
- Building systems that will be handed off
- Projects requiring documentation of every step

❌ **Don't use for:**
- Single-step tasks
- Quick fixes or patches
- Exploratory coding where steps aren't known upfront

## Example Projects

- **Estate Management System** - 14 steps from folder creation to deployed workflows
- **Step-Chain Runner** - Backend + Frontend with clear DOD
- **Data Pipeline** - Extract → Transform → Load with verification at each stage
- **API Integration** - Auth → Connect → Test → Deploy

## Need Help?

1. **Look at the template** - It has detailed instructions
2. **Check BUILD_STATE.json** - Always shows where you are
3. **Review completed steps** - See what's been done
4. **Check errors array** - Any issues are logged there

---

**Remember:** The template is designed to be self-documenting. If you follow the structure, anyone (including future you) can pick up where you left off.
