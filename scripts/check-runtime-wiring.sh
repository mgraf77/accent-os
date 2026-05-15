#!/usr/bin/env bash
# scripts/check-runtime-wiring.sh
# Verify that the minimal SIGNALS runtime is wired into the app safely.
#
# Checks:
#   1. Producer adapters exist and export the queue* functions.
#   2. Effect implementations exist (catalog/inventory/pricing FromSignal).
#   3. Producers degrade gracefully when SIGNALS is unavailable.
#   4. No direct misuse of signal_queue from non-runtime callers.
#   5. Metrics/visibility surface (panel) exists.
#   6. index.html loads runtime → producers → panel in correct order.

set -u
cd "$(dirname "$0")/.."

PASS=0
FAIL=0
WARN=0

ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; PASS=$((PASS+1)); }
bad()  { printf '  \033[31m✗\033[0m %s\n' "$1"; FAIL=$((FAIL+1)); }
warn() { printf '  \033[33m!\033[0m %s\n' "$1"; WARN=$((WARN+1)); }
hdr()  { printf '\n\033[1m%s\033[0m\n' "$1"; }

PROD=js/signals_producers.js
RT=js/signals_runtime.js
PNL=js/signals_panel.js
IDX=index.html

hdr "[1] Producer adapters wired"
for f in queueCatalogUpsert queueInventorySync queuePricingUpdate; do
  if grep -q "window\\.$f" "$PROD" 2>/dev/null; then ok "exports $f"; else bad "missing producer: $f"; fi
done

hdr "[2] Effect implementations registered"
for f in catalogUpsertFromSignal inventoryLevelSyncFromSignal pricingUpdateFromSignal; do
  if grep -q "window\\.$f" "$PROD" 2>/dev/null; then ok "installs $f"; else bad "missing effect: $f"; fi
done

hdr "[3] Graceful-degradation guards"
if grep -q "_runtimeAvailable" "$PROD" && grep -q "runtime_unavailable" "$PROD"; then
  ok "producers check runtime availability and bypass safely"
else
  bad "no graceful-degradation guard found in producers"
fi
if grep -q "sbConfigured" "$PROD"; then
  ok "effect impls guard on sbConfigured()"
else
  warn "effect impls do not check sbConfigured (may throw when offline)"
fi

hdr "[4] No direct queue misuse outside runtime"
# Only the runtime itself should call sig_enqueue / signal_queue / sig_claim.
MISUSE=$(grep -rln --include='*.js' -E '(/signal_queue|sig_enqueue|sig_claim|sig_finalize|sig_retry|sig_dead_letter)\b' js/ \
  | grep -v -E '^js/signals_(runtime|runtime\\.test|producers|panel)\.js$' \
  | grep -v 'signals_runtime' \
  | grep -v 'signals_runtime.test' \
  | grep -v 'signals_producers' \
  | grep -v 'signals_panel' || true)
if [ -z "$MISUSE" ]; then
  ok "no module bypasses runtime to touch signal_queue / sig_* RPCs"
else
  bad "direct queue access from non-runtime modules:"
  echo "$MISUSE" | sed 's/^/      /'
fi

hdr "[5] Metrics + visibility surface"
if grep -q "window\\.SIGNAL_PANEL" "$PNL" 2>/dev/null; then ok "SIGNAL_PANEL surface present"; else bad "missing SIGNAL_PANEL"; fi
for k in "queue_depth_pending|pending" "oldest_pending_at|oldest" "dead_letter_count|dead" "worker_running|worker"; do
  if grep -qE "$k" "$PNL"; then ok "panel surfaces: $k"; else bad "panel missing: $k"; fi
done
if grep -q "SIGNALS.metrics" "$PNL"; then ok "panel reads SIGNALS.metrics()"; else bad "panel does not read metrics RPC"; fi

hdr "[6] index.html load order"
RT_LINE=$(grep -n "signals_runtime.js"   "$IDX" | head -1 | cut -d: -f1)
PR_LINE=$(grep -n "signals_producers.js" "$IDX" | head -1 | cut -d: -f1)
PN_LINE=$(grep -n "signals_panel.js"     "$IDX" | head -1 | cut -d: -f1)
if [ -n "$RT_LINE" ] && [ -n "$PR_LINE" ] && [ -n "$PN_LINE" ] \
   && [ "$RT_LINE" -lt "$PR_LINE" ] && [ "$PR_LINE" -lt "$PN_LINE" ]; then
  ok "runtime → producers → panel ordering correct (lines $RT_LINE/$PR_LINE/$PN_LINE)"
else
  bad "load order incorrect or missing (runtime=$RT_LINE producers=$PR_LINE panel=$PN_LINE)"
fi

hdr "Summary"
printf '  passed: %d   failed: %d   warnings: %d\n' "$PASS" "$FAIL" "$WARN"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
