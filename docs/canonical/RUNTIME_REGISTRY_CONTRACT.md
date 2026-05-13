# AccentOS — Runtime Registry Contract
_Last updated: 2026-05-13_
_Classification: CANONICAL — keep in sync with index.html boot sequence_

---

## Overview

`window.__AOS_RUNTIME__` is the canonical runtime state object for AccentOS. It is the single place to read live runtime state without recomputing from scattered flags.

All other `window.__AOS_*` flags are **aliases** kept for backwards compatibility. New code should read from `window.__AOS_RUNTIME__`.

---

## Schema

```js
window.__AOS_RUNTIME__ = {
  // Worker proxy state — written by the worker probe IIFE at boot.
  worker: {
    state:     'probing' | 'healthy' | 'deployed-no-secret' | 'stale',
    version:   string | null,   // e.g. 'v3-env-fallback'
    build:     string | null,   // e.g. '2026-05-11' (from worker WORKER_BUILD constant)
    probe_ms:  number | null,   // RTT of worker probe request
    env_key:   boolean | null,  // true = ANTHROPIC_API_KEY bound; null = stale/unreachable
  },

  // Hydration state — written by hydrateFromSupabase() after all sbLoad* calls complete.
  hydrate: {
    ms:  number | null,  // total hydration time in ms
    ts:  string | null,  // ISO timestamp of hydration completion
  },

  // Module render errors — appended by goTo() error boundary on each caught exception.
  module_errors: [
    { page: string, msg: string, ts: string }   // ts = ISO timestamp
  ],

  // Session boot timestamp — set once at script load.
  boot_ts: string,   // ISO timestamp

  // Computed degraded flag — set by _runtimeHealth() on each call.
  // true when worker is not healthy AND no AI key is configured.
  degraded: boolean,
}
```

---

## State Values

### `worker.state`

| Value | Meaning |
|---|---|
| `'probing'` | Probe in flight (initial default) |
| `'healthy'` | v3+ deployed, ANTHROPIC_API_KEY bound |
| `'deployed-no-secret'` | v3+ deployed, secret not bound |
| `'stale'` | v1/v2 worker, or probe fetch threw, or non-JSON response |

### AI readiness

Use `_aiWorkerReady()` — do NOT derive from `window.__AOS_RUNTIME__` directly. `_aiWorkerReady()` handles the optimistic `undefined` (probe in flight) case and the user-key override.

---

## Write Ownership

| Field | Written by | When |
|---|---|---|
| `worker.*` | Worker probe IIFE | Script load (async) |
| `hydrate.*` | `hydrateFromSupabase()` | After DOMContentLoaded + session restored |
| `module_errors` | `goTo()` catch block | On each module render error |
| `boot_ts` | Inline at script parse | Immediately at load |
| `degraded` | `_runtimeHealth()` | Each time `_runtimeHealth()` is called |

---

## Read Surface

```js
// In any module or console:
_runtimeHealth()                         // Full structured snapshot
window.__AOS_RUNTIME__                   // Live registry object
window.__AOS_RUNTIME__.module_errors     // Render error log
window.__AOS_RUNTIME__.worker.state      // 'healthy' | 'stale' | ...
window.__AOS_RUNTIME__.degraded          // true if AI unavailable + worker stale
```

---

## Legacy Aliases (backwards compat — still written)

| Alias | Canonical equivalent |
|---|---|
| `window.__AOS_WORKER_VERSION__` | `window.__AOS_RUNTIME__.worker.version` |
| `window.__AOS_WORKER_ENV_KEY_READY__` | `window.__AOS_RUNTIME__.worker.env_key` |
| `window.__AOS_WORKER_PROBE_MS__` | `window.__AOS_RUNTIME__.worker.probe_ms` |
| `window.__AOS_HYDRATE_MS__` | `window.__AOS_RUNTIME__.hydrate.ms` |

---

## Invariants

1. `window.__AOS_RUNTIME__` is always defined after script parse (initialized synchronously).
2. `worker.state` starts as `'probing'` and is written exactly once by the probe IIFE.
3. `module_errors` starts as `[]` and is only appended to, never cleared.
4. `hydrate.ms` is null until `hydrateFromSupabase()` completes. Dashboard reads it live.
5. `degraded` is recomputed on every `_runtimeHealth()` call — it is not authoritative until at least one call has occurred.
