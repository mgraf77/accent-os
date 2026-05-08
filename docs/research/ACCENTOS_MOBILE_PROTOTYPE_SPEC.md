# AccentOS Mobile Prototype Specification
> **Status:** Specification only — not for direct implementation  
> **Date:** 2026-05-08  
> **Authority:** Authoritative mobile validation gate — all Phase 2 changes must pass this spec before touching `index.html`  
> **Scope:** M8 (bottom tab navigation) and M9 (bottom sheet conversion)

---

## PURPOSE

This document defines what a standalone prototype must prove before any mobile navigation or modal change is injected into the production `index.html`. A change is not ready for production until every PASS criterion in its section is confirmed on a real iPhone in Safari.

**Prototype-first is non-negotiable for M8 and M9.** These are the two highest-risk mobile changes in the plan. Both touch navigation and form interaction patterns that are used by every module and every user.

---

## PROTOTYPE STRUCTURE

Each prototype is a **standalone HTML file** — not a copy of `index.html`. It contains only the elements needed to validate the specific behavior being tested. No Supabase, no auth, no module rendering.

```
/home/user/accent-os/prototypes/   (new directory, not served by Cloudflare)
  mobile-nav-proto.html            → M8 prototype
  bottom-sheet-proto.html          → M9 prototype
```

These files are never deployed to Cloudflare Pages. They exist only for local browser testing (open as `file://` or via a local server). They are committed to the repo for reference but excluded from the production Cloudflare build if needed via `_headers` or `.cfignore`.

---

## PROTOTYPE A — M8: BOTTOM TAB NAVIGATION

### What Must Be Proven

The prototype must prove that a bottom tab navigation pattern:
1. Works correctly in Safari on iPhone 13 Pro Max (real device, not simulator)
2. Handles safe-area insets correctly (notch + home indicator)
3. Does not conflict with iOS system gesture zones
4. Correctly reflects active state on the active tab
5. Provides access to all secondary modules via a "More" trigger
6. Passes the one-handed grip-shift test (right thumb only)
7. Renders correctly in both standalone (installed) mode and browser tab mode

### Prototype A HTML Structure

The prototype must include:
- A simulated content area (`#pg-content`) that renders placeholder text
- A mock `goTo(page)` function that updates `curPage` and shows which page would render
- The exact bottom nav HTML and CSS being proposed
- A simulated "More" trigger that shows a simplified module list overlay
- A mock topbar (without sidebar) to simulate the post-M8 mobile header

The prototype does NOT need: real Supabase data, auth, module rendering, or any JS from AccentOS.

### Test Matrix A — Layout and Structure

| Test | Action | PASS criterion | FAIL criterion |
|---|---|---|---|
| A1 | Open in Safari on iPhone 13 Pro Max (browser tab) | Bottom nav visible, correct height, no overlap with content | Bottom nav hidden, height wrong, or overlaps content |
| A2 | Install prototype to home screen; open in standalone mode | Bottom nav visible with correct safe-area padding; home indicator not obscured | Home indicator obscured; nav extends under home indicator |
| A3 | Check top of screen in standalone mode | Content does not extend under notch | Content clips under notch (~47px) |
| A4 | Rotate to landscape orientation | Nav still visible; layout adjusts correctly; no horizontal scrollbar | Nav disappears or layout breaks in landscape |
| A5 | Open prototype in desktop Chrome at 1440px | Bottom nav does NOT appear | Bottom nav visible on desktop |
| A6 | Open prototype in desktop Chrome at 900px exactly | Bottom nav behavior at breakpoint boundary is correct | Layout broken at 900px |

### Test Matrix A — Interaction

| Test | Action | PASS criterion | FAIL criterion |
|---|---|---|---|
| A7 | Tap each of the 5 bottom tabs (right thumb, one-handed) | Each tap registers without grip shift; `curPage` updates correctly | Requires grip shift; mis-tap rate > 2 in 10 |
| A8 | Tap active tab again | No crash, no visual glitch; content does not re-render unexpectedly | JS error; duplicate render |
| A9 | Rapid tap between tabs (3 taps in < 1 second) | UI keeps up; no stuck active state; correct page shown | Active state stuck; wrong page shown |
| A10 | Tap "More" trigger | Module list overlay appears from correct direction (bottom or right) | Overlay does not appear; blocks wrong content |
| A11 | Dismiss "More" overlay by tapping outside it | Overlay dismisses; returns to last active tab content | Overlay does not dismiss; content locked |
| A12 | Swipe up from bottom edge of screen | iOS home swipe activates (system gesture, not captured by app) | App captures the gesture; cannot go home |

### Test Matrix A — Active State

| Test | Action | PASS criterion | FAIL criterion |
|---|---|---|---|
| A13 | Tap "Pipeline" tab | Pipeline tab appears visually active; other tabs inactive | Wrong tab appears active; or no tab appears active |
| A14 | Call `goTo('pipeline')` programmatically | Pipeline tab active state updates | Active state does not update on programmatic navigation |
| A15 | Navigate to a secondary module via "More" | No bottom tab appears active (or a neutral state shown) OR "More" tab remains highlighted | Stale active state on a primary tab |
| A16 | Return from secondary module via back/close | Previously active primary tab is re-activated | Active state lost on return |

### Test Matrix A — Accessibility and Sizing

| Test | Action | PASS criterion | FAIL criterion |
|---|---|---|---|
| A17 | Measure tap target height of each tab | Height ≥ 44px (use DevTools → Inspect → measure) | Any tab < 44px tall |
| A18 | Measure tap target width of each tab | Width ≥ 44px (horizontal tap target) | Any tab < 44px wide |
| A19 | Test with iOS system text size set to "Large" | Tab labels still legible; layout not broken | Text overflows; labels invisible |
| A20 | Test with iOS system text size set to "Extra Large" | Acceptable degradation (icons legible even if labels truncate) | Layout completely broken |

### goTo() Integration Requirement

The production `goTo()` function (line 864) contains this line:
```js
qsa('.ni').forEach(el=>{el.classList.remove('active');if(el.getAttribute('onclick')?.includes(`'${page}'`))el.classList.add('active');});
```

This handles `.ni` (sidebar) active state only. Bottom nav items use a different class (`.bn-item`). The prototype must validate that the following addition to `goTo()` works correctly — **this is the only goTo() modification in the entire mobile plan:**

```js
// Line to be added immediately after the existing .ni forEach:
qsa('.bn-item[data-page]').forEach(el => {
  el.classList.toggle('active', el.dataset.page === page);
});
```

Test A14 explicitly validates this integration.

### M8 PASS GATE

**All of the following must be true before M8 may be injected into index.html:**

- [ ] Tests A1–A6 all PASS (layout + structure)
- [ ] Tests A7–A12 all PASS (interaction)  
- [ ] Tests A13–A16 all PASS (active state)
- [ ] Tests A17–A20 all PASS (sizing)
- [ ] Desktop test at 1440px: sidebar still shows, bottom nav hidden
- [ ] The single `goTo()` addition (A14) works correctly without affecting existing `.ni` behavior
- [ ] Tested on real iPhone (not simulator) — iOS Simulator does not accurately replicate Safari touch behavior or safe-area rendering

---

## PROTOTYPE B — M9: BOTTOM SHEET

### What Must Be Proven

The prototype must prove that a bottom sheet:
1. Slides up from the bottom correctly and smoothly on iOS Safari
2. Does not get obscured by the iOS keyboard when input fields are focused
3. Can be dismissed by swipe-down gesture
4. Scrolls internal content correctly (does not conflict with page scroll)
5. Can contain multi-field forms without usability issues
6. Renders with correct safe-area padding at bottom
7. Works correctly at both mid (50vh) and full (90vh) heights
8. `openBottomSheet(title, body, foot)` signature is a drop-in parallel to `openModal()` — no call site modification beyond `if/else` branch

### Prototype B HTML Structure

The prototype must include:
- A mock form simulating the Deal edit form (name, company, stage, value, probability, notes)
- A mock form simulating the Vendor score update (single score input, notes)
- The exact bottom sheet CSS and JS being proposed
- Both a mid-height (50vh) and full-height (90vh) sheet variant
- Drag handle at top center of the sheet
- An overlay/scrim that dismisses on tap
- A simulated keyboard trigger (input focus)

### Test Matrix B — Layout and Animation

| Test | Action | PASS criterion | FAIL criterion |
|---|---|---|---|
| B1 | Trigger sheet open on iPhone | Sheet slides up from bottom; animation is smooth (no jank) | Sheet appears instantly without animation; or animation drops frames |
| B2 | Check sheet at full height (90vh) in standalone mode | Sheet top is below notch; content area scrollable; bottom has safe-area padding | Sheet top hidden under notch; or content clips under home indicator |
| B3 | Check sheet at mid height (50vh) | Sheet visible in lower half; upper content visible through scrim | Sheet wrong height; scrim does not dim upper content |
| B4 | Open on desktop Chrome at 1440px | Sheet does NOT appear; centered modal appears instead | Sheet appears on desktop |
| B5 | Open in landscape orientation on iPhone | Sheet adapts; max-height caps correctly; keyboard does not cause overflow | Sheet taller than viewport; content hidden |

### Test Matrix B — Keyboard Interaction (Most Critical)

| Test | Action | PASS criterion | FAIL criterion |
|---|---|---|---|
| B6 | Open a mid-height sheet containing a form; tap the first input field | iOS keyboard slides up; sheet scrolls or shifts up so the focused input is visible above keyboard | Input field disappears behind keyboard |
| B7 | Open a full-height sheet containing a form; tap an input field in the middle of the form | Input remains visible; sheet content scrolls to bring focused input above keyboard | Input hidden behind keyboard |
| B8 | Open a full-height sheet; tap the LAST input field in a long form | Scroll + keyboard brings last input above keyboard | Last input permanently hidden |
| B9 | While keyboard is open, tap a different input in the same form | Focus shifts; new input is visible; keyboard does not dismiss | Keyboard dismisses; erratic scroll behavior |
| B10 | Dismiss keyboard via "Done" button; then re-tap an input | Keyboard re-appears smoothly; sheet does not reset position | Sheet jumps; layout reflows incorrectly |
| B11 | Open sheet; focus input; hit iOS Back button (if applicable) | Keyboard dismisses; sheet remains open | Sheet dismisses unintentionally |

### Test Matrix B — Dismissal

| Test | Action | PASS criterion | FAIL criterion |
|---|---|---|---|
| B12 | Swipe down on drag handle | Sheet dismisses; returns to page content | Swipe does not register; sheet stays open |
| B13 | Swipe down fast (velocity > gentle) | Sheet dismisses; does not snap back | Sheet snaps back even on fast swipe |
| B14 | Swipe down partially, then back up | Sheet snaps back to full open | Sheet dismisses; partial swipe is final |
| B15 | Tap the scrim overlay (area outside sheet) | Sheet dismisses | Sheet stays open; tap absorbed by scrim |
| B16 | Tap inside sheet content area | Sheet does NOT dismiss | Accidental dismissal on content tap |
| B17 | Open sheet; swipe up on internal content (scrolling) | Sheet does not dismiss; content scrolls | Scroll gesture dismisses sheet |

### Test Matrix B — Content and Scroll

| Test | Action | PASS criterion | FAIL criterion |
|---|---|---|---|
| B18 | Open full-height sheet with long form (>screen height of content) | Internal content scrolls independently | Page behind sheet scrolls; or content does not scroll |
| B19 | Scroll to bottom of sheet content; swipe down | Sheet dismisses only from drag handle region, not from scrolled-to-bottom content | Scrolling to bottom accidentally triggers dismiss |
| B20 | Open sheet with short content (< half the sheet height) | Sheet does not appear taller than content (OR has consistent minimum height) | Disproportionate empty space |

### Test Matrix B — openBottomSheet() API Compatibility

| Test | Action | PASS criterion | FAIL criterion |
|---|---|---|---|
| B21 | Call `openBottomSheet('Title', '<input type="text">', '<button>Save</button>')` | Sheet opens with correct title, body content, and footer button | Content does not render; JS error |
| B22 | Call `openModal('Title', '<input type="text">', '<button>Save</button>')` after adding bottom sheet code | Original centered modal still works on desktop; NOT affected by bottom sheet code | openModal() behavior changed |
| B23 | Call `closeBottomSheet()` programmatically | Sheet dismisses | JS error; sheet stays open |
| B24 | Open sheet; open a second sheet (via a button inside first sheet) | Either: second sheet replaces first; OR implementation prevents nested sheets | App crashes; both sheets visible and broken |

### Test Matrix B — AccentOS Form Simulation

Test each of these specific form types in the bottom sheet prototype (using mock data, no Supabase):

| Form | Required fields to test | Keyboard test | Success criterion |
|---|---|---|---|
| Deal edit | name, company, stage (select), value, probability, notes textarea | Textarea keyboard test (multi-line) | All fields reachable; save button accessible |
| Vendor score update | numeric score input (0–10), notes | Numeric keyboard appears on score field | Score input + keyboard visible |
| Quote form (basic) | customer, project name, first line item fields | Standard keyboard | First fields reachable; sheet scrolls to more fields |

### M9 PASS GATE

**All of the following must be true before M9 may be injected into index.html:**

- [ ] Tests B1–B5 all PASS (layout and animation)
- [ ] Tests B6–B11 all PASS (keyboard interaction — **this is the hardest test**)
- [ ] Tests B12–B17 all PASS (dismissal)
- [ ] Tests B18–B20 all PASS (content and scroll)
- [ ] Tests B21–B24 all PASS (API compatibility)
- [ ] All three form simulations (deal edit, vendor score, quote) pass keyboard and scroll tests
- [ ] `openModal()` behavior verified UNCHANGED on desktop Chrome at 1440px
- [ ] Tested on real iPhone (not simulator)

---

## REGRESSION CHECK AFTER INJECTION INTO INDEX.HTML

After each prototype-validated change is injected into `index.html`, run this quick regression matrix before committing:

### Navigation Regression (5 minutes)

| Check | How | PASS |
|---|---|---|
| Dashboard renders | `goTo('dashboard')` | Daily Brief appears |
| Pipeline renders | `goTo('pipeline')` | Pipeline columns visible |
| Quotes renders | `goTo('quotes')` | Quote form visible |
| Vendors renders | `goTo('vendors')` | Vendor table visible |
| Settings renders | `goTo('settings')` | Settings UI visible |
| Desktop sidebar visible | Open at 1440px | Full sidebar with all nav items |
| Desktop modal works | Open any modal on desktop | Centered overlay modal appears |
| Mobile nav hidden on desktop | Open at 1440px | No bottom nav bar visible |

### Toast Regression (1 minute)

- Trigger any save action → confirm toast appears above bottom nav (not hidden behind it)

### Keyboard Regression (2 minutes, iPhone only)

- Open the Deal edit form → focus a text field → confirm input is visible above keyboard

---

## PROTOTYPE VALIDATION LOG

For each prototype test run, record:

```
Date: ___________
Device: iPhone 13 Pro Max / Other: ___________
iOS version: ___________
Browser: Safari (standalone) / Safari (browser tab)
Tester: ___________
Prototype version: ___________

M8 PASS GATE: [ ] Complete — all criteria met
M9 PASS GATE: [ ] Complete — all criteria met

Failed tests: ___________
Notes: ___________
```

This log entry is attached to the implementation commit for the relevant session.
