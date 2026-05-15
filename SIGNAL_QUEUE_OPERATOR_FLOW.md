# SIGNAL QUEUE — OPERATOR FLOW
> **Goal:** 30-second triage. Actions over data.

## 1. THE 30-SECOND TRIAGE LOOP
The operator's daily engagement with AccentOS begins at the **Signal Feed**. The objective is to clear or action high-priority signals before entering deep work.

### Step 1: Glance (0-5s)
*   Check the **Executive Strip** (6-dot status).
*   If any dot is Red (Level 4+) or Pulsing (Level 5), tap it immediately.
*   Otherwise, scroll the vertical Signal Feed.

### Step 2: Triage (5-15s)
For each signal in the feed, perform one of three quick actions:
1.  **Acknowledge:** Mark as "Read" (clears from active feed, remains in history).
2.  **Snooze:** Hide for 24h/48h (used when data is pending or rep is out).
3.  **Action:** Tap the primary action button (e.g., "Draft Outreach").

### Step 3: Execution (15-30s)
*   Review the auto-generated content (Email draft, PDF, or Status flip).
*   Tap "Send" or "Confirm".
*   The signal moves to **Actioned** status and is archived.

---

## 2. SEVERITY-FIRST HIERARCHY
The feed is sorted by **Severity**, then by **Value at Risk**.

| Level | Visual Indicator | Context | Operator Expectation |
|---|---|---|---|
| **5 — Critical** | Red Pulse | Immediate Business Threat | Stop everything. Fix now. |
| **4 — Degraded** | Red | Significant Revenue/Op Risk | Triage in first 30 mins of shift. |
| **3 — Elevated** | Amber | Anomaly Detected | Action during morning "admin block". |
| **2 — Warning** | Yellow | Subtle Shift | Review if time permits. |
| **1 — Stale** | Grey | Data Age Alert | Refresh data source (CSV/Sync). |
| **0 — Confidence**| Blue/Dim | Intelligence Gap | Ignore; system is gathering data. |

---

## 3. UI RULES FOR OPERATOR FOCUS
*   **No Multi-Select:** Force triage of one signal at a time to prevent "Bulk Ignore" errors.
*   **Outfit for Framework:** UI labels and instructions use `Outfit`.
*   **DM Mono for Data:** All business metrics (SKUs, Prices, Lead Times) use `DM Mono` for perfect column alignment.
*   **Rule of One:** Each signal card presents exactly **one** primary fact and **one** primary action.

---

## 4. FEED RECOVERY
Operators can access the **Signal Archive** at any time to:
*   Review previously actioned signals.
*   Restore a snoozed signal.
*   Audit the "Result" of an action (e.g., "Email sent at 10:45 AM").

---
*End of Document*
