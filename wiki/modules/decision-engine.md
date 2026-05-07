---
type: module
slug: decision-engine
title: Decision Engine Module (Track 5.15)
sources: [source-build-intelligence]
related: [ADR-002, ADR-004, customers, pipeline-analytics, deal-optimizer, alerts, sop-quote-creation]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-07
---

# Decision Engine Module

**File**: `js/decision_engine.js`
**Pattern**: pure-compute layer over `DEALS` + `QUOTES` + `CUSTOMERS` + `CUSTOMER_INTERACTIONS` + `INVENTORY` + `CHANGELOG`. No new schema.
**Sidebar route**: `decisionengine` (CORE, Sales+ access)

## Purpose

Surfaces "do this next" recommendations to sales reps + managers. Each row carries a kind badge, subject, reason, suggested move, $-impact, and click-through nav to the relevant module. Companion to [[deal-optimizer]] (vendor-side) and [[pipeline-analytics]] (analytics-side); this module is the rep-side action layer.

## Functions

| function | role |
|----------|------|
| `decisionengine(el, act)` | sidebar route; renders Refresh topbar button |
| `renderDecisionEngine(el)` | 4-stat header (chase / followup / atrisk / sum impact) + filterable table with kind + min-impact selectors |
| `computeSalesDecisions()` | runs 5 heuristics, returns `[{kind, subject, reason, suggestion, impact, nav}]` sorted by priority then impact |

## 5 Recommendation kinds

| kind | trigger | impact heuristic | nav target |
|------|---------|------------------|------------|
| `chase` | active deal (not won/lost/abandoned) with `probability ≥ 60` and `value ≥ $5K` | `value × prob/100` (expected value) | `pipeline` → `openDeal(id, stage)` |
| `followup` | quote 7–60d old, `total ≥ $250` | `total × 0.35` (assumed conversion if pursued) | `quotes` |
| `atrisk` | active deal with no `updated_at` change in ≥14d, `value ≥ $2K` | `value × prob/100 × 0.5` (staleness discount) | `pipeline` → `openDeal` |
| `retain` | `VIP` or `Active` segment customer with `recency ∈ [60, 365)`d (per [[customers]] RFM) | `monetary × 0.15` (retention value) | `customers` → `openCustomerDetail` |
| `upsell` | won deal 7–90d old, `value ≥ $3K` | `value × 0.13` (typical attach rate) | `pipeline` → `openDeal(id, 'won')` |

Priority sort: `chase → atrisk → followup → retain → upsell`, ties by `impact` desc.

## Filters

`deFilter = {kind, minImpact}`. Kind dropdown = `Chase / Follow-up / Retain / At-risk / Upsell`. Min-impact = `Any / ≥$500 / ≥$2K / ≥$10K`. Filters apply post-compute.

## Read dependencies

- `DEALS` — flattened across all stages (`Object.keys` walk); `_stage` stamped per deal
- `QUOTES` — array; uses `date`, `total`, `customer`, `id`
- `CUSTOMERS` — for RFM via `computeCustomerRFM` (defined in [[customers]])
- `CUSTOMER_INTERACTIONS` — implicitly via `computeCustomerRFM`
- `INVENTORY`, `CHANGELOG` — accessed if heuristics extend in future
- `computeDealProbability` (inline shell) — falls back to `50` if helper missing or `d.probability` set

## Nav helper pattern

`nav` strings are inline JS like `goTo('pipeline');setTimeout(()=>{if(typeof openDeal==='function')openDeal('${d.id}','${d._stage}')},80)` — `setTimeout` ensures the target page mounts before the modal opens.

## State

`deFilter` only. No persistent state; recompute per render.

## Shell touchpoints

- Sidebar: `decisionengine` slot
- No DB writes
- Click-through nav uses inline `onclick` strings (no escaped quotes — IDs are UUIDs without special chars)

## Related

[[ADR-002]] · [[ADR-004]] · [[customers]] · [[pipeline-analytics]] · [[deal-optimizer]] · [[alerts]] · [[sop-quote-creation]]
