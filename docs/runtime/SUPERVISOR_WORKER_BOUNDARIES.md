# SUPERVISOR / WORKER BOUNDARIES — CONCEPTUAL MODEL

> Status: research only. No implementation, no daemon, no supervisor creation.
> Continues from `MINIMUM_VIABLE_RUNTIME_ARCHITECTURE.md` and
> `PLAN_EXTERNALIZATION_MODEL.md`.
> Purpose: define the boundary between *supervisor* and *worker* — what each owns,
> what each must never own, and what stays under human authority indefinitely
> regardless of how mature the runtime becomes.

---

## 1. WHY THE BOUNDARY MATTERS

Most failures of "autonomous systems" are not failures of execution — they are
failures of *boundary*. A worker that owns its own restart will eventually decide
not to restart. A supervisor that executes work will eventually crash mid-execution
and take supervision with it. A worker that approves its own gate will eventually
approve everything.

The supervisor/worker boundary is the smallest set of separations that prevents these
failure modes from being possible in the first place. The boundary is *structural*,
not advisory — when it is implemented as advice (a comment, a convention, an
operating rule), it will be violated under pressure.

This document describes the boundary at the conceptual level. It does not specify
process model, language, or platform — those are downstream of the conceptual
boundary being clear.

---

## 2. SUPERVISOR RESPONSIBILITIES

A supervisor's complete responsibility set:

### 2.1 Worker lifecycle
- Bring up workers per declared policy (count, capability, host).
- Detect worker death (heartbeat absence beyond TTL, or process exit on shared host).
- Restart per declared strategy (one-for-one, temporary, etc.).
- Stop workers cleanly on operator drain.

### 2.2 Health surface
- Maintain a current health record in [A] readable by the operator pane.
- Record start, restart, and stop events as audit transitions.
- Expose: which workers are currently registered, their last heartbeat, what they
  are leasing, restart counts since last operator reset.

### 2.3 Backoff and crash budgeting
- Apply backoff between restarts so a crash-looping worker does not consume
  resources indefinitely.
- After N restarts in T window, mark the worker class as `circuit-broken` and stop
  restarting; alert operator.

### 2.4 Drain coordination
- Accept operator drain command.
- Stop new lease acquisition by workers (by setting a substrate flag workers check
  before leasing).
- Wait for in-flight units to complete or lease-expire.
- Stop workers and report completion.

### 2.5 Operator interface
- Accept operator commands (start, stop, drain, restart-class) through the
  substrate or a narrowly-scoped admin channel.
- Refuse commands outside its scope.

That is the complete list. A supervisor's surface area is small *by design*. Every
additional responsibility added to a supervisor reduces the strength of the
boundary, because each additional responsibility is another way the supervisor can
fail.

---

## 3. WORKER RESPONSIBILITIES

A worker's complete responsibility set:

### 3.1 Heartbeat
- Register on startup with capabilities and identity.
- Emit heartbeat to substrate at a defined interval.
- Stop heartbeating on shutdown so supervisor knows it is gone intentionally.

### 3.2 Lease acquisition
- Query substrate for `legal` units matching its capabilities.
- Atomically acquire a lease (CAS on status).
- Honor lease TTL; renew if needed; release on completion or failure.

### 3.3 Execution
- Read the unit's payload.
- Execute the unit's steps, writing checkpoints after each step with side effects.
- Pass irreversible side effects through the governance gate, not around it.
- Honor unit and plan budgets; halt cleanly when a budget is exhausted.

### 3.4 Reporting
- On success: write result; transition unit to `complete`.
- On failure: classify (transient/deterministic/catastrophic); write failure detail;
  transition to `failed` (with retry) or `dead-letter`.
- Always release lease on terminal transition.

### 3.5 Honest withdrawal
- On `catastrophic` failure: stop the worker; let the supervisor restart.
- On budget exhaustion at plan level: mark the plan `paused`; stop pulling units
  from that plan until operator action.
- On lease loss (e.g. clock skew, expired lease reacquired by another worker):
  abandon the unit's writes, do not commit further; let the new lease holder proceed.

That is the complete list. A worker is a small, stateless-between-units, single-unit
executor. It does not retain plan state, does not start other workers, does not
approve gates, does not edit the plan.

---

## 4. ORCHESTRATION AUTHORITY

Orchestration authority is *the right to decide what happens next at the plan level*
— activate a plan, pause it, cancel it, reorder its units, edit its budgets,
authorize its compensation paths.

| Authority                  | Held by                      | Justification                                              |
|----------------------------|------------------------------|------------------------------------------------------------|
| Author a plan              | Agent OR operator            | Both can compose intent; both authorings are audited        |
| Activate a plan (draft → active) | Operator (initially) | Activation commits the substrate to executing; should be approved |
| Pause an active plan       | Operator OR supervisor (on circuit-break) | Halt is always safe; should be available widely  |
| Resume a paused plan       | Operator                     | Resumption commits to continuing; needs authority           |
| Cancel a plan              | Operator                     | Final, requires explicit choice                             |
| Edit a plan in flight      | Operator only                | Editing intent under a running worker is high-risk          |
| Edit budgets in flight     | Operator only                | Budget changes alter blast radius                           |
| Re-inject dead-letter unit | Operator                     | Confirms underlying cause has been resolved                 |
| Compute legal next step    | Substrate (deterministic)    | Not a decision — a derivation from current state           |
| Lease the next legal unit  | Worker                       | This is execution, not orchestration                        |

**Principle:** orchestration authority is *plan-shaping authority*. It belongs with
the operator (with audited agent authoring as input), never with the worker. A
worker that can edit the plan it is executing has crossed the authority boundary in
the most dangerous direction, because plan-shaping is exactly the lever a
runaway worker would reach for to escape its bounds.

---

## 5. RESTART AUTHORITY

Restart authority is *the right to decide that something dead should be brought back
up*.

| Restart of...                   | Authority         | Notes                                              |
|---------------------------------|-------------------|----------------------------------------------------|
| Worker (after detected death)   | Supervisor        | Per declared restart strategy                      |
| Worker (after circuit-break)    | Operator          | Circuit-breaker is a flag; only operator clears it |
| Supervisor (after death)        | Platform init     | Supervisor does not restart itself                 |
| Plan execution (after pause)    | Operator          | Resumption is authority, not automation            |
| Unit (after dead-letter)        | Operator          | Re-injecting confirms the failure cause is fixed   |

**Principle:** restart authority sits *one level above* the thing being restarted. A
worker does not restart itself. A supervisor does not restart itself. A plan does
not unpause itself. The level above provides the second observer that says "yes,
bring it back."

Self-restart is dangerous because the entity that died is the entity that decided
death conditions. If it died at a wrong time, it will decide to restart in a state
that re-creates the problem.

---

## 6. ESCALATION AUTHORITY

Escalation authority is *the right to involve a higher level of attention* — operator
notification, alerting, halting the plan, halting the runtime.

| Escalation type              | Triggered by                          | Audience               |
|------------------------------|---------------------------------------|------------------------|
| Unit moved to dead-letter    | Worker (during failure handling)      | Operator inbox         |
| Plan paused on budget        | Worker                                 | Operator inbox         |
| Worker circuit-broken        | Supervisor                             | Operator alert         |
| Catastrophic substrate error | Supervisor or worker                   | Operator urgent        |
| Gate denial pattern          | Governance gate                        | Operator inbox         |
| Audit invariant violation    | Substrate (e.g. orphaned lease found)  | Operator alert         |

**Principle:** escalation is always *toward the operator*, never *away from*. A
worker cannot decide that an alert is unimportant. A supervisor cannot suppress a
circuit-break to avoid bothering the operator. Escalation suppression is itself an
operator-only authority.

The opposite anti-pattern: a runaway loop discovers it can clear its own alerts.
That is a substrate failure, not a feature.

---

## 7. BOUNDED EXECUTION AUTHORITY

Bounded execution authority is *the right to set the limits within which work
happens* — wall-clock, cost, action-count, reach, recursion budgets.

| Set by    | When                | Scope                          |
|-----------|---------------------|--------------------------------|
| Operator  | Plan creation       | Plan-level budgets             |
| Operator  | Policy update       | Class-level defaults           |
| Substrate | Per-attempt         | Per-attempt timeout, derived   |
| Worker    | Never (raise)       | A worker may *honor* a budget; never *raise* one |
| Worker    | At unit exit        | Report consumption back to substrate              |
| Supervisor| Never (per-plan)    | Supervisor sets only worker-class concurrency, not plan budgets |

**Principle:** budget-setting authority is upstream of the worker. A worker that
exceeds its budget halts; it does not extend. A supervisor that wants more workers
on a class can scale concurrency, but cannot raise a plan's wall-clock or cost
budget. Only the operator can raise budgets, because raising a budget is altering
blast radius.

The escape hatch — "this run needs more time, please" — is a *gate request* that
the operator must approve. It is not a worker-side override.

---

## 8. CRASH CONTAINMENT

Crash containment is the property that a failure at one level does not propagate to
adjacent levels. Each level has a containment contract:

### 8.1 Unit crashes contained at the worker
A unit that crashes (exception, timeout, OOM during execution) marks the unit
`failed` and leaves the worker alive. The worker proceeds to its next lease.

### 8.2 Worker crashes contained at the supervisor
A worker that dies (process exit, heartbeat timeout) is detected by the supervisor.
The supervisor restarts a replacement under policy. The supervisor itself remains
alive. Other workers remain alive.

### 8.3 Supervisor crashes contained at the platform init
A supervisor that dies is restarted by the platform's init system. Workers continue
running until they need supervision (heartbeat, restart). They do not crash because
the supervisor died.

### 8.4 Substrate degradation contained at the runtime
A substrate outage causes workers to fail to lease, fail to checkpoint, or fail to
transition. They halt cleanly with `catastrophic` classification rather than
write garbage. The supervisor halts new starts. Recovery is operator-initiated
after substrate is restored.

**Principle:** at every level, the answer to "what happens if this dies?" is *the
level above notices and recovers*. There is no level for which the answer is
"everything below dies too" — that would be a *cascading failure*, which is what
crash containment exists to prevent.

---

## 9. FAILURE ISOLATION

Failure isolation is the spatial counterpart to crash containment. It is the
property that a failure of *one instance* does not affect *peer instances*.

- One unit failing does not affect other units.
- One worker failing does not affect other workers.
- One plan failing does not affect other plans.
- One operator's mistake does not corrupt another operator's plans (when there are
  multiple operators).

Required mechanisms:

- **Per-unit isolation:** workers handle one unit at a time, transactionally; a
  unit's writes are atomic.
- **Per-worker isolation:** workers do not share in-process state; they share only
  through [A].
- **Per-plan isolation:** plan-level budgets and gates apply to that plan only;
  there is no global "everything halts because plan X failed" unless the substrate
  itself is the failure.
- **Per-operator isolation:** when multi-operator, plans and audit are scoped by
  authoring identity.

A system without failure isolation amplifies any single failure. The early signs
are subtle ("when X happens, Y also seems off") and the late signs are
catastrophic.

---

## 10. STATE OWNERSHIP

State ownership answers: *who is allowed to write this?*

| State                           | Owner (writer)        | Readers           |
|---------------------------------|-----------------------|-------------------|
| Plan structure                  | Plan author / operator| All               |
| Plan status                     | Substrate (derived)   | All               |
| Unit status                     | Worker (transitions)  | All               |
| Lease                           | Worker (acquire/release) | All           |
| Checkpoint                      | Worker holding lease  | All               |
| Result                          | Worker holding lease  | All               |
| Audit transitions               | Append-only by all    | All               |
| Worker registration / heartbeat | The worker itself     | Supervisor, operator |
| Worker liveness derivation      | Supervisor (derived)  | All               |
| Restart count, circuit-break    | Supervisor            | Operator          |
| Gate decisions                  | Governance gate       | All               |
| Policy / budgets                | Operator              | All               |
| Identity registry               | Operator              | All               |

**Principle:** every piece of state has *exactly one writer*. Multiple writers to a
single field create races the substrate cannot resolve. The audit log is the only
"many writers, one purpose" surface, and it is append-only — concurrent appends
don't conflict.

A field with ambiguous ownership is a substrate bug. The right resolution is to
split the field into single-writer pieces or to assign one owner explicitly.

---

## 11. WHAT MUST NEVER BE WORKER-CONTROLLED

These are properties or decisions that a worker must *structurally* be unable to
control. Not "discouraged from" — *unable to*.

| Must not be worker-controlled                  | Why                                                    |
|------------------------------------------------|--------------------------------------------------------|
| Its own restart                                | Self-restart bypasses circuit-breaking                 |
| Other workers' lifecycle                       | Worker-spawning workers loses the supervision tree     |
| Its own budget (raising it)                    | Removes blast-radius bound                             |
| Plan structure (editing dependencies, budgets) | Bypasses orchestration authority                       |
| Plan activation (`draft → active`)             | Activation is operator commitment                      |
| Plan cancellation                              | Cancellation is final, requires authority              |
| Gate policy (which gates apply)                | Workers requesting gates cannot also set them          |
| Bypass of a gate                               | Bypass authority belongs to the operator at the gate   |
| Suppression of escalation                      | Workers cannot decide alerts are unimportant           |
| Audit-log mutation (edit/delete past entries)  | Audit must be append-only                              |
| Identity assertions (claiming to be another)   | Identity is assigned, not chosen                       |
| Substrate schema or policy changes             | Workers operate within the substrate, not on it        |
| Credential issuance or rotation                | Credential authority is operator + dedicated tooling   |

A runtime where a worker *can* do any of these — even if it currently doesn't —
is a runtime where the boundary depends on the worker's good behavior. Boundaries
that depend on good behavior are not boundaries; they are hopes.

---

## 12. WHAT MUST REMAIN GOVERNANCE-GATED

These action classes pass through [D] regardless of substrate maturity. They never
become "autonomous" in the sense of "no gate" — they become autonomous only in the
sense of "the gate's policy may, at maturity, allow human-on-loop instead of
human-in-loop":

- Outbound communication to humans (email, SMS, posts, public comments).
- Money movement (charges, refunds, transfers, paid integrations, ad spend).
- Production deploys.
- Schema migrations.
- Credential issuance, rotation, or revocation.
- Permission changes.
- Mass operations (above declared thresholds).
- Vendor-account-affecting operations on third-party platforms.
- Destructive git operations on shared branches.
- Data deletion or overwrite without versioning.

The gate may evolve from "operator approves each one" to "operator can interrupt
within T minutes" to "operator reviews aggregate" — but a gate is always present.
"No gate" for any of these classes is not a maturity milestone; it is a substrate
that has stopped honoring its own constraints.

---

## 13. WHAT SHOULD REMAIN HUMAN-AUTHORIZED INDEFINITELY

Distinct from §12 (which says "always passes through a gate"), §13 names the
operations that should require *direct human action* indefinitely — no
human-on-loop, no time-window auto-approve, no "automatic if invariant passes."

- **Hiring/firing-equivalent permission changes** (granting or removing roles like
  Owner/Admin in user management).
- **Substrate-level credential creation** (new database service-account keys, new
  third-party API tokens with broad scope).
- **Policy edits** (which gates apply to which classes; what budgets are default).
- **Operator identity changes** (adding/removing operators, redefining authority).
- **Migrations to a new substrate** (changing the durable store of record).
- **Decommissioning** (any operation whose intent is to stop the runtime
  permanently).
- **Acceptance of legal/contractual terms** with vendors, customers, or partners.
- **Spending above an operator-set ceiling** even within an approved budget.

These are operations whose blast radius is the *trust framework* that the runtime
is built within, not within the runtime itself. Automating them — even with great
gates — invites a class of failure where a runaway runtime restructures the trust
framework that was supposed to constrain it.

The conservative posture: a runtime should never be able to expand its own
authority, even with operator approval, except through a path that takes the
operator out of the runtime entirely (e.g. a separate admin tool with its own
credentials).

---

## 14. THE BOUNDARY DIAGRAM (SUMMARY)

```
                    ┌─────────────────────────┐
                    │       OPERATOR          │
                    │  (humans, indefinitely  │
                    │   for §12 + §13 ops)    │
                    └────────────┬────────────┘
                                 │ authority flows DOWN
                                 ▼
                    ┌─────────────────────────┐
                    │     PLATFORM INIT       │
                    │  (restarts supervisor)  │
                    └────────────┬────────────┘
                                 │ restart authority
                                 ▼
                    ┌─────────────────────────┐
                    │       SUPERVISOR        │
                    │  (worker lifecycle      │
                    │   only — §2)            │
                    └────────────┬────────────┘
                                 │ restart authority
                                 ▼
                    ┌─────────────────────────┐
                    │        WORKER(S)        │
                    │  (lease/execute/        │
                    │   checkpoint/release    │
                    │   only — §3)            │
                    └────────────┬────────────┘
                                 │ requests pass UP
                                 ▼
                    ┌─────────────────────────┐
                    │   GOVERNANCE GATE       │
                    │  (intercepts §12 ops)   │
                    └────────────┬────────────┘
                                 │ to external systems
                                 ▼
                          (irreversible side effects)


       Escalation flows UP at every level.
       Authority flows DOWN at every level.
       No level may grant itself authority it doesn't have.
       No level may suppress escalation from below.
```

---

## 15. SUMMARY

The supervisor/worker boundary is structural, not advisory. The supervisor owns
lifecycle and nothing else; the worker owns execution and nothing else;
orchestration authority sits with the operator with audited agent input; restart
authority sits one level above whatever is being restarted; escalation only flows
upward; budgets are set upstream of the worker; crash containment and failure
isolation are properties at every level; state ownership is single-writer per
field. Certain action classes (§12) are always gated regardless of maturity, and
certain classes (§13) require direct human action indefinitely so the trust
framework that contains the runtime cannot be restructured by the runtime itself.
A runtime that softens any of these boundaries softens the whole boundary system,
because the boundaries depend on each other.
