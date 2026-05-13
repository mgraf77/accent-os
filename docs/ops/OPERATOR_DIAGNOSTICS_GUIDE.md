# AccentOS — Operator Diagnostics Guide
_Last updated: 2026-05-13_

---

## Purpose

Step-by-step triage playbooks for the most common AccentOS operational issues. Designed for Michael or any operator who encounters a broken state and needs to diagnose without reading source code.

---

## Quick Triage Matrix

Run `bash scripts/status.sh` first. The output maps to this table:

| Status line shows | Go to |
|---|---|
| Worker: stale or unreachable | [Playbook 1](#playbook-1--ai-not-working) |
| Worker: env_key_set=false | [Playbook 2](#playbook-2--worker-deployed-but-ai-still-fails) |
| N commit(s) not pushed | [Playbook 3](#playbook-3--uncommitted-or-unpushed-work) |
| M-tasks pending | [Playbook 4](#playbook-4--blocked-m-tasks) |
| Hydration slow (>5s) | [Playbook 5](#playbook-5--slow-startup--hydration) |
| Module data empty | [Playbook 6](#playbook-6--module-shows-empty-data) |

---

## Playbook 1 — AI Not Working

**Symptom:** AI Lighting Consultant or Quote AI parse shows "AI requires your Anthropic API key" or similar.

### Step 1: Run the worker probe
```bash
curl https://accentos-anthropic-proxy.mgraf77.workers.dev/
```

**Expected (healthy):**
```json
{"version":"v3-env-fallback","env_key_set":true,"method":"GET"}
```

| Response | Meaning | Go to |
|---|---|---|
| `{"version":"v3-env-fallback","env_key_set":true}` | Worker healthy | AI broken for other reason → Step 3 |
| `{"version":"v3-env-fallback","env_key_set":false}` | Worker deployed, key missing | Playbook 2 |
| `Method Not Allowed` or non-JSON | Stale v1/v2 worker | Step 2 |
| Connection refused / timeout | Worker unreachable | Step 2 |

### Step 2: Redeploy via GitHub Actions
1. Go to: **github.com/mgraf77/accent-os → Actions → Deploy Cloudflare Worker**
2. Click **Run workflow → Run workflow**
3. Wait ~2 minutes for deploy to complete
4. Re-run the curl probe — expect `env_key_set: true`

### Step 3: Check browser console
Open the SPA → DevTools → Console → look for:
- `[aos-worker]` entry — shows probe result
- `[aos-health]` entry (fires 2s after login) — shows full `_runtimeHealth()` state
- Any red errors from `aiParseNotes` or `sendChat`

### Step 4: User key fallback
If worker is broken short-term, users can set a personal key:
Settings → API Keys → paste Anthropic key → Save

---

## Playbook 2 — Worker Deployed But AI Still Fails

**Symptom:** Worker probe shows `env_key_set: false`.

**Cause:** Worker v3 deployed but `ANTHROPIC_API_KEY` secret not bound in Cloudflare.

### Fix:
1. Open **Cloudflare dashboard → Workers & Pages → accentos-anthropic-proxy**
2. Click **Settings → Variables and Secrets**
3. Click **Add secret**
4. Name: `ANTHROPIC_API_KEY`
5. Value: (Anthropic API key from console.anthropic.com)
6. Click **Deploy**
7. Re-test: `curl https://accentos-anthropic-proxy.mgraf77.workers.dev/`
8. Expect: `env_key_set: true`

---

## Playbook 3 — Uncommitted or Unpushed Work

**Symptom:** `scripts/status.sh` shows "N file(s) uncommitted" or "N commit(s) not pushed".

### Uncommitted files:
```bash
git diff --stat
git status --short
```
If changes look intentional (work in progress), commit:
```bash
git add -p   # review each change
git commit -m "wip: describe what changed"
git push origin accent-work:claude/audit-repository-Fg9xI
```

If changes look accidental (modified by accident):
```bash
git stash   # safe — can restore with git stash pop
```

### Unpushed commits:
```bash
git log --oneline origin/claude/audit-repository-Fg9xI..HEAD
git push origin accent-work:claude/audit-repository-Fg9xI
```

**Note:** The stop-hook reports unpushed commits relative to `main`, not the remote. 11 commits ahead of main is expected — those are the operational hardening commits on `accent-work`.

---

## Playbook 4 — Blocked M-Tasks

**Symptom:** `BUILD_PLAN_CLAUDE.md` shows pending `[ ]` items with `BLOCKS ON MICHAEL: M##`.

Currently blocked:
- **M03** — Windward written confirmation (ERP live data sync)
- **M04** — BigCommerce API key (e-commerce integration)
- **M05** — GMC API access (Google Merchant Center)
- **M06** — GA4 service account credential
- **M09** — Klaviyo API key
- **M10** — Curtis (Windward) outreach
- **M18** — Website approval for embed
- **M29** — Marketing schema SQL (run this one: `sql/M29_marketing.sql`)

For each M-task:
1. Open `BUILD_PLAN_MICHAEL.md` — find the M## entry
2. Follow the exact steps listed
3. After completing, notify Claude Code: "M## complete"
4. Claude Code will verify and check it off

---

## Playbook 5 — Slow Startup / Hydration

**Symptom:** App takes >5 seconds to show data after login. Console shows `[aos-boot] hydration complete {ms: 8000}`.

### Diagnosis:
1. Open DevTools → Network tab
2. Filter to `Fetch/XHR`
3. Login → watch requests in chronological order
4. Look for any request that takes >2000ms

**Common causes:**
- Supabase project cold-start (first request after inactivity can take 3-5s)
- RLS policy scan on large tables (check Supabase Logs → Query Performance)
- Missing indexes (run Supabase Performance Advisor: Dashboard → Advisors → Performance)

### Mitigation:
- If consistently slow: run Supabase advisor, apply index recommendations
- If only on first load: cold-start is normal, subsequent loads should be fast
- If a specific table is slow: check if it has an index on the query fields

---

## Playbook 6 — Module Shows Empty Data

**Symptom:** A page loads but shows 0 records (no data), even though records should exist.

### Step 1: Check the console
```
DevTools → Console → filter to WARN
```
Look for: `sbLoad[Module] 404: relation "table_name" does not exist`

**If 404:** The SQL migration hasn't been run. Find the migration:
```
cat sql/M*.sql | grep -l "table_name"
```
Send to Michael: "Please run `sql/M##_name.sql` in Supabase SQL Editor."

### Step 2: Check RLS
If no 404 but still empty:
1. Supabase Dashboard → Table Editor → find table → click on it
2. Check if rows exist at all
3. If rows exist but UI shows empty: RLS issue
4. Check `sql/M01_rls_tightening.sql` for the policy on that table

### Step 3: Check the hydration call
Find the `sbLoad*` function for that module. Verify:
- It's being called in `hydrateFromSupabase()` (index.html ~lines 666–706)
- The table name matches the SQL migration

---

## Playbook 7 — Deployment to production

**When:** Changes on `accent-work` are ready to go live.

### Pre-flight:
1. Run `bash scripts/status.sh` — verify clean state
2. Check `integration/reconcile` branch exists and is ahead of main
3. Confirm `CF_API_TOKEN` + `CF_ACCOUNT_ID` are set in GitHub repo secrets

### Merge:
1. GitHub → accent-os repo → Pull requests → New pull request
2. Base: `main` | Compare: `integration/reconcile`
3. Review diff → Merge (create merge commit — do NOT squash)
4. Wait ~15s for Cloudflare Pages to deploy SPA
5. Wait ~2 min for GitHub Actions to deploy Worker (if worker/** changed)

### Post-merge verification:
```bash
curl https://accentos-anthropic-proxy.mgraf77.workers.dev/
# Expect: {"version":"v3-env-fallback","env_key_set":true}
```
Open https://accent-os.pages.dev/ → Login → Dashboard → System tab → verify green rows.

---

## Console Diagnostics Reference

These `console.*` entries are intentionally emitted by AccentOS for operator use:

| Entry | When emitted | What to read |
|---|---|---|
| `[aos-worker] {path, version, probe_ms}` | On startup | Worker probe result |
| `[aos-worker] WARN: ANTHROPIC_API_KEY not bound` | On startup | env_key_set=false |
| `[aos-worker] stale or unreachable` | On startup | v1/v2 worker detected |
| `[aos-boot] hydration complete {ms, ts}` | After all sbLoad* done | Total hydration time |
| `[aos-health] {worker, ai, hydrate, degraded}` | 2s after login | Full runtime state |
| `[aiParseNotes] upstream N` | On AI parse failure | HTTP error code + body |
| `[aiParseNotes] JSON parse error` | On AI parse failure | Raw AI response |
| `[boot] module modes init failed` | If module_modes.js error | module_modes.js issue |
| `[kpi] auto-snapshot` | If KPI snapshot errors | KPI save failure |

---

## Escalation Matrix

| Scenario | Owner | Max response time |
|---|---|---|
| Worker not responding (users can't use AI) | Claude Code via Actions | 2 hours |
| Supabase auth broken (users can't login) | Michael (Supabase dashboard) | 30 minutes |
| Missing SQL migration (data not loading) | Michael (SQL Editor) | 1 business day |
| App code bug (JS error in console) | Claude Code | 1 business day |
| Cloudflare Pages deploy failed | Claude Code / Michael | 4 hours |

---

_Update this guide when new failure modes are discovered. Add a new playbook entry for any incident that took >30 minutes to diagnose._
