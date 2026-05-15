# DEAD-LETTER OPERATOR HANDLING

## OVERVIEW
A "Dead-Letter" signal is a failure of the operational loop. It represents a known anomaly that the operator has repeatedly deferred or ignored.

## DEAD-LETTER DEFINITIONS
A signal enters the dead-letter queue if it meets **any** of the following:
1.  **Over-Snoozed:** Snoozed > 3 times without resolution.
2.  **Stale-Unread:** Unread for > 72 hours (for Level 3+ severity).
3.  **Action-Failure:** An "Action" was attempted but the signal was not resolved/dismissed (indicating the action bridge failed).
4.  **Silent Dismissal:** Dismissed without a required reason code (for high-severity).

## OPERATOR TRIAGE FLOW (THE "FAIL-SAFE")

### 1. The Weekly Audit
Dead-letter signals are moved from the Daily Triage Queue to the **Management Dashboard (Mgmt)**. They are no longer visible to standard operators but appear in the Owner/Admin's "Operational Friction" report.

### 2. Friction Analysis
Each dead-letter signal is tagged with a "Friction Type":
*   **Logical Friction:** The signal is "wrong" (operator keeps snoozing because the data is incorrect). *Solution: Adjust Heuristic.*
*   **Operational Friction:** The task is too hard/unpleasant. *Solution: Automate the Action.*
*   **Capacity Friction:** The operator has too many signals. *Solution: Increase Severity Thresholds.*

### 3. Re-Injection Logic
*   **Cool-Down:** A dead-letter signal is suppressed for 7 days.
*   **Escalation:** On re-injection, the signal returns with a "Snooze Alert" badge and a mandatory dismissal reason.

## VISIBILITY TO OPERATORS
Operators do **not** see the dead-letter queue. They only see the consequences:
*   A "Pulse Dot" in the Operational Rail may stay Red even if the Triage Queue is empty, indicating unresolved dead-letter signals in that dimension.
*   The "Clean Slate" goal is only achieved when the daily queue **and** the dead-letter dependencies are addressed.
