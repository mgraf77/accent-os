# AccentOS — Implementation Authority Matrix

**Status:** Authority allocations after architecture-spec freeze.
**Purpose:** Single page answering "who may change what after freeze".

---

## 1. Authority classes (rows)

- **Captain** — Michael (project authority; final escalation).
- **Architecture team** — owners of `docs/workflows/`, `docs/runtime/` doc tree.
- **Runtime team** — implements the runtime engines + dispatcher + event store.
- **Shell-v2 team** — implements shell client (web + mobile).
- **Mobile team** — owns mobile-specific paths (often part of shell-v2 team in small orgs).
- **Ops** — operational governance role; owns most registry edits; suppression / readiness-bypass authority.
- **Exec** — terminal escalation; two-key partner for high-blast-radius changes.
- **`ai-policy-owner`** — AI policy / reversibility registries; AI suspension authority.
- **Per-role leads** — coverage registry for their own role.

---

## 2. Concern (columns)

- C1 Constitutional spine (anti-entropy, contracts, boundaries, terminology, priority, AI suggestion).
- C2 Contractual layer (event/handoff schema, command vocabulary, adapter contract, registry artifacts, role/receiver, op-state).
- C3 Specifications (CC, telemetry, runtime brief, survivability audit).
- C4 Boundary briefs (auth, infra, shell-runtime).
- C5 Registry v0 seeds + enums + policy defaults.
- C6 Runtime code (engines, dispatcher, event store, projections).
- C7 Shell code (web + mobile).
- C8 Adapter code.
- C9 Production deployment.
- C10 Production rollout / rollback.
- C11 Anti-entropy monitor lifecycle.
- C12 Two-key release process.
- C13 Escalation tier ownership.
- C14 Coverage registry edits.

Legend: ✓ = authoritative (owner); ~ = co-author / reviewer; · = none; **2K** = two-key required.

---

## 3. Matrix

| | C1 Const. | C2 Contract | C3 Spec | C4 Brief | C5 Seeds | C6 Runtime | C7 Shell | C8 Adapt. | C9 Deploy | C10 Rollback | C11 AE | C12 2K | C13 Esc | C14 Cover |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Captain | ✓ (final say) | ~ | ~ | ~ | ~ | ~ | ~ | ~ | ~ | ✓ (final say) | ~ | ~ | ~ | ~ |
| Architecture team | ✓ | ✓ | ✓ | ✓ | ✓ | · | · | · | · | · | ~ | ~ | ~ | · |
| Runtime team | 2K w/ exec | ✓ (additive) | ✓ | ~ | ~ | ✓ | · | ~ | ~ | ~ | ✓ | ~ | · | · |
| Shell-v2 team | · | ~ | ~ | ✓ (shell brief) | · | · | ✓ | · | · | · | · | · | · | · |
| Mobile team | · | ~ | ~ | ~ | · | · | ✓ (mobile) | · | · | · | · | · | · | · |
| Ops | 2K w/ exec | ~ | ✓ | ~ | ✓ (most) | · | · | · | ✓ | ✓ | ~ | 2K (one key) | ✓ (single)/2K w/ exec (chain) | ~ |
| Exec | 2K w/ ops | 2K (high-blast) | ~ | · | 2K (band thresholds) | · | · | · | · | ✓ (final say) | · | 2K (one key) | 2K w/ ops (chain) | · |
| ai-policy-owner | · | · | · | · | ✓ (AI capability + reversibility) | · | · | · | · | · | · | 2K (one key for AI policy resume) | · | · |
| Per-role leads | · | · | · | · | · | · | · | · | · | · | · | · | · | ✓ (own role) |

---

## 4. Specific authority statements

### 4.1 Constitutional changes (C1)

- Editable only via constitutional amendment process.
- Required actors: Captain (authorizing), ops + exec + runtime team (reviewing).
- Must produce `CONSTITUTIONAL_AMENDMENT_<n>.md` documenting the change.
- Bumps architecture-spec version (e.g. `architecture-spec-freeze-v1`).

### 4.2 Contractual changes (C2)

- Additive: runtime team + ops; single-key per registry artifact spec.
- Breaking: forbidden in place; requires new typed entries with deprecation arc.
- High-blast (escalation chain edits, command-authority loosening, customer-visible flag changes): two-key (ops + exec).

### 4.3 Specification edits (C3)

- Ops + runtime team review.
- Must trace to a contradiction resolution, registry change, or operational policy decision.

### 4.4 Brief edits (C4)

- Runtime team + consuming team (auth → identity team; infra → infra team; shell → shell-v2 team).
- Acceptance-criteria-driven edits only.

### 4.5 Registry v0 seed + enums + policy edits (C5)

- Per-registry per `ACCENTOS_REGISTRY_ARTIFACTS.md`.
- Enum additions: additive; runtime team + ops.
- Policy default tuning: ops single-key for most; two-key for drift tolerance, band thresholds, severity-bypass, customer-visible flag.

### 4.6 Runtime code (C6)

- Runtime team.
- Bounded by doc traceability — every code change citing a spine element must trace to a doc.

### 4.7 Shell code (C7)

- Shell-v2 + mobile teams.
- Bounded by `ACCENTOS_SHELL_RUNTIME_INTERACTION_BRIEF.md`.

### 4.8 Adapter code (C8)

- Runtime team or dedicated adapter team.
- Bounded by `ACCENTOS_INTEGRATION_ADAPTER_CONTRACT.md`.

### 4.9 Production deployment (C9)

- Ops authoritative.
- Captain + exec informed for major deployments.

### 4.10 Rollout / rollback (C10)

- Ops authoritative on rollback execution.
- Exec final-say on whether to rollback (paired with Captain).

### 4.11 Anti-entropy monitor lifecycle (C11)

- Runtime team owns monitor implementation.
- Disabling a monitor requires runtime team + ops + typed event.
- Adding a monitor: runtime team single-key.

### 4.12 Two-key release process (C12)

- The two-key process itself is governed by ops; specific dual-actor pairing per command in command-authority registry.
- Default pairings:
  - `orchestration.subject.suppress_red` — ops + exec.
  - `ai.policy.resume_type` — ai-policy-owner + ops.
  - `registry.command_authority.update` (loosening) — ops + exec.
  - `registry.priority.threshold_changed` — ops + exec.
  - `registry.reversibility.update` — ai-policy-owner + ops.

### 4.13 Escalation tier ownership (C13)

- Tier-1 owners declared per role registry.
- Tier ownership change → two-key (ops + exec).
- Acting-tier-owner during OOO required for tier-1+; coverage registry enforces.

### 4.14 Coverage registry (C14)

- Per-role-lead authoritative for their own role.
- Lead OOO without acting-lead is rejected at submission (per policy defaults § 16).

---

## 5. Authority that does NOT exist after freeze

- **God-mode admin authority.** No role can edit committed events, override the spine without typed events, or bypass two-key requirements.
- **Implementation team architecture authority.** Implementation may not invent new event types, commands, registries, or contracts without going through architecture governance.
- **AI authority.** AI never owns subjects, sets priority, picks owners, or self-issues authority.
- **Per-surface override.** Mobile vs. desktop authority is identical for shared commands.
- **Customer / vendor authority.** Customers and vendors are subjects, not actors; never carry authority.
- **Per-customer / per-deal SLA exceptions outside the registry.** SLA tuning happens via registry edits, never per-row.

---

## 6. Anti-pattern: who may NOT change what

- Implementation team may not edit Constitutional docs.
- Runtime team may not edit Constitutional spine without exec.
- Ops alone may not edit reversibility registry (ai-policy-owner partner required).
- Exec alone may not edit AI policy class (ai-policy-owner + ops partner required).
- ai-policy-owner may not edit role registry.
- Per-role lead may not edit any registry beyond their own role's coverage.
- Captain has final-say authority but does not silently bypass governance — Captain authorizes, governance reviews, doc trail records.

---

## 7. Quick decision flowcharts

### "I need to add a new event type."

→ Additive registry edit + doc edit. Runtime team + ops reviewers. Single-key.

### "I need to add a customer-visible flag to a command."

→ Two-key registry edit (ops + exec). Doc edit. Smoke-test customer-visible authority gating.

### "I need to suspend an AI capability."

→ ai-policy-owner single-key `ai.policy.suspend_type` command.

### "I need to resume an AI capability after suspension."

→ Two-key (ai-policy-owner + ops) `ai.policy.resume_type` command.

### "I need to suppress a red on a critical subject."

→ Two-key (ops + exec) `orchestration.subject.suppress_red` command. Within budget. Surfaces on CC.

### "I need to change the priority band threshold."

→ Two-key (ops + exec) registry edit. Telemetry recompute storm watched.

### "I want to refactor a runtime engine."

→ Runtime team. Must preserve every contract and anti-entropy invariant. Doc edit only if behavior trace changes.

### "I want to remove an event type that's no longer used."

→ Deprecate (single-key) → coexist period (≥90 days per policy default § 3) → end-of-life (single-key) → archive. No in-place removal.

### "I want to amend the boundary contracts."

→ Constitutional amendment. Captain authorization; ops + exec + runtime team review; new architecture-spec freeze tag.
