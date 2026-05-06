---
id: sop-003-inventory-reorder
title: SOP-003 — Inventory Reorder Workflow
type: sop
status: published
weight: 9
tags: [inventory, reorder, purchase-order, PO, demand-forecast, low-stock, reorder-point, AccentOS, SOP, warehouse]
related: [sop-001-vendor-onboarding, sop-002-quote-to-close, emp-warehouse, windward-erp, adr-005-append-only-observations]
created: 2026-05-06
updated: 2026-05-06
---

# SOP-003 — Inventory Reorder Workflow

Identify low-stock SKUs, generate a purchase order, and update inventory on receipt.

## Prerequisites

- Owner, Admin, or Manager role for PO creation; Warehouse role for receipt
- Inventory module has been seeded (at least one CSV import or Windward sync)

---

## Steps

### 1. Identify reorder candidates

**Option A — Intelligent Alerts (fastest)**
1. Check the topbar bell icon (🔔) or open **AccentOS → Alerts**.
2. Filter by type `inventory_low` — these are items at or below `reorder_point`.
3. Each alert links directly to the inventory item.

**Option B — Demand Forecast module (most complete)**
1. Open **AccentOS → Demand Forecast**.
2. Filter by recommendation **Reorder Now** (red) and **Reorder Soon** (amber).
3. Review suggested reorder quantities — the model targets 14 weeks of forward demand based on PO history.
4. Click **Export CSV** to get a flat file of all reorder candidates with suggested quantities.

**Option C — Inventory list manual review**
1. Open **AccentOS → Inventory**.
2. Toggle **Low Stock Only** filter — shows items where `qty_on_hand ≤ reorder_point`.
3. Inline-edit `reorder_point` if it looks wrong (e.g. vendor increased MOQ).

### 2. Create a Purchase Order

1. Open **AccentOS → Purchase Orders**.
2. Click **+ New PO**.
3. Select vendor.
4. Add line items:
   - Use the Demand Forecast export or Alerts list as your item source.
   - For each item: enter SKU, description, qty (use suggested quantity from Demand Forecast or your own judgment), unit cost (from Price Book or last PO).
5. Add freight estimate and tax if applicable.
6. Link to a related quote or job if this PO is project-specific.
7. Save. PO number (PO-####) auto-assigns, status = **Draft**.

### 3. Submit and confirm with vendor

1. Change PO status to **Submitted** when sent to the vendor.
2. Enter the vendor's **expected delivery date** when confirmed.
3. Change to **Confirmed** when vendor acknowledges.

### 4. Receive inventory

When goods arrive at the warehouse:
1. Open the PO in **Purchase Orders**.
2. Click **Mark Received & Update Inventory**.
   - AccentOS matches each PO line to an inventory item by (SKU + vendor).
   - `qty_on_hand` increments for each matched line.
   - Unmatched lines are reported — resolve manually in Inventory.
3. PO status flips to **Received**, `received_date` auto-sets.

### 5. Verify inventory update

1. Open **Inventory**, search for one of the received SKUs.
2. Confirm `qty_on_hand` increased by the expected amount.
3. If `qty_on_hand` still shows low stock: the SKU/vendor match failed. Edit the inventory item's vendor_id to match the PO's vendor, then re-run the PO receipt flow.

---

## Notes

- **Reorder point calibration**: the default `reorder_point` is set manually at import. After 90 days of PO history, use the Demand Forecast velocity to compute a better reorder point: `reorder_point = velocity × lead_time_weeks`. Inline-edit in Inventory to update.
- **Windward live sync** (pending M03/M10): when Track 6.11 ships, inventory will auto-sync from Windward sales lines for velocity. Until then, PO-line history is the velocity proxy.
- **Overstock**: Demand Forecast flags `overstock` (>26 weeks of stock). Don't reorder these — use the co-op tracker to check if any vendor will take returns.
- **Emergency stock**: for safety-critical commercial items (emergency lighting), keep a standing 2-week buffer above the computed reorder point.
