# Module Dependency Audit - AccentOS

This document maps the interactions and shared global dependencies between the AccentOS shell (`index.html`) and its modularized components in `js/`.

## Shared Globals (Shell-provided)

The following variables and functions are defined in `index.html` and are expected to be available globally for all modules:

### State & Config
- `CU`: Current User object `{ user_id, email, full_name, role, initials, jwt }`.
- `SUPABASE_URL`: Base URL for Supabase API.
- `SUPABASE_ANON_KEY`: Default public key for Supabase.
- `VD`: (Implicitly used) Global vendor data array.
- `QUOTES`: Global quotes array.
- `CUSTOMERS`: Global customers array.
- `DEALS`: Global deals object (grouped by stage).
- `INVENTORY`: Global inventory items array.
- `CHANGELOG`: Global vendor changelog array.

### Utilities
- `$`: Element selector shorthand.
- `esc`: HTML escaping helper.
- `toast`: Notification helper.
- `openModal`, `closeModal`: Modal management.
- `goTo`: Page navigation dispatcher.
- `sbFetch`: Supabase REST wrapper.
- `sbConfigured`: Check if Supabase keys are set.
- `fmt$`, `fmtS`: Currency formatting helpers.

## Module-Specific Hydration

The `hydrateFromSupabase` function in `index.html` orchestrates the loading of data for all modules. It has a high degree of coupling with the `sbLoad*` functions:

| Data Type | Loader Function | Storage Variable |
|---|---|---|
| Categories | `sbLoadCategories` | `vendorProductCats` |
| Changelog | `sbLoadChangelog` | `CHANGELOG` |
| Parents | `sbLoadParents` | `PARENT_COMPANIES`, `VENDOR_PARENTS` |
| Score States | `sbLoadScoreStates` | `VD[i]._meta` |
| Vendor Scores | `sbLoadVendorScores` | `VD[i].scores` |
| Quotes | `sbLoadQuotes` | `QUOTES` |
| Co-op Funds | `sbLoadCoopFunds` | `COOP_FUNDS` |
| Customers | `sbLoadCustomers` | `CUSTOMERS` |
| Employees | `sbLoadEmployees` | `EMPLOYEES` |
| Calendar | `sbLoadCalendarEvents` | `CALENDAR_EVENTS` |
| ... | ... | ... |

## Cross-Module Coupling Points

- **Global Search:** `js/global_search.js` depends on almost every data global and `open*` function.
- **Decision Engine:** Depends on `DEALS`, `QUOTES`, `CUSTOMERS`, `INVENTORY`.
- **Reports:** Depends on all data globals for CSV export.
- **Preset Patterns:** Modules like `js/purchase_orders.js` and `js/jobs.js` have `createXFromY` functions that link data across modules.

## Risks & Hazards

1. **Initialization Order:** Modules must be loaded *after* the core shell script defines the utility functions and core state, but *before* `DOMContentLoaded` triggers `hydrateFromSupabase`.
2. **Namespace Collisions:** All functions and variables are in the global `window` scope. Avoid generic names like `data` or `config`.
3. **Implicit Dependencies:** If a module is disabled via `module_modes.json`, other modules might still try to reference its globals or functions (e.g., Global Search calling a disabled module's detail view).
