# Runtime Stability Audit - AccentOS

This document identifies fragile runtime regions, potential race conditions, and missing guards in the AccentOS application.

## 1. Fragile Runtime Regions

### The `goTo` Dispatcher
- **Observation:** The `goTo` function maps a page string to a function reference in a local object.
- **Fragility:** If a new module is added to `index.html` but forgotten in the `pages` map, the application fails silently with a blank screen.
- **Risk:** High. This is a common point of regression during modularization.

### Modal State Reset
- **Observation:** Many modals (e.g., `openVendorDetail`) mutate global variables like `LI` or `CQ` without a guaranteed cleanup on close.
- **Fragility:** If a user closes a modal mid-edit and opens a new record, remnants of the previous edit may persist.

## 2. Potential Race Conditions

### Hydration Completion
- **Observation:** `hydrateFromSupabase` initiates multiple `await` calls but does not set a global `isHydrated` flag.
- **Hazard:** A user with a fast connection might navigate to a page like "Reports" before the final `sbLoad` call has completed, resulting in incomplete CSV exports.

### Realtime Sync vs. Manual Refresh
- **Observation:** The `internalmeetings` module applies realtime updates to local arrays.
- **Hazard:** If a manual `sbFetch` is triggered while a realtime event is processing, there is a risk of duplicate items or state overwrite.

## 3. Missing Guards

### Table Existence Checks
- **Observation:** Most modules log an error if their Supabase table is missing (404), but they still attempt to render an empty state.
- **Improvement:** Modules should explicitly surface a "Migration Required" UI if their primary table is missing.

### User Role Verification
- **Observation:** Sidebar navigation is gated by role, but the underlying page render functions do not always re-verify the role.
- **Hazard:** A user could theoretically trigger `goTo('mgmt')` from the console even if their role doesn't allow it.

## 4. Initialization Order Hazards

- **Utility Dependency:** `js/vendor_score_import.js` requires `csvImportFlow` (from `js/csv_import.js`) and `CAT_DEFS` (from `index.html`).
- **Hazard:** If the script tags in `index.html` are reordered, or if one script fails to load, the dependent modules will throw `ReferenceError` on startup.
