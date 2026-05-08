# AccentOS — Runtime Architecture Brief (Phase 1)

**Mode:** Runtime architecture / specification (no implementation, no infrastructure)
**Anchors:**
`docs/workflows/ACCENTOS_OPERATIONAL_WORKFLOWS.md`,
`ACCENTOS_EVENT_AND_HANDOFF_SCHEMA.md`,
`ACCENTOS_PRIORITY_SYSTEM.md`,
`ACCENTOS_AI_SUGGESTION_MODEL.md`,
`ACCENTOS_OPERATIONAL_STATE_MODEL.md`,
`ACCENTOS_ROLE_AND_RECEIVER_MODEL.md`,
`ACCENTOS_COMMAND_CENTER_SPEC.md`,
`ACCENTOS_RUNTIME_CONTRACTS.md`,
`ACCENTOS_OPERATIONAL_TELEMETRY.md`,
`ACCENTOS_ANTI_ENTROPY_RULES.md`.

**Purpose:** Define the runtime architecture boundary the implementation phase will execute against. Contracts and acceptance criteria — no technology choices, no code.

---

## 1. Scope Confirmation

### 1.1 IN scope for v1 runtime

- Append-only event store and per-subject event log.
- Dispatcher/router that routes typed events to subscribers and projections.
- Receiver-resolution service implementing the deterministic rules in the role model.
- Handoff lifecycle engine enforcing the handoff contract.
- Priority engine producing one `priority_score` per actionable subject + band emissions.
- Escalation engine implementing tiered ack clocks, tier-skip-with-reason, bounce protection.
- Notification engine deriving notifications from typed events under quiet/loud rules.
- AI suggestion engine implementing the suggestion lifecycle + reversibility/policy gates.
- Operational-state evaluator producing per-session primary state + composition layers.
- Command-center projection layer (CC + role-CC variants are scope filters of one projection set).
- Operational-health and orchestration-health telemetry as event-derived projections.
- Single-tenant deployment.

### 1.2 OUT of scope for v1 runtime

- Multi-tenant isolation, per-tenant config segregation, cross-tenant CC.
- Identity provider / SSO mechanics (consumed as an interface, not designed here).
- Long-horizon analytics warehouse / BI integrations.
- Mobile native clients (mobile is a session-shape; native packaging is an outside concern).
- Shell-v2 visual implementation (the runtime serves the shell; it is not the shell).
- Production data backfill from any predecessor system (separate migration concern).
- Vendor email parsing model training (consumed as an AI capability, not built here).
- Voice-to-structured-note inference (same).
- Payment processing, invoicing, AR aging computation logic (consumed via finance integration; runtime models the events, not the books).
- Customer self-service portal.
- Deployment topology, scaling targets, cost models — addressed in a later infra brief.

### 1.3 Single-tenant assumptions

- One organization, one role registry, one priority weight set, one policy registry.
- Subjects are not tenant-scoped; subject IDs are globally unique within the deployment.
- All telemetry is org-wide; no tenant lens.

### 1.4 Future multi-tenant boundaries (acknowledged, not designed)

- Subject IDs reserve tenant-prefixing space.
- Event payloads reserve a tenant attribution slot (unset in v1; required in v2).
- Receiver resolution reserves tenant scoping in its input contract.
- CC projection reserves tenant filtering as a future scope filter.
- Anti-entropy rule R6 (no unowned subjects) extends to "no untenanted subjects" in v2.

### 1.5 Shell-v2 assumptions

- Shell consumes CC projections, role-CC projections, subject timelines, AI inboxes, and operational-state evaluator outputs.
- Shell does not write to the event store directly; it submits typed *commands* that the runtime validates and translates into events.
- Shell does not compute priority, urgency, or notification routing locally.
- Shell is responsible for its own visual state; the runtime is responsible for operational state.

### 1.6 Orchestration-runtime assumptions

- The runtime is the only writer of operational truth.
- All operational truth flows through events; all reads go through projections or the per-subject log.
- Runtime is event-driven; it does not poll external systems for state — integrations emit events.
- External systems (vendor email, payment, calendar) reach the runtime only via typed adapters that emit events.

---

## 2. Logical Runtime Components

Each component lists: **responsibilities**, **contracts honored**, **inputs**, **outputs**, **survivability concerns**, **failure modes**, **observability requirements**.

### 2.1 Event Store

- **Responsibilities:** durable, append-only persistence of every typed event; per-subject ordered logs; replay support.
- **Contracts honored:** Event Propagation (§1 RC), Auditability (§10 RC), Schema Evolution discipline (additive-only), Clock & Ordering (§7 below).
- **Inputs:** validated event records from dispatcher.
- **Outputs:** durable event records; replay streams; per-subject logs; subscriber feeds.
- **Survivability:** loss of any committed event is a P0 incident; partial loss must be detectable and bounded.
- **Failure modes:** write failure (must surface as `runtime.emission_failed`), read latency, replay drift.
- **Observability:** write-success rate, end-to-end emission latency, per-subject log integrity self-check, replay-vs-live divergence checks.

### 2.2 Projection Store

- **Responsibilities:** maintain materialized projections (CC, role queues, subject pages, telemetry rollups); support read-time projections where lag-tolerance is too tight for materialization.
- **Contracts honored:** Event Propagation (no silent state), Priority Propagation (recompute discipline), Auditability (projections are derived, never authoritative).
- **Inputs:** subscriber feeds from dispatcher.
- **Outputs:** queryable read models; freshness markers per projection.
- **Survivability:** projection corruption must be recoverable via replay from event store; no projection is canonical.
- **Failure modes:** subscriber lag, drift, partial rebuilds, replay errors.
- **Observability:** lag-behind-event-log per projection, drift detection (replay vs. live diff), rebuild duration, freshness markers exposed in CC.

### 2.3 Dispatcher / Router

- **Responsibilities:** validate incoming event submissions, persist via event store, route to subscribers (projections, engines, integrations), enforce idempotency conventions.
- **Contracts honored:** Event Propagation (commit-after-emit-and-route), Notification Contract gate, Idempotency convention.
- **Inputs:** event submissions from engines, adapters, and command handlers.
- **Outputs:** confirmed events; per-subscriber feeds; emission-failure events on failure.
- **Survivability:** dispatcher must never silently drop; bounded retries with explicit dead-letter visibility.
- **Failure modes:** subscriber down, retry storms, partial routing.
- **Observability:** per-subscriber delivery rate, retry counts, dead-letter count and age.

### 2.4 Receiver-Resolution Service

- **Responsibilities:** given a handoff request, return one named owner per the role model rules, or block with `handoff.blocked_no_receiver`.
- **Contracts honored:** Receiver-Resolution (§8 RC), Anti-Entropy R10 (no null receivers).
- **Inputs:** handoff request (subject, type, context inputs); role registry; coverage records; load metrics.
- **Outputs:** named owner + winning rule reference, or block event.
- **Survivability:** must remain deterministic even under role-registry edits; resolution result depends only on declared inputs.
- **Failure modes:** ambiguous resolution (must surface as block, never random), stale coverage records, overload masking real availability.
- **Observability:** winning-rule histogram, block-on-no-receiver count, resolution latency.

### 2.5 Priority Engine

- **Responsibilities:** compute `priority_score` from typed inputs, manage band thresholds with hysteresis + cooldown, emit `priority.recomputed` only on band crossings.
- **Contracts honored:** Priority Propagation (§6 RC), Anti-Entropy R3 (no hidden priority).
- **Inputs:** subject inputs (deadlines, value, customer tier), risk inputs (vendor reliability, stock, blockers), workflow-state inputs, override events, AI confidence (for AI-related subjects only).
- **Outputs:** subject scores, band labels, `priority.recomputed` events on band changes.
- **Survivability:** weight changes must not retroactively alter committed events; new scores apply from next recompute.
- **Failure modes:** flicker (hysteresis broken), over-recompute (input noise), override unbounded.
- **Observability:** recompute rate, band-flip rate, override active-age, score distribution sanity.

### 2.6 Escalation Engine

- **Responsibilities:** open escalations on red+no-action, run tier ack clocks, jump tiers with typed reason, enforce bounce protection, surface pattern flags.
- **Contracts honored:** Escalation (§3 RC), R2 (no orphans), R8 (no self-clear), R16 (no infinite bounce).
- **Inputs:** band events, ack events, override events, role registry + coverage.
- **Outputs:** `escalation.*` events, tier-skip events, pattern-flag events.
- **Survivability:** every open escalation must reach a terminal state; restarts must not lose ack-clock state.
- **Failure modes:** clock drift across restarts, missed tier transitions, lost pattern flags.
- **Observability:** open by tier, mean ack per tier, tier-skip rate, recurrence rate, suppression-followed-by-recurrence.

### 2.7 Notification Engine

- **Responsibilities:** derive notifications from typed events using audience rules + quiet/loud policy + cooldown; never author independent of an event.
- **Contracts honored:** Notification (§4 RC), R14 (no authoring).
- **Inputs:** events, audience rules, quiet-hour calendars, channel registry, severity policy.
- **Outputs:** notification dispatch records (events themselves), retraction events on policy-violation interception.
- **Survivability:** notification storms must be auto-suppressed and visible; severity-1 must always penetrate quiet hours by definition.
- **Failure modes:** channel down (must fall back, severity-1 only), storm, missed delivery.
- **Observability:** per-role per-day count, read/ack/ignore rates, storm-detector triggers, quiet-hour-bypass count.

### 2.8 AI Suggestion Engine

- **Responsibilities:** create, present, route, gate auto-apply, track lifecycle, capture feedback, support revert, expose calibration health.
- **Contracts honored:** AI Suggestion (§5 RC), R7 (no AI without reversibility), R13 (no hidden AI).
- **Inputs:** AI capability outputs (drafts, parses, routings, anomalies), subject context, owner derivation, reversibility class, policy class, confidence.
- **Outputs:** `ai.suggestion.*` and `ai.action.*` events on the subject timeline; calibration telemetry.
- **Survivability:** an AI subsystem outage must not block subject progress; suggestions degrade gracefully.
- **Failure modes:** mis-calibrated confidence, customer-visible auto-action escape (must be impossible by policy gate), feedback signal loss.
- **Observability:** per-type accept/reject/revert/verify, calibration error, AI-induced-red rate, time-to-action, auto-apply count.

### 2.9 Operational-State Evaluator

- **Responsibilities:** produce per-session primary state + composition layers from triggers (queue reds, escalations, blocked subjects, focus, exec, mobile, AI inbox).
- **Contracts honored:** Operational-State Transition (§7 RC), R8 (sticky states).
- **Inputs:** session identity (role, device), owned-queue band signals, escalation tier ownership, subject blocked flags, user toggles.
- **Outputs:** state events, current-state read for shell.
- **Survivability:** evaluator must be stateless-enough that restart returns the same answer for the same inputs.
- **Failure modes:** disagreement with shell perception (must converge fast), stuck states (sticky-state bugs).
- **Observability:** time-in-state per role per day, transition events, stuck-state detector.

### 2.10 Command-Center Projection Layer

- **Responsibilities:** maintain CC tile projections; serve role-CC variants as scope filters of the same tile catalog; expose freshness; support the morning brief / EOD digest event sources.
- **Contracts honored:** R5 (no parallel surfaces), Priority Propagation, Auditability.
- **Inputs:** all upstream events relevant to tile catalog.
- **Outputs:** read models per tile, brief/digest source events.
- **Survivability:** rebuildable from event store; freshness must be visible — operators must know when CC is lagging.
- **Failure modes:** lag, drift, divergence between CC and underlying state.
- **Observability:** per-tile lag, divergence checks, brief/digest generation events.

---

## 3. Event Store Requirements

Concrete acceptance criteria. Implementation choice deferred.

1. **Append-only.** No update, no delete on committed events. Acceptance: any in-place mutation of a committed event is a P0 invariant violation surfaced by audit-immutability self-check.
2. **Immutable payload.** Once committed, event payload bytes do not change. Corrections occur via new events with `corrected_by` reference.
3. **Attribution.** Every event carries a non-null emitter. `system` and `ai` (with policy class + model identity) are valid named emitters; null is not.
4. **Time honesty.** Every event carries `occurred_at` (wall clock at emission) and `received_at` (store ingestion). Both visible. `occurred_at > received_at` is a flagged anomaly.
5. **Additive schema.** Payload field additions are non-breaking. Field removals/renames are breaking and require a new event type (see §5).
6. **Per-subject ordered log.** For any subject, the store returns events in `(occurred_at, received_at, monotonic-tiebreak)` order, deterministically.
7. **Replay.** The store supports full replay from a marker, returning events in the same deterministic order.
8. **Idempotent acceptance.** Re-submission of an event with the same `event_id` is acknowledged as a duplicate without producing a second commit. Acceptance: observed by replay checks.
9. **Durability.** Acknowledged commit implies survival of single-node failure. Specific durability targets are infra concerns; the runtime contract is "ack means committed".
10. **Availability for read on commit.** Once committed and routed, the event is immediately readable by subscribers and the per-subject log. No "eventual readability" gap that breaks Event Propagation (§1 RC).
11. **No back-dating.** `occurred_at` cannot be set to a value prior to the previous event for the same subject minus a small allowed mobile-clock-drift window (see §7). Out-of-window drift is rejected at submission.
12. **No anonymous events.** Submission without emitter is rejected at submission, not silently filled.
13. **Self-checks.** Periodic immutability and ordering integrity checks emit `runtime.audit.*` events; results visible on orchestration-health surface.

---

## 4. Projection Model

### 4.1 Read-time vs materialized

- **Materialized** when: read frequency is high, lag tolerance is loose-to-moderate (CC tiles, role queues, telemetry rollups, subject pages).
- **Read-time** when: lag tolerance is tight and population is small (e.g. *current* state of a single subject during an active operator action), or read frequency is too low to justify materialization.

### 4.2 Lag tolerance

- CC and role-CC tiles: target sub-second freshness; surface a "stale" indicator if lag exceeds threshold.
- Subject timelines: surface freshness marker; never silently show stale data as fresh.
- Telemetry rollups: minute-grained acceptable.
- Operational-state evaluator outputs: tighter than CC — operator-facing latency budget.

### 4.3 Replay strategy

- Every materialized projection is rebuildable from the event store.
- Rebuild is **idempotent** (running it twice produces the same projection).
- Rebuild can run in parallel to live ingestion; cutover is a typed event.
- No projection is canonical; the event store is the only canon.

### 4.4 Drift detection

- Periodic differential checks: replay-from-marker projection compared against live projection; non-zero diff is a `projection.drift_detected` event.
- Drift triggers: pause writes from the divergent subscriber, surface on orchestration-health, schedule rebuild.

### 4.5 Stale-projection handling

- Every projection exposes a freshness marker; readers get freshness with the data.
- When freshness exceeds threshold, projection surfaces "stale" to consumers (CC tiles dim, "stale" badge); operators are not silently misled.
- `Read-Only` operational state is acceptable on stale projections; write paths refuse.

### 4.6 Rebuild strategy

- Rebuild from event store with idempotent handlers.
- Rebuild emits start/progress/complete events; CC shows rebuild-in-progress per tile.
- Partial rebuilds are supported (per subject type or per tile).

### 4.7 Survivability assumptions

- Loss of all materialized projections is recoverable (event store is canonical).
- Loss of the event store is not recoverable from projections — backup discipline at the event store is therefore the survivability axis (specifics in infra brief).

---

## 5. Schema Evolution Policy

### 5.1 Compatibility classes

- **Additive (non-breaking):** new optional fields, new optional sub-objects, new event types, new emitter values, new priority inputs that default to neutral.
- **Breaking (requires new event type):** field removal, rename, type change, semantic change, required-field addition.

### 5.2 Event-type introduction rules

- New event types may be added at any time; existing subscribers must ignore unknown types gracefully.
- New types must declare: emitter, receivers, required payload, optional payload, priority behavior, escalation timing, dashboard/notification/mobile/AI implications (per the schema doc template).
- New types must register in the event-type registry (a runtime concept, not a code module here) and ship with at least one consumer or projection — orphan event types are forbidden.

### 5.3 Field deprecation policy

- Fields are deprecated, never deleted in place.
- Deprecation announces a sunset date.
- During deprecation, both old and new fields are emitted (writers) and accepted (readers).
- After sunset, writers stop emitting; readers continue accepting until a registry-declared end-of-life.
- Removal of an event type follows the same arc: deprecate → coexist → end-of-life → registry-archived (events remain in the store; nothing is rewritten).

### 5.4 Compatibility guarantees

- Any subscriber written against schema version V continues to function against any V' ≥ V where only additive changes have occurred.
- Replay of historical events is always valid against current readers, because additive-only readers tolerate older payloads.

### 5.5 Projection safety

- Projections version themselves; a breaking change implies a new projection rebuilt from history, not an in-place mutation of the old one.
- Old and new projections may coexist during transition; consumers (CC, shell) declare which version they read.

### 5.6 Versioning philosophy

- **Schema is the runtime's spine; do not mutate the spine.** Add, deprecate, replace — but never edit in place.
- Every schema change emits a typed `runtime.schema.*` event (added, deprecated, end-of-life). The schema's own lifecycle is observable.

---

## 6. Idempotency Convention

### 6.1 Redelivery expectations

- Subscribers must assume any event may be delivered more than once.
- The dispatcher provides at-least-once delivery; exactly-once is an illusion.

### 6.2 Subscriber discipline

- Every event carries a stable `event_id`.
- Subscribers maintain a per-source dedupe horizon (sliding window of recently-handled `event_id`s) sufficient to absorb retries.
- Side-effects within a subscriber must be either:
  - **Naturally idempotent** (e.g. setting a state to a specific value), or
  - **Guarded by event_id** (e.g. "send notification N for event_id E only once").

### 6.3 Replay safety

- Replay must produce identical projections.
- Subscribers must distinguish *replay* from *live* only when necessary (e.g. notifications must not re-fire on replay; projections must rebuild silently).
- Replay carries a typed marker that subscribers honor.

### 6.4 Duplicate suppression

- Event store rejects exact duplicates by `event_id`.
- Logically-duplicate-but-different-id events (e.g. two adapters parsing the same vendor email) are suppressed at adapter level by content-hash dedupe, not in the event store. The store records what was emitted.

### 6.5 Side-effect safety philosophy

- **Side effects belong in dedicated subscribers**, not buried inside projections.
- Projections are pure; rebuilding them never sends notifications or fires AI actions.
- Notification and integration subscribers maintain their own idempotency keys and quiet-on-replay markers.

---

## 7. Clock + Ordering Policy

### 7.1 occurred_at vs. received_at

- `occurred_at` — wall clock at the emitting source. Operationally meaningful (the time the operator did the thing).
- `received_at` — wall clock at the event store at ingestion.
- Both are persisted, both are visible.

### 7.2 Ordering guarantees

- Per-subject ordering: deterministic by `(occurred_at, received_at, event_id)` tiebreak.
- Cross-subject ordering: not guaranteed. Operators reason within subjects.

### 7.3 Mobile clock drift handling

- Mobile devices may submit events with `occurred_at` slightly in the past or future relative to the store.
- A bounded **drift tolerance window** is allowed (specific value is policy, not architecture).
- Out-of-window drift → submission rejected with typed reason; the device is invited to resync.
- Within-window drift is accepted; ordering uses tiebreak.

### 7.4 Delayed event handling

- Events emitted but delayed in transit (e.g. mobile offline) are accepted on reconnection if within retention window.
- Delayed events do not retroactively fire notifications (notification subscribers honor an "if event was old at time of receipt, suppress" rule).
- Projections incorporate delayed events on receipt; projection ordering remains deterministic by `occurred_at`.

### 7.5 Out-of-order handling

- Out-of-order events within retention window are accepted.
- Subscribers must not assume monotonic arrival; they must tolerate late inserts.
- Projections may surface a "late insert" marker if a backfilled event would have changed a recently-emitted band/state.

### 7.6 Replay ordering

- Replay always uses `(occurred_at, received_at, event_id)`.
- Replay does not invent ordering; it reproduces history exactly.

### 7.7 Honesty over certainty

- The runtime never silently "fixes" timestamps. If a clock is wrong, the system shows it.
- Operators trust honest data; they do not trust opaque cleanup.

---

## 8. Failure + Recovery Contracts

### 8.1 Emission failure

- **Containment:** failed emission produces `runtime.emission_failed` event in a runtime-internal channel; submitter receives explicit failure (not silent success).
- **Visibility:** orchestration-health surface shows emission-failure rate; non-zero is loud.
- **Recovery:** submitter retries with same `event_id` (idempotency); after bounded retries, dead-letter with surfaced visibility.

### 8.2 Subscriber lag

- **Containment:** projections expose freshness; CC tiles dim or show "stale" if beyond threshold.
- **Visibility:** per-subscriber lag in orchestration-health.
- **Recovery:** auto-catchup; if catchup fails, rebuild from event store.

### 8.3 Projection drift

- **Containment:** drift-detected event pauses writes from the divergent subscriber.
- **Visibility:** orchestration-health alert; CC banner.
- **Recovery:** rebuild from event store; cutover via typed event.

### 8.4 Override storms

- **Containment:** override events are typed and counted; sustained excess triggers a runtime-level cap (e.g. suppressions per role per day) that requires two-key release.
- **Visibility:** suppressions on CC; override-rate trend in telemetry.
- **Recovery:** ops review; override audit.

### 8.5 Escalation deadlocks

- **Containment:** tier-skip-with-reason ensures progression; bounce protection prevents loops.
- **Visibility:** open-escalation-by-tier metric; "oldest open escalation" age surfaces if non-trivial.
- **Recovery:** ops takeover; pattern-flag review.

### 8.6 Receiver-resolution failure

- **Containment:** `handoff.blocked_no_receiver` instead of null assignment; sender notified with surfaced reason.
- **Visibility:** block count in telemetry; CC overload tile lights when role gap is the cause.
- **Recovery:** lead acts; delegate added to coverage record; resolution re-runs.

### 8.7 AI-induced-red ceiling breach

- **Containment:** auto-apply for the affected suggestion type is suspended automatically; suspension is a typed event.
- **Visibility:** CC AI rejection-rate hotspots tile + `ai-policy-owner` notified.
- **Recovery:** policy review; recalibration; explicit re-enable via two-key.

### 8.8 Stale-client event replay

- **Containment:** clients submitting events with old session markers receive a typed "stale session" rejection; mobile clients are invited to resync state.
- **Visibility:** stale-submission rate in orchestration-health.
- **Recovery:** client refresh; if persistent, force-refresh signal.

### 8.9 Partial outage survivability

- **Component partitioning:** the runtime degrades component-by-component, not as a whole.
  - Event store down → submissions queue at ingress with bounded buffer; reads from projections continue with stale freshness markers; **no fabricated "best-guess" writes**.
  - Notification engine down → events still commit; notifications backlog and replay, with stale-suppression rule preventing alarm-flood on recovery.
  - AI engine down → suggestions pause; subjects continue; CC shows "AI assist unavailable".
  - Receiver-resolution down → handoffs block on no-receiver; senders see explicit block; ops surface lights up.
- **Visibility:** orchestration-health surface always shows component status.
- **Recovery:** components rejoin; replay catches projections up; degraded-mode events emit start/end markers.

### 8.10 Universal recovery posture

- **No silent recovery.** Every recovery emits typed start/progress/complete events.
- **No fabricated state.** When uncertain, the runtime surfaces uncertainty rather than guessing.
- **No retroactive notifications.** Recovery never replays alarms operators would have already seen had the system been healthy.

---

## 9. Runtime Observability Philosophy

### 9.1 Two surfaces

- **Operational health** — surfaces from `ACCENTOS_OPERATIONAL_TELEMETRY.md`: blocked-time, breach rates, AI trust, escalation patterns.
- **Orchestration health** — runtime self-state: emission failures, subscriber lag, projection drift, dead-letter age, schema-registry events, dedupe horizon size, replay-vs-live diffs, component status.

### 9.2 Visibility rules

- Every signal has a threshold and a verb (per telemetry doc).
- Orchestration-health is visible to ops and exec on CC; not buried in admin.
- Every health signal traces to typed events.

### 9.3 Runtime drift detection

- Periodic replay-vs-live differential checks for materialized projections.
- Audit-immutability self-checks on event store.
- Schema registry self-check (every emitted event type appears in the registry).
- Receiver-resolution determinism check (replay a sample of resolutions; result must match prior outcome).

### 9.4 Anti-entropy validation

- The 20 invariants in `ACCENTOS_ANTI_ENTROPY_RULES.md` map to runtime monitors:
  - Null-receiver count (R10).
  - Unowned-subject count (R6).
  - Silent-mutation detector (R11) — projection-vs-event-log diff.
  - Hidden-AI detector (R13) — subject mutations without AI events when AI policy class indicates AI.
  - Notification-without-event detector (R14).
  - Override-without-typed-event detector (R9).
  - Sticky-state-self-clear detector (R8).
  - Bounce-loop detector (R16).
  - Anonymous-event detector (R18).
  - Bypass-without-override detector (R12).
- Each monitor emits typed events on violation; CC shows anti-entropy banner if any monitor is non-zero in the rolling window.

### 9.5 Blocked-state visibility

- Blocked-time share per role per day is on operational-health surface.
- Blocked reason mix is exposed.
- Internal-blocking ratio (blocked-on-self) is the ops-actionable signal.

### 9.6 Escalation visibility

- Live escalation feed on CC.
- Tier-skip rate, recurrence rate, suppression-followed-by-recurrence on operational-health.
- Pattern flags surface weekly.

### 9.7 Optimization stance

- The runtime optimizes for **observability first, performance second, convenience third**. A faster path that hides state is not an acceptable trade.

---

## 10. Runtime Implementation Readiness Checklist

Implementation may begin only when **all** predicates hold. Each is a typed predicate the runtime team can confirm "yes/no" against.

1. ✅ The 9 workflow/orchestration documents are approved and referenced from this brief.
2. ✅ This brief is approved.
3. ☐ Event-type registry exists as a maintained artifact (initial version generated from `ACCENTOS_EVENT_AND_HANDOFF_SCHEMA.md`).
4. ☐ Role registry artifact exists (initial version from `ACCENTOS_ROLE_AND_RECEIVER_MODEL.md`) including escalation chain and acting-lead coverage stubs.
5. ☐ Priority weight & threshold registry exists (initial values defined by ops, owned by ops, tunable without architecture change).
6. ☐ Reversibility-and-policy class registry exists for AI capabilities, with initial entries for: routing, drafting, parsing, anomaly flag, action, outbound message.
7. ☐ Quiet-hours / business-calendar registry exists per role and per region.
8. ☐ SLA/clock policy registry exists (handoff SLAs, escalation tier acks, drift tolerance window, cooldown windows, hysteresis deltas).
9. ☐ Coverage record schema exists (OOO + delegate per role).
10. ☐ Decision recorded: single-tenant for v1; tenant-attribution slot reserved in payloads (unset).
11. ☐ Decision recorded: drift tolerance window value.
12. ☐ Decision recorded: dead-letter horizon and surface ownership.
13. ☐ Decision recorded: projection lag thresholds per surface.
14. ☐ Decision recorded: schema deprecation default sunset window.
15. ☐ Decision recorded: anti-entropy monitor cadence.
16. ☐ The runtime team confirms idempotent-handler discipline as a hiring/review-time invariant — not just a doc item.
17. ☐ A handoff plan exists for: how shell-v2 submits commands (not events) and consumes projections.
18. ☐ A handoff plan exists for: how integrations (vendor email, calendar, payment) emit typed events through adapters.
19. ☐ Anti-entropy monitor coverage map exists: each of the 20 rules has at least one runtime monitor named (even if not yet implemented).
20. ☐ A migration / first-data plan exists (acknowledged out of v1 scope; placeholder) so the runtime is not surprised by historical data later.

When predicates 3–20 flip to ✅, runtime implementation phase 1 may begin.

---

## What this brief deliberately omits

- Technology choices (storage engine, message bus, language, framework, hosting).
- Concurrency and consistency model specifics (defined as contracts above, not as mechanisms).
- Auth/identity (consumed as an interface).
- Specific numerical thresholds (owned by ops as tunable policy).
- UI implementation details (shell-v2 concern).
- Cost, scaling, deployment topology (infra brief, separate phase).
- Training / inference specifics for AI capabilities (capability-level concern, separate brief).
