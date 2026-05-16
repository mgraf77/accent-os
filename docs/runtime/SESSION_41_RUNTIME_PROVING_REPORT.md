# Session 41 — Runtime Proving Report

**Date:** 2026-05-16
**Mission:** Prove the current runtime is stable, observable, and merge-safe after Session 35's runtime baseline merge. Inspect three sidecar branches and decide reconciliation.
**Authority:** MEDIUM (stabilization/proving — no architecture expansion)

---

## 1. Branch / Commit

- **Working branch:** `claude/runtime-stability-proving-fkrNG`
- **Commit (= `origin/main`):** `d4966c7 Merge canonical Wave 1A runtime baseline (Session 35)`
- **Ahead/behind main:** 0 / 0 (clean, in sync)
- **Working tree:** clean

The proving branch is at parity with `main`; nothing was changed in this session except this report.

---

## 2. Files Inspected

Runtime source:
- `js/signals_runtime.js` (314 lines) — minimal SQL-backed queue runtime
- `js/signals_producers.js` (206 lines) — producer adapters + effect impls
- `js/signals_panel.js` (122 lines) — debug visibility surface
- `js/signals_runtime.test.js` (149 lines) — browser-loaded smoke tests
- `js/inventory.js` lines 440–600 — converted pricing path (M50)

SQL:
- `sql/M49_signal_runtime_schema.sql` (312 lines) — `signal_queue`, `signal_effect_log`, RPCs

Verification scripts:
- `scripts/check-runtime-wiring.sh`
- `scripts/check-pricing-runtime-path.sh`
- `scripts/runtime-health.js`
- `scripts/status.sh`

---

## 3. Scripts Run

| Script | Result |
|---|---|
| `bash scripts/check-runtime-wiring.sh` | **16/16 passed, 0 failed, 0 warnings** |
| `bash scripts/check-pricing-runtime-path.sh` | **26/26 passed, 0 failed, 0 warnings** |
| `node js/signals_runtime.test.js` | N/A — browser harness; cannot run in node (uses `window.*`). Verified by code read; runs via `SIGNALS_TESTS.runAll()` in browser. |
| `git diff origin/main...HEAD` | empty (in sync) |

---

## 4. Runtime Features Verified

Source-of-truth verification by reading the runtime and the matching SQL:

- [x] `window.SIGNALS` surface — `enqueue, claim, finalize, retry, deadLetter, runOnce, startWorker, stopWorker, registerHandler, metrics`
- [x] Three handlers registered: `catalog.item.upsert.requested`, `inventory.level.sync.requested`, `pricing.update.requested`
- [x] Unknown signal types are direct-dead-lettered before queue insert (`sig_dead_letter_unknown` RPC)
- [x] Producer adapters: `queueCatalogUpsert`, `queueInventorySync`, `queuePricingUpdate` — all `_runtimeAvailable()`-guarded, never throw
- [x] Effect implementations (`*FromSignal`) installed only if no upstream already claimed slot — non-clobbering
- [x] Replay metrics: `effects_started`, `effects_success`, `effects_failure`, `effects_skipped_replay` in `COUNTERS` + `__MINIMAL_SIGNAL_RUNTIME__`
- [x] Producer-side metrics: `__SIGNAL_RUNTIME_METRICS__.pricing` (enqueue_attempts/success/fallback/error, last/avg latency, replay_skipped)
- [x] Pricing queue producer path (`js/inventory.js:473`) — gated on `field === 'list_price'`, follows direct PATCH, wrapped in try/catch
- [x] Feature flag `window.__SIGNALS_PRODUCER_PRICING__ === true` strict-check, default-OFF
- [x] Debug panel: `?signals_debug=1` / `SIGNAL_PANEL.show()` / `localStorage.signals_debug=1`, surfaces pending/oldest/dead/worker
- [x] Load order in `index.html` lines 7772–7774: `signals_runtime.js → signals_producers.js → signals_panel.js`
- [x] No module bypasses runtime to touch `signal_queue` / `sig_*` RPCs directly
- [x] Queue adapter present: `sbFetch('/rpc/sig_*')` via `_rpc()`
- [x] Fallback behavior: producers return `{ queued: false, reason: 'runtime_unavailable' }` when SIGNALS not available; effect impls return `{ skipped, reason: 'sb_not_configured' }` when Supabase missing

---

## 5. Replay Behavior Status

**Two-layer barrier — both layers verified present:**

1. **Producer-side dedupe** (`js/signals_producers.js:50`): 30-second time bucket in `_idem()` composer → `${prefix}:${tail}:${bucket}`. Rapid double-commits within 30s collapse to the same idempotency key.
2. **Runtime-side effect barrier** (`js/signals_runtime.js:125`): `_claimEffect()` INSERTs into `signal_effect_log` with `outcome='started'`. SQL unique index on `(idempotency_key, effect_type)` (see schema lines 52–60) makes the claim atomic. `23505` / `duplicate key` is caught → `COUNTERS.effects_skipped_replay++` → effect runs inert. Replays cannot double-apply side effects.
3. **Queue-side dedupe**: `uq_signal_queue_idem` on `(signal_type, idempotency_key)` (schema line 35) — second enqueue of same key is a no-op at the SQL level.

**Status: STABLE.** All three guards confirmed in code + SQL. Untested at runtime in this session (no live Supabase exercised); behavior is by inspection.

---

## 6. Queue Observation Status

- Live counters update on `enqueue/claim/finalize/retry/deadLetter` calls (`COUNTERS` object in runtime).
- `window.SIGNALS.metrics()` fetches `sig_metrics` RPC and merges with live counters → assigns to `window.__MINIMAL_SIGNAL_RUNTIME__`.
- Debug panel polls `metrics()` every 5s once shown.
- `sig_metrics` RPC (schema line 292) returns `queue_depth_pending`, `oldest_pending_at`, `dead_letter_count` as jsonb.

**Status: OBSERVABLE.** All four panel fields are wired end-to-end (panel → metrics RPC → schema).

---

## 7. Dead-Letter Observation Status

- `sig_dead_letter` and `sig_dead_letter_unknown` RPCs defined in schema (lines 242, 273).
- Runtime increments `COUNTERS.dead_lettered` on both paths.
- Panel surfaces `snap.dead_letter_count` with amber accent when > 0.
- `runOnce()` dead-letters on `attempts >= max_attempts`; otherwise retries with `_backoffSecs(attempts)` (capped 300s, jittered).

**Status: OBSERVABLE.** No live dead-letter sample exercised — verification is static.

---

## 8. Sidecar Reconciliation

Fetched and diff-inspected the three branches in the prescribed order. **No merges performed in this session.** Recommendations below.

### 8.1 `claude/harden-signal-dedupe-CsO6N`

**Verdict: B — needs trimming. DEFER.**

- Branches from `ce5853f` (pre-runtime merge).
- Adds a parallel `js/signals.js` (247 lines) + `sql/M49_signal_dedupe_index.sql` + extensive governance docs (5 docs, ~520 lines).
- Operates on the **legacy `alerts` table / UI signal generators**, not the new `signal_queue` runtime. The two systems do not interact, but the naming overlap (`signals.js` vs `signals_runtime.js`/`signals_producers.js`) and SQL filename collision (`M49_signal_dedupe_index.sql` vs `M49_signal_runtime_schema.sql`) are confusion hazards.
- Phase 1 dedupe primitives + canonical type registry are valuable on their own.
- Phase 2 adds `transitionSignal` DAG enforcement — broader behavioral change.

**Risks if merged as-is:**
1. Naming collision will confuse future readers (two unrelated "signal" systems).
2. M49 SQL filename collision must be renumbered.
3. ~520 lines of new governance docs conflict with the mission constraint "DO NOT expand governance."
4. Needs rebase onto current `main`.

**Recommendation:** Rename to `js/alert_dedupe.js` + `sql/M51_alert_dedupe_index.sql` before merge, trim docs to a single primitives reference, defer Phase 2 (transitionSignal) until separate review.

### 8.2 `claude/harden-runtime-escalation-eYOqF`

**Verdict: B — needs trimming, depends on 8.1. DEFER.**

- Also branches from `ce5853f`; also touches `js/signals.js` (193-line new file, distinct content from dedupe branch's `signals.js`) and `js/alerts.js`.
- Adds `evaluateConfidence`, `deriveEscalation`, `normalizeSeverity`, `shouldDimStale`, `trackSignal`.
- Doctrine block says "never auto-suppresses, never blocks runtime, never throws" — low risk by intent.
- Same scope as dedupe branch (legacy alerts/signals UI), same naming-collision concern.

**Risks if merged as-is:**
1. Conflicts with dedupe branch — both create `js/signals.js` with different bodies. They cannot both land without integration.
2. Same naming/governance issues as 8.1.
3. Needs rebase onto current `main`.

**Recommendation:** Treat as a follow-up to 8.1 — both sidecars target the same `signals.js` slot and must be combined into a single rebased branch before merge.

### 8.3 `claude/emitter-ownership-visibility-QfOTG`

**Verdict: D — risky in context. DEFER (with note).**

- Purely additive: 7 new files (orchestration JSON, 2 docs, 4 scripts, status.sh amendment). No JS or SQL runtime changes.
- Scripts are explicitly report-only (`exit 0`, "report-only" headers).
- Behaviorally zero-risk for runtime stability.

**Why defer despite zero behavioral risk:**
- Mission constraint: "**DO NOT** expand governance."
- This branch is governance expansion (new orchestration policy file, ownership registry, three new boundary/ownership scan scripts wired into status.sh).
- It is currently the *most clearly safe* of the three to merge if/when the constraint is lifted.

**Recommendation:** Hold until the proving phase ends and governance expansion is explicitly authorized. When authorized, this is the lowest-risk sidecar to merge first.

### 8.4 Sidecar status table

| # | Branch | Domain | Verdict | Safe to merge now? | Blockers |
|---|---|---|---|---|---|
| 1 | `harden-signal-dedupe-CsO6N` | legacy alerts/signals (UI) | B — needs trimming | No | Naming collision, SQL renumber, governance-docs scope, rebase needed |
| 2 | `harden-runtime-escalation-eYOqF` | legacy alerts/signals (UI) | B — needs trimming | No | Conflicts with #1 (`signals.js`), rebase needed, must be combined with #1 |
| 3 | `emitter-ownership-visibility-QfOTG` | governance scripts | D — defer | No | Mission says "DO NOT expand governance"; safe by code, blocked by scope |

---

## 9. Risks Found

1. **Naming-collision hazard, future readers:** if either `harden-signal-*` sidecar is merged with current filenames, the repo will contain `js/signals.js` (legacy UI alerts) alongside `js/signals_runtime.js` (SQL queue). Strongly recommend renaming to `js/alert_dedupe.js` / `js/alert_escalation.js` before merging.
2. **SQL filename collision:** `harden-signal-dedupe-CsO6N` adds `sql/M49_signal_dedupe_index.sql` while main has `sql/M49_signal_runtime_schema.sql`. Pick a non-colliding migration number.
3. **No live runtime exercise in this session:** all proving is static (code + SQL inspection + check scripts). The browser-side `signals_runtime.test.js` (4 cases — unknown-type dead-letter, idempotency, replay barrier, panel) has not been executed in this session. Recommend a real-browser run before declaring "fully proven."
4. **Two sidecars touch the same new file path** (`js/signals.js`). They cannot both land independently. Either reconcile them on a single branch, or pick one.
5. **No risk found in main runtime baseline itself.** All wiring checks pass cleanly.

---

## 10. Exact Next Safest Action

Run the browser smoke test against a configured Supabase to convert this paper-proving into runtime-proving:

1. Open `index.html` in a browser pointed at a Supabase project that has `sql/M49_signal_runtime_schema.sql` applied.
2. In console: `await SIGNALS_TESTS.runAll()` (loaded from `js/signals_runtime.test.js`).
3. Expect all four cases green; expect the debug panel (`SIGNAL_PANEL.show()`) to show pending/dead counters update.
4. If green, commit a one-line addendum to this report noting "live smoke test: PASS @ <date> against <project-ref>" — no other code changes.

Only after that should sidecar reconciliation (Section 8) be opened. The first sidecar to address is **#3 (emitter-ownership)** because it is behaviorally inert; but it remains blocked by the "no governance expansion" mission constraint until Michael explicitly authorizes.

---

## 11. Clean Pause

- **Branch:** `claude/runtime-stability-proving-fkrNG`
- **Commit:** `d4966c7` (= `origin/main`)
- **Uncommitted changes:** only this report file (`docs/runtime/SESSION_41_RUNTIME_PROVING_REPORT.md`)
- **Verification commands to re-run:**
  ```bash
  bash scripts/check-runtime-wiring.sh
  bash scripts/check-pricing-runtime-path.sh
  # Browser: open index.html → console → await SIGNALS_TESTS.runAll()
  ```
- **Next recommended action (plain English):** run the browser-side `SIGNALS_TESTS.runAll()` against a real Supabase project to convert static proving into live proving. Hold all three sidecars pending that result and an explicit go-ahead on each.
