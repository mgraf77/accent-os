"""
replay_engine.py — Event timeline replay for AgentOS tasks.

Reconstructs the full state transition history for a task from its event log.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any

# Event types that indicate a state transition
_STATE_TRANSITION_TYPES = {
    "task_created",
    "task_queued",
    "task_started",
    "task_blocked",
    "task_failed",
    "task_completed",
    "task_cancelled",
    "task_updated",
}

# Event types that indicate dependency changes
_DEPENDENCY_TYPES = {
    "dependency_satisfied",
    "dependency_blocked",
}

# Event types that indicate file changes
_FILE_CHANGE_TYPES = {
    "file_changed",
    "commit_created",
}

# Event types that indicate failures / retries
_FAILURE_TYPES = {
    "task_failed",
    "execution_retried",
    "safety_blocked",
}


def replay_task(task_id: str, events: list[dict[str, Any]]) -> dict[str, Any]:
    """
    Reconstruct a full timeline dict for a single task from its events.

    Args:
        task_id: The task ID to replay (e.g. 'TASK-000001').
        events:  Full list of event dicts (from event_log.read_all_events).

    Returns:
        A timeline dict with:
            - task_id: str
            - events: list of events for this task (chronological)
            - state_transitions: list of {event_id, timestamp, from_status, to_status}
            - actor_history: list of {timestamp, actor, event_type}
            - dependency_history: list of {timestamp, type, metadata}
            - file_changes: list of {timestamp, event_type, metadata}
            - failures: list of {timestamp, event_type, metadata}
            - retries: int count of execution_retried events
    """
    # Filter to events for this task
    task_events = [e for e in events if e.get("task_id") == task_id]
    task_events.sort(key=lambda e: e.get("timestamp", ""))

    state_transitions: list[dict[str, Any]] = []
    actor_history: list[dict[str, Any]] = []
    dependency_history: list[dict[str, Any]] = []
    file_changes: list[dict[str, Any]] = []
    failures: list[dict[str, Any]] = []
    retries = 0

    # Map event types to implied status values for transition tracking
    _type_to_status: dict[str, str] = {
        "task_created": "created",
        "task_queued": "queued",
        "task_started": "running",
        "task_blocked": "blocked",
        "task_failed": "failed",
        "task_completed": "complete",
        "task_cancelled": "cancelled",
    }

    prev_status: str | None = None

    for event in task_events:
        event_type = event.get("type", "")
        timestamp = event.get("timestamp", "")
        actor = event.get("actor", "unknown")
        metadata = event.get("metadata", {})
        event_id = event.get("event_id", "")

        # Actor history for every event
        actor_history.append({
            "timestamp": timestamp,
            "actor": actor,
            "event_type": event_type,
        })

        # State transitions
        if event_type in _STATE_TRANSITION_TYPES:
            new_status = _type_to_status.get(event_type)
            if new_status:
                state_transitions.append({
                    "event_id": event_id,
                    "timestamp": timestamp,
                    "from_status": prev_status,
                    "to_status": new_status,
                })
                prev_status = new_status
            elif event_type == "task_updated":
                # Extract status from metadata if available
                new_st = metadata.get("new_status") if metadata else None
                state_transitions.append({
                    "event_id": event_id,
                    "timestamp": timestamp,
                    "from_status": prev_status,
                    "to_status": new_st or "updated",
                })
                if new_st:
                    prev_status = new_st

        # Dependency history
        if event_type in _DEPENDENCY_TYPES:
            dependency_history.append({
                "timestamp": timestamp,
                "type": event_type,
                "metadata": metadata,
            })

        # File changes
        if event_type in _FILE_CHANGE_TYPES:
            file_changes.append({
                "timestamp": timestamp,
                "event_type": event_type,
                "metadata": metadata,
            })

        # Failures
        if event_type in _FAILURE_TYPES:
            failures.append({
                "timestamp": timestamp,
                "event_type": event_type,
                "metadata": metadata,
            })

        # Retry counter
        if event_type == "execution_retried":
            retries += 1

    return {
        "task_id": task_id,
        "events": task_events,
        "state_transitions": state_transitions,
        "actor_history": actor_history,
        "dependency_history": dependency_history,
        "file_changes": file_changes,
        "failures": failures,
        "retries": retries,
    }


def print_replay(task_id: str, events: list[dict[str, Any]]) -> None:
    """
    Print a formatted timeline for a task to stdout.

    Args:
        task_id: The task ID to replay.
        events:  Full list of event dicts.
    """
    timeline = replay_task(task_id, events)

    print(f"\n{'=' * 60}")
    print(f"  REPLAY — {task_id}")
    print(f"{'=' * 60}")

    if not timeline["events"]:
        print("  No events found for this task.")
        return

    print(f"\n  Total events : {len(timeline['events'])}")
    print(f"  Retries      : {timeline['retries']}")
    print(f"  Failures     : {len(timeline['failures'])}")
    print(f"  File changes : {len(timeline['file_changes'])}")

    if timeline["state_transitions"]:
        print("\n  State Transitions:")
        for t in timeline["state_transitions"]:
            frm = t["from_status"] or "—"
            to = t["to_status"]
            ts = t["timestamp"][:19]
            print(f"    [{ts}]  {frm}  →  {to}  ({t['event_id']})")

    if timeline["dependency_history"]:
        print("\n  Dependency Events:")
        for d in timeline["dependency_history"]:
            ts = d["timestamp"][:19]
            print(f"    [{ts}]  {d['type']}  {d['metadata']}")

    if timeline["failures"]:
        print("\n  Failures / Safety Blocks:")
        for f in timeline["failures"]:
            ts = f["timestamp"][:19]
            print(f"    [{ts}]  {f['event_type']}  {f['metadata']}")

    print("\n  Full Event Log:")
    for event in timeline["events"]:
        ts = event.get("timestamp", "")[:19]
        etype = event.get("type", "?")
        actor = event.get("actor", "?")
        eid = event.get("event_id", "?")
        print(f"    [{ts}]  {eid}  {etype}  (actor={actor})")

    print(f"\n{'=' * 60}\n")


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).parent))
    from event_log import read_all_events

    parser = argparse.ArgumentParser(
        description="Replay the event timeline for a specific task."
    )
    parser.add_argument(
        "--task",
        required=True,
        metavar="TASK-XXXXXX",
        help="Task ID to replay, e.g. TASK-000001",
    )
    args = parser.parse_args()

    all_events = read_all_events()
    print_replay(args.task, all_events)
