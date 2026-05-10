# POST-REGISTER EXECUTION CORRIDORS
> AccentOS — Pre-built handoff compression briefs for R1, R2, R3.
> Each corridor block is self-contained: one read → 45–90 min execution, no mid-run relay.
> Calibrated: 2026-05-10 · HEAD commit 15fb618
> Age: 0 · State: FRESH

---

## CORRIDOR MAP

```
Register Substrate (P0+P1+P2) ← LIVE corridor (LIVE_CORRIDOR_V2.md)
    │
    ▼
R1 — Cohort-1: Auth + VD Data Layer (P3 + P4a)
    │
    ▼
R2 — Cohort-2: Co-op + Quotes + Pipeline (P5 + P6 + P7)
    │
    ▼
[P4b — VD-UI CRAWL: solo dedicated session, not a corridor]
    │
    ▼
R3 — Cohort-3: Knowledge Engine + Dashboard + Mgmt (P8 + P9 + P10)
    │
    ▼
Tail: Settings (P11) + Shell Thinning (P12) — drafted when R3 exits
```

**Prerequisite for all corridors here:**
```bash
grep -c "^const SUPABASE_URL\|^const \$=\|^<style>" index.html   # → 0
wc -l index.html   # → ~6,611 (±10)
```
If either fails: register substrate not complete — execute LIVE_CORRIDOR_V2.md first.

---

## R1 — COHORT-1: AUTH + VD DATA LAYER

**Packets:** P3 → js/auth.js · P4a → js/vendor-data.js
**Mode:** CAUTION (P4a = non-contiguous, two inline deletions in one atomic commit)
**Duration:** 35–50 min · 2 commits
**Net reduction:** ~944 lines · Expected post-R1 wc -l: ~5,667 (±10)

═══════════════════════════════════════════════════════
 HANDOFF EXECUTION BLOCK — COHORT-1
 One read → execute straight through · CAUTION mode
═══════════════════════════════════════════════════════

## R1 ENTRY GATE

```bash
grep -c "^const SUPABASE_URL\|^const \$=\|^<style>" index.html   # → 0 (substrate done)
grep -n "^const ROLES" index.html                                  # AUTH still inline
grep -n "^const PRODUCT_TAXONOMY" index.html                       # VD-CONSTS still inline
grep -n "^async function sbLoadVendorOverrides" index.html         # VD-PERSIST still inline
ls js/auth.js js/vendor-data.js 2>/dev/null                       # → must not exist
```
→ Any output file already exists: zone extracted — skip that packet.
→ Anchor missing but file doesn't exist: something is wrong — stop, investigate.

## R1 WRITE ROLLBACKS

```
P3 rollback: git revert [P3-commit-hash]
P4a rollback: git revert [P4a-commit-hash]
Sequence for full R1 rollback: git revert [P4a-hash] && git revert [P3-hash]
```

---

## P3 — AUTH EXTRACTION → js/auth.js

**LOCATE:**
```bash
grep -n "^const ROLES" index.html       # zone start
grep -n "^let sbCol=false" index.html   # first line AFTER zone end
```
AUTH zone: from `const ROLES` through closing `}` of `doLogout` (the line just before `let sbCol=false`).

**EXTRACT to js/auth.js** — all symbols from zone start to zone end:
```
ROLES, CU, jwtKey, setJwt, deriveInitials, sbAuthFetch, sbFetchProfile,
sbAuditLog, applyRoleVisibility, doLogin, tryRestoreSession, activateApp,
hydrateFromSupabase, doLogout
```

**ADD to `<head>` after sb-core.js:**
```html
<script src="js/auth.js?v=1.0.0"></script>
```

**DELETE** the AUTH zone from the inline script block.

**VERIFY:**
```bash
grep -c "^async function doLogin" index.html       # → 0
grep -c "^async function tryRestoreSession" index.html  # → 0
git diff --stat                                    # → 2 files only
```
Browser: reload → login works → session restores on F5 → Warehouse role hides Owner items → logout → login screen.
Console: `typeof doLogin` → "function" · `typeof tryRestoreSession` → "function" · `typeof CU` → accessible.

**COMMIT:**
```bash
git add index.html js/auth.js
git commit -m "decomp(auth): extract auth layer to js/auth.js"
```

**STOP IF:** Login fails · session doesn't restore on reload · role visibility wrong · `CU` null after login · ReferenceError for any auth symbol.

---

## P4a — VD DATA LAYER → js/vendor-data.js (non-contiguous)

**READ FIRST:** P4a extracts from two non-adjacent zones. Create the complete js/vendor-data.js before touching index.html. Delete both zones in one atomic commit. Never commit after deleting only one zone.

**LOCATE both zones:**
```bash
grep -n "^const PRODUCT_TAXONOMY" index.html           # Zone A start
grep -n "^let COOP_FUNDS" index.html                   # line AFTER Zone A (end boundary)
grep -n "^async function sbLoadVendorOverrides" index.html  # Zone B start
grep -n "^let vFilter=" index.html                     # line AFTER Zone B (end boundary)
```

**Zone A — VD-CONSTS** (PRODUCT_TAXONOMY to just before COOP_FUNDS):
```
PRODUCT_TAXONOMY, vendorProductCats, getVPCats, setVPCats, PREFILL_VENDOR_CATS
```

**Zone B — VD-PERSIST + VD-COMPUTE** (sbLoadVendorOverrides to just before let vFilter=):
```
VD-PERSIST symbols:
  sbLoadVendorOverrides, sbSaveVendorOverride, sbLoadVendorScores, sbSaveVendorScore,
  sbSaveScoreState, sbLoadChangelog, sbAppendChangelog, PARENT_COMPANIES, VENDOR_PARENTS,
  PARENT_BY_ID, sbLoadParents, getVendorParent, getSisterVendors, applyPrefillVendorCats

VD-COMPUTE symbols:
  CAT_COLORS, renderCatChips, vCatFilter, openCategoryEditor, totalRawScore,
  REP_DIRECTORY, CAT_DEFS, TOTAL_WEIGHT, VENDOR_TYPES, VENDOR_TYPE_NA, REP_SCORES,
  LA_ZERO_J, BLANK_ZERO_CATS, BLANK_ZERO_J, VD_RAW, VD, CHANGELOG, logChange,
  VENDOR_ELIGIBILITY, TIER_B_KEYS, computeVendorTier, getDataState, vendorScore,
  unverifiedCountFor, weightedScore, scoredCount, tier, tierBadge, filterScoresUnverified,
  scoreColor, heatColor, heatTextColor, dispScore, fmt$
```

⚠️ **VD_RAW risk:** VD_RAW is a ~400-line JSON array. Before deleting inline, confirm js/vendor-data.js contains the complete closing `];` of VD_RAW. Search: `grep -c "^const VD_RAW" js/vendor-data.js` → 1.

**CREATE js/vendor-data.js:**
Structure: [Zone A content] + `\n// ─────────────────────\n` + [Zone B content]

**ADD to `<head>` after auth.js:**
```html
<script src="js/vendor-data.js?v=1.0.0"></script>
```

**ATOMIC DELETE — both zones in the same editing session:**
1. Delete Zone A from index.html (PRODUCT_TAXONOMY through PREFILL_VENDOR_CATS close)
2. Delete Zone B from index.html (sbLoadVendorOverrides through fmt$)
3. Run VERIFY commands
4. Only then commit — not before

**VERIFY:**
```bash
grep -c "^const PRODUCT_TAXONOMY" index.html                  # → 0
grep -c "^async function sbLoadVendorOverrides" index.html    # → 0
grep -c "^const CAT_COLORS" index.html                        # → 0
grep -c "^const VD_RAW" js/vendor-data.js                     # → 1  (file has it)
git diff --stat                                               # → 2 files: index.html + js/vendor-data.js
```
Browser: Vendors page loads with scores visible, VD data renders.
Console: `typeof vendorScore` → "function" · `typeof VD` → "object" · `VD.length` → number >0.

**COMMIT:**
```bash
git add index.html js/vendor-data.js
git commit -m "decomp(vendor-data): extract VD data layer (consts+persist+compute) to js/vendor-data.js"
```

**STOP IF:** `VD` undefined in console · `vendorScore` errors · vendors page blank · diff shows 3+ files · VD_RAW closing `];` missing from vendor-data.js.

---

## R1 EXIT GATE

```bash
grep -c "^const ROLES\|^const PRODUCT_TAXONOMY\|^async function sbLoadVendorOverrides" index.html  # → 0
wc -l index.html    # → ~5,667 (±10)
ls js/auth.js js/vendor-data.js   # both exist
```

**Session log:**
```
Merged: Cohort-1 (P3+P4a) — auth + VD data layer extracted.
Rollback: git revert [P4a-hash] && git revert [P3-hash]
Post-smoke: auth ✓ · session restore ✓ · vendors ✓ · role gating ✓
```

**FEEDS INTO:** Corridor R2 (below)

═══════════════════════════════════════════════════════

---

## R2 — COHORT-2: CO-OP + QUOTES + PIPELINE

**Packets:** P5 → js/coop.js · P6 → js/quotes.js (both zones) · P7 → js/pipeline.js
**Mode:** CAUTION (P6 = non-contiguous quotes, both zones atomic)
**Duration:** 35–50 min · 3 commits
**Net reduction:** ~702 lines · Expected post-R2 wc -l: ~4,965 (±10)

**P6 note:** Quotes spans two non-adjacent zones (persistence + render). Both zones go into js/quotes.js in one atomic commit. Do not split into separate commits.

═══════════════════════════════════════════════════════
 HANDOFF EXECUTION BLOCK — COHORT-2
 One read → execute straight through · CAUTION mode
═══════════════════════════════════════════════════════

## R2 ENTRY GATE

```bash
grep -c "^const ROLES\|^const PRODUCT_TAXONOMY" index.html  # → 0 (R1 done)
grep -n "^let COOP_FUNDS" index.html            # COOP still inline
grep -n "^async function sbLoadQuotes" index.html  # QUOTES-P still inline
grep -n "^const STAGES=" index.html             # PIPELINE still inline
ls js/coop.js js/quotes.js js/pipeline.js 2>/dev/null  # → none should exist
```

## R2 WRITE ROLLBACKS

```
P5 rollback: git revert [P5-commit-hash]
P6 rollback: git revert [P6-commit-hash]
P7 rollback: git revert [P7-commit-hash]
Sequence: git revert [P7] && git revert [P6] && git revert [P5]
```

---

## P5 — CO-OP EXTRACTION → js/coop.js

**LOCATE:**
```bash
grep -n "^let COOP_FUNDS" index.html                  # zone start
grep -n "^async function sbLoadQuotes" index.html     # line AFTER zone end
```

**EXTRACT to js/coop.js** — from `let COOP_FUNDS` through closing `}` of `deleteCoopFund`:
```
COOP_FUNDS, sbLoadCoopFunds, sbSaveCoopFund, sbDeleteCoopFund, sbUpdateCoopField,
commitCoopCellSelect, renderCoopTracker, openCoopEdit, saveCoopFund, deleteCoopFund
```

**ADD `<script src="js/coop.js?v=1.0.0">` in the body's external module block** (the `<!-- Module files... -->` section), before existing module tags.

**DELETE** co-op zone from inline block.

**VERIFY:**
```bash
grep -c "^let COOP_FUNDS" index.html     # → 0
git diff --stat                          # → 2 files only
```
Browser: Co-op tracker loads, fund rows visible, add/edit/delete fund persists.

**COMMIT:**
```bash
git add index.html js/coop.js
git commit -m "decomp(coop): extract co-op tracker to js/coop.js"
```

**STOP IF:** Co-op page blank · funds don't load · COOP_FUNDS undefined in console.

---

## P6 — QUOTES EXTRACTION → js/quotes.js (non-contiguous, atomic)

**READ FIRST:** Quotes has two zones. Create the complete js/quotes.js with BOTH zones before deleting either from index.html. Delete both zones in one atomic commit.

**LOCATE both zones:**
```bash
grep -n "^async function sbLoadQuotes" index.html   # Zone A start
grep -n "^async function sbDeleteQuote" index.html  # Zone A end anchor (last function in A)
grep -n "^let QUOTES=" index.html                   # Zone B start
grep -n "^let CHAT=" index.html                     # line AFTER Zone B end (KE starts here)
```

Zone A — persistence (sbLoadQuotes through closing `}` of sbDeleteQuote):
```
sbLoadQuotes, sbSaveQuote, sbDeleteQuote
```

Zone B — state + render (let QUOTES= through closing `}` of saveQ):
```
QUOTES, QUOTE_ID, CQ, LI, QKB, calcTrackHardware, nLI, addLI, quotes, renderLI,
qFlagRow, approveAllRows, updatePreview, aiParseNotes, openTrackCalc, parseRunLengths,
previewTrackCalc, _pendingTrackLines, addTrackLinesToQuote, saveQ
```

⚠️ **QKB:** ~40-line object literal. Verify its closing `};` is captured.
⚠️ **_pendingTrackLines:** `let _pendingTrackLines = [];` is deep in Zone B, easy to miss.
⚠️ **aiParseNotes:** Contains AI proxy URL — must transfer verbatim. Verify URL is intact after copy.

**CREATE js/quotes.js:** Zone A content + `\n// ─────────────────────\n` + Zone B content

**ADD `<script src="js/quotes.js?v=1.0.0">` in the external module block** after coop.js.

**ATOMIC DELETE — both zones in one session:**
1. Delete Zone A from inline (sbLoadQuotes through sbDeleteQuote closing `}`)
2. Delete Zone B from inline (let QUOTES= through saveQ closing `}`)
3. Verify
4. Commit — not between steps 1 and 2

**VERIFY:**
```bash
grep -c "^async function sbLoadQuotes\|^let QUOTES=" index.html   # → 0
grep -c "^const QKB" js/quotes.js                                  # → 1
grep -c "_pendingTrackLines" js/quotes.js                          # → 1
git diff --stat                                                    # → 2 files only
```
Browser: Quotes page loads · line items visible · AI parse button triggers (proxy call fires) · track hardware calc works.

**COMMIT:**
```bash
git add index.html js/quotes.js
git commit -m "decomp(quotes): extract quotes module (persistence+render) to js/quotes.js"
```

**STOP IF:** Quote list empty on load · QKB undefined · AI parse throws error · diff shows 3+ files.

---

## P7 — PIPELINE EXTRACTION → js/pipeline.js

**LOCATE:**
```bash
grep -n "^const STAGES=" index.html    # zone start
grep -n "^let CHAT=" index.html        # line AFTER zone end (KE starts here)
```
(After P6, `let QUOTES=` is gone; use KE anchor `let CHAT=` as the post-zone boundary.)

**EXTRACT to js/pipeline.js** — from `const STAGES=` through closing `}` of `delDeal`:
```
STAGES, TERMINAL_STAGES, ALL_STAGES, DEALS, DEAL_ID, PROBABILITY_WEIGHTS,
computeDealProbability, sbLoadPipeline, sbSaveDeal, sbLogPipelineEvent, sbDeleteDeal,
pipeline, renderPipeline, openArchive, probColor, dealHTML, openAddDeal, saveDeal,
findDealAnyStage, openDeal, updDeal, delDeal
```

**ADD `<script src="js/pipeline.js?v=1.0.0">` in the external module block** after quotes.js.

**DELETE** pipeline zone from inline block.

**VERIFY:**
```bash
grep -c "^const STAGES=" index.html     # → 0
git diff --stat                         # → 2 files only
```
Browser: Pipeline page loads · deals visible · stage drag works · add/edit/delete deal persists.
Console: `typeof DEALS` → "object" · `typeof computeDealProbability` → "function".

**COMMIT:**
```bash
git add index.html js/pipeline.js
git commit -m "decomp(pipeline): extract pipeline module to js/pipeline.js"
```

**STOP IF:** Pipeline page blank · DEALS undefined · deal save fails · stage drag broken.

---

## R2 EXIT GATE

```bash
grep -c "^let COOP_FUNDS\|^async function sbLoadQuotes\|^const STAGES=" index.html  # → 0
wc -l index.html    # → ~4,965 (±10)
ls js/coop.js js/quotes.js js/pipeline.js   # all exist
```

**Session log:**
```
Merged: Cohort-2 (P5+P6+P7) — coop + quotes + pipeline extracted.
Rollback: git revert [P7] && git revert [P6] && git revert [P5]
Post-smoke: coop ✓ · quotes ✓ · pipeline ✓
```

**FEEDS INTO:** P4b VD-UI CRAWL (solo dedicated session) → then R3

---

## ⚠️ VD-UI CRAWL GATE

**P4b must complete before R3 can execute.**

P4b is NOT a corridor. It is a solo CRAWL session:
- Single packet only — cannot chain with anything
- Dedicated session — operator must be available for full duration
- Duration: 45–60 min (2,868 lines extracted from one zone)
- Output: js/vendor-data.js UI layer (appended to existing file from P4a)
- Verify: `grep -c "^let vFilter=" index.html` → 0 (VD-UI cleared)
- openRepOutreach audit required before cutting P4b branch:
  `grep -n "^function openRepOutreach" index.html` → expect TWO results (3965 + 4194)
  Extract both in order; second silently overrides first at runtime (current behavior preserved)

P4b brief: generate from HEAD when P4b branch is cut. Do not use stale line numbers.

═══════════════════════════════════════════════════════

---

## R3 — COHORT-3: KNOWLEDGE ENGINE + DASHBOARD + MGMT

**Packets:** P8 → js/knowledge-engine.js · P9 → js/dashboard.js · P10 → js/mgmt.js
**Mode:** CAUTION (3-packet max, complex render modules)
**Duration:** 40–60 min · 3 commits
**Net reduction:** ~1,031 lines · Expected post-R3 wc -l: ~1,700 (±20)

**Prerequisites:**
- R2 complete (P5+P6+P7 merged)
- P4b VD-UI CRAWL complete and merged

═══════════════════════════════════════════════════════
 HANDOFF EXECUTION BLOCK — COHORT-3
 One read → execute straight through · CAUTION mode
═══════════════════════════════════════════════════════

## R3 ENTRY GATE

```bash
grep -c "^let COOP_FUNDS\|^const STAGES=\|^let vFilter=" index.html  # → 0 (R2 + P4b done)
grep -n "^let CHAT=" index.html           # KE still inline
grep -n "^function dashboard" index.html  # Dashboard still inline
grep -n "^function mgmt" index.html       # Mgmt still inline
ls js/knowledge-engine.js js/dashboard.js js/mgmt.js 2>/dev/null  # → none exist
```

## R3 WRITE ROLLBACKS

```
P8 rollback: git revert [P8-commit-hash]
P9 rollback: git revert [P9-commit-hash]
P10 rollback: git revert [P10-commit-hash]
Sequence: git revert [P10] && git revert [P9] && git revert [P8]
```

---

## P8 — KNOWLEDGE ENGINE → js/knowledge-engine.js

**LOCATE:**
```bash
grep -n "^let CHAT=" index.html           # zone start
grep -n "^function dashboard" index.html  # line AFTER zone end
```

**EXTRACT to js/knowledge-engine.js** — from `let CHAT=` through last line before `// ── DASHBOARD`:
```
CHAT, QQ_INTERNAL, QQ_CUSTOMER (if present), chatMode (if present), getQQ,
QQ (legacy alias: const QQ = QQ_INTERNAL), knowledge, sendChat, (all render functions)
```

⚠️ **QQ alias:** `const QQ = QQ_INTERNAL;` is a legacy reference that must transfer with the module.
⚠️ **getS dependency:** `sendChat` calls `getS('aos-api')`. After P8, `getS` is still inline — this is safe. All external modules load before DOMContentLoaded; `getS` is globally accessible when `sendChat` is ever called. No micro-patch needed.

**LOAD ORDER:** Add `<script src="js/knowledge-engine.js?v=1.0.0">` AFTER `knowledge_hub.js`:
```bash
grep -n "knowledge_hub.js" index.html   # find its script tag → add KE tag immediately after
```

**DELETE** KE zone from inline block.

**VERIFY:**
```bash
grep -c "^let CHAT=" index.html          # → 0
git diff --stat                          # → 2 files only
```
Browser: Knowledge Engine page loads · quick-prompt tiles visible · send message → AI response received · chat history shows.

**COMMIT:**
```bash
git add index.html js/knowledge-engine.js
git commit -m "decomp(knowledge-engine): extract KE module to js/knowledge-engine.js"
```

**STOP IF:** KE page blank · AI chat broken · `knowledge` function undefined · getS ReferenceError.

---

## P9 — DASHBOARD → js/dashboard.js

**LOCATE:**
```bash
grep -n "^function dashboard" index.html   # zone start
grep -n "^function sRow" index.html        # sRow is last thing in zone (append to file)
grep -n "^function roadmap" index.html     # line AFTER zone end
```
Dashboard zone = from `function dashboard` through closing `}` of `computeDailyBrief`.
sRow = 10-line function at `function sRow` — append to end of dashboard.js.

**GLOBAL DEPENDENCY CHECK (run before extracting):**
```bash
# In browser console after page loads:
# typeof QUOTES !== 'undefined'     → quotes.js loaded
# typeof DEALS !== 'undefined'      → pipeline.js loaded
# typeof COOP_FUNDS !== 'undefined' → coop.js loaded
# typeof VD !== 'undefined'         → vendor-data.js loaded
# All four must be true. If any false: predecessor module not loading.
```

**EXTRACT to js/dashboard.js:**
Main block: `dashboard` through closing `}` of `computeDailyBrief`
Append: `sRow` function (the 10 lines starting at `function sRow`)

Symbols: `dashboard`, `renderRoleSpecificDashboard`, `computeDailyBrief`, `sRow` (appended)

**ADD `<script src="js/dashboard.js?v=1.0.0">` in the external module block.**

**DELETE** dashboard zone AND sRow from inline block (both in one session).

**VERIFY:**
```bash
grep -c "^function dashboard\|^function sRow" index.html   # → 0
git diff --stat                                            # → 2 files only
```
Browser: Dashboard renders for all 3 role variants (Owner / Manager / Warehouse). Daily Brief tile shows correct counts. No blank tiles, no console errors.

**COMMIT:**
```bash
git add index.html js/dashboard.js
git commit -m "decomp(dashboard): extract dashboard + sRow to js/dashboard.js"
```

**STOP IF:** Any dashboard tile blank · `QUOTES`/`DEALS`/`COOP_FUNDS` undefined · role variant broken · sRow missing from js/dashboard.js.

---

## P10 — MGMT + ROADMAP → js/mgmt.js

**LOCATE:**
```bash
grep -n "^function roadmap" index.html    # zone A start (roadmap is a static template)
grep -n "^function mgmt" index.html       # zone B start (mgmt section follows roadmap)
grep -n "^function settings" index.html   # line AFTER zone end
```

Zone A: `function roadmap` (22-line static HTML template)
Zone B: from `function mgmt` through closing `}` before `function settings`

**EXTRACT to js/mgmt.js:**
Zone A: `roadmap`
Zone B: `mgmt`, `mgmtSection` state, `KPI_DEFINITIONS`, `SEED_KPIS`, `sbLoadKPIs`, `GOALS`,
`GOAL_LEVELS`, `GOAL_LEVEL_LABELS`, `renderKPIRegistry`, `renderGoalsOKR`, `renderSystemPanel`,
all supporting helpers (renderTeamActivity, etc.)

⚠️ **SEED_KPIS:** `const SEED_KPIS = [...]` is an 8-element array inside the mgmt zone. It must move with `sbLoadKPIs` — they reference each other directly. Verify: `grep -c "SEED_KPIS" js/mgmt.js` → >0.
⚠️ **GOAL_LEVELS / GOAL_LEVEL_LABELS:** Two small constants near line 6736–6737, far from `function mgmt`. Verify they transfer: `grep -c "GOAL_LEVELS" js/mgmt.js` → >0.

**ADD `<script src="js/mgmt.js?v=1.0.0">` in the external module block.**

**DELETE** roadmap + mgmt zones from inline block.

**VERIFY:**
```bash
grep -c "^function roadmap\|^function mgmt\|^let KPI_DEFINITIONS" index.html   # → 0
grep -c "SEED_KPIS" js/mgmt.js     # → >0
grep -c "GOAL_LEVELS" js/mgmt.js   # → >0
git diff --stat                    # → 2 files only
wc -l index.html                   # → ~1,700 (±20)
```
Browser: Mgmt Dashboard loads · KPI Registry shows data · Goals/OKR tab renders · System panel shows status rows.
Console: `typeof mgmt` → "function" · `typeof KPI_DEFINITIONS` → "object".

**COMMIT:**
```bash
git add index.html js/mgmt.js
git commit -m "decomp(mgmt): extract mgmt + roadmap to js/mgmt.js"
```

**STOP IF:** Mgmt page blank · KPI registry empty · SEED_KPIS or GOAL_LEVELS missing from js/mgmt.js.

---

## R3 EXIT GATE

```bash
grep -c "^let CHAT=\|^function dashboard\|^function roadmap\|^function mgmt" index.html  # → 0
wc -l index.html   # → ~1,700 (±20)
ls js/knowledge-engine.js js/dashboard.js js/mgmt.js   # all exist
```

**Session log:**
```
Merged: Cohort-3 (P8+P9+P10) — knowledge-engine + dashboard + mgmt extracted.
Rollback: git revert [P10] && git revert [P9] && git revert [P8]
Post-smoke: knowledge-engine ✓ · dashboard (all roles) ✓ · mgmt ✓
```

**FEEDS INTO:** Tail packets P11 (Settings) + P12 (Shell Thinning)

---

## TAIL SCOPE (not a handoff-compression corridor — draft when R3 exits)

After R3, remaining inline block contains:
- SHELL-A (permanent): toggleSB, toggleQA, qaGo (~45 lines)
- ROUTER (permanent): PAGE_META, curPage, goTo (~48 lines)
- FEEDBACK (permanent): toggleFB, setFBType, submitFB, _activityLog, log (~30 lines)
- SETTINGS: function settings, renderUsersPanel, saveUserRole, changeMyPassword, getS (~147 lines)
- BOOT (permanent): DOMContentLoaded listener (~20 lines)

P11 = Settings extraction → js/settings.js (147 lines, clean contiguous block)
P12 = Shell thinning audit (verify survivors list, confirm no orphaned helpers, trim dead code)

```bash
# Tail confirmation after R3:
grep -c "^function settings" index.html    # → 1 (settings still inline, awaiting P11)
wc -l index.html                           # → ~1,700 means tail is correct size
```

Target after P11: `wc -l index.html` → ~1,553 (±5)
Target after P12: `wc -l index.html` → ~400–500 (permanent shell + boot + external script tags)
