# QUEUE TRIAGE — VISUAL FLOW
> **Objective:** Zero-friction signal processing. 30-second triage.

## 1. THE SIGNAL CARD ANATOMY
Every signal in the feed follows a strict "Rule of One" layout to minimize cognitive load during high-velocity scanning.

```text
+-----------------------------------------------------------+
| [!] URGENT                                       $12,450  | <-- Header: Severity (Outfit) | Value at Risk (DM Mono)
+-----------------------------------------------------------+
| LAPSED VIP: PAUL GRAF                                     | <-- Primary Subject (Outfit 600)
| 114 Days since last purchase                              | <-- The "One Primary Fact" (DM Mono)
+-----------------------------------------------------------+
| "Customer is in 'VIP' segment but has drifted past        | <-- Short Logic/Reason (Outfit 12px)
| the 90-day retention window."                             |
+-----------------------------------------------------------+
| [ DRAFT OUTREACH ]             [ SNOOZE ]    [ DISMISS ]  | <-- Action Row: Primary (44px) | Utility (44px)
+-----------------------------------------------------------+
```

---

## 2. INTERACTION FLOW: GLANCE → FOCUS → ACTION

### Phase A: The Vertical Scan (Glance)
*   **Visual State:** Operator scrolls the vertical feed.
*   **Visual Cue:** Cards are separated by `#f4f4f2` gutters.
*   **Focus:** The operator's eye anchors on the **Severity Badge** (Top Left) and the **Primary Subject** (Center).
*   **Scan Velocity:** Goal is < 2 seconds per card to determine relevance.

### Phase B: The Card Expansion (Focus)
*   **Interaction:** Tapping a card (or hovering on desktop) subtly shifts the background from white to `#fcfcfc`.
*   **Visual Reveal:** The "Secondary Fact" or "Contextual Note" fades in (e.g., "Last order was 11 fixtures for Job #882").
*   **Trust Indicator:** A small green check `✓` or amber warning `⚠` appears next to the data source (e.g., "Source: Windward ERP • 4h ago").

### Phase C: The Action (Execution)
*   **Primary Action:** A high-contrast button (Red `#ed1c24` or Black `#1a1a1a`).
*   **Visual Feedback:** Upon tap, the button shows a loading spinner for < 500ms, then the card slides horizontally off-screen.
*   **Success State:** A brief "Toast" notification at the bottom: "Outreach Drafted for Paul Graf."

---

## 3. VISUAL HIERARCHY RULES
1.  **Occular Anchors:** Use `Outfit` Bold for the "Who/What".
2.  **Numerical Truth:** Use `DM Mono` for any currency, date, or metric.
3.  **Color as Priority:**
    - `#ed1c24` (Red) = Level 4/5 (Action Required).
    - `#f59e0b` (Amber) = Level 3 (Review Suggested).
    - `#3b82f6` (Blue) = Level 0/1 (System Info).

---

## 4. THE "EMPTY" STATE
When the queue is cleared, the operator is presented with a **Momentum Summary**:
*   "Queue Clear. 12 Signals Actioned Today."
*   "Business Health: 94% (Stable ↑)"
*   Visual: Large centered Green Check or the Executive 6-Dot Strip in all-green state.

---
*End of Document*
