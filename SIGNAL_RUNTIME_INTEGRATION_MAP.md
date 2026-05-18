# SIGNAL_RUNTIME_INTEGRATION_MAP.md

This document maps where in the AccentOS runtime operational signals should be emitted and which telemetry hooks are required.

## 1. Module Emitters

| Source Module | Signal Type | Runtime Hook |
|---|---|---|
| `js/customers.js` | **Churn Risk** | End of `sbLoadCustomers` hydration. |
| `index.html` (Quotes) | **Project Stall** | `renderSavedQuoteRows` (injects status dots). |
| `js/inventory.js` | **Audit Needed** | `renderInventory` (highlights stale bin locations). |
| `js/purchase_orders.js` | **Vendor Slip** | `sbLoadPurchaseOrders` (computes latency delta). |
| `index.html` (Shell) | **Form Friction** | `closeModal` (checks for uncommitted mutations). |

---

## 2. Telemetry to Signal Conversion

### **Save Collision Density**
- **Existing Telemetry:** `_quoteObs.conflicts` in `index.html`.
- **Signal:** If conflicts per session > 3, emit **Elevated** system health alert.
- **Meaning:** Data synchronization issues are causing operational rework.

### **Hydration Sequential Latency**
- **Existing Telemetry:** `console.log` in `hydrateFromSupabase`.
- **Signal:** Capture `_hydrateStart` delta. If > 15s, emit **Warning** system health alert.
- **Meaning:** Runtime environment is degrading; parallelization required.

---

## 3. Hydration State Alerts

| State | Logic | Escalation |
|---|---|---|
| **Stale CSV** | `last_imported_at` (Inventory) > 14 days. | **Stale** |
| **Empty CRM** | `CUSTOMERS.length` == 0 after hydration. | **Critical** (Blocked) |
| **GMC Image Gap** | GMC image link coverage < 80% for top vendors. | **Degraded** (Ecommerce) |
| **Unverified Terms** | `unverifiedCount` > 50% of Tier A vendors. | **Confidence Low** |
