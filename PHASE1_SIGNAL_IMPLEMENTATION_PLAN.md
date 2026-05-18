# PHASE1_SIGNAL_IMPLEMENTATION_PLAN.md

This plan outlines the sequence for implementing high-leverage operational signals in AccentOS, prioritizing "quick wins" that use existing data.

## Implementation Sequence

### 1. **Signal: Lapsed VIP Outreach**
- **Priority:** 1 (Highest ROI)
- **Data Source:** `CUSTOMERS` array + `computeCustomerRFM()`.
- **Logic:** `segment == 'VIP'` AND `rfm_recency > 90`.
- **Placement:** New tile in `computeDailyBrief` (Dashboard).
- **Operator Value:** Immediate sales opportunity. Zero data entry required.

### 2. **Signal: Flagged Quote Stagnation**
- **Priority:** 2 (Friction Reduction)
- **Data Source:** `QUOTES` array.
- **Logic:** `q.lineItems.some(l => l.status == 'flagged')` AND `q.date < (now - 48h)`.
- **Placement:** `alerts.js` generator.
- **Operator Value:** Identifies stalled projects before the customer calls.

### 3. **Signal: High-Value Dead Stock**
- **Priority:** 3 (Capital Recovery)
- **Data Source:** `INVENTORY` array.
- **Logic:** `qty_on_hand > 0` AND `list_price > 500` AND `last_imported_at < (now - 90d)`.
- **Placement:** `alerts.js` (Inventory low-stock variant).
- **Operator Value:** Identifies high-value capital tied up in non-moving items.

### 4. **Signal: Lead Time Creep (v1)**
- **Priority:** 4 (Reliability)
- **Data Source:** `POS` array.
- **Logic:** `po.received_date - po.expected_date > 7 days`.
- **Placement:** Warning label in `openVendorDetail` modal.
- **Operator Value:** Real-world vendor performance vs. static terms.

### 5. **Signal: Hydration Performance**
- **Priority:** 5 (System Health)
- **Data Source:** Browser performance markers.
- **Logic:** `window.__AOS_HYDRATION_TIME__ > 15000ms`.
- **Placement:** System status row in Dashboard.
- **Operator Value:** Alerts Michael if DB/Network latency is degrading employee productivity.

---

## Dependency Requirements
- **Alert Persistence:** Ensure the `alerts` table and `sbInsertAlert` in `js/alerts.js` are robust.
- **Telemetry Hooks:** Minor updates to `index.html` boot sequence to track hydration time.

## Runtime Impact
- **Compute:** Low. Heuristics run once per session after hydration.
- **Network:** Very Low. Only writes new unique alerts to Supabase.
- **UI:** No change to existing layout; additive tiles and badges only.
