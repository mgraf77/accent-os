# ACCENTOS_MOBILE_PWA_RULES.md — Mobile & PWA Rules
> Rules for making AccentOS work as a first-class PWA on iPhone.
> Primary target: iPhone 13 Pro Max (390×844px logical).
> Version: 1.0 — 2026-05-08

---

## TARGET DEVICE BASELINE

| Property | Value |
|---|---|
| Device | iPhone 13 Pro Max |
| Logical size | 390 × 844 px |
| Physical resolution | 1284 × 2778 px |
| Screen DPR | 3× |
| Safe area top | ~47px (notch/Dynamic Island area) |
| Safe area bottom | ~34px (home indicator) |
| Thumb reach zone | Bottom 40% of screen (330px from bottom) |
| Camera/notch | Dynamic Island (top center, ~62×37px) |

---

## SAFE AREA RULES

All fixed UI elements must respect iOS safe areas.

### Required CSS

```css
/* In :root or html body */
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);
padding-left: env(safe-area-inset-left);
padding-right: env(safe-area-inset-right);
```

### Per-Zone Rules

| Zone | Rule |
|---|---|
| Global Header | `top: env(safe-area-inset-top)` OR add safe-area padding inside header |
| Bottom Command Bar | `padding-bottom: max(env(safe-area-inset-bottom), 8px)` |
| FAB | `bottom: calc(env(safe-area-inset-bottom) + 16px)` |
| Modals | Must not overlap status bar or home indicator |
| Right Rail (full-screen mobile) | Same as modal rules |

### DO NOT
- Place tappable targets in the top 47px (Dynamic Island territory)
- Place any interactive element under the bottom home indicator bar
- Use `position: fixed; bottom: 0` without safe-area-inset-bottom offset

---

## TOUCH TARGET RULES

| Rule | Value |
|---|---|
| Minimum touch target size | 44×44px (Apple HIG standard) |
| Recommended button size | 48×48px minimum |
| Icon-only controls | 44×44px minimum hit area (can have smaller visual) |
| List row height | Minimum 48px |
| Nav bar item | Minimum 44px wide × 56px tall |
| Primary action button | 52×52px (FAB) or full-width (≥ 44px tall) |

---

## LAYOUT RULES FOR MOBILE

### Thumb Zone Optimization

The bottom 330px of a 844px screen is the easy-reach zone. Prioritize:

- Primary navigation → Bottom Command Bar (thumb zone)
- Quick actions → FAB bottom-right (thumb zone)
- Cancel/back → bottom-left (thumb zone)
- Destructive actions → Require scroll up to reach (friction)
- Settings/admin → Top of sidebar (intentional reach required)

### Scroll Rules

- Central Surface: natural vertical scroll (`overflow-y: auto`)
- Sidebar: does not scroll with content (sticky)
- Header: does not scroll (sticky)
- Bottom Bar: does not scroll (fixed)
- Card grid: scrolls inside central surface
- Right Rail (mobile, full-screen): independent scroll from rest of page

### No Fixed-Width Constraints

- All content must adapt to 390px width
- Tables use horizontal scroll with `-webkit-overflow-scrolling: touch`
- Card grid collapses to single column at < 640px
- Modal max-width = `calc(100vw - 32px)` on mobile

---

## PWA REQUIREMENTS

### Manifest (web app manifest)

AccentOS should have a `manifest.json` at root with:

```json
{
  "name": "AccentOS",
  "short_name": "AccentOS",
  "description": "Accent Lighting Business Operating System",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0f0f17",
  "theme_color": "#0f0f17",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### Required Meta Tags

```html
<!-- PWA / iOS -->
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="AccentOS">
<meta name="theme-color" content="#0f0f17">
<link rel="manifest" href="/manifest.json">
<link rel="apple-touch-icon" href="/icons/icon-192.png">
```

### `viewport-fit=cover`

This is the key PWA meta tag that allows content to extend under the notch/Dynamic Island. Combined with `env(safe-area-inset-*)` CSS, it enables proper notch-aware layout.

### Add-to-Home-Screen Readiness Checklist

- [ ] manifest.json present at root
- [ ] Icons: 192×192 and 512×512 PNGs
- [ ] Maskable icon for Android
- [ ] theme-color matches app background
- [ ] HTTPS served (Cloudflare Pages handles this)
- [ ] Service worker (optional for Phase 1, required for offline later)
- [ ] Apple touch icon for iOS home screen

---

## MOBILE SHELL BEHAVIOR

### Navigation Model

On mobile, the sidebar is replaced by:

**Option A — Bottom Navigation Bar (recommended)**
- 4-5 primary modules in bottom bar
- All others in "More" drawer
- Thumb-zone optimized

**Option B — Hamburger Drawer**
- Tap hamburger → full sidebar slides in from left
- Backdrop dismisses it
- Less optimal for frequent navigation

Current Phase 1 choice: **Option A** for prototype, document both.

### Module Views on Mobile

- Dashboard / Daily Briefing: vertical card stack, no grid
- Detail views: full-screen
- Right Rail: full-screen modal (bottom-sheet slide-up)
- Command Launcher: bottom-sheet, not centered modal

### Orientation

- Primary: Portrait
- Landscape: Supported but not primary design target
- Lock orientation via manifest: `"orientation": "portrait-primary"` (optional, user preference)

---

## PERFORMANCE RULES FOR MOBILE

- No layout shifts (CLS): images and cards must have declared dimensions
- First meaningful paint: dashboard skeleton in < 500ms (target)
- No blocking scripts: all module JS loads after inline (current pattern is correct)
- Image optimization: lazy-load images below fold
- Font loading: use system fonts as fallback, avoid FOUT
- Network: app must be functional on 4G/LTE, gracefully degraded on 3G

---

## WHAT NOT TO BUILD (YET)

- Service Worker / offline mode — Phase 2+
- Push notifications — Phase 2+
- Background sync — Phase 2+
- Native app behaviors (swipe-to-delete, etc.) — Phase 3+
- Full native PWA install prompt — Phase 2 (manifest enables it passively)

Phase 1 goal: **it looks and works great when added to home screen.**
Phase 2 goal: **it works offline for read-only views.**
