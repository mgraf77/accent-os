# NEXT DECOMPOSITION CORRIDOR
> AccentOS — P7→P12 Track-Builder Specs  
> Status: PLANNING ONLY — no implementation authorized  
> Prepared: 2026-05-10  
> Context: Picks up immediately after Session 10's P3→P6 corridor (Auth / Vendor Data / Co-op / Pipeline)

---

## CORRIDOR OVERVIEW

After P3→P6 merges, the remaining inline `<script>` block contains these extractable zones:

| Zone | Lines | Content |
|---|---|---|
| Quotes persistence | 1456–1565 | `sbLoadQuotes`, `sbSaveQuote`, `sbDeleteQuote` |
| Quotes state + render | 5376–5903 | State vars, QKB constant, all quote render/logic |
| Knowledge Engine | 5906–5984 | Chat state, `knowledge()`, `sendChat`, `renderChat` |
| Dashboard | 5985–6471 | `dashboard`, `renderRoleSpecificDashboard`, `computeDailyBrief`, `sRow` |
| Roadmap | 6472–6493 | `roadmap()` — single static template function |
| Mgmt | 6494–6959 | KPIs, Goals/OKRs, `mgmt`, all owner-only renders |
| Settings | 6960–7106 | `settings`, users panel, password change, `getS` |
| Boot shell | 7107–7126 | `window.addEventListener('DOMContentLoaded')` — STAYS INLINE |

---

## PACKET 7 — QUOTES EXTRACTION

### Target Files
- **Output:** `js/quotes.js`
- **Modified:** `index.html` (two non-contiguous deletions + one `<script src>` addition)

### Expected Line Ranges (PRE-EXTRACTION)

**Zone A — Persistence (non-contiguous, earlier block):**
```
Lines 1456–1565  (~110 lines)
  Functions: sbLoadQuotes, sbSaveQuote, sbDeleteQuote
  State refs: QUOTES global array (must be declared in Zone B, read here)
```

**Zone B — State vars + QKB constant:**
```
Lines 5376–5421  (~46 lines)
  let QUOTES=[], QUOTE_ID=1, CQ=null, LI=[]    (line 5376)
  const QKB = { … }                             (line 5379, large constant)
  let _pendingTrackLines = []                   (line 5786)
```

**Zone C — Render + Logic:**
```
Lines 5422–5903  (~482 lines)
  calcTrackHardware, nLI, addLI, quotes, renderLI, qFlagRow,
  approveAllRows, updatePreview, aiParseNotes, openTrackCalc,
  parseRunLengths, previewTrackCalc, addTrackLinesToQuote,
  saveQ, deleteQ, showSaved, exportQuoteCSV, printQ, aiSummary
```

**Total extracted:** ~638 lines across two non-contiguous zones.

### Composition Order in `js/quotes.js`
Merge in this exact sequence (do NOT preserve inline order):
1. State vars (from Zone B, line 5376): `let QUOTES, QUOTE_ID, CQ, LI`
2. `let _pendingTrackLines` (from Zone B, line 5786)
3. `const QKB` constant (from Zone B, line 5379) — large track parts lookup object
4. Persistence functions (from Zone A, lines 1456–1565): sbLoadQuotes, sbSaveQuote, sbDeleteQuote
5. Render + logic functions (from Zone C, lines 5422–5903)

### Non-Contiguous Extraction Protocol
Extracting from two zones requires two separate deletions in `index.html`. Commit order matters:
```
STEP 1: Create js/quotes.js with all content (both zones)
STEP 2: Delete Zone A from index.html (lines 1456–1565 deletion)
STEP 3: Delete Zone B+C from index.html (lines 5376–5903 deletion — line numbers shift after Step 2)
STEP 4: Add <script src="js/quotes.js?v=1.0.0"> to the external modules block
STEP 5: Commit all four file changes atomically
```
**Do not commit after Step 2 alone.** A partial extraction is more dangerous than no extraction.

### Script Tag Placement
```html
<!-- Add to external modules block (after existing modules, before or alongside customers.js) -->
<script src="js/quotes.js?v=1.0.0"></script>
```
Position: After the inline `</script>` block ends, alongside existing external modules. `quotes.js` depends on `sbFetch`, `toast`, `openModal`, `esc`, and `VD` (vendor data) — all loaded from earlier packets or still inline.

### Dependencies
| Symbol | Source after P3–P6 |
|---|---|
| `sbFetch` | js/sb-core.js (P2) |
| `toast`, `openModal`, `esc` | js/utils.js (P1) |
| `QUOTES` | declared in js/quotes.js itself |
| `VD` | js/vendor-data.js (P4) — for vendor dropdown |
| `CU` | js/auth.js (P3) — for audit log writes |
| `goTo` | still inline (shell) |

### Allowed Files This Packet
- `js/quotes.js` — create
- `index.html` — delete lines 1456–1565 and 5376–5903, add `<script src>`

### Forbidden During This Packet
- Do not touch any other `js/` file
- Do not modify the AI proxy URL in `aiParseNotes` — it references the Cloudflare Worker
- Do not rename `QUOTES`, `LI`, `QKB`, `QUOTE_ID`, `CQ` — all referenced by external modules

### Verification Steps
```bash
# 1. Symbol availability
# In browser console after load:
typeof QUOTES          # → "object" (array)
typeof QKB             # → "object"
typeof sbLoadQuotes    # → "function"
typeof saveQ           # → "function"

# 2. Functional tests
# a) Navigate to Quote Generator → page renders with blank line item
# b) Add 2 line items → they render
# c) Click "Save" → toast "Saved" appears; check Supabase quotes table
# d) Click "Saved" → saved quotes modal opens with entry
# e) Click "⬇ CSV" → CSV downloads
# f) Click "⚡ Parse Notes" → AI proxy call fires (check Network tab)
# g) Open Track Calc → modal opens, run lengths parse, adds to quote

# 3. No regressions
# Open Vendor Ranking → co-op tab → pipeline → all still work
```

### Rollback Command
```bash
git revert [packet-7-merge-commit-hash]
# Manual fallback:
# 1. Delete js/quotes.js
# 2. Restore deleted lines 1456–1565 to index.html at original position
# 3. Restore deleted lines 5376–5903 to index.html at original position
# 4. Remove <script src="js/quotes.js"> tag
```

### Stop Conditions
- `QUOTES` is undefined after load → state var not moved to correct scope → ROLLBACK
- `sbLoadQuotes` throws ReferenceError → load order issue → ROLLBACK
- AI Parse returns 400 → check if aiParseNotes AI proxy URL moved correctly → debug before rollback

### Escalation Triggers
- Any page other than Quote Generator breaks → scope contamination during non-contiguous extraction → immediate ROLLBACK
- `QKB` is undefined but everything else works → the large constant was silently missed → ROLLBACK

### Commit Message Template
```
decomp(quotes): extract quotes module to js/quotes.js

- Moves sbLoadQuotes, sbSaveQuote, sbDeleteQuote (lines 1456–1565)
- Moves state vars, QKB, and all render/logic (lines 5376–5903)
- Adds <script src="js/quotes.js?v=1.0.0"> to external modules block
- index.html: 638 lines removed
```

### Continuation Logic
After P7 merges and verification passes → check `git diff --stat` shows exactly 2 files changed → log SESSION_LOG entry with rollback hash → cut P8 branch.

---

## PACKET 8 — KNOWLEDGE ENGINE EXTRACTION

### Target Files
- **Output:** `js/knowledge-engine.js` (new file; complements existing `js/knowledge_hub.js`)
- **Modified:** `index.html`

### Expected Line Ranges (PRE-EXTRACTION)
```
Lines 5906–5984  (~79 lines)
  State: let CHAT=[], let chatMode, QQ_INTERNAL, QQ_CUSTOMER, const QQ
  Functions: getQQ, setChatMode, knowledge, saveKE, sendChat, renderChat, scrollChat
```

### Critical Dependency: `renderKnowledgeHub`
The `knowledge()` function (line 5915) calls `renderKnowledgeHub()` via `setTimeout` at its tail. `renderKnowledgeHub` lives in `js/knowledge_hub.js` (already external). This cross-module call is safe because both files are loaded before DOMContentLoaded fires.

### Critical Dependency: `getS`
`sendChat` (line 5966) calls `getS('aos-api')`. `getS` is defined at line 7106 (inline, Settings section). Since the inline block runs BEFORE external module scripts, `getS` is globally available when `knowledge-engine.js` executes any function at runtime. **However:** if P11 (Settings) has not yet been extracted, `getS` is still inline and this is safe. If P11 runs before P8, `getS` must be in `js/settings.js` and loaded before `knowledge-engine.js`. See sequencing note below.

**Sequencing rule:** P8 (Knowledge Engine) MUST merge before P11 (Settings) because P8 treats `getS` as an inline global. If this order is inverted, `getS` extraction to `settings.js` must happen first, and `settings.js` must load before `knowledge-engine.js`.

### Script Tag Placement
```html
<script src="js/knowledge-engine.js?v=1.0.0"></script>
```
Add to external modules block, after `js/knowledge_hub.js` (so `renderKnowledgeHub` is defined first).

### Allowed Files This Packet
- `js/knowledge-engine.js` — create
- `index.html` — delete lines 5906–5984, add `<script src>`

### Verification Steps
```bash
# Console checks:
typeof knowledge       # → "function"
typeof sendChat        # → "function"
typeof CHAT            # → "object"

# Functional:
# a) Navigate to Knowledge Engine → page renders with mode toggle and chips
# b) Click a quick-chip → chat fires, response appears
# c) Toggle to Customer mode → mode badge changes, chips change
# d) Config tab → save API key → works
# e) Internal Docs tab → articles render (renderKnowledgeHub still works)
```

### Rollback Command
```bash
git revert [packet-8-merge-commit-hash]
```

### Stop Conditions
- Knowledge Engine page blank → `knowledge()` not found by router → ROLLBACK
- Chips fire but no AI response → `getS` not available → check extraction order, likely need `getS` in utils.js

### Commit Message Template
```
decomp(knowledge): extract knowledge engine to js/knowledge-engine.js

- Moves CHAT/chatMode state, QQ arrays, knowledge(), saveKE(),
  sendChat(), renderChat(), scrollChat() (lines 5906–5984)
- Adds <script src="js/knowledge-engine.js?v=1.0.0">
- index.html: 79 lines removed
```

---

## PACKET 9 — DASHBOARD EXTRACTION

### Target Files
- **Output:** `js/dashboard.js`
- **Modified:** `index.html`

### Expected Line Ranges (PRE-EXTRACTION)
```
Lines 5985–6471  (~487 lines)
  Functions: dashboard, renderRoleSpecificDashboard, computeDailyBrief, sRow
```

### Dependency Audit (HIGH RISK)
Dashboard is a read-aggregator. Before `dashboard()` renders, these globals must be populated:

| Global | Source after P4–P7 |
|---|---|
| `VD` | js/vendor-data.js (P4) |
| `DEALS` | js/pipeline.js (P6) |
| `QUOTES` | js/quotes.js (P7) |
| `COOP_FUNDS` | js/coop.js (P5) |
| `weightedScore`, `tier`, `scoreColor` | js/vendor-data.js (P4) |
| `computeDealProbability` | js/pipeline.js (P6) |
| `KPI_DEFINITIONS` | STILL INLINE until P10 |
| `GOALS` | STILL INLINE until P10 |

**All data module packets (P4–P7) must be merged and confirmed stable before P9 can execute.**

### Sequencing Gate
P9 cannot start until: P4, P5, P6, P7 are ALL merged AND the dashboard page renders correctly on the post-P7 codebase. If P7 introduced a regression in dashboard rendering (e.g., `QUOTES` count shows wrong), fix it before cutting P9 branch.

### Script Tag Placement
```html
<script src="js/dashboard.js?v=1.0.0"></script>
```
Add after `js/pipeline.js`, `js/quotes.js` in the external modules block.

### Allowed Files This Packet
- `js/dashboard.js` — create
- `index.html` — delete lines 5985–6471, add `<script src>`

### Verification Steps
```bash
# Console:
typeof dashboard                    # → "function"
typeof computeDailyBrief            # → "function"

# Functional (test all 3 role variants):
# a) Owner/Admin role → full dashboard with all 8 tiles in Daily Brief
# b) Sales role → limited tiles (Closing ≤7d, stale quotes visible)
# c) Warehouse role → minimal dashboard (no pipeline/vendor tiles)
# d) KPI snapshot tile still shows (KPI_DEFINITIONS still inline until P10)
# e) Top Vendors section renders with score bars
# f) Pipeline forecast tile shows summed deal value
```

### Rollback Command
```bash
git revert [packet-9-merge-commit-hash]
```

### Stop Conditions
- Any Daily Brief tile shows "undefined" or NaN → global read before hydration → ROLLBACK
- Dashboard blank for any role → `dashboard` function not found → ROLLBACK

### Commit Message Template
```
decomp(dashboard): extract dashboard module to js/dashboard.js

- Moves dashboard(), renderRoleSpecificDashboard(),
  computeDailyBrief(), sRow() (lines 5985–6471)
- Adds <script src="js/dashboard.js?v=1.0.0">
- index.html: 487 lines removed
```

---

## PACKET 10 — MGMT + ROADMAP EXTRACTION

### Target Files
- **Output:** `js/mgmt.js`
- **Modified:** `index.html`

### Expected Line Ranges (PRE-EXTRACTION)
```
Lines 6472–6493  (~22 lines)   ← roadmap() — static template
Lines 6493–6959  (~467 lines)  ← mgmt section state, all mgmt functions
  State vars: let mgmtSection (6493), let KPI_DEFINITIONS (6602),
              let KPI_SNAPSHOTS (6603), const SEED_KPIS (6606),
              let GOALS (6735), const GOAL_LEVELS (6736), const GOAL_LEVEL_LABELS (6737)
  Functions: mgmt, renderOwnerOverview, sbLoadKPIs, computeCurrentKPIValue,
             snapshotAllKPIs, renderKPIRegistry, sbLoadGoals, sbSaveGoal,
             sbDeleteGoal, renderGoalsOKR, openGoalEdit, saveGoal, deleteGoal,
             renderTeamActivity, loadAuditLog, renderSystemPanel
```
**Total:** ~489 lines → `js/mgmt.js`

### Dependency Audit
- `mgmt` renders Employees tab → calls `employees()` from `js/employees.js` ✓ (already external)
- `mgmt` renders Commission tab → calls `commission()` from `js/commission.js` ✓ (already external)
- `renderOwnerOverview` reads `DEALS`, `QUOTES`, `COOP_FUNDS` — all must be extracted by this point
- `snapshotAllKPIs` calls `sbFetch` — available from P2
- `loadAuditLog` calls `sbFetch` — available from P2

### Dashboard Dependency Note
After P10 extracts `KPI_DEFINITIONS` and `GOALS` to `js/mgmt.js`, the Dashboard (P9, now in `js/dashboard.js`) must still be able to read them. Both `computeDailyBrief` and `renderRoleSpecificDashboard` reference these globals. This is safe because `js/mgmt.js` will be loaded before DOMContentLoaded and both set module-level globals on `window`.

**P10 script tag must load BEFORE any first DOMContentLoaded call** — place it in the external modules block like all others, and it will be fine since `goTo('dashboard')` doesn't fire until after all scripts load.

### Script Tag Placement
```html
<script src="js/mgmt.js?v=1.0.0"></script>
```
Add to external modules block after `js/employees.js` and `js/commission.js`.

### Allowed Files This Packet
- `js/mgmt.js` — create
- `index.html` — delete lines 6472–6959, add `<script src>`

### Verification Steps
```bash
# Console:
typeof mgmt                    # → "function"
typeof roadmap                 # → "function"
typeof sbLoadKPIs              # → "function"
KPI_DEFINITIONS               # → [] (empty array before hydrate)
GOALS                         # → [] (empty array before hydrate)

# Functional:
# a) Mgmt Dashboard → all 5 sub-tabs render (Overview, KPIs, Goals, Employees, Commission)
# b) KPI Registry → 8 seed KPIs appear → Snapshot today → toast OK
# c) Goals → add a goal → it appears in tree view
# d) Roadmap page → renders (tests that roadmap() moved correctly)
# e) Dashboard page → Daily Brief KPI tiles still compute (globals read from mgmt.js)
```

### Rollback Command
```bash
git revert [packet-10-merge-commit-hash]
```

### Stop Conditions
- Daily Brief KPI tiles disappear or show NaN after P10 → `KPI_DEFINITIONS` not globally accessible → ROLLBACK
- Goals OKR tree blank → `GOALS` global not accessible → ROLLBACK

### Commit Message Template
```
decomp(mgmt): extract mgmt + roadmap module to js/mgmt.js

- Moves roadmap() (lines 6472–6493)
- Moves mgmt(), owner overview, KPI registry, Goals/OKR,
  team activity, system panel, all state vars (lines 6493–6959)
- Adds <script src="js/mgmt.js?v=1.0.0">
- index.html: 489 lines removed
```

---

## PACKET 11 — SETTINGS EXTRACTION

### Target Files
- **Output:** `js/settings.js`
- **Modified:** `index.html`

### Expected Line Ranges (PRE-EXTRACTION)
```
Lines 6960–7106  (~147 lines)
  Functions: settings, renderUsersPanel, saveUserRole, changeMyPassword, getS
```

### CRITICAL: `getS` Dependency Chain
`getS(k)` is a one-liner that reads from `sessionStorage`. It is referenced by:
- `knowledge()` (P8 → `js/knowledge-engine.js`) via `sendChat` 
- `settings()` itself
- Various inline `getS('aos-api')` calls elsewhere

**If P8 was extracted before P11:** `getS` is used in `js/knowledge-engine.js` and must be globally available when that file runs. Since `js/settings.js` will load at the same time as all other external modules (before DOMContentLoaded), `getS` from `settings.js` will be defined before any user interaction calls `sendChat`. This is safe.

**However:** To be clean, `getS` should ideally be moved to `js/utils.js` (P1). If P1 was already merged without `getS`, add `getS` to `js/utils.js` in a micro-patch before cutting P11 branch.

**Recommended pre-P11 micro-patch:**
```
Patch: add getS() to js/utils.js
files: js/utils.js only (add one line)
commit: "patch(utils): add getS sessionStorage helper to utils"
No index.html change needed in this patch.
Then P11 extracts settings without getS (getS already in utils).
```

### Script Tag Placement
```html
<script src="js/settings.js?v=1.0.0"></script>
```

### Allowed Files This Packet
- `js/settings.js` — create
- `index.html` — delete lines 6960–7106 (excluding `getS` if micro-patched to utils first), add `<script src>`

### Verification Steps
```bash
# Console:
typeof settings              # → "function"
typeof getS                  # → "function" (from utils.js or settings.js)

# Functional:
# a) Settings page → API Keys card renders (Owner role)
# b) My Account card → Change Password works
# c) Users panel → shows user list (Owner only)
# d) Save role for a user → toast OK → check Supabase user_profiles
# e) Knowledge Engine → still works (getS available)
```

### Rollback Command
```bash
git revert [packet-11-merge-commit-hash]
```

### Stop Conditions
- Knowledge Engine AI chat breaks post-P11 → `getS` resolution issue → ROLLBACK + apply micro-patch
- Settings page blank → `settings()` load order issue → ROLLBACK

### Commit Message Template
```
decomp(settings): extract settings module to js/settings.js

- Moves settings(), renderUsersPanel(), saveUserRole(),
  changeMyPassword(), getS() (lines 6960–7106)
- Adds <script src="js/settings.js?v=1.0.0">
- index.html: 147 lines removed
```

---

## PACKET 12 — SHELL THINNING

### Target: The Final Inline Script Block Reduction

After P7–P11 merge, the remaining inline `<script>` block contains only the shell. This packet does NOT extract anything to a new file. It audits and documents what legitimately MUST stay inline.

### Expected Survivors (Must Stay Inline)

```
BOOT EVENT LISTENER (lines ~7107–7126)
  window.addEventListener('DOMContentLoaded', async () => { … })
  → Cannot be extracted: executes the boot sequence, references tryRestoreSession,
    activateApp, hydrateFromSupabase (now in auth.js), and goTo.

ROUTER + PAGE META (lines ~831–878)
  const PAGE_META = { … }
  let curPage = ''
  function goTo(page) { … }
  → Must stay near the top of the inline block. goTo() is called by 50+ inline
    HTML onclick attributes. Cannot safely externalize without touching the HTML.

SHELL TOGGLES (lines ~725–769)
  let sbCol = false
  function toggleSB() { … }
  function toggleQA() { … }
  function qaGo(page) { … }
  → Called from inline HTML onclick attributes. Keep inline.

FEEDBACK WIDGET (lines ~879–908)
  let fbType, fbOpen
  function toggleFB() { … }
  function setFBType() { … }
  async function submitFB() { … }
  let _activityLog = []
  function log() { … }
  → Small, harmless. Can stay inline or move to js/feedback.js in a future pass.
    Not worth a dedicated packet.
```

### Target Post-Thinning State
```
index.html inline <script> block target: ≤ 400 lines
Current inline block (post P0–P11): should be ~600–700 lines
Shell thinning removes only dead code / confirmed survivors list above
```

### Verification Steps
```bash
wc -l index.html                  # Target: ≤ 700 total lines
# Count inline script block lines:
# grep -c "" between <script> and </script> tags

# Full smoke test all 30+ pages across all roles
# No console errors on any page
# Session restore still works (tryRestoreSession in auth.js, boot in inline)
```

### Stop Conditions
- Any page fails to load → stop immediately, enumerate what was removed vs what's broken
- Boot sequence doesn't fire → DOMContentLoaded listener was accidentally removed → ROLLBACK

### Commit Message Template
```
decomp(shell): final shell thinning — index.html inline block reduced

- Confirms and documents surviving inline functions
- Removes any remaining extractable fragments (dead code, comments)
- Target: ≤400 lines in inline <script> block
- index.html total target: ≤700 lines
```

---

## CONTINUATION LOGIC

```
P7 merges → verify quotes work → cut P8 branch
P8 merges → verify knowledge engine → cut P9 branch
P9 merges → verify all dashboard roles → assess P10 (is KPI_DEFINITIONS safe to move?)
P10 merges → verify mgmt + check dashboard KPI tiles → apply getS micro-patch
P10 micro-patch merges → cut P11 branch
P11 merges → full settings + knowledge engine regression check → cut P12 branch
P12 merges → full smoke test all pages all roles → Phase 1 decomposition COMPLETE
```

**Phase 1 completion metric:**  
`index.html` ≤ 700 total lines, ≤ 400 inline script lines, no more functional code in the inline block.
