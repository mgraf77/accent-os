# SIGNAL CONFIDENCE — VISUAL LANGUAGE
> **Objective:** Trust through transparency. Data health visibility.

## 1. THE CONFIDENCE SCORE (0-100)
Every signal card displays a **Confidence Gauge** in the bottom corner.

*   **Visual:** A small circular ring.
*   **Metric:** `DM Mono` percentage (e.g., `85%`).
*   **Logic:** Derived from Data Age + Source Reliability + Heuristic Maturity.

---

## 2. STALE SOURCE VISUALS (DOT 6)
The "Stale Data" indicator (Dot 6 in the Executive Strip) governs the entire UI's visual tone.

### State: Healthy (Sync < 24h)
*   **UI:** Standard contrast. Vibrant colors.
*   **Indicator:** Small green dot `●` next to the data timestamp.

### State: Stale (Sync > 48h)
*   **UI:** The entire Signal Feed takes on a **"Warning Overlay"** (subtle amber tint at top/bottom).
*   **Dot 6:** Pulses Amber.
*   **Action Barrier:** Primary action buttons show a warning icon `⚠` before the text (e.g., `⚠ DRAFT OUTREACH`).

### State: Critical (Sync > 7 Days)
*   **UI:** Desaturated.
*   **Dot 6:** Solid Red.
*   **Alert:** A persistent banner at the top: "Operating on Stale Data. Confidence Low."

---

## 3. HEURISTIC TRANSPARENCY (THE "WHY")
Tapping the Confidence Gauge opens a **Transparency Panel**.

*   **Source Lineage:** "Windward ERP → BigCommerce → AccentOS Engine" (Visual Breadcrumbs).
*   **Logic Breakdown:**
    - "Segment Weighting (VIP): +20%"
    - "Activity Gap (114d): +40%"
    - "Historical Accuracy: 95%"
*   **Typography:** Labels in `Outfit`; weights and scores in `DM Mono`.

---

## 4. ESCALATION VISIBILITY
When a signal is escalated (Level 4 → Level 5), its visual treatment changes to reflect the "Business Emergency".

*   **The "Urgent" Border:** A 2px Solid Red `#ed1c24` border around the card.
*   **The "Impact" Highlight:** The Value at Risk (e.g., `$12,450`) pulses slowly in `DM Mono`.
*   **Operator Cue:** "Escalated by System: Multiple failed outreach attempts."

---

## 5. VISUAL INTEGRITY KPI
The goal of this visual language is **High Trust**.

*   **Signal Acceptance Rate:** The % of signals actioned vs. dismissed.
*   **Visual Metric:** If acceptance drops below 80%, Dot 5 (Operational) shifts to Amber, indicating a "Noise Crisis".

---
*End of Document*
