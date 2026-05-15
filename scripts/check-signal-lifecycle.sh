#!/usr/bin/env bash
# check-signal-lifecycle.sh — Phase 2 verification
#
# Statically verifies the Signal lifecycle contract:
#   1. transitionSignal() exists with canonical signature
#   2. Only canonical lifecycle states appear in primitives
#   3. Allowed transition matrix is enforced
#   4. Invalid transitions are rejected AND logged
#   5. No code path mutates alerts.status outside transitionSignal()
#   6. Idempotency: same-state transitions short-circuit (no write)
#   7. Lifecycle audit field present (payload.lifecycle history)
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

echo "=== Signal lifecycle verification ==="

# 1. transitionSignal exists
if grep -q "async function transitionSignal" js/signals.js; then
  ok "transitionSignal() defined in js/signals.js"
else
  bad "transitionSignal() missing from js/signals.js"
fi

# 2. Canonical states only
for s in unread read dismissed actioned; do
  if grep -q "'$s'" js/signals.js; then note "state: $s"; fi
done
banned_found=0
for s in new open closed resolved acknowledged ack snoozed archived; do
  if grep -E "['\"]$s['\"]" js/signals.js >/dev/null; then
    bad "banned lifecycle synonym in signals.js: $s"
    banned_found=$((banned_found+1))
  fi
done
if [ "$banned_found" -eq 0 ]; then ok "no banned lifecycle synonyms in signals.js"; fi

# 3. Transition matrix enforced
if grep -q "ALLOWED_TRANSITIONS" js/signals.js \
   && grep -q "unread:" js/signals.js \
   && grep -q "read:" js/signals.js \
   && grep -q "dismissed:" js/signals.js \
   && grep -q "actioned:" js/signals.js; then
  ok "ALLOWED_TRANSITIONS matrix declared"
else
  bad "ALLOWED_TRANSITIONS matrix incomplete"
fi

# 4. Invalid transitions rejected + logged
if grep -q "_logRejection" js/signals.js \
   && grep -q "signal_transition_rejected" js/signals.js; then
  ok "invalid transitions rejected and logged"
else
  bad "invalid-transition rejection/logging not wired"
fi

# 5. No Signal-row status mutation outside transitionSignal.
# Scope: js/alerts.js only — other modules touch unrelated domain `.status`
# fields (POs, deliveries, UI filter state) and are out of scope here.
# Match actual writes (assignment), exclude UI filter state (`*Filter.status=`),
# exclude reads (`===`).
inline_writes=$(grep -nE "\.status[[:space:]]*=[^=]" js/alerts.js \
  | grep -v -E "Filter\.status|// allow:" || true)
if [ -z "$inline_writes" ]; then
  ok "no inline Signal-row .status assignments in js/alerts.js"
else
  bad "Signal-row .status assignments outside transitionSignal:"
  echo "$inline_writes" | sed 's/^/      /'
fi

# Verify sbUpdateAlertStatus has been removed (the pre-Phase-2 bypass path)
if grep -RIn --include='*.js' "sbUpdateAlertStatus" js/ >/dev/null; then
  bad "sbUpdateAlertStatus still referenced — must be removed (Phase 2)"
  grep -RIn --include='*.js' "sbUpdateAlertStatus" js/ | sed 's/^/      /'
else
  ok "legacy sbUpdateAlertStatus removed"
fi

# 5b. Direct PATCH /alerts must come only from sbPatchAlert (which itself is
# only callable via transitionSignal). Any other PATCH /alerts is a bypass.
patch_bypass=$(grep -RInE "method:\s*['\"]PATCH['\"]" --include='*.js' js/ \
  | grep "alerts" | grep -v "sbPatchAlert" | grep -v "js/alerts\.js:" || true)
if [ -z "$patch_bypass" ]; then
  ok "no PATCH /alerts outside sbPatchAlert transport"
else
  bad "PATCH /alerts bypass detected:"
  echo "$patch_bypass" | sed 's/^/      /'
fi

# 6. Idempotency: cur === next → return without writing
if grep -q "if(cur === nextState) return a" js/signals.js; then
  ok "idempotent same-state transitions"
else
  bad "idempotent same-state short-circuit missing"
fi

# 7. Lifecycle audit history
if grep -q "lifecycle:" js/signals.js && grep -q "from:" js/signals.js && grep -q "to:" js/signals.js && grep -q "at:" js/signals.js; then
  ok "payload.lifecycle history append (additive audit)"
else
  bad "lifecycle history append missing"
fi

# 8. UI callers route through transitionSignal
for fn in alertSetStatus alertGoTo markAllAlertsRead; do
  block=$(awk "/function $fn/,/^}/" js/alerts.js)
  if echo "$block" | grep -q "transitionSignal"; then
    note "$fn → transitionSignal"
  else
    bad "$fn does not route through transitionSignal"
  fi
done
ok "UI callers checked"

echo
echo "=== Result: ${pass} pass / ${fail} fail ==="
[ "$fail" -eq 0 ]
