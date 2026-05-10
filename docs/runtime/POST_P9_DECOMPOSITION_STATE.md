# Post-P9 Decomposition State
> Ground truth as of 2026-05-10. Branch: claude/setup-codex-integration-gMAyH.
> index.html: 7,175 → 1,310 lines (−5,865 lines, −82%).

---

## Phase 1 + Phase 1.5 Completed Packets

| Packet | Module | Lines Extracted | Commit |
|---|---|---|---|
| P1 | js/vendors_module.js | 1,843 | c345f23 |
| P2 | js/vendor_scoring.js | 682 | 5168e6d |
| P3 | js/quotes_module.js | 531 | b517b8e |
| P4 | js/dashboard_module.js | 507 | 48c37bd |
| P5 | js/mgmt_module.js | 468 | cf9d32c |
| P6 | js/pipeline_module.js | 349 | 2f12a29 |
| P7 | js/repoutreach_module.js | 569 | a43f37b |
| P8 | js/settings_module.js | 146 | b1321b3 |
| P9 | js/knowledge_module.js | 80 | b2736b3 |
| P1.5a | js/vendors_overflow.js | 265 | f241e1c |
| P1.5b | js/vendor_filters.js | 165 | 60709b1 |
| P1.5c | js/vendor_scoring_helpers.js | 172 | 37605a4 |
| P1.5d | js/supabase_categories.js | 110 | b49b905 |
| **Total** | **13 modules** | **5,887 lines** | — |

---

## Confirmed Script Tag Load Order (post-P1.5d index.html)

```
js/vendor_score_import.js       (pre-existing, v6.10.47)
js/vendor_filters.js            (P1.5b, v6.11.1) — BEFORE vendors_module (vFilters dep)
js/vendors_module.js            (P1, v6.11.1)
js/vendor_scoring.js            (P2, v6.11.1)
js/supabase_categories.js       (P1.5d, v6.11.1) — after vendor_scoring
js/vendor_scoring_helpers.js    (P1.5c, v6.11.1)
js/quotes_module.js             (P3, v6.11.1)
js/dashboard_module.js          (P4, v6.11.1)
js/mgmt_module.js               (P5, v6.11.1)
js/pipeline_module.js           (P6, v6.11.1)
js/repoutreach_module.js        (P7, v6.11.1)
js/vendors_overflow.js          (P1.5a, v6.11.1)
js/settings_module.js           (P8, v6.11.1)
js/knowledge_module.js          (P9, v6.11.1)
```

All 13 Phase 1/1.5 modules confirmed present and in correct dependency order.

---

## Remaining Inline Blocks (current index.html = 1,310 lines)

These blocks MUST stay inline — all are synchronous global infrastructure or
HTML/CSS structure. Phase 2+ (module loader) required to extract further.

### MUST-STAY-INLINE

| Block | Approx Lines | Why it stays |
|---|---|---|
| HTML header + CSS | 1–525 | HTML structure, styles, viewport |
| AUTH | 526–725 | jwtKey(), applyRoleVisibility() called synchronously at load |
| SIDEBAR / UTILS / NAV | 726–881 | goTo(), toast(), openModal() — sync global helpers |
| FEEDBACK + ACTIVITY_LOG | 882–911 | log() called by modules at load; _activityLog global |
| PRODUCT_TAXONOMY | 912–1062 | vendorProductCats data needed by vendor scoring at load |
| SUPABASE_CORE | 1063–1103 | sbFetch(), sbConfigured(), sbKey() — sync globals used everywhere |
| VD_RAW / REP_DIRECTORY / CAT_DEFS | 1104–1230 | 494-vendor + 30-rep data arrays + category defs — must precede all modules |
| HELPERS + BOOT | 1231–1310 | getS(), hydrateFromSupabase(), boot(), DOMContentLoaded sequence, script tags |

**Total must-stay: ~1,310 lines** (HTML/CSS + global JS infrastructure + data arrays)

### NOT SAFE TO EXTRACT (Phase 2+ only)
- AUTH block — deeply coupled to HTML session init, synchronous
- SIDEBAR/UTILS/NAV — goTo(), toast() called synchronously by modules at parse time
- SUPABASE_CORE — sbFetch() called by all modules; must exist before any module executes
- VD_RAW / REP_DIRECTORY / CAT_DEFS — data arrays must exist before modules render
- HELPERS + BOOT — hydrateFromSupabase(), boot() are the app entry points

---

## Stale Specs to Ignore

- `docs/runtime/PHASE1_PACKETIZED_TASKS.md` — all P1–P9 line numbers are pre-extraction
  stale. Packets are done. Do not use for any new extractions.
- Any "Session 16" P7→P12 specs not in the current docs — do not use.
- The PHASE1_DECOMPOSITION_EXECUTION_PLAN.md line number estimates are all stale.
- Earlier versions of this doc with 2,009-line or 1,419-line index.html figures — stale.

The canonical truth is the CURRENT index.html and this file.

---

## Safe Next Cleanup Candidates

All Phase 1.5 options (A–E) are now COMPLETE. The inline remainder is Phase 2+
territory. No further safe extractions exist without a module loader architecture.

### Option A — COMPLETE (P1.5a, commit f241e1c)
js/vendors_overflow.js — 265 lines, 15 functions (renderChangelog, openVP, etc.)

### Option B — superseded by Option A (changelog extracted within vendors_overflow)

### Option C — COMPLETE (P1.5b, commit 60709b1)
js/vendor_filters.js — 165 lines, 5 functions (vFilters, passesAdvancedFilters, etc.)

### Option D — COMPLETE (P1.5c, commit 37605a4)
js/vendor_scoring_helpers.js — 172 lines, 16 functions (weightedScore, scoreColor, etc.)

### Option E — COMPLETE (P1.5d, commit b49b905)
js/supabase_categories.js — 110 lines, 4 functions (sbRealtime, sbLoadCategories, etc.)

---

## Phase Boundary: Phase 1 is DONE

Phase 1 (verbatim extraction, no loader required) is complete. The 1,310-line
remainder is all synchronous global infrastructure that requires Phase 2
(async module loader or dynamic import) to extract further.

**Phase 2 prerequisites** (not yet designed):
- Async module loader that defers BOOT until all modules signal ready
- Auth state available before module init (or passed as argument)
- VD/REP data injectable at module init time rather than relying on global scope

---

## Merge-Safe Status

**YES — merge-safe.**

All 13 extractions were verbatim, no logic changes, no renames. All modules are
independent script tags loaded in dependency order. App runtime behavior is
identical before and after all Phase 1/1.5 extractions.

Verification before merge:
1. Navigate to Vendor Ranking → Scores tab → click vendor → edit a score ✓ needed
2. Navigate to Quotes → create/save a quote ✓ needed
3. Navigate to Dashboard → confirm daily brief renders ✓ needed
4. Navigate to Pipeline → open a deal ✓ needed
5. Navigate to Rep Outreach → preview an email ✓ needed
6. Knowledge Engine → send a message ✓ needed

All these tests require a live deploy. Michael must merge + deploy before
confirming app health.

---

## Rollback Strategy

Each packet is independently revertible:
```bash
git revert <commit> --no-edit
```

To roll back all Phase 1.5 extractions (4 reverts, newest first):
```bash
git revert b49b905 --no-edit   # P1.5d supabase_categories
git revert 37605a4 --no-edit   # P1.5c vendor_scoring_helpers
git revert 60709b1 --no-edit   # P1.5b vendor_filters
git revert f241e1c --no-edit   # P1.5a vendors_overflow
```

To roll back all of Phase 1 (9 reverts):
```bash
git revert b2736b3 --no-edit   # P9
git revert b1321b3 --no-edit   # P8
git revert a43f37b --no-edit   # P7
git revert 2f12a29 --no-edit   # P6
git revert cf9d32c --no-edit   # P5
git revert 48c37bd --no-edit   # P4
git revert b517b8e --no-edit   # P3
git revert 5168e6d --no-edit   # P2
git revert c345f23 --no-edit   # P1
# index.html will be restored to 7,175 lines
```
