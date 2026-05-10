# TRACK READY STATUS
> AccentOS — P7→P12 Corridor Readiness Assessment  
> Status: PLANNING ONLY  
> Updated: 2026-05-10  
> Prerequisite: P3→P6 corridor must be fully merged before any packet in this file executes.

---

## STATUS KEY

| Color | Meaning |
|---|---|
| 🟢 GREEN | Ready to execute as soon as predecessor merges |
| 🟡 YELLOW | Needs one validation step before cutting branch |
| 🔴 RED | Blocked — do not cut branch |

---

## P7 — QUOTES EXTRACTION

**Status: 🟡 YELLOW**

**Why yellow:**  
P7 is a non-contiguous extraction — two separate zones in `index.html` (lines 1456–1565 and 5376–5903) get merged into one output file. This is the first non-contiguous packet in the corridor and introduces risk that one zone gets moved but not the other.

Additionally, the `QKB` constant (the track parts lookup table) starts at line 5379 and is a large multi-line object literal. It must be confirmed to transfer verbatim without truncation during copy.

**Prerequisite:**
- P6 (Pipeline) must be merged and confirmed: Pipeline page loads, deals CRUD works, Dashboard forecast tile still shows
- Confirm `DEALS` global is accessible from `js/pipeline.js` (not just locally scoped inside the module)
- Confirm index.html no longer contains `computeDealProbability` or `sbLoadPipeline`

**Pre-flight validation before cutting P7 branch:**
```bash
# Confirm P6 clean merge:
grep -n "computeDealProbability\|sbLoadPipeline" index.html
# → Should return NO results (already in pipeline.js)

# Confirm DEALS accessible:
# In browser console: typeof DEALS  → should be "object"

# Confirm quotes zone is intact and unchanged:
grep -n "sbLoadQuotes\|let QUOTES\|function quotes" index.html
# → Should find all three (still inline, awaiting P7)
# sbLoadQuotes at ~1456, let QUOTES at ~5376, function quotes at ~5473
```

**Safest next action:**
1. Wait for P6 merge confirmation in SESSION_LOG
2. Run the three grep checks above
3. If all pass → cut `decomp/quotes-extraction` from latest `main`
4. Extract Zone A (persistence) first into `js/quotes.js`, then append Zone B+C — do not commit until both zones are in the file
5. Commit atomically as single commit

**Risk factors:**
- `QKB` constant is ~400 lines — easy to accidentally clip the closing `};` during extraction
- `let _pendingTrackLines` at line 5786 is inside Zone B but far from the other state vars — easy to miss
- AI proxy URL in `aiParseNotes` (`accentos-anthropic-proxy.mgraf77.workers.dev`) must transfer exactly

---

## P8 — KNOWLEDGE ENGINE EXTRACTION

**Status: 🟡 YELLOW**

**Why yellow:**  
Two dependency concerns require validation before cutting branch:

1. **`renderKnowledgeHub` cross-call:** The `knowledge()` function calls `renderKnowledgeHub()` from `js/knowledge_hub.js` via `setTimeout`. When knowledge-engine.js runs, `knowledge_hub.js` must already be loaded. Currently in the external modules block, `knowledge_hub.js` is at line 7133. P8's new `<script src="js/knowledge-engine.js">` tag must come AFTER `knowledge_hub.js` in the load sequence.

2. **`getS` availability:** `sendChat()` calls `getS('aos-api')`. After P8 extraction, `getS` is still inline (it doesn't move until P11). Since the inline block runs BEFORE all external module scripts, `getS` is globally defined before `knowledge-engine.js` ever runs. This is safe. BUT: if the session cuts P11 before P8, this chain breaks. Confirm P8 < P11 in execution order.

**Prerequisite:**
- P7 (Quotes) merged and confirmed
- Verify `knowledge_hub.js` is in the external modules block and functioning (Internal Docs tab works)
- Verify `renderKnowledgeHub` is a global function accessible from console: `typeof renderKnowledgeHub === 'function'`

**Pre-flight validation before cutting P8 branch:**
```bash
# Confirm P7 clean:
grep -n "sbLoadQuotes\|function quotes\|let QUOTES" index.html
# → Should return NO results

# Confirm renderKnowledgeHub accessible:
# In browser console: typeof renderKnowledgeHub  → "function"

# Confirm knowledge engine zone intact:
grep -n "function knowledge\|function sendChat\|let CHAT" index.html
# → Should find all three (still inline, awaiting P8)
```

**Safest next action:**
1. Confirm P7 merge + Knowledge Engine page still works
2. Run pre-flight greps
3. Cut `decomp/knowledge-engine-extraction` from latest `main`
4. Extract lines 5906–5984 to `js/knowledge-engine.js`
5. Add `<script src="js/knowledge-engine.js?v=1.0.0">` AFTER `knowledge_hub.js` in the script tag sequence

**Risk factors:**
- Module is small (79 lines) — low risk
- The `QQ = QQ_INTERNAL` legacy alias at line 5914 must move with the file (some older code may reference `QQ` directly)
- Chat state (`CHAT` array) is cleared on every `goTo('knowledge')` call — test navigation flow

---

## P9 — DASHBOARD EXTRACTION

**Status: 🔴 RED (until P7 + P8 merge)**

**Why red:**  
`computeDailyBrief` (the most complex function in P9) reads from `QUOTES`, `DEALS`, `COOP_FUNDS`, `KPI_DEFINITIONS`, `GOALS`, and `VD`. All of these globals must be stable and verified before P9 extraction. If any data module packet (P4–P7) has a silent regression where a global is undefined or incorrectly populated, the Daily Brief will silently show wrong counts — and this is very hard to detect post-extraction.

**Prerequisite:**
- P4 (Vendor Data) merged and confirmed
- P5 (Co-op) merged and confirmed
- P6 (Pipeline) merged and confirmed
- P7 (Quotes) merged and confirmed
- **Dashboard page renders correctly with correct data on post-P7 codebase** (this is the gate)

**Pre-flight validation before cutting P9 branch:**
```bash
# All data modules confirmed gone from inline:
grep -n "function computeDealProbability\|sbLoadCoopFunds\|sbLoadQuotes\|sbLoadVendorScores" index.html
# → Should return NO results

# Dashboard globals accessible in console AFTER full hydration:
# typeof DEALS                → "object"
# typeof QUOTES               → "object"  
# typeof COOP_FUNDS           → "object"
# typeof VD                   → "object" (with data)
# typeof weightedScore        → "function"

# Dashboard renders all 3 role variants without console error
# Daily Brief tile counts match expected values (verify against Supabase)
```

**Safest next action:**
Wait for P7 and P8 to merge and pass verification. Then run pre-flight checks. Only cut P9 branch after all globals are confirmed accessible and dashboard renders correctly.

**Risk factors:**
- `computeDailyBrief` is 334 lines and the most complex function in this corridor — any missed symbol reference causes a silent blank tile, not an error
- `sRow` (line 6462) is a tiny helper called by `renderSystemPanel` (still inline until P10) and the dashboard system status tile — when P9 moves `sRow` to `dashboard.js`, P10's `renderSystemPanel` must also read it from `dashboard.js` or `sRow` needs to be re-added to `mgmt.js` as well

**Resolution for sRow:**  
Options:
A. Move `sRow` to `utils.js` in a micro-patch before P9 (recommended — it's a pure render utility)
B. Leave `sRow` inline and only extract it with P10 (Mgmt)
C. Define `sRow` in both `dashboard.js` and `mgmt.js` (DRY violation — do not do this)

**Recommended:** Apply micro-patch: add `sRow` to `js/utils.js` before cutting P9 branch. Then P9 does not need to include `sRow` in `dashboard.js`, and P10 reads it from `utils.js`.

---

## P10 — MGMT + ROADMAP EXTRACTION

**Status: 🔴 RED (until P9 merges)**

**Why red:**  
P10 moves `KPI_DEFINITIONS` and `GOALS` globals to `js/mgmt.js`. The Dashboard (already in `js/dashboard.js` after P9) reads both these globals. If P9 extracts dashboard first and then P10 moves the KPI/Goals state, there is a brief window where the globals change location. This is safe AS LONG AS `js/mgmt.js` loads before `DOMContentLoaded` and before any `goTo('dashboard')` call. Since all external module scripts load synchronously before DOMContentLoaded, this is structurally guaranteed.

**However:** P10 can only start after P9 is fully merged and dashboard behavior is confirmed stable. The KPI/Goals globals being "still inline" during P9 is an intentional temporary state — P9 does not need to know about them.

**Prerequisite:**
- P9 merged and confirmed: dashboard renders all role variants, Daily Brief tiles correct
- `sRow` micro-patch applied (from P9 recommendation above)
- Dashboard page confirms `KPI_DEFINITIONS` values are being read (Mgmt overview tile visible)

**Pre-flight validation before cutting P10 branch:**
```bash
# Dashboard confirmed stable:
grep -n "function dashboard\|function computeDailyBrief" index.html
# → Should return NO results (already in dashboard.js)

# Mgmt zone intact:
grep -n "function mgmt\|function sbLoadKPIs\|let KPI_DEFINITIONS" index.html
# → Should find all three (still inline, awaiting P10)

# In console: typeof mgmt  → "function"  (still inline)
```

**Safest next action:**
After P9 confirmation, check whether dashboard's KPI tiles still render correctly (they read `KPI_DEFINITIONS` which is still inline at this point). Then cut P10 branch.

**Risk factors:**
- `SEED_KPIS` constant (line 6606) — large 8-KPI array — must move with `KPI_DEFINITIONS`; if missed, `sbLoadKPIs` will fail to seed on first visit
- `GOAL_LEVELS` and `GOAL_LEVEL_LABELS` constants (lines 6736–6737) — small but easy to miss since they sit far from `renderGoalsOKR`

---

## P11 — SETTINGS EXTRACTION

**Status: 🔴 RED (until P10 merges + getS micro-patch applied)**

**Why red:**  
`getS()` at line 7106 is a global utility function used by `knowledge-engine.js` (P8), settings itself, and potentially other modules. If P11 runs before the `getS` micro-patch (moving it to `utils.js`), there's a risk that `getS` ends up in `settings.js` but `knowledge-engine.js` is loaded first — a transient window where `sendChat` is called before `settings.js` has run.

In practice this risk is very low (both load before DOMContentLoaded), but the clean solution is the micro-patch.

**Prerequisite:**
- P10 merged and confirmed
- `getS` micro-patch applied to `js/utils.js` and verified: `typeof getS === 'function'` in console, Knowledge Engine AI still works
- Confirm `settings()` is still inline and the Settings page renders correctly

**Pre-flight validation before cutting P11 branch:**
```bash
# getS micro-patch confirmed:
grep -n "function getS" js/utils.js
# → Should find it

# Knowledge engine still works after micro-patch:
# In browser: Knowledge Engine → send a chat message → response received

# Settings zone intact:
grep -n "function settings\|function renderUsersPanel\|function getS" index.html
# After micro-patch: getS should NOT be in index.html
# settings and renderUsersPanel should still be there (awaiting P11)
```

**Safest next action:**
1. Apply `getS` micro-patch to `utils.js`
2. Verify Knowledge Engine still works
3. Cut P11 branch, extract lines 6960–7106 (minus `getS` which is now in utils)
4. Add `<script src="js/settings.js?v=1.0.0">`

**Risk factors:**
- P11 is small (147 lines without `getS`) — low risk
- `renderUsersPanel` makes direct DOM manipulations (innerHTML + event listeners) — verify the form renders after extraction

---

## P12 — SHELL THINNING

**Status: 🔴 RED (until P11 merges + full smoke test passes)**

**Why red:**  
Shell thinning is the final step. It is RED not because of complexity but because it requires ALL prior packets to be verified stable. It is the most consequential merge — if something is wrong with the shell, the entire app breaks.

Shell thinning also has the highest "unknown unknowns" risk: there may be helper functions that were used by inline code which was already extracted, but those helpers are still inline. Removing them looks safe but breaks an extracted module.

**Prerequisite:**
- ALL of P7–P11 merged and confirmed
- Full smoke test: every sidebar page, every role, all CRUD operations
- `index.html` inline script block line count measured and documented pre-thinning
- **Every remaining inline function audited against the survivors list** in NEXT_DECOMPOSITION_CORRIDOR.md

**Pre-flight validation before P12:**
```bash
# Measure current inline script block:
grep -c "" <(sed -n '/^<script>$/,/^<\/script>$/p' index.html)
# (Gives approximate line count of remaining inline block)

# List all remaining top-level functions in inline block:
grep -n "^function \|^async function " index.html
# Review each one: is it in the survivors list? If not, where should it go?

# Full smoke test checklist (sample):
# Dashboard, Pipeline, Customers, Quotes, Jobs, POs, Vendors, Knowledge Engine,
# Settings, Mgmt Dashboard, Calendar, Alerts, Warranty, Deliveries, Labels
```

**Safest next action:**
Do not cut P12 branch until there has been a dedicated smoke test session. Document the session in SESSION_LOG.md with the list of pages tested. Only then cut the shell thinning branch.

**Risk factors:**
- `toggleFB` / `submitFB` — feedback widget references Supabase. If submitFB was somehow extracted to a module that no longer has `sbFetch` in scope, it will silently fail.
- The boot event listener references `tryRestoreSession`, `activateApp`, `hydrateFromSupabase` (all now in `auth.js`) and `applyModuleModesAfterHydrate` (in `module_modes.js`) — confirm all these are globally accessible when the boot listener fires
- `sbAuditLog('session_resume', 'auth')` in the boot listener — `sbAuditLog` is in `auth.js`, should be fine

---

## CORRIDOR DEPENDENCY GRAPH

```
P7 (Quotes)
  │ prerequisite: P6 merged
  ▼
P8 (Knowledge Engine)
  │ prerequisite: P7 merged
  ▼
[sRow micro-patch → utils.js]
  │
  ▼
P9 (Dashboard)
  │ prerequisite: P8 merged, all data globals confirmed accessible
  ▼
P10 (Mgmt + Roadmap)
  │ prerequisite: P9 merged
  ▼
[getS micro-patch → utils.js]
  │
  ▼
P11 (Settings)
  │ prerequisite: P10 merged + getS micro-patch
  ▼
[Full smoke test — all pages all roles]
  │
  ▼
P12 (Shell Thinning)
  │ prerequisite: P11 merged + smoke test documented
  ▼
Phase 1 COMPLETE
```

---

## MICRO-PATCH REGISTRY

Two micro-patches are required before their respective packets. These are small targeted changes to already-merged files — not full packets.

### Micro-Patch A: `sRow` to utils.js
**When:** Before cutting P9 branch  
**What:** Add `sRow(label, status, note)` function to `js/utils.js`  
**Why:** `sRow` is a pure render helper called by both Dashboard and Mgmt System Panel  
**Files:** `js/utils.js` only  
**Commit:** `patch(utils): add sRow status-row helper`

### Micro-Patch B: `getS` to utils.js
**When:** Before cutting P11 branch  
**What:** Add `getS(k)` to `js/utils.js`; remove `getS` from inline block  
**Why:** `getS` is used by knowledge-engine.js (P8) and needs to be a true utility  
**Files:** `js/utils.js` (add), `index.html` (remove `getS` from line ~7106)  
**Commit:** `patch(utils): add getS sessionStorage helper; remove from inline block`

---

## TRACK READY SUMMARY

| Packet | Status | Gate | ETA After Gate |
|---|---|---|---|
| P7 — Quotes | 🟡 YELLOW | P6 merge + 3 pre-flight greps | Same session as P6 completion |
| P8 — Knowledge Engine | 🟡 YELLOW | P7 merge + renderKnowledgeHub check | Next session after P7 |
| sRow micro-patch | 🟡 YELLOW | P8 merge | 5-minute patch |
| P9 — Dashboard | 🔴 RED | P7+P8 merge + all data globals confirmed | After P8 + micro-patch |
| P10 — Mgmt | 🔴 RED | P9 merge | After P9 |
| getS micro-patch | 🔴 RED | P10 merge | 5-minute patch |
| P11 — Settings | 🔴 RED | P10 merge + getS micro-patch | After micro-patch |
| P12 — Shell Thinning | 🔴 RED | P11 merge + smoke test | Dedicated session |
