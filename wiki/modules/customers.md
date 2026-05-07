---
type: module
slug: customers
title: Customers Module (Track 1.4 CRM)
sources: [source-build-intelligence]
related: [ADR-002, ADR-004, sop-quote-creation, pipeline-analytics, jobs, deliveries, warranty, alerts, my-tasks]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-07
---

# Customers Module

**File**: `js/customers.js` (extracted in v6.10.12 file split per [[ADR-004]])
**Pattern**: full CRUD on `customers` + `customer_interactions`, pure-compute RFM segmentation, name-match cross-module timeline
**Sidebar route**: `customers` (CORE) — Warehouse role blocked at module entry

## Purpose

CRM hub: customer directory, RFM-segmented detail view, merged activity timeline, CSV bulk import, and Customer → Deal preset conversion. Pure-name matching (lowercased, trimmed) joins customers to quotes / deals / jobs / deliveries / warranty without UUID FKs — UUID linkage is a follow-up but the schema already accepts it.

## RFM compute (`computeCustomerRFM`)

- `recency` = days since last activity (events sorted DESC, fallback `c.last_seen`)
- `frequency` = count of revenue events in last 365d
- `monetary` = sum of revenue $ in last 365d
- Events come from: `customer_interactions` + `QUOTES` (name-match) + `DEALS` (`won` value, others $0). 
- Segment thresholds: `VIP` = ≤90d + ≥$5K · `Active` = ≤180d · `Lapsed` = ≤365d · `Lost` = >365d · `Prospect` = no activity ever

## Functions

| function | role |
|----------|------|
| `sbLoadCustomers()` | GET `/customers?order=name.asc&limit=2000` |
| `sbLoadCustomerInteractions(cid)` | GET `/customer_interactions?customer_id=eq.<cid>&order=occurred_at.desc&limit=200`, caches under `CUSTOMER_INTERACTIONS[cid]` |
| `sbSaveCustomer(rec)` | upsert; `on_conflict=id` when editing |
| `sbDeleteCustomer(id)` | hard delete (interactions cascade per schema) |
| `sbSaveCustomerInteraction(rec)` / `sbDeleteCustomerInteraction(id)` | interaction CRUD |
| `sbUpdateCustomerField(id, field, value)` | PATCH with allow-list: `name`, `email`, `phone`, `type`, `address`, `notes`, `segment`, `lifecycle_stage` |
| `commitCustomerCell(input)` | inline-edit blur handler with optimistic UI + revert on failure + audit log |
| `sbBulkSaveCustomers(rows)` | CSV bulk import POST |
| `computeCustomerRFM(c)` / `segmentBadge(seg)` | RFM compute + colored badge |
| `customers(el, act)` | sidebar route; gates Warehouse role |
| `renderCustomers(el)` | 4-stat header + import card + filterable table; default sort = segment then recency |
| `doBulkCustomerDelete(ids)` | bulk delete via `bulkSel*`, senior roles only |
| `openCustomerDetail(cid)` | modal: profile + RFM + merged activity timeline |
| `createDealFromCustomer(cid)` | preset `{name, company, segment, value, related_customer_id}` → `openAddDeal('lead', preset)`; valueSeed = round(RFM monetary, 100) |
| `openCustomerEdit(cid)` / `saveCustomer(cid)` | full edit modal |
| `openCustomerInteractionEdit` / `saveCustomerInteraction` / `deleteCustomerInteraction` | timeline CRUD; on save bumps `c.last_seen` |
| `downloadCustCsvTemplate()` / `openCustCsvPaste()` / `onCustFilePick(input)` | CSV input surfaces |
| `processCustCsvText(text)` | parse + alias-map + duplicate detection (by name + `external_id`) + type enum normalization → preview modal |
| `commitCustCsv()` | strips `_dup` flag, bulk save, reload, render |

## Activity timeline

Merges 6 sources by name match: interactions + quotes + deals + jobs + deliveries + warranty. Sorted newest-first. Each row: icon (per kind) + label + date + body + amount + edit button (interaction only).

## State + role gates

`CUSTOMERS` (list), `CUSTOMER_INTERACTIONS[cid]` (per-customer cache), `custFilter` (q/segment/type). Warehouse → blocked. Sales+ → can edit + import. Owner/Admin/Manager → can bulk-delete.

## Related

[[ADR-002]] · [[ADR-004]] · [[sop-quote-creation]] · [[pipeline-analytics]] · [[jobs]] · [[deliveries]] · [[warranty]] · [[alerts]] · [[my-tasks]]
