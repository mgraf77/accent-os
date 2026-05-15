# SIGNAL TRIAGE FLOW — THE 30-SECOND CHECK-IN

## PURPOSE
To define the rapid-cycle interaction model for handling operational signals in AccentOS. The triage flow is designed to prevent "Alert Fatigue" by enforcing strict interaction constraints.

## THE TRIAGE LOOP
1.  **Entry:** Operator opens the Operational Rail → Triage Queue.
2.  **Scan:** Operator views top-priority card (Rule of One).
3.  **Decision:** Operator must choose one of three paths:
    *   **Action:** Immediate resolution (e.g., "Draft Follow-up Email", "Check Stock").
    *   **Snooze:** Hide for a set duration (e.g., 4h, 24h, 3d).
    *   **Dismiss:** Permanent removal with a reason (e.g., "Non-issue", "Resolved elsewhere").
4.  **Repeat:** System automatically scrolls to the next signal in the hierarchy.

## INTERACTION STATES

### 1. The Snooze Protocol
*   **Default Durations:** 4 hours (Today), 24 hours (Tomorrow), 72 hours (Monday/Next Week).
*   **Logic:** Snoozing a signal increments the "Snooze Count". Once a signal reaches 3 snoozes, it is flagged as a **Dead Letter** (See `DEAD_LETTER_OPERATOR_HANDLING.md`).
*   **Purpose:** To prevent "soft dismissal" where signals are ignored without being resolved.

### 2. The Action Bridge
*   **Direct Execution:** Whenever possible, the "Action" button should pre-populate a workflow (e.g., opening a pre-drafted email in js/outreach.js).
*   **Context Preservation:** When transitioning from a signal to a module (e.g., from a "Low Stock" signal to the Inventory tab), the system must maintain the SKU filter.

### 3. Dismissal Intelligence
*   **Reasoning Required:** For Level 3 (Elevated) signals and above, a reason code must be selected for dismissal.
*   **Feedback Loop:** High dismissal rates for a specific signal type trigger a "Confidence Score" degradation for that heuristic.

## VELOCITY GOALS
*   **Interaction Friction:** Zero. No "Are you sure?" modals for Snooze or Dismiss.
*   **Latency:** Signal removal/advancement must occur in <100ms.
*   **Batching:** Operators should be able to "Batch Snooze" low-severity info signals.

## TRUST INDICATORS
*   **Heuristic Clarity:** Every signal card has a "Why this?" link that explains the logic (e.g., "Triggered because lead time > 14 days and PO is not marked 'In Transit'").
*   **Source Data:** A small "View Source" icon allows the operator to see the raw CSV or ERP data that triggered the signal.
