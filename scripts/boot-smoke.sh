#!/usr/bin/env bash
# AccentOS Boot Smoke Test
# Verifies basic file integrity and sanity before/after sessions.
# Does NOT start a server. Does NOT run JS. Pure static checks.
# Exit code 0 = pass, 1 = fail.

set -euo pipefail
PASS=0
FAIL=0
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

pass() { echo "  ✓ $1"; PASS=$((PASS+1)); }
fail() { echo "  ✗ $1"; FAIL=$((FAIL+1)); }

echo ""
echo "═══════════════════════════════════════"
echo " AccentOS Boot Smoke — $(date '+%Y-%m-%d %H:%M')"
echo "═══════════════════════════════════════"

echo ""
echo "[ Core Files ]"
[ -f "$ROOT/index.html" ] && pass "index.html exists" || fail "index.html MISSING"
[ -f "$ROOT/wrangler.toml" ] && pass "wrangler.toml exists" || fail "wrangler.toml MISSING"
[ -f "$ROOT/worker/anthropic-proxy.js" ] && pass "worker/anthropic-proxy.js exists" || fail "worker/anthropic-proxy.js MISSING"

echo ""
echo "[ index.html Size Guard ]"
LINES=$(wc -l < "$ROOT/index.html")
if [ "$LINES" -ge 6000 ] && [ "$LINES" -le 9000 ]; then
  pass "index.html line count in range ($LINES lines)"
else
  fail "index.html line count out of expected range ($LINES — expected 6000-9000)"
fi

echo ""
echo "[ Module JS Files ]"
EXPECTED_MODULES=(customers employees knowledge_hub jobs purchase_orders calendar inventory price_book deal_optimizer)
for mod in "${EXPECTED_MODULES[@]}"; do
  [ -f "$ROOT/js/${mod}.js" ] && pass "js/${mod}.js" || fail "js/${mod}.js MISSING"
done

echo ""
echo "[ UI Foundation Files ]"
[ -d "$ROOT/ui" ] && pass "ui/ directory exists" || fail "ui/ directory MISSING"
[ -f "$ROOT/ui/tokens.css" ] && pass "ui/tokens.css" || fail "ui/tokens.css MISSING"
[ -f "$ROOT/ui/accentos-shell.css" ] && pass "ui/accentos-shell.css" || fail "ui/accentos-shell.css MISSING"
[ -f "$ROOT/ui/accentos-shell.js" ] && pass "ui/accentos-shell.js" || fail "ui/accentos-shell.js MISSING"

echo ""
echo "[ Governance Docs ]"
for doc in SYSTEM_STATE GOVERNANCE_RISKS STABILIZATION_PROTOCOL MODULE_OWNERSHIP_MAP; do
  [ -f "$ROOT/${doc}.md" ] && pass "${doc}.md" || fail "${doc}.md MISSING"
done

echo ""
echo "[ Design Docs ]"
for doc in ACCENTOS_UI_SYSTEM ACCENTOS_TOKENS ACCENTOS_LAYOUT_ARCHITECTURE ACCENTOS_MOBILE_PWA_RULES ACCENTOS_ROLE_VISIBILITY_MATRIX; do
  [ -f "$ROOT/docs/design/${doc}.md" ] && pass "docs/design/${doc}.md" || fail "docs/design/${doc}.md MISSING"
done

echo ""
echo "[ Git State ]"
GIT_STATUS=$(git -C "$ROOT" status --porcelain 2>/dev/null | wc -l | tr -d ' ')
if [ "$GIT_STATUS" -eq 0 ]; then
  pass "Working tree clean"
else
  fail "Working tree has $GIT_STATUS uncommitted change(s)"
fi

echo ""
echo "═══════════════════════════════════════"
echo " RESULT: $PASS passed, $FAIL failed"
echo "═══════════════════════════════════════"
echo ""

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
