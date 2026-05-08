# AgentOS Runtime

A markdown-driven temporal workflow engine. Tasks are defined as `.md` files with
YAML frontmatter, evaluated on each tick against dependency, safety, and timestamp
rules, and recorded to an immutable append-only JSONL event log.

---

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run one tick (parse, validate, evaluate, log, report)
python runtime/run_tick.py

# View the generated runtime summary
cat reports/runtime-summary.md

# View the dependency graph
cat reports/task-graph.md

# Replay a task's event history
python runtime/replay_engine.py --task TASK-000001

# Run the test suite
python -m pytest tests/ -v
```

---

## Task Format Reference

Tasks are `.md` files in the `tasks/` directory. Each file must begin with a
YAML frontmatter block delimited by `---`.

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier. Pattern: `TASK-\d{6}` |
| `title` | string | Human-readable task name |
| `status` | enum | See status values below |
| `priority` | enum | `low` / `medium` / `high` / `critical` |
| `created_at` | ISO 8601 datetime | When the task was created (UTC) |
| `assigned_to` | string | Agent or user responsible for execution |
| `depends_on` | list of task IDs | Tasks that must be `complete` first |
| `retry_limit` | integer 0–10 | Max retry attempts on failure |
| `execution_budget_minutes` | integer > 0 | Maximum allowed execution time |
| `risk_level` | enum | See risk levels below |
| `allowed_actions` | list of strings | Permitted actions for this task |
| `blocked_actions` | list of strings | Explicitly forbidden actions |
| `success_criteria` | list of strings | Conditions defining completion |
| `abort_if` | list of strings | Conditions triggering immediate abort |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `trigger_at` | ISO 8601 datetime | Task will not queue before this time (UTC) |

### Status Values

| Status | Description |
|--------|-------------|
| `pending` | Not yet started; waiting for conditions |
| `queued` | Ready to execute; in the run queue |
| `running` | Currently executing |
| `blocked` | Waiting on dependencies or manual approval |
| `failed` | Execution failed |
| `complete` | Successfully finished |
| `cancelled` | Manually cancelled |

### Example Task File

```markdown
---
id: TASK-000001
title: Build timestamp logger
status: pending
priority: high
created_at: "2026-05-08T07:00:00+00:00"
trigger_at: "2026-05-08T09:00:00+00:00"
assigned_to: agent-core
depends_on: []
retry_limit: 3
execution_budget_minutes: 30
risk_level: low
allowed_actions:
  - write_file
  - read_file
blocked_actions:
  - delete_file
success_criteria:
  - timestamp_engine.py exists
abort_if:
  - fatal_error
---

Task body in plain markdown goes here.
```

---

## Event Types Reference

All events are appended to `events/YYYY-MM-DD.events.jsonl`.

| Event Type | Triggered When |
|------------|---------------|
| `task_created` | A task file is first processed |
| `task_updated` | A task's metadata changes |
| `task_queued` | A task enters the run queue |
| `task_started` | A task begins execution |
| `task_blocked` | A task is blocked awaiting manual action |
| `task_failed` | A task execution fails |
| `task_completed` | A task reaches the `complete` state |
| `task_cancelled` | A task is manually cancelled |
| `dependency_satisfied` | All dependencies for a task become complete |
| `dependency_blocked` | A task is blocked by incomplete dependencies |
| `safety_blocked` | The safety checker blocks a task |
| `execution_retried` | A failed task is retried |
| `prompt_sent` | An agent prompt is dispatched |
| `response_received` | An agent response is received |
| `file_changed` | A file change is recorded |
| `commit_created` | A git commit is created |

### Event Schema

```json
{
  "event_id": "EVT-000001",
  "timestamp": "2026-05-08T07:00:00+00:00",
  "type": "task_created",
  "task_id": "TASK-000001",
  "actor": "agent-core",
  "metadata": {}
}
```

---

## Safety Model Reference

Every task is evaluated against the safety checker before it can be queued.

| Risk Level | Auto-Execute | Behaviour |
|------------|-------------|-----------|
| `low` | Yes | Queued automatically |
| `medium` | Yes | Queued with advisory warning |
| `high` | No | Blocked; requires manual approval |
| `critical` | Never | Always blocked, never auto-executed |

### Protected Paths

The following paths/patterns are never accessible via `allowed_actions`:

- `.env`
- `.env.local`
- `secrets/`
- `billing/`
- `production-config/`
- `auth/`

Any reference to these in `blocked_actions`, `allowed_actions`, or `abort_if`
will trigger a safety violation.

---

## How to Replay a Task

The replay engine reconstructs the full event history for any task:

```bash
python runtime/replay_engine.py --task TASK-000001
```

Output includes:
- All events for that task in chronological order
- State transition timeline (created → queued → running → complete)
- Actor history (who triggered each event)
- Dependency events
- File changes
- Failures and retry counts

---

## Folder Structure Reference

```
agent-os-runtime/
  tasks/          Task .md files (YAML frontmatter + markdown body)
  events/         JSONL event logs (YYYY-MM-DD.events.jsonl, append-only)
  schemas/        JSON Schema definitions
  runtime/        Python modules
    parse_tasks.py        Parse task .md files
    validate_task.py      Pydantic v2 schema validation
    event_log.py          Append-only JSONL event logging
    dependency_engine.py  Dependency resolution + cycle detection
    safety_checker.py     Risk-level and protected-file safety gate
    timestamp_engine.py   UTC-aware trigger time evaluation
    queue_engine.py       Queue state management
    graph_generator.py    Mermaid diagram generation
    replay_engine.py      Event timeline replay
    run_tick.py           Main orchestrator (runs one tick)
  reports/        Generated Markdown reports
    runtime-summary.md    Latest tick summary
    task-graph.md         Mermaid dependency graph
  state/          Runtime state files
    queue.json            Current queue state snapshot
  docs/           Additional documentation
  tests/          pytest test suite
    test_runtime.py
  requirements.txt
  README.md
```

---

## Module Import Structure

```
run_tick.py
  ├── parse_tasks.py
  ├── validate_task.py
  ├── event_log.py
  ├── dependency_engine.py
  ├── safety_checker.py
  ├── timestamp_engine.py
  ├── queue_engine.py
  │     ├── dependency_engine.py
  │     ├── safety_checker.py
  │     └── timestamp_engine.py
  ├── graph_generator.py
  └── replay_engine.py
```

All modules are designed to be self-contained and individually runnable
via `python runtime/<module>.py`.
