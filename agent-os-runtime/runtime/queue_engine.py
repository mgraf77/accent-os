"""
queue_engine.py — Queue state management for AgentOS Runtime.

Maintains a persistent queue state in state/queue.json and evaluates which
tasks are ready to run on each tick.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

_DEFAULT_STATE_DIR = Path(__file__).resolve().parent.parent / "state"
_QUEUE_FILE = _DEFAULT_STATE_DIR / "queue.json"

QUEUE_KEYS = ["queued", "blocked", "pending", "failed", "complete", "running", "cancelled"]


def _queue_path() -> Path:
    """Return the path to queue.json, creating parent dir if needed."""
    _DEFAULT_STATE_DIR.mkdir(parents=True, exist_ok=True)
    return _QUEUE_FILE


# ---------------------------------------------------------------------------
# Persistence
# ---------------------------------------------------------------------------

def load_queue() -> dict[str, list[str]]:
    """
    Load queue state from state/queue.json.

    Returns a dict with keys for each lifecycle bucket (queued, blocked, etc.).
    Returns empty buckets if the file does not exist.
    """
    path = _queue_path()
    if not path.exists():
        return {key: [] for key in QUEUE_KEYS}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {key: [] for key in QUEUE_KEYS}

    # Ensure all expected keys are present
    for key in QUEUE_KEYS:
        if key not in data:
            data[key] = []
    return data


def save_queue(queue: dict[str, list[str]]) -> None:
    """
    Persist queue state to state/queue.json.

    Args:
        queue: Dict mapping status bucket -> list of task IDs.
    """
    path = _queue_path()
    path.write_text(json.dumps(queue, indent=2), encoding="utf-8")


# ---------------------------------------------------------------------------
# Evaluation
# ---------------------------------------------------------------------------

def evaluate_queue(
    tasks: list[dict[str, Any]],
    events_log: list[dict[str, Any]],
) -> dict[str, list[str]]:
    """
    Build a snapshot of the current queue state from task metadata.

    Each task is placed into the bucket matching its current status field.

    Args:
        tasks:      List of parsed + validated task dicts.
        events_log: List of event dicts (used for future enrichment; currently
                    the task's own status field is authoritative).

    Returns:
        Dict with keys: queued, blocked, pending, failed, complete, running, cancelled.
        Each key maps to a sorted list of task IDs.
    """
    buckets: dict[str, list[str]] = {key: [] for key in QUEUE_KEYS}

    for task in tasks:
        meta = task.get("meta", {})
        task_id = meta.get("id")
        status = meta.get("status", "pending")
        if not task_id:
            continue
        if status in buckets:
            buckets[status].append(task_id)
        else:
            # Treat unknown status as pending
            buckets["pending"].append(task_id)

    # Sort each bucket for deterministic output
    for key in buckets:
        buckets[key].sort()

    return buckets


def get_ready_tasks(tasks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Return tasks that are ready to be queued for execution.

    A task is ready when ALL of the following are true:
        1. status == 'pending'
        2. trigger_at is not set OR trigger_at <= now (UTC)
        3. All dependencies have status == 'complete'
        4. Safety check passes (risk_level not 'high' or 'critical')

    Imports dependency_engine, safety_checker, and timestamp_engine inline
    to avoid circular imports.

    Args:
        tasks: Full list of parsed task dicts.

    Returns:
        List of task dicts that are ready to queue, in task-id order.
    """
    # Inline imports to keep modules self-contained
    from dependency_engine import check_dependencies
    from safety_checker import check_safety
    from timestamp_engine import is_trigger_ready

    now = datetime.now(timezone.utc)
    ready: list[dict[str, Any]] = []

    for task in tasks:
        meta = task.get("meta", {})
        status = meta.get("status", "")

        # Must be pending
        if status != "pending":
            continue

        # Must have a valid task ID
        if not meta.get("id"):
            continue

        # Trigger time must have fired
        if not is_trigger_ready(task, now):
            continue

        # All dependencies must be satisfied
        deps_ok, _blocking = check_dependencies(task, tasks)
        if not deps_ok:
            continue

        # Safety check must pass
        is_safe, _violations = check_safety(task)
        if not is_safe:
            continue

        ready.append(task)

    # Sort by task id for deterministic ordering
    ready.sort(key=lambda t: t.get("meta", {}).get("id", ""))
    return ready


if __name__ == "__main__":
    import sys
    from pathlib import Path

    sys.path.insert(0, str(Path(__file__).parent))
    from parse_tasks import parse_all_tasks
    from validate_task import validate_all_tasks
    from event_log import read_all_events

    tasks_dir = str(Path(__file__).resolve().parent.parent / "tasks")
    tasks = validate_all_tasks(parse_all_tasks(tasks_dir))
    events = read_all_events()
    queue = evaluate_queue(tasks, events)

    print("Queue state:")
    for bucket, ids in queue.items():
        if ids:
            print(f"  {bucket}: {ids}")

    ready = get_ready_tasks(tasks)
    print(f"\nReady to queue ({len(ready)}):")
    for t in ready:
        print(f"  {t['meta']['id']} — {t['meta'].get('title', '?')}")
