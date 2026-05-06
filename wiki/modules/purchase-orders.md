---
type: module
slug: purchase-orders
title: Purchase Orders Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004]
confidence: medium
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Purchase Orders Module

**File**: `js/purchase_orders.js`
**Pattern**: compact-CRUD module per [[ADR-002]] and [[ADR-004]]

## Functions

- `sbLoadPurchaseOrders()`
- `sbSavePurchaseOrder()`
- `sbUpdatePOField()`
- `commitPOCellSelect()`
- `sbDeletePurchaseOrder()`
- `purchaseorders()`
- `renderPOs()`
- `openPOEdit()`
- `renderPOLinesEditor()`
- `addPOLine()`
- `removePOLine()`
- `updatePOTotals()`
- `savePO()`
- `deletePOConfirm()`
- `receivePO()`
- `createPOFromQuote()`
- `_poFromQuotePick()`
- `_openPOFromQuoteGroup()`

## Shell touchpoints

- Sidebar entry in index.html (CORE or INTELLIGENCE section)
- PAGE_META entry: `purchaseorders: {t:'...', s:'...'}`
- pages dispatcher: `purchaseorders` key
- Hydrate call in sbHydrate()

## Related

[[ADR-002]] · [[ADR-004]]
