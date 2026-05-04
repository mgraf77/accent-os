## WORK IN PROGRESS
> Overwritten after every discrete build step. Shows exactly what was happening if Codespace dies.

**Last updated:** 2026-05-04 — starting Track 5.12 Marketing Hub
**Current task:** 5.12 Marketing Hub (full build)
**Step:** Planning. Current `marketing()` at index.html:5611 is a static placeholder showing "Site Issues" + "Agency Status". Plan: (1) write `sql/M29_marketing_schema.sql` with marketing_campaigns + marketing_assets tables; (2) write `js/marketing.js` with multi-tab module: Campaigns CRUD / Assets CRUD / Site Audit (keep existing); (3) replace inline marketing() function with stub that delegates to new module; (4) add script tag; (5) hydrate calls; (6) BUILD_PLAN + BUILD_PLAN_MICHAEL updates.
**Files touched so far this task:** PROMPT_LOG.md (logged), WORK_IN_PROGRESS.md (this)
**Commit status:** about to commit log + WIP
**Next step if interrupted:** Write M29 SQL → js/marketing.js → wire into shell → commit → push.
