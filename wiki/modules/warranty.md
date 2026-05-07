---
type: module
slug: warranty
title: Warranty Module (Track 5.11)
sources: [source-build-intelligence]
related: [ADR-002, ADR-004, vendor-scoring, customers, sop-quote-creation, alerts]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-07
---

# Warranty Module

**File**: `js/warranty.js`
**Pattern**: full CRUD on `warranty_claims` (M24 schema), CSV bulk import via shared `csvImportFlow` helper
**Sidebar route**: `warranty` (CORE, all roles)

## Purpose

Track defective-product claims across customers + vendors. 7-state workflow: `open → sent_to_vendor → approved / denied → replaced / refunded → closed`. `resolution_date` auto-set when status flips to a terminal state (`replaced` / `refunded` / `closed` / `denied`). Auto `W-####` numbering. 3 severity levels feed [[alerts]] and the senior dashboard.

## Functions

| function | role |
|----------|------|
| `sbLoadWarrantyClaims()` | GET `/warranty_claims?order=updated_at.desc&limit=500`; advances `WARR_NUM` past max |
| `sbSaveWarrantyClaim(rec)` | upsert; auto-stamps `resolution_date` for terminal statuses |
| `sbDeleteWarrantyClaim(id)` | hard delete |
| `sbUpdateWarrantyField(id, field, value)` | PATCH allow-list: `status`, `severity`, `assigned_to`, `notes`, `vendor_ticket`, `cost_to_us`, `refund_amount`; sets/clears `resolution_date` |
| `commitWarrantyCellSelect(select)` | inline edit for status + severity dropdowns |
| `warranty(el, act)` | sidebar route; renders `+ New Claim` button |
| `renderWarranty(el)` | 4-stat header (Open by sub-status / Warranty Expiring ≤30d / Open Cost-to-Us $ / Resolved count) + import card + filtered table sorted active-first by `updated_at` desc |
| `doBulkWarrantyStatus(ids, status)` / `doBulkWarrantyDelete(ids)` | senior-only bulk actions |
| `openWarrantyEdit(claimId)` | full modal: claim # + status + vendor (required) + SKU + customer (dropdown or free-text) + severity + reported/purchase/warranty-expires/resolution dates + description (required) + vendor ticket + linked quote + cost-to-us + refund amount + notes |
| `saveWarranty(claimId)` | validates description + vendor; persists |
| `deleteWarrantyConfirm(claimId)` | confirm + delete |
| `sbBulkSaveWarrantyClaims(rows)` | bulk POST with auto-numbering and status-derived `resolution_date` |
| (top-level `csvImportFlow` call) | wires bulk import: `description` required, `severity` enum (cosmetic/functional/safety, default cosmetic), `status` enum (default open), vendor + customer name → id resolution, preview columns |

## 7-state workflow

```
open
 ├─ sent_to_vendor
 │   ├─ approved → replaced | refunded → closed
 │   └─ denied (terminal)
 └─ closed (direct close, e.g. customer dropped claim)
```

`resolution_date` set when status ∈ `{replaced, refunded, closed, denied}`; cleared otherwise.

## Severity levels

| level | color | use |
|-------|-------|-----|
| `cosmetic` | gray | finish chips, packaging damage, minor blemishes |
| `functional` | yellow | LED driver failure, switch malfunction, fixture won't operate |
| `safety` | red (urgent) | electrical / fire / fall hazard — escalate immediately, see [[vendor-scoring]] returns rubric |

## Filters

`warrFilter = {q, status, vendor}`. Search hits claim# + sku + description + customer + vendor + notes. Senior bulk actions: Mark closed, Delete selected.

## State

`WARRANTY_CLAIMS` (list), `warrFilter`, `WARR_NUM` (next number).

## Cross-module integration

- [[alerts]] generator `warranty_expiring` triggers when `warranty_expires` is in `[0, 30]d` and status is non-terminal
- [[customers]] activity timeline merges warranty claims by customer name match
- Vendor detail surfaces open claim count per vendor (via `WARRANTY_CLAIMS.filter(c => c.vendor_id === v.id)`)

## Related

[[ADR-002]] · [[ADR-004]] · [[vendor-scoring]] · [[customers]] · [[sop-quote-creation]] · [[alerts]]
