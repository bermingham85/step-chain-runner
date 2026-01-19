"""Requirements extraction module - converts user text to PROJECT_REQUEST."""

import yaml
from pathlib import Path
from typing import Dict, Any
from .schemas import ProjectRequest


def load_extractor_prompt() -> str:
    """Load the extractor system prompt from file."""
    prompt_path = Path(__file__).parent.parent / "prompts" / "extractor_system_prompt.txt"
    with open(prompt_path, 'r') as f:
        return f.read()


def extract_project_request(user_text: str, use_llm: bool = False) -> Dict[str, Any]:
    """
    Extract structured PROJECT_REQUEST from messy user input.
    
    Args:
        user_text: Raw user request text
        use_llm: If True, use LLM for extraction (requires API setup)
                 If False, use template-based extraction (for offline testing)
    
    Returns:
        Validated PROJECT_REQUEST dict
    """
    if use_llm:
        # In production, this would call Claude/GPT with the extractor prompt
        # For now, we provide a template-based fallback
        raise NotImplementedError("LLM extraction requires API setup")
    
    # Template-based extraction for demonstration
    return _template_extract(user_text)


def _template_extract(user_text: str) -> Dict[str, Any]:
    """
    Simple template-based extraction for offline testing.
    In production, replace with LLM call.
    """
    # Parse basic patterns from text
    lines = user_text.lower().split('\n')
    
    project_data = {
        "name": "extracted-project",
        "goal": "Extracted from user request",
        "inputs": [],
        "outputs": [],
        "integrations": [],
        "deterministic_rules": [],
        "llm_tasks": [],
        "storage_requirements": [],
        "error_handling_requirements": ["Never drop data", "Store raw payload always"],
        "deliverables": ["Runnable FastAPI app", "Tests", "README"]
    }
    
    # Extract common patterns
    for line in lines:
        if 'webhook' in line:
            project_data['inputs'].append('Webhook endpoint')
        if 'google sheet' in line or 'sheets' in line:
            project_data['outputs'].append('Google Sheets')
            project_data['integrations'].append('Google Drive/Sheets')
        if 'compare' in line or 'validation' in line:
            project_data['deterministic_rules'].append('Field comparison with tolerance')
    
    # Validate using Pydantic
    request = ProjectRequest(**project_data)
    return request.model_dump()


def validate_yaml(yaml_text: str) -> Dict[str, Any]:
    """Validate that YAML matches PROJECT_REQUEST schema."""
    data = yaml.safe_load(yaml_text)
    request = ProjectRequest(**data)
    return request.model_dump()
