# AccentOS — Implementation Adoption Checklist

**Mode:** Session-1 implementation onboarding flatten.
**Purpose:** Linear, actionable startup sequence. Use this as the single landing page for the team taking implementation authority from architecture.

---

## A. Required prerequisites (before any code)

### A.1 Governance reads (mandatory; ≤2 hr)

- ☐ `docs/runtime/ACCENTOS_RUNTIME_FREEZE_SNAPSHOT.md`
- ☐ `docs/runtime/ACCENTOS_RUNTIME_TERMINOLOGY.md`
- ☐ `docs/workflows/ACCENTOS_ANTI_ENTROPY_RULES.md`
- ☐ `docs/runtime/ACCENTOS_RUNTIME_BOUNDARIES.md`

### A.2 Runtime reads (per-team)

**Runtime team:**
- ☐ `ACCENTOS_RUNTIME_ARCHITECTURE_BRIEF.md`
- ☐ `ACCENTOS_RUNTIME_CONTRACTS.md`
- ☐ `ACCENTOS_EVENT_AND_HANDOFF_SCHEMA.md`
- ☐ `ACCENTOS_COMMAND_VOCABULARY.md`
- ☐ `ACCENTOS_INTEGRATION_ADAPTER_CONTRACT.md`
- ☐ `ACCENTOS_REGISTRY_ARTIFACTS.md`
- ☐ `ACCENTOS_RUNTIME_SURVIVABILITY_AUDIT.md`
- ☐ all 5 registry v0 docs
- ☐ `ACCENTOS_AUTH_IDENTITY_BOUNDARY.md`
- ☐ `ACCENTOS_INFRA_REQUIREMENTS_BRIEF.md`

**Shell-v2 team:**
- ☐ `ACCENTOS_SHELL_RUNTIME_INTERACTION_BRIEF.md` (primary)
- ☐ `ACCENTOS_COMMAND_VOCABULARY.md` + `COMMAND_REGISTRY_V0.md` (verb table)
- ☐ `ACCENTOS_OPERATIONAL_STATE_MODEL.md`
- ☐ `ACCENTOS_COMMAND_CENTER_SPEC.md`
- ☐ `ACCENTOS_AI_SUGGESTION_MODEL.md`

**Mobile team:**
- ☐ `ACCENTOS_SHELL_RUNTIME_INTERACTION_BRIEF.md` § 9
- ☐ `ACCENTOS_OPERATIONAL_WORKFLOWS.md` § 15
- ☐ `COMMAND_REGISTRY_V0.md` (mobile=Y verbs)
- ☐ `ACCENTOS_OPERATIONAL_STATE_MODEL.md` (Mobile Quick Mode)

**Ops/governance:**
- ☐ `ACCENTOS_REGISTRY_ARTIFACTS.md`
- ☐ all 5 registry v0 docs
- ☐ `ACCENTOS_COMMAND_CENTER_SPEC.md`
- ☐ `ACCENTOS_OPERATIONAL_TELEMETRY.md`

**Exec:**
- ☐ `ACCENTOS_RUNTIME_FREEZE_SNAPSHOT.md`
- ☐ `ACCENTOS_COMMAND_CENTER_SPEC.md`
- ☐ `ACCENTOS_OPERATIONAL_TELEMETRY.md` (top signals)

### A.3 Open-item resolution (must be closed before code)

- ☐ Triage all 22 contradictions in `ACCENTOS_RUNTIME_CONTRADICTIONS.md` to a resolution path; doc-edit each resolution.
- ☐ Produce `docs/runtime/registries/ENUMS_V0.md` covering: customer-message intent, service severity (1/2/3), PO eta-slip reason codes, escalation resolution codes, adapter-degraded reason codes, AI rejection reason codes, business-rule rejection reason codes, override reason codes per type.
- ☐ Decide `ai.outbound.*` boundary; record in `AI_CAPABILITY_REGISTRY_V0.md`.
- ☐ Decide `quote.send_with_margin_override` shape; record in `COMMAND_REGISTRY_V0.md`.
- ☐ Document customer-proxy authority schema as addendum to `ACCENTOS_AUTH_IDENTITY_BOUNDARY.md`.
- ☐ Set numerical values for: RTO, full-system replay duration, AI calibration baseline window per capability.
- ☐ Choose IDP; verify against the 10 acceptance criteria.
- ☐ Choose tamper-evidence mechanism for event store.
- ☐ Define two-key release process (in-app dual approval).
- ☐ Declare multi-tenant trigger condition (or explicit "single-tenant only for foreseeable future").

---

## B. Freeze requirements (architecture immutability)

- ☐ Tag the architecture-spec freeze commit (`607942c1b9035265160890bb0d6486f7a1be7393`) plus convergence layer.
- ☐ Branch protection: changes to `docs/workflows/`, `docs/runtime/`, and `docs/runtime/registries/` require doc-edit governance review (per-doc authority level in the runtime index).
- ☐ Implementation PRs that introduce a new event type, new registry, new command, or new contract must include a corresponding doc-edit in the same PR.
- ☐ Deviations from spec require a typed registry-event justification (or schema event for event-type changes); silent code shifts are forbidden.

---

## C. Rollback prerequisites (before first event commits)

- ☐ Event store backup discipline operational (continuous streaming, weekly auto-restore-test).
- ☐ Projection rebuild pipeline tested end-to-end against synthetic event stream.
- ☐ Replay-vs-live differential check operational on at least one major projection.
- ☐ Registry freeze command tested end-to-end.
- ☐ Override budget enforcement tested with synthetic over-budget submissions.
- ☐ Component-by-component degradation kill-test recorded for each engine.

---

## D. Ordered implementation sequence

### D.1 Step 1 — Foundations (no business engines yet)

- ☐ Stand up event store satisfying `ACCENTOS_RUNTIME_ARCHITECTURE_BRIEF.md` § 3 acceptance criteria.
- ☐ Stand up dispatcher honoring commit-after-emit-and-route discipline.
- ☐ Stand up registry-as-projection of `runtime.schema.*` and `registry.*.*` events.
- ☐ Seed v0 registries from the five registry v0 docs.
- ☐ Stand up the schema registry self-check (unregistered-event detector).
- ☐ Stand up audit-immutability self-check.

### D.2 Step 2 — Authority & identity

- ☐ Integrate chosen IDP per auth boundary brief acceptance criteria.
- ☐ Implement command-authority service reading command-authority registry + role registry.
- ☐ Implement two-key distinctness check.
- ☐ Smoke-test: every command-authority registry entry rejects appropriately.

### D.3 Step 3 — Receiver resolution & handoff engine

- ☐ Implement receiver-resolution service per role/receiver model § 10.
- ☐ Wire dispatcher to call resolution synchronously before emitting handoff events (resolves C5).
- ☐ Implement handoff lifecycle engine.
- ☐ Smoke-test: every handoff type from event registry resolves to a named owner; null-receiver scenarios produce `command.rejected.no_receiver`.

### D.4 Step 4 — Priority & escalation

- ☐ Implement priority engine with hysteresis and cooldown.
- ☐ Implement escalation engine with tier ack clocks and bounce protection.
- ☐ Wire priority engine to emit `priority.recomputed` only on band crossings.
- ☐ Smoke-test: synthetic input bursts do not produce flicker.

### D.5 Step 5 — Operational-state evaluator

- ☐ Implement evaluator producing per-session primary state + composition layers.
- ☐ Wire `session.declare_state` as input, not override.
- ☐ Smoke-test: sticky-state self-clear is rejected.

### D.6 Step 6 — Notification engine

- ☐ Derive-only notifications from typed events.
- ☐ Honor quiet hours, severity gating, cooldown windows.
- ☐ Honor replay marker (no re-fire on replay).
- ☐ Smoke-test: replay produces zero new notifications.

### D.7 Step 7 — AI suggestion engine

- ☐ Implement suggestion lifecycle.
- ☐ Wire reversibility-and-policy gate for auto-apply.
- ☐ Wire customer-visible categorical prohibition on auto-apply (refused at registration).
- ☐ Wire induced-red ceiling auto-suspension.
- ☐ Wire AI accept synthesis: `ai.suggestion.accept` → synthetic command via dispatcher (resolves C3).
- ☐ Smoke-test: customer-visible auto-apply attempt is structurally rejected.

### D.8 Step 8 — CC projection layer

- ☐ Build tile catalog projections per CC spec.
- ☐ Wire role-CC variants as scope filters (resolve C7 with tile-layout-registry decision).
- ☐ Surface freshness markers on every read.
- ☐ Surface orchestration health alongside operational health.
- ☐ Smoke-test: stale-projection markers render correctly.

### D.9 Step 9 — Adapters (first pair)

- ☐ Stand up one inbound parser (vendor email or telephony) per adapter contract.
- ☐ Stand up one outbound sender (customer email).
- ☐ Implement `adapter.parse_ambiguous` route through AI suggestion engine.
- ☐ Implement outbound dual-gate (command-time + adapter-time customer-visible check; resolves C12).
- ☐ Smoke-test: ambiguous parse routes to suggestion, never to fact.

### D.10 Step 10 — Shell-v2 command submission

- ☐ Implement command submission per shell-runtime brief § 1.
- ☐ Render rejections as first-class subject-timeline events.
- ☐ Render freshness markers; refuse mutation on hard-stale.
- ☐ Implement offline mobile queue with idempotent replay.
- ☐ Smoke-test: optimistic UI reconciles correctly with rejection events.

### D.11 Step 11 — Anti-entropy monitor coverage

- ☐ Stand up monitors for all 20 anti-entropy rules per policy defaults § 5.
- ☐ Synthetic-violation smoke-test: every monitor fires when fed a deliberately-violating stream.
- ☐ Wire CC anti-entropy banner.

### D.12 Step 12 — Telemetry

- ☐ Stand up operational health surfaces.
- ☐ Stand up orchestration health surfaces.
- ☐ Wire blocked-time, breach-rate, AI-trust, override-abuse signals.

---

## E. Validation gates (must pass before moving phase)

- ☐ **Anti-entropy smoke:** every monitor fires on synthetic violation.
- ☐ **Deterministic replay:** rebuild every projection from a controlled stream twice; results identical.
- ☐ **Receiver-resolution determinism:** replay 1% sample of resolutions; outcomes identical.
- ☐ **Two-key distinctness:** end-to-end against IDP; same actor with two devices rejected.
- ☐ **Component degradation:** kill each engine, confirm CC reflects + recovery typed + no fabricated state.
- ☐ **Registry mutation flow:** every registry edit emits typed event; freeze rejects mutations as `command.rejected.registry_frozen`.
- ☐ **Schema evolution:** additive payload field passes; field rename rejected; new event type accepted.
- ☐ **Adapter ambiguity:** low-confidence parses route to suggestion, never to fact.
- ☐ **AI auto-apply gating:** customer-visible auto-apply categorically rejected at registration.
- ☐ **Override budget:** over-budget suppression rejects with `command.rejected.business_rule`.
- ☐ **Stale projection:** hard-stale projection refuses mutation commands.
- ☐ **Replay-no-refire:** replay produces zero new notifications, zero new outbound sends, zero new auto-applies.

---

## F. Anti-entropy validation requirements

For each rule R1–R20 in `ACCENTOS_ANTI_ENTROPY_RULES.md`:

- ☐ At least one named monitor.
- ☐ Synthetic-violation test that triggers the monitor.
- ☐ CC tile or operational-health surface that displays the violation count.
- ☐ Owner declared for monitor (runtime team default; ai-policy-owner for R7/R13; ops for R6/R9/R10/R12/R14/R15/R20).
- ☐ Cadence per policy defaults § 5.

---

## G. Authority handoff (architecture → implementation)

- ☐ Architecture-spec branch tagged.
- ☐ Implementation branch forks from spec branch.
- ☐ Doc-edit governance review process declared in writing.
- ☐ All open content/policy items in §A.3 closed.
- ☐ All 22 contradictions triaged.
- ☐ Implementation team confirms idempotent-handler discipline as a hiring/review-time invariant — not just doc.
- ☐ Implementation team confirms reading the four governance reads in §A.1.

---

## H. Definition of "Phase 1 done"

Phase 1 is complete when:

1. All §D steps 1–12 are operational.
2. All §E gates pass.
3. All §F monitors are live.
4. Shell-v2 can submit at least one command per domain end-to-end.
5. Mobile shell can submit at least one quick-action verb offline → replay end-to-end.
6. CC reflects synthetic priority changes within freshness thresholds.
7. One inbound + one outbound adapter operational with documented degradation behavior.
8. The runtime survives synthetic single-engine outage and recovers without re-firing alarms.

---

## I. Forbidden during Phase 1

- ☐ Adding event types not in event-type registry (additive registry edit required first).
- ☐ Adding commands not in command registry (registry edit required first).
- ☐ Authoring notifications outside the engine.
- ☐ Computing priority outside the priority engine.
- ☐ Allowing AI to take subject ownership.
- ☐ Allowing customer-visible auto-apply.
- ☐ Allowing null receivers.
- ☐ Allowing "admin" catch-all role.
- ☐ Bypassing the dispatcher.
- ☐ Mutating committed events.
- ☐ Renaming fields in place.
- ☐ Hidden config that influences runtime behavior.

---

## J. First commit by implementation phase

The first implementation commit should:

- Tag the architecture-spec freeze.
- Add only scaffolding, no business engines.
- Include this checklist's adoption status as a header in the implementation branch's `IMPLEMENTATION_LOG.md`.

The second commit (and onward) may begin §D.1 once §A and §B are checked.
