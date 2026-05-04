## WORK IN PROGRESS
> Overwritten after every discrete build step. Shows exactly what was happening if Codespace dies.

**Last updated:** 2026-05-04 — starting Track 5.4 Purchase Orders
**Current task:** 5.4 Purchase Orders
**Step:** Planning. Will write M23 schema (purchase_orders + po_lines), build a top-level "Purchase Orders" page (CORE section), with manual create + line-item editor + status workflow (draft/sent/confirmed/partial/received/cancelled). Receipt action to optionally bump matching inventory_items.qty_on_hand.
**Files touched so far this task:** none
**Commit status:** clean working tree (last commit pushed: cc62822)
**Next step if interrupted:**
1. Write `sql/M23_purchase_orders_schema.sql` with purchase_orders + po_lines tables
2. Add "Purchase Orders" sidebar entry (CORE section, Owner/Admin/Manager — sales+ optional)
3. Add `purchaseOrders()` page render with list + stats + filters
4. Add Edit modal with vendor dropdown + line-item editor
5. Add receipt flow that increments inventory qty_on_hand for matching SKUs
6. Add M23 to BUILD_PLAN_MICHAEL
