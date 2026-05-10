---
schema: v1
type: queue_item
id: r-03-feature-flag-scaffold
title: Feature flag scaffold — window.AccentOS.flags.isEnabled()
status: complete
priority: low
estimated_sessions: 0.25
created: 2026-05-10T00:00:00Z
updated: 2026-05-10T01:30:00Z
completed: 2026-05-10T01:30:00Z

owner_branch: claude/implement-claude-design-ui-eFn9b
claimed_by: claude

depends_on: []

blocks:
  - gl-01-phase-a-integration

files_in_scope:
  - ui/accentos-shell.js
files_frozen: []
---

## Description

Phase A requires `window.AccentOS.flags.isEnabled()` to gate shell visibility.
Without the flag system, the shell cannot be safely side-loaded into index.html —
there is no way to keep it hidden (flag OFF) while the CSS/JS are present.

## Implementation

Added to `ui/accentos-shell.js` inside the IIFE, exposed at:
- `window.AccentOS.flags.isEnabled(flagName)` — returns boolean
- `window.AccentOS.flags.override(flagName, value)` — localStorage override for dev

### Resolution order (highest priority first)

1. URL query param: `?shell=1` / `?shell=0` (current load only)
2. localStorage: `aos-shell-enabled` or `aos-shell-module-<key>`
3. Per-role default: reads `window.CU.role` — all `false` until Phase C+ per-role rollout
4. Global default: `false` (kill-switch — shell hidden until explicitly enabled)

### Kill-switch behavior

Any thrown exception in flag resolution → `return false` → legacy chrome renders.
Private browsing / localStorage blocked → graceful fallback (treated as no override).

### Per-module flags (Phase C–E)

`isEnabled('module:vendors')` → checks `localStorage['aos-shell-module-vendors']`
`isEnabled('module:health')` → checks `localStorage['aos-shell-module-health']`

### Dev testing

```js
// Enable shell for this browser
AccentOS.flags.override('shell-phase-a', true);

// Or via URL param (current page load only)
// ?shell=1

// Check current state
AccentOS.flags.isEnabled('shell-phase-a'); // → true/false
```

## Exit criteria (all met)

- [x] `window.AccentOS.flags.isEnabled()` implemented in accentos-shell.js
- [x] Returns false by default (global kill-switch)
- [x] URL param override works (`?shell=1`)
- [x] localStorage override works (persistent per-browser)
- [x] Per-role default map present (all false — Phase A safe)
- [x] Any exception → returns false (safe fail)
- [x] `override()` helper for dev testing
