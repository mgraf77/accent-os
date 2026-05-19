# DEAD-LETTER — VISUAL FLOW
> **Objective:** Visualizing system rot and management recovery.

## 1. THE "SIGNAL ROT" DEGRADATION
Signals do not disappear when ignored; they visually degrade to signal their "Dead-Letter" status to managers.

### Visual State: The "Stale" Card
*   **Opacity:** Card opacity drops to 70%.
*   **Desaturation:** Severity badges shift from vibrant Red/Amber to a desaturated Grey/Wash.
*   **Timer Overlay:** A small `⏳` (Timer) icon in `DM Mono` appears in the corner, showing "Age: 92h".

---

## 2. MANAGER TRIAGE INTERACTION
Managers access the Dead-Letter Queue via the **Management Dashboard**.

### Screen A: The Aggregate View
*   **Pattern Grouping:** Signals are grouped by "Failure Type" (e.g., "14 Lapsed VIP Signals Ignored").
*   **Visual Alert:** A "Pulse" effect on the grouping header if the count exceeds 10.
*   **Typography:** Grouping headers in `Outfit` (Bold); counts and percentages in `DM Mono`.

### Screen B: The "Pattern Pivot" (Interaction)
A manager can "Swipe to Resolve" a whole group:
1.  **Swipe Right:** "Re-Assign Group" → Opens a role/user picker.
2.  **Swipe Left:** "Archive Group" → Prompts for a "Pattern Override" note.

---

## 3. HEURISTIC ADJUSTMENT UI (THE "LOOSEN" DIAL)
If a signal type is consistently ignored, managers can adjust the sensitivity directly from the visual flow.

```text
+-----------------------------------------------------------+
| HEURISTIC TUNING: LEAD TIME CREEP                         |
+-----------------------------------------------------------+
| Current Threshold: > 25% Drift                            |
|                                                           |
| [ - ] <----------( o )----------> [ + ]                   | <-- Visual Slider
|                                                           |
| Result: "Loosening to 35% will clear 8 dead-letter items" |
+-----------------------------------------------------------+
| [ APPLY NEW THRESHOLD ]                                   |
+-----------------------------------------------------------+
```

---

## 4. SYSTEM HEALTH VISUALS (THE "SMELL TEST")
*   **The Health Gauge:** A circular progress bar on the Mgmt Dashboard.
    - **Blue (0-5% Rot):** Nominal.
    - **Yellow (5-10% Rot):** System Smelling.
    - **Red (>15% Rot):** Operational Breakdown.
*   **Trend Line:** A simple sparkline in `DM Mono` showing "Dead-Letter Volume" over the last 7 days.

---
*End of Document*
