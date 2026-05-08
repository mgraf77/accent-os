"""
validate_task.py — Pydantic v2 schema validation for AgentOS task frontmatter.
"""

from __future__ import annotations

import re
from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator, ValidationError


# ---------------------------------------------------------------------------
# Pydantic model
# ---------------------------------------------------------------------------

TASK_ID_PATTERN = re.compile(r"^TASK-\d{6}$")

StatusEnum = Literal["pending", "queued", "running", "blocked", "failed", "complete", "cancelled"]
PriorityEnum = Literal["low", "medium", "high", "critical"]
RiskLevelEnum = Literal["low", "medium", "high", "critical"]


class TaskSchema(BaseModel):
    """Pydantic v2 model matching schemas/task.schema.json."""

    id: str = Field(..., description="Unique task identifier, format TASK-XXXXXX")
    title: str = Field(..., min_length=1, description="Human-readable task title")
    status: StatusEnum
    priority: PriorityEnum
    created_at: datetime
    trigger_at: Optional[datetime] = None
    assigned_to: str = Field(..., min_length=1)
    depends_on: list[str] = Field(default_factory=list)
    retry_limit: int = Field(..., ge=0, le=10)
    execution_budget_minutes: int = Field(..., gt=0)
    risk_level: RiskLevelEnum
    allowed_actions: list[str] = Field(default_factory=list)
    blocked_actions: list[str] = Field(default_factory=list)
    success_criteria: list[str] = Field(default_factory=list)
    abort_if: list[str] = Field(default_factory=list)

    model_config = {"extra": "allow", "populate_by_name": True}

    @field_validator("id")
    @classmethod
    def validate_task_id(cls, v: str) -> str:
        if not TASK_ID_PATTERN.match(v):
            raise ValueError(
                f"Task id '{v}' does not match required pattern TASK-XXXXXX (6 digits)"
            )
        return v

    @field_validator("depends_on")
    @classmethod
    def validate_dependency_ids(cls, v: list[str]) -> list[str]:
        for dep_id in v:
            if not TASK_ID_PATTERN.match(dep_id):
                raise ValueError(
                    f"Dependency id '{dep_id}' does not match required pattern TASK-XXXXXX"
                )
        return v

    @field_validator("created_at", "trigger_at", mode="before")
    @classmethod
    def coerce_datetime_strings(cls, v: Any) -> Any:
        """Accept string datetimes from YAML parsing."""
        if isinstance(v, str):
            # Normalise: add UTC offset if missing
            if v.endswith("Z"):
                v = v[:-1] + "+00:00"
            return v
        return v


# ---------------------------------------------------------------------------
# Public functions
# ---------------------------------------------------------------------------

def validate_task(task_meta: dict[str, Any]) -> tuple[bool, list[str]]:
    """
    Validate a task's frontmatter dict against TaskSchema.

    Args:
        task_meta: Dict of frontmatter fields.

    Returns:
        (is_valid, errors) where errors is a list of human-readable strings.
    """
    try:
        TaskSchema.model_validate(task_meta)
        return True, []
    except ValidationError as exc:
        errors: list[str] = []
        for error in exc.errors():
            loc = " -> ".join(str(l) for l in error["loc"]) if error["loc"] else "root"
            msg = error["msg"]
            errors.append(f"{loc}: {msg}")
        return False, errors


def validate_all_tasks(tasks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Validate a list of parsed task dicts (as returned by parse_tasks).

    Adds '_valid' (bool) and '_errors' (list[str]) keys to each task dict.

    Args:
        tasks: List of task dicts with at least a 'meta' key.

    Returns:
        Same list with '_valid' and '_errors' added in-place (copies returned).
    """
    result = []
    for task in tasks:
        task = dict(task)  # shallow copy to avoid mutating caller's data

        if task.get("_parse_error"):
            task["_valid"] = False
            task["_errors"] = [f"Parse error: {task['_parse_error']}"]
        else:
            is_valid, errors = validate_task(task.get("meta", {}))
            task["_valid"] = is_valid
            task["_errors"] = errors

        result.append(task)
    return result


if __name__ == "__main__":
    import json
    import sys
    from parse_tasks import parse_all_tasks

    tasks_dir = sys.argv[1] if len(sys.argv) > 1 else "tasks"
    tasks = parse_all_tasks(tasks_dir)
    validated = validate_all_tasks(tasks)

    ok = sum(1 for t in validated if t["_valid"])
    fail = len(validated) - ok
    print(f"Validated {len(validated)} tasks: {ok} OK, {fail} failed")

    for t in validated:
        if not t["_valid"]:
            print(f"\n[INVALID] {t.get('filepath', '?')}")
            for err in t["_errors"]:
                print(f"  - {err}")
