---
type: module
slug: module-modes
title: Module Modes Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004]
confidence: medium
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Module Modes Module

**File**: `js/module_modes.js`
**Pattern**: compact-CRUD module per [[ADR-002]] and [[ADR-004]]

## Functions

- `sbLoadModuleModes()`
- `_syncOverridesFromSupabase()`
- `_saveOverrides()`
- `_saveOverrideRow()`
- `canSeeModule()`
- `moduleModeBadge()`
- `applyModuleModesToSidebar()`
- `renderModuleModesPanel()`
- `_renderModulesTable()`
- `_mmBulkRetagPrompt()`
- `_mmBulkRetagCommit()`
- `_mmAddModulePrompt()`
- `_mmAddModuleCommit()`
- `_mmSetMode()`
- `_renderOverridesPanel()`
- `_mmSetOverride()`
- `_wrapGoToWithModeGuard()`
- `applyModuleModesAfterHydrate()`

## Shell touchpoints

- Sidebar entry in index.html (CORE or INTELLIGENCE section)
- PAGE_META entry: `modulemodes: {t:'...', s:'...'}`
- pages dispatcher: `modulemodes` key
- Hydrate call in sbHydrate()

## Related

[[ADR-002]] · [[ADR-004]]
