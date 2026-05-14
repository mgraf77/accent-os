# SIGNAL_TO_ACTION_FRAMEWORK.md
> Signal → recommended action → automation/AI assist — v1
> Closes the loop opened by OPERATIONAL_SIGNAL_TAXONOMY.md

## Principle

A signal without an action is a metric in disguise. AccentOS commits to the rule:

> Every signal that fires must include a concrete recommended action *and* a clear position on whether AccentOS can automate, AI-assist, or only escalate it.

This document maps the taxonomy to action posture. It is the contract between *detection* and *response*.

## Action posture levels

| Posture | Meaning | Human role |
|---|---|---|
| **MANUAL** | AccentOS shows; human does. | Decide and execute |
| **PREPARED** | AccentOS drafts the action; human approves and submits. | Review and approve |
| **AI-ASSIST** | AccentOS proposes with reasoning; human can accept, edit, or reject. | Evaluate proposal |
| **AUTO-PROVISIONAL** | AccentOS executes, but human can undo within a window. | Audit afterwards |
| **AUTO-IRREVERSIBLE** | AccentOS executes silently. (Reserved for narrow, deterministic, low-stakes cases.) | None |

**Default posture for any new signal is MANUAL.** Posture escalates only after the rule has fired cleanly for ≥ 60 days.

## Posture by signal category

### Inventory

| Signal | Action | Default posture | Automation opportunity |
|---|---|---|---|
| `inv.stockout_active` | Expedite PO or substitute | PREPARED | Draft expedite request to vendor; human approves |
| `inv.stockout_imminent` | Issue PO | PREPARED | Auto-generate PO at recommended qty; require approval |
| `inv.dead_stock_aging` | Markdown / liquidate | AI-ASSIST | Propose markdown % from elasticity model |
| `inv.overstock_velocity_drop` | Pause replenishment | AUTO-PROVISIONAL | Flag SKU as no-buy for 30d; reversible |
| `inv.location_imbalance` | Branch transfer | PREPARED | Draft transfer order; human approves qty |
| `inv.cycle_count_variance` | Investigate | MANUAL | Surface comparison view |
| `inv.negative_on_hand` | Reconcile | MANUAL | Lock SKU from oversell; surface reconciliation tool |

### Purchasing

| Signal | Action | Default posture | Automation opportunity |
|---|---|---|---|
| `po.late_acknowledgment` | Nudge vendor | PREPARED | Draft email; human approves |
| `po.late_delivery` | Contact vendor | MANUAL | Surface contact + history |
| `po.receiving_variance` | Investigate | MANUAL | Surface line-level diff |
| `po.price_variance_at_receipt` | Reject or accept variance | PREPARED | Draft credit request |
| `po.partial_shipment_chronic` | Vendor review | MANUAL | Surface scorecard |
| `po.open_po_aging` | Close or follow up | AUTO-PROVISIONAL | Auto-close after 90d + 2 follow-ups, reversible |

### Vendor health

| Signal | Action | Default posture |
|---|---|---|
| `vendor.score_deteriorating` | Vendor review meeting | MANUAL |
| `vendor.fill_rate_decline` | Diversify or confront | AI-ASSIST (propose alt vendors) |
| `vendor.lead_time_drift` | Update planning lead time | PREPARED (suggest new value) |
| `vendor.freight_creep` | Renegotiate freight terms | MANUAL |
| `vendor.single_source_risk` | Identify alternates | AI-ASSIST (propose alt vendors) |
| `vendor.unresponsive` | Escalate vendor contact | PREPARED (draft escalation) |

### Ecommerce

| Signal | Action | Default posture |
|---|---|---|
| `ecom.conversion_drop` | Diagnose | AI-ASSIST (correlation with site/catalog/marketing changes) |
| `ecom.checkout_error_spike` | Page sysops + ecommerce | MANUAL |
| `ecom.cart_abandon_spike` | Investigate funnel | MANUAL |
| `ecom.zero_sessions` | Page sysops | MANUAL |
| `ecom.product_404` | Republish or unpublish | AUTO-PROVISIONAL (unpublish + alert) |
| `ecom.search_zero_results` | Add synonyms / fix catalog | AI-ASSIST (propose synonym additions) |
| `ecom.high_traffic_low_conv_sku` | Improve PDP | AI-ASSIST (propose copy/image improvements) |

### Customer activity

| Signal | Action | Default posture |
|---|---|---|
| `cust.dormant_high_value` | Outreach | AI-ASSIST (draft outreach) |
| `cust.reorder_due` | Proactive contact | PREPARED |
| `cust.spend_drop` | Account review | MANUAL |
| `cust.new_high_value` | Welcome + assign rep | AUTO-PROVISIONAL |
| `cust.churn_risk` | Retention play | AI-ASSIST |

### Pricing

| Signal | Action | Default posture |
|---|---|---|
| `price.below_floor` | Block order or override | AUTO-PROVISIONAL (block, await override) |
| `price.cost_increase_unpassed` | Update sell price | AI-ASSIST (propose new price) |
| `price.map_violation` | Adjust to MAP | AUTO-PROVISIONAL (set to MAP, alert) |
| `price.no_price` | Set price | MANUAL |
| `price.discount_drift` | Discipline review | MANUAL |

### Quote workflow

| Signal | Action | Default posture |
|---|---|---|
| `quote.stale_open` | Follow up or close | PREPARED (draft follow-up) |
| `quote.velocity_slowing` | Process review | MANUAL |
| `quote.win_rate_drop` | Coaching / pricing review | MANUAL |
| `quote.high_value_pending` | Sales mgr review | MANUAL |
| `quote.followup_overdue` | Follow up | PREPARED |

### Operational friction

| Signal | Action | Default posture |
|---|---|---|
| `friction.manual_override_spike` | Root-cause | MANUAL |
| `friction.retry_loop` | Pause job, investigate | AUTO-PROVISIONAL (pause + alert) |
| `friction.exception_queue_aging` | Triage | MANUAL |
| `friction.duplicate_record_creation` | Merge | PREPARED (propose merge) |

### Employee activity

All EMP signals default to MANUAL. These are **observational, not enforcement**. No automation by design — they exist so owners can ask better questions, not to flag individuals.

### Marketing

| Signal | Action | Default posture |
|---|---|---|
| `mkt.flow_paused` | Restart or remove | MANUAL |
| `mkt.unsub_spike` | Audit recent send | AI-ASSIST |
| `mkt.deliverability_drop` | DNS / reputation check | MANUAL |
| `mkt.campaign_underperform` | Iterate | AI-ASSIST (propose subject/segment tweaks) |
| `mkt.list_growth_stall` | Acquisition review | MANUAL |

### Runtime / system health

| Signal | Action | Default posture |
|---|---|---|
| `sys.export_missed` | Retry + investigate | AUTO-PROVISIONAL (retry 3×, then alert) |
| `sys.cache_stale` | Refresh + investigate | AUTO-PROVISIONAL |
| `sys.integration_down` | Page sysops | MANUAL |
| `sys.job_failure_spike` | Page sysops | MANUAL |
| `sys.disk_or_quota` | Capacity action | MANUAL |
| `sys.cloudflare_error_spike` | Investigate worker | MANUAL |

### Margin / profitability

| Signal | Action | Default posture |
|---|---|---|
| `margin.gross_margin_drop` | Diagnose | AI-ASSIST (decompose GM change by cause) |
| `margin.freight_outpacing_revenue` | Cost action | MANUAL |
| `margin.high_volume_low_margin_sku` | Repricing / sourcing review | AI-ASSIST |
| `margin.return_rate_eroding_margin` | Product / supplier review | MANUAL |

### Fulfillment / logistics

| Signal | Action | Default posture |
|---|---|---|
| `ship.backorder_increasing` | Expedite or substitute | PREPARED |
| `ship.fulfillment_sla_breach` | Prioritize pick | AUTO-PROVISIONAL (auto-prioritize in pick queue) |
| `ship.carrier_delay_pattern` | Reroute or renegotiate | MANUAL |
| `ship.pick_error_spike` | Floor review | MANUAL |
| `ship.shipment_exception` | Customer outreach | PREPARED |

## Escalation thresholds

For each signal that escalates, the threshold is **time-since-ack**, not time-since-fire:

| Initial severity | Escalates after | To |
|---|---|---|
| WARN | 7 days unack | role owner |
| ELEV | 24h unack | role owner |
| CRIT | 2h unack | owner |
| EMRG | 15m unack | owner + next-in-line |

Escalation is itself a signal (`signal.escalated`) — never a duplicate of the original.

## AI-assist opportunities

The signals best suited for AI assistance share traits: **structured context exists**, **stakes are bounded**, **human review is the deliverable**.

Highest leverage AI-assist targets (Phase 2+):

1. `cust.dormant_high_value` → outreach draft from order history
2. `ecom.conversion_drop` → correlation diagnosis (what changed in the last N days?)
3. `vendor.single_source_risk` → alternate vendor proposals from catalog
4. `margin.gross_margin_drop` → GM bridge analysis (price/mix/cost/freight contribution)
5. `inv.dead_stock_aging` → markdown proposal with projected sell-through
6. `quote.stale_open` → context-aware follow-up draft

AI proposals **must** show their reasoning. No black-box recommendations in operational tooling.

## Automation guardrails

Before any signal advances to AUTO-PROVISIONAL or higher:

1. The rule has fired ≥ 60 days at the lower posture
2. Acknowledgement rate of recommended action ≥ 80%
3. False-positive rate ≤ 5%
4. Reversal mechanism is implemented and tested
5. Audit log captures every auto-action
6. Owner sign-off recorded

AUTO-IRREVERSIBLE is reserved for: `ecom.product_404 → unpublish`, `price.below_floor → block order at checkout`, `friction.retry_loop → pause job`. Nothing else, without an explicit policy decision.

## The action loop

For every signal, the loop is:

```
fire → notify owner → recommended action shown → human/AI acts →
outcome recorded → signal resolves OR persists →
weekly review of unresolved + dismissed
```

The weekly review is what turns the framework from "alerts" into "operational discipline."

## Phase 1 action scope

Phase 1 implements **action affordance** for only the Phase 1 signals (see clean-pause):

- Recommended action text rendered on every signal card
- Manual ack/dismiss + resolution capture
- PREPARED posture for 2 signals (`inv.stockout_imminent` → draft PO; `quote.stale_open` → draft follow-up)
- AUTO-PROVISIONAL for 2 signals (`sys.export_missed` → retry; `ecom.product_404` → unpublish)
- AI-ASSIST: none in Phase 1. Earn it.

Everything else is MANUAL until evidence justifies advancement.
