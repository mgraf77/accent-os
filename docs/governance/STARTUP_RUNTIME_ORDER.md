# AccentOS — Startup Runtime Order
_Last updated: 2026-05-13_

---

## Overview

AccentOS has a strictly ordered startup sequence. Understanding this order is critical for debugging boot failures, adding new initialization steps, and reasoning about when each module's functions are available.

---

## Phase 0 — HTML Parse + CSS Apply

**When:** Immediately on page load.
**What happens:**
- Browser parses `<!DOCTYPE html>` through closing `</body>`
- All `<style>` rules applied
- Initial DOM constructed (login screen visible, `#app` hidden)
- No JavaScript has run yet

**Observable state:** Login screen visible. `#app.on` class absent.

---

## Phase 1 — Inline Script Execution (~lines 1–7757)

**When:** Synchronously during HTML parse, before DOMContentLoaded.
**What happens (in order):**

| Step | Lines (approx) | What runs |
|---|---|---|
| 1.1 | 498–505 | `ROLES` const, `deriveInitials()` defined |
| 1.2 | 509–630 | `doLogin()` defined, keydown listener attached |
| 1.3 | 630–665 | `tryRestoreSession()`, `activateApp()`, `hydrateFromSupabase()`, `doLogout()` defined |
| 1.4 | 720–795 | `sbCol`, `toggleSB()`, sidebar collapse handlers defined |
| 1.5 | 795–797 | `$`, `qsa`, `esc` primitives defined |
| 1.6 | 800–839 | Worker probe IIFE **FIRES** (async, non-blocking) |
| 1.7 | 840–856 | `v()`, `csvStringify()`, `csvDownload()` defined |
| 1.8 | 857–895 | `toast()` + dedup map, `openModal()`, `closeModal()`, `switchTab()` defined |
| 1.9 | 897–970 | `MODULE_REGISTRY`, `PAGE_META`, `buildSidebar()`, `goTo()` defined |
| 1.10 | 972–999 | Feedback system, `_activityLog`, `log()`, first `log()` call |
| 1.11 | 1002–1161 | `PRODUCT_TAXONOMY`, `PREFILL_VENDOR_CATS`, vendor data constants |
| 1.12 | 1162–1300 | `SUPABASE_ANON_KEY`, all `sb*` functions defined |
| 1.13 | 1305+ | `COOP_FUNDS`, sbLoad/SaveCoopFund, renderCoopTracker defined |
| 1.14 | ~1858–4750 | `VD_RAW`, `VD` computed, all vendor rendering functions defined |
| 1.15 | ~5172–5720 | Pipeline state/functions defined |
| 1.16 | ~5682–6370 | Quote state/functions defined |
| 1.17 | ~6371–7059 | Chat system, `sendChat()`, `renderChat()` defined |
| 1.18 | ~7060–7757 | Mgmt dashboard, KPIs, Goals, dashboard pinning, maybeAutoSnapshotKPIs defined |

**At end of Phase 1:** All inline globals, helpers, and functions are on `window`. The worker probe is running asynchronously in background.

---

## Phase 2 — External Module Load (~lines 7758–7800)

**When:** Synchronously after inline script, still before DOMContentLoaded.
**What happens:**

36 external `<script src="js/*.js">` tags load in order. Each module:
- Has access to ALL Phase 1 globals
- Attaches its own functions to `window`
- May declare module-level `let`/`const` state (attached to window implicitly)

**Load order:**
```
1.  customers.js          (CUSTOMERS var, sbLoadCustomers, renderCustomers)
2.  employees.js          (EMPLOYEES, sbLoadEmployees)
3.  knowledge_hub.js      (ARTICLES, sbLoadArticles)
4.  jobs.js               (JOBS, sbLoadJobs, createJobFromDeal)
5.  purchase_orders.js    (PO_LINES, sbLoadPurchaseOrders, createPOFromQuote)
6.  calendar.js           (CALENDAR_EVENTS, sbLoadCalendarEvents)
7.  inventory.js          (INVENTORY, sbLoadInventory)
8.  csv_import.js         (csvImportFlow helper — no state)
9.  vendor_score_import.js
10. price_book.js         (pure-compute, no state)
11. deal_optimizer.js     (pure-compute, no state)
12. trade_partners.js     (TRADE_PARTNERS, sbLoadTradePartners)
13. warranty.js           (WARRANTY_CLAIMS, sbLoadWarrantyClaims)
14. showroom_displays.js  (SHOWROOM_DISPLAYS, sbLoadShowroomDisplays)
15. labels.js             (LABEL_BATCHES, sbLoadLabelBatches)
16. deliveries.js         (DELIVERIES, sbLoadDeliveries)
17. decision_engine.js    (pure-compute, no state)
18. competitive_pricing.js (COMPETITOR_PRICES, sbLoadCompetitorPrices)
19. marketing.js          (MARKETING_CAMPAIGNS, MARKETING_ASSETS, sbLoad*)
20. alerts.js             (ALERTS, sbLoadAlerts, generateAlertsFromData)
21. demand_forecast.js    (pure-compute, no state)
22. global_search.js      (openGlobalSearch — indexes all globals)
23. reports.js            (renderReports — reads all globals)
24. bulk_vendor_ops.js    (bulk ops — reads VD)
25. activity_feed.js      (activity function — reads _activityLog)
26. commission.js         (commission calc)
27. pipeline_analytics.js (openPipelineAnalytics)
28. quick_actions.js      (quick action helpers)
29. portal_preview.js     (portalpreview)
30. health.js             (health page — reads sbConfigured, Supabase)
31. inventory_analytics.js (inventory analytics)
32. digest.js             (digest helper)
33. my_tasks.js           (MY_TASKS localStorage)
34. saved_filters.js      (savedFiltersBar — UI helper)
35. bulk_select.js        (bulkSelBar — UI helper)
36. module_modes.js       (module mode state + applyModuleModesAfterHydrate)
37. internal_meetings.js  (INTERNAL_MEETINGS, largest module, 2436 lines)
```

**At end of Phase 2:** All module functions exist. No data loaded yet.

---

## Phase 3 — DOMContentLoaded (line 7743)

**When:** After ALL script tags parsed (phases 1+2 complete).
**Sequence:**

```javascript
window.addEventListener('DOMContentLoaded', async () => {
  const restored = await tryRestoreSession();    // ← Step 3.1
  if (!restored) return;                         // ← show login, stop
  activateApp();                                 // ← Step 3.2
  await hydrateFromSupabase();                   // ← Step 3.3
  await applyModuleModesAfterHydrate();          // ← Step 3.4
  sbAuditLog('session_resume', 'auth');          // ← Step 3.5
  goTo('dashboard');                             // ← Step 3.6
});
```

### Step 3.1 — tryRestoreSession

- Reads `jwtKey()` from localStorage
- If JWT exists: validates via `/user` endpoint
- If valid: loads profile, sets `CU` object
- Returns `true` (restore) or `false` (show login)

**Failure modes:**
- JWT expired → returns false → login screen shown
- Supabase unreachable → catches → returns false
- Profile not found → clears JWT → returns false

### Step 3.2 — activateApp

- Hides login screen
- Shows `#app.on`
- Sets avatar + username in topbar
- Calls `buildSidebar()` → injects nav HTML into `#sb-nav`
- Calls `applyRoleVisibility(CU.role)` → hides nav items not matching role
- Sets up 2s deferred console.info(`[aos-health]`) timer

**Order constraint:** `buildSidebar()` MUST precede `applyRoleVisibility()`. Sidebar HTML needs `data-roles` attributes on `.ni` elements before gating hides them.

### Step 3.3 — hydrateFromSupabase

26 sequential `await sbLoad*()` calls. Ordered for correctness:

```
1.  sbLoadCategories()         → CAT_COLORS, vendorProductCats — needed by vendor render
2.  sbLoadChangelog()          → CHANGELOG — needed by score detail
3.  sbLoadParents()            → PARENT_COMPANIES, VENDOR_PARENTS, PARENT_BY_ID
4.  sbLoadScoreStates()        → score state overlay on VD
5.  sbLoadVendorScores()       → numeric scores on VD
6.  sbLoadVendorOverrides()    → tier overrides, notes, inactive flags on VD
7.  sbLoadQuotes()             → QUOTES array
8.  sbLoadCoopFunds()          → COOP_FUNDS array
9.  sbLoadCustomers()          → CUSTOMERS array
10. sbLoadEmployees()          → EMPLOYEES array
11. sbLoadCalendarEvents()     → CALENDAR_EVENTS
12. sbLoadArticles()           → ARTICLES
13. sbLoadJobs()               → JOBS
14. sbLoadInventory()          → INVENTORY
15. sbLoadPurchaseOrders()     → PO_LINES, PO_ITEMS
16. sbLoadTradePartners()      → TRADE_PARTNERS
17. sbLoadWarrantyClaims()     → WARRANTY_CLAIMS
18. sbLoadShowroomDisplays()   → SHOWROOM_DISPLAYS
19. sbLoadLabelBatches()       → LABEL_BATCHES
20. sbLoadDeliveries()         → DELIVERIES
21. sbLoadCompetitorPrices()   → COMPETITOR_PRICES
22. sbLoadMarketingCampaigns() → MARKETING_CAMPAIGNS
23. sbLoadMarketingAssets()    → MARKETING_ASSETS
24. sbLoadAlerts()             → ALERTS (existing, from DB)
25. sbLoadPipeline()           → DEALS (by stage)
26. sbLoadKPIs()               → KPI_DEFINITIONS, KPI_SNAPSHOTS
27. sbLoadGoals()              → GOALS

   [all 27 done]

→ generateAlertsFromData()    (MUST run AFTER all data loaded)
→ maybeAutoSnapshotKPIs()     (MUST run after KPIs loaded, Owner only)
→ window.__AOS_HYDRATE_MS__ = Math.round(performance.now() - _hydrateT0)
→ console.info('[aos-boot] hydration complete', {ms, ts})
```

**Critical ordering rules:**
- `generateAlertsFromData()` reads VD, CUSTOMERS, DEALS, QUOTES, INVENTORY, POs, WARRANTY_CLAIMS, SHOWROOM_DISPLAYS, DELIVERIES — must be LAST
- `maybeAutoSnapshotKPIs()` reads KPI_DEFINITIONS — must follow `sbLoadKPIs()`
- All sbLoad calls are wrapped in try/catch to prevent one failure from stopping others

**Typical duration:** 800–3,500 ms depending on network and data volume.

### Step 3.4 — applyModuleModesAfterHydrate

- Reads `module_modes.json` (or falls back to stored state)
- Reads USER_OVERRIDES from Supabase
- Applies visibility rules to sidebar entries
- Resolves permissions: hidden > user_deny > user_allow > mode_gate > role_gate

### Step 3.5 — goTo('dashboard')

- First page render
- Dashboard reads ALL loaded globals to compute stats
- System Status card reads `__AOS_WORKER_*` flags (probe may or may not be done)

---

## Phase 4 — Parallel: Worker Probe (ongoing)

**When:** Fires during Phase 1 (IIFE at line 808), runs asynchronously in parallel with all phases.
**May complete:** any time from 100ms to 6000ms after script load.

**Timeline:**
```
Phase 1 parse → probe fetch fires
                              ↓
                    (100–2000ms: network round trip)
                              ↓
                    window.__AOS_WORKER_VERSION__ set
                    window.__AOS_WORKER_ENV_KEY_READY__ set
                    window.__AOS_WORKER_PROBE_MS__ set
```

**Race condition:** If `goTo('dashboard')` renders the System Status card BEFORE the probe resolves, the card shows "probing…" state. The 2s deferred `_runtimeHealth()` console.info in `activateApp()` usually fires after the probe finishes for monitoring purposes.

**No action needed:** The System Status card reads these flags synchronously at render time. If dashboard is loaded after probe (normal), flags are already set.

---

## Startup Failure Modes + Remediation

| Failure | Phase | Symptom | Fix |
|---|---|---|---|
| Supabase not configured | 3.1 | Login screen: "Supabase not configured" | Settings → configure Supabase URL + key |
| Invalid credentials | 3.1 | Login: "Invalid credentials" | Check email/password |
| No profile found | 3.1 | Login: "No profile found" | Owner → Settings → Users → create profile |
| JWT expired | 3.1 (restore) | Login screen shows on reload | Re-login (expected behavior) |
| sbLoad* fails | 3.3 | Empty list on one page | Check console WARN for that table — run SQL migration |
| generateAlertsFromData fails | 3.3 | No alerts generated | Check console — likely missing table (run M##) |
| module_modes.json unreachable | 3.4 | All modules visible (safe fallback) | Check network tab for module_modes.json 404 |
| Worker probe fails | 4 | System Status shows "stale" | Merge integration/reconcile → main → deploy via Actions |

---

## Boot Timing Targets

| Phase | Target | Warning threshold |
|---|---|---|
| HTML parse → DOMContentLoaded | <500ms | >1000ms |
| tryRestoreSession | <200ms | >500ms |
| activateApp (sync) | <50ms | >200ms |
| hydrateFromSupabase | <2000ms | >5000ms |
| Worker probe | <1000ms | >3000ms |
| First dashboard render | <100ms | >500ms |
| **Total to interactive** | **<3000ms** | **>8000ms** |

`window.__AOS_HYDRATE_MS__` and `window.__AOS_WORKER_PROBE_MS__` surface actual measurements.

---

_Update this document when new sbLoad* functions are added, when the load order changes, or when new initialization steps are inserted._
