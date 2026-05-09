# AccentOS — Runtime Boundaries

**Mode:** Runtime architecture / specification (no implementation)
**Anchors:** runtime brief, command vocabulary, adapter contract, registry artifacts
**Purpose:** Map the responsibilities of each layer — and, more importantly, **what each layer must never do**. Boundary violations are the #1 source of runtime entropy.

---

## 0. The eight layers

1. **Shell** — UI, sessions, presentation.
2. **Runtime** — orchestration engines, event store, dispatcher, evaluator services.
3. **Adapters** — bounded translators to/from external systems.
4. **Projections** — derived read models.
5. **Registries** — typed governance artifacts.
6. **Command Center** — exec/ops operational surface (a special projection consumer + verb surface).
7. **AI** — capabilities + suggestion engine.
8. **Notification** — derived outbound paging.

Each layer has a **must do** list and an **must never do** list. Both are normative.

---

## 1. Shell

### Must do

- Render projections + operational-state evaluator outputs.
- Submit typed commands with `command_id`, `submitted_by`, `subject_ref`, `client_intent`, `session_state`.
- Display rejection events as first-class feedback.
- Honor freshness markers (dim stale tiles).
- Compose verbs from the command vocabulary; never invent.
- Respect operational state (mobile-quick mode, focus, escalated, blocked, read-only).
- Submit AI suggestion lifecycle commands (accept/reject/defer/verify/revert).

### Must never

- Write events directly to the event store.
- Compute priority, urgency, or routing locally.
- Author notifications.
- Bypass authority by surface (mobile cannot do what desktop cannot).
- Treat projections as canonical (event log is canon).
- Hide AI suggestions or AI-applied actions from the subject timeline.
- Render an "exec dashboard" different from CC.
- Maintain its own state machine for subjects (subjects live in events).
- Cache projections in ways that obscure freshness.
- Let users dismiss `Urgent` or `Escalated` while triggers are live.

---

## 2. Runtime

### Must do

- Validate, persist, route every typed event.
- Run the orchestration engines (priority, escalation, notification gate, AI suggestion, operational-state evaluator, receiver-resolution).
- Enforce contracts (R1–R20).
- Emit anti-entropy monitor events on violations.
- Surface orchestration health to CC.
- Honor registries; refuse to act outside them.
- Replay deterministically.
- Degrade component-by-component with visibility.

### Must never

- Accept silent state mutations.
- Mutate committed events.
- Allow commands to bypass receiver resolution, priority spine, or AI gate (except via typed `_with_override` events).
- Fabricate state under uncertainty.
- Run business logic inside adapters or projections.
- Author notifications independent of typed events.
- Compute priority outside the priority engine.
- Permit AI to choose subject ownership or set priority directly.
- Allow null receivers, anonymous events, or unbounded overrides.
- Run side effects from projections.

---

## 3. Adapters

### Must do

- Translate external signals → typed events (inbound) or typed directives → external actions (outbound).
- Carry stable idempotency keys.
- Emit `adapter.degraded` and other lifecycle events.
- Honor registry-scoped event types.
- Emit typed `adapter.parse_ambiguous` rather than guess.
- Surface freshness, throughput, latency, ambiguity rate, dedupe collisions.
- Refuse to retry with new idempotency keys.

### Must never

- Write to projections directly.
- Run business logic.
- Auto-resolve two-way conflicts by guessing canonical side.
- Synthesize fields not present in the source.
- Drop ambiguous parses silently.
- Emit unregistered event types.
- Fire outbound side effects on replay.
- Fire customer-visible side effects without a typed directive going through authority + AI policy gates.
- Operate without a degraded-state contract.
- Maintain a parallel state alongside the event log.

---

## 4. Projections

### Must do

- Derive read models from typed events.
- Expose freshness markers.
- Be rebuildable from the event store.
- Tolerate replay (idempotent).
- Detect drift via differential checks.
- Pause writes from a divergent subscriber on drift.
- Version themselves on breaking schema changes.

### Must never

- Be canonical for any operational truth.
- Run business logic that is not pure projection.
- Trigger side effects (notifications, integrations).
- Re-fire alarms during rebuild or replay.
- Hide staleness from readers.
- Compute their own priority or urgency.
- Persist values absent from the event stream.

---

## 5. Registries

### Must do

- Define typed entries with versioned history.
- Emit typed events on every mutation.
- Enforce two-key on declared high-impact changes.
- Support freeze semantics (typed event).
- Be the single source for their concern.
- Be append-only with rollback as a forward step.

### Must never

- Be edited in place without an event.
- Be forked per surface.
- Hide defaults inside projection or adapter code.
- Permit unscoped authority entries.
- Allow lead-OOO without acting-lead in the coverage registry.
- Allow AI capabilities active without reversibility entry.
- Lose history on edit.

---

## 6. Command Center

### Must do

- Mirror the priority spine 1:1.
- Render the tile catalog with the documented sort discipline.
- Surface orchestration health alongside operational health.
- Show suppressions, bypasses, AI auto-applied awaiting verification.
- Compose with the `Executive Review` operational state.
- Provide role-CC variants as scope filters of the same projection set.

### Must never

- Invent its own urgency math.
- Compute scores parallel to the priority engine.
- Hide suppressions or bypasses.
- Operate as a separate "exec dashboard" from the runtime spine.
- Show stale data without freshness indication.
- Author notifications.
- Emit events directly (CC is a consumer; verbs route through commands).
- Diverge from role-CC variants in priority semantics.

---

## 7. AI

### Must do

- Operate via the suggestion lifecycle.
- Carry calibrated confidence + reversibility class + policy class.
- Provide rationale + evidence pointers on every suggestion.
- Honor registry-defined thresholds and policy classes.
- Suspend auto-apply on induced-red ceiling breach.
- Surface AI work on subject timelines.
- Recalibrate on schedule; emit uncalibrated state when applicable.

### Must never

- Take subject ownership.
- Set priority directly.
- Auto-apply customer-visible actions.
- Auto-apply outside reversibility-and-policy gates.
- Retain a side log separate from the subject timeline.
- Re-present rejected suggestions without delta.
- Submit commands as `submitted_by: ai` directly.
- Operate without a registry entry.

---

## 8. Notification

### Must do

- Derive from typed events with audience rules.
- Honor quiet hours, severity gating, cooldown windows.
- Emit dispatch records (themselves events).
- Apply stale-suppression on replay/recovery.
- Provide channel fallback under documented severity rules.

### Must never

- Be authored without a triggering event.
- Bypass quiet hours below severity-1.
- Re-fire on replay or rebuild.
- Send customer-visible notifications without going through outbound-adapter + AI policy gates.
- Operate without observability of read/ack/ignore rates.
- Maintain channel-specific business rules (channel choice is policy, not logic).

---

## 9. Cross-layer invariants

These are the boundary-spanning rules that prevent layer-leak entropy:

1. **Only the runtime emits events.** Adapters submit; runtime emits.
2. **Only the runtime mutates operational truth.** Everything else reads.
3. **Only the priority engine produces priority.** Everywhere else consumes.
4. **Only the receiver-resolution service names a receiver.** Everywhere else asks.
5. **Only the AI suggestion engine routes AI work into commands.** AI capabilities don't speak directly to the runtime.
6. **Only the notification engine sends notifications.** No other layer fires paging.
7. **Only registries hold runtime governance.** No side-channel config.
8. **Only the event store is canonical.** Projections, including CC, are derived.

If a future feature needs to violate any of these, the answer is "extend the responsible layer", not "shortcut around it".

---

## 10. Boundary violations to watch for during implementation

- **Shell shortcut:** "the shell can compute this faster than waiting for a projection." → No. Shell renders, doesn't decide.
- **Adapter overreach:** "the adapter can decide what to do with this ambiguous parse." → No. It emits ambiguity.
- **Projection side effect:** "the projection notices a red and sends a notification." → No. Projection emits a band event; notification engine reacts.
- **AI direct write:** "let the AI just update the subject; we trust it 99%." → No. Suggestion lifecycle, always.
- **Hidden registry:** "this constant lives in the projection because it's faster." → No. Registry.
- **CC fork:** "the exec wants a different sort." → No. Filter, don't re-derive.
- **Runtime overreach into shell:** "the runtime can render this directly." → No. Runtime serves projections; shell renders.
- **Notification authoring:** "this feature needs to send a custom email." → It needs to emit a typed event; notification engine routes.

---

## 11. What this doc deliberately omits

- Process / deployment topology — separate brief.
- Code organization (modules, services).
- API protocol selection.
- Identity boundary specifics.
