# TRANSITION TO DURABLE RUNTIME — CONCEPTUAL MIGRATION PATH

> Status: research only. No implementation, no migration, no orchestration execution.
> Synthesizes: `DURABLE_RUNTIME_SUBSTRATE.md`, `RUNTIME_VS_LOOP_DISTINCTION.md`,
> `SAFE_AUTONOMY_CONSTRAINTS.md`, `MINIMUM_VIABLE_RUNTIME_ARCHITECTURE.md`,
> `PLAN_EXTERNALIZATION_MODEL.md`, `SUPERVISOR_WORKER_BOUNDARIES.md`.
> Purpose: model the safest *transition path* from current AccentOS (rich tooling,
> ~0 substrate) to a future durable orchestration substrate — staged,
> coexisting, and honest about what is incremental vs discontinuous.

---

## 1. THE TRANSITION PROBLEM, STATED PLAINLY

Today, AccentOS is a session-coupled tooling system: an agent in a chat session
holds the plan, executes steps, and writes artifacts. The artifacts are durable;
the plan, lifecycle, and supervision are not.

A durable substrate (per the prior six docs) is a different shape: plan
externalized as a typed DAG, work units leased from a queue with idempotency keys,
workers separated from the agent session, lifecycle owned by a supervisor,
irreversible side effects routed through a governance gate.

The transition is not a feature add. It is a re-foundation. The question is
not *whether* this will eventually be needed — that is settled in the prior
docs — but *how* to get there without:

- breaking the working tooling along the way,
- building a half-substrate that LOOKS durable but isn't,
- crossing the supervision-mandatory threshold (`MINIMUM_VIABLE_RUNTIME_ARCHITECTURE.md`
  §12) before the supervisor exists,
- expanding autonomy on top of fake substrate (the dangerous temptation in
  `MINIMUM_VIABLE_RUNTIME_ARCHITECTURE.md` §11).

This document describes a staged path that respects each of those constraints.

---

## 2. THE GUIDING PRINCIPLES

Five principles underlie every stage:

1. **Tooling stays useful while substrate is built.** The transition is not
   "tear out the markdown and replace with database." Existing artifacts (queue
   files, logs, hooks, skills) keep working as the human-facing layer; the
   substrate is built *underneath* them and gradually takes over the durability
   responsibility.
2. **Each stage is operationally honest.** At every stage, the documentation
   reflects what is actually durable vs what only appears so. No stage claims
   substrate properties it has not earned.
3. **Discontinuous shifts are isolated.** Some transitions are inherently a
   discontinuity (e.g. moving the plan out of the session). These are sequenced
   to happen one at a time, with the system stable on either side, never
   simultaneously.
4. **Reversibility before irreversibility.** New substrate components are first
   exercised on reversible action classes (file edits, internal data) before
   ever being trusted with irreversible ones (email send, payments, deploys).
5. **Supervision precedes unattended scope.** No expansion of unattended scope
   crosses any of the five mandatory-supervision thresholds without the
   supervisor existing as a real, separate process.

These are the rules. Every stage below complies.

---

## 3. WHAT CAN EVOLVE INCREMENTALLY

Some properties of the substrate can be added in small, reversible steps without
disrupting current operation:

- **Identity.** Adding stable IDs to plans, work units, and workers is purely
  additive. Existing markdown can carry IDs alongside checkboxes. The IDs become
  load-bearing only later; until then they are just metadata.
- **Audit log.** A unit-keyed transition log can begin appending alongside the
  existing prose logs. It does not replace anything; it accumulates record
  quality.
- **Idempotency keys.** Side-effect-producing operations (writes, sends, deploys)
  can begin attaching idempotency keys to their requests opportunistically. Most
  external systems either honor them or ignore them; nothing breaks.
- **Heartbeats.** A long-running session can begin emitting heartbeats to a
  durable record. Nothing currently consumes them; they become useful when a
  supervisor exists.
- **Capability registry.** A typed catalog of what each "skill" actually does,
  with input/output types, can be built alongside the existing free-form skills
  directory. It becomes the worker capability map later.
- **Governance policy as data.** The rules currently in `CLAUDE.md` can be
  extracted into a structured policy record (which classes, which gates, which
  budgets) without yet being machine-enforced. This is the seed of [D].
- **Operator pane (read-only).** A simple page or view over the durable store
  begins as "look at the audit log" and grows into the operator surface.

These can all happen in parallel with normal work. None of them require
discontinuity. None of them grant the project the right to claim substrate
maturity — they are *seeds*, not the substrate itself.

---

## 4. WHAT REQUIRES A DISCONTINUOUS ARCHITECTURE SHIFT

These cannot be added incrementally. Each is a discontinuity that requires the
system to be stable on either side, with a deliberate cutover.

### 4.1 Plan externalization
The plan moving from session context into a typed, externally-stored DAG is the
single largest shift. Before: the agent decides what's next from its memory.
After: the agent (or a worker) reads the next legal step from the substrate.
This changes what an "agent" is in the system. It cannot be done halfway —
either the substrate is the source of truth for "what's next," or it isn't.

### 4.2 Lifecycle externalization
The transition from "the session is the runtime" to "a separate supervisor owns
worker lifecycle" is a discontinuity. Before: when the session ends, the system
is gone. After: when the session ends, the supervisor and workers continue. The
midpoint — "sometimes the session is the runtime, sometimes the supervisor is" —
is the most dangerous half-state, because it confuses everyone about who is
responsible for what.

### 4.3 Queue conversion
Moving from `PROMPT_QUEUE.md` (a list-as-log) to a durable queue (lease + status +
attempts + dead-letter) is a discontinuity for any consumer that needs lease
semantics. The markdown can persist as a human-readable view, but the substrate
must be the writable source of truth — anything else creates two-sources-of-truth
divergence (see `SUBSTRATE_MIGRATION_RISKS.md`).

### 4.4 Worker process introduction
The first time a worker process — separate from the agent session, separate from
the supervisor — leases a unit and executes it, the project has crossed into
having a real worker. Before that moment, a "worker" is conceptual. After, it
is an actual process with its own lifecycle. Workers cannot exist halfway —
either there is a worker process, or there isn't.

### 4.5 Governance gate materialization
The transition from "documented rules in CLAUDE.md" to "code path that intercepts
irreversible operations and requires authority to pass" is a discontinuity. The
midpoint — "the gate exists for some operations but is bypassable for others" —
is unsafe because it trains the system to treat gates as advisory.

These five are not parallelizable. They should be sequenced one at a time, in
roughly this order, with each fully stable before the next begins.

---

## 5. STAGED EXTERNALIZATION

Externalization happens in five stages, not a single migration:

### Stage E0 — Identity-only (incremental)
- Stable IDs assigned to plans, work units, and workers.
- IDs appear in commit messages, log entries, and document headers.
- No substrate behavior changes; this is metadata accumulation.
- Reversible: stop assigning IDs and the system reverts to current shape.

### Stage E1 — Shadow plan externalization
- Active plans are written to the durable store *in parallel* with the markdown
  representation.
- The markdown remains the source of truth; the substrate copy is read-only and
  used for observation only.
- Discrepancies are flagged but not acted on; this is the calibration period.
- Reversible: stop writing the substrate copy.

### Stage E2 — Substrate plan as source of truth, markdown as view
- The substrate is now authoritative for plan state.
- A read-only markdown view is generated *from* the substrate for human
  comfort.
- Manual markdown edits are no longer respected; edits go through the substrate.
- Reversible only with operator action (re-promote markdown, freeze substrate).
- This is the first discontinuity. It requires a deliberate cutover.

### Stage E3 — Work units gain lease semantics
- Status, attempts, lease, idempotency key fields are present and respected.
- Workers (still possibly the agent acting as a worker) acquire leases before
  executing units.
- Crashes return units to `legal` via lease expiry rather than being abandoned.

### Stage E4 — Plans gain dependency structure
- Plans become typed DAGs with declared dependencies between units.
- The substrate computes `legal` automatically from completed dependencies.
- Conditional branches and joins are now expressible.

Each stage stabilizes before the next begins. Stage E1 is the longest — running
shadow externalization for weeks gives time to discover the gaps between what the
markdown encodes and what the substrate needs.

---

## 6. STAGED SUPERVISION INTRODUCTION

Supervision arrives in four stages:

### Stage S0 — Heartbeat-only (incremental)
- The current session emits a heartbeat record to the durable store.
- Nothing consumes it; the record is for future supervisor use.
- Reversible: stop emitting heartbeats.

### Stage S1 — Passive observer
- A separate process — *not* a supervisor yet — reads heartbeats and exposes
  "session alive / not alive" status to the operator pane.
- It does not start, stop, or restart anything. It only observes.
- This is the lowest-stakes way to validate that a separate process can read
  the substrate correctly.

### Stage S2 — Drain coordinator
- The same process gains the ability to set a "drain" flag in the substrate.
- Workers (or sessions acting as workers) check the flag before leasing new
  units.
- Operator can drain the system without entering it.
- Still no restart authority.

### Stage S3 — Real supervisor
- The process gains the ability to start and restart workers under declared
  policy.
- This is the moment runtime supervision becomes real, and is the second major
  discontinuity.
- It is sequenced *after* a worker process exists (see §7) so the supervisor has
  something to supervise.

The order S0 → S1 → S2 → S3 is deliberate. A supervisor that begins life with
restart authority is one whose first action might be wrong. Beginning as a
passive observer lets the operator build trust in its readings before granting
it authority.

---

## 7. STAGED WORKER SEPARATION

Worker separation happens in three stages, interleaved with supervision:

### Stage W0 — Agent-as-worker, single-step
- The current agent session continues to execute, but executes *one work unit
  at a time*, reading its next action from the externalized plan rather than
  its own memory.
- Between units, the agent re-reads the substrate. Plan state is not held in
  context.
- This is preparation; the agent is being shaped to *behave like* a worker so
  the eventual handoff is small.

### Stage W1 — External worker, narrow capability
- A separate process — minimal, single-capability — comes online and begins
  leasing units of a *single, reversible* type (e.g. file edits in a feature
  branch, internal data reads).
- The agent session continues handling everything else.
- The worker is exercised on low-stakes work for weeks before any expansion.

### Stage W2 — Worker fleet
- Additional worker capabilities come online, one at a time, each restricted to
  reversible action classes initially.
- Irreversible classes remain with the agent under operator supervision.
- The supervisor (now real, post-S3) manages worker lifecycle.

Workers are introduced *narrow first*, not *broad first*. A worker that can do
many things from day one is a worker whose failure modes are many; a worker
that can do one safe thing and demonstrably does it correctly is a worker that
can earn additional scope.

---

## 8. STAGED GOVERNANCE HARDENING

Governance gates harden in four stages:

### Stage G0 — Policy as data
- The rules currently in `CLAUDE.md` are extracted into a structured policy
  record (action class → gate type → budgets).
- Nothing enforces it yet; it is a declaration.

### Stage G1 — Advisory gate
- Workers and the agent consult the policy before performing actions.
- "Consult" means: log that the action would have hit gate X, then proceed
  anyway under operator supervision.
- This calibrates: are the gates well-defined? Do they fire on the right
  operations? Do they miss any?

### Stage G2 — Enforcing gate, narrow classes
- For a small, reversible-or-low-impact set of action classes, the gate becomes
  enforcing — workers cannot proceed without authority.
- Operator approves each one. This is human-in-loop on training wheels.

### Stage G3 — Enforcing gate, all listed classes
- Every action class in `SUPERVISOR_WORKER_BOUNDARIES.md` §12 is gated and
  enforced.
- Different gate types apply per maturity (human-in-loop for irreversible,
  human-on-loop for high-volume reversible, etc.).
- §13 classes (the indefinitely-human-authorized ones) are not in the gate at
  all — they are not in any code path the runtime can reach.

A gate that becomes enforcing for irreversible classes before any other class
has been gated is one that produces operator fatigue (constant approvals on
risky work) and learned helplessness on the bypass. Hardening from the inside
out — narrow before broad, reversible before irreversible — keeps the gate
genuinely respected.

---

## 9. THE COEXISTENCE PERIOD

Throughout stages E1–E3, S0–S2, W0–W1, G0–G2, two systems coexist:

- The **legacy tooling layer:** markdown queue, prose logs, hooks, skills, the
  agent session. Continues serving humans.
- The **substrate layer:** durable store, identity, lease semantics, audit log,
  passive observer, narrow worker, advisory gate.

Coexistence rules:

1. **Single source of truth per concern.** At any moment, exactly one system is
   authoritative for any given fact. Until E2, markdown is authoritative for
   plan state. From E2 onward, substrate is. The substrate is *always*
   authoritative for substrate-only concerns (leases, heartbeats, audit).
2. **Generated views, not double-writes.** When the operator sees plan state in
   markdown after E2, that markdown is generated from the substrate. The human
   does not edit it directly.
3. **No concurrent authority.** A unit is either being executed by the agent
   session or by a worker process — never both. The lease prevents this.
4. **Migration is per-class, not big-bang.** Action classes migrate from
   "agent only" to "worker eligible" one at a time, after the worker has
   demonstrated correctness on the prior class.
5. **Failure of substrate is operator-visible, not silent.** When a substrate
   write fails, the legacy system does not silently substitute. The failure
   surfaces to the operator pane.

The coexistence period is not a transition glitch — it is the safe state for a
significant fraction of the migration. Rushing through it is how half-substrate
states (see `SUBSTRATE_MIGRATION_RISKS.md`) get built.

---

## 10. WHAT MUST REMAIN HUMAN-MEDIATED LONGEST

Some operations remain operator-mediated beyond all other migration stages,
possibly indefinitely (full treatment in `HUMAN_IN_THE_LOOP_PERSISTENCE.md`):

- **Plan activation for any plan touching irreversible action classes.** Even a
  mature substrate should require explicit operator activation for plans whose
  units include outbound communication, money movement, or production deploy.
- **Authority changes** (new operator, new credential scope, new gate policy).
  These define the trust framework; the runtime cannot be allowed to redefine
  it.
- **Substrate migrations** (changing the durable store of record, schema
  evolutions). These are operations on the substrate itself, not within it.
- **Vendor account operations** that affect Accent Lighting's standing on
  third-party platforms.
- **Anything whose recovery cost exceeds the value of automating its
  approval.** A useful test: would a wrong autonomous decision here cost more
  to recover from than a human's hours of approval over a year? If yes,
  approval stays human.

The pattern: the more an operation defines the framework the runtime operates
within, the longer a human stays in the loop for it. Operations *inside* the
framework can become more autonomous over time; operations *on* the framework
should not.

---

## 11. THE SUGGESTED SEQUENCE (CONCEPTUAL ORDER, NOT CALENDAR)

A defensible order, with each stage stable before the next begins:

```
   E0 ──┐                            (identity, parallel-safe)
   S0 ──┤  ← incremental seeds, weeks   (heartbeats)
   G0 ──┘                            (policy as data)
        │
   E1 ──┘  ← shadow externalization, weeks
        │
   E2  ────  ← FIRST discontinuity: substrate becomes plan source of truth
        │
   S1 ──┐
   G1 ──┘  ← passive observer + advisory gate, weeks
        │
   E3  ────  ← lease semantics live
        │
   W0  ────  ← agent shaped to worker contract
        │
   S2  ────  ← drain coordinator, weeks of operator practice
        │
   W1  ────  ← SECOND discontinuity: external worker process
        │
   S3  ────  ← THIRD discontinuity: real supervisor
        │
   G2  ────  ← gate becomes enforcing on narrow classes
        │
   E4 ──┐
   W2 ──┤  ← gradual capability expansion, months
   G3 ──┘  ← gate enforcing across all listed classes
```

Three discontinuities total: E2, W1, S3. Everything else is incremental and
parallel-safe. The discontinuities are sequenced so the system is operationally
stable on either side of each.

---

## 12. THE SINGLE HARDEST MIGRATION BOUNDARY

> **E2 — making the substrate the authoritative source of truth for plan state.**

Until E2, the markdown is authoritative and the substrate is shadow. After E2,
the substrate is authoritative and the markdown is generated. The cutover is
hard because:

- **Operator habit.** The operator (Michael) currently edits markdown directly
  to express intent. After E2, that edit pathway no longer drives the system.
  This is a behavioral change as much as a technical one.
- **Tooling assumes markdown.** Hooks, scripts, and skill heuristics read
  markdown. They must either be rewritten to read the substrate or be relegated
  to read-only display.
- **The agent's own loops use markdown.** The CLAUDE.md auto-execute reads
  `WORK_IN_PROGRESS.md` and `BUILD_PLAN_CLAUDE.md`. After E2, those reads
  must come from substrate-generated views, or the agent will operate from
  stale state.
- **Reversibility.** Once the substrate is authoritative, manually reverting to
  markdown means accepting the loss of any updates that happened in the
  substrate during the interim. This is the first migration step that is not
  trivially reversible.
- **Discoverability.** Pre-E2 problems are visible in the markdown. Post-E2
  problems are visible only through the operator pane and audit log — which
  must be in good enough shape *before* E2 that they can carry the load.

Every migration boundary after E2 is easier — they each operate on a substrate
that is already authoritative. E2 is the moment the project commits to a new
shape. Building everything *up to* E2 with the assumption that it will be
crossed eventually, and crossing it deliberately when the supporting pieces
are ready, is the safest play.

---

## 13. ESTIMATED DISTANCE FROM SAFE DURABLE ORCHESTRATION

This is a conceptual estimate, not a schedule. Calendar time depends on
how much of any given week is spent on AccentOS substrate work vs other
priorities (vendor data, ecommerce, customer-facing features). The
estimates assume substrate work is the *primary* focus of the time spent
on AccentOS, which it currently is not.

| Phase                                              | Conceptual effort  |
|----------------------------------------------------|---------------------|
| Stages E0 / S0 / G0 (identity, heartbeats, policy) | low (days–weeks)    |
| Stage E1 (shadow plan externalization)             | medium (weeks)      |
| **Stage E2 (substrate becomes source of truth)**   | **high (weeks of cutover + stabilization)** |
| Stages S1 / G1 (passive observer, advisory gate)   | medium (weeks)      |
| Stage E3 (lease semantics)                         | medium (weeks)      |
| Stage W0 (agent-as-worker contract)                | high (rewires how the agent operates) |
| Stage S2 (drain coordinator)                       | low (days)          |
| **Stage W1 (external worker process)**             | **high (new infra)** |
| **Stage S3 (real supervisor)**                     | **high (new infra)** |
| Stage G2 (enforcing gate, narrow)                  | medium              |
| Stages E4 / W2 / G3 (expansion)                    | continuous, ongoing |

**Minimum time before safe durable orchestration exists:** if AccentOS substrate
work is the primary focus *and* the operator (Michael) has bandwidth to drive
the discontinuities, on the order of months — not weeks. If substrate work
remains a side concern alongside vendor/ecommerce/customer features, longer.

The honest framing: this is not a 1–2 sprint project. The conservative posture
is to begin the incremental seeds (E0 / S0 / G0) now, run them for weeks
without rushing E1, and only commit to the discontinuities when the supporting
pieces are unambiguously in place.

---

## 14. SUMMARY

The transition from session-coupled tooling to durable substrate is not a
feature add; it is a re-foundation, with three discontinuities (E2, W1, S3) and
many incremental seeds around them. Tooling and substrate coexist for most of
the migration — that coexistence is the safe state, not a transitional glitch.
Some operations stay human-mediated indefinitely because they define the trust
framework the runtime operates within. The hardest single boundary is E2, the
moment the substrate becomes authoritative for plan state. The minimum time
before safe durable orchestration exists is on the order of months of focused
substrate work, and longer if substrate work remains a side priority. Begin
with the incremental seeds; sequence the discontinuities deliberately; do not
expand unattended scope in advance of the substrate that supports it.
