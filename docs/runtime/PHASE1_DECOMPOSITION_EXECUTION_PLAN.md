# Phase 1 Decomposition — Execution Plan
> Convert remaining inline code in index.html into external JS modules.
> Each stage is an independently rollback-safe extraction.

---

## Current State

`index.html` is 7,175 lines. Approximately 6,483 lines are inline JavaScript across 24 identifiable blocks. 39 external modules already exist in `js/`.

This plan extracts the remaining high-value blocks into external modules using the same pattern as the prior extraction at v6.10.12 (which reduced index.html by 149KB / 18%).

---

## What Cannot Be Extracted (Must Stay Inline)

These blocks are global infrastructure that the entire app depends on at load time. Extracting them into external `<script src>` tags would break initialization ordering.

| Block | Lines | Why it stays |
|---|---|---|
| AUTH (526–725) | ~199 | Deeply coupled to HTML session init, jwtKey(), applyRoleVisibility() called inline on load |
| SIDEBAR_UTILS_NAV (726–876) | ~150 | `goTo()`, `toast()`, `openModal()` are synchronous global helpers referenced by every module |
| FEEDBACK + ACTIVITY_LOG (877–960) | ~83 | `log()` called by modules at load time; global `_activityLog` must exist before modules load |
| PRODUCT_TAXONOMY (961–1062) | ~101 | `vendorProductCats` data + helpers used by vendor scoring at load |
| SUPABASE_CORE (1063–1210) | ~147 | `sbFetch()` is a synchronous global; every module calls it before external scripts fully resolve |
| VENDOR_DATA + REP_DIRECTORY (1897–2025) | ~128 | VD[] (494 vendors) and REP_DIRECTORY[] are large data arrays that must exist before any module renders |
| CHANGELOG_HELPERS (2026–2035) | ~9 | `logChange()` used by vendor scoring inline code |

**These 817 lines stay inline indefinitely.** Any plan to extract them is Phase 2+ and requires a module loader or import system, which is not in scope.

---

## Extraction Priority Matrix

Ordered by: (lines saved × coupling risk⁻¹ × test surface⁻¹)

| # | Target Module | Inline Lines | Risk | Value | Stage |
|---|---|---|---|---|---|
| 1 | `js/vendors_module.js` | ~1,844 | Medium | Highest | Stage 1 |
| 2 | `js/vendor_scoring.js` | ~847 | Low-Medium | High | Stage 2 |
| 3 | `js/quotes_module.js` | ~531 | Medium | High | Stage 3 |
| 4 | `js/dashboard_module.js` | ~477 | Medium-High | High | Stage 4 |
| 5 | `js/mgmt_module.js` | ~467 | Low | Medium | Stage 5 |
| 6 | `js/pipeline_module.js` | ~346 | Low | Medium | Stage 6 |
| 7 | `js/repoutreach_module.js` | ~424 | Low | Medium | Stage 7 |
| 8 | `js/settings_module.js` | ~151 | Low | Low | Stage 8 |
| 9 | `js/knowledge_module.js` | ~82 | Low | Low | Stage 9 |

**Total extractable: ~5,169 lines.** Post-extraction estimate: index.html ~2,000 lines (from 7,175).

---

## Dependency-Aware Sequencing

Extraction order is constrained by cross-module dependencies:

```
VENDOR_SCORING (Stage 2)
  must come BEFORE
VENDORS_PAGE (Stage 1) — [wait, VENDORS contains scoring helpers inline]

Correction: VENDORS_PAGE extraction must include its own scoring helpers,
OR scoring helpers are extracted first so VENDORS_PAGE can reference them.

Actual safe order:
  Stage 1: VENDORS_PAGE (takes scoring helpers with it — self-contained)
  Stage 2: VENDOR_SCORING cleanup (the leftover scoring helpers after Stage 1)
  Stage 3: QUOTES_MODULE (standalone, uses sbFetch + QUOTES global)
  Stage 4: DASHBOARD (depends on DEALS, QUOTES, ALERTS — all already external)
  Stage 5: MGMT_DASHBOARD (standalone, uses Supabase globals + KPI defs)
  Stage 6: PIPELINE (standalone, uses DEALS global)
  Stage 7: REP_OUTREACH (standalone, uses REP_DIRECTORY global)
  Stage 8: SETTINGS (standalone)
  Stage 9: KNOWLEDGE (standalone)
```

**Key constraint:** Stage 1 (VENDORS_PAGE) is the highest-risk extraction because it contains interleaved rendering, scoring, rep management, coop tracker, deal optimizer, price book, and changelog sections. It must be treated as one atomic extraction, not piecemeal.

---

## Rollback-Safe Batch Boundaries

Each stage is independently rollback-safe:

```
git revert <stage-commit> --no-edit
```

This is valid because each stage only:
1. Cuts lines from index.html
2. Creates a new `js/<name>.js` file with those lines
3. Adds one `<script src="...">` tag to index.html

The function names and global state do not change. The app's runtime behavior is identical before and after extraction.

**Verification per stage:**
```bash
# After each extraction commit:
grep -n "function [functionThatWasExtracted]" js/[module].js  # exists in module
grep -n "function [functionThatWasExtracted]" index.html      # absent from index
# Then: open https://accent-os.pages.dev — navigate to the affected page — confirm renders
```

---

## Stage 1: Vendors Module — Detailed Plan

**The largest and most complex extraction.** Gets its own detailed section.

**What moves:**
- Lines ~2,356–4,200 in index.html (~1,844 lines)
- Functions: `vendors()`, `renderVendors()`, `buildScoresRow()`, `buildScoresParentHeader()`, `toggleParentGroup()`, `expandAllParents()`, `collapseAllParents()`, `openFilterModal()`, `activeFilterCount()`, `passesAdvancedFilters()`, `resetAdvancedFilters()`, `toggleFilter()`, `openVendorDetail()`, `renderVendorDetail()`, `closeVendorDetail()`, `openVendorScoreEntry()`, `saveVendorScoreEntry()`, `openVendorEdit()`, `saveVendorEdit()`, `openScoreDetail()`, `renderRepList()`, `renderRepView()`, `renderHistory()`, `renderRepGroupAudit()`, `renderSales()`, `renderWeights()`, `renderChangelog()`, `revertChange()`, `openVP()`, `liveScore()`, `saveVP()`, `closeVP()`, `openWeightScenarios()`, `renderScoresTab()`, `downloadScoringRubric()`, `exportCSV()`, `openCSVImport()`, `parseCSVFile()`, `openAddVendor()`, `confirmAddV()`

**What stays inline:** VD[], REP_DIRECTORY[], CHANGELOG[], scoring helpers, parent company data — these are globals the module reads from.

**Script tag placement:** After `js/vendor_score_import.js` (line ~7,140), before `js/trade_partners.js`.

**Collision check:** `openRepOutreach` is defined twice in index.html (lines 3,969 and 4,197) — resolve before extraction by removing the duplicate.

**Risk:** Medium. The vendors page is the most feature-dense page. If any function reference was missed, the vendors page will break silently (not crash the app). Spot-check: navigate to Vendor Ranking → Scores tab, click a vendor, edit a score, check coop tab.

---

## Stage 2: Vendor Scoring — Detailed Plan

**What moves (after Stage 1):**
- Remaining scoring infrastructure: `openCoopEdit()`, `renderCoopTracker()`, parent company helpers (`getVendorParent()`, `getSisterVendors()`, `renderCatChips()`, `openCategoryEditor()`), VENDOR_OVERRIDES persistence functions (`sbLoadVendorOverrides()`, `sbSaveVendorOverride()`)
- `VENDOR_SCORES` load/save functions (`sbLoadVendorScores()`, `sbSaveVendorScores()`)
- Lines ~1,211–1,896 approximately

**What stays inline:** Global scoring helper functions (`weightedScore()`, `scoredCount()`, `scoreColor()`, `heatColor()`, `fmt$()`, `tier()`, `tierBadge()`, `logChange()`) — referenced by modules at load time.

**Risk:** Low-Medium. Coop tracker is isolated. Vendor override functions are isolated. Parent company helpers are called by the vendor module (which will be external by Stage 2).

---

## Merge-Safe Execution Order

Every stage must be merged to the main branch before the next stage begins. Stages are NOT parallelizable — they all mutate `index.html`.

```
Stage 1 → verify → merge → Stage 2 → verify → merge → ...
```

Do not attempt to run two stages on the same branch simultaneously.

---

## Index.html Line Count Targets

| After Stage | Approx Lines |
|---|---|
| Current | 7,175 |
| After Stage 1 | ~5,330 |
| After Stage 2 | ~4,650 |
| After Stage 3 | ~4,120 |
| After Stage 4 | ~3,640 |
| After Stage 5 | ~3,170 |
| After Stage 6 | ~2,820 |
| After Stage 7 | ~2,395 |
| After Stage 8 | ~2,244 |
| After Stage 9 (final) | ~2,162 |

Target: index.html ≤ 2,200 lines. All page logic in external modules.

---

## What Decomposition Does NOT Do

- Does not change any runtime behavior
- Does not refactor or improve any code during extraction (extract verbatim)
- Does not rename any functions
- Does not reorganize module structure
- Does not add new features
- Does not change any CSS
- Does not touch the HTML structure of index.html (only removes inline `<script>` content)
- Does not modify any already-external `js/*.js` files

**Extraction rule:** copy-cut-paste only. Zero logic changes during extraction. Logic improvements are a separate pass after extraction is confirmed working.
