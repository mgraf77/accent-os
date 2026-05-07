---
type: module
slug: global-search
title: Global Search Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004, vendor-scoring, customers, jobs, inventory, purchase-orders, trade-partners, warranty, calendar, deliveries, alerts, marketing, showroom-displays]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-07
---

# Global Search Module

**File**: `js/global_search.js` (v6.10.26)
**Pattern**: pure-compute, in-memory cross-module index; no API, no schema, no persistence
**Sidebar route**: none — modal-only, opened by `Ctrl/Cmd+K`

## Purpose

Single-keystroke unified search across 16 in-memory module globals. Renders a focused modal with a debounced input, grouped results, and keyboard navigation (↑↓, Enter, Esc). Re-uses each module's existing detail-open helper for click-through, navigating first via `goTo()` then deferring 80 ms before invoking the opener.

## Functions

| function | role |
|----------|------|
| `openGlobalSearch()` | mount modal, focus `#gs-input`, render empty state |
| `globalSearchKey(e)` | keyboard handler: ↓/↑ move highlight, Enter activates, Esc closes |
| `repaintGsHighlight()` | repaint `[data-gs-row]` background; `scrollIntoView({block:'nearest'})` |
| `gsActivate(r)` | close modal, call `r.action()` (which usually navigates + opens a detail modal) |
| `renderGlobalSearch(q)` | re-renders `#gs-results` from `computeGlobalSearch(q)`; flat-indexes for keyboard nav |
| `_gsMatch(text, q)` | per-field score: 100 exact, 80 prefix, 60 first-char, decays with `indexOf` position; -1 miss |
| `_gsScoreObj(q, fields[])` | best score across fields |
| `computeGlobalSearch(q)` | build 16 groups, score each item, sort DESC, slice top `SEARCH_LIMIT_PER_GROUP=6` |

## Group index (16)

| group | global | scored fields | click-through |
|-------|--------|---------------|---------------|
| Vendors | `VD` | `n, web, pc, desc, rep|rg` | `openVendorDetail(v.id)` |
| Customers | `CUSTOMERS` | `name, company, email, phone, city, state` | `openCustomerDetail(c.id)` |
| Sales Pipeline | `DEALS{stage:[]}` (all stages) | `title, company, contact, notes, lead_source` | `openDeal(d.id, stageKey)` |
| Quotes | `QUOTES` | `id, customer, project, contact` | `showSaved()` |
| Inventory | `INVENTORY` | `sku, upc, description, vendor_name, bin, category` | navigates `vendors` → inventory tab |
| Jobs | `JOBS` | `job_number, project_name, customer_name, notes` | `openJobEdit(j.id)` |
| Purchase Orders | `POS` (+ `PO_LINES[id]`) | `po_number, vendor_name, notes, line.sku, line.description` | `openPOEdit(p.id)` |
| Trade Partners | `TRADE_PARTNERS` | `name, company, email, phone, partner_type` | `openTradePartnerEdit(t.id)` |
| Warranty | `WARRANTY_CLAIMS` | `claim_number, vendor_name, customer_name, product_description, issue_description` | `openWarrantyEdit(w.id)` |
| Calendar | `CAL_EVENTS` | `title, description, location, category` | `goTo('calendar')` |
| Knowledge Hub | `ARTICLES` | `title, body, category, tags[]` | `openArticleEdit(a.id)` |
| Co-op Funds | `COOP_FUNDS` | `vendor.n, fund_type, notes, earned_period` | `vendors` → coop tab |
| Showroom Displays | `SHOWROOM_DISPLAYS` | `display_name, vendor_name, location, contract_terms, notes` | `openShowroomEdit(d.id)` |
| Deliveries | `DELIVERIES` | `delivery_number, customer_name, address, driver, items_summary` | `openDeliveryEdit(d.id)` |
| Alerts | `ALERTS` | `title, body, type` | `goTo('alerts')` |
| Marketing Campaigns | `MARKETING_CAMPAIGNS` | `name, type, notes, promo_skus` | `goTo('marketing')` |

Every `typeof X !== 'undefined'` guarded — missing globals skipped silently.

## State

`SEARCH_LIMIT_PER_GROUP=6` (per-group cap), `_gsResults` (flat list for keyboard nav), `_gsSelected` (highlighted index).

## Read dependencies

All 16 module globals listed above. `openModal`, `closeModal`, `esc`, `goTo`, `$` from inline shell. Per-group click-through fns guarded with `typeof === 'function'`.

## Shell touchpoints

- Global key listener: `document.addEventListener('keydown', ...)` traps `Ctrl|Cmd+K` regardless of focus
- No sidebar entry, no `PAGE_META`, no pages-dispatcher key
- Renders inside the standard `openModal` shell

## Related

[[ADR-002]] · [[ADR-004]] · [[vendor-scoring]] · [[customers]] · [[jobs]] · [[inventory]] · [[purchase-orders]] · [[trade-partners]] · [[warranty]] · [[calendar]] · [[deliveries]] · [[alerts]] · [[marketing]] · [[showroom-displays]]
