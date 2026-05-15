// ── SIGNAL WORKER ENTRY (stub) ──
// Cloudflare Worker entry point for unattended signal execution.
// NOT YET WIRED. This file documents and pre-stages the portability surface
// so the Phase 2 migration is a delta, not a rewrite.
//
// Doctrine:
//   * Rules are pure functions of (state, baselines). They run unchanged here.
//   * The browser scheduler and this worker scheduler share `_pure.computeDueCadences`.
//   * State (INVENTORY/QUOTES/VD/ECOM_*) is fetched server-side from Supabase
//     instead of being read from window globals. A `state` object is built
//     and the same rule files are reused.
//
// Worker handler (Phase 2):
//
//   export default {
//     async scheduled(event, env, ctx){
//       const state = await loadState(env);               // build globals-equivalent
//       const baselines = await loadBaselines(env);
//       const dueCadences = computeDueCadences(
//         await readLastRunMap(env),
//         { hourly: 3600000, daily: 86400000, weekly: 604800000 },
//         Date.now()
//       );
//       for (const cadence of dueCadences) {
//         await evaluateAll({ cadence, state, baselines, env });
//       }
//       await writeHeartbeat(env, /* ... */);
//     }
//   };
//
// Phase 2 deliverables to make this real (deferred from Phase 1):
//   1. Bundle js/signal_runtime.js, js/signal_engine.js, js/signal_rules_phase1.js
//      and js/signal_baselines.js as worker-portable modules. (Replace
//      `window`/`global` references with a passed `ctx` object; the existing
//      `(function(global){...})(typeof window !== 'undefined' ? window : globalThis)`
//      pattern already accommodates this.)
//   2. Replace globals-reading extractors in baselines + rules with explicit
//      ctx.INVENTORY/ctx.QUOTES/ctx.VD/ctx.ECOM_* params.
//   3. Add `loadState(env)` that pulls cached snapshots from Supabase via
//      service-role key (cf binding `SB_SERVICE_KEY`).
//   4. Wire `wrangler.toml` cron trigger: "0 * * * *" (hourly) + "15 7 * * *"
//      (daily baseline refresh).
//
// Until Phase 2 lands, the browser scheduler in `js/signal_scheduler.js` is
// the source of cadence. This file is reserved scaffolding only.

export default {
  async scheduled(event, env, ctx){
    // Intentionally a no-op stub. Wiring deferred to Phase 2.
    return new Response('signal-worker stub — not yet wired', { status: 200 });
  },
  async fetch(request){
    return new Response(JSON.stringify({
      worker: 'signals',
      status: 'stub',
      doc: 'See worker/signal_worker_entry.js header.',
    }), { headers: { 'content-type': 'application/json' } });
  },
};
