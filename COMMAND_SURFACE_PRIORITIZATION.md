# COMMAND_SURFACE_PRIORITIZATION.md
> How signals reach humans — v1
> Pair with SIGNAL_SEVERITY_MODEL.md and OPERATIONAL_SIGNAL_TAXONOMY.md

## Principle

A signal that nobody sees is worse than a signal that doesn't exist — because it consumed engineering effort. The command surface is therefore designed around **roles**, not screens. Each role gets exactly one canonical place to start their day.

## The eight surfaces

| Surface | Audience | Refresh | Purpose |
|---|---|---|---|
| Owner cockpit | owner | 30s | "Is the business OK right now?" |
| Purchasing view | purchasing | 1m | Vendor + PO + inventory posture |
| Sales view | sales | 1m | Quotes, customers, pipeline |
| Ecommerce view | ecommerce / marketing | 30s | Storefront, conversion, catalog health |
| Warehouse view | warehouse | 1m | Fulfillment, receiving, exceptions |
| Mobile operational feed | any role | push | The 1–3 things that need attention now |
| Alerts / escalations | recipient role | push/sms/email | CRIT/EMRG channel |
| Daily operational summary | per role | 7am local email | "What happened, what's drifting" |

Each surface is **a filtered view over the same `signals` table** — there is no separate data per surface. This is what keeps the architecture simple.

## Surface design rules

1. **One screen per role.** If a role needs to switch between four tabs to do their job, the framework failed.
2. **Top-of-screen is reserved for CRIT/EMRG and unresolved ELEV.** Nothing else lives above the fold.
3. **No charts above signals.** Charts are context, not action.
4. **Every signal card shows: signal_name, severity, entity, age, recommended action, ack/dismiss.**
5. **Ack and dismiss are different.** Ack = "I see it, I own it." Dismiss = "Not actionable." Both are audited.
6. **No infinite scroll.** Past 50 items, route to digest, not pagination.
7. **No real-time push to UI in Phase 1.** Polling 30s is fine and cheaper.

## Owner cockpit

The owner is the only role authorized to see *everything*. The cockpit is structured as:

```
┌─────────────────────────────────────────────────────────┐
│  EMRG / CRIT — anywhere in the business                 │
├─────────────────────────────────────────────────────────┤
│  Margin / profitability deltas (this week vs last)      │
├─────────────────────────────────────────────────────────┤
│  Top 5 ELEV signals across all roles                    │
├─────────────────────────────────────────────────────────┤
│  Drift watchlist (5 metrics, sparkline only)            │
├─────────────────────────────────────────────────────────┤
│  Signal volume + ack rate (last 7d)                     │
└─────────────────────────────────────────────────────────┘
```

The owner cockpit is *the* north-star UI for AccentOS. Everything else is a specialization.

## Purchasing view

Priority order on screen:
1. CRIT: stockouts, negative on-hand, receiving variance
2. ELEV: vendor score deteriorating, lead-time drift, freight creep
3. WARN: PO acknowledgments overdue, partial shipments chronic
4. Drift watchlist: vendor scores, lead times, fill rates
5. Action queue: POs that should be issued today (derived from `inv.stockout_imminent`)

## Sales view

1. CRIT/ELEV: high-value pending quotes, churn-risk customers
2. WARN: stale quotes, follow-up overdue, customer spend drop
3. Reorder due (informational, but actionable)
4. New high-value customers
5. Velocity sparkline: weekly quote close rate

## Ecommerce view

1. CRIT: checkout errors, zero sessions, storefront 5xx
2. ELEV: conversion drop, unsub spike, deliverability
3. WARN: cart abandon, product 404, MAP violations, no-price SKUs
4. Marketing flow status (Klaviyo)
5. Search zero-results queue (informational)

## Warehouse view

1. CRIT: fulfillment SLA breach, negative on-hand
2. ELEV: backorder growth, shipment exceptions
3. WARN: pick error spike, carrier delay patterns, cycle count variance
4. Branch transfer recommendations (`inv.location_imbalance`)
5. Receiving queue with variance flags

## Mobile operational feed

The mobile feed is **brutally aggressive about prioritization**:
- Maximum 5 cards.
- Only CRIT, EMRG, and the single highest-ranked ELEV per role.
- Pull-to-refresh; no auto-push except CRIT/EMRG.
- Every card has one primary action button (e.g. "Issue PO", "Open Quote", "Call Vendor").

If you can't act from the mobile feed, it shouldn't be in the mobile feed.

## Alerts / escalations channel

Routing rules (recap from severity model):

| Severity | Channel |
|---|---|
| INFO | digest only |
| WARN | role dashboard + hourly digest |
| ELEV | role dashboard pinned + daily digest + escalation after 24h |
| CRIT | push to role + dashboard + escalation after 2h |
| EMRG | push + sms + email + escalation after 15m |

Escalations are themselves logged as `signal.escalated` events. Never re-fire originals.

## Daily operational summary

Sent 7am local per role. Contents:

1. **Yesterday in one line**: orders, revenue, GM, signal volume.
2. **Drift watchlist**: 3–5 trended metrics relevant to the role.
3. **Open ELEV signals** (top 5).
4. **Resolved-yesterday recap** (count by category).
5. **One AI-assisted observation** (optional, see SIGNAL_TO_ACTION_FRAMEWORK.md).

Length budget: must fit on one phone screen.

## Surface prioritization within a role

When a surface has more than ~10 signals, prioritize by:

1. Severity (EMRG > CRIT > ELEV > WARN > INFO)
2. Age (newer breaks ties? no — **older** breaks ties; aging-out is a failure mode we want visible)
3. Entity value (dollar value of the affected entity)
4. Operator-tunable boosts (per-role weighting)

Ranking is deterministic and visible: "ranked #2 because: severity=ELEV, age=14h, value=$8,400."

## Read receipts & telemetry

Every surface tracks:
- Signal views (did the operator see it?)
- Time-to-ack
- Ack vs dismiss ratio
- Resolution time
- Signals dismissed without action (potential rule to demote/kill)

This is **input to the severity tuning loop** in SIGNAL_SEVERITY_MODEL.md.

## Cross-role visibility

- Default: role sees own role's signals.
- Owner sees all.
- Sysops sees system signals across roles.
- Operators can explicitly "watch" another role's signal (e.g. sales watching purchasing for a customer-impacting stockout). Watching is audited, never silent.

## Anti-patterns

1. **A separate dashboard per signal category.** No. One dashboard per role.
2. **Real-time everything.** No. Polling + push for CRIT/EMRG.
3. **Customizable dashboards in v1.** No. Opinionated defaults first; customization only when a clear pattern emerges.
4. **Email blasts.** Only the daily summary and CRIT/EMRG escalations leave the app.

## Phase 1 surface scope

Phase 1 ships **only**:
- Owner cockpit
- One role view (recommend: purchasing — highest signal density)
- Mobile operational feed (5-card)
- Daily operational summary (owner only)
- CRIT/EMRG push channel

Sales / ecommerce / warehouse views ship in Phase 2 once the cockpit + purchasing surface prove the routing & severity model. Resist the urge to ship all five surfaces on day one — each surface that ships untuned will burn operator trust.
