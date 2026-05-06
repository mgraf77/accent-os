---
id: windward-erp
title: Source Summary — Windward ERP
type: source_summary
status: published
weight: 5
tags: [windward, ERP, S5WebAPI, inventory, sales, purchase-orders, integration, M03, M10, Track-6-11, AccentOS]
related: [adr-002-supabase-backend, sop-003-inventory-reorder, emp-warehouse, bigcommerce]
created: 2026-05-06
updated: 2026-05-06
---

# Source Summary — Windward ERP

## What it is

Windward System Five is Accent Lighting's primary ERP / point-of-sale system. Manages all in-store transactions, purchase orders, inventory, customer records, and vendor data. AccentOS is a companion intelligence layer built on top of the data that Windward generates.

## Integration status

**BLOCKED — pending M03 (written confirmation from Windward) and M10 (Curtis outreach).**

This is Track 6.11 in the AccentOS build plan. Until unblocked, AccentOS uses CSV exports from Windward + manual entry as the data source for Inventory and PO history.

## API

Windward exposes a REST API called **S5WebAPI**. The planned integration is a Supabase Edge Function that:
1. Calls S5WebAPI read endpoints for inventory levels, sales lines, and PO status.
2. Writes results into `inventory_items`, `po_lines`, and related tables.
3. Runs on a schedule (or on-demand) via Supabase Edge Function cron.

## Fields we plan to use

| Windward field | AccentOS table | AccentOS column | notes |
|---|---|---|---|
| Item number | inventory_items | sku | primary match key |
| On hand qty | inventory_items | qty_on_hand | live sync |
| Cost | inventory_items | unit_cost | |
| Price | inventory_items | list_price | |
| Reorder point | inventory_items | reorder_point | |
| Vendor | inventory_items | vendor_id | matched by name |
| Sales line (last 90d) | (derived) | velocity proxy | replaces PO-line proxy |
| PO status | purchase_orders | status | |
| Customer (legacy) | customers | (seed) | one-time import |

## Impact when unblocked

- **Demand Forecast** accuracy improves dramatically: velocity switches from PO-line proxy → actual sales-line history.
- **Inventory** becomes real-time rather than requiring manual CSV reimport.
- **Purchase Orders** auto-populated from Windward PO data.
- **Daily Brief** reorder tile becomes a live count rather than a computation.

## Gotchas

- Windward SKU format may differ from manual CSV imports — normalization required at sync time.
- Windward customer IDs are different from AccentOS UUIDs — name-match initially, promote to UUID FK once sync is stable.
- S5WebAPI rate limits unknown — plan for a 5-second delay between paginated calls.
- The Edge Function will need credentials stored as Supabase Vault secrets (not hardcoded).

## Update cadence

Once live: nightly batch sync (Supabase cron, 2am). Real-time sync is aspirational but not planned.
