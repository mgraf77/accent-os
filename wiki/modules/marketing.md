---
type: module
slug: marketing
title: Marketing Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004]
confidence: medium
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Marketing Module

**File**: `js/marketing.js`
**Pattern**: compact-CRUD module per [[ADR-002]] and [[ADR-004]]

## Functions

- `sbLoadMarketingCampaigns()`
- `sbLoadMarketingAssets()`
- `sbSaveMarketingCampaign()`
- `sbUpdateCampaignField()`
- `commitCampaignCellSelect()`
- `sbDeleteMarketingCampaign()`
- `sbSaveMarketingAsset()`
- `sbDeleteMarketingAsset()`
- `marketing()`
- `renderMktOverview()`
- `renderMktCampaigns()`
- `openCampaignEdit()`
- `saveCampaign()`
- `deleteCampaignConfirm()`
- `renderMktAssets()`
- `openAssetEdit()`
- `saveAsset()`
- `deleteAssetConfirm()`
- `renderMktAudit()`

## Shell touchpoints

- Sidebar entry in index.html (CORE or INTELLIGENCE section)
- PAGE_META entry: `marketing: {t:'...', s:'...'}`
- pages dispatcher: `marketing` key
- Hydrate call in sbHydrate()

## Related

[[ADR-002]] · [[ADR-004]]
