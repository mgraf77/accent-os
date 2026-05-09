# AccentOS — Policy Decisions v0

**Mode:** Closure of policy gaps from `ACCENTOS_IMPLEMENTATION_ADOPTION_CHECKLIST.md` § A.3 and the freeze snapshot.
**Method:** Each item: decision (or explicit defer), rationale, decision owner, blocking impact, default assumption.
**Spec/policy only — no implementation.**

---

## 1. `ai.outbound.*` boundary

- **Decision:** **draft + send composite**, not a single capability.
  - `ai.draft.<purpose>` capabilities produce drafts via the suggestion lifecycle.
  - The **send** is a command (`customer.message.sent`-producing command) issued by the human; the outbound adapter performs delivery.
  - `ai.outbound.*` as a top-level capability namespace is **removed** from `AI_CAPABILITY_REGISTRY_V0.md` § 6. The "outbound senders" mentioned there were always the human-issued commands; the registry section is reframed accordingly.
- **Rationale:** prevents AI-as-sender; clarifies that customer-visible delivery is human-authored. Aligns with C12 (dual-gate) and R7.
- **Decision owner:** ai-policy-owner + ops.
- **Blocking impact if undecided:** AI suggestion engine implementation would have two valid paths; impl-team would have to guess.
- **Default assumption (now codified):** AI never "sends." AI drafts. Humans send.

---

## 2. `quote.send_with_margin_override` shape

- **Decision:** **inline override flag** on `quote.send`, requiring two-key when set.
  - `quote.send` accepts an optional `margin_override: { reason_code, exec_actor_id }` parameter.
  - When margin floor is breached and `margin_override` is absent → `command.rejected.business_rule.margin_floor_breach`.
  - When `margin_override` is present → two-key check applies (sales-rep + exec, or sales-lead + exec).
- **Rationale:** keeps quote-send as a single command; no proliferation of variants. The override is typed and surfaced.
- **Decision owner:** ops.
- **Blocking impact:** without resolution, sales-rep flows for low-margin quotes would either silently fail or silently pass.
- **Default assumption:** dispatcher rejects below-floor quotes lacking the override; UX surfaces the override path with two-key prompt.

---

## 3. Customer-proxy authority schema

- **Decision:** **typed proxy attribution on the command**, not a separate proxy actor model.
  - Commands proxied for customers (e.g. `quote.mark_accepted`, `build.job.sign_off`, `design.change_order.sign`) carry an additional payload sub-object:
    ```
    proxy_attestation: {
      customer_subject_ref: <customer entity ref>,
      attestation_kind: "verbal" | "email" | "signed_document" | "in_person" | "digital_signature",
      attestation_evidence_ref: <doc/photo/signature ref>,
      captured_by_actor_id: <rep/system actor>,
      captured_at: <timestamp>
    }
    ```
  - The command's `submitted_by` remains the rep/system actor. The customer is not modeled as an actor.
  - `attestation_kind: digital_signature` is acceptable when an integrated e-signature adapter provides verified signature evidence.
- **Rationale:** preserves "customers are subjects, not actors" while making proxied authority auditable and challengeable.
- **Decision owner:** ops + runtime team.
- **Blocking impact:** without it, audit trail for customer-acceptance events lacks evidence anchoring.
- **Default assumption (now codified):** every customer-proxy command carries the attestation sub-object; missing → `command.rejected.malformed`.
- **Documentation:** addendum to `ACCENTOS_AUTH_IDENTITY_BOUNDARY.md` § 9.

---

## 4. Calibration baseline windows

- **Decision:** **per-class baselines**, applied as the "calibrating" period during which capability outputs are advisory only.

| Capability class | Baseline window |
|---|---|
| Routing | 21 days or 200 routings (whichever first) |
| Drafting | 30 days or 100 presentations (whichever first) |
| Parsing (high-stakes — vendor ETA, invoice match) | 21 days or 100 parses |
| Parsing (lower-stakes — voice notes, photo damage) | 14 days or 50 parses |
| Anomaly | 30 days |
| Action (auto-apply class) | 30 days or 100 actions |
| Outbound (advisory only — never auto) | 30 days |
| Search / summarize | 14 days |

- **Rationale:** longer windows for high-blast capabilities; shorter for low-stakes informational outputs.
- **Decision owner:** ai-policy-owner.
- **Blocking impact:** without baseline, AI suggestion engine cannot decide when to lift `calibrating: true`.
- **Default assumption:** every capability ships in `calibrating: true`; baseline window completion + acceptance-rate threshold lifts the flag.

---

## 5. Multi-tenant trigger conditions

- **Decision:** **explicit single-tenant for v1.** Multi-tenant readiness becomes required when **any one** of these triggers fires:
  1. Org expansion: a second operationally-independent business unit needs isolated CC + queues.
  2. Acquisition: a second-org customer base must coexist without leakage.
  3. White-label / partner request with binding commitment.
  4. Regulatory: per-jurisdiction data isolation requirement.
- **Rationale:** v1 reservations (tenant-prefix in subject IDs; tenant slot in payloads; tenant scoping in receiver-resolution inputs) are sufficient placeholders. Lifting to v2 is a deliberate phase, not an emergent one.
- **Decision owner:** Captain + exec.
- **Blocking impact:** none for v1 implementation; v2 cannot begin until trigger is named.
- **Default assumption:** single-tenant for foreseeable future; v2 starts on Captain's declaration of trigger.

---

## 6. RTO target

- **Decision:** **runtime ingress recovery within 15 minutes** of a single-region failure for production-class deployment. Read access (projections served stale-marked) within 5 minutes.
- **Rationale:** matches operational tolerance — workflows can absorb a 15-minute write pause; a 15-minute read pause would be operator-disruptive, hence shorter target.
- **Decision owner:** runtime team + infra.
- **Blocking impact:** without target, infra cannot size DR posture.
- **Default assumption:** the 15/5 split goes into infra brief acceptance criteria.

---

## 7. Full-system replay duration target

- **Decision:** **cold rebuild of all production projections within 4 hours** for the hot tier (≤24 months). Warm-tier rebuild target: 24 hours, ops-approved. Archive-tier rebuild: catastrophic-recovery, no SLA.
- **Rationale:** 4 hours is a tolerable maintenance window for projection schema evolution that requires full rebuild. Warm tier is a different operating mode — expected to be rare.
- **Decision owner:** runtime team + infra.
- **Blocking impact:** without target, schema-evolution playbook is undefined.
- **Default assumption:** hot rebuild ≤4 hr; warm rebuild ≤24 hr ops-approved; archive rebuild bespoke.

---

## 8. IDP choice

- **Decision:** **deferred to Implementation Phase 1 prerequisite step.**
- **Rationale:** the architecture brief states the 10 acceptance criteria; IDP selection requires Captain authorization plus identity team's vendor evaluation, which is out of scope here.
- **Decision owner:** Captain + ops.
- **Blocking impact:** Implementation Phase 1 cannot begin without IDP — but the spec is closed.
- **Default assumption:** IDP integration follows a separate boundary-decision doc (`ACCENTOS_IDP_DECISION.md`) when chosen.

---

## 9. Tamper-evidence mechanism

- **Decision:** **deferred to Implementation Phase 1 prerequisite step.**
- **Rationale:** mechanism choice (hash chain, signed event offsets, append-only WAL with cryptographic anchor) is implementation-side. The architecture requirement (R11 + audit immutability) is closed.
- **Decision owner:** runtime team + infra.
- **Blocking impact:** Phase 1 cannot start the event store without a chosen mechanism.
- **Default assumption:** declare in `ACCENTOS_TAMPER_EVIDENCE_DECISION.md` at kickoff.

---

## 10. Two-key release (in-app dual-approval) process

- **Decision:** **deferred to Implementation Phase 1 prerequisite step.**
- **Rationale:** the architecture requires two-key distinctness verification (auth boundary § 3); the in-app UX (sequential approval vs. simultaneous, time-window for second key, etc.) is shell + auth integration work.
- **Decision owner:** runtime team + shell-v2 + ops.
- **Blocking impact:** two-key commands cannot be implemented end-to-end without the process.
- **Default assumption:** declare in `ACCENTOS_TWO_KEY_RELEASE_PROCESS.md` at kickoff. Suggested baseline: sequential approval within a 15-minute window; both actors authenticate fresh MFA; abort emits typed event.

---

## 11. Schema deprecation default sunset window

- **Decision:** **90 days** (carrying forward `POLICY_DEFAULTS_V0.md` § 3).
- **Rationale:** sufficient for active integrations to update.
- **Decision owner:** runtime team + ops.
- **Blocking impact:** none; closes a default value.

---

## 12. Stale-suppression window

- **Decision:** **15 minutes** (carrying forward `POLICY_DEFAULTS_V0.md` § 6).
- **Rationale:** prevents alarm flood on recovery while keeping legitimately-recent reds visible.
- **Decision owner:** ops.
- **Blocking impact:** none.

---

## 13. Bounce-protection window

- **Decision:** **2 business hours** (carrying forward `POLICY_DEFAULTS_V0.md` § 7).
- **Rationale:** real recurrence within hours signals unresolved root cause.
- **Decision owner:** ops.
- **Blocking impact:** none.

---

## 14. Event retention

- **Decision:** **24 months hot / 5 years warm / indefinite archive** (carrying forward `POLICY_DEFAULTS_V0.md` § 11).
- **Rationale:** operational + audit + legal balance.
- **Decision owner:** ops + legal + infra.
- **Blocking impact:** none.

---

## 15. Drift tolerance window

- **Decision:** **±5 minutes** (carrying forward `POLICY_DEFAULTS_V0.md` § 1).
- **Rationale:** absorbs normal device clock skew without ordering chaos.
- **Decision owner:** ops + runtime team.
- **Blocking impact:** none.

---

## 16. Override budgets

- **Decision:** values per `POLICY_DEFAULTS_V0.md` § 2; suppression budget is **per-event, org-level** (3/business day combined for ops + exec — counts once per suppression event regardless of two-key participation; resolved per C10).
- **Decision owner:** ops + exec.
- **Blocking impact:** none.

---

## 17. Open / deferred summary

| Item | Status |
|---|---|
| `ai.outbound.*` boundary | ✓ Closed |
| `quote.send_with_margin_override` | ✓ Closed |
| Customer-proxy authority schema | ✓ Closed |
| Calibration baseline windows | ✓ Closed |
| Multi-tenant trigger | ✓ Closed (deferred-to-Captain trigger) |
| RTO target | ✓ Closed |
| Full-system replay duration | ✓ Closed |
| Schema sunset window | ✓ Closed |
| Stale-suppression window | ✓ Closed |
| Bounce-protection window | ✓ Closed |
| Event retention | ✓ Closed |
| Drift tolerance | ✓ Closed |
| Override budgets | ✓ Closed (clarified) |
| IDP choice | ⏳ Deferred — Captain |
| Tamper-evidence mechanism | ⏳ Deferred — runtime team + infra |
| Two-key release process | ⏳ Deferred — runtime team + shell-v2 + ops |

**13 closed, 3 deferred to Implementation Phase 1 prerequisite step.** All deferrals have named owners and are blocking-but-bounded — they unblock with a single decision each.

---

## 18. Documentation propagation

These decisions become part of the architecture-spec corpus by reference. Where a decision implies a doc edit (e.g. `ai.outbound.*` removal from `AI_CAPABILITY_REGISTRY_V0.md` § 6), the edit is reflected via this decisions doc; the host doc will be folded on the next architecture-spec maintenance pass.

In the interim, this doc **overrides on conflict**.
