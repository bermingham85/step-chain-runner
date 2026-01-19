"""Standard LangGraph workflow template for generated projects."""

from typing import Dict, List, Any


STANDARD_NODES = [
    {
        "id": "ingest_input",
        "type": "start",
        "description": "Receive and validate input (webhook, file, etc)"
    },
    {
        "id": "normalize_payload",
        "type": "process",
        "description": "Parse, flatten, and normalize input data"
    },
    {
        "id": "enrich_metadata",
        "type": "process",
        "description": "Add timestamps, hashes, IDs, and source tracking"
    },
    {
        "id": "run_external_integrations",
        "type": "integration",
        "description": "Call external APIs (Sheets, DB, etc)"
    },
    {
        "id": "compare_or_validate",
        "type": "decision",
        "description": "Apply deterministic rules or LLM validation"
    },
    {
        "id": "route_status",
        "type": "decision",
        "description": "Route based on validation result (PASS/HOLD/FAIL)"
    },
    {
        "id": "write_outputs",
        "type": "integration",
        "description": "Write results to final destination"
    },
    {
        "id": "finalize",
        "type": "end",
        "description": "Return final state and cleanup"
    }
]

STANDARD_EDGES = [
    {"from_node": "ingest_input", "to_node": "normalize_payload"},
    {"from_node": "normalize_payload", "to_node": "enrich_metadata"},
    {"from_node": "enrich_metadata", "to_node": "run_external_integrations"},
    {"from_node": "run_external_integrations", "to_node": "compare_or_validate"},
    {"from_node": "compare_or_validate", "to_node": "route_status"},
    {"from_node": "route_status", "to_node": "write_outputs", "condition": "PASS or HOLD"},
    {"from_node": "write_outputs", "to_node": "finalize"}
]


STATE_TEMPLATE = """from typing import TypedDict, List, Dict, Any, Optional

class WorkflowState(TypedDict):
    \"\"\"Standard state schema for generated workflows.\"\"\"
    
    # Input
    raw_input: str
    
    # Processing
    items: List[Dict[str, Any]]  # Normalized batch items
    canonical_record: Optional[Dict[str, Any]]  # Canonical schema mapping
    
    # Validation
    diff: Optional[Dict[str, Any]]  # Comparison results
    status: str  # PASS, HOLD, FAIL
    
    # Error tracking
    errors: List[str]
    
    # Output
    outputs: Dict[str, Any]
"""


def get_graph_template() -> Dict[str, Any]:
    """Return standard graph structure."""
    return {
        "nodes": STANDARD_NODES,
        "edges": STANDARD_EDGES,
        "state_template": STATE_TEMPLATE
    }
