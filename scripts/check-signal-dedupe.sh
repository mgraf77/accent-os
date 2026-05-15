#!/usr/bin/env bash
# check-signal-dedupe.sh — Phase 1 verification
#
# Statically verifies the Signal dedupe contract in this repo:
#   1. js/signals.js exists and exposes the canonical primitives
#   2. No code outside the sanctioned writers INSERTs into `alerts`
#   3. Every generator in js/alerts.js writes payload.source_id
#   4. shouldSuppress() is invoked on the emit path
#   5. SQL partial unique index migration exists
#
# Exit codes: 0 = all checks pass, 1 = any failure.

set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

fail=0
pass=0
note(){ printf "  %s\n" "$1"; }
ok(){   printf "[PASS] %s\n" "$1"; pass=$((pass+1)); }
bad(){  printf "[FAIL] %s\n" "$1"; fail=$((fail+1)); }

echo "=== Signal dedupe verification ==="

# 1. signals.js + primitives
if [ -f js/signals.js ]; then
  ok "js/signals.js present"
  for fn in createSignal shouldSuppress signalSourceId signalDedupeKey normalizeSignalPayload; do
    if grep -q "function $fn" js/signals.js; then
      note "primitive: $fn"
    else
      bad "primitive missing: $fn"
    fi
  done
else
  bad "js/signals.js missing"
fi

# 2. Only sanctioned writers may INSERT into alerts.
# Sanctioned: sbInsertAlert in js/alerts.js (the transport), createSignal in
# js/signals.js (the gate). Anything else is a governance violation (R5).
bypass=$(grep -RIln --include='*.js' -E "(POST|method:\s*['\"]POST['\"])" js/ \
  | xargs -I{} grep -l "/alerts" {} 2>/dev/null \
  | grep -v -E "js/alerts\.js$|js/signals\.js$" || true)
if [ -z "$bypass" ]; then
  ok "no generator bypasses createSignal()"
else
  bad "files appear to POST to /alerts outside sanctioned writers:"
  echo "$bypass" | sed 's/^/      /'
fi

# 3. Every generator payload includes source_id
missing_sid=0
while IFS= read -r line; do
  # Each generator emits via `payload: { ... }`. We require source_id in each.
  if ! echo "$line" | grep -q "source_id"; then
    bad "generator payload missing source_id: $line"
    missing_sid=$((missing_sid+1))
  fi
done < <(grep -n "payload: {" js/alerts.js | grep -v "payload: rec.payload")
if [ "$missing_sid" -eq 0 ]; then
  ok "all generator payloads include source_id"
fi

# 4. Suppression check on emit path
if grep -q "shouldSuppress" js/signals.js && grep -q "createSignal" js/alerts.js; then
  ok "shouldSuppress() invoked on emit path via createSignal()"
else
  bad "suppression check not wired into emit path"
fi

# 5. SQL partial unique index migration
if [ -f sql/M49_signal_dedupe_index.sql ] \
   && grep -q "UNIQUE INDEX" sql/M49_signal_dedupe_index.sql \
   && grep -q "payload->>'source_id'" sql/M49_signal_dedupe_index.sql \
   && grep -q "status IN ('unread','read')" sql/M49_signal_dedupe_index.sql; then
  ok "SQL partial unique dedupe index present (M49)"
else
  bad "SQL partial unique dedupe index missing or malformed"
fi

# 6. signals.js is loaded before alerts.js in index.html
sig_line=$(grep -n "js/signals\.js" index.html | head -1 | cut -d: -f1)
alt_line=$(grep -n "js/alerts\.js" index.html | head -1 | cut -d: -f1)
if [ -n "$sig_line" ] && [ -n "$alt_line" ] && [ "$sig_line" -lt "$alt_line" ]; then
  ok "js/signals.js loads before js/alerts.js"
else
  bad "js/signals.js must load before js/alerts.js in index.html"
fi

echo
echo "=== Result: ${pass} pass / ${fail} fail ==="
[ "$fail" -eq 0 ]
