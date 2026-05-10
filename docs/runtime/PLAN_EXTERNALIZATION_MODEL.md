# PLAN EXTERNALIZATION MODEL — CONCEPTUAL MODEL

> Status: research only. No implementation, no schema creation, no orchestration code.
> Continues from `MINIMUM_VIABLE_RUNTIME_ARCHITECTURE.md`.
> Purpose: model what it means to externalize a *plan* — the agent's intent — out of
> session memory and into a durable representation that any process can resume,
> continue, and reason about.

---

## 1. THE PROBLEM PLAN EXTERNALIZATION SOLVES

In the current shape of AccentOS:

- The *intent* of any multi-step orchestration lives in the agent's session context.
- Artifacts the session produces (commits, log entries, doc updates) are visible
  *after* the session ends.
- The intent itself — the unrealized portion of the plan — is not.

When the session ends (turn finishes, window resets, tab closes, host crashes), the
unrealized portion of the plan is lost. A new session can read the artifacts and
*re-derive* a plan, but the new plan is the new session's plan, not the old one's.
The system has no way to distinguish "the prior plan was completed" from "the prior
plan was abandoned mid-execution."

Plan externalization is the practice of writing the plan into the durable store [A]
in a form that:

- a different process can read,
- continues to be valid after the authoring process dies,
- distinguishes completed steps from in-flight steps from pending steps,
- specifies the *legal next step* unambiguously.

When this exists, the agent stops being the runtime and becomes one possible *worker*
that executes the next legal step of an externally-stored plan. The plan outlives the
agent.

---

## 2. WHY SESSION MEMORY IS FUNDAMENTALLY INSUFFICIENT

This is the central claim of this document. Five compounding reasons:

### 2.1 Session memory is volatile by design
A context window is a working buffer, not a record. It is bounded, it resets, it can
be summarized and lose detail in the summarization, and it cannot be queried by
another process. Treating it as authoritative state is using a register as a database.

### 2.2 Session memory is not addressable
There is no stable identity for "the plan in session 42's context at minute 17." No
external process can reach in, read it, decide based on it, or hand it off. Anything
not addressable cannot be a source of truth.

### 2.3 Session memory cannot be observed without disturbing it
Reading session memory means *being in the session*. The act of inspection consumes
the same resource the work uses (context, model attention) and changes the trajectory
of the run. Observability requires a separate channel; session memory has none.

### 2.4 Session memory is not transactional
Updates to session memory happen as the model speaks. There is no atomic
"transition from in-flight to complete" that another process can rely on. The model
can mention completion mid-sentence and then fail to act on it; there is no
record-of-fact distinct from the speech act.

### 2.5 Session memory dies on every reset
Every context window has a finite life. Long-running plans, by definition, will
outlive at least one window. A plan whose representation is the window cannot be a
long-running plan — it is a series of short plans that re-derive each other and may
or may not converge.

These five are not solvable by "better summarization" or "more context." They are
properties of the substrate. The remedy is to move the plan out of the substrate
that has them.

---

## 3. WHY QUEUES ALONE ARE INSUFFICIENT

A common reaction to §2 is "store the to-do list in a queue." This is necessary but
not sufficient. A queue tells you *what's pending*. A plan tells you *why* and *in
what order* and *under what conditions a step becomes legal*.

A queue cannot, by itself, express:

- **Dependencies.** "Step C requires steps A and B both completed."
- **Conditional branches.** "If A's result is X, do B; if Y, do C."
- **Joins.** "Step D requires the outputs of A, B, and C."
- **Budgets that span multiple units.** "This whole plan may consume at most $X."
- **Compensation paths.** "If step E fails after F succeeded, run F-compensate."
- **Rationale.** "We are doing this sequence because [decision]."

Without these, two failure modes appear:

1. **Out-of-order execution.** A worker pulls "step C" from the queue while A is
   still in flight, because the queue did not know C depended on A.
2. **Lost coherence on resumption.** A replacement worker sees pending units but
   cannot tell whether they belong to the same intent or to multiple stale intents.

A queue is the *delivery mechanism* for legal-next-step work units. The plan is the
*structure* that determines which units are legal next.

---

## 4. THE SMALLEST VIABLE EXTERNALLY-STORED ORCHESTRATION REPRESENTATION

The smallest representation that is genuinely sufficient — not a placeholder — has
this conceptual shape:

### 4.1 A plan is a directed acyclic graph (DAG) of work units
Nodes are work units. Edges are dependencies (step B depends on step A's success).
Cycles are not permitted in the plan; iteration is expressed by spawning new plans
from a node, not by edges back to earlier nodes.

### 4.2 Each work unit has, at minimum:
- **Stable ID.** Globally unique within the substrate.
- **Plan ID.** Which plan this unit belongs to.
- **Type.** What kind of action it represents (well-known string referencing a worker
  capability).
- **Payload.** Typed input data sufficient for the worker to execute, with no
  reference to "the conversation so far."
- **Idempotency key.** A value such that two attempts with the same key produce the
  same external state, no matter how many times the unit is executed.
- **Dependencies.** IDs of units that must be in `complete` status before this one
  becomes legal.
- **Status.** One of: `pending`, `legal`, `leased`, `complete`, `failed`,
  `dead-letter`, `cancelled`.
- **Attempts.** Integer count of execution attempts so far.
- **Lease.** Worker ID + lease_until timestamp, present iff status = `leased`.
- **Checkpoint.** Latest progress record within this unit, if any.
- **Result.** Typed output, present iff status = `complete`.
- **Failure detail.** Typed error record, present iff status = `failed` or
  `dead-letter`.

### 4.3 Each plan has, at minimum:
- **Stable ID.**
- **Title and rationale** (free text — for humans, not for execution logic).
- **Author identity.** Which process or operator authored the plan.
- **Status.** `draft`, `active`, `paused`, `complete`, `cancelled`, `failed`.
- **Budgets.** Wall-clock, cost, action-count, reach, recursion — declared up front,
  read by the worker, enforced at the gate.
- **Governance class.** Which gate policy applies to side effects in this plan.

### 4.4 Required transition rules
- A unit becomes `legal` exactly when all its dependencies are `complete`.
- A worker may lease only `legal` units.
- A unit's status transitions are atomic in [A].
- A failed unit moves to `dead-letter` after N attempts; the rest of the plan
  proceeds or halts per a declared policy.
- A plan's status reflects the aggregate of its units.

This is the smallest representation that supports:

- multiple workers picking up legal next steps in parallel,
- crash recovery via lease expiry without double-execution,
- resumption from any point by any process that can read the substrate,
- bounded execution via plan-level budgets,
- coherent rollback / compensation by walking the DAG.

Anything smaller — e.g. "a list of pending tasks" — will hit one of the failure modes
in §3 within the first non-trivial use.

---

## 5. WORK-UNIT SEMANTICS

A work unit is **data, not code**. The worker that executes it interprets the unit
based on its `type` field, mapping to a capability the worker advertises. This
matters because:

- Multiple worker instances of the same capability can execute the same unit type.
- A unit can be authored by an agent that is not currently running.
- A unit can be inspected, edited (within constraints), or cancelled by the operator
  without starting the worker.

Work-unit lifecycle, atomically transitioned in [A]:

```
pending  →  legal  →  leased  →  complete
                  ↘           ↘  failed → (dead-letter | retry-as-new-attempt)
                              ↘  cancelled
```

Important properties:

- **`pending → legal`** is automatic when dependencies become `complete`. No worker
  action; the substrate computes it (a view, a trigger, a periodic compute — the
  mechanism is implementation, the property is required).
- **`legal → leased`** requires lease acquisition: an atomic write that sets
  `lease.worker_id` and `lease.until` only if the unit was in `legal` status.
- **`leased → complete`** requires checkpoint+result to be durably written before the
  status transitions, so a crash mid-transition either keeps `leased` (lease will
  expire and unit returns to `legal`) or reaches `complete`.
- **`leased → failed`** requires failure detail to be durably written before the
  status transitions.
- **Lease expiry** is not a status; it is a property of `leased` units whose
  `lease.until` has passed. Expired leases do not change status — the unit becomes
  re-leasable, and a new acquisition overwrites the lease.

Work units are short. A unit that takes longer than minutes should be split, because
long units lengthen the worst-case lease and increase wasted work on crash.

---

## 6. ORCHESTRATION CONTINUITY

Continuity means the *intent* of the plan survives discontinuities in the executors.
Operationally:

1. The plan is in [A] from the moment it transitions from `draft` to `active`.
2. From that moment, no worker, supervisor, agent, or operator is required to be the
   *same* across the plan's lifetime.
3. A crash, restart, host migration, or operator change does not invalidate the
   plan.
4. The next legal step is computable from [A] alone.

The continuity test (restated from `DURABLE_RUNTIME_SUBSTRATE.md` §7): kill every
process touching the plan. Start a fresh worker process from a clean host. Hand it
substrate credentials and nothing else. It must be able to:

- enumerate the plans currently `active`,
- for each, list units in each status,
- identify the legal next steps,
- lease one and execute it correctly.

If yes, continuity exists. If "the worker also needs the original conversation" or
"the worker needs to ask the operator what was intended" — continuity does not exist
and the plan is still partially in session memory.

---

## 7. IDEMPOTENCY CONCEPTS

Idempotency is the property that an action can be performed any number of times with
the same external effect as performing it once. It is the load-bearing property that
makes "retry on failure" safe.

Three layers of idempotency relevant here:

### 7.1 Unit-level idempotency
The whole work unit, retried, produces the same external state. Implemented by
attaching an idempotency key to every external side effect the unit performs.

### 7.2 Step-level idempotency
Within a multi-step unit, each step is individually idempotent, so resuming from a
checkpoint after a crash mid-step is safe.

### 7.3 Boundary idempotency
At the boundary between worker and external system (DB write, email send, payment),
the external system is asked to dedupe based on the idempotency key. Many do this
natively (e.g. unique constraints, "Idempotency-Key" headers); some require the
worker to implement it as "check-then-act in a transaction."

**Key generation:** keys must be:

- **Stable across attempts.** The same unit retried generates the same key.
- **Unique across units.** Two different units never share a key, even if they do
  similar work.
- **Independent of clock.** A key that includes "now" is a different key on retry.

Common pattern: `idempotency_key = hash(plan_id + unit_id + side_effect_index)`.

A unit without idempotency keys on its side effects must remain non-retried on any
attempt that may have side-effected, which means crash mid-unit either loses the work
or risks duplication. There is no third option.

---

## 8. LEASES

A lease is a time-bounded, exclusive claim on a unit, recorded in [A]. Properties:

- **Atomic acquisition.** Two workers attempting to lease the same `legal` unit
  result in exactly one acquisition; the loser sees the unit as `leased` and tries
  another.
- **Bounded TTL.** Every lease has an expiry. No "until I say so" leases.
- **Renewable by the holder.** A worker that needs more time can extend its own
  lease, provided it still holds it. Extension is itself an atomic operation
  conditional on continued ownership.
- **Expirable independently.** A lease can expire even if the worker is alive but
  hung; the substrate is the source of truth on lease expiry, not the worker.
- **Implicit release on success or failure.** Transition to `complete` or `failed`
  releases the lease.
- **Reclaim is not steal.** When an expired lease is reacquired by a new worker, the
  prior worker's writes are no longer authoritative. If the prior worker eventually
  comes back, it must check that it still holds the lease before writing.

Leases are the mechanism that makes "the worker died" recoverable: the lease expires,
the unit becomes legal again, a new worker leases it. Without leases, a dead worker's
unit either blocks forever (pessimistic) or gets double-executed (optimistic).

---

## 9. RETRIES

Retry policy is *per failure class*, not global. From `DURABLE_RUNTIME_SUBSTRATE.md`
§8:

- **Transient.** Retry with backoff, bounded attempts, same idempotency key.
- **Deterministic.** Do not retry. Move to dead-letter.
- **Catastrophic.** Halt the worker; do not retry; alert.

For unit-level retries:

- Each retry increments `attempts`.
- After `max_attempts` (declared per unit type or per plan), the unit moves to
  `dead-letter`.
- Backoff is per-retry, not per-unit (a unit retried 3 times waits 1s, then 4s, then
  16s, etc., not 1s every time).
- Backoff state lives in [A] so it survives worker restart.

A "retry forever" policy is a synonym for "we did not classify failures." Almost
always wrong.

---

## 10. DEAD-LETTER CONCEPTS

A dead-letter is the destination for units that have exceeded their retry budget or
been explicitly classified as deterministically failed. Properties:

- **Visible to the operator** in [E].
- **Inert** — workers never lease dead-letter units.
- **Inspectable** — the failure detail and full unit state are preserved.
- **Re-injectable** by operator action — moved back to `pending` after the underlying
  cause is fixed.
- **Bounded** — a runaway plan that produces hundreds of dead-letter units triggers
  an alert and a plan-level halt; it does not fill the substrate silently.

The dead-letter is the substrate's escape valve. Without it, a poison unit cycles
through workers, crashing each in turn. With it, the failure is contained to the
unit and the operator is notified.

A common mistake: treating dead-letter as "the failures we don't have to deal with."
Dead-letter that is never reviewed becomes a silent backlog of work the system was
asked to do and didn't.

---

## 11. RESUMABILITY

Resumability is the composite property: a plan in flight can be picked up by a new
worker, on a new host, after an arbitrary outage, and continue correctly.

It is the AND of:

- Plan externalized (this document).
- Lease semantics (§8).
- Checkpoints within units (§7 of `MINIMUM_VIABLE_RUNTIME_ARCHITECTURE.md`).
- Idempotency at side-effect boundaries (§7).
- Failure classification (§9).
- Audit log of transitions (`DURABLE_RUNTIME_SUBSTRATE.md` §3).

Missing any one of those collapses resumability:

| Missing                | What breaks                                                   |
|------------------------|---------------------------------------------------------------|
| External plan          | Replacement worker doesn't know intent                         |
| Lease semantics        | Either lost work or duplicated work after worker death         |
| Checkpoints            | Multi-step units restart from beginning, possibly redoing side effects |
| Idempotency            | Retries corrupt external state                                 |
| Failure classification | Bad units retry forever or good units quit too early           |
| Audit log              | Operator cannot diagnose what went wrong                       |

Resumability is therefore not a feature you build last — it is a property that
emerges only when all six are present together. Building five and "we'll add the
sixth later" produces a system that *appears* resumable until it isn't.

---

## 12. LEGAL NEXT-STEP EXECUTION

The unit of progress in this model is: *execute one legal next step, atomically, with
checkpoint and lease management*. The contract for a worker:

```
loop:
   1. ASK the substrate for a legal unit matching my capabilities.
   2. ATOMICALLY lease it (CAS on status legal → leased).
   3. EXECUTE the unit's logic, writing checkpoints after each
      step with side effects.
   4. On success: write result, transition to complete (releasing lease).
   5. On failure: classify; write failure detail; transition to
      failed or back to legal (with attempts incremented).
   6. RELEASE lease.
   7. Heartbeat to supervisor.
   8. Repeat.
```

The worker holds *no plan state*. It holds the current unit only, briefly. Between
units, the worker is stateless. This is what makes the worker disposable, which is
what makes restart survivability possible, which is what makes unattended execution
possible.

A worker that holds *plan state* between units — caching, "remembering what it just
did," carrying conversation context forward — is partially in session memory, and the
properties in §2 reassert themselves. The discipline is hard precisely because the
agent is built around carrying context forward; that strength becomes a substrate
liability when the agent is acting as a worker.

---

## 13. SUMMARY

Plan externalization is the act of moving the *intent* of orchestration out of the
session and into the substrate. Session memory cannot be a substrate for five
compounding reasons; queues alone cannot carry intent because they lack dependency,
condition, and budget structure. The smallest viable representation is a typed DAG
of work units with stable IDs, idempotency keys, lease-able status, and plan-level
budgets — operated on through atomic transitions in the durable store. Once this
exists, the agent stops being the runtime and becomes one possible worker among
many, and the plan can survive any single executor's death. Until this exists, the
agent *is* the plan, and "session ends" means "plan ends."
