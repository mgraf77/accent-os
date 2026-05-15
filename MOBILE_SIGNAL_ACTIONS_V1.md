# MOBILE SIGNAL ACTIONS — V1
> **UX Goal:** Thumb-driven triage. Action over data.

## 1. THE OPERATIONAL RAIL
On mobile devices, the left-hand navigation is replaced by a bottom **Operational Rail**.
*   **Home:** Executive Pulse (Dots).
*   **Signals:** The Feed (Vertical scroll).
*   **Search:** Global SKU/Customer lookup.
*   **Profile:** Role + Settings.

---

## 2. TOUCH TARGETS & ERGONOMICS
*   **The 44px Rule:** All interactive elements (buttons, toggles, chips) must have a minimum tap target of **44px × 44px** to prevent mis-clicks.
*   **Bottom-Heavy UI:** Primary "Action" buttons are placed in the bottom 30% of the screen for one-handed thumb access.
*   **Swipe Gestures:**
    - **Swipe Right:** Acknowledge / Mark Read.
    - **Swipe Left:** Snooze / Remind Later.

---

## 3. SIGNAL-SPECIFIC QUICK ACTIONS
Each signal type in the Phase 1 shortlist has a dedicated "One-Tap" action:

| Signal | Primary Mobile Action | Secondary Action |
|---|---|---|
| **Lapsed VIP** | 📞 Call Now | ✉️ Draft SMS/Email |
| **Stagnant Quote** | 📧 Resend Quote | 🕒 Snooze 48h |
| **Dead Stock** | 🏷️ Mark Clearance | 🗑️ Delete/Archive |
| **Lead Time Creep** | 🔔 Notify Customer | 📝 Add Internal Note |

---

## 4. TYPOGRAPHY FOR MOBILE SCANNING
*   **Labels:** `Outfit` 12px (Regular) for secondary context.
*   **Metrics:** `DM Mono` 16px (Bold) for readability while walking/moving.
*   **Contrast:** High-contrast text only (`#1a1a1a` on `#ffffff`). Avoid grey-on-grey for mobile accessibility.

---

## 5. OFFLINE / LOW-SIGNAL HANDLING
AccentOS Mobile employs a "Optimistic UI" pattern:
1.  **Local Commit:** When a user taps "Acknowledge," the signal vanishes immediately from the local UI.
2.  **Background Sync:** The `sbUpdate` call runs in the background.
3.  **Conflict Resolution:** If the sync fails, the signal reappears with a discrete red retry icon `🔄`.

---
*End of Document*
