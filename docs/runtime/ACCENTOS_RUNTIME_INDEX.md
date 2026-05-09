# AccentOS — Runtime Architecture Index

**Mode:** Navigation spine for the runtime architecture corpus.
**Status:** Architecture-spec phase frozen at commit `607942c1b9035265160890bb0d6486f7a1be7393`.

---

## 0. How to read this index

For every document:

- **Purpose** — what the doc decides.
- **Authority level** — `Constitutional` (must not be violated; changes are spine-edits), `Contractual` (binding contract; changes are typed registry edits), `Specification` (binding spec; changes follow doc-edit governance), `Brief` (boundary or interface; changes follow boundary review), `Reference` (informational, derived from above).
- **Dependency order** — what must be read before this doc makes sense.
- **Implementation consumption order** — when implementation phases consume the doc.
- **Registry dependencies** — which registries the doc binds to.
- **Governance dependencies** — which actors govern changes.
- **Shell-v2 dependencies** — what shell-v2 must consume.

---

## 1. Workflow systems modeling layer (foundation)

### 1.1 `docs/workflows/ACCENTOS_OPERATIONAL_WORKFLOWS.md`

- **Purpose:** 15 operational workflows as the source of all runtime behavior.
- **Authority:** Constitutional (operational reality — all spine derives).
- **Dependencies:** none (foundation).
- **Implementation consumption:** Phase 0 — every implementer reads first.
- **Registry deps:** event-type, role.
- **Governance:** ops + exec.
- **Shell-v2 deps:** every workflow surfaces as CC + role-CC tile + mobile verb.

### 1.2 `ACCENTOS_EVENT_AND_HANDOFF_SCHEMA.md`

- **Purpose:** canonical event vocabulary + universal handoff contracts.
- **Authority:** Contractual.
- **Dependencies:** 1.1.
- **Implementation:** Phase 1 — event store + dispatcher + handoff engine.
- **Registry deps:** event-type registry.
- **Governance:** runtime team + ops.
- **Shell-v2 deps:** subject timelines.

### 1.3 `ACCENTOS_PRIORITY_SYSTEM.md`

- **Purpose:** centralized `priority_score` philosophy.
- **Authority:** Constitutional.
- **Dependencies:** 1.1, 1.2.
- **Implementation:** Phase 1 — priority engine.
- **Registry deps:** priority registry, override budgets.
- **Governance:** ops (single-key weights; two-key thresholds).
- **Shell-v2 deps:** every list sorts by `priority_score`.

### 1.4 `ACCENTOS_AI_SUGGESTION_MODEL.md`

- **Purpose:** AI suggestions as operational objects.
- **Authority:** Constitutional.
- **Dependencies:** 1.1, 1.2.
- **Implementation:** Phase 1 — AI suggestion engine.
- **Registry deps:** AI capability, reversibility, AI policy.
- **Governance:** ai-policy-owner + ops.
- **Shell-v2 deps:** AI inboxes + per-subject AI panels.

### 1.5 `ACCENTOS_OPERATIONAL_STATE_MODEL.md`

- **Purpose:** nine operational states; per-session evaluator output.
- **Authority:** Contractual.
- **Dependencies:** 1.1.
- **Implementation:** Phase 1 — operational-state evaluator.
- **Registry deps:** none direct (evaluator inputs).
- **Governance:** runtime team + ops.
- **Shell-v2 deps:** state-aware rendering.

### 1.6 `ACCENTOS_ROLE_AND_RECEIVER_MODEL.md`

- **Purpose:** role hierarchy + deterministic receiver resolution.
- **Authority:** Contractual.
- **Dependencies:** 1.1, 1.2.
- **Implementation:** Phase 1 — receiver-resolution service.
- **Registry deps:** role registry, coverage registry, command-authority registry.
- **Governance:** ops (single-key); two-key for chain edits.
- **Shell-v2 deps:** queue scoping; authority-aware verbs.

### 1.7 `ACCENTOS_COMMAND_CENTER_SPEC.md`

- **Purpose:** single executive operational surface (== `Executive Review` state).
- **Authority:** Specification.
- **Dependencies:** 1.1, 1.3, 1.5, 1.6.
- **Implementation:** Phase 1 — CC projection layer.
- **Registry deps:** priority, role.
- **Governance:** ops + exec.
- **Shell-v2 deps:** CC is a special projection consumer.

### 1.8 `ACCENTOS_RUNTIME_CONTRACTS.md`

- **Purpose:** orchestration runtime constitution (10 contracts).
- **Authority:** Constitutional.
- **Dependencies:** 1.1–1.7.
- **Implementation:** Phase 1 — every engine cites contracts honored.
- **Registry deps:** all registries indirectly.
- **Governance:** runtime team + exec on changes.
- **Shell-v2 deps:** indirect (via projection + command paths).

### 1.9 `ACCENTOS_OPERATIONAL_TELEMETRY.md`

- **Purpose:** operational + orchestration health signals.
- **Authority:** Specification.
- **Dependencies:** 1.1–1.8.
- **Implementation:** Phase 1 — telemetry projection layer.
- **Registry deps:** none (signals are projections).
- **Governance:** ops; ai-policy-owner for AI signals.
- **Shell-v2 deps:** CC tiles + ops health surface.

### 1.10 `ACCENTOS_ANTI_ENTROPY_RULES.md`

- **Purpose:** 20 invariants the runtime must obey.
- **Authority:** Constitutional.
- **Dependencies:** 1.1–1.9.
- **Implementation:** Phase 1 — monitor coverage map.
- **Registry deps:** all (invariants enforce registry discipline).
- **Governance:** runtime team + exec on rule changes.
- **Shell-v2 deps:** indirect.

---

## 2. Runtime architecture layer

### 2.1 `docs/runtime/ACCENTOS_RUNTIME_ARCHITECTURE_BRIEF.md`

- **Purpose:** Phase-1 runtime architecture brief; logical components, event-store requirements, projection model, schema evolution, idempotency, clock policy, failure/recovery, observability, readiness checklist.
- **Authority:** Brief (boundary).
- **Dependencies:** all of §1.
- **Implementation:** Phase 1 (kickoff).
- **Registry deps:** all.
- **Governance:** runtime team + ops + exec.
- **Shell-v2 deps:** consume CC + projections; submit commands.

### 2.2 `ACCENTOS_COMMAND_VOCABULARY.md`

- **Purpose:** how shell addresses runtime; command grammar, authority, validation, rejection.
- **Authority:** Contractual.
- **Dependencies:** 2.1, 1.6, 1.8.
- **Implementation:** Phase 1 — dispatcher + authority service.
- **Registry deps:** command-authority registry, role registry.
- **Governance:** ops; two-key for authority loosening.
- **Shell-v2 deps:** **direct** — every shell verb maps here.

### 2.3 `ACCENTOS_INTEGRATION_ADAPTER_CONTRACT.md`

- **Purpose:** adapter classes, lifecycle, idempotency, ambiguity, degradation, observability.
- **Authority:** Contractual.
- **Dependencies:** 2.1, 1.2, 1.4.
- **Implementation:** Phase 1 — first inbound + outbound adapter.
- **Registry deps:** event-type, AI capability.
- **Governance:** runtime team + ops.
- **Shell-v2 deps:** indirect (degradation rendering).

### 2.4 `ACCENTOS_REGISTRY_ARTIFACTS.md`

- **Purpose:** ten registries — shape, ownership, mutation, audit.
- **Authority:** Contractual.
- **Dependencies:** 1.1–1.10, 2.1.
- **Implementation:** Phase 1 — registries as event-derived projections.
- **Registry deps:** self.
- **Governance:** per-registry; many two-key.
- **Shell-v2 deps:** registry edits surface as governance events.

### 2.5 `ACCENTOS_RUNTIME_BOUNDARIES.md`

- **Purpose:** eight layers; must-do / must-never per layer.
- **Authority:** Constitutional.
- **Dependencies:** 2.1–2.4.
- **Implementation:** Phase 1+ — review gate for every PR.
- **Registry deps:** indirect.
- **Governance:** runtime team + exec.
- **Shell-v2 deps:** **direct** — shell layer responsibilities.

### 2.6 `ACCENTOS_RUNTIME_SURVIVABILITY_AUDIT.md`

- **Purpose:** failure modes; detection / containment / recovery.
- **Authority:** Specification.
- **Dependencies:** 2.1–2.5, 1.10.
- **Implementation:** Phase 1 validation; ongoing.
- **Registry deps:** all.
- **Governance:** runtime team + ops.
- **Shell-v2 deps:** degraded-mode rendering.

---

## 3. Registry v0 layer

### 3.1 `docs/runtime/registries/EVENT_TYPE_REGISTRY_V0.md`

- **Purpose:** every event enumerated.
- **Authority:** Contractual (v0 seed).
- **Dependencies:** 1.2, 2.2, 2.3, 2.4.
- **Implementation:** Phase 1 — registry seed.
- **Governance:** runtime team + ops.
- **Shell-v2 deps:** every projection feed.

### 3.2 `COMMAND_REGISTRY_V0.md`

- **Purpose:** every v0 command.
- **Authority:** Contractual.
- **Dependencies:** 2.2, 1.6, 3.1.
- **Implementation:** Phase 1 — dispatcher seed.
- **Governance:** ops; two-key on authority.
- **Shell-v2 deps:** **direct** — shell verb table.

### 3.3 `ROLE_REGISTRY_V0.md`

- **Purpose:** every role + lead chain + authorities.
- **Authority:** Contractual.
- **Dependencies:** 1.6, 2.4.
- **Implementation:** Phase 1 — role registry seed.
- **Governance:** ops + exec.
- **Shell-v2 deps:** authority-aware verbs; queue scoping.

### 3.4 `AI_CAPABILITY_REGISTRY_V0.md`

- **Purpose:** every AI capability + policy/reversibility classes.
- **Authority:** Contractual.
- **Dependencies:** 1.4, 2.3, 2.4.
- **Implementation:** Phase 1 — AI engine seed.
- **Governance:** ai-policy-owner + ops.
- **Shell-v2 deps:** AI inbox rendering.

### 3.5 `POLICY_DEFAULTS_V0.md`

- **Purpose:** first-cut numerical defaults.
- **Authority:** Specification (v0 seed).
- **Dependencies:** 2.1, 2.4, 1.10.
- **Implementation:** Phase 1 — registry seed values.
- **Governance:** ops; two-key on high-blast.
- **Shell-v2 deps:** freshness thresholds, mobile drift, quiet hours.

---

## 4. Boundary briefs (deferred-domain)

### 4.1 `ACCENTOS_AUTH_IDENTITY_BOUNDARY.md`

- **Purpose:** what runtime requires from IDP.
- **Authority:** Brief.
- **Dependencies:** 1.6, 2.2, 2.4.
- **Implementation:** Phase 1 prerequisite — IDP integration.
- **Governance:** runtime team + ops.
- **Shell-v2 deps:** session establishment + MFA freshness.

### 4.2 `ACCENTOS_INFRA_REQUIREMENTS_BRIEF.md`

- **Purpose:** acceptance criteria infra must satisfy.
- **Authority:** Brief.
- **Dependencies:** 2.1, 2.6.
- **Implementation:** Phase 1 prerequisite — infra stand-up.
- **Governance:** runtime team + ops + infra.
- **Shell-v2 deps:** none direct.

### 4.3 `ACCENTOS_SHELL_RUNTIME_INTERACTION_BRIEF.md`

- **Purpose:** shell ↔ runtime contract.
- **Authority:** Brief.
- **Dependencies:** 2.1–2.5.
- **Implementation:** Phase 1 — shell-v2 work consumes.
- **Governance:** runtime team + shell-v2 team.
- **Shell-v2 deps:** **the brief itself is the shell-v2 reference**.

---

## 5. Convergence layer (this phase)

### 5.1 `ACCENTOS_RUNTIME_INDEX.md` (this doc)

- **Purpose:** navigation spine.
- **Authority:** Reference.
- **Dependencies:** all above.

### 5.2 `ACCENTOS_RUNTIME_TERMINOLOGY.md`

- **Purpose:** one term = one meaning.
- **Authority:** Constitutional (vocabulary).

### 5.3 `ACCENTOS_RUNTIME_CONTRADICTIONS.md`

- **Purpose:** identified ambiguities + recommended resolution paths.
- **Authority:** Reference.

### 5.4 `ACCENTOS_RUNTIME_FREEZE_SNAPSHOT.md`

- **Purpose:** authoritative handoff packet.
- **Authority:** Brief.

### 5.5 `ACCENTOS_IMPLEMENTATION_ADOPTION_CHECKLIST.md`

- **Purpose:** Session-1 onboarding flatten.
- **Authority:** Brief.

---

## 6. Required reading order — by phase

### Phase 0 — orientation (anyone touching runtime)

1. 1.1 Operational Workflows
2. 5.4 Freeze Snapshot
3. 5.2 Terminology
4. 1.10 Anti-Entropy Rules
5. 2.5 Runtime Boundaries

### Phase 1 — runtime implementation team

6. 1.2 Event & Handoff Schema → 3.1 Event Type Registry v0
7. 2.2 Command Vocabulary → 3.2 Command Registry v0
8. 1.6 Role & Receiver Model → 3.3 Role Registry v0
9. 1.3 Priority System
10. 1.4 AI Suggestion Model → 3.4 AI Capability Registry v0
11. 1.5 Operational State Model
12. 2.4 Registry Artifacts → 3.5 Policy Defaults v0
13. 2.1 Runtime Architecture Brief
14. 1.8 Runtime Contracts
15. 2.3 Integration Adapter Contract
16. 2.6 Survivability Audit
17. 4.1 Auth Identity Boundary
18. 4.2 Infra Requirements Brief

### Phase 1 — shell-v2 team

19. 4.3 Shell Runtime Interaction Brief (primary)
20. 2.2 Command Vocabulary + 3.2 Command Registry (verb table)
21. 1.5 Operational State Model
22. 1.7 Command Center Spec
23. 1.4 AI Suggestion Model
24. 2.5 Runtime Boundaries (shell layer)

### Phase 1 — mobile team

25. 4.3 Shell Runtime Interaction Brief (mobile sections)
26. 1.1 Operational Workflows § 15 (mobile quick-action)
27. 3.2 Command Registry (mobile=Y verbs)
28. 1.5 Operational State Model (Mobile Quick Mode composition)

### Phase 1 — ops / governance

29. 2.4 Registry Artifacts
30. 3.3 Role Registry v0
31. 3.4 AI Capability Registry v0
32. 3.5 Policy Defaults v0
33. 1.7 Command Center Spec
34. 1.9 Operational Telemetry

### Phase 1 — exec

35. 5.4 Freeze Snapshot (exec section)
36. 1.7 Command Center Spec
37. 1.9 Operational Telemetry (top signals)

---

## 7. Validation gate map (Phase 1 acceptance)

| Gate | Reads | Validates |
|---|---|---|
| Anti-entropy smoke | 1.10, 5.4 | every monitor fires on synthetic violation |
| Deterministic replay | 2.1 §6, 3.5 §12 | rebuilds identical |
| Receiver-resolution determinism | 1.6, 3.5 §22 | replay sample identical |
| Two-key distinctness | 4.1 §3 | distinct actor_ids + MFA freshness |
| Component degradation | 2.6 §12 | each engine kill → CC reflects + recovery typed |
| Registry mutation flow | 2.4, 3.5 | every edit emits typed event |
| Schema evolution | 2.1 §5 | additive non-breaking; new types for breaking |
| Adapter ambiguity | 2.3 §5 | low-confidence parses route to suggestion, not fact |
| AI auto-apply gating | 1.4, 3.4 | customer-visible never auto |

---

## 8. Document count

- Workflow systems modeling: 10 docs
- Runtime architecture: 6 docs
- Registry v0: 5 docs
- Boundary briefs: 3 docs
- Convergence: 5 docs (this phase)

**Total: 29 architecture-spec documents.** Implementation phase consumes; does not invent.
