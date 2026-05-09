# BOUNDED WORKER PATTERN
# Version: 0.1 | Date: 2026-05-09

---

## PURPOSE

Define the spawn → execute → summarize → terminate lifecycle for worker
sessions. A bounded worker is the unit of execution in the MVHB queue.
It is not a daemon, not an agent, not an engine. It is a single-item,
time-bounded, summarize-on-exit session.

---

## CORE PRINCIPLE

One worker. One item. One session. Terminate clean.

A worker that doesn't terminate is not a bounded worker. It is a daemon.
This pattern explicitly forbids daemons.

---

## PHASE 1: SPAWN

Trigger: Michael provides a prompt referencing a queue item, or session
         start detects a READY item in ACTIVE_ITEM.md.

Actions:
  1. Read WORK_IN_PROGRESS.md — if a prior session left a partial,
     that item has priority. Resume it rather than spawning fresh.
  2. Read ACTIVE_ITEM.md — confirm item is READY and unclaimed.
  3. Claim the item: set status = RUNNING, write own session_id and
     claimed_at timestamp.
  4. Commit: "queue: [item_id] READY→RUNNING"
  5. Read item inputs in full before beginning work.

Spawn guard — do NOT spawn if:
  - Item is WAITING (conditions not cleared)
  - Item is DEAD (requires manual override)
  - Item is RUNNING with a session_id <30 min old (another session owns it)
  - Inputs reference files or branches that don't exist yet

---

## PHASE 2: EXECUTE

The worker does the work defined by the item.

Rules during execution:
  - Stay within session_budget_min (default 45 min)
  - At 40 min, evaluate: complete now or checkpoint
  - If a defer condition triggers mid-execution, yield immediately:
      a) Write current progress to WORK_IN_PROGRESS.md
      b) Update ACTIVE_ITEM.md: status = WAITING, defer fields populated
      c) Commit: "queue: [item_id] RUNNING→WAITING (reason)"
      d) Terminate — do not wait for condition to clear in same session
  - If an error occurs:
      a) Write error to item.error_log
      b) Set status = FAILED
      c) Commit: "queue: [item_id] RUNNING→FAILED (reason)"
      d) Terminate
  - Do not take actions outside the item's scope
  - Do not queue new items mid-execution (that is the summarize phase)

Execution artifacts go to:
  - Code changes: committed to the relevant branch
  - Docs: committed to docs/
  - References: recorded in item.result.output_refs

---

## PHASE 3: SUMMARIZE

Required before DONE. This is not optional.

Summary must answer:
  1. What was done (one paragraph, plain english)
  2. What changed (file list or PR url)
  3. What is the state of the system after this item (is it shippable?)
  4. What the next logical item is (worker recommends, Michael decides)

Summary length: 3–6 sentences. Not a novel. Not a bullet dump.
Write to: item.result.summary

If the item's work revealed new work:
  - Do NOT create new queue items automatically
  - Do record the recommendation in the summary
  - Michael decides whether to queue them

---

## PHASE 4: TERMINATE

Actions:
  1. Set item status = DONE
  2. Set item.result.summary (from Phase 3)
  3. Append item to DONE_LOG.md
  4. Clear ACTIVE_ITEM.md (write next READY item, or write "queue empty")
  5. Commit: "queue: [item_id] RUNNING→DONE"
  6. Print terminal status block (see format below)
  7. Stop. Do not begin next item without a new session trigger.

Termination is not failure. It is the designed end state.
A worker that auto-spawns the next item is an orchestration daemon.
This pattern forbids that.

---

## STATUS BLOCK FORMAT

Print at termination (DONE, FAILED, or DEAD):

```
WORKER COMPLETE
item:     [item_id]
status:   [DONE | FAILED | DEAD]
duration: [minutes elapsed]
output:   [one-line summary]
refs:     [file or PR or deploy url if any]
next:     [recommended next item title or "none identified"]
```

---

## SESSION BUDGET ENFORCEMENT

45 min is the default session budget.

At 40 min elapsed:
  - If within 5 min of completion: finish and terminate.
  - If not near completion: checkpoint to WORK_IN_PROGRESS.md,
    yield item back to READY, terminate.

Checkpointing to WORK_IN_PROGRESS.md:
  - Write: what was completed, what remains, which file was last modified,
    any state assumptions the next session needs to know.
  - Format: must be readable by a cold-start session in 30 seconds.

---

## WHAT A BOUNDED WORKER IS NOT

NOT a daemon             — does not run between items
NOT an autonomous agent  — does not decide its own scope
NOT an orchestrator      — does not spawn other workers
NOT an event listener    — does not poll or react to events mid-sleep
NOT a monitor            — does not watch deploys or CI in background
NOT self-extending       — does not negotiate its own budget

If you find yourself building any of the above, stop.
The pattern is: one item, one session, terminate clean.

---

## FAILURE TO TERMINATE

If a worker session ends without reaching DONE, FAILED, or explicit WAITING:

  - Item remains RUNNING with session_id
  - After 30 min timeout, item reverts to READY automatically (via replay rule)
  - Next session that claims it should check WORK_IN_PROGRESS.md for context
  - The prior session is logged as "abandoned" in QUEUE_STATE.md

Abandoned sessions are not errors in themselves. They are recoverable.
The only unrecoverable termination is leaving ACTIVE_ITEM.md in a corrupt
or ambiguous state without a commit — which is why every state change
requires an immediate commit.

---

## PATTERN SUMMARY

spawn      Read item. Claim it. Commit.
execute    Do the work. Yield on block. Checkpoint at budget limit.
summarize  Write what changed, what's next, is it shippable.
terminate  Set DONE. Write status block. Stop.
