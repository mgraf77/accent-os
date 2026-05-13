# AccentOS — Worker Runtime Forensics
_Last updated: 2026-05-13_

---

## Purpose

Deep-dive forensics reference for the `accentos-anthropic-proxy` Cloudflare Worker. Goes beyond WORKER_RUNTIME_RECOVERY.md (quick ops) to document exactly how the worker resolves auth, what each response means, and how to trace failures end-to-end.

---

## Worker Identity

| Property | Value |
|---|---|
| Worker name | `accentos-anthropic-proxy` |
| Account | mgraf77 |
| URL | `https://accentos-anthropic-proxy.mgraf77.workers.dev` |
| Current version | `v3-env-fallback` |
| Current build | `2026-05-11` |
| Source | `worker/anthropic-proxy.js` in repo |
| Deploy trigger | GitHub Actions on push to main touching `worker/**` or `wrangler.toml` |

---

## Request Routing

```
Incoming request
  │
  ├── METHOD = OPTIONS → CORS preflight response (200, no Anthropic call)
  │
  ├── METHOD = GET, path = / (any GET)
  │    └── Version diagnostics response:
  │         {version, build, env_key_set, method: "GET"}
  │         env_key_set = !!env.ANTHROPIC_API_KEY
  │         No Anthropic call; no auth required
  │
  ├── METHOD = POST, path starts with /v1/
  │    ├── Resolve API key (priority order):
  │    │    1. x-api-key header from client (user-supplied)
  │    │    2. env.ANTHROPIC_API_KEY (Cloudflare secret binding)
  │    │    3. Neither → 503 ai_unconfigured
  │    │
  │    ├── Key resolved → proxy to api.anthropic.com/v1/[remainder]
  │    │    Headers forwarded: Content-Type, anthropic-version, x-api-key
  │    │    Body: forwarded verbatim (JSON)
  │    │
  │    └── Upstream response forwarded back to client with CORS headers
  │
  └── All other methods/paths → not explicitly handled (returns Cloudflare default 404)
```

---

## Auth Resolution Detail

The key resolution logic (v3):

```javascript
// Priority 1: client-supplied key (x-api-key header)
const clientKey = req.headers.get('x-api-key');

// Priority 2: env secret binding
const envKey = env.ANTHROPIC_API_KEY;

const apiKey = clientKey || envKey;

if(!apiKey){
  return json({
    error: 'ai_unconfigured',
    message: 'No API key. Bind ANTHROPIC_API_KEY secret in Cloudflare or supply x-api-key header.'
  }, 503);
}
```

**Priority 1 (client key):** Set in AccentOS Settings → Environment → Anthropic API Key. Stored in localStorage `aos_env_key`. Sent as `x-api-key` header on every AI request. This key overrides the env key — useful for dev/testing with a personal key.

**Priority 2 (env key):** Bound as a Cloudflare Worker secret. Not visible in code or logs. Set via `wrangler secret put ANTHROPIC_API_KEY` or Cloudflare dashboard. This is the "production" path — end users don't need to configure anything.

**Neither:** Returns 503 with `ai_unconfigured` error code. SPA detects this and shows "AI temporarily unavailable" message. Does NOT auto-clear the env key flag.

---

## Probe Response Forensics

The `GET /` probe response tells you everything about worker state:

```json
{
  "version": "v3-env-fallback",
  "build": "2026-05-11",
  "env_key_set": true,
  "method": "GET"
}
```

| Field | Value | Meaning |
|---|---|---|
| `version` | `v3-env-fallback` | Current build deployed. Stale if `v1` or `v2`. |
| `version` | `error` | Worker returned non-JSON (broken deploy) |
| `version` | `stale` | Probe failed — old worker or network error |
| `build` | `2026-05-11` | Build date. Stale build ≠ stale code; code controls behavior. |
| `env_key_set` | `true` | `env.ANTHROPIC_API_KEY` is bound. AI works without user key. |
| `env_key_set` | `false` | Secret not bound. Users must supply their own key. |
| `method` | `GET` | Confirmation this was a probe (GET), not a proxied call |

---

## SPA Worker Flag State Machine

The SPA's worker probe IIFE sets three flags:

```javascript
window.__AOS_WORKER_VERSION__       // string: version from probe, or 'stale', or 'error'
window.__AOS_WORKER_ENV_KEY_READY__ // boolean: env_key_set from probe, or false
window.__AOS_WORKER_PROBE_MS__      // number: probe latency in ms
```

### Flag Transitions

| Probe result | `__AOS_WORKER_VERSION__` | `__AOS_WORKER_ENV_KEY_READY__` |
|---|---|---|
| JSON with version | `"v3-env-fallback"` | `true` / `false` (from probe) |
| Non-JSON response | `"stale"` | `false` |
| Fetch throws (network) | `"error"` | `false` |
| Probe not yet complete | `undefined` | `undefined` |

### `_aiWorkerReady()` Logic

```javascript
function _aiWorkerReady(){
  const ver = window.__AOS_WORKER_VERSION__;
  const envKey = window.__AOS_WORKER_ENV_KEY_READY__;
  const userKey = localStorage.getItem('aos_env_key');
  
  // AI works if: probe succeeded AND (env key set OR user has their own key)
  if(ver && ver !== 'stale' && ver !== 'error'){
    if(envKey || userKey) return true;
  }
  return false;
}
```

**Result:** AI is available when:
- Worker probe returned valid JSON version (not stale/error)
- AND at least one of: env key bound (`env_key_set: true`) OR user has stored their own API key

---

## Failure Signatures and Traces

### Signature 1 — Stale Worker (v1/v2)

```bash
$ curl https://accentos-anthropic-proxy.mgraf77.workers.dev/
{"error":"Method not allowed"}   # or: "Missing x-api-key header"
```

**What happened:** Old code doesn't handle GET /. Probe fails → `__AOS_WORKER_VERSION__ = 'stale'`.  
**SPA behavior:** `_aiWorkerReady()` returns false; AI features blocked.  
**Fix:** Deploy v3 — GitHub Actions trigger.

---

### Signature 2 — Secret Not Bound

```bash
$ curl https://accentos-anthropic-proxy.mgraf77.workers.dev/
{"version":"v3-env-fallback","build":"2026-05-11","env_key_set":false,"method":"GET"}
```

**What happened:** v3 is deployed but `ANTHROPIC_API_KEY` secret is not bound.  
**SPA behavior:** `__AOS_WORKER_ENV_KEY_READY__ = false`. If user has no stored key: `_aiWorkerReady()` false; AI blocked. If user has stored key: AI works via Priority 1.  
**Fix:** Bind secret in Cloudflare dashboard or `wrangler secret put`.

---

### Signature 3 — Key Expired / Invalid (Anthropic 401)

```bash
$ curl -X POST https://accentos-anthropic-proxy.mgraf77.workers.dev/v1/messages \
  -H "Content-Type: application/json" \
  -d '{"model":"claude-sonnet-4-5","messages":[{"role":"user","content":"hi"}],"max_tokens":10}'
# Returns HTTP 401 from Anthropic upstream
```

**What happened:** Worker is healthy (v3, env key set), but the Anthropic key is expired or invalid.  
**SPA behavior:** AI call returns 401; SPA handler detects `/missing x-api-key/i` or `/invalid.*key/i` → clears `__AOS_WORKER_ENV_KEY_READY__`, shows hint toast.  
**Fix:** Rotate key in Anthropic console; update Cloudflare secret.

---

### Signature 4 — Rate Limited (Anthropic 429)

```bash
# HTTP 429 Too Many Requests from Anthropic upstream
```

**What happened:** Too many calls to Anthropic in a short period.  
**SPA behavior:** General error handler shows status code. No retry logic.  
**Fix:** Wait and retry. Consider adding exponential backoff to `aiParseNotes()` and `sendChat()`.

---

### Signature 5 — Worker Deployed, Wrong URL in SPA

```javascript
// In SPA console:
window.__AOS_WORKER_VERSION__   // → undefined (probe never resolved)
window.__AOS_WORKER_PROBE_MS__  // → undefined
```

**What happened:** `AOS_WORKER_BASE` in index.html points to wrong worker URL.  
**Trace:**
```bash
grep "AOS_WORKER_BASE" /home/user/accent-os/index.html
# Should be: accentos-anthropic-proxy.mgraf77.workers.dev
grep "^name" /home/user/accent-os/wrangler.toml
# Should be: name = "accentos-anthropic-proxy"
```
**Fix:** Align `AOS_WORKER_BASE` in index.html with `name` in wrangler.toml.

---

## Worker Logs (Cloudflare Dashboard)

Live request logs visible at:
```
Cloudflare Dashboard → Workers & Pages → accentos-anthropic-proxy → Logs
```

Each log entry shows:
- Request URL, method, headers (except secret values)
- Response status and body
- Runtime duration
- `env.ANTHROPIC_API_KEY` bound: shown as `[BOUND]` in variable panel, not value

**Note:** Secret values are NEVER shown in logs even with admin access.

---

## Worker Source Truth Table

When there's a discrepancy between what the probe says and what behavior users see, use this table:

| Probe says | User reports | Root cause |
|---|---|---|
| `v3-env-fallback`, `env_key_set:true` | AI not working | Anthropic key expired (check console for 401) |
| `v3-env-fallback`, `env_key_set:false` | AI not working | Expected — user needs personal key OR operator must bind secret |
| `stale` | AI not working | Worker not deployed — trigger GitHub Actions |
| `error` | AI not working | Network issue, or worker returning 500 — check Cloudflare logs |
| Probe times out | AI not working | Worker cold-start or Cloudflare edge issue — retry after 30s |

---

_Update after any worker incident, version change, or auth flow modification._
