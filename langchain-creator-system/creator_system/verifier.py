"""Verifier - validates generated blueprints for completeness and safety."""

import json
from pathlib import Path
from typing import Dict, Any, List, Tuple
from .schemas import GeneratedBlueprint


def load_verifier_prompt() -> str:
    """Load the verifier system prompt from file."""
    prompt_path = Path(__file__).parent.parent / "prompts" / "verifier_system_prompt.txt"
    with open(prompt_path, 'r') as f:
        return f.read()


def verify_blueprint(blueprint: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Verify blueprint completeness and safety.
    
    Returns:
        (is_valid, issues_list)
    """
    issues = []
    
    try:
        bp = GeneratedBlueprint(**blueprint)
    except Exception as e:
        return False, [f"Schema validation failed: {str(e)}"]
    
    # Check required keys
    required_keys = ['project_name', 'workflow_graph', 'state_schema', 'file_tree', 'files']
    for key in required_keys:
        if key not in blueprint or not blueprint[key]:
            issues.append(f"Missing or empty required key: {key}")
    
    # Check file paths are safe
    for path in bp.file_tree:
        if path.startswith('/'):
            issues.append(f"Unsafe absolute path: {path}")
        if '..' in path:
            issues.append(f"Unsafe relative path with '..': {path}")
    
    # Check env vars are documented
    for env_var in bp.env_vars:
        if '.env.example' not in bp.files:
            issues.append("Missing .env.example file")
            break
    
    # Check state schema is valid Python
    if 'class' not in bp.state_schema and 'TypedDict' not in bp.state_schema:
        issues.append("State schema must be valid Pydantic or TypedDict code")
    
    # Check for secrets in files
    secret_patterns = ['api_key=', 'password=', 'secret=', 'token=']
    for filepath, content in bp.files.items():
        content_lower = content.lower()
        for pattern in secret_patterns:
            if pattern in content_lower and 'example' not in filepath:
                issues.append(f"Potential secret in {filepath}: found '{pattern}'")
    
    # Token rules check
    total_lines = sum(len(content.split('\n')) for content in bp.files.values())
    if total_lines > 2000:
        issues.append(f"Total file content exceeds recommended limit: {total_lines} lines > 2000")
    
    is_valid = len(issues) == 0
    return is_valid, issues


def check_no_reprint_rule(blueprint: Dict[str, Any]) -> bool:
    """
    Check if blueprint follows NO_REPRINT rule.
    Files should be manifests or summaries, not full implementations.
    """
    bp = GeneratedBlueprint(**blueprint)
    
    for filepath, content in bp.files.items():
        lines = len(content.split('\n'))
        # Implementation files should be manifests (<50 lines)
        if filepath.endswith('.py') and 'test' not in filepath:
            if lines > 100:
                return False
    
    return True
