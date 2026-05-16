# Session 48 — Retry Exhaustion Semantics Finalization

**Status:** ✅ Fix applied + verified live at DB layer. Awaiting browser re-run.
**Date (UTC):** 2026-05-16T19:57:13Z
**Branch:** `claude/prove-ui-runtime-m49-jTw1O`
**Pre-fix commit:** `2129e49` (Session 47)
**DB project:** `hsyjcrrazrzqngwkqsqa`

## 1. Root cause

**Client/server clock skew, not a runtime state-machine bug.**

The test PATCH at `js/signals_runtime.test.js` used
`new Date(Date.now()-1000).toISOString()` to "force the row visible
immediately so we can drain attempt #2". That ISO timestamp is computed
from the **browser** clock, but `sig_claim`'s eligibility predicate
(`status='pending' AND next_visible_at <= now()`) compares against the
**PostgreSQL server** clock. If the two clocks disagree by more than 1
second (with client ahead of server), the test's "1 second ago" is
actually in the **server's future**, and `sig_claim` silently refuses to
lease the row.

Decoded evidence from the most recent failing run
(`RUN_ID = t_mp8r536l_6g1q`):

| Source | Time (UTC) |
| --- | --- |
| RUN_ID encodes `Date.now()` (browser) | `2026-05-16T19:41:24.957Z` |
| `enqueued_at` for the same run's first row (server) | `2026-05-16T19:40:53.025Z` |
| **Browser-ahead skew** | **≈ 31.9 seconds** |

For the inventory `_retry` row in that run:
- `updated_at = 19:40:53.362534` (server time at `sig_retry`)
- `next_visible_at = 19:41:25.424000` (PATCH body value, in client time)
- Difference: 32.06 seconds — **NOT** an integer-second backoff. That
  rules out it coming from `make_interval(secs => _backoffSecs(1))` (which
  would produce exactly 2s), and pins it on the test's PATCH succeeding
  but writing a server-future timestamp.

The runtime is otherwise correct — every server-side state transition
(`sig_claim`, `sig_retry`, `sig_dead_letter`, the `updated_at` trigger)
uses server `now()` and is clock-skew-immune. `_backoffSecs(1) = 2`
empirically (verified via Node — see §4). The only client-clock
dependency in the test+runtime stack was this one PATCH body.

## 2. Retry lifecycle (pre-fix, with clock skew)

```
runOnce#1 (server time T0 = 19:40:53)
  ├── sig_claim   → attempts: 0 → 1, status='leased'
  ├── _dispatch
  │     ├── _claimEffect → POST /signal_effect_log → 201 (started)
  │     ├── apply()      → override(payload) → calls++ (=1) → throw
  │     ├── _markEffect  → PATCH outcome='failure'
  │     └── re-throw
  └── runOnce catch
        └── sig_retry → next_visible_at = T0 + 2s = 19:40:55, attempts stays 1

assert calls === 1 PASS ✓

(test PATCH)
  PATCH /signal_queue?...&idempotency_key=eq.<idem>
    body: { next_visible_at: clientNow-1000ms }
  Server applies: updated_at = T2 (server), next_visible_at = T2 + 32s
  (server perceives the client-now-1s value as 32 seconds in its OWN future)

runOnce#2 (server time T3 ≈ T0 + ~0.5s)
  ├── sig_claim → WHERE status='pending' AND next_visible_at <= now()
  │     → next_visible_at (server-future +30s) > now() → 0 rows matched
  │     → returns [] (no lease)
  └── (no _dispatch, no apply call)

assert calls === 2 FAIL ✗ (calls stuck at 1; second attempt never ran)
```

## 3. Exact fix

**One line in `js/signals_runtime.test.js` + a comment explaining why.**

```diff
       // Force the row visible immediately so we can drain attempt #2.
-      // (We do this by directly resetting next_visible_at.)
+      // We use Unix epoch (1970-01-01) instead of `new Date(Date.now()-1000)`
+      // because the browser clock can drift from the Supabase server clock
+      // by tens of seconds. sig_claim compares next_visible_at <= now()
+      // against the SERVER clock, so a "1 second ago" client timestamp can
+      // be tens of seconds in the server's future and silently make the
+      // row unclaimable. Epoch zero is always in the past for any sane
+      // server clock — clock-skew-immune.
       await sbFetch(`/signal_queue?signal_type=eq.${encodeURIComponent(TYPE)}`
         + `&idempotency_key=eq.${encodeURIComponent(idem)}`,
         { method: 'PATCH',
           headers: { 'Prefer': 'return=minimal' },
-          body: JSON.stringify({ next_visible_at: new Date(Date.now()-1000).toISOString() }) });
+          body: JSON.stringify({ next_visible_at: new Date(0).toISOString() }) });
```

**No runtime changes.** No DB changes. No version bump (the file isn't
`<script>`-tagged; Michael's `fetch(..., {cache:'reload'})` picks it up
once Cloudflare publishes the new commit).

## 4. Live verification (executed via Supabase MCP)

| Probe | Expectation | Result |
| --- | --- | --- |
| Empirical `_backoffSecs(1)` (Node) | returns `2` every time (jitter range collapses to 0 because `floor(2/4)=0`) | ✅ 20/20 samples = 2 |
| Empirical `_backoffSecs(5)` (Node) | returns 32–39 | ✅ 20/20 samples in [32, 39] |
| Owner JWT `UPDATE signal_queue SET next_visible_at = to_timestamp(0)` on the live failing row, then restore | RLS permits PATCH; `next_visible_at <= now()` becomes true | ✅ permitted; row restored to pre-state |
| RUN_ID decode `mp8r536l` (`parseInt('mp8r536l',36)`) | clock-skew evidence | ✅ `2026-05-16T19:41:24.957Z` vs server `enqueued_at` 19:40:53.025Z = 31.9s skew |

## 5. Post-fix expected lifecycle

```
runOnce#1 — unchanged (calls=1, sig_retry sets next_visible_at = T0+2s)
assert calls === 1 PASS ✓

(test PATCH — now clock-skew-immune)
  PATCH /signal_queue?... body: { next_visible_at: '1970-01-01T00:00:00.000Z' }
  Server: next_visible_at = epoch, definitely <= now()

runOnce#2
  ├── sig_claim → finds row visible → attempts: 1 → 2, status='leased'
  ├── _dispatch
  │     ├── _claimEffect → POST /signal_effect_log → 409 (23505)
  │     │      └── Session 47 fix: existing outcome='failure'
  │     │          → _markEffect reset to 'started'
  │     │          → return true (allow retry)
  │     ├── apply()    → override(payload) → calls++ (=2) → throw
  │     ├── _markEffect → PATCH outcome='failure'
  │     └── re-throw
  └── runOnce catch
        └── attempts (2) >= max_attempts (2) → deadLetter
            → row status='dead', signal_dead_letter row appended

assert calls === 2 PASS ✓
assert status === 'dead' PASS ✓
```

## 6. Preserved invariants

- **Replay semantics**: `_claimEffect` still returns `false` only for
  `outcome='success'`. Single-success guarantee intact.
- **Deterministic execution**: no runtime change; queue/lease/retry math
  identical to Session 47.
- **Queue behavior**: `sig_claim` / `sig_finalize` / `sig_retry` /
  `sig_dead_letter` RPCs untouched.
- **Dead-letter behavior**: unchanged; this fix unblocks the existing
  path that was previously masked by the silent claim-miss.
- **Metrics integrity**: `COUNTERS` unchanged. `effects_skipped_replay`
  still increments only on the genuine-replay path.
- **RLS**: no policy or grant changes since Session 46.

## 7. Browser re-run (agent has no browser)

Same authenticated context as Sessions 43–47. In DevTools console on
`https://accent-os.pages.dev` after Cloudflare publishes the next merge
to main:

```js
// Force fresh fetch — bypasses both browser cache and CF edge cache
// (the test file isn't versioned; Cloudflare invalidates on deploy).
await fetch('js/signals_runtime.test.js', { cache: 'reload' })
  .then(r => r.text()).then(t => (0, eval)(t));

// (Optional) stop any background worker from a prior session
if (window.SIGNALS && typeof SIGNALS.stopWorker === 'function') SIGNALS.stopWorker();

console.log('pre',  await window.SIGNALS.metrics().then(m => m.snapshot));
const results = await SIGNALS_TESTS.runAll();
console.table(results);   // expect 5/5 ok:true
console.log('post', await window.SIGNALS.metrics().then(m => m.snapshot));
```

Expected `console.table` output:

| name | ok |
| --- | --- |
| enqueue+dedup | true |
| unknown→dead-letter | true |
| claim+dispatch+finalize | true |
| retry→dead-letter | **true** ← previously failed |
| metrics surface | true |

If `retry→dead-letter` still fails, the new test file didn't reach the
browser. The test isn't `<script>`-tagged, so versioning won't bust
caches; either wait ~60s for Cloudflare to invalidate, or append a
cache-bust query string: `fetch('js/signals_runtime.test.js?v=48',
{cache:'reload'})`.

## 8. Remaining risks

1. **Browser/server clock skew is a real environmental property.** Other
   client-clock-derived timestamps sent to the server may exhibit the
   same hazard. The only such site in the signals stack was the one PATCH
   fixed here. Future producers should prefer relative durations (e.g.,
   `now() + interval ...` in SQL functions, or `make_interval()`) over
   client-computed absolute timestamps.
2. **No new automated check** prevents reintroducing
   `new Date(Date.now()-N)` in test PATCHes. A lint rule could catch
   this but is out of scope.
3. **M47 RLS aliasing bug** (Session 46 §8.1) still outstanding — out
   of scope.
4. **Test residue accumulation** in `signal_queue` /
   `signal_effect_log` / `signal_dead_letter` with `idempotency_key
   LIKE 't\_%'` — still no GC. Inert (handler routing to no-op on
   non-matching `run_id` keeps real side effects from firing).

## 9. Clean pause

- **Branch:** `claude/prove-ui-runtime-m49-jTw1O`
- **Pre-fix commit:** `2129e49`
- **Pending commit:**
  - `js/signals_runtime.test.js` — one-line PATCH body change + comment.
  - `docs/runtime/SESSION_48_RETRY_FINALIZATION.md` — this report.
- **DB changes:** none.
- **Runtime status:** all known failure paths fixed at code level;
  pending live browser re-run.
- **Remaining blockers:** §8.3 (M47), §7 (browser re-run only).

## 10. Next safest move

After merging this commit to main:
1. Wait ~1 minute for Cloudflare to publish.
2. Michael runs §7 snippet in authenticated Owner tab.
3. Expects 5/5 PASS. Pastes `console.table(results)` into a new §11
   "Live re-run results" heading in this file.
4. If 5/5 green: open a new session for the M47 RLS audit (Session 46
   §8.1) and optionally a third session for `t_%` test-residue GC.
