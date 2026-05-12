# Duplicate Helper Patterns Audit - AccentOS

This document identifies repetitive logic and helper patterns across the AccentOS codebase that are candidates for consolidation into a shared `js/utils.js` or `js/core.js` file.

## 1. Currency & Number Formatting

Currently, currency formatting is handled by multiple overlapping functions and inline implementations.

### Redundant Helpers
- `fmt$(n)` (in `index.html`): Formats numbers as USD with 0 fractional digits.
- `fmtS(n)` (in `index.html`): Formats large numbers using M/K suffixes (e.g., $1.2M, $45K).
- `fmtTick(v)` (in `index.html`): A local variant of `fmtS` used for chart axes.
- `Number(n).toLocaleString(...)`: Used inline in ~20 places with varying configurations.
- `Number(n).toFixed(2)`: Used inline in ~15 places for prices.

### Recommended Action
Consolidate into a single `formatCurrency(n, options)` utility that supports suffixes and precision.

## 2. Date & Time Formatting

### Redundant Helpers
- `imFmtDate(d)` (in `js/internal_meetings.js`): Formats dates for the meetings module.
- `imFmtTime(d)` (in `js/internal_meetings.js`): Formats time for the meetings module.
- `_mtTodayStr()` (in `js/my_tasks.js`): Returns YYYY-MM-DD.
- `new Date(ts).toLocaleString()`: Used inline in `index.html` (Changelog) and `js/activity_feed.js`.
- `new Date().toLocaleDateString()`: Used inline in `index.html` (Quotes).

### Recommended Action
Standardize on a `formatDate(d, type)` utility that handles 'ISO', 'display', 'short', and 'time'.

## 3. CSV Operations

### Redundant Patterns
- `csvStringify(rows)`: Defined once but could be moved to shared utils.
- `csvDownload(rows, filename)`: Defined once but used by many modules.
- `parseCsv(text)`: Used for all bulk imports.

### Recommended Action
These are already fairly standardized but should be moved from `index.html` to a dedicated `js/csv_utils.js`.

## 4. UI Patterns (Inline CSS & Templates)

### Observation
Many modules use identical inline styles for "Stat Cards", "Badges", and "Tables".

- **Stat Cards:** The HTML structure for dashboard-style statistics is repeated in `index.html`, `js/decision_engine.js`, and `js/reports.js`.
- **Badges:** CSS classes like `badge`, `bg-green`, etc., are consistent, but the HTML generation is duplicated.

### Recommended Action
Create a `js/ui_helpers.js` that provides functional components for common UI elements (e.g., `renderStatCard(label, value, sub)`).

## 5. Global State & LocalStorage Keys

### Observation
LocalStorage keys are often hardcoded strings (e.g., `'aos-sb-key'`, `'aos-api'`).

### Recommended Action
Define a `CONSTANTS.js` or include a `KEYS` object in a shared utility file to prevent drift and naming collisions.
