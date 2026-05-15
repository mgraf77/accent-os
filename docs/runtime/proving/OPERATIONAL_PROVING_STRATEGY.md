# OPERATIONAL_PROVING_STRATEGY.md

> How we prove the M49 signal runtime is healthy without standing up a
> giant test framework.

## Two layers, no more

| Layer | Tool | When it runs | Cost |
|-------|------|--------------|------|
| Static proving | `scripts/check-*.sh` | CI + pre-merge | seconds |
| Runtime proving | `scripts/simulate-*.sh` | On-demand, against live tab | minutes, operator-driven |

There is intentionally no third "automated end-to-end runner" layer. The
runtime is browser-bound; spinning up a headless harness costs more in
complexity than it pays back.

## Static proving (`check-*.sh`)

Four scripts, each enforcing one safety pillar:

| Script | Enforces |
|--------|----------|
| `check-runtime-recovery.sh` | Lease reclaim, retry/dead-letter routing, bounded backoff, worker tick guard |
| `check-fallback-integrity.sh` | Producer non-throw contract, sb/runtime availability gates |
| `check-replay-integrity.sh` | Queue + effect log uniqueness, dispatch-before-apply, 23505 handling |
| `check-runtime-degradation.sh` | Counter coverage, panel surfaces, metrics RPC fields |

**Run command:** `for s in scripts/check-runtime-recovery.sh scripts/check-fallback-integrity.sh scripts/check-replay-integrity.sh scripts/check-runtime-degradation.sh; do bash "$s" || exit 1; done`

**Exit:** zero on pass. Any failure is a regression in a safety invariant —
the patch that caused it is the patch that must be revised.

## Runtime proving (`simulate-*.sh`)

Four scripts that emit JS / SQL snippets the operator pastes into DevTools
or the Supabase SQL editor. None of them touch production data:

| Script | Simulates | Asserts |
|--------|-----------|---------|
| `simulate-replay-storm.sh` | N rapid enqueues of one (type, key) | one queue row, ≤1 effect run |
| `simulate-runtime-outage.sh` | `window.SIGNALS = undefined` | producers return `queued:false`, never throw |
| `simulate-dead-letter-load.sh` | N unknown signal types | N dead-letter rows, 0 queue rows |
| `simulate-stale-leases.sh` | Rows leased with expired `leased_until` | `sig_claim` reclaims them |

Each script prints copy-paste blocks separated by `─────` rules. The blocks
are self-contained, use unique idempotency keys per run, and are safe to
execute against a live tenant.

## Cadence

| Trigger | Action |
|---------|--------|
| Any change to `js/signals_*.js`, `sql/M49_*.sql`, `js/signals_panel.js` | Run all four `check-*.sh` locally before commit |
| Pre-deploy | Run all four `check-*.sh` in CI |
| Post-deploy smoke | Run `simulate-replay-storm.sh` against the deployed tab |
| After any incident touching the runtime | Run all four `simulate-*.sh` to re-prove the invariants |
| Quarterly | Run the full simulate suite as a runbook exercise |

## What is NOT proved here, on purpose

- **Performance.** We don't benchmark throughput. The runtime is operator-paced.
- **Cross-tab semantics.** Two tabs are two workers; we cap operational use to one.
- **Long-running drift.** Use ad-hoc SQL against `signal_dead_letter` and
  `signal_effect_log` for retrospective forensics. No replay analytics system.

The proving strategy expands by adding new checks alongside new invariants —
never by adding a new layer.
