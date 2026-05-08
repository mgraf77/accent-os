# ACCENTOS_TOKENS.md — Design Tokens Reference
> Single source of truth for all visual tokens used in AccentOS.
> Implemented in ui/tokens.css as CSS custom properties.
> Version: 1.0 — 2026-05-08

---

## COLOR — BASE PALETTE

### Neutrals (Dark Theme Surfaces)
| Token | Value | Use |
|---|---|---|
| `--gray-950` | `#0a0a0f` | Deepest background |
| `--gray-900` | `#0f0f17` | Canvas / app background |
| `--gray-850` | `#14141e` | Surface base |
| `--gray-800` | `#1a1a28` | Cards, panels |
| `--gray-750` | `#1e1e30` | Sidebar, header |
| `--gray-700` | `#252538` | Elevated surfaces, hover |
| `--gray-600` | `#363650` | Borders, dividers |
| `--gray-500` | `#5a5a78` | Muted text, placeholders |
| `--gray-400` | `#8888a8` | Secondary text |
| `--gray-300` | `#b0b0c8` | Body text |
| `--gray-200` | `#d0d0e0` | Primary text |
| `--gray-100` | `#e8e8f0` | High-emphasis text |
| `--gray-50`  | `#f4f4f8` | Inverted / white context |

### Brand — Accent Gold
| Token | Value | Use |
|---|---|---|
| `--gold-600` | `#b8860b` | Deep gold, active states |
| `--gold-500` | `#d4a017` | Brand primary |
| `--gold-400` | `#f0b429` | Highlighted actions |
| `--gold-300` | `#f5c842` | Active nav items |
| `--gold-200` | `#f9db80` | Light accent, icons |

### Semantic — Status Colors
| Token | Value | Meaning |
|---|---|---|
| `--status-green` | `#22c55e` | Active, live, good |
| `--status-green-dim` | `#166534` | Green badge background |
| `--status-amber` | `#f59e0b` | Warning, attention needed |
| `--status-amber-dim` | `#78350f` | Amber badge background |
| `--status-red` | `#ef4444` | Alert, overdue, broken |
| `--status-red-dim` | `#7f1d1d` | Red badge background |
| `--status-blue` | `#3b82f6` | Info, in-progress |
| `--status-blue-dim` | `#1e3a5f` | Blue badge background |
| `--status-gray` | `#6b7280` | Muted, inactive |
| `--status-gray-dim` | `#1f2937` | Gray badge background |

---

## COLOR — SEMANTIC LAYER

### Surfaces
| Token | Maps To | Use |
|---|---|---|
| `--layer-canvas` | `--gray-900` | App background |
| `--layer-surface` | `--gray-800` | Cards, panels |
| `--layer-elevated` | `--gray-700` | Modals, dropdowns, active rail |
| `--layer-overlay` | `rgba(0,0,0,0.6)` | Modal backdrops |

### Text
| Token | Maps To | Use |
|---|---|---|
| `--text-primary` | `--gray-100` | Headings, emphasis |
| `--text-body` | `--gray-300` | Default text |
| `--text-secondary` | `--gray-400` | Meta, labels |
| `--text-muted` | `--gray-500` | Placeholders, disabled |
| `--text-inverse` | `--gray-950` | Text on light backgrounds |

### Borders
| Token | Maps To | Use |
|---|---|---|
| `--border-subtle` | `--gray-700` | Card borders |
| `--border-default` | `--gray-600` | Input borders, dividers |
| `--border-strong` | `--gray-500` | Active element borders |
| `--border-brand` | `--gold-500` | Selected, active brand |

### Interactive
| Token | Maps To | Use |
|---|---|---|
| `--interactive-default` | `--gold-400` | Primary buttons, CTAs |
| `--interactive-hover` | `--gold-300` | Button hover |
| `--interactive-active` | `--gold-500` | Button pressed |
| `--interactive-muted` | `--gray-700` | Ghost buttons, secondary |
| `--nav-active-bg` | `--gray-700` | Active sidebar item background |
| `--nav-active-text` | `--gold-300` | Active sidebar item text |

---

## SPACING SCALE

| Token | Value | Use |
|---|---|---|
| `--space-1` | `4px` | Micro gaps (badge padding) |
| `--space-2` | `8px` | Small gaps (icon + label) |
| `--space-3` | `12px` | Default inner padding |
| `--space-4` | `16px` | Card padding, form fields |
| `--space-5` | `20px` | Section separation |
| `--space-6` | `24px` | Card to card gap |
| `--space-8` | `32px` | Major section breaks |
| `--space-10` | `40px` | Page section gaps |
| `--space-12` | `48px` | Header height unit |

---

## LAYOUT TOKENS

| Token | Value | Use |
|---|---|---|
| `--sidebar-width` | `240px` | Sidebar expanded width |
| `--sidebar-collapsed` | `56px` | Sidebar icon-only width |
| `--header-height` | `56px` | Global header height |
| `--ticker-height` | `32px` | Pulse/ticker strip height |
| `--rail-width` | `320px` | Right rail inspector width |
| `--fab-size` | `52px` | Floating action button size |
| `--bottom-bar-height` | `64px` | Mobile bottom command bar |
| `--card-radius` | `8px` | Standard card border radius |
| `--modal-radius` | `12px` | Modal border radius |
| `--badge-radius` | `4px` | Status badge radius |

---

## TYPOGRAPHY TOKENS

| Token | Value | Use |
|---|---|---|
| `--font-sans` | `'Inter', system-ui, -apple-system, sans-serif` | All UI text |
| `--font-mono` | `'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace` | SKUs, IDs, code |
| `--type-display` | `1.5rem / 600` | Page/module title |
| `--type-heading` | `1.125rem / 600` | Card title |
| `--type-subheading` | `1rem / 500` | Section header |
| `--type-body` | `0.875rem / 400` | Default text |
| `--type-label` | `0.75rem / 500` | Badges, meta |
| `--type-micro` | `0.6875rem / 400` | Timestamps, footnotes |
| `--type-mono` | `0.8125rem / 400 (mono)` | SKUs, IDs |

---

## SHADOW TOKENS

| Token | Value | Use |
|---|---|---|
| `--shadow-card` | `0 1px 3px rgba(0,0,0,0.4)` | Default card elevation |
| `--shadow-elevated` | `0 4px 16px rgba(0,0,0,0.5)` | Modals, dropdowns |
| `--shadow-glow-gold` | `0 0 12px rgba(212,160,23,0.2)` | Active/brand glow |
| `--shadow-glow-green` | `0 0 8px rgba(34,197,94,0.15)` | Success glow |
| `--shadow-glow-red` | `0 0 8px rgba(239,68,68,0.15)` | Alert glow |

---

## TRANSITION TOKENS

| Token | Value | Use |
|---|---|---|
| `--ease-instant` | `0ms` | State toggles |
| `--ease-fast` | `100ms ease` | Hover states |
| `--ease-standard` | `200ms ease` | Panel reveals |
| `--ease-deliberate` | `300ms ease` | Modal open, rail slide |

---

## Z-INDEX SCALE

| Token | Value | Use |
|---|---|---|
| `--z-base` | `0` | Default stacking |
| `--z-sidebar` | `100` | Sidebar |
| `--z-header` | `200` | Global header |
| `--z-ticker` | `150` | Ticker strip |
| `--z-rail` | `300` | Right rail inspector |
| `--z-fab` | `400` | Floating action button |
| `--z-dropdown` | `500` | Dropdowns, popovers |
| `--z-modal` | `600` | Modals |
| `--z-toast` | `700` | Toast notifications |
| `--z-command` | `800` | Command launcher (Cmd+K) |
