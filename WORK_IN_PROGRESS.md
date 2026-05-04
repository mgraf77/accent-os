## WORK IN PROGRESS
> Overwritten after every discrete build step. Shows exactly what was happening if Codespace dies.

**Last updated:** 2026-05-04 — file split in progress (5 of ~9 modules extracted)
**Current task:** v6.10.12 file split — extract module JS into separate files
**Step:** Extracted 5 modules so far: customers, employees, knowledge_hub, jobs, purchase_orders. index.html down from 829KB → 736KB. Need to also extract: calendar, inventory, price_book, deal_optimizer (and maybe coop_tracker but it's referenced from Daily Brief so keep inline). JS parses clean across inline + 5 external files.
**Files touched so far this task:**
- js/customers.js (created)
- js/employees.js (created)
- js/knowledge_hub.js (created)
- js/jobs.js (created)
- js/purchase_orders.js (created)
- index.html (5 module blocks removed; 5 script tags added)
- PROMPT_LOG.md (logged earlier, committed)
- BUILD_PLAN_MICHAEL.md (M21/M22/M23 marked done, committed)
**Commit status:** uncommitted file split changes
**Next step if interrupted:**
1. `git add js/customers.js js/employees.js js/knowledge_hub.js js/jobs.js js/purchase_orders.js index.html WORK_IN_PROGRESS.md`
2. `git commit -m "v6.10.12: file split phase 1 — 5 modules extracted"`
3. Continue extractions: calendar, inventory, price_book, deal_optimizer (in reverse line order to avoid line-shifts: deal_optimizer first, then inventory, then price_book, then calendar)
4. After full split, build 5.5 Trade Partner Network → 5.11 Warranty Tracker as new external module files
