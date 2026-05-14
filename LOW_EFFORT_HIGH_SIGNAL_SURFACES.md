# LOW_EFFORT_HIGH_SIGNAL_SURFACES.md

This document highlights "quick wins" — operational signals that can be surfaced using existing data with minimal development effort.

## 1. High ROI Operational Intelligence Additions

### **The "Project Health" Dot** (Quote Generator)
- **Concept:** A small status dot (Red/Yellow/Green) next to saved quotes.
- **Signal:** Based on a composite of "Is the customer a VIP?", "Are there flagged items?", and "Is the vendor high-tier?".
- **Implementation:** 10 lines of JS in `renderSavedQuoteRows`.

### **Vendor "Reliability Gauge"** (Vendor Detail Modal)
- **Concept:** A simple label showing recent PO success vs. advertised lead times.
- **Signal:** Delta between `po_expected_date` and `po_received_date`.
- **Implementation:** Logic addition to `openVendorDetail` using existing PO array.

---

## 2. Easiest Signals to Surface (Existing Data)

### **Lapsed VIP Outreach Prompt** (Dashboard)
- **Concept:** A specific tile for "Lapsed VIPs" (Recency > 90d, Monetary > $5k).
- **Implementation:** Already partially computed in `computeCustomerRFM`; just needs a dedicated filter and tile in `computeDailyBrief`.

### **MAP Violation Risk Indicator** (Vendor List)
- **Concept:** Highlight vendors with `score.imap_enforcement < 4`.
- **Implementation:** Color the IMAP score cell red in the `renderVendors` heatmap when below threshold.

---

## 3. Operational Blind Spots (Exposed Quickly)

### **Unassigned Rep Alert** (Management Dashboard)
- **Concept:** List of active vendors with sales history but no rep contact data.
- **Signal:** `v.rep == null` AND `v.sales.t > 0`.
- **Benefit:** Exposes vendors where we have no leverage for returns or shipping issues.

### **The "Inventory Dust" List** (Warehouse View)
- **Concept:** List items with "On Hand" quantities that haven't appeared on a quote or invoice in 180+ days.
- **Benefit:** Immediate identification of capital stagnation without complex forecasting.
