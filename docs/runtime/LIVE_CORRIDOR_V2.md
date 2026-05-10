# LIVE CORRIDOR STATE — V2
> AccentOS — Near-track builder. Calibrated against live HEAD.
> Branch: claude/setup-codex-integration-gMAyH
> Calibrated: 2026-05-10 · commit ca7868e
> Age: 0 · State: FRESH

---

## GROUND TRUTH (verified against HEAD ca7868e)

```
index.html           1,258 lines  (−82.4% from original 7,175)
Inline script block  ~672 lines (530–1202)
CSS block            still inline (lines 9–528 approx — P0 NOT done)
External JS modules  53 files in js/
External script tags 53 module tags + 1 CDN Supabase
Decompositions done  Phase 1 + 1.5 complete — 13 modules extracted
Register substrate   LIVE — window.AOS_REGISTRY + window.register() in shell_utils.js
Cohort-1 registered  3 modules: digest, health, quick_actions
Train position       FROZEN at Phase A Stage 2 Cohort-2 entry
```

**Live verification (30 sec):**
```bash
wc -l index.html                                          # → 1258
grep -c "^const SUPABASE_URL" index.html                  # → 1  (still inline)
grep -c "^const ROLES" index.html                         # → 1  (AUTH still inline)
grep -c "window.AOS_REGISTRY" js/shell_utils.js           # → 1  (substrate live)
grep -rn "^register(" js/ | grep -v shell_utils | wc -l  # → 3  (cohort-1 only)
```

---

## P0 / P1 / P2 PACKET STATUS

| Packet | Status | Evidence |
|--------|--------|---------|
| P0 CSS extraction | **NOT DONE** | `grep -c "^<style>" index.html` → 1 (still inline, lines 9–528) |
| P1 shell_utils | **DONE** | `ls js/shell_utils.js` → exists; `grep -c "^const \$=" index.html` → 0 |
| P2 SB-Core (full) | **PARTIAL** | `supabase_categories.js` extracted sbLoadCategories/sbSaveCategories/sbLoadScoreStates; SUPABASE_URL + sbFetch + sbKey remain inline at line 1014 |

P0 CSS is deferred — it is not blocking Cohort-2 registrations or any register() work. It is a standalone extraction that can run at any point. Record it in SKETCH.

---

## REMAINING INLINE ZONES (live-grepped anchors)

| Zone | Anchor | Current line | Size | Next destination |
|------|--------|-------------|------|-----------------|
| CSS | `grep -n "^<style>" index.html` | 9 | ~353 | css/accent-os.css (P0, deferred) |
| AUTH | `grep -n "^const ROLES" index.html` | 530 | ~197 | js/auth.js |
| SHELL-A (perm) | `grep -n "^let sbCol=false" index.html` | 727 | ~43 | PERMANENT |
| switchTab | `grep -n "^function switchTab" index.html` | 771 | 9 | PERMANENT or shell_utils |
| ROUTER (perm) | `grep -n "^const PAGE_META" index.html` | 780 | ~35 | PERMANENT |
| FEEDBACK (perm) | `grep -n "^let fbType" index.html` | 830 | ~30 | PERMANENT |
| VD-CONSTS | `grep -n "^const PRODUCT_TAXONOMY" index.html` | 860 | ~154 | vendor_scoring.js or new |
| SB-CORE rem. | `grep -n "^const SUPABASE_URL" index.html` | 1014 | ~43 | js/sb_core.js or shell_utils |
| VD-DATA rem. | `grep -n "^const REP_DIRECTORY" index.html` | 1057 | ~122 | vendor_scoring.js or new |
| getS | `grep -n "^function getS" index.html` | 1179 | 1 | shell_utils.js |
| BOOT (perm) | `grep -n "^window.addEventListener" index.html` | 1185 | ~18 | PERMANENT |

**Remaining extractable inline: ~870 lines (CSS + AUTH + VD-CONSTS + SB-CORE rem. + VD-DATA rem. + getS)**
**Permanent shell: ~135 lines (SHELL-A + switchTab + ROUTER + FEEDBACK + BOOT)**

---

## CORRIDOR MODE

```
MODE: GO
REASON: LIVE corridor (Cohort-2 registrations) is metadata-only.
        Zero index.html mutations. Zero new files. No extraction risk.
        Duration ≤ 25 min. No stop conditions apply except pre-existence check.
```

---

## LIVE CORRIDOR — COHORT-2 REGISTRATIONS

**What this corridor does:**
Add `register({name, provides, consumes})` to 13 already-extracted Phase 1/1.5 modules.
Metadata-only. No logic changes. No index.html changes. No new files.

**Prerequisites confirmed:**
- `grep -c "window.AOS_REGISTRY" js/shell_utils.js` → 1 ✓
- `grep -c "^function register" js/shell_utils.js` → 1 ✓
- `grep -rn "^register(" js/ | grep -v shell_utils | wc -l` → 3 (cohort-1 done) ✓

═══════════════════════════════════════════════════════
 HANDOFF EXECUTION BLOCK — COHORT-2 REGISTRATIONS
 One read → execute straight through · GO mode · 15–25 min
═══════════════════════════════════════════════════════

## ENTRY GATE

```bash
grep -rn "^register(" js/ | grep -v shell_utils | wc -l   # → 3  (only cohort-1)
ls js/vendors_module.js js/vendor_scoring.js js/quotes_module.js  # all exist
```
→ If count > 3: cohort-2 partially or fully done — check which modules already have register(), skip those.
→ If any module file missing: something is wrong — stop.

## WRITE ROLLBACK

```
Rollback: git revert [cohort-2-commit-hash]
Or manual: remove register() lines from each of the 13 files
```

## EXECUTION — ADD register() TO ALL 13 MODULES

For each module: open the file, read the first 30 lines to identify provides + consumes, add `register(...)` after the header comment line and before the first `function` or `const` declaration.

**Format:**
```javascript
register({ name: '[module-name]', provides: ['fn1', 'fn2'], consumes: ['sbFetch', 'goTo'] });
```

**Rules:**
- `name` = filename without `.js`
- `provides` = public page function(s) + key exported helpers (what other modules or inline code calls into this module)
- `consumes` = globals this module calls that live in shell_utils.js or remain inline (sbFetch, VD, CHANGELOG, goTo, $, toast, openModal, esc, etc.)
- No logic changes, no renames, no new behavior

**Target modules (13):**
```
js/vendors_module.js       → provides: ['vendors','changelog']
js/vendor_scoring.js       → provides: ['vendorScore','weightedScore','computeVendorTier','tier','tierBadge']
js/quotes_module.js        → provides: ['quotes']
js/dashboard_module.js     → provides: ['dashboard','computeDailyBrief']
js/mgmt_module.js          → provides: ['mgmt','roadmap']
js/pipeline_module.js      → provides: ['pipeline','DEALS','STAGES']
js/repoutreach_module.js   → provides: ['repoutreach','openRepOutreach']
js/settings_module.js      → provides: ['settings']
js/knowledge_module.js     → provides: ['knowledge']
js/vendors_overflow.js     → provides: (read file to determine)
js/vendor_filters.js       → provides: ['openFilterModal','passesAdvancedFilters']
js/vendor_scoring_helpers.js → provides: ['colSummary','scoreColor','dispScore','fmt$']
js/supabase_categories.js  → provides: ['sbLoadCategories','sbSaveCategories','sbLoadScoreStates']
```

⚠️ **Read each file** before writing its register() — provides[] must match the actual exported functions. The table above is a best-guess. Verify against file content.

## VERIFY

```bash
grep -rn "^register(" js/ | grep -v shell_utils | wc -l    # → 16 (3 + 13 new)
grep -rn "^register(" js/ | grep -v shell_utils             # inspect each entry
```
No console errors on page load. `Object.keys(AOS_REGISTRY)` in DevTools → 16 entries.

## COMMIT

```bash
git add js/vendors_module.js js/vendor_scoring.js js/quotes_module.js \
        js/dashboard_module.js js/mgmt_module.js js/pipeline_module.js \
        js/repoutreach_module.js js/settings_module.js js/knowledge_module.js \
        js/vendors_overflow.js js/vendor_filters.js js/vendor_scoring_helpers.js \
        js/supabase_categories.js
git commit -m "feat(substrate): register cohort-2 — 13 Phase 1/1.5 modules"
```

## STOP IF

- Any file doesn't exist when you try to open it
- A `register()` call already exists in a module (skip that one, don't duplicate)
- `window.register` is undefined in DevTools (substrate broken — do not add calls)

---

## CORRIDOR EXIT GATE

```bash
grep -rn "^register(" js/ | grep -v shell_utils | wc -l    # → 16
Object.keys(AOS_REGISTRY)   # DevTools console → 16 keys
```

**Session log entry:**
```
Merged: Cohort-2 registrations (13 modules).
Rollback: git revert [commit-hash]
Registry: 16 modules declared in AOS_REGISTRY
```

**FEEDS INTO:** SKETCH corridor (see below)

═══════════════════════════════════════════════════════

---

## SKETCH CORRIDOR — REMAINING INLINE EXTRACTIONS

**Status: NOT YET EXECUTION-READY**
Promotes to LIVE when Cohort-2 registrations exit gate passes.

**Scope (in recommended execution order):**

**S1 — getS micro-extraction** (1 line, 5 min, standalone)
Move `function getS(k){...}` from inline (line 1179) to js/shell_utils.js.
No new file. No script tag change. One edit, one commit.
```bash
grep -n "^function getS" index.html   # confirm line 1179
grep -n "function getS" js/shell_utils.js  # confirm NOT already there
```

**S2 — AUTH extraction** (197 lines, 20-30 min)
Extract: `const ROLES` through closing `}` of `doLogout` (lines 530–726)
Output: `js/auth.js` (new file)
Script tag: add before all other modules in the external module block
Stop if: doLogin fails, session restore fails, role gating broken

**S3 — CSS extraction** (353 lines, 10 min, standalone)
Extract: `<style>` block (lines 9–528 approx) → `css/accent-os.css`
Replace with: `<link rel="stylesheet" href="css/accent-os.css?v=1.0.0">`
Stop if: any visual regression, 404 on CSS file

**S4 — SB-CORE remnants** (43 lines, 10 min)
Extract: `const SUPABASE_URL` through closing `}` of `sbFetch` (lines 1014–1056)
Output: `js/sb_core.js` (new file) — confirm supabase_categories.js loads AFTER
Stop if: any Supabase call 401/400, sbFetch undefined

**S5 — VD data remnants** (276 lines, 20-30 min, non-contiguous audit required)
Zone A: VD-CONSTS (PRODUCT_TAXONOMY, vendorProductCats, PREFILL_VENDOR_CATS, lines 860–1013)
Zone B: VD-DATA (REP_DIRECTORY, CAT_DEFS, TOTAL_WEIGHT, VENDOR_TYPES, REP_SCORES, VD_RAW, VD init, lines 1057–1178)
Output: confirm which existing module is the right home (vendor_scoring.js, vendors_module.js, or new vendor_data.js)
Special: VD_RAW is a large JSON blob — verify complete transfer, don't clip closing `]`

Pre-promotion validation for SKETCH:
```bash
grep -rn "^register(" js/ | grep -v shell_utils | wc -l   # → 16 (cohort-2 done)
grep -n "^const ROLES" index.html                          # → AUTH still inline
grep -n "^const SUPABASE_URL" index.html                   # → SB-CORE rem still inline
```

---

## BRANCH FRESHNESS STATE

Corridor calibrated at commit **ca7868e** (2026-05-10).

**Decay rule:** Each commit to any JS module file that contains a `register()` call increments age by 1 for the Cohort-2 block. Each commit to `index.html` increments age by 1 for the SKETCH corridor.

```bash
# Check freshness before executing:
git log --oneline | head -5              # current HEAD
git log --oneline -- index.html | head -3  # SKETCH decay check
git log --oneline -- js/*.js | head -3     # Cohort-2 decay check (should be clean)
```

Corridor expires (age 5+) → re-calibrate from HEAD before executing.
