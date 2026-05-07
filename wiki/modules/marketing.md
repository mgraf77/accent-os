---
type: module
slug: marketing
title: Marketing Hub Module (Track 5.12)
sources: [source-build-intelligence]
related: [ADR-002, ADR-004, vendor-scoring, rubric-marketing-funds, pipeline-analytics, alerts]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-07
---

# Marketing Hub Module

**File**: `js/marketing.js` (M29 schema: `marketing_campaigns` + `marketing_assets`)
**Pattern**: 4-tab page; full CRUD on campaigns + asset library, ROI compute, inline status edit
**Sidebar route**: `marketing` (Owner, Admin, Manager)

## Purpose

Replaces the prior static placeholder. Tracks marketing spend, attribution, and the asset library in one place. Campaigns link to a vendor (for co-op / vendor-funded promos — see [[rubric-marketing-funds]]) and to discount metadata. Assets are a tagged content library (image, doc, video, link, template) optionally linked to a vendor + campaign.

## Tabs

| tab | renderer | content |
|------|----------|---------|
| Overview | `renderMktOverview` | 4 stat cards (active count / budget vs spent / ROI / leads-deals) + by-type breakdown + recent-activity click-through to edit |
| Campaigns | `renderMktCampaigns` | filterable + sortable table; inline `status` dropdown for senior roles; row-click → edit modal |
| Asset Library | `renderMktAssets` | grid of cards (icon by type) + search + filter + open-link button |
| Site Audit | `renderMktAudit` | static placeholder preserved from prior version: site-issues list (2026-03-18 audit) + agency status (Locally Lit, Agital) |

## Functions

| function | role |
|----------|------|
| `sbLoadMarketingCampaigns()` / `sbLoadMarketingAssets()` | GETs `?order=updated_at.desc&limit=500`; tolerant of missing M29 table |
| `sbSaveMarketingCampaign(rec)` | upsert; numeric coerce on budget / spent / discount_pct / discount_amount / leads / deals_won / revenue_attributed |
| `sbUpdateCampaignField(id, field, value)` | PATCH allow-list: `status`, `type`, `start_date`, `end_date`, `budget`, `spent`, `revenue_attributed`, `notes` |
| `commitCampaignCellSelect(select)` | inline-edit handler with optimistic UI + revert on failure + audit log |
| `sbDeleteMarketingCampaign(id)` / `sbDeleteMarketingAsset(id)` | hard delete |
| `sbSaveMarketingAsset(rec)` | upsert asset row |
| `marketing(el)` | sidebar route; renders tab strip + dispatches to active renderer via `mktTab` |
| `renderMktOverview(c)` | aggregates active count, totals, ROI = `(rev - spent) / spent`, recent 8 by `updated_at` |
| `renderMktCampaigns(c)` | filter (q + type + status) + sort (status order then start_date asc); ROI cell colored green ≥1, blue ≥0, accent <0 |
| `openCampaignEdit(campaignId)` | full modal: name + type + status + dates + budget/spent + channels + audience + linked vendor + collapsible promo block + collapsible attribution block + notes |
| `saveCampaign(campaignId)` | persists; channels and `promo_skus` parsed as comma-split arrays |
| `deleteCampaignConfirm(campaignId)` | confirm + delete + audit |
| `renderMktAssets(c)` | grid layout, icon map: `image:🖼 / document:📄 / video:🎬 / link:🔗 / template:📋 / other:📁` |
| `openAssetEdit(assetId)` / `saveAsset(assetId)` / `deleteAssetConfirm(assetId)` | asset CRUD; tags = comma-split |
| `renderMktAudit(c)` | static — see Site Audit row above |

## Campaign types + statuses

Types: `email`, `print`, `digital`, `social`, `event`, `promo`, `co_op`, `other`.
Statuses: `planned → active → complete | paused | cancelled` (sort weight `0/0/3/2/4`). Cancelled + complete rows render at 0.7 opacity.

## ROI math

`spent > 0 → roi = (revenue_attributed - spent) / spent`, else `null`. Card color: ≥100% → green, ≥0% → blue, negative → accent. Aggregate ROI at overview level uses sum(spent) and sum(revenue) excluding cancelled.

## State

`MARKETING_CAMPAIGNS`, `MARKETING_ASSETS`, `mktTab` (`overview|campaigns|assets|audit`), `mktCampFilter = {q,type,status}`, `mktAssetFilter = {q,type}`. Debounce: `window._mktDeb` / `window._astDeb` 200ms.

## Shell touchpoints

- Sidebar: `data-roles="Owner,Admin,Manager"` → `goTo('marketing')`
- PAGE_META: `marketing: {t:'Marketing Hub', s:''}`
- Dispatcher: `marketing` key in `pages` map
- Modal helpers: `openModal`, `closeModal`, `toast`, `esc`, `sbFetch`, `$`, `CU`
- Audit events: `campaign_create`, `campaign_edit`, `campaign_delete`, `campaign_<field>_edit`, `asset_create`, `asset_edit`, `asset_delete`

## Read dependencies

`VD` (vendors, for the linked-vendor dropdown), `CU` (role gate for inline status edit + `owner_id` stamp).

## Related

[[ADR-002]] · [[ADR-004]] · [[vendor-scoring]] · [[rubric-marketing-funds]] · [[pipeline-analytics]] · [[alerts]]
