# AccentOS — Degraded Runtime Specification
_Last updated: 2026-05-13_

---

## Purpose

Specifies the exact expected behavior of AccentOS in each degraded state. Operators can verify whether the system is behaving correctly during an incident by comparing actual behavior to this spec.

---

## Degraded State 1: AI Unavailable

**Trigger:** Worker stale, API key missing, or worker returns 4xx/5xx

**Expected behavior:**

| Surface | Expected behavior |
|---|---|
| Quote AI Parse button | Clicking shows toast: "AI not available — check API key in Environment Settings" |
| AI Chat | Input blocked; shows inline "AI temporarily unavailable" message |
| Vendor AI Detail button | Clicking shows inline error: "AI unavailable" |
| All other modules | Fully functional — no degradation |
| Health Check page | Worker row shows WARN or FAIL with probe status |
| System Status card | AI row shows FAIL state |

**What should NOT happen:**
- Console `TypeError` from calling AI functions without guard
- Broken UI in non-AI modules
- Crash on navigating to Vendors or Quote pages

---

## Degraded State 2: Empty Data (Supabase Load Failures)

**Trigger:** All or some `sbLoad*()` calls fail during hydration

**Expected behavior per module:**

| Module | Behavior with empty data |
|---|---|
| Vendor Ranking | Shows "No vendors loaded" or empty table |
| Sales Pipeline | Shows "No deals" empty state |
| CRM / Customers | Shows "No customers" or empty table |
| Quote Generator | Shows empty quote; AI parse still functional |
| Jobs | Shows "No jobs" empty state |
| Inventory | Shows "No items" empty state |
| Dashboard | KPI tiles show 0 or "—"; alerts panel shows empty |
| Reports | CSV exports produce headers-only files |
| Global Search | Returns 0 results; no crash |
| All intelligence modules | "No data available" or empty tables |

**What should NOT happen:**
- `TypeError: Cannot read property '...' of undefined` from unguarded array access
- Crash on `VD.filter(...)` when `VD` is undefined or empty
- Infinite loading spinners without eventual empty state

---

## Degraded State 3: Partial Data (Individual Table Failures)

**Trigger:** One specific `sbLoad*()` fails; others succeed

**Expected behavior:**

The failure is isolated to the single table. All other modules with data show full functionality.

| Failed sbLoad | Affected module(s) | Unaffected modules |
|---|---|---|
| sbLoadPipeline | Pipeline, analytics, deal optimizer, commission | All 22+ others |
| sbLoadInventory | Inventory, demand forecast | All others |
| sbLoadCustomers | CRM, deliveries (customer names blank) | All others |
| sbLoadKPIs | Dashboard KPI tiles | All others |
| sbLoadAlerts | Dashboard alerts panel | All others |
| sbLoadVendorScores | Vendor ranking scores | Vendor listing still shows |

**What should NOT happen:**
- One sbLoad failure causing another module to crash
- Cascade failure through shared globals

---

## Degraded State 4: Slow Hydration (Supabase Cold-Start)

**Trigger:** Supabase cold-start after ~5 minutes of inactivity

**Expected behavior:**

| Phase | Behavior |
|---|---|
| 0–1s | Login screen or auth check in progress |
| 1–3s | Hydration in progress; no content visible yet |
| 3–8s | Slow first sbLoad (categories/changelog); app appears frozen |
| 8–15s | Remaining sbLoads complete quickly after cold-start |
| 15s+ | Full app loaded; `__AOS_HYDRATE_MS__` > 5000 |

**Operator action:** Wait. Do not reload during hydration — it restarts the cold-start cycle.

**Detection:** `window.__AOS_HYDRATE_MS__ > 5000` in console indicates cold-start.

---

## Degraded State 5: Auth Disruption

**Trigger:** JWT expires or Supabase Auth service interrupts session validation

**Expected behavior:**

| Event | System response |
|---|---|
| JWT expired | `tryRestoreSession()` fails → app shows login form |
| Auth service 500 | tryRestoreSession catches error → shows login form |
| Profile row missing | Auth succeeds, profile lookup returns empty → defaults applied |
| Re-login | Full session restore; hydration runs again |

**What should NOT happen:**
- App rendering logged-out state while showing data from previous session
- Stale `CU` object remaining in memory after logout

---

## Degraded State 6: Module Script Load Failure

**Trigger:** Browser fails to load a `<script src="js/module.js">` tag (network error, CDN issue)

**Expected behavior:**

| Scenario | Affected | Unaffected |
|---|---|---|
| `js/saved_filters.js` fails | Filter bar in 6+ modules absent | Core module functionality works |
| `js/bulk_select.js` fails | Bulk actions absent in 4 modules | Individual record actions work |
| `js/health.js` fails | Health Check page blank | All other modules work |
| Any CRUD module fails | That module's page blank | All other modules work |
| `js/alerts.js` fails | Alerts engine absent | Dashboard shows empty alerts panel |

**Detection:** DevTools → Network → filter by failed (red) requests → look for `js/*.js`

---

## Degraded Runtime State Indicator

The `_runtimeHealth()` function returns a machine-readable state object:

```javascript
_runtimeHealth()
// Example healthy:
{
  worker: { state: 'HEALTHY', version: 'v3-env-fallback', probe_ms: 234 },
  ai: { state: 'HEALTHY' },
  hydrate: { ms: 1847 },
  degraded: false,
  ts: '2026-05-13T10:00:00.000Z'
}

// Example degraded-AI:
{
  worker: { state: 'FAIL', version: 'stale', probe_ms: 3100 },
  ai: { state: 'FAIL' },
  hydrate: { ms: 1847 },
  degraded: true,
  ts: '2026-05-13T10:00:00.000Z'
}
```

`degraded: true` = at least one subsystem is not HEALTHY.

---

## Minimum Acceptable State (MAS)

AccentOS is considered "operational enough" for business use when:
- [ ] Auth works (login succeeds, session persists)
- [ ] At least 20 of 27 sbLoad* calls succeed (visible data in most modules)
- [ ] Quote Generator functional (with or without AI parse)
- [ ] Sales Pipeline readable (even if analytics modules blank)
- [ ] Customer records accessible

AccentOS is considered "degraded unacceptably" when:
- Auth is broken (nobody can log in)
- All data is empty (full Supabase failure)
- The SPA fails to load at all

---

_Update this spec when new modules are added or when new degraded states are observed in production._
