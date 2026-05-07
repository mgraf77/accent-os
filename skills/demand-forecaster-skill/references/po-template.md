# PO Draft Template

> Paste-ready format for `recommend-po` mode. Output is a draft only — never auto-sent.

## Template

```
─────────────────────────────────────────────────────────────
PURCHASE ORDER — DRAFT — Accent Lighting
─────────────────────────────────────────────────────────────
Vendor:        [vendor_name]
Vendor ID:     [vendor_id]
Contact:       [contact_email or "—"]
Phone:         [contact_phone or "—"]
Date:          [YYYY-MM-DD]
PO #:          DRAFT-[YYYY-MM-DD]-[vendor_slug]
Buyer:         [Michael Spencer / Accent Lighting]
Ship to:       Accent Lighting, [warehouse address]
Terms:         [from vendor record, else "Net 30"]
Lead time:     [LEAD_WEEKS from references/model.md] weeks
─────────────────────────────────────────────────────────────

LINE ITEMS:

SKU         | Description                | Qty | Unit cost | Extended  | Rationale
------------+----------------------------+-----+-----------+-----------+----------------------------------------
[sku_1]     | [desc_1]                   | [n] | $[xx.xx]  | $[xxx.xx] | reorder_now  • 1.2 wk stock → 14w target
[sku_2]     | [desc_2]                   | [n] | $[xx.xx]  | $[xxx.xx] | reorder_now  • out + velocity 4/wk
[sku_3]     | [desc_3]                   | [n] | $[xx.xx]  | $[xxx.xx] | reorder_soon • 7.4 wk stock → top up
...

─────────────────────────────────────────────────────────────
                                          Subtotal: $[xx,xxx.xx]
                                Estimated freight: $[xxx.xx]
                                            TOTAL: $[xx,xxx.xx]
─────────────────────────────────────────────────────────────

NOTES:
- Forecast horizons: 30d=[total_30d_units] / 60d=[total_60d_units] / 90d=[total_90d_units]
- Source: [windward | bc-po-lines (Track 6.9 proxy)]
- Seasonality: [active 52-week | thin-history fallback]
- Vendor cascade reviewed: [yes/no — link to vendor-cascade run if multi-source SKUs]
─────────────────────────────────────────────────────────────

Approval: this draft is in PROPOSED state in action-queue (id=[uuid]).
Approve to send via: "send the [vendor] PO" or `/approve [uuid]`.
Edit the qty / line items first via: "drop [sku] from the draft" or "bump [sku] to [n] units".
Decline via: "skip this PO" or `/decline [uuid]`.
```

---

## Selection rules — which SKUs go on the PO

Include a SKU on the draft only if **all** of:
- `kind in ('reorder_now', 'reorder_soon')`
- `vendor_id == target_vendor_id` (single vendor per PO — never mix)
- `recommended_reorder_qty > 0`
- SKU is not already on an open `action-queue` PROPOSED PO for the same vendor in the last 7 days (avoid duplicate drafts — surface "merge with existing draft?" instead)

Order line items by `kind` (reorder_now first), then by `recommended_reorder_qty × unit_cost` descending (biggest spend lines on top).

---

## Freight estimation

If vendor record has freight terms, use them. Otherwise:
- Subtotal < $500: $50 flat (truck minimums)
- $500–$2,500: 5% of subtotal
- > $2,500: 3% of subtotal
- Mark with "Estimate — confirm with vendor" in the freight line

Freight is not authoritative. Vendor-stated freight on the actual PO supersedes.

---

## Vendor slug rules

`[vendor_slug]` in the PO# is `lowercase(vendor_name)` with non-alphanumeric chars replaced by `-`, trimmed to 20 chars. Examples:
- `Hinkley Lighting` → `hinkley-lighting`
- `Visual Comfort & Co.` → `visual-comfort-co`
- `Kichler` → `kichler`
