# MINIMAL RUNTIME — OPERATOR VALIDATION
> **Version:** 1.0 | **Status:** PROPOSED
> **Role:** Operator Experience (OX) Validation for AccentOS Phase 1 Signals

## 1. PURPOSE
This document validates the **Phase 1 Signal Runtime** from the perspective of daily AccentOS operators (Sales, Warehouse, Management). It ensures that the proactive "digital nervous system" reduces friction rather than adding noise.

---

## 2. PHASE 1 SIGNAL SHORTLIST — OPERATOR IMPACT

| Signal | Business Trigger | Operator Action | OX Priority |
|---|---|---|---|
| **Lapsed VIP Outreach** | Recency > 90d for Customer Segment = 'VIP' | Personal check-in (phone/email) | 🔴 HIGH |
| **Flagged Quote Stagnation** | Quote Age > 14d + Value > $2,500 | "Nudge" email or status refresh | 🔴 HIGH |
| **Dead Stock (Inventory)** | Qty > 0 + 0 sales in 180d | Mark for clearance or return to vendor | 🟡 MED |
| **Lead Time Creep** | Actual Vendor Lead Time > Catalog Lead Time by 25% | Update customer expectations on open POs | 🟡 MED |

---

## 3. OPERATOR TRUST & CONFIDENCE MODEL
To prevent signals from being ignored, the runtime must adhere to the **Confidence Hierarchy**:

1. **Transparency (Why):** Every signal must show the "Source Logic" (e.g., "Triggered because Minka Group average lead time shifted from 7 to 12 days").
2. **Auditability (History):** If an operator dismisses a signal, the system records the reason to refine the heuristic.
3. **Accuracy (Data Health):** Signals are suppressed if the "Stale Data" dot (Dot 6) is active (Confidence Level < 3).

---

## 4. ALERT FATIGUE MITIGATION
Operators should never face a "wall of alerts." The runtime enforces:

* **The Rule of Three:** No more than 3 high-severity (Urgent) signals are presented per role per session.
* **Escalation Triage:**
    - **Levels 0-2 (Info/Warning):** Passive dots only.
    - **Level 3 (Elevated):** Appears in the Signal Feed.
    - **Level 4 (Degraded):** Triggers a Daily Brief tile.
    - **Level 5 (Critical):** Immediate top-bar notification.

---

## 5. VALIDATION CRITERIA FOR MINIMAL RUNTIME
*   **Glanceability:** Can an operator understand the risk in < 3 seconds?
*   **Actionability:** Is there a "One-Tap Action" available (e.g., "Draft Email")?
*   **Relevance:** Does the signal match the operator's current role permissions?
*   **Recovery:** Can a dismissed signal be recovered if it was closed in error?

---

## 6. OPERATOR RISK ASSESSMENT
*   **Primary Risk:** "Noise Overload" leading to operators disabling notifications or ignoring the Signal Feed.
*   **Mitigation:** Tighten heuristics before deployment; require a 90% "Actionable" rating from Michael/Paul during the 7-day burn-in period.

---
*End of Document*
