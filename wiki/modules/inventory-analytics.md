---
type: module
slug: inventory-analytics
title: Inventory Analytics Module (Vendor Ranking sub-tab)
sources: [source-build-intelligence]
related: [ADR-002, ADR-004, inventory, demand-forecast, purchase-orders, reports]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-07
---

# Inventory Analytics Module

**File**: `js/inventory_analytics.js` (v6.10.35)
**Pattern**: pure-compute over `INVENTORY` + `PO_LINES`; retrospective metrics (turn / dead stock / ABC / value mix); no schema, no API
**Sidebar route**: sub-tab `invanalytics` of the Vendor Ranking page (`vendors`) — see `index.html:2291`. Not a top-level sidebar entry.

## Purpose

Backwards-looking complement to the forward-looking [[demand-forecast]]. Computes annualized turn rate, dead-stock detection, and ABC classification from the last 365 days of PO line data as a proxy for sales velocity. Track 6.11 Windward live integration will swap PO proxy for actual sales-line history.

## Functions

| function | role |
|----------|------|
| `renderInventoryAnalytics(c)` | single render entry; empty-state if no `INVENTORY`; builds per-SKU rows, ABC pass, aggregates, and 4 cards |

## Constants

- `INV_DEAD_STOCK_DAYS = 180` — SKU with `qty_on_hand > 0` and zero PO movement in 180d → dead
- `INV_VELOCITY_WINDOW_DAYS = 365` — annualized signal window (longer than [[demand-forecast]] which uses ~90d)

## Per-SKU compute

Key = `${sku}|${vendor_id || vendor_name}`. For each PO `order_date` ≥ cutoff, sum line `qty` into `skuVel[k]`; track latest `order_date` in `skuLastMove[k]`. Each `INVENTORY` row produces:

- `value` = `qty_on_hand × unit_cost`
- `annual_velocity` = sum of PO line qty in window
- `turn` = `annual_velocity / qty_on_hand` (null if either is 0)
- `last_move_days` = days since last PO; `is_dead` = `annualVel === 0 && onHand > 0`
- `annual_revenue` = `annual_velocity × list_price` (input to ABC)

## ABC classification

Sort SKUs by `annual_revenue` desc; cumulative percent of total revenue: ≤80% → `A`, ≤95% → `B`, else `C`. Class A counts/value drives stock-priority insight string; C is the discontinue-candidate pile.

## Aggregates + tables

4 stat cards: Total Inventory Value, Avg Turn (mean of `turn` across `movers`), Dead Stock count + tied-up $, ABC mix `${A}A / ${B}B / ${C}C`.

Bottom 2×2 grid: ABC distribution bar chart, Top-10 fastest movers by turn, Top-10 slowest movers (still active), Top-20 dead stock by value (with "+ N more" overflow → Reports → Inventory).

## State

None — recomputed on every render call. No filters, no persisted state.

## Read dependencies

`INVENTORY`, `POS`, `PO_LINES` (window-scoped maps), all from inline shell hydrate. `esc()` from shell utilities for table cell escaping.

## Shell touchpoints

- Sub-tab dispatch: `vSection === 'invanalytics'` branch inside the Vendor Ranking sub-tab switch (`index.html:2291`)
- No PAGE_META key (rendered into the parent `vendors` page's `sectionContent`)
- No own hydrate call — relies on `sbHydrate` for `INVENTORY` + `POS` + `PO_LINES`
- No audit events

## Related

[[ADR-002]] · [[ADR-004]] · [[inventory]] · [[demand-forecast]] · [[purchase-orders]] · [[reports]]
