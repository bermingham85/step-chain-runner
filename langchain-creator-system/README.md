# LangChain Creator System

A meta-system that generates complete LangGraph project repositories from user requirements.

## What This Does

The LangChain Creator System takes a messy user request (like "build a webhook that writes to Google Sheets") and generates a **complete project blueprint** including:

- Workflow graph (LangGraph nodes and edges)
- State schema (Pydantic models)
- File tree structure
- Implementation file manifests
- Environment variables
- Setup and run commands
- Test examples

## Quick Start

### Installation

```bash
pip install -r requirements.txt
```

### Usage

```python
from creator_system.requirements_extractor import extract_project_request
from creator_system.creator_agent import build_blueprint
from creator_system.verifier import verify_blueprint

# Step 1: Extract structured request from user text
user_text = open('examples/example_request_wellybox.txt').read()
project_request = extract_project_request(user_text)

# Step 2: Generate blueprint
blueprint = build_blueprint(project_request)

# Step 3: Verify
is_valid, issues = verify_blueprint(blueprint)
if is_valid:
    print("Blueprint ready!")
    print(f"Project: {blueprint['project_name']}")
    print(f"Files: {len(blueprint['file_tree'])}")
else:
    print(f"Issues found: {issues}")
```

### Example Flow

```bash
# View example user request
cat examples/example_request_wellybox.txt

# See extracted PROJECT_REQUEST
cat examples/example_project_request.yaml

# See generated blueprint
cat examples/example_generated_blueprint.json
```

## Architecture

### Layer 1: Requirements Extractor
- **Input**: Messy user text
- **Output**: Structured PROJECT_REQUEST (YAML)
- **Prompt**: `/prompts/extractor_system_prompt.txt`
- **Schema**: `ProjectRequest` in `schemas.py`

### Layer 2: Creator Agent
- **Input**: PROJECT_REQUEST
- **Output**: GENERATED_BLUEPRINT (JSON)
- **Prompt**: `/prompts/creator_system_prompt.txt`
- **Template**: Standard 8-node LangGraph workflow

### Layer 3: Verifier
- **Input**: GENERATED_BLUEPRINT
- **Output**: Validation result + issues list
- **Prompt**: `/prompts/verifier_system_prompt.txt`
- **Checks**: Safety, completeness, token control

## Project Structure

```
langchain-creator-system/
├── README.md
├── requirements.txt
├── .env.example
├── creator_system/
│   ├── __init__.py
│   ├── schemas.py                  # Pydantic schemas
│   ├── requirements_extractor.py   # Step 1: Extract
│   ├── creator_agent.py            # Step 2: Generate
│   ├── graph_template.py           # Standard workflow
│   ├── verifier.py                 # Step 3: Validate
│   ├── token_rules.py              # Output budgeting
│   └── repo_templates/             # File templates
│       └── base_fastapi_langgraph/
├── prompts/
│   ├── extractor_system_prompt.txt
│   ├── creator_system_prompt.txt
│   └── verifier_system_prompt.txt
└── examples/
    ├── example_request_wellybox.txt      # User input
    ├── example_project_request.yaml      # Extracted
    └── example_generated_blueprint.json  # Generated
```

## Standard Workflow Template

All generated projects follow this LangGraph pattern:

**Nodes:**
1. `ingest_input` - Receive and validate
2. `normalize_payload` - Parse and flatten
3. `enrich_metadata` - Add timestamps, hashes, IDs
4. `run_external_integrations` - Call APIs
5. `compare_or_validate` - Apply rules
6. `route_status` - PASS/HOLD/FAIL routing
7. `write_outputs` - Persist results
8. `finalize` - Cleanup and return

**State:**
- `raw_input` (str)
- `items` (List[Dict]) - Batch items
- `canonical_record` (Dict) - Normalized
- `diff` (Dict) - Comparison
- `status` (str) - PASS/HOLD/FAIL
- `errors` (List[str])
- `outputs` (Dict)

## Token Control

The system enforces strict output limits:

- **Max 120 lines per response** (code snippets)
- **Max 250 lines per file** (in blueprints)
- **Max 2000 lines total** (all blueprint files)
- **Manifest mode**: Files >100 lines shown as manifests
- **NO_REPRINT rule**: Never repeat code from earlier steps

## Design Principles

1. **Deterministic First**: Use code for exact logic, LLM only for fuzzy tasks
2. **Modular Structure**: /nodes/, /adapters/, /tests/
3. **Integration Isolation**: External APIs in adapters
4. **Fallback Always**: Store raw input even on parsing failure
5. **Token Efficient**: Emit structure, not implementation

## Configuration

No environment variables needed for basic operation. The system generates blueprints offline using templates.

For LLM-enhanced extraction/generation:
- Set `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`
- Call with `use_llm=True`

## Limitations

- Template-based generation without LLM (offline mode)
- Blueprints require manual review and customization
- Generated code is structural guidance, not production-ready
- Integration adapters need actual API implementation

## Extensions

**Future enhancements:**
- LLM-powered extraction and generation
- Multiple workflow templates (streaming, batch, async)
- Code generation (not just manifests)
- Automatic testing and validation
- n8n integration templates

## License

MIT

## Contributing

This is a meta-system template. Customize the templates in `/creator_system/repo_templates/` for your specific needs.
