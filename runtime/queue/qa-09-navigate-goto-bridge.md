---
schema: v1
type: queue_item
id: qa-09-navigate-goto-bridge
title: Document navigate() vs goTo() bridge — prevent silent mode guard bypass
status: blocked
priority: medium
estimated_sessions: 0.25
created: 2026-05-10T00:30:00Z
updated: 2026-05-10T00:30:00Z

owner_branch: claude/implement-claude-design-ui-eFn9b
claimed_by: null

depends_on:
  - dec-03-phase-b-auth

blocks:
  - gl-02-phase-b-integration

files_in_scope:
  - ui/accentos-shell.js
  - js/module_modes.js
  - docs/implementation/ACCENTOS_PROGRESSIVE_SHELL_ROLLOUT.md
files_frozen:
  - js/module_modes.js
---

## Description

Shell prototype defines `navigate(page)` for its own module routing.
Legacy defines `goTo(page)` for its module routing. `module_modes.js` wraps
`window.goTo` with a permission guard (`_wrapGoToWithModeGuard`).

In Phase B, shell `navigate()` must call `window.goTo(page)` for legacy-hosted
modules to preserve the permission guard. If shell calls its own `navigate()`
exclusively, module mode restrictions are silently bypassed for any path going
through the shell.

`module_modes.js` also fires `CustomEvent('aos:navigate', {...})` on `.ni`
nav item clicks. Shell should listen to this event in Phase B for sync — legacy
nav action should update shell active-nav highlight.

## Bridge contract for Phase B

1. Shell `navigate(page)` calls `window.goTo(page)` for all legacy-hosted modules
2. Shell maintains its own routing only for shell-native modules
3. Shell listens to `aos:navigate` CustomEvent to sync active-nav state
4. Shell-native module routing enforces its own permission check (not `_wrapGoToWithModeGuard`)

## Exit criteria

- Bridge contract documented
- Shell navigate() implementation forks: legacy path calls window.goTo(), native path checks own permissions
- aos:navigate event listener wired in shell for nav highlight sync
- No legacy-module navigation can bypass _wrapGoToWithModeGuard

## Notes

Phase B architecture item. Documentation only until Phase B gate clears.
`js/module_modes.js` is frozen — shell must adapt to its contract, not modify it.
