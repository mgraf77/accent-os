# AccentOS — Runtime Survivability Audit

**Mode:** Runtime architecture / specification (no implementation)
**Anchors:** all prior workflow + runtime docs
**Purpose:** Walk the runtime spine and name, for each survivability concern, how it is **detected, contained, recovered**, and what observability + prevention rules apply. The runtime favors graceful degradation over idealized reliability.

---

## 0. Audit posture

- **Honesty over apparent smoothness.** Under uncertainty, the runtime surfaces uncertainty.
- **Layered defenses.** Adapter idempotency + event-store dedupe; receiver resolution + handoff readiness; AI policy + reversibility class.
- **No silent recovery.** Every recovery is an event.
- **Component-by-component degradation.** The whole system never goes down at once unless the event store itself is lost.

---

## 1. Single points of failure

### 1.1 Event store

- **Risk:** the only canonical store. Loss = catastrophic.
- **Detection:** continuous immutability self-checks; durability acknowledgments at commit; per-subject log integrity.
- **Containment:** writes degrade-to-buffer at ingress (bounded) on transient unavailability; reads from projections continue with stale markers.
- **Recovery:** restore from backup (infra concern); replay reconstructs projections.
- **Observability:** write success rate, end-to-end emission latency, durability ack rate.
- **Prevention:** strict backup discipline (infra), no projection treated as canonical, no in-place mutation under any circumstance.

### 1.2 Dispatcher / router

- **Risk:** if the router fails, nothing routes.
- **Detection:** subscriber lag spikes; submission backlog at ingress.
- **Containment:** ingress queues with bounded depth; explicit failure to submitters when backlog exceeds threshold.
- **Recovery:** dispatcher restart drains queue with idempotent re-routing.
- **Observability:** routing throughput, dead-letter age and depth, subscriber lag.
- **Prevention:** stateless-ish dispatcher (state derived from event store); no business logic inside dispatcher.

### 1.3 Receiver-resolution service

- **Risk:** if it can't resolve, every handoff blocks. (This is a feature, but operationally it can flood.)
- **Detection:** spike in `handoff.blocked_no_receiver`.
- **Containment:** runtime brief §8.6 — sender is notified, ops surface lights up.
- **Recovery:** lead acts (delegate, capacity); resolution re-runs.
- **Observability:** block count, winning-rule distribution.
- **Prevention:** coverage registry completeness check; resolution determinism check via replay.

### 1.4 Priority engine

- **Risk:** if it stops emitting band-changes, CC mirror dies.
- **Detection:** band-change rate drops to zero with non-zero input flux.
- **Containment:** CC tiles surface "priority engine degraded"; existing scores remain visible (last-known); no auto-clear of reds.
- **Recovery:** restart with replay from last marker; recompute on next input change.
- **Observability:** recompute rate, band-flip rate, score-distribution sanity.
- **Prevention:** no engine-local state outside the event-store-derivable model.

### 1.5 Operational-state evaluator

- **Risk:** stuck states, disagreements with shell.
- **Detection:** stuck-state monitor (sticky-state without trigger resolution); shell convergence lag.
- **Containment:** evaluator restart returns same answer for same inputs (statelessish).
- **Recovery:** force re-evaluate per session.
- **Observability:** time-in-state distribution, transition events, stuck detector.

---

## 2. Hidden coupling risks

### 2.1 Projection → adapter coupling

- **Risk:** an adapter that reads a projection (forbidden by R5/boundaries) creates cycles and re-fire risk on rebuild.
- **Detection:** boundary audit; adapter inputs that are not events.
- **Containment:** code review at registry-entry time refuses adapters that don't declare event-only inputs.
- **Prevention:** layer boundary doc enforcement.

### 2.2 Shell → priority coupling

- **Risk:** shell computing local urgency.
- **Detection:** shell code paths emitting bands without consuming `priority.recomputed`.
- **Containment:** shell test harness asserts priority is read, not derived.
- **Prevention:** boundary doc explicit prohibition.

### 2.3 Cross-engine coupling

- **Risk:** escalation engine peeking into AI suggestion engine state, etc.
- **Detection:** any engine reading another engine's internal state directly.
- **Containment:** engines communicate only via typed events.
- **Prevention:** runtime contract §1 (Event Propagation).

### 2.4 Registry → projection embedding

- **Risk:** registry values inlined into projection logic, drifting from registry truth.
- **Detection:** registry diff vs projection-evaluated outcome.
- **Containment:** registry version is recorded on every consuming event; replays reproduce historical behavior; live reads always go to registry.
- **Prevention:** registry artifact spec §12.4 (versioning).

---

## 3. Replay corruption risks

### 3.1 Side-effect re-fire

- **Risk:** notifications, outbound messages, AI auto-actions re-firing on replay.
- **Detection:** notification audit on replay; outbound adapters' delivery records.
- **Containment:** replay marker is typed and honored by side-effect subscribers.
- **Recovery:** if a re-fire occurred, emit `notification.retracted` events; surface incident.
- **Prevention:** side effects in dedicated subscribers, never in projections (boundary § Projections must never).

### 3.2 Non-deterministic replay

- **Risk:** replay produces different projections than live.
- **Detection:** drift detector (replay-vs-live differential).
- **Containment:** pause writes from divergent subscriber, alert.
- **Recovery:** rebuild from event store; cutover via typed event.
- **Prevention:** subscribers must be pure functions of event stream + registry version.

### 3.3 Schema interpretation drift

- **Risk:** reader code interpreting an old event with new semantics.
- **Detection:** events declare emission-time schema/registry version; reader replays at that version.
- **Containment:** projection versions diverge cleanly; new projections rebuilt.
- **Prevention:** schema evolution policy (additive-only; new types for breaking).

---

## 4. Duplicate-event risks

### 4.1 Same `event_id` re-submitted

- **Risk:** double-effect.
- **Detection:** event store dedupe rejects duplicate; emits `command.duplicate_ignored`.
- **Containment:** by design.
- **Prevention:** stable `event_id` from emitter.

### 4.2 Logically-duplicate from two sources

- **Risk:** two adapters parsing the same source emitting two distinct `event_id`s for the same fact.
- **Detection:** content-hash collision detector at adapter level; cross-adapter dedupe events.
- **Containment:** adapter-level dedupe; one adapter per source per direction (adapter contract §3).
- **Recovery:** if duplicates leak, emit `event.superseded_by` correction.
- **Prevention:** registry rule: one adapter per source.

### 4.3 At-least-once delivery in subscribers

- **Risk:** non-idempotent subscriber double-applies.
- **Detection:** projection drift; counter sanity (e.g. count of received POs vs distinct PO ids).
- **Containment:** runtime brief §6 — subscriber discipline mandatory.
- **Prevention:** review-time invariant; adapter/subscriber registration refuses non-idempotent handlers.

---

## 5. Adapter poisoning risks

### 5.1 Drifted parser

- **Risk:** vendor changes email format; parser starts emitting wrong values.
- **Detection:** parse-confidence histogram drops; ambiguity rate climbs; downstream business anomalies (PO ETA shifts en masse).
- **Containment:** adapter auto-degrades; emits `adapter.parse_drift`; downstream events are flagged.
- **Recovery:** suspend adapter, recalibrate, re-emit corrections.
- **Prevention:** confidence calibration discipline; ambiguity-as-event rather than guess.

### 5.2 Two-way sync poisoning

- **Risk:** divergent external state overwrites runtime truth.
- **Detection:** divergence rate, conflict rate.
- **Containment:** auto-suspend writes to external on sustained divergence; reads continue read-only.
- **Recovery:** reconciliation with declared canonical-side rule; corrections via typed events.
- **Prevention:** every two-way adapter declares canonical side per field.

### 5.3 Spoofed inbound

- **Risk:** inbound source is not who it claims (e.g. spoofed vendor email).
- **Detection:** authenticity checks at adapter; emit `adapter.source_unauthenticated` on failure.
- **Containment:** untrusted intake routes to ambiguity surface, never directly to facts.
- **Prevention:** auth at boundary (auth/identity is out of this brief but called out as a hard requirement for inbound parsers handling business-critical content).

---

## 6. Stale-state propagation risks

### 6.1 Stale projection treated as fresh

- **Risk:** operator acts on stale data.
- **Detection:** freshness markers exposed; CC dims stale tiles.
- **Containment:** shell honors freshness; commands carry session_state including projection freshness; runtime can reject commands referencing stale subjects (`command.rejected.stale_view`).
- **Prevention:** freshness as first-class data field; no silent caching.

### 6.2 Stale registry value

- **Risk:** consumer reads cached registry value after a change.
- **Detection:** registry version mismatch on consumed-event records.
- **Containment:** cache TTL bounded; live reads at decision time.
- **Recovery:** purge caches on registry change events.
- **Prevention:** consumers record registry version with every consuming event for replay determinism.

### 6.3 Stale OOO / coverage

- **Risk:** assignment to a person on vacation.
- **Detection:** coverage registry queried at receiver-resolution time.
- **Containment:** resolution rule treats OOO as ineligible; delegate substituted.
- **Prevention:** registry edits are typed events, propagating immediately.

---

## 7. Override abuse risks

### 7.1 Suppression-as-norm

- **Risk:** ops suppresses reds routinely, hiding decay.
- **Detection:** suppression count + reason mix in telemetry; suppression-followed-by-recurrence flag.
- **Containment:** suppression budget per role per day; two-key release for further suppressions.
- **Recovery:** ops review weekly; budget tightening.
- **Prevention:** CC accountability tile (suppressions today + reason); R15 (no unbounded suppressions).

### 7.2 Pin abuse

- **Risk:** subjects pinned indefinitely, distorting priority.
- **Detection:** pin active-age distribution; reaffirmation rate.
- **Containment:** pins decay automatically; reaffirmation requires fresh typed event with reason.
- **Prevention:** registry-bound pin TTL caps.

### 7.3 Readiness-bypass abuse

- **Risk:** leads bypass readiness predicates routinely.
- **Detection:** bypass-with-override count per handoff type per role.
- **Containment:** sustained bypass per type triggers contract review (the readiness predicate may be wrong).
- **Prevention:** every bypass is a typed override event with reason; CC visibility.

---

## 8. Projection drift risks

- **Risk:** materialized projection diverges from event-derived truth.
- **Detection:** periodic differential checks (replay-from-marker vs live).
- **Containment:** divergent subscriber paused; CC banner.
- **Recovery:** rebuild from event store; cutover via typed event.
- **Prevention:** subscribers pure; no out-of-band mutation paths.

---

## 9. Escalation deadlock risks

- **Risk:** escalation loops between tiers without resolution.
- **Detection:** bounce counter per subject; pattern flags.
- **Containment:** bounce protection — re-red within window jumps tier instead of re-escalating to same owner.
- **Recovery:** ops takeover; pattern review.
- **Prevention:** registry-defined bounce window; tier-skip-with-reason mandatory.

---

## 10. AI-induced cascading risks

### 10.1 AI-induced red cascade

- **Risk:** an AI auto-applied action triggers downstream reds; if uncaught, more AI auto-applies pile on.
- **Detection:** AI-induced-red ceiling per type.
- **Containment:** auto-apply for the type suspends automatically on ceiling breach.
- **Recovery:** review → recalibrate → two-key re-enable.
- **Prevention:** ceilings registered per AI capability; reversibility-class gating; customer-visible always human-required.

### 10.2 AI feedback poisoning

- **Risk:** mis-labeled feedback (rejects logged as accepts) corrupts calibration.
- **Detection:** calibration error trending up while accept rate trends up — inconsistent.
- **Containment:** feedback signals carry typed reasons; outliers flagged.
- **Recovery:** purge poisoned feedback window; recalibrate.
- **Prevention:** feedback events are typed and reviewable; no silent calibration shifts.

---

## 11. Stale-client event replay risks

- **Risk:** client (mobile especially) submits commands referencing state it last saw hours ago; subject has moved on.
- **Detection:** session_state freshness compared at submission; stale → typed rejection `command.rejected.stale_view`.
- **Containment:** rejection visible to client with refresh prompt.
- **Recovery:** client refreshes, reissues with new `command_id`.
- **Prevention:** session_state declared on every command; runtime reads at decision time.

---

## 12. Partial outage scenarios

### 12.1 Notification engine outage

- Events still commit. Notifications backlog. On recovery, stale-suppression rule prevents alarm flood. CC component status shows degraded.

### 12.2 AI engine outage

- Suggestions pause for affected capabilities. Subjects continue without AI assist. CC shows AI assist unavailable. Auto-applied items in flight complete or revert per reversibility class.

### 12.3 Receiver-resolution outage

- Handoffs block on no-receiver. Senders see explicit block. Ops surface lights up. Recovery resumes resolution.

### 12.4 Adapter outage

- Inbound: source backlog accumulates within bounded buffer; once buffer full, source-side queues (or drops, depending on source). `adapter.source_stale` emitted. Outbound: directives queue; once depth exceeds threshold, refuse new outbound.

### 12.5 Projection store outage

- Reads fail with explicit "projection unavailable"; CC shows degraded. Writes (event store) continue. Recovery rebuilds projections from event store.

### 12.6 Whole-runtime outage

- Catastrophic. Ingress queues at boundary if available; otherwise external systems experience submission failures (typed). On recovery, replay rebuilds projections; events submitted during outage are processed in arrival order; deduplication prevents double-effect.

---

## 13. Universal recovery rules

- Every degradation emits start/end events.
- Recovery never re-fires alarms operators would have seen had the system been healthy.
- Recovery never fabricates state.
- Replays produce identical projections.
- Operators always know component status.
- The event store is sacred; everything else can be rebuilt.

---

## 14. Anti-entropy mapping (audit cross-reference)

| Risk | Anti-entropy rule(s) |
|---|---|
| Silent state mutation | R11, R13 |
| Null receivers | R10 |
| Hidden priority | R3 |
| Override abuse | R9, R15 |
| Bypass without override | R12 |
| Sticky-state self-clear | R8 |
| Bounce loops | R16 |
| Hidden AI work | R7, R13 |
| Notification authoring | R14 |
| Anonymous events | R18 |

---

## 15. What this doc deliberately omits

- Specific failure thresholds and alert routing.
- Backup / restore procedures (infra).
- Incident response playbooks (ops).
- DR/BC objectives.
- Identity / auth failure modes.
