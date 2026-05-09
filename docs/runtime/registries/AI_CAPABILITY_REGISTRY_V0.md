# AccentOS — AI Capability Registry v0

**Mode:** Architecture / specification (no implementation)
**Anchors:** AI suggestion model, integration adapter contract, registry artifacts
**Purpose:** Inventory every AI capability referenced across docs. Implementation populates the runtime artifact from this spec.

**Per-entry fields:**
- `capability_id` — `ai.<class>.<purpose>` naming.
- `description` — what the capability does, operationally.
- `input_source` — which event types or adapter feeds drive it.
- `output_object` — typed suggestion class (drafting / parsing / routing / anomaly / action / outbound message).
- `policy_class` — `human-required | human-default-with-auto-fallback | auto-with-post-hoc-review`.
- `reversibility_class` — `irreversible | reversible-easy | reversible-with-cost | irreversible-with-customer-visibility`.
- `customer_visible` — boolean.
- `auto_apply_eligible` — derives from `(policy_class, reversibility_class, customer_visible)`.
- `calibration_cadence` — recompute frequency (illustrative; specific value in policy defaults).
- `induced_red_ceiling` — auto-suspend trigger.
- `human_review_requirement` — what the human must see.
- `auditability` — what's recorded.
- `revert_behavior` — how revert composes downstream.

---

## 1. Routing class

### 1.1 ai.route.lead_assign

- **Description:** auto-assign new lead to a rep using territory/load/continuity rules.
- **Input source:** `sales.lead.created`, role registry, coverage registry, load metrics.
- **Output:** routing suggestion (`auto-apply` candidate).
- **Policy class:** auto-with-post-hoc-review.
- **Reversibility:** reversible-easy (reassignment is a typed verb).
- **Customer visible:** no.
- **Auto-apply eligible:** yes.
- **Calibration:** weekly.
- **Induced-red ceiling:** moderate (auto-suspend if assignments cause overload-detected events at ceiling rate).
- **Human review:** sales-lead sees "auto-assigned by AI" attribution; can reassign.
- **Auditability:** rule_winner + AI confidence on `sales.lead.assigned`.
- **Revert:** reassignment command.

### 1.2 ai.route.designer_assign

- Same shape as 1.1 but for design-pool.
- **Reversibility:** reversible-easy.
- **Auto-apply eligible:** yes.

### 1.3 ai.route.crew_capacity_match

- **Description:** suggest crew assignment for installs based on skill/territory/availability.
- **Policy class:** human-default-with-auto-fallback.
- **Reversibility:** reversible-easy (pre-install).
- **Customer visible:** no.
- **Auto-apply eligible:** no by default (PM judgment matters).
- **Human review:** PM accepts/rejects the suggestion.

### 1.4 ai.route.service_assign

- **Description:** assign service ticket to service owner (sev 2/3 only; sev-1 always service-lead).
- **Policy class:** auto-with-post-hoc-review for sev 2/3.
- **Reversibility:** reversible-easy.
- **Customer visible:** no (assignment is internal).
- **Auto-apply eligible:** yes (sev 2/3 only).

### 1.5 ai.route.po_receiver

- **Description:** auto-resolve who receives a PO (continuity vs vendor-pm).
- **Policy class:** auto-with-post-hoc-review.
- **Reversibility:** reversible-easy.
- **Auto-apply eligible:** yes.

---

## 2. Drafting class

### 2.1 ai.draft.first_response

- **Description:** draft first-response message to a new lead.
- **Input source:** lead context + customer history.
- **Output:** drafted text; suggestion lifecycle.
- **Policy class:** human-required.
- **Reversibility:** reversible-easy (draft is not sent).
- **Customer visible:** no until human sends.
- **Auto-apply eligible:** no.
- **Human review:** rep edits/sends; rejection captured.
- **Auditability:** source pointers (which events/messages informed the draft).

### 2.2 ai.draft.follow_up

- **Description:** drafted follow-up tailored to last touchpoint.
- **Policy class:** human-required.
- **Auto-apply eligible:** no.

### 2.3 ai.draft.handoff_packet

- **Description:** generate handoff packet from sales notes + call transcripts + quote line items.
- **Policy class:** human-default-with-auto-fallback.
- **Reversibility:** reversible-easy (pre-handoff-open).
- **Customer visible:** no (internal).
- **Auto-apply eligible:** yes for low-complexity handoffs; human-default otherwise.
- **Human review:** designer/PM acks packet quality on first ack.

### 2.4 ai.draft.vendor_chase

- **Description:** drafted chase email for unresponsive vendors.
- **Policy class:** human-required.
- **Reversibility:** reversible-easy.
- **Customer visible:** no (vendor channel; treat as analogous gating because external).
- **Auto-apply eligible:** no.

### 2.5 ai.draft.review_request

- **Description:** drafted satisfaction/review/referral message post-install.
- **Policy class:** human-required.
- **Customer visible:** yes — never auto-apply.
- **Reversibility:** irreversible-with-customer-visibility once sent.

### 2.6 ai.draft.exec_brief

- **Description:** morning brief / EOD digest content drafting.
- **Input source:** event window since last brief/digest.
- **Output:** structured brief content for `executive.brief.generated`.
- **Policy class:** auto-with-post-hoc-review (the brief is presented; exec acks).
- **Reversibility:** reversible-easy (exec can override / annotate).
- **Customer visible:** no.
- **Auto-apply eligible:** yes (auto-generated; exec ack closes the loop).
- **Calibration:** weekly review of "is the brief useful?" feedback signal.

### 2.7 ai.draft.eod_digest

- Same shape as 2.6 for EOD.

---

## 3. Parsing class

### 3.1 ai.parse.vendor_eta

- **Description:** parse vendor email/SMS for ETA, ship confirmation, damage notice.
- **Input source:** inbound parser adapter.
- **Output:** typed `procurement.po.eta_set | eta_slipped | shipped | damage_reported` (via suggestion → command path) OR `adapter.parse_ambiguous` if low confidence.
- **Policy class:** auto-with-post-hoc-review (high confidence) → falls to suggestion (medium) → ambiguity event (low).
- **Reversibility:** reversible-easy (correction event supersedes).
- **Customer visible:** no.
- **Auto-apply eligible:** yes above threshold.
- **Calibration:** weekly; ambiguity rate is an operational ceiling.
- **Induced-red ceiling:** strict (a wrong ETA can blow an install).

### 3.2 ai.parse.customer_message_intent

- **Description:** parse inbound customer message to typed intent (question, complaint, payment, schedule).
- **Policy class:** human-default-with-auto-fallback (intent posts as advisory; routing happens automatically; reply is human).
- **Reversibility:** reversible-easy.
- **Customer visible:** no for parsing; reply is separately customer-visible per draft class.
- **Auto-apply eligible:** for routing only, not reply.

### 3.3 ai.parse.invoice_match

- **Description:** parse vendor invoice and three-way match against PO + packing.
- **Policy class:** auto-with-post-hoc-review (clean matches), human-required (mismatch).
- **Reversibility:** reversible-easy.
- **Customer visible:** no.
- **Auto-apply eligible:** yes for clean matches.

### 3.4 ai.parse.field_voice_note

- **Description:** voice note → structured fields (measurements, punch items, blockers).
- **Policy class:** human-default-with-auto-fallback (operator confirms in <30s).
- **Reversibility:** reversible-easy.
- **Auto-apply eligible:** no — confirmation is the UX.

### 3.5 ai.parse.photo_damage

- **Description:** photo at receive → damage flag.
- **Policy class:** human-default-with-auto-fallback (advisory flag; warehouse confirms).
- **Reversibility:** reversible-easy.
- **Customer visible:** no.

---

## 4. Anomaly class (signals only — informational)

### 4.1 ai.anomaly.stock_drift

- **Description:** detect unexplained stock movement.
- **Output:** `inventory.stock_risk_detected` candidate or warning suggestion.
- **Policy class:** human-required (informational; PM acts).
- **Reversibility:** n/a (signals don't apply state).
- **Auto-apply eligible:** no.

### 4.2 ai.anomaly.margin_outlier

- **Description:** flag quote margin below floor or unusual.
- **Output:** `quote.margin_flagged` candidate.
- **Policy class:** auto-with-post-hoc-review (the flag emits; sales-lead reviews).
- **Reversibility:** reversible-easy (override path exists).
- **Customer visible:** no.

### 4.3 ai.anomaly.stalled_stage

- **Description:** detect `sales.opportunity.stalled` based on activity windows.
- **Policy class:** auto-with-post-hoc-review.
- **Reversibility:** clears on activity.

### 4.4 ai.anomaly.vendor_reliability_slip

- **Description:** flag vendor reliability score drop.
- **Policy class:** human-required (informs routing weights via registry change).

### 4.5 ai.anomaly.escalation_pattern

- **Description:** weekly cluster detection of recurring escalations.
- **Policy class:** human-required (ops review).

### 4.6 ai.anomaly.ai_rejection_hotspot

- **Description:** detect AI suggestion types with rejection rate above ceiling.
- **Policy class:** auto-with-post-hoc-review (auto-suspends type).
- **Reversibility:** policy resume two-key.

---

## 5. Action class (operational mutations)

### 5.1 ai.action.auto_reserve_inventory

- **Description:** on `quote.accepted`, auto-reserve inventory for spec'd in-stock SKUs.
- **Policy class:** auto-with-post-hoc-review.
- **Reversibility:** reversible-easy (release).
- **Customer visible:** no.
- **Auto-apply eligible:** yes.

### 5.2 ai.action.auto_draft_po_for_non_stock

- **Description:** on `quote.accepted`, draft POs for non-stock SKUs (PM confirms send).
- **Policy class:** human-default-with-auto-fallback (drafts auto; send is human).
- **Reversibility:** reversible-easy (discard draft).
- **Auto-apply eligible:** drafting yes; sending no.

### 5.3 ai.action.recompute_lead_time

- **Description:** when vendor ETA changes, recompute lead-time impact across affected jobs.
- **Policy class:** auto-with-post-hoc-review.
- **Reversibility:** reversible-easy (typed correction).
- **Auto-apply eligible:** yes.

### 5.4 ai.action.suggest_in_stock_swap

- **Description:** when chosen item lead time threatens install, suggest closest in-stock match.
- **Policy class:** human-required (designer accepts; affects spec).
- **Reversibility:** reversible-easy pre-build.

### 5.5 ai.action.pre_install_readiness_check

- **Description:** 48 hr pre-install: materials × site × crew × customer confirmation.
- **Policy class:** auto-with-post-hoc-review.
- **Output:** `build.readiness.checked` event.
- **Reversibility:** n/a (informational; PM acts on red).
- **Auto-apply eligible:** yes (the check itself).

### 5.6 ai.action.cadence_engine_post_install

- **Description:** schedule + send cadence at 24 hr / 7 day / 30 day / 1 yr.
- **Policy class:** human-required (every customer-visible send).
- **Customer visible:** yes — never auto-send.
- **Reversibility:** irreversible-with-customer-visibility once sent.
- **Auto-apply eligible:** scheduling yes; sending no.

### 5.7 ai.action.escalation_packet_draft

- **Description:** draft the escalation packet (summary, attempts made, suggested action).
- **Policy class:** auto-with-post-hoc-review (escalator acks packet).
- **Reversibility:** reversible-easy.

---

## 6. Outbound message class (customer-visible — special category)

All outbound message capabilities share:

- **Policy class:** human-required (no exceptions).
- **Customer visible:** yes.
- **Reversibility:** irreversible-with-customer-visibility post-send.
- **Auto-apply eligible:** never.
- **Human review:** full preview + recipient + send confirm.
- **Auditability:** outbound_id; delivery confirmation; original draft + edits.

Capabilities: `ai.outbound.first_response_send`, `ai.outbound.follow_up_send`, `ai.outbound.review_request_send`, `ai.outbound.satisfaction_send`. (These are "sender" wrappers around the corresponding draft capability + outbound adapter.)

**Architectural note:** outbound senders are defined here as AI-adjacent capabilities; the actual send is gated by command authority + outbound adapter, not by AI policy alone. AI's role is the draft + presentation; the *send* is human-issued by command.

---

## 7. Search / summarization class

### 7.1 ai.search.cross_reference

- **Description:** "Where did we use this SKU?", "Which jobs use vendor X?", "Recent customers in zip Y?".
- **Policy class:** human-required (read-only).
- **Reversibility:** n/a (read-only).
- **Auto-apply eligible:** n/a.
- **Auditability:** query log (with role; PII access logged).

### 7.2 ai.summarize.subject_history

- **Description:** condense subject timeline into a brief.
- **Policy class:** human-required (advisory).
- **Reversibility:** n/a.

### 7.3 ai.summarize.handoff_packet

- Covered under drafting class (2.3).

### 7.4 ai.summarize.daily_report_draft

- **Description:** auto-draft crew daily report from photos + scheduled scope; crew confirms.
- **Policy class:** human-default-with-auto-fallback.
- **Reversibility:** reversible-easy.

### 7.5 ai.summarize.escalation_explainer

- **Description:** "Why is this red?" — top contributing factors ranked.
- **Policy class:** auto-with-post-hoc-review (explanation is informational).
- **Reversibility:** n/a.

---

## 8. Cross-cutting capability rules

1. **Customer-visible auto-apply is categorically prohibited.** No registry edit can override this without a constitutional registry change (two-key + audit).
2. **AI never sets priority.** AI may change inputs (e.g. set vendor reliability via anomaly) and the priority engine recomputes.
3. **AI never owns subjects.** Owner derives from subject; ai-policy-owner does not appear in subject-ownership chains.
4. **Every capability has a registry entry.** Capabilities active without entries are rejected at suggestion creation.
5. **Calibration is mandatory.** Capabilities marked uncalibrated route their outputs as suggestions, not auto-applies, regardless of confidence.
6. **Induced-red ceiling per capability**, registry-bound; auto-suspension is automatic and event-driven.

---

## 9. Auto-apply eligibility summary

| Capability | Auto-apply? |
|---|---|
| ai.route.lead_assign | ✓ |
| ai.route.designer_assign | ✓ |
| ai.route.crew_capacity_match | — |
| ai.route.service_assign (sev 2/3) | ✓ |
| ai.route.po_receiver | ✓ |
| ai.draft.first_response | — |
| ai.draft.follow_up | — |
| ai.draft.handoff_packet | ✓ (low complexity) |
| ai.draft.vendor_chase | — |
| ai.draft.review_request | — (customer-visible) |
| ai.draft.exec_brief | ✓ |
| ai.draft.eod_digest | ✓ |
| ai.parse.vendor_eta | ✓ (above threshold) |
| ai.parse.customer_message_intent (route) | ✓ |
| ai.parse.invoice_match (clean) | ✓ |
| ai.parse.field_voice_note | — |
| ai.parse.photo_damage | — |
| ai.anomaly.* (mostly) | ✓ as flags only |
| ai.action.auto_reserve_inventory | ✓ |
| ai.action.auto_draft_po_for_non_stock (draft) | ✓ |
| ai.action.recompute_lead_time | ✓ |
| ai.action.suggest_in_stock_swap | — |
| ai.action.pre_install_readiness_check | ✓ |
| ai.action.cadence_engine (schedule only) | ✓ |
| ai.action.escalation_packet_draft | ✓ |
| ai.outbound.* | — |
| ai.search.* | n/a |
| ai.summarize.* | mixed |

---

## 10. Anti-patterns

- New capability registered with `customer_visible=yes` and `auto_apply_eligible=yes` — must be rejected at registration.
- Capability without reversibility entry — refused at suggestion creation.
- Auto-suspension followed by single-key resume — must be two-key.
- Capability that takes subject ownership.
- Capability that sets priority directly.
- Capability that emits to subject timeline outside the suggestion lifecycle.

---

## 11. Coverage check

Every AI capability referenced across workflow + runtime docs is enumerated. Capabilities that are conceptually mentioned but not yet productized are listed for completeness (they will not auto-apply until calibrated).

Gaps surfaced:

1. Confidence calibration baseline data does not exist yet — every capability ships with `calibrating: true` in its first window and treats outputs as advisory.
2. The exact `calibration_cadence` per capability is policy (defaults doc).
3. `ai.outbound.*` wrappers may be implemented as composite capabilities or as outbound adapter responsibilities — the boundary is registry-clarified at implementation kickoff.
