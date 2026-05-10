# DURABLE RUNTIME SUBSTRATE — CONCEPTUAL MODEL

> Status: research only. No implementation, no daemon, no scheduler, no runtime mutation.
> Purpose: define what a TRUE durable orchestration substrate would require for AccentOS
> *before* adaptive routing, unattended queues, session resumption, or any swarm concept
> can be safely entertained.

---

## 1. WHAT QUALIFIES AS A RUNTIME

A "runtime" — in the sense required for durable orchestration — is **not** a script, a
loop, a session, a hook, or a chat agent. It is a system with all of the following
properties simultaneously:

1. **Independent process identity.** It exists as a named, addressable process (or
   process group) whose lifecycle is decoupled from any human session, terminal, or
   chat window.
2. **External lifecycle owner.** Something *other than itself* (an init system, a
   supervisor, a platform scheduler) is responsible for starting it, restarting it on
   crash, and shutting it down on policy.
3. **Externalized state.** All state required to resume work after a crash lives in
   durable storage that survives the process — not in RAM, not in a chat transcript,
   not in a local file the process itself owns exclusively.
4. **Idempotent work units.** Every unit of work it performs can be safely re-attempted
   without corrupting downstream state, because crash-mid-work is the normal case, not
   the exception.
5. **Observable from outside.** Health, progress, queue depth, and last-checkpoint can
   be read by an external observer without interrupting the runtime.
6. **Bounded blast radius.** Its authority over external systems is explicitly scoped
   and revocable without touching the runtime's own code.

If any of those six are missing, what you have is a *loop*, a *script*, or an
*orchestrated session* — not a runtime. (See `RUNTIME_VS_LOOP_DISTINCTION.md`.)

---

## 2. LIFECYCLE OWNERSHIP

Durable runtimes do not own their own lifecycle. The lifecycle is owned by a
**supervisor** — a strictly simpler process whose only job is:

- Start the runtime when the platform boots.
- Detect when the runtime has died (heartbeat absence, exit code, crash).
- Restart it under a defined backoff policy.
- Stop it on operator command without losing in-flight work.
- Surface its status to a place a human can see without logging into the runtime.

Lifecycle ownership is the single property most often faked by AI orchestration
systems. A chat session that "keeps running tasks" is *the runtime supervising itself*,
which is structurally identical to having no supervisor at all — when it dies, nothing
notices.

**Required separation:** supervisor and runtime are in different processes, ideally on
different failure domains. The supervisor's death must not kill the runtime, and the
runtime's death must be detected by the supervisor within a bounded interval.

---

## 3. PERSISTENCE REQUIREMENTS

A durable substrate persists at minimum:

| Layer            | What lives here                                            | Survives           |
|------------------|------------------------------------------------------------|--------------------|
| Work queue       | Pending units of work, with status + attempt count         | Process restart    |
| Checkpoint store | Last-known-good progress per long-running unit             | Process restart    |
| Lease / lock     | "Who currently owns this work item, until when"            | Process restart    |
| Audit log        | What happened, when, by whom, with what input/output hash  | Indefinitely       |
| Configuration    | Routing rules, capability map, governance policy           | Process restart    |
| Identity         | Stable IDs for runtimes, queues, work units, operators     | Indefinitely       |

**Hard rule:** none of these may live in the runtime's own memory or in a file the
runtime alone writes. The store must be reachable by *a different* process so a
replacement runtime can pick up where the dead one left off.

For AccentOS this means: Supabase (or equivalent durable store) is the substrate of
record. A markdown file in the repo is **not** durable substrate — it is a *log*, not a
*queue*. (See "fake runtime signals" in `RUNTIME_VS_LOOP_DISTINCTION.md`.)

---

## 4. SUPERVISION REQUIREMENTS

Supervision is a tree, not a flag. The minimum tree:

```
[platform init] → [supervisor] → [runtime worker(s)] → [work units]
```

Each level has exactly one responsibility:

- **Platform init:** start the supervisor; restart it if it dies.
- **Supervisor:** start workers; restart them; expose health.
- **Worker:** lease a work unit; execute it; checkpoint; release lease.
- **Work unit:** is data, not code. It describes what to do, not how.

Failure is contained at the lowest level that can handle it. A failing work unit must
not kill the worker. A failing worker must not kill the supervisor. A failing
supervisor must not take down the platform.

**Restart strategies** (named, configurable, not invented per-runtime):

- *one-for-one:* restart only the failed child.
- *one-for-all:* restart all siblings (use only when state is shared).
- *rest-for-one:* restart the failed child and everything started after it.
- *temporary:* do not restart; mark dead.

Choosing the wrong strategy silently is worse than having no strategy.

---

## 5. RESTART SEMANTICS

Three properties must hold across any restart:

1. **No work is lost.** A work unit that was leased but not completed becomes
   re-leasable after its lease expires. Nothing requires the dying process to "hand
   off" cleanly.
2. **No work is double-applied to externals.** Side effects on external systems (DB
   writes, emails, payments, deploys) are guarded by idempotency keys or transactional
   outboxes. Replaying a unit produces the same external state, not a duplicate.
3. **Progress is visible.** Restart is observable: there is a record of *which*
   process died, *when*, *with what unit leased*, and *who* picked it up.

A runtime that can crash and silently lose a unit fails restart semantics. A runtime
that can crash and silently send the same email twice also fails.

---

## 6. QUEUE DURABILITY

A durable queue is not a list. It has at minimum:

- **Enqueue with fsync semantics.** The producer's "enqueued" return is only true once
  the unit is on disk in the durable store, not just in a buffer.
- **Visibility timeout / lease.** A consumer "takes" a unit by acquiring a lease with a
  TTL. If it dies, the lease expires and the unit becomes available again.
- **Attempt counter + dead-letter.** After N failed attempts, the unit moves to a
  dead-letter location for human inspection — it does not retry forever.
- **Ordering guarantees stated explicitly.** FIFO, per-key FIFO, or unordered — pick
  one and document it. "Mostly FIFO" is not a guarantee.
- **Poison-pill protection.** A unit that consistently crashes the worker is moved to
  dead-letter rather than crashing every replacement worker in turn.

A markdown file with checkboxes is none of these things. A Supabase table with a
`status`, `lease_until`, `attempts`, and `dead_letter_at` column can be all of them, if
the access pattern enforces the rules — which is a substrate concern, not a UI concern.

---

## 7. ORCHESTRATION CONTINUITY

Continuity is the property that the *intent* of a multi-step plan survives:

- The death of the agent that authored it.
- The death of the worker executing it.
- The end of the chat session that triggered it.
- The migration of the substrate to a new host.

This requires the plan itself to be a durable artifact — a graph of work units with
declared dependencies, stored in the same durable store as the queue. "The plan lives
in Claude's context window" is the canonical anti-pattern: when the window resets, the
plan is gone, and any partial execution becomes orphaned side effects.

**Continuity test:** kill the orchestrator mid-plan. A different orchestrator process,
started from cold, reading only the durable store, must be able to determine: which
steps completed, which are in flight, which are pending, and what the next legal action
is. If it cannot, continuity does not exist.

---

## 8. FAILURE RECOVERY

Failure recovery distinguishes three failure classes and treats them differently:

1. **Transient (network blip, rate limit, lock contention).** Retry with backoff,
   bounded attempts, same unit, same idempotency key.
2. **Deterministic (bad input, schema mismatch, logic bug).** Do not retry. Move to
   dead-letter. Surface to operator. Retrying will fail forever and burn the queue.
3. **Catastrophic (substrate down, credentials revoked, disk full).** Halt the runtime,
   sound an alarm, do not consume more units. A runtime that keeps draining a queue
   into a broken downstream is a damage amplifier.

Conflating these — "just retry on any error" — is how durable systems become unreliable
faster than non-durable ones, because they retry forever.

---

## 9. CRASH RECOVERY

Crash recovery is the "cold start from a corpse" path:

1. Supervisor detects dead worker (heartbeat timeout or process exit).
2. Supervisor records the crash with timestamp, last-known-checkpoint, leased unit IDs.
3. Lease TTLs on the dead worker's units expire, returning units to the queue.
4. Supervisor starts a replacement worker.
5. Replacement worker reads its assignment from the durable store, *not* from any prior
   process's memory.
6. Replacement worker resumes from the last checkpoint of any in-flight unit it picks
   up, not from the beginning.

The test: pull the power on the host. The system, after reboot, converges to a correct
state without human intervention beyond restarting the platform. Anything less is not
crash recovery — it is "graceful shutdown plus hope."

---

## 10. CHECKPOINT SEMANTICS

A checkpoint is a durable, atomic record of progress within a single work unit, written
*after* a step's external side effects are confirmed and *before* the next step
begins. Properties:

- **Atomic.** Either fully written or not written. No half-checkpoints.
- **Monotonic.** A later checkpoint supersedes an earlier one for the same unit.
- **Resumable.** The replacement worker can read the checkpoint and know exactly which
  step to attempt next.
- **Idempotent at the boundary.** The step *after* the checkpoint is idempotent,
  because crash-between-checkpoint-and-next-step is the normal case.

Checkpoint frequency is a tradeoff: too frequent is overhead, too rare is wasted work
on restart. The right frequency is "after any step whose redo is expensive or has
external side effects."

A "save the conversation transcript" pattern is *not* a checkpoint. Checkpoints are
structured progress records keyed by work unit ID, not freeform logs.

---

## 11. MINIMUM VIABLE SUBSTRATE

Before any of the following can be safely attempted:

- adaptive routing
- unattended queues
- session resumption
- durable orchestration
- future swarm concepts

…the substrate must provide, at minimum:

| # | Capability                          | Why it gates everything above                              |
|---|-------------------------------------|------------------------------------------------------------|
| 1 | External durable work queue         | Without it, nothing survives session end                   |
| 2 | Lease + visibility timeout          | Without it, a crash either loses or duplicates work        |
| 3 | Idempotency keys on side effects    | Without them, retries corrupt external state               |
| 4 | Externally-owned process supervisor | Without it, "the runtime" is just the chat session         |
| 5 | Heartbeat + crash detection         | Without it, dead workers hold leases forever               |
| 6 | Dead-letter + bounded attempts      | Without them, poison units burn the system                 |
| 7 | Audit log of unit transitions       | Without it, recovery is guesswork                          |
| 8 | Stable identity for units + workers | Without it, you cannot reason about who did what           |
| 9 | Operator stop / drain control       | Without it, you cannot safely pause for repair             |
|10 | Governance gate on irreversible ops | Without it, autonomy expansion is unbounded blast radius   |

This list is the floor, not the ceiling. Anything calling itself "durable orchestration"
that is missing items 1–6 is misnamed. Items 7–10 are the difference between a
prototype substrate and one that can be operated.

---

## 12. CURRENT DISTANCE FROM MATURITY (estimate)

Against the 10-item floor above, AccentOS today (read from repo state, not asserted):

| # | Capability                          | State           | Notes                                                          |
|---|-------------------------------------|-----------------|----------------------------------------------------------------|
| 1 | External durable queue              | partial         | Supabase exists; PROMPT_QUEUE.md is a markdown log, not a queue|
| 2 | Lease + visibility timeout          | absent          | No lease semantics anywhere                                    |
| 3 | Idempotency keys                    | absent          | Side effects are not keyed                                     |
| 4 | External process supervisor         | absent          | "Runtime" = chat session + Stop hooks                          |
| 5 | Heartbeat + crash detection         | absent          | Nothing watches for "did the orchestrator die"                 |
| 6 | Dead-letter + bounded attempts      | absent          | Failures become silence or repeated retry by hand              |
| 7 | Audit log of transitions            | partial         | SESSION_LOG / PROMPT_LOG are human-facing, not unit-keyed      |
| 8 | Stable identity for units + workers | partial         | Vendor IDs exist; orchestration units have no IDs              |
| 9 | Operator drain control              | absent          | No "stop accepting new work" primitive                         |
|10 | Governance gate on irreversible ops | partial         | `CLAUDE.md` rules exist; not machine-enforced                  |

**Distance estimate:** roughly **2 of 10** floor capabilities present in partial form;
**0 of 10** present in durable form. AccentOS today is a *file-based orchestration
log*, not a runtime substrate. The gap to "minimum viable durable substrate" is large
and structural, not incremental.

This is not a criticism — it is the correct stage for the project. The risk is acting
*as if* the substrate exists when planning autonomy expansion.

---

## 13. THE SINGLE HARDEST UNSOLVED SUBSTRATE PROBLEM

**Externalizing the orchestrator's own state.**

Queues, leases, idempotency, dead-letter — these are well-understood and can be modeled
on top of Supabase without exotic infrastructure. The hard problem is different:

> The current "orchestrator" is a Claude Code session. Its working memory is the chat
> context window. When the session ends, the plan in flight ends with it. No
> replacement process can pick it up because the plan was never written down in a form
> a different process could read and continue from.

To fix this, the *plan itself* must become a durable artifact — a typed, versioned,
machine-readable graph of intent stored externally — and the orchestrator must be
rewritten to read its next action from that artifact rather than from its own context.

This is hard because it changes what "an agent" is: from "a session that decides what
to do next" into "a process that executes the next legal step of an externally-stored
plan and writes back the result." Every existing skill, hook, and prompt assumes the
former. Migrating to the latter is the substrate problem, and nothing else on the
roadmap is real until it is solved.

---

## 14. SUMMARY

A durable runtime substrate is defined by what survives a crash, not by what runs on a
good day. AccentOS today has the components of a logging system and a workflow
notation, not a runtime. The path to a substrate is conceptually clear (this document)
but structurally significant; it is not unlocked by adding features to the current
loop. It is unlocked by externalizing lifecycle, state, and plan from any single
process — including the agent itself.
