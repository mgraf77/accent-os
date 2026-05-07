---
type: module
slug: purchase-orders
title: Purchase Orders Module (Track 5.4)
sources: [source-build-intelligence]
related: [ADR-002, ADR-004, inventory, vendor-scoring, jobs, sop-quote-creation, alerts]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-07
---

# Purchase Orders Module

**File**: `js/purchase_orders.js`
**Pattern**: header + lines two-table CRUD on `purchase_orders` + `po_lines` (M23 schema), `Mark Received` flow that writes through to [[inventory]]
**Sidebar route**: `purchaseorders` (CORE, Owner / Admin / Manager)

## Purpose

Full PO lifecycle: draft → sent → confirmed → partial → received → cancelled. Auto `PO-####` numbering. Line-item editor with live ext-cost + auto-calc subtotal/total. Quote → PO conversion (multi-vendor splits into one PO per vendor). Receipt flow increments `inventory_items.qty_on_hand` for matching `(vendor_id, sku)` rows.

## Functions

| function | role |
|----------|------|
| `sbLoadPurchaseOrders()` | GET `/purchase_orders?order=updated_at.desc&limit=500`, then GET `/po_lines?po_id=in.(...)` for all loaded POs; populates `PO_LINES[poId]`; advances `PO_NUM` past max existing |
| `sbSavePurchaseOrder(po, lines)` | upserts header (recomputes `subtotal` from lines + `total` = subtotal + tax + freight); replaces lines via delete-then-insert; auto-issues `PO-XXXX` if blank |
| `sbUpdatePOField(id, field, value)` | PATCH allow-list: `status`, `expected_date`, `order_date`, `notes`, `tracking` |
| `commitPOCellSelect(select)` | inline-edit handler for status dropdown; optimistic with revert |
| `sbDeletePurchaseOrder(id)` | hard delete (lines cascade per schema FK) |
| `purchaseorders(el, act)` | sidebar route; renders `+ New PO` button |
| `renderPOs(el)` | 4-stat header (Open count by status / Past Expected / Open $ / Received YTD) + filterable table; sort active before received/cancelled, then `updated_at` desc |
| `openPOEdit(poId, preset)` | header + lines editor modal; vendor dropdown from `VD`, quote/job dropdowns from `QUOTES`/`JOBS`; supports preset for Quote→PO conversion |
| `renderPOLinesEditor()` / `addPOLine()` / `removePOLine(i)` | in-modal line table maintained on `_poEditLines` array |
| `updatePOTotals()` | live subtotal/tax/freight/total recompute on input |
| `savePO(poId)` | validates vendor, persists header + lines, audit log `po_create`/`po_edit` |
| `deletePOConfirm(poId)` | confirm + delete |
| `receivePO(poId)` | for each line with matching `(vendor_id, sku)` in `INVENTORY`, PATCH `qty_on_hand += line.qty`; flip status → `received`; audit `po_receive` with `lines_matched`/`unmatched` counts |
| `createPOFromQuote(quoteIdOrUuid)` | groups quote lines by `vendorId`; single-vendor → direct preset; multi-vendor → picker modal |
| `_poFromQuotePick(quoteKey, vendorKey)` | resolves picker click → `_openPOFromQuoteGroup` |
| `_openPOFromQuoteGroup(q, g)` | builds preset `{po: {vendor_id, vendor_name, related_quote_id, notes}, lines: [...]}` and opens edit modal |

## Status workflow

`draft` → `sent` → `confirmed` → `partial` → `received`; `cancelled` is terminal alt path. Receipt flow auto-sets `received_date = today`.

## Receipt → inventory write-through

For each line:
- Match by `(vendor_id, sku)` against `INVENTORY` (with `vendor_name` fallback)
- Matched: PATCH `inventory_items` with `qty_on_hand = old + line.qty`, bump `last_imported_at`
- Unmatched: counted in audit log; user must manually create the inventory row

## State

`POS` (header list), `PO_LINES[poId]` (per-PO line cache), `poFilter` (q/status/vendor), `PO_NUM` (next number, derived from max), `_poEditLines` (modal scratch array).

## Related

[[ADR-002]] · [[ADR-004]] · [[inventory]] · [[vendor-scoring]] · [[jobs]] · [[sop-quote-creation]] · [[alerts]]
