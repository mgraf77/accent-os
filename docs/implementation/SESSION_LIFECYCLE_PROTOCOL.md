# Session Lifecycle Protocol
**Authoritative spec for AccentOS bounded session execution**

**Version:** 1.0  
**Authority:** Implementation Hub  
**Branch:** claude/implement-claude-design-ui-eFn9b  
**Created:** 2026-05-09  
**Status:** Active  

---

## Overview

A session is a single Claude Code invocation from start to termination. Sessions are
ephemeral — state does not persist inside the session across context resets.
The Lifecycle Protocol defines exactly what happens at each phase boundary, what
artifacts are expected, and what conditions trigger phase transitions.

This protocol applies to all sessions on this branch. Compliance is enforced by
convention, not automation (AML 2 — supervised agents).

---

## The Six Phases

```
SPAWN → EXECUTE → STABILIZE → SUMMARIZE → EMIT → TERMINATE
```

Each phase has entry conditions, actions, and exit gates.

---

## Phase 1: SPAWN

**Trigger:** Michael provides a prompt to Claude Code.

**Entry conditions (all must be true):**
- Branch `claude/implement-claude-design-ui-eFn9b` is checked out
- No lock file at `runtime/locks/` for the claimed task (future Phase 3)
- Prior session handoff has been read (or no prior handoff exists)

**Required actions:**

1. Read `runtime/handoffs/_latest.md` (primary context source)
2. Read `runtime/queue/_index.md` (understand task landscape)
3. Read `WORK_IN_PROGRESS.md` (backward-compat check for pre-MVHB sessions)
4. If auto-execute per CLAUDE.md: also read BUILD_PLAN_CLAUDE.md, BUILD_INTELLIGENCE.md
5. Identify claimed task. If no task specified by Michael, select highest-priority READY
   item from queue that has no unresolved BLOCKS ON MICHAEL.
6. Write session entry to `runtime/sessions/[timestamp]-[session-id].md`
7. Write event: `session_start` to `runtime/events/[date].log`
8. Write event: `task_claimed` to event log
9. Overwrite `runtime/sessions/_active.md` with pointer to session entry

**Maximum spawn overhead target:** 120 seconds of elapsed session time.
If reading startup artifacts takes longer, session is operating inefficiently.
Root cause is usually stale WORK_IN_PROGRESS.md or missing relay digest.

**Exit gate:** Session has identified its task and written its session entry.

---

## Phase 2: EXECUTE

**Trigger:** Spawn phase complete, task identified.

**Execution rules:**

1. **Single task focus.** Sessions do not context-switch between tasks mid-execution.
   If a higher-priority task is discovered, emit a RELAY.md noting the discovery
   and terminate cleanly. Do not abandon a partially-completed task silently.

2. **Commit cadence.** Commit after each discrete logical unit of work. Never let
   a session accumulate more than 3 uncommitted logical steps. If context is
   approaching limits, commit what exists, write handoff, terminate.

3. **Boot smoke gating.** Run `scripts/boot-smoke.sh` before every commit.
   If smoke fails, fix before committing. Never commit a failing smoke.

4. **File freeze discipline.** Never touch files in `files_frozen_for_this_branch`
   as listed in `runtime/branches/claude--implement-claude-design-ui-eFn9b.md`.
   Hard freeze violations require explicit Michael authorization.

5. **No autonomous scope expansion.** If a task reveals it requires work in
   adjacent scope not listed in the queue item, STOP. Add scope expansion to queue
   as a new task. Do not silently expand.

6. **WORK_IN_PROGRESS.md discipline.** Overwrite after every discrete step.
   The last write must reflect the exact state at session end so any cold-start
   session can resume.

**Context drift signals** (indicators session is losing coherence):

- Reading the same file more than twice in one session (re-orientation loop)
- Writing a file, then reading it back to verify (unnecessary if write succeeded)
- Generating code that contradicts earlier decisions made in the same session
- Asking clarifying questions about project context that CLAUDE.md or runtime/ answers

**Max session lifespan:** See `MICHAEL_ATTENTION_BUDGET.md`. Recommended hard cap:
4 hours of wall-clock time OR ~80% context consumption, whichever comes first.
Sessions exceeding this cap without a handoff are classified as stale.

**Exit gate:** Task is complete OR session has reached handoff threshold.

---

## Phase 3: STABILIZE

**Trigger:** Execution complete or handoff threshold reached.

**Required actions:**

1. Run boot smoke: `bash scripts/boot-smoke.sh`
2. Verify 27/27 pass. If not, fix failures before proceeding.
3. Commit all staged work with descriptive message.
4. Verify git working tree clean: `git status --short`
5. Overwrite `WORK_IN_PROGRESS.md` with exact current state.

**If task is complete:**
- Mark task `status: complete` in its queue file
- Record `completed_at` timestamp

**If mid-task handoff (context limit approaching):**
- Mark task `status: in_flight` in queue file (do NOT mark complete)
- Document exact stopping point in WORK_IN_PROGRESS.md
- Document what the NEXT session must do first to resume

**Exit gate:** Boot smoke 27/27, working tree clean, WORK_IN_PROGRESS.md current.

---

## Phase 4: SUMMARIZE

**Trigger:** Stabilize phase complete.

**Purpose:** Generate the content that will populate the handoff packet and relay digest.
This phase is internal — no files written yet, no commits yet.

**Required content to produce:**

1. One-sentence task summary (what was done)
2. List of all files changed this session
3. List of decisions made (that affect future sessions)
4. List of discoveries (unexpected findings that change understanding)
5. Next task recommendation (with task-id if queue item exists)
6. Michael action items (or explicit NONE)
7. Boot smoke result
8. Relay digest (50-line compressed version of above)

**Stale handoff detection:**

A handoff is stale if:
- It references files that no longer exist at the stated paths
- Its `next_task` ID is not in the current queue
- Its `branch_tip` SHA doesn't match `git log --oneline -1`
- Its timestamp is > 72 hours old without a newer handoff existing

If reading a handoff that appears stale, write an event log entry:
`[timestamp]  stale_handoff  [session-id]  reason=[reason]`
Then fall back to reading WORK_IN_PROGRESS.md + BUILD_PLAN_CLAUDE.md for context.

**Exit gate:** All 8 content items above produced internally.

---

## Phase 5: EMIT

**Trigger:** Summarize phase content complete.

**Required writes (in order):**

1. Write `runtime/handoffs/[timestamp]-[session-id].md` — full handoff packet
2. Overwrite `runtime/handoffs/_latest.md` — update pointer to new handoff
3. Write `runtime/handoffs/_relay.md` — relay digest (50 lines max) [Phase 4 feature, write when Phase 2 relay compression is active]
4. Write `runtime/sessions/[session-id].md` — update with `status: complete` and `ended_at`
5. Clear `runtime/sessions/_active.md` — set to `(no active session)`
6. Append to `runtime/events/[date].log`: `handoff_written` + `session_end` events
7. Update `runtime/queue/_index.md` if task status changed
8. Push branch: `git push -u origin claude/implement-claude-design-ui-eFn9b`

**Relay safe archival:**

Handoff packets are append-only archives. Never overwrite an existing handoff.
`_latest.md` is a pointer that always overwrites.
`_relay.md` always overwrites (it's a compressed cache, not an archive).

**Exit gate:** All 8 writes complete, git push succeeded.

---

## Phase 6: TERMINATE

**Trigger:** Emit phase complete.

**Actions:**

1. Report to Michael: session summary, next recommended action, any blocking items.
2. Session ends naturally. No explicit termination command.

**Termination is clean if:**
- Boot smoke 27/27 on final commit
- Handoff written and pointer updated
- Git push succeeded
- Michael has enough information to choose next action without reading runtime/ directly

**Termination is dirty if:**
- Session ends due to error/crash without emit phase
- Context limit hit before stabilize phase
- Michael terminates session mid-task

**Recovery from dirty termination:**

Next session reads WORK_IN_PROGRESS.md (most recent committed version), identifies
last known state, continues from there. If WORK_IN_PROGRESS.md is itself unclear,
reads BUILD_PLAN_CLAUDE.md task list and `git log --oneline -10` to reconstruct state.

---

## Bounded Worker Rules

A bounded worker is a session spawned to complete ONE specific, scoped task.
It differs from a hub session (which may orchestrate multiple tasks).

**Bounded worker constraints:**

1. Task scope must be defined before spawn. No open-ended "figure it out" sessions.
2. Files in scope must be listed explicitly in the queue item.
3. Session must not write to files outside its scope without recording a scope-expansion event.
4. Session must not spawn sub-sessions. (No sub-sub-agents — see ACCENTOS_PARALLEL_WORK_RULES.md)
5. Session must not modify files in `files_frozen_for_this_branch`.
6. Session may read any file in the repository.
7. Session emits a handoff at end regardless of whether task is complete.

**Bounded worker identification in session entry:**

```yaml
session_type: bounded_worker
task_id: r-01-prototype-hardening
scope_files:
  - ui/accentos-shell-prototype.html
scope_constraint: no production file writes
```

---

## Max Session Age

| Condition | Recommended max | Hard limit |
|-----------|----------------|------------|
| Standard bounded worker | 2 hours | 4 hours |
| Hub/orchestration session | 3 hours | 6 hours |
| Emergency hotfix | 1 hour | 2 hours |
| Documentation-only | 1 hour | 2 hours |

Sessions exceeding their hard limit are classified as stale.
Stale sessions should not be continued — emit handoff immediately and terminate.

---

## Context Drift Threshold

A session has drifted if it exhibits 3 or more of the following:

- Re-reading the same file more than once for orientation
- Generating output inconsistent with prior output in same session
- Asking questions that startup artifacts answer
- Producing code that contradicts the accentos-shell-prototype.html wrapper pattern
- Referencing a file path that doesn't match actual directory structure
- Forgetting a decision made earlier in the same session

Drift detection is self-reported. A session that detects its own drift should:
1. Re-read `runtime/handoffs/_latest.md`
2. Re-read WORK_IN_PROGRESS.md
3. Continue, noting drift in the handoff packet

---

## Protocol Version History

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-05-09 | Initial protocol |
