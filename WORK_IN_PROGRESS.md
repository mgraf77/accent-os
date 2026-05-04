## WORK IN PROGRESS
> Overwritten after every discrete build step. Shows exactly what was happening if Codespace dies.

**Last updated:** 2026-05-04 — starting Track 5.3 Inventory CSV phase 1
**Current task:** 5.3 Inventory Module — CSV import phase 1
**Step:** Planning. Existing renderInventory() at index.html:5150 is a placeholder. Need to:
  1. Write `sql/M22_inventory_schema.sql` (inventory_items table)
  2. Replace placeholder with CSV upload UI + filterable inventory list
  3. Wire sbLoad/Save/DeleteInventoryItem persistence (no-ops gracefully if table missing — same pattern as M21 modules)
  4. Add CSV parse + preview + commit flow
  5. Add M22 entry to BUILD_PLAN_MICHAEL
**Files touched so far this task:** none yet
**Commit status:** clean working tree
**Next step if interrupted:** Resume from step 1 above. No partial files in working tree to clean up. The inventory tab still shows the "Coming Soon" placeholder — it's safe to leave or rebuild.
