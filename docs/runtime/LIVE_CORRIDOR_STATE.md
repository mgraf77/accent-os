# LIVE CORRIDOR STATE
> AccentOS — Near-track builder. Continuously maintained.  
> Doc discipline: always grounded in live HEAD. Stale on every new train commit.  
> Last calibrated: 2026-05-10 · commit 13d3c03

---

## GROUND TRUTH

```
index.html           7,169 lines
Inline script block  6,606 lines (521–7126)
CSS block            353 lines (9–361)
Inline functions     201 total
External JS modules  37 files in js/
External script tags 38 (37 modules + 1 CDN Supabase)
Decomposition done   ZERO — no extraction commits exist in any branch
Output files absent  js/dashboard.js, js/quotes.js, js/mgmt.js, js/settings.js, et al
Branch risk          LOW — single active branch (docs only), no open feature PRs
WIP collision risk   MEDIUM — unresolved AI Parse 400 bug may land as index.html commit
```

**Train position: PRE-DEPARTURE.** Planning docs exist. Execution has not started.

> All prior corridor docs (POST_P9_NEXT_TRACK.md, NEXT_DECOMPOSITION_CORRIDOR.md,
> TRACK_READY_STATUS.md) were written assuming partial or full P1–P9 completion.
> That assumption is **false** as of this calibration. Those docs remain valid as
> packet-level reference material but their status columns and line numbers reflect
> a hypothetical post-P9 state that does not yet exist.

---

## ZONE MAP (complete inline inventory)

| Zone | Block | Pre-extraction lines | Size | Status |
|------|-------|----------------------|------|--------|
| CSS | `<style>` block | 9–361 | 353 | EXTRACTABLE → css/accent-os.css |
| AUTH | Auth functions + ROLES + CU | 528–724 | 197 | EXTRACTABLE → js/auth.js |
| SHELL-A | toggleSB, toggleQA, qaGo + click listeners | 725–769 | 45 | PERMANENT SHELL |
| UTILS | $, qsa, esc, v, toast, openModal, etc. | 770–829 | 60 | EXTRACTABLE → js/utils.js |
| ROUTER | PAGE_META, curPage, goTo | 831–878 | 48 | PERMANENT SHELL |
| FEEDBACK | toggleFB, setFBType, submitFB, _activityLog, log | 879–908 | 30 | PERMANENT SHELL |
| VD-CONSTS | PRODUCT_TAXONOMY, PREFILL_VENDOR_CATS | 909–1062 | 154 | EXTRACTABLE → js/vendor-data.js |
| SB-CORE | SUPABASE_URL/KEY, sbFetch, sbRealtime, sbLoadCategories | 1063–1210 | 148 | EXTRACTABLE → js/sb-core.js |
| COOP | COOP_FUNDS + all co-op persistence + render | 1211–1455 | 245 | EXTRACTABLE → js/coop.js |
| QUOTES-P | sbLoadQuotes, sbSaveQuote, sbDeleteQuote | 1456–1565 | 110 | EXTRACTABLE → js/quotes.js (zone A) |
| VD-PERSIST | Vendor overrides, scores, changelog, parents | 1566–1812 | 247 | EXTRACTABLE → js/vendor-data.js |
| VD-COMPUTE | CAT_DEFS, VD_RAW, computeVendorTier, vendorScore, etc. | 1812–2164 | 353 | EXTRACTABLE → js/vendor-data.js |
| VD-UI | **vendors(), renderVendors(), openVendorDetail(), repoutreach() — MASSIVE** | 2165–5028 | **2,864** | EXTRACTABLE → js/vendor-data.js |
| PIPELINE | STAGES, DEALS, computeDealProbability, all deal CRUD | 5029–5375 | 347 | EXTRACTABLE → js/pipeline.js |
| QUOTES-R | QUOTES state, QKB, calcTrackHardware, aiParseNotes, all quote render | 5376–5903 | 528 | EXTRACTABLE → js/quotes.js (zone B) |
| KE | CHAT, knowledge(), sendChat(), renderChat() | 5906–5984 | 79 | EXTRACTABLE → js/knowledge-engine.js |
| DASHBOARD | dashboard(), renderRoleSpecificDashboard(), computeDailyBrief(), sRow() | 5985–6471 | 487 | EXTRACTABLE → js/dashboard.js |
| ROADMAP | roadmap() — static template | 6472–6493 | 22 | EXTRACTABLE → js/mgmt.js |
| MGMT | mgmt(), KPI registry, Goals/OKR, team activity, system panel | 6493–6959 | 467 | EXTRACTABLE → js/mgmt.js |
| SETTINGS | settings(), renderUsersPanel(), saveUserRole(), changeMyPassword(), getS() | 6960–7106 | 147 | EXTRACTABLE → js/settings.js |
| BOOT | DOMContentLoaded boot listener | 7107–7126 | 20 | PERMANENT SHELL |

**Extractable total: 6,268 lines across 15 zones**  
**Permanent shell total: 143 lines across 4 zones**

---

## CORRIDOR MODE

```
MODE: CAUTION
REASON: Zone VD-UI (lines 2165–5028, 2,864 lines) is 4 packets ahead.
        It is the largest single extraction in the entire decomposition.
        It mandates CRAWL when it runs. Everything before it can GO,
        but CAUTION is imposed now to ensure track is only laid 2 ahead.

Chain depth limit: 3 packets per corridor
Single-packet mandate: VD-UI zone only (cannot be chained with anything)
```

**Mode progression forecast:**

```
P0 (CSS)         ← GO
P1 (Utils)       ← GO
P2 (SB Core)     ← GO
P3 (Auth)        ← GO  [end of LIVE corridor]
───────────────────────
P4a (VD-CONSTS + VD-PERSIST + VD-COMPUTE)  ← CAUTION
P4b (VD-UI: 2,864 lines)                   ← CRAWL (own session, solo packet)
───────────────────────
P5 (Co-op)       ← CAUTION
P6 (Pipeline)    ← CAUTION
P7 (Quotes)      ← CAUTION [end of SKETCH corridor]
───────────────────────
[Train continues; P8–P11 laid at runtime]
```

---

## LIVE CORRIDOR — READY TO EXECUTE

**Corridor ID:** BOOTSTRAP  
**Packets:** P0 → P1 → P2 → P3  
**Duration estimate:** 45–65 minutes  
**Collision risk:** LOW (zones are far from the WIP AI Parse bug zone)  
**Rollback integrity:** HIGH (each packet independently revertible in < 2 min)

---

### P0 — CSS EXTRACTION

**Status: 🟢 GO**

**Locate:**
```bash
grep -n "^<style>$\|^</style>$" index.html
# Expect: <style> at line 9, </style> at line 361
```

**Execute:**
```bash
git checkout main && git pull origin main
git checkout -b decomp/p0-css
# 1. Copy lines 9–361 verbatim to css/accent-os.css
# 2. Replace <style>…</style> block in index.html with:
#    <link rel="stylesheet" href="css/accent-os.css?v=1.0.0">
#    (single line, placed where <style> was)
```

**Verify before merge:**
```bash
# Structural
git diff --stat   # must show: index.html + css/accent-os.css, 2 files only
wc -l index.html  # must be: 7169 - 352 + 1 = 6818 lines (±2)

# Browser: load app, navigate 5 pages
# DevTools Network: accent-os.css returns 200
# DevTools Elements: no inline <style> in <head>
# Zero visual regressions
```

**Rollback:**
```bash
git revert [hash]  # one commit, full undo
```

**Commit:**
```
decomp(p0/css): extract inline styles to css/accent-os.css
```

**On merge → immediately cut P1 branch from new main.**

---

### P1 — UTILS EXTRACTION

**Status: 🟢 GO (after P0 merges)**

**Locate:**
```bash
grep -n "^const \$=\|^const qsa=\|^const esc=\|^function toast\|^function openModal\|^function closeModal\|^function switchTab" index.html
# Expect: lines ~770–829
```

**Functions to extract (verbatim):**
```
const $ = id => document.getElementById(id)           (line 770)
const qsa = s => document.querySelectorAll(s)          (line 771)
const esc = s => ...                                   (line 772)
function v(id, prop='value')                           (line 773)
function csvStringify(rows)                            (line 775)
function csvDownload(rows, filename)                   (line 781)
const _toastRecent = new Map()                         (line 791)
function toast(msg, type='')                           (line 792)
function openModal(title, body, foot='')               (line 815)
function closeModal(e)                                 (line 821)
function switchTab(btn, id)                            (line 822)
```

**EXCLUDE from this extraction (they stay in shell):**
```
toggleSB(), toggleQA(), qaGo()   ← shell-locked (HTML onclick refs + click listeners)
document.addEventListener(...)   ← event bindings, stay with their functions
```

**Output:** `js/utils.js`

**Script tag placement:**
```html
<!-- In <head>, as the FIRST <script> tag (before CDN Supabase, before inline block) -->
<script src="js/utils.js?v=1.0.0"></script>
```
This order is critical: 37 existing modules call esc(), toast(), openModal() etc. They must be defined before ANY module loads.

**Verify before merge:**
```bash
git diff --stat   # 2 files: index.html + js/utils.js

# Browser console:
typeof $             # → "function"
typeof esc           # → "function"
typeof toast         # → "function"
typeof openModal     # → "function"
toast('test')        # → toast appears bottom-right

# Navigate all 5 sections of sidebar — no ReferenceErrors
```

**Commit:**
```
decomp(p1/utils): extract DOM helpers and UI primitives to js/utils.js
```

---

### P2 — SB CORE EXTRACTION

**Status: 🟢 GO (after P1 merges)**

**Locate:**
```bash
grep -n "^const SUPABASE_URL\|^async function sbFetch\|^function sbRealtime\|^async function sbLoadCategories" index.html
# Expect: lines ~1063–1210
```

**Functions to extract:**
```
const SUPABASE_URL = '...'                 (line 1063)
const SUPABASE_ANON_KEY = '...'            (line 1068)
function sbKey()                           (line 1071)
function sbConfigured()                    (line 1072)
async function sbFetch(path, opts={})      (line 1074)
let _sbRT = null                           (line 1103)
function sbRealtime()                      (line 1104)
async function sbLoadCategories()          (line 1120)
async function sbSaveCategories()          (line 1140)
async function sbLoadScoreStates()         (line 1173)
```

**Output:** `js/sb-core.js`

**Script tag placement:**
```html
<!-- In <head>, after js/utils.js, before inline <script> block -->
<script src="js/sb-core.js?v=1.0.0"></script>
```

**Verify before merge:**
```bash
git diff --stat   # 2 files: index.html + js/sb-core.js

# Browser console:
typeof sbFetch        # → "function"
typeof sbConfigured   # → "function"
sbConfigured()        # → true (if Supabase key set in Settings)

# Network tab: open Vendor Ranking → Supabase REST calls return 200 (not CORS errors)
# Open Customers page → data loads
```

**Commit:**
```
decomp(p2/sb-core): extract Supabase core to js/sb-core.js
```

---

### P3 — AUTH EXTRACTION

**Status: 🟡 YELLOW (after P2 merges — needs pre-flight check)**

**Why yellow:** Auth is the app's trust boundary. Wrong extraction = login loop or silent session failure. Requires explicit pre-flight before branch cut.

**Pre-flight (run on post-P2 codebase):**
```bash
# Confirm sign-in works on current state
# 1. Sign out of app → login screen appears
# 2. Sign back in → lands on Dashboard
# 3. Reload → session restores without login screen
# All three must pass before cutting P3 branch
```

**Locate:**
```bash
grep -n "^const ROLES\|^let CU\|^function jwtKey\|^async function doLogin\|^async function tryRestoreSession\|^function activateApp\|^async function doLogout" index.html
# Expect: lines 528–724
```

**Functions to extract (complete group, no partial):**
```
const ROLES = [...]              (line 528)
let CU = null                    (line 529)
function jwtKey()                (line 531)
function setJwt(t)               (line 532)
function deriveInitials()        (line 535)
async function sbAuthFetch()     (line 545)
async function sbFetchProfile()  (line 560)
async function sbAuditLog()      (line 569)
function applyRoleVisibility()   (line 588)
async function doLogin()         (line 595)
async function tryRestoreSession()(line 644)
function activateApp()           (line 664)
async function hydrateFromSupabase()(line 674)
async function doLogout()        (line 712)
```

**CRITICAL — group integrity rule:**
`activateApp`, `hydrateFromSupabase`, `tryRestoreSession`, and `doLogin` must ALL move together. Extracting any one without the others breaks app boot.

**Output:** `js/auth.js`

**Script tag placement:**
```html
<!-- In <head>, after js/sb-core.js -->
<script src="js/auth.js?v=1.0.0"></script>
```

**Verify before merge:**
```bash
git diff --stat   # 2 files: index.html + js/auth.js

# Scenario 1: Fresh session (clear sessionStorage first)
# → Login screen visible → enter credentials → sign in → Dashboard appears
# → CU object populated: CU.role, CU.email, CU.full_name all correct

# Scenario 2: Existing session (don't clear sessionStorage)
# → Reload page → session restores → Dashboard (no login screen)

# Scenario 3: Role gating
# → Sign in as Warehouse role → sidebar hides Owner-only items
# → Sign in as Owner role → all items visible

# Scenario 4: Sign out
# → Click user chip → login screen reappears → sessionStorage cleared

# Console: typeof doLogin → "function"  (from auth.js, not inline)
```

**Rollback:**
```bash
git revert [hash]
# Auth rollback is the most impactful of P0–P3: if login breaks, users can't use the app.
# Always revert immediately on any auth regression — do not debug forward.
```

**Stop conditions (immediate revert if any are true):**
- Login screen doesn't appear on fresh session → activateApp called too early
- Credentials accepted but app doesn't appear → hydrateFromSupabase not running
- Session doesn't restore on reload → tryRestoreSession not accessible
- Role-gated items wrong → applyRoleVisibility not accessible at app init

**Commit:**
```
decomp(p3/auth): extract auth module to js/auth.js

- Moves ROLES, CU, jwtKey, setJwt, deriveInitials, sbAuthFetch,
  sbFetchProfile, sbAuditLog, applyRoleVisibility, doLogin,
  tryRestoreSession, activateApp, hydrateFromSupabase, doLogout
- Auth is now in js/auth.js; boot listener (inline) still calls
  tryRestoreSession and activateApp as globals
```

---

## SKETCH CORRIDOR — DO NOT EXECUTE UNTIL LIVE MERGES

**Corridor ID:** VENDOR-SPLIT  
**Packets:** P4a → P4b (two-packet CAUTION corridor for Vendor Data)  
**Duration estimate:** 2 separate sessions (P4a: 30–45 min; P4b: 60–90 min)

---

### P4a — VENDOR DATA LAYER (computation + persistence)

**Status: 🟡 YELLOW (sketch only — not ready to execute)**

**Scope (non-UI portions only):**
```
Zone VD-CONSTS (lines 909–1062, 154 lines):
  PRODUCT_TAXONOMY, vendorProductCats, getVPCats, setVPCats, PREFILL_VENDOR_CATS

Zone VD-PERSIST (lines 1566–1812, 247 lines):
  sbLoadVendorOverrides, sbSaveVendorOverride, sbLoadVendorScores, sbSaveVendorScore,
  sbSaveScoreState, sbLoadChangelog, sbAppendChangelog, sbLoadParents,
  getVendorParent, getSisterVendors, applyPrefillVendorCats

Zone VD-COMPUTE (lines 1812–2164, 353 lines):
  CAT_COLORS, renderCatChips, openCategoryEditor, totalRawScore,
  VD_RAW (vendor seed data), REP_DIRECTORY, CAT_DEFS, TOTAL_WEIGHT,
  VENDOR_TYPES, VENDOR_TYPE_NA, REP_SCORES, LA_ZERO_J, VD (the main vendor array),
  CHANGELOG, logChange, VENDOR_ELIGIBILITY, computeVendorTier, getDataState,
  vendorScore, unverifiedCountFor, weightedScore, scoredCount, tier, tierBadge,
  filterScoresUnverified, scoreColor, heatColor, heatTextColor, dispScore, fmt$,
  vFilter, vTier, vRep, vScoredOnly, vSection, vGroupByParent, colSummary,
  vFilters, activeFilterCount, passesAdvancedFilters, resetAdvancedFilters
```

**P4a output:** `js/vendor-data.js`  
**P4a total size:** ~754 lines across 3 non-contiguous zones  

**Non-contiguous extraction protocol:**
Zone VD-CONSTS (909–1062) and zones VD-PERSIST + VD-COMPUTE (1566–2164) are non-contiguous — separated by SB-CORE, COOP, and QUOTES-P which are extracted in earlier packets. Single atomic commit: all three zones deleted from index.html simultaneously, new file pre-populated before any deletion.

**Seam definition:**
P4a ends at line 2164 (last line of `resetAdvancedFilters`).  
P4b begins at line 2165 (`function openFilterModal` — first Vendor Ranking UI renderer).

**Validation before running P4a:** Vendor Ranking page must load correctly on post-P3 codebase with all data coming from inline globals. If it shows blank or errors pre-extraction, do NOT start P4a.

---

### P4b — VENDOR RANKING UI (the high-risk solo packet)

**Status: 🔴 SKETCH ONLY — CRAWL mode when executed**

**Why CRAWL:** This is the largest single extraction in the project.

```
Zone VD-UI (lines 2165–5028, 2,864 lines):
  openFilterModal, toggleFilter, vendors (entry point), renderVendors,
  buildScoresRow, toggleParentGroup, expandAllParents, collapseAllParents,
  buildScoresParentHeader, renderScores, sortScores, openScoringMatrix,
  openScoringSystem, updateScenarioSum, openWeightScenarios,
  openScoreDetail, RUBRIC_NUMERIC, RUBRIC_COMPONENTS, RUBRIC_TEXT,
  recomputeComponentScore, onScoreStateChange, applyComponentScore,
  suggestScore, openVendorScoreEntry, saveVendorScoreEntry,
  openVendorEdit, saveVendorEdit, openVendorDetail, closeVendorDetail,
  buildRepOutreachEmail, openRepOutreach, renderRepList, renderRepView,
  downloadScoringRubric, renderHistory, renderRepGroupAudit, renderSales,
  renderWeights, OUTREACH_CATS, repoutreach, renderChangelog, revertChange,
  openVP, liveScore, saveVP, closeVP, exportCSV, openCSVImport,
  handleDrop, handleFileSelect, parseCSVFile, openAddVendor, confirmAddV,
  changelog (page entry), exportChangeLog
  (55+ functions, 8 constants, 6 state vars)
```

**P4b output:** Append to `js/vendor-data.js` (or separate `js/vendor-ui.js` — decide at execution time based on file size of P4a output)  
**P4b size:** 2,864 lines  
**P4b session:** Dedicated 60–90 minute session, no other packets in same session  
**Pre-condition:** P4a merged and Vendor Ranking page confirmed working (data layer only, UI still inline)

**Risk profile:**
- `openVendorDetail` (line 3561) is `async` and makes Supabase calls — must verify it receives `sbFetch` from sb-core.js
- `openRepOutreach` appears TWICE in the function list (lines 3965 AND 4194) — grep will confirm; one is likely the Vendor page version, one the Rep Outreach page version. **Must audit before extraction.** Duplicate function name at top scope may have been silently resolved by hoisting or shadowing.
- `RUBRIC_NUMERIC`, `RUBRIC_COMPONENTS`, `RUBRIC_TEXT` are large const objects — easy to truncate during copy; verify character-for-character using diff

**Duplicate function audit (required before P4b):**
```bash
grep -n "^function openRepOutreach" index.html
# If two results: read both, understand which is which
# One will be: function openRepOutreach(repName) at ~3965 — opens modal
# Other at ~4194 — same name? different signature?
# If truly duplicate, the second silently overwrites the first (non-strict JS).
# Extract both in order and let shadowing continue as-is. Do not "fix" this during extraction.
```

---

## COLLISION RISK REGISTER

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| AI Parse bug fix lands as index.html commit before QUOTES-R extraction | MEDIUM | Forces rebase of quotes branch | Monitor WORK_IN_PROGRESS.md; rebase is safe and takes < 5 min |
| Feature build starts on inline module (rare but possible) | LOW | Freeze decomp packet for that zone | Freeze the zone, let feature merge first |
| P4b extraction truncates a large const object | MEDIUM | Silent data corruption in VD_UI | Use `wc -c` before/after to verify byte counts on the three RUBRIC consts |
| Auth regression (P3) blocks all users | LOW but HIGH impact | Full rollback required | Revert immediately; test all 4 auth scenarios before merge |

---

## STALE CORRIDOR CALLOUTS

| Document | Status | Notes |
|---|---|---|
| `PHASE1_EXECUTION_PLAYBOOK.md` | VALID as reference | Packet structure still accurate; line numbers are pre-decomp anchors |
| `DECOMPOSITION_PACKET_LIBRARY.md` | VALID as template | Templates apply to any execution session |
| `MERGE_SAFE_DECOMPOSITION.md` | VALID | Doctrine unchanged |
| `ROLLBACK_FIRST_EXECUTION_MODEL.md` | VALID | Decision matrix unchanged |
| `NEXT_DECOMPOSITION_CORRIDOR.md` | PARTIALLY STALE | P7–P9 specs are still valid for those packets; two micro-patch recommendations have been retracted (sRow, getS) |
| `TRACK_READY_STATUS.md` | STATUS VALUES STALE | All packets were marked based on hypothetical post-P9 state. Actual state: all packets pre-P0. Use this doc's zone map instead. |
| `POST_P9_NEXT_TRACK.md` | HYPOTHETICAL FRAMING | Packet specs for Mgmt/Settings are still accurate; the "post-P9" framing is aspirational since P9 hasn't run |

---

## FRESHNESS PROTOCOL

This document is stale after every train commit. To recalibrate:

```bash
# 1. Ground truth check
wc -l index.html
git log --oneline -5

# 2. Zone map validation
grep -n "^function mgmt\|^function dashboard\|^function settings\|^async function sbFetch\|^function doLogin" index.html
# Missing results = that zone was extracted. Update zone map accordingly.

# 3. Output file existence check
ls js/utils.js js/sb-core.js js/auth.js js/vendor-data.js js/pipeline.js \
   js/coop.js js/quotes.js js/knowledge-engine.js js/dashboard.js \
   js/mgmt.js js/settings.js 2>/dev/null
# Each present file = that packet is done. Advance train position.

# 4. Rebuild corridor mode
# Count remaining extractable zones → determine GO/CAUTION/CRAWL
# Update LIVE and SKETCH corridors accordingly

# 5. Overwrite this document
```

---

## NEXT TRACK STATUS SUMMARY

```
LIVE CORRIDOR:   P0+P1+P2+P3  ← Bootstrap packets. 45–65 min. GO→CAUTION.
SKETCH CORRIDOR: P4a+P4b      ← Vendor data split. Two separate sessions.
                                 P4a CAUTION. P4b CRAWL (solo packet only).

After SKETCH executes:
  Lay: P5 (Co-op) + P6 (Pipeline) + P7 (Quotes) as next LIVE
  Sketch: P8 (KE) + P9 (Dashboard)
  Do NOT lay P10+ until P9 merges.

End of track:
  P10 (Mgmt) → P11 (Settings) → P12 (Shell Thin)
  Final post-P12 inline script target: ≤ 143 lines (shell only)
```
