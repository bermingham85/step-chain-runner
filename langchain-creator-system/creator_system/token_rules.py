"""Token control rules and output budgeting."""

from typing import Dict, List


OUTPUT_BUDGET_RULES = {
    "max_lines_per_file": 250,
    "max_lines_per_response": 120,
    "max_total_blueprint_lines": 2000,
    "manifest_mode_threshold": 100  # If file >100 lines, show manifest instead
}


class StepSummaryContract:
    """Format for step summary after each execution."""
    
    def __init__(self):
        self.files_changed: List[str] = []
        self.public_interfaces: List[str] = []
        self.env_vars: List[str] = []
        self.next_todo: List[str] = []
        self.known_limitations: List[str] = []
    
    def to_dict(self) -> Dict:
        return {
            "FILES_CHANGED": self.files_changed,
            "PUBLIC_INTERFACES": self.public_interfaces,
            "ENV_VARS": self.env_vars,
            "NEXT_TODO": self.next_todo,
            "KNOWN_LIMITATIONS": self.known_limitations
        }
    
    def to_text(self) -> str:
        """Format as compact text summary."""
        lines = []
        lines.append("STEP_SUMMARY_CONTRACT:")
        lines.append(f"  FILES_CHANGED: {', '.join(self.files_changed)}")
        lines.append(f"  PUBLIC_INTERFACES: {', '.join(self.public_interfaces)}")
        lines.append(f"  ENV_VARS: {', '.join(self.env_vars)}")
        lines.append("  NEXT_TODO:")
        for todo in self.next_todo:
            lines.append(f"    - {todo}")
        lines.append("  KNOWN_LIMITATIONS:")
        for limit in self.known_limitations:
            lines.append(f"    - {limit}")
        return "\n".join(lines)


def enforce_compact_mode(file_content: str, max_lines: int = 100) -> str:
    """
    Convert full file content to compact manifest if too large.
    
    Args:
        file_content: Full file content
        max_lines: Threshold for triggering manifest mode
    
    Returns:
        Compact manifest or original content
    """
    lines = file_content.split('\n')
    
    if len(lines) <= max_lines:
        return file_content
    
    # Extract key information
    manifest_lines = []
    manifest_lines.append(f"# File Manifest ({len(lines)} lines total)")
    manifest_lines.append("# Key components:")
    
    # Extract class and function definitions
    for line in lines[:50]:  # Sample first 50 lines
        stripped = line.strip()
        if stripped.startswith('class ') or stripped.startswith('def '):
            manifest_lines.append(f"#   {stripped}")
    
    manifest_lines.append("#")
    manifest_lines.append("# [Full implementation omitted for token efficiency]")
    manifest_lines.append("# NO_REPRINT: This file was already generated in a previous step.")
    
    return "\n".join(manifest_lines)


def get_token_control_guidelines() -> Dict[str, str]:
    """Return guidelines for token-efficient output."""
    return {
        "rule_1": "Never print full files if >150 lines",
        "rule_2": "Use file manifests: 'adapter.py - Google Sheets integration (180 lines)'",
        "rule_3": "Show only interfaces, key functions, TODO markers",
        "rule_4": "Never reprint code from earlier steps",
        "rule_5": "Use Step Summary Contract after each step",
        "rule_6": "Emit diffs, not full files, when updating",
        "rule_7": "Store templates/prompts in files, show only first 30 lines in chat",
        "rule_8": "Total per-step output: max 120 lines of code"
    }
