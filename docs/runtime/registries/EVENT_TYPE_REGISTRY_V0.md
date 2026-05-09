# AccentOS — Event Type Registry v0

**Mode:** Architecture / specification (no implementation)
**Anchors:** event/handoff schema, runtime contracts, command vocabulary, adapter contract
**Purpose:** First-cut machine-readable enumeration of every event the v0 runtime recognizes. Implementation team populates the actual registry artifact from this spec.

**Conventions:**
- `event_name` — past-tense fact, `<domain>.<entity>.<verb>`.
- **Subject type** — `lead | opportunity | quote | spec | job | po | inventory | service_ticket | escalation | handoff | suggestion | session | adapter | registry | runtime`.
- **Versioning** — all entries are additive-evolvable unless noted.
- **Idempotency key** — `event_id` unless content-keyed dedupe is noted.
- **Anti-entropy enforcement** — refers to rules R1–R20 from `ACCENTOS_ANTI_ENTROPY_RULES.md`.

Per-entry shape (compact form):
`name | category | emitter | subject | required | optional | versioning | idempotency | projection | notification | rollback | AE`

---

## 1. Sales domain

| name | emitter | subject | required | optional | projection | notification | rollback | AE |
|---|---|---|---|---|---|---|---|---|
| sales.lead.created | system / form / rep | lead | source, contact, captured_by | scope, budget_band, timeline, intent_score, referral_of | sales-pool, CC unclaimed-leads | quiet push to on-shift reps | n/a (typed disqualify) | R6, R11 |
| sales.lead.claimed | sales-rep | lead | claimed_at | from_pool | rep queue, sales-lead view | quiet | unclaim via reassignment | R6, R10 |
| sales.lead.assigned | sales-lead / system | lead | assignee_role, assignee_id, rule_winner | manual_reason | rep queue | push to assignee | reassign | R10 |
| sales.lead.qualified | sales-rep | lead | qualification_data | scope, budget, timeline | designer-pool eligibility | quiet | n/a (state) | R6 |
| sales.lead.disqualified | sales-rep | lead | reason_code | note | sales-lead view | quiet | reopen via new lead | R11 |
| sales.opportunity.stage_changed | sales-rep | opportunity | from_stage, to_stage | reason | pipeline tile | quiet | revert stage | R11 |
| sales.opportunity.stalled | system | opportunity | last_activity_at, age | last_activity_type | stalled-deals tile | digest | clears on activity | R11 |
| sales.opportunity.won | sales-rep | opportunity | deposit_status, scope_frozen | signed_doc_ref | handoff readiness | broad team | reopen via new opportunity | R6 |
| sales.opportunity.lost | sales-rep | opportunity | reason_code | competitor | sales-lead view | quiet | reopen as new lead | R11 |

---

## 2. Design domain

| name | emitter | subject | required | optional | AE |
|---|---|---|---|---|---|
| design.brief.received | system (handoff complete) | spec | handoff_ref | — | R1 |
| design.selection.proposed | designer | spec | selection_ref | options_pdf_ref | R11 |
| design.selection.locked | designer | spec | bom_ref, install_window | special_instructions | R1 |
| design.selection.unlocked | designer / pm | spec | reason_code | — | R11 |
| design.change_order.opened | any (typed) | spec | delta, requested_by | impact_estimate | R11 |
| design.change_order.signed | customer | spec | signature_ref | — | R11 |

---

## 3. Build domain

| name | emitter | subject | required | optional | AE |
|---|---|---|---|---|---|
| build.job.scheduled | pm | job | install_window, crew_assigned | site_notes | R6 |
| build.readiness.checked | system | job | result (green/yellow/red), unmet_predicates | — | R11 |
| build.blocker.reported | crew / pm | job | blocker_type, severity | photos_ref | R11 |
| build.blocker.cleared | pm | job | resolution_note | — | R11 |
| build.daily_report.submitted | crew-lead | job | hours, percent_complete | photos_ref, blockers, plan | R11 |
| build.punch_item.added | crew | job | item_text | photos_ref | R11 |
| build.punch_item.cleared | crew / pm | job | item_ref, resolution | — | R11 |
| build.job.signed_off | customer / pm | job | signature_ref, completion_date | — | R11 |

---

## 4. Procurement domain

| name | emitter | subject | required | optional | AE |
|---|---|---|---|---|---|
| procurement.po.drafted | system / pm | po | sku_lines, vendor_ref, need_by | budget_cap | R11 |
| procurement.po.sent | pm | po | sent_at, sent_via | confirmation_ref | R11 |
| procurement.po.confirmed | adapter / pm | po | confirmed_at | vendor_note | R11 |
| procurement.po.eta_set | adapter / pm | po | eta | source_ref, parser_confidence | R11 |
| procurement.po.eta_slipped | adapter / pm / system | po | old_eta, new_eta, reason_code | source_ref | R11 |
| procurement.po.shipped | adapter / pm | po | shipped_at | tracking_ref | R11 |
| procurement.po.received | warehouse | po | received_at, items_received | discrepancies | R6, R11 |
| procurement.po.received_partial | warehouse | po | received_items, missing_items | — | R11 |
| procurement.po.damage_reported | warehouse | po | damage_items, photos_ref | severity | R11 |
| procurement.invoice.matched | system | po | invoice_ref | — | R11 |
| procurement.invoice.mismatch | system | po | mismatch_fields | — | R11 |

---

## 5. Quote domain

| name | emitter | subject | required | optional | AE |
|---|---|---|---|---|---|
| quote.requested | sales / designer | quote | for_opportunity | rush_flag | R11 |
| quote.drafted | designer / system | quote | bom_ref, total | margin_pct | R11 |
| quote.margin_flagged | system | quote | margin_pct, floor | — | R11 |
| quote.sent | sales | quote | sent_at, channel | cover_note_ref | R11 |
| quote.viewed | adapter (sensor) | quote | viewed_at | source_ref | R11 |
| quote.revised | sales / designer | quote | revision_n, delta | reason | R11 |
| quote.expired | system | quote | expired_at | — | R11 |
| quote.accepted | customer / sales | quote | accepted_at, deposit_status | signed_doc_ref | R6 |
| quote.declined | customer / sales | quote | reason_code | — | R11 |

---

## 6. Inventory domain

| name | emitter | subject | required | optional | AE |
|---|---|---|---|---|---|
| inventory.received | warehouse | inventory | sku, qty, location | po_ref | R11 |
| inventory.putaway | warehouse | inventory | sku, from_loc, to_loc | — | R11 |
| inventory.reserved | system | inventory | sku, qty, for_subject | until | R6 |
| inventory.released | system | inventory | sku, qty, from_subject | reason | R11 |
| inventory.reorder_triggered | system | inventory | sku, current_qty, rop | velocity | R11 |
| inventory.stock_risk_detected | system | inventory | sku, dependent_subject, gap | install_date | R11 |
| inventory.cycle_count.requested | system / pm | inventory | bin_ref | reason | R11 |
| inventory.cycle_count.completed | warehouse | inventory | bin_ref, found_qty, expected_qty | discrepancy | R11 |
| inventory.damage_reported | warehouse / crew | inventory | sku, qty, photos_ref | — | R11 |

---

## 7. Customer / service domain

| name | emitter | subject | required | optional | AE |
|---|---|---|---|---|---|
| customer.message.received | adapter | opportunity / job | source_ref, channel, parsed_intent | parser_confidence | R11 |
| customer.message.sent | rep / system | opportunity / job | outbound_id, channel | content_ref | R11 |
| customer.satisfaction.captured | system / adapter | job | score, source | comments_ref | R11 |
| customer.review.received | adapter | job | platform, rating | content_ref | R11 |
| customer.referral.received | rep / adapter | lead | referrer_ref | — | R6 |
| service.ticket.opened | customer / rep | service_ticket | severity, channel, summary | photos_ref | R6 |
| service.ticket.assigned | service-lead / system | service_ticket | assignee_id, rule_winner | — | R10 |
| service.ticket.resolved | owner | service_ticket | resolution_code, note | — | R11 |

---

## 8. Orchestration domain (handoffs, escalations, priority, overrides)

| name | emitter | subject | required | optional | AE |
|---|---|---|---|---|---|
| handoff.opened | sender | handoff | type, subject_ref, receiver_id, packet_ref | readiness_evidence | R1, R10 |
| handoff.acknowledged | receiver | handoff | acked_at | — | R1 |
| handoff.breached | system | handoff | sla_value, breached_at | — | R1, R2 |
| handoff.completed | receiver | handoff | completed_at | downstream_event_refs | R1 |
| handoff.reopened | any | handoff | delta, reason_code | — | R1 |
| handoff.opened_with_override | sender lead | handoff | unmet_predicates, override_reason | — | R12 |
| handoff.blocked_no_receiver | system | handoff | type, subject_ref, attempted_rules | — | R10 |
| escalation.opened | system / human | escalation | tier, subject_ref, reason_code | trigger_event_ref | R2 |
| escalation.acknowledged | tier_owner | escalation | acked_at | — | R2 |
| escalation.tier_skipped | system | escalation | from_tier, to_tier, reason_code | — | R2, R16 |
| escalation.resolved | tier_owner | escalation | resolution_code, note | — | R2, R8 |
| escalation.merged_into | system | escalation | parent_escalation_ref | — | R2 |
| priority.recomputed | system | (subject) | from_band, to_band, top_factors | — | R3 |
| priority.override.applied | actor | (subject) | override_type (pin/snooze/suppress), reason_code, expires_at | note | R9, R15 |
| priority.override.expired | system | (subject) | override_ref | — | R15 |
| priority.override.reinstated | actor | (subject) | original_override_ref | — | R9 |
| subject.reassigned | actor | (subject) | from_owner, to_owner, reason_code | — | R6, R9 |
| subject.taken_over | actor | (subject) | from_owner, to_owner, reason_code | — | R6, R9 |
| subject.annotated | actor | (subject) | note | — | R11 |
| subject.pinned | actor | (subject) | reason_code, ttl | — | R9, R15 |
| subject.snoozed | actor | (subject) | wake_condition | reason | R9, R15 |
| role.overload_detected | system | (role) | role, threshold, current_load | — | R11 |
| role.overload_cleared | system | (role) | role | — | R11 |
| delegation.takeover | lead | (subject) | original_owner, new_owner, scope | — | R9 |

---

## 9. AI domain

| name | emitter | subject | required | optional | AE |
|---|---|---|---|---|---|
| ai.suggestion.created | ai (capability ref) | suggestion | subject_ref, action, rationale, confidence, reversibility_class, policy_class, evidence_refs | alternatives | R7, R13 |
| ai.suggestion.presented | system | suggestion | presented_to, surface | — | R13 |
| ai.suggestion.accepted | actor | suggestion | accepted_at | edits | R13 |
| ai.suggestion.rejected | actor | suggestion | reason_code | note | R13 |
| ai.suggestion.deferred | actor | suggestion | wake_condition | — | R13 |
| ai.suggestion.expired | system | suggestion | — | — | R13 |
| ai.suggestion.superseded_by | system | suggestion | superseding_suggestion_ref | — | R13 |
| ai.suggestion.applied | system | suggestion | resulting_event_refs | — | R7, R13 |
| ai.suggestion.auto_applied | system | suggestion | resulting_event_refs, policy_class | — | R7, R13 |
| ai.suggestion.verified | actor | suggestion | outcome | — | R13 |
| ai.suggestion.reverted | actor / system | suggestion | reason_code | compensating_event_refs | R7, R13 |
| ai.action.executed | system | (subject) | suggestion_ref, action | — | R7, R13 |
| ai.policy.suspended | system / ai-policy-owner | (capability) | reason (induced_red / rejection_rate / manual) | — | R7 |
| ai.policy.resumed | ai-policy-owner + ops | (capability) | two-key actors | — | R7 |
| ai.calibration.recomputed | system | (capability) | calibration_error | — | R13 |
| ai.calibration.lost | system | (capability) | reason | — | R13 |

---

## 10. Notification domain

| name | emitter | subject | required | optional | AE |
|---|---|---|---|---|---|
| notification.dispatched | notification engine | (subject) | triggering_event_ref, audience, channel, severity, quiet_hour_status | — | R14 |
| notification.delivered | adapter | (subject) | dispatch_ref | — | R14 |
| notification.failed | adapter | (subject) | dispatch_ref, reason | — | R14 |
| notification.retracted | system | (subject) | dispatch_ref, reason | — | R14 |
| notification.storm_detected | system | (role) | window, count | — | R14 |

---

## 11. Adapter / runtime / registry / session domain

| name | emitter | subject | required | optional | AE |
|---|---|---|---|---|---|
| adapter.registered | runtime | adapter | adapter_id, class, source_ref | calibration_window | R11 |
| adapter.calibrated | runtime | adapter | calibration_results | — | R11 |
| adapter.degraded | adapter / runtime | adapter | reason_code | metric_snapshot | R11 |
| adapter.recovered | adapter | adapter | — | — | R11 |
| adapter.suspended | runtime | adapter | reason_code | — | R11 |
| adapter.retired | runtime | adapter | end_of_life_date | — | R11 |
| adapter.parse_ambiguous | adapter | (subject) | source_ref, candidates, confidence | — | R11 |
| adapter.parse_drift | system | adapter | drift_signal | — | R11 |
| adapter.source_stale | system | adapter | last_intake_at, expected_cadence | — | R11 |
| adapter.source_recovered | adapter | adapter | — | — | R11 |
| adapter.dedupe_conflict | adapter | (subject) | colliding_refs | — | R11 |
| adapter.sync_conflict | adapter | (subject) | field, runtime_value, external_value | — | R11 |
| adapter.source_unauthenticated | adapter | adapter | source_ref | — | R11 |
| runtime.emission_failed | dispatcher | runtime | command_ref / event_ref, reason | — | R11 |
| runtime.audit.immutability_check | runtime | runtime | result, anomalies | — | R11 |
| runtime.audit.ordering_check | runtime | runtime | result, anomalies | — | R11 |
| runtime.schema.added | ops + runtime | registry | event_type | — | R11 |
| runtime.schema.deprecated | ops + runtime | registry | event_type, sunset_at | — | R11 |
| runtime.schema.end_of_life | runtime | registry | event_type | — | R11 |
| runtime.schema.unregistered_event | system | registry | offending_event_ref | — | R11 |
| projection.drift_detected | system | projection | projection_name, diff_summary | — | R11 |
| projection.rebuild_started | runtime | projection | from_marker | — | R11 |
| projection.rebuild_completed | runtime | projection | duration | — | R11 |
| projection.cutover | runtime | projection | from_version, to_version | — | R11 |
| registry.role.* | ops / lead | registry | change_type, diff | — | R9 |
| registry.priority.weight_changed | ops | registry | diff | — | R3, R9 |
| registry.priority.threshold_changed | two-key | registry | diff | — | R3, R9 |
| registry.sla.* | ops | registry | diff | — | R9 |
| registry.ai_policy.* | ai-policy-owner / two-key | registry | diff | two-key actors | R7, R9 |
| registry.coverage.* | role's lead | registry | diff | — | R6, R9 |
| registry.coverage.gap_detected | system | registry | role, missing | — | R6 |
| registry.command_authority.* | ops / two-key | registry | diff | — | R9, R20 |
| registry.frozen | ops | registry | registry_name, expires_at, reason | — | R9 |
| registry.unfrozen | ops | registry | registry_name | — | R9 |
| command.rejected.malformed | dispatcher | command | command_id, reason_detail | — | R11 |
| command.rejected.no_authority | dispatcher | command | command_id | — | R20 |
| command.rejected.precondition_failed | dispatcher | command | command_id, predicate | — | R11 |
| command.rejected.readiness_failed | dispatcher | command | command_id, unmet_predicates | — | R1 |
| command.rejected.business_rule | dispatcher | command | command_id, rule_ref | — | R11 |
| command.rejected.no_receiver | dispatcher | command | command_id, attempted_rules | — | R10 |
| command.rejected.idempotency_conflict | dispatcher | command | command_id | — | R11 |
| command.rejected.stale_view | dispatcher | command | command_id, observed_at | — | R11 |
| command.rejected.registry_frozen | dispatcher | command | command_id, registry_name | — | R9 |
| command.duplicate_ignored | dispatcher | command | command_id, original_outcome_ref | — | R11 |
| executive.brief.generated | system | session | period, source_event_window | — | R11 |
| executive.brief.acknowledged | exec | session | brief_ref | — | R11 |
| executive.eod.generated | system | session | period | — | R11 |
| session.state.changed | system | session | from_state, to_state, reason | — | R8 |
| session.stale_submission | dispatcher | session | session_ref | — | R11 |

---

## 12. Versioning posture

- Every entry is **additive** unless explicitly noted (no entries are noted as breaking — by policy, breaking changes spawn a *new* event type, never mutate an existing one).
- New optional payload fields may be added at any time without registry-event-version bump beyond the standard `runtime.schema.added` log entry.
- Removed fields: never removed in place; deprecated → end-of-life → archived per registry artifact spec § 5.

---

## 13. Idempotency posture

- Default: `event_id` keying.
- Adapter-emitted events additionally carry a content-derived dedupe key (parser content hash or source-message-id).
- AI suggestion events carry `inference_id` from the AI inference adapter (input-hash derived).
- Notification dispatch events carry `triggering_event_ref` enabling stale-suppression on replay.

---

## 14. Coverage check

- Every event mentioned in `ACCENTOS_EVENT_AND_HANDOFF_SCHEMA.md` § 1 is enumerated.
- Every command rejection class from `ACCENTOS_COMMAND_VOCABULARY.md` § 4 is enumerated.
- Every adapter lifecycle / failure event from `ACCENTOS_INTEGRATION_ADAPTER_CONTRACT.md` is enumerated.
- Every registry mutation event class from `ACCENTOS_REGISTRY_ARTIFACTS.md` is enumerated.
- Every runtime self-check event called out across docs is enumerated.

Gaps surfaced by this enumeration (passed to "remaining unresolved questions" downstream):

1. `customer.message.*` payload includes `parsed_intent` — the intent enum is not yet defined.
2. `service.ticket.opened` severity scale (1/2/3) referenced but not formally enumerated as a registry value.
3. `procurement.po.eta_slipped.reason_code` enum is referenced but not enumerated.
4. `escalation.resolved.resolution_code` and other resolution-code enums are referenced but not yet enumerated.
5. `adapter.degraded.reason_code` set partially enumerated in adapter contract; should be unified.
6. The exact set of `ai.suggestion.rejected.reason_code` values needs to be set by ai-policy-owner.

These are content gaps (enum values), not structural gaps. They belong in the policy-defaults registry alongside other enums.
