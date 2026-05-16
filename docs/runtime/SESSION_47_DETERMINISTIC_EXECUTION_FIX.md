# Session 47 — Deterministic Effect Execution Fix

**Status:** ✅ Fixes applied + verified live at DB layer. Awaiting browser re-run.
**Date (UTC):** 2026-05-16T19:29:36Z
**Branch:** `claude/prove-ui-runtime-m49-jTw1O`
**Pre-fix commit:** `5049583` (Session 46 RLS repair)
**DB project:** `hsyjcrrazrzqngwkqsqa`

## 1. Root cause

Two distinct bugs, surfaced by the same set of failing assertions:

### Bug A — Effect-log barrier blocks retries (production correctness bug)

`_claimEffect` in `js/signals_runtime.js` interpreted **any** `23505` unique
violation on `signal_effect_log` as a "true replay" and returned `false`,
which causes `_dispatch` to skip `eff.apply()` entirely. But the unique
index `(idempotency_key, effect_type)` also blocks the **retry** path:

1. First attempt: `_claimEffect` INSERTs `(outcome='started')`, `apply()`
   throws, `_markEffect` PATCHes to `outcome='failure'`, runtime calls
   `sig_retry` → row goes back to `pending` with backoff.
2. Second attempt (after backoff): `_claimEffect` tries to INSERT same
   `(idem, effect_type)` → 23505 → returns `false` → `apply()` skipped →
   `_dispatch` returns normally → `sig_finalize` → `status='succeeded'`
   with `attempts=2`.

Net effect: a single transient failure permanently masquerades as success.
The actual side effect (e.g. `PATCH /bc_products_cache`) **never runs**,
and the dead-letter path is unreachable.

Direct evidence in production tables (queried via Supabase MCP):

| `idempotency_key`                | queue `attempts`/`status` | effect_log `outcome`/`detail`                    |
| --- | --- | --- |
| `t_mp8pvebr_sd7y_retry` (Run 1) | `2` / `succeeded`           | `success` / `{"reason":"no_level","skipped":true}` |
| `t_mp8q86mi_78mi_retry` (Run 2) | `1` / `pending`             | `failure` / `{"error":"simulated boom"}`          |

Run 1's row went `failure → silently 'succeeded'` while `apply()` ran only
once. The test asserted `calls === 2` (attempt count) — failed.

### Bug B — Tests have no isolation against batch-claim or prior-run residue

`runOnce({ batch_size: 5 })` correctly drains *all* pending signals it
can lease, not just the test's own row. The tests assumed exclusive
ownership:

- Test 1 (`enqueue+dedup`) enqueues a `pricing.update.requested` row and
  never processes it — it remains `pending`.
- Test 3 (`claim+dispatch+finalize`) overrides
  `window.pricingUpdateFromSignal` and calls `runOnce(batch_size:5)`,
  which claims **both** test 1's leftover row and test 3's own row.
  Both go through the override → `appliedCount === 2` → assert "effect
  should run exactly once" fails.
- Test 4 (`retry→dead-letter`) has the same exposure to orphaned
  inventory rows from prior failed runs (which existed because Sessions
  43–45 partially completed runs against the M49-broken RLS).

This is a test-design bug, not a runtime bug — but it must be fixed
alongside Bug A to reach 5/5 green.

## 2. Exact lifecycle bug (Bug A, traced)

Pre-fix `_claimEffect` lifecycle on retry of a failed effect:

```
runOnce#1
  ├── sig_claim  → attempts:=1, status='leased'
  ├── _dispatch
  │     ├── _claimEffect  → POST /signal_effect_log → 201 (row: outcome='started')
  │     ├── apply()       → throws
  │     ├── _markEffect   → PATCH outcome='failure'
  │     └── re-throw
  └── runOnce catch
        └── sig_retry     → status='pending', next_visible_at=+30s, attempts:=1

(test PATCHes next_visible_at to past)

runOnce#2
  ├── sig_claim  → attempts:=2, status='leased'
  ├── _dispatch
  │     ├── _claimEffect  → POST /signal_effect_log → 409 (23505)
  │     │     └── pre-fix:  return false (treated as true replay)
  │     ├── apply()  ←──── SKIPPED  (the bug)
  │     └── (no throw)
  └── runOnce  → sig_finalize → status='succeeded'   ← masquerades as success
```

## 3. Exact fix

### 3.A Runtime fix — `js/signals_runtime.js` (versioned cache-bust to `v=6.11.4`)

`_claimEffect` now inspects the existing row on `23505` and only treats
`outcome='success'` as a true replay. `outcome='failure'` or
`outcome='started'` (a prior attempt that did not durably succeed) is
treated as recoverable: the marker is reset to `'started'` via
`_markEffect` and `apply()` is allowed to run on the retry. Single-success
semantics are preserved — a successful effect is *still* never re-run.

```js
async function _claimEffect(signal, effect_type, detail){
  try{
    await sbFetch('/signal_effect_log', { method:'POST', ... outcome:'started' ... });
    return true;
  }catch(e){
    if(!/23505|duplicate key|already exists/i.test(e.message||'')) throw e;
    let existing = null;
    try{
      existing = await sbFetch('/signal_effect_log?idempotency_key=eq.'+...
        +'&effect_type=eq.'+...+'&select=outcome&limit=1');
    }catch(_){}
    const prior = existing && existing[0] && existing[0].outcome;
    if(prior === 'success'){
      COUNTERS.effects_skipped_replay++;
      return false;                        // true replay
    }
    await _markEffect(signal, effect_type, 'started', detail || {});
    return true;                           // recoverable retry
  }
}
```

`index.html` bumped: `js/signals_runtime.js?v=6.11.4`.

### 3.B Test fix — `js/signals_runtime.test.js`

Every test that enqueues a row now adds `run_id: RUN_ID` to the payload.
The override functions in tests 3 and 4 short-circuit (return inert
success) for any payload whose `run_id` doesn't match the current
`RUN_ID`. This neutralizes pollution from test 1's pending row and from
any orphaned rows left by prior runs — those rows are drained as
no-op successes instead of inflating the test's counter.

No assertion text or pass-criteria was changed. The runtime contract
the tests exercise is the same.

## 4. Live DB verification (executed via Supabase MCP)

| Probe | Expectation | Result |
| --- | --- | --- |
| `signal_effect_log` PATCH `outcome='started'` then restore, as Owner JWT (simulates new `_claimEffect` reset path) | RLS permits round-trip; row restored to pre-state | ✅ before=`failure`, after=`started`, restored to `failure` |
| Owner JWT INSERT into `signal_effect_log` (M51 sanity, repeated) | allowed | ✅ |
| anon INSERT into `signal_effect_log` | denied | ✅ (regression check vs Session 46) |

No production data was mutated past restoration.

## 5. Before / after behavior

| Scenario | Pre-fix | Post-fix |
| --- | --- | --- |
| Effect succeeds on 1st try | finalize succeeded, 1 effect_log row outcome=success | unchanged |
| Effect throws once, succeeds on retry | finalize succeeded, but `apply()` ran only once; downstream side effect never happened | finalize succeeded, `apply()` ran on retry, side effect performed; effect_log shows `success` |
| Effect throws on every retry up to `max_attempts` | finalize **succeeded** at attempt 2 (masquerade); dead-letter unreachable | finalize **dead** after `max_attempts`; row appended to `signal_dead_letter`; alarms can fire |
| Re-enqueue of `(signal_type, idempotency_key)` after success | `sig_enqueue` ON CONFLICT touch → no new work | unchanged |
| Test 3 with stale pending pricing row in queue | `appliedCount=2` → assert fails | foreign row drained as no-op success, `appliedCount=1` → assert passes |
| Test 4 with orphan inventory row in queue | `calls > 1` → assert fails; or finalize succeeded silently | orphan drained as no-op success; test's own row exercises full retry → dead-letter; `calls=2`; final status=`dead` |

## 6. Browser re-run instructions (agent has no browser)

Same authenticated context as Sessions 43–46. In DevTools console on
`https://accent-os.pages.dev` after the deploy lands:

```js
// Force fresh fetch of both the runtime and the test bundle (we bumped
// signals_runtime.js to v=6.11.4 in index.html, but the test file is not
// versioned because it's not script-tagged — fetch+eval picks up edits
// because Cloudflare Pages serves the latest tip of the deployed branch).
await fetch('js/signals_runtime.test.js', { cache: 'reload' })
  .then(r => r.text()).then(t => (0, eval)(t));

// (Optional) drop the worker if you started one in a prior session.
if (window.SIGNALS && typeof SIGNALS.stopWorker === 'function') SIGNALS.stopWorker();

// Pre-state snapshot
console.log('pre',  await window.SIGNALS.metrics().then(m => m.snapshot));

// Run the suite
const results = await SIGNALS_TESTS.runAll();
console.table(results);    // expect 5/5 ok:true

// Post-state snapshot
console.log('post', await window.SIGNALS.metrics().then(m => m.snapshot));
```

If a test still fails with `403` on `/signal_effect_log`, the deploy
didn't pick up the version bump — hard-refresh (Cmd+Shift+R / Ctrl+Shift+R)
and re-run.

## 7. Preserved invariants

- **Replay barriers**: a successful effect is never re-run. `_claimEffect`
  still returns `false` for `outcome='success'`.
- **RLS**: no policy changes. M51's `up.user_id = auth.uid()` gate still
  governs every direct table access; round-trip verified in §4.
- **Deterministic queue behavior**: `sig_claim` / `sig_finalize` /
  `sig_retry` / `sig_dead_letter` RPCs untouched. Lease, backoff,
  `FOR UPDATE SKIP LOCKED` unchanged.
- **Dead-letter semantics**: unchanged at the runtime level; the fix
  unblocks the path that was previously unreachable for retried effects.
- **Metrics surfaces**: `window.__MINIMAL_SIGNAL_RUNTIME__` and the
  `sig_metrics` RPC unchanged. `COUNTERS.effects_skipped_replay` still
  fires, now only on the genuine-replay path.

## 8. Remaining risks

1. **Concurrent worker race (not a regression).** Two browser tabs
   running `SIGNALS.startWorker()` against the same project could both
   reset an `outcome='started'` row that is genuinely in-flight in the
   other tab, causing a double `apply()` execution. The lease mechanism
   (`sig_claim` skip-locked + `leased_until`) already prevents two
   workers from claiming the same `signal_queue` row simultaneously, so
   in practice this race is bounded to the lease window. Pre-fix
   behavior also had a concurrency hazard (the second worker would
   silently mark success on a foreign in-flight effect). Documenting,
   not fixing, per "do not widen scope."
2. **M47 still has the same M49-style RLS aliasing bug** (Session 46
   §8.1). Out of scope this session; recommend a focused session.
3. **No automated CI exists** for the signals runtime. These tests are
   manual-trigger from a signed-in browser. Out of scope; recommend a
   separate session to wire `signals_runtime.test.js` into a CI smoke
   that runs against a Supabase preview branch.
4. **Test residue in prod tables.** Test runs leave rows in
   `signal_queue`, `signal_effect_log`, and `signal_dead_letter` with
   idempotency keys prefixed `t_`. These are inert (no real downstream
   side effects because all test payloads are routed to the override or
   to the default impl's `skipped:true` path) but accumulate. A
   periodic GC of `idempotency_key LIKE 't\_%'` rows would be a future
   nice-to-have; not blocking.

## 9. Clean pause

- **Branch:** `claude/prove-ui-runtime-m49-jTw1O`
- **Pre-fix commit:** `5049583`
- **Repo changes pending commit:**
  - `js/signals_runtime.js` — `_claimEffect` rewrite + comment.
  - `js/signals_runtime.test.js` — `run_id` payload + scoped overrides in tests 1, 3, 4.
  - `index.html` — `signals_runtime.js?v=6.11.2` → `?v=6.11.4`.
  - `docs/runtime/SESSION_47_DETERMINISTIC_EXECUTION_FIX.md` — this report.
- **DB changes:** **none.** No schema, RLS, or RPC mutations. M49 + M51
  state is the source of truth.
- **Runtime status:** unblocked at the runtime layer; pending live browser
  re-run to confirm 5/5 PASS.
- **Remaining blockers:** §8.2 (M47), §6 (browser re-run only).

## 10. Next safest move

Once Cloudflare publishes the new commit:

1. Michael hard-refreshes the app in an authenticated Owner tab.
2. Runs the §6 snippet; expects 5/5 green.
3. Pastes the `console.table(results)` output back into this file under
   a new "§11 Live re-run results" heading and commits to the same
   branch.

If 5/5 green: open a new session to (a) audit M47 with the Session 46
§8.1 query, and (b) decide whether to wire up the GC of `t_%` test
residue rows.
