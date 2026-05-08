"""
tests/test_runtime.py — pytest test suite for AgentOS Runtime.

Run with: python -m pytest tests/ -v
"""

from __future__ import annotations

import json
import os
import sys
import tempfile
import textwrap
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest

# ---------------------------------------------------------------------------
# Path setup — ensure runtime/ is importable
# ---------------------------------------------------------------------------

_PROJECT_ROOT = Path(__file__).resolve().parent.parent
_RUNTIME_DIR = _PROJECT_ROOT / "runtime"
sys.path.insert(0, str(_RUNTIME_DIR))


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def tmp_tasks_dir(tmp_path):
    """Return a temporary tasks directory."""
    d = tmp_path / "tasks"
    d.mkdir()
    return d


@pytest.fixture
def tmp_events_dir(tmp_path):
    """Return a temporary events directory."""
    d = tmp_path / "events"
    d.mkdir()
    return d


@pytest.fixture
def valid_task_meta():
    """Return a valid task metadata dict."""
    return {
        "id": "TASK-000001",
        "title": "Test task",
        "status": "pending",
        "priority": "medium",
        "created_at": "2026-05-08T07:00:00+00:00",
        "assigned_to": "agent-test",
        "depends_on": [],
        "retry_limit": 3,
        "execution_budget_minutes": 30,
        "risk_level": "low",
        "allowed_actions": ["read_file", "write_file"],
        "blocked_actions": [],
        "success_criteria": ["task completes without error"],
        "abort_if": ["fatal_error"],
    }


@pytest.fixture
def valid_task_file(tmp_tasks_dir, valid_task_meta):
    """Write a valid task .md file and return its path."""
    import yaml
    fm = yaml.dump(valid_task_meta, default_flow_style=False)
    content = f"---\n{fm}---\n\nThis is the task body.\n"
    filepath = tmp_tasks_dir / "TASK-000001.md"
    filepath.write_text(content, encoding="utf-8")
    return str(filepath)


def _make_task_file(directory: Path, task_id: str, meta_overrides: dict = None) -> str:
    """Helper to create a task .md file."""
    import yaml
    base_meta = {
        "id": task_id,
        "title": f"Task {task_id}",
        "status": "pending",
        "priority": "low",
        "created_at": "2026-05-08T07:00:00+00:00",
        "assigned_to": "agent-test",
        "depends_on": [],
        "retry_limit": 2,
        "execution_budget_minutes": 15,
        "risk_level": "low",
        "allowed_actions": ["read_file"],
        "blocked_actions": [],
        "success_criteria": ["done"],
        "abort_if": [],
    }
    if meta_overrides:
        base_meta.update(meta_overrides)
    fm = yaml.dump(base_meta, default_flow_style=False)
    content = f"---\n{fm}---\n\nBody text.\n"
    filepath = directory / f"{task_id}.md"
    filepath.write_text(content, encoding="utf-8")
    return str(filepath)


# ===========================================================================
# 1. test_parse_task_valid
# ===========================================================================

def test_parse_task_valid(valid_task_file, valid_task_meta):
    """A valid .md file with proper YAML frontmatter parses correctly."""
    from parse_tasks import parse_task_file

    result = parse_task_file(valid_task_file)

    assert result["meta"]["id"] == "TASK-000001"
    assert result["meta"]["title"] == "Test task"
    assert result["body"] == "This is the task body."
    assert "_parse_error" not in result


# ===========================================================================
# 2. test_parse_task_missing_frontmatter
# ===========================================================================

def test_parse_task_missing_frontmatter(tmp_tasks_dir):
    """A .md file with no frontmatter raises ParseError."""
    from parse_tasks import parse_task_file, ParseError

    filepath = tmp_tasks_dir / "no-frontmatter.md"
    filepath.write_text("Just plain markdown, no frontmatter.\n", encoding="utf-8")

    with pytest.raises(ParseError):
        parse_task_file(str(filepath))


# ===========================================================================
# 3. test_validate_task_valid
# ===========================================================================

def test_validate_task_valid(valid_task_meta):
    """A complete, correct task meta dict passes validation."""
    from validate_task import validate_task

    is_valid, errors = validate_task(valid_task_meta)

    assert is_valid is True
    assert errors == []


# ===========================================================================
# 4. test_validate_task_invalid_status
# ===========================================================================

def test_validate_task_invalid_status(valid_task_meta):
    """A task with an unknown status value fails validation."""
    from validate_task import validate_task

    bad_meta = dict(valid_task_meta)
    bad_meta["status"] = "exploded"

    is_valid, errors = validate_task(bad_meta)

    assert is_valid is False
    assert any("status" in e for e in errors)


# ===========================================================================
# 5. test_validate_task_missing_required
# ===========================================================================

def test_validate_task_missing_required(valid_task_meta):
    """A task missing the required 'id' field fails validation."""
    from validate_task import validate_task

    bad_meta = dict(valid_task_meta)
    del bad_meta["id"]

    is_valid, errors = validate_task(bad_meta)

    assert is_valid is False
    assert any("id" in e for e in errors)


# ===========================================================================
# 6. test_event_log_append
# ===========================================================================

def test_event_log_append(tmp_events_dir):
    """Events are appended correctly and never overwrite existing ones."""
    from event_log import log_event, read_events, TASK_CREATED, TASK_QUEUED

    # Log two events
    evt1 = log_event(
        TASK_CREATED, "TASK-000001", "agent-test",
        metadata={"note": "first"},
        events_dir=str(tmp_events_dir),
    )
    evt2 = log_event(
        TASK_QUEUED, "TASK-000001", "agent-test",
        metadata={"note": "second"},
        events_dir=str(tmp_events_dir),
    )

    events = read_events(events_dir=str(tmp_events_dir))

    assert len(events) == 2
    assert events[0]["type"] == TASK_CREATED
    assert events[1]["type"] == TASK_QUEUED
    assert events[0]["metadata"]["note"] == "first"
    assert events[1]["metadata"]["note"] == "second"


# ===========================================================================
# 7. test_event_id_increment
# ===========================================================================

def test_event_id_increment(tmp_events_dir):
    """Event IDs increment from EVT-000001 upward for each new event."""
    from event_log import log_event, TASK_CREATED, TASK_STARTED, TASK_COMPLETED

    evt1 = log_event(TASK_CREATED, "TASK-000001", "agent-test",
                     events_dir=str(tmp_events_dir))
    evt2 = log_event(TASK_STARTED, "TASK-000001", "agent-test",
                     events_dir=str(tmp_events_dir))
    evt3 = log_event(TASK_COMPLETED, "TASK-000001", "agent-test",
                     events_dir=str(tmp_events_dir))

    assert evt1["event_id"] == "EVT-000001"
    assert evt2["event_id"] == "EVT-000002"
    assert evt3["event_id"] == "EVT-000003"


# ===========================================================================
# 8. test_dependency_satisfied
# ===========================================================================

def test_dependency_satisfied():
    """A task whose dependency has status 'complete' is unblocked."""
    from dependency_engine import check_dependencies

    dep_task = {"meta": {"id": "TASK-000001", "status": "complete", "depends_on": []}}
    main_task = {"meta": {"id": "TASK-000002", "status": "pending", "depends_on": ["TASK-000001"]}}

    all_tasks = [dep_task, main_task]
    satisfied, blocking = check_dependencies(main_task, all_tasks)

    assert satisfied is True
    assert blocking == []


# ===========================================================================
# 9. test_dependency_blocked
# ===========================================================================

def test_dependency_blocked():
    """A task whose dependency is still 'pending' remains blocked."""
    from dependency_engine import check_dependencies

    dep_task = {"meta": {"id": "TASK-000001", "status": "pending", "depends_on": []}}
    main_task = {"meta": {"id": "TASK-000002", "status": "pending", "depends_on": ["TASK-000001"]}}

    all_tasks = [dep_task, main_task]
    satisfied, blocking = check_dependencies(main_task, all_tasks)

    assert satisfied is False
    assert "TASK-000001" in blocking


# ===========================================================================
# 10. test_dependency_cycle_detection
# ===========================================================================

def test_dependency_cycle_detection():
    """A circular dependency chain is detected by detect_cycles."""
    from dependency_engine import detect_cycles

    # A → B → A (cycle)
    tasks = [
        {"meta": {"id": "TASK-000001", "depends_on": ["TASK-000002"]}},
        {"meta": {"id": "TASK-000002", "depends_on": ["TASK-000001"]}},
    ]

    cycles = detect_cycles(tasks)

    assert len(cycles) > 0
    # Both task IDs must appear in at least one cycle
    cycle_flat = [node for cycle in cycles for node in cycle]
    assert "TASK-000001" in cycle_flat
    assert "TASK-000002" in cycle_flat


# ===========================================================================
# 11. test_safety_critical_blocked
# ===========================================================================

def test_safety_critical_blocked():
    """A task with risk_level=critical is always blocked (never safe)."""
    from safety_checker import check_safety

    task = {"meta": {
        "id": "TASK-000004",
        "risk_level": "critical",
        "blocked_actions": [],
        "allowed_actions": [],
        "abort_if": [],
    }}

    is_safe, violations = check_safety(task)

    assert is_safe is False
    assert any("critical" in v.lower() for v in violations)


# ===========================================================================
# 12. test_safety_high_blocked
# ===========================================================================

def test_safety_high_blocked():
    """A task with risk_level=high is not safe and requires approval."""
    from safety_checker import check_safety

    task = {"meta": {
        "id": "TASK-000099",
        "risk_level": "high",
        "blocked_actions": [],
        "allowed_actions": [],
        "abort_if": [],
    }}

    is_safe, violations = check_safety(task)

    assert is_safe is False
    assert any("requires_approval" in v.lower() for v in violations)


# ===========================================================================
# 13. test_safety_low_passes
# ===========================================================================

def test_safety_low_passes():
    """A task with risk_level=low and no protected-file references is safe."""
    from safety_checker import check_safety

    task = {"meta": {
        "id": "TASK-000001",
        "risk_level": "low",
        "blocked_actions": ["delete_tmp_file"],
        "allowed_actions": ["read_file", "write_file"],
        "abort_if": ["test_failure"],
    }}

    is_safe, violations = check_safety(task)

    assert is_safe is True
    assert violations == []


# ===========================================================================
# 14. test_timestamp_trigger_future
# ===========================================================================

def test_timestamp_trigger_future():
    """A task with trigger_at in the future is not yet ready."""
    from timestamp_engine import is_trigger_ready

    future = datetime.now(timezone.utc) + timedelta(hours=2)
    task = {"meta": {"trigger_at": future.isoformat()}}

    assert is_trigger_ready(task) is False


# ===========================================================================
# 15. test_timestamp_trigger_past
# ===========================================================================

def test_timestamp_trigger_past():
    """A task with trigger_at in the past is ready to execute."""
    from timestamp_engine import is_trigger_ready

    past = datetime.now(timezone.utc) - timedelta(hours=2)
    task = {"meta": {"trigger_at": past.isoformat()}}

    assert is_trigger_ready(task) is True


# ===========================================================================
# 16. test_timestamp_no_trigger
# ===========================================================================

def test_timestamp_no_trigger():
    """A task with no trigger_at is always immediately ready."""
    from timestamp_engine import is_trigger_ready

    task = {"meta": {}}
    assert is_trigger_ready(task) is True

    task_explicit_none = {"meta": {"trigger_at": None}}
    assert is_trigger_ready(task_explicit_none) is True


# ===========================================================================
# 17. test_graph_generation
# ===========================================================================

def test_graph_generation():
    """Generated Mermaid output contains all task IDs."""
    from graph_generator import generate_mermaid_graph

    tasks = [
        {"meta": {"id": "TASK-000001", "title": "First", "status": "complete", "depends_on": []}},
        {"meta": {"id": "TASK-000002", "title": "Second", "status": "pending", "depends_on": ["TASK-000001"]}},
    ]

    graph = generate_mermaid_graph(tasks)

    assert "TASK_000001" in graph or "TASK-000001" in graph
    assert "TASK_000002" in graph or "TASK-000002" in graph
    assert "mermaid" in graph
    assert "-->" in graph  # Must have at least one edge


# ===========================================================================
# 18. test_replay_task
# ===========================================================================

def test_replay_task():
    """replay_task reconstructs state transitions correctly from events."""
    from replay_engine import replay_task

    events = [
        {
            "event_id": "EVT-000001",
            "timestamp": "2026-05-08T07:00:00+00:00",
            "type": "task_created",
            "task_id": "TASK-000001",
            "actor": "agent-test",
            "metadata": {},
        },
        {
            "event_id": "EVT-000002",
            "timestamp": "2026-05-08T07:01:00+00:00",
            "type": "task_queued",
            "task_id": "TASK-000001",
            "actor": "runtime.queue_engine",
            "metadata": {},
        },
        {
            "event_id": "EVT-000003",
            "timestamp": "2026-05-08T07:02:00+00:00",
            "type": "task_started",
            "task_id": "TASK-000001",
            "actor": "agent-test",
            "metadata": {},
        },
        {
            "event_id": "EVT-000004",
            "timestamp": "2026-05-08T07:30:00+00:00",
            "type": "task_completed",
            "task_id": "TASK-000001",
            "actor": "agent-test",
            "metadata": {},
        },
        # Noise event for a different task
        {
            "event_id": "EVT-000005",
            "timestamp": "2026-05-08T07:31:00+00:00",
            "type": "task_created",
            "task_id": "TASK-000002",
            "actor": "agent-test",
            "metadata": {},
        },
    ]

    timeline = replay_task("TASK-000001", events)

    # Only TASK-000001 events should be included
    assert timeline["task_id"] == "TASK-000001"
    assert len(timeline["events"]) == 4

    # State transitions should trace: created → queued → running → complete
    statuses = [t["to_status"] for t in timeline["state_transitions"]]
    assert "created" in statuses
    assert "queued" in statuses
    assert "running" in statuses
    assert "complete" in statuses

    assert timeline["retries"] == 0
    assert timeline["failures"] == []


# ===========================================================================
# 19. test_queue_ready_tasks
# ===========================================================================

def test_queue_ready_tasks(tmp_tasks_dir):
    """Only tasks that are pending, trigger-ready, dep-satisfied, and safe are returned."""
    # Create 3 tasks:
    #   T1 — complete (should NOT appear in ready)
    #   T2 — pending, low risk, no deps (should appear)
    #   T3 — pending, critical risk (should NOT appear — safety blocked)
    _make_task_file(tmp_tasks_dir, "TASK-000001", {"status": "complete"})
    _make_task_file(tmp_tasks_dir, "TASK-000002", {"status": "pending", "risk_level": "low"})
    _make_task_file(tmp_tasks_dir, "TASK-000003", {"status": "pending", "risk_level": "critical"})

    from parse_tasks import parse_all_tasks
    from validate_task import validate_all_tasks
    from queue_engine import get_ready_tasks

    tasks = validate_all_tasks(parse_all_tasks(str(tmp_tasks_dir)))
    ready = get_ready_tasks(tasks)

    ready_ids = [t["meta"]["id"] for t in ready]
    assert "TASK-000002" in ready_ids
    assert "TASK-000001" not in ready_ids  # complete, not pending
    assert "TASK-000003" not in ready_ids  # safety blocked
