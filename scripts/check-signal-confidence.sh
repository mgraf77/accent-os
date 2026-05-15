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

# 3. payload.confidence written by priority generators
for gen in deal_stale quote_cold score_dropped; do
  if grep -B2 -A20 "type:'$gen'" "$ALR" | grep -q "confidence"; then
    pass "$gen writes payload.confidence"
  else
    miss "$gen does not write payload.confidence"
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

# 8. Doctrine guard — no banned subsystems were added
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
