---
type: module
slug: pipeline-analytics
title: Pipeline Analytics Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004]
confidence: medium
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Pipeline Analytics Module

**File**: `js/pipeline_analytics.js`
**Pattern**: compact-CRUD module per [[ADR-002]] and [[ADR-004]]

## Functions

- `openPipelineAnalytics()`

## Shell touchpoints

- Sidebar entry in index.html (CORE or INTELLIGENCE section)
- PAGE_META entry: `pipelineanalytics: {t:'...', s:'...'}`
- pages dispatcher: `pipelineanalytics` key
- Hydrate call in sbHydrate()

## Related

[[ADR-002]] · [[ADR-004]]
