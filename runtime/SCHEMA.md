# MVHB Schemas
> Authoritative schema definitions for all runtime artifacts.
> All sessions write conforming files. All readers parse against these schemas.

**Status:** PHASE 1
**Versioning:** Schemas version with `schema: v1` frontmatter on every artifact.

---

## DESIGN NOTES

- All artifacts are markdown with YAML frontmatter for structured fields, freeform markdown body for human notes.
- Frontmatter is the machine-readable layer. Body is the human-readable layer.
- Required fields are marked `(required)`. Optional fields may be omitted.
- Timestamps are ISO 8601 UTC: `2026-05-08T15:30:00Z`.
- IDs are slugs: lowercase, kebab-case, no spaces.

---

## SCHEMA: Handoff Packet

Path: `runtime/handoffs/[timestamp]-[from-slug]-to-[to-slug-or-unbound].md`

```yaml
---
schema: v1
type: handoff
id: 2026-05-08T22-30Z-impl-hub-to-unbound
from_session: 2026-05-08T15-00Z-impl-hub
to_session: unbound          # or specific session id if directed
branch: claude/implement-claude-design-ui-eFn9b
created: 2026-05-08T22:30:00Z
status: open                 # open | consumed | superseded

# WORK SUMMARY
files_changed:
  - path: docs/implementation/ACCENTOS_IMPLEMENTATION_MASTER_QUEUE.md
    lines_added: 170
    lines_removed: 0
  - path: runtime/README.md
    lines_added: 240
    lines_removed: 0
files_read:
  - GOVERNANCE_RISKS.md
  - docs/design/ACCENTOS_PROGRESSIVE_SHELL_ROLLOUT.md

# STATE TRANSITIONS
tasks_started:
  - id: mvhb-phase-1
tasks_completed:
  - id: impl-hub-layer
tasks_blocked: []

# CONTINUATION
open_questions:
  - "Should runtime/queue/_index.md be auto-generated or hand-maintained?"
blockers:
  - id: BUG-01
    waiting_on: michael
    action: wrangler deploy
  - id: DEC-01
    waiting_on: michael
    action: answer 5 phase-A decisions
continuation_prompt: |
  Continue from [commit hash].
  Read runtime/handoffs/_latest.md.
  Pick up R-01 prototype hardening or R-02 decision lock doc.

# VERIFICATION
boot_smoke: 27/27
commit_hash: 7d761fd
---

## Human Notes

Free-form markdown for context that doesn't fit structured fields.
What was tricky. What surprised the session. What the next session should
double-check before assuming.
```

---

## SCHEMA: Session Registry Entry

Path: `runtime/sessions/[timestamp]-[slug].md`

```yaml
---
schema: v1
type: session
id: 2026-05-08T15-00Z-impl-hub
status: active               # active | handed_off | compacted | terminated
branch: claude/implement-claude-design-ui-eFn9b
started: 2026-05-08T15:00:00Z
ended: null                  # ISO timestamp when handed_off

# CLAIMED RESOURCES
locks_held:
  - runtime/locks/impl-hub-layer.lock
tasks_claimed:
  - mvhb-phase-1

# OUTPUTS
handoff_written: null        # path to handoff packet on session end
commits:
  - hash: 7d761fd
    summary: "Implementation Hub layer — 7 docs"

# CONTEXT
parent_handoff: 2026-05-08T15-00Z-prior.md   # what handoff started this session
agents_spawned: 2            # count of background agents this session
---

## Session Notes

Free-form: what got built, what surprised, what's left.
```

---

## SCHEMA: Queue Item

Path: `runtime/queue/[task-id].md`

```yaml
---
schema: v1
type: queue_item
id: r-01-prototype-hardening
title: Prototype 2D hardening pass
status: ready                # new | ready | claimed | in_flight | blocked | complete | deferred | abandoned
priority: medium             # critical | high | medium | low
estimated_sessions: 1
created: 2026-05-08T22:30:00Z
updated: 2026-05-08T22:30:00Z

# OWNERSHIP
owner_branch: claude/implement-claude-design-ui-eFn9b
claimed_by: null             # session id when claimed

# DEPENDENCIES
depends_on: []
blocks:
  - id: phase-a-integration

# SCOPE
files_in_scope:
  - ui/accentos-shell-prototype.html
files_frozen:
  - index.html
  - worker/anthropic-proxy.js
  - wrangler.toml

# EXIT CRITERIA
exit_criteria:
  - boot_smoke: 27/27
  - no_console_errors_across_all_7_roles: true
  - empty_states_added_to_all_tables: true
  - aria_labels_on_icon_buttons: true
---

## Description

Empty states for filtered tables, a11y labels, mobile 390px verify,
keyboard reachability audit. Pure prototype-side work, zero production touch.

## Approach

1. Audit each table's filter logic; add empty-state HTML
2. Add aria-label to all icon-only buttons
3. Add role="dialog" + aria-modal to overlays
4. Run node syntax check across all 7 roles
5. Verify mobile breakpoint at exactly 390px

## Notes

This is from the recommended next prompt of the prior session.
```

---

## SCHEMA: Branch Record

Path: `runtime/branches/[sanitized-branch-name].md`

```yaml
---
schema: v1
type: branch
name: claude/implement-claude-design-ui-eFn9b
status: active               # planned | active | paused | merged | retired
authority: hub               # hub | runtime | governance | mobile
created: 2026-05-08T08:00:00Z
last_active: 2026-05-08T22:30:00Z
merge_target: main

# OWNERSHIP
files_owned:
  - ui/tokens.css
  - ui/accentos-shell.css
  - ui/accentos-shell.js
  - ui/accentos-shell-prototype.html
  - docs/design/*.md
  - docs/implementation/*.md
  - runtime/**
  - WORK_IN_PROGRESS.md
  - SYSTEM_STATE.md

files_frozen_for_this_branch:
  - index.html
  - worker/anthropic-proxy.js
  - wrangler.toml
  - supabase/**
  - js/*.js

# STATE
current_tip: 7d761fd
commits_ahead_of_main: 5
boot_smoke: 27/27
sessions_this_branch: 5
---

## Notes

UI prototype evolution + Implementation Hub.
Retires when Phase A merge to main is authorized.
```

---

## SCHEMA: Task Record

Path: `runtime/tasks/[task-id].md`

Tasks are richer than queue items. A queue item references a task. The task contains the full spec, history, and any artifacts.

```yaml
---
schema: v1
type: task
id: r-01-prototype-hardening
status: ready
queue_item: runtime/queue/r-01-prototype-hardening.md
created: 2026-05-08T22:30:00Z
sessions_worked: []
total_token_estimate: 30000  # rough estimate for cost throttling
---

## Full Specification

(detailed spec here — exit criteria, approach, scope, links)

## History

(append session-by-session — what was tried, what was learned)

## Artifacts

(any output that doesn't belong in commit history but is worth preserving)
```

---

## SCHEMA: Event Log Entry

Path: `runtime/events/[YYYY-MM-DD].log`

Append-only. One event per line. Plain text for grep-ability.

```
2026-05-08T15:00:00Z  session_start    impl-hub                branch=ui-proto
2026-05-08T15:02:00Z  task_claimed     impl-hub                task=mvhb-phase-1
2026-05-08T15:48:00Z  task_completed   impl-hub                task=impl-hub-layer
2026-05-08T22:25:00Z  commit_made      impl-hub                hash=7d761fd files=8
2026-05-08T22:30:00Z  handoff_written  impl-hub                to=unbound
2026-05-08T22:30:00Z  session_end      impl-hub                status=handed_off
```

Event types: `session_start, session_end, task_created, task_claimed, task_completed, task_blocked, task_deferred, commit_made, handoff_written, handoff_consumed, lock_acquired, lock_released, branch_created, branch_merged, branch_retired, freeze_declared, freeze_lifted`

---

## SCHEMA: Lock File

Path: `runtime/locks/[lock-name].lock`

```yaml
---
schema: v1
type: lock
id: prototype-edit
held_by: 2026-05-08T15-00Z-impl-hub
acquired: 2026-05-08T15:30:00Z
expected_release: 2026-05-08T17:00:00Z
purpose: editing ui/accentos-shell-prototype.html
released: false
---

# Resource

ui/accentos-shell-prototype.html

# Conflict policy

If another session needs this file before expected_release:
1. Check if lock is EXPIRED (current time > expected_release)
2. If EXPIRED: may reclaim, write expired-reclaim event
3. If HELD: WAIT or abort task
```

---

## INDEX FILES

Path: `runtime/queue/_index.md`, `runtime/sessions/_active.md`, `runtime/handoffs/_latest.md`

These are pointer/snapshot files. Format is just the same as the schema for the type they point to, OR a list-style markdown for `_index.md`.

`_index.md` example structure:

```markdown
# Queue Snapshot
Updated: 2026-05-08T22:30:00Z
Total: 4 ready, 7 blocked, 1 in flight, 10 complete

## READY
- r-01-prototype-hardening (medium, 1 session)
- r-02-decision-lock-doc (high, 0.5 sessions)
- r-03-feature-flag-scaffold (low, 0.25 sessions)

## BLOCKED (Michael)
- bug-01-worker-deploy (CRITICAL, waiting on wrangler deploy)
- dec-01-phase-a-decisions (HIGH, waiting on 5 answers)
- sql-01-migrations (HIGH, waiting on Supabase SQL run)

## IN FLIGHT
(none)

## COMPLETE (last 5)
- impl-hub-layer (2026-05-08, commit 7d761fd)
- phase-2c (2026-05-08, commit ff17ba1)
- phase-2b (2026-05-08, commit b22a9d5)
- phase-2a (2026-05-08, commit b9e7f58)
- ui-foundation (2026-05-08, commit d189b3b)
```

---

## VALIDATION RULES

A handoff packet is valid if:
- frontmatter parses as YAML
- `schema: v1` present
- `type: handoff` present
- `from_session, branch, created, continuation_prompt, boot_smoke, commit_hash` all present
- `status` is one of: open, consumed, superseded
- timestamps are ISO 8601

A session entry is valid if:
- frontmatter parses
- `id, status, branch, started` all present
- `status` is one of: active, handed_off, compacted, terminated

A queue item is valid if:
- `id, title, status, owner_branch` all present
- `status` is one of the documented states
- `depends_on` and `blocks` are lists (may be empty)

A lock file is valid if:
- `id, held_by, acquired, expected_release` all present
- `expected_release > acquired`

Sessions self-validate. The bus does not enforce — it only records.
