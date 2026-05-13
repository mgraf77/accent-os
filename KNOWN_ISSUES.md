# AccentOS — Known Issues Register
_Append-only. Add new issues at top. Mark resolved with [RESOLVED date]._

---

## Active Issues

### KI-004 — Worker v3 not deployed to production
**Severity:** WARN  
**Discovered:** 2026-05-12  
**Symptom:** Live worker is v1/v2. Returns "Method Not Allowed" on GET. AI features work only with user-supplied key.  
**Root cause:** `worker/anthropic-proxy.js` v3 has never been deployed. `integration/reconcile` branch contains v3 but hasn't merged to main.  
**Remediation:** Merge `integration/reconcile` → `main` via GitHub PR. GitHub Actions workflow will auto-deploy.  
**Blocker:** Michael approval to merge.

### KI-003 — M01, M02, M29 SQL migrations not run
**Severity:** WARN  
**Discovered:** 2026-05-07  
**Symptom:** RLS policies not tightened (M01). Some M02 tables may not exist. marketing_campaigns table absent (M29).  
**Remediation:** Michael to run `sql/M01_rls_tightening.sql`, `sql/M02_core_schema.sql`, `sql/M29_marketing.sql` in Supabase SQL Editor.  
**Impact:** Security exposure on M01; some features may degrade without M02 tables.

### KI-002 — WORKER_BUILD hardcoded (won't auto-update on redeploy)
**Severity:** INFO  
**Discovered:** 2026-05-12  
**Symptom:** After GitHub Actions deploys the worker, the live worker still reports `WORKER_BUILD = '2026-05-11'` regardless of when it was deployed.  
**Root cause:** `WORKER_BUILD` is a hardcoded constant in `worker/anthropic-proxy.js`.  
**Remediation:** Inject build date via `sed` in the GitHub Actions workflow step, or update manually when worker is next touched.  
**Priority:** Low — cosmetic; doesn't affect functionality.

### KI-001 — index.html approaching 900 KB split trigger
**Severity:** INFO  
**Discovered:** 2026-05-04  
**Current:** ~750 KB (~83% of 900 KB trigger)  
**Projection:** At current growth rate (~20 KB per major feature), ~8 features before trigger.  
**Remediation:** Extract Rep Outreach and/or Pipeline modules when next approaching 850 KB. See `docs/decomp/DECOMPOSITION_INTELLIGENCE_MASTER.md` Priority Queue.  
**Priority:** Low — monitor; don't act until >85%.

---

## Resolved Issues

### KI-R003 — [RESOLVED 2026-05-12] Worker auth broken for all users
**Was:** Worker returned 400 "Missing x-api-key header" on all AI calls. Root cause: v1/v2 worker live; SPA sending no key (trusting v3 env fallback).  
**Resolution:** SPA hardened with `_aiWorkerReady()` preflight guards. AI calls degrade gracefully. Worker redeployment pending (KI-004).

### KI-R002 — [RESOLVED 2026-05-12] No automated worker deployment path
**Was:** Worker deployment required local `wrangler` CLI with CF credentials.  
**Resolution:** `.github/workflows/deploy-worker.yml` created. GitHub Actions auto-deploys on push to main touching `worker/` or `wrangler.toml`.

### KI-R001 — [RESOLVED 2026-05-12] No runtime observability for worker probe
**Was:** No visibility into worker health without manual curl.  
**Resolution:** `window.__AOS_WORKER_PROBE_MS__`, `__AOS_WORKER_VERSION__`, `__AOS_WORKER_ENV_KEY_READY__` flags set at boot. System Status card reads them live. `_runtimeHealth()` provides structured health object.
