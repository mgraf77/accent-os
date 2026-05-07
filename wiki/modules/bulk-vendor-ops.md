---
type: module
slug: bulk-vendor-ops
title: Bulk Vendor Ops Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004, vendor-scoring, vendor-score-import, rubric-rep-score]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-07
---

# Bulk Vendor Ops Module

**File**: `js/bulk_vendor_ops.js`
**Pattern**: pure-compute multi-select sub-tab on the Vendor Ranking page; writes through existing `vendor_overrides` + `vendor_parent_assignments` handlers, no new schema
**Sidebar route**: nested under `vendors` page → `bulkops` sub-tab (mounted at `vendor-section-content`)

## Purpose

Multi-select vendors via checkboxes, apply one of 7 bulk actions. Built specifically to clear the M19 backlog (~257 vendors with no rep group on import) — the no-rep counter on the dashboard card highlights remaining backlog. Tier + inactive flags persist via `vendor_overrides` (per [[vendor-scoring]]); rep + parent route through their existing single-record handlers.

## Functions

| function | role |
|----------|------|
| `renderBulkVendorOps(c)` | 4-stat header (total / no-rep backlog / filtered / selected) + filter bar + action row (only when selection >0) + checkbox table capped at 1000 rows; selected rows tint blue |
| `bvToggle(vendorId)` | per-row check on/off; re-renders |
| `bvToggleAllVisible(ids, checked)` | header checkbox; toggles all currently-visible filtered rows |
| `bvSelectAllFiltered()` | re-runs the filter predicate to add ALL matches (incl. rows beyond the 1000-row render cap) |
| `bvClearSelection()` | empties `bvSelected` |
| `bvAction(kind)` | dispatches modal-or-confirm for one of 7 actions |
| `bvApplyRep()` / `bvApplyRepRaw(val)` | writes `custom_rep` to `vendor_overrides`; mirrors into in-memory `v.rep` + `v.rg` |
| `bvApplyTier()` | writes `tier_override` to `vendor_overrides` (empty value clears) |
| `bvApplyInactive(isInactive)` | writes `inactive` + optional `inactive_reason` to `vendor_overrides` |
| `bvApplyParent()` / `_bvSaveParent(vendorId, parentId)` / `bvApplyParentRaw(parentId)` | upsert on `vendor_parent_assignments?on_conflict=vendor_id` (or DELETE when clearing) and mirrors into `VENDOR_PARENTS[id]` |

## Bulk actions (7)

| action | target | UX |
|--------|--------|-----|
| `assign_rep` | `vendor_overrides.custom_rep` | modal with datalist of existing reps (free-text allowed) |
| `clear_rep` | clears `custom_rep` | confirm |
| `set_tier` | `vendor_overrides.tier_override` | modal: A / B / C / auto |
| `mark_inactive` | `vendor_overrides.inactive=true` + `inactive_reason` | modal |
| `mark_active` | `inactive=false`, `reason=null` | confirm |
| `set_parent` | `vendor_parent_assignments` upsert | modal (only shown when `PARENT_COMPANIES` populated) |
| `clear_parent` | DELETE row from `vendor_parent_assignments` | confirm |

## Filters

`bvFilter = {q, tier, repState, parent}`. `repState` ∈ `'' | none | has | active | inactive`. `parent` supports special `__none` value for "no parent assigned". Search hay = `name + rep + rg + pc`.

## State

`bvSelected` (Set of vendor ids — survives filter changes), `bvFilter` (filter object), 1000-row render cap (filter still applies to all; selection via `bvSelectAllFiltered` reaches every match).

## Read dependencies

`VD` (vendor list), `VENDOR_PARENTS` (id → parentId map), `PARENT_COMPANIES` (parents catalog), `computeVendorTier` (from [[vendor-scoring]] for tier filter), `CU` (audit logging email).

## Shell touchpoints

- Mounted at `vendor-section-content` from the Vendor Ranking page when `vSection === 'bulkops'`
- Audit events: `bulk_assign_rep`, `bulk_set_tier`, `bulk_mark_inactive`, `bulk_mark_active`, `bulk_set_parent`, `bulk_clear_parent`
- Modal helpers: `openModal` / `closeModal` / `toast`
- Backend write helpers: `sbSaveVendorOverride` (rep/tier/inactive), `sbFetch` direct (parent assignments)

## Related

[[ADR-002]] · [[ADR-004]] · [[vendor-scoring]] · [[vendor-score-import]] · [[rubric-rep-score]]
