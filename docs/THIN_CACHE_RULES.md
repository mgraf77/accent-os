# THIN_CACHE_RULES.md
> AccentOS Foundational Architecture — v1.0 | 2026-05-14
>
> Defines what AccentOS caches, how long it holds data, and the principles that prevent AccentOS from becoming an unintentional data replica.

---

## The Core Tension

AccentOS needs operational data to be useful. But caching everything creates three failure modes:

1. **Replica drift** — AccentOS's copy diverges from the source of truth, and decisions are made on bad data.
2. **Architectural bloat** — AccentOS becomes responsible for maintaining a full copy of Windward, BigCommerce, and every other system, which is not its job.
3. **Sync debt** — Every cached field is a sync obligation. The more fields cached, the more complex and fragile the pipeline becomes.

The thin-cache philosophy resolves this tension: **cache the minimum necessary to support the intelligence AccentOS adds, and nothing more.**

---

## RULE 1 — Cache only what AccentOS enriches or computes against

If AccentOS does not add value to a field (scoring it, alerting on it, computing from it, displaying it in a workflow), that field has no business being in Supabase.

**Allowed:**
- `inventory_items.qty_on_hand` — AccentOS computes reorder alerts from this
- `inventory_items.cost` — AccentOS computes margin from this in quotes
- `purchase_orders.qty_ordered` / `qty_received` — AccentOS computes vendor fill rate from these
- `customers.last_invoice_date` — AccentOS computes RFM recency from this

**Not Allowed:**
- Full Windward invoice line history (no AccentOS computation requires this level)
- Customer billing address, credit terms, AR balance (Windward is authoritative; AccentOS doesn't need these for intelligence)
- Product images, spec sheets, full rich content (Data52/BC-authoritative; AccentOS has no use for them)
- Full ecommerce order history beyond aggregated metrics

---

## RULE 2 — Enrichment fields belong to AccentOS; source fields belong to the source

AccentOS's Supabase tables have two distinct column categories:

| Column Category | Owned By | Examples |
|---|---|---|
| **Source mirror** | External system — overwritten on each import | `inventory_items.qty_on_hand`, `customers.last_invoice_date`, `po_lines.qty_received` |
| **AccentOS overlay** | AccentOS — never overwritten by import | `customers.segment`, `customers.rep_notes`, `vendor_scores.*`, `inventory_items.velocity_class` |

Import pipelines must **never** overwrite AccentOS overlay fields. Import operations are append/upsert on source-mirror columns only.

---

## RULE 3 — Cache expiration philosophy

AccentOS cached data has three freshness tiers:

### Tier 1 — Operational (expires in 24–48 hours)
Data used to make time-sensitive decisions. Stale data here can cause wrong alerts or wrong quotes.

| Dataset | Max Age Before Warning | Max Age Before Alert |
|---|---|---|
| Inventory QOH | 26 hours | 48 hours |
| PO open/received status | 26 hours | 48 hours |
| Item cost / pricing | 26 hours | 72 hours |

**Behavior when expired:** AccentOS continues serving cached data but displays a staleness indicator in affected UI components. Alert engine uses staleness metadata to suppress false alerts where possible (e.g., don't fire a reorder alert based on 4-day-old inventory snapshot).

### Tier 2 — Analytical (expires in 7–14 days)
Data used for trend analysis, scoring, and reporting. One-week lag is tolerable.

| Dataset | Max Age Before Warning | Max Age Before Alert |
|---|---|---|
| Customer master (name, segments) | 8 days | 14 days |
| Sales history slice (for RFM) | 8 days | 14 days |
| Ecommerce KPI snapshots | 8 days | 14 days |
| Marketing campaign metrics | 8 days | 21 days |

**Behavior when expired:** Staleness badge on dashboard tiles; no automatic workflow suppression (analytical data doesn't drive real-time decisions).

### Tier 3 — Reference (expires on significant change)
Data that rarely changes and is used for lookup only.

| Dataset | Expiration Trigger |
|---|---|
| Vendor master (name, code, contact) | On-demand refresh |
| Product descriptions / categories | On-demand refresh or when new SKUs detected |
| Employee roster | On-demand refresh |

**Behavior when expired:** No automatic warning. Manual admin refresh.

---

## RULE 4 — Snapshot strategy

When AccentOS stores operational data from an external source, it stores a **point-in-time snapshot**, not a live mirror.

**What this means in practice:**
- The `inventory_items` table reflects the state of Windward inventory as of the last successful export, not right now.
- AccentOS UI components that display inventory data should show the snapshot timestamp alongside the quantity.
- Reports generated from AccentOS data should include "Data as of [timestamp]" notation.
- AccentOS does not attempt to maintain continuous synchronization with any external system.

**Snapshot retention:**
- For operational data (inventory, POs): retain the current snapshot only. No historical row-per-snapshot unless explicitly needed for trend analysis.
- For analytical snapshots (KPI snapshots, ecommerce metrics): append-only, per the observation-log pattern already in use. These are the time series.
- For vendor score inputs (fill rates, lead times): append-only, per `vendor_changelog` pattern.

---

## RULE 5 — Enrichment-only principle

AccentOS enrichments are additive layers that do not exist in the source system. They are always computed from, but never inserted back into, the source.

**Examples of valid enrichments:**
- Vendor tier (computed from vendor score — not in Windward)
- Customer RFM segment (computed from purchase history — not in Windward or BC)
- Deal probability score (computed from pipeline signals — AccentOS-native)
- Inventory velocity class (fast/medium/slow mover — derived from sales rate)
- Reorder urgency flag (derived from QOH vs. reorder point)
- Competitor price gap (computed from competitor_prices observations)

**Enrichments are AccentOS-native and never flow back to the source system.**
- Windward does not receive AccentOS vendor tier data.
- BC does not receive AccentOS customer segment data.
- The enrichments exist solely to power AccentOS intelligence surfaces.

---

## RULE 6 — Anti-duplication rules

These explicit prohibitions protect against the "unintentional replica" failure mode:

| Prohibited Pattern | Rationale |
|---|---|
| Caching full invoice history | Windward is the AR system. AccentOS only needs summary metrics (last_invoice_date, ytd_purchases) for RFM. |
| Caching full ecommerce order detail | BigCommerce owns this. AccentOS needs GMV, AOV, conversion rate — not line-by-line order records. |
| Caching full Klaviyo contact list | Klaviyo is the email CRM. AccentOS needs campaign metrics, not subscriber records. |
| Replicating Windward's item master in full | AccentOS needs cost + description for in-stock items only. Full catalog (including inactive/discontinued) is Data52's domain. |
| Storing customer credit terms, AR balance, or payment history | This is Windward's financial domain. AccentOS has no workflow that requires it. |
| Creating a parallel receiving/fulfillment workflow | PO receipt tracking belongs in Windward. AccentOS reads receipt status for fill rate calculation only. |
| Duplicating BigCommerce product inventory sync | BC ↔ Windward inventory sync is an existing integration concern. AccentOS should not insert itself into that sync loop. |

---

## RULE 7 — When a new cache candidate appears

Use this checklist before caching any new data from an external system:

```
[ ] Does AccentOS compute something from this field? (score, alert, metric)
[ ] Does AccentOS display this field in a workflow decision surface?
[ ] Is the source system unable to serve this data at the time of need?
[ ] Is the cache expiration acceptable for the use case?
[ ] Is the import pipeline idempotent on this field?
[ ] Does importing this field risk overwriting AccentOS-native overlay data?
[ ] Is this the minimum field set (not a "while we're at it" expansion)?
```

If any question cannot be answered "yes" or "confirmed safe," do not cache the field. Add it later when the use case is clear.

---

## RULE 8 — Cache size awareness

AccentOS's Supabase tier has row and storage constraints. As a baseline:

- `inventory_items`: expected ~2K–10K active SKUs. Manageable at any tier.
- `purchase_orders` + `po_lines`: expected ~5K–50K rows/year. Manageable. Archive/prune after 2 years.
- `customers`: expected ~1K–5K active accounts. Manageable.
- `kpi_snapshots`: append-only daily — ~365 rows/year/metric × N metrics. Monitor over time.
- `competitor_prices`: append-only observations — prune to trailing 24 months.
- `telemetry_events`: append-only — prune to trailing 90 days actively; archive older.

**Rule:** Any append-only table must have a defined pruning/archival strategy before being shipped.

---

## SUMMARY: Safe to Cache vs. Must Stay External

| SAFE TO CACHE | MUST STAY EXTERNAL |
|---|---|
| inventory QOH + cost (snapshot) | Full invoice/transaction history |
| PO header + lines (snapshot) | Customer credit terms, AR balance |
| Customer name + summary metrics | Full order line detail (ecommerce) |
| Vendor name + code (reference) | Klaviyo subscriber/contact list |
| Item master for in-stock SKUs (partial) | Full catalog including discontinued items |
| KPI metric aggregates (time series) | Real-time ecommerce session data |
| Marketing campaign metadata + summary metrics | Email deliverability / send logs |
| AccentOS-native enrichments (all) | Windward financial reporting |

---

## REVISION HISTORY

| Version | Date | Author | Notes |
|---|---|---|---|
| 1.0 | 2026-05-14 | Claude (architecture session) | Initial rules — OPERATIONAL_DATA_ARCHITECTURE_V1 |
