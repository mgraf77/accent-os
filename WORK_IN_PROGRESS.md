## WORK IN PROGRESS
> Overwritten after every discrete build step. Shows exactly what was happening if Codespace dies.

**Last updated:** 2026-05-04 — starting Track 5.6 Price Book
**Current task:** 5.6 Price Book — catalog with margin analysis
**Step:** Planning. Will build as a pure-compute view over inventory_items (already exists from 5.3) + vendor data. No new schema. Filters: vendor, margin tier, in-stock only. Stats: total SKUs / avg margin / margin distribution by tier. Sub-tab on Vendor Ranking.
**Files touched so far this task:** none yet
**Commit status:** clean working tree (last commit pushed: 3066a48)
**Next step if interrupted:** Read the renderInventory() pattern at index.html (search "5.3 INVENTORY"), build a parallel renderPriceBook() that pivots margin = (list_price - unit_cost)/list_price. Add as sub-tab "Price Book" alongside the optimizer. No persistence needed — pure compute.
