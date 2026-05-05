# MODULE_MODES — Rollout state for every module + per-user overrides

> Source of truth: `module_modes.json` (this file documents the protocol).
> Both Michael (via Mgmt → Modes UI) and Claude (by editing `module_modes.json` directly) can toggle any module.

## Why this exists

AccentOS modules ship in stages. Some are still ideas, some are being designed, some are built but not ready for everyone, some are live. We need to:

- **Track** every module's current rollout stage in one place
- **Hide** unreleased modules from non-Owner roles automatically
- **Show banners** on building/testing modules so users know they're early
- **Override** access per individual user (employee or customer) when their actual job differs from the role template

## States

| State | Sidebar shown to | Page guard | Badge | Purpose |
|---|---|---|---|---|
| `idea_only` | Owner | Owner-only | — | Captured, no design work yet |
| `brainstorming` | Owner | Owner-only | — | Open scoping/discussion |
| `planning` | Owner | Owner-only | — | Spec being written |
| `blocked` | Owner | Owner-only | — | Waiting on external (M-task, API key) |
| `building` | Owner + override-allow | + override-allow | 🚧 | Active dev — hidden from regular roles |
| `testing` | Owner + Admin + override-allow | + override-allow | 🧪 | Built, in QA — Admin can preview |
| `live` | Per role-defaults + overrides | Per role + overrides | — | Shipped — normal role gating applies |
| `deprecated` | override-allow only | override-allow only | ⚠ | Removed/sunset — only kept around for legacy users |
| `hidden` | Never in sidebar | API/internal use only | — | Used by other modules; never directly navigated |

`override-allow` means the user has an explicit `allow` row in `user_module_overrides` for that module key.

## Resolution order (canSeeModule)

For a given user + module key:

1. If module mode is `hidden` → never visible.
2. If user has an explicit `deny` override → not visible.
3. If user has an explicit `allow` override → visible (regardless of mode/role).
4. If module mode requires Owner+Admin (`testing`) and user role is Owner or Admin → visible.
5. If module mode requires Owner-only (`idea_only` / `brainstorming` / `planning` / `blocked` / `deprecated` / `building`) and user role is Owner → visible.
6. If module mode is `live` → fall back to the existing `data-roles` role gate on the sidebar item.
7. Otherwise → not visible.

## Per-user overrides

Some employees and customers have responsibilities outside their role template. The override layer lets the Owner grant or revoke individual access without changing role definitions.

- Stored at: `accentos_user_overrides` (localStorage on Owner's browser, v1)
- Schema:
  ```json
  {
    "version": 1,
    "overrides": {
      "<user_id>": {
        "<module_key>": "allow" | "deny" | "read_only"
      }
    }
  }
  ```
- `read_only` is reserved for v2 — currently treated as `allow`
- v1 limitation: localStorage means overrides only affect the Owner's own browser. Real cross-device gating needs a Supabase `user_module_overrides` table — see M-task backlog (M30 candidate).

## Slash protocol — Claude updates the file

Michael can use any of these phrasings to ask Claude to flip a module's state:

| Phrasing | Effect |
|---|---|
| `/mode <key> <state>` | Flip `module_modes.json` → modules.<key>.mode = <state>; commit |
| `set <module title> to <state>` | Same, fuzzy-match the title |
| `<state> mode for <module>` | Same |
| `add module <key> as <state>` | Append a new entry with given state + title prompt |

For per-user overrides:

| Phrasing | Effect |
|---|---|
| `/override allow <user> <module>` | Add `allow` override |
| `/override deny <user> <module>` | Add `deny` override |
| `/override clear <user> <module>` | Remove override |
| `grant <user> access to <module>` | Same as allow |
| `revoke <user> from <module>` | Same as deny |

Claude resolves user references via `user_profiles.full_name` (case-insensitive substring) or `email`.

## Adding new modules to the registry

When Claude builds a new module (or the user wants to track a future feature):

1. Add an entry to `module_modes.json` → `modules` map
2. Set initial mode based on context (`idea_only` for stubs, `building` for actively-coded, `live` after ship)
3. The Mgmt → Modes sub-tab automatically lists it

## Files

- `module_modes.json` — registry data (read by UI, edited by Claude or UI)
- `MODULE_MODES.md` — this file (protocol + spec)
- `js/module_modes.js` — UI page + sidebar gating logic + canSeeModule resolver
