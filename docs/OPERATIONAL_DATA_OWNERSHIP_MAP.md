# OPERATIONAL_DATA_OWNERSHIP_MAP.md
> AccentOS Foundational Architecture — v1.0 | 2026-05-14
> 
> This document defines authoritative ownership, integration method, caching posture, and operational risk for every major entity in the AccentOS ecosystem.
>
> **Core rule:** AccentOS does NOT replicate operational systems. It orchestrates, enriches, and surfaces intelligence on top of them.

---

## How to Read This Map

| Field | Meaning |
|---|---|
| **Source of Truth** | The system that owns the canonical record. AccentOS defers to this system on conflicts. |
| **Integration Method** | How AccentOS receives or retrieves data from the source. |
| **AccentOS Caches?** | Whether AccentOS stores a local copy in Supabase. |
| **Usage Pattern** | How AccentOS consumes the data: live query, enrichment overlay, or periodic snapshot. |
| **Cadence** | Expected refresh or sync frequency. |
| **Operational Owner** | The team/person responsible for data quality at the source. |
| **Stale Risk** | Impact if the AccentOS view is stale — Low / Medium / High / Critical. |

---

## ENTITY MAP

---

### 1. INVENTORY

| Field | Value |
|---|---|
| **Source of Truth** | Windward System Five |
| **Integration Method** | Scheduled CSV export from Windward → Cowork pickup → Supabase `inventory_items` |
| **AccentOS Caches?** | Yes — selective snapshot (SKU, qty_on_hand, cost, vendor, location, reorder_point) |
| **Usage Pattern** | Snapshot — AccentOS reads from its cached `inventory_items` table for velocity scoring, reorder alerts, and vendor ranking overlays |
| **Cadence** | Nightly refresh minimum; on-demand re-pull for critical workflows |
| **Operational Owner** | Warehouse / Operations |
| **Stale Risk** | **High** — reorder decisions and vendor scoring depend on current stock levels. Stale by >48h can cause erroneous alerts. |

**AccentOS Enrichments (not stored in Windward):**
- Velocity classification (fast/medium/slow mover) derived from sales history snapshot
- Vendor assignment confidence score
- Reorder urgency flag

**Not Duplicated:**
- Full transaction history
- Location bin detail
- Windward lot/serial tracking

---

### 2. CUSTOMERS

| Field | Value |
|---|---|
| **Source of Truth** | Windward System Five (operational) + BigCommerce (ecommerce identity) |
| **Integration Method** | Windward CSV export for AR/billing customers; BC API for ecommerce accounts |
| **AccentOS Caches?** | Yes — `customers` table (name, segment, source, first_order, last_order, lifetime_value fields) |
| **Usage Pattern** | Snapshot + enrichment overlay. CRM interactions, RFM scoring, and pipeline linking stored in AccentOS. Source records remain authoritative. |
| **Cadence** | Weekly re-sync for base customer data; interactions written real-time by reps |
| **Operational Owner** | Sales / AR |
| **Stale Risk** | **Medium** — RFM decay is gradual. One-week-old customer snapshot is generally acceptable. Real-time risk is on the interaction/pipeline side, which is AccentOS-native. |

**AccentOS Enrichments:**
- RFM score + segment (VIP/Active/Lapsed/Lost/Prospect)
- Interaction history (AccentOS-native, not sourced from Windward)
- Pipeline deal linkage
- Assigned rep, territory classification

**Not Duplicated:**
- AR balance, invoice history, credit terms (Windward-authoritative)
- Full ecommerce order history beyond summary metrics (BC-authoritative)

---

### 3. QUOTES

| Field | Value |
|---|---|
| **Source of Truth** | AccentOS `quotes` table — quotes are **created and owned in AccentOS** |
| **Integration Method** | AccentOS-native (no inbound sync needed for creation) |
| **AccentOS Caches?** | N/A — AccentOS is the system of record |
| **Usage Pattern** | Live read/write from AccentOS UI |
| **Cadence** | Real-time |
| **Operational Owner** | Sales |
| **Stale Risk** | **Critical** — AccentOS is the source. Data loss here is not recoverable from another system. Backup/WAL important. |

**Downstream:**
- Accepted quotes may generate Windward orders (manual entry or future automation)
- Quote data feeds pipeline probability model

**Not Duplicated:**
- No outbound sync to Windward yet (manual conversion to order by rep)

---

### 4. PRODUCTS / CATALOG

| Field | Value |
|---|---|
| **Source of Truth** | Data52 / Lights America (manufacturer catalog authority) |
| **Integration Method** | Data52 feed → BigCommerce product catalog; AccentOS receives via Windward item master CSV or BC catalog export |
| **AccentOS Caches?** | Partial — `inventory_items` carries SKU + description for items in stock. Full catalog is not mirrored. |
| **Usage Pattern** | Lookup/enrichment only. AccentOS references product data for quote line autocomplete, vendor mapping, and category classification. |
| **Cadence** | On-demand or when new products are added (not continuous sync) |
| **Operational Owner** | Purchasing / Catalog team |
| **Stale Risk** | **Low–Medium** — product descriptions rarely change. New product additions may lag in AccentOS until next import. Acceptable for current workflow. |

**AccentOS Enrichments:**
- Vendor assignment (which product belongs to which AccentOS-tracked vendor)
- Category / subcategory for scoring dimensions

**Not Duplicated:**
- Full spec sheets, images, rich content (Data52/BC-authoritative)
- MSRP/MAP history beyond what AccentOS tracks for competitor pricing

---

### 5. PRICING

| Field | Value |
|---|---|
| **Source of Truth** | Windward System Five (cost + dealer pricing) + BigCommerce (consumer-facing pricing) |
| **Integration Method** | Windward item master CSV export includes cost; BC API or export for consumer price |
| **AccentOS Caches?** | Yes — selective. AccentOS `inventory_items` stores `cost` and optionally `list_price`. Competitor pricing tracked in `competitor_prices` (AccentOS-native observations). |
| **Usage Pattern** | Snapshot for cost basis. Live enrichment for margin calculation in Quote Generator and Price Book. |
| **Cadence** | Nightly with inventory snapshot; competitor pricing updated on observation (manual + future automated scraping) |
| **Operational Owner** | Purchasing / Finance |
| **Stale Risk** | **High** — stale cost data causes margin miscalculation in quotes. One-day lag is tolerable; one-week lag is not. |

**AccentOS Enrichments:**
- Margin calculation (quote-time, derived, not stored)
- Competitor price gap analysis
- Price change delta detection (future: flag when Windward cost changes >X%)

**Not Duplicated:**
- Contract pricing tiers
- Customer-specific price exceptions (Windward-authoritative)

---

### 6. VENDOR SCORING

| Field | Value |
|---|---|
| **Source of Truth** | AccentOS — vendor scores, states, overrides, and changelog are **AccentOS-native** |
| **Integration Method** | AccentOS-native. Source data (purchases, fill rates, returns) drawn from Windward snapshots + manual input. |
| **AccentOS Caches?** | N/A — AccentOS is the system of record for scores |
| **Usage Pattern** | Live read/write. Scores computed from imported data + rep input. |
| **Cadence** | Real-time for saves; underlying data (PO fill rates) refreshed with PO export cadence |
| **Operational Owner** | Purchasing / Management |
| **Stale Risk** | **Medium** — score inputs (fill rates, lead times) lag source data by export cadence. Scores themselves are always current once inputs are updated. |

**Source Data Dependencies:**
- PO line fill rates → from Windward PO export
- Return rates → from Windward return/credit memo export (future)
- Lead time actuals → from PO receipt dates vs. ordered dates (PO snapshot)

---

### 7. PURCHASE ORDERS

| Field | Value |
|---|---|
| **Source of Truth** | Windward System Five |
| **Integration Method** | Windward PO export CSV → Cowork → Supabase `purchase_orders` + `po_lines` |
| **AccentOS Caches?** | Yes — PO header + lines cached for vendor scoring, fill rate calculation, and rep alerts |
| **Usage Pattern** | Snapshot. AccentOS reads PO data for analytics and vendor metrics. AccentOS does not generate authoritative POs (yet — future). |
| **Cadence** | Daily or per-session sync. On-demand pull when vendor scoring needs refresh. |
| **Operational Owner** | Purchasing |
| **Stale Risk** | **Medium–High** — fill rate and open PO visibility matter for vendor scoring accuracy and purchasing decisions. Stale by >1 week is problematic for active vendor analysis. |

**AccentOS Enrichments:**
- Vendor fill rate computation (lines received / lines ordered)
- PO age flags (open PO > expected lead time)
- Vendor-level open order exposure ($$ at risk)

**Not Duplicated:**
- PO approval workflow (Windward-authoritative)
- Receiving workflow (Windward-authoritative)

---

### 8. JOBS / PROJECT TRACKING

| Field | Value |
|---|---|
| **Source of Truth** | AccentOS `jobs` table — job tracking is **AccentOS-native** |
| **Integration Method** | AccentOS-native; jobs may reference Windward order numbers as external reference IDs |
| **AccentOS Caches?** | N/A — AccentOS is the system of record |
| **Usage Pattern** | Live read/write |
| **Cadence** | Real-time |
| **Operational Owner** | Project / Operations |
| **Stale Risk** | **Critical** — AccentOS is the source. No recovery system. |

**Windward Reference:**
- Jobs may carry `windward_order_id` as a cross-reference string (not a live FK)
- Job costing information deferred to Windward; AccentOS tracks status/milestones only

---

### 9. ALERTS

| Field | Value |
|---|---|
| **Source of Truth** | AccentOS `alerts` table — alerts are **generated and owned by AccentOS** |
| **Integration Method** | AccentOS-native. Generated by scheduled workers, Cowork automations, and UI-triggered conditions. |
| **AccentOS Caches?** | N/A — AccentOS is the system of record |
| **Usage Pattern** | Live. Alerts are ephemeral by design — resolved alerts are archived not deleted. |
| **Cadence** | Real-time generation; UI polling or push delivery |
| **Operational Owner** | Varies by alert type (Purchasing, Sales, Management) |
| **Stale Risk** | **High** — alerts that don't fire (because source data is stale) are invisible failures. Monitoring the data pipeline health is therefore a first-class concern. |

**Alert Categories:**
- Inventory reorder triggers (from inventory snapshot)
- Vendor fill rate degradation (from PO snapshot)
- Co-op deadline warnings (AccentOS-native)
- Pipeline staleness (AccentOS-native)
- Quote follow-up prompts (AccentOS-native)
- Ecommerce anomalies (from BC export/API)

---

### 10. MARKETING DATA

| Field | Value |
|---|---|
| **Source of Truth** | Klaviyo (email/SMS) + BigCommerce (ecommerce behavior) |
| **Integration Method** | Klaviyo API → AccentOS `marketing_campaigns` + metric snapshots; BC export for order-linked attribution |
| **AccentOS Caches?** | Yes — campaign metadata and aggregated performance metrics cached in `marketing_campaigns` |
| **Usage Pattern** | Snapshot + enrichment. AccentOS surfaces campaign ROI and attribution in Management Dashboard. Full contact-level data stays in Klaviyo. |
| **Cadence** | Weekly snapshot for reporting; on-demand pull for campaign review |
| **Operational Owner** | Marketing |
| **Stale Risk** | **Low–Medium** — marketing analytics tolerate weekly latency. Real-time campaign execution stays in Klaviyo. |

**AccentOS Enrichments:**
- Campaign-to-revenue attribution (when BC order data available)
- Cross-campaign ROI comparison
- Klaviyo segment health surfaced as KPI

**Not Duplicated:**
- Full contact/subscriber list (Klaviyo-authoritative)
- Email send logs, deliverability detail (Klaviyo-authoritative)

---

### 11. ECOMMERCE METRICS

| Field | Value |
|---|---|
| **Source of Truth** | BigCommerce |
| **Integration Method** | BC API (orders, sessions, conversion) → Cowork → AccentOS KPI snapshots |
| **AccentOS Caches?** | Yes — aggregated metrics cached as KPI snapshots (daily/weekly GMV, conversion rate, AOV, new customers) |
| **Usage Pattern** | Snapshot. AccentOS surfaces BC health as a KPI dimension; it does not replicate the full order database. |
| **Cadence** | Daily snapshot for KPI dashboard; weekly full summary for review |
| **Operational Owner** | Ecommerce / Marketing |
| **Stale Risk** | **Medium** — day-old ecommerce KPIs are acceptable for operational intelligence. Real-time commerce dashboard stays in BC. |

**AccentOS Enrichments:**
- BC performance trended against internal targets/OKRs
- Ecommerce anomaly detection (sudden GMV drop = alert)
- Cross-channel (ecommerce + in-house sales) total revenue view

**Not Duplicated:**
- Full order history, line-item detail (BC-authoritative)
- Customer accounts, addresses, payment info (BC-authoritative)
- Inventory/fulfillment sync (BC ↔ Windward, not AccentOS's responsibility)

---

### 12. EMPLOYEE METRICS

| Field | Value |
|---|---|
| **Source of Truth** | AccentOS `employees` + `employee_scores` — performance tracking is **AccentOS-native** |
| **Integration Method** | AccentOS-native; HR/payroll data (if needed) sourced from separate HR system via manual input or future export |
| **AccentOS Caches?** | N/A — AccentOS is the system of record for performance metrics |
| **Usage Pattern** | Live read/write. Managers score reps; system auto-derives metrics from pipeline/quote data. |
| **Cadence** | Real-time for scores; auto-derived KPIs computed at hydration |
| **Operational Owner** | Management |
| **Stale Risk** | **Low** — performance metrics are lagging indicators; daily refresh is sufficient. |

**Auto-Derived Metrics (from AccentOS-native data):**
- Deals in pipeline per rep
- Win rate (from pipeline)
- Quote volume (from quotes)
- Activity recency (from customer_interactions)

**Not Duplicated:**
- Payroll, benefits, HR compliance (external HR system)

---

### 13. OPERATIONAL TELEMETRY

| Field | Value |
|---|---|
| **Source of Truth** | AccentOS `telemetry_events` + `build_events` — telemetry is **AccentOS-native** |
| **Integration Method** | AccentOS-native; events written by the AccentOS application itself |
| **AccentOS Caches?** | N/A — AccentOS is the system of record |
| **Usage Pattern** | Append-only event log. Read by dashboards and anomaly detection. |
| **Cadence** | Real-time write; aggregated reads on dashboard load |
| **Operational Owner** | Management / Technical |
| **Stale Risk** | **Low** — telemetry is a trailing indicator. Missing a few events is not operationally critical. |

---

## AUTHORITY SUMMARY TABLE

| Entity | Source of Truth | AccentOS Role | Caches? |
|---|---|---|---|
| Inventory | Windward | Consumer + enricher | Yes (selective) |
| Customers | Windward / BigCommerce | Enricher + CRM overlay | Yes (snapshot + interactions) |
| Quotes | **AccentOS** | Owner | N/A |
| Products | Data52 / Windward item master | Lookup only | Partial |
| Pricing | Windward / BigCommerce | Consumer | Yes (cost snapshot) |
| Vendor Scoring | **AccentOS** | Owner | N/A |
| Purchase Orders | Windward | Consumer + analyzer | Yes (snapshot) |
| Jobs | **AccentOS** | Owner | N/A |
| Alerts | **AccentOS** | Owner | N/A |
| Marketing Data | Klaviyo | Consumer + aggregator | Yes (summary) |
| Ecommerce Metrics | BigCommerce | Consumer + aggregator | Yes (KPI snapshot) |
| Employee Metrics | **AccentOS** | Owner | N/A |
| Operational Telemetry | **AccentOS** | Owner | N/A |

---

## DATA FLOW SUMMARY

```
Windward (ERP) ──── CSV export ──────────────────┐
BigCommerce (EC) ── API / export ─────────────────┤
Klaviyo (Email) ─── API ──────────────────────────┤──► Cowork ──► Supabase (selective cache)
Data52 (Catalog) ── feed via BC / Windward ───────┘         │
                                                            ▼
                                              AccentOS Intelligence Layer
                                              (enrichment, scoring, workflows,
                                               alerts, dashboards, AI surfaces)
```

---

## REVISION HISTORY

| Version | Date | Author | Notes |
|---|---|---|---|
| 1.0 | 2026-05-14 | Claude (architecture session) | Initial map — OPERATIONAL_DATA_ARCHITECTURE_V1 |
