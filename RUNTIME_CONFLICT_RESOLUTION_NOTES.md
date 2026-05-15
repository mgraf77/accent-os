# RUNTIME_CONFLICT_RESOLUTION_NOTES

Working notes — per-sidecar, per-file resolution recipes derived from the
Session 36 reconciliation pass. Read alongside
`SIDECAR_RECONCILIATION_REPORT.md`.

## Canonical runtime surface (main@d4966c7)

```
js/signals_runtime.js     window.SIGNALS = { enqueue, claim, finalize,
                                              retry, deadLetter, runOnce,
                                              startWorker, stopWorker,
                                              registerHandler, metrics,
                                              _counters, _workerId }
js/signals_producers.js   window.SIGNAL_PRODUCERS, window.queueCatalogUpsert,
                          window.queueInventorySync, window.queuePricingUpdate
js/signals_panel.js       window.SIGNAL_PANEL = { show, hide, toggle, refresh }
```

Live counters (`COUNTERS` in `signals_runtime.js`):
`enqueued, claimed, succeeded, failed, dead_lettered, effects_started,
effects_success, effects_failure, effects_skipped_replay, last_run_at,
last_error, worker_running`.

RPCs the runtime relies on:
`sig_enqueue, sig_claim, sig_finalize, sig_retry, sig_dead_letter,
sig_dead_letter_unknown, sig_record_effect_attempt, sig_metrics`.

**Any sidecar that bypasses `window.SIGNALS` to call these RPCs directly,
or that introduces a parallel global, must be rewritten before merge.**

## Sidecar #1 — `harden-signal-dedupe-CsO6N`

### Conflicts

| File | Type | Resolution |
|---|---|---|
| `js/signals.js` (new, 247L) | parallel runtime | **DROP.** Re-author primitives inside `signals_runtime.js`. Dedupe is already partially present via the runtime's `(idempotency_key, effect_type)` unique-index path and `COUNTERS.effects_skipped_replay`. |
| `js/alerts.js` (+96/-36) | behavior | **REVIEW.** Determine which lines were dedupe-aware emitter changes vs unrelated edits. Port only the emitter-aware lines. |
| `index.html` (+3/-0) | load-order | **DROP.** The new `<script src="js/signals.js">` tag is no longer applicable. |
| `sql/M49_signal_dedupe_index.sql` | schema | **HOLD.** Schema apply is not authorized this session. Compare against existing `sig_*` table DDL on the deployed Supabase project before applying. |
| `docs/runtime/*.md` (5 files) | docs | **SALVAGE.** Cherry-pick as a doc-only commit. |
| `scripts/check-signal-dedupe.sh` | verifier | **PORT.** Update `grep` targets to `signals_runtime.js`. Verify it asserts on `COUNTERS.effects_skipped_replay` and the unique-index existence. |
| `scripts/check-signal-lifecycle.sh` | verifier | **PORT.** Same target update. |
| `KPI_CATALOG.md` (1 line) | docs | **PORT.** Trivial. |

### Suggested replay-safe re-author plan

1. New commit on a fresh sidecar branch off `main`:
   - Salvaged docs.
   - `scripts/check-signal-dedupe.sh` and `check-signal-lifecycle.sh`
     ported to the new runtime surface.
   - `KPI_CATALOG.md` line.
2. Separate commit: any genuinely-new dedupe primitive *as a registered
   `signals_runtime.js` hook*, not a parallel file.
3. SQL kept separate in `sql/` for future Supabase-apply session.

## Sidecar #2 — `harden-runtime-escalation-eYOqF`

### Conflicts

| File | Type | Resolution |
|---|---|---|
| `js/signals.js` (new, 193L) | parallel runtime | **DROP.** Re-author escalation as a handler decorator. |
| `js/alerts.js` (+79/-7) | behavior | **REVIEW.** Port only the escalation-confidence lines. |
| `index.html` (+3/-0) | load-order | **DROP.** |
| `scripts/check-signal-confidence.sh` | verifier | **PORT.** Update targets to `signals_runtime.js`. |

### Suggested re-author plan

1. Introduce a `registerHandler` decorator inside `signals_runtime.js`
   that wraps the existing 3 handlers and adds confidence/escalation
   scoring to the returned effect plan. Keep it report-only via a new
   counter (`escalations_recorded`) until ready to gate.
2. Verifier script asserts the counter increments under a synthetic
   low-confidence signal.

## Sidecar #3 — `emitter-ownership-visibility-QfOTG`

### Required patches before cherry-pick

1. **`scripts/check-runtime-emitters.sh`** — change any `js/signals.js`
   targets to `js/signals_runtime.js`. Add `js/signals_producers.js` and
   `js/signals_panel.js` to the inspected set.
2. **`scripts/check-runtime-boundaries.sh`** — same target update;
   ensure the "no module bypasses runtime" check exempts the 3 canonical
   files (currently it likely exempts only `js/signals.js`).
3. **`scripts/check-signal-ownership.sh`** — same target update.
4. **`.orchestration/forbidden_runtime_patterns.json`** — review pattern
   list against the canonical runtime's grep-surface; remove any that
   would false-positive on the new file names.
5. **`scripts/status.sh`** — coordinate with Phase 4 additions in this
   branch so the +32 lines don't double-print runtime health blocks.

### Cherry-pick plan

```
# in a fresh branch off main:
git cherry-pick c5d4037 eef126c
# fix script targets, single follow-up commit
# verify with `bash scripts/check-runtime-wiring.sh` (must still pass)
```

## General principles applied

1. **Additive > destructive** — no sidecar deletes from main.
2. **Single runtime owner** — `window.SIGNALS` is the only signal
   namespace. Parallel `js/signals.js` is forbidden going forward.
3. **Report-only first** — any new enforcement starts as a counter or a
   warn-log, never blocking.
4. **One verifier, one target** — every `scripts/check-*` script must
   reference `js/signals_runtime.js` (and producers/panel) explicitly.
5. **Replay safety** — never reintroduce paths that bypass
   `(idempotency_key, effect_type)` uniqueness.
