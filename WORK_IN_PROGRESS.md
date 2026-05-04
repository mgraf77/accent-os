## WORK IN PROGRESS
> Overwritten after every discrete build step. Shows exactly what was happening if Codespace dies.

**Last updated:** 2026-05-04 — v6.10.12 file split shipped, ready for 5.5
**Current task:** v6.10.12 file split — committing
**Step:** 9 modules extracted to js/. index.html 829→680KB. JS parses clean. About to commit + push, then start 5.5 Trade Partner Network.
**Files touched so far this task:**
- js/customers.js, employees.js, knowledge_hub.js, jobs.js, purchase_orders.js (committed in phase 1)
- js/calendar.js, inventory.js, price_book.js, deal_optimizer.js (uncommitted)
- index.html (4 more module blocks removed; 4 script tags added)
- BUILD_PLAN_CLAUDE.md (0.1 entry rewritten with actual ship details)
**Commit status:** uncommitted (calendar/inventory/price_book/deal_optimizer + index.html + BUILD_PLAN updates)
**Next step if interrupted:**
1. `git add js/calendar.js js/inventory.js js/price_book.js js/deal_optimizer.js index.html BUILD_PLAN_CLAUDE.md WORK_IN_PROGRESS.md`
2. `git commit -m "v6.10.12: file split phase 2 — 4 more modules extracted, 0.1 truly shipped"`
3. `git push origin main`
4. Start 5.5 Trade Partner Network as new external module file `js/trade_partners.js`. Schema: M24 (trade_partners table). Sidebar entry under CORE.
5. After 5.5, ship 5.11 Warranty Tracker similarly (likely js/warranty.js, schema M25 or fold into M24).
