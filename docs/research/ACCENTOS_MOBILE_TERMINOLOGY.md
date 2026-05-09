# AccentOS Mobile Terminology
> **Status:** Authoritative — one term = one meaning  
> **Date:** 2026-05-08  
> **Authority:** All planning documents defer to definitions here. When a term in another document conflicts with this one, this document wins.

---

## CANONICAL TERMS

### Additive-Only
**Definition:** A code change that only adds new elements (HTML, CSS, JS) without modifying or deleting any existing code path.

In AccentOS mobile context: all Phase 1 and Phase 2 changes are additive-only. The sidebar HTML is never touched. `openModal()` is never modified. `goTo()` receives one appended line only. Rollback = remove the addition.

**Synonyms in corpus:** "pure addition," "net addition" — these mean the same thing.  
**Not the same as:** "non-breaking change" (which may modify existing code without changing behavior).

---

### Bottom Nav / Bottom Tab Navigation
**Definition:** The `<nav id="mobile-bottom-nav">` element containing exactly 5 fixed-position tabs at the bottom of the viewport, visible only on mobile (`max-width: 900px`). Calls `goTo()` identically to sidebar nav items.

**Height:** 60px fixed (see INTERACTION_STANDARDS.md §4.1).  
**Tabs:** Home | Pipeline | Quotes | Vendors | More.  
**Active state:** Managed by a single line appended to `goTo()` — see INDEX.md Architecture Constants.

**Not the same as:** "sidebar," "offcanvas nav," "hamburger menu" (all refer to the existing `.sidebar` element which is preserved alongside the bottom nav).

---

### Bottom Sheet
**Definition:** A panel that slides up from the bottom of the viewport, anchored to the bottom edge, used as a mobile alternative to centered modals. Opened via `openBottomSheet(title, body, foot)` — a new parallel function that does not modify `openModal()`.

**Heights:** Peek (~80px), Mid (50vh), Full (90vh) — see INTERACTION_STANDARDS.md §3.2.  
**Dismiss methods:** Swipe down on drag handle, tap outside scrim, programmatic `closeBottomSheet()`.

**Not the same as:** "modal" (centered overlay), "drawer" (slides from left), "panel" (generic).  
**Coexistence rule:** Desktop always uses `openModal()`. Mobile uses `openBottomSheet()` via `isMobile()` gate. The two never conflict.

---

### Daily Brief
**Definition:** The module that renders when `goTo('dashboard')` is called. The `PAGE_META` key is `'dashboard'`; the displayed title is "Dashboard." In mobile planning documents, "Daily Brief" and "dashboard" refer to the same module.

**GoTo key:** `'dashboard'` (confirmed: index.html line 391, line 631).  
**Mobile role:** Default landing screen on mobile after login (ships with M8).

**Clarification:** The term "Daily Brief" is used in planning documents to emphasize its task-centric nature. In code, it is always `goTo('dashboard')`.

---

### Desktop Regression
**Definition:** Any change introduced by a mobile implementation that degrades functionality or visual correctness for users on desktop (width > 900px). This is the highest-severity failure class.

**Test:** Open `accent-os.pages.dev` in Chrome at 1440px after every implementation session. Sidebar must be visible; bottom nav must not be visible; all modals must be centered overlays; all modules must render.

**Never acceptable.** Desktop regression always triggers immediate rollback regardless of mobile benefit.

---

### Gesture Recovery
**Definition:** The ability for a user to recover from a failed or cancelled gesture without the app entering a broken state. Specifically: a partial swipe that does not complete must snap back to the original state cleanly.

**Applied to:** Bottom sheet swipe-dismiss (snaps back if velocity too low); pull-to-refresh (snaps back if user releases before threshold).

---

### Hydration / Hydrate
**Definition:** The process of loading data from Supabase into AccentOS JavaScript globals after authentication. `hydrateFromSupabase()` (line 674) runs 27 sequential `sbLoad*()` calls. Each module's data is hydrated on login, not on each navigation.

**Not the same as:** "render" (DOM creation from existing globals), "refresh" (re-fetch a single module's data), "load" (generic).

---

### isMobile()
**Definition:** The JavaScript function used to gate mobile-specific behavior at runtime. Canonical implementation:
```js
function isMobile() {
  return window.matchMedia('(max-width: 900px)').matches;
}
```
Uses `matchMedia` (not `window.innerWidth`) because `matchMedia` is evaluated the same way as CSS media queries, is more reliable during window resize, and is consistent with the existing `@media (max-width:900px)` breakpoint.

**Breakpoint:** 900px — matches the existing AccentOS CSS breakpoint exactly.  
**See CONTRADICTIONS.md:** Earlier docs used `window.innerWidth < 900` — that definition is superseded by this one.

---

### Install State
**Definition:** Whether AccentOS has been added to the iPhone home screen and is running in standalone mode (`window.navigator.standalone === true`).

**Three states:**
- **Uninstalled:** User accesses via Safari browser tab. No push notifications possible. URL bar visible.
- **Installed (standalone):** User opened from home screen icon. No URL bar. Push notifications possible. Safe-area CSS active.
- **Installed (outdated):** Home screen icon exists but manifest or icon has changed since install. User must reinstall.

**Detection:** `window.navigator.standalone === true` (iOS-specific).

---

### Mobile Quick Mode
**Definition:** Not currently defined or implemented. This term appeared in one planning reference and has no formal definition. Do not use. If a "quick action" concept is needed, use "Quick Actions" (the existing QA FAB system in AccentOS) or "Command Launcher" (Phase 3 repurpose of QA FAB).

---

### Modal
**Definition:** The existing centered overlay UI component in AccentOS. Opened via `openModal(title, body, foot)` (line 815). Full-screen overlay with centered dialog. Used on desktop. On mobile, selected modals are replaced by bottom sheets via `isMobile()` gate.

**CSS:** `.modal` class (line 152); container `#overlay` (line 507).  
**Not the same as:** "bottom sheet," "drawer," "dialog."  
**Rule:** `openModal()` is never modified. All mobile modal behavior is in the new `openBottomSheet()` function.

---

### Operational Mobile
**Definition:** Mobile UX designed for operational efficiency — not consumer engagement. Characterized by: task-centric layout (what needs doing), rapid action execution (≤3 taps), high information density, one-handed operation, interrupt resilience, and survivability under network degradation.

**Antonym in planning:** "consumer app UX" — characterized by whitespace, animations, aesthetic novelty, engagement metrics. AccentOS explicitly avoids this.

---

### Rollback
**Definition:** A documented procedure to restore AccentOS to a known-good state after a failed deployment. All rollbacks in the mobile plan are non-destructive — they use `git revert` (not `git reset --hard`) or CSS-class disabling.

**Rollback speed tiers:**
- **Instantaneous (< 1 min):** CSS class toggle (no deploy needed)
- **Fast (< 5 min):** Remove the addition, push, Cloudflare deploys in ~15s
- **Moderate (5–15 min):** Multi-file revert; SW cache recovery
- **Slow (> 15 min):** SW corruption requiring user-side cache clear

Full procedures: ACCENTOS_MOBILE_ROLLBACK_PLAYBOOK.md.

---

### Safe-Area / Safe-Area Inset
**Definition:** The CSS environment variables (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`, etc.) that define the screen regions obscured by the iPhone notch and home indicator. Only active when `viewport-fit=cover` is in the viewport meta tag.

**iPhone 13 Pro Max values (portrait):** Top ~47px, Bottom ~34px, Left/Right 0px.  
**Prerequisite:** `viewport-fit=cover` must be in the meta viewport tag (M1). Without it, all `env(safe-area-inset-*)` values evaluate to `0px` silently.  
**Desktop behavior:** Evaluates to `0px` — no desktop layout effect.

---

### Shell / App Shell
**Definition:** The static HTML/CSS/JS that renders the AccentOS interface structure (login screen, sidebar, topbar, content area) before any Supabase data arrives. Corresponds approximately to `index.html` itself.

**Stale Shell:** A cached version of the shell that is older than the current deployed version. Happens when a service worker serves outdated assets after a new deploy. Prevented by cache version incrementing.

**Shell-v2:** A hypothetical future refactored shell — not currently planned. This term appears in planning as a reference to a possible future architectural split. Do not implement; do not plan for it.

---

### Stale Cache
**Definition:** Condition where a service worker is serving cached assets (JS, HTML) that are older than the current deployed version. Users on stale cache run old code that may be missing bug fixes or new features.

**Detection:** Michael reports a deployed change is not visible on his iPhone.  
**Resolution:** Increment `CACHE_VERSION` constant in `sw.js` and deploy.  
**Full recovery:** See ACCENTOS_MOBILE_ROLLBACK_PLAYBOOK.md §1.

---

### Validation Gate / PASS Gate
**Definition:** A defined set of criteria that must all be true before a change is permitted to move from prototype to production injection. Binary: all criteria met = PASS; any criterion failed = FAIL (do not ship).

**M8 PASS GATE:** Defined in ACCENTOS_MOBILE_PROTOTYPE_SPEC.md. Required before bottom nav touches `index.html`.  
**M9 PASS GATE:** Defined in ACCENTOS_MOBILE_PROTOTYPE_SPEC.md. Required before bottom sheets touch `index.html`.  
**Full consolidated gate list:** ACCENTOS_MOBILE_GATES.md.
