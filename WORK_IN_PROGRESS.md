## WORK IN PROGRESS
> Overwritten after every discrete build step. Shows exactly what was happening if Codespace dies.

**Last updated:** 2026-05-04 — M22 SQL written, starting JS module
**Current task:** 5.3 Inventory Module — CSV import phase 1
**Step:** SQL written (`sql/M22_inventory_schema.sql`). Next: replace placeholder renderInventory() at index.html:5150 with CSV-import + filterable list, then wire persistence.
**Files touched so far this task:**
- sql/M22_inventory_schema.sql (created, uncommitted)
- WORK_IN_PROGRESS.md (this file, just updated)
**Commit status:** uncommitted SQL file
**Next step if interrupted:**
1. `git add sql/M22_inventory_schema.sql WORK_IN_PROGRESS.md && git commit -m "wip: 5.3 Inventory CSV — M22 SQL written"`
2. Replace renderInventory() in index.html (currently a "Coming Soon" placeholder at line ~5150) with: CSV paste/upload + parse + preview + commit; filterable inventory list; sbLoad/Save/DeleteInventoryItem
3. Add INVENTORY array + sbLoadInventory call in hydrateFromSupabase
4. Add M22 entry to BUILD_PLAN_MICHAEL
