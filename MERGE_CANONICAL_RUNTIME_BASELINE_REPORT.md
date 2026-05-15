# MERGE CANONICAL RUNTIME BASELINE REPORT

**Session 35 — Controlled merge operator**
**Date:** 2026-05-15
**Approved branch:** `claude/pricing-runtime-conversion-9ZISb`
**Target:** `main`
**Merge commit:** `d4966c7` ("Merge canonical Wave 1A runtime baseline (Session 35)")
**Strategy:** `--no-ff` (ort) merge of the rebased canonical line.
**Pre-merge state:** branch 3 ahead, 0 behind `main@ce5853f` — no rebase required.

---

## Merge summary

- Working tree clean before merge: ✓
- Branch 0 behind `main` before merge: ✓
- Merge completed without conflicts: ✓
- Push to `origin/main`: ✓ (`ce5853f..d4966c7  main -> main`)

## Files landed on `main`

```
index.html                            |   5 +-  (3 <script> tags added: runtime → producers → panel)
js/inventory.js                       | 145 +++  (pricing producer wrapper added)
js/signals_panel.js                   | 122 +++  (NEW)
js/signals_producers.js               | 206 ++++  (NEW)
js/signals_runtime.js                 | 314 ++++  (NEW)
js/signals_runtime.test.js            | 149 ++++  (NEW)
scripts/check-pricing-runtime-path.sh | 159 +++  (NEW, executable)
scripts/check-runtime-wiring.sh       |  87 +++  (NEW, executable)
sql/M49_signal_runtime_schema.sql     | 312 ++++  (NEW)
9 files changed, 1498 insertions(+), 1 deletion(-)
```

## Post-merge checks

| # | Check | Result | Notes |
|---|---|:---:|---|
| 1 | Conflict marker scan (`<<<<<<<` / `=======` / `>>>>>>>`) across `*.js *.html *.sql *.sh *.md` | ✓ | none found |
| 2 | JS syntax parse (V8 `vm.Script`) on every file in `js/` | ✓ | **47 / 47** parse clean (was 43, +4 from Wave 1A) |
| 3 | SQL file presence (`sql/M49_signal_runtime_schema.sql`) | ✓ | present |
| 4 | `index.html` script load order (runtime → producers → panel) | ✓ | lines 7772 / 7773 / 7774 |
| 5 | `scripts/check-pricing-runtime-path.sh` | ✓ | **26 passed, 0 failed, 0 warnings** (8 sections, full pricing producer path verified — feature flag, fallback, replay protection, metrics, effect observer, narrowness) |
| 6 | `scripts/check-runtime-wiring.sh` | ✓ | **16 passed, 0 failed, 0 warnings** (6 sections — producers wired, effects registered, graceful degradation, no queue bypass, metrics surface, load order) |
| 7 | `scripts/status.sh` | ✓ | runs clean (BUILD_PLAN_CLAUDE pending list unchanged; tree clean post-push) |

## Runtime objects now present on `main`

Verified via the merged tree at `d4966c7`:

| Symbol / artifact | Present on main now? |
|---|:---:|
| `js/signals_runtime.js` (canonical runtime) | ✓ |
| `js/signals_producers.js` (producer adapters) | ✓ |
| `js/signals_panel.js` (debug visibility panel) | ✓ |
| `js/signals_runtime.test.js` | ✓ |
| `queuePricingUpdate` / `queueCatalogUpsert` / `queueInventorySync` producers | ✓ |
| `pricingUpdateFromSignal` / `catalogUpsertFromSignal` / `inventoryLevelSyncFromSignal` effect impls | ✓ |
| `window.__SIGNAL_RUNTIME_METRICS__` (replay/latency metrics) | ✓ |
| `__SIGNALS_PRODUCER_PRICING__` feature flag (default OFF) | ✓ |
| `SIGNALS.metrics()` panel surface (queue_depth, oldest_pending, dead_letter, worker_running) | ✓ |
| `sql/M49_signal_runtime_schema.sql` migration file | ✓ (file landed — **NOT applied to Supabase**, per constraints) |
| `scripts/check-pricing-runtime-path.sh` | ✓ |
| `scripts/check-runtime-wiring.sh` | ✓ |
| Inventory `list_price` inline-edit routed through pricing queue (additive, flag-gated) | ✓ |

## Constraints honored

- No new implementation. No refactor.
- No sidecar branches merged.
- No Wave 1B work.
- No Supabase SQL execution. `M49_signal_runtime_schema.sql` is in the
  tree only — it has not been applied to any Supabase project.
- No production claims beyond the repo merge.

## Remaining sidecar branches (unmerged)

Per `RUNTIME_RECOVERY_PLAN.md`, these still need controlled merge in
separate PRs:

1. `claude/harden-signal-dedupe-CsO6N` — Phase 2 lifecycle (`transitionSignal`,
   DAG enforcement, `sql/M49_signal_dedupe_index.sql`, `js/signals.js +247`).
   Conflict surface: `js/signals.js`, `index.html` wiring.
2. `claude/harden-runtime-escalation-eYOqF` — Phase 3 confidence + escalation
   (`js/signals.js +193`, `js/alerts.js`, `scripts/check-signal-confidence.sh`).
   Conflict surface: overlaps Phase 2 on `js/signals.js`.
3. `claude/emitter-ownership-visibility-QfOTG` — governance scripts
   (`check-runtime-boundaries.sh`, `check-runtime-emitters.sh`,
   `check-signal-ownership.sh`, `.orchestration/forbidden_runtime_patterns.json`).
   Conflict surface: `scripts/status.sh`.

To archive (already covered by canonical or stale, per Session 34):

- `claude/minimal-signal-runtime-ZEwod` (subsumed by pricing branch)
- `claude/wire-minimal-runtime-tgo0c` (subsumed by pricing branch)
- `claude/runtime-boundary-enforcement-XcoKi` (subset of emitter-ownership)
- `claude/operational-signal-framework-UGMDn` (parallel impl, conflicting naming)
- `claude/mvhb-queue-runtime-UG9pN` (68 behind main, docs only)

To repair: `integration/wave1a-runtime-governance@fb8a12e` — its "already
on main" claim is now (post-this-merge) partly true. Update the execution
report so future sessions inherit accurate state.

## Next recommended sidecar order

1. **First:** `claude/harden-signal-dedupe-CsO6N` (Phase 2 lifecycle).
   Adds the lifecycle scaffolding that Phase 3 builds on. Land it before
   Phase 3 so the `js/signals.js` conflict surface is resolved in a known
   order (Phase 2 lines arrive first, Phase 3 rebases onto them).
2. **Second:** `claude/harden-runtime-escalation-eYOqF` (Phase 3 confidence
   + escalation). Will require a rebase onto the Phase-2-on-main state
   before it can be merged conflict-free.
3. **Third:** `claude/emitter-ownership-visibility-QfOTG` (governance
   scripts). Independent of Phase 2/3 in code surface (touches scripts/
   and `.orchestration/`), but landing it third lets it observe the
   fully-hardened runtime.
4. **Then:** rewrite `integration/wave1a-runtime-governance@fb8a12e`,
   archive the obsolete branches, and run a browser-capable live runtime
   verification.
