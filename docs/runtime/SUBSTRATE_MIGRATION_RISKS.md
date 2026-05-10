# SUBSTRATE MIGRATION RISKS — HAZARD CATALOG

> Status: research only. No implementation, no migration execution.
> Companion to `TRANSITION_TO_DURABLE_RUNTIME.md`.
> Purpose: enumerate the hazards of moving from session-coupled tooling to a
> durable orchestration substrate — and especially the half-built states that
> are more dangerous than either the start or the end of the migration.

---

## 1. WHY MIGRATION IS HIGHER-RISK THAN EITHER STATE IT CONNECTS

The starting state (session-coupled tooling) and the ending state (mature
substrate) are each internally coherent. Their failure modes are known and
contained.

The *transition between them* is uniquely dangerous because:

- Two systems are operating concurrently, with risk of divergence.
- The boundary between "what is durable now" and "what is still session-bound"
  shifts over time and is easy to misremember.
- Half-built substrate components frequently *look* durable but lack the
  invariants that make durability real.
- Operator habits and agent loops were built around the old system; they will
  default to old-system assumptions even after migration steps have changed
  reality.
- A single migration step that goes wrong is hard to reverse cleanly because
  reverting means choosing whose state — old system or new — to keep.

This document catalogs the specific hazards. Each is a thing that *can*
happen, *has* happened in similar migrations elsewhere, and would be expensive
or irreversible if it happened to AccentOS.

---

## 2. THE TWO-SOURCES-OF-TRUTH HAZARD

The most common substrate migration failure: a fact lives in both the legacy
representation and the new substrate, with both being writable.

**Symptom:** plan status is "complete" in the substrate but unchecked in the
markdown, or vice versa. A unit appears finished to one consumer and pending
to another.

**Root cause:** insufficient discipline about which system is authoritative for
which fact at which migration stage.

**Why it is dangerous:** two concurrent writers cannot be reconciled by the
substrate. There is no atomic way to decide which write "won." Operator
inspection can no longer answer "what is the current state?" with confidence.
Workers acting on the substrate diverge from agent behavior reading the
markdown.

**Mitigations (conceptual):**
- Every migration stage names exactly one source of truth per concern.
- The non-authoritative representation is treated as read-only and *generated*
  from the authoritative one, never edited directly.
- Hooks and scripts are audited for hidden writes to the non-authoritative
  store before each stage transition.
- A periodic invariant check compares the two and surfaces drift.

**Permanent vigilance:** even after migration completes, this hazard recurs
whenever a new tool is added that reads or writes either representation.

---

## 3. THE PARTIAL-LEASE HAZARD

A unit acquires "lease semantics" cosmetically — there is a `leased` status
and a `lease_until` field — but the acquisition is not atomic.

**Symptom:** two workers occasionally execute the same unit. External side
effects are duplicated. Idempotency keys (if present) catch most of it; the
ones that aren't keyed silently produce double-effects.

**Root cause:** lease acquisition implemented as "read status, check legal,
write leased" instead of as a single atomic compare-and-set.

**Why it is dangerous:** the failure is rare, intermittent, and looks like a
flaky external system. Diagnosis requires looking at audit transitions and
recognizing two workers acquired the same unit; this is invisible to all
prose-level inspection.

**Mitigations (conceptual):**
- Lease acquisition is, at the substrate layer, a single atomic operation
  conditional on the prior status. No multi-step "check then write" patterns.
- Tests exercise concurrent lease attempts and assert exactly one wins.
- An invariant check finds units with two distinct workers in their lease
  history within an overlapping window.

---

## 4. THE FAKE-IDEMPOTENCY HAZARD

A unit has an `idempotency_key` field, but the key is not actually used by the
external system or is generated freshly per attempt.

**Symptom:** retries produce duplicate emails, duplicate writes, duplicate
charges.

**Root cause:** the idempotency key is *recorded* on the unit but not *passed*
to the external API; or the key is regenerated each retry (e.g. includes a
timestamp); or the external API ignores the header but does not say so.

**Why it is dangerous:** idempotency is the load-bearing property that makes
retry-on-failure safe. False idempotency is worse than no idempotency: the
system retries confidently, *believing* it is safe, and amplifies damage.

**Mitigations (conceptual):**
- Idempotency keys are deterministic functions of (plan_id, unit_id,
  side_effect_index) — never include time, never regenerate.
- Per external system, document explicitly whether the system honors
  idempotency, and *test* it by sending two identical requests with the same
  key and asserting one effect.
- Side effects to systems that do not honor idempotency keys are gated
  human-in-loop indefinitely until a compensation strategy exists.

---

## 5. THE SUPERVISOR-IS-A-HOOK HAZARD

A "supervisor" is implemented as a hook, a cron entry, or a periodic invocation
from another short-lived context.

**Symptom:** the supervisor "runs" on a schedule but does not actually own
worker lifecycle in real time. Worker death goes undetected for up to one
schedule interval. Operator drains take effect on the next tick, not
immediately.

**Root cause:** mistaking *triggering* for *supervision*. Hooks fire on
events; cron fires on time. Neither owns lifecycle continuously.

**Why it is dangerous:** the system claims supervision while having something
that only resembles it. The thresholds in `MINIMUM_VIABLE_RUNTIME_ARCHITECTURE.md`
§12 are crossed under the impression that supervision is in place, when in
fact dead workers can persist for an interval, drain commands lag, and
heartbeat-based crash detection has the resolution of the trigger interval at
best.

**Mitigations (conceptual):**
- A supervisor is a long-lived process with explicit lifecycle ownership.
- If "long-lived process" is platform-difficult, the substrate's own
  invariants (e.g. lease expiry on the database side) carry more of the
  load — but this is documented honestly as "we have lease-based
  recovery, not real-time supervision."
- Trigger-based supervision is acceptable as a temporary stopgap *only*
  with explicit declaration and a known upgrade path.

---

## 6. THE DOCUMENTED-GATE HAZARD

A governance gate exists as documented policy in markdown but is not interposed
in any code path.

**Symptom:** the agent or worker performs an action that policy says should
require approval, because nothing actually checks the policy at runtime.

**Root cause:** treating policy as guidance to a well-behaved agent rather than
as enforcement against a possibly-misbehaving worker. The gate is in the
agent's "memory" via CLAUDE.md, not in the path between worker and external
system.

**Why it is dangerous:** policy in documentation depends entirely on the
agent's good behavior. Under unusual conditions (a hallucinated assumption, a
misread instruction, a confused chain of tool calls), the policy is silently
not consulted. The operator believes the gate is enforcing; it is not.

**Mitigations (conceptual):**
- Gate enforcement lives in code on the path between worker and side effect,
  not in agent memory.
- Stage G1 (advisory gate) precedes G2 (enforcing) so calibration confirms
  the gate fires on the right operations.
- §13 operations from `SUPERVISOR_WORKER_BOUNDARIES.md` (human-authorized
  indefinitely) never live in the agent's autonomous code path at all — they
  require a separate admin tool.

---

## 7. THE GENERATED-VIEW-EDITED-DIRECTLY HAZARD

After E2, the markdown that humans see is generated from the substrate. An
operator (or, more dangerously, an agent on autopilot) edits the markdown
directly.

**Symptom:** the edit appears to take effect (the markdown shows the new
state), then disappears at the next regeneration. Or worse, a hook driven off
markdown changes acts on the edit before regeneration overwrites it,
producing partial side effects with no substrate record.

**Root cause:** the generated view is indistinguishable from the source-of-
truth markdown that preceded it. Habit drives the edit.

**Why it is dangerous:** the operator loses confidence ("my edits don't
stick") or, worse, gains false confidence ("my edits worked because I see
the new state right now, not realizing it'll be reverted"). Audit logs miss
the edits because they didn't go through the substrate.

**Mitigations (conceptual):**
- Generated views are clearly marked as generated (header banner, file naming,
  read-only file mode where the host supports it).
- Edits go through a deliberate operator pane, not by writing the file
  directly.
- Hooks that previously fired on markdown changes are removed or repointed
  to substrate change events.

---

## 8. THE PROMOTED-PROTOTYPE HAZARD

A piece of substrate built quickly to validate an idea is left in production
because it works well enough.

**Symptom:** the substrate is half a prototype and half a real system. Each
component has an "own quirks" file. New components are built around the old
prototype's accidental contracts.

**Root cause:** the absence of an explicit cutover from prototype to real
substrate. "Working" became "permanent" without anyone deciding it.

**Why it is dangerous:** prototypes typically lack invariants the real
substrate would have (atomic transitions, schema discipline, bounded retry,
proper lease semantics). A system promoted from prototype carries those gaps
into all the assumptions built on top of it.

**Mitigations (conceptual):**
- Each substrate component is built with an explicit "is this a prototype or
  is this real?" declaration in its own header.
- Prototype components have a declared end-of-life, even if the date is
  approximate.
- Audit invariants are written *as* the substrate is built, not after.

---

## 9. THE STATE-CORRUPTION HAZARD

A migration step writes data that violates an invariant the substrate depends
on (orphaned lease, unit with status `complete` but no result, plan with
mixed-version unit schemas).

**Symptom:** workers crash on certain units. Operator inspection shows
contradictory state. Recovery requires manual database surgery.

**Root cause:** schema evolution without migration scripts; partial writes
that were not transactional; bug in a tool that wrote directly to the
substrate without going through the canonical mutation paths.

**Why it is dangerous:** corruption can sit silently in the substrate for
weeks before a worker happens upon the corrupt record. By then, tracing
the cause is forensic. Cleanup risks introducing further corruption.

**Mitigations (conceptual):**
- Every mutation goes through a typed canonical interface; raw substrate
  writes are forbidden outside of declared admin tools.
- Schema changes use forward-compatible additive evolutions where possible;
  destructive changes use migration scripts that are themselves audited.
- Periodic invariant checks (orphaned leases, units with missing results,
  audit gaps) run continuously and surface to the operator pane.

---

## 10. THE SUPERVISOR FAILURE HAZARD

The supervisor itself dies, or runs in a degraded state, and the platform init
that should restart it does not.

**Symptom:** workers run for a while, then begin failing in ways that
coincide with the supervisor's death (no restart of crashed worker, drains
ignored, health record stale). The operator pane still shows the supervisor
as "running" because it is reading a heartbeat the dying supervisor managed
to emit moments before death.

**Root cause:** the supervisor's own lifecycle owner (platform init) is itself
fragile, or the supervisor's "alive" signal is too coarse to detect degraded
operation.

**Why it is dangerous:** without a working supervisor, the runtime degrades
into "workers running unsupervised" — exactly the fake-runtime state the
supervisor exists to prevent.

**Mitigations (conceptual):**
- Platform init for the supervisor is on the most reliable available
  infrastructure (e.g. a managed scheduler, not the supervisor restarting
  itself).
- Supervisor health is multi-signal: heartbeat *plus* "did it actually do
  expected work in the last interval?" If a supervisor's heartbeat is fine
  but it has not restarted any expected workers in 24 hours, that is
  suspicious.
- If supervisor failure is detected, workers default to "drain" mode rather
  than "continue running unsupervised."

---

## 11. THE QUEUE CORRUPTION HAZARD

The queue's invariants (every legal unit's dependencies are complete; every
leased unit has a non-expired lease; etc.) become violated.

**Symptom:** units leak across statuses (a unit shows `complete` but its
dependents never become `legal`). Workers race for units that should not
yet be available. Some units are never picked up despite being legal.

**Root cause:** ad-hoc edits to unit records; concurrent writers without
transactional discipline; bugs in the legal-status derivation.

**Why it is dangerous:** queue corruption is the substrate equivalent of
file system corruption — every consumer downstream operates on a wrong view
of reality. Recovery may require pausing all workers, walking the substrate
to recompute invariants, and selectively repairing units.

**Mitigations (conceptual):**
- Status transitions go through a single canonical mutation interface that
  enforces invariants.
- The "legal" status is derived (substrate-computed), never directly written.
- Invariant checks run continuously and halt the queue (drain mode) on
  detected corruption.

---

## 12. THE SUBSTRATE/OPERATOR DIVERGENCE HAZARD

The operator's mental model of the system gradually diverges from what the
substrate actually contains.

**Symptom:** the operator says "we have N plans active" or "this is what
we're working on" and the substrate disagrees. Operator approves a gate
based on understood context that does not match the unit being approved.

**Root cause:** the operator pane is incomplete, slow, or hard to read.
The operator falls back to memory or markdown-as-summary, which has drifted
from substrate truth.

**Why it is dangerous:** governance gates are only as good as the operator's
read on what they're approving. Divergence makes approvals into rubber stamps
or, worse, mistaken denials.

**Mitigations (conceptual):**
- The operator pane is a first-class deliverable, sized to actually be used,
  not "we'll add a UI later."
- The operator pane is the *only* interface the operator uses to inspect or
  approve, so any divergence between operator understanding and substrate
  reality is immediately visible.
- Audit log entries are written in the operator's language, not engineering
  internals.

---

## 13. IRREVERSIBLE MIGRATION MISTAKES

These are migration steps that, once done wrong, cannot be cleanly undone:

1. **Crossing E2 before the operator pane is real.** After E2, the
   substrate is authoritative. If the operator cannot see the substrate, the
   operator cannot govern the system. Reverting means losing every substrate
   write since E2.
2. **Granting workers gate-bypass authority "temporarily."** Once a worker
   has been allowed to bypass a gate even once, the bypass code path exists.
   Removing it later does not remove the historical fact that the worker was
   built around its existence.
3. **Promoting a prototype substrate to production.** Once consumers depend
   on prototype quirks, replacing the prototype is a second migration —
   substantially harder than the first because there is now a working system
   to keep working through the change.
4. **Granting the runtime authority over §13 operations**
   (`SUPERVISOR_WORKER_BOUNDARIES.md`) even briefly. The trust framework
   restructured by the runtime cannot be cleanly restored, because the
   runtime has now been a participant in defining its own authority.
5. **Writing a migration that makes prior audit log entries unreadable.**
   Audit is the recovery surface of last resort. A migration that orphans
   prior audit entries (different schema, different ID space, different
   meaning of fields) destroys the ability to understand what happened
   before the migration.

Each of these is a step that should be made un-take-able by structural means
(not just discipline), because the temptation to take them grows under
deadline pressure and they leave permanent damage when taken.

---

## 14. DANGEROUS HALF-BUILT STATES

States in which the system has *some* substrate but lacks the invariants that
make it durable. These are worse than no substrate, because the *appearance*
of durability suppresses the caution that pre-substrate operation invites.

| Half-built state                                              | Why it is dangerous                                                  |
|---------------------------------------------------------------|----------------------------------------------------------------------|
| Substrate plans exist; markdown is also writable              | Two-sources-of-truth divergence (§2)                                 |
| Lease fields exist; acquisition is not atomic                 | Partial-lease hazard (§3)                                            |
| Idempotency keys recorded; not actually passed to externals   | Fake-idempotency hazard (§4)                                         |
| "Supervisor" is a hook firing on session events               | Supervisor-is-a-hook (§5)                                            |
| Gate documented in CLAUDE.md only                             | Documented-gate hazard (§6)                                          |
| Worker process exists; agent session also executes same units | Worker collision; lease cannot prevent if not honored both sides     |
| Operator pane is "look at the database directly"              | Substrate/operator divergence (§12)                                  |
| Audit log exists but is freeform prose                        | Cannot answer "which unit was leased when worker X died"             |
| Dead-letter exists but is never inspected                     | Silent backlog of unsolved failures                                  |
| Plan DAG without typed dependencies; just an order            | Out-of-order execution; no resumability beyond linear                |

A useful frame: every half-built state is a place where the system *claims* a
substrate property without satisfying its preconditions. The cost of these
states is paid not at the moment of the claim, but at the moment a failure
exposes that the claim was false — usually in production, often
unattended, frequently irreversible.

---

## 15. "LOOKS DURABLE BUT ISN'T" CONDITIONS

A summary checklist of conditions where the system looks durable but isn't.
Useful for the operator to challenge the system periodically.

- The plan exists in the substrate **but** the agent re-decides what's next
  from its own context anyway.
- The queue has lease semantics **but** workers extend their own leases
  without bound.
- Idempotency keys are present **but** are never tested against the external
  system's deduplication behavior.
- A supervisor exists **but** is itself unsupervised — nothing restarts it
  when it dies.
- Heartbeats exist **but** nothing acts on heartbeat absence.
- Crash recovery is documented **but** has never been exercised by an
  intentional restart drill.
- A governance gate exists **but** the operator hits "approve" without
  reading because gates fire on uninteresting operations too.
- Audit transitions are written **but** no one has ever reconstructed an
  incident from them, so it is unknown whether they are sufficient.
- Dead-letter is configured **but** never inspected, so the system's
  failure rate is invisible.
- The operator pane shows green **but** is itself reading from the worker,
  not from the substrate.

If any of these is true, the durability the operator believes the system has
is partially a story. Stories are good in user interfaces and bad in
substrates.

---

## 16. SUMMARY

Migration to a durable substrate is more dangerous than either the starting
state or the ending state because half-built substrate is *worse* than no
substrate — it suppresses the caution that pre-substrate operation invites
without yet providing the durability that justifies the reduced caution.
The hazards in §2–§12 are concrete, recurring, and largely preventable by
treating substrate work as substrate work (transactional, invariant-checked,
typed) rather than as ordinary feature work. The irreversible mistakes in
§13 deserve structural prevention, not just discipline. The half-built
states in §14 and the look-durable-but-isn't conditions in §15 are the
specific shapes the operator should learn to recognize at a glance —
because every one of them, once present, will be acted on as if it were
durable, and the cost of that misplaced trust grows over time.
