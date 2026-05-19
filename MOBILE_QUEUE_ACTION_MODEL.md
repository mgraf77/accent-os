# MOBILE QUEUE ACTION MODEL — ERGONOMIC STANDARDS

## OVERVIEW
AccentOS is designed for the "Operator on the Move" (Owner in the showroom, Warehouse lead on the floor). The mobile UX prioritizes one-handed use and rapid thumb-driven triage.

## PHYSICAL ERGONOMICS

### 1. The Thumb Zone
*   **Primary Actions:** The "Action" (Primary), "Snooze" (Secondary), and "Dismiss" (Tertiary) buttons are grouped in the bottom-right quadrant for easy right-thumb access.
*   **Nav Rail:** The Operational Rail is anchored at the bottom (y-axis: 0).

### 2. Tap Target Standards
*   **Minimum Target:** 44px x 44px.
*   **Interaction Spacing:** Minimum 8px gutter between interactive elements to prevent accidental "Fat Finger" dismissals.
*   **Full-Width Cards:** Signal cards occupy the full width of the viewport (minus 16px padding) to maximize the interactive surface.

## INTERACTION PATTERNS

### 1. Severity Visualization (The Pulse Dots)
*   **Location:** Anchored in the Operational Rail.
*   **Behavior:** 6 color-coded dots (8px diameter).
*   **Interaction:** Tapping a dot filters the queue to that specific risk dimension (e.g., Tapping the "Inventory" dot shows only stock signals).

### 2. Velocity-Driven UI
*   **Dynamic Loading:** The queue pre-loads the next 3 signals in the stack to ensure zero-latency transitions.
*   **Haptic Feedback:** (Where supported) Soft haptic pulse on Dismiss, Firm haptic pulse on Action.

## INFORMATION DENSITY
*   **Headlines Only:** On mobile, the "Rule of One" is strictly enforced. The body text of a signal is truncated to 2 lines max.
*   **Monospace Metrics:** All business data (prices, quantities) uses **DM Mono** at 14px to ensure readability while moving.

## MOBILE-FIRST CONSTRAINTS
*   **No Tooltips:** All critical information must be visible; tooltips are a failure of mobile ergonomics.
*   **No Multi-Select:** In the triage loop, signals are processed 1-by-1 to maintain focus.
*   **Single-Handed "Exit":** A clear, large "X" or "Done" in the bottom-left allows the operator to exit the triage flow instantly.
