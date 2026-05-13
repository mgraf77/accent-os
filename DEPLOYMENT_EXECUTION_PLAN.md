# DEPLOYMENT_EXECUTION_PLAN.md
> Generated: 2026-05-13 — DEPLOYMENT_EXECUTION_AND_SMOKE_VALIDATION_V1
> Release Candidate: integration/reconcile-v2
> Base: main @ e609662

---

## ARCHITECTURE AUDIT

### Deploy Surface Map

```
GitHub Repo (mgraf77/accent-os)
  └─ main branch
       ├─ Cloudflare Pages (SPA)           auto-deploy on every push to main
       │    URL: https://accent-os.pages.dev
       │    Deploys: index.html, js/*, css/*, static assets
       │    Trigger: GitHub webhook → Cloudflare Pages CI
       │    Build: static (no build step — raw HTML/JS served directly)
       │
       └─ Cloudflare Workers (AI proxy)   GitHub Actions on worker/** or wrangler.toml change
            URL: https://accentos-anthropic-proxy.mgraf77.workers.dev
            Deploys: worker/anthropic-proxy.js
            Trigger: .github/workflows/deploy-worker.yml
            Secrets: ANTHROPIC_API_KEY (Cloudflare secret binding — survives redeployments)
```

### Current Worker Routes

| Method | Path | Behavior |
|--------|------|----------|
| GET | / | Version probe (returns JSON) |
| OPTIONS | /* | CORS preflight |
| POST | /v1/* | Proxies to api.anthropic.com |

### Current Supabase Runtime Assumptions

| Assumption | Status |
|-----------|--------|
| SUPABASE_URL set by operator in Settings | ✅ Confirmed (sessionStorage `aos-sb-url`) |
| SUPABASE_ANON_KEY set by operator in Settings | ✅ Confirmed (sessionStorage `aos-sb-key`) |
| JWT auth via Supabase Auth | ✅ Confirmed (setJwt/jwtKey pattern) |
| RLS policies on all tables | ✅ M01 migration applied |
| `upsert_quote_with_lines` RPC present | ✅ M45 applied per operator confirmation |
| `updated_at` column on quotes table | ✅ M46 applied per operator confirmation |
| bc_products_cache, bc_categories_cache tables | ✅ M47 applied per operator confirmation |
| Ecommerce V2 tables | ✅ M48 applied per operator confirmation |

### Script Registration Integrity (integration/reconcile-v2)

| Script | Load order | Registration |
|--------|-----------|--------------|
| inline index.html | 1st — synchronous | MODULE_REGISTRY, sbFetch, activateApp |
| js/activity_feed.js | 2nd | activityFeed() |
| js/alerts.js | 3rd | alerts() |
| js/bulk_select.js | … | bulkSelBar() |
| js/module_modes.js | … | modulemodes() |
| js/internal_meetings.js | … | internalmeetings() |
| js/bigcommerce_adapter.js | 2nd-to-last group | bcConfigured(), BC — depends on nothing |
| js/ga4_adapter.js | after bc | GA4Adapter |
| js/gsc_adapter.js | after ga4 | GSCAdapter |
| js/klaviyo_adapter.js | after gsc | KlaviyoAdapter |
| js/gmc_adapter.js | after klaviyo | GMCAdapter |
| js/ecommerce_intelligence.js | last | ecommerce(), renderEcommerce() — depends on bcConfigured |

**DOMContentLoaded fires after all synchronous scripts complete. No race conditions.**

### ⚠ CRITICAL FINDING — BigCommerce CORS Architecture

**Current state of bigcommerce_adapter.js:**
- Calls `api.bigcommerce.com` directly from the browser
- Sends `X-Auth-Token` header from browser
- Stores BC Access Token in `localStorage`

**This is wrong for two reasons:**
1. **BigCommerce API does not allow CORS from browser origins.** Direct browser calls to `api.bigcommerce.com` will fail with CORS errors.
2. **Security: BC Access Token in localStorage is exposed** to XSS, browser extensions, and DevTools.

**The BC adapter will not function as currently written for live data access.**

**Resolution:** Route BC API calls through the Cloudflare Worker proxy. The Worker adds the `X-Auth-Token` server-side from a Cloudflare secret. The browser never sees the token. See SECRET_MANAGEMENT_PLAN.md.

**Deploy impact:** The current SPA is SAFE to deploy because `bcConfigured()` returns false when no credentials are stored — the module renders "Connect BC" UI and makes zero BC API calls. No CORS errors will occur until credentials are entered.

---

## DEPLOYMENT EXECUTION SEQUENCE

### Pre-deploy Gate (complete before any push to main)

- [x] M45 SQL applied (operator confirmed)
- [x] M46 SQL applied (operator confirmed)
- [x] M47 SQL applied (operator confirmed)
- [x] M48 SQL applied (operator confirmed)
- [ ] Worker updated with BC proxy endpoint (see SECRET_MANAGEMENT_PLAN.md)
- [ ] CF_API_TOKEN secret set in GitHub repo settings
- [ ] CF_ACCOUNT_ID secret set in GitHub repo settings

### Step 1 — Checkout integration branch

```bash
git checkout integration/reconcile-v2
git log --oneline -6   # verify 5 commits ahead of main
```

### Step 2 — Worker hardening (REQUIRED before deploy)

1. Update `worker/anthropic-proxy.js` to add BC proxy route (see Phase 2 work)
2. Update `wrangler.toml` to declare BC secrets (no values — just binding names)
3. Commit to `integration/reconcile-v2`

### Step 3 — Merge to main

```bash
git checkout main
git merge --no-ff integration/reconcile-v2 \
  -m "release(RC-1): reconcile-v2 — quote hardening + ecommerce intel + BC proxy"
git push origin main
```

**This immediately triggers Cloudflare Pages auto-deploy of the SPA.**

### Step 4 — Deploy Worker (manual first time)

Since `worker/anthropic-proxy.js` is changing (new BC proxy route), GitHub Actions triggers automatically.

Verify via GitHub Actions run:
```
github.com/mgraf77/accent-os → Actions → Deploy Cloudflare Worker
```

### Step 5 — Set Worker secrets (Michael action required)

```bash
wrangler secret put BC_STORE_HASH
# Paste: store-cwqiwcjxes (or correct store hash)

wrangler secret put BC_ACCESS_TOKEN
# Paste: actual BC access token from BC developer portal
```

### Step 6 — Post-deploy verification

```bash
bash scripts/health-check.sh
# Expected: WORKER ✓, PAGES ✓, SUPABASE ✓
```

---

## ENVIRONMENT VARIABLE REQUIREMENTS

| Variable | Surface | Method | Status |
|----------|---------|--------|--------|
| ANTHROPIC_API_KEY | Cloudflare Worker secret | `wrangler secret put` | ✅ Already set |
| CF_API_TOKEN | GitHub Actions secret | Repo Settings → Secrets | ⚠ Pending Michael |
| CF_ACCOUNT_ID | GitHub Actions secret | Repo Settings → Secrets | ⚠ Pending Michael |
| BC_STORE_HASH | Cloudflare Worker secret | `wrangler secret put` | ⚠ Pending Phase 2 |
| BC_ACCESS_TOKEN | Cloudflare Worker secret | `wrangler secret put` | ⚠ Pending Michael (M04) |
| SUPABASE_URL | Browser sessionStorage | App Settings UI | Set by operator |
| SUPABASE_ANON_KEY | Browser sessionStorage | App Settings UI | Set by operator |

---

## MODULE LOAD ORDER RISK ASSESSMENT

| Risk | Severity | Status |
|------|----------|--------|
| ecommerce_intelligence.js loads before bigcommerce_adapter.js | CRITICAL | ✅ Fixed — correct order enforced |
| `ecommerce()` called before DOMContentLoaded | MEDIUM | ✅ Not a risk — MODULE_REGISTRY dispatch only fires on user nav |
| BC direct browser calls fail with CORS | HIGH | ✅ Mitigated — module degrades, no calls until credentials entered |
| sbFetch timeout on slow Supabase response | LOW | ✅ Fixed — 15s AbortController timeout in place |
| Quote save fails if M45 not applied | HIGH | ✅ M45 confirmed applied |
