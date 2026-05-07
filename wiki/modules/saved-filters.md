---
type: module
slug: saved-filters
title: Saved Filters Helper Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004, customers, jobs, inventory, deliveries, purchase-orders, trade-partners, warranty, showroom-displays]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-07
---

# Saved Filters Helper Module

**File**: `js/saved_filters.js` (v6.10.61)
**Pattern**: cross-cutting per-page filter persistence; LocalStorage-backed, render-time HTML helper, no UI of its own
**Sidebar route**: none — helper module

## Purpose

Persists named snapshots of each list page's filter object (e.g. `invFilter`, `jobFilter`) to LocalStorage so users reapply common filter combos in one click. Renders a chip row of saved sets + `+ Save filter` button, splice-able into any module's filter row HTML. Each consumer declares which filter fields to capture; the helper snapshots only those keys, so transient state (e.g. mid-render counters) doesn't leak in.

## Functions

| function | role |
|----------|------|
| `_sfReadAll()` | parse `localStorage[accentos_saved_filters]`; tolerant on corrupt JSON |
| `_sfWriteAll(obj)` | stringify + write the whole store back |
| `getSavedFilters(moduleKey)` | return `{name: {fields, saved_at}}` map for one module |
| `saveFilterSet(moduleKey, name, filterState, fields)` | snapshot only listed `fields` (or all keys if omitted); audit `saved_filter_create` |
| `deleteFilterSet(moduleKey, name)` | remove one set; clean up empty `moduleKey` bucket; audit `saved_filter_delete` |
| `applyFilterSet(moduleKey, name, applyFn)` | look up set, call `applyFn(fields)`; audit `saved_filter_apply` |
| `savedFiltersBar(opts)` | returns chip row + Save button HTML; stashes `currentFilter / applyFn / fields / resetState` in `window._sfCtx[moduleKey]` |
| `_sfApply(moduleKey, name)` | reset filter to `resetState` first (if provided), then merge saved set, then call `applyFn` |
| `_sfDelete(moduleKey, name)` | confirm + delete + re-render via context |
| `_sfSavePrompt(moduleKey)` | `prompt()` for name (40-char cap), save, re-render |

## Registration shape (consumer)

```js
savedFiltersBar({
  moduleKey: 'inventory',
  currentFilter: invFilter,
  applyFn: () => renderInventory($('pg-content')),
  fields: ['q','vendor','lowOnly','location'],
  resetState: {q:'',vendor:'',lowOnly:false,location:''}
})
```

`fields` whitelists which keys snapshot; `resetState` is merged into the live filter before reapply so chip apply is deterministic regardless of current state. `label` (default `'Saved:'`) overrides the chip-row prefix.

## Storage shape

```
localStorage['accentos_saved_filters'] = {
  [moduleKey]: {
    [name]: { fields: {…snapshot}, saved_at: ISO8601 }
  }
}
```

Single key for the entire app — one `JSON.parse` on every render. No quota guard — UI caps name at 40 chars and there's no soft cap on set count, but typical usage is <10 per module.

## State

LocalStorage `accentos_saved_filters`. In-memory `window._sfCtx{moduleKey: {currentFilter, applyFn, fields, resetState}}` rebuilt on each `savedFiltersBar()` call (so chip onclick handlers can find the live filter object). Reset-merge happens before apply to avoid chip combos compounding stale filter keys.

## Read dependencies

`esc`, `toast`, `sbAuditLog` from inline shell. No data globals.

## Consumers

[[customers]] (q/segment/type), [[jobs]] (q/status/priority), [[inventory]] (q/vendor/lowOnly/location), [[deliveries]] (q/status/when), [[purchase-orders]] (q/status/vendor), [[trade-partners]] (q/type/status), [[warranty]] (q/status/vendor), [[showroom-displays]] (q/status/vendor). Each consumer guards with `typeof savedFiltersBar==='function'?…:''` so the helper can be removed without breaking renders.

## Shell touchpoints

- No sidebar entry, no `PAGE_META`, no pages-dispatcher key
- Loaded after consumer modules in `index.html` so registration during render works
- Audit events: `saved_filter_create`, `saved_filter_apply`, `saved_filter_delete` (all three include `moduleKey` + `{name}` payload)

## Related

[[ADR-002]] · [[ADR-004]] · [[customers]] · [[jobs]] · [[inventory]] · [[deliveries]] · [[purchase-orders]] · [[trade-partners]] · [[warranty]] · [[showroom-displays]]
