---
type: module
slug: reports
title: Reports Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004]
confidence: medium
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Reports Module

**File**: `js/reports.js`
**Pattern**: compact-CRUD module per [[ADR-002]] and [[ADR-004]]

## Functions

- `reports()`
- `collectReportDefs()`
- `downloadReport()`
- `buildReportRows()`
- `exportAllReports()`

## Shell touchpoints

- Sidebar entry in index.html (CORE or INTELLIGENCE section)
- PAGE_META entry: `reports: {t:'...', s:'...'}`
- pages dispatcher: `reports` key
- Hydrate call in sbHydrate()

## Related

[[ADR-002]] · [[ADR-004]]
