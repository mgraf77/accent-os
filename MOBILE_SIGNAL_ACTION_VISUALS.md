# MOBILE SIGNAL ACTIONS — VISUALS
> **Objective:** Ergonomic triage. Thumb-zone optimization.

## 1. THE OPERATIONAL RAIL (MOBILE)
The main navigation is anchored at the bottom for one-handed access.

```text
+-----------------------------------------------------------+
| [O] Executive Pulse | [!] Signals | [Q] Search | [U] Profile |
+-----------------------------------------------------------+
  ^ 48px Height | Active icon highlighted in Red (#ed1c24)
```

---

## 2. SWIPE GESTURE — VISUAL FEEDBACK
Triage is performed via horizontal swipes on the signal card.

*   **Slide Right (Green Gradient Reveal):**
    - Text: `✓ ACKNOWLEDGE`
    - Icon: Checkmark
    - Interaction: Commits signal as "Read".
*   **Slide Left (Amber Gradient Reveal):**
    - Text: `🕒 SNOOZE`
    - Icon: Clock
    - Interaction: Triggers 24h/48h delay.

---

## 3. THE "THUMB-ZONE" PRIMARY ACTION
The most important action (e.g., "Call Paul Graf") is presented as a **Floating Action Button (FAB)** or a **Sticky Bottom Bar** within the card detail view.

*   **Position:** Bottom 30% of the screen.
*   **Height:** 48px.
*   **Style:** Solid Black Background, White `Outfit` text.
*   **Visual Guard:** A 12px "Safe Zone" gutter between buttons to prevent "Fat-Finger" errors.

---

## 4. MOBILE TYPOGRAPHY & SPEED
Scanning while moving requires high-contrast, large-scale metrics.

| Element | Font | Size | Weight | Color |
|---|---|---|---|---|
| Signal Title | `Outfit` | 16px | 600 | `#1a1a1a` |
| Primary Metric | `DM Mono`| 18px | 600 | `#ed1c24` |
| Source Info | `Outfit` | 10px | 400 | `#666666` |

---

## 5. OPTIMISTIC UI VISUALS
To maintain "Scan Velocity," the UI must never wait for a network response.

*   **The "Vanish" Animation:** On swipe, the card collapses vertically (0.2s) and the feed below slides up instantly.
*   **The "Retry" Indicator:** If the background sync fails, a Red Dot `•` appears on the **Profile [U]** icon in the rail. Tapping it shows "3 Actions Pending Sync".

---
*End of Document*
