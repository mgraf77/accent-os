---
id: emp-warehouse
title: Employee Entity — Warehouse Role
type: entity
status: published
weight: 6
tags: [warehouse, role, employee, AccentOS, access, inventory, deliveries, labels, receiving, PO]
related: [emp-owner, emp-sales, sop-003-inventory-reorder]
created: 2026-05-06
updated: 2026-05-06
---

# Employee Entity — Warehouse Role

## Role summary

Physical operations: inventory management, receiving purchase orders, preparing deliveries, and printing labels. The Warehouse role has a minimal, operations-focused interface — no financial data, no vendor scoring, no management modules.

## AccentOS access level

`role = 'Warehouse'`

Access to: Dashboard (Warehouse variant), Inventory, Deliveries, Labels, Job Tracker (view), Calendar.

Restricted from: Sales Pipeline, Quote Generator, Customers, Vendor Ranking, Mgmt Dashboard, Purchase Orders (creation — but can mark received), Reports.

## Key modules

| module | primary use |
|---|---|
| Inventory | View stock levels, update qty_on_hand, check low-stock |
| Deliveries | Schedule and track deliveries; update delivery status |
| Labels | Print QR/barcode labels for inventory items |
| Job Tracker | View active jobs, check delivery schedules |

## Key workflows

1. **Morning check**: Open Dashboard → Warehouse view (inventory low-stock tiles + today's deliveries).
2. **Receive PO**: When a PO arrives, Manager/Owner clicks "Mark Received" in Purchase Orders — qty_on_hand auto-increments. Warehouse verifies counts match.
3. **Inventory adjustment**: If physical count differs from system, inline-edit `qty_on_hand` in Inventory. Audit log captures the change.
4. **Delivery prep**: Open Deliveries module → filter by today → prep items for driver → update status to "Out for Delivery".
5. **Label printing**: Open Labels → select inventory items → pick size → print.

## Inline edit permissions

Warehouse role can inline-edit:
- `qty_on_hand` in Inventory (warehouse-only field — tracks physical stock)
- Delivery status (up to "delivered")

Cannot inline-edit:
- `unit_cost` or `list_price` (senior-only financial fields)
- `reorder_point` (Manager+ to avoid accidental threshold changes)

## Dashboard variant

Warehouse sees a minimal dashboard:
- Inventory Low Stock count with reorder alert
- Today's deliveries count
- Daily Brief: inventory-low tile only (no financial tiles)
