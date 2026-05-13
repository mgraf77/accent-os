# Global Runtime Registry - AccentOS

This registry catalogs all high-impact globals, their lifecycle, and ownership.

## 1. Authentication & Session
- **`CU`**: (Current User) Object. Set at boot by `tryRestoreSession` or after successful `doLogin`.
- **`jwtKey()`**: Utility to retrieve the current token.

## 2. Primary Data Stores (Data Registry)
These arrays/objects are hydrated at boot and form the shared state of the application.

| Global | Type | Primary Owner | Responsibility |
|---|---|---|---|
| `VD` | Array | `index.html` (Vendor Ranking) | Master vendor list, scoring, and tiers. |
| `QUOTES` | Array | `index.html` (Quotes) | Commercial lighting quotes and line items. |
| `CUSTOMERS` | Array | `js/customers.js` | CRM records and RFM segments. |
| `DEALS` | Object | `index.html` (Pipeline) | Sales pipeline stages and probability. |
| `INVENTORY` | Array | `js/inventory.js` | Stock levels, costs, and SKU metadata. |
| `POS` | Array | `js/purchase_orders.js` | Vendor purchase orders. |
| `ALERTS` | Array | `js/alerts.js` | System-generated notifications. |
| `CHANGELOG` | Array | `index.html` (Vendor Ranking) | Historical record of vendor edits. |

## 3. Navigation & Ephemeral State
- **`curPage`**: Key of the current active page. Set by `goTo`.
- **`vSection`**: Active sub-tab for Vendor Ranking.
- **`LI`, `CQ`**: Active quote line items and header metadata.

## 4. Shared Utilities (Shell-Owned)
- **DOM:** `$`, `qsa`.
- **Formatting:** `fmt$`, `fmtS`, `esc`, `dispScore`.
- **API:** `sbFetch`, `sbKey`, `sbConfigured`.
- **Navigation:** `goTo`, `openModal`, `closeModal`.

## 5. Feature Flags
- **`window.MODULE_MODES`**: Parsed content of `module_modes.json`.
- **`window.__AOS_HYDRATED__`**: Boolean flag set after `hydrateFromSupabase` completes.
