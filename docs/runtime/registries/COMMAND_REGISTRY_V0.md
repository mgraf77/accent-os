# AccentOS — Command Registry v0

**Mode:** Architecture / specification (no implementation)
**Anchors:** command vocabulary, event-type registry v0
**Purpose:** Enumerate every v0 command. Implementation populates the runtime artifact from this spec.

**Per-entry shape (compact):**
`command_name | domain | emitter | authority | required | optional | validation | success-events | rejection-events | rollback | mobile`

- All commands carry: `command_id`, `submitted_by`, `subject_ref` (where applicable), `client_intent`, `correlation_id?`, `submitted_at`, `session_state`.
- Default rejections (always possible): `command.rejected.malformed`, `command.rejected.no_authority`, `command.rejected.idempotency_conflict`, `command.rejected.stale_view`, `command.rejected.registry_frozen`, `command.duplicate_ignored`.
- Rejection-events listed below are *additional* type-specific rejections.
- "Mobile" — `Y` if surface includes mobile quick-action; `N` desktop-only.

---

## 1. Sales domain

| name | emitter | authority | required | optional | validation | success | rejection (extra) | rollback | mobile |
|---|---|---|---|---|---|---|---|---|---|
| sales.lead.claim | sales-rep | pool member | — | — | unclaimed; on-shift recommended | sales.lead.claimed (+ assigned if rule) | precondition_failed (already claimed) | reassign | Y |
| sales.lead.assign | sales-lead | lead authority | assignee_id | reason | role match; capacity | sales.lead.assigned | precondition_failed; no_authority | reassign | N |
| sales.lead.send_first_response | sales-rep | owner | content_ref | scheduled_at | content non-empty; channel valid | customer.message.sent + outbound directive | business_rule (channel down) | n/a | Y |
| sales.lead.schedule_visit | sales-rep | owner | window | location | calendar conflict check | sales.opportunity.stage_changed | business_rule | reschedule | Y |
| sales.lead.qualify | sales-rep | owner | qualification_data | scope, budget, timeline | required fields present | sales.lead.qualified | business_rule | revert via re-qualify | Y |
| sales.lead.disqualify | sales-rep | owner | reason_code | note | reason_code in enum | sales.lead.disqualified | — | reopen as new lead | Y |
| sales.opportunity.send_follow_up | sales-rep | owner | content_ref | channel | quote not yet declined | customer.message.sent | business_rule | n/a | Y |
| sales.opportunity.advance_stage | sales-rep | owner | to_stage | note | from_stage→to_stage allowed | sales.opportunity.stage_changed | precondition_failed | revert (typed) | Y |
| sales.opportunity.mark_won | sales-rep | owner | deposit_status | signed_doc_ref | deposit captured (or pending allowed by policy) | sales.opportunity.won + handoff readiness recompute | business_rule | reopen | Y |
| sales.opportunity.mark_lost | sales-rep | owner | reason_code | competitor | reason_code in enum | sales.opportunity.lost | — | reopen as new lead | Y |

---

## 2. Design domain

| name | emitter | authority | required | optional | validation | success | rejection | rollback | mobile |
|---|---|---|---|---|---|---|---|---|---|
| design.brief.acknowledge | designer | owner | — | — | handoff exists | handoff.acknowledged | precondition_failed | n/a | N |
| design.selection.propose | designer | owner | selection_ref | options_pdf_ref | spec exists; not locked | design.selection.proposed | precondition_failed | revise | N |
| design.selection.lock | designer | owner | bom_ref, install_window | special_instructions | readiness predicate | design.selection.locked | readiness_failed | unlock | N |
| design.selection.unlock | designer / pm | owner / lead | reason_code | — | spec locked | design.selection.unlocked | no_authority | re-lock | N |
| design.selection.substitute | designer | owner | from_sku, to_sku | reason | spec not yet built | design.change_order.opened | business_rule | revert | Y |
| design.change_order.open | any (typed) | owner / lead | delta, requested_by | impact_estimate | spec exists | design.change_order.opened | — | close | N |
| design.change_order.sign | customer (proxied) / pm | owner | signature_ref | — | open change order exists | design.change_order.signed | precondition_failed | reopen | N |

---

## 3. Build domain

| name | emitter | authority | required | optional | validation | success | rejection | rollback | mobile |
|---|---|---|---|---|---|---|---|---|---|
| build.job.schedule | pm | owner | install_window, crew_assigned | site_notes | crew availability | build.job.scheduled | business_rule | reschedule | N |
| build.readiness.mark_ready | pm | owner | — | site_contact | predicates met | build.readiness.checked (green) | precondition_failed | n/a | Y |
| build.blocker.report | crew / pm | crew/pm | blocker_type, severity | photos_ref | job in-flight | build.blocker.reported | — | clear blocker | Y |
| build.blocker.clear | pm | owner | resolution_note | — | blocker exists | build.blocker.cleared | precondition_failed | reopen | Y |
| build.daily_report.submit | crew-lead | crew-lead | hours, percent_complete | photos, blockers, plan | active job | build.daily_report.submitted | — | n/a | Y |
| build.punch_item.add | crew | crew/owner | item_text | photos_ref | job in punch state | build.punch_item.added | precondition_failed | clear | Y |
| build.punch_item.clear | crew / pm | owner | item_ref, resolution | — | item open | build.punch_item.cleared | — | reopen | Y |
| build.job.sign_off | customer (proxied) / pm | owner | signature_ref, completion_date | — | punch list closed (or customer-acknowledged open) | build.job.signed_off | business_rule | reopen | Y |

---

## 4. Procurement domain

| name | emitter | authority | required | optional | validation | success | rejection | rollback | mobile |
|---|---|---|---|---|---|---|---|---|---|
| procurement.po.draft | system / pm | owner | sku_lines, vendor_ref, need_by | budget_cap | spec locked | procurement.po.drafted | precondition_failed | discard draft | N |
| procurement.po.send | pm | owner | po_ref, sent_via | confirmation_ref | drafted state | procurement.po.sent | precondition_failed | recall (typed) | N |
| procurement.po.confirm | pm / adapter | owner | po_ref | vendor_note | sent state | procurement.po.confirmed | — | n/a | N |
| procurement.po.set_eta | pm / adapter | owner / adapter | eta | source_ref | po confirmed | procurement.po.eta_set | — | replace via eta_slipped | N |
| procurement.po.chase | pm | owner | po_ref | template_ref | sent ≥ N hr without confirm OR slip | customer.message.sent (vendor-directed) | business_rule | n/a | Y |
| procurement.po.request_expedite | pm | owner | po_ref, reason | — | confirmed; ETA threatens install | customer.message.sent (vendor-directed) | business_rule | n/a | Y |
| procurement.po.receive | warehouse | warehouse-on-shift | po_ref, items_received | discrepancies | shipped or partial | procurement.po.received (or partial) | precondition_failed | n/a | Y |
| procurement.po.report_damage | warehouse | warehouse | po_ref, damage_items, photos_ref | severity | received-or-receiving | procurement.po.damage_reported | — | clear (typed) | Y |
| procurement.invoice.match | system | system | invoice_ref | — | po received | procurement.invoice.matched | — | mismatch event | N |

---

## 5. Quote domain

| name | emitter | authority | required | optional | validation | success | rejection | rollback | mobile |
|---|---|---|---|---|---|---|---|---|---|
| quote.request | sales / designer | owner | for_opportunity | rush_flag | opportunity exists | quote.requested | — | n/a | Y |
| quote.draft | designer / system | owner | bom_ref, total | margin_pct | requested state | quote.drafted | business_rule | revise | N |
| quote.send | sales | owner | quote_ref, channel | cover_note_ref | drafted; margin floor met or override | quote.sent + outbound | business_rule (margin floor) | recall | Y |
| quote.revise | sales / designer | owner | quote_ref, delta | reason | sent or drafted; not accepted | quote.revised | precondition_failed | re-revise | Y |
| quote.expire | system | system | quote_ref | — | TTL hit | quote.expired | — | extend (typed) | N |
| quote.extend_ttl | sales-lead | lead | quote_ref, new_ttl, reason | — | not accepted | quote.expired (replaced) | no_authority | re-expire | Y |
| quote.mark_accepted | customer (proxied) / sales | owner | quote_ref, deposit_status | signed_doc_ref | sent state | quote.accepted + downstream fan-out | precondition_failed | reopen | Y |
| quote.mark_declined | customer (proxied) / sales | owner | quote_ref, reason_code | — | sent state | quote.declined | — | reopen as new opportunity | Y |

---

## 6. Inventory domain

| name | emitter | authority | required | optional | validation | success | rejection | rollback | mobile |
|---|---|---|---|---|---|---|---|---|---|
| inventory.receive | warehouse | warehouse-on-shift | sku, qty, location, po_ref? | photos_ref | sku registered | inventory.received | — | reverse via damage / count | Y |
| inventory.putaway | warehouse | warehouse | sku, from_loc, to_loc | — | sku exists | inventory.putaway | — | reverse | Y |
| inventory.reserve | system | system | sku, qty, for_subject | until | available ≥ qty | inventory.reserved | business_rule (insufficient) | release | N |
| inventory.release | system | system | sku, qty, from_subject | reason | reservation exists | inventory.released | — | re-reserve | N |
| inventory.cycle_count.complete | warehouse | warehouse | bin_ref, found_qty | discrepancy | requested or routine | inventory.cycle_count.completed | — | recount | Y |
| inventory.report_damage | warehouse / crew | warehouse / crew | sku, qty, photos_ref | — | sku exists | inventory.damage_reported | — | clear (typed) | Y |

---

## 7. Customer / service domain

| name | emitter | authority | required | optional | validation | success | rejection | rollback | mobile |
|---|---|---|---|---|---|---|---|---|---|
| service.ticket.open | customer (proxied) / rep | rep / system | severity, channel, summary | photos_ref | severity in enum | service.ticket.opened | — | resolve as duplicate | Y |
| service.ticket.assign | service-lead / system | service-lead | assignee_id | — | role match | service.ticket.assigned | no_authority | reassign | N |
| service.ticket.resolve | owner | owner | resolution_code, note | — | open state | service.ticket.resolved | precondition_failed | reopen | Y |
| service.ticket.mark_severity_1 | service-lead / owner | service-lead / owner | reason | — | open ticket | service.ticket.opened (severity update via correction) + escalation.opened | no_authority | demote (typed) | Y |
| customer.satisfaction.capture | system / adapter | system | score | comments_ref | post-signoff window | customer.satisfaction.captured | — | n/a | N |

---

## 8. Orchestration domain (handoffs, escalations, overrides)

| name | emitter | authority | required | optional | validation | success | rejection | rollback | mobile |
|---|---|---|---|---|---|---|---|---|---|
| orchestration.handoff.open | sender | owner | type, subject_ref, packet_ref | receiver_hint | readiness predicate; receiver resolves | handoff.opened | readiness_failed; no_receiver | reopen | N |
| orchestration.handoff.open_with_override | sender lead | lead | type, subject_ref, packet_ref, override_reason | unmet_predicates | lead authority | handoff.opened_with_override | no_authority | reopen | N |
| orchestration.handoff.acknowledge | receiver | owner (post-resolve) | handoff_ref | — | open state | handoff.acknowledged | precondition_failed | n/a | Y |
| orchestration.handoff.complete | receiver | owner | handoff_ref | downstream_event_refs | acked state | handoff.completed | precondition_failed | reopen | Y |
| orchestration.handoff.reopen | any | owner / lead | handoff_ref, delta, reason_code | — | completed or breached | handoff.reopened | — | re-complete | Y |
| orchestration.escalation.open | owner / lead | owner / lead | subject_ref, reason_code | trigger_event_ref | reason in enum | escalation.opened | — | resolve | Y |
| orchestration.escalation.acknowledge | tier_owner | tier_owner | escalation_ref | — | open + tier match | escalation.acknowledged | no_authority | n/a | Y |
| orchestration.escalation.take_over | tier_owner / above | tier authority | escalation_ref | reason | open state | subject.taken_over + escalation.acknowledged | no_authority | restore previous | Y |
| orchestration.escalation.resolve | tier_owner | tier_owner | escalation_ref, resolution_code, note | — | acked or open | escalation.resolved | no_authority | reopen via re-escalate | Y |
| orchestration.subject.pin | owner / lead | owner / lead | subject_ref, reason_code, ttl | note | within budget | subject.pinned | business_rule (budget) | unpin (TTL or explicit) | Y |
| orchestration.subject.snooze | owner | owner | subject_ref, wake_condition | reason | wake_condition valid | subject.snoozed | — | unsnooze (wake) | Y |
| orchestration.subject.suppress_red | ops + exec (two-key) | two-key | subject_ref, reason_code, expires_at, note | — | currently R; budget | priority.override.applied | business_rule (budget); no_authority | reinstate | N |
| orchestration.subject.reinstate_red | ops / exec | tier | subject_ref | — | suppression active | priority.override.expired | no_authority | re-suppress (typed) | N |
| orchestration.subject.reassign | lead+ | lead+ | subject_ref, to_owner, reason_code | — | new owner valid | subject.reassigned | no_authority | reassign back | N |
| orchestration.subject.take_over | lead+ | lead+ | subject_ref, reason_code | — | — | subject.taken_over | no_authority | restore previous | N |
| orchestration.subject.annotate | any read+ | read | subject_ref, note | — | non-empty | subject.annotated | — | n/a | Y |
| orchestration.delegation.set_oo | self / lead | self / lead | window, delegate_id | scope | delegate exists; lead has acting-lead | registry.coverage.* | business_rule (no acting lead) | clear OOO | N |
| orchestration.delegation.takeover | lead | lead | original_owner, new_owner | scope | OOO active | delegation.takeover | no_authority | restore | N |

---

## 9. AI domain (suggestion lifecycle)

| name | emitter | authority | required | optional | validation | success | rejection | rollback | mobile |
|---|---|---|---|---|---|---|---|---|---|
| ai.suggestion.accept | subject owner | owner | suggestion_ref | edits | presented state | ai.suggestion.accepted + ai.suggestion.applied + downstream business event | precondition_failed | revert | Y |
| ai.suggestion.reject | subject owner | owner | suggestion_ref, reason_code | note | presented state | ai.suggestion.rejected | — | n/a | Y |
| ai.suggestion.defer | subject owner | owner | suggestion_ref, wake_condition | — | presented state | ai.suggestion.deferred | — | wake (auto) | Y |
| ai.suggestion.verify | owner / system | owner / system | suggestion_ref, outcome | — | applied or auto-applied | ai.suggestion.verified | — | n/a | Y |
| ai.suggestion.revert | owner / lead | owner / lead | suggestion_ref, reason_code | — | applied or auto-applied; within revert window | ai.suggestion.reverted + compensating events | business_rule (window expired) | re-apply (typed new suggestion) | Y |
| ai.policy.suspend_type | ai-policy-owner | ai-policy-owner | capability_id, reason | — | active capability | ai.policy.suspended | no_authority | resume | N |
| ai.policy.resume_type | ai-policy-owner + ops (two-key) | two-key | capability_id | — | suspended state | ai.policy.resumed | no_authority | re-suspend | N |
| ai.policy.recalibrate | ai-policy-owner | ai-policy-owner | capability_id | window | calibration data available | ai.calibration.recomputed | — | n/a | N |

---

## 10. Executive / session domain

| name | emitter | authority | required | optional | validation | success | rejection | rollback | mobile |
|---|---|---|---|---|---|---|---|---|---|
| executive.brief.acknowledge | exec | exec | brief_ref | — | brief presented | executive.brief.acknowledged | precondition_failed | n/a | Y |
| executive.eod.acknowledge | exec | exec | digest_ref | — | digest presented | executive.eod.acknowledged | — | n/a | Y |
| session.declare_state | shell | self | new_state, triggers | — | composition rules satisfied | session.state.changed | business_rule (forbidden self-clear) | revert state | Y |
| session.refresh | shell | self | — | — | — | (no event; advisory) | — | n/a | Y |

---

## 11. Registry domain (governance commands)

Each follows the same shape — required: `change_diff`, `reason`; two-key where the registry artifact spec mandates; success: `registry.<name>.*` event; rejection: `no_authority`, `registry_frozen`, `business_rule`.

- `registry.event_type.add` (single-key for additive)
- `registry.event_type.deprecate` (single-key)
- `registry.event_type.end_of_life` (single-key, post-sunset)
- `registry.role.add | update | retire` (lead-chain or tier change → two-key)
- `registry.priority.weight.update` (single-key, surfaced)
- `registry.priority.threshold.update` (two-key)
- `registry.sla.update` (single-key; drift-tolerance two-key)
- `registry.ai_policy.update` (loosen → two-key; tighten → single)
- `registry.reversibility.update` (two-key; stricter reclassification single)
- `registry.coverage.set | clear` (self/lead single-key)
- `registry.quiet_hours.update` (single-key; severity-bypass two-key)
- `registry.escalation.update` (tier ownership two-key; window single)
- `registry.command_authority.update` (loosen two-key; tighten single)
- `registry.freeze | unfreeze` (single-key by ops with reason)

---

## 12. Idempotency strategy

- All commands keyed by `command_id`.
- Mobile commands queued offline carry the original `command_id` on replay.
- Replay-induced duplicates → `command.duplicate_ignored` with reference to original outcome.
- New intent over old `command_id` → `command.rejected.idempotency_conflict`.

---

## 13. Mobile constraints applied

- All `mobile=Y` rows: ≤2-tap completion guarantee.
- Customer-visible commands (e.g. `quote.send`, `customer.message.sent` chain producers, `procurement.po.send`) require explicit confirm step on mobile even if 2-tap.
- `orchestration.subject.suppress_red` and other two-key commands are **mobile=N** (cannot be initiated from mobile).
- Offline mobile commands accept queue-and-replay; replays are subject to `command.rejected.precondition_failed` if subject moved on (typed event surfaced on next sync).

---

## 14. Shell-v2 implications

- Every quick-action verb in CC and role-CC tile catalog must map to exactly one command above.
- Shell renders rejections as first-class feedback (subject timeline + inline at submission).
- Shell carries `client_intent` with originating surface (CC tile id, mobile quick-tile id, AI suggestion accept).
- Shell never invents commands not in this registry.
- Shell never bypasses authority by surface.

---

## 15. Coverage check

- Every quick action listed in command vocabulary § 9 is enumerated.
- Every workflow handoff, escalation verb, and override action from the workflow docs is enumerated.
- Every AI suggestion lifecycle transition has a corresponding command (or is system-only).

Gaps surfaced:

1. The full `customer (proxied)` mechanic (commands that act on behalf of a customer signing) needs an explicit proxy-authority section in the auth boundary brief.
2. Reason-code enums per rejection class are not yet defined; deferred to policy defaults.
3. `quote.send` margin floor override path is implicit — a `quote.send_with_margin_override` two-key variant may be required (deferred to ops policy).
