# AccentOS — Worker Runtime Recovery Playbook
_Created: 2026-05-12 | Operational reference — not a planning doc_

Quick-reference for diagnosing and recovering from Cloudflare Worker incidents.
Read top-to-bottom for a new incident; jump to the relevant section if you already know the failure type.

---

## Step 0 — Confirm it's a worker issue

```bash
curl https://accentos-anthropic-proxy.mgraf77.workers.dev/
```

| Response | Status |
|---|---|
| `{"version":"v3-env-fallback","env_key_set":true,...}` | Healthy — not a worker issue |
| `{"version":"v3-env-fallback","env_key_set":false,...}` | Deployed but secret missing |
| `{"error":"Missing x-api-key header"}` | Stale worker (v1/v2) |
| `{"error":"ai_unconfigured",...}` | v3 deployed, secret not bound |
| `Method not allowed` or non-JSON | Stale worker or wrong route |
| Connection refused / timeout | Worker down or URL wrong |

---

## Incident 1 — Stale Worker (v1/v2 still live)

**Symptom:** SPA AI features fail with "AI requires your Anthropic API key" even though no key was needed before. Browser console: `[aos-worker] stale or unreachable`.

**Cause:** The live Cloudflare Worker is an old version that requires `x-api-key` from the client. The v3 code in the repo (which uses `env.ANTHROPIC_API_KEY`) has not been deployed.

**Probe signature:**
```bash
curl https://accentos-anthropic-proxy.mgraf77.workers.dev/
# Returns: Method not allowed  OR  non-JSON response
```

**Recovery:**
1. Trigger the GitHub Actions workflow:
   - Go to `github.com/mgraf77/accent-os` → Actions → **Deploy Cloudflare Worker** → **Run workflow**
   - OR: make a whitespace change to `worker/anthropic-proxy.js` and push to main
2. Wait ~60 seconds for deploy + propagation
3. Verify: `curl https://accentos-anthropic-proxy.mgraf77.workers.dev/`
   - Expected: `{"version":"v3-env-fallback","env_key_set":true,...}`

**If GitHub Actions is not yet set up:** See `CLOUDFLARE_DEPLOYMENT_FLOW.md` § Required GitHub Secrets.

---

## Incident 2 — Missing ANTHROPIC_API_KEY Secret

**Symptom:** AI calls return `{"error":"ai_unconfigured",...}` (503). SPA shows "AI parsing is temporarily unavailable."

**Cause:** The worker is deployed correctly (v3) but the `ANTHROPIC_API_KEY` secret is not bound in Cloudflare.

**Probe signature:**
```bash
curl https://accentos-anthropic-proxy.mgraf77.workers.dev/
# Returns: {"version":"v3-env-fallback","env_key_set":false,...}
```

**Recovery (Cloudflare dashboard — no code change needed):**
1. Go to `dash.cloudflare.com` → Workers & Pages → **accentos-anthropic-proxy**
2. Settings → Variables and Secrets
3. Click **Add** → Type: Secret → Name: `ANTHROPIC_API_KEY` → paste `sk-ant-...` value
4. Save and deploy (Cloudflare applies the secret without a code redeploy)
5. Verify: `curl .../` should now return `"env_key_set":true`

**Alternative (wrangler CLI, if available):**
```bash
cd /path/to/accent-os
wrangler secret put ANTHROPIC_API_KEY
# paste key when prompted
```

**Note:** The `ANTHROPIC_API_KEY` secret survives code redeployments. It only goes
missing if explicitly deleted from the Cloudflare dashboard or if deploying to a
brand-new worker name.

---

## Incident 3 — Failed GitHub Actions Deploy

**Symptom:** Workflow run shows red ✗ in GitHub Actions tab.

**Diagnosis by failing step:**

| Failing step | Cause | Fix |
|---|---|---|
| `Syntax check worker script` | JS syntax error in `worker/anthropic-proxy.js` | Fix syntax, push to main |
| `Deploy to Cloudflare Workers` — auth error | `CF_API_TOKEN` invalid or expired | Rotate token (see below) |
| `Deploy to Cloudflare Workers` — account error | `CF_ACCOUNT_ID` wrong | Verify account ID in Cloudflare dashboard sidebar |
| `Deploy to Cloudflare Workers` — permission error | Token missing Workers edit permission | Recreate token with correct scope |
| `Verify live deployment` | Probe warning only — not a failure | Worker deployed; propagation may be delayed |

**Rotating CF_API_TOKEN:**
1. Cloudflare dashboard → My Profile → API Tokens → revoke old token
2. Create new token: template "Edit Cloudflare Workers", scope to your account
3. GitHub → repo Settings → Secrets → `CF_API_TOKEN` → Update

---

## Incident 4 — Worker Returns Errors for All AI Requests

**Symptom:** AI features completely broken. All POST /v1/messages calls fail.

**Triage flow:**
```
1. Check: curl https://accentos-anthropic-proxy.mgraf77.workers.dev/
   → version present? → move to step 2
   → no version field / non-JSON → Incident 1 (stale worker)

2. Check: env_key_set: true?
   → false → Incident 2 (missing secret)
   → true → move to step 3

3. Test actual POST:
   curl -X POST .../v1/messages -H "Content-Type: application/json" \
     -d '{"model":"claude-haiku-4-5-20251001","max_tokens":10,"messages":[{"role":"user","content":"hi"}]}'
   → {"error":"..."} from Anthropic → key invalid or account issue (contact Anthropic)
   → upstream_unreachable → Cloudflare can't reach api.anthropic.com (rare; Anthropic outage)
   → valid response → worker healthy; issue is in SPA frontend code
```

---

## Incident 5 — Wrong Worker Being Called

**Symptom:** Worker probe returns unexpected version or 404.

**Cause:** `AOS_WORKER_BASE` in `index.html` may have drifted from the actual deployed worker URL, or the worker was renamed.

**Check:**
```bash
# Confirm the URL in index.html
grep "AOS_WORKER_BASE" index.html
# Current: const AOS_WORKER_BASE = 'https://accentos-anthropic-proxy.mgraf77.workers.dev';

# Confirm the live worker name
# In Cloudflare dashboard: Workers & Pages → verify worker name matches
# URL pattern: <worker-name>.<cloudflare-username>.workers.dev
```

**Fix:** If worker was renamed, update `AOS_WORKER_BASE` in `index.html` and update `name` in `wrangler.toml` to match.

---

## Verification Commands Reference

```bash
# 1. Probe live worker (should return JSON with version field)
curl https://accentos-anthropic-proxy.mgraf77.workers.dev/

# 2. Same via /v1/version alias
curl https://accentos-anthropic-proxy.mgraf77.workers.dev/v1/version

# 3. Confirm worker name matches wrangler.toml
grep "^name" wrangler.toml
# Expected: name = "accentos-anthropic-proxy"

# 4. Confirm worker code version matches repo
grep "WORKER_VERSION" worker/anthropic-proxy.js
# Expected: const WORKER_VERSION = 'v3-env-fallback';

# 5. Check last GitHub Actions deploy run
# github.com/mgraf77/accent-os → Actions → Deploy Cloudflare Worker → latest run

# 6. Check Cloudflare dashboard worker state
# dash.cloudflare.com → Workers & Pages → accentos-anthropic-proxy → Metrics/Settings
```

---

## Operational Response Matrix

| Condition | User impact | Urgency | Recovery time | Who acts |
|---|---|---|---|---|
| Stale worker (v1/v2) | AI features broken for all users | High | 2–5 min | Michael / trigger workflow |
| `env_key_set: false` | AI features broken for all users | High | 2 min | Michael / Cloudflare dashboard |
| Failed GitHub Actions deploy | No change to live (previous version stays) | Medium | Fix code + push | Claude Code |
| `CF_API_TOKEN` expired | Next deploy attempt will fail | Low | 5 min | Michael / rotate token |
| Worker 502/503 from Anthropic | AI features degraded | Low–Medium | Wait for Anthropic | No action needed |
| Worker entirely unreachable | AI features broken | High | Cloudflare incident? | Check status.cloudflare.com |
