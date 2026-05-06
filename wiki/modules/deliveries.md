---
type: module
slug: deliveries
title: Deliveries Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004]
confidence: medium
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Deliveries Module

**File**: `js/deliveries.js`
**Pattern**: compact-CRUD module per [[ADR-002]] and [[ADR-004]]

## Functions

- `sbLoadDeliveries()`
- `sbSaveDelivery()`
- `sbUpdateDeliveryField()`
- `commitDeliveryCellSelect()`
- `sbDeleteDelivery()`
- `deliveries()`
- `renderDeliveries()`
- `doBulkDeliveryStatus()`
- `doBulkDeliveryDelete()`
- `openDeliveryEdit()`
- `onDlvCustomerPick()`
- `saveDelivery()`
- `deleteDeliveryConfirm()`

## Shell touchpoints

- Sidebar entry in index.html (CORE or INTELLIGENCE section)
- PAGE_META entry: `deliveries: {t:'...', s:'...'}`
- pages dispatcher: `deliveries` key
- Hydrate call in sbHydrate()

## Related

[[ADR-002]] · [[ADR-004]]
