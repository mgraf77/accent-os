# AccentOS KPI Catalog

Last updated: 2026-05-05
Sources mined: 18 (lighting industry, NAW distribution, BigCommerce ecommerce, Scaling Up, Profit First, retail traffic, construction sales, procurement, customer service, workforce, marketing attribution, B2B account management).

This catalog is the source-of-truth for every KPI tracked across AccentOS dashboards. It is consumed by `kpi-data-audit` (gap analysis), `kpi-spec` (per-role SQL generation when forged), `bc-business-review` (weekly digest), and any AccentOS module rendering a dashboard.

⚠ = requires schema addition or external integration before computable.

---

## Group F — Financial / executive (15)

| ID | KPI | Formula | Source | Cadence | Benchmark |
|---|---|---|---|---|---|
| F1 | Gross revenue | `SUM(deals × qty) WHERE completed` | `deals` | daily | trend YoY+ |
| F2 | Net revenue (post-returns) | `F1 − returns − refunds` | `deals` + returns ⚠ | weekly | — |
| F3 | Gross margin % | `(rev − COGS) / rev` | `deals` + `products.cost` ⚠ | weekly | 50–60% specialty retail |
| F4 | Net profit margin % | `(rev − COGS − OpEx) / rev` | needs `expenses` ⚠ | monthly | 20–30% min target |
| F5 | EBITDA % | `(net profit + interest + tax + D&A) / rev` | accounting ⚠ | monthly | NAW: 4% avg, 8–12% elite |
| F6 | Revenue WoW / MoM / YoY delta % | period-over-period | `deals` | weekly | — |
| F7 | Inventory turnover (annualized) | `COGS / avg inventory_value` | `inventory` + `deals` | monthly | 4–6× retail typical |
| F8 | DSO (Days Sales Outstanding) | `avg(invoice → payment days)` | needs `invoices`/`payments` ⚠ | monthly | 30–45 days B2B target |
| F9 | DPO (Days Payable Outstanding) | `avg AP days outstanding` | needs `bills` ⚠ | monthly | 30–60 days |
| F10 | DIO (Days Inventory Outstanding) | `(avg inv / COGS) × 365` | derived | monthly | 60–120 days specialty |
| F11 | Cash Conversion Cycle | `DIO + DSO − DPO` | derived | monthly | <90 days target |
| F12 | AR aging (30/60/90+) | `SUM unpaid by bucket` | invoices ⚠ | weekly | <10% over 60 |
| F13 | Forecast accuracy | `1 − abs(actual−forecast)/forecast` | `js/demand_forecast.js` | monthly | 80%+ |
| F14 | PIP ratio (Peak Internal Profitability) | profit foregone from worst customers/vendors | requires customer/vendor profitability ⚠ | quarterly | NAW: 1/3–1/2 typically lost |
| F15 | Pricing performance vs market | `avg sell price / competitor_prices` | `competitor_prices` + `deals` | monthly | within 5% +/− market |

## Group $ — Cash / Profit First (8)

| ID | KPI | Formula | Source | Cadence | TAP target |
|---|---|---|---|---|---|
| $1 | Profit allocation % | actual profit set-aside | accounting ⚠ | per-deposit | 5–20% |
| $2 | Owner's pay allocation % | actual owner-pay set-aside | accounting ⚠ | per-deposit | 10–30% |
| $3 | Tax allocation % | actual tax set-aside | accounting ⚠ | per-deposit | 15–25% |
| $4 | OpEx allocation % | actual OpEx set-aside | accounting ⚠ | per-deposit | residual |
| $5 | CAP vs TAP variance | current vs target % | calculated | monthly | <5% drift |
| $6 | Cash runway (months) | `cash on hand / monthly burn` | accounting ⚠ | weekly | 6+ months |
| $7 | Quick ratio | `(cash + AR) / current liabilities` | accounting ⚠ | monthly | ≥1.0 |
| $8 | Working capital | `current assets − current liabilities` | accounting ⚠ | monthly | positive |

## Group S — Sales (35, split by role)

### S-OS — Outside sales rep (12)

| ID | KPI | Formula | Source | Cadence |
|---|---|---|---|---|
| S-OS1 | My revenue (period) | `SUM(deals where rep_id=me, completed)` | `deals.rep_id` | daily |
| S-OS2 | Quota attainment % | `my_revenue / my_quota` | `employees.quota` ⚠ + `deals` | weekly |
| S-OS3 | Close / win rate | `won / (won + lost)` | `deals.status` | weekly |
| S-OS4 | Pipeline value | `SUM expected_value where stage non-terminal` | `deals` | daily |
| S-OS5 | Pipeline coverage | `pipeline_value / quota_remaining` | derived | weekly |
| S-OS6 | Avg deal size | `my_revenue / completed_deals` | `deals` | weekly |
| S-OS7 | Sales cycle length | `avg(created_at → completed_at)` | `deals` | monthly |
| S-OS8 | Visits / week | count visits logged | `activity_feed` ⚠ | weekly |
| S-OS9 | Quotes sent / week | `COUNT quotes` | `quotes` | weekly |
| S-OS10 | Follow-up rate | `% open opps with activity in 14d` | `activity_feed` | weekly |
| S-OS11 | New accounts opened | `COUNT new customers attributed` | `customers.created_by` ⚠ | monthly |
| S-OS12 | Avg margin per deal | `(revenue − COGS) / deal count` | `deals` + cost ⚠ | weekly |

### S-IS — Inside sales / order desk (8)

| ID | KPI | Formula | Source | Cadence |
|---|---|---|---|---|
| S-IS1 | Orders processed / day | `COUNT orders touched` | `deals.created_by` ⚠ | daily |
| S-IS2 | Quote → order conversion | `orders / quotes_sent` | `quotes` + `deals` | weekly |
| S-IS3 | Avg order value | `revenue / order count` | `deals` | weekly |
| S-IS4 | Order accuracy % | `% orders shipped without correction` | `deals` + corrections ⚠ | weekly |
| S-IS5 | Avg quote response time | `avg(request → quote_sent)` | `quotes` | daily |
| S-IS6 | Inbound call answer rate | % answered within 30s | needs phone integration ⚠ | daily |
| S-IS7 | Upsell attach rate | `% orders with cross-sell line` | `deals` line items | weekly |
| S-IS8 | Discount % vs list | `avg discount given / list price` | `deals` + `price_book` | weekly |

### S-FL — Showroom floor sales (8)

| ID | KPI | Formula | Source | Cadence |
|---|---|---|---|---|
| S-FL1 | Foot traffic | counter input | needs traffic counter ⚠ | daily |
| S-FL2 | Showroom conversion rate | `transactions / foot_traffic` | counter + `deals` | daily |
| S-FL3 | Avg dwell time | counter input | needs people-counter ⚠ | daily |
| S-FL4 | Customer-to-staff ratio | concurrent visitors / staff | counter + schedule | hourly |
| S-FL5 | AOV walk-in | `walk-in revenue / walk-in orders` | `customers.segment='walk-in'` ⚠ + `deals` | daily |
| S-FL6 | Items per transaction | `line_count / order_count` | `deals` line items | daily |
| S-FL7 | Capture rate (storefront) | `entries / passers-by` | counter (advanced) ⚠ | weekly |
| S-FL8 | Repeat walk-in rate | `% walk-ins with prior order` | `customers` + `deals` | monthly |

### S-TA — Trade Account Manager (4)

| ID | KPI | Formula | Source | Cadence |
|---|---|---|---|---|
| S-TA1 | Active trade accounts | `COUNT trade_partners with order in 90d` | `trade_partners` + `deals` | monthly |
| S-TA2 | Trade revenue contribution | `% revenue from trade segment` | `customers.segment IN trade` ⚠ | monthly |
| S-TA3 | Trade discount earned | `SUM discount × qty per account` | `deals` | monthly |
| S-TA4 | Spec-to-order conversion | `orders / specs created` | `trade_partners.specs` ⚠ | monthly |

### S-NA — National Account Manager (3)

| ID | KPI | Formula | Source | Cadence |
|---|---|---|---|---|
| S-NA1 | Net Revenue Retention | `(start ARR + expansion − churn − contraction) / start ARR` | recurring contracts ⚠ | quarterly |
| S-NA2 | Gross Renewal Rate | `% revenue retained, no expansion` | contracts ⚠ | quarterly |
| S-NA3 | Expansion attach rate | `% renewals with upsell` | contracts ⚠ | quarterly |

## Group L — Pipeline / lead health (10)

| ID | KPI | Formula | Source | Cadence |
|---|---|---|---|---|
| L1 | Lead volume (new) | `COUNT leads created` | `deals.stage='lead'` | daily |
| L2 | Lead quality score (avg) | `avg score from qualification` | requires lead scoring ⚠ | weekly |
| L3 | Lead → opportunity conversion | `qualified / total leads` | `deals.stage` history ⚠ | weekly |
| L4 | Stage-to-stage conversion | `% advancing each stage` | stage history ⚠ | weekly |
| L5 | Pipeline aging (stuck deals) | `deals same-stage > 30d` | `deals.last_stage_change` ⚠ | weekly |
| L6 | Win rate by stage | `won / entered each stage` | stage history ⚠ | monthly |
| L7 | Loss-reason distribution | `COUNT lost BY reason` | `deals.lost_reason` ⚠ | monthly |
| L8 | Avg sales cycle by segment | `avg cycle days per segment` | `deals` + segment ⚠ | monthly |
| L9 | Bid win rate (construction) | `won bids / submitted bids` | construction-segment deals ⚠ | monthly |
| L10 | Cost per lead | `marketing spend / new leads` | marketing + `deals` ⚠ | monthly |

## Group C — Customer / segment (20)

### C-Universal (8)

| ID | KPI | Formula | Source | Cadence |
|---|---|---|---|---|
| C1 | Revenue by segment | `SUM deals GROUP BY customers.segment` | `customers.segment` ⚠ | weekly |
| C2 | AOV by segment | `revenue_segment / orders_segment` | same | weekly |
| C3 | Repeat purchase rate | `% customers with ≥2 orders 12mo` | `customers` + `deals` | quarterly |
| C4 | Customer Lifetime Value | `avg revenue × avg lifespan × gross margin` | `customers` + `deals` | quarterly |
| C5 | Customer Acquisition Cost | `marketing+sales spend / new customers` | accounting + `customers` ⚠ | monthly |
| C6 | LTV:CAC ratio | `C4 / C5` | derived | quarterly |
| C7 | CAC payback period | `CAC / (avg monthly revenue × gross margin)` | derived | quarterly |
| C8 | Avg time to second order | `avg(2nd − 1st order days)` | `deals` | quarterly |

### C-W — Walk-in retail (3)

| ID | KPI | Formula | Source | Cadence |
|---|---|---|---|---|
| C-W1 | Walk-in revenue share | `walk-in rev / total rev` | `customers.segment='walk-in'` ⚠ | weekly |
| C-W2 | Walk-in conversion (foot traffic) | `transactions / foot_traffic` | counter + `deals` ⚠ | daily |
| C-W3 | Walk-in repeat rate | `% repeat customers in walk-in` | `customers` + `deals` ⚠ | quarterly |

### C-EL — Electrician/contractor (3)

| ID | KPI | Formula | Source | Cadence |
|---|---|---|---|---|
| C-EL1 | Active electrician accounts | `COUNT WHERE segment='electrician' AND last_order < 90d` | ⚠ | monthly |
| C-EL2 | Avg order frequency | `orders / unique customers / month` | derived | monthly |
| C-EL3 | Net 30 / Net 60 compliance | `% invoices paid on terms` | invoices ⚠ | monthly |

### C-NB — New home build (3)

| ID | KPI | Formula | Source | Cadence |
|---|---|---|---|---|
| C-NB1 | Project pipeline value | `SUM open project deals` | `deals.project_type='new-build'` ⚠ | weekly |
| C-NB2 | Project win rate | `won projects / submitted bids` | `deals` + bid status ⚠ | monthly |
| C-NB3 | Avg project value | `revenue / project count` | aggregated by `project_id` ⚠ | monthly |

### C-NA — National account (3)

| ID | KPI | Formula | Source | Cadence |
|---|---|---|---|---|
| C-NA1 | NRR (national accounts) | (see S-NA1) | contracts ⚠ | quarterly |
| C-NA2 | Account health score | composite usage + payment + engagement | derived ⚠ | monthly |
| C-NA3 | Multi-location coverage | `# locations served / contracted locations` | account data ⚠ | quarterly |

## Group P — Product mix (12)

| ID | KPI | Formula | Source | Cadence |
|---|---|---|---|---|
| P1 | Sales mix % by category | `category_rev / total_rev` | `products.category` + `deals` | weekly |
| P2 | Mix trend rolling 12mo | category share by month | same | monthly |
| P3 | Top-10 products by revenue | `SUM rev GROUP BY product LIMIT 10` | `deals` + `products` | weekly |
| P4 | Top-10 products by margin $ | `SUM (price−cost)×qty GROUP BY product` | + cost ⚠ | weekly |
| P5 | Top-10 products by margin % | `(rev−cost)/rev` per product | + cost ⚠ | weekly |
| P6 | Slow movers | `0 sales 90d AND inventory > 0` | `deals`+`inventory` | monthly |
| P7 | Dead stock $ value | `SUM inventory × cost WHERE 0 sales 180d` | + cost ⚠ | monthly |
| P8 | Attach rate (X with Y) | `co-occurrence / X count` | `deals` line items | monthly |
| P9 | New product velocity | `revenue in first 90d post-launch` | `products.launched_at` ⚠ | per-launch |
| P10 | Category gross margin | `(cat rev − cat COGS) / cat rev` | + cost ⚠ | weekly |
| P11 | SKU count active | `COUNT products WHERE active=true` | `products.active` ⚠ | monthly |
| P12 | Avg SKUs per customer | `unique SKUs ordered per customer` | `deals` line items + `customers` | quarterly |

**Categories:** Lighting (decorative · functional · LED · smart) · Hardware · Blinds/shades · Fans · Bulbs · Outdoor · Bath/vanity · Smart home · Replacement parts.

## Group X — Customer experience / service (12)

| ID | KPI | Formula | Source | Cadence |
|---|---|---|---|---|
| X1 | First Contact Resolution (FCR) | `% issues solved in first interaction` | service log ⚠ | weekly |
| X2 | First Response Time (FRT) | `avg(inquiry → first reply)` | service log ⚠ | daily |
| X3 | Avg Handle Time (AHT) | `avg total time per ticket` | service log ⚠ | daily |
| X4 | CSAT score | post-resolution survey avg | survey tool ⚠ | weekly |
| X5 | NPS | `% promoters − % detractors` | survey ⚠ | quarterly |
| X6 | Return rate | `returns / orders` | `deals.status='returned'` ⚠ | weekly |
| X7 | Return $ value | `SUM returned units × price` | + ⚠ | weekly |
| X8 | Warranty claim rate | `claims / units shipped 90d` | `warranty` | monthly |
| X9 | Time-to-resolution (warranty) | `avg(claim → resolved)` | `warranty` | monthly |
| X10 | Repeat-claim rate by vendor | `vendors with > N claims/90d` | `warranty` + `vendors` | monthly |
| X11 | Customer complaint rate | `complaints / orders` | service log ⚠ | weekly |
| X12 | Issue escalation rate | `% tickets escalated` | service log ⚠ | weekly |

## Group O — Operations / Warehouse / Delivery / Install (15)

### O-WH — Warehouse (8)

| ID | KPI | Formula | Source | Cadence |
|---|---|---|---|---|
| O-WH1 | Pick rate (units/hr) | `units_picked / hours_worked` | warehouse log ⚠ | daily |
| O-WH2 | Order fulfillment rate (perfect order) | `% orders shipped complete + accurate + on-time` | `deliveries` | weekly |
| O-WH3 | Inventory accuracy % | `physical count match / total SKUs` | cycle counts ⚠ | monthly |
| O-WH4 | Receiving cycle time | `avg(PO arrival → put-away)` | `purchase_orders` | weekly |
| O-WH5 | Stockout incidents | `COUNT zero-on-hand events` | `inventory` | daily |
| O-WH6 | Backorder rate | `% orders awaiting stock` | `deals.status='backorder'` ⚠ | daily |
| O-WH7 | Cycle count variance | `% SKUs with discrepancy` | cycle counts ⚠ | monthly |
| O-WH8 | Damaged/shrinkage rate | `damaged units / received units` | `inventory` events ⚠ | monthly |

### O-DL — Delivery / fleet (4)

| ID | KPI | Formula | Source | Cadence |
|---|---|---|---|---|
| O-DL1 | On-time delivery % | `% deliveries within window` | `deliveries` | weekly |
| O-DL2 | Avg delivery cost / order | `delivery cost / order count` | `deliveries.cost` ⚠ | weekly |
| O-DL3 | Delivery damage rate | `% deliveries with damage report` | `deliveries` + warranty ⚠ | monthly |
| O-DL4 | Driver utilization % | `route minutes / shift minutes` | route logs ⚠ | weekly |

### O-IN — Installation (3)

| ID | KPI | Formula | Source | Cadence |
|---|---|---|---|---|
| O-IN1 | Install completion first visit | `% installs done on first appt` | install records ⚠ | monthly |
| O-IN2 | Install callback rate | `% installs requiring revisit < 30d` | install records ⚠ | monthly |
| O-IN3 | Avg install duration vs estimate | `actual / estimated minutes` | install records ⚠ | monthly |

## Group I — Inventory + Purchasing (12)

### I-IV — Inventory (6)

| ID | KPI | Formula | Source | Cadence |
|---|---|---|---|---|
| I-IV1 | Stock-to-sales ratio | `inventory units / units sold` | `inventory` + `deals` | weekly |
| I-IV2 | Open-to-buy $ | `planned purchases − committed PO − on-hand` | derived ⚠ | monthly |
| I-IV3 | Sell-through rate | `units sold / units received` | `deals` + `purchase_orders` | weekly |
| I-IV4 | Days of supply per SKU | `on-hand / avg daily sales` | derived | weekly |
| I-IV5 | Safety stock breach count | `# SKUs below safety threshold` | `inventory.safety_stock` ⚠ | daily |
| I-IV6 | Slow-moving inventory $ | `SUM(value where 0 sales 60d)` | `inventory` + `deals` | monthly |

### I-PU — Purchasing (6)

| ID | KPI | Formula | Source | Cadence |
|---|---|---|---|---|
| I-PU1 | Procurement ROI | `cost savings / procurement spend` | accounting ⚠ | quarterly |
| I-PU2 | Emergency purchase ratio | `unplanned PO count / total PO count` | `purchase_orders.urgency` ⚠ | monthly |
| I-PU3 | Maverick spend % | `% spend outside approved suppliers` | `purchase_orders` ⚠ | quarterly |
| I-PU4 | # suppliers per category | concentration measure | `vendors` + `purchase_orders` | quarterly |
| I-PU5 | PO cycle time | `avg(PO created → received)` | `purchase_orders` | monthly |
| I-PU6 | Cost variance vs quoted | `(actual − quoted) / quoted` | `purchase_orders` | monthly |

## Group M — Marketing / digital / SEO + GMC (15)

### M-FN — Funnel (5)

| ID | KPI | Formula | Source | Cadence |
|---|---|---|---|---|
| M-FN1 | Site sessions | from GA4 | M06 ⚠ | daily |
| M-FN2 | Site conversion rate | `transactions / sessions` | GA4 + `deals` | weekly |
| M-FN3 | Cart abandonment rate | `% carts not converted` | BC + GA4 ⚠ | daily |
| M-FN4 | Avg time on product page | from GA4 | M06 ⚠ | weekly |
| M-FN5 | Bounce rate | from GA4 | M06 ⚠ | weekly |

### M-AC — Acquisition (4)

| ID | KPI | Formula | Source | Cadence |
|---|---|---|---|---|
| M-AC1 | ROAS by channel | `revenue / ad spend` | ad platforms + `deals` ⚠ | weekly |
| M-AC2 | MER (Marketing Efficiency Ratio) | `total revenue / total marketing spend` | accounting ⚠ | weekly |
| M-AC3 | CPL by channel | `spend / leads` | ad platforms + `deals` ⚠ | weekly |
| M-AC4 | Marketing-attributed revenue | multi-touch attribution | needs MTA tooling ⚠ | monthly |

### M-EM — Email/SMS (Klaviyo via M09) (3)

| ID | KPI | Formula | Source | Cadence |
|---|---|---|---|---|
| M-EM1 | Open rate | `opens / sends` | Klaviyo ⚠ | per-campaign |
| M-EM2 | Click-through rate | `clicks / sends` | Klaviyo ⚠ | per-campaign |
| M-EM3 | Revenue per send | `attributed revenue / sends` | Klaviyo ⚠ | per-campaign |

### M-SE — SEO + GMC (3)

| ID | KPI | Formula | Source | Cadence |
|---|---|---|---|---|
| M-SE1 | GMC feed eligibility % | `eligible products / total` | `marketing.feed_status` | weekly |
| M-SE2 | Organic search clicks | from Search Console | M06 ⚠ | weekly |
| M-SE3 | Avg search position | from Search Console | M06 ⚠ | weekly |

## Group V — Vendor / supplier (10)

| ID | KPI | Formula | Source | Cadence |
|---|---|---|---|---|
| V1 | Vendor composite score | uses `vendor-cascade` | `vendor_scores` | weekly |
| V2 | Top-3 concentration % | uses `vendor-risk-register` | derived | quarterly |
| V3 | On-time supplier delivery % | `% POs received on/before promise date` | `purchase_orders` | monthly |
| V4 | Supplier price drift % | `% price change YoY` | `competitor_prices` + `purchase_orders` | monthly |
| V5 | Vendor revenue contribution | `vendor revenue / total revenue` | `vendors` + `deals` | monthly |
| V6 | Vendor warranty claim rate | `claims / units shipped per vendor` | `warranty` + `vendors` | monthly |
| V7 | Vendor stockout contribution | stockout events caused by vendor lead time | `inventory` + lead time ⚠ | monthly |
| V8 | Lead time variance per vendor | `actual − promised lead days` | `purchase_orders` | monthly |
| V9 | Vendor invoice accuracy % | `% invoices matching PO` | invoices ⚠ | monthly |
| V10 | Supplier diversity % | `% spend with diverse suppliers` | `vendors.diversity_flag` ⚠ | quarterly |

## Group H — Workforce / HR (10)

| ID | KPI | Formula | Source | Cadence |
|---|---|---|---|---|
| H1 | Revenue per employee | `total revenue / FTE count` | `deals` + `employees` | monthly |
| H2 | Gross profit per employee | `(rev − COGS) / FTE` | + cost ⚠ | monthly |
| H3 | Employee turnover rate | `% leaving in period` | `employees.terminated_at` ⚠ | quarterly |
| H4 | Absence rate | `absent days / scheduled days` | timekeeping ⚠ | monthly |
| H5 | Labor utilization rate | `productive hrs / total hrs` | timekeeping ⚠ | weekly |
| H6 | Avg tenure | `avg(today − hire_date)` | `employees.hire_date` ⚠ | quarterly |
| H7 | New hire ramp time | `avg days to quota attainment` | `employees` + `deals` ⚠ | per-cohort |
| H8 | Employee NPS / eNPS | survey | survey tool ⚠ | quarterly |
| H9 | Open requisition count | unfilled headcount | HR ⚠ | weekly |
| H10 | Training hours per employee | `training_hrs / FTE` | LMS ⚠ | quarterly |

## Group MGR — Manager-specific composites (5)

| ID | KPI | Formula | Source | Cadence |
|---|---|---|---|---|
| MGR1 | Team quota attainment | `team revenue / team quota` | aggregated | weekly |
| MGR2 | Team pipeline coverage | `team pipeline / team remaining quota` | aggregated | weekly |
| MGR3 | Forecast accuracy | `1 − abs(forecast − actual)/forecast` | `js/demand_forecast.js` | monthly |
| MGR4 | Coaching candidates list | reps with close rate < team-avg − 1σ | aggregated | weekly |
| MGR5 | Activity-to-outcome ratio | `team activity / closed deals` | `activity_feed` + `deals` | monthly |

---

## Per-role dashboards (no caps)

See `kpi-spec` skill (when forged) for paste-ready SQL per role.

| Role | KPIs (by ID) |
|---|---|
| Owner / CEO | F1, F2, F3, F4, F5, F6, F7, F10, F11, F12, F13, F14, MGR1, MGR2, C1, C4, C5, C6, P1, P3, V1, V2, M-FN1, M-FN2, M-AC2, $1, $5, $6 |
| Admin / Operations | F8, F12, S-IS1, S-IS5, S-IS6, X11, O-WH2, O-WH3, O-WH4, O-WH5, O-WH6, O-WH7, O-WH8, O-DL1, O-DL2, M-SE1, I-PU2, I-PU5, V3, V8, H4, H5 |
| Sales Manager | MGR1, MGR2, MGR3, MGR4, MGR5, S-OS3, S-OS4, S-OS6, S-OS7, S-OS11, L1, L3, L4, L5, L6, L7, L8, S-NA1, S-NA2, S-NA3, C4, C5, C6, C7, H7 |
| Outside Sales Rep | S-OS1, S-OS2, S-OS3, S-OS4, S-OS5, S-OS6, S-OS7, S-OS8, S-OS9, S-OS10, S-OS11, S-OS12 |
| Inside Sales / Order Desk | S-IS1, S-IS2, S-IS3, S-IS4, S-IS5, S-IS6, S-IS7, S-IS8 |
| Showroom Floor | S-FL1, S-FL2, S-FL3, S-FL4, S-FL5, S-FL6, S-FL7, S-FL8, C-W1, C-W2, C-W3 |
| Trade Account Manager | S-TA1, S-TA2, S-TA3, S-TA4, C-EL1, C-EL2, C-EL3 |
| National Account Manager | S-NA1, S-NA2, S-NA3, C-NA1, C-NA2, C-NA3, F12 (per-account AR) |
| Customer Service | X1, X2, X3, X4, X5, X6, X7, X8, X9, X10, X11, X12 |
| Marketing Lead | M-FN1, M-FN2, M-FN3, M-FN4, M-FN5, M-AC1, M-AC2, M-AC3, M-AC4, M-EM1, M-EM2, M-EM3, M-SE1, M-SE2, M-SE3, C5, C6, C7 |
| Buyer / Purchasing | I-IV1, I-IV2, I-IV3, I-IV4, I-IV5, I-IV6, I-PU1, I-PU2, I-PU3, I-PU4, I-PU5, I-PU6, V3, V8, V10 |
| Inventory / Stock Planner | I-IV1, I-IV3, I-IV4, I-IV5, I-IV6, P6, P7, P11, F7 |
| Warehouse Lead | O-WH1, O-WH2, O-WH3, O-WH4, O-WH5, O-WH6, O-WH7, O-WH8, O-DL1 |
| Warehouse Picker | O-WH1 (mine), O-WH2 (team) |
| Delivery / Fleet | O-DL1, O-DL2, O-DL3, O-DL4 |
| Installer | O-IN1, O-IN2, O-IN3, X8, X10 |
| Bookkeeper / Accounting | F4, F5, F8, F9, F10, F11, F12, F14, $1, $5, $6, $7, $8 |
| HR / People | H1, H2, H3, H4, H5, H6, H7, H8, H9, H10 |
| Trade Partner Portal user | S-TA3 (own), S-TA4 (own), C-NB3 (own projects) |
| Vendor Rep Portal user | V1 (own vendors), V3 (own vendors), V5 (own), V6 (own), M-SE1 (own products) |
| Customer Portal user | order history, open quotes, delivery status, X8 (own warranty) |
| Designer/Specifier | S-TA4 (own), S-TA3 (own), C-NB1 (through me), C-NB3 (own projects) |

---

## Per-segment dashboards

| Segment | KPIs (by ID) |
|---|---|
| Walk-in retail | S-FL1, S-FL2, S-FL3, S-FL4, S-FL5, S-FL6, S-FL7, S-FL8, C-W1, C-W2, C-W3, C2, C3, P1 |
| Electrician / Trade contractor | C-EL1, C-EL2, C-EL3, S-TA1, S-TA2, S-TA3, S-TA4, S-IS3, P1, C2, C3, C4 |
| New Home Build | C-NB1, C-NB2, C-NB3, L9, L8, S-OS6, S-TA4, C5, F3, I-IV3 |
| National Account | C-NA1, C-NA2, C-NA3, S-NA1, S-NA2, S-NA3, F12, C2, C3, V3, X8 |
| Designer / Specifier | S-TA1, S-TA4, C-NB1, C-NB3, S-OS6, P3 |
| Online ecommerce (DIY) | M-FN1, M-FN2, M-FN3, M-FN4, M-FN5, M-AC1, M-AC2, C2, C3, C7, P1, X6 |
| Hospitality / Commercial | C2, C3, C-NB2, F3, L9, V3, X8 |
| Multifamily / Property Mgmt | C-NB1, C-NB3, C2, C3, F3, V5 |

---

## Schema gaps requiring M-tasks

26 schema additions surfaced by this catalog. Each one unblocks the listed KPIs:

| # | Schema add | Unblocks |
|---|---|---|
| 1 | `customers.segment` enum (walk-in / electrician / national / designer / new-home / hospitality / multifamily / commercial / DIY) | C1, C2, C3, all C-* segment KPIs, S-FL5, S-TA2 |
| 2 | `employees.quota` (numeric) | S-OS2, MGR1, MGR2 |
| 3 | `deals.lost_reason` enum | L7 |
| 4 | `deals_stage_history` table | L3, L4, L5, L6 |
| 5 | `deals.last_stage_change` timestamp | L5 |
| 6 | `deals.designer_id` + `deals.project_id` | T2, C-NB1, C-NB2, C-NB3 |
| 7 | `products.cost` (numeric) | F3, F4, F5, P4, P5, P10, H2, S-OS12 |
| 8 | `invoices` + `payments` tables | F8, F12, C-EL3, V9 |
| 9 | `expenses` ledger | F4, F5, $1–$8 |
| 10 | `customers.created_by` | S-OS11 |
| 11 | `inventory.safety_stock` (numeric) | I-IV5 |
| 12 | `inventory_events` (damage/shrinkage) | O-WH8 |
| 13 | `purchase_orders.urgency` enum | I-PU2 |
| 14 | `purchase_orders.approved_supplier` flag | I-PU3 |
| 15 | `service_tickets` table | X1, X2, X3, X11, X12 |
| 16 | `survey_responses` (CSAT/NPS) | X4, X5, H8 |
| 17 | `deals.status='returned'` enum + return ledger | X6, X7, F2 |
| 18 | `timekeeping` table | H4, H5 |
| 19 | `employees.terminated_at`, `employees.hire_date` | H3, H6, H7 |
| 20 | Foot-traffic counter integration | S-FL1, S-FL2, S-FL3, S-FL4, S-FL7, C-W2 |
| 21 | Phone integration / call log | S-IS6 |
| 22 | `deals.lead_score` | L2 |
| 23 | `deliveries.cost`, `deliveries.damage_flag` | O-DL2, O-DL3 |
| 24 | `installs` table | O-IN1, O-IN2, O-IN3 |
| 25 | `recurring_contracts` table | S-NA1, S-NA2, S-NA3, C-NA1, C-NA2, C-NA3 |
| 26 | `vendors.diversity_flag` | V10 |
| 27 | Cycle count records | O-WH3, O-WH7 |
| 28 | `activity_feed.type` (visit, call, email) | S-OS8, S-OS10 |
| 29 | Marketing-spend ledger by channel | M-AC1, M-AC2, M-AC3, C5, L10 |
| 30 | Quotation timing (`quotes.requested_at`) | S-IS5 |
| 31 | LMS / training records | H10 |
| 32 | HR requisitions table | H9 |

---

## Research / sources

- [American Lighting Association](https://www.americanlightingassoc.com/) — industry context
- [Lighting Store KPIs](https://startupfinancialprojection.com/blogs/kpis/lighting-store) — sales/employee, conversion benchmarks
- [NAW Distributor Benchmarks](https://www.naw.org/data-driven-distributor-transformation-the-metrics-that-matter/) — EBITDA tiers, PIP ratio
- [Phocas Distribution KPIs](https://www.phocassoftware.com/resources/blog/key-sales-kpis-for-distributors)
- [BigCommerce Ecommerce Metrics 2026](https://www.bigcommerce.com/articles/ecommerce/ecommerce-metrics/)
- [Building Materials Store KPIs](https://financialmodelslab.com/blogs/kpi-metrics/building-materials-store-kpi-metrics)
- [BuildingRadar Construction Sales KPIs](https://www.buildingradar.com/construction-blog/how-to-build-a-kpi-framework-for-measuring-construction-sales-success)
- [Pearl Collective Interior Design KPIs](https://thepearlcollective.com/kpis-interior-design-firms/)
- [ASCM Warehouse KPIs](https://www.ascm.org/ascm-insights/8-kpis-for-an-efficient-warehouse/)
- [Modula Warehouse KPIs](https://modula.us/blog/warehouse-kpi/)
- [NetSuite Procurement KPIs](https://www.netsuite.com/portal/resource/articles/erp/procurement-kpis.shtml)
- [Sievo Procurement KPIs](https://sievo.com/blog/procurement-kpis)
- [Zendesk Call Center Metrics](https://www.zendesk.com/blog/call-center-metrics-really-focus/)
- [Genesys Call Center KPIs](https://www.genesys.com/blog/post/the-definitive-list-of-29-call-center-metrics-and-kpis)
- [NetSuite Workforce Productivity Metrics](https://www.netsuite.com/portal/resource/articles/human-resources/productivity-metrics.shtml)
- [AIHR Workforce Management Metrics](https://www.aihr.com/blog/workforce-management-metrics/)
- [Saras Analytics ROAS/CAC/LTV](https://www.sarasanalytics.com/blog/roas-cac-ltv-ecommerce-kpi)
- [Cart.com Beyond ROAS](https://cart.com/blog/beyond-roas-the-new-kpis-that-actually-predict-growth)
- [Demandfarm Key Account KPIs](https://www.demandfarm.com/blog/11-key-account-management-kpi-metrics/)
- [Spinify Account Manager KPIs 2025](https://spinify.com/blog/why-account-manager-kpis-must-evolve-in-2025-responding-to-new-revenue-realities-2/)
- [Profit First (Mike Michalowicz)](https://mikemichalowicz.com/profit-first/)
- [Mercury Profit First Method](https://mercury.com/blog/how-to-use-profit-first-method)
- [Scaling Up / Rockefeller Habits](https://blog.growthinstitute.com/scale-up-blueprint/10-rockefeller-habits-checklist)
- [V-Count Retail Foot Traffic 2026 Guide](https://v-count.com/retail-people-counting-foot-traffic-analytics-2026-guide/)
- [GrowthFactor Retail Traffic](https://www.growthfactor.ai/resources/blog/retail-traffic-software-ultimate-guide)
- [Sales Manager KPIs 2026 (Prospeo)](https://prospeo.io/s/sales-manager-kpis)
- [Salesforce Sales KPIs](https://www.salesforce.com/sales/performance-management/sales-kpis/)
- [Improvado Retail KPI Guide](https://improvado.io/blog/retail-kpi)
