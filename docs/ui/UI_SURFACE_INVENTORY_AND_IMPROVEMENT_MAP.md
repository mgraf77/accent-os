# AccentOS UI Surface Inventory & Improvement Map (May 2026)

## A. Current Visible App Surfaces

### 1. Shell / Shell Navigation
- **Sidebar (`#sb`)**: Primary navigation rail. Features a collapsible design, brand logo, user chip with role, and a scrollable navigation list (`#sb-nav`).
- **Topbar**: Fixed header containing the mobile menu toggle, current page title/subtitle, global search bar (Cmd+K), and a notification bell host.
- **Main Content Area (`#pg-content`)**: The primary viewport where module-specific rendering occurs.
- **Quick Actions FAB (`#qa-fab`)**: A floating "+" button in the bottom-right corner that opens a menu for rapid creation (Quote, Customer, Deal, etc.) and navigation.
- **Mobile Backdrop**: Semi-transparent overlay used when the sidebar is open on small screens.

### 2. Dashboards
- **Executive Dashboard**: Role-specific views (Owner, Admin, Manager) featuring high-level KPIs, activity feeds, and system health summaries.
- **Sales Dashboard**: Personalized for Sales users, showing active deals, personal forecast, and a "Today's Call List" for customer follow-ups.
- **Warehouse Dashboard**: Minimalist view focused on recent inventory activity and quick links to inventory data.

### 3. Pricing / Inventory Workflows
- **Inventory Module**: Found under the "Vendors" tab (due to the "Reference Only" phase). Includes:
    - Stat cards for tracked SKUs, units on hand, value, and low stock.
    - CSV Import/Paste interface for Windward ERP data sync.
    - Searchable/filterable inventory table with inline editing for quantities, reorder points, and locations.
- **Price Book**: A sub-tab within the Vendors module for managing item pricing.

### 4. Runtime / System Panels
- **Signals Debug Panel**: A floating overlay (`#signals-debug-panel`) showing queue depth, worker status, and RPC errors (activated via URL param).
- **Activity Feed**: Audit log of system events, vendor changes, and pipeline activity.
- **Health Check**: Technical diagnostics page showing schema status and hydration metrics.

### 5. Settings / System Info
- **Settings Page**: Generic placeholder for user preferences and system configuration.
- **Module Modes**: A management sub-tab (Admin/Owner only) for controlling the rollout state of every module.

### 6. Queue / Signal Panel
- **Alerts Module**: Visible to all users, showing auto-generated alerts derived from business data.
- **Signals Runtime Integration**: Hooks exist within modules (like Inventory) to trigger background effects (e.g., pricing updates).

---

## B. UX Friction Points

1.  **Confusing Labels/Navigation**:
    - "Inventory" being a sub-tab of "Vendors" is unintuitive for new operators.
    - "Decision Engine" vs "Intelligence" section labels overlap conceptually.
2.  **Missing Status Indicators**:
    - No visual "Pulse" or health indicator on the main sidebar for system-wide status.
    - Inline edit feedback in the inventory table is subtle (toast only).
3.  **Hard-to-find Workflows**:
    - The "Today's Call List" is buried on the Sales Dashboard; it doesn't have a dedicated home.
4.  **Weak Hierarchy**:
    - Stat cards on dashboards often have identical styling, making it hard to identify "Critical" vs "Informational" metrics at a glance.
5.  **Mobile Issues**:
    - Large data tables (Inventory, Vendor Ranking) require horizontal scrolling and lack a optimized "Card View" for mobile.
6.  **Operator Trust Issues**:
    - Frequent "Reference-only" or "Manual Sync" banners remind users of data staleness.

---

## C. Low-Risk Improvements Map

### SAFE NOW (No runtime risk, CSS/HTML-only)
- **Visual Polish**: Add CSS-only "Pulse" animations to critical alerts.
- **Typography Fixes**: Ensure DM Mono is consistently applied to all numeric data (SKUs, Prices) for ocular alignment.
- **Empty States**: Improve the "No data" messaging in dashboards with clearer calls-to-action.
- **UI Hierarchy**: Introduce a `stat-critical` class for cards that need immediate attention.

### WAIT FOR RUNTIME PROOF (Requires stable logic)
- **Signal Dot Integration**: Adding the "6-Dot Executive Strip" to the Topbar once signal logic is verified.
- **Actionable Alerts**: Converting static alert rows into "Signal Cards" with swipe/click actions.
- **Real-time Counters**: Live-updating badges on sidebar icons.

### WAIT FOR INDEX DECOMPOSITION (Requires architectural change)
- **Module Splitting**: Moving "Inventory" from a sub-tab to a top-level nav item.
- **Responsive Tables**: Implementing a true "Mobile Card View" for large datasets.
- **Navigation Refactor**: Consolidating the 4 different shell touchpoints into a unified registry.

---

## D. Suggested First UX Sprint (The "Glanceability" Sprint)

1.  **Metric Highlighting**: Implement `stat-warning` and `stat-critical` styling for dashboard cards (red/amber borders + subtle pulse).
2.  **Mono Consistency**: Audit and enforce DM Mono on all price/quantity/SKU cells in the Inventory and Vendor modules.
3.  **Topbar Pulse**: Add a single status dot next to the app name in the topbar that pulses green/amber/red based on simple connectivity/auth health.
4.  **Sidebar Clarity**: Add tooltips to sidebar icons when collapsed.
5.  **Empty State Illustration**: Replace "No data" text with simple SVG icons and "Start by [Action]" buttons.

---

## E. Michael's UI Verification Checklist

- [ ] **Sidebar**: Navigation items click through to correct pages; active state highlights correctly.
- [ ] **Topbar**: Search bar focuses on Cmd+K; Title updates correctly on page change.
- [ ] **Dashboards**: Stat cards load for each role (Admin, Sales, Warehouse).
- [ ] **Inventory**: Table is searchable; inline edit field shows "Saving" state (background change) on blur.
- [ ] **Mobile**: Sidebar opens/closes smoothly; content doesn't overflow horizontally beyond tables.
- [ ] **Quick Actions**: FAB opens menu; clicking "New Quote" navigates to the Quote Generator.
