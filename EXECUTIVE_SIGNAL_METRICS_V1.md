# EXECUTIVE SIGNAL METRICS — V1
> **Hierarchy:** Situation Awareness → Strategic Action.

## 1. THE EXECUTIVE STRIP (6-DOT HUD)
The "Pulse of the Business" is represented by 6 color-coded dots at the top of the Mobile Command Center.

| Dot | Dimension | Metric Proxy |
|---|---|---|
| **1** | **Inventory** | Stockouts on A-Tier Vendors |
| **2** | **Vendor** | Lead Time Creep + PO Overdue Rate |
| **3** | **Fulfillment** | Delivery Overdue Count |
| **4** | **Ecommerce** | Conversion Rate vs 30d Baseline |
| **5** | **Operational** | Dead-Letter Rate + User Activity |
| **6** | **Stale Data** | Days since last Windward CSV Import |

**Color Logic:**
*   **Green:** All metrics within ±5% of baseline.
*   **Yellow:** Minor drift (Level 2).
*   **Amber:** Anomaly detected (Level 3).
*   **Red:** Critical failure (Level 4+).

---

## 2. THE RULE OF ONE (GLANCEABILITY)
Executive cards must adhere to the **Rule of One primary fact**:
*   *Bad:* "Sales are up 10% but conversion is down 2% and AOV is flat."
*   *Good:* "Momentum: +12% Acceleration in Quote Conversion."

### Momentum Formula
**M = (Current Period Volume / Previous Period Volume) - 1**
*Displayed as a directional arrow (↑ / ↓) with a color shift.*

---

## 3. OPERATIONAL PULSE & HEALTH
*   **Operational Pulse:** A real-time measure of *velocity* (number of signals actioned per hour).
*   **Business Health:** A weighted average of the 6 HUD dots.
*   **Confidence Score:** Inversely proportional to **Dot 6 (Stale Data)**. If data is > 7 days old, the Health score is greyed out.

---

## 4. TYPOGRAPHY & SPEED
*   **Primary Labels:** `Outfit` (Weight: 600) for "Occular Anchors".
*   **Business Metrics:** `DM Mono` (Weight: 600) for "Numerical Truth".
*   **Visual Balance:** No more than 3 distinct font sizes per card.

---

## 5. EXECUTIVE ACTIONS
Executives do not "process" signals; they "authorize" or "delegate".
*   **Authorize:** Tap once to approve a high-value claim or refund.
*   **Delegate:** Swipe a signal to a specific Manager's queue.
*   **Drill-Down:** Tap any dot in the strip to see the top 3 contributing signals.

---
*End of Document*
