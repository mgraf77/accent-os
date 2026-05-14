# SIGNAL_UI_SURFACE_PLAN.md

This plan details the design of UI surfaces for operational signals, ensuring they are useful on mobile and prevent alert fatigue.

## 1. The Mobile Operational Feed
- **Surface:** A "Signals" sub-tab on the Dashboard (mobile-optimized).
- **Design:** Vertical stack of cards. Each card contains:
  - Severity Icon (Colored Dot)
  - One-line Summary (e.g., "Lead Time Creep: Hinkley")
  - Quick Action Button (e.g., "☏ Call Rep")
- **Constraint:** Maximum of 10 signals shown; older/lower severity signals are collapsed.

## 2. Executive Summary Strip
- **Surface:** Top of the Dashboard (above the "Today" card).
- **Design:** Ultra-compact horizontal rail of status dots.
- **Interactivity:** Hover to see count (e.g., "3 Critical, 5 Warning"). Click to jump to the full Alerts page.

## 3. Command Center Signal Rail
- **Surface:** Right-hand side of large screens (optional) or integrated into the sidebar on desktop.
- **Design:** Minimalist icons indicating systemic health (GMC Feed, Database, API connectivity).
- **Behavior:** Only appears when a signal is in **Warning** or higher state.

## 4. Operator Escalation Surfaces
- **Vendor Heatmap:** Inject a pulse animation or red border around score cells that have dropped significantly in the last 30 days.
- **Quote List:** Replace the generic "saved" icon with a colored "Health Dot" based on project risk signals.
- **Customer 360:** Add a "Risk Banner" at the top of the detail modal if the customer is in the "Lost" segment but has active quotes.

## 5. Low-Noise Notification Concepts
- **Batching:** Instead of multiple toasts, show one: "You have 5 new operational signals."
- **Persistence:** Use the existing `ALERTS` table status (`unread`/`read`) to ensure signals don't repeat once acknowledged.
- **Muting:** Long-press (mobile) or right-click (desktop) on a signal to "Snooze" it for 7 days.
