---
schema: v1
type: queue_item
id: qa-01-cmdk-deconflict
title: De-conflict Cmd+K — global_search.js vs shell launcher
status: blocked
priority: high
estimated_sessions: 0.5
created: 2026-05-10T00:00:00Z
updated: 2026-05-10T00:00:00Z

owner_branch: claude/implement-claude-design-ui-eFn9b
claimed_by: null

depends_on:
  - dec-02-phase-a-auth

blocks:
  - gl-01-phase-b-integration

files_in_scope:
  - js/global_search.js
files_frozen:
  - index.html
  - js/global_search.js

exit_criteria:
  - global_search_js_keydown_listener_removed
  - openGlobalSearch_registered_as_shell_module_command
  - shell_cmdk_is_sole_hotkey_owner
  - qa_fab_cmdk_label_updated
---

## Description

Audit (2026-05-10) confirmed: `js/global_search.js` lines 403–408 registers a
`document.addEventListener('keydown')` that claims both Ctrl+K and Cmd+K globally.
Shell command launcher also claims Cmd+K.

When both are loaded in Phase B, behavior is undefined (last-registered wins).

## Resolution per DEC-01-B (Hybrid)

Shell owns the hotkey. `global_search.js` does NOT keep its own listener.
Instead, `openGlobalSearch()` is registered as a module injection into the shell
command palette — its search surface becomes the "Search AccentOS" command group,
not a separate modal triggered by keyboard.

## Implementation steps

1. Remove `document.addEventListener('keydown', ...)` block from `global_search.js`
2. Register global search as a shell command module via Phase A module registration API
3. Update QA menu label (line 465 of index.html) — remove `⌘K` hint or update to reflect shell launcher
4. Verify: Cmd+K opens shell launcher only; search results appear as a command group

## Notes

Load order matters: shell JS must declare its Cmd+K listener AFTER legacy scripts
to guarantee shell wins. Or: shell uses `capture: true` on the event listener.
Decide at implementation time.
