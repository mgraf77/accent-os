---
type: module
slug: labels
title: Labels Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004]
confidence: medium
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Labels Module

**File**: `js/labels.js`
**Pattern**: compact-CRUD module per [[ADR-002]] and [[ADR-004]]

## Functions

- `sbLoadLabelBatches()`
- `sbSaveLabelBatch()`
- `labels()`
- `renderLabels()`
- `toggleLblSel()`
- `lblSelectAll()`
- `loadManualLabels()`
- `loadInventoryLabels()`
- `printLabels()`
- `saveLabelBatch()`
- `openLabelBatchHistory()`
- `loadBatchFromHistory()`

## Shell touchpoints

- Sidebar entry in index.html (CORE or INTELLIGENCE section)
- PAGE_META entry: `labels: {t:'...', s:'...'}`
- pages dispatcher: `labels` key
- Hydrate call in sbHydrate()

## Related

[[ADR-002]] · [[ADR-004]]
