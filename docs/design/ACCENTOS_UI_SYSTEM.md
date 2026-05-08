# ACCENTOS_UI_SYSTEM.md — AccentOS Design System
> Foundation document for the AccentOS visual and interaction system.
> Version: 1.0 — 2026-05-08

---

## IDENTITY

**AccentOS** is the employee-facing business operating system for Accent Lighting.

It is not a SaaS product. It is not a marketing page. It is not a chat app.

It is **Accent Lighting Mission Control** — the operational surface where every business function lives.

### Design Character
- Command center, not a dashboard
- Operational, not decorative
- Dense information, not spacious marketing
- Immediate action, not documentation browsing
- Mobile-first, not desktop-first with mobile fallback

---

## DESIGN INSPIRATION (ADAPTED FROM AGENTOSS)

The visual language is inspired by AI/ops command center aesthetics (dark layered surfaces, status semantics, card-based information density) but is adapted 100% for AccentOS business operations.

| AgentOS Concept | AccentOS Translation |
|---|---|
| Agent task queue | Quote queue, deal pipeline |
| Agent logs | Vendor changelog, interaction history |
| Agent workspace | Module surface (Quote Generator, Vendor scoring) |
| System status | AccentOS health: DB, worker, sync status |
| Next actions row | Today's priority actions: follow-ups, deadlines, stale items |
| Command launcher | Quick actions: new quote, search vendor, log interaction |

---

## SURFACE LAYERS

AccentOS uses a 3-layer depth model:

| Layer | Purpose | Background |
|---|---|---|
| Canvas | App background, base surface | `--layer-canvas` |
| Surface | Cards, panels, sidebars | `--layer-surface` |
| Elevated | Modals, dropdowns, tooltips, active rail | `--layer-elevated` |

---

## SHELL ZONES

```
┌─────────────────────────────────────────────────────────┐
│                    GLOBAL HEADER                         │
│  Logo | Search | Workspace | Status | Account            │
├──────────────┬──────────────────────────┬───────────────┤
│              │                          │               │
│   SIDEBAR    │   CENTRAL SURFACE        │  RIGHT RAIL   │
│              │                          │               │
│  Business    │  Card Grid /             │  Inspector    │
│  Modules     │  Workflow Surface        │  Details      │
│              │                          │  Logs         │
│  Nav Links   │  Ticker/Pulse (top)      │  Context      │
│              │                          │               │
├──────────────┴──────────────────────────┴───────────────┤
│               BOTTOM COMMAND BAR (mobile)                │
│           [ + ] Floating Action Button (desktop)         │
└─────────────────────────────────────────────────────────┘
```

---

## COMPONENT VOCABULARY

### Cards
- One layer above canvas (`--layer-surface`)
- Contain: title, status badge, metric/value, next-action hint
- States: default, active, alert, success, muted
- Density: compact (mobile), standard (tablet), comfortable (wide desktop)

### Status Badges
- `status-active` — green, live/open/running
- `status-warning` — amber, needs attention, approaching deadline
- `status-alert` — red, overdue/blocked/broken
- `status-muted` — gray, inactive/archived
- `status-info` — blue, informational/in-progress

### Next Actions Row
- Horizontal strip above the card grid
- Shows top 3-5 actionable items: stale quotes, overdue follow-ups, vendor scores needed
- Click → opens relevant module with the item preloaded

### Command Launcher
- Keyboard shortcut: `Cmd/Ctrl + K`
- Mobile: bottom FAB
- Actions: New Quote, Search Vendor, Log Interaction, Find Product, View Pipeline
- Context-aware: if in Quote Generator, top results are quote actions

### Right Rail Inspector
- Opens when a card is clicked (desktop/tablet)
- Shows: detail view, related items, history log, quick actions
- Closes via X or Escape
- Mobile: full-screen modal instead

### Ticker / Pulse Strip
- Thin horizontal bar below header
- Scrolls: recent activity (quote saved, vendor score updated, deal stage changed)
- Alert mode: turns amber/red if critical items exist
- Dismissible per item

---

## MODULE CARDS ON DASHBOARD

Each business module has a card representation for the Dashboard:

| Module | Card Content |
|---|---|
| Vendor Intelligence | Top 3 vendors by score, unverified count, tier distribution |
| Quote Generator | Open quotes count, total value, stale >7d count |
| Product Lookup | Last searched SKU, inventory alert count |
| Fixture Finder | Recent lookups, catalog freshness |
| Pricing Tools | Last price book update, margin avg |
| Rep Management | Unassigned reps count, mixed-rep parents |
| Customer Workflows | VIP count, lapsed reactivation candidates |
| Builder/Designer Workflows | Active jobs, upcoming deliveries |
| Dashboard / Daily Briefing | (root surface — not a card) |
| Reports | Last run, data freshness |
| AI Tools | Worker status, last AI usage |
| Integrations | Sync status, last sync time |
| Governance/Admin | Pending approvals, system alerts |
| System Health | DB status, worker ping, error rate |

---

## TYPOGRAPHY SCALE

| Token | Use | Size |
|---|---|---|
| `--type-display` | Page titles, module names | 1.5rem / 600 |
| `--type-heading` | Card titles, section headers | 1.125rem / 600 |
| `--type-body` | Default text, descriptions | 0.875rem / 400 |
| `--type-label` | Status badges, meta info | 0.75rem / 500 |
| `--type-mono` | SKUs, IDs, code | 0.8125rem / 400 (monospace) |

---

## MOTION PRINCIPLES

- Instant: state changes (active/inactive toggles)
- Fast (100ms): hover states, badge updates
- Standard (200ms): card reveals, sidebar open/close
- Deliberate (300ms): modal open, right rail slide in
- No animation: loading states — use skeleton screens instead
- Respect: `prefers-reduced-motion` — all animations disabled when set

---

## WHAT THIS IS NOT

- Not a component library (use in AccentOS only)
- Not a framework (no React, no Vue, no build step required)
- Not security enforcement (role visibility is UX filtering, not auth)
- Not final (Phase 1 foundation — evolves with the product)
