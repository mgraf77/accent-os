# SIGNAL TRUST AND NOISE ANALYSIS
> **Goal:** Prevent Alert Fatigue and Maintain Operator Trust

## 1. TRUST EROSION RISKS
The biggest threat to AccentOS is not "missing a signal," but "crying wolf."

- **The False Positive Trap:** If the "Stale Quote" signal fires for quotes that are intentionally parked, the operator stops looking at the queue.
- **The Stale Data Trap:** If an operator fixes a PO in Windward, but the signal persists because the CSV hasn't been re-imported, the system is perceived as "broken."

## 2. FALSE POSITIVE MITIGATION
**Strategies:**
- **Dynamic Baselines:** Instead of a fixed 14-day stale timer, use a per-customer or per-project-type baseline (e.g., Commercial projects stay "active" longer than residential ones).
- **Human-in-the-Loop Calibration:** Every time an operator dismisses a signal, ask: "Was this signal accurate?" (Yes / No - Too Early / No - Wrong Data).

## 3. STALE DATA RISKS
Since AccentOS currently relies on manual CSV imports for Windward data, the "Pulse" of the system is only as fresh as the last import.

- **Trust Fix:** Display the "Data Age" prominently next to every signal.
- **UX Pattern:** "This PO is overdue (Data from 4 hours ago ↻ Refresh)."

## 4. SUPPRESSION ABUSE
Operators will naturally want to "Clear the queue" to get back to zero.

- **Risk:** "Mass Dismissal" of signals without reading them.
- **Fix:**
  - No "Mark All Read" for Urgent signals.
  - Require a reason code for dismissing High-Impact opportunities.
  - Track "Suppression Rate" as a KPI for Managers.

## 5. OPERATOR CONFIDENCE DEGRADATION
Confidence is lost when the system suggests an action that is socially or operationally "impossible."

- **Example:** Suggesting a follow-up on a Sunday, or suggesting a "Retain" call to a customer who just had a delivery failure that isn't yet in the system.
- **Mitigation:** Cross-module validation. "Don't suggest Sales Outreach if there is an Open Warranty Claim or Overdue Delivery for this customer."

## 6. THE "TRUTH" HIERARCHY
To maintain trust, the system must clearly distinguish between **Fact** and **Inference**.

1. **FACT:** "PO #101 is 5 days past due." (100% Trust)
2. **HEURISTIC:** "This customer hasn't ordered in 90 days." (95% Trust)
3. **INFERENCE:** "This customer is at risk of churning." (70% Trust)
4. **PREDICTIVE:** "This customer might like this new chandelier." (50% Trust)

**UX Rule:** Never mix Levels 1/2 with Levels 3/4 in the same visual list.
