# Signal Autonomy & Baselines — Phase 1

Closes the operational loop: rules now run on cadence, baselines refresh
unattended, and operators can see whether to trust what they're looking at.

## New modules

| File | Role |
|---|---|
| `js/signal_scheduler.js` | One-tick-per-minute master timer; cadence-aware dispatch with cooldown + heartbeat |
| `js/signal_baselines.js` | Per-metric rolling stats (median/MAD/mean/stddev); upserts to `signal_baselines` |
| `js/signal_trust.js` | Freshness/health surface: pill + detail panel |
| `worker/signal_worker_entry.js` | Cloudflare Worker entry stub for Phase 2 unattended cron |

## Scheduler behavior

- **One `setInterval` for the whole runtime.** Default 60s tick.
- Each tick computes due cadences by comparing `now - last_run` against
  `interval`. Cadences supported: `hourly`, `daily`, `weekly`.
- `last_run` is persisted to `localStorage` under key `sigsched_v1`. Page
  reloads do not re-fire still-cooling cadences.
- Re-entrancy is guarded — a long-running tick won't overlap with the next.
- Errors in one cadence don't block others; each is reported in the
  heartbeat under `results[].error`.
- On first start the scheduler fires one immediate tick so first-load
  rules don't wait an hour.
- `mobile-ops.html` does **not** autostart the scheduler (it's a snapshot
  surface, not an attended console).

### Heartbeat record

Each tick writes a heartbeat to `localStorage` under `sigsched_heartbeat_v1`:

```
{
  ticked_at, finished_at,
  cadences_dispatched, cadences_due_count,
  results: [{ cadence, ok, rules, emitted, error? }, ...],
  next_due: { hourly: <ms>, daily: <ms>, weekly: <ms> }
}
```

Consumers: `SignalTrust.snapshot()` reads this to compute scheduler health.

## Baseline strategy

- **Pre-computed, never lazy.** Rules read from `SignalBaselines.get()`,
  which serves from an in-memory cache hydrated from `signal_baselines`.
- **Windows: 7, 30, 90 days.** Longer windows (drift) arrive with margin
  metrics in a later phase.
- **Phase 1 metrics:**
  - `quote.time_to_close_days` (`_global_`)
  - `vendor.score` (per vendor)
  - `vendor.lead_time_days` (per vendor)
  - `ecom.conversion_rate` (`storefront`)
  - `inventory.days_of_cover` (top 50 by demand)
- **Refresh cadence:** daily, via a dispatcher-only "rule"
  (`rule.baselines.refresh_daily`) registered alongside emitting rules.
  This keeps freshness inside the same dispatch loop as everything else,
  so the heartbeat reflects baseline runs too.
- **Replay-safe:** every row carries `computed_at`. Backtesting can
  query "the baseline as of T" by selecting the latest row whose
  `computed_at <= T`.
- **Worker-portable:** `_pure._stats` and `_pure._windowSlice` are pure
  helpers exported on the module so the Worker bundle reuses them.

### Extractor contract

Each metric extractor returns a map `{ entity_id -> [{__ts, value}, ...] }`.
Phase 1 readers expect the following globals (already present or to be
populated by adjacent modules):

| Metric | Reads | Notes |
|---|---|---|
| `quote.time_to_close_days` | `QUOTES[].created_at, .closed_at` | already hydrated |
| `vendor.score` | `VD[].score_history[]` | history append needed; currently empty for most vendors |
| `vendor.lead_time_days` | `VD[].lead_time_history[]` | same — to be populated by PO receiving flow |
| `ecom.conversion_rate` | `ECOM_DAILY[].{date, conversion_rate}` | populated by `ecommerce_intelligence.js` |
| `inventory.days_of_cover` | `INVENTORY[].coverage_history[]` | new field; populated by inventory cron |

When history fields are absent the extractor returns empty arrays and no
rows are written. Rules degrade to "no baseline → no signal" — safer than
firing on the spot value.

## Trust / freshness behavior

`SignalTrust.snapshot()` reports four sub-states (each ∈ {healthy, warn, bad, unknown})
and a combined `overall`:

| Sub-state | Healthy when | Warn when | Bad when |
|---|---|---|---|
| `scheduler` | tick < 45m old, no errors | tick > 45m old | tick > 90m old or last batch had errors |
| `baselines` | oldest row < 18h | oldest row 18–36h | oldest row > 36h |
| `integrations` | every source within its `stale_tolerance_ms` | any source 1–2× tolerance | any source > 2× tolerance |
| `rules` | heartbeat exists | — | (no degradation path yet) |

UX surfaces:

- **Pill** (`#signalTrustPill`): compact tag showing the worst state. Click to expand panel.
- **Panel** (`#signalTrustPanel` or `#signal-vendor-trust` in vendor rail):
  four rows + per-source freshness chips. Has a ↻ button that force-ticks
  the scheduler and re-hydrates baselines.

Per-signal confidence is already shown by the confidence ladder in
`SignalCommandSurface.primitives._confidenceLadder`, which reads
`trigger_snapshot.__sourceAgeMs` and `__confidence`. Stale-source signals
drop ladder dots to slate.

## Worker portability

`worker/signal_worker_entry.js` is a Cloudflare Worker entry **stub**.
It documents the Phase 2 migration path without performing it. The
portable surface is already in place:

1. `SignalScheduler._pure.computeDueCadences` — pure cadence math.
2. `SignalBaselines._pure._stats`, `_windowSlice` — pure baseline math.
3. `SignalRuntime.delta.*` — pure delta detection helpers.
4. Rules in `signal_rules_phase1.js` use only `RT` (runtime), `SE`
   (engine), and named globals (INVENTORY/QUOTES/VD/ECOM_*). To run
   under a Worker, those globals are replaced with a passed `ctx`
   object built from Supabase reads — no rule code changes.

Phase 2 will:
- Bundle the four `signal_*.js` modules as a Worker (esbuild)
- Add `wrangler.toml` cron triggers (`0 * * * *`, `15 7 * * *`)
- Replace globals access with `ctx` injection (single-line per rule)
- Persist heartbeats to a `scheduler_heartbeats` table for cross-host visibility

## Doctrine recap

No Kafka. No event sourcing. No microservice sprawl. No reactive
framework. The autonomy layer is:

- 1 `setInterval`
- 1 localStorage record per cadence
- 1 heartbeat row
- 1 baselines table
- 1 worker entry stub (deferred)

Everything else is the rules themselves and the surfaces that render their output.

## Next recommended lane

**Populate the history fields** that baselines read. Specifically:

1. `VD[].score_history` — append on every score change (CHANGELOG already
   carries this; a small adapter writes through to `score_history`).
2. `VD[].lead_time_history` — append on every PO receipt (data exists in
   `purchase_orders` receiving lines).
3. `INVENTORY[].coverage_history` — append nightly from an inventory snapshot.

Until these are populated, the baselines table will be sparse and
delta-driven rules will keep firing on level thresholds only. Wiring the
history fields is ~150 lines per adapter — far cheaper than the
mathematical / architectural work already in place.

After that, the natural next lane is the **Cloudflare Worker cron migration**
described above, which graduates the autonomy layer from "fresh while
someone has the app open" to "always fresh."
