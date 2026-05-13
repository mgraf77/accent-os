# ECOMMERCE OPPORTUNITY INTELLIGENCE V1: ANALYSIS REPORT

## 1. ECOMMERCE OPPORTUNITY SURFACES

Accent Lighting’s ecommerce presence currently operates at a **0.004% conversion rate** (55 orders from 1.25M visits). This extreme discrepancy signals massive leakage at the top and middle of the funnel.

### Highest Leverage Surfaces:
*   **GMC Image Recovery (Critical):** 20,000+ products are missing images in Google Merchant Center. This is the primary driver of low click-through rates (CTR) and wasted impressions.
*   **Technical SEO Remediation:**
    *   **H1 Hashtag Error:** Homepage H1 currently uses an Instagram hashtag instead of keyword-rich headings.
    *   **Product Titles:** Lead with brand name instead of search-optimized titles.
    *   **Schema JSON-LD Correction:** Product descriptions are URL-encoded (`%20`), rendering them unreadable to search engines.
    *   **AggregateRating Implementation:** Missing star ratings across the catalog are depressing Google Shopping performance.
*   **Merchandising Gaps:** The "Featured Products" widget is currently empty, and category pages are thin.

## 2. MARKETING INTELLIGENCE OPPORTUNITIES

Current marketing intelligence is "blind" due to blocked integrations for GA4, Search Console, BigCommerce, and Klaviyo.

### Key Gaps & Opportunities:
*   **Abandoned Cart Intelligence (M-FN3):** Currently zero visibility into cart abandonment rates or recovery flows.
*   **Acquisition ROAS (M-AC1):** No tracking of Revenue on Ad Spend by channel, preventing high-margin campaign optimization.
*   **Lifecycle Segmentation:** Customer records in Supabase (CRM) exist, but lack a sync to Klaviyo for automated win-back or welcome flows.
*   **MTA (Multi-Touch Attribution):** Missing the data layer required to quantify marketing-attributed revenue.

## 3. PRODUCT INTELLIGENCE OPPORTUNITIES

The existing intelligence engine (`js/decision_engine.js` and `js/demand_forecast.js`) provides a solid baseline for expansion.

### Intelligence Surfaces:
*   **Essential Accessory Recommendations:** Automate the attachment of essential accessories (e.g., specific bulbs, dimmers, downrods) to lower-value quotes (<$250) where sales reps may under-invest time.
*   **Room-Package Bundling:** Extend the "New Build" project intelligence to automatically suggest whole-room packages (e.g., "Master Bath Lighting Bundle") based on past project win data.
*   **Velocity-Based Merchandising:** Transition from PO-line velocity proxies to actual BigCommerce sales-line history to identify "high-impression / low-conversion" products for price adjustments.

## 4. OPERATIONAL PRIORITIZATION

### Integration Leverage Ranking (ROI per KPI):
1.  **BigCommerce Sync (M04):** HIGHEST. Unlocks 8+ primary KPIs, including cart abandonment and actual sell-through data.
2.  **GA4 / Search Console (M06):** HIGH. Provides the "why" behind the low conversion rate and organic search positioning.
3.  **Klaviyo (M09):** MEDIUM-HIGH. Essential for lifecycle ROI but dependent on BigCommerce data.

### Recommended First Intelligence Surfaces:
1.  **GMC Self-Healing Feed:** Automate the identification and reporting of image-missing SKUs to Eugene/Lights America.
2.  **Script-Based SEO Patching:** Deploy header-level fixes via BigCommerce Script Manager to resolve the URL-encoded JSON-LD issue immediately.
3.  **Abandoned Cart Alerting:** A safe Level 4 agentic feature that drafts recovery emails for SalesRep review before Klaviyo is fully live.
