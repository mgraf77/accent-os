---
type: module
slug: demand-forecast
title: Demand Forecast Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004]
confidence: medium
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Demand Forecast Module

**File**: `js/demand_forecast.js`
**Pattern**: compact-CRUD module per [[ADR-002]] and [[ADR-004]]

## Functions

- `computeDemandForecast()`
- `demandforecast()`
- `exportDemandReorderCsv()`

## Shell touchpoints

- Sidebar entry in index.html (CORE or INTELLIGENCE section)
- PAGE_META entry: `demandforecast: {t:'...', s:'...'}`
- pages dispatcher: `demandforecast` key
- Hydrate call in sbHydrate()

## Related

[[ADR-002]] · [[ADR-004]]
