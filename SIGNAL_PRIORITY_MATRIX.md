# SIGNAL_PRIORITY_MATRIX.md

This matrix ranks operational signals to guide implementation effort toward maximum business leverage.

| Signal Name | Severity | Leverage | Complexity | Maintenance | Urgency |
|---|---|---|---|---|---|
| **Lapsed VIP Outreach** | Elevated | High | Low | Low | Medium |
| **GMC Image Gap** | Critical | High | Low | Low | High |
| **Dead Stock > $500** | Elevated | Medium | Low | Low | Low |
| **Flagged Quote Stagnation** | Warning | High | Low | Medium | Medium |
| **Lead Time Creep** | Critical | Very High | Medium | Medium | High |
| **Hydration Timeout** | Warning | Low | Low | Medium | Low |
| **Form Abandonment** | Warning | Medium | Low | High | Low |
| **Churn Risk (RFM Trend)** | Elevated | High | Medium | Low | Medium |

## Ranking Definitions

- **Leverage:** The potential dollar impact or time savings for the business.
- **Complexity:** Estimated dev effort to implement the trigger logic.
- **Maintenance:** How often the heuristics will need "tuning" to remain low-noise.
- **Urgency:** How quickly an operator needs to see this once the trigger is met.
