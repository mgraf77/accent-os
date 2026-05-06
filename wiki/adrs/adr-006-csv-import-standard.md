---
id: adr-006-csv-import-standard
title: ADR-006 — CSV Import Flow Standardization
type: adr
status: published
weight: 6
tags: [csv, import, bulk-import, csvImportFlow, alias-map, normalization, AccentOS, architecture, pattern]
related: [adr-002-supabase-backend, sop-003-inventory-reorder]
created: 2026-05-06
updated: 2026-05-06
---

# ADR-006 — CSV Import Flow Standardization

## Status

Accepted — `csvImportFlow()` helper shipped v6.10.45 (2026-05-05)

## Context

By v6.10.40, four modules (Inventory, Customers, Trade Partners, Jobs) each had an inline CSV import flow of ~150 LOC. All four followed the same pattern:
1. Download CSV template
2. Open paste modal OR pick file
3. Parse CSV with header alias map
4. Show preview (row count, unknown values, normalization report)
5. Commit to Supabase

The "extract on 4th use" rule from BUILD_INTELLIGENCE was triggered. The varying parts were: the alias map, the entity key (for function naming), field normalizers, duplicate key function, bulk-save function, and reload function. Everything else was identical boilerplate.

## Decision

Extract `csvImportFlow(config)` to `js/csv_import.js`. The helper:
- Takes a config object `{key, aliasMap, normalizers, dupKeyFn, bulkSave, reload}`.
- Registers 5 window-level handlers named by convention: `download${Key}CsvTemplate`, `open${Key}CsvPaste`, `on${Key}FilePick`, `process${Key}CsvText`, `commit${Key}Csv`.
- Ships two normalizer utilities: `csvEnumNormalizer(allowed, fallback)` and `csvNumberNormalizer(min, max)`.

New modules using the helper ship at ~70 LOC of config (down from ~150 LOC inline).

## Consequences

- **Positive**: New bulk-import surfaces are ~50% less code. Adding a 6th module is a config object, not a copy-paste.
- **Positive**: Bug fixes in the flow (parse, preview, commit) propagate to all modules.
- **Negative**: Existing 4 inline imports were NOT refactored — changing working code adds risk without user benefit. They remain inline.
- **Rule**: Any new module with bulk-import uses `csvImportFlow`. Existing modules stay inline until touched for another reason.
- **Rule**: The alias map IS the implementation work — copy the pattern, change the alias map and field list.

## Key patterns

```js
// In js/<module>.js
csvImportFlow({
  key: 'warranty',
  aliasMap: { claim: 'claim_number', sku: 'sku', vendor: 'vendor_name', ... },
  normalizers: {
    status: csvEnumNormalizer(['open','sent_to_vendor','approved','denied','closed'], 'open'),
    cost: csvNumberNormalizer(0, 999999),
  },
  dupKeyFn: r => r.claim_number,
  bulkSave: sbBulkSaveWarranty,
  reload: sbLoadWarranty,
});
```

## Reference

BUILD_INTELLIGENCE entries: `v6.10.45 csvImportFlow extraction`, `v6.10.39 CSV import pattern reuse`.
