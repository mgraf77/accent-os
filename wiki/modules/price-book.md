---
type: module
slug: price-book
title: Price Book Module (Track 5.6)
sources: [source-build-intelligence]
related: [ADR-002, ADR-004, ADR-005, inventory, vendor-scoring, demand-forecast]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-07
---

# Price Book Module

**File**: `js/price_book.js`
**Pattern**: pure-compute view over `INVENTORY` + `VD`. No new schema, no DB writes.
**Sidebar route**: rendered into `vendor-section-content` (sub-tab on Vendor Ranking page)

## Purpose

Catalog view of every inventory SKU joined with its vendor's tier and weighted score. Shows margin = `(list - cost) / list` and markup = `(list - cost) / cost` per SKU. Used to spot mispriced SKUs, vendor-concentration risk in low-margin clusters, and high-margin in-stock anchors for sales conversations. Re-renders cheaply: each filter change recomputes the join in-browser.

## Functions

| function | role |
|----------|------|
| `renderPriceBook(c)` | the only export. Builds `vdByName` + `vdById` indices from `VD`; joins `INVENTORY` rows; computes `_margin`, `_markup`, `_tier`, `_vScore`, `_inStock`; renders 4-stat header + filterable table sorted by margin desc, capped at 500 rows |

## Empty state

When `INVENTORY.length === 0` the page shows the 📒 placeholder and a pointer to the [[inventory]] sub-tab to import a CSV. No further work.

## Computed columns

| col | formula |
|-----|---------|
| `_margin` | `(list - cost) / list` when `list > 0`, else `null` |
| `_markup` | `(list - cost) / cost` when `cost > 0`, else `null` |
| `_tier` | `computeVendorTier(v)` (honors [[vendor-scoring]] tier_override per [[ADR-005]]); falls back to `v.tier_override || 'C'` if function missing |
| `_vScore` | `vendorScore(v).weighted` if helper present |
| `_inStock` | `qty_available > 0` |

## Margin distribution stats

Header card breaks SKUs into 4 buckets:

- **high** (≥50%) — green
- **mid** (≥30%) — blue
- **low** (<30%) — accent (red)
- **none** — unpriced (cost or list missing)

Avg-margin stat color tracks: ≥40% green, ≥25% blue, else yellow.

## Filters

`pbFilter = {q, vendor, tier, inStockOnly}`. Search hits `sku + upc + description + vendor_name + category`. Tier dropdown lists `A | B | C | D | F` (matches the rubric). Vendor dropdown derived from distinct `vendor_name`s in `INVENTORY`. In-stock toggle filters by `_inStock`.

## Render cap

500 rows max for browser perf. UI shows `(showing 500)` when truncated. Sort is margin desc, so the highest-margin SKUs always make the cut.

## State

`pbFilter` only. No persistent module state; INVENTORY + VD are owned by their respective modules ([[inventory]] / vendors).

## Shell touchpoints

- Mounted into `vendor-section-content` from the Vendor Ranking sub-tab dispatcher
- Reads inline-shell helpers: `tierBadge`, `computeVendorTier`, `vendorScore`, `esc`, `$`
- No PAGE_META, no sidebar entry, no DB

## Related

[[ADR-002]] · [[ADR-004]] · [[ADR-005]] · [[inventory]] · [[vendor-scoring]] · [[demand-forecast]]
