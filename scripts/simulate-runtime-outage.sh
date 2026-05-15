#!/usr/bin/env bash
# scripts/simulate-runtime-outage.sh
# Removes the SIGNALS surface from window for the duration of the test,
# proves producers degrade gracefully (return {queued:false, reason:'runtime_unavailable'})
# instead of throwing and breaking caller flows.
#
# Output: browser-console snippet (paste into DevTools).

set -u
cd "$(dirname "$0")/.."
. scripts/sim/_lib.sh

hdr "Runtime outage simulation — producers under SIGNALS=undefined"
note "Goal: prove no producer throws when runtime is absent; callers still observe a result."
note "Expected: all three producers return {queued:false} and never raise."

emit_js_header "runtime-outage"
cat <<'JS'
(async () => {
  const saved = window.SIGNALS;
  window.SIGNALS = undefined;
  const results = {};
  let errors = 0;
  try {
    results.catalog   = await window.queueCatalogUpsert({ sku:'OUT-1' });
    results.inventory = await window.queueInventorySync('OUT-1', 'main');
    results.pricing   = await window.queuePricingUpdate('OUT-1', 9.99);
  } catch (e) { errors++; console.error('FAIL producer threw under outage:', e); }
  finally { window.SIGNALS = saved; }
  console.table(results);
  const allFell = Object.values(results).every(r => r && r.queued === false);
  console.assert(errors === 0, 'FAIL: a producer threw during simulated outage');
  console.assert(allFell, 'FAIL: producer returned queued:true while SIGNALS undefined');
  if (errors === 0 && allFell) console.log('[sim.outage] PASS — graceful degradation intact');
})();
JS
sep
note "If any producer threw → fallback guard is missing (see signals_producers.js _runtimeAvailable)."
note "If queued:true under SIGNALS=undefined → producer is bypassing the availability check."
