# AccentOS — Enums v0

**Status:** First-cut enumeration of every enum gap surfaced across the architecture-spec corpus and the contradiction resolution log.
**Evolution rule:** **additive only.** Members may be added; never removed in place. Deprecation arc per `ACCENTOS_REGISTRY_ARTIFACTS.md` § 5.

**Naming convention:** symbolic names are stable, lowercase, snake_case. Human-readable descriptions evolve freely.

---

## 1. Customer message intent

Enum: `customer_message_intent`

Used by `ai.parse.customer_message_intent` adapter outputs and `customer.message.received.parsed_intent`.

| Symbol | Description |
|---|---|
| `question_general` | General product or service question |
| `question_pricing` | Pricing-specific question |
| `question_status` | Customer asking about progress / status of own job |
| `complaint` | Customer expressing dissatisfaction |
| `change_request` | Customer requesting scope/spec change |
| `payment_inquiry` | Question about invoice, deposit, or balance |
| `payment_made` | Customer indicating payment has been sent |
| `schedule_request` | Request to schedule, reschedule, or cancel |
| `referral` | Customer referring another customer |
| `praise` | Positive feedback / thank you |
| `urgent` | Customer flags time-sensitive concern |
| `unknown` | Confidence below classification threshold |

---

## 2. Service severity

Enum: `service_severity`

| Symbol | Description |
|---|---|
| `sev_1` | System-down for customer; install failure; safety/property risk; same-day required |
| `sev_2` | Functional issue significantly impairing use; multi-day acceptable |
| `sev_3` | Cosmetic, low-impact, or convenience issue; standard cadence |

Severity-1 mandates service-lead routing per role/receiver model § 10.7.

---

## 3. PO ETA-slip reason codes

Enum: `po_eta_slip_reason`

| Symbol | Description |
|---|---|
| `vendor_capacity` | Vendor production / fulfillment delay |
| `vendor_stockout` | Vendor out of stock; backorder |
| `freight_delay` | Carrier / shipping delay |
| `customs_delay` | International or border hold |
| `weather_event` | Force majeure, weather-driven |
| `quality_hold` | Vendor QC hold; reissue pending |
| `payment_block` | Vendor on credit hold pending payment |
| `vendor_unresponsive` | No confirmation; ETA inferred lapsed |
| `corrective_reorder` | Damage / wrong-ship requires reorder |
| `vendor_communicated_other` | Reason captured in note; not categorizable |
| `unknown` | Adapter could not determine reason |

---

## 4. Escalation resolution codes

Enum: `escalation_resolution`

| Symbol | Description |
|---|---|
| `resolved_action_taken` | Underlying issue cleared via direct action |
| `resolved_reassigned` | Resolution by transferring ownership |
| `resolved_pattern_referred` | Underlying issue is a pattern; routed to weekly review |
| `resolved_external_dependency` | Resolution depends on customer/vendor; tracked separately |
| `merged_into_parent` | Merged with a higher-level escalation |
| `superseded_by_recurrence` | Re-emerged under bounce protection; jumped tier |
| `false_positive` | Underlying signal was incorrect; trigger reviewed |
| `accepted_risk` | Risk accepted by exec; conditions documented |

---

## 5. Adapter degradation reasons

Enum: `adapter_degraded_reason`

| Symbol | Description | Adapter classes |
|---|---|---|
| `source_unreachable` | External source not responding | inbound, two-way, sensor |
| `source_unauthenticated` | Authenticity evidence failed | inbound |
| `parse_drift` | Parser confidence collapsing | inbound, AI inference |
| `parse_ambiguous_high_rate` | Sustained high ambiguity rate | inbound |
| `quota_exhausted` | External API quota / rate limit reached | outbound, two-way, AI inference |
| `divergence` | Two-way state divergence sustained | two-way |
| `calibration_lost` | AI calibration window expired | AI inference |
| `model_unavailable` | AI model endpoint down | AI inference |
| `backlog_overflow` | In-flight buffer beyond threshold | inbound, outbound |
| `credential_unavailable` | Outbound credentials missing/expired | outbound, two-way |
| `dedupe_collision_high_rate` | Hash collisions exceeding tolerance | inbound, sensor |
| `manual_suspended` | Operator manually suspended adapter | any |

---

## 6. AI suggestion rejection reasons

Enum: `ai_suggestion_rejection_reason`

| Symbol | Description |
|---|---|
| `wrong_facts` | Suggestion is factually incorrect |
| `wrong_audience` | Tone or content inappropriate for recipient |
| `outdated_context` | Underlying context has moved on since suggestion |
| `low_value` | Correct but not useful |
| `duplicate` | Already covered by another action |
| `policy_concern` | Customer-facing concern; rep prefers human voice |
| `not_for_me` | Wrong owner — should be presented to someone else |
| `prefer_alternative` | An offered alternative is better |
| `style_mismatch` | Tone / style doesn't match the operator's voice |
| `other` | Free-text note required if selected |

---

## 7. Override reason codes (cross-cutting)

### 7.1 `override_reason_pin`

| Symbol | Description |
|---|---|
| `active_focus` | Operator is actively working this subject |
| `executive_priority` | Strategic / VIP customer flagged |
| `risk_watch` | Anticipating issue; preemptive attention |
| `complex_case` | Multi-faceted; benefits from active tracking |

### 7.2 `override_reason_snooze`

| Symbol | Description |
|---|---|
| `waiting_customer` | Awaiting customer response |
| `waiting_vendor` | Awaiting vendor response |
| `waiting_peer` | Awaiting internal teammate |
| `waiting_decision` | Awaiting decision from lead/exec |
| `not_actionable_now` | No meaningful action possible at this time |

### 7.3 `override_reason_suppress_red`

| Symbol | Description |
|---|---|
| `false_positive_signal` | The red signal is incorrect |
| `accepted_risk` | Risk understood and accepted by exec |
| `external_dependency_known` | Underlying cause acknowledged externally |
| `policy_exception_documented` | Exception documented; expires at TTL |

### 7.4 `override_reason_takeover`

| Symbol | Description |
|---|---|
| `owner_unavailable` | Original owner OOO without delegate |
| `escalation_intervention` | Lead intervention from escalation |
| `quality_concern` | Subject quality requires lead handling |
| `customer_request` | Customer requested specific owner |

### 7.5 `override_reason_readiness_bypass`

| Symbol | Description |
|---|---|
| `predicate_known_imminent` | Predicate will satisfy within minutes |
| `customer_pressure_documented` | Lead-level decision documented |
| `data_quality_known` | Predicate's data source temporarily unreliable |
| `material_substitution_in_flight` | Selection swap pending; readiness logically met |

---

## 8. Command rejection business-rule reasons

Enum: `command_rejected_business_rule_reason`

| Symbol | Description |
|---|---|
| `margin_floor_breach` | Quote below margin floor without override |
| `budget_exceeded` | Override budget exhausted (suppression / pin / readiness-bypass) |
| `cooldown_active` | Action within post-prior-action cooldown window |
| `insufficient_inventory` | Reservation request exceeds available |
| `vendor_credit_hold` | PO send blocked by vendor credit status |
| `coverage_gap` | Lead OOO without acting-lead at submission time |
| `frozen_window` | Submission during a registry/branch freeze |
| `severity_misclass` | Severity-1 must route via service-lead |
| `duplicate_in_flight` | Conflicting in-flight subject blocks action |
| `out_of_phase` | Action attempted outside the workflow phase |

---

## 9. Snooze wake conditions

Enum: `snooze_wake_event_whitelist`

Permitted wake event names for `kind: "event"` snooze wake conditions.

| Symbol | Description |
|---|---|
| `customer.message.received` | Wake when customer responds |
| `procurement.po.confirmed` | Wake when vendor confirms PO |
| `procurement.po.eta_set` | Wake when ETA arrives |
| `procurement.po.received` | Wake when goods received |
| `design.selection.locked` | Wake when designer locks |
| `design.change_order.signed` | Wake when change signed |
| `quote.accepted` | Wake when customer accepts |
| `quote.viewed` | Wake when customer opens quote |
| `inventory.received` | Wake when SKU arrives |

Other event types are not permitted as wake triggers in v0 (additive in future).

---

## 10. Replay suppression reasons

Enum: `replay_suppression_reason`

Recorded on `notification.retracted`-class events and outbound stale-suppression events.

| Symbol | Description |
|---|---|
| `replay_marker` | Replay/recovery flow; side effect intentionally suppressed |
| `stale_event_age` | Triggering event older than stale-suppression window |
| `subject_already_resolved` | Subject moved on; signal no longer relevant |
| `recipient_unsubscribed` | Recipient opted out (where applicable) |
| `aggregated_into_digest` | Folded into a digest notification instead of sent individually |

---

## 11. Submission kinds

Enum: `submission_kind` (universal command field, per C11 resolution)

| Symbol | Description |
|---|---|
| `live` | Live online submission (default) |
| `offline_replay` | Mobile-queued submission replayed on reconnect |

---

## 12. Adapter classes

Enum: `adapter_class`

| Symbol | Description |
|---|---|
| `inbound_parser` | External signal → typed event |
| `outbound_sender` | Typed directive → external action |
| `two_way_sync` | Bidirectional state sync |
| `ai_inference` | AI capability output |
| `sensor_telemetry` | Narrowly-scoped observed signal |

---

## 13. Adapter lifecycle states

Enum: `adapter_lifecycle_state`

| Symbol | Description |
|---|---|
| `registered` | Exists in registry; not yet ingesting |
| `calibrating` | Initial advisory window; events flagged calibrating |
| `active` | Full participation |
| `degraded` | Operating sub-spec; events flagged |
| `suspended` | No ingestion; in-flight handled |
| `retired` | End-of-life; historical only |

---

## 14. Operational state names

Enum: `operational_state`

(Already enumerated in `ACCENTOS_OPERATIONAL_STATE_MODEL.md`; canonicalized here.)

| Symbol | Description |
|---|---|
| `normal` | Default |
| `focus` | Operator pinned to a subject |
| `urgent` | Owned queue contains a red |
| `escalated` | Tier ownership of an open escalation |
| `blocked` | Active subject has unmet dependency |
| `read_only` | Session lacks write authority for view |
| `mobile_quick_mode` | Mobile session; verb-first |
| `executive_review` | Exec session on CC |
| `ai_assist` | AI inbox surfaced |

---

## 15. AI suggestion lifecycle states

Enum: `ai_suggestion_state`

| Symbol | Description |
|---|---|
| `proposed` | Internal; below presentation threshold |
| `presented` | Visible to owner |
| `accepted` | Human approved |
| `auto_applied` | Policy-gated automatic application |
| `applied` | Change in effect after accept |
| `verified` | Outcome confirmed positive |
| `reverted` | Application rolled back |
| `rejected` | Human rejected with reason |
| `deferred` | Snoozed with wake condition |
| `expired` | TTL hit without action |
| `superseded` | Replaced by a newer suggestion |
| `escalated` | Auto-applied with downstream red; surfaced to ai-policy-owner |

---

## 16. Reversibility classes

Enum: `reversibility_class`

| Symbol | Description |
|---|---|
| `reversible_easy` | Single typed inverse action available |
| `reversible_with_cost` | Inverse exists but operationally costly |
| `irreversible` | No inverse; risk acceptance required to act |
| `irreversible_with_customer_visibility` | External party already saw the result |

---

## 17. AI policy classes

Enum: `ai_policy_class`

| Symbol | Description |
|---|---|
| `human_required` | Always requires human accept |
| `human_default_with_auto_fallback` | Default human; conservative auto for declared sub-cases |
| `auto_with_post_hoc_review` | Auto by default; human reviews after |

---

## 18. Tier-skip reasons

Enum: `escalation_tier_skip_reason`

| Symbol | Description |
|---|---|
| `tier_owner_unavailable` | OOO without acting-lead |
| `tier_owner_overloaded` | At cap; routing paused |
| `tier_owner_recusal` | Tier owner has conflict; recused |
| `severity_jump` | Severity warrants higher tier directly |
| `bounce_protection` | Re-red within window post-reassignment |

---

## 19. Subject types

Enum: `subject_type`

(Already cited across docs; canonicalized.)

`lead | opportunity | quote | spec | job | po | inventory | service_ticket | escalation | handoff | suggestion | session | adapter | registry | runtime`

---

## 20. Emitter classes

Enum: `emitter_class`

| Symbol | Description |
|---|---|
| `human_actor` | Authenticated person |
| `system` | Runtime engine or scheduled check |
| `ai` | Registered AI capability |
| `adapter` | Bounded translator |

---

## 21. Severity bypass classes (quiet hours)

Enum: `quiet_hour_bypass_class`

| Symbol | Description |
|---|---|
| `none` | Standard quiet hours apply |
| `sev_1_only` | Only severity-1 may break |
| `sev_2_with_red_short_sla` | Sev-2 may break only when subject is R and SLA < 2 hr |

---

## 22. Notification channels

Enum: `notification_channel`

| Symbol | Description |
|---|---|
| `push` | Mobile / desktop push |
| `email` | Operator email |
| `sms` | Fallback for severity-1 if push fails |
| `in_app` | Visible only when shell open |
| `digest` | Aggregated periodic digest (briefs, EOD) |

---

## 23. Stage codes (illustrative; per-domain)

Per-domain stage enums exist for each subject type's state machine (sales opportunity stages, design spec phases, build job phases, PO phases). These are not centralized here; each domain owns its stage enum within its event-type registry section. Cross-domain queries should use stage codes namespaced (`sales.opportunity.stage.proposed`, etc.).

---

## 24. Evolution rules (recap)

- **Additive only.** Members added freely; never removed in place.
- **Deprecation arc** per `ACCENTOS_REGISTRY_ARTIFACTS.md` § 5: deprecate → coexist → end-of-life → archive.
- **Single canonical location.** This doc. References elsewhere cite by enum name + symbol.
- **No string literals in code** for enum values — implementation reads from a typed constants module sourced from this doc.
- **Schema drift detection** via runtime self-check that flags emissions of unregistered enum values.

---

## 25. Coverage check

Every enum gap surfaced in:

- `EVENT_TYPE_REGISTRY_V0.md` § 14 (six gaps).
- Contradiction audit C20 (snooze wake), C21 (adapter degradation).
- `COMMAND_REGISTRY_V0.md` (universal `submission_kind` from C11).
- Override reason codes referenced across `POLICY_DEFAULTS_V0.md` § 2 and `ACCENTOS_REGISTRY_ARTIFACTS.md`.
- `command.rejected.business_rule.reason_ref`.
- Adapter lifecycle / class enums.
- AI suggestion lifecycle / policy / reversibility.
- Notification channel enum.

…is enumerated.

Remaining content gaps (deferred):

- Per-domain stage enums (each domain's responsibility; not blocking).
- Free-text "other"/"unknown" handling within rejection / parse-fail flows — convention is the enum carries an `other` symbol with required note field; documented per command's parameter spec.
