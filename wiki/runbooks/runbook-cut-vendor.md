---
id: runbook-cut-vendor
title: "Runbook: Cut or Offboard a Vendor"
type: runbook
status: published
weight: 8
tags:
  - vendor
  - cut-vendor
  - offboard
  - runbook
  - at-risk
  - inactive
  - vendor-ranking
  - inventory
  - purchase-orders
related:
  - runbook-vendor-review
  - vendor-relationship
  - sop-001-vendor-onboarding
created: 2026-05-06
updated: 2026-05-06
---

# Runbook: Cut or Offboard a Vendor

Use when a vendor is being fully removed from active purchasing. This is irreversible from an operational standpoint — do the quarterly review first (`runbook-vendor-review`) and confirm the decision at Owner level before proceeding.

## Triggers for this runbook

- Vendor score consistently Tier C (avg < 5) for 2+ quarters
- Vendor ceased operations or was acquired
- Duplicate vendor entry (merge, then cut the orphan)
- Strategic decision to consolidate to a competing brand

## Pre-checks (do not skip)

1. **Open POs** — Vendor Ranking → go to any open Purchase Orders for this vendor. Confirm all are received or cancelled before proceeding.
2. **Open warranty claims** — Warranty Tracker, filter by vendor. Resolve or transfer any open claims.
3. **Showroom displays** — Showroom Displays, filter by vendor. Set all active displays to `expired` or plan removal.
4. **Co-op funds** — Co-op Funds tab. Close or expire any open funds.
5. **Inventory** — How many SKUs with qty > 0? You are not deleting inventory — it stays for sell-through. Note the count.

## Steps

### 1. Final vendor changelog entry

In Vendor Ranking, open the vendor detail. Add a `vendor_contact` changelog entry:
> "OFFBOARDING — [date]. Reason: [fill in]. Final avg score: [X]. Open inventory SKUs: [N]. POs closed: yes. Decision approved by: [Owner name]."

### 2. Set vendor status to inactive

In the vendor row, update any `status` or `active` flag to inactive/false. (In current AccentOS, this is done via the Supabase vendors table directly or via the override system — no UI toggle yet for vendor active status.)

### 3. Mark vendor for no-reorder

In Inventory, filter by this vendor. For any SKU with `qty_on_hand > 0`, set `reorder_point = 0` so the Demand Forecast stops surfacing reorder recommendations for those SKUs.

### 4. Rep group update (if applicable)

If other vendors in the same rep group are staying, no action needed. If this was the rep group's only vendor, update the rep group record to inactive.

### 5. Remove from Decision Engine

The Decision Engine is pure-compute — it will automatically stop recommending this vendor's SKUs once they go out of stock and `reorder_point = 0`.

### 6. Notify rep

Send a formal offboarding notice to the vendor rep. Log the communication in `vendor_changelog` as `vendor_contact`.

### 7. Log to decision-log

Use `decision-log` skill:
> "Decision: cut [Vendor Name]. Rationale: [X]. Effective date: [date]. Approved by: [Owner]."

## What is NOT deleted

- Inventory rows (needed for sell-through tracking)
- Changelog entries (audit trail)
- Past PO rows (purchase history)
- Warranty claims (still need resolution)

Deletion is only appropriate for test/duplicate vendors that were never active. Use Supabase directly for hard deletes.

## Post-offboarding monitoring

- 30 days: check Inventory for any remaining qty. Still selling? Good.
- 90 days: if all SKUs are at zero, archive the vendor row.
- Check Alerts: suppress any score-drop alerts for the inactive vendor.
