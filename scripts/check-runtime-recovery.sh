#!/usr/bin/env bash
# scripts/check-runtime-recovery.sh
# Static proving check — verifies the recovery primitives that let the runtime
# survive worker death, browser refresh, network partition, and DB hiccups.
#
# Verifies:
#   * sig_claim contains an expired-lease reclaim sweep (UPDATE…WHERE leased_until < now())
#   * sig_retry resets leased_by / leased_until before re-queueing
#   * runOnce catches handler errors and routes to retry vs dead-letter
#   * exponential backoff exists and is capped (no unbounded growth)
#   * stopWorker is reachable and clears the loop timer

set -u
cd "$(dirname "$0")/.."

PASS=0; FAIL=0
ok()  { printf '  \033[32m✓\033[0m %s\n' "$1"; PASS=$((PASS+1)); }
bad() { printf '  \033[31m✗\033[0m %s\n' "$1"; FAIL=$((FAIL+1)); }
hdr() { printf '\n\033[1m%s\033[0m\n' "$1"; }

SQL=sql/M49_signal_runtime_schema.sql
RT=js/signals_runtime.js

hdr "[1] sig_claim reclaims expired leases"
if grep -Pzo "(?s)UPDATE signal_queue.*?SET status = 'pending'.*?leased_until < now\\(\\)" "$SQL" >/dev/null; then
  ok "sig_claim sweeps stale leases back to pending"
else
  bad "sig_claim is missing the expired-lease reclaim sweep"
fi

hdr "[2] sig_retry clears lease before re-queue"
if grep -Pzo "(?s)CREATE OR REPLACE FUNCTION sig_retry.*?leased_until = NULL,\\s*leased_by = NULL" "$SQL" >/dev/null; then
  ok "sig_retry releases lease ownership"
else
  bad "sig_retry leaves lease fields set — workers could double-claim"
fi

hdr "[3] runOnce branches on attempts vs max_attempts"
if grep -q "attempts >= max" "$RT" && grep -q "deadLetter(sig.id" "$RT" && grep -q "retry(sig.id" "$RT"; then
  ok "runOnce routes terminal failures to dead-letter, transient to retry"
else
  bad "runOnce lacks attempts>=max branch — failures may loop forever or skip dead-letter"
fi

hdr "[4] Backoff is bounded"
# _backoffSecs must use Math.min with an explicit cap.
if grep -E "Math\\.min\\(\\s*[0-9]+" "$RT" | grep -q "Math.pow"; then
  ok "_backoffSecs caps exponential growth"
else
  bad "backoff appears unbounded — review _backoffSecs"
fi

hdr "[5] stopWorker is reachable and clears timer"
if grep -q "function stopWorker" "$RT" && grep -q "clearTimeout(_workerTimer)" "$RT"; then
  ok "stopWorker exists and tears down the loop"
else
  bad "stopWorker missing or does not clear timer — worker leak risk"
fi

hdr "[6] Worker loop guards Supabase outage"
# Top-level try/catch around runOnce inside tick keeps worker alive across RPC errors.
if grep -Pzo "(?s)const tick.*?try\\s*\\{[^}]*runOnce" "$RT" >/dev/null; then
  ok "worker tick wraps runOnce so a single RPC failure does not kill the loop"
else
  bad "worker tick does not guard runOnce — single error could halt the runtime"
fi

hdr "Summary"
printf '  passed: %d   failed: %d\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
