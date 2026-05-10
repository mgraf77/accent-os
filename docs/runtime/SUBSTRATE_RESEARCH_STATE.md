# SUBSTRATE RESEARCH STATE — STANDING RECORD

> **Status:** living document. Updated whenever substrate research advances.
> **Mode:** research only. No implementation, no runtime creation, no daemon
> creation, no orchestration execution, no pseudo-supervision, no fake-runtime
> claims.
> **Purpose:** maintain a continuously-current snapshot of what the substrate
> *is*, what is *missing*, what is *dangerous*, and what *sequencing discipline*
> applies — so future orchestration scaling is grounded in real substrate
> maturity rather than capability theater.

---

## 0. THIS DOCUMENT

This is the *station log*. The nine prior research docs in `docs/runtime/` define
the substrate at depth. This doc is the running ledger that:

- summarizes current substrate state in one place;
- names the structurally missing pieces;
- flags half-built states being approached;
- enumerates sequencing mistakes that would build fake-runtime illusions;
- declares the prerequisite gates for each future scaling capability.

When prior docs are updated, this doc is updated. When new substrate research is
done, the entry goes here first; if it grows large, it is promoted to its own doc
and this one references it.

**Last update:** 2026-05-10 (research round 4 — research station established).

---

## 1. THE CORPUS, AT A GLANCE

| Doc                                           | Defines                                                              |
|-----------------------------------------------|----------------------------------------------------------------------|
| `DURABLE_RUNTIME_SUBSTRATE.md`                | What qualifies as a runtime; the 10-item floor                       |
| `RUNTIME_VS_LOOP_DISTINCTION.md`              | Why loops are not runtimes; 7 illusion zones                         |
| `SAFE_AUTONOMY_CONSTRAINTS.md`                | Hard ceilings, danger zones, gates, rollback                         |
| `MINIMUM_VIABLE_RUNTIME_ARCHITECTURE.md`      | 5 components, 6 boundaries, tooling-vs-substrate table               |
| `PLAN_EXTERNALIZATION_MODEL.md`               | Typed-DAG plan representation; lease/idempotency/dead-letter         |
| `SUPERVISOR_WORKER_BOUNDARIES.md`             | Who can do what, ever and never                                      |
| `TRANSITION_TO_DURABLE_RUNTIME.md`            | Staged migration with three discontinuities (E2, W1, S3)             |
| `SUBSTRATE_MIGRATION_RISKS.md`                | 11 hazards, 5 irreversible mistakes, 10 dangerous half-built states  |
| `HUMAN_IN_THE_LOOP_PERSISTENCE.md`            | What stays human-controlled forever; trust + governance anchors      |
| `SUBSTRATE_RESEARCH_STATE.md` (this)          | Standing snapshot + sequencing discipline                            |

The corpus is internally consistent and cross-referenced. Add to it; don't
re-derive it.

---

## 2. CURRENT SUBSTRATE SNAPSHOT — STATE OF THE FLOOR

The 10-item floor from `DURABLE_RUNTIME_SUBSTRATE.md` §11, scored by current
reality (not by intent or roadmap):

| # | Floor capability                          | State    | Evidence / non-evidence                                                  |
|---|-------------------------------------------|----------|--------------------------------------------------------------------------|
| 1 | External durable work queue               | partial  | Supabase available; `PROMPT_QUEUE.md` is a markdown log                  |
| 2 | Lease + visibility timeout                | absent   | No lease semantics anywhere                                              |
| 3 | Idempotency keys on side effects          | absent   | Side effects are not keyed                                               |
| 4 | Externally-owned process supervisor       | absent   | "Runtime" = chat session + Stop hooks                                    |
| 5 | Heartbeat + crash detection               | absent   | Nothing watches for orchestrator death                                   |
| 6 | Dead-letter + bounded attempts            | absent   | Failures become silence or hand-retry                                    |
| 7 | Audit log of unit transitions             | partial  | `SESSION_LOG`, `PROMPT_LOG` are human prose, not unit-keyed              |
| 8 | Stable identity for units + workers       | partial  | Vendor IDs exist; orchestration units have no IDs                        |
| 9 | Operator drain control                    | absent   | No "stop accepting new work" primitive                                   |
|10 | Governance gate on irreversible ops       | partial  | `CLAUDE.md` rules exist; not machine-enforced                            |

**Score:** 4 partial / 6 absent. **0 in durable form.**

**Reading:** AccentOS today is correctly described as *file-based orchestration
log + capability catalog*. Not a runtime substrate. This is the right stage —
the danger is acting *as if* the substrate were further along.

---

## 3. THE FIVE COMPONENTS, BY CURRENT PRESENCE

From `MINIMUM_VIABLE_RUNTIME_ARCHITECTURE.md` §2:

| Component             | Present? | What stands in for it today                                              |
|-----------------------|----------|--------------------------------------------------------------------------|
| [A] Durable store     | partial  | Supabase tables for vendor/business data; not yet substrate-shaped       |
| [B] Supervisor        | no       | (No process owns worker lifecycle — Stop hook is a trigger)              |
| [C] Worker(s)         | no       | (Agent session executes; no separate worker process)                     |
| [D] Governance gate   | no       | (Policy lives in CLAUDE.md; nothing interposes on action paths)          |
| [E] Operator pane     | partial  | Operator inspects via direct repo + Supabase access; no purpose-built UI |

**Reading:** zero of five components are in production form. Two have raw
material that could be reshaped. The architectural shift is a re-foundation,
not a feature add.

---

## 4. WHAT REMAINS STRUCTURALLY MISSING

Not "things on a roadmap" — *structural absences* such that the substrate
properties downstream of them cannot exist until they do.

### 4.1 Externalized plan representation
The agent's plan still lives in session context. Without a typed DAG of work
units in the durable store, every plan ends with the session that authored it.
Until this exists, all "orchestration" is single-session orchestration regardless
of how many hooks fire.
*Blocks:* lease semantics, resumability, parallel workers, session resumption,
unattended execution.

### 4.2 Atomic status transitions
Even where status fields could be added (Supabase rows for plans/units), there
is no canonical mutation interface that enforces atomicity, ordering, and
invariant preservation. Ad-hoc writes will create the partial-lease and
queue-corruption hazards from `SUBSTRATE_MIGRATION_RISKS.md` §3, §11.
*Blocks:* lease acquisition, dead-letter, audit integrity.

### 4.3 Supervisor process distinct from agent and from triggers
There is no long-lived process whose only job is worker lifecycle. The Stop
hook is event-triggered, not a supervisor. Without [B] as a real process,
crash detection has at best the resolution of the trigger interval, drains
lag, and the supervision-mandatory thresholds (`MINIMUM_VIABLE_RUNTIME_
ARCHITECTURE.md` §12) get crossed silently.
*Blocks:* restart survivability, parallel workers, overnight runs.

### 4.4 Worker process distinct from agent session
A worker is not a session that calls itself a worker. Until a process exists
that can lease, execute one step, checkpoint, and exit — without holding plan
state across units — there is no executor that can be supervised, restarted,
or scaled.
*Blocks:* parallel execution, session resumption, plan continuity.

### 4.5 Governance gate as code-path interposition
Currently gates exist as documentation. A gate that is not on the code path
between worker and side effect is advisory; under unusual conditions (a
hallucinated assumption, a misread instruction) it is silently not consulted.
*Blocks:* every form of trust-bearing autonomy; until [D] is real, every
unattended action is human-trust-equivalent.

### 4.6 Operator pane as substrate view
The operator currently inspects the repo, the Supabase dashboard, and the
markdown directly. None of these compose into a single, substrate-faithful
view. Without a real pane, the operator's mental model and the substrate
diverge (`SUBSTRATE_MIGRATION_RISKS.md` §12) — and gates without good context
become rubber stamps.
*Blocks:* honest gate decisions, post-E2 operator authority, incident
diagnosis at substrate level.

### 4.7 Idempotency at every external side effect
Emails, Supabase writes, deploys — none currently carry stable idempotency
keys. Until they do, any retry strategy at all is a damage multiplier.
*Blocks:* every form of automated retry, including the trivial ones.

### 4.8 Continuous invariant checkers
"Orphan lease found," "unit complete with no result," "audit gap" — there
are no checkers because there are no invariants because there is no canonical
mutation interface (§4.2). Once [A] takes shape, invariant checkers must come
online with it, not after.
*Blocks:* trustable substrate state; without checkers, corruption sits
silently for weeks (`SUBSTRATE_MIGRATION_RISKS.md` §9, §11).

These eight are the active gaps. Closing any one without the others is
*incomplete progress*; closing them in the wrong order is *fake-runtime
construction*.

---

## 5. HALF-BUILT STATES BEING APPROACHED OR LIKELY TO BE

The 10 dangerous half-built states from `SUBSTRATE_MIGRATION_RISKS.md` §14,
mapped to current AccentOS exposure:

| Half-built state                                              | Exposure   | Notes                                                                  |
|---------------------------------------------------------------|------------|------------------------------------------------------------------------|
| Substrate plans exist; markdown is also writable              | future-E1  | Will be the live risk during shadow externalization                    |
| Lease fields exist; acquisition is not atomic                 | high       | Most likely first misstep if "let's just add status columns"           |
| Idempotency keys recorded; not actually passed to externals   | high       | Cosmetic-only idempotency is the path of least resistance              |
| "Supervisor" is a hook firing on session events               | **active** | Stop hook + auto-execute already pattern-matches "supervision"         |
| Gate documented in CLAUDE.md only                             | **active** | This is the current state                                              |
| Worker process exists; agent session also executes same units | future-W1  | Will arise the moment the first worker comes online                    |
| Operator pane is "look at the database directly"              | active     | Currently the operator's actual pattern                                |
| Audit log exists but is freeform prose                        | active     | `SESSION_LOG`, `PROMPT_LOG` are useful but not unit-keyed              |
| Dead-letter exists but is never inspected                     | future     | Will arise as soon as dead-letter is built without operator review loop|
| Plan DAG without typed dependencies; just an order            | future-E1  | Will arise if "plans" land as flat lists                               |

**Active half-built states:** four. **High-exposure-on-next-step states:** two.

**Single most dangerous "almost-runtime" state to never stabilize at:**
hook-as-supervisor + shadow-lease + documented-gate co-occurring. Three
half-built states whose combination *reads* as durable to the operator
(heartbeats firing, status fields populated, policy on file) while every
load-bearing invariant is fictional. If any two of these three appear without
the third being deliberately deferred, the third will be tempting to add for
"completeness" and the trio will lock in.

---

## 6. SEQUENCING MISTAKES THAT WOULD CREATE FAKE-RUNTIME ILLUSIONS

The transition path (`TRANSITION_TO_DURABLE_RUNTIME.md`) is staged on purpose.
Out-of-order moves produce systems that look durable and aren't.

### 6.1 Adding lease fields before atomic CAS exists
Adding `status`, `lease_until`, `attempts` columns to a Supabase table without
the discipline that mutations go through a single canonical path with atomic
compare-and-set produces lease *cosmetics* — workers will race, double-execute,
and the operator will see consistent-looking row state.
*Wrong move signal:* "Let's start with the schema; we'll add the safety later."

### 6.2 Calling the Stop hook a supervisor
The Stop hook + auto-execute pattern in `CLAUDE.md` already pattern-matches
"continuous operation." Once any new substrate work labels this as
supervision, the supervision-mandatory thresholds will be crossed without
real supervision in place.
*Wrong move signal:* "We already have something like a supervisor."

### 6.3 Promoting prose audit to "audit log"
`SESSION_LOG.md` and `PROMPT_LOG.md` are valuable as human aids. Promoting
them to "audit log" before unit-keyed transition records exist will make
incident reconstruction look possible when it isn't.
*Wrong move signal:* "We already log everything."

### 6.4 Activating any plan touching irreversible classes before [D] is real
Per `SAFE_AUTONOMY_CONSTRAINTS.md` and `SUPERVISOR_WORKER_BOUNDARIES.md` §12,
irreversible action classes go through a real gate or stay human-in-loop.
Activating a plan with "send email" or "deploy" or "spend money" units before
the gate is interposed in code is the highest-blast-radius sequencing error
available.
*Wrong move signal:* "It's gated in the prompt."

### 6.5 Crossing E2 (substrate becomes plan source of truth) without operator pane
Per `SUBSTRATE_MIGRATION_RISKS.md` §13 mistake #1: crossing E2 before [E]
exists means the operator cannot govern post-cutover substrate. Reverting
means losing every substrate write since cutover. This is the largest
irreversible mistake on the migration path.
*Wrong move signal:* "We can add the UI later."

### 6.6 Building W1 (first external worker) before S3 (real supervisor)
A worker without a supervisor is unsupervised execution. Either S3 lands
first, or W0 (agent-as-worker single-step contract) is the only worker
shape used.
*Wrong move signal:* "Let's get a worker running and add supervision later."

### 6.7 Granting any §13 operation to the runtime "temporarily"
From `HUMAN_IN_THE_LOOP_PERSISTENCE.md` §2.1 / §5: trust-framework operations
(authority changes, credential issuance, policy edits, substrate migration)
must have paths that don't include the runtime. Any "temporary" exception
becomes a permanent code path the operator must trust forever.
*Wrong move signal:* "Just for this one task."

### 6.8 Adding hooks/skills until autonomy "feels" continuous
Per `MINIMUM_VIABLE_RUNTIME_ARCHITECTURE.md` §11: capability accumulation
produces visible progress while leaving the substrate gap untouched. The
single most dangerous fake-runtime *temptation*. Substrate work, not
capability work, is the right next move toward durable orchestration.
*Wrong move signal:* "One more hook will close the gap."

These eight are the named ways to fail. The discipline is to recognize the
*signals*, not to wait for the failure.

---

## 7. PREREQUISITE GATES FOR FUTURE SCALING

Each capability the project might want to scale into has a substrate
prerequisite. Pursuing the capability without the prerequisite is
fake-runtime construction.

| Future capability                         | Prerequisite substrate properties                                                                               | Currently unlockable? |
|-------------------------------------------|-----------------------------------------------------------------------------------------------------------------|------------------------|
| **Adaptive routing** (units to best worker) | Stable worker identity + capability registry + lease semantics + dead-letter                                  | No                     |
| **Unattended queues** (work runs while no human watches) | Supervisor [B] + lease + heartbeat + gate [D] enforcing on irreversible classes                  | No                     |
| **Session resumption** (new session continues prior plan) | Externalized plan + atomic transitions + audit unit-keyed + operator pane reads from substrate     | No                     |
| **Durable orchestration** (plans survive any single executor) | All 10 floor items in durable form + operator pane                                             | No                     |
| **Parallel workers** (multiple units in flight) | Atomic lease CAS + idempotency + invariant checkers + supervisor                                         | No                     |
| **Cross-host execution** (workers on different machines) | All of "parallel workers" + clock-skew-tolerant lease semantics + substrate as sole shared state    | No                     |
| **Future swarm concepts** (many specialized workers cooperating) | All of the above + capability-typed unit routing + plan-level coordination + cross-plan invariants | No                     |
| **Codex-style autonomous code edits**     | W1 worker + W0 contract for the agent + gate on PR/commit classes + rollback declared per class               | No                     |
| **Overnight / weekend builds**            | S3 supervisor + drain + circuit-breaker + escalation channel that reaches operator off-runtime                | No                     |
| **Operator vacation mode**                | All of "overnight" + bounded budget enforcement + dead-letter review automation + escalation policy          | No                     |

**Reading:** every advanced capability the project might reach for in the
near future has the same five-component prerequisite: [A] [B] [C] [D] [E].
Capabilities that bypass any of these are not actually unlocked — they are
*claimed* without being unlocked. This is the operational meaning of
"capability theater."

---

## 8. SUBSTRATE PROPERTIES THE PROJECT WILL ACQUIRE FIRST (DEFENSIBLE ORDER)

From `TRANSITION_TO_DURABLE_RUNTIME.md` §11, the parallel-safe seeds. None of
these alone unlock any capability in §7; together they prepare the ground.

```
Seed phase (incremental, parallel-safe, weeks):
  E0  Stable IDs for plans / units / workers
  S0  Heartbeat record emission (no consumer yet)
  G0  Policy as structured data (extracted from CLAUDE.md, not enforced yet)
```

After multi-week stable seed phase:

```
Shadow phase (still parallel-safe, weeks):
  E1  Plan written to substrate alongside markdown (markdown still authoritative)
  S1  Passive observer process reading heartbeats (no restart authority)
  G1  Advisory gate (logs would-fire events; does not block)
```

After shadow stabilizes:

```
First discontinuity (weeks of cutover + stabilization):
  E2  Substrate becomes authoritative for plan state; markdown becomes generated view
  Requires [E] operator pane MVP in place beforehand.
```

Then:

```
Lease + worker preparation (weeks):
  E3  Lease semantics live (atomic CAS via canonical mutation interface)
  W0  Agent shaped to single-step worker contract (no plan state across units)
  S2  Drain coordinator (still no restart authority)
```

Then second and third discontinuities (each weeks of cutover + stabilization):

```
  W1  External worker process leasing reversible-class units only
  S3  Real supervisor process owning worker lifecycle
```

Finally:

```
Hardening (continuous, months):
  G2  Enforcing gate on narrow reversible classes
  E4  Plans gain typed dependencies (full DAG)
  W2  Worker fleet expands one capability at a time
  G3  Enforcing gate across all listed irreversible classes
```

This order is defensible because each step is stable on its own and prepares
its successor without stranding intermediate state in a half-built form.
Skipping ahead is forbidden. Doing two discontinuities in parallel is
forbidden.

---

## 9. OPEN SUBSTRATE QUESTIONS (UNRESOLVED)

These are the questions whose answers will shape later work. Recorded here so
they don't get re-discovered each round.

### 9.1 Where does the supervisor process live?
Cloudflare Workers are request-scoped (not long-lived). Cloudflare Durable
Objects could carry state but are not classical processes. Supabase Edge
Functions with a cron trigger become "supervision-by-tick," which is the
hook-as-supervisor anti-pattern. A small VPS daemon adds infrastructure to
manage. Each option has different operability/cost/fit tradeoffs.
*Decision-required-by:* before stage S3.

### 9.2 What is the substrate layer for plan/unit/lease records?
Supabase Postgres tables are the obvious candidate (already in use for
business data). Considerations: row-level security; RLS policies vs
service-role access; performance of a substrate growing into the millions of
audit rows; cost of frequent heartbeat writes.
*Decision-required-by:* before stage E1.

### 9.3 How does the operator pane authenticate?
The operator's existing Supabase Auth (email/password, role=Owner) is a
candidate. But the operator pane is the substrate's authority surface;
authentication compromise = full runtime compromise. Considerations:
multi-factor; off-runtime escape hatch; auditing of pane actions distinct
from worker actions.
*Decision-required-by:* before stage E2.

### 9.4 What is the canonical mutation interface for substrate writes?
Options: a stored procedure / function in Supabase; a small server with
typed RPC; a worker-local library wrapping the substrate client. Each shapes
how easy invariant enforcement is.
*Decision-required-by:* before stage E3.

### 9.5 How are idempotency keys threaded through external systems?
Email (Postmark/Resend/etc.): vendor-specific support varies. Supabase
writes: unique constraints + ON CONFLICT. Cloudflare deploys: deploy IDs.
Each external surface is its own substrate-boundary problem.
*Decision-required-by:* per-action-class as classes are enabled for unattended
execution.

### 9.6 How is the audit log stored such that prior entries remain readable across
schema evolution?
Append-only is simple as a write rule. Cross-version readability is a schema
evolution discipline (additive changes; never reinterpret existing fields).
*Decision-required-by:* before any migration that touches substrate schema —
i.e. continuously.

### 9.7 How are §13 "permanently human" operations physically separated from
runtime authority?
Likely: separate admin tool with separate credentials, distinct Supabase
service role, never reachable from worker code path. But the *structure* of
that separation needs explicit design before any operation is deemed §13.
*Decision-required-by:* before any §13 operation gets a substrate
representation at all.

These should not be answered in the moment; they should be answered
deliberately, with the answer recorded back into this document.

---

## 10. CAPABILITY THEATER WATCHLIST

Patterns that look like substrate maturity and aren't. The operator should
be wary of any of these arriving without explicit substrate work behind them.

- A new file under `skills/` named `orchestrator/`, `runtime/`, or `supervisor/`
  that describes orchestration but is just markdown.
- A Stop hook with new logic that calls itself a supervisor or scheduler.
- A `PROMPT_QUEUE.md` schema upgrade that adds a `status` column without
  atomic transition discipline behind it.
- An "audit log" that is `SESSION_LOG.md` reformatted.
- A "gate" implemented as a check inside the agent's prompt rather than in
  code on the path between worker and side effect.
- A "worker" that is the same agent session with a new label.
- A "drain" that is the operator manually editing a markdown file.
- A "heartbeat" that is the agent posting a comment to itself.
- A "checkpoint" that is a chat transcript saved to disk.
- An "operator pane" that is a script that prints status to the terminal.

Each of these is *useful tooling shaped to look like substrate*. The harm is
not the tool; the harm is the labeling. A tool labeled honestly remains
useful. A tool mislabeled as substrate begins fooling the operator and the
agent simultaneously.

**Watchlist discipline:** when adding any artifact whose name resembles a
substrate component, write the artifact's *honest label* — "log," "trigger,"
"heuristic," "stand-in" — into the artifact itself. If the artifact resists
its honest label, it is probably claiming substrate properties it does not
have.

---

## 11. CONTINUOUS-IDENTIFICATION LEDGER

Items the research station is continuously watching for. Updated as evidence
accumulates.

### 11.1 Signs the project is approaching a fake-runtime trap
- Conversations about "what should the orchestrator do when X happens" without
  the orchestrator existing as a process.
- Plans for "unattended runs" that depend on the agent session being open.
- New skills or hooks framed as solving substrate-shaped problems.
- The operator describing the system as more durable than the §2 snapshot
  shows.

### 11.2 Signs the project is doing real substrate work
- The §2 snapshot table changes from "absent" to "partial" or "partial" to
  "durable" with evidence.
- The 8 structural absences in §4 close one at a time, in defensible order.
- New code paths interpose on side effects (gates) rather than annotate them
  (advisory).
- Operator pane usage replaces direct repo / Supabase inspection.

### 11.3 Signs to escalate (research → policy)
- A discontinuity (E2, W1, S3) is being approached without its prerequisites.
- A §13 operation is being given a runtime-reachable code path.
- A half-built state from §5 is becoming load-bearing.
- The operator's mental model is diverging from the substrate.

This ledger is not a checklist. It is a set of signals to be alert for. New
signals get added here as research advances.

---

## 12. STATION DISCIPLINE

How this document is operated:

1. **Updated, not appended-to-end.** When something changes, the relevant
   section is rewritten. Outdated content does not accumulate.
2. **Date-stamped at the top.** §0 carries the last-update date.
3. **Cross-referenced, not duplicative.** Long-form material lives in the
   nine prior docs. This doc summarizes and links.
4. **Honest about absence.** Sections may be empty, "unknown," or
   "unresolved." Empty is better than fictional.
5. **Promoted when large.** A growing entry is moved to its own doc and
   linked from here. This doc stays scannable.
6. **No promises encoded.** "Will be done by" sentences belong in build
   plans, not in research state. This doc records what *is*, what is
   *missing*, and what *would be wrong* — not what is *committed to*.
7. **Re-read before substrate work.** Any future substrate-shaped change
   begins by re-reading this doc and confirming the change is consistent
   with §6 (sequencing) and §10 (theater watchlist).

---

## 13. SUMMARY OF CURRENT STATE

- Substrate floor: **0 of 10 in durable form**, 4 partial, 6 absent.
- Architecture components: **0 of 5 in production form**, 2 with raw
  material.
- Distance from minimum viable substrate: months of focused substrate work,
  with three discontinuities (E2, W1, S3) sequenced one at a time.
- Active half-built states: **4** (hook-as-supervisor, documented-gate,
  prose audit, operator-pane-as-direct-access).
- Most dangerous "almost-runtime" state to never stabilize at:
  hook-as-supervisor + shadow-lease + documented-gate co-occurring.
- Most dangerous fake-runtime *temptation*: capability accumulation
  (more hooks, more skills) without substrate work.
- Single hardest migration boundary: **E2** — substrate becomes
  authoritative for plan state. Requires [E] operator pane MVP first.
- Defensible next moves: parallel-safe seeds **E0 (identity), S0
  (heartbeats), G0 (policy as data)**. Nothing else.
- Forbidden next moves: lease cosmetics without atomic CAS;
  hook-as-supervisor labeling; promoting prose audit; activating any
  plan touching irreversible classes before [D] is real; W1 before S3;
  any §13 operation reachable from runtime; capability-theater hooks/skills.

The substrate research station is open. The corpus is coherent. The
discipline is named. Next substrate-shaped change starts by updating §2
and §5 of this doc to reflect the new state.
