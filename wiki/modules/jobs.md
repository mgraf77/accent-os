---
type: module
slug: jobs
title: Jobs Module
sources: [source-build-intelligence]
related: [ADR-002, ADR-004]
confidence: medium
sensitive: false
created: 2026-05-06
updated: 2026-05-06
---

# Jobs Module

**File**: `js/jobs.js`
**Pattern**: compact-CRUD module per [[ADR-002]] and [[ADR-004]]

## Functions

- `sbLoadJobs()`
- `sbSaveJob()`
- `sbBulkSaveJobs()`
- `sbDeleteJob()`
- `jobs()`
- `renderJobs()`
- `doBulkJobStatus()`
- `openJobEdit()`
- `saveJob()`
- `deleteJobConfirm()`
- `downloadJobCsvTemplate()`
- `openJobCsvPaste()`
- `onJobFilePick()`
- `processJobCsvText()`
- `createJobFromQuote()`
- `createJobFromDeal()`
- `sbUpdateJobField()`
- `commitJobCellSelect()`
- `commitJobCsv()`

## Shell touchpoints

- Sidebar entry in index.html (CORE or INTELLIGENCE section)
- PAGE_META entry: `jobs: {t:'...', s:'...'}`
- pages dispatcher: `jobs` key
- Hydrate call in sbHydrate()

## Related

[[ADR-002]] · [[ADR-004]]
