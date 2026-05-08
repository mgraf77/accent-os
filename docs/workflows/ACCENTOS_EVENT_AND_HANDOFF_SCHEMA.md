# AccentOS — Event & Handoff Schema

**Mode:** Workflow systems design (spoke session — no implementation)
**Anchors:** `ACCENTOS_OPERATIONAL_WORKFLOWS.md`
**Purpose:** Define the stable operational primitives — events, handoffs, ack rules, escalation — that future shell/runtime work anchors to. **No code, no APIs, no storage decisions.**

---

## 0. Design rules

1. **Events are facts**, past-tense, immutable: `lead.claimed`, `spec.locked`. Never `claim_lead`.
2. **Handoffs are typed events** with a contract: `ready` predicate, packet, receiver, ack, SLA.
3. **Every event carries a `priority_score`** computed at emission (see priority doc) — orchestrator never re-derives downstream.
4. **Every event has one `emitter` role**, one `subject` (the entity), and zero-or-more `receivers` (computed by routing).
5. **Receivers ack** — a handoff without ack is a broken handoff.
6. **Escalation is a typed event**, not a chat ping.
7. **Naming:** `<domain>.<entity>.<past-tense-verb>` — `sales.lead.claimed`, `vendor.po.eta_slipped`.
8. **Payload contracts are additive** — new optional fields OK, removing/renaming fields is a breaking change.

---

## 1. Canonical event vocabulary

Grouped by domain. Each row: `event_name` — emitter → receivers — purpose.

### 1.1 Sales domain

| Event | Emitter | Receivers | Purpose |
|---|---|---|---|
| `sales.lead.created` | system / form / rep | sales-pool, sales-lead | New lead enters pool |
| `sales.lead.claimed` | rep | sales-lead, exec (CC) | Rep takes ownership |
| `sales.lead.assigned` | sales-lead / system | rep | Auto/manual assignment |
| `sales.lead.qualified` | rep | designer-pool, sales-lead | Lead → opportunity |
| `sales.lead.disqualified` | rep | sales-lead | Out of pipeline |
| `sales.opportunity.stage_changed` | rep | watchers | Pipeline progression |
| `sales.opportunity.stalled` | system | rep, sales-lead | No activity > threshold |
| `sales.opportunity.won` | rep | designer, PM, finance, customer | Deposit captured |
| `sales.opportunity.lost` | rep | sales-lead | Closed-lost |

### 1.2 Design domain

| Event | Emitter | Receivers | Purpose |
|---|---|---|---|
| `design.brief.received` | sales | designer | Handoff received |
| `design.selection.proposed` | designer | customer, sales | Options out |
| `design.selection.locked` | designer | builder, procurement | Spec frozen |
| `design.selection.unlocked` | designer / PM | builder, procurement | Change order territory |
| `design.change_order.opened` | any | designer, PM, customer | Post-lock change |
| `design.change_order.signed` | customer | builder, procurement, finance | Change accepted |

### 1.3 Build domain

| Event | Emitter | Receivers | Purpose |
|---|---|---|---|
| `build.job.scheduled` | PM | crew, customer, warehouse | Install on calendar |
| `build.readiness.checked` | system | PM | Pre-install go/no-go |
| `build.blocker.reported` | crew / PM | PM, exec (if R) | Job blocked |
| `build.blocker.cleared` | PM | crew | Resume |
| `build.daily_report.submitted` | crew | PM, exec (CC) | EOD field state |
| `build.punch_item.added` | crew | PM, customer | Punch list grows |
| `build.punch_item.cleared` | crew | PM | Punch closed |
| `build.job.signed_off` | customer / PM | finance, sales (referral cadence) | Job complete |

### 1.4 Vendor / procurement domain

| Event | Emitter | Receivers | Purpose |
|---|---|---|---|
| `procurement.po.drafted` | system / PM | PM | PO ready for send |
| `procurement.po.sent` | PM | vendor, watchers | PO out |
| `procurement.po.confirmed` | vendor (parsed) / PM | PM, designer | Vendor ack'd |
| `procurement.po.eta_set` | vendor (parsed) / PM | PM, designer, builder | First ETA |
| `procurement.po.eta_slipped` | system / PM | PM, designer, builder, exec (if threatens install) | ETA changed |
| `procurement.po.shipped` | vendor / PM | warehouse | In transit |
| `procurement.po.received` | warehouse | PM, designer | Goods in |
| `procurement.po.received_partial` | warehouse | PM, designer | Partial receipt |
| `procurement.po.damage_reported` | warehouse | PM, vendor | Receive defect |
| `procurement.invoice.matched` | system | finance | 3-way match clean |
| `procurement.invoice.mismatch` | system | PM, finance | Needs reconcile |

### 1.5 Quote domain

| Event | Emitter | Receivers | Purpose |
|---|---|---|---|
| `quote.requested` | sales / designer | designer / pricing | Quote needed |
| `quote.drafted` | designer / system | sales | Ready for review |
| `quote.margin_flagged` | system | sales-lead | Below floor |
| `quote.sent` | sales | customer, watchers | Out the door |
| `quote.viewed` | system (tracking) | sales | Customer opened |
| `quote.revised` | sales / designer | customer | New version |
| `quote.expired` | system | sales | TTL hit |
| `quote.accepted` | customer / sales | designer, PM, finance, procurement | Becomes order |
| `quote.declined` | customer / sales | sales-lead | Closed-lost |

### 1.6 Inventory / warehouse domain

| Event | Emitter | Receivers | Purpose |
|---|---|---|---|
| `inventory.received` | warehouse | PM, designer | Stock added |
| `inventory.putaway` | warehouse | — | Internal location update |
| `inventory.reserved` | system (on quote.accepted) | designer, PM | Allocated to job |
| `inventory.released` | system (on quote.expired/declined) | designer | Freed |
| `inventory.reorder_triggered` | system | PM | Below ROP |
| `inventory.stock_risk_detected` | system | PM, designer, exec | Job within 14d under-covered |
| `inventory.cycle_count.requested` | system / PM | warehouse | Count this bin |
| `inventory.cycle_count.completed` | warehouse | PM | Count posted |
| `inventory.damage_reported` | warehouse / crew | PM | Defect found |

### 1.7 Customer / service domain

| Event | Emitter | Receivers | Purpose |
|---|---|---|---|
| `customer.message.received` | system (parsed) | owner | Inbound comm |
| `customer.message.sent` | rep / system | — | Outbound comm |
| `customer.satisfaction.captured` | system | sales-lead, exec | NPS / survey |
| `customer.review.received` | system | sales-lead, marketing | Public review |
| `customer.referral.received` | rep / system | sales-pool | New lead via referral |
| `service.ticket.opened` | customer / rep | service owner | Post-install issue |
| `service.ticket.assigned` | service-lead | owner | Routing |
| `service.ticket.resolved` | owner | customer, sales-lead | Closed |

### 1.8 Orchestration / cross-cutting

| Event | Emitter | Receivers | Purpose |
|---|---|---|---|
| `handoff.opened` | sender | receiver, exec (CC) | Typed handoff start |
| `handoff.acknowledged` | receiver | sender | Receiver took ownership |
| `handoff.breached` | system | sender, receiver-lead, exec | Ack SLA missed |
| `handoff.completed` | receiver | sender | Done downstream |
| `handoff.reopened` | any | original receiver | Rollback / rework |
| `priority.recomputed` | system | watchers (only on band change) | G/Y/R changed |
| `escalation.opened` | system / human | next-tier owner | Escalation engaged |
| `escalation.acknowledged` | escalator-tier | system | Tier owns it |
| `escalation.resolved` | escalator-tier | originator, exec | Closed with note |
| `ai.suggestion.created` | AI | owner-of-subject | New suggestion |
| `ai.suggestion.accepted` | human | AI feedback loop | Trust++ |
| `ai.suggestion.rejected` | human | AI feedback loop | Trust−− |
| `ai.suggestion.deferred` | human | — | Snooze |
| `ai.action.executed` | AI | watchers | Auto-action ran |

---

## 2. Per-event contract template

Every event conforms to this shape (conceptual; no code):

- **event_name** — see vocabulary.
- **emitter** — role or `system` or `ai`.
- **receivers** — computed by routing rules (role + scope + subject).
- **subject** — typed reference (`opportunity:O-1234`, `po:PO-9988`).
- **occurred_at** — wall-clock.
- **required payload** — minimum the system needs to be useful.
- **optional payload** — enrichment.
- **priority_score** — computed at emit, frozen on the event.
- **escalation_clock** — SLA that starts on emit (nullable).
- **dashboard implications** — which surfaces refresh / which lists move.
- **notification implications** — channel + audience + quiet rules.
- **mobile implications** — quick-action verbs unlocked.
- **ai-assist implications** — what AI is permitted to do off this event.

### 2.1 Worked examples

#### `sales.lead.created`

- **emitter:** `system` (form / phone / walk-in capture)
- **receivers:** `sales-pool`, `sales-lead`
- **required:** source, contact (name + one channel), zip-or-region, captured_by
- **optional:** scope, budget-band, timeline, intent-score, referral-of
- **priority behavior:** baseline + intent-signal boost; high if budget × proximity hit threshold.
- **escalation timing:** unclaimed > 1 business hr → `Y`; > 2 → `R` and emit `escalation.opened`.
- **dashboard:** appears in "Unclaimed leads" CC card and sales-pool list.
- **notification:** push to on-shift reps in territory; quiet hours respected.
- **mobile:** quick-action *Claim*.
- **AI-assist:** `[D]` first-response draft; `[A]` auto-assign rule; `[S]` quality score.

#### `procurement.po.eta_slipped`

- **emitter:** `system` (parser) or PM
- **receivers:** PM, designer, builder; exec only if slip threatens install date.
- **required:** po-id, old_eta, new_eta, reason (free-text or enum)
- **optional:** vendor-comment, partial-ship-info
- **priority:** high if `(new_eta - install_date)` < buffer; else medium.
- **escalation:** if PM doesn't ack within 4 business hrs and slip is `R`, escalate to ops.
- **dashboard:** "POs at risk" CC card; designer's stock-risk list refreshes.
- **notification:** instant to PM; designer/builder push if affects active job.
- **mobile:** *Chase vendor*, *Request expedite*, *Swap to in-stock alternative*.
- **AI-assist:** `[D]` chase email; `[S]` alternative-vendor suggestion; `[A]` recompute install readiness.

#### `quote.accepted`

- **emitter:** customer (via signed link) or rep
- **receivers:** designer, PM, finance, procurement, warehouse (reservation)
- **required:** quote-id, accepted_at, deposit-status
- **optional:** signed-doc-ref, customer-note
- **priority:** elevated until handoff packet generated and acked.
- **escalation:** no handoff opened within 24 hr → escalate to sales-lead.
- **dashboard:** moves opportunity to "won, awaiting handoff" until handoff acked.
- **notification:** customer confirmation; internal team digest.
- **mobile:** *Generate handoff packet*, *Assign PM*.
- **AI-assist:** `[A]` reserve inventory + draft POs for non-stock SKUs; `[D]` handoff packet.

(Other events follow the same template — kept compact above to avoid 500 lines of identical scaffolding.)

---

## 3. Workflow-state propagation

- Each subject (lead, quote, job, PO) carries a **state machine** with named states (e.g. opportunity: `new → qualified → proposed → won/lost`).
- State transitions are emitted as events; the event *is* the source of truth.
- Subscribers project local views; the orchestrator never queries — it listens.
- **Reopens** are first-class transitions, not back-edges, so audit trail stays linear.

---

## 4. Universal Handoff Contracts

Every handoff conforms to the same five-part contract:

1. **Readiness predicate** — computable check: "is sender allowed to hand off?"
2. **Packet shape** — fixed schema of context the receiver needs.
3. **Receiver assignment** — must resolve to one named owner before `handoff.opened` fires.
4. **Ack SLA** — receiver must emit `handoff.acknowledged` within N.
5. **Escalation + reopen rules** — what happens if SLA breached or downstream rework needed.

### 4.1 Sales → Design (won deal handoff)

- **Readiness:** deposit captured, scope frozen-enough (named rooms / categories), customer contact preferences set, sales notes attached.
- **Packet:** customer profile, signed quote, sales narrative summary `[D by AI]`, known constraints, target install window, key contacts.
- **Receiver:** assigned designer (auto if territory rule, else sales-lead picks).
- **Ack SLA:** 24 business hrs.
- **Escalation:** breach → sales-lead + design-lead; > 48 hr → exec.
- **Reopen:** designer can reopen on missing scope items → emits `handoff.reopened` with a delta list; sales clock restarts only on the missing items, not the whole packet.
- **Visibility:** CC tile "Won, awaiting design ack".

### 4.2 Design → Build (spec-locked handoff)

- **Readiness:** all selections locked, lead-times confirmed, install window set, change-order log empty or signed, site-readiness contact identified.
- **Packet:** locked spec, BoM, lead-time map, install plan draft, special instructions, customer access notes.
- **Receiver:** PM (and through PM, crew).
- **Ack SLA:** 48 business hrs.
- **Escalation:** breach → ops.
- **Reopen:** PM rejects if BoM unbuildable → designer must respond with revised packet; emits a typed reason code (out-of-stock, dimensional conflict, missing detail).
- **Visibility:** CC tile "Spec locked, awaiting PM ack".

### 4.3 Quote → Procurement

- **Readiness:** quote accepted, non-stock SKUs identified, vendor preferences resolved, payment terms set.
- **Packet:** SKU list with qty + need-by-date, preferred vendors, customer/job ref, budget cap.
- **Receiver:** procurement owner (often PM).
- **Ack SLA:** 8 business hrs (this is fast — install dates depend on it).
- **Escalation:** breach → ops + exec because this is the cash-to-install bridge.
- **Reopen:** vendor can't fulfill → emits `handoff.reopened` back to designer with sourcing problem.
- **Visibility:** CC tile "Procurement gap" + "$$ in flight".

### 4.4 Vendor → Warehouse (receive handoff)

- **Readiness:** PO confirmed shipped, ETA on file, receiving slot open.
- **Packet:** PO ref, expected SKUs + qty, packing-slip expected, special handling.
- **Receiver:** warehouse-on-shift.
- **Ack SLA:** receive-by-end-of-day-of-arrival.
- **Escalation:** missed dock → PM (could affect install).
- **Reopen:** damage / shortage → emits `procurement.po.damage_reported` and `handoff.reopened` to procurement.
- **Visibility:** Warehouse "Today's inbound" + CC stock-risk recompute.

### 4.5 Warehouse → Install (stage / load handoff)

- **Readiness:** all SKUs picked, staged in named zone, install date within 48 hr, loadout truck assigned.
- **Packet:** pick-completeness report, stage-zone, load order, anomalies (substitutions, partials).
- **Receiver:** crew lead.
- **Ack SLA:** day-of-load before truck departs.
- **Escalation:** missing SKU at load time → emits `build.blocker.reported` immediately to PM + exec.
- **Reopen:** install completes with returns → `inventory.received` (return) + handoff.reopened to warehouse.
- **Visibility:** Mobile-first crew tile + CC go/no-go for today's installs.

### 4.6 Install → Punch List (sign-off handoff)

- **Readiness:** install scope complete OR customer agrees to proceed with open items.
- **Packet:** punch items (typed), photos, customer ack, warranty registration.
- **Receiver:** PM (until cleared), then sales (referral cadence) and service (warranty).
- **Ack SLA:** 7 days for full clear; punch items aged > 14 days emit `Y`.
- **Escalation:** punch items aging > 30 days → service-lead + exec.
- **Reopen:** customer reopens via service ticket — typed event, not email.
- **Visibility:** CC "Open punch / aging" + per-job punch tile.

### 4.7 Anyone → Service (issue handoff)

- **Readiness:** issue captured with subject, channel, and severity.
- **Packet:** project link, install date, photo/text, severity, customer contact pref.
- **Receiver:** service-on-call → assigned owner within 4 hr.
- **Ack SLA:** first-response 24 hr; severity-1 = 4 hr.
- **Escalation:** breach → service-lead → exec.
- **Reopen:** customer-not-satisfied flag.
- **Visibility:** Service queue + CC red-list inclusion.

### 4.8 Escalation → Management (tiered)

- **Readiness:** any `R` urgency with no human action in tier window.
- **Packet:** auto-summary `[D]` of the underlying subject, attempts made, suggested action.
- **Receiver tiers:** owner → owner's lead → ops → exec.
- **Ack SLA per tier:** tightens as it climbs (e.g. 30 min / 15 min / 5 min during business hours).
- **Escalation of escalation:** if tier ack lapses, jump tier; never silently drop.
- **Reopen:** if resolved-then-recurs, re-emits with prior-context reference.
- **Visibility:** CC live escalation feed + weekly pattern review surface.

### 4.9 AI Suggestion → Human Review

- **Readiness:** AI confidence above publish threshold OR explicitly invited.
- **Packet:** suggestion subject, action proposed, rationale, confidence, reversibility flag, alternatives.
- **Receiver:** owner of subject (not AI's choice — derived from subject ownership).
- **Ack SLA:** suggestion-type-dependent; defaults to medium (e.g. 8 business hrs) before auto-deferring or auto-applying low-risk reversible items per policy.
- **Escalation:** if subject is `R` and suggestion ignored, surface to owner's lead.
- **Reopen:** rejected suggestion that re-becomes valid → re-emits with delta rationale, not a duplicate.
- **Visibility:** AI inbox per role + CC "AI suggestions awaiting" count.

### 4.10 Cross-cutting handoff invariants

- **No silent handoffs.** If a packet can't be generated, the handoff fails loudly.
- **No dangling handoffs.** Every `handoff.opened` ends in `acknowledged`, `breached+resolved`, or `reopened+closed`.
- **Receiver assignment before opening.** If no receiver resolvable, system blocks and notifies sender's lead.
- **Idempotent reopen.** Reopens carry a delta, not a full re-handoff.

---

## 5. Acknowledgement, SLA, and escalation rules

- **Ack is an act, not a read-receipt.** Receiver explicitly takes ownership.
- **SLA bands per handoff type** — defined in the contract, not invented per dashboard.
- **Quiet hours / business calendars** are first-class — SLAs pause, escalations don't fire at 2am unless severity-1.
- **Escalation tiers** are universal: owner → owner-lead → ops → exec. Each tier has its own ack window.
- **Escalation always emits `escalation.opened`**, never just a notification.
- **Resolution requires a typed reason** — "fixed", "won't fix", "duplicate", "wait-on-customer". Free text optional, code required.

---

## 6. Urgency propagation

- Priority is computed at emit (see priority doc).
- A `priority.recomputed` event fires only when band crosses (G↔Y↔R) — avoids notification storms.
- Subjects can subscribe to upstream-subject priority changes (e.g. job inherits PO red).
- Inheritance is **explicit and capped** — a job goes red because its critical-path PO is red; a job does not inherit red from a tangential PO.

---

## 7. What this schema deliberately omits

- Storage shape, transport, schema versioning mechanics.
- API surface.
- UI component decisions.
- Specific SLA numbers — the contracts above use illustrative defaults; real numbers belong in a config doc owned by ops, not architecture.
- Authentication/authorization model.

These are runtime decisions for the next phase.
