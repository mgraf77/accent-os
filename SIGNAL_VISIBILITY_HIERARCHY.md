# SIGNAL VISIBILITY HIERARCHY — The Triage Funnel

## 1. THE HIERARCHY OF NEEDS
Not all signals are created equal. We categorize visibility based on the potential impact on business continuity.

| Tier | Name | Target | Delivery Method | Surface |
| :--- | :--- | :--- | :--- | :--- |
| **I** | **Systemic Failure** | Executive | Pushing/Haptic | Master Rail / Pulsing Dot |
| **II** | **High-Value Friction** | Executive | Top of Feed | Signal Card (Rule of One) |
| **III** | **Operational Anomaly** | Operator | Queue | Signal Feed (Grouped) |
| **IV** | **Performance Drift** | Operator | Dashboard | Metric Card (Sparkline) |
| **V** | **Standard Activity** | System | Invisible | Logs / Intelligence Store |

## 2. THE ESCALATION LADDER
Signals move up the hierarchy based on **Severity** and **Cluster Density**.
*   **Threshold 1:** A Tier III anomaly (e.g., Lead Time Creep) moves to Tier II if it affects >10% of vendor revenue.
*   **Threshold 2:** Multiple Tier IV drifts (e.g., 3 vendors dropping in score) move to Tier III as a "Vendor Reliability Risk" aggregate signal.

## 3. THE DE-ESCALATION (COMPRESSION) RULES
Signals move down the hierarchy once the "Attention Tax" has been paid.
*   **Acknowledge:** Moving a Tier II signal to "Tracked" drops it to Tier IV.
*   **Resolve:** Closing a signal moves it to Tier V (Archive).
*   **Snooze:** Temporary de-escalation for N hours/days.

## 4. VISIBILITY TRIGGERS
A signal only becomes visible if it crosses a **Deviation Boundary**:
*   **Static Boundary:** Metric > Fixed Threshold (e.g., Lead time > 6 weeks).
*   **Dynamic Boundary:** Metric > 1.5x Rolling Average (The Anomaly Trigger).
*   **Confidence Boundary:** Data Freshness < 90% (The Stale Trigger).
