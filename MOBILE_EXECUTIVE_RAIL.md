# MOBILE EXECUTIVE RAIL — Command at the Thumb

## 1. THE "OPERATIONAL RAIL" CONCEPT
The Mobile Executive Rail is a persistent horizontal or vertical navigation/status bar designed for one-handed operation on iPhone. It serves as the "Primary Triage Surface."

## 2. THE RAIL ANATOMY
*   **The Pulse Dot:** A single master health indicator. Tap to expand the "Six Dots."
*   **The Velocity Meter:** A small sparkline showing 24-hour business momentum (Rev / Activity).
*   **The Triage Count:** A number indicating "Signals Pending Triage."
*   **Global Search:** Quick access to search Vendors, SKUs, or Customers.

## 3. INTERACTION PATTERNS
*   **Thumb-Centric:** All primary triage buttons are located in the "Natural Thumb Zone" (bottom 40% of the screen).
*   **Swipe to Triage:**
    *   *Swipe Right:* "Confirm / Resolve" (I've handled it).
    *   *Swipe Left:* "Dismiss / Ignore" (Not an issue).
*   **Long Press:** Peek into the source data without leaving the feed.

## 4. THE "RULE OF ONE" (Mobile Specific)
On mobile, cognitive load is high. We enforce a **"One Primary Fact"** rule:
*   No more than one large numeric metric per card.
*   Supporting metrics must be 50% smaller and visually secondary.
*   Avoid "Tab Navigation" within the executive surface; use a single, infinite vertical feed of relevance.

## 5. GLANCEABLE METRICS (The DM Mono Standard)
All metrics on the rail and signal cards use **DM Mono**.
*   **Currency:** Always `fmt$` (e.g., $12.4k).
*   **Deltas:** Always include a sign (+ or -) and a directional arrow (↑ / ↓).
*   **Baselines:** "vs 7d avg" or "vs Target" always included in small text.

## 6. CONNECTIVITY BEHAVIOR
*   **Stale State Display:** If the phone is offline or the data sync is > 1 hour old, the entire rail enters "Stale Mode" (desaturated colors) to prevent the executive from acting on outdated intelligence.
*   **Background Sync:** The surface should refresh silently in the background, only "pinging" (haptic) for Level 5 Critical signals.
