# MERGE_PLAN.md
> Generated: 2026-05-13 — MASTER_RECONCILIATION_AND_DEPLOYMENT_V1
> Base branch: `main` @ e609662
> Target integration branch: `integration/reconcile-v2`

---

## MERGE STRATEGY OVERVIEW

Three non-negotiable constraints drive order:

1. **Transactional quote save** (`harden-quote-transactions`) must be the authoritative save path. The previous 3-call REST pattern has a data corruption risk. No code that uses the old pattern should land after this.
2. **`sbFetch` hardening** (`harden-operational-workflows`) is a cross-cutting fix. It must land before any module that makes Supabase calls (i.e., before BigCommerce adapters) to ensure all calls inherit the 15s timeout and 401 handler.
3. **SQL migrations must be renumbered** before BigCommerce SQL can coexist with quote SQL. BigCommerce M45/M46 → M47/M48.

---

## PHASE A — BRANCH SETUP

```bash
git checkout main
git pull origin main
git checkout -b integration/reconcile-v2
```

---

## PHASE B — LAYER 1: RUNTIME HARDENING (index.html)

Apply changes to index.html in this order. All changes are to non-overlapping regions except where noted — manual cherry-pick + patch method to avoid merge conflicts.

### Step B1: harden-operational-workflows (sbFetch + hydration error surfacing)
- **Commit:** `7a0d26f`
- **What:** `sbFetch` gets 15s AbortController timeout + 401 session expiry handler. `hydrateFromSupabase` gets user-visible error toast for quote load failures. `_qDirty` + `_qSaving` guard on quote save.
- **Method:** `git cherry-pick 7a0d26f`
- **Conflict risk:** NONE — modifies `sbFetch` and hydration, regions not touched by any other merge candidate in this phase.

### Step B2: harden-quote-transactions (atomic save RPC + stale detection)
- **Commit:** `c0714b4`, `f57b5bf`
- **What:** `sbLoadQuotes` adds `updated_at` field + `_updatedAt` mapping. `sbSaveQuote` replaced with single atomic RPC call. Error re-thrown.
- **Method:** `git cherry-pick c0714b4 f57b5bf`
- **Conflict risk:** LOW — modifies sbLoadQuotes/sbSaveQuote only. After B1, sbFetch is already hardened. The RPC save path calls sbFetch, so B1 → B2 order is correct.
- **DEPENDS ON:** M45 + M46 SQL applied to Supabase before going live.

### Step B3: accent-work-514226236373803311 (hydration timing + dead code removal)
- **Commits:** `441e5ed` (runtime changes in index.html only, docs deferred)
- **What:** Adds hydration timing log + `window.__AOS_HYDRATED__` global. Removes `openRepOutreach()` dead code (~60 lines). Removes stale TODO.
- **Method:** Cherry-pick only the index.html runtime changes via `git checkout origin/accent-work-514226236373803311 -- index.html` then selectively apply. Safer: manual patch the 3 specific hunks.
- **Conflict risk:** LOW — hydration region is different from sbFetch (B1) and sbSaveQuote (B2). The `openRepOutreach` removal is in a different section entirely.

---

## PHASE C — LAYER 2: NEW MODULES (new JS files + MODULE_REGISTRY)

### Step C1: BigCommerce Ecommerce Intelligence
- **Source:** `origin/claude/bigcommerce-integration-setup-fio8z`
- **What to take:**
  - All 6 new JS files: `js/bigcommerce_adapter.js`, `js/ga4_adapter.js`, `js/gsc_adapter.js`, `js/klaviyo_adapter.js`, `js/gmc_adapter.js`, `js/ecommerce_intelligence.js`
  - MODULE_REGISTRY entry for `ecommerce` key in index.html
  - 6 script tags appended at end of `<body>` in index.html
  - `docs/integrations/BIGCOMMERCE_INTEGRATION_AUDIT.md`
  - `docs/integrations/BIGCOMMERCE_RUNWAY.md`
- **What NOT to take:**
  - `sql/M45_bigcommerce_schema.sql` (naming conflict — see §SQL below)
  - `sql/M46_ecommerce_v2_schema.sql` (naming conflict — see §SQL below)
  - `PROMPT_LOG.md`, `WORK_IN_PROGRESS.md` (session metadata, not code)
- **Method:** `git checkout origin/claude/bigcommerce-integration-setup-fio8z -- js/bigcommerce_adapter.js js/ga4_adapter.js js/gsc_adapter.js js/klaviyo_adapter.js js/gmc_adapter.js js/ecommerce_intelligence.js docs/integrations/`
  Then manually apply the 2 index.html hunks (MODULE_REGISTRY entry + script tags).
- **Conflict risk:** LOW — script tags added at end of body don't conflict with quote changes (top of file). MODULE_REGISTRY addition is a single-line insert.

---

## PHASE D — LAYER 3: SUPPORTING SCRIPTS + RUNTIME FILES

### Step D1: accent-work-514226236373803311 new runtime files
- **What:** `scripts/runtime-health.js`, `patch_quote.js`, `module_modes.json`
- **Method:** `git checkout origin/accent-work-514226236373803311 -- scripts/runtime-health.js patch_quote.js module_modes.json`
- **Conflict risk:** NONE — all new files.

---

## PHASE E — LAYER 4: DOCS + ANALYSIS (no runtime impact)

### Step E1: accent-work-514226236373803311 architecture docs
- **Method:** `git merge --no-ff origin/accent-work-514226236373803311 -X theirs` on doc-only files, or cherry-pick the doc commits.
- **Safer method:** `git checkout origin/accent-work-514226236373803311 -- docs/` then review.

### Step E2: ecommerce-intel-v1 reports
- **Method:** `git checkout origin/ecommerce-intel-v1-247115529123932528 -- docs/ECOMMERCE_INTELLIGENCE_REPORT_V1.md docs/ECOMMERCE_INTELLIGENCE_REPORT_V2.md scripts/analyze_vendors.py scripts/analyze_vendors_v2.py scripts/extract_sales_v3.py`

### Step E3: klaviyo-marketing-intel doc
- **Method:** `git checkout origin/klaviyo-marketing-intel-v1-13574086956632958594 -- docs/KLAVIYO_MARKETING_INTELLIGENCE_V1.md`

### Step E4: runtime-stabilization-layer docs (optional)
- **Note:** This branch contains design/governance documents only. Zero runtime impact. Include if governance doc tree is wanted; omit if current scope is runtime-only.
- **Method:** `git checkout origin/claude/runtime-stabilization-layer-Tneyd -- STABILIZATION_LAYER.md audits/ evolution-memory/ governance/ loops/ policies/ registers/ runtime-state/ stable-evolution-runtime/ templates/`

---

## PHASE F — SQL MIGRATION RENAMING

### The Problem
Both `harden-quote-transactions` and `bigcommerce-integration` claim M45 and M46.

### Resolution
Quote transactions keep M45/M46 (they are more operationally critical — data integrity):

| Original file | Integration branch name | Supabase apply order |
|---------------|------------------------|---------------------|
| M45_quote_save_rpc.sql | **M45** — unchanged | 1st |
| M46_quote_stale_guard.sql | **M46** — unchanged | 2nd |
| M45_bigcommerce_schema.sql | **M47_bigcommerce_schema.sql** | 3rd |
| M46_ecommerce_v2_schema.sql | **M48_ecommerce_v2_schema.sql** | 4th |

### Step F1: Copy + rename BigCommerce SQL files
```bash
git show origin/claude/bigcommerce-integration-setup-fio8z:sql/M45_bigcommerce_schema.sql > sql/M47_bigcommerce_schema.sql
git show origin/claude/bigcommerce-integration-setup-fio8z:sql/M46_ecommerce_v2_schema.sql > sql/M48_ecommerce_v2_schema.sql
```
**Do NOT copy** `sql/M45_bigcommerce_schema.sql` or `sql/M46_ecommerce_v2_schema.sql` directly.

---

## PHASE G — DEFERRED (NOT IN THIS INTEGRATION)

| Item | Why deferred |
|------|-------------|
| `improve-quote-generator` extraction to `js/quotes.js` | Conflicts with transactional save path. Must be ported to call `upsert_quote_with_lines` RPC rather than old REST pattern before it can land. |
| Mobile CSS from `improve-quote-generator` | Safe to cherry-pick separately after core integration is verified. |
| `claude/runtime-stabilization-layer-Tneyd` runtime spec patches | Design-only; no runtime code to merge. |

---

## FULL ORDERED EXECUTION SEQUENCE

```
1. git checkout main && git pull origin main
2. git checkout -b integration/reconcile-v2
3. git cherry-pick 7a0d26f                           # B1: sbFetch hardening + 401 + timeout
4. git cherry-pick c0714b4 f57b5bf                   # B2: atomic quote RPC save + stale detection
5. Manual patch: 3 hydration hunks from 441e5ed       # B3: hydration timing + openRepOutreach removal
6. Checkout BC JS files + docs from bigcommerce branch # C1
7. Manual patch: MODULE_REGISTRY ecommerce entry      # C1 cont.
8. Manual patch: 6 script tags at end of body         # C1 cont.
9. Checkout runtime-health.js, patch_quote.js, module_modes.json # D1
10. Checkout docs from accent-work-514... branch      # E1
11. Checkout ecommerce intelligence reports + scripts  # E2
12. Checkout klaviyo doc                              # E3
13. (Optional) Checkout stabilization docs            # E4
14. Create sql/M47_bigcommerce_schema.sql             # F1
15. Create sql/M48_ecommerce_v2_schema.sql            # F1
16. git add -A && git commit -m "integration: reconcile-v2 controlled merge"
17. Run verification suite (Phase 4)
```

---

## RUNTIME DEPENDENCY ORDER (module initialization)

```
index.html inline globals (SUPABASE_URL, sbFetch, sbConfigured, MODULE_REGISTRY)
  └─ DOMContentLoaded → activateApp() → hydrateFromSupabase()
       └─ All sbLoad* calls (parallel try/catch)
            └─ hydration complete → window.__AOS_HYDRATED__ = true

Script load order at bottom of body (must be maintained):
  activity_feed.js → alerts.js → bulk_select.js → module_modes.js → internal_meetings.js
  → bigcommerce_adapter.js  ← NEW (no dependencies on others)
  → ga4_adapter.js          ← NEW (standalone)
  → gsc_adapter.js          ← NEW (standalone)
  → klaviyo_adapter.js      ← NEW (standalone)
  → gmc_adapter.js          ← NEW (standalone)
  → ecommerce_intelligence.js ← NEW (depends on bigcommerce_adapter.js — must be last)
```

---

## SQL APPLY ORDER (Supabase — pre-deployment)

```
M01 → M02 → M21–M44 (already applied to prod)
M45_quote_save_rpc.sql          ← apply FIRST (quote integrity)
M46_quote_stale_guard.sql       ← apply SECOND
M47_bigcommerce_schema.sql      ← apply THIRD (additive, new tables only)
M48_ecommerce_v2_schema.sql     ← apply FOURTH (additive)
```
