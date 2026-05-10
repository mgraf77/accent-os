# Post-P9 Decomposition State
> Ground truth as of 2026-05-10. Branch: claude/setup-codex-integration-gMAyH.
> index.html: 7,175 → 2,009 lines (−5,166 lines, −72%).

---

## Phase 1 Completed Packets

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
| **Total** | **9 modules** | **5,175 lines** | — |

---

## Confirmed Script Tag Load Order (post-P9 index.html, lines 1968–1977)

```
js/vendor_score_import.js   (pre-existing, v6.10.47)
js/vendors_module.js        (P1, v6.11.1) — line 1969
js/vendor_scoring.js        (P2, v6.11.1) — line 1970
js/quotes_module.js         (P3, v6.11.1) — line 1971
js/dashboard_module.js      (P4, v6.11.1) — line 1972
js/mgmt_module.js           (P5, v6.11.1) — line 1973
js/pipeline_module.js       (P6, v6.11.1) — line 1974
js/repoutreach_module.js    (P7, v6.11.1) — line 1975
js/settings_module.js       (P8, v6.11.1) — line 1976
js/knowledge_module.js      (P9, v6.11.1) — line 1977
```

All 9 Phase 1 modules confirmed present and in correct order.

---

## Remaining Inline Blocks (current index.html = 2,009 lines)

These are the blocks that MUST stay inline (global infrastructure, load-order
dependent) or are the known vendor overflow block.

### MUST-STAY-INLINE (Phase 2+ territory — requires module loader to extract)

| Block | Lines | Why it stays |
|---|---|---|
| HTML header + CSS | 1–525 | HTML structure, styles, viewport |
| AUTH | 526–725 | jwtKey(), applyRoleVisibility() called synchronously at load |
| SIDEBAR / UTILS / NAV | 726–881 | goTo(), toast(), openModal() are sync global helpers for every module |
| FEEDBACK + ACTIVITY_LOG | 882–911 | log() called by modules at load; _activityLog global |
| PRODUCT_TAXONOMY | 912–1062 | vendorProductCats data needed by vendor scoring at load |
| SUPABASE_CORE | 1063–1170 | sbFetch() is sync global; every module calls it |
| VENDOR_SCORE_STATES | 1171–1213 | Score state helpers used inline before module load |
| VD_RAW / REP_DIRECTORY data | 1214–1222 | 494-vendor array + 30-rep array, must exist before modules render |
| CAT_DEFS / CHANGELOG init | 1223–1353 | Category definitions + changelog scaffolding |
| SCORING_HELPERS | 1354–1509 | weightedScore(), scoreColor(), tier(), fmt$() etc. — global infrastructure |
| ADVANCED_FILTERS | 1510–1671 | vFilters state + filter functions; called from vendors_module at render |
| HELPERS + BOOT | 1934–2009 | getS(), boot sequence, session restore, script tags |

**Total must-stay: ~1,747 lines** (HTML/CSS + global JS infrastructure)

### KNOWN VENDOR OVERFLOW BLOCK (extractable — Phase 1.5 candidate)

Lines 1672–1933 in current index.html (262 lines). These are vendor page and
changelog functions that were physically located AFTER the repoutreach page block
in the original file, outside the P1 extraction range (2354–4196).

| Lines | Function(s) | Originally at (pre-P1) |
|---|---|---|
| 1672–1712 | renderChangelog(container), Vendor Ranking Changelog tab | ~4766 |
| 1713–1737 | revertChange(changeId) | ~4807 |
| 1738–1807 | openVP(id) — vendor price panel modal | ~4832 |
| 1808–1822 | liveScore(id, cat, val) | ~4902 |
| 1823–1829 | saveVP(id) | ~4917 |
| 1829 | closeVP() | ~4923 |
| 1831–1840 | exportCSV() | ~4926 |
| 1841–1901 | openCSVImport(), handleDrop(), handleFileSelect(), parseCSVFile() | ~4936 |
| 1886–1902 | openAddVendor(), confirmAddV() | ~4980 |
| 1904–1933 | changelog() page function, exportChangeLog() | ~4998 |

**These 262 lines work correctly inline** — all functions are globally available
and are called by vendors_module.js at runtime. No extraction urgency.

---

## Stale Specs to Ignore

The following spec documents were written against pre-P1 line numbers and are
NO LONGER ACCURATE for the current file:

- `docs/runtime/PHASE1_PACKETIZED_TASKS.md` — P7 spec listed lines ~4197–4621
  (actual P7 was at 1672–2240 post-P2). All specs now obsolete — packets are done.
- Any "Session 16" P7→P12 specs not in the current docs — do not use.
- The PHASE1_DECOMPOSITION_EXECUTION_PLAN.md line number estimates are all stale.

The canonical truth is the CURRENT index.html and this file.

---

## Safe Next Cleanup Candidates (Phase 1.5)

### Option A: Vendor Overflow Extraction (low risk)
Extract lines 1672–1933 (262 lines) → `js/vendors_overflow.js`

- Contains: renderChangelog, revertChange, openVP, liveScore, saveVP, closeVP,
  exportCSV, openCSVImport, parseCSVFile, openAddVendor, confirmAddV,
  changelog() page function, exportChangeLog
- Risk: Low — all functions are standalone, no inline dependencies
- Prereq: None (inline globals like VD, CAT_DEFS already exist before script loads)
- Result: index.html ~2,009 → ~1,747 lines

### Option B: changelog() page as separate module (low risk)
Extract just lines 1904–1933 (30 lines) → `js/changelog_module.js`

- Smallest possible next extraction
- The changelog() page function + exportChangeLog() only
- Risk: Very low

### Option C: Advanced Filters extraction (medium risk)
Extract lines 1510–1671 (162 lines) → `js/vendor_filters.js`

- Contains: vFilters state, activeFilterCount(), passesAdvancedFilters(),
  resetAdvancedFilters(), openFilterModal(), toggleFilter()
- Risk: Medium — vFilters state must be initialized BEFORE vendors_module.js runs
  The script tag must load BEFORE vendors_module.js in the load order
- This requires careful script tag placement (before vendors_module.js)

### NOT SAFE TO EXTRACT (Phase 2+ only)
- AUTH block — deeply coupled to HTML session init
- SIDEBAR/UTILS/NAV — synchronous globals, no async load safe
- SUPABASE_CORE — sbFetch() called synchronously by all modules at load
- VD_RAW / REP_DIRECTORY / CAT_DEFS — data arrays must exist before modules render
- SCORING_HELPERS — weightedScore() etc. called at module load time by vendors_module

---

## Recommended Next Corridor

**Phase 1.5 — Vendor Overflow + Changelog**

Single clean extraction:
1. Extract lines 1672–1933 → `js/vendors_overflow.js`
   - All vendor page residual functions + changelog page
   - Script tag: after `js/repoutreach_module.js` (these load after vendors_module.js
     and repoutreach_module.js)
   - Verify: `grep -n "function renderChangelog\|function openVP" index.html` → 0
   - index.html target: ~1,747 lines

**Do NOT attempt** in this corridor: SCORING_HELPERS, ADVANCED_FILTERS, AUTH,
SUPABASE_CORE, VD data — these require Phase 2 module loader architecture.

---

## Merge-Safe Status

**YES — merge-safe.**

Every extraction was verbatim, no logic changes, no renames. All 9 modules are
independent script tags loaded in dependency order. The app's runtime behavior
is identical before and after Phase 1 extraction.

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
