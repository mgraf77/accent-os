# BUSINESS_RISK_HEATMAP_MODEL.md

This document defines the 6 dimensions of business risk tracked by the AccentOS executive layer.

## 1. Inventory Risk
- **Trigger:** High-value stockouts (Tier A vendors) or Dead Stock volume > $10k.
- **Signal:** High dollar value of capital stagnation.

## 2. Vendor Risk
- **Trigger:** Lead time creep > 14 days or IMAP score drop < 3.
- **Signal:** Supplier reliability and pricing integrity.

## 3. Fulfillment Risk
- **Trigger:** Delivery backlog > 3 days or Quote-to-Order lag increasing.
- **Signal:** Capacity bottlenecks in the warehouse or sales process.

## 4. Ecommerce Risk
- **Trigger:** GMC image link coverage < 70% or BigCommerce order velocity drop > 30%.
- **Signal:** Public-facing revenue engine degradation.

## 5. Operational Reliability Risk
- **Trigger:** Supabase RPC conflict frequency > 5/session or Hydration timeouts.
- **Signal:** Technical debt impacting staff efficiency.

## 6. Stale-Data Risk (Confidence)
- **Trigger:** Customer/Inventory CSV last import > 14 days.
- **Signal:** Management is making decisions based on old data.

---

## Heatmap Visualization Philosophy
Risk is shown as a 2x3 grid of colored boxes on the Executive Snapshot modal.
- **Green:** Zero elevated/critical signals in this category.
- **Yellow:** 1+ Elevated signal.
- **Orange:** 3+ Elevated or 1+ Critical signal.
- **Red:** 2+ Critical signals.
