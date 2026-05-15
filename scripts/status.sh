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

# Runtime health (Session 36 additive block — non-blocking, summary only)
bold "Runtime health"
if [[ -f js/signals_runtime.js && -f js/signals_producers.js && -f js/signals_panel.js ]]; then
  echo "  canonical files: ✓ (runtime + producers + panel)"
else
  echo "  canonical files: ✗ MISSING ONE OF runtime/producers/panel"
fi
if [[ -f js/signals_runtime_health.js ]]; then
  echo "  health surface:  ✓ js/signals_runtime_health.js (window.__SIGNAL_RUNTIME_HEALTH__)"
else
  echo "  health surface:  ✗ missing"
fi
# Cheap static checks (do not fail status.sh on red)
for s in check-runtime-wiring.sh check-runtime-health.sh check-runtime-replay.sh check-dead-letter-health.sh check-pricing-runtime-path.sh; do
  if [[ -x scripts/$s || -f scripts/$s ]]; then
    if bash scripts/$s >/dev/null 2>&1; then
      printf "  %-34s ✓\n" "$s"
    else
      printf "  %-34s ✗ (run for detail)\n" "$s"
    fi
  fi
done
echo

# Merge readiness (sidecar reconciliation lane — Session 36)
bold "Merge readiness (sidecars)"
if [[ -f SIDECAR_RECONCILIATION_REPORT.md ]]; then
  for b in claude/harden-signal-dedupe-CsO6N claude/harden-runtime-escalation-eYOqF claude/emitter-ownership-visibility-QfOTG; do
    if git show-ref --quiet "refs/remotes/origin/$b"; then
      ahead=$(git rev-list --count "origin/main..origin/$b" 2>/dev/null || echo "?")
      printf "  %-50s %s commits ahead of main\n" "$b" "$ahead"
    fi
  done
  echo "  (see SIDECAR_RECONCILIATION_REPORT.md for disposition)"
else
  echo "  no reconciliation report present"
fi
echo

# Branch entropy (Session 36)
bold "Branch entropy"
total=$(git branch -r 2>/dev/null | grep -v HEAD | wc -l | tr -d ' ')
unmerged=$(git branch -r --no-merged origin/main 2>/dev/null | grep -v HEAD | grep -v 'origin/main$' | wc -l | tr -d ' ')
echo "  remote branches: $total total / $unmerged unmerged-vs-main"
if [[ -f OBSOLETE_BRANCH_REGISTRY.md ]]; then
  obsolete=$(grep -c '^| `[^`]*` | OBSOLETE ' OBSOLETE_BRANCH_REGISTRY.md 2>/dev/null || echo 0)
  echo "  registered OBSOLETE: $obsolete (see OBSOLETE_BRANCH_REGISTRY.md)"
fi
echo

hr
dim "Tip: read SESSION_LOG.md priority queue for the next prompt to paste."
