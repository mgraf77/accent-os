# AccentOS — Runtime Contradiction Audit

**Mode:** Identify, explain, recommend resolution path. **Do not resolve.**
**Status:** Findings to be triaged before Implementation Phase 1 ingests.

---

## 0. Methodology

Walked the 28 architecture-spec docs looking for: conflicting assumptions, overlapping registry responsibilities, command/event ambiguity, replay inconsistencies, authority ambiguity, stale-state ambiguity, degradation conflicts, projection ownership conflicts, shell/runtime boundary ambiguity. Each finding states: **what conflicts**, **why it matters**, **recommended resolution path** (without prescribing the answer).

---

## C1. `procurement.po.eta_set` emitter ambiguity

- **Conflict:** event-type registry v0 lists emitter as `adapter / pm`; command registry v0's `procurement.po.set_eta` allows emitter `pm / adapter` for the command. The same event can come from either an adapter (parsed vendor email) or a pm (manual entry). Both are valid, but downstream consumers (priority engine, AI suggestion engine) may treat parsed-with-confidence differently from manually-entered.
- **Why it matters:** confidence semantics differ. A pm-entered ETA is implicitly confidence=1 (human assertion); an adapter-emitted ETA carries calibrated confidence < 1. If downstream code conflates these, calibration metrics get poisoned.
- **Resolution path:** declare the convention — events from `pm` carry implicit confidence=1; events from `adapter` carry the parser confidence in payload. Document this in the event-type registry as a payload semantic, not just a field. Either:
  - (a) add a required `source_confidence` field defaulting to 1.0 on human emission, parser-supplied for adapter emission; or
  - (b) split into two event types (`procurement.po.eta_set` for human; `procurement.po.eta_parsed` for adapter) — additive only.

---

## C2. Adapter-as-emitter vs. command-as-causal-chain

- **Conflict:** the adapter contract says adapters emit typed events directly. The command vocabulary says "shell submits commands; runtime emits events." Adapters are not shell, but they also are not command-issuing actors. Two paths to event emission exist: command-derived (via dispatcher → engine → event) and adapter-direct (via adapter → dispatcher → event).
- **Why it matters:** "events come from one place" is implied but not literally true. The dispatcher *is* the single emission point, but adapters bypass the command-validation lifecycle.
- **Resolution path:** declare that the dispatcher is the universal event-emission gate, and adapters submit *event candidates* through a parallel adapter-ingress contract that performs its own validation (schema check, idempotency, source-auth). Document the two ingress paths explicitly: command path (validates authority + readiness + business rules) and adapter path (validates schema + auth + idempotency). Both feed the same event store.

---

## C3. AI suggestion accept → command vs. AI suggestion accept → event

- **Conflict:** `ACCENTOS_COMMAND_VOCABULARY.md` § 12 says "AI does not submit commands as itself. The pattern is: AI emits `ai.suggestion.created` → human emits `ai.suggestion.accept` command → runtime, on accept, emits the underlying business command on behalf of the subject owner." But event-type registry v0 lists `ai.suggestion.applied` as a system-emitted *event*, not a command. The phrase "the underlying business command" is ambiguous: is it a synthetic command run through the dispatcher, or a direct event emission?
- **Why it matters:** if synthetic commands run through the dispatcher, full validation applies (good — same gates). If events are emitted directly, AI-on-accept could bypass authority/readiness rules.
- **Resolution path:** declare that on `ai.suggestion.accept`, the runtime synthesizes a command with `submitted_by` = the subject's human owner, `correlation_id` = suggestion_id, and runs it through the dispatcher exactly like a human-submitted command. The resulting events carry full validation. Document this as the canonical accept-flow in the AI suggestion model and the command vocabulary; remove ambiguity by making "underlying business command" a literal synthetic command.

---

## C4. Two ways to record projection version

- **Conflict:** `ACCENTOS_REGISTRY_ARTIFACTS.md` § 12.4 says consuming events record the registry version they used. The runtime brief § 4.7 says projections version themselves. The terminology doc adds `registry_versions` (plural) to projection reads. There are at least three version concepts: per-event registry-version stamp, per-projection internal version, and per-read multi-registry-version bundle.
- **Why it matters:** version-of-what is muddled. During replay, do we replay against the registry version at event time, the projection version at read time, or both? If a registry was edited mid-event-stream, what does the projection show?
- **Resolution path:** publish a short "versioning model" doc (or amend the runtime brief) declaring three explicit version concepts:
  1. **Registry version at event emission** — stored on the event for audit determinism.
  2. **Projection schema version** — incremented on breaking projection logic; old/new coexist during cutover.
  3. **Read-time registry version snapshot** — returned with projection data so shell can detect "data computed against registry version V".
  Replay reads each event's stamped registry version. Live reads use current registry. The three are distinct and should never be conflated in code.

---

## C5. Receiver-resolution as command-time vs. event-time

- **Conflict:** the role/receiver model says "receiver is named before `handoff.opened` fires" — i.e. resolution happens at command validation. But the runtime brief lists Receiver-Resolution Service as a separate engine that receives a request and returns a result. Implementation could place this resolution either inside the dispatcher (synchronous with command validation) or as an event-driven follow-up engine.
- **Why it matters:** synchronous in dispatcher = simpler, but couples dispatcher to a non-trivial computation. Async = decoupled, but introduces a window where `handoff.opened` could be emitted before receiver is determined, contradicting the "named-before-open" rule.
- **Resolution path:** declare that receiver resolution is synchronous with command validation — the dispatcher calls the resolution service before emitting the event chain, and rejects with `command.rejected.no_receiver` when resolution blocks. Document this as part of the dispatcher's contract obligations in the runtime brief.

---

## C6. Operational-state evaluator: server-side vs. shell-side

- **Conflict:** the operational state model treats state as runtime-determined. The shell-runtime brief says shell *reads* state from the evaluator. But shell also submits `session.declare_state` to *propose* state changes. This implies state is co-managed: some triggers are runtime-detected (queue red, escalation), others are shell-initiated (Focus on/off). The boundary of which side "owns" state is ambiguous.
- **Why it matters:** if shell can override evaluator output, sticky-state invariants (R8) are at risk. If runtime ignores user toggles, Focus and similar UX states don't work.
- **Resolution path:** declare that the evaluator is authoritative, and shell submissions are *inputs* (`session.declare_state` as an input event), not overrides. The evaluator computes the result given all inputs; sticky-state rules cannot be bypassed by user toggles. Update the operational state model to list evaluator inputs explicitly: queue band signals, escalation tier ownership, subject blocked flags, user state toggles, session device class.

---

## C7. CC and role-CC: separate projections or one with filter?

- **Conflict:** the CC spec says "role-CC variants are scope filters of the same projection set". The runtime brief § 2.10 lists CC projection layer as a single component. But role-CC variants have different tile layouts (sales-lead CC ≠ ops CC), which suggests not just filter but partial-projection selection.
- **Why it matters:** if role-CC is a filter, performance is uniform but tiles must be universally computable. If role-CC is selection, the projection layer holds N tile sets.
- **Resolution path:** declare a hybrid: tile *contents* are projections of the same underlying event-derived data (one priority spine, one event log); tile *selection* per role-CC is a registry-driven layout configuration, not a separate computation. A new tile-layout-registry (subset of CC spec, owned by ops) declares which tiles each role-CC includes. This keeps the priority spine single-sourced while letting layouts vary.

---

## C8. AI capability registry vs. event-type registry on `customer.message.sent`

- **Conflict:** `customer.message.sent` is an event in the event-type registry, emitted by rep/system. But many of these messages are AI-drafted via `ai.draft.first_response` etc. The chain is: AI suggests → human accepts → outbound adapter sends → `customer.message.sent` emitted. Where does AI involvement appear on the timeline? The AI registry says AI work is on the subject timeline; the event registry shows only `customer.message.sent` without an AI marker.
- **Why it matters:** if a rep's edited-then-sent draft is later questioned ("did AI write that?"), the timeline must answer.
- **Resolution path:** require `customer.message.sent` (and similar customer-visible outbound events) to carry an optional `ai_correlation_id` field referencing the originating `ai.suggestion.applied` event when AI was involved. The accept→command synthesis (see C3) propagates the suggestion id through the command into the emitted event. Add this as an additive payload field across customer-visible outbound events.

---

## C9. `subject.reassigned` vs. `subject.taken_over`

- **Conflict:** event-type and command registries list both. They look similar but differ in whether prior owner remains attributable for past actions (per role/receiver model § 12). The distinction is important but not surfaced uniformly across docs.
- **Why it matters:** UX, audit, and SLA-restart semantics depend on which one occurred. Conflating them in implementation would break audit attribution.
- **Resolution path:** add a one-line semantic header to each in the event-type registry:
  - `subject.reassigned` — soft transfer; original owner remains attributable for prior actions; new owner takes the clock from now.
  - `subject.taken_over` — typically by lead+; new owner takes over with prior actions still attributed to original. SLA semantics: handoff in flight is canceled and re-issued; SLA resets.
  Make the difference explicit in payload (`reassignment_kind` enum) or keep two events but with prominent semantic annotation. Either is fine; both must agree.

---

## C10. Suppression budget per-role-per-day vs. two-key gating

- **Conflict:** policy defaults v0 § 2 says `subject.suppress_red` budget is 3 per business day combined for ops + exec. But the command requires two-key (ops + exec). With one budget number for two distinct roles, accounting is ambiguous: does each suppression count once, or once per actor?
- **Why it matters:** with two-key, a single suppression involves both actors; counting it twice would over-restrict; counting once but charging it to which role?
- **Resolution path:** clarify in policy defaults: budget is **per suppression event** (counts once regardless of two-key). The budget is org-level, not per-actor. Update the policy doc.

---

## C11. Mobile drift tolerance: ingestion-rejection vs. payload-flag

- **Conflict:** runtime brief § 7 says "out-of-window drift → submission rejected with typed reason; the device is invited to resync." Policy defaults § 1 sets ±5 minutes. But for offline-queued mobile commands replayed on reconnect, the queued `submitted_at` may legitimately be hours old — yet that's not "drift", it's "delay".
- **Why it matters:** ingestion-rejection on legitimate offline replays would lose field captures.
- **Resolution path:** distinguish two cases:
  1. **Live submission with skewed clock** — drift; subject to ±5-minute window; reject if outside.
  2. **Offline-queued replay** — delay; detected by `submitted_at` < now − threshold AND queue marker present; accepted; ordering uses tiebreak.
  Document the distinction in the runtime brief § 7 and the shell-runtime brief § 1.3. Mobile clients must mark queue replays explicitly so the runtime can apply the right policy.

---

## C12. Outbound adapter as authority gate vs. command-authority registry

- **Conflict:** outbound adapter contract § 13 says outbound side effects are gated by typed directives — adapter never fires spontaneously. Customer-visible side effects gate through "AI policy and command authority chains". But the command-authority registry lists per-command authority; adapters are downstream of commands. Where exactly does customer-visible authority enforcement happen — in the dispatcher (command time) or in the adapter (send time)?
- **Why it matters:** double-gating is fine; **single-gating only at adapter** would mean a pre-validated command could carry a customer-visible payload without command-time authority check.
- **Resolution path:** declare command-time as primary gate (dispatcher refuses commands lacking authority for customer-visible side effects). Adapter-time is a second-line check (refuse to send if directive lacks the customer-visible flag confirmed). Document this dual-gate explicitly in the adapter contract and command vocabulary.

---

## C13. Event-store retention vs. replay-from-historical projection rebuild

- **Conflict:** policy defaults § 11 sets hot retention at 24 months. Projection rebuild (§ 4) replays from the event store. If a projection schema breaks and rebuild is needed beyond 24 months, do we replay from warm or archive tier? The infra brief allows this but the runtime brief implies seamless rebuild.
- **Why it matters:** rebuild durations from cold storage may be operationally unacceptable.
- **Resolution path:** declare that breaking-projection rebuilds operate against the hot tier; rebuilds spanning warm tier require ops-approved long-running rebuild with declared duration; archive-tier rebuilds are catastrophic-recovery only. Document this stratification in the runtime brief § 4 and the infra brief § 3.

---

## C14. AI calibration cadence vs. recalibration triggers

- **Conflict:** policy defaults § 13 sets cadences (weekly etc.). AI capability registry says recalibration also triggers on parse-drift events and induced-red events. The interplay between scheduled cadence and event-triggered recalibration is unstated.
- **Why it matters:** if both fire close together, recalibration thrash; if scheduled is the only path, drift events get under-served.
- **Resolution path:** declare event-triggered recalibration takes precedence; scheduled recalibration is a floor (runs at most once per cadence interval if no event-triggered run occurred). Document in the AI suggestion model and policy defaults.

---

## C15. Command-authority registry overlap with role-default-authorities

- **Conflict:** the role registry v0 declares default authorities per role (e.g. "designer can issue spec lifecycle commands"). The command-authority registry declares per-command who has authority. Both convey the same information from different sides.
- **Why it matters:** if both are sources of truth, they can drift. If one is canonical and the other is derived, drift detection works.
- **Resolution path:** declare the **command-authority registry is canonical**; the role registry's "default authorities" field is a human-readable summary, generated/checked from the command registry. Document this in the registry artifacts spec, and add a runtime self-check that flags divergence between the two.

---

## C16. `service.ticket.mark_severity_1` event semantics

- **Conflict:** command registry v0 says success → "service.ticket.opened (severity update via correction) + escalation.opened". But events are immutable; "severity update via correction" is shorthand for what is structurally a new typed event referencing the prior ticket event. The command-to-event mapping is unclear.
- **Why it matters:** if implemented as a mutation of the original ticket event, R11 (immutability) is violated.
- **Resolution path:** add a typed event `service.ticket.severity_changed` to the event-type registry (additive), emitted as a follow-up to a `service.ticket.opened`. The original event is unchanged; the timeline carries both. Document this pattern as the canonical "correction via additive event" approach for similar cases (e.g. eta_slipped already follows this pattern).

---

## C17. "Ack" double-meaning: handoff vs. notification

- **Conflict:** "ack" is used for handoff acknowledgment (typed receiver event) and notification acknowledgment (operator dismissing a notification). Different semantics.
- **Why it matters:** terminology drift; future code may conflate.
- **Resolution path:** standardize:
  - Handoff: `handoff.acknowledged` — receiver event.
  - Notification: `notification.acknowledged` (if needed at all — currently notifications carry read-rate, not ack). Decide whether notification acks are a thing in v0; if yes, add to event-type registry; if no, prune from terminology.
  Document in the terminology doc explicitly.

---

## C18. Customer-visible flag: capability-level vs. event-level

- **Conflict:** AI capability registry sets `customer_visible` on the capability. But the same business event (e.g. `customer.message.sent`) is always customer-visible regardless of whether AI was involved. The flag's locus is unclear.
- **Why it matters:** customer-visible authority gating reads the flag at command/event time. If the flag is only on the capability, non-AI commands that send customer-visible content could miss the gate.
- **Resolution path:** treat `customer_visible` as a **command-level** attribute in the command-authority registry, not just a capability attribute. Every command's authority entry declares `customer_visible: yes/no`. AI capabilities mirror the flag from their underlying commands. Document in the command-authority registry shape.

---

## C19. "Read-Only state" vs. "Read-Only access"

- **Conflict:** the operational state `Read-Only` (a per-session mode) vs. role-registry "read scopes" (per-role read access patterns). Both are real; both restrict mutation; conceptually distinct but easy to conflate.
- **Why it matters:** implementation may collapse them and treat all read-only access as a state.
- **Resolution path:** keep distinct. The terminology doc should explicitly separate the two:
  - **`Read-Only` operational state** — session-level UX state.
  - **Read access scope** — role-level authorization to view but not write.
  A session can be in `Normal` state but viewing a subject for which the role only has read access. Both restrict commands the same way at the dispatcher (annotation only), but the *reason* differs and it surfaces differently in the UI.

---

## C20. Snooze wake conditions: time-based vs. event-based

- **Conflict:** policy defaults § 20 says snooze accepted up to 14 days out OR event-driven. The snooze command takes `wake_condition`, which can be a timestamp or a typed event subscription. The shape of an event-based wake condition is not specified.
- **Why it matters:** without a declared shape, snooze wake conditions become an ad-hoc DSL.
- **Resolution path:** declare the wake condition union: `{ kind: "time", at: timestamp } | { kind: "event", event_name, subject_ref }`. Add to command registry's `orchestration.subject.snooze` parameter spec. Restrict event-based wakes to a declared whitelist (e.g. only certain event types qualify).

---

## C21. Adapter degradation reason codes: not unified

- **Conflict:** adapter contract § 6 lists reason codes (`source_unreachable`, `parse_drift`, `quota_exhausted`, `divergence`, `calibration_lost`, `backlog_overflow`). Different adapter classes have different reasons (e.g. `divergence` is two-way-only; `calibration_lost` is AI-only). The unified enum is implied but not specified.
- **Why it matters:** typed events with un-typed reason codes degrade into free text.
- **Resolution path:** unify into one enum in the policy/enums doc, with each value annotated by which adapter classes may emit it. Already flagged as a gap in the registry-v0 enumeration.

---

## C22. Drift tolerance vs. NTP / clock service

- **Conflict:** the infra brief § 12 requires NTP-synced runtime nodes. The runtime brief § 7 sets mobile drift tolerance. These don't conflict directly, but the relationship between server clock honesty and accepted client drift isn't stated. If runtime nodes drift among themselves (NTP failure), accepted client drift compounds.
- **Why it matters:** ordering integrity.
- **Resolution path:** declare that mobile drift tolerance is measured against the event store's `received_at`, which itself relies on NTP-synced runtime clocks. Add a runtime self-check that emits `runtime.audit.clock_drift` when inter-node drift exceeds a tight threshold; treat this as a P0-class event.

---

## Resolution path summary

All 22 contradictions are **resolvable without architecture invention** — they require:

- **5 enum content additions** (C1, C9, C16, C17, C20, C21).
- **8 doc clarifications** (C2, C5, C6, C7, C10, C13, C14, C19).
- **5 additive payload fields** (C1, C8, C18 across multiple events).
- **2 runtime self-checks** (C15, C22).
- **2 explicit pattern documentations** (C3, C11, C12).

None requires a new registry, new engine, or revised contract. They are all in the "convergence" category — sharpening existing decisions, not replacing them.

---

## Recommended triage order

1. **Highest blast radius first** — C3 (AI accept synthesis), C5 (receiver-resolution timing), C12 (customer-visible double-gate). Implementation correctness depends on these being explicit.
2. **Audit-affecting** — C9 (reassign vs takeover), C16 (severity correction pattern), C8 (AI correlation on outbound). Without resolution, audit attribution is muddled.
3. **Versioning** — C4. Implementation needs the three-version model before building projection cutover.
4. **Performance / operational** — C7 (CC layout), C13 (rebuild stratification).
5. **Enum content** — C20, C21, plus the original v0 enum gaps. Lowest risk to defer; highest count.

Recommend triage occur as the first step of Implementation Phase 1, before code, with each resolution committed as a doc-edit and (where applicable) a registry-event update.
