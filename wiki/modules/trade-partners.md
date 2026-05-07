---
type: module
slug: trade-partners
title: Trade Partners Module (Track 5.5)
sources: [source-build-intelligence]
related: [ADR-002, ADR-004, customers, jobs, alerts, sop-quote-creation]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-07
---

# Trade Partners Module

**File**: `js/trade_partners.js` (inline-edit added v6.10.50; CSV bulk import v6.10.40)
**Pattern**: full CRUD on `trade_partners` (M24 schema) with inline-edit cells, CSV bulk import, optional `customers` linkage
**Sidebar route**: `tradepartners` (CORE) — Owner / Admin / Manager / Sales only

## Purpose

External professional network: designers, contractors, architects, builders, installers, electricians. Distinct from [[customers]] (who buy) — these are collaborators. Optional `related_customer_id` FK joins a partner to a CRM customer when the same entity also purchases. Per-partner rating (0–10), preferred terms, license, and full address (JSONB `{line1, city, state, zip}`).

## Functions

| function | role |
|----------|------|
| `sbLoadTradePartners()` | GET `/trade_partners?order=name.asc&limit=1000`; tolerant of missing M24 table |
| `sbSaveTradePartner(rec)` | upsert; on edit uses `on_conflict=id` |
| `sbDeleteTradePartner(id)` | hard delete |
| `sbUpdateTradePartnerField(id, field, value)` | PATCH allow-list: `status`, `rating`, `type`, `email`, `phone`, `company`, `notes`, `tags`, `preferred_terms` |
| `commitTradePartnerCell(input)` | inline-edit blur handler with optimistic UI + revert on failure + audit log; rating clamp 0–10; re-renders on `status` / `rating` flips for badge restyle |
| `sbBulkSaveTradePartners(rows)` | CSV bulk POST |
| `tradepartners(el, act)` | sidebar route; renders `+ New Partner` button |
| `renderTradePartners(el)` | 4-stat header (active / designers / trades / avg rating) + import card + filterable table sorted active→prospect→inactive then by name |
| `doBulkTradePartnerDelete(ids)` | bulk delete via `bulkSel*`; senior-role-only action |
| `openTradePartnerEdit(partnerId)` | full modal: name + type + company + status + email/phone + website + license + JSONB address + rating + first/last_engaged + linked customer dropdown + preferred terms + notes |
| `saveTradePartner(partnerId)` | persists; flattens address fields into JSONB |
| `deleteTradePartnerConfirm(partnerId)` | confirm + delete |
| `downloadTpCsvTemplate()` / `openTpCsvPaste()` / `onTpFilePick(input)` | CSV input surfaces (template + paste + file) |
| `processTpCsvText(text)` | parse + alias map + type/status enum normalize + duplicate-name detection → preview |
| `commitTpCsv()` | strips `_dup` flag, bulk save, reload, render |

## Type + status enums

`type` ∈ `designer | contractor | architect | builder | installer | electrician | other` (default `designer` for new). Unknown CSV types → `other`. `status` ∈ `active | prospect | inactive` (default `active`); inactive rows render at 0.6 opacity.

## State

`TRADE_PARTNERS` (list), `tpFilter = {q, type, status}`. `_tpStaged` window-scoped CSV preview cache. CSV alias maps cover ~30 header variations (`partner_name`/`firm`/`license_number`/`payment_terms` etc.).

## Read dependencies

`CUSTOMERS` (linked-customer dropdown in edit modal), `CU` (role gates for inline edit + import + bulk delete).

## Shell touchpoints

- Sidebar: `index.html` line 351 → CORE → `tradepartners` slot, icon ◆
- PAGE_META: `tradepartners: {t:'Trade Partners', s:'Designers · Contractors · Architects'}`
- Dispatcher: `pages.tradepartners`
- Audit events: `tp_create`, `tp_edit`, `tp_delete`, `tp_<field>_edit`, `trade_partners_bulk_delete`, `trade_partners_import`
- Modal helpers: `openModal` / `closeModal` / `toast`; saved filters via `savedFiltersBar`; bulk select via `bulkSelBar` / `bulkSelCheckbox` / `bulkSelRegister`

## Related

[[ADR-002]] · [[ADR-004]] · [[customers]] · [[jobs]] · [[alerts]] · [[sop-quote-creation]]
