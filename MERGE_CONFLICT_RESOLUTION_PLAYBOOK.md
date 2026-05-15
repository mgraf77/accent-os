# MERGE_CONFLICT_RESOLUTION_PLAYBOOK.md
> Session 31 — Wave 1
> Companion to MERGE_EXECUTION_CHECKLIST_V1.md
> Use this when (not if) one of the known conflict classes triggers.

---

## CONFLICT CLASS 1 — M45/M50 SQL NAMING COLLISION
*(treats M45/M46 quote vs M45/M46 BigCommerce as the canonical case; M49/M50 same rule applies for any future renumber)*

### Symptom
Two branches both author `sql/M<N>_<name>.sql` at the same N.

### Decision rule
The migration with **data-integrity scope** keeps the lower number. Additive/feature schemas get pushed up.

Concretely for Wave 1:
- **Keep:** `M45_quote_save_rpc.sql`, `M46_quote_stale_guard.sql` (quote integrity = lower).
- **Renumber:** BigCommerce `M45_bigcommerce_schema.sql` → `M47_bigcommerce_schema.sql`; `M46_ecommerce_v2_schema.sql` → `M48_ecommerce_v2_schema.sql`.

### Procedure
1. Do NOT use `git checkout -- sql/`. Use `git show <branch>:<path> > <new-name>` to copy + rename in one step.
2. Inside the renamed file, scan for self-references (e.g., comments referencing `M45`/`M46`). Update to new number.
3. Scan codebase for string refs:
   ```
   grep -rn "M45_bigcommerce\|M46_ecommerce_v2" .
   ```
   Replace any hits.
4. Update SQL APPLY ORDER table in MERGE_EXECUTION_CHECKLIST_V1.md if numbers shift again.

### Gate
- Exactly one file per Mxx number.
- `ls sql/ | sort` shows monotonically increasing Mxx values.
- Each file's first non-comment line declares its own migration tag matching filename.

### Rollback
Delete the renumbered file; restore original from branch via `git show`. Do not edit-in-place; always re-copy.

---

## CONFLICT CLASS 2 — index.html OVERLAP

### Symptom
Multiple branches touch `index.html` in different regions. Cherry-pick succeeds but two patches touch nearby lines, or one patch's anchor moved due to a prior patch.

### Regions in play (Wave 1)
| Region | Owner | Step |
|--------|-------|------|
| `sbFetch` body | B1 | first |
| `sbLoadQuotes` / `sbSaveQuote` | B2 | after B1 |
| hydration block (`hydrateFromSupabase`) | B1 (toast) + B3 (timing log) | B1 then B3 |
| `openRepOutreach` (delete) | B3 | after B1/B2 |
| `MODULE_REGISTRY` literal | C1 | after B-phase |
| `<body>` script tag tail | C1 | last in this phase |

### Procedure (strict order)
1. Execute B1, B2, B3 in that exact order. Each via cherry-pick where possible.
2. If a cherry-pick fails with conflict:
   - Open conflicted file, search for `<<<<<<<`.
   - Resolve in favor of the **later** semantic in conflict class:
     - hydration block: keep B1's toast AND B3's timing log (both, additive).
     - sbFetch: B1 wins (it is the only writer).
     - sbSaveQuote: B2 wins (full replacement).
   - `git add index.html && git cherry-pick --continue`.
3. For C1 MODULE_REGISTRY + script tags, do NOT cherry-pick — apply as manual hunks against post-B HEAD.
4. After every index.html change: re-run sha256 and append to canon delta log.

### Forbidden
- Never `git checkout origin/<branch> -- index.html` (overwrites accumulated work).
- Never resolve by accepting `--theirs` or `--ours` wholesale.

### Gate
- `grep -c "AbortController" index.html` ≥ 1
- `grep -c "upsert_quote_with_lines" index.html` ≥ 1
- `grep -c "__AOS_HYDRATED__" index.html` ≥ 1
- `grep -c "openRepOutreach" index.html` == 0
- `grep -c "ecommerce_intelligence.js" index.html` == 1
- `grep -c "MODULE_REGISTRY" index.html` ≥ 1 with `ecommerce` key present

### Rollback
File-scoped: `git checkout HEAD~N -- index.html` for the smallest N that backs out the bad region; then re-run remaining steps from that point.

---

## CONFLICT CLASS 3 — WORKER OVERLAP

### Symptom
Two branches each register a background worker / interval / queue consumer with overlapping ownership (e.g., both wire a hydration-completion handler, both attach to the same event).

### Wave 1 specifics
- `ecommerce_intelligence.js` may register a post-hydration init.
- B3 introduces `window.__AOS_HYDRATED__`.
- Ownership rule: post-hydration consumers MUST observe `__AOS_HYDRATED__` (read), never set it.

### Procedure
1. Audit each new JS file for these patterns:
   ```
   grep -nE "addEventListener\\('?(load|DOMContentLoaded)|setInterval|setTimeout|MutationObserver" js/bigcommerce_adapter.js js/ga4_adapter.js js/gsc_adapter.js js/klaviyo_adapter.js js/gmc_adapter.js js/ecommerce_intelligence.js
   ```
2. Confirm only ONE writer of `__AOS_HYDRATED__` (must be index.html / B3).
3. Confirm no adapter starts polling before hydration. If it does, gate with `if (!window.__AOS_HYDRATED__) return;` at top of its init.
4. Confirm script tag order: ecommerce_intelligence.js is the LAST script tag (it depends on bigcommerce_adapter.js).

### Gate
- Single writer of `__AOS_HYDRATED__`.
- No `setInterval` < 1000ms in any new adapter.
- No duplicate `DOMContentLoaded` listeners across the 6 new files.

### Rollback
Per-file: `git rm js/<offending>.js && git commit`. Strip its `<script>` tag from index.html.

---

## CONFLICT CLASS 4 — CANON HASH UPDATES

### Symptom
Canon hash file (sha256 manifest of authoritative files) is stale or two branches both update it.

### Procedure
1. Canon update is ALWAYS a separate commit AFTER the merge commit.
2. Compute hashes against the integration branch HEAD only (never against any source branch).
3. Hash inputs (in this order):
   - `index.html`
   - `js/bigcommerce_adapter.js`, `js/ga4_adapter.js`, `js/gsc_adapter.js`, `js/klaviyo_adapter.js`, `js/gmc_adapter.js`, `js/ecommerce_intelligence.js`
   - `sql/M45_quote_save_rpc.sql`, `sql/M46_quote_stale_guard.sql`, `sql/M47_bigcommerce_schema.sql`, `sql/M48_ecommerce_v2_schema.sql`
   - `scripts/runtime-health.js`, `patch_quote.js`, `module_modes.json`
4. If two prepared canon bundles disagree, the one computed on integration HEAD wins. Discard the other.

### Gate
- Canon file's referenced commit SHA == integration HEAD.
- Every listed path resolves and matches recomputed hash.

### Rollback
Revert the canon-update commit only. Integration commit remains.

---

## CONFLICT CLASS 5 — SIGNAL OWNERSHIP OVERLAP

### Symptom
Two modules claim authority for the same telemetry signal / KPI / event name (e.g., `quote.saved`, `ecommerce.metrics.refreshed`).

### Ownership rules (Wave 1)
| Signal | Owner | Notes |
|--------|-------|-------|
| `quote.*` | quote subsystem (B2) | sole authority |
| `ecommerce.*` | `ecommerce_intelligence.js` | sole authority |
| `bigcommerce.adapter.*` | `bigcommerce_adapter.js` | adapter-scoped only |
| `ga4.*` / `gsc.*` / `klaviyo.*` / `gmc.*` | corresponding adapter | adapter-scoped only |
| hydration lifecycle | index.html (B1+B3) | `__AOS_HYDRATED__` only |

### Procedure
1. `grep -rn "emit\\|dispatch\\|CustomEvent\\|window\\.dispatchEvent" js/*.js index.html` to list all signal emitters.
2. For each emitter, confirm its prefix matches the owning module.
3. If a non-owning module emits an owned signal: refactor the emitter to use its own namespace, then have the owner re-emit if needed.
4. No module may both emit AND consume the same signal name to itself (that's just a function call).

### Gate
- Each `*.*` namespace has exactly one emitter file.
- No cross-namespace emits.

### Rollback
Revert the offending module's signal-emit code only; do not roll back the whole module unless ownership conflict cannot be resolved.

---

## GENERAL ESCALATION

If two or more conflict classes trigger in one step:
1. Stop. Do not patch-on-patch.
2. `git reset --hard <SHA-before-step>`.
3. Re-plan that step in isolation.
4. Resume from that step (not earlier).

If a conflict class fires that is NOT in this playbook: STOP THE WAVE. Trigger WAVE1_ABORT_CONDITIONS.md path.
