#!/usr/bin/env bash
# scripts/efficiency-aggregate.sh
# Cross-session aggregator for skills/efficiency-monitor.
# Parses efficiency-log.md, updates skill-candidates.md with running counts
# and promotion status. Idempotent: rebuilds skill-candidates.md from scratch
# each run (active section only — BUILT entries preserved).
#
# Triggered by: Stop hook in .claude/settings.json, or manually:
#   bash scripts/efficiency-aggregate.sh

set -euo pipefail
cd "$(dirname "$0")/.."

LOG="skills/efficiency-monitor/efficiency-log.md"
CAND="skills/efficiency-monitor/skill-candidates.md"
THRESH="skills/efficiency-monitor/_thresholds.md"

if [[ ! -f "$LOG" ]]; then
  echo "efficiency-aggregate: no log file at $LOG, skipping"
  exit 0
fi

# Preserve any existing "Built / archived" section before overwrite
ARCHIVE_BLOCK=""
if [[ -f "$CAND" ]]; then
  ARCHIVE_BLOCK=$(awk '
    /^## Built \/ archived/ { found=1 }
    found { print }
  ' "$CAND")
fi
# Default if missing or empty (header-only counts as empty)
ARCHIVE_LINES=$(printf '%s' "$ARCHIVE_BLOCK" | grep -v '^$' | grep -cv '^## Built' || true)
if [[ -z "$ARCHIVE_BLOCK" || "${ARCHIVE_LINES:-0}" -eq 0 ]]; then
  ARCHIVE_BLOCK=$'## Built / archived\n\n_(none yet)_'
fi

# Count sessions in log (each "## [date" header = one session)
SESSION_COUNT=$(grep -c '^## \[' "$LOG" 2>/dev/null) || SESSION_COUNT=0

# Extract recurring-sequence patterns and count sessions they appear in.
# A pattern line looks like: "- [stepA → stepB → stepC] ×N"
# We hash by the bracketed pattern; count how many sessions reference it.
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

# For each session block, extract unique patterns (one per line) into a session-tagged file
awk '
  /^## \[/ { sid++; next }
  /^### Recurring sequences/ { in_rs=1; next }
  /^### / { in_rs=0; next }
  in_rs && /^- \[/ {
    match($0, /\[[^]]+\]/)
    if (RSTART) {
      pat = substr($0, RSTART+1, RLENGTH-2)
      mult = 1
      if (match($0, /×[0-9]+/)) {
        mult = substr($0, RSTART+2, RLENGTH-2) + 0
      }
      print sid "\t" pat "\t" mult
    }
  }
' "$LOG" > "$TMPDIR/patterns.tsv"

# For skill-bypass: capture matched-skill references per session
awk '
  /^## \[/ { sid++; next }
  /^### Skill bypass/ { in_sb=1; next }
  /^### / { in_sb=0; next }
  in_sb && /matched-skill:/ {
    sub(/^[ \t]*matched-skill:[ \t]*/, "")
    print sid "\t" $0
  }
' "$LOG" > "$TMPDIR/bypass.tsv"

# Build candidate table: pattern -> session_count, total_occurrences
{
  echo "# efficiency-monitor — Skill Candidates"
  echo ""
  echo "> Auto-rebuilt by \`scripts/efficiency-aggregate.sh\` each session end. Manual edits will be overwritten."
  echo ">"
  echo "> Promotion ladder: OBSERVED → CANDIDATE → PROMOTE → BUILT (see \`_thresholds.md\`)."
  echo ""
  echo "## Status legend"
  echo ""
  echo "- **OBSERVED** — seen once, watching"
  echo "- **CANDIDATE** — meets initial threshold, tracking actively"
  echo "- **PROMOTE** — ready to ship, recommend running \`skill-forge\`"
  echo "- **BUILT** — real skill exists; archived for reference"
  echo ""
  echo "---"
  echo ""
  echo "_Last aggregated: $(date -u +'%Y-%m-%d %H:%M UTC') · $SESSION_COUNT session(s) in log_"
  echo ""
  echo "## Active candidates"
  echo ""

  if [[ ! -s "$TMPDIR/patterns.tsv" ]]; then
    echo "_(none yet — no recurring sequences logged)_"
  else
    # Aggregate: pattern -> distinct session count
    awk -F'\t' '{print $2}' "$TMPDIR/patterns.tsv" | sort -u | \
    while read -r pattern; do
      # Distinct session count for this pattern
      sessions=$(awk -F'\t' -v p="$pattern" '$2==p {s[$1]=1} END{n=0; for(k in s)n++; print n}' "$TMPDIR/patterns.tsv")
      # Total occurrences = sum of multipliers across all sessions
      total=$(awk -F'\t' -v p="$pattern" '$2==p {c+=$3} END{print c+0}' "$TMPDIR/patterns.tsv")

      # Step count for time-saved estimate (count " → " separators + 1)
      step_count=$(awk -v p="$pattern" 'BEGIN{n=split(p,a," → "); print n}')
      time_saved_min=$(awk -v t="$total" -v s="$step_count" 'BEGIN{printf "%.1f", t*s*0.5}')

      # Determine status
      if (( sessions >= 3 )) || awk -v tm="$time_saved_min" 'BEGIN{exit !(tm > 10)}'; then
        status="**PROMOTE**"
      elif (( total >= 3 )) || (( sessions >= 2 )); then
        status="**CANDIDATE**"
      else
        status="OBSERVED"
      fi

      echo "- $status — \`$pattern\`"
      echo "  - sessions: $sessions · occurrences: $total · est. saved if skill existed: ${time_saved_min} min"
      if [[ "$status" == "**PROMOTE**" ]]; then
        echo "  - **action:** run \`skill-forge\` to build this"
      fi
    done
  fi

  echo ""
  echo "## Skill-bypass watchlist"
  echo ""
  if [[ ! -s "$TMPDIR/bypass.tsv" ]]; then
    echo "_(none yet)_"
  else
    awk -F'\t' '{print $2}' "$TMPDIR/bypass.tsv" | sort | uniq -c | sort -rn | \
      awk '{cnt=$1; $1=""; sub(/^ /,""); printf "- `%s` — bypassed %d time(s)\n", $0, cnt}'
  fi

  echo ""
  echo "$ARCHIVE_BLOCK"
} > "$CAND"

echo "efficiency-aggregate: rebuilt $CAND ($SESSION_COUNT session(s) processed)"
