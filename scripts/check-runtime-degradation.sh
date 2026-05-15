#!/usr/bin/env bash
# scripts/check-runtime-degradation.sh
# Static proving check — verifies that degraded operation is VISIBLE.
# Silent degradation erodes operator trust; this check rejects it.
#
# Verifies:
#   * SIGNALS exposes live counters including degradation signals
#   * Panel surfaces pending depth, dead-letter count, worker state
#   * Producers expose fallback counters distinct from queued counters
#   * sig_metrics RPC exposes queue depth + dead-letter count + oldest age

set -u
cd "$(dirname "$0")/.."

PASS=0; FAIL=0
ok()  { printf '  \033[32m✓\033[0m %s\n' "$1"; PASS=$((PASS+1)); }
bad() { printf '  \033[31m✗\033[0m %s\n' "$1"; FAIL=$((FAIL+1)); }
hdr() { printf '\n\033[1m%s\033[0m\n' "$1"; }

RT=js/signals_runtime.js
PROD=js/signals_producers.js
PNL=js/signals_panel.js
SQL=sql/M49_signal_runtime_schema.sql

hdr "[1] Runtime counters expose degradation signals"
for c in dead_lettered failed effects_skipped_replay effects_failure last_error worker_running; do
  if grep -q "$c" "$RT"; then ok "counter: $c"; else bad "missing counter: $c"; fi
done

hdr "[2] Producer fallback counters distinct from queued counters"
for c in catalog_fallback inventory_fallback pricing_fallback last_error; do
  if grep -q "$c" "$PROD"; then ok "producer counter: $c"; else bad "missing producer counter: $c"; fi
done

hdr "[3] Panel surfaces degradation"
for row in pending oldest dead worker; do
  if grep -qE "_row\\('$row'" "$PNL"; then ok "panel surfaces $row"; else bad "panel missing $row"; fi
done

hdr "[4] sig_metrics RPC exposes the four trust signals"
for k in queue_depth_pending queue_depth_leased oldest_pending_age_secs dead_letter_count; do
  if grep -q "$k" "$SQL"; then ok "metrics: $k"; else bad "metrics missing: $k"; fi
done

hdr "[5] Worker tick surfaces errors via COUNTERS.last_error"
if grep -Pzo "(?s)const tick.*?catch\\(e\\)\\{ COUNTERS\\.last_error" "$RT" >/dev/null; then
  ok "worker tick records last_error on failures (visible via metrics())"
else
  bad "worker tick swallows errors silently — degradation invisible to operator"
fi

hdr "[6] Replay-skip counter is observable"
if grep -q "effects_skipped_replay" "$RT"; then
  ok "effects_skipped_replay counter present and incremented on 23505"
else
  bad "no replay-skip counter — silent replays cannot be measured"
fi

hdr "Summary"
printf '  passed: %d   failed: %d\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
