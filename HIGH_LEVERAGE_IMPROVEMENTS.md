# HIGH_LEVERAGE_IMPROVEMENTS.md

## 1. Extract Remaining Modules from `index.html` (v7.0)
Move `vendors`, `quotes`, `mgmt`, and `dashboard` logic into their own `js/` files.
- **Impact:** Reduces `index.html` to a true shell (~500 lines). Improves maintainability and reduces regression risk.
- **Risk:** Low (pure refactor).

## 2. Parallelize Hydration Sequence
Modify `hydrateFromSupabase` to use `Promise.all()` for independent data fetches.
- **Impact:** Drastically reduces initial load time, especially on high-latency connections.
- **Risk:** Low-Medium (must ensure dependency-ordered loads, like score states depending on `VD_RAW`, remain sequential).

## 3. Implement Shared UI Helper Library (`js/ui.js`)
Consolidate repeated HTML patterns into functional generators.
- **Example:** `ui.statCard({label, value, sub})`, `ui.badge(status)`, `ui.editableCell(id, field, value)`.
- **Impact:** Ensures design consistency and reduces code volume by ~10% across modules.

## 4. Enhanced Customer FK Resolution
Strengthen the `resolveCustomerByName` utility and mandate its use in all module write-paths.
- **Impact:** Automatically builds a clean customer graph without manual deduping efforts.
- **Leverage:** Unlocks reliable LTV (Lifetime Value) calculations.

## 5. Implement "One-Click Action" Buttons on Alerts
Add direct action buttons (e.g., "Draft Email") to the Alerts and Decision Engine rows.
- **Impact:** Reduces operational steps from 4-5 clicks down to 1-2.
- **Leverage:** Increases the adoption rate of system recommendations.

## 6. Smart Sidebar Collapsing
Implement logic to auto-hide or group less-frequently used modules (e.g., ADMIN section) based on role and usage frequency.
- **Impact:** Improves focus on core operational tools.
- **Mobile Benefit:** Reduces vertical menu scrolling.

## 7. Versioned CSS/JS Includes
Append `?v=VERSION` to all module script tags (previously done but needs automation/standardization).
- **Impact:** Prevents "stale cache" bugs where users see older logic after a deployment.
