# OPERATIONAL_MOMENTUM_FRAMEWORK.md

This framework defines how AccentOS measures and visualizes directional shifts in business performance.

## 1. Directional Changes (The Delta)
Instead of static numbers, the executive layer focuses on the delta over a 7-day or 30-day window.
- **Acceleration:** Increasing velocity of positive events (e.g., more quotes becoming deals).
- **Deterioration:** Decreasing velocity or increasing risk signals (e.g., rising number of "Cold Quotes").

## 2. Momentum Calculation Logic
Momentum is calculated as:
`M = (Current Period Volume / Previous Period Volume) - 1`

- **Positive Momentum (> 0.1):** Green Up-Arrow.
- **Neutral Momentum (-0.1 to 0.1):** Gray Horizontal-Arrow.
- **Negative Momentum (< -0.1):** Red Down-Arrow.

## 3. Confidence Movement
Tracks the "Drift" of data reliability.
- **Drift Up:** Moving from manual CSVs to live API integrations.
- **Drift Down:** Growing number of "Unverified" badges on active vendors.

## 4. Operational Drift Detection
Alerts the executive when a process is "drifting" away from standard operating procedures.
- **Example:** Percentage of quotes being saved without a linked customer record.
- **Example:** Average time items spend in "Flagged" status before resolution.

## 5. Visual Visualization (The "Trend Spark")
Use ultra-minimal 2-color SVG sparklines (Green for Up, Red for Down) to show the last 14 data points without needing a full Y-axis or grid.
