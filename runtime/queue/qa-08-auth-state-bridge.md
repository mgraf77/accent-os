---
schema: v1
type: queue_item
id: qa-08-auth-state-bridge
title: Document auth state bridge contract — window.CU → shell identity
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
  - docs/implementation/ACCENTOS_PROGRESSIVE_SHELL_ROLLOUT.md
files_frozen: []
---

## Description

Legacy stores auth user as `let CU = null` (index.html:529). After login:
```js
CU = { user_id, email, name, role, initials, jwt }
```

Shell prototype has a hardcoded role switcher (`<select id="roleSelect">`).
In Phase B, the shell must derive its displayed role from `window.CU.role`,
not its own local switcher.

`module_modes.js` reads `CU.role` for `canSeeModule()`. Shell navigation that
triggers `goTo()` goes through the mode guard automatically (correct). Shell
navigation to shell-native modules does NOT — the guard only wraps `window.goTo`.

## Bridge contract for Phase B

1. Shell reads `window.CU` for identity on mount and after `aos:auth-change` event
2. Shell role switcher (`#roleSelect`) is removed or made read-only display
3. Shell-native module routing implements its own `canSeeModule()` equivalent
4. Shell dispatches `aos:role-display-change` when it updates role display (for legacy sync)

## Exit criteria

- Bridge contract documented in shell rollout doc or dedicated bridge doc
- `window.CU` read pattern implemented in `ui/accentos-shell.js`
- Role switcher removed from shell (prototype artifact) or wired as display-only
- Shell-native module permission check pattern documented

## Notes

Phase B architecture item. No implementation until Phase B gate clears (dec-03-phase-b-auth).
Contract documentation can be written independently of gate.
