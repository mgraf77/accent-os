# Phase 1 Decomposition — Packetized Tasks
> Each packet is a bounded, independently rollback-safe extraction.
> Designed for minimal Michael relay burden: each packet ends with a pasteable NEXT PROMPT.

---

## How to Use This File

1. Find the next unexecuted packet (first one without ✅)
2. Copy its NEXT PROMPT block
3. Paste into a new Claude Code session
4. The session runs the packet and produces the next NEXT PROMPT

Michael's only relay action between packets: copy → paste.

---

## Packet Status Tracker

| Packet | Module | Lines | Status | Commit |
|---|---|---|---|---|
| P1 | vendors_module.js | ~1,844 | ✅ Complete | c345f23 |
| P2 | vendor_scoring.js | ~847 | ✅ Complete | 5168e6d |
| P3 | quotes_module.js | ~531 | ✅ Complete | b517b8e |
| P4 | dashboard_module.js | ~477 | ⬜ Not started | — |
| P5 | mgmt_module.js | ~467 | ⬜ Not started | — |
| P6 | pipeline_module.js | ~346 | ⬜ Not started | — |
| P7 | repoutreach_module.js | ~424 | ⬜ Not started | — |
| P8 | settings_module.js | ~151 | ⬜ Not started | — |
| P9 | knowledge_module.js | ~82 | ⬜ Not started | — |

Update this table after each packet completes. Change ⬜ to ✅ and fill in the commit hash.

---

## PACKET 1 — vendors_module.js

**Packet:** DECOMP_P1_VENDORS  
**Lines to extract:** ~2,356–4,200 in index.html (~1,844 lines)  
**New file:** `js/vendors_module.js`  
**Risk:** Medium

### Inputs
- `index.html` (read + targeted surgical removal of lines ~2,356–4,200)
- `js/` directory (confirm no naming collision with `vendors_module.js`)

### Outputs
- `js/vendors_module.js` — new file containing all extracted functions
- `index.html` — those lines removed, one `<script src="js/vendors_module.js?v=6.11.1">` added

### Stop Conditions
- Duplicate function definition discovered that can't be cleanly resolved → escalate
- Extracted file causes a JS syntax error → revert, fix, re-extract
- Any function in the extracted set also appears in an already-external module → escalate before proceeding
- Michael has not authorized `index.html` mutation for this session → stop immediately

### Forbidden Zones
- Do NOT change any function logic during extraction (verbatim copy-cut only)
- Do NOT rename any functions
- Do NOT modify any already-external `js/*.js` files
- Do NOT touch the HTML structure of index.html (body, head, CSS, nav)
- Production deploys, SQL, workers — standard forbidden

### Pre-extraction Checklist
- [ ] `grep -n "function openRepOutreach" index.html` — if two definitions exist, note which to keep (the one at ~line 4,197 is the full version — remove the stub at ~3,969)
- [ ] `grep -n "vendors_module" js/` — confirm no naming collision
- [ ] `git status` — confirm clean working tree before starting

### Rollback Path
```bash
git checkout -- index.html js/vendors_module.js
# OR if committed:
git revert HEAD --no-edit
```

### Verification Method
```bash
# 1. Confirm extracted file exists and has functions:
grep -c "^function" js/vendors_module.js   # should be > 30

# 2. Confirm functions are gone from index.html:
grep -n "function renderVendors\|function buildScoresRow\|function openVendorDetail" index.html
# should return 0 results

# 3. Confirm script tag added:
grep -n "vendors_module" index.html   # should return 1 result

# 4. Manual browser test (after push + Cloudflare auto-deploy):
# Navigate to Vendor Ranking → Scores tab → click a vendor → edit a score
# Navigate to Vendor Ranking → Rep List tab
# Navigate to Vendor Ranking → Co-op tab
# All should render normally
```

### Commit Message
```
refactor(decomp/P1): extract vendors module — 1844 lines → js/vendors_module.js

Verbatim extraction of vendors(), renderVendors(), and ~40 related functions
from index.html into external module. No logic changes. index.html -1844 lines.
Verified: scores tab, vendor detail, rep list, coop tracker all render correctly.
```

---

### NEXT PROMPT — Packet 1

```
══════════════════════════════════════════════════
NEXT PROMPT — Packet P1: Vendors Module Extraction
══════════════════════════════════════════════════

Packet: DECOMP_P1_VENDORS
Branch: [current-branch]
Prereq: git status clean, index.html unmodified since last session

Context:
AccentOS index.html is 7175 lines with ~6483 lines of inline JS.
This packet extracts the vendors module (~1844 lines, the largest block)
into js/vendors_module.js — verbatim, no logic changes.

See docs/runtime/PHASE1_DECOMPOSITION_EXECUTION_PLAN.md for full context.
See docs/runtime/PHASE1_PACKETIZED_TASKS.md for this packet's full spec.

Your task:
1. Read index.html lines 2356-4200. Identify the exact start/end of the
   vendors JS block (starts after the REP_DIRECTORY data array ends,
   ends before the repoutreach page function).

2. Pre-check: grep -n "function openRepOutreach" index.html
   There may be a duplicate definition (~3969 and ~4197). If so:
   - Keep the full version at ~4197 in the extraction
   - Delete the stub at ~3969 as part of the extraction

3. Create js/vendors_module.js with all extracted functions.
   File header: // ── VENDORS MODULE (extracted from index.html at v6.11.1) ──

4. Remove those lines from index.html.

5. Add this script tag to index.html after the vendor_score_import.js tag:
   <script src="js/vendors_module.js?v=6.11.1"></script>

6. Verify:
   grep -c "^function" js/vendors_module.js  (expect > 30)
   grep -n "function renderVendors" index.html  (expect 0 results)
   grep -n "vendors_module" index.html  (expect 1 result — the script tag)

Scope: index.html (targeted line removal only) + new js/vendors_module.js
Forbidden: logic changes, renames, other js/* files, HTML structure, deploys, SQL

Stop conditions:
- Duplicate functions that can't be cleanly resolved → ESCALATE
- Extraction would remove lines that are referenced elsewhere inline → ESCALATE
- Any syntax error in extracted file → revert and report

Rollback: git checkout -- index.html js/vendors_module.js

After committing, update docs/runtime/PHASE1_PACKETIZED_TASKS.md:
- Mark P1 ✅ with commit hash
- Mark P2 status as "Ready"

Then generate the NEXT PROMPT block for Packet P2.

══════════════════════════════════════════════════
```

---

## PACKET 2 — vendor_scoring.js

**Packet:** DECOMP_P2_VENDOR_SCORING  
**Prereq:** P1 complete  
**Lines to extract:** ~1,211–1,896 in index.html (~847 lines after P1 renumbering)  
**New file:** `js/vendor_scoring.js`  
**Risk:** Low-Medium

### What Moves
- COOP_TRACKER: `sbLoadCoopFunds()`, `sbSaveCoopFund()`, `sbDeleteCoopFund()`, `renderCoopTracker()`, `openCoopEdit()` (lines ~1,211–1,454)
- QUOTES persistence stubs: `sbLoadQuotes()`, `sbSaveQuote()`, `sbDeleteQuote()` (lines ~1,455–1,565)
- VENDOR_OVERRIDES: `sbLoadVendorOverrides()`, `sbSaveVendorOverride()` (lines ~1,566–1,609)
- VENDOR_SCORES: `sbLoadVendorScores()`, `sbSaveVendorScores()` (lines ~1,610–1,755)
- PARENT_COMPANIES: `getVendorParent()`, `getSisterVendors()`, `applyPrefillVendorCats()`, `renderCatChips()`, `openCategoryEditor()` (lines ~1,756–1,896)

### What Stays Inline
`weightedScore()`, `scoredCount()`, `scoreColor()`, `heatColor()`, `fmt$()`, `tier()`, `tierBadge()`, `logChange()` — these are global infrastructure referenced by modules at load time.

### Verification
```bash
grep -n "function renderCoopTracker\|function openCoopEdit\|function sbSaveCoopFund" index.html
# expect: 0 results
grep -n "vendor_scoring" index.html
# expect: 1 result (script tag)
```

---

### NEXT PROMPT — Packet 2

```
══════════════════════════════════════════════════
NEXT PROMPT — Packet P2: Vendor Scoring Extraction
══════════════════════════════════════════════════

Packet: DECOMP_P2_VENDOR_SCORING
Branch: [branch — same branch P1 was on, now merged to main]
Prereq: P1 complete (js/vendors_module.js exists, P1 commit merged)

Context:
P1 extracted the vendors page module (~1844 lines). P2 extracts the vendor
scoring infrastructure: coop tracker, quote persistence stubs, vendor overrides,
vendor scores, and parent company helpers. These are ~847 lines currently in
index.html between lines ~1211-1896 (line numbers shift after P1 removed ~1844 lines).

Find actual line ranges by searching for these markers in current index.html:
- Start: "// ── CO-OP / REBATE TRACKER"
- End: function applyPrefillVendorCats() block ends

See docs/runtime/PHASE1_PACKETIZED_TASKS.md for full packet spec.

Your task:
1. Find exact line range for extraction (search markers above)
2. What stays inline: weightedScore, scoredCount, scoreColor, heatColor,
   fmt$, tier, tierBadge, logChange — do NOT extract these
3. Create js/vendor_scoring.js with all other extracted functions
4. Remove those lines from index.html
5. Add script tag after js/vendors_module.js line
6. Verify with grep checks above
7. Commit verbatim (no logic changes)
8. Mark P2 ✅ in PHASE1_PACKETIZED_TASKS.md
9. Generate NEXT PROMPT for P3

Scope: index.html (targeted removal) + new js/vendor_scoring.js
Forbidden: logic changes, other js/* files, HTML structure, deploys, SQL
Rollback: git checkout -- index.html js/vendor_scoring.js

══════════════════════════════════════════════════
```

---

## PACKETS 3–9 — Abbreviated Specs

*(Full specs follow the same structure as P1/P2. Abbreviated here for reference.)*

---

### PACKET 3 — quotes_module.js

**Lines:** ~5,376–5,907 (after prior extractions, ~531 lines, search for `// ── QUOTES ───`)  
**Includes:** `quotes()`, `renderLI()`, `updatePreview()`, `aiParseNotes()`, `openTrackCalc()`, `saveQ()`, `deleteQ()`, `showSaved()`, `exportQuoteCSV()`, `printQ()`, track calculator helpers  
**Note:** Contains AI calls to Anthropic proxy. Model ID already updated to `claude-sonnet-4-6`.  
**Prereq:** None (independent of P1/P2)

---

### PACKET 4 — dashboard_module.js

**Lines:** ~5,988–6,465 (search for `// ── DASHBOARD ─────`)  
**Includes:** `dashboard()`, `renderRoleSpecificDashboard()`, `computeDailyBrief()`, `sRow()`  
**Note:** Daily brief calls many module functions (`typeof sbLoadDeals !== 'undefined'` etc.) — these guards already exist inline, the extraction is safe.  
**Prereq:** None. But run P3 first if doing both in sequence.

---

### PACKET 5 — mgmt_module.js

**Lines:** ~6,496–6,963 (search for `// ── MGMT ──`)  
**Includes:** `mgmt()`, `renderOwnerOverview()`, `renderKPIRegistry()`, `computeCurrentKPIValue()`, `renderGoalsOKR()`, `openGoalEdit()`, `renderTeamActivity()`, `renderSystemPanel()`  
**Note:** The KPI_CATALOG inline array stays in index.html (it's data, not logic).  
**Prereq:** None

---

### PACKET 6 — pipeline_module.js

**Lines:** ~5,029–5,375 (search for `// ── PIPELINE ─────`)  
**Includes:** `pipeline()`, `renderPipeline()`, `openAddDeal()`, `openDeal()`, `dealHTML()`, `computeDealProbability()`, `openArchive()`, `findDealAnyStage()`  
**Note:** DEALS global stays inline. `computeDealProbability` is complex but self-contained.  
**Prereq:** None

---

### PACKET 7 — repoutreach_module.js

**Lines:** ~4,197–4,621 (search for `// ── REP OUTREACH EMAIL GENERATOR ──`)  
**Includes:** Full `openRepOutreach()`, `buildRepOutreachEmail()`, `repoutreach()` page function  
**Note:** After P1 removes the stub duplicate at ~3,969, only one definition remains. This is that one.  
**Prereq:** P1 (removes the duplicate)

---

### PACKET 8 — settings_module.js

**Lines:** ~6,964–7,115 (search for `// ── SETTINGS ──`)  
**Includes:** `settings()` page function  
**Prereq:** None

---

### PACKET 9 — knowledge_module.js

**Lines:** ~5,908–5,990 (search for `// ── KNOWLEDGE ENGINE ─────`)  
**Includes:** `knowledge()`, `saveKE()`, `renderChat()`, `scrollChat()`, `getQQ()`, `setChatMode()`  
**Note:** `CHAT`, `QQ_INTERNAL`, `QQ_CUSTOMER`, `chatMode` globals stay inline (loaded before modules).  
**Prereq:** None

---

## Quick-Start Ordering for Maximum Impact

If only doing a few packets, prioritize in this order:

1. **P1 first** — 1,844 lines removed, 26% of inline JS gone in one step
2. **P3 next** — quotes module is self-contained and contains the AI calls (easiest to verify)
3. **P5 next** — mgmt module is fully isolated (lowest risk)
4. **P2 last** — requires P1 as prereq, most complex boundary conditions

Packets 3, 4, 5, 6, 7, 8, 9 are all independent of each other. They can be run in any order as long as each is merged before the next starts (they all mutate index.html).

---

## Universal Extraction Procedure

Every packet follows this exact sequence:

```bash
# 1. Confirm clean state
git status   # must be clean

# 2. Find exact line range (search for section comment)
grep -n "// ── [SECTION]" index.html

# 3. Create the module file
# Copy lines start→end from index.html verbatim
# Add header comment: // ── [MODULE] (extracted from index.html at v6.11.X) ──

# 4. Remove those lines from index.html

# 5. Add script tag in index.html at the correct load position
# <script src="js/[module].js?v=6.11.X"></script>

# 6. Verify
grep -c "^function" js/[module].js   # sanity count
grep -n "function [key_function]" index.html   # expect 0

# 7. Commit
git add js/[module].js index.html
git commit -m "refactor(decomp/PX): extract [module] — [N] lines → js/[module].js"

# 8. Update PHASE1_PACKETIZED_TASKS.md (mark ✅, add commit hash)
# 9. Generate NEXT PROMPT for next packet
```
