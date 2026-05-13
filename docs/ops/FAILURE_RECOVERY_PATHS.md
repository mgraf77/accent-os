# AccentOS — Failure Recovery Paths
_Last updated: 2026-05-13_

---

## Purpose

For each failure mode in AccentOS, documents the recovery path — what the operator or system does to restore full function. Complements RUNTIME_SURVIVABILITY_MODEL.md (which covers isolation) and OPERATOR_DIAGNOSTICS_GUIDE.md (which covers diagnosis).

---

## Recovery Path Catalog

### F01 — Worker Not Deployed / Stale

**Symptom:** AI features show "AI not available" or `__AOS_WORKER_VERSION__ === 'stale'`  
**Root cause:** Worker version in Cloudflare doesn't match expected version

**Recovery:**
1. GitHub → accent-os → Actions → Deploy Cloudflare Worker → "Run workflow"
2. Wait ~30s for deploy
3. `curl https://accentos-anthropic-proxy.mgraf77.workers.dev/` → verify `{"version":"v3-env-fallback"}`
4. Refresh SPA in browser → probe will rerun → AI available

**Auto-recovery:** No. Requires manual redeploy trigger.  
**Time to recovery:** 5–10 minutes.

---

### F02 — ANTHROPIC_API_KEY Missing or Invalid

**Symptom:** Worker probe shows `env_key_set: false` OR AI calls return 401 with Anthropic upstream error  
**Root cause:** Secret not bound in Cloudflare, or key expired/rotated

**Recovery:**
1. Verify key status: Anthropic console → API Keys → confirm key is active
2. Cloudflare Dashboard → Workers & Pages → accentos-anthropic-proxy → Settings → Variables and Secrets
3. Add/update `ANTHROPIC_API_KEY` with valid key
4. Re-deploy worker (Cloudflare auto-redeploys on secret update, or trigger manually)
5. Verify: probe returns `"env_key_set": true`

**Auto-recovery:** No. Requires key management action.  
**Time to recovery:** 5–15 minutes (depending on key rotation process).

---

### F03 — Supabase REST Unavailable (Partial)

**Symptom:** One or more modules show empty data; hydration log shows one sbLoad failing  
**Root cause:** Supabase table error, RLS policy issue, or migration problem

**Recovery:**
1. Open browser DevTools → Network → find failing REST request
2. Check error code: 403 = RLS policy, 404 = table missing, 500 = DB error
3. For RLS: Supabase Dashboard → Authentication → RLS Policies → verify policy for affected table
4. For missing table: run the relevant SQL migration (M## file in `sql/`)
5. For DB error: Supabase Dashboard → Logs → Database → identify root cause
6. Reload SPA to trigger full re-hydration

**Auto-recovery:** Partial. If Supabase self-heals (transient error), page reload restores.  
**Time to recovery:** 2–60 minutes depending on root cause.

---

### F04 — Supabase Auth Down

**Symptom:** Login fails; users redirected to login screen on reload  
**Root cause:** Supabase Auth service disruption

**Recovery:**
1. Check Supabase status: status.supabase.com
2. Wait for service restoration (Supabase-side issue — not operator-actionable)
3. Once service restores, users can log in normally

**Auto-recovery:** Yes, once Supabase restores.  
**Time to recovery:** Depends on Supabase SLA.

---

### F05 — JWT Expired / Invalid

**Symptom:** Operator is immediately redirected to login on page load  
**Root cause:** JWT in localStorage expired or corrupted

**Recovery:**
1. Log in again → new JWT issued
2. Full function restored immediately

**Auto-recovery:** Yes (login flow handles this).  
**Time to recovery:** <1 minute (re-login).

---

### F06 — SPA Deployment Failed

**Symptom:** accent-os.pages.dev shows old version or 404  
**Root cause:** Cloudflare Pages build failed, or CDN cache not cleared

**Recovery:**
1. Cloudflare Dashboard → Pages → accent-os → Deployments → check latest status
2. If failed: read build log → fix HTML syntax error or config issue → push fix to main
3. If cache: Cloudflare → Caching → Purge Cache → Custom Purge → accent-os.pages.dev/*
4. Verify: `curl https://accent-os.pages.dev/ | grep -o 'v[0-9.]*'` → shows latest version

**Auto-recovery:** No. Requires operator action.  
**Time to recovery:** 5–20 minutes.

---

### F07 — Worker Deployed But Wrong Version

**Symptom:** Probe returns JSON but version doesn't match expected  
**Root cause:** Old commit's worker code still deployed; GitHub Actions ran against stale branch

**Recovery:**
1. Verify commit SHAs: `git log --oneline -5` on main
2. GitHub → Actions → Deploy Cloudflare Worker → find run for latest commit → check worker path in diff
3. If worker path wasn't in diff (no `worker/**` change), trigger manual workflow_dispatch
4. Verify probe response after deploy

**Auto-recovery:** No.  
**Time to recovery:** 5–10 minutes.

---

### F08 — Module Script Fails to Load

**Symptom:** Navigation to a specific module shows blank content; console shows 404 for js/module.js  
**Root cause:** Typo in filename, missing file after merge, or CDN serving stale 404

**Recovery:**
1. DevTools → Network → find the failing `js/*.js` request → note the URL
2. Verify file exists: `ls /home/user/accent-os/js/module.js` in Codespace
3. If missing: restore from git — `git checkout HEAD -- js/module.js`
4. Push fix to main → Pages auto-deploys → module loads

**Auto-recovery:** No.  
**Time to recovery:** 5–15 minutes.

---

### F09 — Data Corruption in Supabase Table

**Symptom:** Module renders with errors, console shows unexpected values in global data  
**Root cause:** Bad save operation, migration side effect, or manual DB edit

**Recovery:**
1. Identify the corrupted table from console errors
2. Supabase Dashboard → Table Editor → review rows → identify bad data
3. Run corrective SQL: `UPDATE table SET field = correct_value WHERE condition`
4. Or restore from Supabase backup (Dashboard → Database → Backups)
5. Reload SPA to pick up corrected data

**Auto-recovery:** No. Requires operator SQL action.  
**Time to recovery:** 5–60 minutes.

---

### F10 — Quote Save Data Loss (DELETE+INSERT Failure)

**Symptom:** Quote lines disappear after save; reloading shows empty quote  
**Root cause:** sbSaveQuote DELETE succeeded but INSERT failed (network drop between operations)

**Recovery:**
1. Check Supabase Logs → API → look for DELETE success followed by INSERT failure on `quote_lines`
2. If lines are gone: operator must re-enter from memory or re-paste fixture notes + AI parse
3. Long-term fix: implement atomic save via Supabase RPC (tracked in KNOWN_ISSUES.md KI-TODO)

**Auto-recovery:** No. This is a known residual risk.  
**Time to recovery:** Manual re-entry required.

---

## Recovery Responsibility Matrix

| Failure | Who fixes | Operator action | Time to fix |
|---|---|---|---|
| Worker stale (F01) | Operator | GitHub Actions trigger | 5–10 min |
| API key missing (F02) | Operator | Cloudflare secret update | 5–15 min |
| Supabase table error (F03) | Operator | SQL migration or RLS fix | 2–60 min |
| Supabase Auth down (F04) | Supabase | Wait for service restore | Unknown |
| JWT expired (F05) | User | Re-login | <1 min |
| SPA deploy failed (F06) | Operator | Cloudflare retry or push fix | 5–20 min |
| Wrong worker version (F07) | Operator | Manual workflow_dispatch | 5–10 min |
| Missing module script (F08) | Developer | git restore + push | 5–15 min |
| Data corruption (F09) | Operator | Corrective SQL | 5–60 min |
| Quote save data loss (F10) | User | Re-enter lines | Variable |

---

## Rollback Procedures

### Rollback SPA (Cloudflare Pages)
```
Cloudflare → Pages → accent-os → Deployments → click previous → "Rollback"
```
Or: `git revert HEAD && git push origin main`

### Rollback Worker (Cloudflare Worker)
```
Cloudflare → Workers → accentos-anthropic-proxy → Deployments → previous → "Rollback"
```
Or: `git revert <bad-commit> && git push origin main` (Actions redeploys)

### Rollback Supabase Schema
No automated rollback. Run corrective SQL manually via Supabase SQL editor.  
All migrations are in `sql/` — review the migration file and craft a reverse SQL.

---

_Update after any production incident where recovery took >15 minutes._
