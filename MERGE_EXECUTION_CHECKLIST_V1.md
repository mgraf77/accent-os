# MERGE_EXECUTION_CHECKLIST_V1.md
> Session 31 — Wave 1 controlled merge execution
> Derived from: MERGE_PLAN.md (canonical)
> Status: PLANNING ONLY — no merges executed yet

---

## PURPOSE
Convert MERGE_PLAN.md into an executable, gated, reversible sequence. Every action below has:
- explicit ordering
- explicit validation gate
- explicit rollback point
- explicit canon update point

Do NOT skip gates. Do NOT reorder steps. If a gate fails, jump to the matching rollback row and stop.

---

## PRE-WAVE GATES (must all be GREEN before step 1)

| Gate | Check | Pass criteria |
|------|-------|---------------|
| PG-1 | `git status` on main | clean tree |
| PG-2 | `git fetch --all --prune` | succeeds, no errors |
| PG-3 | All source branches reachable | `7a0d26f`, `c0714b4`, `f57b5bf`, `441e5ed`, `origin/claude/bigcommerce-integration-setup-fio8z` resolvable |
| PG-4 | Supabase staging snapshot taken | snapshot ID logged below |
| PG-5 | `index.html` byte size + sha256 recorded | baseline captured in WAVE1_RUNTIME_BASELINE.md |
| PG-6 | No uncommitted work in WORK_IN_PROGRESS.md | empty or "none" |

Snapshot ID: _______________  Captured: _______________

---

## ORDERED MERGE ACTIONS

### A0 — Branch setup
- [ ] `git checkout main && git pull origin main`
- [ ] `git checkout -b integration/reconcile-v2`
- **Validation gate G0:** `git log -1 --oneline` matches main HEAD.
- **Rollback R0:** `git checkout main; git branch -D integration/reconcile-v2`
- **Canon update:** none yet.

### B1 — harden-operational-workflows (sbFetch + 401 + hydration toast)
- [ ] `git cherry-pick 7a0d26f`
- **Validation gate G1:**
  - grep `AbortController` in `index.html` → present
  - grep `15000` (timeout ms) in `index.html` → present
  - grep `401` handler in `sbFetch` → present
- **Rollback R1:** `git reset --hard HEAD~1`
- **Canon update C1:** record new `index.html` sha256 in CANON.

### B2 — harden-quote-transactions (atomic RPC + stale detection)
- [ ] `git cherry-pick c0714b4 f57b5bf`
- **Pre-req:** B1 landed (sbFetch must already be hardened before quote save uses it).
- **Validation gate G2:**
  - grep `upsert_quote_with_lines` in `index.html` → present
  - grep `_updatedAt` in `sbLoadQuotes` block → present
  - SQL M45/M46 files exist under `sql/`
- **Rollback R2:** `git reset --hard <SHA-before-B2>`. Note: do NOT roll back past B1 unless aborting.
- **Canon update C2:** record `index.html` sha256, SQL M45/M46 sha256, RPC signature.

### B3 — accent-work hydration timing + dead code removal
- [ ] Manual patch (3 hunks from `441e5ed`): hydration timing log, `window.__AOS_HYDRATED__`, remove `openRepOutreach`.
- **Validation gate G3:**
  - grep `__AOS_HYDRATED__` in `index.html` → present
  - grep `openRepOutreach` in `index.html` → ABSENT
- **Rollback R3:** `git checkout HEAD~1 -- index.html` (only this file).
- **Canon update C3:** record `index.html` sha256.

### C1 — BigCommerce ecommerce module
- [ ] `git checkout origin/claude/bigcommerce-integration-setup-fio8z -- js/bigcommerce_adapter.js js/ga4_adapter.js js/gsc_adapter.js js/klaviyo_adapter.js js/gmc_adapter.js js/ecommerce_intelligence.js docs/integrations/`
- [ ] Manual patch: MODULE_REGISTRY `ecommerce` entry into `index.html`
- [ ] Manual patch: 6 script tags appended at end of `<body>`, in this order: bigcommerce_adapter → ga4 → gsc → klaviyo → gmc → ecommerce_intelligence
- **DO NOT TAKE:** `sql/M45_bigcommerce_schema.sql`, `sql/M46_ecommerce_v2_schema.sql`, `PROMPT_LOG.md`, `WORK_IN_PROGRESS.md` from this branch.
- **Validation gate G4:**
  - all 6 JS files present, non-empty
  - MODULE_REGISTRY contains `ecommerce` key exactly once
  - script tag order matches dependency rule (ecommerce_intelligence MUST be last)
- **Rollback R4:** `git reset --hard <SHA-before-C1>` then re-run C1 from clean state.
- **Canon update C4:** record JS file sha256s, MODULE_REGISTRY hash.

### D1 — Supporting runtime files
- [ ] `git checkout origin/accent-work-514226236373803311 -- scripts/runtime-health.js patch_quote.js module_modes.json`
- **Validation gate G5:** files present; `module_modes.json` is valid JSON.
- **Rollback R5:** `git rm scripts/runtime-health.js patch_quote.js module_modes.json && git commit`.
- **Canon update C5:** none (additive only).

### E1–E3 — Doc imports (zero runtime risk)
- [ ] E1: `git checkout origin/accent-work-514226236373803311 -- docs/`
- [ ] E2: `git checkout origin/ecommerce-intel-v1-247115529123932528 -- docs/ECOMMERCE_INTELLIGENCE_REPORT_V1.md docs/ECOMMERCE_INTELLIGENCE_REPORT_V2.md scripts/analyze_vendors.py scripts/analyze_vendors_v2.py scripts/extract_sales_v3.py`
- [ ] E3: `git checkout origin/klaviyo-marketing-intel-v1-13574086956632958594 -- docs/KLAVIYO_MARKETING_INTELLIGENCE_V1.md`
- **Validation gate G6:** no `index.html` change; no `js/*.js` change.
- **Rollback R6:** `git checkout HEAD~1 -- docs/`.
- **Canon update C6:** none.

### E4 — (OPTIONAL) Stabilization governance docs
- [ ] Decision required before executing: include or skip. Default: SKIP for Wave 1.
- If included: `git checkout origin/claude/runtime-stabilization-layer-Tneyd -- STABILIZATION_LAYER.md audits/ evolution-memory/ governance/ loops/ policies/ registers/ runtime-state/ stable-evolution-runtime/ templates/`
- **Validation gate G7:** no runtime files modified.
- **Rollback R7:** `git reset --hard <SHA-before-E4>`.

### F1 — SQL renaming (M45/M46 → M47/M48 for BigCommerce)
- [ ] `git show origin/claude/bigcommerce-integration-setup-fio8z:sql/M45_bigcommerce_schema.sql > sql/M47_bigcommerce_schema.sql`
- [ ] `git show origin/claude/bigcommerce-integration-setup-fio8z:sql/M46_ecommerce_v2_schema.sql > sql/M48_ecommerce_v2_schema.sql`
- **Validation gate G8:**
  - `sql/M45_bigcommerce_schema.sql` does NOT exist
  - `sql/M46_ecommerce_v2_schema.sql` does NOT exist
  - `sql/M45_quote_save_rpc.sql` exists
  - `sql/M46_quote_stale_guard.sql` exists
  - `sql/M47_bigcommerce_schema.sql` exists
  - `sql/M48_ecommerce_v2_schema.sql` exists
- **Rollback R8:** `git rm sql/M47_bigcommerce_schema.sql sql/M48_ecommerce_v2_schema.sql`.
- **Canon update C8:** record sha256 of M45–M48; update SQL apply order in CANON.

### Z — Wave 1 final commit
- [ ] `git add -A && git commit -m "integration: reconcile-v2 controlled merge wave 1"`
- **Validation gate GZ:** run WAVE1_POSTMERGE_BOOT_SEQUENCE.md in full. All checks GREEN.
- **Rollback RZ:** `git checkout main` (keep integration branch for forensics).
- **Canon update CZ:** publish canon hash bundle (index.html, all new JS, all SQL).

---

## SUMMARY: ROLLBACK POINTS (ordered by safety, safest first)

1. RZ — abandon integration branch (zero impact on main)
2. R8 — undo SQL rename only
3. R6/R7 — undo docs only
4. R5 — undo D1 runtime helpers
5. R4 — undo BigCommerce (highest non-quote rollback complexity)
6. R3 — undo B3 hydration
7. R2 — undo B2 quote RPC (DANGEROUS: must coordinate with Supabase SQL not yet applied)
8. R1 — undo B1 sbFetch (DANGEROUS: invalidates B2)
9. R0 — full reset

---

## CANON UPDATE BATCH (run once at end)

Per CANON_UPDATE_REQUIREMENTS (referenced):
- index.html sha256 (post-Z)
- all new JS file sha256s
- SQL M45/M46/M47/M48 sha256s
- MODULE_REGISTRY hash
- script-tag order hash
- RPC signature: `upsert_quote_with_lines(...)`
- baseline: `window.__AOS_HYDRATED__` contract preserved

Commit canon update as a SEPARATE commit after Z. Never bundle canon hash update with merge commit.
