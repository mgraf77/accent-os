# QUEUE RUNTIME V0
# Minimum Viable Queue Runtime — Phone-First AI Orchestration
# Version: 0.1 | Date: 2026-05-09

---

## PURPOSE

Eliminate Michael relay overhead by defining explicit lifecycle, persistence,
and resumability rules for work items that span sessions, contexts, and
external gates. This is operational design only — no daemons, no engines.

---

## QUEUE ITEM LIFECYCLE

States: READY → RUNNING → DONE
             ↘ WAITING ↗
             ↘ FAILED → RETRY → RUNNING
                      ↘ DEAD

READY     Item has all required inputs. No blocking conditions. Can be claimed
          by the next available worker session.

WAITING   Item is blocked on an external condition (merge, review, deploy, etc).
          Worker session cannot proceed. Item yields back to queue.
          Condition must be named and testable before yielding.

RUNNING   Item has been claimed by a worker session. Session ID is recorded.
          Only one session owns a RUNNING item at a time.

DONE      Item completed successfully. Summary written. Worker terminates.

FAILED    Item attempted and errored. Error recorded. Retry counter incremented.
          Item moves to RETRY if retries remain, else DEAD.

RETRY     Waiting for retry delay to expire. On expiry → READY.

DEAD      Max retries exhausted. Requires manual override to requeue.

---

## DEFER CONDITIONS

An item enters WAITING when any named defer condition evaluates TRUE.

Defer condition must specify:
  - condition_id  (string, kebab-case, from DEFER_CONDITION_CATALOG)
  - check_method  (how to evaluate: poll / webhook / manual-confirm)
  - check_target  (what to query: PR url, deploy id, branch name, etc)
  - recheck_after (minimum minutes before rechecking)

Worker session MUST write defer state before terminating. If worker terminates
without writing defer state on a WAITING item, item is treated as FAILED.

---

## SESSION OWNERSHIP

- Each worker session gets exactly ONE queue item at a time.
- Session records: session_id, claimed_at, item_id.
- Session timeout: if no activity heartbeat for >30 min, item reverts to READY.
- Ownership is non-transferable mid-run. Complete or yield only.
- On session resume: read WORK_IN_PROGRESS.md, confirm item still RUNNING,
  confirm no newer session has claimed it, then continue.

---

## QUEUE PERSISTENCE RULES

Queue state lives in: docs/mvhb/queue/QUEUE_STATE.md (append-only log)
Active item live view: docs/mvhb/queue/ACTIVE_ITEM.md (overwritten each state change)
Completed items: docs/mvhb/queue/DONE_LOG.md (append-only)

Write order on state change:
  1. Write new state to ACTIVE_ITEM.md
  2. Append transition to QUEUE_STATE.md (timestamp + old_state + new_state + reason)
  3. Commit both files together with message: "queue: [item_id] [old]→[new]"

Never skip the commit. Queue state not committed = queue state lost.

---

## QUEUE REPLAY RULES

On session start, replay sequence:
  1. Read ACTIVE_ITEM.md — if RUNNING with current session_id, resume.
  2. If RUNNING with stale/different session_id and >30 min elapsed, reclaim.
  3. If WAITING, evaluate defer condition. If cleared → READY, claim it.
  4. If READY with no active item, claim next READY item by priority order.
  5. If nothing to do, report queue empty + last DONE item summary.

Replay must be idempotent. Running replay twice must not create duplicate work.

---

## FAILURE HANDLING

On FAILED:
  - Write error summary to item.error_log (one-liner: what failed, why, context)
  - Increment item.retry_count
  - If retry_count < item.max_retries: set state = RETRY, set retry_after timestamp
  - If retry_count >= item.max_retries: set state = DEAD, notify Michael

On DEAD:
  - Item is frozen. No automatic re-execution.
  - Michael must manually set state = READY and reset retry_count to requeue.
  - Dead item reason and context must remain readable.

---

## RETRY SEMANTICS

Default max_retries: 3
Default retry_delay: 10 min (exponential backoff: 10 / 20 / 40 min)

Retries are appropriate for:
  - Transient external failures (deploy not yet stable, PR check still running)
  - Network/tool timeouts
  - Race conditions on external state

Retries are NOT appropriate for:
  - Logic errors in the item definition
  - Missing inputs that won't appear without Michael action
  - Gate conditions that require human decision

For the second category, item should WAIT not RETRY.

---

## MANUAL OVERRIDE RULES

Michael can override any state transition via commit to ACTIVE_ITEM.md with
a manual: true flag and override_reason string.

Valid manual overrides:
  - DEAD → READY  (requeue dead item)
  - WAITING → READY  (force past a defer condition)
  - RUNNING → READY  (abandon a stuck session, reclaim item)
  - DONE → READY  (re-run a completed item, rare)
  - Any state → CANCELLED  (hard stop, no retry, archived)

Worker sessions must always check for manual override flag before assuming
current state is machine-set. If override detected, log it and honor it.

---

## BOUNDED EXECUTION GUARANTEE

Each worker session is time-bounded. Default session budget: 45 min.
At 40 min, worker must checkpoint progress and either:
  a) Complete the item if within 5 min of done
  b) Write partial progress to WORK_IN_PROGRESS.md and yield

A session that runs over budget without checkpointing is treated as FAILED.
Budget is intentional — prevents runaway sessions that block the queue.
