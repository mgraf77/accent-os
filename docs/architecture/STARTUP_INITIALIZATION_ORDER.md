# Startup Initialization Order - AccentOS

This document defines the strict execution sequence of the application shell and its modules.

## 1. Static Script Evaluation (Phase 1)
Browser parses and executes the inline `<script>` in `index.html`.
- **Action:** Defines core shell functions (`$`, `goTo`, `sbFetch`).
- **Action:** Initializes global data structures (`VD`, `QUOTES`).
- **Constraint:** These must be defined first because modules in Phase 2 depend on them.

## 2. Module Registration (Phase 2)
Browser loads external scripts listed at the bottom of `index.html`.
- **Action:** Modules attach their page render functions (e.g., `customers`, `employees`) and persistence logic (`sbLoad*`) to the global `window` scope.
- **Hazard:** Load order of modules is currently parallel. Module A should not depend on Module B during registration.

## 3. DOM Ready (Phase 3)
The `DOMContentLoaded` listener in `index.html` triggers.

| Step | Function | Responsibility |
|---|---|---|
| 3.1 | `tryRestoreSession` | Checks `sessionStorage` for JWT and restores `CU` global. |
| 3.2 | `activateApp` | Transitions UI from login screen to the app shell. |
| 3.3 | `hydrateFromSupabase` | Sequential `await` loop of ~27 data loaders. |
| 3.4 | `applyModuleModesAfterHydrate` | Fetches `module_modes.json` and gates sidebar/navigation. |
| 3.5 | `goTo('dashboard')` | Initial render of the landing page. |

## 4. Hydration Critical Path
Some loaders MUST run before others.
- **Critical Link:** `sbLoadScoreStates` and `sbLoadVendorScores` require `VD` to be initialized from `VD_RAW`.
- **Critical Link:** `generateAlertsFromData` must run AFTER all loaders to ensure cross-module data consistency.
