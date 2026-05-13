# SECRET_MANAGEMENT_PLAN.md
> Generated: 2026-05-13 — DEPLOYMENT_EXECUTION_AND_SMOKE_VALIDATION_V1

---

## PROBLEM STATEMENT

The BigCommerce adapter (`js/bigcommerce_adapter.js`) currently:
1. Makes direct browser requests to `api.bigcommerce.com`
2. Stores the BC Access Token in `localStorage`
3. Sends `X-Auth-Token` from the browser

**Why this fails:**
- `api.bigcommerce.com` does not permit CORS from browser origins → every live BC API call fails
- `localStorage` is accessible to any JS running on the page → XSS vector
- Token visible in DevTools Network tab → credential exposure

---

## TARGET ARCHITECTURE

```
Browser (AccentOS SPA)
  │
  │  GET /bc/v3/catalog/products?limit=250
  │  (no auth header)
  ▼
Cloudflare Worker (accentos-anthropic-proxy)
  │  Reads: env.BC_STORE_HASH (Worker secret)
  │  Reads: env.BC_ACCESS_TOKEN (Worker secret)
  │  Adds:  X-Auth-Token: ${env.BC_ACCESS_TOKEN}
  │
  │  GET https://api.bigcommerce.com/stores/{hash}/v3/catalog/products?limit=250
  ▼
BigCommerce API
```

**Token never touches the browser. CORS handled by Worker. Credentials stored in Cloudflare secret store (encrypted at rest, not exposed via Wrangler output).**

---

## SECRETS INVENTORY

### Currently Active
| Secret | Surface | Scope |
|--------|---------|-------|
| `ANTHROPIC_API_KEY` | Cloudflare Worker binding | Anthropic API proxy |

### To Be Added
| Secret | Surface | Scope | Who sets it |
|--------|---------|-------|------------|
| `BC_STORE_HASH` | Cloudflare Worker binding | BigCommerce store identifier | Michael (M04) |
| `BC_ACCESS_TOKEN` | Cloudflare Worker binding | BigCommerce API auth | Michael (M04) |
| `CF_API_TOKEN` | GitHub Actions secret | Worker deploy automation | Michael |
| `CF_ACCOUNT_ID` | GitHub Actions secret | Worker deploy automation | Michael |

### Never Stored
| Credential | Why |
|-----------|-----|
| BC Access Token in `localStorage` | Eliminated by Worker proxy — browser never sees token |
| BC Access Token in source code | Never hardcoded |
| GA4 measurement_id in localStorage | GA4 uses client-side SDK — no secret needed |
| GSC, GMC API tokens | Server-side only when activated |
| Klaviyo Private API Key | Server-side only — never in browser |

---

## CLOUDFLARE WORKER PROXY DESIGN

### New Routes Added to Worker

```
GET  /bc/v2/*   → proxy to api.bigcommerce.com/stores/{hash}/v2/*
GET  /bc/v3/*   → proxy to api.bigcommerce.com/stores/{hash}/v3/*
POST /bc/v3/*   → proxy (for future write operations)
```

### Auth Flow
```
1. Browser → Worker:  GET /bc/v3/catalog/products (no auth)
2. Worker → BC:       GET /stores/{BC_STORE_HASH}/v3/catalog/products
                      X-Auth-Token: {BC_ACCESS_TOKEN}   ← injected by Worker
3. BC → Worker:       200 {products: [...]}
4. Worker → Browser:  200 {products: [...]}  (CORS headers added)
```

### Rate Limit Handling
The Worker passes through BC's `X-Rate-Limit-*` headers to the SPA so `bigcommerce_adapter.js` can honour the 429 backoff without needing the token.

### Worker Probe Update
GET / returns additional field: `bc_configured: Boolean(env.BC_STORE_HASH && env.BC_ACCESS_TOKEN)`
This lets `scripts/health-check.sh` verify BC readiness without exposing credentials.

---

## BIGCOMMERCE ADAPTER CHANGES REQUIRED

`js/bigcommerce_adapter.js` is modified to:
1. Call the Worker proxy instead of `api.bigcommerce.com` directly
2. Remove `X-Auth-Token` header (added by Worker)
3. Remove credential storage from `localStorage`
4. `bcConfigured()` → checks Worker probe `bc_configured` field instead of localStorage token presence

---

## GA4 / GSC / KLAVIYO / GMC (FUTURE)

| Adapter | Credential type | Recommended architecture |
|---------|----------------|--------------------------|
| GA4 | `measurement_id` only (client-side) | Public — safe in source code / Settings UI |
| GSC | Service account JSON | Worker proxy (never in browser) |
| Klaviyo | Private API key | Worker proxy (never in browser) |
| GMC | Service account JSON | Worker proxy (never in browser) |

**Current state:** GA4/GSC/Klaviyo/GMC adapters are stubs. No active credential flow. Safe to deploy as-is.

---

## ACTIVATION SEQUENCE (for Michael)

### Step 1 — Deploy updated Worker (auto via GitHub Actions on merge to main)
After `integration/reconcile-v2` merges to `main`, GitHub Actions detects `worker/anthropic-proxy.js` changed and deploys the updated Worker automatically (requires CF_API_TOKEN + CF_ACCOUNT_ID secrets).

### Step 2 — Set BC secrets in Cloudflare Worker (run from local terminal with wrangler)
```bash
wrangler secret put BC_STORE_HASH
# Prompt: enter your BigCommerce store hash (e.g. store-cwqiwcjxes)

wrangler secret put BC_ACCESS_TOKEN
# Prompt: paste BC API Access Token from:
# BigCommerce Admin → Settings → API Accounts → Create API Account → V2/V3 API Token
```

**Required BC API scopes:**
- Products: Read-only
- Categories: Read-only
- Orders: Read-only (for future revenue correlation)
- Information & settings: Read-only

### Step 3 — Verify Worker knows BC is configured
```bash
curl https://accentos-anthropic-proxy.mgraf77.workers.dev/
# Expected: {"version":"v4-bc-proxy","bc_configured":true,...}
```

### Step 4 — In AccentOS UI
Navigate to Ecommerce Intel → The module should show "↓ Sync" button instead of "⚙ Connect BC"

---

## SECURITY CONTROLS SUMMARY

| Control | Implemented |
|---------|------------|
| BC token never in browser | ✅ Worker proxy architecture |
| BC token never in localStorage | ✅ Removed from adapter |
| BC token never in source code | ✅ Cloudflare secret binding |
| CORS handled server-side | ✅ Worker adds CORS headers |
| Token rotation path | ✅ `wrangler secret put BC_ACCESS_TOKEN` (replaces in seconds) |
| Credential audit trail | ✅ Cloudflare Dashboard → Workers → Secrets |
| XSS credential theft prevented | ✅ No token in JS runtime |
