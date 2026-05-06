---
type: module
slug: activity-feed
title: Activity Feed Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004]
confidence: medium
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Activity Feed Module

**File**: `js/activity_feed.js`
**Pattern**: compact-CRUD module per [[ADR-002]] and [[ADR-004]]

## Functions

- `sbLoadAuditLog()`
- `sbLoadPipelineEvents()`
- `activity()`
- `renderActivityFeed()`
- `_afTimeAgo()`
- `afRefresh()`

## Shell touchpoints

- Sidebar entry in index.html (CORE or INTELLIGENCE section)
- PAGE_META entry: `activityfeed: {t:'...', s:'...'}`
- pages dispatcher: `activityfeed` key
- Hydrate call in sbHydrate()

## Related

[[ADR-002]] · [[ADR-004]]
