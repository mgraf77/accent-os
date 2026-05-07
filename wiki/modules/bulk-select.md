---
type: module
slug: bulk-select
title: Bulk Select Helper Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004, customers, jobs, inventory, deliveries, warranty, trade-partners, showroom-displays]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-07
---

# Bulk Select Helper Module

**File**: `js/bulk_select.js` (v6.10.62)
**Pattern**: per-module checkbox state registry + sticky action bar; render-time HTML helpers, no UI of its own
**Sidebar route**: none — helper module

## Purpose

Cross-cutting multi-row selection for list pages. Each consumer registers a `moduleKey` + array of bulk-action descriptors; the helper renders checkboxes, header `select-all`, and a sticky cyan action bar that surfaces only when ≥1 row is selected. Confirmation prompts support `{n}` placeholder for selected-count interpolation.

## Functions

| function | role |
|----------|------|
| `bulkSelRegister(moduleKey, actions)` | bind `actions` array; init empty `Set` if first call |
| `bulkSelGetIds(moduleKey)` | return `[...Set]` of currently checked IDs |
| `bulkSelClear(moduleKey)` | wipe Set, uncheck DOM via `[data-bulk]` query, hide action bar |
| `bulkSelToggle(moduleKey, id, checkboxEl)` | per-row toggle driven by `<input>` change |
| `bulkSelToggleAll(moduleKey, ids, checkboxEl)` | header checkbox toggles all visible IDs |
| `bulkSelCheckbox(moduleKey, id)` | returns `<input type="checkbox" data-bulk=... value=...>` HTML |
| `bulkSelHeaderCheckbox(moduleKey, ids)` | header `<input>` HTML; stashes `ids` in `window._bulkSelVisible` so `toggleAll` knows what to flip |
| `bulkSelBar(moduleKey)` | sticky action-bar HTML with N-selected counter, action buttons, Clear button |
| `_bulkSelUpdateBar(moduleKey)` | live-update count text + `display:none` toggle without re-render |
| `bulkSelInvoke(moduleKey, actionId)` | confirm (interpolating `{n}`) → call `action.fn(ids)` |

## Action descriptor shape

```js
{id:'delete', label:'Delete', color:'outline', confirm:'Delete {n} SKUs?', fn: ids => doBulkInventoryDelete(ids)}
```

`color` matches `btn-<color>` Tailwind-style class (`outline`, `danger`, `primary`, etc.). `confirm` optional — omit to skip prompt. `fn` receives string-array of IDs.

## Render contract (consumer side)

1. Call `bulkSelRegister(key, actions)` near top of render fn.
2. Splice `${bulkSelBar(key)}` into the page header.
3. In `<thead>`, prepend `<th>${bulkSelHeaderCheckbox(key, filtered.map(x=>x.id))}</th>`.
4. In each `<tr>`, prepend `<td>${bulkSelCheckbox(key, r.id)}</td>`.

IDs are coerced to strings throughout — UUIDs, `J-####`, and numeric IDs are all safe.

## State

`_BULK_SEL{moduleKey: Set<string>}` (selection), `_BULK_ACTIONS{moduleKey: Action[]}` (registered actions), `window._bulkSelVisible{moduleKey: string[]}` (last-rendered ID list, used by toggle-all).

## Read dependencies

`esc` and `toast` from inline shell. No data globals.

## Consumers

[[customers]] (delete senior-only), [[jobs]] (mark-complete / mark-cancelled), [[inventory]] (bulk SKU delete), [[deliveries]] (bulk status), [[warranty]] (bulk status), [[trade-partners]] (bulk delete), [[showroom-displays]] (bulk delete).

## Shell touchpoints

- No sidebar entry, no `PAGE_META`, no pages-dispatcher key
- Loaded after most module scripts in `index.html` so consumers can `bulkSelRegister` during their render pass
- No audit logging — consumer's bulk fn is responsible for its own `sbAuditLog` call

## Related

[[ADR-002]] · [[ADR-004]] · [[customers]] · [[jobs]] · [[inventory]] · [[deliveries]] · [[warranty]] · [[trade-partners]] · [[showroom-displays]]
