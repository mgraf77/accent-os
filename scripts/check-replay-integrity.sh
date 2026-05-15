#!/usr/bin/env bash
# scripts/check-replay-integrity.sh
# Static proving check — verifies the replay-protection invariants that
# guarantee at-most-once side effects.
#
# Invariants:
#   1. signal_queue has UNIQUE (signal_type, idempotency_key)
#   2. signal_effect_log has UNIQUE (idempotency_key, effect_type)
#   3. handler dispatch claims the effect log row BEFORE running apply()
#   4. duplicate-key violations (23505) are translated to inert replays
#   5. sig_enqueue uses ON CONFLICT DO UPDATE (no second insert path)
#   6. no module outside the runtime reaches into signal_effect_log directly

set -u
cd "$(dirname "$0")/.."

PASS=0; FAIL=0
ok()  { printf '  \033[32m✓\033[0m %s\n' "$1"; PASS=$((PASS+1)); }
bad() { printf '  \033[31m✗\033[0m %s\n' "$1"; FAIL=$((FAIL+1)); }
hdr() { printf '\n\033[1m%s\033[0m\n' "$1"; }

SQL=sql/M49_signal_runtime_schema.sql
RT=js/signals_runtime.js

hdr "[1] Queue uniqueness (signal_type, idempotency_key)"
if grep -Pzo "(?s)CREATE UNIQUE INDEX.*?uq_signal_queue_idem.*?signal_queue \\(signal_type, idempotency_key\\)" "$SQL" >/dev/null; then
  ok "unique index uq_signal_queue_idem present"
else
  bad "queue uniqueness index missing — duplicate enqueues would create duplicate rows"
fi

hdr "[2] Effect uniqueness (idempotency_key, effect_type)"
if grep -Pzo "UNIQUE \\(idempotency_key, effect_type\\)" "$SQL" >/dev/null; then
  ok "effect log uniqueness constraint present"
else
  bad "effect log lacks UNIQUE (idempotency_key, effect_type) — replay barrier broken"
fi

hdr "[3] Dispatch claims effect BEFORE apply()"
# _claimEffect must be awaited and gate eff.apply() execution.
if grep -Pzo "(?s)_claimEffect\\(signal, eff\\.type.*?if\\(!should\\) continue.*?eff\\.apply\\(\\)" "$RT" >/dev/null; then
  ok "_claimEffect gates apply() — replay path is inert"
else
  bad "apply() can run without claiming the effect log first — replay barrier compromised"
fi

hdr "[4] Duplicate-key (23505) is translated to inert replay"
if grep -q "23505" "$RT" && grep -q "effects_skipped_replay" "$RT"; then
  ok "23505 unique-violation translated to skip + counter increment"
else
  bad "duplicate-key violation handling missing — replays may surface as errors and re-retry"
fi

hdr "[5] sig_enqueue uses ON CONFLICT DO UPDATE"
if grep -q "ON CONFLICT (signal_type, idempotency_key)" "$SQL"; then
  ok "sig_enqueue dedup path uses ON CONFLICT"
else
  bad "sig_enqueue lacks ON CONFLICT clause — concurrent enqueue may raise"
fi

hdr "[6] No external module writes signal_effect_log directly"
EXTERNAL=$(grep -rln --include='*.js' "/signal_effect_log" js/ \
  | grep -v 'signals_runtime\.js' \
  | grep -v 'signals_runtime\.test\.js' || true)
if [ -z "$EXTERNAL" ]; then
  ok "signal_effect_log is touched only by the runtime"
else
  bad "external modules touch signal_effect_log:"; echo "$EXTERNAL" | sed 's/^/      /'
fi

hdr "[7] Worker ID is unique per session"
if grep -q "WORKER_ID = 'browser-' + Math.random" "$RT"; then
  ok "WORKER_ID randomised per session — leases attributable, no collision risk"
else
  bad "WORKER_ID generation missing or deterministic — lease ownership ambiguous"
fi

hdr "Summary"
printf '  passed: %d   failed: %d\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
