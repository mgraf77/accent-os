# AccentOS — Cloudflare Deployment Flow
_Created: 2026-05-12 | Maintained by Claude Code sessions_

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Repository                        │
│                       mgraf77/accent-os                         │
│                                                                 │
│  ┌──────────────┐   push to main   ┌─────────────────────────┐ │
│  │  accent-work │ ──────────────►  │         main            │ │
│  │  (dev branch)│  (PR + merge)    │   (production branch)   │ │
│  └──────────────┘                  └────────────┬────────────┘ │
│                                                 │               │
│                              ┌──────────────────┴────────────┐  │
│                              │  Two independent deploy paths  │  │
│                              └──────┬─────────────────┬──────┘  │
└─────────────────────────────────────┼─────────────────┼─────────┘
                                      │                 │
           path: worker/** or         │                 │  any file change
           wrangler.toml              │                 │
                                      ▼                 ▼
              ┌────────────────────────────┐   ┌──────────────────────────┐
              │   GitHub Actions           │   │   Cloudflare Pages       │
              │   deploy-worker.yml        │   │   (auto-webhook)         │
              │                            │   │                          │
              │   1. Syntax check          │   │   Deploys SPA:           │
              │   2. wrangler deploy       │   │   index.html, js/, css/  │
              │   3. Probe verify          │   │   accent-os.pages.dev    │
              └────────────┬───────────────┘   └──────────────────────────┘
                           │
                           ▼
              ┌────────────────────────────┐
              │   Cloudflare Workers       │
              │   accentos-anthropic-proxy │
              │   .mgraf77.workers.dev     │
              │                            │
              │   Secrets (survive deploy):│
              │   ANTHROPIC_API_KEY ✓      │
              └────────────────────────────┘
```

**Key point:** Two deploy systems run in parallel, independently:
- **Cloudflare Pages webhook** → deploys the SPA (always fires on any push to main)
- **GitHub Actions workflow** → deploys the Worker (fires only when worker files change)

Worker secrets (`ANTHROPIC_API_KEY`) are stored in Cloudflare's secret store and survive all code redeployments.

---

## Deploy Flow

### Automatic (on merge to main)

```
1. Developer merges accent-work → main (PR or direct push)
2. GitHub detects changes in worker/anthropic-proxy.js or wrangler.toml
3. GitHub Actions triggers deploy-worker.yml
4. Job: ubuntu-latest runner
   a. actions/checkout@v4          — clone repo
   b. node --check worker/...      — syntax validate (fast, ~1s)
   c. cloudflare/wrangler-action   — wrangler deploy (uses wrangler.toml)
   d. curl probe                   — verify live endpoint returns JSON
5. Deploy complete: ~30–60 seconds total
```

### Manual (on-demand)

```
1. Go to: github.com/mgraf77/accent-os → Actions → Deploy Cloudflare Worker
2. Click "Run workflow" → select branch (main) → Run
3. Same job steps as above
4. Use case: force-redeploy without code change, recover from Cloudflare-side incident
```

### Not triggered by

- Changes to `index.html`, `js/`, `css/`, `sql/`, `docs/`, `skills/`, markdown files
- Changes only on `accent-work` (workflow only fires on `main`)
- Changes to `worker/` test files if added in future (add to paths filter to include)

---

## Required GitHub Secrets

Both must be set in: `github.com/mgraf77/accent-os` → Settings → Secrets and variables → Actions

| Secret name | Value | Rotation |
|---|---|---|
| `CF_API_TOKEN` | Cloudflare API token (scoped to Workers edit) | Rotate if compromised; revoke in Cloudflare dashboard |
| `CF_ACCOUNT_ID` | Cloudflare account ID (32-char hex) | Static — only changes if account migrates |

### Creating CF_API_TOKEN (one-time setup)

1. Go to `dash.cloudflare.com` → avatar → **My Profile** → **API Tokens**
2. **Create Token** → template: **"Edit Cloudflare Workers"**
3. Scope: Account Resources → your account only
4. Zone Resources: leave as-is (harmless) or remove
5. Copy token (shown once)
6. Add to GitHub secrets as `CF_API_TOKEN`

**Minimum required permissions on the token:**
- Account > Workers Scripts > Edit

**ANTHROPIC_API_KEY** is NOT a GitHub secret. It lives in Cloudflare Workers secrets
and is unaffected by redeployments.

---

## Rollback Flow

### Fast rollback (< 2 min)

```bash
# Option A — GitHub UI
# Find the last good commit → Actions tab → "Re-run jobs" on that workflow run

# Option B — Revert commit
git revert <bad-commit-sha>
git push origin main
# GitHub Actions auto-deploys the reverted version

# Option C — Manual wrangler (requires local wrangler + auth)
git checkout <last-good-sha> -- worker/anthropic-proxy.js
wrangler deploy
```

### Verify rollback succeeded

```bash
curl https://accentos-anthropic-proxy.mgraf77.workers.dev/
# Check "version" and "build" fields match expected
```

---

## Probe Verification Examples

```bash
# Full probe
curl https://accentos-anthropic-proxy.mgraf77.workers.dev/

# Expected (healthy v3):
# {"version":"v3-env-fallback","build":"2026-05-11","env_key_set":true,"env_key_length":108}

# env_key_set: false → worker deployed but ANTHROPIC_API_KEY secret not bound
# version absent → stale worker (v1/v2) or unreachable
# curl fails entirely → worker down or URL changed

# Version endpoint (same response)
curl https://accentos-anthropic-proxy.mgraf77.workers.dev/v1/version

# Test POST (requires valid API key in env)
curl -X POST https://accentos-anthropic-proxy.mgraf77.workers.dev/v1/messages \
  -H "Content-Type: application/json" \
  -d '{"model":"claude-haiku-4-5-20251001","max_tokens":10,"messages":[{"role":"user","content":"hi"}]}'
# Healthy: returns Anthropic response JSON
# Stale: returns {"error":"Missing x-api-key header"}
# No secret: returns {"error":"ai_unconfigured",...}
```

---

## Operational Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Workflow never triggers on push | Path filter not matched | Confirm you changed `worker/anthropic-proxy.js` or `wrangler.toml` |
| Workflow fails at syntax check | JS syntax error in worker | Fix the error; push again |
| Workflow fails at wrangler deploy | Invalid `CF_API_TOKEN` or wrong `CF_ACCOUNT_ID` | Verify secrets in GitHub Settings → Secrets |
| Deploy succeeds but probe returns stale JSON | Cloudflare propagation delay | Wait 30s, probe again |
| `env_key_set: false` after deploy | `ANTHROPIC_API_KEY` not bound in Cloudflare | Go to Cloudflare Dashboard → Workers → accentos-anthropic-proxy → Settings → Variables → Add secret |
| SPA shows AI errors but workflow shows success | Frontend loaded old JS from cache | Hard refresh (Ctrl+Shift+R) |
| `CF_API_TOKEN` secret missing | Not yet configured | Follow setup steps above |

---

## Stale Deployment Detection

The SPA automatically detects stale workers at load time via the startup probe (index.html):

```javascript
// Probe runs at page load — result stored in window.__AOS_WORKER_ENV_KEY_READY__
// true  → v3 deployed + secret bound → AI works for all users
// false → v3 deployed, secret missing → users need own key
// null  → stale worker (v1/v2) → users need own key + worker needs redeploy
// undefined → probe still in flight (optimistic allow)
```

Browser console will show:
- `[aos-worker] {version: "v3-env-fallback", env_key_set: true, ...}` → healthy
- `[aos-worker] non-json probe` → stale or unreachable
- `[aos-worker] stale or unreachable — deploy worker/anthropic-proxy.js...` → stale confirmed
