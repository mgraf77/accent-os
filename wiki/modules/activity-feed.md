---
type: module
slug: activity-feed
title: Activity Feed Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004, alerts, pipeline-analytics, vendor-scoring, my-tasks]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-07
---

# Activity Feed Module

**File**: `js/activity_feed.js` (v6.10.29)
**Pattern**: pure-compute merge of three event streams loaded on demand
**Sidebar route**: `activity` (gated Owner / Admin / Manager only)

## Purpose

Owner-facing unified audit trail. Pulls three streams — `vendor_changelog` (already in `CHANGELOG`), `audit_log` (action / module / metadata), `pipeline_events` (deal stage changes + notes) — and merges by timestamp DESC. No new schema. Lazy-loads audit + pipeline tables on first visit, then caches for 5 minutes.

## Functions

| function | role |
|----------|------|
| `sbLoadAuditLog(limit=500)` | GET `/audit_log?order=timestamp.desc`; tolerant of missing table |
| `sbLoadPipelineEvents(limit=500)` | GET `/pipeline_events?order=timestamp.desc`; tolerant of missing table |
| `activity(c, actions)` | sidebar route; lazy-loads if cache stale (>5 min); renders `Refresh` button |
| `renderActivityFeed(c, actions)` | merges 3 streams, applies `afFilter`, paints 4-stat header + filterable table; sorts newest-first; cap 1000 rows |
| `_afTimeAgo(ts)` | compact relative time (`now`, `5m`, `3h`, `2d`, `4mo`) |
| `afRefresh()` | clears `afLoadedAt`, re-fetches both streams, re-renders |

## Stream schemas

**Vendor change** (from `CHANGELOG`): `{ts, vendor, cat, oldVal, newVal, user}` — click-through reopens `vendors` page on `changelog` sub-tab.

**Audit** (`AF_AUDITS`): `{ts, user, action, module, metadata}` — detail line is first 3 metadata keys joined by ` · `, each value JSON-stringified and truncated to 30 chars.

**Pipeline** (`AF_PIPELINE`): `{ts, deal_id, event_type, from_stage, to_stage, payload, user}` — title shows first 8 chars of `deal_id`; click-through navigates to `pipeline`.

## Filters

`afFilter = {q, stream, user, daysBack:30}`. Stream values: `vendor_change`, `audit`, `pipeline`. Days back: 7 / 30 / 90 / 365. Search hay = `title + detail + user` (lowercased). Search input is debounced 200 ms via `window._afDeb`.

## Stat header

Counts per stream within `daysBack` window + active-user count (top 3 user-prefix list shown as substat).

## State

`AF_AUDITS`, `AF_PIPELINE`, `afFilter`, `afLoadedAt` (cache timestamp), `window._afEvents` (top-1000 stash for click-through indexing).

## Read dependencies

`CHANGELOG` from [[vendor-scoring]] — pre-loaded by inline shell. `sbConfigured`, `sbFetch`, `goTo`, `esc`, `$`, `toast` from inline shell. `window.vSection` + `renderVendors` for vendor-change click-through (driven via `setTimeout(80)` to let the page mount first).

## Shell touchpoints

- Sidebar: `index.html` line 369 — `<div class="ni" data-roles="Owner,Admin,Manager" onclick="goTo('activity')">` (icon `◷`)
- `PAGE_META.activity = {t:'Activity Feed', s:'Vendor changes · audit log · pipeline events'}`
- Pages dispatcher: `activity` key (line 759)
- No hydrate call — streams loaded on first `activity()` call
- Distinct from inline shell's `let activity=[]` array used by `log()` toast helper (different concern)

## Related

[[ADR-002]] · [[ADR-004]] · [[alerts]] · [[pipeline-analytics]] · [[vendor-scoring]] · [[my-tasks]]
