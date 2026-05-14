# COWORK_AUTOMATION_ARCHITECTURE.md
> AccentOS Foundational Architecture — v1.0 | 2026-05-14
>
> Defines the automation and orchestration architecture connecting Windward exports, external APIs, and the AccentOS intelligence layer. Cowork is the automation/orchestration platform in this stack.

---

## Role of Cowork in AccentOS Architecture

Cowork is the **automation nervous system** between external operational systems and AccentOS. It:

- Monitors for new export files
- Picks up, validates, and normalizes data
- Ingests normalized data into Supabase
- Triggers downstream workflows and alerts
- Handles retries and failure logging
- Routes human-in-the-loop checkpoints

Cowork does **not**:
- Own data (Supabase owns persisted data)
- Make operational decisions (AccentOS intelligence layer does)
- Interact with Windward directly (it reads files Windward produces)

---

## ARCHITECTURE OVERVIEW

```
┌──────────────────────────────────────────────────────────┐
│                   EXTERNAL SYSTEMS                        │
│  Windward (ERP) ──► CSV export ──► Shared Folder/Bucket   │
│  BigCommerce ────► API calls                              │
│  Klaviyo ────────► API calls                              │
└─────────────────────────────────┬────────────────────────┘
                                  │
                    ┌─────────────▼────────────┐
                    │      COWORK              │
                    │  (Automation Layer)      │
                    │                          │
                    │  1. Export Pickup        │
                    │  2. Validation           │
                    │  3. Normalization        │
                    │  4. Ingestion            │
                    │  5. Trigger / Alert      │
                    │  6. Retry / Failure      │
                    └─────────────┬────────────┘
                                  │
                    ┌─────────────▼────────────┐
                    │      SUPABASE            │
                    │  (AccentOS Data Store)   │
                    │  - inventory_items       │
                    │  - purchase_orders       │
                    │  - customers             │
                    │  - kpi_snapshots         │
                    │  - alerts                │
                    │  - telemetry_events      │
                    └─────────────┬────────────┘
                                  │
                    ┌─────────────▼────────────┐
                    │   ACCENTS INTELLIGENCE   │
                    │   - Dashboards           │
                    │   - Scoring engines      │
                    │   - Alert surfaces       │
                    │   - Workflow UI          │
                    └──────────────────────────┘
```

---

## 1. EXPORT PICKUP FLOW

### Trigger Sources

| Source | Trigger Method | Notes |
|---|---|---|
| Windward CSV exports | File arrival in monitored folder or cloud bucket | Cowork polls or uses filesystem watcher |
| BigCommerce | Scheduled API call (cron) | Cowork calls BC API on defined cadence |
| Klaviyo | Scheduled API call (cron) | Campaign metrics pulled weekly |
| Manual upload | AccentOS admin UI form post → Cowork endpoint | For ad-hoc or emergency imports |

### Monitored Folder Structure

```
/accents-intake/
  windward/
    inventory/         ← nightly inventory QOH export
    purchase_orders/   ← nightly PO export
    item_master/       ← nightly item master / pricing
    customers/         ← weekly customer master
    sales_history/     ← weekly sales history slice
    vendor_master/     ← on-demand vendor master
  manual/
    *.csv              ← any manual admin uploads
```

### Pickup Rules
- File must be newer than the last successfully processed file for that dataset
- File name should include a date component for ordering (e.g., `inventory_2026-05-14.csv`)
- If no date in filename, use filesystem modification time
- Files processed in ascending date order (oldest first) when multiple are pending
- Processed files are moved to `/accents-intake/processed/[dataset]/` — never deleted immediately (retain 30 days for debugging)

---

## 2. VALIDATION FLOW

Before any data is written to Supabase, every import file must pass validation:

### Validation Checklist (per dataset)

```
[ ] File is non-empty (row count > 0)
[ ] Required headers present (per dataset's alias map)
[ ] No catastrophic row count change vs. previous snapshot
    - Inventory: warn if >30% change; block if >60% change
    - POs: warn if >50% change; allow (PO count naturally varies)
    - Customers: warn if >20% change; block if >50% change
[ ] Date fields parse correctly
[ ] Numeric fields (qty, cost, price) parse correctly (handle $ symbols, commas)
[ ] Encoding is UTF-8 or detectable (handle Windows-1252 from older ERP exports)
```

### Validation Failure Handling

| Severity | Condition | Action |
|---|---|---|
| **Warning** | Row count change in warn range; non-critical parse warnings | Proceed with import; log warning; surface in next daily digest |
| **Block** | Row count change in block range; required headers missing; all rows parse-fail | Abort import; retain previous snapshot; generate `alerts` row for ops owner; log full error |
| **Encoding fallback** | File is not UTF-8 | Attempt re-decode with common Windows code pages; if successful, proceed with warning; if not, block |

---

## 3. NORMALIZATION FLOW

Normalization transforms Windward's raw export format into AccentOS's canonical schema shape.

### Header Alias Maps

Each dataset has an alias map so that minor header variations in Windward exports don't break ingestion:

**Inventory alias map (examples):**
```
sku → ["sku", "item_no", "item_number", "item_code", "part_no", "part_number"]
description → ["description", "desc", "item_desc", "product_name", "name"]
qty_on_hand → ["qty_on_hand", "qoh", "on_hand", "quantity", "qty", "stock_qty"]
cost → ["cost", "unit_cost", "avg_cost", "last_cost"]
vendor_code → ["vendor_code", "vendor_id", "vendor_no", "supplier_code"]
location → ["location", "bin", "warehouse_location", "bin_loc"]
reorder_point → ["reorder_point", "reorder_qty", "min_qty", "min_stock"]
```

**PO alias map (examples):**
```
po_number → ["po_number", "po_no", "po_#", "purchase_order_number", "order_no"]
vendor_code → ["vendor_code", "vendor_id", "vendor_no", "supplier"]
order_date → ["order_date", "date_ordered", "po_date", "created_date"]
expected_date → ["expected_date", "due_date", "expected_receipt", "eta"]
line_sku → ["line_sku", "sku", "item_no", "part_no", "item_code"]
qty_ordered → ["qty_ordered", "quantity_ordered", "qty_ord", "ordered_qty"]
qty_received → ["qty_received", "quantity_received", "qty_rec", "received_qty"]
line_cost → ["line_cost", "unit_cost", "cost", "price"]
```

### Field Transformations

| Raw Field | Transformation | Rule |
|---|---|---|
| Cost/price fields | Strip `$`, `,`; parse as float | `parseFloat(val.replace(/[$,]/g, ''))` |
| Date fields | Parse to ISO 8601 | Handle `MM/DD/YYYY`, `YYYY-MM-DD`, `M/D/YY` |
| Quantity fields | Strip commas; parse as int or float | `parseInt/parseFloat` after comma strip |
| Boolean-like fields | Map `Y/N`, `Yes/No`, `1/0`, `TRUE/FALSE` → boolean | Case-insensitive match |
| Vendor code | Trim whitespace; uppercase | Consistent matching against AccentOS vendor records |
| SKU | Trim whitespace; preserve case (some vendors use case-sensitive SKUs) | |

### Natural Key Mapping

Each dataset maps to a natural key for upsert:

| Dataset | Natural Key | Notes |
|---|---|---|
| inventory_items | `sku` | Unique per item; Windward item_no |
| purchase_orders | `po_number` | |
| po_lines | `(po_number, line_sku)` | Composite — vendor + SKU not sufficient if one PO has two lines for same SKU |
| customers | `account_number` OR `name` (fallback) | Prefer account_number; fall back to case-insensitive name match |
| vendor_master | `vendor_code` | |

---

## 4. INGESTION FLOW

Normalized data is written to Supabase via REST API (PostgREST).

### Write Pattern: Upsert on Natural Key

```
POST /rest/v1/[table]?on_conflict=[natural_key_columns]
Prefer: resolution=merge-duplicates
```

- **Source-mirror columns** are overwritten on conflict.
- **AccentOS overlay columns** (segment, rep_notes, velocity_class, tier_override, vendor scores) are **never included in the upsert payload** — they are protected.

### Batch Size
- Upsert in batches of 500 rows (PostgREST default limit awareness)
- Log batch count + total rows at INFO level

### Post-Ingestion Metadata
After a successful import, write a sync_log record:

```
sync_log row:
  dataset: "inventory"
  synced_at: [timestamp]
  rows_processed: N
  rows_upserted: N
  rows_skipped: N (parse failures within acceptable threshold)
  source_file: "inventory_2026-05-14.csv"
  status: "success" | "partial" | "failed"
```

This `sync_log` table drives staleness warnings in the AccentOS UI.

---

## 5. TRIGGER / ORCHESTRATION FLOW

After successful ingestion, Cowork fires downstream triggers:

### Trigger Map

| Completed Ingestion | Downstream Trigger |
|---|---|
| Inventory snapshot | Evaluate reorder alerts → write to `alerts` table for items below reorder_point |
| PO snapshot | Compute vendor fill rates → write fill_rate values to vendor score input fields; flag open POs past expected date |
| Item master / pricing | Detect cost changes > configured threshold → write price drift `alerts` |
| Customer master | Re-derive customer segments for accounts with updated last_invoice_date → update `customers.segment` |
| Sales history slice | Recompute RFM scores for all customers → update `customers.rfm_score`, `customers.segment` |
| BC KPI pull | Append KPI snapshot rows → trigger anomaly check (GMV drop > X%) → write alert if triggered |

### Trigger Execution Rules
- Triggers are **post-ingestion** only — never run on failed or partial imports
- Triggers must be idempotent — rerunning does not duplicate alerts or corrupt scores
- Alert writes use on_conflict on (type, reference_id, date) to avoid duplicate alerts for the same condition

---

## 6. RETRY / FAILURE HANDLING

### Retry Policy

| Failure Type | Retry? | Max Attempts | Backoff |
|---|---|---|---|
| Network timeout (API call to Supabase or BC/Klaviyo) | Yes | 4 | Exponential: 2s, 4s, 8s, 16s |
| Supabase 5xx error | Yes | 4 | Same |
| Supabase 4xx (auth, schema mismatch) | No | 1 | None — requires human investigation |
| File validation failure (block-level) | No | 1 | None — retain last snapshot, alert ops |
| Trigger computation error | Yes | 3 | 5s flat |

### Failure Escalation

All non-retried failures and retry-exhausted failures must:
1. Write a `sync_log` row with `status: "failed"` and error details
2. Write an `alerts` row targeting the ops owner role
3. Leave the previous snapshot intact (no partial overwrite)
4. Not block other datasets — inventory failure does not stop PO ingestion

### Dead Letter Behavior
Files that cause block-level validation failures are moved to `/accents-intake/dead_letter/[dataset]/` with an error sidecar file `[filename].error.json` containing the validation output.

---

## 7. HUMAN-IN-THE-LOOP CHECKPOINTS

Automation handles the routine. These conditions route to a human:

| Condition | Routed To | Via |
|---|---|---|
| Import row count change > block threshold | Ops / Admin | Alert in AccentOS dashboard |
| Cost change > 20% on any SKU | Purchasing | Alert with old vs. new cost |
| New SKUs detected in item master | Purchasing | Alert listing new SKUs for vendor assignment |
| Vendor fill rate drops below 70% | Purchasing | Alert |
| PO open > 2× expected lead time | Purchasing | Alert |
| Sync failure persists > 2 missed cycles | Admin / Technical | High-priority alert |
| Catastrophic row count delta (>60% change) | Admin / Technical | Blocks import; requires manual approval to proceed |
| Any write-back candidate action | Relevant owner | Queue for explicit human confirmation before execution |

### Human Approval Queue
Future: AccentOS admin panel should have a "Pending Approvals" queue for automation actions that require human sign-off before execution. This is a placeholder for when Cowork automation matures to include write-back flows (e.g., auto-generating POs, auto-updating customer segments in BC).

---

## 8. AUDITABILITY REQUIREMENTS

Every automated action must be traceable. Minimum audit trail:

| Event | What to Log |
|---|---|
| File pickup | filename, dataset, file_modified_at, pickup_at |
| Validation result | pass/fail, row_count, any_warnings, blocked_reason |
| Normalization stats | rows_parsed, rows_failed, alias_map_used |
| Ingestion result | rows_upserted, rows_skipped, supabase_response_code |
| Trigger execution | trigger_name, records_evaluated, alerts_generated, scores_updated |
| Retry attempts | attempt_number, error, backoff_ms |
| Failure escalation | failure_type, alert_id_generated, timestamp |

Logs are written to:
- Cowork's native execution log (runtime tracing)
- AccentOS `sync_log` table (for UI-visible staleness and health)
- AccentOS `telemetry_events` table for high-level event types (import_complete, import_failed, alert_generated)

Log retention: Cowork runtime logs → 90 days. Supabase `sync_log` → 1 year. `telemetry_events` → 90 days active, archive older.

---

## 9. CONFIGURATION AND EXTENSIBILITY

### Adding a New Dataset

To add a new Windward export to the pipeline, define:

1. **Alias map** — header variants to canonical column names
2. **Natural key** — the upsert conflict target
3. **Protected columns** — AccentOS overlay fields that must not be overwritten
4. **Validation rules** — required headers, row count thresholds
5. **Post-ingestion trigger** — what downstream computation to run
6. **Staleness tier** — Tier 1 / Tier 2 / Tier 3 (per THIN_CACHE_RULES.md)
7. **Source folder** — intake subfolder path

This config should be declarative (JSON or YAML) and not require code changes to the core pipeline for routine additions.

---

## REVISION HISTORY

| Version | Date | Author | Notes |
|---|---|---|---|
| 1.0 | 2026-05-14 | Claude (architecture session) | Initial architecture — OPERATIONAL_DATA_ARCHITECTURE_V1 |
