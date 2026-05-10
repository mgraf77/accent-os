---
schema: v1
type: queue_item
id: qa-07-data-roles-collision
title: Rename data-roles → data-aos-roles in shell HTML/JS — prevents applyRoleVisibility collision
status: ready
priority: high
estimated_sessions: 0.25
created: 2026-05-10T00:30:00Z
updated: 2026-05-10T00:30:00Z

owner_branch: claude/implement-claude-design-ui-eFn9b
claimed_by: null

depends_on: []

blocks:
  - gl-01-phase-a-integration

files_in_scope:
  - ui/accentos-shell-prototype.html
  - ui/accentos-shell.js
files_frozen: []
---

## Description

Legacy `applyRoleVisibility()` (index.html:588) does:
```js
document.querySelectorAll('[data-roles]').forEach(el => {
  const allowed = el.getAttribute('data-roles').split(',').map(s=>s.trim());
  el.style.display = (!allowed.length || allowed.includes(role)) ? '' : 'none';
});
```

Shell prototype uses `data-roles` on nav items with lowercase values:
`data-roles="owner,manager"`.

Legacy role values come from database: `'Owner'`, `'Admin'`, `'Manager'`, etc.
Shell values are lowercase: `'owner'`, `'manager'`, `'sales'`, etc.

When `applyRoleVisibility('Owner')` runs after Phase A mount, it queries ALL
`[data-roles]` in the document — including shell nav items. Shell items with
`data-roles="owner"` do NOT match `'Owner'` (case mismatch). Result: all shell
nav items hidden immediately after login.

Even if case were unified, legacy `applyRoleVisibility` would override shell's own
visibility logic by directly setting `style.display` on shell elements.

## Resolution

Rename shell's attribute to `data-aos-roles` throughout shell HTML and JS:
- Shell manages its own visibility using `[data-aos-roles]`
- Legacy manages its elements using `[data-roles]`
- Scoped by attribute name — no document-scope collision possible

Steps:
1. Global replace `data-roles` → `data-aos-roles` in `ui/accentos-shell-prototype.html`
2. Global replace `data-roles` → `data-aos-roles` in `ui/accentos-shell.js` (if present)
3. Update any JS that reads `getAttribute('data-roles')` inside shell code
4. Verify: grep `[data-roles]` in ui/ — should return zero results after rename

## Exit criteria

- `grep -r 'data-roles' ui/` returns zero results
- `grep -r 'data-aos-roles' ui/` returns all expected nav items
- Shell nav visibility logic reads `data-aos-roles`
- Legacy `applyRoleVisibility` cannot query any shell attribute

## Notes

HIGHEST PRIORITY pre-mount item. Blocks Phase A mount entirely.
No dependency on dec-02-phase-a-auth — shell files are not frozen.
Complete before qa-06 (btn scoping) in pre-mount batch.
