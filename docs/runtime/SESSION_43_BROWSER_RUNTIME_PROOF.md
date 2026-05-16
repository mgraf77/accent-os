# Session 43 — Browser Runtime Proof (M49 + Pricing Producer)

**Status:** BLOCKED — authenticated browser context not available in this remote agent environment.
**Date (UTC):** 2026-05-16T18:33:42Z
**Branch:** `claude/prove-ui-runtime-m49-jTw1O`
**Commit:** `d4966c7f65815ec0f379ec159ece19a3ddde45a9` (== `origin/main`)
**Tree:** clean (no uncommitted changes)

## 1. Environment reality

This session runs inside the Claude Code on the web sandbox (isolated, ephemeral
Linux container; no display, no browser, no authenticated Supabase session, no
access to the live `accent-os.pages.dev` Owner/Admin context). The objectives
("open/load the app in a real authenticated Owner/Admin browser",
"await SIGNALS_TESTS.runAll()", "set window.__SIGNALS_PRODUCER_PRICING__ = true",
"verify direct PATCH succeeds first, enqueue second, panel shows pending →
succeeded") all require a live signed-in browser tab against production
Supabase. None of those are reachable from the agent runtime.

Per the mission's explicit instruction — "If authenticated browser testing is
not available: do NOT fake it; create the report with exact blocker and the
minimum manual steps Michael must perform" — this document is the blocker
report + a deterministic manual runbook.

## 2. Static repository state verified from agent

These are the only checks possible without a browser:

| Check | Result |
| --- | --- |
| Branch tip == `origin/main` | ✅ `d4966c7` |
| Git tree clean | ✅ |
| `js/signals_runtime.js` present | ✅ 314 lines |
| `js/signals_producers.js` present | ✅ 206 lines |
| `js/signals_panel.js` present | ✅ 122 lines |
| `js/signals_runtime.test.js` present | ✅ 149 lines |
| `index.html` loads `signals_runtime.js` | ✅ line 7772 (`v=6.11.2`) |
| `index.html` loads `signals_producers.js` | ✅ line 7773 (`v=6.11.3`) |
| `index.html` loads `signals_panel.js` | ✅ line 7774 (`v=6.11.3`) |
| `index.html` loads `signals_runtime.test.js` | ❌ **NOT loaded** — must be pasted/injected manually |
| `__SIGNALS_PRODUCER_PRICING__` flag check at `js/inventory.js:509` | ✅ default OFF; opt-in per session |
| `list_price` inline-edit hook at `js/inventory.js:472` | ✅ direct PATCH first (lines 458–461), enqueue second (line 473) |
| Pricing producer effect `window.pricingUpdateFromSignal` | ✅ `js/signals_producers.js:155–174` (PATCH `/bc_products_cache?sku=eq.…`) |
| Debug panel auto-show via `?signals_debug=1` or `localStorage.signals_debug=1` | ✅ `js/signals_panel.js:23–24` |

**Important detail:** `signals_runtime.test.js` is **not** referenced in
`index.html`. To run `SIGNALS_TESTS.runAll()` Michael must either (a) paste the
file's contents into DevTools console, or (b) load it via
`fetch('js/signals_runtime.test.js').then(r=>r.text()).then(eval)` once
authenticated. This is by design — test scripts are not shipped to production.

## 3. Results table (mission-required slots)

| # | Required proof | Result | Source of truth |
| - | --- | --- | --- |
| 3.1 | Pull latest main | ✅ already at `d4966c7` | `git fetch origin main` |
| 3.2 | Confirm clean tree | ✅ | `git status` |
| 3.3 | Open app in authenticated Owner/Admin browser | ⛔ BLOCKED (no browser in agent env) | — |
| 3.4 | `await SIGNALS_TESTS.runAll()` | ⛔ BLOCKED — requires 3.3 | — |
| 3.5 | Console errors recorded | ⛔ BLOCKED — requires 3.3 | — |
| 3.6 | Runtime state before/after | ⛔ BLOCKED — requires 3.3 | — |
| 3.7 | `signal_queue` / `signal_dead_letter` post-state | ⛔ BLOCKED — requires authenticated PostgREST or SQL editor | — |
| 3.8 | Panel visibility behavior (`?signals_debug=1`) | ⛔ BLOCKED — requires 3.3 | — |
| 3.9 | Pricing producer flag flip + safe list_price edit | ⛔ BLOCKED — requires 3.3 | — |
| 3.10 | Direct PATCH succeeds first, enqueue second | ⛔ BLOCKED — wiring verified in code (`js/inventory.js:458–475`) but not exercised live | — |
| 3.11 | Panel shows pending → succeeded | ⛔ BLOCKED — requires 3.3 | — |
| 3.12 | Cleanup any test data | N/A — nothing changed | — |

## 4. Failures / blockers

**Single blocker:** No authenticated browser is available from this remote
agent environment. Everything downstream (3.3 – 3.11) cascades from that.

No code-side defects observed during the static review. M49 + M50 wiring is
intact at the commit currently on `main`.

## 5. Files changed this session

**None.** This session is read-only by design — the mission asks for a proof
report, not code changes. Only artifact written:

- `docs/runtime/SESSION_43_BROWSER_RUNTIME_PROOF.md` (this file)

## 6. Minimum manual steps Michael must perform

These are the exact, in-order steps to obtain the proof this agent cannot
gather. They are written so each step is independently re-runnable and any
failure can be recorded against the rows in §3.

### 6.A Open authenticated app

1. In Chrome (recommended): visit `https://accent-os.pages.dev`.
2. Sign in as Owner (Michael) or Admin.
3. Open DevTools → Console. Keep Network tab open in a second pane.
4. Append `?signals_debug=1` to the URL and reload, **or** in console run:
   ```js
   localStorage.setItem('signals_debug','1'); location.reload();
   ```
   Confirm the floating "signals-debug-panel" appears (top-right by default;
   defined in `js/signals_panel.js`).

### 6.B Load the test bundle (it is NOT shipped in `index.html`)

In DevTools console:
```js
await fetch('js/signals_runtime.test.js').then(r=>r.text()).then(t => (0,eval)(t));
typeof window.SIGNALS_TESTS; // expect "object"
```

### 6.C Capture pre-state

```js
// Producer + runtime counters before
JSON.parse(JSON.stringify({
  signals_live: window.SIGNALS && window.SIGNALS._counters,
  producer_counters: window.SIGNAL_PRODUCERS && window.SIGNAL_PRODUCERS._counters,
  pricing_metrics: window.__SIGNAL_RUNTIME_METRICS__ && window.__SIGNAL_RUNTIME_METRICS__.pricing
}));
// Queue/DLQ snapshot
await sbFetch('/signal_queue?select=status&limit=1000').then(r => r.reduce((a,x)=>(a[x.status]=(a[x.status]||0)+1,a),{}));
await sbFetch('/signal_dead_letter?select=id&limit=1000').then(r => r.length);
```
Screenshot or paste the output into the §3 table.

### 6.D Run the smoke suite

```js
const results = await SIGNALS_TESTS.runAll();
console.table(results);
```
Record pass/fail per row (expected: all 5 pass). Note any thrown errors.

### 6.E Pricing producer proof (controlled)

```js
// 1. Pick a test SKU that you are OK round-tripping. Read its current price.
const SKU = '<paste-test-sku>';                          // e.g. an internal test SKU
const before = await sbFetch(`/bc_products_cache?sku=eq.${encodeURIComponent(SKU)}&select=sku,price,synced_at`);
console.log('before', before);

// 2. Flip the producer flag ON for this session only (default OFF).
window.__SIGNALS_PRODUCER_PRICING__ = true;
window.__SIGNALS_PRICING_DEBUG__ = true;   // verbose console group on enqueue

// 3. Perform a list_price inline edit through the UI on that SKU
//    (Inventory tab → click the list_price cell → set to current+0.01 → blur).
//    The direct PATCH is observable in the Network tab (PATCH /bc_products_cache).
//    The enqueue is observable as a follow-up POST to /signal_queue.

// 4. Within ~10s, panel should show pending → succeeded for the pricing signal.
//    Capture metrics:
window.__SIGNAL_RUNTIME_METRICS__.pricing;
await window.SIGNALS.metrics();   // returns { live, snapshot, ... }

// 5. Cleanup: edit the same cell back to the original price (this re-runs the
//    flow in reverse, producing a second succeeded signal — that is fine and
//    leaves bc_products_cache.price at its original value).
window.__SIGNALS_PRODUCER_PRICING__ = false;
window.__SIGNALS_PRICING_DEBUG__   = false;

// 6. Verify cleanup:
await sbFetch(`/signal_queue?signal_type=eq.pricing.update.requested&order=created_at.desc&limit=5&select=id,status,attempts,created_at`);
await sbFetch(`/bc_products_cache?sku=eq.${encodeURIComponent(SKU)}&select=sku,price,synced_at`);
```

### 6.F Post-state + dead-letter check

```js
await sbFetch('/signal_queue?select=status&limit=1000').then(r => r.reduce((a,x)=>(a[x.status]=(a[x.status]||0)+1,a),{}));
await sbFetch('/signal_dead_letter?order=created_at.desc&limit=20&select=id,signal_type,reason,created_at');
```
Expected after a clean run of 6.D + 6.E:
- `signal_queue` gains a few succeeded rows (test happy-path + your 2 pricing
  edits) plus exactly one `dead` row from `testUnknownSignalDeadLetter` and one
  from `testRetryThenDeadLetter`.
- `signal_dead_letter` gains the corresponding rows.
- Production app behavior unchanged.

### 6.G Paste results back

Drop the captured outputs into the §3 table of this file, change BLOCKED rows
to PASS/FAIL, commit on this same branch (`claude/prove-ui-runtime-m49-jTw1O`),
and either merge or hand off to the next session.

## 7. Clean pause

- **Branch:** `claude/prove-ui-runtime-m49-jTw1O`
- **Commit:** `d4966c7f65815ec0f379ec159ece19a3ddde45a9` + the single doc
  commit produced by this session (see §5).
- **Tree:** clean post-commit.
- **No sidecars merged. No architecture changes. No risky writes.**

## 8. Next safest move

Run §6.A → §6.F in a signed-in browser and paste the results back into this
document on the same branch. If §6.D shows any failure, **stop** before §6.E
(pricing producer) — the runtime is the foundation; the pricing producer is
additive on top of it. Do not attempt to "fix forward" inside the runtime in
that case; capture the failing assertion + console error and open a fresh
session to triage.

If §6.D passes but §6.E shows that the enqueue races ahead of the direct
PATCH, or that the panel never transitions pending → succeeded, leave the
producer flag OFF (default) and open a fresh session — the production list_price
edit path is still safe because the direct PATCH is the durable write and the
enqueue is additive (see `js/inventory.js:467–475`).
