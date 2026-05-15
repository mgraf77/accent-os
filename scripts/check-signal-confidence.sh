#!/usr/bin/env bash
# check-signal-confidence.sh — verify Phase 3 signal-runtime hardening invariants
# Doctrine: deterministic, additive, no auto-suppression. This script is an
# advisory linter — exit 0 = all checks passed, exit 1 = at least one failed.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SIG="$ROOT/js/signals.js"
ALR="$ROOT/js/alerts.js"
fail=0
pass(){ printf "  \033[32mPASS\033[0m  %s\n" "$1"; }
miss(){ printf "  \033[31mFAIL\033[0m  %s\n" "$1"; fail=1; }

echo "[check-signal-confidence] verifying signals runtime…"

# 1. signals.js exists and exposes primitives
if [ ! -f "$SIG" ]; then miss "js/signals.js missing"; else pass "js/signals.js present"; fi
for fn in evaluateConfidence deriveEscalation normalizeSeverity shouldDimStale trackSignal; do
  if grep -q "window\.$fn" "$SIG" 2>/dev/null; then pass "exports $fn"; else miss "missing window.$fn export"; fi
done

# 2. Confidence is bounded [0,1] — verify clamp present
if grep -qE "Math\.max\(0,\s*Math\.min\(1," "$SIG"; then
  pass "confidence bounded to [0,1]"
else
  miss "confidence clamp Math.max(0,Math.min(1,...)) not found"
fi

# 3. payload.confidence + source_ts written by all generators
for gen in deal_stale coop_deadline quote_cold inventory_low delivery_overdue warranty_expiring showroom_expiring po_overdue score_dropped; do
  block="$(awk -v t="type:'$gen'" 'index($0,t){flag=1} flag{print; if(/^\s*\}\);\s*$/){flag=0}}' "$ALR")"
  if printf '%s' "$block" | grep -q "confidence"; then
    pass "$gen writes payload.confidence"
  else
    miss "$gen does not write payload.confidence"
  fi
  if printf '%s' "$block" | grep -q "source_ts"; then
    pass "$gen writes payload.source_ts"
  else
    miss "$gen does not write payload.source_ts"
  fi
done

# 4. No auto-suppression based on confidence
# Heuristic: confidence must not appear in a `return` / `continue` filter expression
if grep -nE "(if\s*\(.*confidence.*<).*\)\s*(return|continue)" "$ALR" "$SIG" 2>/dev/null | grep -v '//' >/tmp/_csup; then
  if [ -s /tmp/_csup ]; then
    miss "possible auto-suppression based on confidence:"
    sed 's/^/        /' /tmp/_csup
  else
    pass "no auto-suppression on confidence"
  fi
else
  pass "no auto-suppression on confidence"
fi

# 5. Escalation hooks present in render path
if grep -q "deriveEscalation\|normalizeSeverity" "$ALR"; then
  pass "escalation hooks wired into alerts render"
else
  miss "alerts.js does not call deriveEscalation/normalizeSeverity"
fi

# 6. Stale-source handling
if grep -q "shouldDimStale" "$SIG" && grep -q "source_ts" "$ALR"; then
  pass "stale-source dimming + source_ts payload present"
else
  miss "stale-source handling missing (shouldDimStale / source_ts)"
fi

# 7. Operational trust instrumentation
if grep -q "__SIGNAL_RUNTIME_HEALTH__" "$SIG"; then
  pass "window.__SIGNAL_RUNTIME_HEALTH__ exposed"
else
  miss "window.__SIGNAL_RUNTIME_HEALTH__ missing"
fi
if grep -q "trackSignal('generated'" "$ALR" && grep -q "trackSignal('dismissed'" "$ALR"; then
  pass "trackSignal called on generated + dismissed paths"
else
  miss "trackSignal not wired on generated/dismissed paths"
fi

# 8. Bell render parity — bell dropdown uses normalizeSeverity + dim + conf badge
bell_block="$(awk '/function renderAlertBell/{flag=1} flag{print; if(/^\}$/){flag=0; exit}}' "$ALR")"
if printf '%s' "$bell_block" | grep -q "_signalVisual"; then
  pass "bell dropdown invokes normalizeSeverity (via _signalVisual)"
else
  miss "bell dropdown does not invoke normalizeSeverity"
fi
if printf '%s' "$bell_block" | grep -q "opacity:0.55"; then
  pass "bell dropdown applies stale dimming"
else
  miss "bell dropdown missing stale dimming"
fi
if printf '%s' "$bell_block" | grep -q "confidence"; then
  pass "bell dropdown renders confidence badge"
else
  miss "bell dropdown missing confidence badge"
fi

# 9. Historical accuracy reducer active
if grep -q "computeHistoricalAccuracy" "$SIG"; then
  pass "computeHistoricalAccuracy defined in signals.js"
else
  miss "computeHistoricalAccuracy not defined"
fi
if grep -q "computeHistoricalAccuracy(ALERTS)" "$ALR" && grep -q "historicalAccuracy:" "$ALR"; then
  pass "historicalAccuracy path wired into generators"
else
  miss "historicalAccuracy path not wired into generators"
fi

# 10. Low-confidence spike reporter wired
if grep -q "maybeReportLowConfidenceSpike" "$ALR"; then
  pass "low-confidence spike reporter wired"
else
  miss "low-confidence spike reporter not wired"
fi

# 11. snapshot() debug surface
if grep -q "snapshot:\s*function" "$SIG"; then
  pass "__SIGNAL_RUNTIME_HEALTH__.snapshot() exposed"
else
  miss "__SIGNAL_RUNTIME_HEALTH__.snapshot() missing"
fi

# 12. Doctrine guard — no banned subsystems were added
if grep -nE "tensorflow|onnxruntime|openai|gpt-|ml-engine|workflow-engine|queue-redesign" "$SIG" "$ALR" 2>/dev/null; then
  miss "banned subsystem reference detected"
else
  pass "no banned subsystem references"
fi

echo
if [ "$fail" -eq 0 ]; then
  echo "[check-signal-confidence] OK"
  exit 0
else
  echo "[check-signal-confidence] FAILED"
  exit 1
fi
