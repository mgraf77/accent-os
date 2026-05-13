# AccentOS — Decomposition Intelligence Master
_Last updated: 2026-05-13 | Status: Living document — update after every extraction_

---

## Purpose

This document is the single source of truth for all intelligence about extracting code from `index.html` into external JS modules. It tracks what has been extracted, what can be extracted, what must stay inline, and why.

**Current file sizes:**
- `index.html`: ~7,800 lines (~750 KB)
- `js/` modules: 36 files, ~14,000 lines total
- Split trigger: 900 KB — index.html at ~83% of trigger

---

## Extraction History

| Version | What was extracted | File | index.html delta |
|---|---|---|---|
| v6.10.12 | Customers, Employees, Knowledge Hub, Jobs, POs, Calendar, Inventory, Price Book, Deal Optimizer | 9 files | −149 KB |
| v6.10.13 | Trade Partners | `js/trade_partners.js` | — |
| v6.10.14 | Warranty | `js/warranty.js` | — |
| v6.10.16 | Labels | `js/labels.js` | — |
| v6.10.17 | Deliveries | `js/deliveries.js` | — |
| v6.10.18 | Decision Engine | `js/decision_engine.js` | — |
| v6.10.19 | Competitive Pricing | `js/competitive_pricing.js` | — |
| v6.10.20 | Marketing Hub | `js/marketing.js` | — |
| v6.10.21 | Alerts | `js/alerts.js` | — |
| v6.10.25 | Demand Forecast | `js/demand_forecast.js` | — |
| v6.10.26 | Global Search | `js/global_search.js` | — |
| v6.10.27 | Reports | `js/reports.js` | — |
| v6.10.28 | Bulk Vendor Ops | `js/bulk_vendor_ops.js` | — |
| v6.10.29 | Activity Feed | `js/activity_feed.js` | — |
| v6.10.30 | Commission | `js/commission.js` | — |
| v6.10.31 | Pipeline Analytics | `js/pipeline_analytics.js` | — |
| v6.10.32 | Quick Actions | `js/quick_actions.js` | — |
| v6.10.33 | Portal Preview | `js/portal_preview.js` | — |
| v6.10.34 | Health Check | `js/health.js` | — |
| v6.10.35 | Inventory Analytics | `js/inventory_analytics.js` | — |
| v6.10.36 | Digest | `js/digest.js` | — |
| v6.10.38 | My Tasks | `js/my_tasks.js` | — |
| v6.10.56 | CSV Import helper | `js/csv_import.js` | — |
| v6.10.61 | Saved Filters | `js/saved_filters.js` | — |
| v6.10.62 | Bulk Select | `js/bulk_select.js` | — |
| v6.10.65 | Module Modes | `js/module_modes.js` | — |
| v6.10.74 | Internal Meetings | `js/internal_meetings.js` (2,436 lines — largest module) | — |

---

## Inline Architecture — What Stays in index.html

These are the "bones" that must remain inline. They are loaded before all external modules and are depended on by everything.

### Tier 0 — HTML Structure + CSS (~600 lines)
- All `<style>` rules
- All HTML markup (sidebar, topbar, modals, overlays, page containers)
- These cannot be extracted — they are the document itself

### Tier 1 — Core Runtime Primitives (~200 lines, lines ~795–900)
Must remain inline. All external modules depend on these being defined first:

| Symbol | Line | Why inline |
|---|---|---|
| `$()` | 795 | DOM access helper — used by every module |
| `qsa()` | 796 | querySelectorAll alias — used by every module |
| `esc()` | 797 | XSS-safe HTML escape — used by every module |
| `toast()` | 857 | Notification system — used by every module |
| `openModal()` | 882 | Modal system — used by every module |
| `closeModal()` | 888 | Modal close — used by every module |
| `switchTab()` | 889 | Tab navigation — used by every module |
| `v()` | 840 | Input value helper — used by quote/modal code |
| `csvStringify()` | 842 | CSV RFC4180 — used by every module with exports |
| `csvDownload()` | 848 | CSV trigger — used by every module with exports |

### Tier 2 — Auth + Session (~200 lines, lines ~498–718)
Must remain inline. Controls access to everything:

| Symbol | Why inline |
|---|---|
| `CU` | Current user — read by every module for role checks |
| `ROLES` | Role enum — used by auth + module visibility |
| `doLogin()` | Login flow — must execute before modules load |
| `tryRestoreSession()` | Session restore — runs at DOMContentLoaded |
| `activateApp()` | App activation — called once after auth |
| `doLogout()` | Session teardown — needs CU + sbAuthFetch |
| `deriveInitials()` | Name → avatar — called in both login paths |

### Tier 3 — Navigation + Registry (~120 lines, lines ~897–970)
Must remain inline. The page dispatcher is the routing layer for all modules:

| Symbol | Why inline |
|---|---|
| `MODULE_REGISTRY` | Source of truth for all pages — drives sidebar + PAGE_META + goTo |
| `PAGE_META` | Derived from registry — must exist before any goTo() call |
| `buildSidebar()` | Reads registry — called in activateApp() before modules exist |
| `goTo()` | Page dispatcher — calls `window[page]()` — must precede modules |
| `curPage` | Active page tracker — read by goTo + feedback + alert module |

### Tier 4 — Supabase Client Layer (~300 lines, lines ~1162–1305)
Must remain inline. Every module's `sbLoad*`/`sbSave*` functions call these:

| Symbol | Why inline |
|---|---|
| `SUPABASE_ANON_KEY` | Hard-coded JWT — needed by sbFetch on every request |
| `sbConfigured()` | Returns true if URL + key set in settings — checked everywhere |
| `sbFetch()` | Core REST client — used by all 36 modules |
| `sbAuthFetch()` | Auth REST client — used by login flow |
| `sbAuditLog()` | Audit writer — called by most modules |
| `getS()` / `setS()` | localStorage settings API — used everywhere |
| `jwtKey()` | JWT accessor — used by auth + fetch |

### Tier 5 — Worker + AI Primitives (~80 lines, lines ~800–840)
Must remain inline. AI modules depend on these constants and flags:

| Symbol | Why inline |
|---|---|
| `AOS_WORKER_BASE` | Worker URL — used by aiParseNotes, sendChat, vendor AI |
| `AOS_WORKER_URL` | Worker /v1/messages endpoint |
| `_aiWorkerReady()` | Preflight — called by all 3 AI surfaces |
| `_aiNotReadyHint()` | Error guidance — called by all 3 AI surfaces |
| `_runtimeHealth()` | Health summary — called from activateApp + health module |
| Worker probe IIFE | Fires at script parse time — must precede modules |

### Tier 6 — Vendor Data + Scoring (~2,500 lines, lines ~1858–4750)
The largest inline region. Core vendor intelligence — not yet extracted:

| Region | Lines (approx) | Extraction risk |
|---|---|---|
| `VD_RAW` vendor dataset | ~1858–2068 | LOW (pure data) — could become `js/vendor_data.js` |
| `VD` computed array | ~2070–2136 | LOW (pure transform) — follows VD_RAW |
| `CHANGELOG` | 2121 | LOW (managed via sbLoad) |
| `CAT_DEFS` scoring weights | ~2001–2020 | LOW (static config) |
| `RUBRIC_NUMERIC` etc. | ~3191–3270 | MEDIUM (large but self-contained) |
| Vendor render functions | ~2260–3950 | HIGH — deeply interleaved with inline state |
| Score detail functions | ~3155–3650 | HIGH — calls inline helpers extensively |
| Vendor detail modal | ~3695–3956 | HIGH — references inline globals |
| Rep outreach functions | ~3963–4750 | MEDIUM — mostly self-contained section |

### Tier 7 — Pipeline (~500 lines, lines ~5172–5720)
Not yet extracted:

| Region | Lines (approx) | Extraction risk |
|---|---|---|
| `STAGES` / `PROBABILITY_WEIGHTS` | 5172–5200 | LOW (static config) |
| `DEALS` state | 5181 | HIGH — mutated by many functions |
| computeDealProbability | 5197–5234 | LOW (pure function) — extractable |
| sbLoad/SaveDeal | 5235–5335 | MEDIUM — calls inline sbFetch |
| Pipeline render + deal modals | 5353–5680 | HIGH — complex DOM, inline globals |

### Tier 8 — Quote Generator (~700 lines, lines ~5682–6370)
Not yet extracted. Highest AI coupling:

| Region | Lines (approx) | Extraction risk |
|---|---|---|
| `QUOTES`, `QKB`, `LI`, `CQ` | 5682–5721 | HIGH — shared mutable state |
| `calcTrackHardware()` | 5728–5775 | LOW — pure function, extractable |
| Quote render + UI | 5779–5980 | HIGH — complex DOM, writes to LI |
| `aiParseNotes()` | 5981–6120 | MEDIUM — calls AOS_WORKER_URL inline |
| Track calculator | 6121–6180 | LOW — mostly self-contained |
| `saveQ()`, `deleteQ()`, exports | 6181–6370 | MEDIUM — calls sbSaveQuote inline |

### Tier 9 — Chat / AI Consultant (~200 lines, lines ~6371–6565)
Not yet extracted. Highest risk:

| Region | Lines (approx) | Extraction risk |
|---|---|---|
| `CHAT`, `chatMode` | 6371–6380 | HIGH — mutable session state |
| `sendChat()` | ~6371–6520 | HIGH — large function, inline deps |
| `renderChat()` | ~6520–6570 | MEDIUM — DOM renderer |

### Tier 10 — Management Dashboard + KPIs (~800 lines, lines ~7060–7740)
Not yet extracted:

| Region | Lines (approx) | Extraction risk |
|---|---|---|
| `mgmt()` dispatcher | 7060 | MEDIUM |
| System Status card | ~7100–7150 | LOW — recently hardened, self-contained |
| KPI functions | ~7169–7350 | MEDIUM — complex, reads many globals |
| Dashboard + Goals | ~7350–7743 | HIGH — reads all globals |
| `maybeAutoSnapshotKPIs()` | ~7234 | MEDIUM — calls sbFetch + reads KPIS |

---

## Extraction Priority Queue

### Priority 1 — Extract Now (LOW RISK, HIGH VALUE)
These reduce file size with near-zero coupling risk:

1. **`calcTrackHardware()`** (lines ~5728–5775, ~50 LOC) — pure function, no DOM, no globals except QKB. Move to quote section of `js/quotes.js` when that module is created.
2. **`computeDealProbability()`** (lines ~5197–5233, ~37 LOC) — pure function, reads only `PROBABILITY_WEIGHTS`. Safe extraction target.
3. **`buildRepOutreachEmail()`** (lines ~3963–4086, ~125 LOC) — mostly string construction. Limited DOM dependency.

### Priority 2 — Extract Soon (MEDIUM RISK, MEDIUM VALUE)
4. **Rep Outreach module** (lines ~4761–4900) — `repoutreach(container)` + helpers. Calls `openRepOutreach()`, `buildRepOutreachEmail()`. Extractable as `js/rep_outreach.js`.
5. **Changelog module** (lines ~4905–5060) — `renderChangelog()`, `revertChange()`, `exportChangeLog()`. Self-contained. Minor `CHANGELOG` global dependency.

### Priority 3 — Extract Later (HIGH RISK, plan carefully)
6. **Vendor render layer** — requires moving `VD`, `CAT_DEFS`, `RUBRIC_*` first. High mutation surface.
7. **Quote Generator** — depends on `AOS_WORKER_URL`, `sbSaveQuote`, `LI` mutable state. Needs state ownership decision first.
8. **Pipeline module** — `DEALS` mutable state shared with Daily Brief and Decision Engine.

### Do Not Extract (fundamental coupling)
- `$`, `qsa`, `esc`, `toast`, `openModal` — must be inline for module bootstrap
- `CU`, `doLogin()`, auth flow — session ownership
- `MODULE_REGISTRY`, `buildSidebar()`, `goTo()` — navigation kernel
- `sbFetch`, `sbConfigured`, `SUPABASE_ANON_KEY` — data layer root
- `AOS_WORKER_BASE`, probe IIFE — must fire before modules load

---

## Shared Global State Map

All globals in index.html that external modules READ or WRITE:

| Global | Type | Owner | Readers (modules) | Mutated by |
|---|---|---|---|---|
| `CU` | Object | index.html (auth) | ALL modules | login/logout only |
| `VD` | Array | index.html | vendors, bulk_vendor_ops, deal_optimizer, competitive_pricing, showroom_displays, warranty, jobs, pipeline | sbLoadVendorOverrides, sbLoadScoreStates |
| `CHANGELOG` | Array | index.html | activity_feed, vendors | sbLoadChangelog |
| `QUOTES` | Array | index.html | pipeline, reports, jobs, customers, decision_engine | sbLoadQuotes, saveQ |
| `DEALS` | Object (by stage) | index.html | pipeline_analytics, decision_engine, reports, alerts, dashboard | saveDeal, updDeal, delDeal |
| `CUSTOMERS` | Array | customers.js | pipeline, quotes, jobs, trade_partners, deliveries, decision_engine | sbLoadCustomers, sbSaveCustomer |
| `INVENTORY` | Array | inventory.js | price_book, demand_forecast, decision_engine, competitive_pricing, reports | sbLoadInventory |
| `PO_LINES` | Array | purchase_orders.js | demand_forecast, price_book | sbLoadPurchaseOrders |
| `WARRANTY_CLAIMS` | Array | warranty.js | alerts, reports, dashboard | sbLoadWarrantyClaims |
| `KPI_DEFINITIONS` | Array | index.html (mgmt) | reports | sbLoadKPIs |
| `KPI_SNAPSHOTS` | Array | index.html (mgmt) | reports | sbLoadKPIs, maybeAutoSnapshotKPIs |
| `GOALS` | Array | index.html (mgmt) | reports | sbLoadGoals |
| `COOP_FUNDS` | Array | index.html | alerts, dashboard, reports | sbLoadCoopFunds |
| `_activityLog` | Array | index.html | activity_feed | log() |
| `curPage` | String | index.html | alerts.js (bell rerender), module_modes | goTo() |

---

## Critical Coupling Chains

### Chain A — AI Parse Chain
```
aiParseNotes() ← $('q-no').value (DOM)
              ← AOS_WORKER_URL (inline const)
              ← _aiWorkerReady() (inline fn)
              ← getS('aos-api') (inline fn)
              → LI (mutates inline array)
              → renderLI() (inline fn)
              → updatePreview() (inline fn)
```
**Extraction risk:** HIGH — 6 inline dependencies in one function.

### Chain B — Daily Brief Hydration Chain
```
hydrateFromSupabase()
  → 26 sequential sbLoad* calls (inline + modules)
  → generateAlertsFromData() (alerts.js)
  → maybeAutoSnapshotKPIs() (inline)
  → sets window.__AOS_HYDRATE_MS__
```
**Risk if ordering changes:** HIGH — alerts generator must run after all data loads.

### Chain C — Module Load Chain
```
index.html inline script (Tier 1–10) finishes parsing
  → 36 <script src> tags load synchronously
  → Each module reads globals from inline script
  → DOMContentLoaded fires AFTER all scripts parsed
  → tryRestoreSession() / activateApp() / hydrateFromSupabase()
```
**Risk:** If any inline global referenced before declaration, ReferenceError. Current script order is safe.

### Chain D — Role Visibility Chain
```
activateApp()
  → buildSidebar() (generates data-roles attributes)
  → applyRoleVisibility(CU.role) (reads data-roles)
  → applyModuleModesAfterHydrate() (module_modes.js)
```
**Critical:** buildSidebar MUST run before applyRoleVisibility. Current order is correct.

---

## Extraction Safety Protocol

Before extracting any function:

1. **Grep all callers:** `grep -rn "functionName(" js/ index.html`
2. **Trace all globals it reads:** list every bare identifier it accesses
3. **Trace all globals it writes:** list every mutation
4. **Check DOM IDs it reads/writes:** `grep -n "\$('id-name')" in function body`
5. **Verify no duplicate declaration:** only one `function X()` in entire codebase
6. **Test: extract → verify syntax → grep for the extracted name → confirm old inline removed**

Minimum viable extraction: move function to new file, add `<script src>` after current last tag, verify no breakage.

---

_Document complete. Update extraction history after each extraction. Update risk assessments as the codebase evolves._
