"""
safety_checker.py — Risk-level and blocked-action safety gate for AgentOS tasks.

Risk rules:
  low      → safe to queue automatically
  medium   → safe, but a warning is added
  high     → NOT safe, requires manual approval
  critical → NEVER safe, always blocked
"""

from __future__ import annotations

from typing import Any

# ---------------------------------------------------------------------------
# Protected path/pattern list
# ---------------------------------------------------------------------------

PROTECTED_FILES: list[str] = [
    ".env",
    ".env.local",
    "secrets/",
    "billing/",
    "production-config/",
    "auth/",
]

# ---------------------------------------------------------------------------
# Risk rule constants
# ---------------------------------------------------------------------------

RISK_RULES: dict[str, str] = {
    "low": "safe",
    "medium": "warning",
    "high": "requires_approval",
    "critical": "never_safe",
}


def _action_touches_protected(action: str) -> bool:
    """Return True if an action string references a protected file or path."""
    action_lower = action.lower()
    for protected in PROTECTED_FILES:
        if protected.lower() in action_lower:
            return True
    return False


def check_safety(task: dict[str, Any]) -> tuple[bool, list[str]]:
    """
    Evaluate whether a task is safe to auto-execute.

    Args:
        task: Task dict with 'meta' key containing task frontmatter.

    Returns:
        (is_safe, violations)
        - is_safe: True only when risk_level is 'low' or 'medium' AND no
          blocked_actions touch protected files AND no abort_if conditions
          reference protected patterns.
        - violations: Human-readable list of reasons why the task is unsafe.
    """
    meta = task.get("meta", {})
    violations: list[str] = []

    risk_level: str = meta.get("risk_level", "low")
    blocked_actions: list[str] = meta.get("blocked_actions", []) or []
    abort_if: list[str] = meta.get("abort_if", []) or []
    allowed_actions: list[str] = meta.get("allowed_actions", []) or []

    # -----------------------------------------------------------------------
    # 1. Risk level gate
    # -----------------------------------------------------------------------
    if risk_level not in RISK_RULES:
        violations.append(
            f"Invalid risk_level '{risk_level}'. Must be one of: {list(RISK_RULES)}"
        )

    if risk_level == "critical":
        violations.append(
            "risk_level=critical: this task may never be auto-executed"
        )

    elif risk_level == "high":
        violations.append(
            "risk_level=high: requires_approval before execution"
        )

    elif risk_level == "medium":
        # Medium is allowed but we note the warning (not a blocking violation)
        pass  # Warning is surfaced by callers, not as a hard violation here

    # -----------------------------------------------------------------------
    # 2. Blocked actions touching protected files
    # -----------------------------------------------------------------------
    for action in blocked_actions:
        if _action_touches_protected(action):
            violations.append(
                f"blocked_action '{action}' references a protected file/path"
            )

    # -----------------------------------------------------------------------
    # 3. Allowed actions touching protected files
    # -----------------------------------------------------------------------
    for action in allowed_actions:
        if _action_touches_protected(action):
            violations.append(
                f"allowed_action '{action}' references a protected file/path "
                "(protected paths cannot be granted via allowed_actions)"
            )

    # -----------------------------------------------------------------------
    # 4. abort_if conditions referencing protected patterns
    # -----------------------------------------------------------------------
    for condition in abort_if:
        if _action_touches_protected(condition):
            violations.append(
                f"abort_if condition '{condition}' references a protected file/path"
            )

    is_safe = len(violations) == 0
    return is_safe, violations


def get_risk_warning(task: dict[str, Any]) -> str | None:
    """
    Return a warning string for medium-risk tasks, or None.

    This is a non-blocking advisory; medium-risk tasks still pass check_safety.
    """
    meta = task.get("meta", {})
    risk_level = meta.get("risk_level", "low")
    if risk_level == "medium":
        task_id = meta.get("id", "UNKNOWN")
        return (
            f"[WARNING] Task {task_id} has risk_level=medium. "
            "Proceed with extra review."
        )
    return None


if __name__ == "__main__":
    import sys
    import json
    from pathlib import Path

    sys.path.insert(0, str(Path(__file__).parent))
    from parse_tasks import parse_all_tasks

    tasks_dir = sys.argv[1] if len(sys.argv) > 1 else "tasks"
    tasks = parse_all_tasks(tasks_dir)

    for task in tasks:
        meta = task.get("meta", {})
        task_id = meta.get("id", "?")
        is_safe, violations = check_safety(task)
        warning = get_risk_warning(task)
        status_label = "SAFE" if is_safe else "BLOCKED"
        print(f"[{status_label}] {task_id}")
        if warning:
            print(f"  {warning}")
        for v in violations:
            print(f"  VIOLATION: {v}")
