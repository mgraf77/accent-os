---
type: module
slug: inventory
title: Inventory Module (Track 5.3 phase 1)
sources: [source-build-intelligence]
related: [ADR-002, ADR-004, vendor-score-import, price-book, demand-forecast, purchase-orders, labels, alerts]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-07
---

# Inventory Module

**File**: `js/inventory.js`
**Pattern**: paginated load + bulk CSV upsert + per-cell inline edits with optimistic UI and dependent-cell recompute
**Sidebar route**: rendered into `vendor-section-content` (sub-tab on Vendor Ranking page; all roles)

## Purpose

CSV-driven inventory persistence on `inventory_items` (M22 schema). Live Windward sync arrives in Track 6.11 (blocked on M03 + M10) — the same table absorbs both feeds via `import_source` (`csv` vs `windward`); UI is unchanged when the live feed flips on.

## Functions

| function | role |
|----------|------|
| `sbLoadInventory()` | paginated GET in 1000-row pages until empty; tolerant of missing table |
| `sbBulkSaveInventory(rows)` | bulk POST with `Prefer: resolution=merge-duplicates,return=representation`, `on_conflict=vendor_id,sku`; stamps `import_source`, `last_imported_at`, `updated_at` |
| `sbDeleteInventoryItem(id)` | hard delete |
| `sbUpdateInventoryField(id, field, value)` | PATCH allow-list: `qty_on_hand`, `qty_committed`, `qty_on_order`, `reorder_point`, `unit_cost`, `list_price`, `bin`, `location` |
| `renderInventory(container)` | 4-stat header (SKUs / units / inventory $ / below-reorder count) + import card + filtered table capped at 1000 rows |
| `doBulkInventoryDelete(ids)` | senior-only via `bulkSel*` |
| `_invRow(r)` | renders editable cells via `cell()` factory; role-gated edit map (cost = senior; list = senior+Sales; qty/place = senior+Warehouse) |
| `parseCsv(text)` | minimal RFC-4180 parser (quoted fields, escaped quotes, mixed line endings) — also exported for use by [[customers]] CSV import |
| `processInvCsvText(text)` | header alias map (sku/qty/cost/etc.), `vendor_name` → `vendor_id` resolution against `VD`, unmapped vendors tracked, preview modal |
| `commitInvCsv()` | tags rows `import_source='csv'`, bulk save, reload, render |
| `commitInventoryCell(input)` | blur handler; optimistic update + dependent-cell recompute (qty_available + low-stock styling) + revert on failure |
| `commitInventoryQty(input)` | back-compat alias from v6.10.43 (now delegates to `commitInventoryCell`) |
| `deleteInventoryItem(id)` | per-row delete with confirm |
| `downloadInvCsvTemplate()` / `openInvCsvPaste()` / `onInvFilePick(input)` | CSV input surfaces (template + paste + file) |

## Inline-edit dependent cells

When `qty_on_hand` or `reorder_point` changes, `qty_available` is recomputed (`qty_on_hand - qty_committed`) and the row's low-stock styling toggles in place — no full re-render. After server save the response's authoritative `qty_available` overwrites the optimistic value.

## CSV alias map (key entries)

`qty` / `on_hand` → `qty_on_hand` · `cost` / `cost_each` → `unit_cost` · `price` / `msrp` / `retail` → `list_price` · `min` / `min_qty` → `reorder_point` · `vendor` / `manufacturer` / `mfg` / `brand` → `vendor_name` · `gtin` / `barcode` → `upc` · `wh` / `warehouse` → `location` · `shelf` → `bin`.

## State + role gates

`INVENTORY` (list, capped render at 1000 for perf), `invFilter` (q/vendor/lowOnly/location). Cost edits = `Owner|Admin|Manager` only. List-price edits = senior + `Sales`. Qty/bin/location = senior + `Warehouse`.

## Related

[[ADR-002]] · [[ADR-004]] · [[vendor-score-import]] · [[price-book]] · [[demand-forecast]] · [[purchase-orders]] · [[labels]] · [[alerts]]
