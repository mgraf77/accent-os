# PHASE 1 EXECUTION PLAYBOOK
> AccentOS — index.html Decomposition Doctrine  
> Status: PLANNING ONLY — no implementation authorized from this document  
> Last updated: 2026-05-10

---

## CURRENT STATE SNAPSHOT

| Metric | Value |
|---|---|
| `index.html` total lines | 7,169 |
| `index.html` total bytes | ~735 KB |
| Inline `<style>` block | Lines 9–361 (~352 lines) |
| Inline `<script>` block | Lines 521–7126 (~6,606 lines) |
| External JS modules already extracted | 37 files in `js/` |
| External script tags | Lines 7131–7167 |
| Remaining inline JS functions | ~269 top-level declarations |

**Goal of Phase 1:** Reduce inline `<script>` block from ~6,606 lines to a minimal bootstrap shell (target: ≤500 lines). Extract CSS to an external file. Each extraction is one bounded packet — independently mergeable, independently reversible.

---

## DECOMPOSITION SEQUENCING

Extraction order is non-negotiable. Each packet depends on the one before it being stable and merged to `main` before the next branch is cut.

```
PACKET 0 — CSS Extraction           ← no JS deps; always safe first
PACKET 1 — Utils Extraction         ← must precede all functional packets
PACKET 2 — SB Core Extraction       ← depends on utils being stable
PACKET 3 — Auth Extraction          ← depends on sb-core + utils
PACKET 4 — Vendor Data Extraction   ← depends on sb-core + utils
PACKET 5 — Co-op Extraction         ← depends on vendor-data + sb-core
PACKET 6 — Pipeline Extraction      ← depends on sb-core + utils
PACKET 7 — Quotes Extraction        ← depends on sb-core + utils
PACKET 8 — Dashboard Extraction     ← depends on all data modules being stable
PACKET 9 — Settings Extraction      ← depends on auth + sb-core
PACKET 10 — Shell Thinning          ← final pass; index.html → bootstrap-only
```

**Never parallelize packets.** Each packet mutates `index.html`. Parallel branches = guaranteed merge conflicts.

---

## PACKET EXECUTION ORDER (DETAIL)

### PACKET 0 — CSS Extraction
- **Target:** `index.html` lines 9–361
- **Output file:** `css/accent-os.css`
- **index.html change:** Replace `<style>…</style>` block with `<link rel="stylesheet" href="css/accent-os.css?v=1.0.0">`
- **Risk:** Zero runtime risk. CSS is static and has no JS dependencies.
- **Verification:** Visual regression check — all pages load, no layout breaks, no missing classes.
- **Rollback:** Revert the `<link>` to inline `<style>` and delete `css/accent-os.css`.

---

### PACKET 1 — Utils Extraction
- **Target functions:** `$`, `qsa`, `esc`, `v`, `csvStringify`, `csvDownload`, `toast`, `openModal`, `closeModal`, `switchTab`
- **Output file:** `js/utils.js`
- **Load order:** Must be the FIRST `<script>` tag in `<head>` before any module script.
- **Risk:** HIGH. Every module in `js/` calls `esc`, `$`, `toast`, `openModal`. If load order is wrong, all 37 modules throw ReferenceError on boot.
- **Verification:** Open app → execute `typeof esc` in console → must return `'function'` before any module hydration runs.
- **Rollback:** Return functions to inline `<script>` block; remove `<script src="js/utils.js">` tag.

---

### PACKET 2 — SB Core Extraction
- **Target:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `sbKey`, `sbConfigured`, `sbFetch`, `sbRealtime`
- **Output file:** `js/sb-core.js`
- **Load order:** After `utils.js`, before `auth.js` and all feature modules.
- **Risk:** HIGH. `sbFetch` is the network primitive for every module. Wrong placement = silent 404s on all data loads.
- **Verification:** `typeof sbFetch === 'function'` in console at boot. Load Customers page — network tab shows successful Supabase REST calls.
- **Rollback:** Return declarations to inline block; remove `<script src="js/sb-core.js">`.

---

### PACKET 3 — Auth Extraction
- **Target:** `jwtKey`, `setJwt`, `deriveInitials`, `sbAuthFetch`, `sbFetchProfile`, `sbAuditLog`, `applyRoleVisibility`, `doLogin`, `tryRestoreSession`, `activateApp`, `hydrateFromSupabase`, `doLogout`
- **Output file:** `js/auth.js`
- **Load order:** After `sb-core.js`, before app boot call.
- **Risk:** CRITICAL. Auth failure = login loop; wrong session resume = blank app. Test on fresh browser (no sessionStorage) and on existing session.
- **Verification:** (1) Sign out → sign back in works. (2) Reload → session restores. (3) Role-gated nav items hidden/shown correctly.
- **Rollback:** Return all auth functions to inline block.

---

### PACKET 4 — Vendor Data Extraction
- **Target:** `PRODUCT_TAXONOMY`, `vendorProductCats`, `getVPCats`, `setVPCats`, `PREFILL_VENDOR_CATS`, `applyPrefillVendorCats`, `sbLoadParents`, `getVendorParent`, `getSisterVendors`, `sbLoadVendorOverrides`, `sbSaveVendorOverride`, `sbLoadVendorScores`, `sbSaveVendorScore`, `sbSaveScoreState`, `sbLoadChangelog`, `sbAppendChangelog`, all vendor scoring logic
- **Output file:** `js/vendor-data.js`
- **Load order:** After `sb-core.js`.
- **Risk:** MEDIUM. Vendor data constants are referenced by Co-op, Deal Optimizer, Price Book, and vendor scoring UI — all already-external modules that read `PRODUCT_TAXONOMY` and `PREFILL_VENDOR_CATS` as globals.
- **Verification:** Vendor Ranking page loads. Scores persist. Sister brands show. Changelog appends.
- **Rollback:** Return to inline block.

---

### PACKET 5 — Co-op Extraction
- **Target:** `COOP_FUNDS`, `sbLoadCoopFunds`, `sbSaveCoopFund`, `sbDeleteCoopFund`, `sbUpdateCoopField`, `commitCoopCellSelect`, `renderCoopTracker`, `openCoopEdit`, `saveCoopFund`, `deleteCoopFund`
- **Output file:** `js/coop.js`
- **Load order:** After `vendor-data.js`.
- **Risk:** LOW. Co-op is self-contained. Only dependency is `sbFetch` and `toast`.
- **Verification:** Vendor Ranking → Co-op Funds tab renders and saves.
- **Rollback:** Return to inline block.

---

### PACKET 6 — Pipeline Extraction
- **Target:** `computeDealProbability`, `sbLoadPipeline`, `sbSaveDeal`, `sbLogPipelineEvent`, `sbDeleteDeal`, `pipeline`, `renderPipeline`, `openArchive`, `probColor`, `dealHTML`, `openAddDeal`, `saveDeal`, `findDealAnyStage`, `openDeal`, `updDeal`, `delDeal`
- **Output file:** `js/pipeline.js` *(replaces or extends current stub if one exists)*
- **Load order:** After `sb-core.js`.
- **Risk:** MEDIUM. `computeDealProbability` is referenced by Dashboard's Daily Brief. Extraction must not break cross-module read.
- **Verification:** Sales Pipeline page loads. Add/edit/stage-move/delete deal all work. Dashboard forecast tile still computes.
- **Rollback:** Return to inline block.

---

### PACKET 7 — Quotes Extraction
- **Target:** `sbLoadQuotes`, `sbSaveQuote`, `sbDeleteQuote`, `nLI`, `addLI`, `quotes`, `renderLI`, `qFlagRow`, `approveAllRows`, `updatePreview`, `aiParseNotes`, `openTrackCalc`, `parseRunLengths`, `previewTrackCalc`, `addTrackLinesToQuote`, `saveQ`, `deleteQ`, `showSaved`, `exportQuoteCSV`, `printQ`, `calcTrackHardware`, `aiSummary`
- **Output file:** `js/quotes.js` *(replaces stub)*
- **Load order:** After `sb-core.js`.
- **Risk:** MEDIUM. AI proxy calls remain unchanged — just move the `fetch` calls to the new file. `LI` array must initialize as `let` at module scope.
- **Verification:** Quote Generator loads. AI Parse fires and returns. Track Calc works. CSV export. Print PDF.
- **Rollback:** Return to inline block.

---

### PACKET 8 — Dashboard Extraction
- **Target:** `dashboard`, `renderRoleSpecificDashboard`, `computeDailyBrief`
- **Output file:** `js/dashboard.js`
- **Load order:** After all data modules (vendor-data, pipeline, quotes).
- **Risk:** HIGH. Dashboard is a read-aggregator — it reads from CUSTOMERS, INVENTORY, DEALS, QUOTES, COOP_FUNDS, etc. All those globals must be populated before `dashboard()` is called.
- **Verification:** All 5 role variants of the dashboard render. Daily Brief tiles all show correct counts.
- **Rollback:** Return to inline block.

---

### PACKET 9 — Settings + Mgmt Extraction
- **Target:** `settings`, `renderUsersPanel`, `saveUserRole`, `changeMyPassword`, `mgmt`, `renderOwnerOverview`, `sbLoadKPIs`, `computeCurrentKPIValue`, `snapshotAllKPIs`, `renderKPIRegistry`, `sbLoadGoals`, `sbSaveGoal`, `sbDeleteGoal`, `renderGoalsOKR`, `openGoalEdit`, `saveGoal`, `deleteGoal`, `renderTeamActivity`, `loadAuditLog`, `renderSystemPanel`
- **Output file:** `js/settings.js` and `js/mgmt.js`
- **Load order:** After `auth.js` and `sb-core.js`.
- **Risk:** LOW. These pages are owner-only; failure is visible but not app-breaking.
- **Verification:** Settings → Users panel saves role. My Account → Change Password works. Mgmt Dashboard renders all 5 sub-tabs. KPI snapshot writes.
- **Rollback:** Return to inline block.

---

### PACKET 10 — Shell Thinning (Final)
- **Target:** The remaining `<script>` block in index.html after all prior packets are extracted.
- **Expected survivors:** `goTo` router, `PAGE_META`, `toggleSB`, `toggleQA`, app init call, sidebar bell/toast DOM listeners.
- **Target size:** ≤500 lines.
- **Risk:** LOW at this stage — all logic has moved. Risk is only missing a stray function still called inline.
- **Verification:** Full app boot-to-use smoke test across all pages and roles.
- **Rollback:** Git revert to post-Packet-9 state.

---

## ROLLBACK-SAFE BOUNDARIES

A packet boundary is rollback-safe when:

1. The packet's branch has been **merged to `main`** and the merge commit is tagged.
2. A **smoke test** has been logged in SESSION_LOG.md confirming the packet is live.
3. The next packet's branch has **not yet been cut**.

Never cut the next packet branch from an unmerged state. If Packet N is not yet merged, Packet N+1 cannot start.

---

## MERGE-SAFE CHECKPOINTS

After each packet merges, verify:

- [ ] `index.html` diff contains ONLY removals of the extracted functions
- [ ] No function was accidentally duplicated (exists in both inline and external file)
- [ ] Version query string on the new `<script src>` tag incremented
- [ ] No other JS file in `js/` was mutated by this packet

If any of these checks fail, the packet merge is **UNSAFE**. Revert before proceeding.

---

## FREEZE-SAFE BOUNDARIES

A decomposition packet must be **frozen** (abandoned mid-execution) if:

- A hot-bug lands on `main` that touches `index.html` — stop, let the bug fix merge first
- Michael starts a feature build that also modifies `index.html`
- The extracted file references a symbol that is NOT yet extracted (forward dependency violation)

On freeze: commit extracted files as `wip:` prefix, push to branch, update `WORK_IN_PROGRESS.md`, do not merge. Resume is safe after the blocking condition clears.

---

## VERIFICATION DOCTRINE

Every packet must pass these checks before its branch is merged:

| Check | Method |
|---|---|
| No console errors on boot | DevTools console clean on page load |
| Extracted functions reachable | `typeof <fn>` in console returns `'function'` |
| Data loads | Network tab: Supabase REST calls return 200 |
| No visual regression | All pages render at same fidelity as pre-packet |
| Rollback script drafted | Git revert command written in SESSION_LOG before merge |

No packet merges without passing all five checks.
