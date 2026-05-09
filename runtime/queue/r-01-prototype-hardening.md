---
schema: v1
type: queue_item
id: r-01-prototype-hardening
title: Prototype 2D hardening pass
status: complete
priority: medium
estimated_sessions: 1
created: 2026-05-08T22:30:00Z
updated: 2026-05-09T21:30:00Z
completed_at: 2026-05-09T21:30:00Z

owner_branch: claude/implement-claude-design-ui-eFn9b
claimed_by: session-9

depends_on: []
blocks:
  - phase-a-integration

files_in_scope:
  - ui/accentos-shell-prototype.html
files_frozen:
  - index.html
  - worker/anthropic-proxy.js
  - wrangler.toml
  - supabase/**

exit_criteria:
  - boot_smoke_27_of_27
  - no_console_errors_across_all_7_roles
  - empty_states_added_to_all_5_tables
  - aria_labels_on_all_icon_buttons
  - role_dialog_on_all_overlays
  - mobile_390px_visually_verified
---

## Description

Phase 2D — hardening pass on the prototype before any production integration is authorized. Pure prototype-side work, zero production touch.

## Approach

1. Audit each table's filter logic; add empty-state HTML for filter-to-zero scenarios (vendors, quotes, customers, inventory, tasks)
2. Add aria-label to all icon-only buttons (FAB, notif bell, sidebar toggle, rail close, mode banner exit)
3. Add `role="dialog"` + `aria-modal="true"` + aria-label to overlays (kb help, recent panel, command launcher, notif panel)
4. Run `node` syntax check across all 7 roles (no console errors)
5. Verify mobile breakpoint at exactly 390px (iPhone 13 Pro Max baseline)
6. Verify keyboard chord handlers don't fire while command launcher is open

## Notes

This is the recommended next prompt from the prior session's handoff. Single session expected.
