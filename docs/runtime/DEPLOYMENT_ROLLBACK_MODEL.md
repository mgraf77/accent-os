# AccentOS — Deployment Rollback Model
_Last updated: 2026-05-13_

---

## Purpose

Defines the complete rollback model for AccentOS deployments. When a deployment introduces a regression, this doc specifies the exact rollback procedure for each layer, the rollback decision criteria, and the post-rollback verification steps.

---

## Deployment Layers and Rollback Methods

### Layer 1 — SPA (Cloudflare Pages)

**Rollback method A: Cloudflare Dashboard (fastest, <2 min)**
```
Cloudflare → Pages → accent-os → Deployments
→ click the last known-good deployment
→ click "Rollback to this deployment"
```
Pages immediately switches traffic to the rolled-back build. No git operation required.

**Rollback method B: Git revert (safer, ~5 min)**
```bash
git revert HEAD                # or: git revert <bad-commit>
git push origin main           # Pages auto-deploys the reverted build
```
Creates a new commit that undoes the bad change. Audit trail preserved.

**When to use A vs B:**  
Use A when you need instant recovery and the bad commit is clearly identified.  
Use B when you want the revert in the git history, or when A isn't available.

---

### Layer 2 — Cloudflare Worker

**Rollback method A: Cloudflare Dashboard (fastest, <1 min)**
```
Cloudflare → Workers & Pages → accentos-anthropic-proxy → Deployments
→ click previous deployment
→ click "Rollback to this deployment"
```

**Rollback method B: GitHub Actions redeploy (3–5 min)**
```bash
git revert HEAD                # revert the bad worker change
git push origin main           # Actions re-deploys on next push touching worker/**
```
If the bad commit didn't change `worker/**`, the Actions workflow won't trigger. Use method A in that case.

**Rollback method C: Manual wrangler (1 min, local)**
```bash
cd worker
git checkout <last-good-commit> -- anthropic-proxy.js
wrangler deploy
git checkout HEAD -- anthropic-proxy.js  # restore HEAD
```
Deploys the old worker code without touching git history.

---

### Layer 3 — Supabase Schema (Migrations)

**No automated rollback exists.**

SQL migrations are applied manually via the Supabase SQL editor. Each migration in `sql/` is designed to be additive (new tables, new columns) — they don't alter or drop existing data.

**Rollback procedure:**
1. Identify the migration that caused the issue
2. Write reverse SQL:
   - `DROP TABLE IF EXISTS table_name;` for new tables
   - `ALTER TABLE x DROP COLUMN y;` for new columns
   - `DROP INDEX IF EXISTS idx_name;` for new indexes
3. Run via Supabase Dashboard → SQL Editor
4. Note the reverse migration in a new `sql/M##_revert_M##.sql` file

**Never run destructive schema operations on production without explicit approval.**

---

## Rollback Decision Criteria

```
Deployment pushed → incident detected
         │
         ├── Is it a UI regression? (visual/UX change broke something)
         │    └── SPA rollback (method A or B)
         │
         ├── Is it an AI feature regression? (AI calls fail after worker deploy)
         │    └── Worker rollback (method A — fastest)
         │
         ├── Is it a data access regression? (Supabase reads return wrong data)
         │    └── Check migration SQL → write reverse SQL → apply manually
         │
         ├── Is it intermittent? (fails sometimes, not always)
         │    └── Don't rollback yet — diagnose first (may be Supabase/Cloudflare issue)
         │
         └── Is the feature newly added (not existing functionality broken)?
              └── Consider disabling feature via module_modes.json instead of rolling back
```

---

## Rollback Scope Decision

| Change scope | Safest rollback target |
|---|---|
| Single commit (bad) | Revert that commit only |
| Feature branch merged (2–5 commits) | Revert merge commit OR rollback each commit in order |
| Session with many commits (10+) | Cloudflare Dashboard rollback to pre-session deployment (fastest) |
| Schema migration | Reverse SQL + leave SPA/worker intact |

---

## Post-Rollback Verification Checklist

After rolling back any layer:

**SPA:**
- [ ] `curl https://accent-os.pages.dev/ | grep -o 'v[0-9.]*'` → shows previous version
- [ ] Login works
- [ ] Dashboard renders
- [ ] The regressing feature is gone (confirm rollback complete)

**Worker:**
- [ ] `curl https://accentos-anthropic-proxy.mgraf77.workers.dev/` → probe response matches expected prior state
- [ ] AI chat works (if env key is bound)
- [ ] Quote AI parse works

**Schema:**
- [ ] Reload app → hydration completes without console errors
- [ ] The affected module's data loads correctly
- [ ] No 403 (RLS) or 404 (table missing) errors in Network tab

---

## Rollback Communication Template

When a rollback is performed in a collaborative environment:

```
[TIME] ROLLBACK INITIATED
Layer: [SPA | Worker | Schema]
Reason: [brief description of regression]
Method: [Dashboard rollback / git revert / reverse SQL]
Rolled back to: [commit SHA or deployment date]
ETA: [time estimate]

[TIME] ROLLBACK COMPLETE
Verified: [list of verification steps passed]
Status: [Back to stable | Still investigating]
```

---

## Branch Model and Rollback Risk

AccentOS uses a single `main` branch for production deployments (no staging branch currently promoted to production).

**Key constraints:**
- All commits to `main` immediately deploy to production (Pages webhook)
- Worker deploys only when `worker/**` or `wrangler.toml` is in the diff
- There is no "dry run" deployment — every push to main is live

**Implication for rollback:** Because every commit is live immediately, a rollback must be done within minutes of detecting a regression to minimize user impact. Cloudflare Dashboard rollbacks (both Pages and Workers) are the fastest path.

---

## Deployment Risk Rating by Change Type

| Change type | Risk | Recommended verification |
|---|---|---|
| Doc-only commit | None | N/A |
| JS module (js/*.js) | Low | Navigate to that module; test primary workflow |
| index.html inline JS | Medium | Full boot test + affected feature test |
| index.html HTML structure | Medium | Visual check + all module navigation |
| worker/anthropic-proxy.js | High | Probe + AI parse test |
| wrangler.toml | High | Probe + verify worker name aligns with SPA URL |
| SQL migration | High | Module data loads + no console errors |
| Auth/session code | Critical | Full login + logout cycle + role visibility |

---

_Review after any production incident where rollback was needed._
