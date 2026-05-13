# KLAVIYO_MARKETING_INTELLIGENCE_V1

## 1. LIFECYCLE FLOW OPPORTUNITIES

| Flow | Trigger Logic (AccentOS Derived) | Priority | ROI Potential |
|---|---|---|---|
| **Abandoned Cart** | BigCommerce standard integration | CRITICAL | HIGH (Recovery of 0.004% baseline) |
| **Quote Follow-up** | Quote age > 7d · Total > $250 · No interaction | HIGH | HIGH ($22.8K/yr baseline value) |
| **At-Risk Retention** | VIP/Active segment · Recency > 60d | HIGH | MEDIUM (Churn prevention) |
| **Post-Purchase Upsell** | Won Deal + 14d · Category = Fixtures | MEDIUM | MEDIUM (12-15% attach rate) |
| **Winback** | Segment = Lapsed (180-365d) | MEDIUM | LOW/MEDIUM |
| **Browse Abandonment** | Product page view · No cart/checkout | LOW | MEDIUM (Top-30 vendors focus) |

## 2. SEGMENTATION OPPORTUNITIES

*   **Designer/Trade:** Segment by `customer.type` IN ('designer','trade','contractor'). Higher LTV focus.
*   **Showroom VIPs:** `rfm_monetary` >= $5,000 AND `rfm_recency` <= 90d. White-glove treatment.
*   **Ecommerce DIY:** `customer.type` = 'residential' AND interaction_type = 'ecommerce'. Price-sensitive.
*   **Category Specialists:** Segment by `PRODUCT_TAXONOMY` (e.g., 'Fans', 'Exterior', 'Landscape').
*   **Lapsed High-Value:** `rfm_monetary` > $2,000 AND `rfm_recency` > 180d.

## 3. REVENUE LEAK ANALYSIS

*   **Weak Quote Follow-up:** Current "Follow-up" kind in Decision Engine identifies stale quotes (7-60d) that represent significant uncaptured revenue.
*   **Retention Gaps:** VIP/Active customers currently "go cold" after 60 days without an automated trigger to re-engage.
*   **Low Accessory Attachment:** Upsell heuristics (7-90d post-win) indicate a leak in bulb and control sales (target 12-15% lift).
*   **Manual Reorder Blindness:** Lack of flow triggers when a customer exceeds their 1.5x order frequency baseline.

## 4. EXECUTIVE PRIORITIZATION

1.  **Fastest Revenue Impact:** Abandoned Cart (Ecommerce) + Stale Quote Automated Email.
2.  **Easiest Wins:** Post-purchase "Thank You" + Accessory (Bulb) reminder flows.
3.  **Lowest Complexity:** RFM-based segmentation (VIP, Lapsed) using existing AccentOS data.
4.  **Highest ROI Flows:** Trade/Designer lifecycle management and Quote-to-Order conversion automation.

## 5. BUSINESS IMPACT ESTIMATION

*   **Retention Lift:** Est. **10–15%** improvement in LTV by automating VIP "Retain" touchpoints.
*   **Abandoned Cart Recovery:** Est. **2–5%** recovery rate, significantly moving the current 0.004% conversion floor.
*   **Repeat Purchase Impact:** Est. **15–20%** increase in Trade segment frequency via winback and project-lifecycle flows.
*   **AOV Improvement:** Est. **$40–$50 lift** via automated accessory/control attachment post-fixture sale.

## OUTPUT: PRIORITIZED ROADMAP

*   **Phase 1: Basic Recovery (Days 1-30)**
    *   Integrate Klaviyo with BigCommerce.
    *   Deploy standard Abandoned Cart and Welcome Series.
*   **Phase 2: AccentOS Intel Sync (Days 31-60)**
    *   Sync `CUSTOMERS` RFM segments (VIP, Active, Lapsed) to Klaviyo.
    *   Deploy "At-Risk" flow for VIPs quiet > 60 days.
*   **Phase 3: Omnichannel Conversion (Days 61-90)**
    *   Trigger Quote Follow-up flows based on `quotes` table updates.
    *   Deploy Post-Purchase Upsell based on `won` deals.

**Safest Early Intelligence Surfaces:** Abandoned Cart and VIP Churn Monitoring.
**Recommended First Marketing Integrations:** BigCommerce REST API (Track 6.3) + Klaviyo API (Track 6).
