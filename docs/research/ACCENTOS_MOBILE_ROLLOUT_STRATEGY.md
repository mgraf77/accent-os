# AccentOS Mobile Rollout Strategy
> **Status:** Planning only — no implementation  
> **Date:** 2026-05-08  
> **Builds on:** `ACCENTOS_MOBILE_IMPLEMENTATION_PLAN.md`  
> **Constraint:** AccentOS is operational infrastructure — survivability under failure is non-negotiable

---

## CORE PRINCIPLE

> AccentOS is not a product launch. It is operational infrastructure.  
> Every mobile change must be survivable if it fails silently, visually breaks, or goes unnoticed for hours.  
> Ship in the order that maximizes survivability, not the order that maximizes feature completeness.

---

## 1. MOBILE COEXISTENCE STRATEGY

### The Non-Negotiable Constraint

Desktop users (Paul, Patrick, warehouse staff, other employees) must never experience degradation from mobile improvements. AccentOS has no staging environment — every change goes live to Cloudflare Pages.

### Coexistence Pattern: Mobile-Gated CSS + JS

All mobile-specific behavior is gated behind CSS media queries or a JavaScript `isMobile()` helper. Desktop code paths are never modified.

```js
// Planning reference — not for direct use
function isMobile() {
  return window.innerWidth < 900;
}
// Usage: if (isMobile()) openBottomSheet(...) else openModal(...)
```

The `900px` breakpoint matches the existing AccentOS mobile media query (`@media (max-width:900px)`) — no new breakpoint introduced.

### Additive-Only Rule (Phase 1 and 2)

Phase 1 and 2 changes follow a strict additive-only rule:
- New CSS classes added, not existing ones modified
- New HTML elements added alongside existing ones, not replacing them
- Existing navigation sidebar HTML is preserved in full — bottom nav is a new element
- `openModal()` is never modified — `openBottomSheet()` is a new parallel function

This means any mobile feature can be disabled by adding a single `display:none` or removing a function call — without touching any desktop code path.

### Exception: Phase 1 Meta Changes

The viewport meta tag and manifest.json are global — they affect all devices. However:
- `viewport-fit=cover` has zero visual effect on desktop browsers
- `manifest.json` has zero effect on users who don't install
- Apple meta tags have zero effect on non-iOS devices
- Safe-area `env()` values evaluate to `0px` on non-notched devices

These are safe to ship globally.

---

## 2. SAFEST SEQUENCING

### Gate Order (Non-Negotiable)

```
1. viewport-fit=cover          (global, zero-risk, prerequisite for everything)
2. manifest.json + Apple tags  (global, zero-risk, enables installability)
3. Safe-area CSS               (global CSS, zero desktop impact)
4. Script defer optimization   (validate execution order first)
5. Mobile landing screen       (mobile-only, minimal JS)
--- VALIDATION CHECKPOINT: install app to home screen, confirm correct display ---
6. Bottom tab navigation       (mobile-only, additive HTML/CSS/JS)
--- VALIDATION CHECKPOINT: desktop unchanged, mobile nav functional ---
7. Bottom sheet conversion     (mobile-only, parallel function)
8. Pull-to-refresh + vis-change (mobile-only, event listeners)
--- VALIDATION CHECKPOINT: all 3 top modals tested in Safari ---
9. Service worker              (global, requires cache versioning discipline)
--- VALIDATION CHECKPOINT: SW install confirmed in DevTools, offline shell test ---
10. Push notifications         (Michael install + permission required first)
```

Never skip a validation checkpoint. Each checkpoint is a 5-minute in-browser iPhone test, not a code review.

---

## 3. FALLBACK BEHAVIOR BY FEATURE

### Bottom Tab Navigation Fallback

If bottom nav renders broken (wrong height, overflows, obscures content):
- CSS `display:none` on `#mobile-bottom-nav` restores offcanvas sidebar immediately
- No JS change required
- Desktop completely unaffected
- **Fallback time: < 1 minute**

If bottom nav renders correctly but `goTo()` calls fail silently:
- Each tab button independently calls `goTo()` — one broken tab does not break others
- "More" button still shows full sidebar as backup navigation
- **User can still navigate — degraded but functional**

### Bottom Sheet Fallback

If bottom sheet keyboard interaction is broken in Safari:
- Call `openModal()` instead of `openBottomSheet()` at the affected call site
- Zero other changes needed
- Desktop never used `openBottomSheet()` to begin with
- **Fallback time: 2 minutes per affected modal**

### Service Worker Fallback

If the service worker serves stale assets after a deploy:
- User symptom: app feels outdated, or shows wrong module state
- Fix: increment `CACHE_VERSION` constant in `sw.js` on every deploy
- Emergency: ship a `sw.js` with `self.skipWaiting()` and cache-clear logic
- Emergency fallback: remove SW registration from `index.html` and deploy — users get network-only on next load
- **Fallback time: 5–10 minutes + Cloudflare propagation (~15s)**

If the service worker fails to install (JS syntax error in `sw.js`):
- The app continues working normally — browsers silently skip failed SW registration
- No user-visible impact — the app just loses the caching benefit
- **User-visible impact: none**

### Push Notification Fallback

Push notification failures are entirely contained to the notification layer:
- If a notification is not delivered: user simply doesn't see it — app still works
- If the push subscription expires: user stops receiving notifications — app still works
- If VAPID endpoint is broken: push fails silently — app still works
- **AccentOS functionality is never dependent on notifications**

### Manifest Fallback

If `manifest.json` has an error:
- Browser ignores the manifest silently
- App works normally in browser tab
- Installability simply doesn't work
- **User-visible impact: none (unless they try to install)**

---

## 4. GRACEFUL DEGRADATION TARGETS

For every mobile feature, define the minimum acceptable degraded state:

| Feature | Full state | Degraded acceptable state | Broken state (fix immediately) |
|---|---|---|---|
| Safe-area CSS | Content perfectly inset from notch | Content slightly high (minor visual gap) | Content hidden under notch — unreadable |
| Bottom tab nav | 5 thumb-zone tabs | Offcanvas sidebar (current behavior) | Navigation entirely missing |
| Bottom sheets | Keyboard-safe slide-up form | Centered modal (current behavior) | Form inputs hidden behind keyboard |
| App shell cache | Instant load from cache | 1–2s load from network | Blank screen (broken SW) |
| Push notifications | Operational alerts to lock screen | No notifications (current state) | — |
| Pull-to-refresh | Natural gesture refreshes data | Manual navigation to refresh | Data permanently stale |

The "degraded acceptable state" column defines rollback targets — the app should always be at least at this level.

---

## 5. INSTALL-FLOW STRATEGY

iOS requires manual installation via Safari Share → Add to Home Screen. This is not automatic. Without it:
- No standalone mode (Safari URL bar always visible)
- No push notifications (ever)
- Higher storage eviction risk
- App feels like a website, not an operational tool

### Install Guidance UX Plan

**Trigger condition:** User is on iOS Safari AND `window.navigator.standalone === false` AND no `localStorage.installBannerDismissed` flag.

**Banner design:**
```
┌─────────────────────────────────────────────────────┐
│  📲 Install AccentOS for the full experience         │
│  Tap Share → Add to Home Screen                      │
│                                    [Got it] [×]      │
└─────────────────────────────────────────────────────┘
```

- Non-blocking: appears at top of content, not a modal
- Dismissable: [×] button sets `localStorage.installBannerDismissed = Date.now()`
- Re-shows after 30 days if still not installed
- Disappears immediately when app is opened from home screen (`navigator.standalone === true`)
- Shows a Safari Share icon SVG — most users do not know which button to tap

**Detection logic:**
```js
// Planning reference
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = navigator.standalone === true;
const wasDismissed = localStorage.installBannerDismissed;
const dismissedAgo = wasDismissed ? Date.now() - parseInt(wasDismissed) : Infinity;
const shouldShowBanner = isIOS && !isStandalone && dismissedAgo > 30 * 24 * 60 * 60 * 1000;
```

---

## 6. FEATURE-FLAG RECOMMENDATIONS

AccentOS has no feature flag infrastructure. Adding a full feature-flag system is over-engineered for a 2-person tool. Instead, use these lightweight patterns:

### Pattern A — CSS Class Toggle (for navigation changes)

```css
/* Add class to body for mobile nav mode */
body.mobile-nav-enabled #mobile-bottom-nav { display: flex; }
body.mobile-nav-enabled .sidebar { display: none; }
```

```js
// Enable/disable via console or Settings toggle
document.body.classList.toggle('mobile-nav-enabled');
localStorage.setItem('mobileNav', 'true');
```

This lets Michael toggle mobile nav on/off without a code deploy — useful during rollout testing.

### Pattern B — localStorage Flag (for experimental features)

```js
const MOBILE_FLAGS = {
  bottomSheets: localStorage.getItem('flag_bottomSheets') === '1',
  pullToRefresh: localStorage.getItem('flag_pullToRefresh') === '1',
  commandLauncher: localStorage.getItem('flag_commandLauncher') === '1',
};
```

Michael can enable flags via the browser console without a deploy:
```js
localStorage.setItem('flag_bottomSheets', '1'); location.reload();
```

### Pattern C — Settings Page Toggle (for persistent flags)

Add a "Mobile Preview" section to the AccentOS Settings page with toggles for experimental mobile features. Michael can enable features himself without a Claude session.

---

## 7. ROLLOUT METRICS

These metrics confirm that mobile changes are working and not regressing. They are not analytics infrastructure — they're manual checks Michael does after each session.

| Metric | How to check | Pass threshold |
|---|---|---|
| App installable | Open Safari on iPhone, tap Share → confirm "Add to Home Screen" appears | Appears within 3s |
| Standalone mode active | Install app, open from home screen — Safari URL bar should be gone | No URL bar visible |
| Safe-area correct | In standalone mode, check header and bottom are not under notch/home indicator | No clipping |
| Bottom nav reachable | One-handed, right-thumb only: can all 5 bottom tabs be tapped without adjusting grip? | All 5 tappable |
| Modal keyboard safety | Open deal edit form on mobile; bring up keyboard — confirm form inputs are visible | Inputs visible above keyboard |
| Shell cache working | Load app, turn on airplane mode, reload — does the shell still appear? | Shell loads, data shows graceful empty state |
| Desktop unchanged | Load on desktop Chrome at 1440px — confirm sidebar still shows, layout unchanged | Sidebar functional |
| Toast visible | Trigger any action on mobile — confirm toast appears above bottom nav | Toast visible, not hidden |

---

## 8. ROLLBACK TRIGGERS

Define explicit conditions that automatically trigger a rollback, without waiting for user report:

| Trigger condition | Severity | Rollback action |
|---|---|---|
| Navigation is missing or non-functional on mobile | Critical | Immediately add `display:none` to bottom nav; sidebar restored |
| Any module fails to render after navigation | Critical | Same as above |
| Desktop layout broken in any way | Critical | Revert entire session's changes via `git revert` |
| Form inputs hidden behind iOS keyboard | High | Revert `openBottomSheet()` call for affected modal |
| App shows blank screen on iPhone (not just loading) | Critical | Check SW — if SW fault, remove registration and redeploy |
| Infinite loading state on any module | High | Check `defer` attribute ordering; revert if SW-related |
| Michael reports "AccentOS is broken on my phone" | Critical | Immediate investigation; revert suspect change within 15 min |

---

## 9. SHOWROOM / NETWORK-FAILURE SURVIVABILITY

### Showroom Network Context

Accent Lighting showroom in Wichita, KS. iPhone 13 Pro Max. Network scenarios:
- **Good WiFi** (at desk): fast, reliable — primary use case
- **Spotty showroom WiFi** (on floor with customers): variable, may drop mid-session
- **Cellular only** (on jobsite, delivery, meetings outside): LTE, generally reliable
- **Dead zone** (basement warehouse, elevator, parking): possible during brief window

### Survival Requirements by Network State

| State | Required behavior | Current behavior | Post-mobile behavior |
|---|---|---|---|
| Full WiFi | All features functional | ✅ | ✅ |
| Spotty WiFi (drops mid-session) | App shell stays rendered; stale data visible; graceful retry | ❌ May go blank | ✅ Service worker shell cache |
| Cellular only | Core modules load; queries complete | ✅ (slow) | ✅ (faster FCP via defer + cache) |
| Offline (brief) | App shell visible; "no connection" message; no crash | ❌ Blank screen | ✅ Service worker shell |
| Offline (extended) | Shell only; data reads fail gracefully with empty state | ❌ Broken | ⚠️ Phase 2 (stale-while-revalidate for Daily Brief) |

### Network-Safe Data Fetching Principles

1. **All Supabase reads go network-first** — never serve stale operational data without warning
2. **UI never hangs on a fetch** — all data loads should have a timeout + empty state fallback
3. **Error states are explicit** — "Could not load vendor data. Pull down to retry." not blank tables
4. **The app shell always loads** — even offline, the navigation and structure are visible
5. **Partial data is better than no data** — if Daily Brief loads but Pipeline fails, show Daily Brief + empty Pipeline, not a broken page

### Graceful Empty States (Required for Offline)

Every module that fetches from Supabase needs a mobile-aware empty state:
- Show module structure (heading, filters, action buttons)
- Show message: "Offline — showing last loaded data" OR "Unable to load — pull down to retry"
- Never show a JavaScript error or raw `undefined` in the UI

This is a content requirement, not a new feature — it means auditing existing modules for graceful fallback.

---

## 10. PRODUCTION SURVIVABILITY CHECKLIST

Before shipping any mobile change to production, verify:

**Before commit:**
- [ ] Change is mobile-gated (CSS media query or `isMobile()` check) OR confirmed safe for all devices
- [ ] Desktop tested at 1440px — no regressions
- [ ] `goTo()` still works for all tested modules
- [ ] No new `console.error` in browser DevTools

**After deploy (Cloudflare Pages ~15s):**
- [ ] Open `https://accent-os.pages.dev` on iPhone in Safari
- [ ] Confirm page loads without blank screen
- [ ] Confirm navigation works (at least: Dashboard → Pipeline → Quotes)
- [ ] Confirm at least one modal/form opens and keyboard interaction is correct
- [ ] Open on desktop Chrome — confirm sidebar still shows

**After install to home screen:**
- [ ] Standalone mode active (no URL bar)
- [ ] Safe-area insets correct (nothing under notch)
- [ ] Bottom nav visible and functional
- [ ] Toast notifications appear above bottom nav

**Rollback ready:**
- [ ] Know the exact git commit to revert to
- [ ] Know the exact CSS class to add to disable each feature
- [ ] Michael has been told what changed and how to report issues
