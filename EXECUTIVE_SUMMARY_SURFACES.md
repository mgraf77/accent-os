# EXECUTIVE_SUMMARY_SURFACES.md

This document designs the visual surfaces required for executive operational awareness in AccentOS, optimized for mobile-first scanning.

## 1. The Morning Brief
- **Surface:** A "Today's Pulse" card shown at the top of the Owner/Admin dashboard.
- **Design:** A 3-column summary of Momentum, Health, and Critical Actions.
- **Interactivity:** One-click to expand "Why?" (Show top 3 contributing signals).

## 2. Mobile Executive Feed
- **Surface:** A dedicated navigation entry for "Executive Intel".
- **Design:** Vertical "Signal Stack" with high-contrast trend indicators (Up/Down/Flat).
- **Behavior:** Pull-to-refresh; auto-highlights "Elevated" signals from the last 24 hours.

## 3. Critical Risk Strip
- **Surface:** A slim, 24px tall horizontal bar fixed to the top of the app shell.
- **Design:** Invisible when zero critical risks. Solid red with white text when 1+ risk exists (e.g., "⚠ 2 Critical Risks: Lead Time Creep, Inventory Stock-out").
- **Constraint:** Only for Level 4/5 escalations.

## 4. Business Pulse Cards
- **Pipeline Momentum:** "Forecast up 12% vs. 7-day average."
- **Quote Velocity:** "45 quotes saved today (+5 vs. avg)."
- **Warehouse Throughput:** "12 POs received today (92% accuracy)."

## 5. Operational Snapshots
- **The "30-Second Audit":** A modal that aggregates one key stat from each module into a "Good/Bad/Warning" grid.
- **Trend Summary:** Simple SVG line sparklines embedded into the summary tiles, showing the last 14 days of data.
