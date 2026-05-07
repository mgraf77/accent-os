---
type: module
slug: competitive-pricing
title: Competitive Pricing Module (Track 5.14)
sources: [source-build-intelligence]
related: [ADR-002, ADR-004, inventory, price-book, rubric-imap, deal-optimizer]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-07
---

# Competitive Pricing Module

**File**: `js/competitive_pricing.js`
**Pattern**: append-only observation log on `competitor_prices` (M28 schema); computes latest snapshot per `(sku, competitor_name)` at render time, position score against `INVENTORY.list_price` fallback
**Sidebar route**: `competitive` (CORE) — all roles

## Purpose

Track competitor prices over time. Each row = one observation (one competitor's price for one SKU on one date). Latest-per-pair snapshot drives positioning vs our `our_price` (manual) or `INVENTORY.list_price` (fallback). Surfaces undercut / parity / premium flags so reps know where we win and where we're at risk. Historical observations preserved for trend analysis.

## Functions

| function | role |
|----------|------|
| `sbLoadCompetitorPrices()` | GET `/competitor_prices?order=observed_at.desc&limit=1000`; tolerant of missing M28 table |
| `sbSaveCompetitorPrice(rec)` | upsert; stamps `observed_by = CU.user_id` |
| `sbDeleteCompetitorPrice(id)` | hard delete |
| `competitive(el, act)` | sidebar route; renders `+ Log Price` button |
| `buildCompetitiveLatest()` | reduces `COMPETITOR_PRICES` to latest-per-`(sku, competitor_name)` map |
| `positionFor(ourPrice, theirPrice)` | classifier: `>5%` above = `premium` · `<-5%` = `undercut` · within = `parity` · null inputs = `unknown` |
| `renderCompetitive(el)` | 4-stat header (SKUs / undercutting / premium / avg margin %) + filterable table; sorted undercut→parity→premium→unknown then observed_at desc |
| `openCompetitivePriceEdit(priceId)` | modal: SKU autocomplete (datalist from `INVENTORY` top 500) + competitor + URL + their/our price + in-stock + shipping note + observed date + notes |
| `onCompetitiveSkuPick()` | autofill description + our_price from `INVENTORY` row when SKU picked |
| `saveCompetitivePrice(priceId)` | resolves `vendor_id` + `vendor_name` from `INVENTORY` if SKU known; persists |
| `deleteCompetitivePriceConfirm(priceId)` | confirm + delete |

## Position thresholds

Computed in `positionFor(our, theirs)` as `(our - theirs) / theirs`:

- `> +0.05` → `premium` — our price >5% above (review — may be losing)
- `< -0.05` → `undercut` — our price >5% below (we're winning on price)
- otherwise → `parity` (within ±5%)
- either side null → `unknown`

Sort puts `undercut` first so the report leads with wins; `premium` rows get accent-coloured Δ% so review candidates stand out.

## Sticky compute on filter rows

`renderCompetitive` mutates each filtered row with `_our` and `_pos` so the table render reads pre-computed values without recomputing per cell. Cleared each render cycle (objects in `COMPETITOR_PRICES` are mutated in place — non-issue because re-render rebuilds).

## State

`COMPETITOR_PRICES` (full observation log), `cpFilter = {q, competitor, position}`. No CSV bulk import in this module.

## Read dependencies

`INVENTORY` (SKU autocomplete + `list_price` fallback for `our_price` + `vendor_id`/`vendor_name` enrichment on save), `CU` (`observed_by` stamp).

## Shell touchpoints

- Sidebar: `index.html` line 357 → CORE → `competitive` slot, icon ⚖
- PAGE_META: `competitive: {t:'Competitive Pricing', s:'Track competitor prices vs ours'}`
- Dispatcher: `pages.competitive`
- Audit events: `compprice_create`, `compprice_edit`, `compprice_delete`
- Modal helpers: `openModal` / `closeModal` / `toast`

## Related

[[ADR-002]] · [[ADR-004]] · [[inventory]] · [[price-book]] · [[rubric-imap]] · [[deal-optimizer]]
