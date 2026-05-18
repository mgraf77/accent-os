# DUPLICATION_ANALYSIS.md

## 1. Redundant Utility Functions
Multiple variations of similar utility functions exist across the core shell and individual modules.
- **Currency Formatting:** `fmt$(n)`, `fmtS(n)`, and `fmtTick(v)` in `index.html` overlap with `Number(n).toLocaleString()` used inline in ~20 places.
- **Date Formatting:** `imFmtDate` and `imFmtTime` in `internal_meetings.js` vs. `_mtTodayStr()` in `my_tasks.js` vs. inline `toLocaleDateString()` in `quotes`.
- **CSV Handling:** `parseCsv` is defined in `inventory.js` but used by `customers.js` and `vendor_score_import.js`. `csvDownload` and `csvStringify` are in `index.html`.

## 2. Repeated UI Component Patterns
Identical HTML/CSS structures are manually coded into `.innerHTML` strings rather than using shared templates or components.
- **Stat Cards:** The 4-column grid of statistical summaries is manually repeated in `dashboard()`, `decisionengine()`, `customers()`, `inventory()`, etc.
- **Table Row Renderers:** Complex row logic (e.g., inline edit inputs with `onblur` and `onkeydown` guards) is duplicated between `customers.js` and `inventory.js` with only field-name variations.
- **Status Badges:** Color-coded status pills use consistent CSS classes (`badge bg-green`) but inconsistent logic for mapping status strings to colors.

## 3. Logic Overlap
- **Search Logic:** `global_search.js` implements a scoring algorithm (`_gsScoreObj`) that is partially duplicated by the search/filter logic in `renderVendors` and `renderCustomers`.
- **Alert Heuristics:** `alerts.js` and `decision_engine.js` both analyze deals and quotes for "staleness", but with slightly different day-count thresholds and "impact" math.
- **Customer Resolution:** `resolveCustomerByName` exists in `customers.js` but several modules still use name-string matching without calling this shared utility.

## 4. Architectural Entropy (Hardcoded Keys)
- **LocalStorage Keys:** Strings like `'aos-sb-key'`, `'aos-api'`, and `'accent_quote_draft'` are scattered across files, making it hard to manage "clear all" or migration logic.
- **Supabase Table Names:** Table names are hardcoded in every `sbFetch` call, leading to risk if schema names ever need to change.

## 5. Duplicate Inline Styles
Significant amounts of inline CSS are embedded in JS strings. While effective for modularity in this framework-less stack, it leads to "pixel drift" where margins and colors vary slightly between pages.
