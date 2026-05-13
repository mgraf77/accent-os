# ECOMMERCE OPPORTUNITY INTELLIGENCE V2: PRIORITIZED LEVERAGE ANALYSIS

## 1. GMC / IMAGE OPPORTUNITY PRIORITIZATION

The **20,000+ missing image gap** is not evenly distributed. By correlating `VD_RAW` sales data with product feed attributes, we identify the following high-value suppression risks:

### Leverage Ranking:
1.  **Top-Tier Residential Brands (The "Critical Five"):**
    *   **Kichler ($1.54M total sales):** Highest residential impact.
    *   **Minka Group ($954K combined - Aire/Lavery):** Dominant in fans/lighting.
    *   **Hinkley ($708K):** High-margin hybrid brand.
    *   **Visual Comfort ($367K):** High-AOV designer brand.
    *   **Quoizel ($330K):** Core ecommerce volume brand.
2.  **Impact Estimation:** Resolving image gaps for these five brands alone is estimated to recover visibility for ~25% of Accent’s total lifetime revenue-at-risk.
3.  **Remediation:** Automated audit of "missing image" status per SKU for these top 5 brands to prioritize the Lights America (Data52) feedback loop.

## 2. SEO OPPORTUNITY PRIORITIZATION

Technical debt in the BigCommerce template is currently suppressing the "Shopping" quality score.

### Priority Ranking:
1.  **Highest Value Fix (Schema):** Correcting the **URL-encoded descriptions (`%20`)** and implementing **AggregateRating** (star ratings). These are the most damaging issues for Google’s Rich Result eligibility.
2.  **Easiest Win (Technical):** Replacing the **Homepage H1 Instagram hashtag** with a keyword-rich "Accent Lighting - Wichita's Premier Lighting Showroom" heading via Script Manager.
3.  **ROI Metadata:** Updating **brand-first product titles** to search-first titles (e.g., "Hinkley 1234 Chandelier" → "Brushed Gold 4-Light Dining Chandelier - Hinkley 1234").
4.  **Content Gap:** Category pages are currently "thin." Deploying AI-generated, human-refined category headers for Top 10 categories (Chandeliers, Outdoor, Fans) will drive organic long-tail traffic.

## 3. MERCHANDISING INTELLIGENCE

Leveraging the `decision_engine` and `demand_forecast` logic to drive AOV and Margin.

### Strongest Opportunities:
*   **Essential Accessory Attach:** Automation prompts for quotes <$250 to attach dimmers (Lutron), bulbs (Satco), or downrods (Minka) based on the primary fixture category.
*   **"New Build" Room Packages:** Bundled fixtures for Primary Suites, Kitchen Islands, and Entryways targeting the **"New Home Build" segment** (identified in `KPI_CATALOG.md`).
*   **High-Margin Vendor Bundles:** Prioritize bundles from vendors with verified high "Discount" and "Freight" scores (**Z-Lite**, **Hinkley**, **Savoy House**) to maximize net profit.

## 4. KLAVIYO & MARKETING INTELLIGENCE

Marketing ROI is gated by the "blocked" BigCommerce and Klaviyo syncs.

### Highest ROI Automations:
1.  **Abandoned Cart Recovery (M-FN3):** Immediate 5–15% revenue lift potential upon BigCommerce integration.
2.  **Lapsed VIP Win-Back:** Automatic re-engagement for customers in the **"VIP" segment** (>$5k spend) who cross the **"Lapsed" threshold** (>180d since last activity).
3.  **Browse Abandonment:** Targeted emails for "Active" customers viewing "Top-10 Products" from the `Price Book` but not converting.

## 5. EXECUTIVE PRIORITIZATION SUMMARY

| Rank | Opportunity | Kind | Impact |
|---|---|---|---|
| **1** | **Technical SEO Script Patching** | Easiest Win | High (GMC Approval) |
| **2** | **GMC Image Recovery (Top 5 Brands)**| Highest ROI | Very High (CTR) |
| **3** | **BigCommerce Sync Integration** | Fastest Impact | Max (Unlocks Flows) |
| **4** | **Accessory Attach (Small Quotes)** | Operationally Safe| Medium (AOV) |

### Single Highest ROI Next Move:
**"Deploy Script Manager patches for technical SEO (H1 & JSON-LD) and implement a vendor-specific GMC image-missing audit for the Top 5 residential brands."**
