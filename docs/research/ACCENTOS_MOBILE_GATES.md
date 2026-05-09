# AccentOS Mobile Validation Gates
> **Status:** Authoritative consolidated checklist  
> **Date:** 2026-05-08  
> **Format:** Rapid implementation validation — use this during execution sessions  
> **Authority:** Consolidates gate criteria from PROTOTYPE_SPEC, ROLLOUT_STRATEGY, PERFORMANCE_BUDGET, IMPLEMENTATION_PLAN

---

## HOW TO USE THIS DOCUMENT

This document contains all validation gates for AccentOS mobile implementation. During any implementation session:

1. Find the gate for your current phase
2. Check every item before calling the session done
3. If any item fails: stop, rollback, investigate — do not move to the next gate

Gates are cumulative — Gate 2 requires Gate 1 to have already passed.

---

## GATE 0 — PRE-SESSION A PREREQUISITE

Complete before any implementation session begins.

- [ ] `main` branch is current (`git pull origin main`, no uncommitted changes)
- [ ] `accent-os.pages.dev` loads correctly in Safari on iPhone right now (baseline)
- [ ] `accent-os.pages.dev` loads correctly in Chrome at 1440px right now (baseline)
- [ ] All planning docs exist in `docs/research/` (`ls docs/research/` shows 15 files)
- [ ] Script defer audit completed: no inline `<script>` blocks in index.html body reference deferred module globals unsafely

---

## GATE 1 — SESSION A COMPLETE

All Phase 1 (M1, M2, M3, M4, M5, M13) shipped and validated.

### Deployment check (30 seconds):
- [ ] `accent-os.pages.dev/manifest.json` returns valid JSON (open in browser)
- [ ] `manifest.json` contains `"display": "standalone"` and `icons` array

### Desktop regression check (60 seconds, non-negotiable):
- [ ] Open `accent-os.pages.dev` in Chrome at 1440px
- [ ] Sidebar is visible with all nav items
- [ ] Navigate to Dashboard, Pipeline, Vendors — all render correctly
- [ ] No bottom nav bar visible on desktop
- [ ] No layout shifts or broken elements

### Mobile install check (real iPhone, Safari):
- [ ] Open `accent-os.pages.dev` in Safari
- [ ] Tap Share → "Add to Home Screen" option is visible
- [ ] Add to home screen; open from icon
- [ ] App opens without Safari URL bar (standalone mode confirmed)
- [ ] No content hidden under notch (header below top notch area)
- [ ] No content hidden under home indicator (bottom content above home bar)
- [ ] Login works; Dashboard renders

### Performance check (informational):
- [ ] Page FCP in Safari is visibly faster than before defer optimization (subjective OK)
- [ ] No console errors in Safari DevTools after page load

**GATE 1 PASS → Session A complete. Session B may begin when ready.**

---

## GATE 2 — M8 PROTOTYPE PASS (Required before bottom nav touches index.html)

All 20 tests from PROTOTYPE_SPEC.md A-series must pass. Quick reference:

### Layout and structure (A1–A6):
- [ ] A1: Bottom nav visible in Safari browser tab, correct height
- [ ] A2: Bottom nav correct in standalone mode, home indicator not obscured
- [ ] A3: Content not under notch in standalone mode
- [ ] A4: Landscape orientation: nav visible, no horizontal scrollbar
- [ ] A5: Desktop Chrome 1440px: bottom nav NOT visible
- [ ] A6: Desktop Chrome at exactly 900px: boundary behavior correct

### Interaction (A7–A12):
- [ ] A7: All 5 tabs tappable one-handed, right thumb, no grip shift required
- [ ] A8: Tap active tab again: no crash
- [ ] A9: Rapid tap (3 taps < 1 second): active state correct
- [ ] A10: "More" tap: module list appears
- [ ] A11: Dismiss "More" by outside tap: works
- [ ] A12: Swipe up from bottom: iOS home gesture activates (not captured by app)

### Active state (A13–A16):
- [ ] A13: Tap "Pipeline": pipeline tab shows active
- [ ] A14: Programmatic `goTo('pipeline')`: pipeline tab active state updates
- [ ] A15: Navigate to secondary module via More: correct tab state
- [ ] A16: Return from secondary module: prior tab state restored

### Sizing (A17–A20):
- [ ] A17: Each tab height ≥ 44px (measure in DevTools)
- [ ] A18: Each tab width ≥ 44px
- [ ] A19: iOS "Large" text: layout not broken
- [ ] A20: iOS "Extra Large" text: acceptable degradation

### goTo() integration:
- [ ] The `.bn-item[data-page]` active-state line added to `goTo()` works without breaking existing `.ni` active state

**ALL A-SERIES TESTS PASS → M8 cleared for index.html injection.**

---

## GATE 3 — SESSION B COMPLETE

M8 (bottom nav), M6 (mobile landing), M7 (toast), M14 (will-change) shipped to index.html.

### Desktop regression check (60 seconds, non-negotiable):
- [ ] Sidebar visible at 1440px
- [ ] No bottom nav visible at 1440px
- [ ] All 5 quick-navigation checks pass: Dashboard, Pipeline, Quotes, Vendors, Settings
- [ ] Centered modals still work on desktop (open Deal edit or Vendor score)

### Mobile navigation check (real iPhone):
- [ ] All 5 bottom tabs tap correctly
- [ ] "More" tab opens offcanvas sidebar with full module list
- [ ] Login → lands on Daily Brief (dashboard) automatically on mobile
- [ ] Toast appears above bottom nav (not hidden behind it)
- [ ] Active tab indicator correct after `goTo()` calls

### Active state integrity check:
- [ ] Navigate away via "More" sidebar → return via bottom tab → correct module renders
- [ ] Sidebar `.ni.active` state and bottom nav `.bn-item.active` state stay synchronized

**GATE 3 PASS → Session B complete. Session C may begin when ready.**

---

## GATE 4 — M9 PROTOTYPE PASS (Required before bottom sheets touch index.html)

All 24 tests from PROTOTYPE_SPEC.md B-series must pass. Quick reference:

### Layout and animation (B1–B5):
- [ ] B1: Sheet slides up smoothly, no jank
- [ ] B2: Full-height sheet: top below notch, bottom has safe-area padding
- [ ] B3: Mid-height sheet: correct, scrim visible
- [ ] B4: Desktop Chrome: sheet NOT visible; centered modal appears instead
- [ ] B5: Landscape orientation: sheet adapts correctly

### Keyboard interaction — MOST CRITICAL (B6–B11):
- [ ] B6: Mid-height sheet + keyboard: focused input visible above keyboard
- [ ] B7: Full-height sheet + keyboard + middle input: input visible
- [ ] B8: Full-height sheet + keyboard + last input in long form: accessible
- [ ] B9: Focus shift between inputs with keyboard open: smooth
- [ ] B10: Dismiss keyboard then re-tap: smooth re-appearance
- [ ] B11: iOS Back with keyboard open: keyboard dismisses, sheet stays

### Dismissal (B12–B17):
- [ ] B12: Swipe down on drag handle: sheet dismisses
- [ ] B13: Fast swipe down: sheet dismisses (not snap-back)
- [ ] B14: Partial swipe then up: sheet snaps back open
- [ ] B15: Tap scrim: sheet dismisses
- [ ] B16: Tap inside sheet content: sheet does NOT dismiss
- [ ] B17: Swipe up inside sheet (scroll): sheet does NOT dismiss

### Content and scroll (B18–B20):
- [ ] B18: Long form scrolls independently inside sheet
- [ ] B19: Scroll to bottom then swipe: does not dismiss unexpectedly
- [ ] B20: Short content: proportionate empty space

### API compatibility (B21–B24):
- [ ] B21: `openBottomSheet('Title', body, footer)` renders correctly
- [ ] B22: `openModal()` still works correctly — desktop behavior unchanged
- [ ] B23: `closeBottomSheet()` programmatic dismiss works
- [ ] B24: No nested sheet crashes or visual corruption

### Form simulations:
- [ ] Deal edit form: all fields reachable with keyboard open
- [ ] Vendor score form: numeric keyboard on score field; input visible
- [ ] Quote form basic: first fields reachable; sheet scrolls to more

**ALL B-SERIES TESTS PASS → M9 cleared for index.html injection.**

---

## GATE 5 — SESSION C COMPLETE

M9 (bottom sheets, top 3 modals) and M11 (pull-to-refresh + visibilitychange) shipped.

### Desktop regression check (60 seconds):
- [ ] Centered modals still appear on desktop for all converted forms
- [ ] Deal edit: open on desktop → centered modal (not bottom sheet)
- [ ] Vendor score: open on desktop → centered modal

### Mobile modal check (real iPhone):
- [ ] Deal edit on mobile → bottom sheet appears
- [ ] Vendor score on mobile → mid-height bottom sheet
- [ ] Quote new on mobile → full-height bottom sheet
- [ ] All three: keyboard does not hide inputs
- [ ] All three: swipe-down dismisses

### Pull-to-refresh check:
- [ ] At top of Vendor list (`.content.scrollTop === 0`): pull down 80px → loading indicator appears → data refreshes
- [ ] Mid-scroll in Vendor list: pull gesture does NOT trigger refresh
- [ ] App foregrounded after 5+ minutes: data refresh triggers silently

**GATE 5 PASS → Session C complete. Session D may begin when ready (after cache versioning decision).**

---

## GATE 6 — SESSION D COMPLETE (Service Worker)

M10 (service worker + app shell cache) shipped.

### Pre-ship requirement (must be confirmed before starting):
- [ ] Cache versioning mechanism is decided and implemented (NOT manual-only)
- [ ] `CACHE_VERSION` constant exists in `sw.js`

### SW installation check (Chrome DevTools → Application → Service Workers):
- [ ] SW shows as "activated and running" (not "waiting")
- [ ] No SW errors in DevTools console
- [ ] `skipWaiting()` confirmed in install event
- [ ] `clients.claim()` confirmed in activate event

### Cache integrity check (Chrome DevTools → Application → Cache Storage):
- [ ] All shell assets present in cache: index.html + all 38 js/*.js files
- [ ] No error responses cached (all cached resources return status 200)
- [ ] Total cache size < 2.5MB uncompressed

### Offline shell check:
- [ ] Enable airplane mode on iPhone
- [ ] Open `accent-os.pages.dev` (or from home screen icon)
- [ ] App shell appears in < 400ms
- [ ] Empty state message shown (not blank screen, not JS error)
- [ ] Disable airplane mode → pull-to-refresh → data loads

### Post-deploy SW update check:
- [ ] After a second deploy with incremented `CACHE_VERSION`: DevTools shows new SW activated
- [ ] Old cache deleted (previous version not present in Cache Storage)

**GATE 6 PASS → Session D complete.**

---

## STANDING CHECKS (Run After Every Session)

These never expire. Run after every implementation session, always.

### Desktop regression (60 seconds — non-negotiable):
```
Open accent-os.pages.dev in Chrome at 1440px:
□ Sidebar visible
□ No bottom nav visible
□ Dashboard renders
□ Pipeline renders
□ Vendors renders
□ At least one modal opens correctly (centered overlay)
□ No console errors
```

### Mobile smoke test (2 minutes — real iPhone):
```
Open accent-os.pages.dev in Safari:
□ Page loads without blank screen
□ Login works
□ Dashboard (Daily Brief) renders
□ At least one tap on bottom nav works (if Session B+ is shipped)
□ No crash, no frozen state
```

---

## ROLLBACK TRIGGER GATES

If any of these is true at any point, stop and execute the relevant rollback:

| Trigger | Action | Max time to restore |
|---|---|---|
| Desktop sidebar missing | git revert + push | 5 minutes |
| Desktop modal behavior changed | Revert openModal() area | 5 minutes |
| Bottom nav taps non-functional | CSS display:none on #mobile-bottom-nav | < 1 minute |
| App shows blank screen on iPhone | §3 triage in ROLLBACK_PLAYBOOK | 5–15 minutes |
| Michael reports "AccentOS is broken" | Immediate: triage → rollback | < 15 minutes |
| New JS error in production console | git revert + push | 5 minutes |
| Any module fails to render after deploy | git revert + push | 5 minutes |

**When in doubt: rollback first, investigate second. Operational continuity beats root cause analysis.**
