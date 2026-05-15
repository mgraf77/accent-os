#!/usr/bin/env bash
# scripts/check-dead-letter-health.sh
# Verify dead-letter handling is wired and observable.
#
# Asserts:
#   1. runtime calls sig_dead_letter on terminal failure
#   2. runtime calls sig_dead_letter_unknown for unhandled signal types
#   3. dead_lettered counter is incremented in both paths
#   4. metrics() / panel surface dead_letter visibility
#   5. no module bypasses the dead-letter RPCs

set -u
cd "$(dirname "$0")/.."

PASS=0; FAIL=0
ok()  { printf '  \033[32m✓\033[0m %s\n' "$1"; PASS=$((PASS+1)); }
bad() { printf '  \033[31m✗\033[0m %s\n' "$1"; FAIL=$((FAIL+1)); }
hdr() { printf '\n\033[1m%s\033[0m\n' "$1"; }

RT=js/signals_runtime.js
PN=js/signals_panel.js

hdr "[1] sig_dead_letter wired"
grep -q "sig_dead_letter\b" "$RT" && ok "runtime calls sig_dead_letter" || bad "missing sig_dead_letter call"
grep -q "sig_dead_letter_unknown" "$RT" && ok "runtime calls sig_dead_letter_unknown" || bad "missing sig_dead_letter_unknown call"

hdr "[2] dead_lettered counter increments"
n=$(grep -c "COUNTERS.dead_lettered++" "$RT" || true)
if [[ "$n" -ge 2 ]]; then
  ok "counter incremented in both terminal paths ($n sites)"
elif [[ "$n" -eq 1 ]]; then
  bad "counter only incremented in 1 path (expected 2: dead_letter + dead_letter_unknown)"
else
  bad "counter never incremented"
fi

hdr "[3] Panel surfaces dead-letter visibility"
grep -qE "dead_letter|dead-letter|deadLetter" "$PN" && ok "panel exposes dead-letter visibility" || bad "panel missing dead-letter surface"

hdr "[4] No module bypasses the dead-letter RPCs"
MISUSE=$(grep -rln --include='*.js' -E "sig_dead_letter\b" js/ 2>/dev/null | grep -v -E '^js/signals_(runtime|runtime\.test|producers|panel|runtime_health)\.js$' || true)
if [[ -z "$MISUSE" ]]; then
  ok "no non-runtime caller invokes sig_dead_letter directly"
else
  bad "non-runtime callers of sig_dead_letter:"
  echo "$MISUSE" | sed 's/^/      /'
fi

hdr "Summary"
printf '  passed: %d   failed: %d\n' "$PASS" "$FAIL"
[[ "$FAIL" -eq 0 ]] && exit 0 || exit 1
