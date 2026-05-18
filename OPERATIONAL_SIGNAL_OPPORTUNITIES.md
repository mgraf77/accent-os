# OPERATIONAL_SIGNAL_OPPORTUNITIES.md

This document identifies high-leverage operational signals that can be extracted from the existing AccentOS runtime data and user interactions.

## 1. Inventory Risk Signals

### **Signal: Dead Stock Accumulation**
- **Trigger Concept:** `qty_on_hand > 0` AND `sales_velocity (90d) == 0`.
- **Operational Meaning:** Capital is tied up in non-moving inventory.
- **Severity:** Elevated.
- **Source Modules:** `inventory.js`, `demand_forecast.js`.
- **Implementation Difficulty:** Low (Compute-only).
- **Business Leverage:** Medium (Inventory optimization / Liquidation opportunities).

### **Signal: Ghost Inventory (Bin Staleness)**
- **Trigger Concept:** `last_bin_check_date > 6 months` for high-value SKUs.
- **Operational Meaning:** System availability data is likely inaccurate due to lack of physical verification.
- **Severity:** Warning.
- **Source Modules:** `inventory.js`.
- **Implementation Difficulty:** Low (Requires `last_checked` field).
- **Business Leverage:** High (Warehouse reliability).

---

## 2. Quote Stagnation Signals

### **Signal: Flagged Quote Stagnation**
- **Trigger Concept:** Quote contains `status: 'flagged'` line items for > 48 hours.
- **Operational Meaning:** A project is stalled due to technical ambiguity or missing vendor data.
- **Severity:** Elevated.
- **Source Modules:** `index.html` (Quotes).
- **Implementation Difficulty:** Low.
- **Business Leverage:** High (Accelerates project throughput).

---

## 3. Vendor Deterioration Signals

### **Signal: Lead Time Creep**
- **Trigger Concept:** `actual_receipt_date - po_date` > `vendor_metadata.lead_time` for 3 consecutive POs.
- **Operational Meaning:** Vendor performance is slipping, affecting project delivery promises.
- **Severity:** Critical.
- **Source Modules:** `purchase_orders.js`, `index.html` (Vendors).
- **Implementation Difficulty:** Medium (Requires PO history logging).
- **Business Leverage:** Very High (Prevents sales team from over-promising).

---

## 4. Purchasing Friction Signals

### **Signal: Fragmented Procurement**
- **Trigger Concept:** Quote contains > 5 vendors where 2+ are "Tier D" or "Tier F".
- **Operational Meaning:** High administrative cost to fulfill a low-margin project.
- **Severity:** Warning.
- **Source Modules:** `index.html` (Quotes/Vendors).
- **Implementation Difficulty:** Low.
- **Business Leverage:** Medium (Encourages brand consolidation).

---

## 5. Ecommerce Degradation Signals

### **Signal: Catalog Visibility Gap**
- **Trigger Concept:** Vendor total products > 100 AND `gmc_image_link == null` for > 20% of products.
- **Operational Meaning:** Top vendors are under-represented on the public site due to missing assets.
- **Severity:** Critical.
- **Source Modules:** `ecommerce_intelligence.js`, `gmc_adapter.js`.
- **Implementation Difficulty:** Low.
- **Business Leverage:** Very High (Direct ecommerce revenue impact).

---

## 6. Operational Reliability Signals

### **Signal: Hydration Failure / Timeout**
- **Trigger Concept:** `DOMContentLoaded` to `__AOS_HYDRATED__` > 15 seconds.
- **Operational Meaning:** Local network or database latency is impacting employee productivity.
- **Severity:** Warning.
- **Source Modules:** `index.html` (Boot).
- **Implementation Difficulty:** Low.
- **Business Leverage:** Low (Maintenance).

---

## 7. Mobile/Operator Friction Signals

### **Signal: Form Abandonment (Frustration Signal)**
- **Trigger Concept:** Modal "Cancel" or "Close" clicked after 3+ input field mutations without "Save".
- **Operational Meaning:** User spent significant effort but failed to commit, likely due to UI friction or missing information.
- **Severity:** Elevated.
- **Source Modules:** `index.html` (Shell), `csv_import.js`.
- **Implementation Difficulty:** Low (Telemetry-based).
- **Business Leverage:** Medium (Identifies "UX traps").
