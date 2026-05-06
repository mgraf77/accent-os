---
type: module
slug: inventory
title: Inventory Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004]
confidence: medium
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Inventory Module

**File**: `js/inventory.js`
**Pattern**: compact-CRUD module per [[ADR-002]] and [[ADR-004]]

## Functions

- `sbLoadInventory()`
- `sbBulkSaveInventory()`
- `sbDeleteInventoryItem()`
- `sbUpdateInventoryField()`
- `renderInventory()`
- `doBulkInventoryDelete()`
- `_invRow()`
- `downloadInvCsvTemplate()`
- `openInvCsvPaste()`
- `onInvFilePick()`
- `parseCsv()`
- `processInvCsvText()`
- `commitInvCsv()`
- `deleteInventoryItem()`
- `commitInventoryCell()`
- `commitInventoryQty()`

## Shell touchpoints

- Sidebar entry in index.html (CORE or INTELLIGENCE section)
- PAGE_META entry: `inventory: {t:'...', s:'...'}`
- pages dispatcher: `inventory` key
- Hydrate call in sbHydrate()

## Related

[[ADR-002]] · [[ADR-004]]
