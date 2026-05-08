# ACCENTOS_LAYOUT_ARCHITECTURE.md — Shell Layout Architecture
> Defines the structural layout system for AccentOS.
> Version: 1.0 — 2026-05-08

---

## OVERVIEW

AccentOS uses a **4-zone shell** layout:

1. **Global Header** — always visible, persistent context and navigation
2. **Sidebar** — module navigation, collapsible
3. **Central Surface** — primary work area
4. **Right Rail** — contextual inspector, opens on card selection

Plus two secondary zones:
5. **Ticker/Pulse Strip** — live activity feed below header
6. **Command Layer** — FAB (desktop) / Bottom Bar (mobile) for quick actions

---

## LAYOUT GRID

### Desktop (≥ 1024px)

```
┌──────────────────────────────────────────────── 100vw ─┐
│ HEADER                                          h:56px  │
│ [Logo] [Search] .................. [Status] [Account]   │
├──────────────────────────────────────────────────────────┤
│ TICKER                                          h:32px  │
│ ▶ Scrolling: quote saved · vendor updated · deal moved  │
├──────────┬───────────────────────────┬───────────────────┤
│          │                           │                   │
│ SIDEBAR  │   CENTRAL SURFACE         │  RIGHT RAIL       │
│ w:240px  │   flex: 1                 │  w:320px          │
│          │                           │  (hidden by def.) │
│ Module   │   Card grid /             │                   │
│ nav      │   Workflow panel          │  Inspector        │
│          │                           │  Details          │
│          │                           │  Logs             │
│          │                           │                   │
│          │                           │                   │
│          │   ● FAB (bottom-right)    │                   │
│          │   w:52px h:52px           │                   │
└──────────┴───────────────────────────┴───────────────────┘
```

### Tablet (768px – 1023px)

```
┌──────────────────────────── 100vw ─┐
│ HEADER                     h:56px  │
├───────────────────────────────────-┤
│ TICKER                     h:32px  │
├────────┬──────────────────────────-┤
│        │                           │
│  SIDE  │   CENTRAL SURFACE         │
│  w:56px│   flex: 1                 │
│  (icon │   (right rail opens as    │
│   only)│    bottom sheet / overlay)│
│        │                           │
│        │   ● FAB                   │
└────────┴──────────────────────────-┘
```

### Mobile (< 768px)

```
┌─────────────── 100vw ─┐
│ HEADER         h:48px  │
│ safe-area-top          │
├────────────────────────┤
│ CENTRAL SURFACE        │
│ flex: 1                │
│                        │
│ (sidebar = bottom nav  │
│  or drawer)            │
│                        │
│ (right rail = full-    │
│  screen modal)         │
│                        │
├────────────────────────┤
│ BOTTOM COMMAND BAR     │
│ h:64px                 │
│ safe-area-bottom       │
└────────────────────────┘
```

---

## ZONE SPECIFICATIONS

### Global Header

- Height: 56px desktop, 48px mobile
- Sticky — always visible, never scrolls
- Contents (L→R): Logo/wordmark | Search bar | ... | System status pill | Notifications | Account avatar
- Background: `--layer-elevated` with bottom border `--border-subtle`
- Z-index: `--z-header` (200)

### Sidebar

- Width: 240px expanded, 56px collapsed (icon-only)
- Height: full viewport height minus header
- Sticky — does not scroll with content
- Mobile: hidden by default, revealed as bottom drawer or hamburger overlay
- Sections: module groups with labels, separated by dividers
- Active state: gold text + subtly highlighted background
- Role-gating: hidden items are `display:none` (not `visibility:hidden`) — no ghost space

### Ticker / Pulse Strip

- Height: 32px
- Position: below header, above sidebar + main split
- Content: auto-scrolling recent activity log (last 10 events)
- Alert mode: background shifts to `--status-amber-dim` or `--status-red-dim`
- Desktop: persistent strip
- Mobile: collapsed to a pill/dot indicator in header

### Central Surface

- Flex: grows to fill remaining width between sidebar and rail
- Padding: `--space-6` on all sides (desktop), `--space-4` mobile
- Content: card grid (default), or full-panel module view
- Card grid: `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`
- Top: Next Actions row (horizontal strip of up to 5 action chips)

### Right Rail Inspector

- Width: 320px
- Hidden by default, slides in from right when a card is activated
- Elevation: `--layer-elevated`
- Z-index: `--z-rail` (300)
- Contains: detail view, related items, timeline/log, quick actions
- Mobile: full-screen modal instead (not a side rail)
- Close: X button or Escape key

### FAB (Floating Action Button)

- Size: 52×52px circle
- Position: `fixed`, bottom-right, above safe area
- Background: `--interactive-default` (gold)
- Icon: `+` by default, changes contextually (e.g. quote icon in Quote Generator)
- Click: opens Command Launcher
- Mobile: hidden (replaced by Bottom Command Bar)
- Z-index: `--z-fab` (400)

### Bottom Command Bar (Mobile Only)

- Height: 64px + safe-area-inset-bottom
- Position: `fixed`, bottom, full width
- Background: `--layer-elevated`
- Contains: 4-5 primary nav icons + central raised action button
- Z-index: `--z-fab` (400)

---

## NEXT ACTIONS ROW

Positioned at the top of the Central Surface, above the card grid.

```
┌──────────────────────────────────────────────────────┐
│  Next Actions:  [⚠ 3 stale quotes]  [📋 2 follow-ups]  │
│                 [📦 Low inventory]  [💰 Co-op deadline] │
└──────────────────────────────────────────────────────┘
```

- Renders up to 5 chips
- Each chip: icon + label + count badge
- Click → navigates to relevant module with item preloaded
- Populated by: stale quotes (>7d), pipeline follow-ups, co-op deadlines, vendor score gaps, inventory alerts
- Dismissible: swipe or close icon per chip

---

## COMMAND LAUNCHER (CMD+K)

- Triggered by: `Cmd/Ctrl + K` (desktop) or FAB (mobile)
- Full-screen overlay on mobile, centered modal on desktop
- Z-index: `--z-command` (800)
- Contains: search input + categorized quick actions
- Categories: Quotes, Vendors, Customers, Products, Pipeline, Admin
- Keyboard navigation: arrow keys + enter to execute
- Recent actions shown below search bar

---

## MODULE ACTIVATION PATTERN

When a module is activated (sidebar click or card click):

1. Central Surface renders the module's main view
2. URL hash updates (e.g. `#vendors`, `#quotes`)
3. Sidebar highlights the active item
4. Right Rail closes (resets to default state)
5. Next Actions row re-evaluates for the new context

---

## CARD GRID DENSITY MODES

| Mode | Column Min Width | Padding | Use |
|---|---|---|---|
| Compact | 240px | `--space-3` | Mobile, information-dense dashboard |
| Standard | 280px | `--space-4` | Default desktop |
| Comfortable | 340px | `--space-5` | Wide displays, focus mode |

User can toggle density. Default: Standard. Stored in localStorage.

---

## BREAKPOINTS

| Name | Range | Layout Mode |
|---|---|---|
| `mobile` | < 640px | Mobile shell (bottom bar, no sidebar, no rail) |
| `sm` | 640–767px | Mobile shell + minor layout adjustments |
| `tablet` | 768–1023px | Collapsed sidebar (icon-only), rail as bottom sheet |
| `desktop` | 1024–1279px | Full 3-column layout |
| `wide` | ≥ 1280px | Full layout + optional wider rail |

Primary target: **iPhone 13 Pro Max** (390×844px logical) in mobile mode.
