# WINDWARD_EXPORT_STRATEGY.md
> AccentOS Foundational Architecture — v1.0 | 2026-05-14
>
> Integration philosophy for Windward System Five. AccentOS treats Windward as an authoritative data source accessed via structured exports — never via direct database coupling.

---

## Guiding Principle

> **Windward is the ERP. AccentOS is the intelligence layer on top of it.**

AccentOS must never:
- Connect directly to Windward's database
- Replicate Windward's operational workflows
- Become a dependent of Windward's internal schema versioning

AccentOS must always:
- Treat Windward exports as the integration boundary
- Degrade gracefully when exports are delayed or missing
- Add intelligence to Windward data rather than duplicating it

---

## 1. LIKELY EXPORT SURFACES

Windward System Five supports several export mechanisms. Prioritized by operability:

### Primary — CSV / Report Export
Windward's reporting engine can produce structured CSV exports for most core datasets. This is the lowest-coupling, highest-durability integration path.

| Dataset | Windward Report / Export | Output Format |
|---|---|---|
| Item Master (products + pricing) | Item List / Price List report | CSV |
| Inventory Quantity on Hand | Inventory valuation or stock status report | CSV |
| Purchase Orders (open + history) | PO report by date range | CSV |
| Customer List | Customer master report | CSV |
| Sales History | Sales by customer / item / date | CSV |
| Vendor List | Vendor master report | CSV |
| Invoices / AR | AR aging or invoice history | CSV |
| Receiving / PO Receipts | Receipt history by PO or date | CSV |

### Secondary — Windward Built-in Scheduler (if available in license tier)
Windward may support scheduled report delivery to a shared folder, email, or FTP. If available, this reduces manual export friction.

### Tertiary — ODBC / Direct DB Query (AVOID for production)
Windward exposes an ODBC connection in some configurations. This is **not recommended** as a primary integration path — schema changes in Windward can silently break AccentOS without warning. Acceptable only for one-time data migration or emergency backfill.

---

## 2. RECOMMENDED EXPORT-FIRST WORKFLOWS

### 2A. Daily Inventory Snapshot
**Trigger:** Nightly Windward report export (manual or scheduled)
**Export:** Stock status CSV — columns: SKU, description, qty_on_hand, qty_on_order, cost, vendor_code, location
**Destination:** Cowork-monitored intake folder
**Downstream:** Cowork normalizes → upserts `inventory_items` in Supabase → triggers reorder alert evaluation

### 2B. Daily PO Status Snapshot
**Trigger:** End-of-day Windward PO export
**Export:** Open PO report — columns: po_number, vendor_code, order_date, expected_date, line_sku, qty_ordered, qty_received, line_cost
**Destination:** Cowork intake
**Downstream:** Cowork upserts `purchase_orders` + `po_lines` → triggers vendor fill rate recalculation

### 2C. Weekly Customer Refresh
**Trigger:** Monday morning Windward customer export
**Export:** Customer master CSV — name, account_number, address, phone, last_invoice_date, ytd_purchases
**Destination:** Cowork intake
**Downstream:** Cowork matches on name/account → upserts AccentOS `customers` base fields (does not overwrite rep notes or RFM — those are AccentOS-native)

### 2D. Weekly Sales History Slice
**Trigger:** Monday morning
**Export:** Sales by customer/item for trailing 90 days
**Destination:** Cowork intake
**Downstream:** Velocity classification on inventory items + customer RFM refresh

### 2E. On-Demand Vendor Master Pull
**Trigger:** Manual — when onboarding a new vendor or auditing vendor data
**Export:** Vendor master CSV — vendor_code, name, terms, rep contact
**Destination:** Manual upload to AccentOS admin tool or Cowork endpoint
**Downstream:** Creates/updates vendor records; doesn't overwrite AccentOS scoring fields

---

## 3. CSV-BASED SYNCHRONIZATION OPPORTUNITIES

These are patterns that work well with export-first CSV integration:

| Opportunity | How |
|---|---|
| **Inventory reorder alerts** | Nightly CSV → compare qty_on_hand vs. reorder_point → generate alert if below threshold |
| **Vendor fill rate scoring** | Weekly PO CSV → compute lines_received/lines_ordered per vendor → update vendor score input |
| **Customer RFM refresh** | Weekly sales CSV → compute recency/frequency/monetary → update customer segment |
| **Open PO aging flags** | Daily PO CSV → flag POs where (today - expected_date) > 0 and qty_received < qty_ordered |
| **Price drift detection** | Compare this week's item master cost vs. last week's snapshot → alert if delta > threshold |
| **New product detection** | Item master diff → new SKUs not previously seen → notify purchasing for vendor assignment |

---

## 4. WHAT MUST NEVER DIRECTLY COUPLE TO ERP INTERNALS

These patterns are explicitly prohibited in AccentOS architecture:

| Anti-Pattern | Why Prohibited |
|---|---|
| **Direct Windward DB connection** | Schema changes in Windward silently break AccentOS. No versioning contract exists. |
| **Real-time ERP webhooks** | Windward System Five does not expose webhook events. Attempting real-time sync requires brittle polling or unsupported integrations. |
| **AccentOS writing back to Windward** | Write-back creates a circular authority problem. AccentOS enrichments and overlays must not mutate ERP records. |
| **ERP schema mapped 1:1 to Supabase** | Creates a replica, not an intelligence layer. Any schema change in Windward requires AccentOS migration. |
| **Quote acceptance auto-creating Windward orders** | Premature. Manual conversion by rep is correct v1 boundary. Future automation must route through Cowork with explicit human approval. |
| **Depending on ERP UI availability for data access** | ERP downtime must not block AccentOS from reading its cached data. |

---

## 5. SUGGESTED AUTOMATION CADENCE

| Export | Frequency | Method | Priority |
|---|---|---|---|
| Inventory QOH | Nightly (end of business) | Windward report scheduler → shared folder | High |
| Purchase Orders | Nightly | Same | High |
| Item Master (pricing) | Nightly | Same | High |
| Sales History (90d) | Weekly (Monday) | Windward report → shared folder | Medium |
| Customer Master | Weekly (Monday) | Same | Medium |
| Vendor Master | On-demand | Manual export + upload | Low |
| Receiving History | Weekly or on-demand | Manual initially; schedule later | Medium |

**Preferred shared folder location:** A Cowork-monitored directory (or cloud bucket) that triggers the ingestion pipeline automatically on new file arrival.

---

## 6. FAILURE ISOLATION STRATEGY

Windward exports are the single most critical external dependency in AccentOS's data pipeline. The following strategy ensures AccentOS degrades gracefully when exports are delayed or malformed.

### 6A. Staleness Tagging
Every import run timestamps the last successful sync per dataset. AccentOS UI and alerts layer must surface a staleness indicator when cached data exceeds threshold:

| Dataset | Warn Threshold | Critical Threshold |
|---|---|---|
| Inventory QOH | 26 hours | 48 hours |
| Purchase Orders | 26 hours | 48 hours |
| Item Master / Pricing | 26 hours | 72 hours |
| Customer Master | 8 days | 14 days |
| Sales History | 8 days | 14 days |

### 6B. Import Idempotency
All Cowork ingestion flows must be idempotent — re-running the same export file must produce no duplicate data, no data loss. Upsert on natural key (SKU, PO number, customer account number) is the standard pattern.

### 6C. Partial Import Acceptance
If an export file is malformed (missing headers, encoding error, truncated), the pipeline must:
1. Log the failure with the filename, error, and timestamp
2. Retain the previous snapshot (do not overwrite with partial data)
3. Generate an alert to the ops owner

### 6D. Manual Override
When Windward exports are delayed (system maintenance, reporting error), authorized users can manually upload a CSV via AccentOS admin. The same normalization pipeline runs — no special handling for manual uploads.

### 6E. Export File Validation
Before ingestion, Cowork must validate:
- Required columns present (by alias map)
- Row count > 0
- No catastrophically large diff from previous snapshot (>50% row count change triggers a human review flag rather than auto-import)

### 6F. AccentOS Independence
AccentOS must function (read-only on cached data, alert generation, CRM, pipeline, quotes, vendor scoring) even when Windward exports stop arriving. The degradation path is "stale data + staleness warning," not "broken application."

---

## REVISION HISTORY

| Version | Date | Author | Notes |
|---|---|---|---|
| 1.0 | 2026-05-14 | Claude (architecture session) | Initial strategy — OPERATIONAL_DATA_ARCHITECTURE_V1 |
