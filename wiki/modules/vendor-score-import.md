---
type: module
slug: vendor-score-import
title: Vendor Score Import Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004, ADR-005, vendor-scoring, bulk-vendor-ops]
confidence: high
sensitive: false
created: 2026-05-06
updated: 2026-05-07
---

# Vendor Score Import Module

**File**: `js/vendor_score_import.js` (v6.10.47)
**Pattern**: wide → long CSV import via shared `csvImportFlow` helper (v6.10.45), bulk upsert to `vendor_scores`
**Sidebar route**: none — registered on shell load, exposed via topbar import button

## Purpose

One row per vendor → N `(vendor_id, category_key, score)` tuples bulk-saved with `on_conflict=vendor_id,category_key`. Implements the 14-category [[ADR-005]] rubric ingest path; complements per-vendor inline edits and [[bulk-vendor-ops]]. CSV columns map to `CAT_DEFS` keys (e.g. `rebates`, `freight`, `credit_terms`); aliases tolerated via `_buildVendorScoreAliasMap`.

## Functions

| function | role |
|----------|------|
| `sbBulkSaveVendorScores(rows)` | wide → long expansion: skips rows with no resolved `_vendor_id`, validates score is `0–10` numeric, builds `longRows` with `updated_at` + `updated_by` (= `CU.name` or `Bulk Import`), POSTs to `/vendor_scores?on_conflict=vendor_id,category_key` with `Prefer: resolution=merge-duplicates,return=minimal`. Returns inserted count or `false` on failure |
| `_buildVendorScoreAliasMap()` | builds header-name → `CAT_DEFS.key` map. Auto-derives lower + slug variants of `c.label`. Hand-coded variants for `mktgFunds` / `lightsAm` / `webListing` / `repScore` / `l1Member`. Vendor-name aliases: `vendor`, `manufacturer`, `brand`, `name` |
| IIFE `registerVendorScoreImport` | wires `csvImportFlow` with the config below |

## csvImportFlow config

| field | value |
|-------|-------|
| `key` | `vendorScore` |
| `tableName` | `vendor_scores` |
| `templateRows` | header + 2 sample rows (Hinkley, Hudson Valley Lighting) with all 14 category cells filled |
| `aliasMap` | from `_buildVendorScoreAliasMap` |
| `requiredFields` | `[vendor_name]` |
| `normalizers` | per-category: clamp `0–10`, NaN / out-of-range → `null` (skipped at save) |
| `postProcess` | `vendor_name` → `vendor_id` via `VD.find(v.n.toLowerCase().trim() === ...)`; unmatched names tracked in `ctx.trackers.vendor.unmatched` Set; `_scoreKeys` array + `_scoreCount` stamped for preview |
| `previewColumns` | Vendor (with `·linked` / `·no match` badge), Scores (`N/14` mono), Sample (first 4 `key:value` pairs) |
| `bulkSave` | `sbBulkSaveVendorScores` |
| `onSuccess` | re-runs `sbLoadVendorScores`, re-renders Vendors page if `pg-content` mounted |
| `auditEvent` | `vendor_scores_import` |

## Read dependencies

- `CAT_DEFS` (inline shell) — drives both column whitelist and normalizer map; required for module to register
- `VD` — for name → id resolution
- `csvImportFlow` — shared helper in `js/csv_import.js`
- `sbConfigured`, `sbFetch`, `CU`, `sbLoadVendorScores`, `renderVendors`, `$`, `esc` (all inline shell)

## Score validation

- Empty / `null` / non-numeric → skipped at normalizer
- Outside `0–10` → skipped at both normalizer and `sbBulkSaveVendorScores`
- Each row independently expands; one bad cell does not invalidate other cells

## Failure modes

- Module silently no-ops if `csvImportFlow` or `CAT_DEFS` are missing at load time (guard at top of IIFE)
- `sbConfigured() === false` → `sbBulkSaveVendorScores` returns `false` and the import flow shows a config error toast
- Unmatched vendor names accumulate in the `vendor.unmatched` tracker but do not block save of matched rows

## Related

[[ADR-002]] · [[ADR-004]] · [[ADR-005]] · [[vendor-scoring]] · [[bulk-vendor-ops]]
