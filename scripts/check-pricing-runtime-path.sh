#!/usr/bin/env bash
# scripts/check-pricing-runtime-path.sh
# Verify the M50 pricing-path runtime conversion:
#   - ONE pricing mutation path routes through queuePricingUpdate()
#   - direct PATCH fallback preserved
#   - feature flag respected (default OFF)
#   - replay protection active (idempotency_key composer present)
#   - producer-side metrics surface exposed
#   - effect-completion observer installed
#
# Exits 0 on green, non-zero on any failure.

set -u
cd "$(dirname "$0")/.."

PASS=0; FAIL=0; WARN=0
ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; PASS=$((PASS+1)); }
bad()  { printf '  \033[31m✗\033[0m %s\n' "$1"; FAIL=$((FAIL+1)); }
warn() { printf '  \033[33m!\033[0m %s\n' "$1"; WARN=$((WARN+1)); }
hdr()  { printf '\n\033[1m%s\033[0m\n' "$1"; }

TARGET=js/inventory.js
PROD=js/signals_producers.js
RT=js/signals_runtime.js

hdr "[1] Pricing path converted (inventory.list_price → queue)"
if grep -q "_signalEnqueuePricingUpdate" "$TARGET"; then
  ok "converted call-site present in $TARGET"
else
  bad "no _signalEnqueuePricingUpdate hook in $TARGET"
fi
if grep -qE "field === 'list_price'" "$TARGET" && grep -q "_signalEnqueuePricingUpdate" "$TARGET"; then
  ok "enqueue gated on list_price field"
else
  bad "enqueue not properly gated on list_price"
fi
if grep -q "queuePricingUpdate" "$TARGET"; then
  ok "uses queuePricingUpdate() producer"
else
  bad "queuePricingUpdate not invoked from $TARGET"
fi

hdr "[2] Direct fallback preserved"
if grep -q "sbUpdateInventoryField" "$TARGET" && grep -q "res === false" "$TARGET"; then
  ok "direct PATCH path + revert-on-failure still present"
else
  bad "direct PATCH path appears modified — fallback at risk"
fi
# Enqueue must come AFTER the direct save (so a queue failure can't poison the
# inline edit). Verify ordering: sbUpdateInventoryField must appear before
# _signalEnqueuePricingUpdate in the same function.
DIRECT_LINE=$(grep -n "const res = await sbUpdateInventoryField" "$TARGET" | head -1 | cut -d: -f1)
ENQ_LINE=$(grep -n "_signalEnqueuePricingUpdate(item.sku" "$TARGET" | head -1 | cut -d: -f1)
if [ -n "$DIRECT_LINE" ] && [ -n "$ENQ_LINE" ] && [ "$DIRECT_LINE" -lt "$ENQ_LINE" ]; then
  ok "direct save precedes enqueue (lines $DIRECT_LINE < $ENQ_LINE)"
else
  bad "enqueue must follow direct save (direct=$DIRECT_LINE enqueue=$ENQ_LINE)"
fi
if grep -q "never break the inline edit UX" "$TARGET" \
  || grep -q "catch(e){ /\* never break" "$TARGET"; then
  ok "enqueue wrapped in try/catch — UX preserved on producer failure"
else
  warn "enqueue not visibly try/catch wrapped — confirm producer never throws"
fi

hdr "[3] Feature flag respected (default OFF)"
if grep -q "__SIGNALS_PRODUCER_PRICING__" "$TARGET"; then
  ok "feature flag window.__SIGNALS_PRODUCER_PRICING__ read at runtime"
else
  bad "feature flag not consulted"
fi
if grep -qE "__SIGNALS_PRODUCER_PRICING__ === true" "$TARGET"; then
  ok "flag check is strict (=== true), default-OFF behavior guaranteed"
else
  bad "flag check is not strict — could enable on truthy non-true values"
fi
if grep -qE "flag_off" "$TARGET"; then
  ok "flag-off path recorded as explicit fallback status"
else
  warn "no explicit flag_off status — harder to observe in production"
fi

hdr "[4] Replay protection active"
if grep -q "idempotency_key" "$TARGET"; then
  ok "idempotency_key passed to producer"
else
  bad "no idempotency_key supplied — replay protection disabled"
fi
if grep -qE "Math.floor\(Date.now\(\) ?/ ?30000\)" "$TARGET"; then
  ok "30s-bucket dedupe composer present"
else
  bad "no time-bucketed idempotency key — rapid double-commits not deduped"
fi
if grep -q "replay_skipped" "$TARGET"; then
  ok "replay-skip counter exposed in __SIGNAL_RUNTIME_METRICS__"
else
  bad "no replay_skipped metric"
fi
# Runtime-side guarantee: effect log unique index on (idempotency_key, effect_type)
if grep -q "signal_effect_log" "$RT" && grep -qE "23505|duplicate key|already exists" "$RT"; then
  ok "runtime claims effects via unique-index barrier (signal_effect_log)"
else
  bad "runtime effect-claim barrier missing"
fi

hdr "[5] Producer-side metrics surface"
if grep -q "window.__SIGNAL_RUNTIME_METRICS__" "$TARGET"; then
  ok "window.__SIGNAL_RUNTIME_METRICS__ initialized"
else
  bad "metrics global missing"
fi
for k in enqueue_attempts enqueue_success enqueue_fallback enqueue_error last_latency_ms avg_latency_ms; do
  if grep -q "$k" "$TARGET"; then ok "metric: $k"; else bad "missing metric: $k"; fi
done

hdr "[6] Effect-completion + replay-skip observer installed"
if grep -q "pricingUpdateFromSignal" "$TARGET" && grep -q "__pricingEffectObserverInstalled" "$TARGET"; then
  ok "pricing effect wrapper installed (effect-completion logs + replay counter)"
else
  bad "no pricing effect observer in $TARGET"
fi
if grep -qE "effect complete sku=" "$TARGET"; then
  ok "effect-completion debug log present (console.group)"
else
  bad "no effect-completion debug log"
fi

hdr "[7] Producer infrastructure available"
if [ -f "$PROD" ] && grep -q "window.queuePricingUpdate" "$PROD"; then
  ok "queuePricingUpdate producer present in $PROD"
else
  bad "$PROD missing or queuePricingUpdate not exported"
fi
if [ -f "$RT" ] && grep -q "pricing.update.requested" "$RT"; then
  ok "pricing.update.requested handler registered in runtime"
else
  bad "runtime handler for pricing.update.requested missing"
fi

hdr "[8] Narrowness — exactly ONE converted path"
HITS=$(grep -rln --include='*.js' "_signalEnqueuePricingUpdate(" js/ | wc -l | tr -d ' ')
if [ "$HITS" -eq 1 ]; then
  ok "exactly one module declares the converted helper ($HITS)"
else
  bad "expected 1 module with _signalEnqueuePricingUpdate, found $HITS"
fi
# Other modules that touch pricing must NOT call queuePricingUpdate yet
OTHER=$(grep -rln --include='*.js' 'queuePricingUpdate(' js/ \
  | grep -v -E '^js/(inventory|signals_producers|signals_runtime|signals_panel)\.js$' || true)
if [ -z "$OTHER" ]; then
  ok "no broad rollout — only inventory uses queuePricingUpdate"
else
  bad "queuePricingUpdate called from unexpected modules:"
  echo "$OTHER" | sed 's/^/      /'
fi

hdr "Summary"
printf '  passed: %d   failed: %d   warnings: %d\n' "$PASS" "$FAIL" "$WARN"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
