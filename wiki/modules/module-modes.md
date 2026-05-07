---
type: module
slug: module-modes
title: Module Modes Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004, employees, health]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-07
---

# Module Modes Module

**File**: `js/module_modes.js` (registry: `module_modes.json`; overrides table: `user_module_overrides` from `sql/M40_user_module_overrides.sql`)
**Pattern**: rollout-state registry + per-user override resolver, sidebar gating, navigation guard, Owner/Admin Mgmt sub-tab UI
**Sidebar route**: rendered as `Modes` sub-tab inside `mgmt` page (Owner / Admin only — see `renderModuleModesPanel`)

## Purpose

Controls which AccentOS modules show in the sidebar and respond to `goTo()` based on rollout state, plus per-user overrides. Supports gradual rollout: an Owner can build a feature in isolation, promote to testing for Admins, then go live for everyone. Feature flags without re-deploys: edit `module_modes.json` at the repo root and a future `/mode key state` Claude command commits the change.

## Mode lifecycle (9 states)

`idea_only → brainstorming → planning → blocked → building → testing → live → deprecated → hidden`. Owner-only by default for any non-`live` / non-`testing` mode; `testing` unlocks for Admin; `live` defers to existing `data-roles` gating; `hidden` blocks everyone.

## Override semantics

`canSeeModule(key, role?, userId?)` resolution order: `hidden` → false. User-level override (`allow` / `read_only` / `deny`) beats mode. `live` → true. `testing` → Owner+Admin. `building` → Owner only. Other modes → Owner only. Unknown keys default to true (don't break unregistered modules).

## Functions

| function | role |
|----------|------|
| `sbLoadModuleModes()` | fetches `module_modes.json?cb=<ts>` (cache-bust) + reads localStorage `accentos_user_overrides`; calls `_syncOverridesFromSupabase` |
| `_syncOverridesFromSupabase()` | GETs `/user_module_overrides`; Owner sees all, others see own; replaces local cache; tolerant of missing M40 table |
| `_saveOverrides()` | persists `USER_OVERRIDES` to localStorage |
| `_saveOverrideRow(userId, key, access)` | POST to `?on_conflict=user_id,module_key` (allow/deny/read_only) or DELETE (clear); stamps `granted_by` from `CU` |
| `canSeeModule(key, role, userId)` | resolver — see Override semantics above |
| `moduleModeBadge(key)` | inline `<span>` emoji for `building=🚧`, `testing=🧪`, `deprecated=⚠` |
| `applyModuleModesToSidebar()` | walks every `.ni`, extracts `goTo('key')`, hides invisible modules, injects right-anchored badge for non-live modes |
| `renderModuleModesPanel(c)` | Mgmt → Modes sub-tab; renders Owner-only sub-tabs `Modules` / `User Overrides` |
| `_renderModulesTable(host)` | filterable + state-color-coded table; clickable mode chips for cohort filter; bulk retag + add-new actions |
| `_mmBulkRetagPrompt()` / `_mmBulkRetagCommit()` | move every module of one mode to another in one shot — emits `/mode key state` lines for Claude to commit to JSON |
| `_mmAddModulePrompt()` / `_mmAddModuleCommit()` | register a brand-new module (key sanitizer: `[^a-z0-9_]→_`); emits `/mode add key state "title" — notes` |
| `_mmSetMode(key, newMode)` | single-row mode swap; immediately re-applies sidebar gating; logs `/mode key state` to copy-paste pane |
| `_renderOverridesPanel(host)` | per-user override matrix; loads `user_profiles`; "All overrides" summary table |
| `_mmSetOverride(userId, key, access)` | local + Supabase write; toast notes "(local only)" if M40 not run |
| `_wrapGoToWithModeGuard()` | one-shot monkey-patches `window.goTo` to short-circuit + toast when target is gated |
| `applyModuleModesAfterHydrate()` | called from `hydrateFromSupabase` on login: load → apply sidebar → wrap goTo |

## State color map

`idea_only` gray · `brainstorming` amber · `planning` blue · `blocked` red · `building` purple · `testing` orange · `live` green · `deprecated` dark-red · `hidden` slate. Used for chip backgrounds + select dropdowns + override mode badges.

## Command bundle output

Mode toggles surface a copy-pasteable `/mode key newmode` line in `#mm-cmd-log` (single change), bulk retags emit a multi-line bundle, new modules emit `/mode add key state "title" — notes`. Claude commits these to `module_modes.json` from the repo root — gives the Owner a "I clicked the toggle, now Claude please commit it" loop without leaving the UI.

## State

`MODULE_MODES = {version, modules: {key: {title, mode, notes, updated_at}}, states: [...]}`, `USER_OVERRIDES = {version, overrides: {userId: {key: access}}}`. Sub-tab state: `_mmSubview`, `_mmFilter`, `_mmModeFilter`, `_mmOvUserId`. Window-scoped: `_mmTimer` (200ms debounce), `_goToModeWrapped`.

## Read dependencies

`CU` (role + user_id), `user_profiles` (for override picker), `sbConfigured`, `sbFetch`, `sbAuditLog`. Mounted at `$('mgmt-content')` — see [[employees]] / [[health]] for sibling Mgmt tabs.

## Shell touchpoints

- Mgmt sub-tab dispatch: `mgmtSection === 'modes'` → `renderModuleModesPanel($('mgmt-content'))`
- PAGE_META: `modulemodes: {t:'Module Modes', s:'Rollout state · per-user overrides'}` (reserved key, not yet wired as own page)
- Hydrate hooks: post-login `applyModuleModesAfterHydrate()` (line ~554) and post-boot fallback (line ~6596)
- Sidebar mutation: `applyModuleModesToSidebar()` re-runs after every mode toggle
- `goTo` guard: `_wrapGoToWithModeGuard` patches navigation
- Audit events: `module_mode_change`, `module_mode_bulk_retag`, `module_register`, `user_module_override`

## Related

[[ADR-002]] · [[ADR-004]] · [[employees]] · [[health]]
