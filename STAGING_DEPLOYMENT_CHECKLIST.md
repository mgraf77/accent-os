# STAGING DEPLOYMENT CHECKLIST
> Branch: `integration/reconcile-v2`
> Generated: 2026-05-13 — MASTER_RECONCILIATION_AND_DEPLOYMENT_V1
> DO NOT deploy to production until all items are checked.

---

## PRE-DEPLOYMENT REQUIREMENTS

### Environment Prerequisites
- [ ] Cloudflare Pages project connected to `mgraf77/accent-os`
- [ ] CF_API_TOKEN + CF_ACCOUNT_ID secrets set in GitHub Actions (see `.github/workflows/deploy-worker.yml`)
- [ ] Supabase project `hsyjcrrazrzqngwkqsqa` accessible

### SQL Migrations (apply in strict order before deploy)
- [ ] **M45** — Apply `sql/M45_quote_save_rpc.sql` in Supabase SQL Editor
  - Creates `upsert_quote_with_lines()` Postgres function
  - Verify: `SELECT proname FROM pg_proc WHERE proname = 'upsert_quote_with_lines';` returns one row
- [ ] **M46** — Apply `sql/M46_quote_stale_guard.sql` in Supabase SQL Editor
  - Adds stale edit detection to the RPC
  - Verify: run M45 RPC with mismatched timestamp, expect `CONFLICT:` error response
- [ ] **M47** — Apply `sql/M47_bigcommerce_schema.sql` in Supabase SQL Editor (optional — only if BC integration activated)
  - Creates: `bc_products_cache`, `bc_categories_cache`, `bc_brands_cache`, `bc_sync_log`
  - Safe to skip if BigCommerce API credentials not yet available (M04 still pending per WORK_IN_PROGRESS)
- [ ] **M48** — Apply `sql/M48_ecommerce_v2_schema.sql` in Supabase SQL Editor (optional — requires M47)

### Quote Workflow Verification (post-M45/M46, pre-deploy)
- [ ] Open AccentOS in browser
- [ ] Navigate to Quotes — confirm list loads without error
- [ ] Create a new quote with 2+ line items
- [ ] Save — confirm "Saved (QT-XXXX) · Nms" toast (no "Save failed" error)
- [ ] Reload page — confirm quote persists with all line items
- [ ] Open same quote in two browser tabs simultaneously
- [ ] Save from Tab 1, then immediately save from Tab 2 — confirm CONFLICT: dialog appears
- [ ] Draft recovery: start editing a quote, close tab without saving, reopen — confirm recovery banner

---

## DEPLOYMENT SEQUENCE

### Step 1 — Merge to main
```bash
git checkout main
git merge --no-ff integration/reconcile-v2 -m "release: reconcile-v2 integration candidate"
```

### Step 2 — Deploy to Cloudflare Pages
Cloudflare Pages auto-deploys from `main` on push. Monitor deployment status:
- Cloudflare Pages dashboard: https://dash.cloudflare.com
- GitHub Actions: `.github/workflows/deploy-worker.yml` (Worker deploy)
- Live URL: https://accent-os.pages.dev

### Step 3 — Post-deploy smoke test
- [ ] Load https://accent-os.pages.dev — confirm app boots
- [ ] Open browser DevTools → Console — no JS errors on load
- [ ] Check `window.__AOS_HYDRATED__` is `true` after login (type in console)
- [ ] Console shows `[boot] hydration complete in NNNms`
- [ ] Navigate to Ecommerce Intel — module renders (may show "Connect BC" if M04 not done)
- [ ] Navigate to Quotes — list loads
- [ ] Save a quote — verify atomic save works
- [ ] Run `bash scripts/health-check.sh` — WORKER and PAGES should show green

---

## ROLLBACK CHECKLIST

### Trigger rollback if ANY of these occur:
- [ ] Quote save returns error for all users on a known-good quote
- [ ] Hydration loop or infinite load on app boot
- [ ] Any MODULE_REGISTRY module fails to render (white page / uncaught TypeError)
- [ ] Cloudflare Worker returns non-200 on all requests

### Rollback procedure (Cloudflare Pages):
1. Go to Cloudflare Pages dashboard → `accent-os` project → Deployments
2. Find the last known good deployment
3. Click "Rollback to this deployment"
4. Time to rollback: ~2 minutes

### Rollback procedure (database):
- M45/M46 (quote RPC): The old save path (`/quotes?on_conflict=number` + `/quote_lines`) no longer exists in the JS. If M45/M46 fail, the save path errors. Rollback main and redeploy without M45/M46.
- M47/M48 (BigCommerce): These are additive new tables. Drop them if needed: `DROP TABLE IF EXISTS bc_products_cache, bc_categories_cache, bc_brands_cache, bc_sync_log;`

### Rollback git:
```bash
git checkout main
git revert e609662..HEAD   # revert back to pre-integration main
git push origin main
```

---

## MIGRATION ORDERING (Summary)

| Order | File | Type | Required before |
|-------|------|------|----------------|
| 1 | M45_quote_save_rpc.sql | DDL + function | Quote save live |
| 2 | M46_quote_stale_guard.sql | DDL + trigger | Stale detection live |
| 3 | M47_bigcommerce_schema.sql | DDL new tables | BC sync button |
| 4 | M48_ecommerce_v2_schema.sql | DDL new tables | BC V2 features |

---

## ENVIRONMENT REQUIREMENTS

| Variable | Where | Status |
|----------|-------|--------|
| SUPABASE_URL | sessionStorage `aos-sb-url` | Set by operator in Settings |
| SUPABASE_ANON_KEY | sessionStorage `aos-sb-key` | Set by operator in Settings |
| CF_API_TOKEN | GitHub Actions secret | ⚠ Pending Michael (M-task) |
| CF_ACCOUNT_ID | GitHub Actions secret | ⚠ Pending Michael (M-task) |
| BIGCOMMERCE_STORE_HASH | App Settings (bc module) | ⚠ Pending Michael (M04) |
| BIGCOMMERCE_ACCESS_TOKEN | App Settings (bc module) | ⚠ Pending Michael (M04) |

---

## FIRST DEPLOYMENT SCOPE (Recommended)

**Deploy with:** Quote hardening (M45/M46) + all JS changes + Ecommerce Intel module
**Defer:** BigCommerce SQL (M47/M48) until Michael provides BC credentials (M04)
**Defer:** Full BC sync functionality (requires live BC API credentials)
**The Ecommerce Intel module is safe to deploy immediately** — it gracefully degrades to "Connect BC" UI if credentials are absent.
