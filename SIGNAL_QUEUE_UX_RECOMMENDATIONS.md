# SIGNAL QUEUE UX RECOMMENDATIONS
> **Design Strategy:** Low Cognitive Load / Fast Decision Making

## 1. QUEUE GROUPING: SEVERITY FIRST
Move away from "Type" grouping (Deal vs. Quote) and toward **State/Severity** grouping.

**Proposed Hierarchy:**
- **CRITICAL (Level 5):** "Fix it now or lose money" (GMC Feed down, Large Quote expiring today).
- **DEGRADED (Level 4):** "Operational friction" (Overdue PO, Out of stock VIP item).
- **WARNING (Level 3):** "Needs attention" (Stale deal, Lapsed customer).
- **STALE (Level 1-2):** "Maintenance" (Unverified score, missing metadata).

## 2. TRIAGE FLOW: THE "ONE THING" VIEW
Replace the 10-tile Daily Brief with a **Primary Directive Card**.

- **The UI Logic:** "You have 14 signals, but **this** is the most important one."
- **Executive Rule:** Never show more than 3 "Primary" items. Everything else belongs in the "Secondary Queue" below the fold.

## 3. MOBILE-FIRST ACTIONS (ACTION SLUGS)
Operators shouldn't have to navigate to a module to perform a 5-second task.

- **The Pattern:** "Signal -> Context -> Action Slug"
- **Example:**
  - *Signal:* Quote QT-1024 is Stale (21d).
  - *Context:* Customer: Smith, Value: $4,200.
  - *Action Slug:* [ Draft Follow-up Email ] | [ Mark Lost ] | [ Snooze 7d ]
- **Implementation:** Use overlay modals or inline expandable rows for "Quick Actions" without page navigation.

## 4. CONFIDENCE PRESENTATION
Every signal must state *why* it was generated and how confident the system is in that signal.

- **Visual Key:**
  - 🟢 **High Confidence:** Direct data match (e.g., PO date < today).
  - 🟡 **Medium Confidence:** Heuristic match (e.g., Quote "looks" stale based on average follow-up).
  - ⚪ **Low Confidence:** Predictive/Experimental (e.g., Customer "might" churn).

## 5. ESCALATION INTERACTIONS (THE VIBRATION PRINCIPLE)
Signals should change state if ignored.

- **Interaction Logic:**
  - Day 1: Info (Blue dot).
  - Day 3: Warning (Yellow dot).
  - Day 7: Urgent (Red dot + Push to Manager Brief).
- **Suppression Rule:** Operators can "Snooze" a signal, but they must provide a "Wake-up Date". Permanent dismissal requires an "Update Data" action.

## 6. THE "MOMENTUM" HEADER
Replace raw counts with directional shifts.

- **Old:** "14 Stale Quotes"
- **New:** "14 Stale Quotes (**+3 since yesterday** ↗)"
- **Executive Value:** High-level awareness of whether the "Signal Debt" is being paid down or accumulating.
