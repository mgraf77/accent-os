# AccentOS — Registry Artifacts

**Mode:** Runtime architecture / specification (no implementation)
**Anchors:** runtime brief, command vocabulary, adapter contract
**Purpose:** Specify the **shape, ownership, and governance** of the registries the runtime depends on. Registries are the explicit operational governance surface — without them, the spine becomes folklore.

---

## 0. Design rules

1. **Registries are typed artifacts, not config files.** Schema, ownership, change-control, audit.
2. **Registry edits are typed events.** No silent changes. R9 (no invisible overrides) applies.
3. **Registries are versioned.** Edits never destroy history; archived entries remain readable.
4. **Two-key for high-impact edits.** AI-policy classes, priority weights, authority changes.
5. **No forks.** One registry per concern. Per-surface forks are anti-patterns.
6. **No side channels.** If a value influences runtime behavior, it must be in a registry.
7. **Freeze semantics exist.** A registry can be frozen for a window (e.g. during incident) — itself a typed event.

---

## 1. The ten registries

| Registry | Purpose | Owner | Two-key? |
|---|---|---|---|
| Event-type registry | What events exist; payload schema | runtime team + ops | yes (additive: no; breaking: yes) |
| Role registry | Who can be an emitter/owner; chains | ops | yes (escalation chain) |
| Priority registry | Weights, thresholds, hysteresis, cooldown | ops | yes (band thresholds) |
| SLA / clock registry | Handoff SLAs, escalation tier acks, drift tolerance, cooldowns | ops | yes (drift tolerance) |
| AI-policy registry | Policy classes per AI capability | ai-policy-owner + ops | yes |
| Reversibility registry | Reversibility class per AI capability | ai-policy-owner + ops | yes |
| Coverage registry | Per-role OOO + named delegate | role's lead | no (single-key, but typed) |
| Quiet-hours / business-calendar registry | Per role/region quiet windows | ops | no |
| Escalation registry | Tier ownership, ack windows, bounce window | ops | yes (tier ownership) |
| Command-authority registry | Per command, who has authority | ops | yes (auth changes) |

Each section below defines schema (spec only), mutation rules, observability, audit, anti-patterns.

---

## 2. Event-type registry

### Shape

Per event type:
- `event_name`
- `domain`, `entity`, `verb`
- `emitter_classes` (allowed roles + `system` + `ai`)
- `default_receivers` (rule set)
- `required_payload` (typed fields)
- `optional_payload`
- `priority_inputs` (which fields feed the priority engine)
- `escalation_class` (which clock policy applies, if any)
- `dashboard_implications`
- `notification_implications`
- `mobile_implications`
- `ai_implications`
- `lifecycle` (`active | deprecated | end_of_life | archived`)
- `introduced_at`, `deprecated_at`, `end_of_life_at`
- `superseded_by` (reference, when applicable)

### Mutation rules

- Additive (new optional field): single-key, ops + runtime team review.
- New event type: single-key, ops + runtime team review.
- Breaking (rename, type change, semantic change): forbidden. Introduce a new type instead.
- Deprecation: typed event `runtime.schema.deprecated`; sunset window per default policy.
- End-of-life: typed event; emitters stop emitting.
- Archive: typed event; historical events remain valid.

### Observability

- Each registry change emits `runtime.schema.*`.
- Self-check: every emitted event in the store has a corresponding registered type. Anomaly emits `runtime.schema.unregistered_event`.

### Audit

- Append-only history per type.
- Diff visible to ops + runtime team.

### Anti-patterns

- In-place rename.
- Adding required fields to an existing type.
- Removing a type without deprecation arc.
- Allowing emitters to add un-registered fields ("flexible payload").

---

## 3. Role registry

### Shape

Per role:
- `role_name`
- `description` (operational, not HR)
- `lead_role` (single)
- `escalation_tier`
- `default_queues_owned`
- `default_subjects_ownable`
- `write_authorities` (subject types + verb classes)
- `read_authorities`
- `mobile_default` (true/false)
- `default_operational_state`
- `acting_lead_required` (always true for lead roles)

### Mutation rules

- Add role: ops single-key.
- Change lead chain or escalation tier: two-key (ops + exec).
- Change write authorities: two-key (ops + exec).
- Retire role: typed event; existing subjects must be reassigned before role can be archived.

### Observability

- Edits emit `registry.role.*`.
- Coverage gap detector reads role registry vs coverage registry.

### Anti-patterns

- "Admin" catch-all role (R20).
- Roles without lead.
- Lead role without acting-lead requirement.
- Role membership stored outside the registry.

---

## 4. Priority registry

### Shape

Per concern:
- Importance factor weights (deal value, customer tier, strategic flag).
- Urgency factor weights (install proximity, SLA progression, stage age, vendor risk, stock risk, blocker, margin floor).
- Aging logic (rate, cap, reset rules per subject type).
- Band thresholds (`y_threshold`, `r_threshold`).
- Hysteresis deltas (G→Y, Y→R, and reverse).
- Cooldown windows (post band-change suppression).
- Override bounds (pin max delta, pin TTL, snooze max duration).
- Per-subject-type tunings.

### Mutation rules

- Weight tuning: ops single-key, but emits `registry.priority.weight_changed`; surfaces on telemetry.
- Band threshold change: two-key (ops + exec); high blast radius.
- Hysteresis/cooldown change: ops single-key.
- Aging logic change: two-key.

### Observability

- Edits emit typed events.
- Recompute storm detector activates after edits (expected churn) but flags sustained churn.

### Anti-patterns

- Per-dashboard weight overrides.
- Hidden defaults baked into projection code.
- Untyped overrides ("just bump priorities for the migration").
- Edits without surfacing on CC.

---

## 5. SLA / clock registry

### Shape

Per handoff type:
- `ack_sla` (named duration policy).
- `breach_warning` (percentage of SLA).
- `escalation_window` post-breach.

Per escalation tier:
- `ack_window`.
- `bounce_protection_window`.

Cross-cutting:
- Drift tolerance window (mobile clock).
- Cooldown windows for various engines.
- Quiet-hour gating per severity.

### Mutation rules

- Single-key for most edits.
- Drift tolerance change: two-key (ops + runtime team) — affects event-store acceptance behavior.

### Observability

- Edits emit `registry.sla.*`.
- Telemetry reflects SLA changes immediately on next emission; historical events retain prior policy in attribution.

### Anti-patterns

- Per-customer SLA overrides without typed events.
- "Holiday" SLA pauses encoded in projection logic instead of registry.

---

## 6. AI-policy registry

### Shape

Per AI capability (e.g. `ai.draft.first_response`, `ai.parse.vendor_eta`):
- `policy_class` (`human-required | human-default-with-auto-fallback | auto-with-post-hoc-review`).
- `auto_apply_threshold` (confidence floor for auto-apply, where allowed).
- `publish_threshold` (confidence floor for presentation).
- `induced_red_ceiling` (auto-apply suspension trigger).
- `customer_visible` (boolean — if true, auto-apply prohibited).
- `calibration_cadence`.
- `lifecycle` (`active | suspended | retired`).

### Mutation rules

- Tightening (more conservative) policy: ai-policy-owner single-key.
- Loosening (more permissive) policy: two-key (ai-policy-owner + ops).
- Policy change for customer-visible capability: always two-key.
- Suspension on induced-red ceiling breach: automatic, runtime-emitted; explicit re-enable requires two-key.

### Observability

- Edits emit `registry.ai_policy.*`.
- AI suggestion engine reads registry on each suggestion creation.
- CC surfaces capabilities currently suspended.

### Anti-patterns

- Per-role policy bypasses.
- "Beta" capabilities silently auto-applying customer-visible actions.
- Loosening without two-key.

---

## 7. Reversibility registry

### Shape

Per AI capability:
- `reversibility_class` (`irreversible | reversible-easy | reversible-with-cost | irreversible-with-customer-visibility`).
- `revert_window` (how long after apply revert is offered).
- `compensating_action` (named typed action for irreversible classes).

### Mutation rules

- Two-key for any change (ai-policy-owner + ops).
- Reclassifying a capability from `reversible-easy` to a stricter class is permitted single-key (more conservative).

### Observability

- Edits emit typed events.
- AI suggestion engine refuses to auto-apply for capabilities lacking a reversibility entry.

### Anti-patterns

- Defaulting to `reversible-easy` on registration.
- Reclassifying after incidents without re-calibration.

---

## 8. Coverage registry

### Shape

Per role, per individual:
- `out_of_office_window`.
- `delegate_individual` (within same role or upward).
- `delegate_authority_scope` (subset of full authority; default = full).
- `acting_lead` (for lead roles; always required when lead is OOO).

### Mutation rules

- Single-key by the individual or their lead.
- Lead OOO without acting-lead is rejected at submission.

### Observability

- Edits emit `registry.coverage.*`.
- Coverage-gap detector runs continuously: any OOO without delegate, any lead OOO without acting-lead → `registry.coverage.gap_detected`.

### Anti-patterns

- Slack-only OOO ("I'll be out next week").
- Delegate set to an overloaded individual without authority scope.

---

## 9. Quiet-hours / business-calendar registry

### Shape

- Per role / per region: business hours, quiet hours, holidays.
- Severity gating: which severities (default: 1 only) bypass quiet hours.
- Time-zone awareness per individual (override of role default).

### Mutation rules

- Single-key by ops.
- Severity-bypass changes are two-key.

### Observability

- Edits emit typed events.
- Quiet-hour-bypass count remains in telemetry; spikes surface as anomalies.

### Anti-patterns

- Per-feature quiet-hour toggles.
- Silent "always on" overrides.

---

## 10. Escalation registry

### Shape

- Per escalation tier: tier owner role, ack window, bounce-protection window.
- Per branch (sales/design/build/etc.): tier chain reference (always terminating at exec).
- Pattern flag thresholds (recurrence count → "pattern" surfacing).

### Mutation rules

- Tier ownership change: two-key (ops + exec).
- Window tuning: single-key (ops).
- Branch chain edits: two-key.

### Observability

- Edits emit typed events.
- Open-escalation-by-tier metric reads from this registry.

### Anti-patterns

- Channel-named tiers ("post in #urgent").
- Tier chains that don't terminate at exec.
- Different chains for different surfaces.

---

## 11. Command-authority registry

### Shape

Per command name:
- Required role(s).
- Subject ownership requirement (`owner | lead | tier | pool | none`).
- Two-key requirement (yes/no, with required actor classes if yes).
- Allowed operational states (e.g. excludes `Read-Only`).
- Mobile-allowed (yes/no).
- Customer-visible (yes/no — informs AI restrictions).

### Mutation rules

- Loosening authority (more roles allowed): two-key (ops + exec).
- Tightening authority: single-key (ops).
- Adding two-key requirement: single-key.
- Removing two-key requirement: two-key.
- Changing customer-visible flag: two-key.

### Observability

- Edits emit `registry.command_authority.*`.
- Authority-rejection rates per command surface in telemetry.

### Anti-patterns

- Per-surface authority overrides (different rules on mobile vs CC).
- Commands without registry entry (rejected at submission).

---

## 12. Cross-registry rules

### 12.1 Single source

- Each operational concern maps to exactly one registry. Concerns that overlap (e.g. AI auto-apply policy + reversibility) are split into separate registries with explicit cross-references, not merged.

### 12.2 Freeze semantics

- Any registry can be frozen for a declared window via `registry.<name>.freeze` event.
- During freeze, mutation commands are rejected as `command.rejected.registry_frozen`.
- Used for incident response, audits, or migration windows.
- Freeze is itself a typed event with reason and expiry.

### 12.3 Rollback expectations

- Registry changes can be rolled back by issuing the inverse change as a new typed event.
- History is preserved; rollback is a forward step, not a deletion.
- For two-key changes, rollback also requires two-key.

### 12.4 Versioning

- Each registry has a monotonic version counter incremented on every change event.
- Events that depend on registry semantics (e.g. priority recompute, command authority check) record the registry version they used. Replay reproduces with the same version.

### 12.5 Audit posture

- All registry events are append-only on the same event store as operational events.
- Registry events appear on a runtime-governance timeline visible to ops + exec.
- Registry diff over time is queryable via projection.

---

## 13. Anti-entropy mapping

| Anti-entropy rule | Registry safeguard |
|---|---|
| R3 (no hidden priority) | priority registry is the only source of weights |
| R6 (no unowned subjects) | role registry + coverage registry ensure receiver-resolution always lands |
| R7 (no AI without reversibility) | reversibility registry mandatory entry before auto-apply |
| R9 (no invisible overrides) | every registry edit is a typed event |
| R10 (no null receivers) | role + coverage registries feed receiver resolution |
| R12 (no bypassed contracts) | command-authority registry; freeze semantics |
| R15 (no unbounded suppressions) | priority registry sets pin TTL caps |
| R20 (no admin god-mode) | command-authority registry forbids unscoped authority |

---

## 14. Anti-patterns (summary)

- Registries edited in place without typed events.
- Per-surface forks of any registry.
- Side-channel "config" influencing runtime behavior outside registries.
- Required fields added to existing event types.
- Single-key edits for high-blast-radius changes.
- Lead OOO without acting-lead.
- AI capabilities active without reversibility entry.
- Commands without authority entry.
- Tier chains that don't reach exec.
- Hidden defaults in projection code.

---

## 15. What this doc deliberately omits

- Storage of registries (assumed: same event store + projections).
- Editor UI specifics.
- Specific values (weights, thresholds, windows) — that's policy.
- Identity provider mapping for actor identities.
