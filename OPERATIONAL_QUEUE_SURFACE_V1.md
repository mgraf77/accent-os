# OPERATIONAL QUEUE SURFACE V1 — ACCENTOS PHASE 1

## MISSION
To provide a high-velocity, low-cognitive-load interface for managing the daily operational flow of Accent Lighting. The surface is designed to turn raw data anomalies (Signals) into rapid human triage decisions.

## CORE DESIGN LAWS

### 1. The Rule of One
Each signal card in the queue must convey exactly **one primary business fact**.
*   **Yes:** "Quote #1234 has been stagnant for 14 days."
*   **No:** "Quote #1234 is 14 days old, for customer Smith, and contains 5 items, 2 of which are backordered."
*   **Rationale:** Multi-fact cards increase ocular scanning time and cognitive load. Detail is hidden behind the 44px tap target.

### 2. Severity-First Hierarchy
The queue is never sorted chronologically by default. It is sorted by **Impact/Confidence Score**.
*   **Critical (Red):** Immediate revenue or fulfillment risk.
*   **Degraded (Orange):** Process breakdown or SLA breach.
*   **Elevated (Yellow):** Warning/Anomaly requiring attention.
*   **Information (Blue):** Intelligence/Context.

### 3. The Operational Rail
A persistent navigation element (bottom-heavy for mobile) that provides:
*   **Pulse Dots:** 6 dots representing the 6 dimensions of business risk (Inventory, Vendor, Fulfillment, Ecommerce, Operational, Stale Data).
*   **Triage Tab:** Direct access to the signal queue.
*   **Health Summary:** One-word status of the operational pulse (e.g., "ACCELERATING", "STABLE").

## VISUAL GRAMMAR
*   **Typography:**
    *   **Outfit (Sans-Serif):** Used for all labels, navigation, and UI framework.
    *   **DM Mono (Monospace):** Used for all business data (SKUs, Prices, Lead Times, PO Numbers). Monospace ensures vertical alignment of numbers for faster comparison.
*   **Negative Space:** High-contrast white cards on a `#f4f4f2` background to reduce visual noise.

## SCANABILITY METRICS
*   **The 2-Second Rule:** An operator must understand the *nature* and *severity* of a signal within 2 seconds of visual contact.
*   **The 30-Second Triage:** The goal is for an operator to process 10 signals (Snooze, Dismiss, or Action) in under 30 seconds.

## MOBILE ERGONOMICS
*   **Thumb Zone:** All triage actions (Snooze, Action, Dismiss) are located in the bottom 40% of the screen.
*   **Tap Targets:** Minimum 44px x 44px for all interactive elements.
*   **Swipe Gestures:** (Optional Phase 1) Swipe Right to Archive, Swipe Left to Snooze.
