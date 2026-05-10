---
schema: v1
type: queue_item
id: qa-05-body-overflow-ios
title: Verify body overflow:hidden does not clip shell fixed elements on iOS Safari
status: blocked
priority: medium
estimated_sessions: 0.5
created: 2026-05-10T00:30:00Z
updated: 2026-05-10T00:30:00Z

owner_branch: claude/implement-claude-design-ui-eFn9b
claimed_by: null

depends_on:
  - gl-02-phase-b-integration

blocks: []

files_in_scope:
  - ui/accentos-shell.css
files_frozen: []
---

## Description

Legacy (index.html:27): `body { height:100vh; overflow:hidden; }`.

On iOS Safari, `overflow:hidden` on `<body>` is known to interfere with
`position:fixed` elements in certain scroll contexts. Shell has critical fixed
elements: `.aos-header`, `.aos-fab`, `.aos-bottom-bar`, command launcher, rail.

Standard behavior: `position:fixed` escapes overflow clipping per spec.
iOS Safari behavior: may not escape when `overflow:hidden` is set on `<body>`
directly (as opposed to a scroll container). Shell's bottom bar uses
`env(safe-area-inset-bottom)` which further depends on correct viewport handling.

## Resolution (if regression confirmed)

Isolate shell in its own scroll root:
- Add `overflow:hidden` to `.accentos-shell` element
- Shell CSS already has `min-height:100dvh` — can be made self-contained scroll root
- No changes to `<body>` required
- Remove reliance on `<body>` scroll containment behavior

## Exit criteria

- Tested on real iPhone Safari (not simulator) with shell mounted
- If no regression: close item with test-pass note
- If regression confirmed: implement scroll-root isolation in `ui/accentos-shell.css`
- Bottom bar safe-area-inset-bottom renders correctly on notched devices

## Notes

This item requires Phase B (shell visibly mounted) before it can be verified.
Blocked until gl-02-phase-b-integration gate clears.
No queue item needed for implementation — resolution is straightforward if triggered.
