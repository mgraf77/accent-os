## PROMPT QUEUE
> Michael adds prompts here when Claude Code is busy. Claude Code reads and executes them top to bottom at the start of each session, then clears completed ones.

### QUEUED
(empty)

### COMPLETED
- [x] **2026-05-04** — M21, M22, M23 SQL ran clean. Mark all three [x] in BUILD_PLAN_MICHAEL.md. Execute file split now — index.html is at 809KB, split before adding any more modules. Follow Track 0.1 pattern. After split confirmed clean, continue: 5.5 Trade Partner Network → 5.11 Warranty Tracker.
  - **Done:** M21/M22/M23 marked [x] in BUILD_PLAN_MICHAEL (commit 6409342). File split shipped v6.10.12 — 9 modules → js/ (commit 58539f9). 5.5 Trade Partners shipped v6.10.13 (`js/trade_partners.js`). 5.11 Warranty Tracker shipped v6.10.14 (`js/warranty.js`). M24 SQL added to BUILD_PLAN_MICHAEL for the 2 new tables. All commits 8b599a4, cd8cf3f.
- [x] **2026-05-04** — M07 and M08 locked: Customers scores visible to Sales+. Employees scores visible to Owner/Admin/Manager only. Both modules: build UI and schema hooks now, wire CSV import when Michael provides Windward file. Manager role confirmed as distinct viewer for employee scores everywhere in the codebase.
  - **Done in prior sessions:** M07 + M08 locked in BUILD_PLAN_MICHAEL.md. 1.4 Customers shipped v6.10.3 (Sales+ via sidebar `data-roles="Owner,Admin,Manager,Sales"`; Warehouse blocked at module entry). 3.1 Employee Scorecards shipped v6.10.4 as a Mgmt Dashboard tab (parent gate `data-roles="Owner,Admin,Manager"`); explicit "Restricted view" banner on the page; employees do not see their own scores. Manager role appears alongside Owner/Admin throughout the role visibility matrix and employees module restriction. Audit verified 2026-05-04: js/employees.js:1 + line 123 banner; index.html:358 ADMIN section data-roles + index.html:361 mgmt route.
