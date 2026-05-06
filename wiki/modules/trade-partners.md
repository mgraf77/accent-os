---
type: module
slug: trade-partners
title: Trade Partners Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004]
confidence: medium
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Trade Partners Module

**File**: `js/trade_partners.js`
**Pattern**: compact-CRUD module per [[ADR-002]] and [[ADR-004]]

## Functions

- `sbLoadTradePartners()`
- `sbSaveTradePartner()`
- `sbDeleteTradePartner()`
- `sbUpdateTradePartnerField()`
- `commitTradePartnerCell()`
- `sbBulkSaveTradePartners()`
- `tradepartners()`
- `renderTradePartners()`
- `doBulkTradePartnerDelete()`
- `openTradePartnerEdit()`
- `saveTradePartner()`
- `deleteTradePartnerConfirm()`
- `downloadTpCsvTemplate()`
- `openTpCsvPaste()`
- `onTpFilePick()`
- `processTpCsvText()`
- `commitTpCsv()`

## Shell touchpoints

- Sidebar entry in index.html (CORE or INTELLIGENCE section)
- PAGE_META entry: `tradepartners: {t:'...', s:'...'}`
- pages dispatcher: `tradepartners` key
- Hydrate call in sbHydrate()

## Related

[[ADR-002]] · [[ADR-004]]
