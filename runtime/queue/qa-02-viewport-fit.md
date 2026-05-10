---
schema: v1
type: queue_item
id: qa-02-viewport-fit
title: Add viewport-fit=cover to index.html
status: blocked
priority: medium
estimated_sessions: 0.1
created: 2026-05-10T00:00:00Z
updated: 2026-05-10T00:00:00Z

owner_branch: claude/implement-claude-design-ui-eFn9b
claimed_by: null

depends_on:
  - dec-02-phase-a-auth

blocks:
  - gl-01-phase-b-integration

files_in_scope:
  - index.html
files_frozen:
  - index.html

exit_criteria:
  - viewport_meta_includes_viewport_fit_cover
  - safe_area_insets_resolve_on_ios
---

## Description

Audit (2026-05-10) found: `index.html` line 5 viewport meta lacks `viewport-fit=cover`.

Current:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

Required for shell:
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

Shell uses `env(safe-area-inset-bottom)` and `env(safe-area-inset-top)` in:
- `.aos-bottom-bar` padding
- `.notif-panel` top positioning
- Toast bottom offset

Without `viewport-fit=cover`, all safe-area values resolve to 0 on iPhones with
notch or Dynamic Island. Shell content clips under system UI chrome.

## Implementation steps

1. Update `index.html` line 5 viewport meta — add `, viewport-fit=cover`
2. Test on iPhone (Safari): confirm bottom bar clears home indicator
3. Confirm no layout regression on Android Chrome

## Notes

One-attribute change. Lowest-risk mutation to index.html.
Requires Phase A authorization (index.html is frozen on this branch).
