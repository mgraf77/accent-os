# AccentOS Mobile Contradiction Audit
> **Status:** Specification only — identify and resolve, do not implement  
> **Date:** 2026-05-08  
> **Method:** Cross-reference audit of all 10 planning documents against each other and against actual index.html code  
> **Resolution format:** Each contradiction names the conflicting sources, explains the conflict, and states the canonical resolution

---

## CONTRADICTION SEVERITY LEVELS

- **CRITICAL:** Will cause runtime failure if the wrong version is implemented
- **HIGH:** Will cause behavioral inconsistency or regression if not resolved
- **MEDIUM:** Will cause confusion or maintenance drift over time
- **LOW:** Cosmetic or terminology-only; implementation risk is minimal

---

## C1 — isMobile() Implementation Definition

**Severity: HIGH**

### Conflict
Two documents define `isMobile()` using `window.innerWidth < 900`:
- ACCENTOS_MOBILE_ROLLOUT_STRATEGY.md (line 30): `return window.innerWidth < 900;`
- ACCENTOS_MOBILE_IMPLEMENTATION_PLAN.md (line 263): `` `isMobile()` = `window.innerWidth < 900` ``

One document recommends a different implementation:
- ACCENTOS_MOBILE_PHASE_A_READINESS.md (M8 section): "using `window.matchMedia('(max-width: 900px)').matches` (more reliable)"

### Why It Matters
`window.innerWidth` returns the current pixel width at the moment of call. If a desktop user resizes their window below 900px during a session, `isMobile()` flips to `true` mid-session, potentially triggering bottom sheets and mobile nav where they don't belong. `window.matchMedia('(max-width: 900px)').matches` is evaluated identically to how CSS media queries evaluate the breakpoint — it is the more consistent choice.

### Resolution
**Canonical: `window.matchMedia('(max-width: 900px)').matches`**

This is the only implementation that should appear in production code. All references to `window.innerWidth < 900` in planning docs are superseded.

Source authority: ACCENTOS_MOBILE_TERMINOLOGY.md §isMobile().

---

## C2 — Pull-to-Refresh Scroll Detection Target

**Severity: CRITICAL**

### Conflict
ACCENTOS_MOBILE_INTERACTION_STANDARDS.md (§8.1) and ACCENTOS_MOBILE_IMPLEMENTATION_PLAN.md (M11) both specify the pull-to-refresh trigger condition as:
> `scrollY === 0` (referring to `window.scrollY`)

However, the actual AccentOS scroll architecture uses a **CSS-overflow scroll container**, not window scroll. From index.html:
- Line 84: `.content{flex:1;overflow-y:auto;padding:28px;}`
- Line 444: `<div class="content" id="pg-content"></div>`

The `.content` / `#pg-content` element has `overflow-y:auto` and is the scroll container. The `window` (document) does not scroll — `window.scrollY` is always `0` regardless of how far the user has scrolled within the module. Using `window.scrollY === 0` as the pull-to-refresh trigger would make the gesture fire at any scroll position, not just the top.

### Why It Matters
If `window.scrollY === 0` is used: pull-to-refresh triggers while Michael is scrolled halfway down the vendor list, discarding his scroll position. This is severe enough to make pull-to-refresh unusable and potentially alarming (data disappears mid-scroll).

### Resolution
**Canonical scroll check: `document.querySelector('.content').scrollTop === 0`**

Or equivalently: `$('pg-content').scrollTop === 0` where `$` is AccentOS's `document.getElementById` shorthand.

Full corrected trigger condition:
```
All of the following must be true:
1. document.querySelector('.content').scrollTop === 0
2. Touch drag distance > 80px downward
3. deltaY > deltaX * 1.5 (vertical dominance)
4. Last refresh was > 3 seconds ago
```

Source authority: ACCENTOS_MOBILE_CONTRADICTIONS.md (this document); index.html line 84.

---

## C3 — Bottom Nav Height: Three Different Values

**Severity: MEDIUM**

### Conflict
Bottom nav height is referenced with three different values across the corpus:

- ACCENTOS_MOBILE_INTERACTION_STANDARDS.md (§4.1): "Minimum height: **60px**"
- ACCENTOS_MOBILE_IMPLEMENTATION_PLAN.md (M7, toast): `bottom: calc(72px + 16px + env(safe-area-inset-bottom))` — implies nav height of 72px
- ACCENTOS_MOBILE_IMPLEMENTATION_PLAN.md (M7, alternative): `bottom: calc(80px + env(safe-area-inset-bottom))` — implies nav height of 80px
- ACCENTOS_MOBILE_ROLLOUT_STRATEGY.md (§8 rollout metrics): references "bottom nav height" without specifying

### Why It Matters
Toast positioning (M7) depends on knowing the exact nav height to calculate `bottom: calc([nav-height] + 16px + env(safe-area-inset-bottom))`. An incorrect value leaves toasts partially hidden or too high.

### Resolution
**Canonical bottom nav height: 60px fixed**

The 60px specification from INTERACTION_STANDARDS.md is the authoritative value. It derives from: icon 24px + label 10px + top/bottom padding 13px each = 60px.

Correct toast positioning formula (M7):
```css
#toasts {
  bottom: calc(60px + 16px + env(safe-area-inset-bottom));
}
```

The 72px and 80px values in IMPLEMENTATION_PLAN.md are superseded.

Source authority: ACCENTOS_MOBILE_TERMINOLOGY.md §Bottom Nav; ACCENTOS_MOBILE_INTERACTION_STANDARDS.md §4.1.

---

## C4 — "Daily Brief" vs "dashboard" Naming

**Severity: LOW — but creates implementation confusion**

### Conflict
Planning documents use "Daily Brief" and "dashboard" interchangeably across 10 documents without explicitly stating they are the same thing. Some documents use "Daily Brief" exclusively, others use "dashboard," one uses "Daily Brief / Dashboard" (IMPLEMENTATION_PLAN.md line 220).

The actual goTo() key in index.html is `'dashboard'`. The PAGE_META title is `"Dashboard"`. The planning corpus refers to this module as "Daily Brief" throughout because that better describes its task-centric role.

### Why It Matters
An implementation session reading "make the Daily Brief the mobile landing screen" that searches index.html for `'dailybrief'` or `'daily-brief'` will find nothing. The correct code is `goTo('dashboard')`.

### Resolution
**Canonical mapping:** "Daily Brief" in planning documents = `goTo('dashboard')` in code.

There is no `'dailybrief'` key. There is no need to add one. The existing `'dashboard'` key is correct and should not be renamed.

Implementation note for M6: The mobile landing screen is set by calling `goTo('dashboard')` conditionally on `isMobile()` after login. This is already the login flow (`goTo('dashboard')` at index.html line 631) — M6 may be a no-op if the dashboard is already the default landing for all users.

Source authority: ACCENTOS_MOBILE_TERMINOLOGY.md §Daily Brief; index.html line 391, line 631.

---

## C5 — Prototype File Location Ambiguity

**Severity: LOW**

### Conflict
ACCENTOS_MOBILE_PROTOTYPE_SPEC.md specifies:
> `/home/user/accent-os/prototypes/` (new directory, not served by Cloudflare)

This is a Linux filesystem absolute path (the Codespace environment). The actual repository path is `prototypes/` relative to the repo root. The spec also states they are "never deployed to Cloudflare Pages" but does not specify a `.cfignore` or `_routes.json` exclusion.

### Why It Matters
Cloudflare Pages deploys the entire repository by default. If `prototypes/*.html` files are committed without exclusion, they will be publicly accessible at `accent-os.pages.dev/prototypes/mobile-nav-proto.html`. This is not catastrophic (they contain no credentials or sensitive data) but is untidy and potentially confusing.

### Resolution
Two options:

**Option A (simpler):** Do not commit prototype files to the repo. Build them locally in the Codespace, test, then delete before committing the implementation.

**Option B (preferred for reference):** Commit to `prototypes/` directory and add a `_redirects` or `_headers` Cloudflare configuration to block access, OR add to `.gitignore` with a note that they exist locally for session reference.

**Canonical decision:** Option A for the first prototype session. If the prototype patterns become useful templates for future mobile work, revisit Option B.

---

## C6 — Toast Position: Top vs Bottom on Mobile

**Severity: MEDIUM**

### Conflict
ACCENTOS_MOBILE_IMPLEMENTATION_PLAN.md (M7) proposes two mutually exclusive options for toast positioning on mobile:
> "On mobile, shift toasts to `top: env(safe-area-inset-top, 16px) + 16px` OR keep bottom but account for bottom nav height"

These are not equivalent. Top-positioned toasts do not conflict with the bottom nav but require significantly different CSS. Bottom-positioned toasts (above the nav) are more consistent with the existing desktop behavior (fixed bottom-right). No decision was made between these options.

### Why It Matters
One must be chosen before M7 ships. Choosing top position requires different CSS and visual testing. Choosing bottom position (above nav) requires knowing the nav height (now canonicalized at 60px — see C3).

### Resolution
**Canonical: Keep toasts at bottom, positioned above the bottom nav.**

Reason: Toasts in AccentOS are already bottom-positioned on desktop. Moving them to the top on mobile introduces a visual inconsistency that is noticeable when switching between devices. The bottom-above-nav position is consistent and the formula is now unambiguous (C3 resolved).

Canonical CSS for M7:
```css
@media (max-width: 900px) {
  #toasts {
    bottom: calc(60px + 16px + env(safe-area-inset-bottom));
    right: 12px;
    left: 12px;
  }
}
```

---

## C7 — Service Worker Scope Wording

**Severity: LOW**

### Conflict
ACCENTOS_MOBILE_IMPLEMENTATION_PLAN.md (M10) states:
> "Keep SW registered scope minimal — `/` only, not `/*`"

This phrasing is technically inaccurate. In the Service Worker API, a scope of `/` means the SW controls all requests whose URL starts with `/` — which is everything under the origin. The scope `/*` is not a valid notation. The distinction the document is trying to make is: register the SW at the root scope (controlling all paths) vs. a subdirectory scope (e.g., `/app/`). For AccentOS served from root, `/` is correct and there is no narrowing needed.

### Resolution
**Canonical:** Register the service worker with scope `'/'` (the default when `navigator.serviceWorker.register('/sw.js')` is called from the root — default scope is the SW script's directory). No special scope configuration is needed. The confusing `/*` language is retired.

---

## C8 — Visibilitychange Refresh Threshold: One Source Only

**Severity: LOW**

### Conflict
ACCENTOS_MOBILE_INTERACTION_STANDARDS.md (§9.1) specifies:
> "if time since last data load > 5 minutes: silently refresh current module data"

This 5-minute threshold appears in only one document. ACCENTOS_MOBILE_ROLLOUT_STRATEGY.md and ACCENTOS_MOBILE_IMPLEMENTATION_PLAN.md describe the `visibilitychange` pattern without specifying a threshold.

### Why It Matters
Without a canonical threshold, an implementation session might choose a different value (30 seconds would cause constant refreshes; 60 minutes would make the feature useless). The threshold should be declared once.

### Resolution
**Canonical threshold: 5 minutes (300,000ms)**

Implementation: `Date.now() - parseInt(localStorage.getItem('lastHydrate') || '0') > 300000`

Track last hydration: `localStorage.setItem('lastHydrate', Date.now())` at end of `hydrateFromSupabase()` and after each module-specific refresh.

---

## SUMMARY TABLE

| ID | Conflict | Severity | Resolution authority |
|---|---|---|---|
| C1 | isMobile() definition: innerWidth vs matchMedia | HIGH | TERMINOLOGY.md |
| C2 | Pull-to-refresh: window.scrollY vs .content.scrollTop | CRITICAL | This document + INDEX.md |
| C3 | Bottom nav height: 60px vs 72px vs 80px | MEDIUM | INTERACTION_STANDARDS.md |
| C4 | "Daily Brief" vs `'dashboard'` key | LOW | TERMINOLOGY.md + INDEX.md |
| C5 | Prototype file location and deployment exclusion | LOW | Option A (don't commit) |
| C6 | Toast position: top vs bottom-above-nav | MEDIUM | This document |
| C7 | Service worker scope wording (`/` vs `/*`) | LOW | Standard SW API behavior |
| C8 | visibilitychange refresh threshold (5 min) | LOW | INTERACTION_STANDARDS.md |

---

## IMPLEMENTATION NOTICE

All contradictions in this document are resolved in planning only. No code has been written. The resolution for each contradiction must be applied when the relevant change is implemented:

- C1 and C2 must be applied in Session C (M11 implementation)
- C3 and C6 must be applied in Session B (M7 ships with M8)
- C4 must be noted before M6 implementation
- C5 must be addressed before prototype files are created
- C7 and C8 must be applied in Session D (SW implementation)
