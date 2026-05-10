# MINIMUM VIABLE RUNTIME ARCHITECTURE — CONCEPTUAL MODEL

> Status: research only. No implementation, no daemon, no queue creation.
> Continues from `DURABLE_RUNTIME_SUBSTRATE.md`, `RUNTIME_VS_LOOP_DISTINCTION.md`,
> `SAFE_AUTONOMY_CONSTRAINTS.md`.
> Purpose: define the smallest architecture that can legitimately host durable
> queues, restart survivability, bounded unattended execution, session resumption,
> and supervised workers — and explicitly separate *useful tooling* from *true
> runtime substrate*.

---

## 1. WHAT THIS DOCUMENT IS — AND IS NOT

This is a description of the *minimum* shape of architecture that earns the word
"runtime." Anything smaller than what is described here is tooling. Tooling can be
excellent and valuable; it is not a substrate. The distinction matters because plans
built on tooling-as-if-substrate fail in predictable ways (catalogued in
`RUNTIME_VS_LOOP_DISTINCTION.md` §3).

This document is *not*:

- A build plan. There is no order-of-implementation in here.
- A vendor selection. The model is substrate-agnostic.
- A green light. The conclusion is that AccentOS does not yet have this architecture
  and should not pretend it does.

---

## 2. THE FIVE COMPONENTS OF THE MINIMUM RUNTIME

A minimum viable runtime architecture has exactly five components, each with one
responsibility, each separated by a clear boundary:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [A] DURABLE STORE                                                      │
│      The single source of truth: queue, leases, checkpoints, plans,     │
│      audit log, governance policy, identity registry.                   │
│      Survives any process death. Readable by every other component.     │
└─────────────────────────────────────────────────────────────────────────┘
            ▲                       ▲                       ▲
            │                       │                       │
┌───────────┴──────────┐  ┌─────────┴──────────┐  ┌─────────┴──────────┐
│  [B] SUPERVISOR      │  │  [C] WORKER(S)     │  │  [E] OPERATOR PANE │
│   - starts workers   │  │   - lease a unit   │  │   - read state     │
│   - detects death    │  │   - execute        │  │   - approve gates  │
│   - restarts         │  │   - checkpoint     │  │   - drain / stop   │
│   - exposes health   │  │   - release lease  │  │   - inspect audit  │
└───────────┬──────────┘  └─────────┬──────────┘  └────────────────────┘
            │                       │
            ▼                       ▼
       ┌────────────────────────────────────┐
       │  [D] GOVERNANCE GATE               │
       │   - intercepts irreversible ops    │
       │   - requires authority to pass     │
       │   - logs every approval / denial   │
       └────────────────────────────────────┘
```

| # | Component         | One-line responsibility                                              |
|---|-------------------|-----------------------------------------------------------------------|
| A | Durable store     | Hold all state that must survive any process                         |
| B | Supervisor        | Own the lifecycle of workers; nothing else                            |
| C | Worker(s)         | Lease, execute, checkpoint, release — repeat                          |
| D | Governance gate   | Stand between workers and irreversible side effects                   |
| E | Operator pane     | Let a human read state and grant authority without entering the runtime|

A system missing any one of A–D is not a runtime. (E can be primitive — even an admin
SQL view counts — but its absence means the runtime is not operable.)

**Critical:** these five are *processes*, *roles*, or *layers*, not files. Five
markdown files do not constitute this architecture. Five rows in a database do not
either. The word "component" here means something with its own lifecycle, identity,
and failure mode.

---

## 3. THE GATING ARCHITECTURE — WHAT EACH CAPABILITY REQUIRES

The five components above are necessary but the *combinations* matter. Each higher-
order capability requires a specific subset to be present and *honest*:

| Capability                       | Requires components present | Requires properties                                  |
|----------------------------------|-----------------------------|------------------------------------------------------|
| Durable queues                   | A                           | Lease + visibility timeout + atomic transitions      |
| Restart survivability            | A + B                       | Heartbeat + crash detection + lease expiry           |
| Bounded unattended execution     | A + B + C + D               | Budgets declared per-run, enforced at gate boundary  |
| Session resumption               | A + C                       | Plan externalized; worker reads next step from store |
| Supervised workers               | A + B + C                   | Supervisor not in same process as worker             |

A capability claimed without its prerequisite components is fictional. A capability
claimed with its prerequisite components present *but not honest* (e.g. a "lease" that
isn't actually atomic) is worse than fictional — it is misleading.

---

## 4. REQUIRED RUNTIME BOUNDARIES

The runtime is defined as much by what it *separates* as by what it contains. Six
boundaries must hold:

### 4.1 State boundary
All state required to resume work lives in [A], not in [B] or [C]. A worker that
holds plan state in its own memory has crossed this boundary in the wrong direction.

### 4.2 Lifecycle boundary
[B] owns when [C] starts and stops. [C] never restarts itself or another worker.
[C] never starts [B]. The chain only points one way.

### 4.3 Authority boundary
[D] sits between [C] and irreversible side effects. [C] cannot perform an
irreversible op without going through [D]. [C] cannot decide to "skip the gate this
once."

### 4.4 Process boundary
[B] and [C] are different processes, ideally on different failure domains. A bug that
crashes [C] must not crash [B]. A network blip that isolates [B] must not silently
remove supervision of [C].

### 4.5 Identity boundary
Every entity — worker, supervisor, work unit, lease, checkpoint, gate decision — has
a stable identity in [A]. References are by ID, not by position-in-list or
"the current one."

### 4.6 Observation boundary
[E] reads from [A], not from [B] or [C]. The operator's view of the system is the
view *through the substrate*, because that is the view that survives a worker dying
mid-display.

Violation of any of these six boundaries collapses the runtime back into a loop with
extra steps.

---

## 5. MINIMUM PERSISTENCE MODEL

The store [A] must, at minimum, hold these *typed* records (named here conceptually,
not as a schema):

| Record class        | Holds                                                          | Mutated by                |
|---------------------|----------------------------------------------------------------|---------------------------|
| Plan                | Graph of intended work units + dependencies + budgets          | Plan author (rare)        |
| Work unit           | One node of a plan; status, attempts, idempotency key, payload | Worker via lease          |
| Lease               | Who currently owns a unit, until when                          | Worker (acquire/release)  |
| Checkpoint          | Progress within a unit, atomic, monotonic                      | Worker                    |
| Audit transition    | Append-only record of every status change                      | Anything that mutates     |
| Worker registration | Identity, capabilities, heartbeat, last-seen                   | Worker (heartbeat)        |
| Gate decision       | Request, requester, decider, outcome, timestamp                | Governance gate           |
| Policy              | What gates apply to which action classes; budgets per class    | Operator (rare)           |

**Required properties of the store:**

- **Atomic per-record transitions.** A status change either happens fully or not at all.
- **Read-your-writes.** A worker that wrote a checkpoint and immediately re-reads it
  sees the new value, even after a crash and restart.
- **Append-only audit.** Audit transitions cannot be edited or deleted by any normal
  path. (Compliance/repair paths exist but are themselves audited.)
- **Outside the worker's process.** No worker holds the only copy of any record.

**Hard rule:** if a record exists *only* in a worker's memory, a chat context, or a
file the worker alone writes, it does not count toward this model.

---

## 6. MINIMUM SUPERVISION MODEL

Supervision is a tree, not a flag. The minimum tree depth is two:

```
[platform init]  →  [supervisor]  →  [worker(s)]
```

The supervisor's contract is small and fixed:

1. **Start.** Bring up workers per declared policy (count, capabilities).
2. **Detect.** Notice when a worker has died (heartbeat absence past TTL, or process
   exit if same-host).
3. **Restart.** Bring up a replacement under a backoff policy.
4. **Drain.** On operator command, stop accepting new leases; let in-flight units
   complete or expire; then stop workers.
5. **Report.** Maintain a current health record in [A] readable by [E].

The supervisor's contract is also defined by what it does *not* do:

- It does not execute work units.
- It does not approve gate decisions.
- It does not edit plans.
- It does not interpret the substrate beyond worker registrations and heartbeats.

A supervisor that does *anything* on the "does not" list is a worker in disguise, and
its death takes down both supervision and execution at once — the failure mode the
boundary exists to prevent.

**Restart strategy** must be declared per-worker-class:

- *one-for-one* — restart only the failed worker. Default for stateless workers.
- *temporary* — do not restart; mark dead. Default for one-shot batch workers.
- *one-for-all* / *rest-for-one* — only when workers share state or order matters.
  These are rare and must be justified.

A supervisor that does not declare its strategy is using the default, and the default
must be *one-for-one*, because anything else is surprising.

---

## 7. MINIMUM CHECKPOINT MODEL

A checkpoint is the answer to the question: *if this worker died right now, what is
the latest point a replacement could safely resume from?*

Minimum properties:

1. **Keyed by work unit ID.** Not by worker, not by session, not by timestamp.
2. **Atomic write to [A].** A checkpoint is either fully visible or not visible.
3. **Monotonic.** A later checkpoint for the same unit supersedes an earlier one.
4. **Resumable.** A replacement worker reading the checkpoint can determine *exactly*
   which step to attempt next, with no ambiguity.
5. **Written after side-effect confirmation.** A checkpoint records progress only
   after the side effect of the just-completed step is durable in its target system,
   so re-running from the checkpoint does not redo a side effect that already
   succeeded.

**Frequency:** after every step whose redo is expensive or whose side effect is
external. More often is acceptable; less often risks wasted work on restart.

A "checkpoint" that is a free-form log entry, a chat transcript, or a markdown bullet
is not a checkpoint — it cannot answer the resumption question deterministically.

---

## 8. MINIMUM ROLLBACK MODEL

Rollback is a *property of the action class*, declared before the class is permitted
unattended. The minimum model has four parts per action class:

1. **Detection.** How is a bad action recognized? (alarm, invariant, KPI drift,
   operator report)
2. **Containment.** How is further damage prevented while a decision is made? (drain
   the queue for that class, freeze the gate, revoke a credential)
3. **Reversal or compensation.** What is the actual undo, or — for irreversible-by-
   physics actions — what is the compensating follow-up that corrects the state?
4. **Resumption.** How does normal operation come back? (replay queued work past the
   bad point, repair the substrate, re-enable the gate)

**Rollback must be designed before the action class is enabled, not after the first
incident.** A class without a declared rollback path is a class that must remain
human-in-loop.

For irreversible-by-physics operations (sent emails, completed payments, public
deploys), "rollback" is misleading; the right word is *compensation*, and the
compensation must be planned in the same artifact as the original action.

---

## 9. THE SEPARATION — TOOLING vs SUBSTRATE

This is the most important section of the document. Many of AccentOS's existing
artifacts are *useful tooling* and not *runtime substrate*. The distinction is not a
judgment of value — it is a judgment of *what survives a crash and what does not*.

| Artifact / pattern                       | Tooling | Substrate | Notes                                                                  |
|------------------------------------------|---------|-----------|-------------------------------------------------------------------------|
| `PROMPT_QUEUE.md` (markdown queue)       | ✅      | ❌        | Human-readable list. No lease, no atomic transition, no attempt counter.|
| `WORK_IN_PROGRESS.md`                    | ✅      | ❌        | Single-writer scratchpad. Not a checkpoint.                             |
| `SESSION_LOG.md`, `PROMPT_LOG.md`        | ✅      | ❌        | Prose audit. Not unit-keyed.                                            |
| Stop hook re-running tasks               | ✅      | ❌        | Trigger, not a supervisor. Dies with its host.                          |
| Skills directory + `_index.md`           | ✅      | ❌        | Capability catalog. Does not decide *when* to invoke anything.          |
| `BUILD_PLAN_CLAUDE.md` checkboxes        | ✅      | ❌        | Plan-of-record for humans. Not a typed dependency graph.                |
| Git commit log                           | ✅      | ❌        | Audit of files, not of work units.                                      |
| Cloudflare Pages hosting                 | ✅      | ❌        | Deploys static output. Not a process supervisor.                        |
| Cloudflare Worker (anthropic-proxy)      | ✅      | partial   | Request-scoped execution. Not a long-lived supervised process.          |
| Supabase tables (vendor data)            | ✅      | partial   | Durable store exists. Not yet structured for queues/leases/checkpoints. |
| `.claude/CLAUDE.md` operating rules      | ✅      | ❌        | Documented policy. Not a machine-enforced governance gate.              |
| Codex / Claude Code session              | ✅      | ❌        | Execution context. Dies with its window. Not a worker.                  |

**Reading this table the right way:** every row marked ✅ in tooling is genuinely
useful and should not be removed. The danger is interpreting the rightmost column
generously — assuming a markdown queue is a queue, a Stop hook is a supervisor, or a
session is a worker. Those interpretations are the failure modes catalogued in
`RUNTIME_VS_LOOP_DISTINCTION.md` §3.

The substrate column is currently mostly empty. That is not a project failure — it is
the correct stage. The error would be acting *as if* the substrate column were full.

---

## 10. ESTIMATE: MINIMUM ARCHITECTURE SHIFT REQUIRED

Before *true unattended execution* (not "the agent ran a few steps while I was at
lunch" — actual unattended-overnight, recover-from-crash execution) exists, the
following architectural shift must occur:

### 10.1 Externalize the plan
The plan must move from chat context / markdown into a typed graph in [A], with
identities, dependencies, idempotency keys, and budgets. This is the largest
single shift; it changes what an "agent" is in this system.

### 10.2 Convert the queue from log to lease
`PROMPT_QUEUE.md` (or its successor) must move into [A] with lease semantics:
status, lease_until, attempts, dead_letter_at, idempotency key. The markdown can
remain as a human-readable view; it cannot remain as the source of truth.

### 10.3 Introduce a real supervisor
A separate process — not a hook, not a session — that owns worker lifecycle. This is
the first piece of new *infrastructure* (as opposed to new *documents*) that the
substrate strictly requires.

### 10.4 Introduce a worker process distinct from the agent session
A worker is a process that reads its next action from [A], executes one step,
checkpoints, and exits or loops. It is not a chat session. The agent may *act as*
a worker for a single step; it is not the worker.

### 10.5 Materialize the governance gate
Currently, governance is documented (in `CLAUDE.md`) but not interposed. A real
gate sits in code path between worker and irreversible action; bypass is structurally
prevented, not merely discouraged.

**Magnitude of shift:** this is a *re-foundation*, not a feature add. Estimating
loosely: each of the five shifts above is multiple weeks of design and build work,
*after* the design questions are answered. The current architecture cannot incrementally
become this architecture — the externalization of plan and lifecycle is a discontinuity.

The right stance is to build *toward* this architecture deliberately, while being
honest that the current state is pre-substrate.

---

## 11. THE SINGLE MOST DANGEROUS FAKE-RUNTIME TEMPTATION

> **"Adding more hooks and skills until it feels autonomous."**

Each individual hook and skill is sound. Each one expands what the system can do
*while a session is open*. None of them, alone or in combination, adds any of the
five required components in §2. Hooks are triggers, not supervisors. Skills are
capabilities, not work-unit executors. Their accumulation produces an experience that
*feels* like a runtime — more things happen automatically, more decisions are made
without being asked — while leaving the substrate fully unchanged.

This is dangerous specifically because the feedback loop rewards it: each new hook
or skill produces visible progress, and the substrate gap is invisible until an
unattended run goes wrong. The temptation is to keep adding capability rather than
to invest in the boring, infrastructural work of plan externalization, lease
semantics, and supervised processes.

**The discipline:** before adding the next hook or skill that would expand
unattended scope, ask: "does this depend on substrate properties we have, or
substrate properties we are pretending to have?" If the latter, the right next
move is substrate work, not capability work.

---

## 12. EARLIEST POINT WHERE RUNTIME SUPERVISION BECOMES MANDATORY

Runtime supervision (a real supervisor process owning worker lifecycle, not a hook
firing on session events) becomes *mandatory* — not advisory — at the first of these
thresholds:

1. **First overnight unattended run.** The moment a work unit is expected to execute
   while no human is at a screen, the operator-as-supervisor model has expired.
2. **First multi-step unit longer than a session window.** When a single unit's
   execution spans more than one session, "the session is the runtime" no longer
   works.
3. **First parallel worker.** Two workers acting on the same queue without lease
   semantics will collide; lease semantics require the durable store to enforce
   them, which only matters when something coordinates the workers — that something
   is the supervisor.
4. **First action class with irreversible side effect approved for unattended run.**
   The combination of "unattended" and "irreversible" requires both supervision
   (for crash detection) and governance gating (for blast-radius bound). Until
   this point, human-in-loop is the supervisor.
5. **First time a session crash leaves orphaned in-flight work.** Once this has
   happened, the cost of *not* having supervision has been demonstrated.
   Continuing without supervision after this point is choosing the same failure
   again.

Any one of these crossings is the trigger. They can each be crossed by accident,
which is why the discipline is to identify which one is closest and not cross it
without the supervisor being real *first*.

For AccentOS today: none of the five have been crossed in earnest. The window to
build supervision *before* the first crossing is open. After the first crossing,
supervision is being built in retrospect, which is harder and produces lower trust.

---

## 13. SUMMARY

The minimum viable runtime architecture is five components — durable store,
supervisor, worker, governance gate, operator pane — separated by six boundaries.
AccentOS today has rich tooling and no substrate; the gap is structural and the
shift to substrate is a re-foundation, not an increment. The dangerous temptation
is to mistake more hooks and skills for closing the gap. Supervision becomes
mandatory at the first overnight unattended run, the first cross-session unit, the
first parallel worker, the first irreversible unattended action, or the first
session-crash-orphans-work incident — whichever comes first. Build the supervisor
before that crossing, not after.
