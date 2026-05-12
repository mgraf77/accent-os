# Shared State Mutation Map - AccentOS

This document maps the mutation "hotspots" where shared global state is modified by multiple modules, creating potential maintainability and synchronization risks.

## 1. The `VD` (Vendor Data) Global
The primary array of vendor objects.

| Mutated By | Purpose | Risk |
|---|---|---|
| `index.html` (Hydration) | Initial load and `VD_RAW` mapping. | Baseline source. |
| `index.html` (Score Entry) | Updates numeric scores locally before persistence. | UI drift if persistence fails. |
| `js/bulk_vendor_ops.js` | Bulk assignment of reps and tiers. | Large batch updates might conflict with manual edits. |
| `js/vendor_score_import.js`| Bulk CSV score loading. | Overwrites existing scores in memory. |

## 2. The `CUSTOMERS` Global
The CRM profile list.

| Mutated By | Purpose | Risk |
|---|---|---|
| `js/customers.js` | Direct CRUD operations (Add/Edit/Delete). | Primary owner. |
| `js/csv_import.js` | Bulk profile creation. | Duplicate detection relies on name-match. |
| `js/quick_actions.js` | New customer creation from FAB. | Uses a secondary code path for insertion. |

## 3. The `INVENTORY` Global
Used by multiple modules for lookup and adjustment.

| Mutated By | Purpose | Risk |
|---|---|---|
| `js/inventory.js` | Manual adjustments and CSV imports. | Primary owner. |
| `js/purchase_orders.js` | "Mark Received" updates stock counts. | Cross-module mutation: PO module modifies Inventory state. |

## 4. Cross-Module Implicit Dependencies

Many modules rely on specific DOM elements or global variables defined in the shell.

- **`pg-content` & `pg-actions`**: Almost every `js/*.js` module assumes these IDs exist for rendering.
- **`vSection`**: `global_search.js` and `activity_feed.js` directly modify this global to switch sub-tabs in the Vendor module.
- **`curPage`**: Used by `quick_actions.js` and `internal_meetings.js` to determine visibility or navigation state.

## 5. Dangerous Assumptions

- **Global Hydration:** Modules assume that by the time a user navigates to them, the global data they need (`VD`, `QUOTES`) is already hydrated. There are currently no "loading" states for individual modules.
- **Namespace Safety:** All modules share the `window` scope. There is currently no protection against a module accidentally overwriting a shared helper like `fmt$` or a global like `CU`.
