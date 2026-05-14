# OPERATIONAL_SIGNAL_TAXONOMY.md
> AccentOS operational signal classification — v1
> Companion docs: SIGNAL_SEVERITY_MODEL · OPERATIONAL_DELTA_MODEL · SIGNAL_GENERATION_ARCHITECTURE · COMMAND_SURFACE_PRIORITIZATION · SIGNAL_TO_ACTION_FRAMEWORK

## Purpose

AccentOS is not an ERP, not a dashboard farm, not a warehouse. It is the **operational nervous system** sitting above:

- **Windward** — ERP operational truth (inventory, POs, customers, transactions)
- **BigCommerce** — ecommerce/storefront truth (orders, sessions, conversion)
- **Data52 / Lights America** — product/catalog truth (SKUs, attributes, media)

AccentOS reads from these authorities (thin cache, export-first), enriches, correlates, and emits **signals** — discrete, actionable, durable observations that something operationally meaningful has happened or is drifting.

A signal is **not**:
- a row in a database
- a chart
- a metric
- a report
- a webhook payload

A signal **is**:
- a typed, severity-rated, owner-routed, action-recommending event that survives a shift change

## Signal anatomy

Every signal MUST define the following fields. Anything missing means the signal is half-built and will not be implemented.

| Field | Description |
|---|---|
| `signal_name` | Snake_case, stable identifier. Never renamed once shipped. |
| `category` | One of the 13 categories below. |
| `severity` | informational / warning / elevated / critical / emergency (see SIGNAL_SEVERITY_MODEL.md) |
| `trigger_condition` | Deterministic predicate or delta condition. SQL-expressible. |
| `operational_meaning` | One sentence: what this signal tells a human operator. |
| `escalation_priority` | P4–P0 (see severity model) |
| `cadence` | event / minutely / hourly / daily / weekly / on-demand |
| `owner_role` | purchasing / sales / ecommerce / warehouse / owner / marketing / sysops |
| `source_system` | windward / bigcommerce / data52 / klaviyo / internal / derived |
| `stale_tolerance` | how old data may be before signal is suppressed as unreliable |
| `recommended_action` | concrete next step (see SIGNAL_TO_ACTION_FRAMEWORK.md) |

## The 13 signal categories

### 1. Inventory
Stock posture, aging, coverage, stockouts, dead stock, location imbalance.

| Signal | Severity | Trigger | Owner | Source | Cadence | Recommended action |
|---|---|---|---|---|---|---|
| `inv.stockout_active` | critical | on_hand=0 AND demand_30d>0 | purchasing | windward | hourly | Expedite PO or substitute |
| `inv.stockout_imminent` | elevated | days_of_cover < lead_time | purchasing | derived | daily | Issue PO today |
| `inv.dead_stock_aging` | warning | no_sale_180d AND on_hand_value>$threshold | owner | derived | weekly | Markdown / liquidate |
| `inv.overstock_velocity_drop` | warning | DOH > 2× rolling_DOH | purchasing | derived | daily | Pause replenishment |
| `inv.location_imbalance` | informational | branch_A_stockout AND branch_B_overstock(SKU) | warehouse | windward | daily | Branch transfer |
| `inv.cycle_count_variance` | elevated | abs(system_qty - counted_qty) / system_qty > 5% | warehouse | windward | event | Investigate shrink |
| `inv.negative_on_hand` | critical | on_hand < 0 | warehouse | windward | hourly | Reconcile immediately |

### 2. Purchasing
PO lifecycle, vendor commitment, receiving variance, late POs.

| Signal | Severity | Trigger | Owner | Source | Cadence |
|---|---|---|---|---|---|
| `po.late_acknowledgment` | warning | PO sent >48h, no vendor ack | purchasing | windward | daily |
| `po.late_delivery` | elevated | promised_date passed, not received | purchasing | windward | daily |
| `po.receiving_variance` | elevated | received_qty != ordered_qty (>2%) | purchasing | windward | event |
| `po.price_variance_at_receipt` | warning | invoice_unit_cost > po_unit_cost × 1.05 | purchasing | windward | event |
| `po.partial_shipment_chronic` | warning | vendor partial_rate_90d > 30% | purchasing | derived | weekly |
| `po.open_po_aging` | informational | open_po_age > 60d AND no movement | purchasing | windward | weekly |

### 3. Vendor health
Aggregate vendor performance. Heavily delta-driven (see OPERATIONAL_DELTA_MODEL.md).

| Signal | Severity | Trigger | Owner | Cadence |
|---|---|---|---|---|
| `vendor.score_deteriorating` | elevated | rolling_30d score drop > 10 pts | purchasing | weekly |
| `vendor.fill_rate_decline` | warning | fill_rate_30d < fill_rate_90d × 0.9 | purchasing | weekly |
| `vendor.lead_time_drift` | warning | avg_lead_time_30d > baseline × 1.25 | purchasing | weekly |
| `vendor.freight_creep` | elevated | freight_pct_revenue rising 3 weeks consecutive | purchasing | weekly |
| `vendor.single_source_risk` | informational | SKU has 1 active vendor AND velocity > threshold | purchasing | monthly |
| `vendor.unresponsive` | warning | no PO ack or shipment update in 14d | purchasing | weekly |

### 4. Ecommerce
BigCommerce storefront, conversion, cart, checkout, catalog exposure.

| Signal | Severity | Trigger | Owner | Source | Cadence |
|---|---|---|---|---|---|
| `ecom.conversion_drop` | elevated | conv_rate_7d < conv_rate_30d × 0.8 | ecommerce | bigcommerce | daily |
| `ecom.checkout_error_spike` | critical | checkout_error_rate_1h > 2% | ecommerce | bigcommerce | hourly |
| `ecom.cart_abandon_spike` | warning | abandon_rate_24h > rolling_baseline × 1.2 | ecommerce | bigcommerce | daily |
| `ecom.zero_sessions` | critical | sessions_1h = 0 during business hours | ecommerce | bigcommerce | hourly |
| `ecom.product_404` | warning | published_sku 404s on PDP | ecommerce | derived | hourly |
| `ecom.search_zero_results` | informational | search_term_zero_results_count > 5/day | marketing | bigcommerce | daily |
| `ecom.high_traffic_low_conv_sku` | informational | views > p90 AND conv < p10 (SKU) | marketing | derived | weekly |

### 5. Customer activity
Reorder patterns, dormancy, anomalous activity.

| Signal | Severity | Trigger | Owner | Cadence |
|---|---|---|---|---|
| `cust.dormant_high_value` | warning | top_decile_customer, no_order_90d | sales | weekly |
| `cust.reorder_due` | informational | predicted_reorder_window AND no recent order | sales | daily |
| `cust.spend_drop` | warning | spend_30d < spend_90d_avg × 0.6 | sales | weekly |
| `cust.new_high_value` | informational | first_order > $threshold | sales | event |
| `cust.churn_risk` | elevated | composite churn score crosses threshold | sales | weekly |

### 6. Pricing
Margin floor, cost vs. price, MAP, competitor pricing if available.

| Signal | Severity | Trigger | Owner | Cadence |
|---|---|---|---|---|
| `price.below_floor` | critical | sell_price < cost × min_margin | owner | event |
| `price.cost_increase_unpassed` | elevated | vendor_cost_up >5%, sell_price unchanged 14d | purchasing | weekly |
| `price.map_violation` | warning | site_price < MAP | ecommerce | daily |
| `price.no_price` | warning | active_sku has no sell_price | ecommerce | daily |
| `price.discount_drift` | informational | avg_discount_30d rising | owner | weekly |

### 7. Quote workflow
Quote lifecycle velocity (heavy delta focus).

| Signal | Severity | Trigger | Owner | Cadence |
|---|---|---|---|---|
| `quote.stale_open` | warning | quote open >14d, no activity | sales | daily |
| `quote.velocity_slowing` | elevated | avg_time_to_close_30d > baseline × 1.3 | sales | weekly |
| `quote.win_rate_drop` | elevated | win_rate_30d < win_rate_90d × 0.85 | owner | weekly |
| `quote.high_value_pending` | informational | quote_value > $threshold AND age > 3d | sales | daily |
| `quote.followup_overdue` | warning | scheduled_followup_date passed | sales | daily |

### 8. Operational friction
Manual rework, override frequency, retries, exceptions.

| Signal | Severity | Trigger | Owner | Cadence |
|---|---|---|---|---|
| `friction.manual_override_spike` | warning | manual_overrides_24h > baseline × 1.5 | owner | daily |
| `friction.retry_loop` | elevated | same job retried >5× within 1h | sysops | event |
| `friction.exception_queue_aging` | warning | open_exception age > 48h | sysops | daily |
| `friction.duplicate_record_creation` | informational | duplicate_customer_or_sku detected | sales | daily |

### 9. Employee activity
Workload distribution, productivity anomalies — **observational not surveillance**.

| Signal | Severity | Trigger | Owner | Cadence |
|---|---|---|---|---|
| `emp.queue_concentration` | informational | >50% of open work assigned to 1 user | owner | daily |
| `emp.activity_drop_signal` | informational | active user's activity_7d < activity_30d × 0.5 | owner | weekly |
| `emp.afterhours_activity` | informational | sustained activity outside scheduled hours | owner | weekly |

### 10. Marketing
Klaviyo flows, campaign performance, list health.

| Signal | Severity | Trigger | Owner | Source | Cadence |
|---|---|---|---|---|---|
| `mkt.flow_paused` | warning | active flow stopped firing >24h | marketing | klaviyo | daily |
| `mkt.unsub_spike` | elevated | unsub_rate_24h > baseline × 2 | marketing | klaviyo | daily |
| `mkt.deliverability_drop` | elevated | delivery_rate_7d < 95% | marketing | klaviyo | daily |
| `mkt.campaign_underperform` | informational | open_rate < segment_baseline × 0.7 | marketing | klaviyo | event |
| `mkt.list_growth_stall` | informational | net_new_subscribers_30d ≤ 0 | marketing | klaviyo | weekly |

### 11. Runtime / system health
Job runners, exports, cache freshness, integration heartbeats.

| Signal | Severity | Trigger | Owner | Cadence |
|---|---|---|---|---|
| `sys.export_missed` | critical | scheduled export missed window by >30m | sysops | event |
| `sys.cache_stale` | elevated | cache_age > stale_tolerance for source | sysops | hourly |
| `sys.integration_down` | critical | source heartbeat missed >2 cycles | sysops | event |
| `sys.job_failure_spike` | elevated | failed_jobs_1h > baseline × 2 | sysops | hourly |
| `sys.disk_or_quota` | warning | storage/api_quota >85% | sysops | hourly |
| `sys.cloudflare_error_spike` | elevated | worker error rate >1% | sysops | hourly |

### 12. Margin / profitability
Composite of pricing + freight + vendor cost.

| Signal | Severity | Trigger | Owner | Cadence |
|---|---|---|---|---|
| `margin.gross_margin_drop` | elevated | GM_30d < GM_90d × 0.95 | owner | weekly |
| `margin.freight_outpacing_revenue` | elevated | freight_growth_rate > revenue_growth_rate (4 wk) | owner | weekly |
| `margin.high_volume_low_margin_sku` | informational | top_velocity_decile AND margin < threshold | owner | monthly |
| `margin.return_rate_eroding_margin` | warning | return_rate × avg_margin > threshold per SKU | owner | weekly |

### 13. Fulfillment / logistics
Pick/pack, ship lead time, backorder posture, carrier issues.

| Signal | Severity | Trigger | Owner | Cadence |
|---|---|---|---|---|
| `ship.backorder_increasing` | elevated | open_backorder_count rising 5 days | warehouse | daily |
| `ship.fulfillment_sla_breach` | elevated | order_age_unshipped > SLA | warehouse | hourly |
| `ship.carrier_delay_pattern` | warning | carrier on-time_30d < 90% | warehouse | weekly |
| `ship.pick_error_spike` | warning | pick_errors_24h > baseline × 1.5 | warehouse | daily |
| `ship.shipment_exception` | elevated | tracking shows exception/return-to-sender | warehouse | event |

## Cross-cutting principles

1. **Every signal must have an owner role.** Ownerless signals are noise.
2. **Every signal must recommend an action.** If no action exists, it is a metric, not a signal.
3. **Signals are immutable once emitted.** Updates are new signals (e.g. `signal.resolved`).
4. **Stale tolerance is mandatory.** A signal computed off stale data is worse than no signal.
5. **No signal fires without trigger determinism.** "Looks weird" is not a trigger.
6. **Deltas, not levels, drive most elevated/critical signals** (see OPERATIONAL_DELTA_MODEL.md).
7. **The taxonomy is a contract.** Renaming a signal = breaking change.

## Phase 1 implementation scope (recommended)

The taxonomy is large by design — the implementation is not. Phase 1 should cover only the highest-leverage 12–15 signals. See the Clean Pause section in the parent ticket for the recommended Phase 1 set.
