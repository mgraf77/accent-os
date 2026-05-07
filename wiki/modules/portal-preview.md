---
type: module
slug: portal-preview
title: Portal Preview Module (Tracks 6.5 + 6.6)
sources: [source-build-intelligence]
related: [ADR-002, ADR-004, trade-partners, vendor-scoring, customers, jobs, deliveries, warranty, showroom-displays, inventory]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-07
---

# Portal Preview Module

**File**: `js/portal_preview.js`
**Pattern**: read-only staff-side simulator of external portal views, plus M41 access provisioning into `external_user_profiles`
**Sidebar route**: `portalpreview` (Owner, Admin only)

## Purpose

Phase 1 of the external partner portal program. Lets staff see exactly what a Trade Partner / Designer or a Vendor Rep will see at `portal.html` (Phase 2, magic-link Supabase auth) before public exposure. Also provisions portal logins by writing to `external_user_profiles` (requires `M41_external_portals.sql`).

## Functions

| function | role |
|----------|------|
| `portalpreview(c, actions)` | sidebar route; renders preview banner, mode picker (`trade` / `rep`), partner/rep dropdown, plus `Copy summary` + `🔗 Provision Access` topbar buttons |
| `_ppTradePicker()` | dropdown sourced from `TRADE_PARTNERS` excluding `inactive` |
| `_ppRepPicker()` | dropdown of distinct `v.rep || v.rg` values across `VD` |
| `_ppRender()` | dispatches to trade or rep renderer; empty-state if no `selectedId` |
| `_ppRenderTrade(body)` | trade card: 4 KPIs (active projects / quotes / pipeline value / upcoming deliveries) + my-quotes + my-projects + available-inventory list + Phase-2 roadmap footer |
| `_ppRenderRep(body)` | rep card: 4 KPIs (lifetime sales / avg score / tier breakdown / open coop $) + vendor table + open coop funds + showroom displays + open warranty claims |
| `_ppCopySummary()` | clipboard-copies a one-liner summary of the current preview |
| `_ppOpenProvision()` | modal: collects partner email (auto-fills from `p.email`) and explains the M41 dependency |
| `_ppDoProvision()` | POST to `/external_user_profiles?on_conflict=email` with `{email, portal_type, provisioned_by, linked_trade_partner_id|linked_rep_name}`; shows "run M41" hint on `does not exist` errors |

## View modes

- **Trade Partner / Designer**: keyed by `TRADE_PARTNERS.id`. Cross-references quotes / deals / jobs / deliveries by lowercased-name match against `linked_customer_id` (if set) else partner name. Inventory list = `INVENTORY` filtered to `qty_available > 0`, capped at 15 rows.
- **Vendor Rep**: keyed by distinct rep / rep-group string from vendors. Filters `COOP_FUNDS`, `SHOWROOM_DISPLAYS`, `WARRANTY_CLAIMS` by `vendor_id ∈ myVendors`. Loose deal-match scans `DEALS` title + notes for vendor-name substring. Tier + score read from `computeVendorTier` / `weightedScore` (see [[vendor-scoring]]).

## Provisioning payload

```json
{ "email": "...", "portal_type": "trade_partner|vendor_rep",
  "provisioned_by": "<CU.user_id>",
  "linked_trade_partner_id": "...",  // trade only
  "linked_rep_name": "..."           // rep only
}
```

`on-conflict=email` → re-provisioning is idempotent. Phase 2 portal at `${location.origin}/portal.html`.

## State

`portalPreview = {mode, selectedId}` — module-scoped. No persistent globals (read-only on the live data).

## Read dependencies

`TRADE_PARTNERS`, `VD` (vendors), `CUSTOMERS`, `QUOTES`, `DEALS`, `JOBS`, `DELIVERIES`, `INVENTORY`, `COOP_FUNDS`, `SHOWROOM_DISPLAYS`, `WARRANTY_CLAIMS`, `CU`. All guarded by `typeof !== 'undefined'`.

## Shell touchpoints

- Sidebar: `data-roles="Owner,Admin"` → `goTo('portalpreview')`
- PAGE_META: `portalpreview: {t:'Portal Preview', s:'Preview the future Trade + Rep portals'}`
- Dispatcher: `portalpreview` key in `pages` map
- Modal helpers: `openModal`, `closeModal`, `toast`, `esc`, `sbFetch`
- Audit events: none direct (provision goes through `sbFetch`)

## Phase 2 roadmap

Trade portal will add: inline quote requests, message account rep, delivery tracking, spec-sheet downloads, automatic designer-tier pricing. Rep portal will add: inline staff messaging, attribution-attached pipeline, coop claim requests, peer leaderboard.

## Related

[[ADR-002]] · [[ADR-004]] · [[trade-partners]] · [[vendor-scoring]] · [[customers]] · [[jobs]] · [[deliveries]] · [[warranty]] · [[showroom-displays]] · [[inventory]]
