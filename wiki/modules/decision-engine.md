---
type: module
slug: decision-engine
title: Decision Engine Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004]
confidence: medium
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Decision Engine Module

**File**: `js/decision_engine.js`
**Pattern**: compact-CRUD module per [[ADR-002]] and [[ADR-004]]

## Functions

- `decisionengine()`
- `renderDecisionEngine()`
- `computeSalesDecisions()`

## Shell touchpoints

- Sidebar entry in index.html (CORE or INTELLIGENCE section)
- PAGE_META entry: `decisionengine: {t:'...', s:'...'}`
- pages dispatcher: `decisionengine` key
- Hydrate call in sbHydrate()

## Related

[[ADR-002]] · [[ADR-004]]
