---
type: module
slug: labels
title: Labels Module (Track 5.9 QR / Barcode Labeling)
sources: [source-build-intelligence]
related: [ADR-002, ADR-004, inventory, purchase-orders, showroom-displays]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-07
---

# Labels Module

**File**: `js/labels.js` (M26 schema: `label_batches`)
**Pattern**: stateless QR-code sheet generator + persisted batch history; printable via `window.print()` and a scoped `@media print` stylesheet
**Sidebar route**: `labels` (CORE, all roles)

## Purpose

Generates printable QR-code label sheets for warehouse bins, inventory SKUs, and showroom display tags. QR encoding via `api.qrserver.com` (free, no API key, GET-based image URLs) — acceptable for v1 because SKU data is non-sensitive. Two input modes (manual textarea vs inventory picker), three sizes (1.5"×1.5" / 2"×2" / 3"×3"), 2–6 columns. Saved batches archive prior runs for reprint.

## Functions

| function | role |
|----------|------|
| `sbLoadLabelBatches()` | GET `/label_batches?order=created_at.desc&limit=100`; tolerant of missing M26 table |
| `sbSaveLabelBatch(rec)` | POST one batch row: `{name, mode, items, size, cols, show_text, created_by}` |
| `labels(el, act)` | sidebar route; renders `History` + `Save batch` + `Print` topbar buttons |
| `renderLabels(el)` | banner + 4 stat cards + source-panel (manual/inventory toggle) + layout-panel + WYSIWYG sheet preview; injects `lbl-print-style` once per session |
| `toggleLblSel(id, checked)` | inventory checkbox handler |
| `lblSelectAll(on)` | bulk checkbox over current filtered window (200 max), or clear-all |
| `loadManualLabels()` | parses textarea: one line = `value | caption` (caption optional), trims, drops blanks |
| `loadInventoryLabels()` | maps `lblSelected` IDs against `INVENTORY` → `{value: sku\|id, caption: description}` |
| `printLabels()` | audits `labels_print`, then `setTimeout(window.print, 50)` to flush DOM first |
| `saveLabelBatch()` | prompts for batch name, persists via `sbSaveLabelBatch`, prepends to `LABEL_BATCHES` |
| `openLabelBatchHistory()` | modal listing saved batches with item count + size + cols + date; click row → load |
| `loadBatchFromHistory(batchId)` | restores `lblMode/lblItems/lblSize/lblCols/lblShowText` from a saved batch |

## Source modes

- **Manual**: free-text `value | caption` lines. Used for ad-hoc bin tags, PO numbers, custom asset IDs.
- **From Inventory**: filterable picker over `INVENTORY` (200-row window after search), checkbox multi-select. `value = r.sku || r.id`, `caption = r.description`.

## Print pipeline

`renderLabels` injects `<style id="lbl-print-style">` (once per session) that hides every element except `.lbl-print-area` during `@media print` and absolute-positions the sheet at `(0,0)` so the browser's native print dialog generates a clean page. **Operator tip baked into the UI**: set printer to "Actual size" (not "Fit to page") so QR codes scan reliably. Sheet caps at first 100 items to keep render under control.

## Sizing

| size | QR px | font (value) | font (caption) |
|------|-------|--------------|---------------|
| small | 130 | 9 | 8 |
| medium | 180 | 11 | 9 |
| large | 260 | 13 | 11 |

Columns: 2/3/4/5/6. Toggle "Show text under QR" suppresses caption + value lines for icon-only sheets.

## State

`LABEL_BATCHES` (history), `lblMode` (`manual` | `inventory`), `lblItems` (current sheet), `lblSelected` (Set of inventory IDs), `lblSize`, `lblCols`, `lblShowText`. Window-scoped: `_lblInvQ` (search box), `_lblInvDeb` (250ms debounce).

## Read dependencies

`INVENTORY` (for the inventory picker), `CU` (for `created_by` stamp).

## Shell touchpoints

- Sidebar: `data-roles="Owner,Admin,Manager,Sales,Warehouse"` → `goTo('labels')`
- PAGE_META: `labels: {t:'Labels', s:'QR + Barcode label printing'}`
- Dispatcher: `labels` key in `pages` map
- Hydrate: `sbLoadLabelBatches()` in `hydrateFromSupabase` chain
- Modal helpers: `openModal`, `closeModal`, `toast`, `esc`, `sbFetch`, `$`
- Audit events: `labels_print`, `labels_batch_save`

## Related

[[ADR-002]] · [[ADR-004]] · [[inventory]] · [[purchase-orders]] · [[showroom-displays]]
