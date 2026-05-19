# SIGNAL PRIORITY VISUAL SYSTEM — Visual Encoding for Operational Stress

## 1. THE SEVERITY HIERARCHY (0–5)
We use a standardized 6-tier escalation model to communicate urgency without inducing "alert fatigue."

| Level | Name | Visual | Meaning | Action Required |
| :--- | :--- | :--- | :--- | :--- |
| **5** | **CRITICAL** | Pulsing Red | Immediate business risk or failure. | Immediate Triage. |
| **4** | **DEGRADED** | Solid Red | Significant performance drop or anomaly. | Review within 4 hours. |
| **3** | **ELEVATED** | Orange | Deviation from baseline; needs eyes. | Daily Triage. |
| **2** | **WARNING** | Yellow | Subtle drift or emerging pattern. | Passive Awareness. |
| **1** | **STALE** | Dim Gray | Data is too old to be trusted. | Data Import Required. |
| **0** | **NOMINAL** | Green Dot | Operational parameters within norm. | None (Invisible). |

## 2. THE SIGNAL CARD ANATOMY (Mobile)
Every signal card must follow the **"Executive Glanceability"** layout:

1.  **Severity Indicator:** Colored border or top bar (Level 3+).
2.  **The Fact:** One bold statement (DM Mono font).
    *   *Bad:* "Sales are down 5% this month compared to last month."
    *   *Good:* **REV MOM -5%** (Acceleration: ↓)
3.  **The Evidence:** One line of supporting context.
    *   "Driven by: Visual Comfort backlog."
4.  **The Confidence:** Small % or "Stale" indicator.
5.  **The Single Action:** Primary button (e.g., "Draft Email").

## 3. TYPOGRAPHY RULES
*   **Labels:** Outfit (Sans-serif) for high readability of UI framework.
*   **Data:** DM Mono (Monospace) for all business metrics (Prices, SKUs, % deltas). Monospace ensures that digits align vertically, allowing the eye to scan columns of numbers for anomalies at high speed.

## 4. DOT DYNAMICS (The Executive Strip)
The six dots at the top of the mobile view behave as a "Live Pulse":
*   **Resting State:** Small, static dots.
*   **Alert State:** If Level 4+, the dot pulses slowly (breathing effect).
*   **Drift State:** A small arrow (↑ or ↓) indicates direction of change even if within normal bounds.

## 5. NOISE SUPPRESSION RULES
*   A signal cannot reappear for 24 hours after being dismissed unless the severity increases.
*   Multiple signals of the same type (e.g., 5 stagnant quotes) must **aggregate** into a single summary card: "5 Stagnant Quotes ($42k Total)."
