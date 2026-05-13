# AccentOS — Runtime Bottleneck Matrix
_Last updated: 2026-05-13_

---

## Purpose

Documents every known runtime bottleneck in AccentOS — operations that are slow, CPU-heavy, or memory-intensive — with thresholds, detection methods, and mitigation status.

---

## Bottleneck Classification

| Class | Label | Description |
|---|---|---|
| NET | Network | Round-trip latency to external services |
| CPU | Compute | JavaScript CPU time in main thread |
| MEM | Memory | Heap pressure or GC pauses |
| DOM | DOM ops | Reflow, repaint, large innerHTML operations |
| IO | I/O bound | localStorage, IndexedDB |

---

## Active Bottlenecks

### B-01 — Sequential Hydration (27 Supabase round-trips)

| Attribute | Value |
|---|---|
| Class | NET |
| Location | `hydrateFromSupabase()` in index.html:666 |
| Threshold | WARN at 5000ms, OK at <2500ms |
| Typical | 800–2500ms (warm Supabase) |
| Cold-start | 5000–15000ms (Supabase cold-start after inactivity) |
| Detection | `window.__AOS_HYDRATE_MS__` |
| Status | Accepted — sequential is intentional (cross-dependencies) |
| Mitigation | None planned until >5000ms consistently |
| Future fix | Supabase RPC batch (single round-trip), saves ~70% |

**Why it's sequential:** `generateAlertsFromData()` must run after all loads. Several sbLoad* functions depend on earlier globals (VD must exist before sbLoadVendorScores). Race conditions in parallel loads would leave inconsistent state.

---

### B-02 — Vendor Ranking Weighted Score Computation

| Attribute | Value |
|---|---|
| Class | CPU |
| Location | `weightedScore()` + `rankVendors()` in index.html |
| Input size | 478 vendors × 14 categories = 6,692 compute operations |
| Typical | <50ms for full ranking (imperceptible) |
| Threshold | WARN at 500ms (never seen) |
| Detection | Manual `performance.now()` around `renderVendors()` |
| Status | Accepted — pure JS math, no async, fast enough |
| Future risk | Risk at 2000+ vendors |

---

### B-03 — Global Search Index (16 globals at query time)

| Attribute | Value |
|---|---|
| Class | CPU |
| Location | `computeGlobalSearch()` in js/global_search.js |
| Input size | All 16 T3 globals scanned on every keystroke |
| Throttle | 200ms debounce on input |
| Typical | <30ms per query at current data volume |
| Risk | Grows linearly with record count |
| Status | Accepted — debounce mitigates most risk |
| Future fix | Pre-built inverted index refreshed post-hydration |

---

### B-04 — Reports CSV Generation (All 19 at Once)

| Attribute | Value |
|---|---|
| Class | CPU + DOM |
| Location | `js/reports.js` |
| Input size | All T3 globals at current record counts |
| Typical | <200ms for any single report |
| Risk | If all 19 generated simultaneously: ~2–3s |
| Status | Accepted — reports are user-triggered, sequential per click |
| Future fix | Web Worker for large exports |

---

### B-05 — Internal Meetings Module Render

| Attribute | Value |
|---|---|
| Class | DOM |
| Location | `js/internal_meetings.js` (2,436 lines) |
| Risk | Largest module; complex nested render with agenda, action items |
| Typical | <100ms initial render |
| Status | Accepted — users don't navigate here frequently |
| Future fix | Virtual list for large meeting archives |

---

### B-06 — Health Check Async Schema Pings

| Attribute | Value |
|---|---|
| Class | NET |
| Location | `_renderSchemaSection()` in js/health.js |
| Operations | 2 Supabase pings (categories + profiles) |
| Typical | 200–800ms total |
| Status | Acceptable — runs async, runtime section shows immediately |
| Design | Two-phase render isolates this latency from immediate feedback |

---

### B-07 — Worker Probe Dual-Fetch

| Attribute | Value |
|---|---|
| Class | NET |
| Location | Worker probe IIFE in index.html (inline) |
| Operations | GET /v1/version, then GET / (if first returns non-JSON) |
| Typical | 150–600ms for single fetch; 300–1200ms if fallback needed |
| Threshold | WARN at 3000ms |
| Detection | `window.__AOS_WORKER_PROBE_MS__` |
| Status | Accepted — non-blocking, fires in parallel with page load |

---

### B-08 — Dashboard KPI Render (computeDailyBrief)

| Attribute | Value |
|---|---|
| Class | CPU |
| Location | `computeDailyBrief()` called from `dashboard()` in index.html |
| Operations | Scans PIPELINE, JOBS, INVENTORY, ALERTS, GOALS on each render |
| Typical | <20ms at current data volume |
| Status | Accepted — pure compute, fast |
| Future risk | If dashboard re-renders on a timer, CPU accumulates |

---

## Non-Bottlenecks (Monitored, Within Spec)

| Operation | Class | Reason not a bottleneck |
|---|---|---|
| `goTo()` routing | DOM | Pure DOM show/hide + function call; ~2ms |
| `toast()` | DOM | Single element creation, 3s auto-clear |
| CSV download | CPU + DOM | `Blob` creation is fast; browser handles actual download |
| `esc()` HTML escaping | CPU | String replace; called thousands of times; trivial |
| `buildSidebar()` | DOM | One-time render at boot; ~5ms |
| `applyRoleVisibility()` | DOM | Iterates MODULE_REGISTRY; ~2ms |

---

## Bottleneck Monitoring Protocol

### At Session Start
```javascript
// In browser console after full load:
window.__AOS_HYDRATE_MS__    // Should be <2500
window.__AOS_WORKER_PROBE_MS__ // Should be <600
_runtimeHealth()             // Full status object
```

### When Hydration is Slow
1. DevTools → Network → XHR → sort by Duration
2. Find the long request — note the REST path (e.g., `/categories?...`)
3. Supabase Dashboard → Logs → API → find that path → check response time
4. Check if the table has an index: Database → Tables → [name] → Indexes
5. If missing index: add via `sql/M##_add_index.sql`

### When Vendor Ranking is Slow
```javascript
const t0 = performance.now();
renderVendors($('pg-content'));
console.log('vendor render ms:', performance.now() - t0);
```

---

## Future Optimization Queue (Do Not Touch Yet)

| Optimization | Estimated gain | Risk | Prerequisite |
|---|---|---|---|
| Parallel sbLoad groups | 60–70% hydration reduction | Cross-dependency race conditions | Careful dependency mapping |
| Supabase RPC batch load | 70% hydration reduction | Complex SQL function to maintain | When hydration >5000ms consistently |
| Pre-built global search index | 90% search CPU reduction | Index staleness on data mutations | Not needed at current volume |
| Web Worker for reports | Eliminates main thread block | Postmessage serialization complexity | When reports exceed 10,000 rows |
| Virtual list for Internal Meetings | DOM render performance | High complexity implementation | When meeting archive >500 items |

---

_Update when new sbLoad* calls are added or when benchmarks exceed warning thresholds._
