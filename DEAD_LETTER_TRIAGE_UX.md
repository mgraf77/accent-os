# DEAD-LETTER TRIAGE UX
> **Concept:** Managing the signals that fall through the cracks.

## 1. DEFINITION
A **Dead-Letter Signal** is any anomaly detected by AccentOS that has either:
1.  Been **Snoozed** more than 3 times without action.
2.  Remained **Unread** for > 72 hours despite Level 3+ severity.
3.  Failed to execute its action (e.g., Email API error).
4.  Been **Dismissed** without a logged reason.

---

## 2. THE DEAD-LETTER QUEUE (MANAGEMENT ONLY)
To prevent "Signal Rot," administrators (Owner/Admin) have access to the **Dead-Letter Queue**.

### Surface Logic
*   **Location:** Mgmt Dashboard → System → Dead-Letter.
*   **Visibility:** Hidden from standard operators (Sales/Warehouse) to prevent shame/fatigue.
*   **Frequency:** Reviewed during the Weekly Operational Pulse meeting.

---

## 3. TRIAGE ACTIONS
Managers can perform the following on Dead-Letter items:
*   **Re-Assign:** Move the signal to a different operator's feed.
*   **Force Close:** Archive the signal with a "Manager Override" note (e.g., "Non-issue; manual fix applied").
*   **Heuristic Adjust:** If a specific signal type (e.g., "Lead Time Creep") consistently hits the dead-letter queue, it signals a **False Positive**. The manager can "Loosen" the threshold directly from the triage UI.

---

## 4. UI PATTERNS
*   **The "Rot" Indicator:** A subtle timer icon `⏳` appears on signals that are approaching dead-letter status.
*   **Aggregated Failures:** If 10+ signals of the same type are in the dead-letter queue, the system groups them into a single "Pattern Failure" alert for the Admin.
*   **Typography:** Status labels in `Outfit`; Error codes and Timestamps in `DM Mono`.

---

## 5. RECOVERY & SYSTEM HEALTH
*   **Dead-Letter Rate (KPI):** Tracked as a measure of System Trust.
    - Goal: < 5% of total signals.
    - Risk: > 15% indicates "Signal Noise" or "Operator Burnout".
*   **Auto-Cleanup:** Level 1-2 signals that reach Dead-Letter status are auto-archived after 7 days to keep the system clean.

---
*End of Document*
