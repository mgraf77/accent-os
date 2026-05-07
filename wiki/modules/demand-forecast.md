---
type: module
slug: demand-forecast
title: Demand Forecast Module (Track 6.9)
sources: [source-build-intelligence]
related: [ADR-002, ADR-004, inventory, purchase-orders, price-book, alerts]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-07
---

# Demand Forecast Module

**File**: `js/demand_forecast.js`
**Pattern**: pure-compute over `INVENTORY` + `PO_LINES`. No new schema. Velocity-derived reorder recommendations with explicit lead-time + safety constants.
**Sidebar route**: `demandforecast` (CORE, Owner / Admin / Manager)

## Purpose

Per-SKU recommendation: `reorder_now`, `reorder_soon`, `overstock`, `normal`, or `no_data`. Velocity proxy = qty in PO lines over the last 90 days / 12.857 weeks. Track 6.11 (Windward live) will swap the PO-line proxy for actual sales-line history without UI changes.

## Constants

| constant | value | purpose |
|----------|-------|---------|
| `DEMAND_LEAD_WEEKS` | 4 | default supplier lead time |
| `DEMAND_SAFETY_WEEKS` | 2 | buffer above lead time |
| `DEMAND_REORDER_THRESHOLD` | 6 (lead + safety) | triggers `reorder_now` when stock falls below |
| `DEMAND_TARGET_WEEKS` | 14 (lead + safety + 8) | suggested-qty target |
| `DEMAND_OVERSTOCK_WEEKS` | 26 | triggers `overstock` |
| `DEMAND_VELOCITY_WINDOW_DAYS` | 90 | velocity sampling window |

## Functions

| function | role |
|----------|------|
| `computeDemandForecast()` | 1) build `skuVel` map keyed by `sku|vendor_id` (or `sku|vendor_name`) summing PO line qty in last 90d; 2) for each `INVENTORY` row compute `velocity = winQty / 12.857`, `weeks_of_stock = qty_available / velocity`, classify into one of 5 kinds; 3) compute `suggested_qty = max(1, round(velocity × 14 - avail - on_order))` for reorder kinds; 4) sort: reorder-now (asc by weeks) → reorder-soon → overstock → normal → no_data |
| `demandforecast(c, actions)` | sidebar route; renders 4-stat header, "Reorder list" CSV export topbar button, filterable table capped at 1000 rows |
| `exportDemandReorderCsv()` | downloads CSV of all `reorder_now` + `reorder_soon` SKUs with full forecast columns; audit log `demand_export_reorder` |

## Classification rules

```
if velocity ≤ 0.05 → no_data
elif avail ≤ 0 || weeks < 6 → reorder_now
elif weeks < 9 → reorder_soon
elif weeks > 26 → overstock
else → normal
```

## Read dependencies

- `POS` — header rows; filter by `order_date` ≥ 90d cutoff
- `PO_LINES` — line rows from [[purchase-orders]]
- `INVENTORY` — primary join; uses `qty_available` (or computed `qty_on_hand - qty_committed`), `qty_on_order`, `unit_cost`, `list_price`, `reorder_point`
- `csvDownload` — shared helper for export

## State

`demandFilter` (q / vendor / kind), persisted across re-renders.

## Daily-Brief integration

A "Reorder Now" tile in the senior-only Daily Brief uses the same `computeDemandForecast()` result, summed by `suggested_qty × unit_cost` to show the $-value of the reorder set. See [[digest]].

## Shell touchpoints

- Sidebar: `demandforecast` slot
- Topbar: Export reorder list button
- No DB writes (read-only forecast)

## Related

[[ADR-002]] · [[ADR-004]] · [[inventory]] · [[purchase-orders]] · [[price-book]] · [[alerts]]
