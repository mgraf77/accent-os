# AccentOS Mobile / PWA Research
> **Status:** Research only — no implementation  
> **Branch:** `claude/research-mobile-pwa-Q6vYN`  
> **Date:** 2026-05-08  
> **Scope:** iPhone-first operational command-center patterns for AccentOS  
> **Device focus:** iPhone 13 Pro Max (Michael's primary device)

---

## TABLE OF CONTENTS

1. [iOS PWA Limitations — Hard Constraints](#1-ios-pwa-limitations--hard-constraints)
2. [iPhone 13 Pro Max Optimization Guidance](#2-iphone-13-pro-max-optimization-guidance)
3. [Dynamic Island / Notch Safe-Area Patterns](#3-dynamic-island--notch-safe-area-patterns)
4. [Thumb-Zone Operational UX](#4-thumb-zone-operational-ux)
5. [Mobile Command Launcher Patterns](#5-mobile-command-launcher-patterns)
6. [Bottom-Sheet Best Practices](#6-bottom-sheet-best-practices)
7. [Enterprise Operational Mobile UX References](#7-enterprise-operational-mobile-ux-references)
8. [Offline / PWA Considerations](#8-offline--pwa-considerations)
9. [Push Notification Considerations](#9-push-notification-considerations)
10. [Gesture-System Recommendations](#10-gesture-system-recommendations)
11. [Performance Considerations](#11-performance-considerations)
12. [Installability Best Practices](#12-installability-best-practices)
13. [Operational Density Recommendations](#13-operational-density-recommendations)
14. [Battery / Performance Tradeoffs](#14-battery--performance-tradeoffs)
15. [Recommended Future Mobile Architecture](#15-recommended-future-mobile-architecture)
16. [Risk Summary](#16-risk-summary)
17. [Recommended Next Research Prompt](#17-recommended-next-research-prompt)

---

## 1. iOS PWA Limitations — Hard Constraints

These are non-negotiable realities that shape every architecture decision. Do not design around them — design with them.

### What Works (as of iOS 16.4+ / Safari 18.x)

| Capability | Status |
|---|---|
| Standalone display mode (no Safari chrome) | ✅ Supported |
| Web Push Notifications (home-screen install only) | ✅ iOS 16.4+ |
| Declarative Web Push | ✅ Safari 18.4+ |
| Screen Wake Lock | ✅ Safari 18.4+ |
| Service Workers (caching, offline) | ✅ Supported |
| IndexedDB local storage | ✅ Supported |
| CSS `env()` safe-area insets | ✅ Supported |
| localStorage / sessionStorage | ✅ Supported |
| Web Share API | ✅ Supported |
| Geolocation | ✅ Supported |
| Camera / MediaDevices | ✅ Supported |

### What Does NOT Work on iOS PWA

| Capability | Status | Impact for AccentOS |
|---|---|---|
| Auto install prompt (`beforeinstallprompt`) | ❌ iOS never fires this | Must guide user manually through Safari Share → Add to Home Screen |
| Background Sync API | ❌ Not supported | No silent background data sync; must be user-triggered or use periodic fetch on foreground |
| Web Bluetooth | ❌ Apple policy block | N/A for AccentOS |
| Web NFC / WebUSB | ❌ Apple policy block | N/A for AccentOS |
| Push notifications in Safari browser tab | ❌ Home-screen PWA only | Users MUST install to home screen to receive push; in-browser tab gets nothing |
| EU push notifications (iOS 17.4+) | ❌ Disabled in EU | N/A (Wichita, KS — outside EU) |
| Storage persistence if app not used | ⚠️ Safari clears after ~weeks | Home screen install gets ~20% disk quota; mitigates but doesn't eliminate |
| Automatic data sync when backgrounded | ❌ iOS suspends | All fetches must complete while app is in foreground |

### Key Architectural Implication

AccentOS is a Cloudflare Pages–deployed single HTML file with Supabase as backend. This is already an ideal PWA architecture: small shell + remote data. The constraints above confirm:

- **Install-to-home-screen is critical** for any push notification feature.
- **No background sync** means data is always fresh on open — acceptable for an operational tool checked intentionally, not passively consumed.
- **Storage eviction risk** is mitigated by the fact that AccentOS is network-first (reads from Supabase) — cached data is a convenience, not the source of truth.

---

## 2. iPhone 13 Pro Max Optimization Guidance

### Device Specs (CSS layer)

| Property | Value |
|---|---|
| CSS viewport (portrait) | **428 × 926 px** |
| CSS viewport (landscape) | 926 × 428 px |
| Device Pixel Ratio | 3× (1284 × 2778 physical) |
| Screen diagonal | 6.7 inches |
| Notch type | Notch (not Dynamic Island — that starts iPhone 14 Pro) |

> **Note:** iPhone 13 Pro Max has the traditional notch, not the pill-shaped Dynamic Island. Dynamic Island appears on iPhone 14 Pro / 15 Pro and later. Design for notch safe-area now, and ensure the pattern also handles Dynamic Island for any future device upgrade.

### Key CSS Breakpoint

```css
/* Target iPhone 13 Pro Max portrait specifically */
@media only screen and (device-width: 428px) and (-webkit-device-pixel-ratio: 3) {
  /* iPhone 13 Pro Max tweaks */
}

/* Practical mobile breakpoint for AccentOS */
@media (max-width: 480px) {
  /* Mobile-optimized layout */
}
```

### Viewport Meta Tag (Required)

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

`viewport-fit=cover` is **mandatory** — without it, `env(safe-area-inset-*)` values are zero and content bleeds under the notch/home indicator.

### Portrait-First Layout Strategy

- 428px width means a generous mobile canvas — wider than most older iPhones
- 926px height = tall screen → vertical scroll is expected; long pages are fine
- Target a "usable viewport" of roughly **428 × ~780px** (accounting for notch ~50px + home indicator ~34px + browser chrome if not installed)
- When installed as home-screen PWA: full 428 × 926px with only safe-area insets to account for

---

## 3. Dynamic Island / Notch Safe-Area Patterns

### The Core Pattern

```css
/* Required on html or body */
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

For fixed/sticky headers and bottom navigation bars specifically:

```css
.app-header {
  padding-top: env(safe-area-inset-top);
  /* header's own padding is in addition to this */
  top: 0;
  position: sticky;
}

.bottom-nav {
  padding-bottom: env(safe-area-inset-bottom);
  /* On iPhone 13 Pro Max: ~34px for home indicator */
  /* On Dynamic Island models: same safe-area value covers the island */
}
```

### iPhone 13 Pro Max Inset Values

| Zone | Safe-area value (portrait) |
|---|---|
| Top (notch) | ~47px |
| Bottom (home indicator) | ~34px |
| Left / Right | 0px (portrait) |

### Dynamic Island (Future-Proofing)

The Dynamic Island is a pill-shaped cutout at the top center. The `safe-area-inset-top` value on Dynamic Island devices (~59px) is larger than notch models. The same CSS pattern handles both — no special case needed. The OS adjusts the reported inset value per device.

### Operational Implication

AccentOS currently has a fixed header with module navigation. This header will collide with the notch in standalone PWA mode unless `padding-top: env(safe-area-inset-top)` is applied. **This is the single highest-priority CSS fix** for any mobile improvement pass.

---

## 4. Thumb-Zone Operational UX

### The Zones (iPhone 13 Pro Max Portrait)

```
┌─────────────────┐  ← Top of screen (926px tall viewport)
│  ████ HARD ████ │  ← Top ~300px: stretch zone, high miss rate
│  ██ STRETCH ███ │
│                 │
│  ░░░░ GOOD ░░░░ │  ← Middle band: reachable with effort
│                 │
│  ████ EASY ████ │  ← Bottom ~400px: natural thumb landing zone
│  ████ EASY ████ │
│ [Home Indicator]│  ← env(safe-area-inset-bottom) ~34px
└─────────────────┘
```

- **Green zone (easy reach):** Bottom 40–50% of viewport — place primary actions here
- **Yellow zone (stretch):** Middle 30% — acceptable for secondary actions
- **Red zone (hard):** Top 20–30% — limit to static labels, titles, status only

### Key Principle for AccentOS

The current AccentOS sidebar navigation is top-anchored. On desktop this is fine. On mobile this means the primary navigation is in the **hardest reach zone**. This is the most critical UX inversion to fix.

### Recommended Action Layout

| Zone | What to put there |
|---|---|
| Bottom bar (fixed) | Primary module navigation tabs (5–6 max) |
| Bottom sheet trigger | Floating action button, bottom-right (thumb natural landing) |
| Screen center | Data tables, cards, content |
| Top bar | Title, search, status indicators — read-only or rarely tapped |

### One-Handed vs. Two-Handed Split

- 67% of mobile users hold phone in one hand (dominant hand, thumb operates)
- 33% use two-handed cradle
- AccentOS users (Michael in the field/showroom) likely predominantly one-handed
- Design primary workflow for **right-handed, one-handed, thumb-operated**

---

## 5. Mobile Command Launcher Patterns

### What a Mobile Command Launcher Is

A command launcher is a global shortcut surface — one tap opens a search/command input that can navigate anywhere, trigger any action, or surface any record. Native equivalent: iOS Spotlight. Desktop equivalent: `⌘K` palettes (Raycast, Linear, Notion).

On mobile, the trigger pattern replaces keyboard shortcuts with a **persistent floating button** or **bottom bar search field**.

### Pattern Options for AccentOS

#### Option A — Floating Action Button (FAB)
```
┌─────────────────────────┐
│  [Module Content Area]  │
│                         │
│                         │
│                       ⚡│ ← FAB, bottom-right, thumb-natural
└─────────────────────────┘
```
- Single tap opens a full-screen command sheet
- Lists: recent actions, module shortcuts, record search
- Best for: infrequent but high-value jumps
- Risk: hides behind content, can feel disconnected

#### Option B — Persistent Bottom Bar Search
```
┌─────────────────────────┐
│  [Content]              │
├─────────────────────────┤
│ 🔍 Search or command...  │ ← persistent, always visible
├─────────────────────────┤
│ 🏠  📋  💬  📦  ⚙️      │ ← nav tabs below
└─────────────────────────┘
```
- Always-visible input above the nav bar
- Searches across modules, triggers quick actions
- Best for: power users who navigate frequently
- Risk: takes permanent space; overkill for v1

#### Option C — Long-Press / 3D Touch Action Menu
- Long-press a nav icon to see recent items in that module
- Similar to iOS home screen "quick actions"
- Best for: reducing navigation depth (tap → land directly on a deal/vendor)
- Risk: discoverability; users must know to long-press

### Recommended for AccentOS v1 Mobile

**Option A (FAB)** is the right starting point. AccentOS has ~15 modules — the command launcher primarily solves "I want to go to [specific record] without drilling 2–3 taps." A FAB bottom-right opening a bottom-sheet command palette handles this with zero permanent screen cost.

Later, if usage data shows navigation is a friction point, graduate to Option B.

---

## 6. Bottom-Sheet Best Practices

### Why Bottom Sheets for Operational UX

Bottom sheets anchor to the bottom edge — they're launched from near the thumb zone and expand naturally upward. Engagement rates are 25–30% higher than centered modals on mobile (easier to dismiss, less disorienting).

### Three States (Required for Operational Use)

```
┌─────────────────────────┐
│  Full sheet (90vh)      │  ← Form entry, detail views, multi-step flows
├─────────────────────────┤
│  Mid sheet (50vh)       │  ← Quick actions, short lists, confirmation dialogs
├─────────────────────────┤
│  Peek (15vh)            │  ← Status strip, "drag up for more" affordance
└─────────────────────────┘
```

AccentOS currently uses `<dialog>` or centered modals for forms (quote creation, deal editing, etc.). Converting these to bottom sheets for mobile delivers:
- **Quicker access** — no reach to center of screen
- **Keyboard-safe** — bottom sheet + keyboard push-up is the native mobile pattern; centered modals often get obscured

### Implementation Approach (Pure CSS/JS, No Library)

```css
.bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--surface);
  border-radius: 16px 16px 0 0;
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
  transform: translateY(100%);
  transition: transform 0.3s ease;
  will-change: transform; /* GPU layer */
}

.bottom-sheet.open {
  transform: translateY(0);
}
```

Add a drag handle (`<div class="drag-handle">`) at the top. Use `touchstart`/`touchmove`/`touchend` for native-feeling swipe-to-dismiss.

### What To Put in Bottom Sheets for AccentOS

| Current Modal | Bottom Sheet Variant |
|---|---|
| New Quote form | Full sheet (90vh, scrollable) |
| Add Deal / Edit Deal | Full sheet |
| Quick vendor score update | Mid sheet (50vh) |
| Confirmation dialogs | Mid sheet with 2 big buttons |
| Record detail preview (read-only) | Mid sheet, drag to full |
| Error / success toasts | Peek (auto-dismiss, 3s) |

### Anti-Patterns to Avoid

- **Don't nest a bottom sheet inside a bottom sheet** — disorienting; use tab navigation inside a full sheet instead
- **Don't open keyboard inside a peek state** — force mid or full before keyboard trigger
- **Don't use bottom sheets for complex multi-column layouts** — single-column, vertical only

---

## 7. Enterprise Operational Mobile UX References

### Best-in-Class Reference Apps (Operational, Not Consumer)

| App | What it does well for ops |
|---|---|
| **Linear** (mobile) | Tab bar bottom nav, issue detail as bottom sheet, keyboard command palette, badge counts on tabs, fast search |
| **Notion** (mobile) | Sidebar slide-in from left, recent items in FAB, offline-aware UI state |
| **Asana** (mobile) | Tabbed nav + contextual drawers, progressive disclosure, role-aware views |
| **Shopify POS** | Operational density, hardware-bridged UX, scan-to-action, bottom bar quick actions |
| **ServiceNow mobile** | Task-centric workflow (not table-centric), exception routing, badge escalation |
| **Fieldwire / Procore** | Field-worker operational UX — large touch targets, glanceable status, single-thumb nav |

### The Core Principle All Share

> **Design around tasks, not tables.**  
> Don't show Michael "the Vendors table." Show him "3 vendors need scoring" and make the action one tap.

This is the operational-mobile north star: surface what requires attention, make the action frictionless, then get out of the way.

### Task-Centric vs. Table-Centric

| Table-centric (current AccentOS mobile) | Task-centric (target) |
|---|---|
| "Here is the Vendors list, filter/scroll" | "2 vendors with falling scores — tap to review" |
| "Navigate to Pipeline, find your deal" | "Deal at risk: Stonebridge — tap to see why" |
| "Go to Quotes, open the quote, find the line" | "Quote #47 pending approval — tap to act" |
| "Find the KPI page, scroll to revenue" | "Revenue KPI below target — tap for detail" |

AccentOS already has the Daily Brief as a task-surfacing layer. On mobile, the Daily Brief should be the **default first screen** — not the vendor list or any specific module.

---

## 8. Offline / PWA Considerations

### AccentOS Current Reality

AccentOS is network-dependent: all data lives in Supabase, all renders pull live data. There is no service worker. The app will show blank/broken if Supabase is unreachable.

### Risk Assessment

For AccentOS's use case (Wichita showroom, good connectivity, used during business hours), full offline support is a **low priority**. However, partial offline resilience is worth the investment:

| Offline investment | Priority | Effort |
|---|---|---|
| App shell caches so page loads instantly | High | Low |
| Last-viewed data readable offline | Medium | Medium |
| Write actions queue while offline | Low | High |

### Recommended Service Worker Strategy

#### Phase 1 — App Shell Cache (High value, low effort)

Cache the HTML, CSS, and JS bundle at install time so the app loads instantly even on slow connections. The actual data still requires network.

```js
// service-worker.js (minimal viable)
const SHELL = ['/', '/js/vendors.js', '/js/pipeline.js', /* etc */];

self.addEventListener('install', e => {
  e.waitUntil(caches.open('accentos-shell-v1').then(c => c.addAll(SHELL)));
});

self.addEventListener('fetch', e => {
  // Shell: cache-first; Supabase API: network-first
  if (e.request.url.includes('supabase.co')) {
    e.respondWith(fetch(e.request)); // always fresh from Supabase
  } else {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request))
    );
  }
});
```

#### Phase 2 — Stale-While-Revalidate for Read Data (Medium value)

For the Daily Brief tiles and KPI summaries, cache the last response. Show stale data immediately, update in background. Adds a "last synced" timestamp.

#### Phase 3 — Write Queue (Low priority for v1)

Queue mutations (score updates, note edits) in IndexedDB when offline, replay when connection returns. Complex — skip for now.

### Caching Strategy Map for AccentOS

| Resource | Strategy | Rationale |
|---|---|---|
| HTML/JS/CSS shell | Cache-first | Never changes at runtime |
| Supabase auth token | Network-first | Security-critical |
| Supabase data reads | Network-first w/ fallback | Need fresh ops data |
| Daily Brief KPIs | Stale-while-revalidate | Tolerable to show 5-min-old data |
| Static images / icons | Cache-first | No versioning needed |

---

## 9. Push Notification Considerations

### Current Capability (iOS 16.4+, outside EU)

- PWA **must be installed** to home screen
- `manifest.json` **must declare** `"display": "standalone"`
- Push permission prompt must be triggered by a **user gesture** (button tap) — no auto-prompt
- Once granted: notifications appear on lock screen, Notification Center, Apple Watch

### What This Unlocks for AccentOS

| Notification type | Value | Urgency |
|---|---|---|
| "Quote #51 needs approval (>$5K)" | High | Immediate |
| "3 coop deadlines this week" | High | Daily digest |
| "Vendor [X] score dropped below threshold" | Medium | Async |
| "Daily Brief ready" | Medium | Morning digest |
| "Deal at risk: no activity 14 days" | High | Async |
| "PO received — inventory updated" | Low | FYI |

### Implementation Requirements

1. Add `manifest.json` with `"display": "standalone"` (required)
2. Add Service Worker registration to `index.html`
3. Add VAPID key pair (Cloudflare Worker can host the push logic)
4. Add "Enable Notifications" button in Settings — must be user-initiated
5. Store push subscription in Supabase under `user_push_subscriptions` table
6. Trigger push events from Supabase Edge Functions or Cloudflare Workers

### Notification Design Principles for Ops

- **Actionable or silent.** If the notification doesn't require action, consider whether it should be a notification vs. a Daily Brief tile.
- **No notification spam.** Group related events (3 coop deadlines → one notification, not three).
- **Deep link on tap.** Tapping a notification must open AccentOS directly to the relevant record, not the homepage.
- **Quiet hours.** Respect system quiet hours. Don't send operational alerts outside business hours unless critical.

### Declarative Web Push (Safari 18.4+)

Safari 18.4 introduced Declarative Web Push — a simplified push API where the notification payload is self-contained in the push message, eliminating the need for a service worker to construct the notification. This reduces implementation complexity. Worth targeting as the primary implementation path since AccentOS users are on modern iPhones.

---

## 10. Gesture-System Recommendations

### iOS System Gestures to Avoid Conflict With

| System gesture | Region | What it does |
|---|---|---|
| Swipe up from bottom | Bottom edge | Home screen / app switcher |
| Swipe down from top-right | Top-right corner | Control Center |
| Swipe down from top-left | Top-left corner | Notification Center |
| Swipe left from left edge | Left 10px strip | Back navigation (in Safari) |

**Do not assign app gestures to these system regions.** Conflicts cause gesture hijack, which is disorienting and unresolvable by the app.

### Recommended Gesture Map for AccentOS Mobile

| Gesture | Action | Region |
|---|---|---|
| Swipe right (center screen) | Go back / close panel | Content area, not edges |
| Swipe down on bottom sheet | Dismiss sheet | Bottom sheet drag handle |
| Pull to refresh | Refresh current module data | Top of scrollable list |
| Long-press on nav icon | Show recent items in module | Bottom nav icons |
| Swipe left on list row | Reveal quick actions (e.g., edit, score) | Data table rows |
| Pinch (not recommended) | N/A — avoid for ops | — |
| Double-tap (use sparingly) | Expand / full-screen a card | Cards/tiles |

### Swipe-to-Reveal on List Rows (High Value)

For data-dense modules (Vendors, Pipeline, Quotes), swipe-left-to-reveal-actions is the highest-ROI mobile gesture. Instead of tapping a row → opening a modal → finding an action button, users swipe and see: [Edit] [Score] [Delete]. This reduces action latency from 3–4 taps to 2 interactions (swipe + tap action).

```
Before: tap row → modal opens → scroll to action → tap
After:  swipe left → tap [Score]
```

### Consistency Rule

If swipe-right means "back" on one screen, it must mean "back" everywhere. Inconsistent gesture mapping is the #1 gesture-system failure mode in mobile ops tools.

---

## 11. Performance Considerations

### Current AccentOS Profile

AccentOS loads ~6 external JS files (split from `index.html`). Each file is a module with its full DOM render function. All data fetches are sequential on tab activation. No bundler, no minification, no tree-shaking.

### Mobile Performance Budget (iPhone 13 Pro Max)

| Metric | Target | Current estimate |
|---|---|---|
| Time to interactive | < 2s on WiFi | ~2–3s (6 script loads + Supabase auth) |
| First contentful paint | < 1s | ~1s (HTML shell is small) |
| Supabase data round-trip | < 500ms | ~200–400ms (Wichita → us-east) |
| Tab switch (re-render) | < 100ms | ~50–150ms (depends on module) |
| Scroll frame rate | 60fps | Variable (complex table renders) |

### Key Performance Issues for Mobile

#### 1. Script Load Waterfall
Six `<script src>` tags load sequentially. On cellular, each adds latency. Fix: consolidate into fewer files or add `defer`/`async` appropriately.

#### 2. Synchronous DOM Re-Renders
Current render pattern: tab switch → `el.innerHTML = renderBigTable(data)`. On mobile, large innerHTML assignments cause jank. Fix: virtualized lists for tables > 50 rows (only render visible rows).

#### 3. No Animation Budget
Adding CSS transitions (bottom sheet slide, tab transitions) can cause dropped frames if running alongside JS data fetches. Fix: use `will-change: transform` on animated elements to promote to GPU layers; separate animation timing from data fetch timing.

#### 4. Font Loading
If system fonts are already used (likely), no issue. If loading Google Fonts or custom fonts — defer them or they block FCP.

### Mobile-Specific Optimizations Worth Implementing

| Optimization | Effort | Impact |
|---|---|---|
| `viewport-fit=cover` + safe-area CSS | Low | High (prevents layout breakage) |
| Service worker app shell cache | Medium | High (instant reloads) |
| `defer` on all non-critical scripts | Low | Medium (faster FCP) |
| `will-change: transform` on animated elements | Low | Medium (smooth sheets/transitions) |
| Virtual scroll for tables > 50 rows | High | High (for large datasets) |
| Image optimization (WebP icons/assets) | Low | Low (minimal images currently) |

---

## 12. Installability Best Practices

### Required Manifest Configuration

```json
{
  "name": "AccentOS",
  "short_name": "AccentOS",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f1117",
  "theme_color": "#0f1117",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

**Critical:** `"display": "standalone"` is required for:
- Eliminating the Safari URL bar (full-screen app experience)
- Enabling Web Push on iOS
- Enabling Screen Wake Lock

### Apple-Specific Meta Tags

```html
<!-- Required for iOS home screen app behavior -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="AccentOS">

<!-- Icon for iOS home screen (iOS uses apple-touch-icon, ignores manifest icons) -->
<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png">

<!-- Splash screen (iOS generates from icon + background_color if not specified) -->
```

### Manual Install UX (iOS has no auto-prompt)

Since iOS never fires `beforeinstallprompt`, the app must guide the user:

1. Show a persistent but dismissable install banner at first visit (not a modal)
2. Banner text: *"For the best experience, tap Share → Add to Home Screen"*  
3. Show a Safari Share icon graphic — users often don't know what to tap
4. Remember dismissal in localStorage; don't re-show for 30 days
5. Show again if the user visits 5+ times without installing

### Splash Screen Configuration

iOS auto-generates a splash screen from the `background_color` in the manifest + the `apple-touch-icon`. To avoid a generic white flash:
- Set `background_color` to match your app's dark background
- Provide a well-padded icon (safe zone: icon content within 80% of canvas, rest transparent)

---

## 13. Operational Density Recommendations

### The Density Problem

Consumer apps prioritize whitespace, large imagery, and breathing room. Operational tools must balance density (more data visible) with legibility and touch accuracy. The right density for AccentOS is **moderate-high** — not as sparse as a marketing site, not as packed as a Bloomberg terminal.

### Mobile Density Targets

| Element | Desktop | Mobile Target |
|---|---|---|
| Table row height | 40px | 56–64px (touch target) |
| Minimum tap target | N/A | 44×44px (Apple HIG minimum) |
| Font size body | 13–14px | 15–16px |
| Font size label/caption | 11px | 13px minimum |
| Padding inside cards | 12px | 16px |
| Icon size in nav | 18px | 24px |
| Line spacing | 1.4 | 1.5 |

### Information Hierarchy for Mobile Ops

Each screen should answer in order:
1. **What's the status?** (badge count, color indicator, last updated)
2. **What needs action?** (highlighted, in thumb zone)
3. **What's the context?** (secondary text, collapsed by default)

Avoid forcing the user to scroll to find the action. Status → Action → Context, top to bottom within the thumb zone.

### Card vs. Table Decision

| Data type | Mobile pattern | Why |
|---|---|---|
| ≤10 records with rich context | Cards | Shows more per record |
| 11–50 records, quick scan | Compact list (2-line) | Higher density |
| 50+ records | Virtualized compact list + search | Performance + usability |
| Single key metric + trend | KPI tile (large number, sparkline) | Glanceability |
| Comparison across vendors/deals | Horizontal scroll card row | Preserves structure |

### Daily Brief as Mobile Home

The Daily Brief is already the right pattern for mobile-first operational use. On mobile, it should:
- Default to "open" state on app load
- Show only tiles with non-zero counts (hide empty modules)
- Make each tile's tap area the full card, not just a small button
- Sort by urgency: deadlines first, then counts, then FYI

---

## 14. Battery / Performance Tradeoffs

### iOS Power Management Context

iOS aggressively suspends backgrounded apps and throttles CPU during extended background periods. For a PWA:
- All network requests are suspended when app backgrounds
- No background data refresh without Background Sync API (which iOS doesn't support)
- When foregrounded, app gets full performance budget immediately

### What Drains Battery in Web Apps

| Cause | Impact | AccentOS risk |
|---|---|---|
| Continuous polling (setInterval fetch) | High drain | Risk: any "live update" polling loops |
| CSS animations running constantly | Medium drain | Risk: loading spinners, animated tiles |
| JavaScript running on scroll (debounce needed) | Medium | Risk: scroll-heavy tables |
| Unoptimized images | Low-medium | Low risk (minimal images) |
| Supabase real-time WebSocket connections | Medium | Risk: if real-time subscriptions added |

### AccentOS-Specific Risks

1. **Polling loops:** If any module uses `setInterval` to auto-refresh data, this is the #1 battery drain. Switch to user-triggered refresh (pull-to-refresh) on mobile.
2. **Animated loading states:** Spinning indicators use GPU. Use a static skeleton screen instead for initial load.
3. **Real-time subscriptions:** Supabase offers real-time WebSockets. For a single-user operational tool, this is overkill — polling on focus (using `visibilitychange` event) is sufficient and cheaper.

### Battery-Efficient Patterns

```js
// Refresh data when user brings app to foreground (not on a timer)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    refreshCurrentModule(); // only when foregrounded
  }
});

// Pull-to-refresh instead of auto-polling
let startY = 0;
document.addEventListener('touchstart', e => startY = e.touches[0].clientY);
document.addEventListener('touchend', e => {
  if (e.changedTouches[0].clientY - startY > 80 && window.scrollY === 0) {
    refreshCurrentModule();
  }
});
```

### Screen Wake Lock (Safari 18.4+)

For operational scenarios where Michael is actively monitoring (e.g., watching a coop deadline clock, monitoring a quote approval), the Screen Wake Lock API prevents the screen from dimming:

```js
let wakeLock = null;
async function requestWakeLock() {
  wakeLock = await navigator.wakeLock.request('screen');
}
```

Use sparingly — only for active monitoring workflows. Always release the lock when the monitoring task completes.

---

## 15. Recommended Future Mobile Architecture

### Architecture Principles

1. **Mobile is a display layer, not a data layer.** Keep Supabase as source of truth. Mobile reads from Supabase; does not maintain its own data store beyond caching.
2. **Offline resilience = app shell only (Phase 1).** Instant load via service worker cache. Data still network-dependent.
3. **Touch is the primary input.** Redesign all interactive elements for 44×44px minimum, thumb-zone placement, and swipe-native patterns.
4. **The Daily Brief is the mobile home.** Not a module list. A task list.

### Recommended Architecture Sequence

#### Phase 1 — Mobile Foundation (Low effort, high ROI)
```
Priority: Ship before any new feature work
Changes:
- Add viewport-fit=cover to meta viewport
- Apply env(safe-area-inset-*) to header and bottom nav
- Add manifest.json with standalone display mode
- Add apple-touch-icon + apple meta tags
- Shift primary nav to bottom bar (5-6 tabs, thumb zone)
- Make Daily Brief the default landing screen
```

#### Phase 2 — Touch Interaction Upgrades (Medium effort)
```
Changes:
- Convert key modals to bottom sheets
- Add swipe-to-reveal on Vendor, Pipeline, Quote list rows
- Add pull-to-refresh to all data lists
- Add visibilitychange-triggered refresh
- Increase tap targets to 44px minimum across all interactive elements
- Add service worker with app shell cache
```

#### Phase 3 — Command Launcher + Notifications (High value, requires backend)
```
Changes:
- Add FAB command launcher with cross-module search
- Wire push notification system (manifest + SW + Supabase edge function + VAPID)
- Add "Enable Notifications" flow in Settings
- Build notification dispatch triggers (coop deadlines, deal risk, approval requests)
- Add deep-link routing so notification taps land on the correct record
```

#### Phase 4 — Operational Intelligence Surface (Strategic)
```
Changes:
- Mobile-optimized Daily Brief with badge escalation
- Swipe-based quick scoring for vendors/employees
- Voice input for note creation (Web Speech API — good iOS support)
- Offline write queue for score/note updates when on jobsite
```

### Navigation Architecture (Target)

```
┌─────────────────────────────────┐
│  [AccentOS header + safe-area]  │  ← status bar safe area
├─────────────────────────────────┤
│                                 │
│    [Active Module Content]      │  ← scrollable, full width
│                                 │
│                             [⚡]│  ← FAB command launcher (Phase 3)
├─────────────────────────────────┤
│  🏠   📋   💬   📦   ⚙️        │  ← bottom tab nav
├─────────────────────────────────┤
│  [env(safe-area-inset-bottom)]  │  ← home indicator padding
└─────────────────────────────────┘
```

### Tech Stack Compatibility

AccentOS's current stack is ideally suited for PWA mobile without framework changes:
- Cloudflare Pages → HTTPS auto-enforced → installability requirement met
- Single HTML entry point → service worker registration is one `<script>` addition
- Vanilla JS → no framework constraints on PWA integration
- Supabase → auth token stored in localStorage → persists across PWA sessions
- Wrangler/Worker proxy → can host VAPID push dispatch logic

No framework migration needed. Mobile improvements are additive to the existing architecture.

---

## 16. Risk Summary

### Biggest Mobile UX Risks (Ranked)

| Rank | Risk | Severity | Notes |
|---|---|---|---|
| 1 | **Content hidden under notch/home indicator** | Critical | `viewport-fit=cover` missing → top nav and bottom elements clipped. Breaks basic usability in standalone mode. |
| 2 | **Primary navigation in hard-reach zone** | High | Current top nav forces constant thumb overextension. Will fatigue user and slow workflow. |
| 3 | **No offline shell = blank screen on bad connection** | High | Showroom can have spotty WiFi. App showing blank on load is trust-destroying. |
| 4 | **Modals blocked by keyboard on mobile** | High | iOS keyboard pushes viewport up; centered modals get partially hidden. Bottom sheets fix this. |
| 5 | **No install guidance = no push notifications ever** | Medium | Push requires home-screen install. Without install prompting, Michael will never get operational alerts. |
| 6 | **Tap targets too small for field use** | Medium | Existing 30px-ish interactive elements are below Apple HIG minimum. Error rate rises with gloves, motion, or stress. |
| 7 | **Polling loops (if any) drain battery** | Medium | Any `setInterval` data fetch running on mobile background will cause battery warnings and possible iOS process kill. |
| 8 | **Table renders cause jank on scroll** | Low-Medium | AccentOS tables with 50+ rows will drop frames on mobile. Acceptable now, prioritize when dataset grows. |

---

## 17. Recommended Next Research Prompt

```
ACCENTOS MOBILE IMPLEMENTATION PLANNING — SPOKE SESSION

You are a specialized spoke session. Research only. No implementation. No production changes.

Context:
- AccentOS is a Cloudflare Pages PWA (single index.html + external JS files) with Supabase backend
- Primary user: Michael Graf, iPhone 13 Pro Max, used in showroom + field
- Current stack: vanilla JS, no bundler, no framework
- Research brief completed: docs/research/ACCENTOS_MOBILE_PWA_RESEARCH.md

Objective:
Produce a concrete, ordered MOBILE IMPLEMENTATION PLAN that maps the Phase 1 + Phase 2 
recommendations from the research doc into specific AccentOS code changes.

For each change, specify:
1. Exact file(s) to modify (index.html, which js/*.js file, new manifest.json, etc.)
2. Approximate lines of code required
3. Dependencies (what must be done first)
4. Whether it requires a Michael action (SQL run, settings change, etc.)
5. Estimated session effort (< 30min / 30–60min / multi-session)

Focus areas to plan:
- manifest.json creation
- Apple PWA meta tags
- viewport-fit=cover + safe-area CSS
- Bottom tab navigation replacing current sidebar
- Daily Brief as default landing screen on mobile
- Bottom sheet conversion for top 3 highest-use modals
- Service worker app shell cache
- Pull-to-refresh pattern
- visibilitychange refresh trigger

Output: A BUILD_PLAN-style checklist with implementation sequencing.
No code. Planning only.
```

---

*Research compiled from: Apple Developer Documentation, MDN Web Docs, Nielsen Norman Group, Smashing Magazine, web.dev, CSS-Tricks, firt.dev, and 2025–2026 PWA implementation guides. All findings cross-referenced against AccentOS's known architecture (Cloudflare Pages + Supabase + vanilla JS single-file app).*
