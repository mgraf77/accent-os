#!/usr/bin/env bash
# scripts/status.sh — quick session boot status for AccentOS
# Run from repo root: bash scripts/status.sh

set -euo pipefail
cd "$(dirname "$0")/.."

bold() { printf '\033[1m%s\033[0m\n' "$*"; }
dim() { printf '\033[2m%s\033[0m\n' "$*"; }
hr() { printf '%s\n' "────────────────────────────────────────────────────────────"; }

bold "AccentOS — Status"
hr

# Git
bold "Git"
branch=$(git rev-parse --abbrev-ref HEAD)
last=$(git log -1 --pretty=format:'%h %s' 2>/dev/null || echo '(no commits)')
echo "  branch:     $branch"
echo "  last:       $last"
ahead_behind=$(git rev-list --left-right --count "@{upstream}...HEAD" 2>/dev/null || echo "0	0")
behind=$(echo "$ahead_behind" | cut -f1)
ahead=$(echo  "$ahead_behind" | cut -f2)
echo "  vs origin:  $ahead ahead, $behind behind"
dirty=$(git status --short | wc -l | tr -d ' ')
echo "  dirty:      $dirty file(s) uncommitted"
echo

# File sizes (split trigger at 900KB hard limit per MASTER §3)
bold "File sizes"
if [[ -f index.html ]]; then
  bytes=$(wc -c < index.html | tr -d ' ')
  kb=$(( bytes / 1024 ))
  pct=$(( bytes * 100 / 921600 ))
  echo "  index.html: ${kb}KB  (${pct}% of 900KB split trigger)"
fi
for f in MASTER.md SESSION_LOG.md BUILD_PLAN_CLAUDE.md BUILD_PLAN_MICHAEL.md BUILD_INTELLIGENCE.md; do
  [[ -f $f ]] && printf "  %-26s %s lines\n" "$f" "$(wc -l < "$f" | tr -d ' ')"
done
echo

# Build plan counts
bold "BUILD_PLAN_CLAUDE.md"
if [[ -f BUILD_PLAN_CLAUDE.md ]]; then
  done_c=$(grep -c '^- \[x\]' BUILD_PLAN_CLAUDE.md || true)
  todo_c=$(grep -c '^- \[ \]' BUILD_PLAN_CLAUDE.md || true)
  echo "  shipped:    $done_c"
  echo "  pending:    $todo_c"
  next=$(grep -m1 '^- \[ \]' BUILD_PLAN_CLAUDE.md | sed 's/^- \[ \] //' | cut -c1-90 || true)
  [[ -n ${next:-} ]] && echo "  next:       $next"
fi
echo

bold "BUILD_PLAN_MICHAEL.md"
if [[ -f BUILD_PLAN_MICHAEL.md ]]; then
  done_m=$(grep -c '^- \[x\]' BUILD_PLAN_MICHAEL.md || true)
  todo_m=$(grep -c '^- \[ \]' BUILD_PLAN_MICHAEL.md || true)
  echo "  done:       $done_m"
  echo "  pending:    $todo_m"
  echo "  pending IDs:"
  grep -E '^- \[ \] \*\*M[0-9]+\*\*' BUILD_PLAN_MICHAEL.md | sed -E 's/.*\*\*(M[0-9]+)\*\* — (.*)/    \1: \2/' | head -10 || true
fi
echo

# Tables created (heuristic from M02 SQL)
bold "Database (last known schema)"
if [[ -f sql/M02_core_schema.sql ]]; then
  table_count=$(grep -cE '^CREATE TABLE IF NOT EXISTS' sql/M02_core_schema.sql || true)
  echo "  M02 tables: $table_count defined in sql/M02_core_schema.sql"
fi
echo

# Recent session log
bold "SESSION_LOG.md (most recent 3 entries)"
if [[ -f SESSION_LOG.md ]]; then
  grep -m3 '^### ' SESSION_LOG.md | sed 's/^/  /'
fi
echo

# Governance visibility (Session 9 wiring — report-only, never blocks status)
# Each check runs in a subshell with its own error handling; non-zero exit codes
# are captured and surfaced but DO NOT propagate to this script's exit code.
bold "Governance (visibility-only)"

run_check() {
  local label="$1"
  local cmd="$2"
  local out rc
  out=$(bash -c "$cmd" 2>&1) && rc=0 || rc=$?
  case "$rc" in
    0) printf "  %-22s OK\n" "$label" ;;
    *) printf "  %-22s rc=%d (report-only, not blocking)\n" "$label" "$rc" ;;
  esac
  # One-line summary from the check's own output (last non-empty line)
  local summary
  summary=$(echo "$out" | awk 'NF{line=$0} END{print line}')
  [[ -n "$summary" ]] && echo "    └─ $summary"
}

if [[ -x scripts/check-canon-drift.sh ]]; then
  run_check "canon-drift"   "scripts/check-canon-drift.sh"
else
  echo "  canon-drift            (script not found)"
fi

if [[ -x scripts/check-lane-claims.sh ]]; then
  run_check "lane-claims"   "scripts/check-lane-claims.sh"
else
  echo "  lane-claims            (script not found)"
fi

# Relay-packet check only runs when packets exist — avoids noise pre-bootstrap.
if [[ -x scripts/check-relay-packet.sh ]]; then
  if compgen -G ".orchestration/relays/*.json" >/dev/null; then
    run_check "relay-packet"  "scripts/check-relay-packet.sh"
  else
    echo "  relay-packet           skipped (no .orchestration/relays/*.json yet)"
  fi
else
  echo "  relay-packet           (script not found)"
fi
echo

hr
dim "Tip: read SESSION_LOG.md priority queue for the next prompt to paste."
dim "Governance checks above are visibility-only — they never block commits or CI."
