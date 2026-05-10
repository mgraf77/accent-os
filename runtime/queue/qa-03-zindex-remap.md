---
schema: v1
type: queue_item
id: qa-03-zindex-remap
title: Resolve z-index collisions — legacy vs shell layers
status: blocked
priority: medium
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
  - index.html
  - ui/tokens.css
files_frozen:
  - index.html

exit_criteria:
  - legacy_zindex_values_remapped_or_isolated
  - shell_token_values_do_not_conflict_with_legacy_at_same_stacking_context
---

## Description

Audit (2026-05-10) found 3 z-index collisions between legacy hardcoded values
and shell CSS token values when both are mounted simultaneously:

| Legacy element | Legacy z | Shell token | Shell z | Conflict |
|----------------|----------|-------------|---------|---------|
| `.vp` detail panel | 200 | `--z-header` | 200 | Header and legacy rail compete |
| `.qa-fab` | 300 | `--z-rail` | 300 | FABs compete at same plane |
| `.overlay` modal backdrop | 500 | `--z-dropdown` | 500 | Backdrop may hide shell dropdowns |

Additional concern:
| Legacy inline overlay (line 3609) | 2000 | `--z-command` | 800 | Legacy form overlays above shell command launcher |

## Resolution options

Option A (preferred for Phase B): Raise shell z-index token values above all legacy usage.
- Set `--z-base` floor at 1100 (above legacy #login-screen at 1000)
- Entire shell stacking context sits above legacy — no interference

Option B: Wrap shell in an isolated stacking context (`isolation: isolate`) so
internal z-index values are relative to the shell root, not the document.

Option C: Lower legacy z-index values in index.html at Phase B mount.

Recommendation: Option A at Phase B. Shell should be the dominant layer.
Revisit if Option A causes login screen to appear behind shell (acceptable during
logged-in state, but must not break the auth flow).

## Notes

Requires Phase A authorization before touching index.html.
Token value changes can be done on this branch (tokens.css is not frozen).
