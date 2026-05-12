# Dependency Ownership Map - AccentOS

This document clarifies which modules are the primary "owners" of global data structures and which modules are secondary consumers.

## 1. Primary Data Owners

| Global Variable | Primary Owner | Responsibility |
|---|---|---|
| `VD` | `index.html` (Vendor Ranking) | Master vendor list, scoring, and tiers. |
| `QUOTES` | `index.html` (Quotes) | Commercial lighting quotes and line items. |
| `CUSTOMERS` | `js/customers.js` | CRM records and RFM segments. |
| `DEALS` | `index.html` (Pipeline) | Sales pipeline stages and probability. |
| `INVENTORY` | `js/inventory.js` | Stock levels, costs, and SKU metadata. |
| `POS` | `js/purchase_orders.js` | Vendor purchase orders. |
| `ALERTS` | `js/alerts.js` | System-generated notifications. |
| `CHANGELOG` | `index.html` (Vendor Ranking) | Historical record of vendor edits. |

## 2. Shared Utilities (Shell-Owned)

These functions are provided by the shell for use by all modules.

- **DOM:** `$`, `qsa`.
- **Formatting:** `fmt$`, `fmtS`, `esc`, `dispScore`.
- **API:** `sbFetch`, `sbKey`, `sbConfigured`.
- **Navigation:** `goTo`, `openModal`, `closeModal`.

## 3. High-Traffic Consumption Points

Modules that depend on multiple data sources:

- **Global Search:** Consumes almost every primary global for indexing.
- **Decision Engine:** Consumes `DEALS`, `QUOTES`, `CUSTOMERS`, and `INVENTORY`.
- **Dashboard:** Consumes aggregated counts and totals from all primary globals.

## 4. Extraction Blockers

- **Vendor Logic Gravity:** `weightedScore` and `openVendorDetail` are referenced by so many modules that moving them requires a guaranteed global reference (e.g., `window.weightedScore`).
- **Sequential Hydration:** The dependency of `sbLoadScoreStates` on `VD` initialization means these two loaders cannot easily be separated without a state-management layer or event-driven hydration.
