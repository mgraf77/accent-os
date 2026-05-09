# AccentOS — Integration Adapter Contract

**Mode:** Runtime architecture / specification (no implementation)
**Anchors:** runtime brief, command vocabulary, all workflow docs
**Purpose:** Define how external systems reach the runtime — and how the runtime reaches out — without poisoning the spine. Adapters are bounded translators, not magic.

---

## 0. Design rules

1. **Adapters translate, they don't decide.** External signal → typed event. No business logic.
2. **Adapters are subscribers and emitters of typed events**, not direct projection writers. R11 (no silent state) extends to adapters.
3. **Idempotency is mandatory.** Every adapter carries a stable dedupe key for inbound; every outbound action carries an idempotency key honored by the external system where possible.
4. **Adapters degrade visibly.** `adapter.degraded` events with reason. CC shows component status.
5. **Ambiguity is a typed event, not a guess.** Parsers that aren't sure emit `adapter.parse_ambiguous` and let humans (or AI suggestions) resolve.
6. **No retroactive notifications on recovery.** Replays after outage are quiet.
7. **One adapter per external source per direction.** No fork between two adapters reading the same vendor email account.
8. **Adapters obey schema evolution.** They emit only registered event types; new fields go through registry.

---

## 1. Adapter lifecycle

States: `registered → calibrating → active → degraded → suspended → retired`.

- **registered** — adapter exists in the registry; not yet ingesting.
- **calibrating** — initial period; events emitted with a `calibrating: true` flag; subscribers can choose to treat as advisory until cleared.
- **active** — full participation.
- **degraded** — adapter is up but operating sub-spec (high parse-ambiguity, slow polling, partial source). Events still emit but carry `adapter.degraded` markers; CC shows status.
- **suspended** — no ingestion; pre-existing in-flight items handled, then halted. Suspension is a typed event with reason.
- **retired** — no longer used; events from this adapter are historical only; registry archives the adapter with its end-of-life event.

Transitions are typed events on the orchestration-health surface.

---

## 2. Adapter classes

Five canonical classes. Every external integration falls into one (or composes two).

### 2.1 Inbound parser (e.g. vendor email parser, SMS inbound, webhook ingester)

- **Responsibility:** consume an external feed, parse content, emit typed business events with confidence and provenance.
- **Idempotency:** content-hash + source-message-id dedupe. Re-parsing the same source message produces the same `event_id` (or no event if duplicate).
- **Ambiguity:** below confidence threshold → emit `adapter.parse_ambiguous` with the source pointer and candidate parses; route to AI suggestion engine for human-confirmed disambiguation.
- **Provenance:** every emitted event carries `source_ref` (immutable pointer to original source message), `parse_version` (parser logic version), and `confidence` (0..1).
- **Failure modes:** source-feed down, parser internal failure, schema mismatch (source returns unexpected shape), backlog overflow.
- **Observability:** ingestion rate, parse-confidence histogram, ambiguity rate, dedupe collisions, time-from-source-arrival-to-event-emit.
- **Degraded behavior:** on parser drift (confidence collapsing), auto-degrade and surface; do not silently emit low-confidence events as facts.
- **Anti-patterns:** parsers that synthesize fields not in the source; parsers that retry with new event_ids per attempt; parsers that drop ambiguous parses without typed events.

### 2.2 Outbound sender (e.g. email sender, SMS sender, customer-portal pusher)

- **Responsibility:** consume an outbound directive (typically a command result chain) and deliver to the external channel.
- **Idempotency:** directive carries `outbound_id`; sender records dispatch keyed by `outbound_id`; resubmission is a no-op.
- **Confirmation:** delivery confirmation emits `outbound.delivered` (or `outbound.failed`); both are typed events on the subject timeline.
- **Customer-visible discipline:** outbound senders that touch customers gate on the AI policy class — auto-apply suggestions for outbound customer messages are categorically prohibited (see AI doc, R7).
- **Failure modes:** channel down, recipient invalid, rate-limit, content rejected.
- **Observability:** delivery success rate, latency, bounce rate, channel uptime.
- **Degraded behavior:** queue with bounded depth; once depth threshold breached, emit `adapter.degraded` and refuse new outbound until catchup; never silently drop.
- **Anti-patterns:** retries that mutate `outbound_id`; bypassing customer-visible policy gates; sending without an originating typed directive.

### 2.3 Two-way sync (e.g. calendar sync, accounting sync, document storage sync)

- **Responsibility:** bidirectional synchronization of state between the runtime's typed events and an external system's records.
- **Idempotency:** uses `(external_record_id, runtime_subject_ref)` mapping; both directions dedupe.
- **Source-of-truth resolution:** for any given field, exactly one side is canonical (declared in adapter config). Conflicts emit `adapter.sync_conflict`; never auto-resolved by guessing.
- **Provenance:** every synced delta records direction (`runtime→external` or `external→runtime`) and a sync round identifier.
- **Failure modes:** divergence (both sides changed), webhook miss, polling lag, external API quota.
- **Observability:** sync round latency, conflict rate, divergence rate, ID-mapping integrity.
- **Degraded behavior:** on sustained divergence, auto-suspend writes to the external side; reads continue read-only; surface to operators.
- **Anti-patterns:** "last-write-wins" silent conflict resolution; bidirectional adapters with no canonical-side declaration; webhooks treated as authoritative without dedupe.

### 2.4 AI inference adapter (e.g. text drafting, parsing, anomaly detection, summarization)

- **Responsibility:** deliver AI capability outputs into the AI suggestion engine with confidence, rationale, evidence pointers, and reversibility-class tagging.
- **Idempotency:** request carries an `inference_id` derived from inputs; same inputs → same `inference_id` → cached result emission, no duplicate suggestion.
- **Confidence handling:** every output carries calibrated confidence; below publish threshold → telemetry only; above auto-apply threshold (combined with reversibility class) → may auto-apply via suggestion engine.
- **Calibration discipline:** adapter participates in periodic calibration; uncalibrated periods emit `adapter.uncalibrated` and the AI suggestion engine treats outputs as "uncalibrated" until cleared.
- **Failure modes:** model unavailable, prompt failure, hallucinated output (must be detected via grounding checks where possible), confidence-calibration drift.
- **Observability:** per-capability confidence histogram, calibration error, hallucination-suspect rate, latency, fallback rate.
- **Degraded behavior:** on model outage, AI suggestions pause for that capability; human workflow continues; CC shows AI assist unavailable.
- **Anti-patterns:** emitting outputs without confidence; emitting outputs without evidence pointers; using AI inference adapters to write subject state directly (must go through suggestion engine).

### 2.5 Sensor / telemetry adapter (e.g. tracking pixel for quote-viewed, geofence trigger, IoT scan)

- **Responsibility:** emit narrowly-scoped typed events on observed external signals.
- **Idempotency:** event de-dup on `(source, signature, timestamp-window)`.
- **Confidence:** typically high (deterministic signal), but adapter still emits `confidence` for uniformity.
- **Failure modes:** signal noise, replayed pixels, GPS drift.
- **Observability:** signal rate, dedupe collisions, anomaly rate.
- **Anti-patterns:** treating sensor noise as authoritative; using sensor adapters to drive priority scores directly (priority engine consumes the typed events, not the raw signals).

---

## 3. External-source ingestion rules

- **Single ingress per source.** Two adapters cannot read the same source feed in parallel.
- **Source-ref is immutable.** Every emitted event references the original source artifact; the adapter does not mutate or summarize away provenance.
- **Bounded in-flight.** Adapters carry an in-flight buffer with declared maximum; overflow → `adapter.degraded` and refuse new intake until drained.
- **Backpressure visibility.** Buffer depth is on orchestration-health.

---

## 4. Adapter idempotency (cross-class rules)

- **Inbound:** content-hash + source-id keying.
- **Outbound:** directive-supplied `outbound_id`.
- **Two-way:** mapping table `(external_id ↔ runtime subject_ref)`; dedupe both directions.
- **AI inference:** input-hash → `inference_id`.
- **Sensor:** `(source, signature, time-window)`.

Any adapter without a stable idempotency key is **not allowed in the registry**.

---

## 5. Parse ambiguity handling

When an inbound parser cannot resolve a value with sufficient confidence:

1. Adapter emits `adapter.parse_ambiguous` with: source pointer, candidate parses, why-uncertain, suggested human action.
2. AI suggestion engine creates a suggestion (`[D]`-class) for the relevant subject owner.
3. Human accepts → typed business event emitted, with attribution: AI-assisted parse, owner-confirmed.
4. Human rejects → adapter records the rejection signal as feedback (per-type calibration data).
5. Time-out without resolution → escalates per the suggestion's defer rules.

**Never:** parser silently picks the highest-confidence candidate above its own ambiguity threshold and emits as fact.

---

## 6. Adapter degradation visibility

- Every adapter exposes a status: `active | calibrating | degraded | suspended | retired`.
- Status changes emit typed events; CC orchestration-health tile shows current status.
- Degradation reasons are typed: `source_unreachable`, `parse_drift`, `quota_exhausted`, `divergence`, `calibration_lost`, `backlog_overflow`.
- Operators see degradation in the same surface as any other operational signal — no hidden adapter dashboards.

---

## 7. Retry discipline

- **Bounded retries** with exponential backoff per adapter class; specific values are policy.
- **Same idempotency key across retries.** Re-attempts must not generate new event_ids; the runtime relies on this.
- **Dead-letter** with surfaced age and ownership when retries exhaust.
- **No retry storms.** Adapter-level cap; if cap hit, transition to `degraded` and emit a single typed event, not a flood.
- **Outbound retry on customer-visible** is conservative — customer-visible delivery prefers fail-loud over retry-into-double-send.

---

## 8. Replay behavior

- Adapters treat replay markers per the idempotency convention (runtime brief §6).
- On runtime replay, adapters do **not** re-fire outbound side effects; they recompute projections only.
- On adapter recovery (after `degraded → active`), backlog drains in arrival order; outbound senders apply the stale-suppression rule for items past their relevance window.
- Inbound parsers re-running over historical sources must produce the same events (deterministic parse) or emit `adapter.parse_drift` if outputs change versus prior emissions.

---

## 9. Adapter observability

Per adapter:

- **Status & status changes** (typed events).
- **Throughput** (events per minute).
- **Latency** (source-arrival → event-emit).
- **Confidence histogram** (where applicable).
- **Ambiguity rate** (where applicable).
- **Dedupe-collision rate.**
- **Error rate by failure mode.**
- **Backlog depth.**
- **Two-way: conflict rate, divergence rate.**
- **AI: calibration error, hallucination-suspect rate.**

Surfaced on orchestration-health; AI adapters additionally surfaced to `ai-policy-owner`.

---

## 10. Stale-source handling

- Source freshness is part of every adapter's contract: declared expected cadence (e.g. vendor email check every N min).
- Going beyond cadence threshold without intake → `adapter.source_stale` event.
- Stale source is reflected on CC component status; operators are not shown stale data as fresh.
- Stale-recovery emits a typed `adapter.source_recovered`.

---

## 11. AI-parser confidence handling

- Confidence is **calibrated** per capability; uncalibrated capabilities emit `adapter.uncalibrated`.
- Below publish threshold → telemetry-only emissions, never to subject timeline as facts.
- Above publish, below auto-apply: emits typed event marked AI-assisted; goes through suggestion-engine confirmation when subject impact is non-trivial.
- Above auto-apply + reversible-easy + non-customer-visible: may emit business event directly with `auto-applied` attribution; subject to AI-induced-red ceiling (see runtime brief §8.7).

---

## 12. Dedupe philosophy

- **Dedupe at the boundary, not inside the runtime.** Adapters present already-deduped event submissions.
- The event store also rejects exact `event_id` duplicates as a defense in depth, not as the primary mechanism.
- Logical duplicates across distinct sources (e.g. customer emails twice from two addresses) are dedupe at adapter level via content+correlation keys; the event store sees a single submission.
- Dedupe collisions (different content same key) are loud — `adapter.dedupe_conflict` event with both content refs; never silently overwritten.

---

## 13. Outbound side-effect discipline

- Outbound side effects (sent message, calendar event created, AI inference cost incurred) are gated by typed directives — no adapter generates a side effect spontaneously.
- Customer-visible side effects gate through the AI policy and command authority chains.
- Every outbound action emits a delivery confirmation event; failures emit failure events; both are on the subject timeline.
- On replay, outbound side effects do not re-fire; the dispatcher's replay marker prevents this.

---

## 14. Anti-patterns

- Adapters bypassing the schema registry to emit ad-hoc fields.
- Adapters that retry with new `event_id`s on each attempt.
- Adapters that silently drop ambiguous parses.
- Two-way adapters without a declared canonical side.
- Outbound senders that fire from projections rather than typed directives.
- AI inference adapters that mutate subject state directly.
- Adapters with no observability surface.
- "Best effort" adapters with no degraded-state contract.
- Hidden retry loops that mask source outage.
- Adapters that synthesize fields the source did not contain.
- Adapters that "auto-resolve" two-way conflicts by guessing canonical side.

---

## 15. What this doc deliberately omits

- Specific external API choices (vendor of email, calendar, payments).
- Wire formats (JSON, protobuf, etc.).
- Specific retry numbers, backoff curves, polling cadences (policy).
- AI model selection.
- Authentication/credential handling for external systems.
