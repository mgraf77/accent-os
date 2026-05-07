---
type: module
slug: deal-optimizer
title: Deal Optimizer Module (Track 5.7)
sources: [source-build-intelligence]
related: [ADR-002, ADR-004, ADR-005, vendor-scoring, alerts, decision-engine]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-07
---

# Deal Optimizer Module

**File**: `js/deal_optimizer.js`
**Pattern**: pure-compute layer over `VD` + `CHANGELOG` + vendor scores. No new schema. Recommendations refresh on every page load.
**Sidebar route**: rendered into Vendor Ranking sub-tab dispatcher

## Purpose

Surfaces 5 negotiation moves per vendor from existing data: scores, tier, lifetime spend, recent score deltas, inactive flags. Heuristics sharpen as `CHANGELOG` accumulates. Each recommendation has a $-impact estimate to drive prioritization.

## Functions

| function | role |
|----------|------|
| `renderDealOptimizer(c)` | 4-stat header (counts per kind + summed impact) + table sorted by priority order then impact desc; row click opens vendor detail |
| `computeDealRecommendations()` | runs the 5 heuristics over `VD`, returns `[{vendor_id, vendor_name, kind, reason, suggestion, impact}]` |
| `getAdaptiveTier(score, allScores)` | percentile-bucket assignment: `score===0` → `F`; otherwise rank in non-zero scores → `<20%=A, <40%=B, <60%=C, <80%=D, else=F` |
| `renderOverview(container)` | Vendor Ranking Overview tab: 4 stat cards + Tier Distribution panel + Top-10-by-score panel |
| `getChangeLog()` / `saveChangeLog()` | shape-converters for legacy callers; `CHANGELOG` is the source of truth (hydrated via `sbLoadChangelog`) |

## 5 Recommendation kinds

| kind | trigger | impact heuristic |
|------|---------|------------------|
| `renegotiate` | lifetime ≥ $25K + any of `credit`/`discounts`/`freight`/`returns` ≤ 4 | `lifetime × 0.03` (~3% recoverable) |
| `investigate` | any category dropped ≥2 points in last 90d (per [[vendor-scoring]] [[ADR-005]] rubric) | `lifetime × 0.02` |
| `replace` | `inactive=true` but 2024+2025 sales > $1K (orphan risk) | `recent_sales × 0.10` |
| `upgrade` | tier `B` + avg ≥ 7.5 across ≥3 cats + lifetime ≥ $5K | `lifetime × 0.04` |
| `cut` | lifetime $0–1.5K + avg < 4 + 2024+2025 sales < $100 | `0` (frees rep bandwidth, not $-savings) |

Priority sort: `renegotiate → investigate → upgrade → replace → cut`, ties by `impact` desc.

## Changelog filter

`computeDealRecommendations` indexes `CHANGELOG` deltas in a 90-day window keyed by `(vendor, category)`. Skips meta categories: `Categories`, `Notes`, `Tier`, `Inactive`. Only entries with parseable numeric `oldVal` and `newVal` count.

## Reads

`VD` (vendor list with `s` score map + `sales.t` lifetime + `sales.YYYY` per-year + `inactive` flag), `CHANGELOG`, helpers `computeVendorTier`, `vendorScore`, `weightedScore`, `tierBadge`, `scoreColor`, `fmt$`, `scoredCount`.

## Shell touchpoints

- Mounted into Vendor Ranking sub-tab dispatcher; uses `vendor-section-content` host
- Click-through navigates to `openVendorDetail(vendor_id)`
- No PAGE_META, no DB writes
- `renderOverview` is shared with the parent Vendor Ranking page

## Related

[[ADR-002]] · [[ADR-004]] · [[ADR-005]] · [[vendor-scoring]] · [[alerts]] · [[decision-engine]]
