# AccentOS — Role Registry v0

**Mode:** Architecture / specification (no implementation)
**Anchors:** role & receiver model, command vocabulary, registry artifacts
**Purpose:** Initial role registry. Implementation populates from this spec.

**Per-entry fields:**
- `role` — canonical name.
- `description` — operational, not HR.
- `lead_role` — escalation tier-1 reference.
- `escalation_tier` — position in the chain.
- `default_authorities` — verb classes the role may issue.
- `default_queues_owned` — what they own / claim from.
- `default_operational_state` — initial primary state on session start.
- `mobile_default` — primary surface.
- `read_only_scopes` — what they read but cannot write.
- `override_rights` — which override commands they may issue.
- `delegation_rules` — OOO + named delegate posture.
- `coverage_required` — strict coverage rule (lead roles).
- `anti_patterns` — what this role must never become.

---

## 1. sales-rep

- **description:** field/showroom seller; owns leads and opportunities through win.
- **lead_role:** sales-lead.
- **escalation_tier:** tier-1.
- **default_authorities:** sales lead/opportunity/quote subject mutations within own ownership; pool-claim on sales-pool; first-response, follow-up, schedule visit, qualify/disqualify, mark won/lost.
- **default_queues_owned:** my leads, my opportunities, my quotes (where assigned).
- **default_operational_state:** Normal; auto Mobile Quick Mode on mobile session.
- **mobile_default:** mobile-primary in field; desktop in showroom.
- **read_only_scopes:** peer reps' deals (summary); job/PO state of own won deals (read after handoff to PM).
- **override_rights:** subject.pin (own subjects, bounded TTL); subject.snooze (own); subject.annotate.
- **delegation_rules:** OOO with named rep delegate (within sales-lead's pool); existing subjects do not auto-transfer; new pool intake routes to delegate.
- **coverage_required:** no.
- **anti_patterns:** rep claiming all leads in pool to hoard; rep keeping ownership through build phase; rep editing PO/job details directly.

---

## 2. sales-lead

- **description:** owns sales-pool, rep load balance, sales escalations.
- **lead_role:** ops.
- **escalation_tier:** tier-2.
- **default_authorities:** sales-rep authorities + assign, reassign, take_over within sales branch; quote.extend_ttl; first-tier sales escalation acknowledge/resolve.
- **default_queues_owned:** sales-pool, rep-load tile, sales escalations.
- **default_operational_state:** Normal; promotes to Urgent/Escalated on triggers.
- **mobile_default:** desktop-primary; mobile-supported.
- **read_only_scopes:** design pool (summary).
- **override_rights:** subject.pin/snooze on sales subjects; bounded budget for handoff readiness-bypass with reason.
- **delegation_rules:** must always have an acting-lead during OOO.
- **coverage_required:** **yes**.
- **anti_patterns:** sales-lead acting as personal sales-rep (claim leads); blanket suppression of stalled flags.

---

## 3. designer

- **description:** owns selections and specs.
- **lead_role:** design-lead.
- **escalation_tier:** tier-1.
- **default_authorities:** spec lifecycle commands; selection propose/lock/unlock/substitute; change-order open; design-side handoff acknowledge/complete.
- **default_queues_owned:** my specs, design briefs assigned.
- **default_operational_state:** Normal; Focus on active spec.
- **mobile_default:** desktop-primary.
- **read_only_scopes:** PO state for spec'd items; inventory state for spec'd SKUs; sales notes attached to brief.
- **override_rights:** subject.pin/snooze (own); subject.annotate.
- **delegation_rules:** OOO with named designer delegate; existing specs do not auto-transfer.
- **coverage_required:** no.
- **anti_patterns:** designer locking spec without lead-time confirmation; designer editing PO directly.

---

## 4. design-lead

- **description:** owns design-pool, designer load, design escalations.
- **lead_role:** ops.
- **escalation_tier:** tier-2.
- **default_authorities:** designer authorities + assign/reassign/take-over within design branch; design-side escalation tier-2.
- **default_queues_owned:** design-pool, designer load, design escalations.
- **default_operational_state:** Normal.
- **mobile_default:** desktop.
- **read_only_scopes:** sales pipeline (summary), build schedule.
- **override_rights:** subject.pin/snooze on design subjects; bounded readiness-bypass.
- **coverage_required:** **yes**.
- **anti_patterns:** design-lead spec-locking on behalf of designer to hit a date.

---

## 5. pm

- **description:** project manager; owns jobs, POs, change orders, install schedule for portfolio.
- **lead_role:** ops.
- **escalation_tier:** tier-1 (some flows tier-2 vis-à-vis crew/warehouse).
- **default_authorities:** job lifecycle, PO lifecycle, change order coordination, build readiness, punch coordination, sign-off, vendor chase/expedite, inventory reserve via system.
- **default_queues_owned:** my jobs, my POs, today's installs (for portfolio).
- **default_operational_state:** Normal; portfolio not shift-based.
- **mobile_default:** mobile + desktop both first-class.
- **read_only_scopes:** sales notes for own jobs; designer spec history; inventory state.
- **override_rights:** subject.pin/snooze; bounded readiness-bypass; service severity adjustments are not pm authority.
- **delegation_rules:** OOO with named pm delegate; existing jobs handed off explicitly.
- **coverage_required:** no (but recommended for high-load portfolios).
- **anti_patterns:** pm taking over crew duties; pm bypassing handoff readiness routinely.

---

## 6. crew-lead

- **description:** crew foreman; owns daily reports, blockers, and on-site execution.
- **lead_role:** pm.
- **escalation_tier:** tier-1.
- **default_authorities:** mark site ready, blocker report/clear, daily report submit, punch add/clear, sign-off (with PM), warehouse stage acknowledge.
- **default_queues_owned:** today's installs (for own crew), this week.
- **default_operational_state:** Mobile Quick Mode default; Urgent on blocker.
- **mobile_default:** mobile-primary.
- **read_only_scopes:** spec, BoM, install plan; punch history.
- **override_rights:** subject.annotate; pin own active job.
- **coverage_required:** no (but acting crew-lead on absence is required).
- **anti_patterns:** crew-lead modifying spec; crew-lead bypassing punch capture.

---

## 7. crew

- **description:** install execution, punch capture.
- **lead_role:** crew-lead.
- **escalation_tier:** none (escalates via crew-lead).
- **default_authorities:** punch add, blocker report, photo capture, voice notes.
- **default_queues_owned:** today's job (assigned).
- **default_operational_state:** Mobile Quick Mode.
- **mobile_default:** mobile-only.
- **read_only_scopes:** today's job spec + access notes.
- **override_rights:** subject.annotate.
- **coverage_required:** no.
- **anti_patterns:** crew editing PO; crew "fixing" punch on paper.

---

## 8. warehouse-staff

- **description:** receiving, putaway, picking, staging, loading. On-shift role.
- **lead_role:** warehouse-lead.
- **escalation_tier:** tier-1.
- **default_authorities:** inventory.receive, inventory.putaway, inventory.cycle_count.complete, inventory.report_damage, procurement.po.receive, procurement.po.report_damage; warehouse-side handoff complete (load).
- **default_queues_owned:** receive dock today (when on-shift), pick list, stage zones (assigned).
- **default_operational_state:** Mobile Quick Mode on shift.
- **mobile_default:** mobile-primary.
- **read_only_scopes:** PO ETAs, install schedule (today + tomorrow), spec for staged jobs.
- **override_rights:** subject.annotate.
- **coverage_required:** no (shift-coverage handled by warehouse-lead).
- **anti_patterns:** warehouse-staff "estimating" damage rather than reporting; bypassing damage report to receive cleanly.

---

## 9. warehouse-lead

- **description:** owns warehouse pool, stage zones, daily flow, shift coverage.
- **lead_role:** ops.
- **escalation_tier:** tier-2.
- **default_authorities:** warehouse-staff authorities + on-shift assignment, stage zone assignment, dock scheduling, warehouse-side escalation.
- **default_queues_owned:** today's inbound, pick coverage, stage zones, load deadlines.
- **default_operational_state:** Normal.
- **mobile_default:** mobile + desktop.
- **read_only_scopes:** install schedule full, PO landscape.
- **override_rights:** subject.pin/snooze on warehouse subjects; bounded readiness-bypass for staging.
- **coverage_required:** **yes**.
- **anti_patterns:** warehouse-lead suppressing damage reports to keep flow.

---

## 10. vendor-pm

- **description:** vendor relationship + PO chasing (often same person as pm in small orgs; explicit role for separation when org grows).
- **lead_role:** ops.
- **escalation_tier:** tier-1.
- **default_authorities:** procurement.po.* commands, vendor chase/expedite.
- **default_queues_owned:** open POs, awaiting confirmation, late, partial, vendor reliability.
- **default_operational_state:** Normal.
- **mobile_default:** mobile + desktop.
- **read_only_scopes:** install schedule, inventory state.
- **override_rights:** subject.pin/snooze on PO subjects.
- **coverage_required:** no.
- **anti_patterns:** vendor-pm hiding ETA slips to avoid escalations.

---

## 11. finance

- **description:** deposits, invoices, AR aging.
- **lead_role:** ops.
- **escalation_tier:** tier-1.
- **default_authorities:** invoice.match (system-paired), deposit confirmation, AR follow-up commands.
- **default_queues_owned:** AR aging, deposits today, milestones due.
- **default_operational_state:** Normal.
- **mobile_default:** desktop.
- **read_only_scopes:** vendor terms, opportunity values.
- **override_rights:** subject.pin/snooze on financial subjects.
- **coverage_required:** no (but acting cover encouraged).
- **anti_patterns:** finance editing job/PO outside reconcile flow.

---

## 12. service

- **description:** ticket owner.
- **lead_role:** service-lead.
- **escalation_tier:** tier-1.
- **default_authorities:** service.ticket.resolve, customer.message.sent, escalation acknowledge for service tier-1.
- **default_queues_owned:** my service tickets.
- **default_operational_state:** Normal; Urgent on sev-1.
- **mobile_default:** mobile + desktop.
- **read_only_scopes:** original job spec + install record + warranty registry.
- **override_rights:** subject.annotate.
- **coverage_required:** no.
- **anti_patterns:** service silently re-classifying severity downward.

---

## 13. service-lead

- **description:** owns service pool, severity routing, recovery cases.
- **lead_role:** ops.
- **escalation_tier:** tier-2.
- **default_authorities:** service authorities + assign/reassign/take-over, severity-1 mark, service tier-2 escalation.
- **default_queues_owned:** service queue, sev-1 board, recovery cases.
- **default_operational_state:** Normal.
- **mobile_default:** mobile + desktop.
- **coverage_required:** **yes**.
- **anti_patterns:** service-lead suppressing recurring tickets to mask quality issues.

---

## 14. ops

- **description:** tier-3 escalation; suppression authority; policy config (single-key) and two-key partner; orchestration health watch.
- **lead_role:** exec.
- **escalation_tier:** tier-3.
- **default_authorities:** all subject mutation by reassignment/take-over (typed); registry single-key edits; two-key partner for policy loosening; suppression two-key partner; readiness-bypass authority.
- **default_queues_owned:** Ops CC; orchestration health; coverage gaps; overload tile; suppressions today; pattern flags.
- **default_operational_state:** Executive Review (shared with exec) on CC sessions.
- **mobile_default:** mobile + desktop.
- **read_only_scopes:** customer PII (gated, logged); financials (read).
- **override_rights:** subject.pin/snooze; subject.suppress_red (two-key partner); reassign/take_over; readiness-bypass; registry edits per matrix.
- **coverage_required:** **yes**.
- **anti_patterns:** ops as god-mode admin; ops suppressing reds without reason codes; ops editing subjects directly without reassignment.

---

## 15. exec

- **description:** terminal escalation tier; strategic flags; CC primary user.
- **lead_role:** none.
- **escalation_tier:** tier-4.
- **default_authorities:** all read; ack/assign/escalate/snooze-with-reason on CC; two-key partner for high-blast-radius edits.
- **default_queues_owned:** CC; top-3 to look at; live escalation feed.
- **default_operational_state:** Executive Review.
- **mobile_default:** mobile + desktop.
- **read_only_scopes:** essentially none — exec reads everywhere; exec does not silently *edit* subjects (preserves trust + audit).
- **override_rights:** subject.suppress_red (two-key partner); pin (high TTL allowed but bounded).
- **coverage_required:** acting exec on absence (rare but required).
- **anti_patterns:** exec editing subjects directly outside exec-defined verbs; exec dismissing escalations without resolution code.

---

## 16. ai-policy-owner

- **description:** owns AI policy classes, auto-apply thresholds, calibration health, AI suggestion telemetry. Not in subject escalation chain.
- **lead_role:** ops.
- **escalation_tier:** AI-specific (auto-applied induced-red events route here).
- **default_authorities:** ai.policy.suspend_type (single-key), ai.policy.recalibrate (single-key), ai.policy.resume_type (two-key with ops), reversibility registry edits (two-key with ops; stricter single-key).
- **default_queues_owned:** AI suggestions awaiting verification (across types); rejection-rate hotspots; calibration drift.
- **default_operational_state:** Normal.
- **mobile_default:** desktop.
- **read_only_scopes:** all AI-touched subject timelines.
- **override_rights:** none on subjects (AI-policy-owner does not own subjects).
- **coverage_required:** **yes**.
- **anti_patterns:** ai-policy-owner taking subject ownership; ai-policy-owner unilaterally loosening policy.

---

## 17. Lead chain summary

```
crew → crew-lead → pm → ops → exec
sales-rep → sales-lead → ops → exec
designer → design-lead → ops → exec
warehouse-staff → warehouse-lead → ops → exec
service → service-lead → ops → exec
vendor-pm → ops → exec
finance → ops → exec
ai-auto-applied → ai-policy-owner → ops → exec
```

Every chain terminates at exec.

---

## 18. Coverage_required summary

Coverage (acting-lead while OOO) is **required** for: sales-lead, design-lead, warehouse-lead, service-lead, ops, exec, ai-policy-owner.

Non-lead roles have OOO + named delegate but acting-cover is not structurally enforced.

---

## 19. Default authority composition matrix

(Cross-cuts with command-authority registry — this is the role-side view; the command registry is the command-side view; both must agree.)

| verb class | sales-rep | sales-lead | designer | design-lead | pm | crew-lead | crew | warehouse-staff | warehouse-lead | vendor-pm | finance | service | service-lead | ops | exec | ai-policy-owner |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| subject mutation (own) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | limited | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | via reassign | via reassign | n/a |
| reassign / take-over | — | ✓ (sales) | — | ✓ (design) | — | — | — | — | ✓ (warehouse) | — | — | — | ✓ (service) | ✓ (all) | ✓ (all) | n/a |
| pin / snooze | own | sales | own | design | own | own | own | own | warehouse | po | finance | own | service | all | all | none |
| suppress_red | — | — | — | — | — | — | — | — | — | — | — | — | — | two-key with exec | two-key with ops | — |
| readiness-bypass | — | bounded | — | bounded | bounded | — | — | — | bounded | — | — | — | bounded | ✓ | ✓ | — |
| ai.policy.* | — | — | — | — | — | — | — | — | — | — | — | — | — | two-key partner | — | ✓ |
| registry edits | — | role-coverage | — | role-coverage | — | — | — | — | role-coverage | — | — | — | role-coverage | per matrix | two-key partner | ai-policy + reversibility |

---

## 20. Anti-patterns (cross-role)

- "Admin" role with unscoped authority (R20).
- AI as a role with subjects (covered by ai-policy-owner separation).
- Lead OOO without acting-lead.
- Coverage by Slack message instead of typed event.
- Round-robin assignment that ignores capacity.
- Pool-only ownership for handoff opening.
- Per-surface authority overrides.
