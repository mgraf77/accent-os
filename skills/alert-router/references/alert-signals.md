# Alert signals — the 9 types
> Single source of truth for the 9 signal types emitted by `js/alerts.js` (Track 6.8, AccentOS v6.10.21). Confirmed against production code lines 101–249. Any new signal type added to the generator must also be added here AND to `routing-table.md` in the same commit, otherwise it routes to the Owner catch-all on next run.

## Contract

Each row in the AccentOS `alerts` table (Supabase `hsyjcrrazrzqngwkqsqa`, M02 schema line 288) carries a `type` field that must be one of the 9 below. The generator dedupes via `(type, source_id)` where `source_id` lives in `payload->>'source_id'`.

## The 9 signal types (confirmed from js/alerts.js)

| # | type | Generator condition (from `js/alerts.js`) | source_id | Default severity |
|---|------|-------------------------------------------|-----------|------------------|
| 1 | `deal_stale` | `pipeline_deals` no update ≥14d AND amount ≥$2,000 | `deal_id` | `warn` (≥30d → `urgent`) |
| 2 | `coop_deadline` | `coop_tracker` deadline within 14 days, not yet claimed | `coop_id` (or `vendor_id` fallback) | `warn` (≤7d → `urgent`) |
| 3 | `quote_cold` | `quotes` no activity >21 days AND total ≥$500 | `quote_id` | `warn` |
| 4 | `inventory_low` | `inventory.available_qty` below `reorder_point` | `sku` | `warn` (qty=0 → `urgent`) |
| 5 | `delivery_overdue` | `deliveries` past scheduled date AND status ≠ `done` | `delivery_id` | `urgent` |
| 6 | `warranty_expiring` | `warranty_records` expiry ≤30d AND status `open` | `warranty_id` | `warn` (≤7d → `urgent`) |
| 7 | `showroom_expiring` | `showroom_displays` expiring ≤14d | `display_id` | `info` (≤7d → `warn`) |
| 8 | `po_overdue` | `purchase_orders` past `expected_date` AND not received | `po_id` | `warn` (≥14d → `urgent`) |
| 9 | `score_dropped` | `vendor_score_states` ≥3 points down in last 7d (CHANGELOG diff) | `vendor_id` | `warn` (Δ ≤ -5 → `urgent`) |

## Severity ladder

`info` → `warn` → `urgent`. Routing escalation never downgrades — when the same `(type, source_id)` re-fires within 24h at higher severity, the surviving row inherits the higher level.

## Status states (from M02 schema)

`unread` (default on insert) → `read` → `actioned` (Michael clicked Done) | `dismissed`. The router skips `actioned` and `dismissed`.

## Adding a 10th+ signal type

When `js/alerts.js` adds a new generator:

1. Append a row to the table above (number, type, condition, source_id, default severity)
2. Append a row to `routing-table.md` (owner_role, suggested_skill, urgency_tier, dedup_key template, suggested_action)
3. Both edits go in the same commit. Until both land, the new type routes to the Owner catch-all bucket and flags as `unknown_signal` in the routing report.
