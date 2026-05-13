# AccentOS — Startup Performance Profile
_Last updated: 2026-05-13_

---

## Overview

AccentOS startup is dominated by two sequential async operations: **session restore** and **hydration**. Understanding this profile enables targeted optimization and helps distinguish normal latency from genuine problems.

---

## Measured Timing Breakdown

All timings are measured via `performance.now()` and exposed as `window.__AOS_*` flags.

| Phase | Measured? | Flag | Typical | Warning |
|---|---|---|---|---|
| HTML parse | No | — | 50–200ms | >500ms |
| Inline script execute | No | — | 10–50ms | >200ms |
| External module load (36 files) | No | — | 20–80ms | >300ms |
| Session restore (JWT + profile) | No | — | 100–300ms | >1000ms |
| activateApp (sync, sidebar build) | No | — | 5–20ms | >100ms |
| **Hydration (27 sbLoad calls)** | **Yes** | `__AOS_HYDRATE_MS__` | 800–2500ms | >5000ms |
| **Worker probe (GET /)** | **Yes** | `__AOS_WORKER_PROBE_MS__` | 150–600ms | >3000ms |
| Dashboard render | No | — | 20–80ms | >300ms |
| **Total to interactive** | **Partially** | Sum | 1200–3500ms | >8000ms |

---

## Hydration Bottleneck Analysis

`hydrateFromSupabase()` is the dominant startup cost. 27 sequential `await sbFetch()` calls, each a round-trip to Supabase.

### Why Sequential, Not Parallel?

Each `sbLoad*` call is awaited before the next starts. This is intentional:
1. `generateAlertsFromData()` must run AFTER all data is loaded
2. Some tables have dependencies (e.g., `sbLoadVendorScores` uses VD which must exist)
3. Race conditions in parallel loads could leave globals in inconsistent states

### Optimization Opportunities (Future, Not Now)

1. **Batch reads via RPC** — a single `supabase.rpc('load_session_data')` could return all tables in one round-trip. Estimated saving: 70% of hydration time. Risk: complex SQL function to maintain.

2. **Parallel loads for independent tables** — group independent sbLoad calls into `Promise.all()`. Safe candidates (no cross-dependencies):
   - `sbLoadCalendarEvents`, `sbLoadArticles`, `sbLoadLabelBatches` — fully independent
   - `sbLoadMarketingCampaigns`, `sbLoadMarketingAssets` — independent of each other

3. **Lazy hydration** — don't load module data until user first navigates to that module. Risk: "My Tasks" Daily Brief tile won't show data until user opens My Tasks.

4. **Cache with TTL** — store last hydration result in localStorage with a 5-minute TTL. Risk: stale data shown on second session.

**Current decision:** Sequential is correct. Optimization is premature until hydration consistently exceeds 5000ms.

---

## Worker Probe Timing

The worker probe fires during Phase 1 (inline script parse), as an async IIFE. It's non-blocking — the app continues loading while the probe runs.

### Probe Sequence:
1. Try `GET /v1/version` — newer workers expose this path
2. If non-JSON: try `GET /` — fallback probe
3. If both fail: set `__AOS_WORKER_VERSION__ = 'stale'`

### Timing vs. Dashboard Render:
- Probe takes 150–600ms
- Dashboard renders at end of hydration (~2000ms typically)
- **In normal conditions: probe completes BEFORE dashboard renders**
- **Edge case: very fast hydration + slow probe** — System Status card shows "probing…" state

This race is acceptable — the card shows a "probing" message rather than broken UI.

---

## Performance Instrumentation (Current)

Two lightweight timing points are active:

```javascript
// In hydrateFromSupabase():
const _hydrateT0 = performance.now();
// ... 27 sbLoad calls ...
window.__AOS_HYDRATE_MS__ = Math.round(performance.now() - _hydrateT0);

// In worker probe IIFE:
const _probeT0 = performance.now();
// ... fetch attempts ...
window.__AOS_WORKER_PROBE_MS__ = Math.round(performance.now() - _probeT0);
```

These are always logged via:
```
console.info('[aos-boot] hydration complete', { ms, ts })
console.log('[aos-worker]', { path, version, probe_ms })
```

And are readable via `_runtimeHealth()`:
```javascript
_runtimeHealth()
// → { worker: { probe_ms: 234 }, hydrate: { ms: 1847 }, ... }
```

---

## Supabase Cold-Start Pattern

Supabase projects "cold-start" after ~5 minutes of inactivity. First request may take 2–5 seconds while Postgres wakes.

**Symptom:** First login of the day is slow; second login immediately after is fast.

**Mitigation:** Not worth fighting. The cold-start is Supabase-internal and not actionable from the client.

**Detection:** `__AOS_HYDRATE_MS__ > 5000` AND the console shows one request taking >3000ms at position 1 (sbLoadCategories or sbLoadChangelog).

---

## Bottleneck Investigation Protocol

When hydration is slow:

1. Check `window.__AOS_HYDRATE_MS__` in console
2. Open DevTools → Network → XHR → sort by Duration
3. Find the slow request → note the table name
4. Check Supabase dashboard → Logs → API → that endpoint
5. Check if it has an index: Database → Tables → [table] → Indexes
6. If no index on the ORDER BY / WHERE field: add one (M## SQL migration)

---

## Performance Targets by Deployment Phase

| Phase | Hydration target | Notes |
|---|---|---|
| Development (M01–M44 applied) | <2000ms | Typical with 36 tables, low data volume |
| Production (100K+ rows) | <4000ms | Paginated loads + indexes needed |
| Production (500K+ rows) | Use RPC batch | Sequential sbLoad becomes untenable |

Current data volume: well within development phase targets.

---

_Update this document when new sbLoad calls are added to hydrateFromSupabase(), or when performance measurements deviate significantly from baselines._
