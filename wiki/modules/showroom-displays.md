---
type: module
slug: showroom-displays
title: Showroom Displays Module (Track 5.8)
sources: [source-build-intelligence]
related: [ADR-002, ADR-004, vendor-scoring, rubric-display, alerts, inventory]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-07
---

# Showroom Displays Module

**File**: `js/showroom_displays.js` (inline-edit added v6.10.52; CSV bulk import via `csvImportFlow` v6.10.45)
**Pattern**: full CRUD on `showroom_displays` (M25 schema) with inline-edit cells, vendor-FK linkage, optional co-op fund linkage, CSV bulk import
**Sidebar route**: `showrooms` (CORE) — Owner / Admin / Manager / Sales only

## Purpose

Track vendor display programs on the showroom floor: what's installed where, when the contract started and ends, paid cost vs co-op offset, retail value of SKUs on display, and SKU manifest. Optional `related_coop_id` joins to a co-op fund (see [[vendor-scoring]] coop tracker) so the same offset isn't double-counted. Drives the `showroom_expiring` alert (see [[alerts]]) when `expires_date` falls within 14 days.

## Functions

| function | role |
|----------|------|
| `sbLoadShowroomDisplays()` | GET `/showroom_displays?order=expires_date.asc.nullslast,updated_at.desc&limit=500`; tolerant of missing M25 |
| `sbSaveShowroomDisplay(rec)` | upsert; auto-stamps `removed_date` when status flips to `removed` |
| `sbUpdateShowroomField(id, field, value)` | PATCH allow-list: `status`, `location`, `contract_terms`, `notes`, `participation_cost`, `coop_value`, `retail_value`; auto-manages `removed_date` on status flip |
| `commitShowroomCellSelect(select)` | inline-edit blur handler with optimistic UI + revert on failure + audit log; re-renders for badge restyle |
| `sbDeleteShowroomDisplay(id)` | hard delete |
| `showrooms(el, act)` | sidebar route; renders `+ New Display` button |
| `renderShowroomDisplays(el)` | 4-stat header (live count / expiring ≤60d / retail $ / net cost = paid - coop) + import card + filterable table sorted expiring→active→installed→planned→expired→removed; expired/removed at 0.6 opacity |
| `doBulkShowroomDelete(ids)` | bulk delete via `bulkSel*`; senior-role-only |
| `openShowroomEdit(displayId)` | modal: name + status + vendor (FK from `VD` filtered to active) + location + install/expires/removed dates + participation_cost + coop_value + retail_value + SKU list (comma-split) + linked co-op fund dropdown + contract_terms + notes |
| `saveShowroom(displayId)` | resolves vendor_name from selected option's `data-name`; splits SKU CSV string into array |
| `deleteShowroomConfirm(displayId)` | confirm + delete |
| `sbBulkSaveShowroomDisplays(rows)` | CSV bulk POST |

## Status workflow

`planned → installed → active → expiring → expired → removed`. Live = first 4 (counted in retail_value + cost stats); `removed_date` auto-stamps on flip to `removed` and clears on flip away. `expiring` badge highlights yellow at ≤60d; rows at 0.6 opacity once `expired` or `removed`. Sort key boosts `expiring` to the top so renew-or-remove decisions surface first.

## Net cost formula

`net = participation_cost − coop_value`. Header card displays both raw paid + coop offset and net. Per-row table also renders net so an at-a-glance read of which programs are net-positive after vendor co-op kickback.

## CSV bulk import (helper-driven)

Unlike most CRUD modules, showroom displays delegate to `csvImportFlow` (shared helper). Aliases cover ~25 header variations. Vendor-name → `vendor_id` resolution in `postProcess` walks `VD` for case-insensitive name match; unmatched names tracked in a `Set` and surfaced in the preview modal. Status enum normalized via `csvEnumNormalizer`; cost fields via `csvNumberNormalizer(0)`. Duplicate detection by case-insensitive `display_name`.

## State

`SHOWROOM_DISPLAYS` (list), `sdFilter = {q, status, vendor}`. Search hay includes flattened `sku_list`.

## Read dependencies

`VD` (vendor dropdown + bulk-import vendor_id resolution), `COOP_FUNDS` (linked-co-op dropdown labels — see [[vendor-scoring]]), `INVENTORY` (none directly; SKU list is free-text), `CU` (role gates for inline edit + import + bulk delete).

## Shell touchpoints

- Sidebar: `index.html` line 353 → CORE → `showrooms` slot, icon ▣
- PAGE_META: `showrooms: {t:'Showroom Displays', s:'Display program tracking'}`
- Dispatcher: `pages.showrooms`
- Audit events: `showroom_create`, `showroom_edit`, `showroom_delete`, `showroom_<field>_edit`, `showrooms_bulk_delete`, `showroom_displays_import`
- Generates `showroom_expiring` rows in [[alerts]] (severity warn ≤14d, info ≤7d)
- Modal helpers: `openModal` / `closeModal` / `toast`; saved filters via `savedFiltersBar`; bulk select via `bulkSel*`

## Related

[[ADR-002]] · [[ADR-004]] · [[vendor-scoring]] · [[rubric-display]] · [[alerts]] · [[inventory]]
