# Stage 1 Decomposition Guide - AccentOS

This document provides technical intelligence for the safe extraction of "Core Utils" and "Supabase API" from `index.html`.

## 1. Extraction Candidates (Low Risk)

### Core Utilities (`js/core_utils.js`)
| Function | Responsibility |
|---|---|
| `$` | Global selector helper. |
| `esc` | HTML escaping (Template literal helper). |
| `v` | Form value extractor. |
| `fmt$`, `fmtS` | Currency formatting. |
| `toast` | Notification system. |
| `openModal`, `closeModal` | Global overlay management. |
| `csvStringify`, `csvDownload` | CSV generation and export. |

### Supabase API (`js/supabase_api.js`)
| Function | Responsibility |
|---|---|
| `sbKey`, `sbConfigured` | Key retrieval and validation. |
| `sbFetch` | The primary REST wrapper. |
| `sbRealtime` | Lazy-loader for the realtime client. |

### Auth Helpers (`js/auth_core.js`)
| Function | Responsibility |
|---|---|
| `jwtKey`, `setJwt` | Session storage management. |
| `deriveInitials` | User chip helper. |
| `applyRoleVisibility` | Sidebar and nav role gating. |

## 2. Coupling Hot Zones

- **The `$` Dependency:** Almost every function in the repo uses `$`. Consolidating this is the highest-leverage move for repo-wide stability.
- **Supabase Constants:** `SUPABASE_URL` and `SUPABASE_ANON_KEY` are referenced by both the shell and external loaders. They must be extracted into the API module or kept in a shared config.
- **Hydration Ordering:** Loader functions (`sbLoad*`) in modular files depend on `sbFetch` being available globally.

## 3. Ownership Ambiguity

The following state arrays are currently defined in `index.html` while their feature logic is (partially) modularized. These should be moved to their respective feature modules during Stage 2/3, but documented now as "logic orphans":

| Variable | Current Home | Proposed Home |
|---|---|---|
| `COOP_FUNDS` | `index.html` | `js/vendors.js` (or `js/coop.js`) |
| `CHANGELOG` | `index.html` | `js/vendors.js` |
| `DEALS` | `index.html` | `js/pipeline.js` |
| `QUOTES` | `index.html` | `js/quotes.js` |

## 4. Dead/Stale Logic Findings

- **`getS(k)`**: Candidate for deprecation (line 7398).
- **`aiSummary()`**: Orphaned stub (line 6151).
- **`TERMINAL_STAGES`**: Unused constant (line 5112).
- **`QQ`**: Legacy reference (line 6170).
- **`registerVendorScoreImport`**: Named function inside an IIFE in `js/vendor_score_import.js` is technically unreachable from outside.

## 5. Operational Risk Observations

1. **Hydration Dependency Chain:** `sbLoadScoreStates` and `sbLoadVendorScores` require `VD` to be mapped. `VD` initialization (line 2063) must happen before these loaders are triggered.
2. **Implicit UI Coupling:** Most modular render functions assume the existence of `#pg-content` and `#pg-actions` in the DOM.
3. **Namespace Collision:** Ensure that moving utilities to external files doesn't conflict with any module-specific helpers.

## 6. Recommended Stage 1 Sequence

1. Create `js/core_utils.js` with the basic DOM and formatting helpers.
2. Create `js/supabase_api.js` with the REST and Realtime wrappers.
3. Update `index.html` to include these scripts *before* any feature modules.
4. Verify that the login flow and initial dashboard hydration still function correctly.
