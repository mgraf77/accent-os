# Execution Topology V1
**Recommended session structure for AccentOS development**

**Version:** 1.0  
**Authority:** Implementation Hub  
**Branch:** claude/implement-claude-design-ui-eFn9b  
**Created:** 2026-05-09  
**Status:** Active  

---

## What This Document Covers

How sessions are structured, what roles they play, how they relate to each other,
and when to spawn vs terminate. This is the operational layer of the MVHB system —
the rules that sessions follow when deciding what to do and how to coordinate.

This document does NOT cover: what tasks to do (see ACCENTOS_IMPLEMENTATION_MASTER_QUEUE.md),
what files are owned by whom (see ACCENTOS_ACTIVE_BRANCH_REGISTRY.md), or what automation
is authorized (see MVHB_ROADMAP.md Phase boundary table).

---

## Session Roles

### Hub Session

One per branch. Manages the queue, claims authority over orchestration decisions,
writes the authoritative handoff packet at session end.

**Responsibilities:**
- Reads _latest.md + WORK_IN_PROGRESS.md + BUILD_PLAN_CLAUDE.md on spawn
- Claims tasks from queue on behalf of bounded workers (or itself)
- Writes authoritative STATUS.md and RELAY.md when those exist
- Is the only session authorized to update `runtime/queue/_index.md`
- Is the only session authorized to update `runtime/branches/[branch].md`

**Constraint:** Only one hub session may be active per branch at a time.

**Identification:**
```yaml
session_type: hub
branch: claude/implement-claude-design-ui-eFn9b
```

### Bounded Worker Session

Zero to three per branch simultaneously. Executes a single defined task.
Reads only what it needs. Writes only to its declared scope files.
Reports back via handoff packet; hub session absorbs findings.

**Responsibilities:**
- Read runtime/ startup artifacts
- Execute its specific task
- Emit handoff at end
- NOT update queue index (hub does that)

**Constraint:** Maximum 3 bounded workers simultaneously. No sub-sub-agents.

**Identification:**
```yaml
session_type: bounded_worker
task_id: [queue item id]
```

### Emergency Hotfix Session

For production-adjacent issues only (e.g., BUG-01 wrangler deploy failure).
Narrowest scope of all session types. Single file. Single problem. No queue update.

**Constraint:** Requires explicit Michael authorization before spawn.
Hub session may NOT self-authorize emergency hotfix spawns.

---

## Active vs Frozen Sessions

### Active Session

A session that has written its entry to `runtime/sessions/_active.md` and has not
yet written its termination event. Active sessions have:
- A living context window
- A claimed task
- A last-seen timestamp (updated on each commit)

### Frozen Session

A session that started but did not complete its emit phase before termination.
Identified by: session entry exists in `runtime/sessions/` but no corresponding
handoff in `runtime/handoffs/` with a matching session_id.

Frozen sessions leave work in an unknown state. Next session must:
1. Read WORK_IN_PROGRESS.md (most recent committed version)
2. Read `git log --oneline -10` to identify last clean commit
3. Read the incomplete session's task queue item
4. Decide: complete the task OR create a new queue item to handle cleanup

Frozen sessions are not the same as stale sessions:
- **Stale:** Session started, is still nominally "active", but last heartbeat > threshold
- **Frozen:** Session ended prematurely, no clean handoff written

---

## Phone-First Orchestration

Michael monitors the project from a phone between sessions. The topology must
accommodate phone-based relay without requiring desktop access for routine oversight.

### What Michael can do from phone (no desktop needed):

- Read `runtime/handoffs/_latest.md` — understand current state
- Read `runtime/STATUS.md` — system overview (Phase 2 feature)
- Read `runtime/RELAY.md` — compressed session digest (Phase 4 feature)
- Read `runtime/queue/_index.md` — queue state
- Read `runtime/events/[date].log` — recent activity
- Compose next session prompt (plain text)

### What requires desktop:

- Running `wrangler deploy` (BUG-01)
- Running Supabase SQL migrations (SQL-01)
- Answering DEC-01 inline in `docs/design/ACCENTOS_PROGRESSIVE_SHELL_ROLLOUT.md §11`
- Reviewing and merging PRs
- Creating new branches

**Topology principle:** Hub session output must always be phone-readable.
If a session's handoff requires desktop to understand, it has failed this constraint.

---

## When to Spawn a New Session

Spawn a new bounded worker session when:

1. A task is clearly scoped in the queue with defined file scope
2. The task can complete in < 4 hours
3. The task does not require files owned by another active session
4. Michael has explicitly asked for the task or it is the highest-priority READY item
5. No lock conflict exists in `runtime/locks/` (future Phase 3)

Do NOT spawn when:

- Task scope is undefined ("figure out how to improve X")
- Task requires files currently held by another active session
- Task is BLOCKED ON MICHAEL (no point spawning — will stall immediately)
- Current hub session can complete the task within its remaining lifespan

### Spawn checklist

```
[ ] Task has a queue item with task-id
[ ] Files in scope are listed in queue item
[ ] Files in scope are not frozen for this branch
[ ] No other session has claimed the task
[ ] Michael has not blocked this task
[ ] Estimated duration fits within session lifespan limit
```

---

## When to Terminate a Session

Terminate cleanly when:

1. Task is complete + handoff written + git pushed
2. Context consumption > 80% estimated (pre-emptive handoff)
3. Blocking item discovered that requires Michael (cannot proceed without DEC-xx)
4. Session has been running > 4 hours wall clock
5. Michael signals "wrap up" / "done" / "pause"

Do NOT continue a session:

- Past context limit (quality degrades, risks context drift)
- When Michael has gone offline for > 2 hours (no relay available)
- When the task has expanded beyond its declared scope without Michael authorization

---

## Safe Parallelism Rules

Derived from ACCENTOS_PARALLEL_WORK_RULES.md. Summary for topology:

**Tier 0 (always safe in parallel):**
- Any two documentation-only tasks with no shared files

**Tier 1 (safe with coordination):**
- UI prototype task + documentation task (different files, different scopes)
- Two documentation tasks with explicit file ownership declared

**Tier 2 (requires hub authorization):**
- Any task touching `ui/accentos-shell-prototype.html` must be the ONLY session
  touching that file. It's 2,549 lines of monolith — concurrent writes guarantee conflicts.

**Tier 3 (never parallel):**
- Any two sessions with overlapping `files_in_scope`
- Any session + production file (production files are frozen for this branch)

**Maximum simultaneous active sessions: 3**
(1 hub + 2 bounded workers)

---

## Topology State Machine

```
[Michael writes prompt]
        ↓
  [SPAWN phase]
  Read _latest.md
  Identify task
  Write session entry
        ↓
  [EXECUTE phase] ←─────────────────┐
  Build, commit, smoke check        │
  WORK_IN_PROGRESS.md updates       │
        ↓                           │
  Task complete? ──No──→ Context threshold? ──No──→ ┘
        │Yes                        │Yes
        ↓                           ↓
  [STABILIZE]              [STABILIZE mid-task]
  27/27 smoke              27/27 smoke
  Final commit             Partial commit
        ↓                           ↓
  [SUMMARIZE]              [SUMMARIZE mid-task]
        ↓                           ↓
  [EMIT]                   [EMIT]
  Full handoff             Mid-task handoff
  task: complete           task: in_flight
        ↓                           ↓
  [TERMINATE]              [TERMINATE]
  Clean                    Partial (next session resumes)
```

---

## Topology Anti-Patterns

**Anti-pattern 1: The infinite hub**
Hub session accumulates tasks indefinitely rather than terminating cleanly.
Result: context drift, stale WORK_IN_PROGRESS.md, massive commits that are hard to review.
Fix: Hub session completes one task, emits handoff, terminates. Relay. Spawn fresh.

**Anti-pattern 2: The silent scope expander**
Session discovers adjacent work and does it without writing a queue item.
Result: files changed that weren't in declared scope, future sessions confused.
Fix: Queue item first, then claim it. Even if it's a 10-minute task.

**Anti-pattern 3: The no-handoff termination**
Session runs out of context mid-task without writing handoff.
Result: frozen session, next session must reconstruct state from git log.
Fix: Monitor context consumption, emit pre-emptive handoff at 70-80% usage.

**Anti-pattern 4: The Michael-loop**
Session discovers blocking item, asks Michael, waits, asks again, waits.
Result: session lifespan consumed by waiting, no work done.
Fix: Detect block immediately. Write blocking item to queue. Terminate cleanly.
Michael resolves asynchronously. Next session picks up.

**Anti-pattern 5: The documentation avalanche**
Session writes extensive planning docs instead of building.
Result: high WORK_IN_PROGRESS.md churn, low build output, Michael relay fatigue.
Fix: Planning docs are legitimate tasks BUT must have their own queue items.
Cap documentation tasks at 30% of any single session's output.

---

## Topology Metrics (Targets)

| Metric | Target | Alert threshold |
|--------|--------|----------------|
| Spawn overhead | < 2 min | > 5 min |
| Task completion rate | 1 task/session | < 0.5 tasks/session |
| Handoff completeness | All 8 fields | Any field missing |
| Boot smoke on commit | 27/27 | < 27/27 |
| Michael relay time | < 90 sec/boundary | > 3 min/boundary |
| Stale session rate | 0 | > 0 in any 7-day window |
| Scope expansion events | 0 | > 2/session |

---

## Version History

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-05-09 | Initial topology spec |
