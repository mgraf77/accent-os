# POST-P9 NEXT TRACK
> AccentOS — Recalibrated corridor after P1→P9 completion  
> Status: PLANNING ONLY — no implementation authorized  
> Prepared: 2026-05-10

---

## REPO STATE NOTICE

**Claim:** Session 10 completed P1→P9; index.html is now ~2,009 lines.  
**Actual repo on this branch:** index.html = **7,169 lines** — P1→P9 is documented in playbooks but not committed here.

**Resolution:** All line ranges in this document are **pre-P9 anchors** from the current 7,169-line file. When Session 11 opens the post-P9 file (~2,009 lines), use function names (not line numbers) to locate targets — grep is more reliable than line offsets after a 5,000-line reduction.

```bash
# How to locate any target in the post-P9 file:
grep -n "^function mgmt\|^function settings\|^function roadmap" index.html
```

---

## WHAT P1→P9 REMOVED (confirmed from playbook + current file analysis)

| Packet | Functions / blocks | Pre-P9 line range | Output file |
|---|---|---|---|
| P0 | CSS `<style>` block | 9–361 | css/accent-os.css |
| P1 | `$`, `qsa`, `esc`, `v`, `csvStringify`, `csvDownload`, `toast`, `openModal`, `closeModal`, `switchTab` | 770–829 | js/utils.js |
| P2 | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `sbKey`, `sbConfigured`, `sbFetch`, `sbRealtime`, `sbLoadCategories`, `sbSaveCategories`, `sbLoadScoreStates` | 1063–1210 | js/sb-core.js |
| P3 | `ROLES`, `CU`, `jwtKey`, `setJwt`, `deriveInitials`, `sbAuthFetch`, `sbFetchProfile`, `sbAuditLog`, `applyRoleVisibility`, `doLogin`, `tryRestoreSession`, `activateApp`, `hydrateFromSupabase`, `doLogout` | 528–724 | js/auth.js |
| P4 | `PRODUCT_TAXONOMY`, `vendorProductCats`, `PREFILL_VENDOR_CATS`, all vendor scoring computation, all Vendor Ranking UI (vendors, renderVendors, openVendorDetail, repoutreach, renderChangelog, openVP, exportCSV, openAddVendor, changelog, 50+ functions total) | 909–1062 + 1566–5028 | js/vendor-data.js |
| P5 | `COOP_FUNDS`, `sbLoadCoopFunds`, `sbSaveCoopFund`, `renderCoopTracker`, `openCoopEdit`, `saveCoopFund`, `deleteCoopFund` | 1211–1455 | js/coop.js |
| P6 | `STAGES`, `DEALS`, `computeDealProbability`, `sbLoadPipeline`, `sbSaveDeal`, `pipeline`, `renderPipeline`, `openAddDeal`, `saveDeal`, `delDeal`, all pipeline functions | 5029–5375 | js/pipeline.js |
| P7 | `QUOTES`, `QKB`, `sbLoadQuotes`, `sbSaveQuote`, `sbDeleteQuote`, `calcTrackHardware`, `quotes`, `renderLI`, `aiParseNotes`, `saveQ`, `printQ`, all quote functions | 1456–1565 + 5376–5903 | js/quotes.js |
| P8 | `CHAT`, `chatMode`, `QQ_INTERNAL`, `QQ_CUSTOMER`, `getQQ`, `setChatMode`, `knowledge`, `saveKE`, `sendChat`, `renderChat`, `scrollChat` | 5906–5984 | js/knowledge-engine.js |
| P9 | `dashboard`, `renderRoleSpecificDashboard`, `computeDailyBrief`, `sRow` | 5985–6471 | js/dashboard.js |

---

## WHAT REMAINS AFTER P1→P9

### BLOCK A — SHELL (permanent inline, do not extract)

| Symbol | Pre-P9 line | Why it stays |
|---|---|---|
| `let sbCol` | 725 | Used only by toggleSB inline |
| `toggleSB()` | 726 | Called from HTML `onclick` + `document.addEventListener` in same block |
| `toggleQA()` | 751 | Called from HTML `onclick` |
| `qaGo(page)` | 757 | Called from HTML `onclick` |
| click-listener blocks | 739–769 | `document.addEventListener` blocks wired to sidebar + QA FAB |
| `PAGE_META` | 831 | Router contract — all modules call `goTo('page')` which reads this |
| `let curPage` | 863 | Router state |
| `goTo(page)` | 864 | Called from 50+ HTML `onclick` attributes — cannot safely externalize without touching all HTML |
| `let fbType`, `fbOpen` | 879 | Feedback widget state |
| `toggleFB()` | 880 | Called from HTML `onclick` |
| `setFBType()` | 881 | Called from HTML `onclick` |
| `submitFB()` | 882 | Feedback submit — calls `sbFetch` (external) + `getS` (stays until P11) |
| `let _activityLog`, `log()` | 904–905 | Micro-log used by inline boot sequence |
| Boot `DOMContentLoaded` | 7107 | App init — must stay inline; calls `tryRestoreSession` from auth.js |

**Shell total (pre-P9 lines): ~145 lines across these positions**  
**Post-P9 shell size: ~145 lines** (this block does not shrink further until P12)

---

### BLOCK B — ROADMAP (extractable, P10)

| Symbol | Pre-P9 line | Notes |
|---|---|---|
| `roadmap(el)` | 6472 | Single static template function, ~22 lines, no external deps |

**Pre-P9 range:** 6472–6493  
**Post-P9 estimated position:** Find with `grep -n "^function roadmap" index.html`  
**Size:** ~22 lines  
**Destination:** `js/mgmt.js` (bundle with Mgmt — too small for its own file)

---

### BLOCK C — MGMT (extractable, P10)

| Symbol | Pre-P9 line | Notes |
|---|---|---|
| `let mgmtSection` | 6493 | Module state var |
| `mgmt(el)` | 6494 | Entry point — tabs: overview/kpis/goals/employees/commission |
| `renderOwnerOverview(c)` | 6526 | Reads `DEALS`, `QUOTES`, `COOP_FUNDS` (all from P4–P7 external modules) |
| `let KPI_DEFINITIONS` | 6602 | KPI registry state |
| `let KPI_SNAPSHOTS` | 6603 | Snapshot state |
| `const SEED_KPIS` | 6606 | 8-KPI seed array |
| `sbLoadKPIs()` | 6617 | Calls `sbFetch` (P2) |
| `computeCurrentKPIValue(key)` | 6636 | Reads inline globals: `DEALS`, `QUOTES`, `VD` (all now external after P4–P7) |
| `snapshotAllKPIs()` | 6667 | Calls `sbFetch` + `sbAuditLog` (P3) |
| `renderKPIRegistry(c)` | 6690 | KPI list render |
| `let GOALS` | 6735 | Goals state |
| `const GOAL_LEVELS` | 6736 | Goal level enum |
| `const GOAL_LEVEL_LABELS` | 6737 | Level label map |
| `sbLoadGoals()` | 6739 | Calls `sbFetch` |
| `sbSaveGoal(g)` | 6748 | Calls `sbFetch` |
| `sbDeleteGoal(id)` | 6776 | Calls `sbFetch` |
| `renderGoalsOKR(c)` | 6784 | Tree view render |
| `openGoalEdit(goalId, parentId)` | 6824 | Opens modal |
| `saveGoal(goalId)` | 6859 | Validates + calls `sbSaveGoal` |
| `deleteGoal(id)` | 6889 | Calls `sbDeleteGoal` |
| `renderTeamActivity(c)` | 6900 | Calls `loadAuditLog` |
| `loadAuditLog()` | 6914 | Calls `sbFetch` |
| `renderSystemPanel(c)` | 6934 | Static template — does NOT call `sRow` (verified by grep) |

**Pre-P9 range:** 6493–6959  
**Post-P9 estimated position:** `grep -n "^function mgmt\|^let mgmtSection" index.html`  
**Size:** ~467 lines  
**Destination:** `js/mgmt.js`  
**Dependencies:** `sbFetch` (P2), `sbAuditLog` (P3), `DEALS`/`QUOTES`/`COOP_FUNDS`/`VD` (P4–P7), `employees()` + `commission()` (already external)

---

### BLOCK D — SETTINGS (extractable, P11)

| Symbol | Pre-P9 line | Notes |
|---|---|---|
| `settings(el)` | 6960 | Entry point — tabs: API keys, account, users |
| `renderUsersPanel()` | 7023 | Owner-only user role management |
| `saveUserRole(userId, email)` | 7067 | Calls `sbFetch` + `sbAuditLog` |
| `changeMyPassword()` | 7085 | Calls `sbAuthFetch` (P3) |
| `getS(k)` | 7106 | `sessionStorage.getItem(k)` — one-liner **used by P4/P7/P8/P9 modules** |

**Pre-P9 range:** 6960–7106  
**Post-P9 estimated position:** `grep -n "^function settings\|^function getS" index.html`  
**Size:** ~147 lines  
**Destination:** `js/settings.js`

#### `getS` Dependency Resolution (corrected from prior docs)

`getS` is called from:
- `submitFB` (line 886, shell — stays inline) 
- `openVendorDetail` (P4 → vendor-data.js)
- `aiParseNotes` (P7 → quotes.js)
- `knowledge()`, `sendChat()` (P8 → knowledge-engine.js)
- `renderRoleSpecificDashboard` (P9 → dashboard.js)
- `settings()` itself (P11)

**All P4/P7/P8/P9 module files load as external scripts before `DOMContentLoaded` fires.** When those modules call `getS` at runtime (not parse time), all external scripts including `settings.js` are already loaded. `getS` is globally defined. **No micro-patch needed.**

The shell's `submitFB` (line 882) also calls `getS`. The inline block DEFINES `submitFB` at parse time but doesn't CALL it. By the time a user clicks Feedback Submit, `settings.js` is loaded and `getS` is global. **Safe.**

> **Correction from NEXT_DECOMPOSITION_CORRIDOR.md:** The two micro-patches (`sRow → utils.js` before P9, `getS → utils.js` before P11) are unnecessary. `sRow` confirmed by grep to only be called inside `renderRoleSpecificDashboard` (P9 scope), not by `renderSystemPanel` (P10 scope). `getS` load timing is safe as described above. Remove both micro-patch entries from the execution plan.

---

## DEPENDENCY AUDIT FOR P10 (MGMT)

`renderOwnerOverview` reads `DEALS`, `QUOTES`, `COOP_FUNDS`, `VD`:

| Global | Where after P1–P9 | Access from mgmt.js? |
|---|---|---|
| `DEALS` | js/pipeline.js (P6) | ✅ Global, set before DOMContentLoaded |
| `QUOTES` | js/quotes.js (P7) | ✅ Global |
| `COOP_FUNDS` | js/coop.js (P5) | ✅ Global |
| `VD` | js/vendor-data.js (P4) | ✅ Global |
| `sbFetch` | js/sb-core.js (P2) | ✅ Global |
| `sbAuditLog` | js/auth.js (P3) | ✅ Global |
| `employees()` | js/employees.js (already external) | ✅ |
| `commission()` | js/commission.js (already external) | ✅ |
| `sRow` | js/dashboard.js (P9) | ✅ Global — mgmt.js doesn't call it (verified) |

**All dependencies satisfied.** P10 is clean.

---

## PACKET READINESS: NEXT CORRIDOR

### P10 — MGMT + ROADMAP EXTRACTION

**Status: 🟢 GREEN — ready to execute as soon as post-P9 merge is confirmed**

**Prerequisite check (run before cutting P10 branch):**
```bash
# 1. Confirm P9 (dashboard) is gone from inline:
grep -n "^function dashboard\|^function computeDailyBrief\|^function sRow" index.html
# Expected: NO results

# 2. Confirm mgmt is still inline:
grep -n "^function mgmt\|^let mgmtSection\|^function roadmap" index.html
# Expected: all three found

# 3. Confirm all data globals accessible (in browser console after login):
# typeof DEALS     → "object"
# typeof QUOTES    → "object"
# typeof VD        → "object"
# typeof sbFetch   → "function"

# 4. Confirm Mgmt Dashboard renders pre-extraction:
# Navigate to Mgmt → all 5 sub-tabs render without error
```

**Execution steps:**
```
1. git checkout main
2. git pull origin main
3. Confirm index.html is ~2,009 lines (post-P9)
4. git checkout -b decomp/mgmt-extraction
5. Create js/mgmt.js — copy roadmap() then mgmtSection+mgmt() through renderSystemPanel()
6. Delete the copied functions from index.html (single atomic deletion)
7. Add <script src="js/mgmt.js?v=1.0.0"></script> to external modules block
8. Test (see verification section below)
9. git add index.html js/mgmt.js && git commit
10. git push -u origin decomp/mgmt-extraction
11. Merge to main
```

**Verification commands:**
```bash
# In browser console after load:
typeof mgmt           # → "function"
typeof roadmap        # → "function"
typeof sbLoadKPIs     # → "function"
typeof GOALS          # → "object"
KPI_DEFINITIONS       # → [] (populates after sbLoadKPIs runs on mgmt visit)

# Functional tests:
# a) Navigate to Roadmap page → static template renders
# b) Navigate to Mgmt Dashboard → 5 tabs visible (Overview/KPIs/Goals/Employees/Commission)
# c) Overview tab → YTD won, pipeline forecast, co-op $ all populated
# d) KPIs tab → 8 seed KPIs shown → "Snapshot today" → toast OK
# e) Goals tab → add a goal → tree view shows it
# f) Employees tab → employee list renders (calls employees() from js/employees.js)
# g) Commission tab → renders (calls commission() from js/commission.js)
# h) Dashboard page → still works (no regression)
# i) wc -l index.html → should be ~1,540 lines (2,009 - 489 roadmap+mgmt lines)
```

**Rollback:**
```bash
git revert [merge-commit-hash]
# Manual: delete js/mgmt.js, restore deleted functions to index.html, remove <script src> tag
```

**Stop conditions:**
- Any Mgmt sub-tab blank → module dependency not accessible → ROLLBACK
- `KPI_DEFINITIONS` undefined after hydrate → GOALS/KPI state vars not moved → ROLLBACK
- Dashboard tiles show undefined → unexpected cross-dependency → ROLLBACK immediately

**Commit message:**
```
decomp(mgmt): extract roadmap + mgmt module to js/mgmt.js

- Moves roadmap() (static template)
- Moves mgmtSection state, mgmt(), renderOwnerOverview(), KPI registry,
  Goals/OKR, team activity, system panel — 21 functions + 7 state vars
- Adds <script src="js/mgmt.js?v=1.0.0">
- index.html: ~489 lines removed
```

---

### P11 — SETTINGS EXTRACTION

**Status: 🟡 YELLOW — wait for P10 merge + verification**

**Why yellow:** `getS` is the last inline utility that P4/P7/P8/P9 external modules depend on at runtime. P11 is the packet that moves it. Everything works out due to script load order, but this packet should not run until P10 is confirmed stable — want minimum open surface when making this change.

**Prerequisite check (run before cutting P11 branch):**
```bash
# 1. Confirm P10 merged cleanly:
grep -n "^function mgmt\|^function roadmap" index.html
# Expected: NO results

# 2. Confirm settings still inline:
grep -n "^function settings\|^function getS\|^function renderUsersPanel" index.html
# Expected: all three found

# 3. Confirm Knowledge Engine still works post-P10 (getS still inline):
# In browser: Knowledge Engine → send chat message → response received

# 4. Confirm Settings page renders (pre-extraction baseline):
# Navigate to Settings → API Keys card shows, My Account shows
```

**Execution steps:**
```
1. git checkout main && git pull origin main
2. Confirm index.html ~1,540 lines (post-P10)
3. git checkout -b decomp/settings-extraction
4. Create js/settings.js — copy settings() through getS() verbatim
5. Delete copied functions from index.html
6. Add <script src="js/settings.js?v=1.0.0"></script> to external modules block
7. Test (see verification section)
8. git add index.html js/settings.js && git commit
9. git push -u origin decomp/settings-extraction && merge to main
```

**Verification commands:**
```bash
# Console:
typeof settings           # → "function"
typeof getS               # → "function"
typeof renderUsersPanel   # → "function"
getS('aos-api')           # → "" or the stored key (not undefined/error)

# Functional tests:
# a) Navigate to Settings → API Keys card (Owner role)
# b) Enter + save API key → toast "API key saved"
# c) Navigate to Knowledge Engine → send a chat → getS read from settings.js → works
# d) Navigate to Vendor Ranking → openVendorDetail → AI Summary button works (getS accessible)
# e) Navigate to Quote Generator → ⚡ Parse Notes → getS accessible → fires correctly
# f) My Account → Change Password flow → sbAuthFetch (from auth.js) called → works
# g) Users Panel (Owner role) → user list renders → save role → toast OK
# h) Feedback button → Submit → toast OK (submitFB calls getS from settings.js)
# i) wc -l index.html → should be ~1,393 lines (1,540 - 147 settings lines)
```

**Rollback:**
```bash
git revert [merge-commit-hash]
```

**Stop conditions:**
- Knowledge Engine AI chat fails post-P11 → `getS` not in scope at runtime → ROLLBACK
- Vendor Detail AI Summary fails → same → ROLLBACK
- Quote AI Parse fails → same → ROLLBACK
- Settings page blank → `settings()` not found by router → ROLLBACK

**Commit message:**
```
decomp(settings): extract settings module to js/settings.js

- Moves settings(), renderUsersPanel(), saveUserRole(),
  changeMyPassword(), getS() — 5 functions
- Adds <script src="js/settings.js?v=1.0.0">
- index.html: ~147 lines removed
- getS remains globally accessible via settings.js (loads before DOMContentLoaded)
```

---

### P12 — SHELL THINNING

**Status: 🔴 RED — do not cut branch until P11 merges AND smoke test is documented**

**Why red:** Shell thinning is the final mutation of index.html. It requires every prior packet to be stable. It also has the highest "hidden reference" risk — the shell contains functions called from HTML `onclick` attributes, and removing any of them breaks the UI silently.

**Gate conditions:**
- P11 merged and verified (settings + getS working across all pages)
- Full smoke test completed and logged in SESSION_LOG.md: every sidebar page, every role, all CRUD operations
- `index.html` inline script block line count measured post-P11
- Every remaining inline function audited against the survivors list below

**Survivors list (must stay inline after P12):**
```
let sbCol
function toggleSB()          ← HTML onclick + DOMContentLoaded
toggleSB click-listener      ← document.addEventListener
function toggleQA()          ← HTML onclick
function qaGo(page)          ← HTML onclick
QA click-listener            ← document.addEventListener
const PAGE_META              ← router contract
let curPage
function goTo(page)          ← router — 50+ HTML onclick refs
let fbType, fbOpen
function toggleFB()          ← HTML onclick
function setFBType()         ← HTML onclick
async function submitFB()    ← HTML onclick
let _activityLog
function log()               ← called by inline boot sequence
Boot DOMContentLoaded        ← app init
```

**P12 does NOT create a new JS file.** It only:
1. Removes any remaining dead code or extractable fragments from the inline block
2. Verifies the survivors list is all that remains
3. Confirms `index.html` total line count

**Estimated post-P12 index.html:** ~1,350–1,400 lines total

**Commit message:**
```
decomp(shell): Phase 1 complete — inline script reduced to bootstrap shell

- Confirms survivors: goTo router, toggleSB/QA, feedback widget, boot listener
- Removes any remaining extractable fragments
- index.html: <1,400 lines total, <160 lines inline <script> block
```

---

## STALE SPEC NOTICE

The following documents contain **superseded line ranges and incorrect micro-patch recommendations**:

### `docs/runtime/NEXT_DECOMPOSITION_CORRIDOR.md` — STALE

**Stale sections:**
- All P7–P9 packet specs (P7 Quotes, P8 Knowledge Engine, P9 Dashboard) — these are complete per Session 10
- "Micro-Patch A: sRow to utils.js" — UNNECESSARY. `renderSystemPanel` does not call `sRow` (verified by grep). `sRow` lives in dashboard.js and no cross-packet dependency exists.
- "Micro-Patch B: getS to utils.js" — UNNECESSARY. `getS` load order is safe as described in this document's Block D section. Move it with settings.js in P11.
- Line ranges throughout — all pre-P9, will not match post-P9 file

**Still valid sections:**
- P10 packet structure (use this doc's P10 spec instead, which supersedes it)
- P11 packet structure (use this doc's P11 spec)
- P12 shell thinning survivors list (consistent with this document)
- Commit message templates

### `docs/runtime/TRACK_READY_STATUS.md` — PARTIALLY STALE

**Stale sections:**
- P7 (Quotes): COMPLETE — remove from active tracking
- P8 (Knowledge Engine): COMPLETE — remove from active tracking
- P9 (Dashboard): COMPLETE — remove from active tracking
- Micro-patch entries for sRow and getS: REMOVE — not needed

**Still valid:**
- P10 status framework (update status to 🟢 GREEN)
- P11 status framework (update status to 🟡 YELLOW pending P10)
- P12 status (🔴 RED — correct)
- Dependency graph structure

---

## RECOMMENDED NEXT CORRIDOR

**Session 11 target: P10 + P11 in one 30–60 minute session**

This is the correct corridor length because:
- P10 (Mgmt+Roadmap): ~489 lines, all dependencies external, ~30–35 min
- P11 (Settings): ~147 lines, single dependency concern (`getS`) which is safe, ~15–20 min
- Combined: ~636 lines extracted, two `<script src>` tags added, zero new JS behavior
- Total session: 45–55 minutes with verification
- P12 Shell Thinning should be its own session (requires smoke test, not a coding session)

**Do not try to include P12 in this corridor.** P12 requires a separate smoke-test session to confirm stability before touching the shell.

---

## EXACT SESSION PROMPT FOR SESSION 11

Copy the block below as the session prompt:

---

```
# ENTER DECOMP EXECUTION MODE — P10 + P11 CORRIDOR

Current state: Post-P9 decomposition. index.html is ~2,009 lines.
Remaining inline: roadmap (22 lines), mgmt (467 lines), settings (147 lines), shell (145 lines, permanent).

Mission:
Execute P10 (Mgmt+Roadmap) then P11 (Settings) as a single bounded session.
Do NOT touch the shell (goTo, toggleSB, PAGE_META, boot listener).
Do NOT attempt P12 Shell Thinning.

RULES:
- One packet at a time. P11 only starts after P10 is merged and verified.
- Each packet = exactly 2 files changed: index.html (deletions only) + new js/ file.
- No renames. No reformatting. Verbatim extraction only.
- Rollback command in SESSION_LOG before each merge.

P10 PACKET — MGMT + ROADMAP:

  Locate targets:
    grep -n "^function roadmap\|^function mgmt\|^let mgmtSection" index.html

  Create js/mgmt.js containing (in this order):
    1. roadmap(el)
    2. let mgmtSection = 'overview'
    3. mgmt(el) through renderSystemPanel(c) — all contiguous functions

  Delete from index.html: the roadmap + mgmt block (verbatim deletion)

  Add to external modules block:
    <script src="js/mgmt.js?v=1.0.0"></script>

  Verify before merge:
    typeof mgmt → "function"
    typeof roadmap → "function"
    typeof GOALS → "object"
    Mgmt Dashboard → all 5 sub-tabs render
    KPI Snapshot → writes to Supabase
    Goals → add + delete works
    Dashboard page → no regression
    wc -l index.html → ~1,540 lines

  Commit: "decomp(mgmt): extract roadmap + mgmt module to js/mgmt.js"

  If any verification fails: git revert [hash], do not proceed to P11.

P11 PACKET — SETTINGS:

  After P10 merges: git checkout main && git pull

  Locate targets:
    grep -n "^function settings\|^function getS\|^function renderUsersPanel" index.html

  Create js/settings.js containing (verbatim):
    settings(el), renderUsersPanel(), saveUserRole(), changeMyPassword(), getS(k)

  Delete from index.html: the settings + getS block

  Add to external modules block:
    <script src="js/settings.js?v=1.0.0"></script>

  Verify before merge:
    typeof settings → "function"
    typeof getS → "function"
    getS('aos-api') → returns stored value (not error)
    Settings page → renders, save key works
    Knowledge Engine → AI chat works (getS accessible from settings.js)
    Quote Generator → ⚡ Parse Notes → fires correctly
    Feedback Submit → works (submitFB calls getS)
    wc -l index.html → ~1,393 lines

  Commit: "decomp(settings): extract settings module to js/settings.js"

SESSION END:
- Update WORK_IN_PROGRESS.md with post-P11 state
- Update BUILD_PLAN_CLAUDE.md if decomposition is tracked there
- Note: P12 Shell Thinning requires dedicated smoke-test session — do not start it here
```
