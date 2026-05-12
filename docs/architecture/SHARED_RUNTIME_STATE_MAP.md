# Shared Runtime State Map - AccentOS

This document inventories the critical globals that form the shared state of the application.

## 1. Core Config & Auth
| Variable | Scope | Purpose |
|---|---|---|
| `CU` | Shell | Current User object. Read by every gated UI. |
| `SUPABASE_URL` | Shell | Database endpoint. |
| `SUPABASE_ANON_KEY`| Shell | Default fallback key. |

## 2. Shared Data Entities
These arrays/objects are populated during hydration and are the source of truth for the UI.

| Variable | Type | Primary Owner | Mutated By |
|---|---|---|---|
| `VD` | Array | Vendor Ranking | Shell (Hydration) |
| `QUOTES` | Array | Quote Generator | Shell (Hydration) |
| `CUSTOMERS` | Array | Customers (CRM) | Shell (Hydration), CSV Import |
| `DEALS` | Object | Sales Pipeline | Shell (Hydration) |
| `INVENTORY` | Array | Inventory | Shell (Hydration), PO Receipt |
| `CHANGELOG` | Array | Vendor Ranking | Shell (Hydration), Score Edits |

## 3. Ephemeral UI State
| Variable | Purpose |
|---|---|
| `curPage` | The key of the currently active page. |
| `vSection` | Current sub-tab for the Vendor Ranking module. |
| `LI`, `CQ` | Active quote line items and header in the Quote Generator. |

## 4. Initialization Handlers
| Function | Purpose |
|---|---|
| `hydrateFromSupabase` | Orchestrates all parallel data fetches. |
| `activateApp` | Switches from login screen to application shell. |

## Hazards: Shared-State "Gravity"
- **Mutation Fragmentation:** `CUSTOMERS` is modified by `js/customers.js` but also by `js/quick_actions.js` and `index.html`.
- **Global Pollution:** Adding new top-level `let` or `const` variables increases the risk of name collisions.
- **Race Conditions:** Any logic that reads a global array immediately after a `goTo` or `hydrate` call is at risk if the fetch hasn't completed.
