# DECOMPOSITION PACKET LIBRARY
> AccentOS — Reusable Extraction Packet Templates  
> Status: PLANNING ONLY — no implementation authorized from this document  
> Last updated: 2026-05-10

---

## WHAT THIS FILE IS

A library of reusable packet structure templates. Each template defines the standard shape of a decomposition operation. Operators fill in the [BRACKETS] when instantiating a real packet from a template.

These templates encode the lessons from the 37 modules already successfully extracted (`js/customers.js`, `js/pipeline_analytics.js`, etc.) and the patterns learned from those extractions.

---

## PACKET TEMPLATE: CSS EXTRACTION

```
PACKET: CSS-[N]
SOURCE:        index.html lines [START]–[END]
OUTPUT:        css/[filename].css
LOAD:          <link rel="stylesheet" href="css/[filename].css?v=[version]">
               placed at: same position as the extracted <style> block
```

**Prerequisites:**
- No other open branch touches index.html
- `css/` directory exists at repo root
- Version string decided before branch cut

**Forbidden zones:**
- Do not modify any JavaScript during this packet
- Do not reorder CSS rules during extraction — copy verbatim
- Do not add vendor prefixes, minify, or rename any class names
- Do not touch any HTML outside the single `<style>…</style>` replacement

**Verification steps:**
1. `diff` the extracted CSS against the original `<style>` block — must be byte-for-byte identical (whitespace allowed to vary)
2. Load app in browser — no visible layout or color change on any page
3. DevTools → Network → confirm `[filename].css` returns 200 with correct MIME type
4. DevTools → Elements → confirm no inline `<style>` block remains in `<head>`

**Rollback path:**
```
git revert [merge-commit]
# OR manually:
# 1. Delete css/[filename].css
# 2. Replace <link> with original <style>…</style> block
# 3. Commit as "rollback(css): revert CSS extraction"
```

**Escalation conditions:**
- CSS file fails to load (404, wrong MIME type) → stop, do not proceed, diagnose before retry
- Any page shows layout break → stop, revert immediately, do not "fix forward"

**Freeze conditions:**
- A feature branch opens that modifies styling in index.html → freeze this packet, wait for that branch to merge first

**Next-packet generation:**
After CSS packet merges and smoke test passes → cut Utils Extraction branch.

---

## PACKET TEMPLATE: UTILITY EXTRACTION

```
PACKET: UTIL-[N]
SOURCE:        index.html <script> block — utility function group
TARGET:        js/[utils-filename].js
LOAD:          <script src="js/[utils-filename].js?v=[version]"></script>
               placed at: FIRST script tag in <head>, before all other scripts
```

**Prerequisites:**
- CSS extraction packet already merged to main
- Target functions have NO mutual dependencies on unextracted module code
- All target functions operate only on DOM primitives and their own arguments

**Forbidden zones:**
- Do not extract functions that reference `CU` (current user global) — those belong in auth.js
- Do not extract functions that call `sbFetch` — those belong in sb-core.js or feature modules
- Do not add `export`/`import` — AccentOS is a non-module global-script architecture
- Do not wrap in IIFE — all functions must attach to `window` (implicit global scope)
- Do not rename any function — 37 external modules call these by exact name

**Verification steps:**
1. `typeof esc === 'function'` → true in console before any module hydration
2. `typeof toast === 'function'` → true
3. `typeof openModal === 'function'` → true
4. `typeof $ === 'function'` → true
5. Call `toast('test')` in console → toast renders in lower-right corner
6. Open any modal-triggering page action → modal opens without error

**Rollback path:**
```
git revert [merge-commit]
# OR manually:
# 1. Copy all extracted functions back into index.html inline <script> block
#    at their original position (before any module-specific code)
# 2. Remove <script src="js/[utils-filename].js"> tag
# 3. Delete js/[utils-filename].js
# 4. Commit as "rollback(utils): revert utility extraction"
```

**Escalation conditions:**
- Any of the 37 existing modules throws ReferenceError on boot → immediate revert, do not debug forward
- `typeof esc` returns `'undefined'` → load order is wrong; revert and fix `<script>` tag placement

**Freeze conditions:**
- Any open PR that adds a new utility function to the inline block → freeze, let it merge first
- Hot bug that calls a newly-named utility → freeze, resolve naming before extraction

**Next-packet generation:**
After utils merges and 5 verification checks pass → cut SB Core branch.

---

## PACKET TEMPLATE: SUPABASE CORE EXTRACTION

```
PACKET: SB-CORE-[N]
SOURCE:        index.html — SUPABASE_URL, SUPABASE_ANON_KEY, sbKey, sbConfigured,
               sbFetch, sbRealtime + any sbAuthFetch if bundled here
OUTPUT:        js/sb-core.js
LOAD:          <script src="js/sb-core.js?v=[version]"></script>
               placed at: after utils.js, before auth.js and all feature scripts
```

**Prerequisites:**
- Utils packet merged to main
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` constants confirmed as non-secret (these are public anon keys — safe for client-side code)

**Forbidden zones:**
- Do not move `CU` (current user object) to this file — it lives in auth.js
- Do not move any page-rendering functions here
- Do not hardcode API keys beyond what already exists in the inline block
- Do not add retry logic or error handling not present in the original

**Verification steps:**
1. `typeof sbFetch === 'function'` → true before any page renders
2. `typeof sbConfigured === 'function'` → true
3. Network tab: open Customers page → Supabase REST call returns 200 (not 401 or CORS error)
4. Network tab: open Vendor Ranking → scores load from Supabase
5. Console: no "sbFetch is not defined" errors

**Rollback path:**
```
git revert [merge-commit]
# If manual: return all declarations to inline <script> block;
#            remove <script src="js/sb-core.js"> tag
```

**Escalation conditions:**
- Any page fails to load data after extraction → network issue with script load; revert, diagnose MIME or path error
- `sbRealtime` initialization fails → Internal Meetings realtime will break; revert

**Freeze conditions:**
- Supabase URL or anon key rotation in progress → freeze; complete rotation before extraction

**Next-packet generation:**
After sb-core merges → cut Auth Extraction branch.

---

## PACKET TEMPLATE: AUTH EXTRACTION

```
PACKET: AUTH-[N]
SOURCE:        index.html — auth function group
               (jwtKey, setJwt, deriveInitials, sbAuthFetch, sbFetchProfile,
                sbAuditLog, applyRoleVisibility, doLogin, tryRestoreSession,
                activateApp, hydrateFromSupabase, doLogout)
OUTPUT:        js/auth.js
LOAD:          <script src="js/auth.js?v=[version]"></script>
               placed at: after sb-core.js, before any page module scripts
```

**Prerequisites:**
- SB Core packet merged and confirmed stable (data loads working)
- No open feature branch that modifies login flow, role system, or session handling

**Forbidden zones:**
- Do not extract `applyRoleVisibility` in isolation — it must move together with `doLogin` and `activateApp` or role gating breaks
- Do not modify the function signatures during extraction
- Do not add loading states, spinners, or UX polish — extract verbatim only
- The `CU` global must remain `let CU = null` declared at the TOP of `auth.js` — it is read by every module that checks `CU.role`

**Verification steps:**
1. Sign out → sign back in → lands on Dashboard → `CU.role` is correct
2. Reload browser → session restores without login screen
3. Warehouse role: sidebar hides Owner-only items (verify `data-roles` gating)
4. `sbAuditLog` call fires on login → check Supabase `audit_log` table for new row
5. `doLogout()` in console → clears session, shows login screen

**Rollback path:**
```
git revert [merge-commit]
# If manual:
# 1. Return all auth functions to inline block
# 2. Re-declare CU = null at top of inline block
# 3. Remove <script src="js/auth.js"> tag
```

**Escalation conditions:**
- Login fails with 401 → `sbAuthFetch` call order wrong; immediate revert
- Session fails to restore after reload → `tryRestoreSession` call order wrong; immediate revert
- Role visibility broken (all items hidden, or wrong items shown) → `applyRoleVisibility` not being called at the right time; immediate revert

**Freeze conditions:**
- Any Supabase Auth schema change (user_profiles RLS update, new role added) → freeze auth extraction until schema stabilizes
- M01 or M02 migration pending → freeze

**Next-packet generation:**
After auth merges with all 5 verification checks passing → cut Vendor Data branch.

---

## PACKET TEMPLATE: TEMPLATE / RENDER EXTRACTION

```
PACKET: RENDER-[N]
SOURCE:        index.html — page render function group
               (e.g., renderPipeline, renderCoopTracker, dashboard, mgmt, etc.)
OUTPUT:        js/[page-name].js
LOAD:          <script src="js/[page-name].js?v=[version]"></script>
               placed at: after all data dependency scripts
```

**Prerequisites:**
- All data functions this renderer calls (sbLoad*, CONSTANTS) already extracted or still in inline block
- Load order chart drawn before branch cut — must show every symbol this renderer needs and where it will come from

**Forbidden zones:**
- Do not extract a renderer without also extracting its save/delete counterparts — partial extraction creates split-brain state
- Do not use `document.addEventListener('DOMContentLoaded')` wrappers — app uses lazy `goTo()` initialization
- Do not move the `PAGE_META` entries for this page — `PAGE_META` is router-controlled and stays in index.html until Shell Thinning (Packet 10)

**Verification steps:**
1. Navigate to the page in the app
2. All data renders (no blank cards, no empty lists where data exists)
3. Add/edit/delete actions all complete without console error
4. Page re-navigates correctly (goTo('page') → same result)

**Rollback path:**
Return render functions to inline block; remove `<script src>` tag.

**Escalation conditions:**
- Any render function references a symbol that hasn't been extracted yet and isn't in the inline block → forward dependency violation; stop, resequence packets

**Freeze conditions:**
- A feature is being actively developed on this page → freeze render extraction until feature ships

**Next-packet generation:**
After render packet merges → update dependency chart; cut next render or data extraction packet.

---

## PACKET TEMPLATE: SIDEBAR EXTRACTION

```
PACKET: SIDEBAR-[N]
SOURCE:        index.html — toggleSB, toggleQA, qaGo, applyRoleVisibility sidebar logic
NOTE:          The sidebar HTML is static in index.html and does NOT get extracted.
               Only the JS controlling it moves.
OUTPUT:        js/sidebar.js (or bundled into utils.js)
```

**Prerequisites:**
- Auth extraction complete (sidebar behavior depends on `CU.role`)
- Utils extraction complete

**Forbidden zones:**
- Do not extract the `<nav class="sidebar">` HTML — it is structurally part of index.html shell
- Do not add dynamic sidebar rendering — sidebar is static HTML with `data-roles` gating
- `applyRoleVisibility` must NOT be extracted here if it was already extracted in auth.js

**Verification steps:**
1. Sidebar collapse/expand toggle works on desktop
2. Mobile backdrop appears on narrow viewport
3. Role-gated items show/hide correctly for each role
4. Quick Actions FAB opens and routes correctly

**Rollback path:**
Return JS functions to inline block; remove script tag.

**Escalation conditions:**
- Mobile sidebar stops responding → event listener attachment timing issue; revert

---

## PACKET TEMPLATE: MODULE SPLITTING

```
PACKET: SPLIT-[N]
USE CASE:      An existing external module in js/ has grown > 500 lines and needs
               to be split into sub-modules.
SOURCE:        js/[large-module].js
OUTPUTS:       js/[module]-data.js    (persistence layer)
               js/[module]-render.js  (render functions)
               js/[module]-core.js    (shared constants/helpers)
```

**Prerequisites:**
- Parent module has been stable (no changes) for ≥2 weeks
- Clear seam exists between data functions and render functions (no entanglement)

**Forbidden zones:**
- Do not split a module while a feature is in progress on it
- Do not break function names — all splits must preserve the exact same exported symbol names
- Do not add module system (import/export) during splitting — global scope is the contract

**Verification steps:**
1. Page that uses the module renders identically before and after
2. All CRUD operations on that page work
3. No console errors on any page that cross-reads from this module

**Rollback path:**
Revert to single large module file; update `<script src>` to point back.

---

## PACKET TEMPLATE: SHELL UTILITY ISOLATION

```
PACKET: SHELL-[N]
PURPOSE:       Final pass — what remains in index.html after all extractions.
               Reduce to bootstrap + router only.
TARGET SURVIVORS (must stay):
  - goTo() router function and PAGE_META object
  - toggleSB(), toggleQA() — tied to inline HTML onclick attributes
  - App init call: tryRestoreSession()
  - Bell icon / toast container DOM setup
TARGET SIZE:   ≤500 lines in the inline <script> block
```

**Prerequisites:**
- ALL prior packets (0–9) merged and confirmed stable
- No open branches modifying index.html

**Forbidden zones:**
- Do not remove `goTo()` or `PAGE_META` — they are the routing contract used by all 37+ external modules
- Do not rename the router — all onclick handlers in the HTML reference `goTo('page')` by name
- Do not collapse the `<script>` block to zero lines — bootstrapping logic must remain

**Verification steps:**
1. Full app smoke test: navigate to every page in the sidebar
2. All modal open/close operations work
3. Toast system works
4. Session restore works on reload
5. `index.html` line count ≤ 700 total (target after full extraction)

**Rollback path:**
Git revert to post-Packet-9 state.

---

## PACKET ANTI-PATTERNS (NEVER DO)

| Anti-pattern | Why it's fatal |
|---|---|
| Extract and rename a function | Breaks all 37 external modules that call it by name |
| Extract half a module (renderer without data layer) | Creates split-brain state — save works but render doesn't, or vice versa |
| Cut next packet branch before current one merges | Guarantees merge conflict on index.html |
| Add `import`/`export` statements | AccentOS is a global-script app; module syntax breaks in non-module `<script>` contexts |
| "Fix forward" after a regression | Never debug a broken extraction into stability — revert and re-extract clean |
| Minify or reformat during extraction | Diffs become unreadable; hard to verify extraction was verbatim |
| Extract `CU` global to a different file than auth.js | Every module reads `CU.role` — the declaration must be in one place only |
