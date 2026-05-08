"""
timestamp_engine.py — Trigger-time evaluation for AgentOS tasks.

All datetimes must be UTC-aware.  If a task has no trigger_at, it is always ready.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Optional


def get_now_utc() -> datetime:
    """Return the current UTC datetime with timezone info."""
    return datetime.now(timezone.utc)


def _parse_trigger_at(task: dict[str, Any]) -> Optional[datetime]:
    """
    Extract trigger_at from task meta, normalising to UTC-aware datetime.

    Returns None if trigger_at is not set or is falsy.
    """
    meta = task.get("meta", {})
    trigger_at = meta.get("trigger_at")

    if trigger_at is None:
        return None

    if isinstance(trigger_at, datetime):
        # Already a datetime — ensure it is timezone-aware
        if trigger_at.tzinfo is None:
            return trigger_at.replace(tzinfo=timezone.utc)
        return trigger_at

    if isinstance(trigger_at, str):
        trigger_at = trigger_at.strip()
        if not trigger_at:
            return None
        # Normalise trailing 'Z' to +00:00
        if trigger_at.endswith("Z"):
            trigger_at = trigger_at[:-1] + "+00:00"
        dt = datetime.fromisoformat(trigger_at)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt

    return None


def is_trigger_ready(task: dict[str, Any], now: Optional[datetime] = None) -> bool:
    """
    Determine whether a task's time trigger has fired.

    Args:
        task: Task dict with 'meta' key.
        now:  Optional datetime to use as "current time" (UTC-aware).
              Defaults to get_now_utc().

    Returns:
        True if trigger_at is not set, OR if trigger_at <= now.
    """
    if now is None:
        now = get_now_utc()
    elif now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)

    trigger_at = _parse_trigger_at(task)

    if trigger_at is None:
        return True  # No trigger constraint — always ready

    return trigger_at <= now


def get_trigger_delta(
    task: dict[str, Any],
    now: Optional[datetime] = None,
) -> Optional[timedelta]:
    """
    Return the timedelta from now until trigger_at fires.

    Args:
        task: Task dict with 'meta' key.
        now:  Optional datetime to use as "current time" (UTC-aware).

    Returns:
        - None if trigger_at is not set.
        - timedelta (can be negative, meaning already past) if trigger_at is set.
          A negative value means the trigger has already fired.
    """
    if now is None:
        now = get_now_utc()
    elif now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)

    trigger_at = _parse_trigger_at(task)

    if trigger_at is None:
        return None

    return trigger_at - now


if __name__ == "__main__":
    import sys
    import json
    from pathlib import Path

    sys.path.insert(0, str(Path(__file__).parent))
    from parse_tasks import parse_all_tasks

    tasks_dir = sys.argv[1] if len(sys.argv) > 1 else "tasks"
    tasks = parse_all_tasks(tasks_dir)
    now = get_now_utc()
    print(f"Current UTC time: {now.isoformat()}\n")

    for task in tasks:
        meta = task.get("meta", {})
        task_id = meta.get("id", "?")
        ready = is_trigger_ready(task, now)
        delta = get_trigger_delta(task, now)
        trigger_at = meta.get("trigger_at", "none")
        status = "READY" if ready else "WAITING"
        delta_str = f" (delta={delta})" if delta is not None else ""
        print(f"[{status}] {task_id} trigger_at={trigger_at}{delta_str}")
