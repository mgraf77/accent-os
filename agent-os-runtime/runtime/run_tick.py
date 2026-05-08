"""
run_tick.py — AgentOS Runtime main orchestrator.

Each tick:
  1. Get current UTC timestamp
  2. Parse all tasks from tasks/
  3. Validate all task schemas
  4. Evaluate timestamp triggers
  5. Evaluate dependencies
  6. Evaluate safety rules
  7. Identify ready tasks and update queue
  8. Log events for state changes
  9. Regenerate task graph
  10. Generate runtime summary report
"""

from __future__ import annotations

import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# Ensure runtime/ is on the path when run from project root
_RUNTIME_DIR = Path(__file__).resolve().parent
_PROJECT_ROOT = _RUNTIME_DIR.parent
sys.path.insert(0, str(_RUNTIME_DIR))

from parse_tasks import parse_all_tasks, ParseError
from validate_task import validate_all_tasks
from event_log import (
    log_event,
    read_all_events,
    TASK_QUEUED,
    TASK_BLOCKED,
    DEPENDENCY_BLOCKED,
    DEPENDENCY_SATISFIED,
    SAFETY_BLOCKED,
)
from dependency_engine import check_dependencies, detect_cycles
from safety_checker import check_safety, get_risk_warning, RISK_RULES
from timestamp_engine import is_trigger_ready, get_now_utc
from queue_engine import evaluate_queue, get_ready_tasks, save_queue
from graph_generator import write_graph_report


# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

TASKS_DIR = _PROJECT_ROOT / "tasks"
REPORTS_DIR = _PROJECT_ROOT / "reports"
GRAPH_REPORT = REPORTS_DIR / "task-graph.md"
RUNTIME_SUMMARY = REPORTS_DIR / "runtime-summary.md"


# ---------------------------------------------------------------------------
# Tick helpers
# ---------------------------------------------------------------------------

def _format_task_list(tasks: list[dict[str, Any]]) -> str:
    """Format a list of tasks for the summary report."""
    if not tasks:
        return "_None_\n"
    lines = []
    for task in tasks:
        meta = task.get("meta", {})
        tid = meta.get("id", "?")
        title = meta.get("title", "?")
        status = meta.get("status", "?")
        risk = meta.get("risk_level", "?")
        lines.append(f"- **{tid}** — {title} _(status: {status}, risk: {risk})_")
    return "\n".join(lines) + "\n"


def _format_id_list(task_ids: list[str]) -> str:
    if not task_ids:
        return "_None_\n"
    return "\n".join(f"- {tid}" for tid in task_ids) + "\n"


# ---------------------------------------------------------------------------
# Main tick
# ---------------------------------------------------------------------------

def run_tick() -> dict[str, Any]:
    """
    Execute one full runtime tick.

    Returns a summary dict for inspection / testing.
    """
    # ------------------------------------------------------------------
    # Step 1 — Current UTC timestamp
    # ------------------------------------------------------------------
    now = get_now_utc()
    print(f"[tick] {now.isoformat()}  — AgentOS Runtime starting tick")

    # ------------------------------------------------------------------
    # Step 2 — Parse all tasks
    # ------------------------------------------------------------------
    TASKS_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    try:
        raw_tasks = parse_all_tasks(str(TASKS_DIR))
    except ParseError as exc:
        print(f"[ERROR] Failed to parse tasks directory: {exc}")
        raw_tasks = []

    parse_errors = [t for t in raw_tasks if t.get("_parse_error")]
    print(f"[tick] Parsed {len(raw_tasks)} task files  ({len(parse_errors)} parse errors)")

    # ------------------------------------------------------------------
    # Step 3 — Validate all task schemas
    # ------------------------------------------------------------------
    tasks = validate_all_tasks(raw_tasks)
    valid_tasks = [t for t in tasks if t.get("_valid")]
    invalid_tasks = [t for t in tasks if not t.get("_valid")]
    print(f"[tick] Validated: {len(valid_tasks)} valid, {len(invalid_tasks)} invalid")

    # ------------------------------------------------------------------
    # Step 4 — Evaluate timestamp triggers
    # ------------------------------------------------------------------
    trigger_ready: list[dict[str, Any]] = []
    trigger_waiting: list[dict[str, Any]] = []
    for task in valid_tasks:
        if is_trigger_ready(task, now):
            trigger_ready.append(task)
        else:
            trigger_waiting.append(task)
    print(f"[tick] Trigger: {len(trigger_ready)} ready, {len(trigger_waiting)} waiting")

    # ------------------------------------------------------------------
    # Step 5 — Evaluate dependencies
    # ------------------------------------------------------------------
    dep_results: dict[str, tuple[bool, list[str]]] = {}
    for task in valid_tasks:
        task_id = task["meta"].get("id", "?")
        ok, blocking = check_dependencies(task, valid_tasks)
        dep_results[task_id] = (ok, blocking)

    cycles = detect_cycles(valid_tasks)
    if cycles:
        print(f"[tick] WARNING: {len(cycles)} dependency cycle(s) detected!")

    # ------------------------------------------------------------------
    # Step 6 — Evaluate safety rules
    # ------------------------------------------------------------------
    safety_results: dict[str, tuple[bool, list[str]]] = {}
    safety_warnings: list[str] = []
    for task in valid_tasks:
        task_id = task["meta"].get("id", "?")
        is_safe, violations = check_safety(task)
        safety_results[task_id] = (is_safe, violations)
        warning = get_risk_warning(task)
        if warning:
            safety_warnings.append(warning)

    # ------------------------------------------------------------------
    # Step 7 — Identify ready tasks and update queue
    # ------------------------------------------------------------------
    all_events = read_all_events()
    queue_state = evaluate_queue(tasks, all_events)
    ready_tasks = get_ready_tasks(valid_tasks)

    # Log events for tasks that are newly ready (safety-blocked, dep-blocked, queued)
    already_queued = set(queue_state.get("queued", []))

    events_logged: list[dict[str, Any]] = []

    for task in valid_tasks:
        meta = task["meta"]
        task_id = meta.get("id", "?")
        status = meta.get("status", "pending")

        if status != "pending":
            continue

        deps_ok, blocking_ids = dep_results.get(task_id, (True, []))
        is_safe, violations = safety_results.get(task_id, (True, []))
        trig_ready = is_trigger_ready(task, now)

        if not is_safe:
            # Log safety block
            evt = log_event(
                SAFETY_BLOCKED,
                task_id,
                actor="runtime.safety_checker",
                metadata={"violations": violations},
            )
            events_logged.append(evt)
        elif not deps_ok:
            # Log dependency block
            evt = log_event(
                DEPENDENCY_BLOCKED,
                task_id,
                actor="runtime.dependency_engine",
                metadata={"blocking_tasks": blocking_ids},
            )
            events_logged.append(evt)
        elif trig_ready and deps_ok and is_safe and task_id not in already_queued:
            # Log dependency satisfied (if there were any deps)
            if meta.get("depends_on"):
                dep_evt = log_event(
                    DEPENDENCY_SATISFIED,
                    task_id,
                    actor="runtime.dependency_engine",
                    metadata={"depends_on": meta.get("depends_on", [])},
                )
                events_logged.append(dep_evt)
            # Log task queued
            evt = log_event(
                TASK_QUEUED,
                task_id,
                actor="runtime.queue_engine",
                metadata={"trigger_at": str(meta.get("trigger_at", ""))},
            )
            events_logged.append(evt)

    # Persist updated queue state
    save_queue(queue_state)
    print(f"[tick] Queue updated — {len(ready_tasks)} tasks ready to execute")
    print(f"[tick] Logged {len(events_logged)} new events this tick")

    # ------------------------------------------------------------------
    # Step 9 — Regenerate task graph
    # ------------------------------------------------------------------
    write_graph_report(valid_tasks, str(GRAPH_REPORT))
    print(f"[tick] Task graph written to {GRAPH_REPORT}")

    # ------------------------------------------------------------------
    # Step 10 — Generate runtime summary report
    # ------------------------------------------------------------------
    # Bucket tasks by status for the report
    status_buckets: dict[str, list[dict[str, Any]]] = {k: [] for k in [
        "queued", "blocked", "pending", "failed", "complete", "running", "cancelled"
    ]}
    for task in valid_tasks:
        s = task["meta"].get("status", "pending")
        if s in status_buckets:
            status_buckets[s].append(task)

    # Collect safety violations across all tasks
    all_violations: list[str] = []
    for task_id, (is_safe, violations) in safety_results.items():
        if not is_safe:
            for v in violations:
                all_violations.append(f"**{task_id}**: {v}")

    # Collect dependency issues
    dep_issues: list[str] = []
    for task_id, (deps_ok, blocking) in dep_results.items():
        if not deps_ok:
            dep_issues.append(f"**{task_id}** blocked by: {', '.join(blocking)}")
    for cycle in cycles:
        dep_issues.append(f"Cycle detected: {' → '.join(cycle)}")

    # Execution counts
    all_task_events = read_all_events()
    exec_counts: dict[str, int] = {}
    for evt in all_task_events:
        tid = evt.get("task_id", "")
        if tid:
            exec_counts[tid] = exec_counts.get(tid, 0) + 1

    summary_lines = [
        "# AgentOS Runtime Summary",
        f"Generated: {now.isoformat()}",
        "",
        "## Queued Tasks",
        _format_task_list(status_buckets["queued"]),
        "## Running Tasks",
        _format_task_list(status_buckets["running"]),
        "## Pending Tasks",
        _format_task_list(status_buckets["pending"]),
        "## Blocked Tasks",
        _format_task_list(status_buckets["blocked"]),
        "## Failed Tasks",
        _format_task_list(status_buckets["failed"]),
        "## Complete Tasks",
        _format_task_list(status_buckets["complete"]),
        "## Cancelled Tasks",
        _format_task_list(status_buckets["cancelled"]),
        "## Dependency Issues",
        ("\n".join(f"- {d}" for d in dep_issues) + "\n") if dep_issues else "_None_\n",
        "## Safety Violations",
        ("\n".join(f"- {v}" for v in all_violations) + "\n") if all_violations else "_None_\n",
        "## Safety Warnings",
        ("\n".join(f"- {w}" for w in safety_warnings) + "\n") if safety_warnings else "_None_\n",
        "## Execution Counts (total events per task)",
        ("\n".join(f"- **{tid}**: {count} events" for tid, count in sorted(exec_counts.items())) + "\n")
        if exec_counts else "_No events logged yet_\n",
        "## Parse / Validation Errors",
        ("\n".join(f"- {t.get('filepath', '?')}: {', '.join(t.get('_errors', []))}" for t in invalid_tasks) + "\n")
        if invalid_tasks else "_None_\n",
        f"## Tick Stats",
        f"- Tasks parsed: {len(raw_tasks)}",
        f"- Tasks valid: {len(valid_tasks)}",
        f"- Tasks invalid: {len(invalid_tasks)}",
        f"- Trigger-ready: {len(trigger_ready)}",
        f"- Trigger-waiting: {len(trigger_waiting)}",
        f"- Ready to queue: {len(ready_tasks)}",
        f"- Events logged this tick: {len(events_logged)}",
        f"- Dependency cycles: {len(cycles)}",
        "",
    ]

    summary_content = "\n".join(summary_lines)
    RUNTIME_SUMMARY.write_text(summary_content, encoding="utf-8")
    print(f"[tick] Runtime summary written to {RUNTIME_SUMMARY}")
    print("[tick] Tick complete.")

    return {
        "now": now,
        "tasks_total": len(raw_tasks),
        "tasks_valid": len(valid_tasks),
        "tasks_invalid": len(invalid_tasks),
        "trigger_ready": len(trigger_ready),
        "trigger_waiting": len(trigger_waiting),
        "ready_tasks": ready_tasks,
        "queue_state": queue_state,
        "safety_violations": all_violations,
        "dep_issues": dep_issues,
        "cycles": cycles,
        "events_logged": events_logged,
    }


if __name__ == "__main__":
    result = run_tick()
    print(f"\nSummary:")
    print(f"  Total tasks  : {result['tasks_total']}")
    print(f"  Valid        : {result['tasks_valid']}")
    print(f"  Ready        : {len(result['ready_tasks'])}")
    print(f"  Violations   : {len(result['safety_violations'])}")
    print(f"  Events logged: {len(result['events_logged'])}")
