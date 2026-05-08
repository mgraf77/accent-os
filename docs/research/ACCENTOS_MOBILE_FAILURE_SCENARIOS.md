# AccentOS Mobile Failure Scenarios
> **Status:** Planning only — no implementation  
> **Date:** 2026-05-08  
> **Orientation:** Operational survivability first. Idealized UX second.  
> **Context:** AccentOS is a single-user operational tool; blast radius is 1 primary user (Michael), occasional secondary users (Paul, Patrick, staff)

---

## READING THIS DOCUMENT

Each scenario is structured as:
- **Symptoms** — what Michael reports or observes
- **Likely cause** — most probable root cause(s)
- **Blast radius** — who is affected and how severely
- **Rollback approach** — fastest path to restoring function
- **Mitigation strategy** — how to prevent this before it happens
- **Monitoring** — how to detect this before Michael reports it

Severity levels: **CRITICAL** (app non-functional) | **HIGH** (major workflow blocked) | **MEDIUM** (degraded experience) | **LOW** (cosmetic / minor)

---

## SCENARIO 1 — PWA Install Failure

**Severity:** MEDIUM  
**Frequency risk:** High (first-time only; iOS install is non-obvious)

### Symptoms
- Michael can't find "Add to Home Screen" in Safari
- App shows "Add to Home Screen" option but after adding, it opens in Safari (browser tab, not standalone)
- Home screen icon shows generic Safari globe icon instead of AccentOS branding
- App seems to open in a browser frame with the URL bar still visible

### Likely Cause
- **Cause A:** Install attempted from a non-Safari browser on iOS (Chrome, Firefox on iOS are not supported for PWA install)
- **Cause B:** `manifest.json` missing or has JSON syntax error — browser cannot parse it
- **Cause C:** `manifest.json` not linked from `index.html` (`<link rel="manifest" href="/manifest.json">` tag missing)
- **Cause D:** `display: "standalone"` missing from manifest — app opens as browser tab even when installed
- **Cause E:** Icon sizes in manifest do not match actual PNG dimensions — icon falls back to generic globe
- **Cause F:** HTTPS not enforced on the specific URL being installed (not a risk for Cloudflare Pages — always HTTPS)

### Blast Radius
- Michael only (primary user)
- No data loss
- App still fully functional in Safari browser tab
- Push notifications impossible until resolved

### Rollback Approach
1. Verify `manifest.json` exists at `https://accent-os.pages.dev/manifest.json`
2. Validate JSON syntax (paste into jsonlint.com or browser DevTools Network tab)
3. Confirm `<link rel="manifest">` in `index.html` `<head>`
4. Re-install: delete home screen icon, re-add via Safari Share
5. If icons wrong: check icon file dimensions match manifest declarations

### Mitigation Strategy
- Validate `manifest.json` in browser DevTools (Application → Manifest) before telling Michael to install
- Document the exact install steps with screenshots and link from Settings page
- Include platform check in install banner: "Install using Safari on iPhone"
- Test install flow on a real iPhone before shipping Session A

### Monitoring
- Check DevTools Application → Manifest panel after every `manifest.json` change
- Include manifest URL in post-deploy checklist

---

## SCENARIO 2 — Broken Safe-Area CSS

**Severity:** HIGH (in standalone mode) | LOW (in browser tab)

### Symptoms
- In standalone mode: header is partially hidden behind the iPhone notch (~47px of content clipped at top)
- Bottom of page content is hidden behind home indicator bar
- Navigation buttons at bottom are unclickable (hidden under home indicator zone)
- In browser tab mode: layout looks correct (browser provides its own safe area)
- Issue appears only after installing to home screen

### Likely Cause
- **Cause A:** `viewport-fit=cover` missing from meta viewport tag — `env(safe-area-inset-*)` evaluates to `0px`
- **Cause B:** Safe-area CSS applied to wrong element — header does not have `padding-top: env(safe-area-inset-top)`
- **Cause C:** CSS specificity conflict — a more specific selector overrides the safe-area padding
- **Cause D:** Bottom nav height calculation wrong — content scrolls behind bottom nav but home indicator padding not accounted for separately

### Blast Radius
- Michael only (primary user); standalone mode only
- Navigation items may be unclickable if hidden under home indicator
- **HIGH** if bottom tab nav items are inaccessible (user cannot navigate)
- **MEDIUM** if only top content is clipped (still readable, navigation accessible)

### Rollback Approach
- If critical (nav inaccessible): revert `viewport-fit=cover` → `standard` in meta tag — this removes safe-area rendering, content returns to browser-provided safe area
- If visual only: adjust padding values in CSS; deploy fix

### Mitigation Strategy
- Test safe-area rendering in standalone mode on real iPhone before deploying
- Use `@supports (padding-top: env(safe-area-inset-top))` guards if needed
- Add safe-area debug overlay during development: temporary `background: red; height: env(safe-area-inset-top)` at top of screen to visualize inset

### Monitoring
- Manual check: install to home screen after every Session A change, visually verify header + bottom

---

## SCENARIO 3 — iOS Keyboard Overlap

**Severity:** HIGH

### Symptoms
- Modal form opens on mobile
- User taps an input field; iOS keyboard slides up
- Form input is hidden behind the keyboard — user cannot see what they're typing
- Specifically affects: Deal edit modal, Quote form, Vendor score edit modal
- Does not affect desktop

### Likely Cause
- **Cause A (current state):** Centered modal with `position: fixed; top: 50%; transform: translateY(-50%)` — when iOS keyboard appears, it shrinks the viewport but the modal stays centered in the original viewport, pushing inputs below the keyboard zone
- **Cause B (post-bottom-sheet):** Bottom sheet implementation incorrectly positioned — sheet does not push up with keyboard
- **Cause C:** `window.innerHeight` used for modal height calculation but iOS does not update `innerHeight` correctly when keyboard appears

### Blast Radius
- Michael primarily (heaviest form user)
- Any employee using a mobile device to enter a quote, deal, or score
- **HIGH** — blocks data entry workflows completely

### Rollback Approach
- If bottom sheets are shipping and causing this: revert to `openModal()` for affected forms
- Current centered modal pattern actually behaves acceptably for many inputs because iOS auto-scrolls to focused input — but some modal heights can prevent this

### Mitigation Strategy
- Bottom sheets are the primary mitigation: bottom-anchored sheets push up naturally with the keyboard
- For bottom sheets, ensure the `max-height` allows scrolling within the sheet so all inputs are accessible even with keyboard up
- Use CSS `height: auto` on the sheet content area, not fixed heights
- Test keyboard interaction with every converted modal before shipping

### Monitoring
- Test every modal form on real iPhone with keyboard open before shipping

---

## SCENARIO 4 — Stale Service Worker Cache

**Severity:** HIGH (users run old JS after deploy) | CRITICAL (if stale SW serves a broken shell)

### Symptoms
- Michael reports a feature that was just deployed doesn't appear on his iPhone
- Michael sees the old version of a module even after refreshing
- New bug fix is not visible despite being deployed
- In extreme cases: module renders completely broken (old JS + new Supabase schema mismatch)

### Likely Cause
- **Cause A:** Service worker is serving assets from a stale cache version after a new deploy — most common failure
- **Cause B:** Cache version (`CACHE_VERSION` constant in `sw.js`) was not incremented on deploy
- **Cause C:** Browser has cached the old `sw.js` file itself — meta-stale problem
- **Cause D:** `skipWaiting()` not called — new SW waits for all tabs to close before activating

### Blast Radius
- All mobile users (anyone with the PWA installed)
- Desktop users not affected (no service worker on desktop if SW is mobile-only)
- **HIGH** if a bug fix is blocked by stale cache
- **CRITICAL** if old JS is incompatible with updated Supabase schema (e.g., column renamed)

### Rollback Approach
**Fast:** Increment `CACHE_VERSION` in `sw.js`, deploy — new SW installs on next visit, clears old caches  
**Faster:** Add `skipWaiting()` to `install` event in `sw.js` — forces immediate SW activation  
**Fastest emergency:** Remove SW registration script from `index.html`, deploy — app goes network-only; old SW expires after ~24h or on browser restart  
**Nuclear:** Ship a `sw.js` that immediately calls `caches.keys().then(keys => keys.forEach(k => caches.delete(k)))` in the install event — clears all caches for all users

### Mitigation Strategy
- **MANDATORY:** Make cache versioning automatic — tie `CACHE_VERSION` to a build timestamp or git hash that is injected at deploy time (Cloudflare Pages supports env vars in build commands)
- If automatic versioning not feasible: add to deploy checklist — "Increment CACHE_VERSION in sw.js"
- Use `skipWaiting()` + `clients.claim()` in the service worker to eliminate waiting-SW ambiguity
- Keep `sw.js` registered scope minimal — `/` only, not `/*`
- Add SW version to AccentOS health check or settings page: display `localStorage.swVersion` so Michael can confirm what version he's running

### Monitoring
- After every deploy: check browser DevTools Application → Service Workers → confirm new SW activated (not "waiting")
- Add `console.log('AccentOS SW version:', CACHE_VERSION)` to `sw.js` — visible in DevTools

---

## SCENARIO 5 — Offline Shell Corruption

**Severity:** CRITICAL

### Symptoms
- App shows blank white screen on iPhone (no content, no loading indicator)
- Error visible in DevTools: `SyntaxError` or `Failed to parse` in cached file
- Happens after a deploy where a JS file was partially cached
- Only affects installed PWA users; browser-tab users get fresh network load

### Likely Cause
- **Cause A:** SW cached a partial/interrupted download of a JS module file during install — cached file is truncated
- **Cause B:** SW installation failed mid-way — some files in cache, some missing — shell loads but modules fail
- **Cause C:** SW attempted to cache a file that returned a non-200 response (404, 500) — cached error response served as if it were valid JS

### Blast Radius
- **CRITICAL** — app is completely unusable until cache is cleared
- Michael cannot access AccentOS at all from his home screen icon
- He can still access via Safari direct URL (non-cached path)

### Rollback Approach
1. Michael: long-press AccentOS home screen icon → Remove App → re-add via Safari
2. OR Michael: Settings → Safari → Advanced → Website Data → find accent-os.pages.dev → Delete
3. OR ship a new SW with a cache-bust (incremented version) + `skipWaiting()`
4. Developer: add `clients.claim()` to SW activate event — ensures new SW takes control immediately

### Mitigation Strategy
- Always verify SW installation succeeded (DevTools → Application → Cache Storage — confirm all expected files present)
- During SW install event: validate each cached response's `ok` status before caching:
  ```js
  // Planning reference
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to cache ${url}`);
  cache.put(url, response);
  ```
- Keep the cache manifest short — only cache the critical shell, not all 38 JS modules
- Consider caching only: `index.html`, critical CSS (inline in index), and the top 5 most-used JS modules

### Monitoring
- Automated: add a SW health check — after install, fetch each cached resource and verify it's valid JSON/JS (not a trivial check but possible with eval/parsing checks)

---

## SCENARIO 6 — Notification Permission Failures

**Severity:** LOW (no existing push infrastructure — no regression possible)

### Symptoms
- Michael taps "Enable Notifications" in Settings — browser shows permission dialog but he denies it
- After denying once, iOS never shows the permission dialog again for that site
- Notifications appear to be "enabled" in the app but no notifications arrive
- App crashes (JS error) when push subscription call fails

### Likely Cause
- **Cause A:** Permission denied — OS-level block that cannot be reversed by the app
- **Cause B:** VAPID public key mismatch — subscription created with one key but server pushes with another
- **Cause C:** Push subscription expired — subscriptions are not permanent; they expire and must be refreshed
- **Cause D:** Service worker not active when push permission is requested
- **Cause E:** Push notification triggered in response to a non-user-gesture (iOS requires user action as trigger)

### Blast Radius
- Michael only
- **LOW** — AccentOS works completely without notifications; this is an enhancement
- Notifications are never critical-path for any workflow

### Rollback Approach
- If permission was denied: instruct Michael — Settings → [App Name in browser list] → Notifications → Allow
- If VAPID mismatch: regenerate subscription on next app open (detect mismatch by catching push send 401s)
- If app crashes on permission failure: wrap all push code in try/catch; fall back silently to no-notifications mode

### Mitigation Strategy
- Always wrap push permission request in try/catch
- Test permission re-request flow before shipping
- Implement a permission state display in Settings: "Notifications: Enabled / Disabled / Blocked"
- If blocked: show instructions on how to re-enable in iOS Settings
- Never show a permission prompt on first app open — wait until Michael explicitly requests it via Settings

### Monitoring
- After push infrastructure ships: add a "Send test notification" button to Settings page

---

## SCENARIO 7 — Broken Mobile Navigation

**Severity:** CRITICAL (if all navigation fails) | HIGH (if one module fails)

### Symptoms
- Bottom tab bar appears but tapping tabs does nothing
- `goTo()` function throws JavaScript error
- Module content area stays blank after tab tap
- Active tab indicator stuck on wrong tab
- "More" tab does not open sidebar

### Likely Cause
- **Cause A:** Bottom nav HTML added but `onclick="goTo('...')"` references wrong page key (key not in `PAGE_META`)
- **Cause B:** JS execution order issue — bottom nav HTML rendered before `goTo()` is defined
- **Cause C:** Z-index conflict — bottom nav is visually present but another element (overlay, modal) is capturing taps
- **Cause D:** Bottom nav added outside `#app` container — may not inherit auth state correctly
- **Cause E:** CSS specificity caused bottom nav to be positioned behind the content area (`z-index` too low)

### Blast Radius
- All mobile users
- **CRITICAL** if primary navigation is completely non-functional
- **Mitigated** if offcanvas sidebar remains functional (user can still navigate via "hamburger" on topbar)

### Rollback Approach
- Fastest: add `#mobile-bottom-nav { display: none !important; }` to a `<style>` tag via DevTools or via a quick deploy — sidebar nav is immediately restored
- If that doesn't work: `git revert` the bottom nav commit and deploy

### Mitigation Strategy
- **Prototype-first rule is mandatory for M8** — test in a standalone HTML file before touching `index.html`
- Verify each `goTo()` key against `PAGE_META` object before using
- Keep `data-roles` filtering logic consistent with existing sidebar implementation
- Add bottom nav inside `#app` container to inherit auth gating
- Test all 5 bottom tabs immediately after deploy; test "More" sidebar reveal

### Monitoring
- Post-deploy check: tap each bottom tab, confirm module renders correctly

---

## SCENARIO 8 — Low-Memory Mobile States

**Severity:** MEDIUM

### Symptoms
- AccentOS tab reloads unexpectedly when returning after using other apps (Safari memory purge)
- All in-memory state is lost (current module, form data being entered, open modal state)
- Partially entered quote data disappears
- User must re-navigate and re-enter data

### Likely Cause
- iOS Safari aggressively purges backgrounded tabs under memory pressure
- AccentOS stores all state in JavaScript globals (`VENDORS`, `QUOTES`, `CUSTOMERS`, `DEALS`, etc.) — all lost on tab purge
- Particularly acute when: Michael switches to camera app to photograph a product, then returns to AccentOS

### Blast Radius
- Data loss only for unsaved in-progress work (quotes being built, notes being typed)
- All saved Supabase data is safe — database is unaffected
- Primarily affects: Quote Generator (multi-step, long-lived form state)

### Rollback Approach
- No rollback possible (memory purge is OS behavior, not AccentOS behavior)
- Mitigation is prevention (see below)

### Mitigation Strategy
- **For Quote Generator specifically:** Auto-save draft state to `localStorage` after every line item change
  - `localStorage.setItem('quoteDraft', JSON.stringify({lineItems, customer, project}))` on every mutation
  - On page load: check for draft → offer to restore
  - On successful save: clear draft
- **For Deal Edit modal:** Auto-restore to open deal if `curPage === 'pipeline'` and a deal was open on last session
- **General:** Use `localStorage` for any multi-step form that takes > 30 seconds to complete

### Monitoring
- Cannot monitor memory purge events programmatically in iOS Safari
- Detect indirectly: on page load, if `performance.navigation.type === 1` (reload), check if state should have been preserved → show restore prompt

---

## SCENARIO 9 — Degraded Performance on Long Sessions

**Severity:** MEDIUM

### Symptoms
- AccentOS becomes sluggish after 2–3 hours of use
- Scrolling through Vendor list or Pipeline is choppy (< 30fps)
- Tab switches take 1–2s instead of < 100ms
- Browser memory usage climbs steadily (visible in DevTools Memory panel)

### Likely Cause
- **Cause A:** DOM detached event listeners accumulating — every `openModal()` call that re-renders inside the modal `innerHTML` may leave orphaned listeners if they reference closures
- **Cause B:** Global arrays growing without bounds (`CHANGELOG`, `QUOTES`, `DEALS` etc.) — if re-fetched on every tab switch and appended, memory grows linearly with navigation count
- **Cause C:** `setInterval` or `setTimeout` chains not being cleared — background timers accumulate
- **Cause D:** AI chat conversation history (`CHAT` array) growing indefinitely — each message adds DOM + memory
- **Cause E:** Large table re-renders on every module visit — `el.innerHTML = renderBigTable(data)` forces full layout recalculation

### Blast Radius
- Single user (Michael) during long operational sessions
- **MEDIUM** — app still functional but frustrating
- Usually resolved by refreshing the page (which also clears module state)

### Rollback Approach
- Instruct Michael to refresh the page — resolves immediately
- No code rollback needed

### Mitigation Strategy
- Audit for `setInterval` calls without paired `clearInterval` on tab switch
- Cap `CHAT` array at last 20 messages (`CHAT = CHAT.slice(-20)` before push)
- Implement cleanup hook in `goTo()` — when leaving a module, call a module-specific cleanup function if defined
- Avoid re-fetching full datasets on every tab switch — keep globals as single source of truth; only fetch when explicitly refreshed

### Monitoring
- Add a `performance.memory.usedJSHeapSize` log to the console every 30 minutes (debug mode only)
- If heap exceeds 150MB: show a toast "Refresh recommended for best performance"

---

## SCENARIO 10 — Accidental Desktop/Mobile Divergence

**Severity:** HIGH

### Symptoms
- A feature works on desktop (Windows Chrome) but is broken on iPhone
- OR: A feature works on iPhone but shows a UI element that doesn't belong on desktop
- Mobile-only CSS accidentally applies to desktop due to missing media query
- Bottom nav is visible on desktop
- Bottom sheets trigger on desktop (replacing modals that should be modal-style)

### Likely Cause
- **Cause A:** `isMobile()` function references `window.innerWidth` which can change if window is resized — function returns different values during a session on desktop
- **Cause B:** Mobile CSS accidentally omits the `@media (max-width: 900px)` wrapper
- **Cause C:** `isMobile()` check added to JS but corresponding CSS change not gated — visual divergence
- **Cause D:** Desktop testing done at < 900px window width (laptop, small monitor) — mobile behavior incorrectly triggered during testing

### Blast Radius
- **HIGH** — either desktop users see broken mobile UI, or mobile users see broken desktop UI
- Multi-user impact: Paul, Patrick, warehouse staff all use desktop

### Rollback Approach
- CSS: remove mobile CSS from `@media` scope → add `@media (max-width:900px)` wrapper
- JS: correct `isMobile()` check or replace with `window.matchMedia('(max-width: 900px)').matches` (more reliable)

### Mitigation Strategy
- **Test at 1440px desktop width after every session** — this is the #1 regression check
- Use CSS `@media` queries for all mobile changes — never rely solely on JS class-gating for structural changes
- Define a consistent `MOBILE_BREAKPOINT = 900` constant and use it in both CSS and JS checks
- Document: mobile breakpoint is 900px; test desktop at ≥ 1024px minimum
- Pre-commit checklist: "Desktop tested at 1440px — sidebar visible, modals centered, no bottom nav"

### Monitoring
- Add desktop screenshot to deploy checklist — 1 quick visual check before each commit
- Use browser DevTools device simulation for quick regression check during development (not a substitute for real device testing)

---

## MASTER RISK REGISTER

| Scenario | Severity | Probability | Impact if unmitigated | Priority |
|---|---|---|---|---|
| 4 — Stale SW Cache | HIGH | High (every deploy) | Users run old broken JS | P1 |
| 10 — Desktop/Mobile Divergence | HIGH | High (every mobile change) | Desktop broken for all staff | P1 |
| 7 — Broken Mobile Navigation | CRITICAL | Medium (M8 is complex) | App unusable on mobile | P1 |
| 5 — Offline Shell Corruption | CRITICAL | Low (edge case) | App blank, can't work | P2 |
| 2 — Broken Safe-Area CSS | HIGH | Medium (first install) | Content clipped, nav inaccessible | P2 |
| 3 — iOS Keyboard Overlap | HIGH | High (current state) | Forms unusable on mobile | P2 |
| 8 — Low-Memory Purge | MEDIUM | High (iOS normal behavior) | Data loss for in-progress work | P3 |
| 9 — Long-Session Degradation | MEDIUM | Low-Medium | Sluggish after hours of use | P3 |
| 1 — PWA Install Failure | MEDIUM | Medium (first-time only) | No standalone, no push | P3 |
| 6 — Notification Failure | LOW | High (permission is fickle) | No notifications (enhancement only) | P4 |

---

## TRIAGE PROTOCOL

When Michael reports an issue, diagnose in this order:

```
1. Is it browser-tab or standalone (home screen)?
   → standalone: check safe-area, SW, manifest
   → browser tab: check JS errors, modal behavior, navigation

2. Does it affect desktop too?
   → YES: this is a regression — P1 rollback immediately
   → NO: mobile-only issue — investigate bottom nav / bottom sheets / SW

3. Is it a blank screen?
   → YES: check SW first (unregister and reload) → then check JS errors
   → NO: describe exact broken behavior

4. Was a deploy done recently?
   → YES within 30 min: check SW cache version, JS syntax in new code
   → NO: likely pre-existing issue surfaced by a new usage pattern

5. Can it be fixed by refreshing?
   → YES: likely memory/state issue or SW stale cache
   → NO: likely CSS or HTML structure issue
```
