# ORCHESTRATION BLUEPRINT TEMPLATE

## PROJECT: [PROJECT_NAME]

**Version:** 1.0  
**Created:** [DATE]  
**Status:** [PLANNING|IN_PROGRESS|COMPLETE]

---

## IMMEDIATE START PROMPT

Copy this entire document into a new Claude conversation to begin building.

---

# BUILD SESSION START

## Your Role

You are a system builder. You will execute ONE step at a time from a predefined sequence. You do not deviate, extend, or add scope. You complete the step, verify it works, update the state file, and output the next step's prompt.

## Critical Rules

1. **ONE STEP PER CONVERSATION** - Do not combine steps
2. **STATE FILE IS TRUTH** - Read it first, write it after
3. **LOCAL STORAGE ONLY** - All artifacts go to filesystem, not LLM memory
4. **VERIFY BEFORE PROCEEDING** - Each step has "Done Looks Like" criteria
5. **NO HALLUCINATION** - If something doesn't exist, say so
6. **HANDOVER ON EXIT** - If conversation must end, trigger handover workflow

## State File Location

```
[ROOT_PATH]\BUILD_STATE.json
```

## First Action

Read the state file. If it doesn't exist, create it with this structure:

```json
{
  "project_name": "[PROJECT_NAME]",
  "current_step": "STEP_00",
  "completed_steps": [],
  "config": {
    "root_path": "[ROOT_PATH]",
    "[CONFIG_KEY_1]": "[CONFIG_VALUE_1]",
    "[CONFIG_KEY_2]": "[CONFIG_VALUE_2]"
  },
  "artifacts": {},
  "definition_of_done": {
    "[DOD_ITEM_1]": false,
    "[DOD_ITEM_2]": false
  },
  "errors": [],
  "last_updated": "",
  "next_step_prompt": ""
}
```

Then execute STEP_00.

---

## STEP_00: CONFIGURATION COLLECTION

### Task
Collect required configuration from user before any build work.

### Questions to Ask
```
Before building, I need these values:

1. ROOT_PATH - Where should the project live?
   Default: [DEFAULT_PATH]
   Your value: ___

2. [QUESTION_2]
   Default: [DEFAULT_2]
   Your value: ___

3. [QUESTION_3]
   Default: [DEFAULT_3]
   Your value: ___

[ADD MORE QUESTIONS AS NEEDED]
```

### Done Looks Like
- [ ] All configuration questions answered
- [ ] BUILD_STATE.json updated with config values
- [ ] current_step set to "STEP_01"

### On Completion
Update state file, output STEP_01 prompt.

---

## STEP_01: [STEP_NAME]

### Task
[Describe what this step accomplishes]

### Execute
```[language]
[Commands or code to execute]
```

### Done Looks Like
- [ ] [Verification criterion 1]
- [ ] [Verification criterion 2]
- [ ] [Verification criterion 3]
- [ ] BUILD_STATE.json: artifacts.[artifact_name] = [expected_value]
- [ ] BUILD_STATE.json: current_step = "STEP_02"

### Output Artifact
```
[Path to created artifact]
```

---

## STEP_02: [STEP_NAME]

### Task
[Describe what this step accomplishes]

### Execute
```[language]
[Commands or code to execute]
```

### Done Looks Like
- [ ] [Verification criterion 1]
- [ ] [Verification criterion 2]
- [ ] BUILD_STATE.json: current_step = "STEP_03"

---

## [CONTINUE WITH MORE STEPS AS NEEDED]

---

## HANDOVER PROTOCOL

If a conversation must end before completing current step:

1. Note current step and what's done
2. Update BUILD_STATE.json with progress
3. Save any partial work
4. Document what remains

### Handover Data to Include
```json
{
  "current_step": "STEP_XX",
  "what_completed": "...",
  "what_remains": "...",
  "blockers": "...",
  "next_action": "..."
}
```

---

## CONVERSATION STARTER

**Paste this into a new Claude conversation to begin:**

```
I am building [PROJECT_NAME].

State file location: [ROOT_PATH]\BUILD_STATE.json

Instructions:
1. Check if state file exists
2. If not: create it and ask configuration questions (STEP_00)
3. If exists: read current_step and execute that step
4. After completing step: update state file, output next step prompt
5. Do not skip steps. Do not extend scope. One step per conversation.

Reference document: [THIS_DOCUMENT_NAME]

Begin.
```

---

## ERROR RECOVERY

If any step fails:

1. Check BUILD_STATE.json for current_step
2. Check errors array for logged issues
3. Fix the issue
4. Re-run the same step prompt
5. Do not proceed until step passes

If conversation ends mid-step:

1. Read BUILD_STATE.json
2. Check completed_steps
3. Resume from current_step with same prompt

---

## TEMPLATE INSTRUCTIONS

### For Claude: How to Use This Template

When you receive a project to build:

1. **Copy this template** to a new file named `[PROJECT_NAME]_ORCHESTRATION_BLUEPRINT.md`

2. **Fill in the placeholders:**
   - Replace `[PROJECT_NAME]` with actual project name
   - Replace `[ROOT_PATH]` with project root path
   - Replace `[DATE]` with current date
   - Define all `[CONFIG_KEY]` and `[CONFIG_VALUE]` pairs

3. **Define Configuration Questions (STEP_00):**
   - List all values needed before starting
   - Provide sensible defaults
   - Explain why each is needed

4. **Create Step Sequence:**
   - Break project into discrete, atomic steps
   - Each step should be completable in one conversation
   - Each step should have clear verification criteria

5. **For Each Step Include:**
   - **Task**: What it accomplishes (1-2 sentences)
   - **Execute**: Exact commands/code to run
   - **Done Looks Like**: Checkable verification criteria
   - **Output Artifact**: What files/data are created

6. **Define "Definition of Done":**
   - List all acceptance criteria from requirements
   - Make them boolean checkable items
   - Track in BUILD_STATE.json

7. **Create Conversation Starter:**
   - Customize with project-specific details
   - Include reference to this blueprint document

### Example Step Template

```markdown
## STEP_XX: [DESCRIPTIVE_NAME]

### Task
[One sentence: what this step does]

### Execute
```[language]
[Exact commands or code]
```

### Done Looks Like
- [ ] [Specific, checkable criterion 1]
- [ ] [Specific, checkable criterion 2]
- [ ] BUILD_STATE.json: artifacts.[key] = [value]
- [ ] BUILD_STATE.json: current_step = "STEP_[XX+1]"

### Output Artifact
```
[Path to file/folder created]
```
```

### Key Principles

1. **Atomic Steps**: Each step should do ONE thing
2. **Verifiable**: "Done Looks Like" must be checkable
3. **State-Driven**: BUILD_STATE.json is single source of truth
4. **No Memory**: Do not rely on conversation context
5. **Chained**: Each step outputs the next step's prompt
6. **Recoverable**: Can resume from any step

---

## SAMPLE PROJECT STRUCTURE

```
[PROJECT_ROOT]/
├── BUILD_STATE.json                    # State tracking
├── [PROJECT]_ORCHESTRATION_BLUEPRINT.md  # This document
├── [PROJECT]_BUILD_SEQUENCE.md         # Detailed step-by-step
├── [PROJECT]_HANDOVER.md              # Technical specifications
├── [component_1]/                      # Project components
├── [component_2]/
└── [output]/                          # Build outputs
```

---

## BUILD STATE SCHEMA

```json
{
  "project_name": "string",
  "current_step": "STEP_XX",
  "completed_steps": ["STEP_00", "STEP_01"],
  "config": {
    "root_path": "string",
    "[custom_config_1]": "value",
    "[custom_config_2]": "value"
  },
  "artifacts": {
    "[artifact_1_name]": "path or value",
    "[artifact_2_name]": "path or value"
  },
  "definition_of_done": {
    "[requirement_1]": false,
    "[requirement_2]": false
  },
  "errors": [
    {
      "step": "STEP_XX",
      "error": "description",
      "timestamp": "ISO8601"
    }
  ],
  "last_updated": "ISO8601",
  "next_step_prompt": "string"
}
```

---

## REPORTING FORMAT

After each step completion, output:

```
✅ STEP_XX COMPLETE: [Step Name]

What Was Done:
- [Achievement 1]
- [Achievement 2]

Artifacts Created:
- [Path 1]
- [Path 2]

Verification:
✅ [Criterion 1] - PASS
✅ [Criterion 2] - PASS

State Updated:
- current_step: STEP_[XX+1]
- artifacts.[key]: [value]

---

NEXT STEP PROMPT:

Execute STEP_[XX+1]: [Next Step Name]

Read state from: [PATH]\BUILD_STATE.json
Confirm current_step = "STEP_[XX+1]"

[Full prompt for next step]
```

---

## SUCCESS CRITERIA

Project is COMPLETE when:

- [ ] All steps in sequence executed
- [ ] All "Definition of Done" items are true
- [ ] BUILD_STATE.json shows current_step = "COMPLETE"
- [ ] All verification tests pass
- [ ] System operational end-to-end

---

**END OF TEMPLATE**

---

## CUSTOMIZATION CHECKLIST

When creating a blueprint from this template:

- [ ] Project name filled in
- [ ] Root path specified
- [ ] Configuration questions defined
- [ ] All steps listed and detailed
- [ ] Verification criteria for each step
- [ ] Definition of Done items listed
- [ ] Conversation starter customized
- [ ] BUILD_STATE.json schema updated
- [ ] Handover protocol configured
- [ ] Success criteria defined
