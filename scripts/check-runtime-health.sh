#!/usr/bin/env bash
# scripts/check-runtime-health.sh
# Lightweight, runtime-side health probe. Asserts that:
#   1. all 3 canonical runtime files exist
#   2. window.SIGNALS surface is fully exported
#   3. live counters block is intact
#   4. heartbeat fields are present (last_run_at, worker_running)
#   5. metrics() is defined
#
# Static check only — does not touch Supabase. Pair with
# scripts/check-runtime-wiring.sh for boot-time wiring.
# Companion runtime-side surface: window.__SIGNAL_RUNTIME_HEALTH__
# (see js/signals_runtime_health.js).

set -u
cd "$(dirname "$0")/.."

PASS=0; FAIL=0
ok()  { printf '  \033[32m✓\033[0m %s\n' "$1"; PASS=$((PASS+1)); }
bad() { printf '  \033[31m✗\033[0m %s\n' "$1"; FAIL=$((FAIL+1)); }
hdr() { printf '\n\033[1m%s\033[0m\n' "$1"; }

RT=js/signals_runtime.js
PR=js/signals_producers.js
PN=js/signals_panel.js
HL=js/signals_runtime_health.js

hdr "[1] Canonical runtime files"
for f in "$RT" "$PR" "$PN"; do
  [[ -f "$f" ]] && ok "exists: $f" || bad "missing: $f"
done
[[ -f "$HL" ]] && ok "health surface: $HL" || bad "missing health surface: $HL"

hdr "[2] window.SIGNALS surface"
for sym in enqueue claim finalize retry deadLetter runOnce startWorker stopWorker registerHandler metrics; do
  if grep -qE "(^|[ ,{])$sym(,|\b)" "$RT"; then ok "exports: $sym"; else bad "missing export: $sym"; fi
done

hdr "[3] Live counters block"
for c in enqueued claimed succeeded failed dead_lettered effects_started effects_success effects_failure effects_skipped_replay last_run_at last_error worker_running; do
  if grep -q "$c" "$RT"; then ok "counter: $c"; else bad "missing counter: $c"; fi
done

hdr "[4] Heartbeat fields"
grep -q "COUNTERS.last_run_at" "$RT" && ok "heartbeat: last_run_at written" || bad "heartbeat: last_run_at not updated"
grep -q "COUNTERS.worker_running" "$RT" && ok "heartbeat: worker_running tracked" || bad "heartbeat: worker_running not tracked"

hdr "[5] metrics() RPC"
grep -q "async function metrics" "$RT" && ok "metrics() defined" || bad "metrics() missing"
grep -q "sig_metrics" "$RT" && ok "metrics() calls sig_metrics RPC" || bad "metrics() does not call sig_metrics"

hdr "[6] Health surface contract"
if [[ -f "$HL" ]]; then
  grep -q "window.__SIGNAL_RUNTIME_HEALTH__" "$HL" && ok "exports __SIGNAL_RUNTIME_HEALTH__" || bad "health surface does not export expected global"
fi

hdr "Summary"
printf '  passed: %d   failed: %d\n' "$PASS" "$FAIL"
[[ "$FAIL" -eq 0 ]] && exit 0 || exit 1
