# AccentOS — Deployment Forensics Guide
_Last updated: 2026-05-13_

---

## Purpose

When something breaks after a deployment (or doesn't deploy at all), this guide provides the investigation steps to determine exactly what happened and why.

---

## Deployment Fingerprint

Every AccentOS deployment has two independent fingerprints:

| Layer | Fingerprint | How to check |
|---|---|---|
| SPA (Cloudflare Pages) | HTML version string in `<title>` | `curl https://accent-os.pages.dev/ | grep -o 'v[0-9.]*'` |
| Worker | `WORKER_VERSION` in probe response | `curl https://accentos-anthropic-proxy.mgraf77.workers.dev/` |
| Worker build date | `WORKER_BUILD` in probe response | Same curl above |

### Expected probe response (post-integration/reconcile merge):
```json
{
  "version": "v3-env-fallback",
  "build": "2026-05-11",
  "env_key_set": true,
  "method": "GET"
}
```

---

## Deployment Mismatch Patterns

### Pattern 1 — SPA Updated, Worker Stale

**Symptom:** Pages loads latest SPA, but worker probe returns non-JSON or v1/v2 response.
**Cause:** GitHub Actions didn't trigger (worker path not in push diff), or Actions failed.
**Evidence:** `window.__AOS_WORKER_VERSION__ === 'stale'` in console.
**Fix:**
```
GitHub → Actions → Deploy Cloudflare Worker → Run workflow (workflow_dispatch)
```

### Pattern 2 — Worker Updated, SPA Stale

**Symptom:** Worker probe returns v3, but SPA shows old version number.
**Cause:** Cloudflare Pages webhook failed, or Pages build errored.
**Evidence:** `<title>AccentOS v6.X.Y</title>` shows old version.
**Fix:**
```
Cloudflare Dashboard → Pages → accent-os → Deployments → click "Retry" on latest
```

### Pattern 3 — Both Updated, AI Still Fails

**Symptom:** Probe shows `env_key_set: true`, but AI calls return 401.
**Cause:** ANTHROPIC_API_KEY secret expired or rotated in Anthropic console but not updated in Cloudflare.
**Evidence:** Worker returns HTTP 401 with message from Anthropic upstream.
**Fix:**
```
1. Anthropic console → API Keys → verify key is active
2. Cloudflare → Workers → accentos-anthropic-proxy → Settings → Secrets → update ANTHROPIC_API_KEY
```

### Pattern 4 — GitHub Actions Deploys, But Wrong Worker

**Symptom:** Probe returns expected version, but AI calls hit a different worker.
**Cause:** `AOS_WORKER_BASE` in `index.html` doesn't match `wrangler.toml` name.
**Evidence:** `wrangler.toml name = "X"` but `index.html AOS_WORKER_BASE = "Y.workers.dev"`.
**Fix:**
```
grep "AOS_WORKER_BASE" index.html  → should be: accentos-anthropic-proxy.mgraf77.workers.dev
grep "^name" wrangler.toml         → should be: name = "accentos-anthropic-proxy"
```

### Pattern 5 — Deployment Triggered But Pages Not Updated

**Symptom:** Push to main succeeded, but `curl https://accent-os.pages.dev/ | grep version` shows old version.
**Cause:** Cloudflare Pages build failed silently, or CDN cache not purged.
**Evidence:** Cloudflare Pages → Deployments → latest shows "Failed".
**Fix:**
```
1. Check build log in Cloudflare Pages dashboard
2. If cache: Cloudflare → Caching → Purge Cache → Custom Purge → accent-os.pages.dev/*
3. If build failed: check for HTML syntax errors near the change
```

---

## GitHub Actions Forensics

When the deploy workflow fails:

### Check the run:
```
GitHub → accent-os repo → Actions → Deploy Cloudflare Worker → click failing run
```

### Failure by step:

| Failing step | Likely cause | Fix |
|---|---|---|
| `actions/checkout@v4` | Network issue (transient) | Re-run workflow |
| `node --check worker/anthropic-proxy.js` | JS syntax error in worker | Fix the syntax error in PR |
| `cloudflare/wrangler-action@v3` | Bad CF_API_TOKEN | Rotate token in Cloudflare + update GitHub secret |
| `cloudflare/wrangler-action@v3` | Wrong CF_ACCOUNT_ID | Verify account ID in Cloudflare dashboard right sidebar |
| `wrangler-action` — "Account not found" | Mismatched account | CF_ACCOUNT_ID must match the account that owns the worker |
| `curl` probe step fails | Worker URL changed | Check `wrangler.toml` name = expected subdomain |
| `curl` returns non-JSON | Worker deployed but old code | Re-trigger after confirming wrangler.toml main path |

### Verifying GitHub Secrets:
```
GitHub → accent-os repo → Settings → Secrets and variables → Actions
```
Verify both are present:
- `CF_API_TOKEN`
- `CF_ACCOUNT_ID`

**Note:** Secret values are not visible after creation. If the token was rotated but secret not updated, the deploy will fail. Create a new secret by clicking the secret name → Update.

---

## Cloudflare Worker Forensics

### Live worker version check:
```bash
curl https://accentos-anthropic-proxy.mgraf77.workers.dev/
```

### Verify secret is bound:
```bash
curl https://accentos-anthropic-proxy.mgraf77.workers.dev/
# "env_key_set": true → ANTHROPIC_API_KEY is bound
# "env_key_set": false → secret missing — bind it in CF dashboard
```

### Check Cloudflare Worker logs:
```
Cloudflare Dashboard → Workers & Pages → accentos-anthropic-proxy → Logs
```
Live invocation logs show: request headers, response status, runtime errors, and secret resolution.

### Rollback a Worker Deploy:
```
Cloudflare Dashboard → Workers & Pages → accentos-anthropic-proxy → Deployments
→ click previous deployment → click "Rollback to this deployment"
```

Or via GitHub Actions, using the previous commit SHA:
```
GitHub → Actions → Deploy Cloudflare Worker → Run workflow
# But first: git revert the bad commit, push to main, let Actions re-deploy
```

---

## Deployment History

Maintained in `ACTION_LEDGER.md`. Each major deployment is timestamped with commit SHA.

### Key commits:
| Commit | What deployed |
|---|---|
| `03a4828` | GitHub Actions deploy workflow added |
| `b858821` | Worker auth pipeline hardening (SPA side) |
| `0c35008` | Runtime docs |
| TBD | integration/reconcile → main (worker v3 + full hardening) |

---

## Deployment Verification Checklist

After any push to `main`:

- [ ] `curl https://accentos-anthropic-proxy.mgraf77.workers.dev/` → `{"version":"v3-env-fallback","env_key_set":true}`
- [ ] GitHub Actions run shows green
- [ ] accent-os.pages.dev loads (HTTP 200, not 404/5xx)
- [ ] Login works (auth → hydrate → dashboard)
- [ ] System Status card (Mgmt → System tab) shows green rows
- [ ] Quote AI parse: paste a fixture schedule → press Parse — responds with lines

---

## Rollback Decision Tree

```
Issue detected post-deploy
         │
         ├── Is worker broken? ──yes──→ Rollback in Cloudflare dashboard (fastest)
         │                              OR revert commit + push to main
         │
         ├── Is SPA broken? ──yes──→ Revert commit in git, push to main
         │                           Pages auto-deploys the previous version
         │
         ├── Is auth broken? ──yes──→ Check Supabase Auth service status
         │                            Check JWT expiry in Settings
         │
         └── Is data broken? ──yes──→ Check Supabase REST logs
                                       Likely bad SQL migration — use Supabase
                                       dashboard to run corrective SQL
```

---

_Update this guide after any deployment incident that took >30 minutes to diagnose._
