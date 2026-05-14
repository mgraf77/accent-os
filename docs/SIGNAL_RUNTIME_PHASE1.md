# Signal Runtime — Phase 1 Implementation Notes

Scaffolding for the operational nervous system described in:

- `OPERATIONAL_SIGNAL_TAXONOMY.md`
- `SIGNAL_SEVERITY_MODEL.md`
- `OPERATIONAL_DELTA_MODEL.md`
- `SIGNAL_GENERATION_ARCHITECTURE.md`
- `COMMAND_SURFACE_PRIORITIZATION.md`
- `SIGNAL_TO_ACTION_FRAMEWORK.md`

This is **scaffolding**, not a final system. Additive only. No invasive rewrites.

## Files

| File | Role |
|---|---|
| `sql/M49_signals_schema.sql` | `signals`, `signal_baselines`, `signal_audit` tables + RLS |
| `js/signal_runtime.js` | Primitives: registry, severity, cooldown, dedupe, stale, delta helpers |
| `js/signal_engine.js` | Lifecycle: emit → dedupe → cooldown → persist → ack/dismiss/resolve |
| `js/signal_rules_phase1.js` | Phase 1 rule implementations + registry seeding |
| `js/signal_feed.js` | Operator-facing feed (full + mobile 5-card) |
| `js/signal_command_surface.js` | Vendor rail, exec summary, clusters, pulse bars, mobile feed |
| `mobile-ops.html` | Standalone touch-first mobile operations page |
| `index.html` | Script includes (additive) + one-line `injectVendorRail` hook in `renderVendors` |

## Wire-up

The runtime is **opt-in**. Existing modules are unchanged. To use it:

1. Apply `M49_signals_schema.sql` to Supabase.
2. The four scripts load on every page (additive, no behavior change unless invoked).
3. Add a mount point anywhere in the app to surface the feed:
   ```html
   <div id="signalFeedMini"></div>   <!-- 5-card mobile-style -->
   <div id="signalFeedMount"></div>  <!-- full feed -->
   ```
4. Drive evaluation from existing hydrate flows (or a cron):
   ```js
   await SignalEngine.hydrate();
   await SignalRulesPhase1.runScheduled('hourly');
   await SignalRulesPhase1.runScheduled('daily');
   ```

## Phase 1 signal set (14 signals)

| Category | Signals |
|---|---|
| Inventory | `inv.stockout_active`, `inv.stockout_imminent`, `inv.negative_on_hand`, `inv.dead_stock_aging` |
| Quote | `quote.stale_open`, `quote.velocity_slowing` |
| Vendor health | `vendor.score_deteriorating`, `vendor.lead_time_drift` |
| System | `sys.export_missed`, `sys.integration_down`, `sys.cache_stale` |
| Ecommerce | `ecom.conversion_drop`, `ecom.checkout_error_spike`, `ecom.product_404` |

## Replay-safe philosophy

The engine enforces three properties that keep the system replayable and auditable:

1. **Pure rules.** Rules read from globals + baselines and return candidate emissions. They do not write, do not call APIs, do not mutate state.
2. **Idempotent emit.** `(signal_name, entity_id)` is the dedupe key. Re-emitting an open signal bumps `last_observed_at` only — no new row, no notify.
3. **Append-only audit.** Every lifecycle event (`created`, `acknowledged`, `dismissed`, `resolved`) writes to `signal_audit`. Audit is the source of truth for tuning the severity model.

## Stale-source handling

Rules can pass `__sourceAgeMs` inside `trigger_snapshot`. If it exceeds the signal's `stale_tolerance_ms`, emit is dropped with reason `stale_source`. This prevents stale-data signals from confusing operators.

## What this is NOT

- Not a Kafka pipeline
- Not a microservice
- Not event sourcing
- Not real-time push (poll-based; CRIT/EMRG push channel is Phase 2)
- Not AI-driven (no model calls in Phase 1)
- Not a UI replacement for the existing alerts module — they coexist; alerts may eventually be backed by signals.

## Inputs the rules read

| Rule | Reads global |
|---|---|
| inv.* | `INVENTORY` |
| quote.* | `QUOTES` |
| vendor.* | `VD` |
| sys.* | `INTEGRATION_HEARTBEATS` (new — populated by integration modules) |
| ecom.conversion / checkout | `ECOM_KPI` (populated by `ecommerce_intelligence.js`) |
| ecom.product_404 | `ECOM_BROKEN_PDP` |

`INTEGRATION_HEARTBEATS`, `ECOM_KPI`, and `ECOM_BROKEN_PDP` are the only **new** globals required from upstream modules. They can be populated incrementally — missing data simply means the rule emits nothing, which is correct behavior.

## Tuning loop hook-in

After 30 days the severity model expects review of:
- Top-volume signals (consider demote)
- Low-ack-rate signals (consider kill)
- Storm-mode trips (diagnose source, not signal)

`signal_audit` contains everything needed for this review. A reporting query is left to Phase 2.
