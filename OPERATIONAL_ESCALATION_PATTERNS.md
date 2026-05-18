# OPERATIONAL_ESCALATION_PATTERNS.md

This document defines a standard hierarchy of operational signals to ensure low-noise alerting and prevent operator fatigue.

## 1. Signal Severity Levels

| Severity | Label | UI Treatment | Action Requirement |
|---|---|---|---|
| 0 | **Confidence Low** | Dotted underline / Gray text | Informational. Verification needed during next routine check. |
| 1 | **Stale** | Amber badge | Process check. Likely missing a recent update or physical verification. |
| 2 | **Warning** | Yellow border | Operator awareness. Review at end of day or during weekly wrap. |
| 3 | **Elevated** | Orange background | Proactive review. Interaction recommended within 24-48 hours. |
| 4 | **Degraded** | Red text / Pulse icon | Systemic risk. Likely affecting ecommerce visibility or customer promises. |
| 5 | **Critical** | Solid Red modal | Immediate action. Project blocked, money at risk, or inventory stock-out. |

---

## 2. Preventing Alert Fatigue

### **Concept: Composite Signal Aggregation**
Instead of 10 individual "Low Stock" alerts, surface **one** "Vendor Reorder Signal" that aggregates all low items for that vendor.

### **Concept: Personal Baseline Thresholds**
Signals should be relative. A "$500 discrepancy" is **Critical** for a small quote but **Confidence Low** for a $50,000 commercial project.

### **Concept: "Muted" State**
Operators should be able to "Mute for 7 days" directly from the signal. If the delta doesn't improve after 7 days, the signal re-emerges at an **Elevated** severity.

---

## 3. Interaction Design (Operator First)

- **Hover-over Logic:** Do not force a click-through. Show the *reason* for the signal on hover.
- **One-Click Dismiss:** "I'm aware" button that doesn't delete the data but hides the signal for the current session.
- **Signal-to-Action Bridge:** Every **Elevated** or **Critical** signal must have a direct action button (e.g., "Draft Outreach", "Adjust Bin", "Recalculate Probability").
