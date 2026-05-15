# EXECUTIVE_OPERATIONS_MODEL.md

This document defines the "Mission Control" philosophy for the AccentOS executive operations layer, focusing on awareness and decision acceleration rather than raw data reporting.

## 1. Core Operating Concepts

### **Operational Pulse**
- **Definition:** A real-time indicator of business activity across all modules (quotes saved, deals moved, POs received, interactions logged).
- **Target:** "Is the team moving today?"

### **Operational Health**
- **Definition:** A composite score based on signal severity and system reliability (uptime, hydration time, data accuracy).
- **Target:** "Is the system supporting the team effectively?"

### **Business Momentum**
- **Definition:** Directional trend of high-value KPIs (Pipeline Forecast, Won Revenue, Quote Velocity) over the last 7–30 days.
- **Target:** "Are we accelerating or slowing down?"

### **Deterioration Visibility**
- **Definition:** Proactive identification of declining metrics before they become critical (e.g., Lead Time Creep, Churn Risk, MAP violations).
- **Target:** "What's starting to break?"

---

## 2. Escalation Philosophy (The "No-Noise" Rule)

Executive visibility follows a "Pull, don't Push" model for minor signals, and an "Unavoidable, but Brief" model for critical risks.

- **Level 1 (Routine):** Available in snapshots. No notification.
- **Level 2 (Trend Shift):** Highlighted in the Morning Brief.
- **Level 3 (Risk):** Visible on the Critical Risk Strip (Dashboard).
- **Level 4 (Emergency):** High-contrast modal on next login.

---

## 3. Operational Confidence

Confidence is a meta-metric that tracks the reliability of the underlying data.
- **High Confidence:** Integrations live, CSVs recent (< 48h), Terms verified.
- **Low Confidence:** Stale CSVs, Unverified terms, Manual overrides.

**Philosophy:** Executives should never make high-stakes decisions based on "Low Confidence" surfaces without a visible warning.
