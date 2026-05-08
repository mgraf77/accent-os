# AccentOS Mobile Performance Budget
> **Status:** Specification only  
> **Date:** 2026-05-08  
> **Device baseline:** iPhone 13 Pro Max, Safari, iOS 17+  
> **Network baselines:** Showroom WiFi (50–150 Mbps, low latency) | Cellular LTE (10–50 Mbps, 50–100ms RTT)  
> **Priority:** Operational responsiveness. Not benchmark vanity.

---

## PHILOSOPHY

Performance budgets exist to force honest tradeoffs. They are not aspirational — they are commitments. If a proposed change violates a budget, either the change is redesigned or the budget is explicitly renegotiated with documented justification.

For AccentOS, the performance that matters is:
- **Time until Michael can tap a module and see data** (interaction readiness)
- **Time until an action is confirmed** (feedback latency)
- **Smoothness of navigation and animation** (frame integrity)
- **Resilience when connectivity degrades** (graceful fallback)

Vanity metrics (Lighthouse score, total byte size) are secondary to these operational outcomes.

---

## 1. LOAD PERFORMANCE BUDGETS

### 1.1 Time to Interactive (TTI) — Hard Budget

| Network | Budget | Rationale |
|---|---|---|
| Showroom WiFi (warm cache) | **< 800ms** | Service worker cache hit — shell loads instantly |
| Showroom WiFi (cold load) | **< 2,000ms** | First visit or post-SW-update cold load |
| LTE cellular (warm cache) | **< 1,200ms** | Cache hit but cellular auth roundtrip |
| LTE cellular (cold load) | **< 3,500ms** | First visit, all 38 JS modules, Supabase auth |
| Spotty WiFi (2–5 Mbps) | **< 5,000ms** | Degraded but functional |

If cold-load TTI on WiFi exceeds 2,000ms post-optimization: audit whether `defer` was applied to all JS modules; audit whether Google Fonts is still render-blocking.

### 1.2 First Contentful Paint (FCP) — Hard Budget

| Network | Budget |
|---|---|
| Any network (shell from cache) | **< 400ms** |
| Any network (no cache) | **< 1,200ms** |

FCP measures when any content is visible — the app shell must paint before JS finishes. This is why `defer` on all `<script src>` tags is Session A work, not optional.

### 1.3 Supabase Data Round-Trip — Informational Budget

| Operation | Budget | Notes |
|---|---|---|
| Auth token validation | < 300ms | Session resume on app open |
| Single table read (< 200 rows) | < 400ms | Individual module load |
| `hydrateFromSupabase()` full load | < 3,000ms | All 27 sbLoad* calls on login |
| Single row upsert (save action) | < 500ms | User-initiated save |

These are informational (network-dependent, not controllable by AccentOS code). They define the realistic data-available time that performance budgets must account for.

---

## 2. INTERACTION LATENCY BUDGETS

### 2.1 Navigation Response — Hard Budget

| Interaction | Budget | Failure mode |
|---|---|---|
| Tab tap → module content begins rendering | **< 100ms** | Navigation feels broken/unresponsive |
| Tab tap → module content fully rendered (no data needed) | **< 200ms** | Acceptable jank |
| Tab tap → data fetch begins | **< 100ms** | Loading state visible immediately |
| Bottom sheet open animation complete | **< 250ms** | Unnatural delay |
| Bottom sheet dismiss animation complete | **< 200ms** | |
| Modal/sheet → keyboard visible | **< 300ms** | iOS-controlled; cannot be improved |

The `goTo()` function currently calls `$('pg-content').innerHTML = ''` then dispatches to a render function. This must complete within 100ms before any data fetch begins. On mobile, large `innerHTML` assignments can cause frame drops — audit any render function that sets innerHTML > ~2KB of HTML before calling Supabase.

### 2.2 Action Feedback — Hard Budget

| Action | Budget | Notes |
|---|---|---|
| Button tap → visual press state | **< 50ms** | CSS `:active` — should be instant |
| Save action → toast appears | **< 600ms** | Network roundtrip + render |
| Form submit → success/error state | **< 1,000ms** | Longer Supabase calls must show loading state |
| Swipe-to-dismiss → sheet gone | **< 200ms** | Dismissal must feel immediate |
| Pull-to-refresh → loading indicator | **< 100ms** | Indicator must appear before data arrives |

### 2.3 Scroll Performance — Hard Budget

| Scenario | Budget |
|---|---|
| Vendor list scroll (< 50 rows) | **60fps** — no dropped frames |
| Vendor list scroll (50–200 rows) | **≥ 45fps** — occasional frames acceptable |
| Pipeline column scroll | **60fps** |
| Sheet internal content scroll | **60fps** |
| Page-level scroll (Daily Brief) | **60fps** |

If any list drops below 45fps during scroll: the render function is doing too much work per frame. Either reduce innerHTML size, virtualize the list, or move work to `requestAnimationFrame`. No premature optimization — only act when the budget is violated.

---

## 3. BUNDLE SIZE BUDGETS

### 3.1 Per-Change Growth Budget

Each mobile feature addition must stay within these size budgets:

| Addition | Budget | Notes |
|---|---|---|
| Phase 1 meta/manifest changes | 0 runtime JS overhead | Static files only |
| Safe-area CSS additions | **< 500 bytes** CSS | A few dozen lines |
| Bottom nav HTML + CSS | **< 3KB** HTML/CSS | Structural + styling |
| Bottom nav JS | **< 1KB** JS | Minimal — just calls goTo() |
| Bottom sheet CSS | **< 3KB** CSS | Animation + layout |
| Bottom sheet JS (`openBottomSheet()`) | **< 2KB** JS | Open/close/swipe logic |
| Service worker (`sw.js`) | **< 5KB** | Caching logic only |
| `manifest.json` | **< 1KB** | Static |
| Install banner (HTML + CSS + JS) | **< 2KB** total | |
| Pull-to-refresh logic | **< 500 bytes** JS | Touch event math |

**Total mobile feature overhead budget: < 20KB additional JavaScript and CSS.**

This is a ceiling — actual additions should be significantly less. AccentOS is already ~7,169 lines of HTML/inline CSS/JS. Adding 20KB of mobile code is a ~5% increase — acceptable.

### 3.2 Service Worker Cache Budget

| Cache bucket | Size budget | Rationale |
|---|---|---|
| `index.html` | ~200KB (gzipped: ~60KB) | Main shell |
| Each `js/*.js` module | Average 15–30KB each; **38 modules × 25KB avg = ~950KB** | Module files |
| Total shell cache | **< 2MB** uncompressed | iOS evicts at 20% of disk; 2MB is safe |
| Supabase API responses (NOT cached) | Not cached in SW | Always network-fresh |
| Icons/images | < 200KB | Minimal image use |

**Total service worker cache budget: < 2.5MB uncompressed.**

If adding new `js/*.js` modules causes cache to exceed 2.5MB: cache only the 10 most frequently accessed modules + `index.html`. Log cache miss to console; module loads from network on miss.

---

## 4. DOM DENSITY BUDGETS

### 4.1 Module Render Complexity

These budgets define how complex a rendered module page may be:

| Metric | Budget | Notes |
|---|---|---|
| Total DOM nodes per module page | **< 1,500** | Exceeding causes GC pressure on mobile |
| Table rows visible at one time | **< 100 rows without virtualization** | Beyond 100: implement load-more or virtualization |
| Nested shadow DOM depth | **< 8 levels** | Deep nesting slows style recalc |
| Active CSS animations simultaneously | **< 3** | More than 3 running simultaneously = battery drain |
| `setTimeout`/`setInterval` active at once | **< 5** | Audit at session end for runaway timers |

### 4.2 Mobile-Specific Render Budget

On mobile, `innerHTML` assignment is more expensive than on desktop. Render functions that produce large HTML strings must stay within these budgets:

| Operation | Budget |
|---|---|
| Single `innerHTML` assignment | **< 500 DOM nodes created** |
| Table with inline rendering | **< 100 rows before pagination/virtual scroll** |
| `goTo()` → full module render (no data) | **< 16ms** (one frame at 60fps) |
| `goTo()` → full module render (with data) | **< 50ms** before data arrives |

---

## 5. ANIMATION COMPLEXITY BUDGETS

### 5.1 Permitted Animations

Only these animation types are permitted in AccentOS mobile. No exceptions without documented justification.

| Animation | Max duration | GPU-composited? | Notes |
|---|---|---|---|
| Bottom sheet slide in | 250ms | Yes (`transform: translateY`) | `will-change: transform` required |
| Bottom sheet slide out (dismiss) | 200ms | Yes | |
| Bottom nav tab active indicator | 150ms | Yes (opacity/transform) | |
| Toast slide in | 200ms | Yes | |
| Scrim/overlay fade | 200ms | Yes (opacity) | |
| Modal open (existing) | 200ms | Yes | |

### 5.2 Prohibited Animations

| Animation type | Reason |
|---|---|
| `box-shadow` transitions | Forces paint layer; cannot be GPU-composited |
| `width`/`height` transitions | Forces layout recalculation; causes jank |
| Continuous loop animations (spinners) | Except during active loading; must stop when load completes |
| Parallax scroll effects | Paint-heavy; no operational value |
| Entrance animations on list items | Multiplies paint cost by row count |

### 5.3 Animation Budget Enforcement

Before adding any new animation to mobile:
1. Confirm it uses only `transform` and/or `opacity` (the two GPU-compositable properties)
2. Add `will-change: transform` to the animated element
3. Confirm duration ≤ 250ms
4. Test at 60fps in Safari DevTools timeline

---

## 6. MEMORY USAGE BUDGETS

### 6.1 JS Heap Budget

| Condition | Budget | Alert threshold |
|---|---|---|
| App load (pre-data) | < 30MB heap | |
| After `hydrateFromSupabase()` | < 80MB heap | |
| After 1 hour of active use | < 120MB heap | |
| After 3 hours of active use | < 150MB heap | Recommend refresh above this |

These are measured in Chrome DevTools Memory panel (Safari does not expose heap size directly; use Chrome on desktop as proxy).

### 6.2 Memory Leak Indicators

If heap grows by > 5MB per module navigation without stabilizing: there is a memory leak. Likely causes:
- Event listeners added in render functions without cleanup
- Global arrays appended on every navigation (globals that should reset)
- Chat history (`CHAT` array) growing unbounded

Action: cap arrays at defined maximums; audit render functions for listener cleanup.

---

## 7. OFFLINE CACHE PERFORMANCE BUDGETS

| Scenario | Budget | Notes |
|---|---|---|
| App shell load from cache | **< 400ms** | Must be faster than cold network load |
| Time to show "offline" empty state | **< 200ms after network failure detected** | Empty state immediately on failed Supabase fetch |
| Cache install on first SW registration | **< 5 seconds** | Happens on first page load; must not block UI |
| Cache update on new SW version | **< 10 seconds** | Background update; must not interrupt current session |

---

## 8. PERFORMANCE MONITORING

### What to Check After Each Session

These are manual checks, not automated monitoring. Each takes < 2 minutes.

**After Session A (meta + manifest + defer):**
- Open Network tab in DevTools → confirm all `<script>` requests are `(defer)` — not parser-blocking
- Check Lighthouse on mobile preset (optional, informational only) — expect FCP improvement

**After Session B (bottom nav):**
- Open Performance tab in DevTools → record 5 seconds of tab switching → confirm no frames below 45fps
- Check DOM node count with `document.querySelectorAll('*').length` — should be < 2,000 at idle

**After Session D (service worker):**
- Network tab → confirm all shell assets served from `(ServiceWorker)` on second load
- Airplane mode test → confirm shell appears in < 400ms

**Ongoing:**
- After any new module added: recheck total DOM nodes and heap size
- After any animation added: verify 60fps in Performance timeline
