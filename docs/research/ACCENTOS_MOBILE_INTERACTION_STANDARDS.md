# AccentOS Mobile Interaction Standards
> **Status:** Specification only — mobile interaction constitution  
> **Date:** 2026-05-08  
> **Authority:** All mobile interactive elements must conform to these standards.  
> **Relationship to other docs:** This document defines HOW interactions work. OPERATIONAL_PRINCIPLES defines WHY.

---

## 1. GESTURE RULES

### 1.1 Reserved System Gestures (Do Not Override)

These iOS system gestures must never be captured or suppressed by AccentOS:

| Gesture | Zone | System action |
|---|---|---|
| Swipe up from bottom edge | Bottom 20px | Home screen |
| Swipe up from bottom (hold) | Bottom 20px | App switcher |
| Swipe down from top-right | Top-right 44px | Control Center |
| Swipe down from top-left | Top-left 44px | Notification Center |
| Swipe left from left edge | Left 10px | Safari back navigation |

**Rule: AccentOS gesture regions must not overlap these zones.**

The bottom tab nav must not extend into the system swipe-up zone. The bottom nav sits above `env(safe-area-inset-bottom)` — the home indicator area is system territory.

### 1.2 AccentOS Gesture Assignments

| Gesture | Region | Action | Consistency requirement |
|---|---|---|---|
| Swipe down on drag handle | Bottom sheet drag handle | Dismiss sheet | Must work the same on every sheet |
| Swipe left on list row | Table row (horizontal) | Reveal quick actions (Edit, Delete) | Same distance/reveal on all implementing lists |
| Pull down (when at top of scroll) | Content area, `scrollY === 0` | Refresh current module data | Same visual indicator on all implementing modules |
| Long-press on bottom nav icon | Bottom nav icon | (Phase 3) Show recent items | Consistent across all tabs |
| Swipe right (content area) | NOT implemented in Phase 1/2 | — | Deferred; avoid conflicting with future back-nav |

### 1.3 Gesture Conflict Rules

- **No gesture may have different effects on different screens.** Swipe-left on a list row always reveals quick actions. If a module uses swipe-left for something else, it must NOT.
- **Horizontal gestures are for row-level actions.** Vertical gestures are for navigation and refresh.
- **Do not implement pinch, double-tap, or multi-finger gestures in Phase 1–3.** Complexity/discoverability tradeoff is not justified for an operational tool.

### 1.4 Touch Event Implementation Standard

Use `touchstart` + `touchend` for swipe detection. Do not use `touchmove` for AccentOS gestures (reserved for native scroll). Do not use `pointer` events as the primary gesture API on mobile.

```js
// Standard pattern for swipe gesture detection:
// - Record startX/startY on touchstart
// - Calculate delta on touchend
// - Apply action only if delta exceeds threshold (e.g., 60px horizontal)
// - Apply action only if the gesture was predominantly in the intended direction
//   (abs(deltaX) > abs(deltaY) * 1.5 for horizontal swipes)
```

Minimum swipe distance: **60px** (prevents accidental triggers from tap imprecision).  
Direction dominance ratio: **1.5×** (horizontal swipe must be 1.5× more horizontal than vertical).

---

## 2. TAP TARGET RULES

### 2.1 Minimum Sizes — Non-Negotiable

| Element type | Minimum tap target | Notes |
|---|---|---|
| Bottom nav tab | 44×60px minimum | Taller is better; full nav height counts |
| Primary action button | 44×44px | "New Deal", "Save", "Score Vendor" |
| Secondary action button | 44×36px | Less critical; still 44px wide |
| List row (tap to open) | Full row width × 52px tall | Entire row is the tap target |
| Quick-action item (swipe reveal) | 64×full row height | Must be easy to tap while holding swipe |
| Form input field | 44px height minimum | Text inputs must be finger-height |
| Close/dismiss button | 44×44px | Never a 20px ×  |
| Checkbox / radio | 44×44px touch area | Visual may be smaller; touch area is padded |

**Enforcement:** Any element that cannot meet minimum size due to layout constraints must have its touch area expanded via `padding` or `::before`/`::after` pseudo-elements with `content: ''` and explicit hit-area sizing. The visual footprint may remain small; the tap target must not.

### 2.2 Spacing Between Targets

Adjacent tap targets must have at least **8px** of non-interactive space between them to prevent accidental double-taps. Exception: bottom nav tabs may be adjacent without gaps (full-width row divided by tab count).

### 2.3 Interactive Element Labeling

Every interactive element must have visible text OR an icon with visible context. No icon-only buttons without a tooltip or visible label in an operational context. Exception: widely-understood universal icons (×, +, ✓) in a clear spatial context.

---

## 3. BOTTOM SHEET RULES

### 3.1 Sheet Anatomy Standards

Every bottom sheet must have:
```
┌──────────────────────────────────┐
│  ████ DRAG HANDLE ████           │  ← 32px wide, 4px tall, centered, 12px margin-top
│                                  │
│  Sheet Title (16px, weight 600)  │  ← Left-aligned, 20px padding-horizontal
├──────────────────────────────────┤
│                                  │
│  [SCROLLABLE CONTENT AREA]       │  ← overflow-y: auto; -webkit-overflow-scrolling: touch
│                                  │
├──────────────────────────────────┤
│  [FOOTER ACTIONS]                │  ← Sticky at bottom; padding includes safe-area-inset-bottom
└──────────────────────────────────┘
```

### 3.2 Sheet Height Standards

| Sheet type | Height | When to use |
|---|---|---|
| Peek | `env(safe-area-inset-bottom) + 80px` | Status strips, confirmation prompts |
| Mid | `50vh` | Quick actions, short confirmations, score updates |
| Full | `90vh` | Multi-field forms (deal edit, quote, customer) |
| Content-adaptive | `min-content, max 70vh` | Short lists, 2–3 field forms |

Rules:
- Never taller than `90vh` — 10% of screen must remain visible as context
- Always at least `150px` tall — below this, content is not usable
- Full-height sheets must be scrollable internally — never use `overflow: hidden` on the content area

### 3.3 Sheet Open/Close Timing

| Transition | Duration | Easing |
|---|---|---|
| Sheet open | 250ms | `cubic-bezier(0.32, 0.72, 0, 1)` (fast-out, slow-in; feels native) |
| Sheet close (button) | 200ms | `ease-in` |
| Sheet close (swipe) | Velocity-matched | Duration derived from swipe velocity; minimum 150ms |
| Scrim fade in | 200ms | `ease` |
| Scrim fade out | 200ms | `ease` |

### 3.4 Sheet Nesting Rule

**No nested bottom sheets.** If content inside a sheet requires a secondary selection surface, use:
- A tab bar inside the sheet (switch between sections)
- An inline expansion (expand a section within the sheet)
- A full-page navigation (close sheet, go to new module) — for complex workflows only

### 3.5 Sheet Keyboard Rule

When a bottom sheet contains input fields and the iOS keyboard appears:
- The sheet must scroll its internal content so the focused field is above the keyboard
- The sheet itself must NOT resize (avoid `window.innerHeight` recalculations that cause jank)
- Use `scroll-padding-bottom` on the sheet's scroll container to ensure last fields are accessible

### 3.6 Sheet Footer Rule

The footer (action buttons) must:
- Be `position: sticky; bottom: 0`
- Include `padding-bottom: calc(16px + env(safe-area-inset-bottom))`
- Never scroll away — always accessible without scrolling

Primary action (Save, Confirm) is always the rightmost/bottom button, styled with `btn-accent`. Secondary action (Cancel, Close) is always to its left/above, styled with `btn-outline`.

---

## 4. BOTTOM NAVIGATION RULES

### 4.1 Tab Count

**Fixed at 5 tabs.** No more, no fewer.

Rationale: 4 tabs wastes the screen width on a 428px device; 6 tabs makes tap targets too narrow (428px ÷ 6 = 71px, acceptable but tight for gloved or imprecise tapping).

Tab layout: `Home` | `Pipeline` | `Quotes` | `Vendors` | `More`

### 4.2 Tab Structure Standards

Each tab must contain:
- An icon (24px, centered horizontally)
- A label (10px, centered below icon, uppercase, font-weight 600)
- A badge count (optional, top-right of icon, ≤ 2 digits)
- An active indicator (accent color underline or background fill — consistent across all tabs)

Minimum height: **60px** (icon 24px + label 10px + spacing).

### 4.3 Active State Rules

- Only one tab is active at a time
- Active state is updated every time `goTo()` is called
- When the active page is not one of the 4 primary tabs: the "More" tab appears in a subtle active/selected state
- Active tab uses `var(--accent)` color (`#ed1c24`)
- Inactive tabs use `var(--text-3)` (`#999`)

### 4.4 Badge Rules

Badge counts on nav tabs mirror Daily Brief urgency:
- Red badge: immediate action (overdue/today)
- Yellow badge: upcoming (this week)
- No badge: nothing pending

Badge counts must be live-updated whenever `goTo('dashboard')` re-renders (Daily Brief is the source of truth for urgency counts).

### 4.5 "More" Tab Behavior

Tapping "More" triggers `sidebar.classList.add('mobile-open')` — re-using the existing offcanvas sidebar mechanism. This requires zero changes to the sidebar HTML. The "More" tap is a `document.getElementById('sb').classList.add('mobile-open')` call — one line.

The overlay that closes the sidebar on outside tap already exists (`#overlay`-adjacent behavior) — verify this works correctly in the prototype.

### 4.6 Tab Transition Rule

Tab switching does NOT animate the content area. `goTo()` replaces `pg-content` innerHTML immediately. The tab icon/label transition uses a 150ms color change only — no content slide animations between modules.

Rationale: content slide animations require knowing the direction of navigation (forward/back), which AccentOS does not model. Instant content swap is clearer for operational use where navigation is non-linear.

---

## 5. THUMB-ZONE RULES

(Consolidated from OPERATIONAL_PRINCIPLES — these are the standards, not the philosophy.)

### 5.1 Zone Assignments

| Zone | Screen region (portrait, 926px height) | Rule |
|---|---|---|
| Primary action zone | Bottom 40% (y > 556px) | All primary CTAs, nav tabs, save buttons, FAB |
| Secondary action zone | Middle 30% (y 278–556px) | Secondary actions, filters, module sub-tabs |
| Read-only zone | Top 30% (y < 278px) | Titles, status indicators, breadcrumbs — NO primary actions |

### 5.2 Grip-Shift Test Enforcement

Before any interactive element is placed in the top 30%, document the explicit justification. Acceptable exceptions:
- Search/filter inputs (typed, not tapped frequently)
- "Go back" navigation (used rarely; secondary interaction)
- User profile / settings icon (used rarely)

Unacceptable exceptions:
- "New Quote", "Add Deal", "Save", or any primary CTA

---

## 6. HAPTIC FEEDBACK PHILOSOPHY

### Current Capability

AccentOS currently has no haptic feedback. The Web Vibration API exists but:
- Is NOT supported on iOS Safari (Apple does not expose it to web)
- Is supported on Android Chrome

**Decision: Do not implement haptic feedback for Phase 1–3.** iOS users cannot benefit from it. Adding Android-only haptics creates feature parity divergence with no operational benefit for AccentOS's iOS-primary user base.

Future consideration: if AccentOS adds a native app wrapper (Capacitor/Tauri), haptics become viable.

---

## 7. LOADING STATE BEHAVIOR

### 7.1 Loading State Standards

| Scenario | Behavior | Duration threshold |
|---|---|---|
| Module navigation (no data needed) | Immediate render, no loading state | — |
| Module data fetch (Supabase) | Show skeleton/placeholder immediately; replace with data when available | Show skeleton within 100ms of navigation |
| Save action (Supabase write) | Disable save button immediately; show spinner in button; re-enable on response | Show spinner within 50ms of tap |
| Pull-to-refresh | Show animated refresh indicator at top of content | Show within 100ms of gesture complete |
| App initial load (first visit) | Progress state is implicit (Safari address bar loading indicator) | Cannot customize |

### 7.2 Loading State Visual Standard

For module data fetch loading states:
```
Skeleton pattern: grey rectangles replacing where data will appear
  - Row height: same as real row (52–64px)
  - Content placeholders: 60%, 40%, 80% width rounded rects
  - Animation: subtle opacity pulse (0.6→1.0→0.6, 1.5s loop)
  - Color: var(--border) (#e8e8e4)
```

No spinning circles for module loading. Spinning circles are reserved for button-level loading states (save, delete actions).

### 7.3 Error State Standard

When a Supabase fetch fails:

```
[Module Title]
─────────────────────────────────
Unable to load [module name].

Pull down to retry.
─────────────────────────────────
```

Never: raw error messages, JS stack traces, `undefined` values, blank content area.

Always: a retry path (pull-to-refresh triggers retry).

---

## 8. PULL-TO-REFRESH BEHAVIOR

### 8.1 Trigger Conditions

Pull-to-refresh fires only when ALL of the following are true:
1. User is at `scrollY === 0` (top of the page)
2. Touch drag distance > 80px downward
3. Drag was vertical (deltaY > deltaX × 1.5)
4. Not already loading (debounce: ignore if last refresh was < 3 seconds ago)

### 8.2 Visual Feedback Sequence

1. User begins drag past 40px → show pull-to-refresh indicator (arrow or loading icon) at top of content
2. User reaches 80px threshold → indicator "locks" (visual snap; arrow rotates or indicator changes)
3. User releases → indicator starts spinning; data fetch begins
4. Data arrives → indicator fades out; content updates; toast "Updated" appears briefly
5. Fetch fails → indicator fades out; error empty state appears; "Unable to refresh" toast

### 8.3 What Refreshes

Pull-to-refresh calls the current module's data reload function, not `hydrateFromSupabase()` (full reload). Each module exposes a named refresh function that re-fetches only its own data.

Fallback if module has no explicit refresh function: call `goTo(curPage)` which re-renders the module (re-fetches via its own load path).

---

## 9. INTERRUPTION RECOVERY BEHAVIOR

### 9.1 App Foreground Recovery

When AccentOS returns to foreground after being backgrounded:

```
visibilitychange → document.visibilityState === 'visible'
  → if time since last data load > 5 minutes:
    → silently refresh current module data
    → show "Updated" toast only if data changed (optional; check timestamp)
  → if time since last data load < 5 minutes:
    → do nothing (data is fresh enough)
```

"Time since last data load" tracked via `localStorage.setItem('lastHydrate', Date.now())` after each successful `hydrateFromSupabase()` call.

### 9.2 Mid-Session Module Return

If Michael navigates away from a module with an open form/modal, then returns:
- If bottom sheet was open: it will be closed (sheet state not persisted across navigation) → acceptable
- If a form was partially filled: data is lost unless explicitly auto-saved to `localStorage`

**Auto-save requirement:** Any form that takes > 30 seconds to complete must auto-save partial state to `localStorage`. Minimum: Quote Generator. Recommended: Deal edit form.

Auto-save key format: `accentos_draft_[formType]` (e.g., `accentos_draft_quote`, `accentos_draft_deal`).

### 9.3 Memory Purge Recovery

When iOS purges AccentOS's memory and the user returns:
- App reloads from scratch (same as cold load)
- Service worker shell cache ensures fast reload
- `localStorage` draft data restores any in-progress forms
- Last-active module: `localStorage.getItem('lastPage')` → restored via `goTo(lastPage)` on load

Track last page: `localStorage.setItem('lastPage', curPage)` inside `goTo()`. This adds 1 line to `goTo()`.

---

## 10. MOBILE NOTIFICATION INTERACTION RULES

*(Applies when push notifications are implemented in Phase 3.)*

### 10.1 Notification Types

| Type | Use case | Notification format |
|---|---|---|
| Immediate action | Coop deadline today, quote approval needed | Title + short body + deep link |
| Daily digest | Daily Brief summary | Scheduled morning delivery, single notification |
| Alert | Deal at risk, vendor score drop | Title + entity name + deep link |
| FYI | PO received, inventory updated | Silent badge update only (no alert sound) |

### 10.2 Deep Link Behavior

All notification taps must deep-link to the specific record, not the home screen. Implementation: the notification `data` payload includes `{page: 'pipeline', id: 'deal_uuid'}`. When the SW receives a notification click, it calls `clients.openWindow('/?page=pipeline&id=deal_uuid')`. AccentOS `init()` reads the URL params on load and calls `goTo(page)` with optional detail open.

### 10.3 Notification Budget

| Type | Frequency | Max per day |
|---|---|---|
| Immediate action | As events occur | Unlimited (but group if > 3 same type) |
| Daily digest | Once per morning | 1 |
| Alerts | As events occur | Max 5/day before grouping into a digest |
| FYI | Silent badge only | Not notified |

No notification may fire between 6:00 PM and 7:30 AM (respect showroom operating hours).

### 10.4 Notification Permission UI Rule

The permission request must:
- Be triggered only by an explicit user action (Settings → Enable Notifications → tap "Allow")
- Show a pre-prompt explaining what types of notifications will be sent
- Never be shown on first app open or without user initiation
- If denied: show guidance to re-enable via iOS Settings; never re-prompt automatically
