# WAVE1_POSTMERGE_BOOT_SEQUENCE.md
> Session 31 — Wave 1
> Run this — IN ORDER — after the final Wave 1 integration commit, before publishing canon update.
> Every check is PASS / FAIL. First FAIL → consult WAVE1_ABORT_CONDITIONS.md.

---

## STAGE 0 — REPO STATE

| # | Check | Command | Pass criteria |
|---|-------|---------|---------------|
| 0.1 | On integration branch | `git rev-parse --abbrev-ref HEAD` | `integration/reconcile-v2` |
| 0.2 | Working tree clean | `git status --porcelain` | empty |
| 0.3 | One merge commit at HEAD | `git log -1 --pretty=%s` | matches "integration: reconcile-v2 controlled merge wave 1" |

---

## STAGE 1 — FILE PRESENCE (additive checks)

| # | Check | Command | Pass |
|---|-------|---------|------|
| 1.1 | New JS files | `ls js/bigcommerce_adapter.js js/ga4_adapter.js js/gsc_adapter.js js/klaviyo_adapter.js js/gmc_adapter.js js/ecommerce_intelligence.js` | all exist |
| 1.2 | New SQL files | `ls sql/M45_quote_save_rpc.sql sql/M46_quote_stale_guard.sql sql/M47_bigcommerce_schema.sql sql/M48_ecommerce_v2_schema.sql` | all exist |
| 1.3 | Renamed SQL absent | `ls sql/M45_bigcommerce_schema.sql sql/M46_ecommerce_v2_schema.sql 2>&1` | "No such file" for both |
| 1.4 | Supporting runtime | `ls scripts/runtime-health.js patch_quote.js module_modes.json` | all exist |
| 1.5 | module_modes.json valid | `python3 -c "import json; json.load(open('module_modes.json'))"` | exits 0 |

---

## STAGE 2 — index.html INVARIANTS

| # | Check | Command | Pass |
|---|-------|---------|------|
| 2.1 | sbFetch hardened | `grep -c "AbortController" index.html` | ≥ 1 |
| 2.2 | 15s timeout | `grep -c "15000" index.html` | ≥ 1 |
| 2.3 | 401 handler | `grep -c " 401" index.html` | ≥ 1 |
| 2.4 | Atomic RPC | `grep -c "upsert_quote_with_lines" index.html` | ≥ 1 |
| 2.5 | Hydration flag | `grep -c "__AOS_HYDRATED__" index.html` | ≥ 1 |
| 2.6 | Dead code removed | `grep -c "openRepOutreach" index.html` | 0 |
| 2.7 | ecommerce in registry | `grep -c "ecommerce" index.html` | ≥ 1 (verify in MODULE_REGISTRY block specifically) |
| 2.8 | ecommerce_intelligence is last new script | manual inspect: 6 new tags at end of `<body>` in declared order | order correct |

---

## STAGE 3 — TELEMETRY / SIGNAL OWNERSHIP

| # | Check | Command | Pass |
|---|-------|---------|------|
| 3.1 | Single writer of __AOS_HYDRATED__ | `grep -rn "__AOS_HYDRATED__\\s*=" index.html js/` | exactly 1 hit, in index.html |
| 3.2 | No cross-namespace emits | playbook Class 5 grep | each prefix has one emitter |
| 3.3 | No sub-1s intervals | `grep -rnE "setInterval\\([^,]+,\\s*[0-9]{1,3}\\)" js/ index.html` | 0 hits with <1000ms |

---

## STAGE 4 — SUPABASE / SQL READINESS (staging only)

| # | Check | Action | Pass |
|---|-------|--------|------|
| 4.1 | Staging snapshot exists | recorded in WAVE1_RUNTIME_BASELINE.md | non-empty snapshot ID |
| 4.2 | Apply M45 to staging | via Supabase MCP `apply_migration` | success |
| 4.3 | Apply M46 to staging | as above | success |
| 4.4 | Apply M47 to staging | as above | success |
| 4.5 | Apply M48 to staging | as above | success |
| 4.6 | RPC callable | `execute_sql`: `SELECT proname FROM pg_proc WHERE proname='upsert_quote_with_lines'` | 1 row |
| 4.7 | Advisor scan | `get_advisors` | no NEW critical findings vs baseline |

Production application is OUT OF SCOPE for Wave 1 prep. Do not apply to prod.

---

## STAGE 5 — RUNTIME SMOKE (staging build)

| # | Check | Action | Pass |
|---|-------|--------|------|
| 5.1 | Load app in browser against staging Supabase | manual | no console errors |
| 5.2 | `window.__AOS_HYDRATED__` true | DevTools console | `true` within 5s |
| 5.3 | Save a test quote | UI action | RPC returns; `_updatedAt` populated |
| 5.4 | Stale-write rejection | simulate via two tabs | second save fails fast |
| 5.5 | 401 handling | force expired token | toast + session-expired UX |
| 5.6 | Ecommerce module loads | DevTools `MODULE_REGISTRY.ecommerce` | defined |
| 5.7 | scripts/runtime-health.js runnable | `node scripts/runtime-health.js` (if applicable) | exits 0 |

---

## STAGE 6 — GOVERNANCE / CANON

| # | Check | Action | Pass |
|---|-------|--------|------|
| 6.1 | BUILD_PLAN_CLAUDE.md Wave 1 items marked `[x]` | manual review | only after stages 0–5 green |
| 6.2 | SESSION_LOG.md entry written | manual | present |
| 6.3 | PROMPT_LOG.md updated | manual | present |
| 6.4 | WORK_IN_PROGRESS.md empty / "none" | `cat WORK_IN_PROGRESS.md` | cleared |
| 6.5 | Canon hash bundle commit | `git log -1 --pretty=%s` | "canon: post-wave-1 hash bundle" (separate commit AFTER merge) |
| 6.6 | Canon references integration HEAD | manual | SHAs match |
| 6.7 | KPI_CATALOG.md unchanged in entry count | diff against baseline | equal |

---

## TERMINAL DECISION

- All stages PASS → Wave 1 prep complete. Branch is ready for operator review and merge-to-main scheduling.
- Any FAIL → consult WAVE1_ABORT_CONDITIONS.md. Do NOT proceed to publish canon.

---

## EXECUTION LOG TEMPLATE (fill during the boot run)

```
Stage 0: [ ]  notes:
Stage 1: [ ]  notes:
Stage 2: [ ]  notes:
Stage 3: [ ]  notes:
Stage 4: [ ]  notes:
Stage 5: [ ]  notes:
Stage 6: [ ]  notes:
Final:   [ ]  green / aborted
```
