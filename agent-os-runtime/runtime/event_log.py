"""
event_log.py — Append-only JSONL event logging for AgentOS Runtime.

Events are written to events/YYYY-MM-DD.events.jsonl.
Existing events are NEVER overwritten or deleted.
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

# ---------------------------------------------------------------------------
# Event type constants
# ---------------------------------------------------------------------------

TASK_CREATED = "task_created"
TASK_UPDATED = "task_updated"
TASK_QUEUED = "task_queued"
TASK_STARTED = "task_started"
TASK_BLOCKED = "task_blocked"
TASK_FAILED = "task_failed"
TASK_COMPLETED = "task_completed"
TASK_CANCELLED = "task_cancelled"
DEPENDENCY_SATISFIED = "dependency_satisfied"
DEPENDENCY_BLOCKED = "dependency_blocked"
SAFETY_BLOCKED = "safety_blocked"
EXECUTION_RETRIED = "execution_retried"
PROMPT_SENT = "prompt_sent"
RESPONSE_RECEIVED = "response_received"
FILE_CHANGED = "file_changed"
COMMIT_CREATED = "commit_created"

ALL_EVENT_TYPES: set[str] = {
    TASK_CREATED,
    TASK_UPDATED,
    TASK_QUEUED,
    TASK_STARTED,
    TASK_BLOCKED,
    TASK_FAILED,
    TASK_COMPLETED,
    TASK_CANCELLED,
    DEPENDENCY_SATISFIED,
    DEPENDENCY_BLOCKED,
    SAFETY_BLOCKED,
    EXECUTION_RETRIED,
    PROMPT_SENT,
    RESPONSE_RECEIVED,
    FILE_CHANGED,
    COMMIT_CREATED,
}

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

# Default events directory (relative to this file's parent's parent)
_DEFAULT_EVENTS_DIR = Path(__file__).resolve().parent.parent / "events"


def _events_dir() -> Path:
    """Return the events directory, creating it if needed."""
    d = _DEFAULT_EVENTS_DIR
    d.mkdir(parents=True, exist_ok=True)
    return d


def _log_file_path(date_str: str) -> Path:
    """Return Path for the events log file for a given date string YYYY-MM-DD."""
    return _events_dir() / f"{date_str}.events.jsonl"


def _today_str() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _count_existing_events(date_str: str) -> int:
    """Count how many events already exist in today's log file."""
    path = _log_file_path(date_str)
    if not path.exists():
        return 0
    count = 0
    with path.open("r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line:
                count += 1
    return count


def _make_event_id(counter: int) -> str:
    """Format an event ID from a 1-based counter."""
    return f"EVT-{counter:06d}"


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def log_event(
    event_type: str,
    task_id: str,
    actor: str,
    metadata: Optional[dict[str, Any]] = None,
    *,
    events_dir: Optional[str] = None,
) -> dict[str, Any]:
    """
    Append a single event to today's JSONL log file.

    Args:
        event_type: One of the ALL_EVENT_TYPES constants.
        task_id:    The task this event relates to.
        actor:      The agent/user that caused the event.
        metadata:   Optional extra data dict.
        events_dir: Override for events directory (used in tests).

    Returns:
        The event dict that was written.

    Raises:
        ValueError: If event_type is not a recognised type.
    """
    if event_type not in ALL_EVENT_TYPES:
        raise ValueError(
            f"Unknown event type '{event_type}'. Valid types: {sorted(ALL_EVENT_TYPES)}"
        )

    # Allow overriding the events directory (e.g. in tests)
    global _DEFAULT_EVENTS_DIR
    if events_dir is not None:
        original_dir = _DEFAULT_EVENTS_DIR
        _DEFAULT_EVENTS_DIR = Path(events_dir)
        _DEFAULT_EVENTS_DIR.mkdir(parents=True, exist_ok=True)

    date_str = _today_str()
    existing_count = _count_existing_events(date_str)
    event_id = _make_event_id(existing_count + 1)
    timestamp = datetime.now(timezone.utc).isoformat()

    event: dict[str, Any] = {
        "event_id": event_id,
        "timestamp": timestamp,
        "type": event_type,
        "task_id": task_id,
        "actor": actor,
        "metadata": metadata or {},
    }

    log_path = _log_file_path(date_str)
    with log_path.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(event) + "\n")

    if events_dir is not None:
        _DEFAULT_EVENTS_DIR = original_dir  # type: ignore[assignment]

    return event


def read_events(
    date_str: Optional[str] = None,
    *,
    events_dir: Optional[str] = None,
) -> list[dict[str, Any]]:
    """
    Read all events for a given date (default: today).

    Args:
        date_str:   Date string YYYY-MM-DD.  Defaults to today UTC.
        events_dir: Override for events directory (used in tests).

    Returns:
        List of event dicts, in order of insertion.
    """
    global _DEFAULT_EVENTS_DIR
    if events_dir is not None:
        original_dir = _DEFAULT_EVENTS_DIR
        _DEFAULT_EVENTS_DIR = Path(events_dir)

    if date_str is None:
        date_str = _today_str()

    path = _log_file_path(date_str)
    events: list[dict[str, Any]] = []

    if path.exists():
        with path.open("r", encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if line:
                    try:
                        events.append(json.loads(line))
                    except json.JSONDecodeError:
                        pass  # Skip malformed lines

    if events_dir is not None:
        _DEFAULT_EVENTS_DIR = original_dir  # type: ignore[assignment]

    return events


def read_all_events(
    *,
    events_dir: Optional[str] = None,
) -> list[dict[str, Any]]:
    """
    Read all events across all log files, sorted chronologically.

    Args:
        events_dir: Override for events directory (used in tests).

    Returns:
        List of all event dicts sorted by timestamp.
    """
    global _DEFAULT_EVENTS_DIR
    if events_dir is not None:
        original_dir = _DEFAULT_EVENTS_DIR
        _DEFAULT_EVENTS_DIR = Path(events_dir)

    all_events: list[dict[str, Any]] = []
    events_path = _events_dir()

    for log_file in sorted(events_path.glob("*.events.jsonl")):
        with log_file.open("r", encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if line:
                    try:
                        all_events.append(json.loads(line))
                    except json.JSONDecodeError:
                        pass

    if events_dir is not None:
        _DEFAULT_EVENTS_DIR = original_dir  # type: ignore[assignment]

    all_events.sort(key=lambda e: e.get("timestamp", ""))
    return all_events


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "dump":
        date = sys.argv[2] if len(sys.argv) > 2 else None
        events = read_events(date)
        for evt in events:
            print(json.dumps(evt))
    else:
        print("Usage: python event_log.py dump [YYYY-MM-DD]")
