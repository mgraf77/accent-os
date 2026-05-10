---
schema: v1
type: queue_item
id: qa-06-btn-class-scoping
title: Add scoped .btn rules to accentos-shell.css — prevent legacy style bleed
status: ready
priority: medium
estimated_sessions: 0.25
created: 2026-05-10T00:30:00Z
updated: 2026-05-10T00:30:00Z

owner_branch: claude/implement-claude-design-ui-eFn9b
claimed_by: null

depends_on: []

blocks:
  - gl-01-phase-a-integration

files_in_scope:
  - ui/accentos-shell.css
  - ui/accentos-shell-prototype.html
files_frozen: []
---

## Description

Legacy (index.html:101):
```css
.btn { display:inline-flex; font-family:'Outfit'; font-size:13px; ... }
```

Shell prototype uses `.btn`, `.btn-primary`, `.btn-ghost` classes on buttons.
`accentos-shell.css` does NOT define `.btn` — all shell button styles are in the
prototype's inline `<style>` block, which does not exist in the production shell.

When shell is mounted in Phase A, `.btn` elements inside `.accentos-shell` will
inherit legacy `.btn` styles: Outfit font, legacy colors, legacy border-radius.
Shell button visual identity breaks.

## Resolution

**Option A (preferred) — Add scoped selectors to accentos-shell.css:**
```css
.accentos-shell .btn { /* shell button base */ }
.accentos-shell .btn-primary { /* gold fill */ }
.accentos-shell .btn-ghost { /* transparent with border */ }
```
Extract values from prototype's inline `<style>` block for `.btn*` rules.

**Option B — Rename shell buttons to `.aos-btn`:**
Full scope isolation. Rename all `.btn` usages in shell HTML/JS/CSS to `.aos-btn`.
More work but eliminates the class namespace collision permanently.

## Exit criteria

- Shell button styles defined in accentos-shell.css, scoped to `.accentos-shell`
- Legacy `.btn` styles do not affect shell buttons when mounted in index.html
- All three variants (.btn, .btn-primary, .btn-ghost) covered
- Visual parity with prototype inline styles confirmed

## Notes

Must be completed before Phase A mount.
No dependency on dec-02-phase-a-auth — accentos-shell.css is not frozen.
Recommended to complete after qa-07 (data-roles rename) and in same pre-mount batch.
