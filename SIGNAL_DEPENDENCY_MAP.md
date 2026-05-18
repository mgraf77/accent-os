# SIGNAL_DEPENDENCY_MAP.md

This document maps AccentOS modules to the signals they currently provide or could provide with minimal compute.

## 1. Modules Containing Usable Signal Data

| Module | Data Provided | Potential Signal |
|---|---|---|
| `index.html` (Vendors) | Weighted scores, sales history | Vendor deterioration, margin risk |
| `index.html` (Quotes) | Line items, status flags | Workflow stagnation, purchasing friction |
| `js/customers.js` | RFM, interactions | Churn risk, LTV drop |
| `js/inventory.js` | Qty available, bin loc | Physical accuracy risk, capital stagnation |
| `js/purchase_orders.js` | Dates, totals | Lead-time creep, receipt friction |
| `js/alerts.js` | Unread count, severity | Operational noise levels |

---

## 2. Hidden Deltas (Existing but Unused)

- **Vendor Score Change Velocity:** The `CHANGELOG` array contains "before and after" values. A signal for "Vendor dropping > 3 points in 30 days" is possible but currently only shown as raw text.
- **Quote Approval Ratio:** The ratio of `status: 'approved'` vs `total_lines` in a quote. High "flagged" ratios on repeat projects signal a catalog synchronization issue.
- **Customer Recency Trend:** Comparing a customer's `rfm_recency` to their average `rfm_frequency`. A 2x delta from their personal baseline is a stronger signal than a company-wide 90-day timer.

---

## 3. Unused Telemetry Data

- **Interaction Frequency:** `customer_interactions` records the *count* of touches. A drop in employee-to-customer interactions for "Active" accounts is a hidden churn signal.
- **Session Duration (Implied):** The gap between `session_resume` and `logout` in `audit_log`. Short session duration for "Sales" roles may indicate high UI friction on mobile.
- **RPC Conflict Rates:** `_quoteObs.conflicts` tracks save collisions. High conflict rates for specific quotes indicate collaboration friction that requires "Room" or "Meeting" based logic.
