#!/usr/bin/env bash
# scripts/check-runtime-replay.sh
# Verify replay-safety primitives are in place in the canonical runtime.
#
# Replay safety relies on:
#   1. an idempotency_key composer in producers (deterministic per logical
#      operation)
#   2. a unique index on (idempotency_key, effect_type) in the DB layer
#   3. a runtime path that catches 23505 violations and treats them as
#      inert replays (no double-effect)
#   4. a counter (effects_skipped_replay) that increments on each replay
#
# Static assertions only.

set -u
cd "$(dirname "$0")/.."

PASS=0; FAIL=0; WARN=0
ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; PASS=$((PASS+1)); }
bad()  { printf '  \033[31m✗\033[0m %s\n' "$1"; FAIL=$((FAIL+1)); }
warn() { printf '  \033[33m!\033[0m %s\n' "$1"; WARN=$((WARN+1)); }
hdr()  { printf '\n\033[1m%s\033[0m\n' "$1"; }

RT=js/signals_runtime.js
PR=js/signals_producers.js

hdr "[1] Producer-side idempotency keys"
if grep -qE "idempotency_key|_idempotencyKey|_composeIdem" "$PR"; then
  ok "producer composes an idempotency key"
else
  bad "no idempotency_key composer found in producers"
fi

hdr "[2] Runtime catches 23505 (unique violation) as inert replay"
if grep -q "23505" "$RT"; then
  ok "runtime treats 23505 as replay-skip"
else
  bad "runtime does not handle 23505 unique-violation path"
fi

hdr "[3] effects_skipped_replay counter"
if grep -q "effects_skipped_replay" "$RT"; then
  ok "counter present"
else
  bad "counter missing"
fi

hdr "[4] DB-layer guarantee documented or referenced"
if grep -rqE "unique.*idempotency_key.*effect_type|idempotency_key.*effect_type.*unique|signal_effect_log" sql/ docs/ 2>/dev/null; then
  ok "DB-layer unique constraint or signal_effect_log table referenced"
else
  warn "no doc/sql reference found for (idempotency_key, effect_type) unique index — verify manually"
fi

hdr "[5] Effect-attempt log used"
if grep -q "signal_effect_log" "$RT"; then
  ok "runtime writes to signal_effect_log (idempotency barrier table)"
else
  bad "runtime does not reference signal_effect_log"
fi
if grep -qE "_claimEffect|started.*signal_effect_log" "$RT"; then
  ok "runtime claims effect via 23505-aware insert"
else
  bad "runtime missing _claimEffect / started-insert path"
fi

hdr "Summary"
printf '  passed: %d   failed: %d   warnings: %d\n' "$PASS" "$FAIL" "$WARN"
[[ "$FAIL" -eq 0 ]] && exit 0 || exit 1
