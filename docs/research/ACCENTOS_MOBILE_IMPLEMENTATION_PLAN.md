# AccentOS Mobile Implementation Plan
> **Status:** Planning only — no implementation  
> **Date:** 2026-05-08  
> **Builds on:** `docs/research/ACCENTOS_MOBILE_PWA_RESEARCH.md`  
> **Architecture baseline:** index.html (7,169 lines) + 38 js/*.js modules, Cloudflare Pages, Supabase

---

## ARCHITECTURE SNAPSHOT (PLANNING BASIS)

Before reading any plan entry, internalize the actual code state:

| Component | Current state | Mobile relevance |
|---|---|---|
| Viewport meta | `width=device-width, initial-scale=1.0` | Missing `viewport-fit=cover` — safe-area CSS is silently broken |
| Navigation | Left sidebar, 25+ items, offcanvas on mobile (`@media max-width:900px`) | In hard-reach zone; drawer paradigm is clunky on mobile |
| Modals | Centered `#overlay .modal`, `max-height:88vh` | Keyboard-obscured on iOS, hard to dismiss, out of thumb zone |
| QA FAB | Already exists at bottom-right (`.qa-fab`, line 323) | Repurposable as command launcher trigger |
| `goTo(page)` | Central routing function, line 864 | Bottom nav just calls `goTo()` — no router refactor needed |
| `PAGE_META` | Object at line 831 with all module metadata | Source of truth for bottom nav config |
| `curPage` | Global string, line 863 | Bottom nav reads this for active state |
| Toast system | Fixed bottom-right, z-index 9999 | Conflicts with future bottom nav — needs z-index/position adjustment |
| Google Fonts | Render-blocking `<link>` in `<head>` | Delays FCP on mobile cellular |
| Service Worker | None | No install-resilience, no offline shell |
| manifest.json | None | PWA not installable, push notifications impossible |
| Safe-area CSS | None | Layout bleeds under notch/home indicator in standalone mode |
| Media queries | `@media (max-width:900px)` and `@media (max-width:560px)` | Mobile baseline exists but incomplete |

---

## LEVERAGE/RISK MATRIX

### HIGH LEVERAGE / LOW RISK (Do First)

| # | Change | Why high leverage | Why low risk |
|---|---|---|---|
| M1 | `viewport-fit=cover` in meta tag | Unlocks all safe-area CSS; prerequisite for standalone mode correctness | 1-word addition; no JS change; zero desktop impact |
| M2 | Safe-area CSS insets on header + bottom nav | Prevents content clipping under notch/home indicator | Pure CSS addition; desktop ignores `env()` values |
| M3 | `manifest.json` creation | Enables installability; prerequisite for push notifications | New file only; no existing code touched |
| M4 | Apple PWA meta tags | Enables standalone mode, proper icons, status bar styling | 4 HTML lines added to `<head>`; no JS |
| M5 | `defer` on non-critical JS `<script>` tags | Faster FCP on mobile | Standard HTML attribute; does not change execution |
| M6 | Daily Brief as default landing screen on mobile | Highest-value page for mobile; task-centric | `goTo()` conditional on `isMobile()` at login — ~5 lines |
| M7 | Toast z-index / position conflict resolution | Required before bottom nav to prevent overlap | CSS-only; adjust z-index values |

### HIGH LEVERAGE / HIGH RISK (Prototype First)

| # | Change | Why high leverage | Why high risk |
|---|---|---|---|
| M8 | Bottom tab navigation (replaces offcanvas sidebar on mobile) | Moves primary nav to thumb zone; most impactful UX change | Touches navigation HTML + CSS; must not break desktop; 30+ nav items must collapse cleanly to 5–6 tabs |
| M9 | Bottom sheet conversion for top modals | Keyboard-safe; thumb-zone-native; higher completion rate | Touches multiple modal open calls across js/*.js files; must not regress desktop modal |
| M10 | Service worker + app shell cache | Instant reloads; resilience on bad connectivity | SW registration bugs can break the app entirely; requires cache versioning discipline |
| M11 | Pull-to-refresh + `visibilitychange` refresh | Battery-safe, natural mobile refresh pattern | Must not conflict with existing `setInterval` patterns if any exist |

### LOW LEVERAGE / LOW RISK (Do Anytime)

| # | Change | Why low leverage | Why low risk |
|---|---|---|---|
| M12 | `apple-touch-startup-image` splash screens | Minor UX polish on install | Meta tag only; no code |
| M13 | Font loading optimization (`font-display: swap`) | Minor FCP improvement | CSS addition; no JS |
| M14 | `will-change: transform` on animated elements | Smoother sheet/transition animation | CSS addition; GPU hint only |
| M15 | Swipe-to-reveal on list rows | Nice-to-have for Vendors, Pipeline | JS touch handlers in individual module files; isolated |

### LOW LEVERAGE / HIGH RISK (Defer)

| # | Change | Why low leverage | Why high risk |
|---|---|---|---|
| M16 | Push notification infrastructure | Only valuable after home-screen install established | Requires VAPID keys, SW messaging, Supabase table, Edge Function — multi-session effort |
| M17 | FAB command launcher (global search) | Valuable, but `global_search.js` already exists | Re-wiring search entry point is architectural; must not break existing search |
| M18 | Offline write queue (IndexedDB) | Low priority for single-user ops tool | Complex; race conditions with Supabase sync |
| M19 | Virtual scroll for large tables | Only needed when datasets exceed 100+ rows | Requires complete re-render of existing table patterns |

---

## PHASE 1 — MOBILE FOUNDATION
**Estimated effort:** < 1 session  
**Risk level:** Very Low  
**Rollback complexity:** Trivially reversible (all CSS/meta additions)  
**Prototype-first required:** No  
**Touches production shell:** Yes — `index.html` only, additive-only changes  
**Michael action required:** No

### M1 — `viewport-fit=cover`

| Field | Detail |
|---|---|
| File | `index.html` line 2 |
| Change | `initial-scale=1.0` → `initial-scale=1.0, viewport-fit=cover` |
| LOC impact | +1 word |
| Risk | None. Desktop ignores `viewport-fit`. |
| Rollback | Revert 1 word |
| Mobile UX impact | **Critical prerequisite** — without this, all safe-area CSS is a no-op |
| Dependency | None |
| Validation | Open in Safari on iPhone, install to home screen, confirm no content under notch |

### M2 — Safe-Area CSS

| Field | Detail |
|---|---|
| File | `index.html` — CSS block (currently ~line 14–335) |
| Change | Add `:root` CSS custom properties for safe-area; apply to `.sidebar` (header), bottom nav area, and toast container |
| LOC impact | +15–20 CSS lines |
| Risk | Low. `env()` evaluates to `0px` on desktop — no layout effect. |
| Rollback | Remove CSS block |
| Mobile UX impact | Prevents layout bleed under notch (~47px) and home indicator (~34px) |
| Dependency | M1 must ship first |
| Validation | Test in Safari standalone mode, both portrait and landscape |

```css
/* Planning-only — not for direct implementation */
.sidebar { padding-top: env(safe-area-inset-top); }
.mobile-bottom-nav { padding-bottom: env(safe-area-inset-bottom); }
#toasts { bottom: calc(80px + env(safe-area-inset-bottom)); }
```

### M3 — `manifest.json`

| Field | Detail |
|---|---|
| File | NEW `manifest.json` at repo root |
| Change | Create JSON manifest with name, icons, display: standalone, theme/background color |
| LOC impact | ~20 JSON lines |
| Risk | None — new file only |
| Rollback | Delete file |
| Mobile UX impact | Enables installability; unlock prerequisite for push; enables standalone mode chrome removal |
| Dependency | M1 (viewport-fit required for standalone correctness) |
| Michael action | Provide 192×192 and 512×512 PNG icons — OR use placeholder from CDN for first pass |

Required manifest fields:
```json
{
  "name": "AccentOS",
  "short_name": "AccentOS",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a1a1a",
  "theme_color": "#1a1a1a",
  "orientation": "portrait",
  "icons": [ /* 192, 512, 512-maskable */ ]
}
```

### M4 — Apple PWA Meta Tags

| Field | Detail |
|---|---|
| File | `index.html` `<head>` block |
| Change | Add 4 `<meta>` tags + `<link rel="apple-touch-icon">` |
| LOC impact | +5 lines |
| Risk | None — additive |
| Rollback | Remove 5 lines |
| Mobile UX impact | Enables status bar styling, sets app title on home screen, enables home screen icon |
| Dependency | M3 (icon assets needed) |

### M5 — Script Loading Optimization

| Field | Detail |
|---|---|
| File | `index.html` — all `<script src="js/*.js">` tags |
| Change | Add `defer` attribute to all external JS modules that do not need immediate execution |
| LOC impact | +1 attribute × 38 files = 38 words |
| Risk | Low — `defer` preserves execution order; watch for any scripts that must execute before DOM ready |
| Rollback | Remove `defer` attributes |
| Mobile UX impact | FCP improvement on cellular — page shell renders before JS parses |
| Dependency | None; audit for any inline scripts that depend on module globals being available synchronously |
| Validation | Confirm all modules still hydrate correctly after defer; check `hydrateFromSupabase()` still fires |

### M6 — Daily Brief as Mobile Landing Screen

| Field | Detail |
|---|---|
| File | `index.html` — post-login routing, approximately line 631: `goTo('dashboard')` |
| Change | After login, if `window.innerWidth < 900`, call `goTo('dashboard')` (Daily Brief is the dashboard) — this may already be correct IF the daily brief is the dashboard page. Validate which `PAGE_META` key maps to Daily Brief. |
| LOC impact | +3–5 lines (feature-detect + conditional route) |
| Risk | Very low — only changes initial route on mobile |
| Rollback | Remove conditional |
| Mobile UX impact | User lands on task-centric view instead of blank module or vendor list |
| Dependency | M8 (bottom nav) should ship simultaneously to avoid weird mobile state |

### M7 — Toast Position Conflict Resolution

| Field | Detail |
|---|---|
| File | `index.html` CSS, line 162: `#toasts{...bottom:24px;right:24px;}` |
| Change | On mobile, shift toasts to `top: env(safe-area-inset-top, 16px) + 16px` OR keep bottom but account for bottom nav height (e.g., `bottom: calc(72px + 16px + env(safe-area-inset-bottom))`) |
| LOC impact | +4 CSS lines in mobile media query |
| Risk | Low — visual-only |
| Rollback | Remove mobile media query addition |
| Mobile UX impact | Prevents toasts from being hidden behind bottom nav bar |
| Dependency | M8 must be planned first to know bottom nav height |

---

## PHASE 2 — TOUCH INTERACTION UPGRADES
**Estimated effort:** 1–2 sessions  
**Risk level:** Medium  
**Rollback complexity:** Moderate (nav change is most complex; others are additive)  
**Prototype-first required:** YES for M8 (bottom nav)  
**Touches production shell:** Yes — must use feature-flag or mobile-class gate  
**Michael action required:** No

### M8 — Bottom Tab Navigation

**This is the highest-risk, highest-reward change in the entire mobile plan.**

| Field | Detail |
|---|---|
| Files | `index.html` — HTML structure, CSS, `goTo()` function |
| Change | Add `<nav class="mobile-bottom-nav">` with 5–6 pinned tabs; hide on desktop; keep offcanvas sidebar for all 25+ modules accessible via "More" tab |
| LOC impact | +80–120 lines HTML/CSS; +20 lines JS |
| Risk | Medium — touches navigation which is used by every module |
| Rollback | CSS `display:none` the bottom nav; restore sidebar behavior |
| Mobile UX impact | **Highest ROI of any mobile change** — moves primary nav from unreachable top to thumb zone |
| Dependency | M2 (safe-area) must ship first so bottom nav renders correctly |
| Prototype-first | YES — validate in a standalone test file before injecting into index.html |

**Bottom Nav Tab Selection (for Michael / Owner role):**

| Tab | Module | `goTo()` key | Rationale |
|---|---|---|---|
| Home | Daily Brief / Dashboard | `'dashboard'` | Task-centric landing — most important |
| Pipeline | Sales Pipeline | `'pipeline'` | Primary sales activity |
| Quotes | Quote Generator | `'quotes'` | Frequently created in showroom |
| Vendors | Vendor Ranking | `'vendors'` | Core scoring workflow |
| More | Full module list | opens offcanvas sidebar | All other modules accessible |

The "More" tab re-triggers the existing offcanvas sidebar, so all 25+ modules remain accessible without any routing changes.

**Implementation approach (lowest risk):**
1. Keep existing sidebar HTML completely intact
2. Add `<nav id="mobile-bottom-nav">` as a sibling to `#app` — separate from sidebar
3. Bottom nav calls `goTo()` identically to sidebar nav items
4. Apply `display:none` on desktop (`@media min-width: 901px { #mobile-bottom-nav { display:none } }`)
5. Apply `display:flex` on mobile (`@media max-width:900px`)
6. Existing sidebar stays but gets `display:none` on mobile by default (only shown via "More" button)

This is **purely additive** — existing sidebar code is untouched.

### M9 — Bottom Sheet Conversion (Top 3 Modals)

**Priority order for conversion:**

| Modal | Current trigger | Module file | Conversion priority |
|---|---|---|---|
| Add/Edit Deal | `openModal('Add Deal', ...)` | `index.html` inline + pipeline JS | 1 — most mobile-used |
| Vendor Score Update | `openModal('Edit Scores...')` | `index.html` (line ~3316) | 2 — field scoring workflow |
| New Quote | Multi-step quote flow | `index.html` (line ~5474+) | 3 — complex but high value |

| Field | Detail |
|---|---|
| Files | `index.html` — `openModal()` function + CSS; individual modal calls |
| Change | Add `openBottomSheet()` variant function that renders same content in a bottom-anchored container instead of centered overlay; existing `openModal()` unchanged for desktop |
| LOC impact | +60–80 CSS lines (`.bottom-sheet` class); +20 JS lines (new function); ~5 lines per converted modal call |
| Risk | Medium — modal content must reflow in narrower container |
| Rollback | Use `openModal()` instead of `openBottomSheet()` — 1-line revert per call |
| Mobile UX impact | Keyboard no longer obscures forms; dismissal via swipe-down is natural |
| Dependency | M2 (safe-area for bottom padding) |
| Prototype-first | YES — test sheet + keyboard interaction in Safari before wiring to modals |

**Implementation approach (lowest risk):**
- Do NOT modify `openModal()` — it is used ~40+ times and desktop must be unchanged
- Create new `openBottomSheet(title, body, foot)` function with identical signature
- Inside each target modal call, use: `if (isMobile()) openBottomSheet(...) else openModal(...)`
- `isMobile()` = `window.innerWidth < 900`

### M10 — Service Worker + App Shell Cache

| Field | Detail |
|---|---|
| Files | NEW `sw.js` at repo root; `index.html` — add SW registration script |
| Change | Service worker caches HTML + all `js/*.js` files at install; serves shell from cache; routes Supabase API calls network-first |
| LOC impact | ~60–80 lines (`sw.js`); +10 lines registration in `index.html` |
| Risk | Medium-High — SW registration bugs can break app load; stale cache is a silent failure mode |
| Rollback | Unregister SW (`navigator.serviceWorker.getRegistrations().then(r => r.forEach(s => s.unregister()))`) — or remove registration script and wait for existing SW to expire |
| Mobile UX impact | App loads instantly on revisit; resilient to showroom WiFi drops |
| Dependency | M3 (manifest.json) should exist first; HTTPS already enforced by Cloudflare Pages |
| Prototype-first | YES — test SW in Chrome DevTools Application tab before deploying |
| Michael action | None — but should be informed that after first deploy, a hard refresh may be needed to install the new SW |
| Cache versioning | MUST increment cache name on every deploy (e.g., `accentos-shell-v2`) or users get stale JS |

**Cache manifest (all js/*.js files + `/`):**
```
/ (index.html)
/js/vendors.js
/js/pipeline.js  
... (all 38 modules)
```

**Invalidation strategy:** Cloudflare Pages auto-assigns asset hashes — but since AccentOS uses non-hashed `js/*.js` filenames, the SW cache key must be versioned manually. Consider adding a `?v=YYYYMMDD` query param to all `<script src>` tags to bust SW cache on deploy.

### M11 — Pull-to-Refresh + Visibility Refresh

| Field | Detail |
|---|---|
| File | `index.html` — global JS section |
| Change | Add `touchstart/touchend` listener for pull-to-refresh (when `scrollY === 0` and drag distance > 80px); add `visibilitychange` listener to re-fetch current module data when foregrounded |
| LOC impact | +25–30 JS lines |
| Risk | Low-Medium — must not fire during scroll; must call the right hydration function for `curPage` |
| Rollback | Remove event listeners |
| Mobile UX impact | Natural mobile refresh; no wasted background polling; battery-safe |
| Dependency | Must map `curPage` values to their hydration functions (audit `hydrateFromSupabase()` to find per-module refresh calls) |

---

## PHASE 3 — COMMAND LAUNCHER + NOTIFICATIONS
**Estimated effort:** Multi-session  
**Risk level:** High  
**Prototype-first required:** YES for all items  
**Touches production shell:** Yes  
**Michael action required:** YES (VAPID setup, Supabase table for push subscriptions)

### M17 — FAB Command Launcher (Global Search Repurpose)

| Field | Detail |
|---|---|
| Files | `index.html` — `.qa-fab` CSS/HTML; `js/global_search.js` |
| Change | Repurpose existing QA FAB (currently Quick Actions) to open a bottom sheet with: (a) global search, (b) recent modules, (c) quick action shortcuts |
| LOC impact | +40–60 lines (new bottom sheet template); modifications to `js/quick_actions.js` + `js/global_search.js` integration |
| Risk | High — QA FAB is already wired; global_search.js is already wired; must not break either |
| Rollback | Restore original QA FAB behavior |
| Mobile UX impact | One-tap cross-module navigation; reduces 3-tap workflows to 2 interactions |
| Dependency | M9 (bottom sheet pattern established) must ship first |
| Prototype-first | YES — test in isolation before wiring to existing FAB |

### M16 — Push Notification Infrastructure

| Field | Detail |
|---|---|
| Files | NEW `sw.js` (extends M10 SW); `index.html` settings page; Cloudflare Worker (push dispatch); Supabase (new table) |
| Change | Full push pipeline: VAPID key generation, subscription storage, trigger points (coop deadlines, deal alerts), notification dispatch via Cloudflare Worker |
| LOC impact | +200–300 lines across multiple files |
| Risk | High — multi-system; requires Michael to install app first |
| Rollback | Disable push trigger endpoints in Cloudflare Worker |
| Mobile UX impact | Operational alerts delivered to lock screen; closes the "check AccentOS" cognitive loop |
| Dependency | M3 (manifest), M10 (service worker), Michael must install to home screen, VAPID keys |
| Michael action | YES — install app to home screen; grant notification permission; Supabase SQL for push_subscriptions table |

---

## PHASE 4 — OPERATIONAL INTELLIGENCE SURFACE
**Estimated effort:** Multi-session  
**Risk level:** Medium  
**Prototype-first required:** YES  

### Items deferred to Phase 4

- M15 — Swipe-to-reveal on list rows (Vendors, Pipeline, Quotes)
- Voice input for note creation (Web Speech API)
- Mobile-optimized KPI tiles (larger numbers, sparklines)
- Offline write queue (IndexedDB) if field-use demand confirmed

---

## DEPENDENCY CHAIN DIAGRAM

```
M1 (viewport-fit=cover)
  └─→ M2 (safe-area CSS)
        └─→ M7 (toast reposition)
        └─→ M8 (bottom tab nav) ← REQUIRES PROTOTYPE VALIDATION
              └─→ M9 (bottom sheets) ← REQUIRES PROTOTYPE VALIDATION
              └─→ M11 (pull-to-refresh + visibility refresh)

M3 (manifest.json)
  └─→ M4 (Apple meta tags)
  └─→ M10 (service worker) ← REQUIRES PROTOTYPE VALIDATION
        └─→ M16 (push notifications) ← REQUIRES MICHAEL ACTION

M5 (script defer) ← INDEPENDENT
M6 (mobile landing screen) ← DEPENDS ON M8 SHIPPING SAME SESSION
M13 (font-display swap) ← INDEPENDENT
M14 (will-change) ← INDEPENDENT, AFTER M8/M9
```

---

## SESSION-BY-SESSION DELIVERY PLAN

### Session A (Foundation — ~45 min)
- M1: viewport-fit=cover
- M2: Safe-area CSS
- M3: manifest.json (with placeholder icons)
- M4: Apple meta tags
- M5: Script defer audit + application
- M7: Toast reposition for future bottom nav
- M13: Font-display swap

**Deliverable:** App is installable to home screen. Safe-area layout correct. Faster FCP. Zero visible change on desktop.

### Session B (Navigation — ~60–90 min, requires prototype-first)
- M8: Bottom tab navigation
- M6: Mobile landing screen (ships same session as M8)
- M14: will-change on animated elements

**Deliverable:** iPhone users have bottom tab nav. Daily Brief is mobile home. Desktop unchanged.

### Session C (Touch Interactions — ~60 min, requires prototype-first)
- M9: Bottom sheet conversion (top 3 modals)
- M11: Pull-to-refresh + visibility refresh

**Deliverable:** Forms keyboard-safe. Natural mobile refresh behavior.

### Session D (Shell Resilience — ~60 min, requires prototype-first)
- M10: Service worker + app shell cache

**Deliverable:** App loads instantly on revisit. Resilient on showroom WiFi.

### Session E+ (Command + Notifications — multi-session)
- M17: FAB command launcher
- M16: Push notifications (requires Michael action first)

---

## ROLLBACK MATRIX

| Change | Rollback method | Time to rollback | Risk of rollback |
|---|---|---|---|
| M1 viewport-fit | Remove 1 word from meta tag | < 1 min | Zero |
| M2 safe-area CSS | Remove CSS block | < 2 min | Zero |
| M3 manifest.json | Delete file | < 1 min | Zero |
| M4 Apple meta tags | Remove 5 lines | < 1 min | Zero |
| M5 script defer | Remove `defer` attributes | < 5 min | Zero |
| M6 mobile landing | Remove conditional | < 2 min | Zero |
| M7 toast reposition | Remove media query block | < 2 min | Zero |
| M8 bottom nav | `display:none` bottom nav via CSS | < 1 min | Zero (sidebar still intact) |
| M9 bottom sheets | Change `openBottomSheet` → `openModal` at call sites | 5–10 min | Low |
| M10 service worker | Remove SW registration script; deploy | 5 min + propagation | Low (users need hard refresh) |
| M11 pull-to-refresh | Remove event listeners | < 5 min | Zero |
| M16 push | Disable Worker endpoint | < 2 min | Zero |
| M17 FAB launcher | Restore original QA FAB HTML | < 10 min | Low |

**Key design principle: every Phase 1 change is a pure addition with zero deletions. Rollback is always remove-the-addition.**
