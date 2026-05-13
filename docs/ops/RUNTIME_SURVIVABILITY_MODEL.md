# AccentOS — Runtime Survivability Model
_Last updated: 2026-05-13_

---

## Purpose

Defines how AccentOS behaves when components fail at runtime. The system is designed to degrade gracefully — a failed component should never bring down unrelated components.

---

## Survivability Tiers

| Tier | Name | Description |
|---|---|---|
| Full | **All systems operational** | Normal operation |
| Degraded-AI | **AI unavailable** | Quote AI, AI chat, vendor AI detail non-functional; all other modules work |
| Degraded-DB | **Supabase partially unavailable** | Some data stale/empty; read-only degradation |
| Degraded-Auth | **Auth unstable** | Users may be logged out; re-login restores full function |
| Minimal | **Offline / Supabase down** | In-memory data from last hydration; no saves succeed |
| Broken | **SPA itself fails** | Unrecoverable without redeploy |

---

## Per-Component Failure Impact

### Cloudflare Worker Failure

| Worker state | AI features | Other features | Detection |
|---|---|---|---|
| Probe returns stale version | Degraded-AI | Unaffected | `__AOS_WORKER_VERSION__ === 'stale'` |
| Probe returns non-JSON | Degraded-AI | Unaffected | `__AOS_WORKER_VERSION__ === 'error'` |
| Worker returns 401 | Degraded-AI | Unaffected | `_aiWorkerReady()` returns false |
| Worker returns 503 | Degraded-AI | Unaffected | `_aiWorkerReady()` returns false |
| Worker unreachable | Degraded-AI | Unaffected | Probe fetch throws; fallback to 'error' |

**Survivability:** AI failure is fully isolated. 25 of 26 modules continue working.

---

### Supabase REST Failure

| Supabase state | Impact | In-memory behavior |
|---|---|---|
| Cold-start delay (2–5s) | Slow hydration | All data loads after delay; normal |
| Single table 500 error | One module empty | `try/catch` in hydrateFromSupabase; other sbLoads continue |
| All tables 500 error | All modules empty | Each sbLoad fails independently; app boots with empty globals |
| Auth table unavailable | Login fails | `tryRestoreSession` catches; shows login form |
| RLS policy error | Empty result set (403) | `sbFetch` returns [] not error; module renders empty state |

**Survivability:** Each `sbLoad*()` is wrapped in its own try/catch. A failure in `sbLoadInventory()` does not prevent `sbLoadPipeline()` from running.

---

### Supabase Auth Failure

| Auth state | Impact | Recovery |
|---|---|---|
| JWT expired | `tryRestoreSession` fails → redirect to login | Re-login |
| Auth service down | Login blocked | Show error; retry when service restores |
| Profile row missing | Auth succeeds but no role | Handled by fallback role assignment |
| Session valid but stale | Hydration may fail auth checks | Re-login restores |

---

### Module Script Load Failure

If a `<script src="js/module.js">` fails to load (network error, 404):

| Module | Impact | typeof guard? |
|---|---|---|
| `customers.js` | Customer module shows blank | Yes — `typeof openCustomerEdit==='function'` in callers |
| `saved_filters.js` | Filter bar missing in 6 modules | Yes — `typeof savedFiltersBar==='function'` in all callers |
| `bulk_select.js` | Bulk actions missing in 4 modules | Yes — `typeof bulkSelBar==='function'` in all callers |
| `health.js` | Health check shows blank | No extra guard — goTo('health') calls health() which must exist |
| `internal_meetings.js` | Meetings module blank | No — isolated enough |
| Any T6 intelligence module | That module's analytics blank | No — isolated |

**All 36 modules load synchronously before DOMContentLoaded.** Script failure prevents the module from defining its functions. typeof guards in calling modules prevent `TypeError: X is not a function`.

---

### Browser localStorage Failure

| Feature | Depends on localStorage | Degraded behavior |
|---|---|---|
| JWT session | Yes (`jwt_token`) | Login required every page load |
| Dashboard pinning | Yes (`aos_pinned_modules`) | Defaults to standard layout |
| KPI snapshot dedup | Yes (`kpi_snapshot_*`) | May snapshot more frequently |
| Saved filters | Yes (per-module keys) | Filters reset each session |
| Module mode overrides | future (Supabase table) | No degradation |

---

## Isolation Boundaries

```
[Cloudflare Worker] ─── isolated ──→ AI features only
       │
       └── Failure does NOT affect: CRUD, analytics, intelligence modules
                                    or any Supabase operations

[Supabase REST] ────── isolated ──→ each sbLoad* has own try/catch
       │
       └── Failure of one table does NOT affect: other table loads
           App boots with partial/empty data; no unhandled exceptions

[Module Scripts] ───── isolated ──→ typeof guards in callers
       │
       └── Failure of one script does NOT affect: other modules
           Only that module's UI becomes non-functional

[LocalStorage] ─────── isolated ──→ only convenience features
       │
       └── Failure does NOT affect: core functionality
           JWT fallback: requires re-login
```

---

## Survivability Verification Tests

To verify each isolation boundary:

### Test 1 — Worker isolation
```javascript
// In console, simulate worker failure:
window.__AOS_WORKER_VERSION__ = 'stale';
window.__AOS_WORKER_ENV_KEY_READY__ = false;
// Verify: AI features show error; other modules unaffected
```

### Test 2 — Empty hydration
```javascript
// In console, after full load:
VD = []; PIPELINE = []; CUSTOMERS = [];
goTo('customers');  // Should show empty state, not crash
goTo('pipeline');   // Should show empty state, not crash
goTo('vendors');    // Should show empty state, not crash
```

### Test 3 — Auth disruption
```javascript
// Clear JWT and reload:
localStorage.removeItem('jwt_token');
location.reload();
// Should show login screen, not crash
```

---

## Graceful Degradation Design Rules

1. **Every sbLoad\* is independently try/catched.** Never abort hydration on a single failure.
2. **Every module render handles empty arrays.** `(data || []).map(...)` — never assume populated globals.
3. **AI gates use _aiWorkerReady() preflight.** Never attempt AI calls without checking worker state.
4. **typeof guards on helper scripts.** Never call a helper function without checking it exists.
5. **No global exception handlers removed.** The outer `try/catch` in each sbLoad is defensive.
6. **Boot continues on Supabase error.** `hydrateFromSupabase()` reaches `__AOS_HYDRATE_MS__` even if all loads fail.

---

_Review after any new sbLoad* function is added, or when new module scripts are introduced._
