# MODULE_CONSOLIDATION_OPPORTUNITIES.md

## 1. Shared Bulk Operations Engine
Consolidate `bulk_select.js` and `bulk_vendor_ops.js` into a single `js/operations.js`.
- **Reason:** Bulk selection, action bars, and multi-row persistence follow identical patterns across Vendors, Customers, and Inventory.
- **Benefit:** Reduces code duplication and ensures all list pages have consistent multi-action capabilities.

## 2. Intelligence Merger (Alerts + Decision Engine)
Merge `js/alerts.js` and `js/decision_engine.js` into `js/intelligence.js`.
- **Reason:** Both modules perform heuristic analysis on the same datasets (Deals/Quotes/Customers).
- **Benefit:** Shared "Rule Engine" for staleness, probability, and risk, ensuring a single source of truth for business intelligence.

## 3. Reports & CSV Export Unification
Move all `csvDownload` and `export*CSV` logic from individual modules and `index.html` into `js/reports.js`.
- **Reason:** Every module implements its own CSV header mapping and row stringification.
- **Benefit:** Centralized schema mapping for Windward ERP compatibility and easier maintenance of export templates.

## 4. Admin Panel Consolidation
Merge `health.js`, `module_modes.js`, and the "System" tab of `mgmt` into a single "Admin/Ops" module.
- **Reason:** These tools are exclusively for Owner/Admin roles and are used for system diagnostics rather than business operations.
- **Benefit:** Simplifies the sidebar and groups related configuration tools together.

## 5. Vendor Dashboard Hub
Consolidate `vendor_score_import.js`, `coop_tracker` (in `index.html`), and `vendors` into a unified Vendor Intelligence hub.
- **Reason:** Vendor data is currently fragmented across three different UI entry points.
- **Benefit:** A true "Vendor 360" view that shows ranking, financial funds, and inventory in one place.
