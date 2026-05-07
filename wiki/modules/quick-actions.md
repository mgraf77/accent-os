---
type: module
slug: quick-actions
title: Quick Actions Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004, customers, jobs, purchase-orders, trade-partners, warranty, showroom-displays, deliveries, calendar, vendor-scoring, global-search]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-07
---

# Quick Actions Module

**File**: `js/quick_actions.js` (v6.10.32)
**Pattern**: topbar `+` button → role-aware dropdown → navigate-then-invoke each module's existing `openX(null)` opener
**Sidebar route**: none — helper module (topbar-injected button)

## Purpose

Single-click new-record creation across every module from any page. Topbar `+` button opens a dropdown of 13 quick-create actions, filtered by `CU.role`. Each entry navigates to the target page first (if not already there), then invokes the module's standard "open empty edit modal" handler 100 ms later — same `setTimeout` pattern as the Quote→Job / Deal→Job converters in [[jobs]].

## Functions

| function | role |
|----------|------|
| `_qaInjectButton()` | DOM-mounts `#qa-btn` before `#bell-host` in topbar; appends `#qa-dropdown` to `body`; wires outside-click closer |
| `toggleQuickActions()` | branch on `_qaOpen` → `_qaOpen2()` or `_qaClose()` |
| `_qaOpen2()` | filter `QA_ITEMS` by role, paint dropdown, position relative to button via `getBoundingClientRect`, cache filtered list to `window._qaItemsCached` |
| `_qaClose()` | hide dropdown, flip `_qaOpen=false` |
| `qaActivate(idx)` | resolve item from cache, close dropdown, navigate via `goTo(it.page)` if `curPage` differs, then call `_qaInvoke(it)` after 100 ms |
| `_qaInvoke(it)` | flip `window.vSection` if `subTab` set + render vendors, then call `window[it.fn](it.arg)` if function exists |

## QA_ITEMS registry (13)

| label | icon | roles | page | fn (`arg=null`) |
|-------|------|-------|------|----|
| New Deal | ◈ | Owner/Admin/Manager/Sales | `pipeline` | `openAddDeal` |
| New Quote | ◻ | Owner/Admin/Manager/Sales | `quotes` | — (page landing only) |
| New Customer | ☻ | Owner/Admin/Manager/Sales | `customers` | `openCustomerEdit` |
| New Job | ▤ | + Warehouse | `jobs` | `openJobEdit` |
| New PO | ⌧ | Owner/Admin/Manager | `purchaseorders` | `openPOEdit` |
| New Trade Partner | ◆ | Owner/Admin/Manager/Sales | `tradepartners` | `openTradePartnerEdit` |
| New Warranty Claim | ⚠ | + Warehouse | `warranty` | `openWarrantyEdit` |
| New Showroom Display | ▣ | Owner/Admin/Manager/Sales | `showrooms` | `openShowroomEdit` |
| New Delivery | ▶ | + Warehouse | `deliveries` | `openDeliveryEdit` |
| New Article | ⚡ | + Warehouse | `knowledge` | `openArticleEdit` |
| New Calendar Event | ▦ | + Warehouse | `calendar` | — (page landing only) |
| New Co-op Fund | % | Owner/Admin/Manager/Sales | `vendors` | `openCoopEdit` (via `subTab:'coop'`) |
| New Vendor | ◇ | Owner/Admin/Manager | `vendors` | `openAddVendor` |

Items missing `fn` (Quote, Calendar) rely on landing-on-page being the new-X experience.

## State

`QA_ITEMS` (static const), `_qaOpen` (bool), `window._qaItemsCached` (filtered subset for activation lookup by index).

## Read dependencies

`CU.role` from auth shell. `curPage`, `goTo`, `esc`, `$`, `renderVendors` from inline shell. `window.vSection` for vendor sub-tab handoff. Each `it.fn` is `typeof === 'function'` guarded.

## Consumers

Not a typical consumer pattern — `QA_ITEMS` calls into [[customers]], [[jobs]], [[purchase-orders]], [[trade-partners]], [[warranty]], [[showroom-displays]], [[deliveries]], [[vendor-scoring]] (via `openAddVendor` + `openCoopEdit` + vendor sub-tab), pipeline (`openAddDeal`), and the Knowledge Hub. Complementary entry surface to [[global-search]] (`Ctrl/Cmd+K`).

## Shell touchpoints

- Topbar mount: `.topbar > div:last-child`, button inserted before `#bell-host`
- Dropdown: `#qa-dropdown` appended to `body`, positioned absolutely from button rect
- Inject lifecycle: `DOMContentLoaded` (or immediate if doc ready) + a 1500 ms re-inject for auth-resume rebuild
- No sidebar entry, no `PAGE_META`, no pages-dispatcher key
- Outside-click handler bound at body level — checks `closest('#qa-btn')` + `closest('#qa-dropdown')`
- No audit logging — each downstream `openX` opener emits its own audit on save

## Related

[[ADR-002]] · [[ADR-004]] · [[customers]] · [[jobs]] · [[purchase-orders]] · [[trade-partners]] · [[warranty]] · [[showroom-displays]] · [[deliveries]] · [[vendor-scoring]] · [[global-search]]
