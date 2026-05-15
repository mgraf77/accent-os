# ACTUAL RUNTIME STATE

**Session 34 — Runtime Reality Reconciliation**
**Reference point:** `origin/main @ ce5853f` (what is *actually deployed
and merged today*).
**Method:** `git ls-tree`, `git grep`, static parse — no assumptions.

---

## What objectively exists today on `main`

### Runtime JS modules (under `js/`)

43 modules. Inventory of runtime-relevant ones:

- `js/inventory.js` — includes `sbUpdateInventoryField` PATCH helper
  (v6.10.43) and inline-edit row renderer (v6.10.44). **Path: direct PATCH
  to `inventory_items`. No queue.**
- `js/bigcommerce_adapter.js` — contains `_bcRequestQueue` (line 80). The
  only queue-shaped object in the tree.
- `js/signals.js` — exists on `main` (KPI catalog references it), but
  contains **no** `transitionSignal`, **no** confidence/escalation
  helpers, **no** dedupe logic. Those exist only on the
  `harden-signal-dedupe-CsO6N` and `harden-runtime-escalation-eYOqF`
  feature branches.
- `js/alerts.js`, `js/decision_engine.js` — present, unmodified by Wave 1A
  work.

### Runtime JS modules that **do NOT exist** on `main`

- `js/signals_runtime.js`
- `js/signals_runtime.test.js`
- `js/signals_producers.js`
- `js/signal_runtime.js` (parallel impl)
- `js/signal_engine.js`, `js/signal_feed.js`, `js/signal_baselines.js`,
  `js/signal_command_surface.js`, `js/signal_rules_phase1.js`

### Runtime globals (window/global symbols)

Searched `js/*.js` and `index.html` on `main` for these symbols:

| Symbol | Present on `main`? |
|---|:---:|
| `signalRuntime` / `window.signalRuntime` | ✗ |
| `signals_runtime` | ✗ |
| `__SIGNALS_PRODUCER_PRICING__` (feature flag) | ✗ |
| `__SIGNAL_RUNTIME_METRICS__` (replay metrics object) | ✗ |
| `__SIGNALS_TRACE__` / `__SIGNALS_PRICING_DEBUG__` | ✗ |
| `queuePricingUpdate` | ✗ |
| `pricingUpdateFromSignal` (effect observer hook) | ✗ |
| `priceQueue` / `pricing_queue` / `queueRuntime` / `queue_runtime` | ✗ |
| `replayMetrics` / `runtimeMetrics` (top-level) | ✗ |
| `transitionSignal` (lifecycle DAG enforcement) | ✗ |
| `_bcRequestQueue` (BigCommerce adapter queue) | ✓ |

### Runtime debug panel

- No `debugPanel`, `runtimePanel`, `__runtime_debug__`, or similar surface
  on `main`. The "runtime panel" referenced in mission briefs lives only
  on the `wire-minimal-runtime-tgo0c` and `pricing-runtime-conversion-9ZISb`
  branches.

### Replay metrics

- No replay-metrics object on `main`. The
  `window.__SIGNAL_RUNTIME_METRICS__.pricing` object (with
  `enqueue_attempts`, `success`, `fallback`, `error`, `replay_skipped`,
  `last_latency`, `avg_latency`) exists only on
  `pricing-runtime-conversion-9ZISb`.

### Producer code

- No signal producers on `main`. `signals_producers.js` exists only on
  `wire-minimal-runtime-tgo0c` and `pricing-runtime-conversion-9ZISb`.
- The pricing-specific producer (M50) — which wraps the
  `inventory.list_price` inline edit and enqueues to the runtime — exists
  only on `pricing-runtime-conversion-9ZISb`.

### Queue runtime code

- No queue-runtime worker, no queue tables, no queue-runtime JS module on
  `main`.
- `claude/mvhb-queue-runtime-UG9pN` carries **design docs only**
  (`QUEUE_RUNTIME_V0.md`, `QUEUE_ITEM_SCHEMA.md`); no executable queue
  code anywhere in the tree.
- `claude/operational-signal-framework-UGMDn` includes a stub at
  `worker/signal_worker_entry.js` (59 lines) — never merged, parallel
  design.

### SQL / schema on `main`

- `sql/M02_core_schema.sql` (18 tables) — per `status.sh`.
- **Not on main:** `M49_signal_runtime_schema.sql`,
  `M49_signal_dedupe_index.sql`, `M49_signals_schema.sql`,
  `M50_*` migrations.

### Governance scripts on `main`

- `scripts/status.sh` ✓
- `scripts/health-check.sh` ✓
- `scripts/efficiency-aggregate.sh` ✓
- `scripts/runtime-health.js` ✓ (browser-only)
- `scripts/auto-categorize.js`, `extract_sales_v3.py`,
  `analyze_vendors*.py` ✓

### Governance scripts that **do NOT exist** on `main`

- `scripts/check-runtime-wiring.sh`
- `scripts/check-pricing-runtime-path.sh`
- `scripts/check-signal-dedupe.sh`
- `scripts/check-signal-lifecycle.sh`
- `scripts/check-signal-confidence.sh`
- `scripts/check-signal-ownership.sh`
- `scripts/check-runtime-boundaries.sh`
- `scripts/check-runtime-emitters.sh`
- `.orchestration/forbidden_runtime_patterns.json`

### Tests

- No Wave 1A test files on `main` (`signals_runtime.test.js` is feature-branch only).

---

## Summary — what's *actually* runtime-real today

The current runtime on `main` consists of:

1. The static SPA shell (`index.html`, 758 KB) with 43 module includes.
2. Direct Supabase REST PATCH/POST flows from each module (no queue, no
   replay, no metrics, no producer/consumer split).
3. The BigCommerce adapter's internal `_bcRequestQueue` (rate-limit
   gate only — not a generalized runtime).
4. A Cloudflare Worker proxy for BC credentials (per `d94304a` and
   subsequent BC hardening commits).
5. Three governance scripts (`status.sh`, `health-check.sh`,
   `efficiency-aggregate.sh`).

**None of the Wave 1A runtime surface (signals runtime, producers,
pricing queue, replay metrics, runtime debug panel, dedupe/lifecycle/
confidence/ownership scripts) is present on `main`.**

It exists exclusively on unmerged feature branches.
