# SIGNAL ATTENTION PRIORITY SYSTEM (SAPS)

## PURPOSE
To provide a unified, 6-tier escalation framework that prevents noise and ensures the most critical business anomalies receive immediate attention.

## THE 6-TIER HIERARCHY

| Level | Name | Color | Visual Indicator | Operational Definition |
| :--- | :--- | :--- | :--- | :--- |
| **5** | **Critical** | Red | Double Pulse | Immediate loss of revenue or major fulfillment failure. (e.g., Site Down, High-value PO Cancelled). |
| **4** | **Degraded** | Red | Solid Dot | Systematic breakdown or major SLA breach. (e.g., Conversion Rate < 0.001%, Lead Time > 30% above baseline). |
| **3** | **Elevated** | Orange | Solid Dot | Anomaly requiring human judgment within 4-8 hours. (e.g., VIP Customer at Risk, Stagnant Quote > $5k). |
| **2** | **Warning** | Yellow | Solid Dot | Non-critical anomaly; check during daily maintenance. (e.g., Minor stock low, Vendor score drop). |
| **1** | **Stale** | Grey | Hollow Circle | Data age exceeds reliability threshold. (e.g., Inventory CSV > 72h old). |
| **0** | **Conf. Low** | Purple | Dash | Heuristic is firing but data confidence is low. Needs validation before action. |

## THE CONFIDENCE MULTIPLIER
A signal's priority is not just its Severity, but its **Severity x Confidence**.
*   **Confidence Calculation:** Based on data freshness (Level 1 status) and historical dismissal rate of the heuristic.
*   **Adjustment:** A Level 3 signal with 20% confidence is demoted to the bottom of the queue to prevent "Operator Hallucination" and preserve trust.

## ATTENTION STEERING
*   **Forcing Function:** Level 5 (Critical) signals can be configured to "Anchor" the Operational Rail, preventing the operator from viewing other tabs until the signal is acknowledged (Snoozed/Actioned/Dismissed).
*   **The "Clean Slate" Goal:** The system UI encourages a "Zero Signals" state at the end of every business day.

## NOISE REDUCTION RULES
1.  **Duplicate Suppression:** Identical signals from the same source (e.g., same SKU, same Quote ID) are collapsed into a single card with a "Count" badge.
2.  **Threshold Hysteresis:** Signals do not toggle in/out of the queue. Once a signal fires, it remains in the queue until actioned or the underlying data stays "fixed" for a 24-hour cooling period.
3.  **Role-Filtering:** Operators only see signals relevant to their permissions (e.g., Warehouse does not see VIP churn risk).
