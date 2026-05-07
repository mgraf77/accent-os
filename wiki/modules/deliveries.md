---
type: module
slug: deliveries
title: Deliveries Module (Track 5.10)
sources: [source-build-intelligence]
related: [ADR-002, ADR-004, customers, jobs, purchase-orders, alerts]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-07
---

# Deliveries Module

**File**: `js/deliveries.js`
**Pattern**: full CRUD on `deliveries` (M27 schema). Auto `DLV-####` numbering. Customer dropdown auto-fills address.
**Sidebar route**: `deliveries` (CORE, all roles incl. Warehouse)

## Purpose

Schedule and track customer / job-site deliveries. Status workflow: `scheduled → out_for_delivery → delivered / failed / rescheduled / cancelled`. `delivered_at` auto-stamped on flip to `delivered`. Optional links to job, quote, or PO.

## Functions

| function | role |
|----------|------|
| `sbLoadDeliveries()` | GET `/deliveries?order=scheduled_date.asc.nullslast,updated_at.desc&limit=500`; advances `DLV_NUM` past max |
| `sbSaveDelivery(rec)` | upsert; stamps `delivered_at = now` if status flipped to `delivered` and value missing |
| `sbUpdateDeliveryField(id, field, value)` | PATCH allow-list: `status`, `driver`, `vehicle`, `time_window`, `notes`, `failure_reason`; sets `delivered_at` on status flip |
| `commitDeliveryCellSelect(select)` | inline status edit |
| `sbDeleteDelivery(id)` | hard delete |
| `deliveries(el, act)` | sidebar route; renders `+ Schedule Delivery` button |
| `renderDeliveries(el)` | 4-stat header (Today + tomorrow / Overdue / In transit / Delivered YTD) + filtered table sorted active-first by `scheduled_date` asc |
| `doBulkDeliveryStatus(ids, status)` / `doBulkDeliveryDelete(ids)` | bulk actions via `bulkSel*` |
| `openDeliveryEdit(deliveryId)` | full modal: customer (dropdown auto-fills name + address) + scheduled date/time window + driver + vehicle + items + weight + signature toggle + signed-by + failure reason + linked job/quote/PO |
| `onDlvCustomerPick()` | reads `data-name` + `data-addr` from selected customer option, fills empty address fields without overwriting user-entered values |
| `saveDelivery(deliveryId)` | validates customer name + scheduled date; persists; reloads if save lacks return shape |
| `deleteDeliveryConfirm(deliveryId)` | confirm + delete |

## Status workflow

| status | meaning |
|--------|---------|
| `scheduled` | logged but not dispatched |
| `out_for_delivery` | driver en route |
| `delivered` | terminal success — `delivered_at` stamped |
| `failed` | terminal failure — capture `failure_reason` |
| `rescheduled` | needs new `scheduled_date` |
| `cancelled` | terminal cancel |

## Filters

`dlvFilter = {q, status, when}`. The `when` selector is the unique part: `upcoming` (default — future + today, not done), `today` (today only), `past` (already past or done), `all`. Combined with the status filter for fine-grained views.

## Address handling

Address is stored as a JSONB object `{line1, city, state, zip}`. The customer-dropdown auto-fill (`onDlvCustomerPick`) populates from `c.address` only when fields are empty — preserves manual edits.

## State

`DELIVERIES` (list), `dlvFilter`, `DLV_NUM` (next number).

## Roles

All roles (incl. Warehouse) can edit + bulk-action; senior roles (Owner / Admin / Manager) gate is implicit since the page is CORE-section. Bulk delete is in the action menu but no role gate.

## Related

[[ADR-002]] · [[ADR-004]] · [[customers]] · [[jobs]] · [[purchase-orders]] · [[alerts]]
