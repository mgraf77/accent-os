# AccentOS — Contradiction Resolution Log

**Status:** Resolutions applied to the 22 contradictions identified in `ACCENTOS_RUNTIME_CONTRADICTIONS.md`.
**Method:** Each entry: id, root cause, resolution type, affected docs, why-preserves-architecture, implementation impact, registry impact.
**Architecture preservation:** No new engines, no new registries, no new layers, no new abstractions. All resolutions are clarifications, additive enums, additive payload fields, pattern formalizations, or governance clarifications.

---

## C1 — `procurement.po.eta_set` emitter ambiguity

- **Root cause:** confidence semantics differ between human-emitted and adapter-emitted ETAs; conflation poisons calibration.
- **Resolution type:** payload addition (additive).
- **Resolution:** add required `source_confidence` field (default 1.0 on human emission; parser-supplied for adapter emission) to `procurement.po.eta_set` and `procurement.po.eta_slipped`. Convention applies broadly: any event emittable by both humans and adapters carries `source_confidence`.
- **Affected docs:** `EVENT_TYPE_REGISTRY_V0.md` (annotate § 4); `ACCENTOS_EVENT_AND_HANDOFF_SCHEMA.md` (note); `ENUMS_V0.md` (no enum needed — it's a numeric).
- **Why preserves architecture:** additive optional with a default; existing subscribers unaffected.
- **Implementation impact:** adapters and command handlers populate the field; downstream consumers (priority, AI calibration) read it.
- **Registry impact:** event-type registry payload spec extended (additive).

---

## C2 — Adapter-as-emitter vs. command-as-causal-chain

- **Root cause:** two ingress paths to event emission (command path; adapter path) were never explicitly named.
- **Resolution type:** pattern formalization.
- **Resolution:** declare the dispatcher as the universal event-emission gate. Two ingress paths feed the dispatcher:
  - **Command ingress** — validates authority + readiness + business rules + idempotency.
  - **Adapter ingress** — validates schema + source-auth + content-hash idempotency.
  Both produce events. Both are subject to schema-registry self-check (R11) and immutability. Adapters never bypass the dispatcher; they submit through their own ingress contract.
- **Affected docs:** `ACCENTOS_RUNTIME_ARCHITECTURE_BRIEF.md` § 2.3 (dispatcher); `ACCENTOS_INTEGRATION_ADAPTER_CONTRACT.md` (clarify ingress).
- **Why preserves architecture:** no new engines; just names the two paths that already exist.
- **Implementation impact:** dispatcher exposes two ingress entrypoints with distinct validation pipelines.
- **Registry impact:** none.

---

## C3 — AI suggestion accept → command vs. event

- **Root cause:** "underlying business command" was metaphorical; could be misread as direct event emission.
- **Resolution type:** pattern formalization (high blast).
- **Resolution:** on `ai.suggestion.accept` (or auto-policy gate-pass), the runtime **synthesizes a command** with `submitted_by` = subject's human owner, `submitted_by_actor` = `ai` for auto-applies (with capability_id), `correlation_id` = suggestion_id. The synthetic command runs through the dispatcher exactly like a human-submitted command — full authority + readiness + business-rule validation. The resulting events carry both attribution markers.
- **Affected docs:** `ACCENTOS_AI_SUGGESTION_MODEL.md`; `ACCENTOS_COMMAND_VOCABULARY.md` § 12.
- **Why preserves architecture:** uses existing dispatcher path; no AI-only emission path.
- **Implementation impact:** AI suggestion engine emits synthetic commands; tests assert these go through the dispatcher.
- **Registry impact:** none.

---

## C4 — Three-version model

- **Root cause:** registry-version stamping, projection schema versioning, and read-time registry snapshot were all conflated as "version".
- **Resolution type:** clarification.
- **Resolution:** declare three explicit version concepts:
  1. **Registry version at event emission** — stamped on the event for replay determinism.
  2. **Projection schema version** — incremented on breaking projection logic; old/new coexist during cutover.
  3. **Read-time registry version snapshot** — returned with projection data so shell can audit "data computed against registry version V".
  Replay reads each event's stamped registry version. Live reads use current registry. Three concepts; never conflated in code.
- **Affected docs:** `ACCENTOS_RUNTIME_ARCHITECTURE_BRIEF.md` § 4 + § 5; `ACCENTOS_REGISTRY_ARTIFACTS.md` § 12.4; `ACCENTOS_RUNTIME_TERMINOLOGY.md` (`registry_versions` definition).
- **Why preserves architecture:** all three already implicit; this just names them.
- **Implementation impact:** event records carry registry-version stamp; projections carry schema version; reads return read-time snapshot.
- **Registry impact:** none.

---

## C5 — Receiver resolution timing (synchronous in dispatcher)

- **Root cause:** ambiguity about whether resolution is dispatcher-synchronous or event-driven follow-up.
- **Resolution type:** pattern formalization.
- **Resolution:** receiver resolution is **synchronous with command validation**. The dispatcher calls the resolution service before emitting the handoff event. Resolution failure → `command.rejected.no_receiver` (no `handoff.opened` ever emitted with a null/pending receiver).
- **Affected docs:** `ACCENTOS_RUNTIME_ARCHITECTURE_BRIEF.md` § 2.4; `ACCENTOS_RUNTIME_CONTRACTS.md` § 8; `ACCENTOS_COMMAND_VOCABULARY.md` (validation lifecycle).
- **Why preserves architecture:** receiver-resolution service already exists; this names its invocation timing.
- **Implementation impact:** dispatcher integration with resolution service; rejection path well-defined.
- **Registry impact:** none.

---

## C6 — Operational-state evaluator: server authoritative; shell submits inputs

- **Root cause:** ambiguity over whether shell can override evaluator output.
- **Resolution type:** clarification.
- **Resolution:** the evaluator is **authoritative**. Shell submissions (e.g. user toggles Focus on/off) are **inputs** via `session.declare_state`, not overrides. The evaluator computes the result given all inputs (user toggles + system triggers); sticky-state invariants (R8) apply. Shell renders evaluator output, never local invention.
- **Affected docs:** `ACCENTOS_OPERATIONAL_STATE_MODEL.md`; `ACCENTOS_SHELL_RUNTIME_INTERACTION_BRIEF.md` § 3.
- **Why preserves architecture:** no new components; explicit input/output boundary.
- **Implementation impact:** `session.declare_state` validated by evaluator; sticky-state self-clear rejected.
- **Registry impact:** none.

---

## C7 — CC layout selection vs. priority filter

- **Root cause:** "scope filter of the same projection set" understated tile-layout differences across role-CC variants.
- **Resolution type:** governance clarification (no new registry).
- **Resolution:** tile **contents** are projections of the same event-derived data (one priority spine, one event log). Tile **selection per role-CC** is a registry-driven layout configuration, declared inside the existing registry artifact spec as a **`cc_layout` sub-section of the role registry** — not a new top-level registry. Each role's entry declares which tiles its CC variant displays. This keeps the priority spine single-sourced while letting layouts vary.
- **Affected docs:** `ACCENTOS_COMMAND_CENTER_SPEC.md` § 6; `ROLE_REGISTRY_V0.md` (each role gains a `cc_tiles` field listing tile ids).
- **Why preserves architecture:** layout configuration lives inside an existing registry; no new registry.
- **Implementation impact:** CC projection layer reads role's `cc_tiles` to compose the variant.
- **Registry impact:** role registry payload extended (additive).

---

## C8 — AI correlation on outbound events

- **Root cause:** when AI drafts a customer-visible message, the resulting `customer.message.sent` event lacked AI provenance.
- **Resolution type:** payload addition (additive optional).
- **Resolution:** customer-visible outbound events (`customer.message.sent`, `customer.satisfaction.captured`, `quote.sent`, `procurement.po.sent`) carry an optional `ai_correlation_id` referencing the originating `ai.suggestion.applied` event when AI was involved. Synthesized via the C3 accept-flow.
- **Affected docs:** `EVENT_TYPE_REGISTRY_V0.md` § 5, § 7, § 4.
- **Why preserves architecture:** additive optional field; existing consumers ignore.
- **Implementation impact:** synthetic-command path propagates `correlation_id` to emitted events.
- **Registry impact:** event-type registry payload extended.

---

## C9 — `subject.reassigned` vs. `subject.taken_over`

- **Root cause:** both events exist but semantic difference was not surfaced uniformly.
- **Resolution type:** clarification + payload addition.
- **Resolution:** retain both event types. Add explicit semantic header to event-type registry:
  - `subject.reassigned` — soft transfer; original owner remains attributable for prior actions; new owner takes the clock from now; in-flight handoffs unaffected.
  - `subject.taken_over` — typically by lead+; new owner takes over; in-flight handoffs canceled and re-issued; SLA resets only on the new handoff.
  Add optional payload `prior_actions_attribution_preserved: bool` (default true).
- **Affected docs:** `EVENT_TYPE_REGISTRY_V0.md` § 8; `ACCENTOS_ROLE_AND_RECEIVER_MODEL.md` § 12.
- **Why preserves architecture:** existing events; sharpened semantics.
- **Implementation impact:** handoff engine treats takeover as canceling in-flight handoffs.
- **Registry impact:** event-type registry annotation.

---

## C10 — Suppression budget accounting

- **Root cause:** with two-key suppression, budget counting per-actor vs. per-event was unclear.
- **Resolution type:** clarification.
- **Resolution:** budget is **per suppression event**, not per actor. Counts once regardless of two-key participation. Org-level cap, not per-actor.
- **Affected docs:** `POLICY_DEFAULTS_V0.md` § 2.
- **Why preserves architecture:** clarification only.
- **Implementation impact:** counter increments once per suppression command success.
- **Registry impact:** policy default doc clarified.

---

## C11 — Mobile drift tolerance vs. offline-replay delay

- **Root cause:** drift (skewed clock) and delay (offline queue) were both treated as drift.
- **Resolution type:** pattern formalization + payload addition.
- **Resolution:** distinguish two cases:
  1. **Live submission with skewed clock** — drift; subject to ±5 minute window; reject if outside.
  2. **Offline-queued replay** — delay; detected by client-set marker `submission_kind: "offline_replay"` on the command; accepted; ordering uses `(occurred_at, received_at, monotonic-tiebreak)`.
  Mobile clients **must** mark queue replays explicitly; live submissions either omit the marker or set `submission_kind: "live"`.
- **Affected docs:** `ACCENTOS_RUNTIME_ARCHITECTURE_BRIEF.md` § 7; `ACCENTOS_SHELL_RUNTIME_INTERACTION_BRIEF.md` § 1.3; `COMMAND_REGISTRY_V0.md` (universal command field).
- **Why preserves architecture:** explicit marker on existing submissions.
- **Implementation impact:** dispatcher distinguishes paths; mobile shell sets marker correctly.
- **Registry impact:** command schema gains universal field `submission_kind`.

---

## C12 — Customer-visible authority dual-gate

- **Root cause:** unclear whether customer-visible enforcement is at command-time, adapter-time, or both.
- **Resolution type:** governance clarification.
- **Resolution:** **dual-gate**.
  - **Primary (command-time):** dispatcher refuses commands lacking authority for customer-visible side effects, reading the command-authority registry's `customer_visible` flag.
  - **Secondary (adapter-time):** outbound adapter refuses to send if directive lacks the customer-visible flag confirmed.
  Both gates active; either failing rejects.
- **Affected docs:** `ACCENTOS_COMMAND_VOCABULARY.md` § 4 + § 12; `ACCENTOS_INTEGRATION_ADAPTER_CONTRACT.md` § 13.
- **Why preserves architecture:** dual-gate is defense in depth; no new components.
- **Implementation impact:** both dispatcher and outbound adapter check the flag.
- **Registry impact:** command-authority registry's `customer_visible` flag is canonical.

---

## C13 — Rebuild stratification across retention tiers

- **Root cause:** projection rebuild against warm/archive tiers was undefined.
- **Resolution type:** clarification.
- **Resolution:** declare:
  - **Hot-tier rebuild** (≤24 months) — standard; cutover via typed event.
  - **Warm-tier rebuild** (≤5 years) — ops-approved long-running rebuild; declared duration; emits progress events.
  - **Archive-tier rebuild** — catastrophic-recovery only; ops + exec authorization; declared SLA.
- **Affected docs:** `ACCENTOS_RUNTIME_ARCHITECTURE_BRIEF.md` § 4; `ACCENTOS_INFRA_REQUIREMENTS_BRIEF.md` § 3.
- **Why preserves architecture:** clarification of existing concept.
- **Implementation impact:** rebuild pipeline declares tier; ops gates accordingly.
- **Registry impact:** none.

---

## C14 — Calibration cadence vs. event-triggered recalibration

- **Root cause:** two recalibration triggers (cadence + event) were both stated; interaction unclear.
- **Resolution type:** clarification.
- **Resolution:** **event-triggered recalibration takes precedence**. Scheduled recalibration is a **floor**: runs at most once per cadence interval if no event-triggered run has occurred in that interval. Reset on event trigger.
- **Affected docs:** `ACCENTOS_AI_SUGGESTION_MODEL.md`; `POLICY_DEFAULTS_V0.md` § 13.
- **Why preserves architecture:** clarification only.
- **Implementation impact:** AI suggestion engine schedules with skip-if-recent rule.
- **Registry impact:** none.

---

## C15 — Command-authority registry canonical; role-default-authorities derived

- **Root cause:** role registry and command-authority registry both stated authority; ambiguity about source of truth.
- **Resolution type:** governance clarification + self-check.
- **Resolution:** **command-authority registry is canonical**. The role registry's "default authorities" field is a human-readable summary — generated/checked from the command registry. Add a runtime self-check `runtime.audit.role_authority_drift` that emits when the two diverge.
- **Affected docs:** `ACCENTOS_REGISTRY_ARTIFACTS.md`; `ROLE_REGISTRY_V0.md` (header annotation); `EVENT_TYPE_REGISTRY_V0.md` (add self-check event).
- **Why preserves architecture:** canonicalization without new structures.
- **Implementation impact:** self-check runs nightly; emits typed event on drift.
- **Registry impact:** event-type registry adds `runtime.audit.role_authority_drift`.

---

## C16 — Severity correction via additive event

- **Root cause:** "severity update via correction" implied event mutation, which violates R11.
- **Resolution type:** event addition (additive new type).
- **Resolution:** add `service.ticket.severity_changed` event to event-type registry (additive). Emitted as a follow-up to `service.ticket.opened` carrying `from_severity`, `to_severity`, `reason_code`. Original event unchanged. Establish this as the **canonical "correction via additive event" pattern** for similar cases.
- **Affected docs:** `EVENT_TYPE_REGISTRY_V0.md` § 7; `COMMAND_REGISTRY_V0.md` § 7 (`service.ticket.mark_severity_1` success-events).
- **Why preserves architecture:** additive new event type; no mutation.
- **Implementation impact:** ticket severity reads from the latest `severity_changed` event (or `opened` if none).
- **Registry impact:** event-type registry adds new event.

---

## C17 — Ack double-meaning (handoff vs. notification)

- **Root cause:** "ack" used in two distinct contexts.
- **Resolution type:** clarification.
- **Resolution:** standardize:
  - `handoff.acknowledged` — receiver event, named verb.
  - Notifications carry **read state**, not ack — current model uses `notification.delivered` only. **Notification ack is not a v0 concept.** If needed in future, introduce explicitly.
- **Affected docs:** `ACCENTOS_RUNTIME_TERMINOLOGY.md`.
- **Why preserves architecture:** removes a phantom concept.
- **Implementation impact:** none (notification ack was never in v0).
- **Registry impact:** none.

---

## C18 — Customer-visible flag locus

- **Root cause:** flag was on AI capability registry only; not all customer-visible commands are AI-driven.
- **Resolution type:** clarification + payload propagation.
- **Resolution:** treat `customer_visible` as a **command-level** attribute in the command-authority registry. Every command's authority entry declares `customer_visible: yes/no`. AI capabilities mirror the flag from their underlying commands. Customer-visible authority gating reads the command-authority registry first; the AI capability registry's flag is derived/redundant for safety.
- **Affected docs:** `ACCENTOS_REGISTRY_ARTIFACTS.md` § 11 (command-authority shape); `COMMAND_REGISTRY_V0.md` (each command annotated).
- **Why preserves architecture:** clarifies authority registry; no new structures.
- **Implementation impact:** dispatcher reads from command-authority registry.
- **Registry impact:** command-authority registry shape extended.

---

## C19 — Read-Only state vs. read access

- **Root cause:** two distinct concepts using same prefix.
- **Resolution type:** clarification.
- **Resolution:** explicit terminology separation in `ACCENTOS_RUNTIME_TERMINOLOGY.md` § 6:
  - **`Read-Only` operational state** — session-level UX state.
  - **Read access scope** — role-level authorization to view.
  Both restrict commands to annotation only at the dispatcher; UI surfaces them differently.
- **Affected docs:** `ACCENTOS_RUNTIME_TERMINOLOGY.md`.
- **Why preserves architecture:** clarification only.
- **Implementation impact:** UI distinguishes "you don't have access" vs. "you're in Read-Only state".
- **Registry impact:** none.

---

## C20 — Snooze wake conditions

- **Root cause:** wake-condition shape unspecified.
- **Resolution type:** payload formalization + enum.
- **Resolution:** declare wake condition union:
  - `{ kind: "time", at: timestamp }`
  - `{ kind: "event", event_name, subject_ref }`
  Restrict event-based wakes to a declared whitelist (per `ENUMS_V0.md`).
- **Affected docs:** `COMMAND_REGISTRY_V0.md` (`orchestration.subject.snooze`); `ENUMS_V0.md`.
- **Why preserves architecture:** typed shape on existing command parameter.
- **Implementation impact:** snooze command validates union.
- **Registry impact:** command parameter spec extended; new enum.

---

## C21 — Unified adapter degradation reason codes

- **Root cause:** reason codes scattered across docs without enumeration.
- **Resolution type:** enum addition.
- **Resolution:** unified enum in `ENUMS_V0.md` annotated by which adapter classes may emit.
- **Affected docs:** `ENUMS_V0.md`; `ACCENTOS_INTEGRATION_ADAPTER_CONTRACT.md` § 6.
- **Why preserves architecture:** enum codification only.
- **Implementation impact:** adapters emit only registered codes.
- **Registry impact:** new enum.

---

## C22 — Mobile drift vs. NTP-synced runtime nodes

- **Root cause:** relationship between server-clock honesty and accepted client drift was implicit.
- **Resolution type:** clarification + self-check.
- **Resolution:** mobile drift tolerance is measured against the event store's `received_at`, which relies on NTP-synced runtime clocks. Add runtime self-check `runtime.audit.clock_drift` that emits when inter-node drift exceeds a tight threshold; treated as P0.
- **Affected docs:** `ACCENTOS_INFRA_REQUIREMENTS_BRIEF.md` § 12; `ACCENTOS_RUNTIME_ARCHITECTURE_BRIEF.md` § 7; `EVENT_TYPE_REGISTRY_V0.md` (add self-check event).
- **Why preserves architecture:** self-check is a runtime monitor, no new engine.
- **Implementation impact:** monitor scheduled; alert on drift.
- **Registry impact:** event-type registry adds `runtime.audit.clock_drift`.

---

## Summary

| Category | Count |
|---|---|
| Pattern formalization | 5 (C2, C3, C5, C11, C16) |
| Clarification | 8 (C4, C6, C10, C13, C14, C17, C19, C22) |
| Payload addition (additive optional) | 4 (C1, C7, C8, C9) |
| Governance clarification | 3 (C7, C12, C15, C18) |
| Enum addition | 3 (C20, C21, plus existing gaps) |
| New self-check / event type (additive) | 3 (C15, C16, C22) |

**Architecture preservation: confirmed.** No new engines, registries, layers, or abstractions introduced. Every resolution reuses existing structures.

**Implementation impact:** moderate but bounded. Each resolution touches the runtime team's plan; nothing requires re-architecture.

**Registry impact:** four registry-shape extensions (event-type payload additions; role-registry `cc_tiles` field; command-authority `customer_visible` field; new event types for self-checks and severity correction). All additive.

---

## Resolution status

All 22 contradictions are **resolved by clarification or additive change**. None remain unresolved. Implementation Phase 1 may consume this log as the authoritative reading.

Each resolution is reflected in the relevant frozen doc via doc-edit; if a particular doc edit was deferred for atomicity, this log is the authoritative interim. The next architecture-spec maintenance pass will fold each resolution into its host doc; until then, this log overrides on conflict.
