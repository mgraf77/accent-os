---
schema: v1
type: queue_item
id: qa-04-font-system-decision
title: Font system decision — Outfit vs Inter during shell coexistence
status: blocked
priority: medium
estimated_sessions: 0.25
created: 2026-05-10T00:30:00Z
updated: 2026-05-10T00:30:00Z

owner_branch: claude/implement-claude-design-ui-eFn9b
claimed_by: null

depends_on:
  - dec-01-phase-a-decisions

blocks:
  - gl-01-phase-a-integration

files_in_scope:
  - ui/tokens.css
files_frozen: []
---

## Description

Legacy index.html loads: `Outfit` + `DM Mono` from Google Fonts (index.html:7-8).
Shell token: `--font-sans: 'Inter', system-ui, ...` (ui/tokens.css:96).

When shell mounts inside index.html, shell elements render in Inter while legacy
elements render in Outfit. Both are geometric sans-serif but noticeably different
at body sizes. Mixed typeface visible during Phase B before Phase F cleanup.

## Options

**Option 1 — Change `--font-sans` to `'Outfit'` during coexistence**
- Cost: 1 token change in tokens.css
- Outfit is already loaded by index.html — no new network request
- Shell will visually match legacy during coexistence phases
- Requires reverting to Inter (or chosen brand font) at Phase F decommission
- Cheapest option, zero visual regression during coexistence

**Option 2 — Add Inter to index.html `<link>` and accept both fonts loading**
- Cost: 1 line in index.html (requires dec-02-phase-a-auth, frozen file)
- Cleanest long-term: shell renders in its designed font from day one
- Users will see mixed typefaces during Phase B coexistence
- 2 font families loaded in production during coexistence window

**Option 3 — Accept the visual difference as a known Phase B state**
- No changes required
- Mixed typeface is acknowledged and tolerated
- Document in known-issues list for Phase B

## Decision needed from Michael

Awaiting DEC-01 answer (or separate decision post-DEC-01-A through H).
If Option 1: Claude implements 1-line change in tokens.css.
If Option 2: Bundled into Phase A mount pass (requires index.html authorization).
If Option 3: No implementation — close this item with known-issue note.

## Exit criteria

- Decision recorded in DECISION_LOCK_V1.md or follow-on decision doc
- If Option 1: `--font-sans` updated in tokens.css
- If Option 2: bundled into Phase A/B index.html integration pass
- If Option 3: item closed with documentation note
