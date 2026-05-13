# AccentOS — Runtime Observability V3
_Last updated: 2026-05-13_

---

## Purpose

Documents the complete observability surface of AccentOS at V3 of the runtime monitoring architecture. This doc is the definitive reference for what is measurable, where to find measurements, and how to interpret them.

---

## Observability Architecture

AccentOS uses a lightweight, no-dependency observability model:

- **Boot-time flags** set on `window` during startup (persist for the session)
- **Console log streams** with structured `[aos-*]` prefixes
- **`_runtimeHealth()`** — structured in-memory health object, readable from console
- **Health Check page** — visual display of the same data, with async schema pings
- **`scripts/status.sh`** — shell-level status report (Codespace/local only)

No external observability service (Datadog, Sentry, etc.) is integrated. Telemetry is local to the browser session.

---

## V3 Boot-Time Flags

All flags set on `window` during the boot sequence. Persist until page reload.

### Worker Probe Flags (set by probe IIFE, ~t=0)

| Flag | Type | Set when | Example value |
|---|---|---|---|
| `__AOS_WORKER_VERSION__` | string | Probe completes | `"v3-env-fallback"` / `"stale"` / `"error"` |
| `__AOS_WORKER_ENV_KEY_READY__` | boolean | Probe completes | `true` / `false` |
| `__AOS_WORKER_PROBE_MS__` | number | Probe completes | `234` |

### Hydration Flags (set by hydrateFromSupabase, ~t=1500ms)

| Flag | Type | Set when | Example value |
|---|---|---|---|
| `__AOS_HYDRATE_MS__` | number | Hydration complete | `1847` |

### Future Flags (planned, not yet implemented)

| Flag | Purpose |
|---|---|
| `__AOS_BOOT_COMPLETE_MS__` | Full boot-to-interactive time |
| `__AOS_HYDRATE_COLD_START__` | Boolean: true if Supabase cold-started |
| `__AOS_MODULE_LOAD_ERRORS__` | Array of failed script loads |

---

## Console Log Streams

All structured console output uses `[aos-*]` prefixes for grep-ability.

| Prefix | Source | Level | Content |
|---|---|---|---|
| `[aos-boot]` | hydrateFromSupabase() | `console.info` | `hydration complete {ms, ts}` |
| `[aos-worker]` | probe IIFE | `console.log` | `{path, version, probe_ms}` |
| `[aos-worker]` | probe IIFE | `console.warn` | Error details on probe failure |
| `[aos-health]` | health.js | `console.log` | Runtime section rendered |
| `[audit_log]` | activity_feed.js | `console.log` | `Loaded N entries` |
| `[pipeline_events]` | activity_feed.js | `console.log` | `Loaded N events` |
| `[kpi]` | index.html | `console.warn` | Auto-snapshot errors |

### Reading Logs in DevTools
```
DevTools → Console → filter by: [aos-
```
Shows only AccentOS structured logs, filtering out library noise.

---

## `_runtimeHealth()` API

The canonical observability function. Returns a snapshot of all V3 flags.

### Signature
```javascript
_runtimeHealth() → RuntimeHealthObject
```

### Return structure
```typescript
{
  worker: {
    state: 'HEALTHY' | 'WARN' | 'FAIL' | 'CRITICAL' | 'INFO',
    version: string,           // probe version string or 'stale'/'error'
    env_key_set: boolean,      // ANTHROPIC_API_KEY bound in worker
    probe_ms: number | null    // probe latency; null if not yet set
  },
  ai: {
    state: 'HEALTHY' | 'WARN' | 'FAIL',
    ready: boolean             // _aiWorkerReady() result
  },
  hydrate: {
    ms: number | null,         // hydration duration; null if not yet set
    state: 'HEALTHY' | 'WARN' | 'FAIL'
  },
  degraded: boolean,           // true if any subsystem is not HEALTHY
  ts: string                   // ISO timestamp of health check
}
```

### State Derivation

**Worker state:**
- `HEALTHY`: version = valid (not stale/error), probe_ms < 3000
- `WARN`: version = valid, probe_ms ≥ 3000
- `FAIL`: version = 'stale' or 'error'
- `CRITICAL`: version undefined (probe not yet complete, rare)

**AI state:**
- `HEALTHY`: worker HEALTHY + (env_key_set = true OR user key in localStorage)
- `WARN`: worker HEALTHY but no env key (user must supply own)
- `FAIL`: worker FAIL/CRITICAL

**Hydrate state:**
- `HEALTHY`: hydrate_ms < 5000
- `WARN`: hydrate_ms 5000–10000
- `FAIL`: hydrate_ms > 10000 or not set

---

## Health Check Page

The Health Check page (`goTo('health')`) renders the same data visually.

### Two-Phase Render

**Phase 1 (synchronous, ~0ms):** `_renderRuntimeSection(container)`
- Reads all `window.__AOS_*` flags immediately
- Renders 4-row severity table (Worker, AI, Hydration, DB)
- Uses color coding from RUNTIME_SEVERITY_MODEL.md

**Phase 2 (async, 200–800ms):** `_renderSchemaSection(container)`
- Pings Supabase categories and profiles tables
- Updates `#hc-schema-section` div in-place
- Shows per-table status (HEALTHY/FAIL)

### Forcing a Re-render

```javascript
// From console, force health page to re-fetch and re-render:
_hcRun(true)
```

This re-runs both phases — re-reads all flags and re-pings Supabase.

---

## `scripts/status.sh` — Shell-Level Observability

Available in the development environment (Codespace/local). Outputs a color-coded status report.

```bash
bash /workspaces/accent-os/scripts/status.sh
```

**Sections:**
1. Git status (branch, ahead/behind, uncommitted)
2. File sizes (index.html, js/, worker/)
3. Live worker probe (curls worker URL, shows state/latency/env_key)
4. Deployment status (workflow file, wrangler.toml)
5. Runtime docs verification (checks key doc files exist)
6. Build plan progress (counts [x] vs [ ] in BUILD_PLAN_CLAUDE.md)

**Thresholds:**
- index.html ≥ 675 KB (75% of 900KB limit): WARN
- index.html ≥ 810 KB (90% of 900KB limit): CRITICAL
- Worker probe latency > 3000ms: WARN

---

## Observability Gaps (Known)

| Gap | Impact | Future path |
|---|---|---|
| No `__AOS_MODULE_LOAD_ERRORS__` flag | Can't detect script load failures from health page | Add `onerror` handlers to script tags |
| No per-sbLoad timing | Can't identify which table is slow without DevTools | Add timing to each sbLoad, store in `__AOS_SBLOAD_TIMES__` |
| No real-user error capture | JavaScript errors not logged anywhere | Add `window.onerror` handler → Supabase `error_log` table |
| No cold-start detection | Slow hydration looks same as network issue | Add heuristic: if first sbLoad > 3s, set `__AOS_COLD_START__` |
| Health page not auto-refreshed | Probe result stales after page load | Add "Refresh" button or auto-probe every 5 min |

---

## Observability Runbook

### "Is AccentOS healthy right now?"
```javascript
_runtimeHealth()
// degraded: false → everything healthy
// degraded: true → check which subsystem has non-HEALTHY state
```

### "Why is AI not working?"
```javascript
window.__AOS_WORKER_VERSION__       // should be 'v3-env-fallback'
window.__AOS_WORKER_ENV_KEY_READY__ // should be true
_aiWorkerReady()                    // should return true
```

### "Is hydration slow today?"
```javascript
window.__AOS_HYDRATE_MS__
// < 2500: normal
// 2500-5000: acceptable
// > 5000: investigate (likely Supabase cold-start or slow table)
```

### "What version of the worker is live?"
```javascript
window.__AOS_WORKER_VERSION__   // from last probe
// Or: curl https://accentos-anthropic-proxy.mgraf77.workers.dev/
```

---

_Update when new observability flags or console streams are added._
