# LIVE CORRIDOR STATE — V2
> AccentOS — Near-track builder. Always synchronized to HEAD.
> Replaces: LIVE_CORRIDOR_STATE.md (commit 15fb618 — now stale)
> Calibrated: 2026-05-10 · commit 15fb618
> Age: 0 commits since calibration · State: FRESH

---

## GROUND TRUTH

```
index.html           7,169 lines
Inline script block  6,606 lines (521–7126)
CSS block            353 lines (9–361)
External JS modules  37 files in js/
External script tags 38 in index.html (37 modules + 1 CDN Supabase)
Decompositions done  ZERO — no extraction commits on any branch
Train position       PRE-DEPARTURE — register substrate is the first move
```

**Verify against HEAD (30 sec):**
```bash
wc -l index.html                                # → 7169
grep -c "^const SUPABASE_URL" index.html        # → 1  (still inline)
grep -c "^const \$=" index.html                 # → 1  (still inline)
grep -c "^<style>" index.html                   # → 1  (still inline)
ls js/*.js | wc -l                              # → 37 (no new output files)
```

---

## CORRIDOR MODE

```
MODE: CAUTION
REASON: VD-UI zone (2,868 lines, lines 2161–5028) is 4 packets ahead.
        It mandates CRAWL when reached. Everything before it can chain,
        but max chain depth for any corridor is 3 packets.
Single-packet mandate: VD-UI only (P4b — no chaining with anything)
```

---

## LIVE CORRIDOR — REGISTER SUBSTRATE (P0 + P1 + P2)

**What this corridor does:**
- P0: CSS → css/accent-os.css (353 lines, 30 min of all-in)
- P1: Shell utils → js/utils.js (60 lines)
- P2: Supabase layer → js/sb-core.js (148 lines)
- Establishes load-order substrate that all subsequent module extractions depend on.

**After completion:**
- `wc -l index.html` → ~6,611 (net −558 lines)
- Three new files in repo: css/accent-os.css, js/utils.js, js/sb-core.js
- Three new tags in `<head>`: link + two script tags

**Mode:** GO (all three are low-risk, no cross-dependencies, no global side effects)
**Commits:** 3 (one per packet, each independently revertible)
**Duration:** 30–40 min

---

═══════════════════════════════════════════════════════
 HANDOFF EXECUTION BLOCK — REGISTER SUBSTRATE
 One read → execute straight through · 30–40 min · GO
═══════════════════════════════════════════════════════

## STEP 0 — ENTRY GATE

```bash
grep -c "^const SUPABASE_URL\|^const \$=\|^<style>" index.html
```
→ **Expected: 3** (all three zones still inline)
→ If returns 0: substrate already complete — run exit gate, promote SKETCH to LIVE.
→ If returns 1 or 2: partial execution — skip already-extracted packets, continue from next.

---

## WRITE ROLLBACKS (before any edit — record commit hashes after each commit)

```
P0 rollback: git revert [P0-commit-hash]
             OR: git checkout HEAD~1 -- index.html; rm css/accent-os.css
P1 rollback: git revert [P1-commit-hash]
             OR: git checkout HEAD~1 -- index.html; rm js/utils.js
P2 rollback: git revert [P2-commit-hash]
             OR: git checkout HEAD~1 -- index.html; rm js/sb-core.js
```

---

## P0 — CSS EXTRACTION → css/accent-os.css

**LOCATE:**
```bash
grep -n "^<style>" index.html     # → line 9
grep -n "^</style>" index.html    # → line 361
```

**EXECUTE:**
1. Create `css/accent-os.css` — copy the CSS content between (not including) the `<style>` and `</style>` tags (lines 10–360)
2. Replace the entire `<style>…</style>` block (lines 9–361) in index.html with exactly:
   `<link rel="stylesheet" href="css/accent-os.css?v=1.0.0">`

**VERIFY:**
```bash
wc -l index.html                     # → 6817 (7169 − 353 + 1 = 6817, ±1)
grep -c "^<style>" index.html        # → 0
grep -c "accent-os.css" index.html   # → 1
```
Browser: app loads with no visual regression. DevTools Network: `accent-os.css` → 200 OK.
DevTools Elements: no inline `<style>` tag visible in `<head>`.

**COMMIT:**
```bash
git add index.html css/accent-os.css
git commit -m "decomp(css): extract inline styles to css/accent-os.css"
```

**STOP IF:** Any visual regression on any page, or DevTools shows accent-os.css returning 404.

---

## P1 — UTILS EXTRACTION → js/utils.js

**LOCATE:**
```bash
grep -n "^const \$=" index.html           # zone start (shifted ~−352 vs original)
grep -n "^function switchTab" index.html  # last function in zone
```

**EXTRACT to js/utils.js** — from `const $=` through the closing `}` of `switchTab`:
```
$, qsa, esc, v, csvStringify, csvDownload, _toastRecent (const), toast,
openModal, closeModal, switchTab
```

**ADD to `<head>` as THE FIRST `<script>` tag** (before all other script tags, after the link tag):
```html
<script src="js/utils.js?v=1.0.0"></script>
```

**DELETE** the extracted lines from the inline script block.

**VERIFY:**
```bash
grep -c "^const \$=" index.html         # → 0
wc -l index.html                        # → ~6757 (6817 − 60 = 6757, ±1)
```
Browser console: `typeof toast` → "function" · `typeof $` → "function" · `typeof esc` → "function"
No ReferenceError on any page load.

**COMMIT:**
```bash
git add index.html js/utils.js
git commit -m "decomp(utils): extract shell utilities to js/utils.js"
```

**STOP IF:** ReferenceError for `$`, `toast`, `esc`, or `openModal` in console.

---

## P2 — SB CORE EXTRACTION → js/sb-core.js

**LOCATE:**
```bash
grep -n "^const SUPABASE_URL" index.html           # zone start
grep -n "^async function sbLoadScoreStates" index.html  # last function in zone
grep -n "^let COOP_FUNDS" index.html               # line AFTER zone end
```

**EXTRACT to js/sb-core.js** — from `const SUPABASE_URL` through closing `}` of `sbLoadScoreStates`:
```
SUPABASE_URL, SUPABASE_ANON_KEY, sbKey, sbConfigured, sbFetch,
_sbRT, sbRealtime, sbLoadCategories, sbSaveCategories, sbLoadScoreStates
```

**ADD to `<head>` AFTER utils.js:**
```html
<script src="js/sb-core.js?v=1.0.0"></script>
```

**DELETE** the extracted lines from the inline script block.

**VERIFY:**
```bash
grep -c "^const SUPABASE_URL" index.html    # → 0
wc -l index.html                            # → ~6609 (6757 − 148 = 6609, ±2)
git diff --stat                             # → 2 files: index.html + js/sb-core.js
```
Browser console: `typeof sbFetch` → "function" · `typeof sbRealtime` → "function"
Reload: login succeeds, data loads on all pages, no new 400/401/404 in Network tab.

**COMMIT:**
```bash
git add index.html js/sb-core.js
git commit -m "decomp(sb-core): extract Supabase layer to js/sb-core.js"
```

**STOP IF:** Network tab shows new 400/401/404 errors, or `typeof sbFetch` → "undefined".

---

## CORRIDOR EXIT GATE

```bash
grep -c "^const SUPABASE_URL\|^const \$=\|^<style>" index.html   # → 0
wc -l index.html                                                   # → ~6611 (±5)
ls css/accent-os.css js/utils.js js/sb-core.js                    # all three exist
```

**Smoke test:** login → dashboard loads → vendors page loads with data → logout → login screen returns.

**Session log entry:**
```
Merged: Register Substrate (P0+P1+P2) — css, utils, sb-core extracted.
Rollback: git revert [P2-hash] && git revert [P1-hash] && git revert [P0-hash]
Post-smoke: login ✓ · dashboard ✓ · vendors ✓ · logout ✓
```

**FEEDS INTO:** Corridor R1 (POST_REGISTER_CORRIDORS.md)

═══════════════════════════════════════════════════════

---

## SKETCH CORRIDOR — COHORT-1 (P3 + P4a)

**Status: NOT YET EXECUTION-READY**
Promotes to LIVE when register substrate exit gate passes + smoke test recorded in SESSION_LOG.

**Cohort-1 scope:**
- P3 → js/auth.js (AUTH zone: 197 lines — ROLES through doLogout)
- P4a → js/vendor-data.js (VD data layer: 749 lines — VD-CONSTS + VD-PERSIST + VD-COMPUTE, non-contiguous)

**Non-contiguous note for P4a:** After P2 extraction, VD-CONSTS (PRODUCT_TAXONOMY block) sits between SHELL-PERMANENT and COOP. VD-PERSIST + VD-COMPUTE sit further down, separated by COOP + QUOTES-P zones. Extraction requires creating the full vendor-data.js first, then deleting two non-adjacent blocks in one atomic commit.

**Pre-promotion validation:**
```bash
grep -c "^const SUPABASE_URL\|^const \$=\|^<style>" index.html   # → 0 (substrate done)
grep -n "^const ROLES" index.html                                  # AUTH intact
grep -n "^const PRODUCT_TAXONOMY" index.html                       # VD-CONSTS intact
```

Full execution spec: **POST_REGISTER_CORRIDORS.md → R1**

---

## ZONE MAP (pre-departure · grep-anchored · line numbers valid at HEAD 15fb618)

| Zone | Start anchor | Orig lines | Size | Destination |
|------|-------------|-----------|------|-------------|
| CSS | `grep -n "^<style>" index.html` | 9–361 | 353 | css/accent-os.css |
| AUTH | `grep -n "^const ROLES" index.html` | 528–724 | 197 | js/auth.js |
| SHELL-A | `grep -n "^function toggleSB" index.html` | 725–769 | 45 | PERMANENT |
| UTILS | `grep -n "^const \$=" index.html` | 770–829 | 60 | js/utils.js |
| ROUTER | `grep -n "^const PAGE_META" index.html` | 831–878 | 48 | PERMANENT |
| FEEDBACK | `grep -n "^let fbType" index.html` | 879–908 | 30 | PERMANENT |
| VD-CONSTS | `grep -n "^const PRODUCT_TAXONOMY" index.html` | 909–1062 | 154 | js/vendor-data.js (A) |
| SB-CORE | `grep -n "^const SUPABASE_URL" index.html` | 1063–1210 | 148 | js/sb-core.js |
| COOP | `grep -n "^let COOP_FUNDS" index.html` | 1211–1455 | 245 | js/coop.js |
| QUOTES-P | `grep -n "^async function sbLoadQuotes" index.html` | 1456–1565 | 110 | js/quotes.js (A) |
| VD-PERSIST | `grep -n "^async function sbLoadVendorOverrides" index.html` | 1566–1811 | 246 | js/vendor-data.js (B) |
| VD-COMPUTE | `grep -n "^const CAT_COLORS" index.html` | 1812–2160 | 349 | js/vendor-data.js (C) |
| VD-UI | `grep -n "^let vFilter=" index.html` | 2161–5028 | **2,868** | js/vendor-data.js (D, CRAWL) |
| PIPELINE | `grep -n "^const STAGES=" index.html` | 5029–5375 | 347 | js/pipeline.js |
| QUOTES-R | `grep -n "^let QUOTES=" index.html` | 5376–5903 | 528 | js/quotes.js (B) |
| KE | `grep -n "^let CHAT=" index.html` | 5906–5984 | 79 | js/knowledge-engine.js |
| DASHBOARD | `grep -n "^function dashboard" index.html` | 5985–6461 | 477 | js/dashboard.js |
| sRow | `grep -n "^function sRow" index.html` | 6462–6471 | 10 | js/dashboard.js (append) |
| ROADMAP | `grep -n "^function roadmap" index.html` | 6472–6493 | 22 | js/mgmt.js (A) |
| MGMT | `grep -n "^function mgmt" index.html` | 6494–6959 | 466 | js/mgmt.js (B) |
| SETTINGS | `grep -n "^function settings" index.html` | 6960–7106 | 147 | js/settings.js |
| BOOT | `grep -n "^window.addEventListener" index.html` | 7107–7126 | 20 | PERMANENT |

**Extractable: 6,263 lines · Permanent shell: ~143 lines**
*Line numbers shift with each extraction — always use anchor commands, not hardcoded numbers.*

---

## COLLISION REGISTER

| Risk | Source | Status |
|------|--------|--------|
| AI Parse 400 bug | aiParseNotes in QUOTES-R | Unresolved — may land as index.html commit, ages this doc +1 |
| openRepOutreach duplicate | Lines 3965 AND 4194 (VD-UI) | Must audit before P4b; no risk until then |
| Open decomp branches | — | None as of calibration |

---

## FRESHNESS TRIGGER

After any commit to `index.html`:
```bash
git log --oneline -- index.html | head -3      # age check
wc -l index.html                               # size check
grep -c "^const SUPABASE_URL\|^const \$=" index.html  # LIVE gate check
```

Age ≥ 5 commits since calibration → see CORRIDOR_STALENESS_PROTOCOL.md: mark EXPIRED, re-calibrate.
