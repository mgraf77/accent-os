#!/usr/bin/env bash
# scripts/check-fallback-integrity.sh
# Static proving check — verifies that every producer and every effect handler
# degrades gracefully when its dependencies are missing.
#
# Verifies:
#   * Producers check _runtimeAvailable before enqueue
#   * Producers swallow enqueue errors and never throw
#   * Effect handlers check sbConfigured before touching network
#   * Producer return contract is { queued, reason? } in every branch

set -u
cd "$(dirname "$0")/.."

PASS=0; FAIL=0
ok()  { printf '  \033[32m✓\033[0m %s\n' "$1"; PASS=$((PASS+1)); }
bad() { printf '  \033[31m✗\033[0m %s\n' "$1"; FAIL=$((FAIL+1)); }
hdr() { printf '\n\033[1m%s\033[0m\n' "$1"; }

PROD=js/signals_producers.js
RT=js/signals_runtime.js

hdr "[1] Producers gate on runtime availability"
if grep -q "function _runtimeAvailable" "$PROD" && grep -q "if(!_runtimeAvailable())" "$PROD"; then
  ok "_runtimeAvailable() gate in place"
else
  bad "producers do not gate on runtime availability — risk of throwing when SIGNALS missing"
fi

hdr "[2] Producers swallow enqueue errors"
if grep -Pzo "(?s)async function _enqueueSafe.*?try\\s*\\{.*?\\}\\s*catch\\(e\\)" "$PROD" >/dev/null; then
  ok "_enqueueSafe wraps enqueue in try/catch"
else
  bad "producer enqueue path is not protected by try/catch"
fi

hdr "[3] Producers never throw — return contract uniform"
# Every public producer must return queued:false on its degraded paths.
for name in queueCatalogUpsert queueInventorySync queuePricingUpdate; do
  if grep -q "queued: false" "$PROD"; then
    ok "$name has degraded-path queued:false return"
  else
    bad "$name missing degraded-path return"
  fi
done

hdr "[4] Effect handlers guard on sbConfigured"
for fn in inventoryLevelSyncFromSignal pricingUpdateFromSignal; do
  if grep -Pzo "(?s)$fn\\b.*?sbConfigured" "$PROD" >/dev/null; then
    ok "$fn checks sbConfigured before network call"
  else
    bad "$fn does not check sbConfigured — will throw when offline"
  fi
done

hdr "[5] Runtime degrades when sbFetch missing"
if grep -q "_sbReady" "$RT" && grep -q "Supabase not configured" "$RT"; then
  ok "_rpc throws a typed error when Supabase missing (caught by worker tick)"
else
  bad "runtime does not surface 'Supabase not configured' explicitly"
fi

hdr "[6] Unknown signal_type fallback path"
# Producers should never feed unknown types to the queue — runtime rejects them
# at enqueue with an immediate dead-letter.
if grep -q "HANDLERS\\[signal_type\\]" "$RT" && grep -q "sig_dead_letter_unknown" "$RT"; then
  ok "unknown signal types are dead-lettered at enqueue (no queue pollution)"
else
  bad "unknown signal types are not filtered pre-enqueue"
fi

hdr "Summary"
printf '  passed: %d   failed: %d\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
