# Dead Logic & Orphan Utility Audit - AccentOS

This document identifies orphaned functions, obsolete utilities, and redundant logic patterns discovered during the deep repository audit.

## 1. Dead Code in `index.html`

The following functions are defined but have no active callers in the current build (v6.10.75).

| Function | Responsibility | Reason for Status |
|---|---|---|
| `aiSummary()` | Legacy AI helper. | Superseded by `aiParseNotes()`. |
| `buildRepOutreachEmail()` | Formal email generator. | Logic was inlined into the current version of `openRepOutreach()`. |
| `openCSVImport()` | Old Vendor Ranking import. | Superseded by `js/vendor_score_import.js`. |
| `unverifiedCountFor()` | Scoring helper. | Redundant; logic is handled by `vendorScore(v).unverifiedCount`. |

## 2. Orphaned Module Utilities

Functions in `js/` files that are defined but never invoked by the module itself or the application shell.

- **`js/internal_meetings.js`**: `imRtUnsubscribeList()` - Realtime channel management logic that is currently orphaned.
- **`js/module_modes.js`**: `moduleModeBadge()` - A UI helper for rendering status badges that is not referenced by the current sidebar logic.

## 3. Duplicate Helper Patterns

The following patterns are implemented multiple times across the codebase, indicating a need for a shared utility layer.

### Currency Formatting
- **Pattern:** `$${n.toLocaleString()}` or `$${n.toFixed(2)}`.
- **Occurrences:** Found in ~35 places across `index.html`, `js/global_search.js`, `js/decision_engine.js`, and `js/reports.js`.

### Date Formatting
- **Pattern:** `new Date(ts).toLocaleDateString()` or custom string slicing.
- **Occurrences:** Every module handling timestamps (Quotes, Meetings, Activity, Changelog) implements its own formatting logic.

## 4. Obsolete Runtime Assumptions

- **Existence Guards:** Many modules use `if(typeof VD !== 'undefined')`. While safe, these guards indicate a lack of confidence in the initialization order. Standardizing the boot sequence (see `STARTUP_DEPENDENCY_ORDER.md`) would allow for cleaner code.
- **`aiParseNotes` System Prompt:** The system prompt in `index.html` contains a hardcoded "Known Fixture Code Map". This map is a static assumption that will drift as the business handles new projects. It should be moved to a configuration table or external JSON.

## 5. Shared State Mutation "Hotspots"

Multiple files mutate the same global arrays, creating a high risk of race conditions or inconsistent state.

- **`CUSTOMERS`**: Mutated by `js/customers.js` (CRUD), `js/csv_import.js` (Bulk), and `index.html` (Hydration).
- **`VD`**: Mutated by `index.html` (Hydration/Add) and `js/bulk_vendor_ops.js` (Bulk updates).
