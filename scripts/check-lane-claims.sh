#!/usr/bin/env bash
# scripts/check-lane-claims.sh
# Reports on active lanes recorded in .orchestration/lanes.json.
# Visibility-only: detects collisions, stale lanes, and missing dependencies.
# Does NOT modify lanes.json, does NOT block commits, does NOT auto-resolve.
#
# Source spec: PARALLEL_EXECUTION_GOVERNANCE.md §2 + docs/LANE_REGISTRY.md
#
# Exit codes:
#   0  no collisions detected (warnings may still print)
#   1  collision detected (same file owned by >1 active lane)
#   2  malformed lanes.json or missing prerequisite

set -euo pipefail
cd "$(dirname "$0")/.."

LANES_FILE=".orchestration/lanes.json"
STALE_DAYS="${LANE_STALE_DAYS:-7}"

if [[ ! -f "$LANES_FILE" ]]; then
  echo "lane-claims: no $LANES_FILE present — nothing to check."
  echo "             (this is normal until the first lane is registered)"
  exit 0
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "FAIL: jq not installed (required to parse $LANES_FILE)" >&2
  exit 2
fi

if ! jq -e '.lanes' "$LANES_FILE" >/dev/null 2>&1; then
  echo "FAIL: $LANES_FILE missing top-level .lanes array" >&2
  exit 2
fi

active_count=$(jq '[.lanes[] | select(.status == "in_progress" or .status == "open" or .status == "claimed")] | length' "$LANES_FILE")

echo "lane-claims report"
echo "──────────────────"
echo "  lanes file:     $LANES_FILE"
echo "  active lanes:   $active_count"
echo

# 1. Print active lane summary
jq -r '
  .lanes[]
  | select(.status == "in_progress" or .status == "open" or .status == "claimed")
  | "  - \(.lane_id)  agent=\(.agent)  branch=\(.branch)  corridor=\(.corridor)  status=\(.status)  files_owned=\(.files_owned | length)"
' "$LANES_FILE"
echo

# 2. Collision detection — any file appearing in files_owned of >1 active lane
collisions=$(jq -r '
  [ .lanes[]
    | select(.status == "in_progress" or .status == "open" or .status == "claimed")
    | {lane_id, file: .files_owned[]}
  ]
  | group_by(.file)
  | map(select(length > 1))
  | .[]
  | "COLLISION  file=\(.[0].file)  lanes=\([.[].lane_id] | join(","))"
' "$LANES_FILE")

if [[ -n "$collisions" ]]; then
  echo "$collisions"
  echo
  echo "FAIL: at least one file is claimed by multiple active lanes."
  echo "Authorized response:"
  echo "  - The newer lane MUST escalate (write human_required: true relay packet)."
  echo "  - Do not auto-merge or 'best effort' rebase. See AUTONOMOUS_HANDOFF_PROTOCOL_V1.md §6."
  exit 1
fi

# 3. Stale lanes (started > STALE_DAYS ago, still active)
now_epoch=$(date -u +%s)
stale=$(jq -r --argjson now "$now_epoch" --argjson maxdays "$STALE_DAYS" '
  .lanes[]
  | select(.status == "in_progress" or .status == "open" or .status == "claimed")
  | select(.started_at != null)
  | . as $l
  | (($l.started_at | sub("\\.[0-9]+Z$"; "Z") | fromdateiso8601) // 0) as $ts
  | select($ts > 0 and (($now - $ts) > ($maxdays * 86400)))
  | "STALE      \($l.lane_id)  started=\($l.started_at)  agent=\($l.agent)"
' "$LANES_FILE" 2>/dev/null || true)

if [[ -n "$stale" ]]; then
  echo "$stale"
  echo "  (lanes older than ${STALE_DAYS}d should be re-confirmed or expired)"
  echo
fi

# 4. Dangling depends_on references
dangling=$(jq -r '
  . as $root
  | .lanes[]
  | . as $l
  | ($l.depends_on // [])[]
  | . as $dep
  | select( ([$root.lanes[].lane_id] | index($dep)) == null )
  | "DEP-MISS   lane=\($l.lane_id)  missing_depends_on=\($dep)"
' "$LANES_FILE")

if [[ -n "$dangling" ]]; then
  echo "$dangling"
  echo
fi

echo "OK: no collisions across active lanes."
exit 0
