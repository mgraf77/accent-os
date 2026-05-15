#!/usr/bin/env bash
# scripts/check-relay-packet.sh
# Validates relay packets in .orchestration/relays/*.json against the V1 schema
# defined in AUTONOMOUS_HANDOFF_PROTOCOL_V1.md §2.1 and docs/RELAY_PACKET_TEMPLATE.md.
#
# Usage:
#   bash scripts/check-relay-packet.sh                 # check all packets
#   bash scripts/check-relay-packet.sh <path-to.json>  # check one packet
#
# Visibility-only: reports malformed/expired packets, does not delete or fix them.
#
# Exit codes:
#   0  all checked packets valid (or no packets present)
#   1  at least one packet failed validation
#   2  missing prerequisite (jq)

set -euo pipefail
cd "$(dirname "$0")/.."

RELAYS_DIR=".orchestration/relays"

REQUIRED_FIELDS=(
  packet_version
  id
  from_agent
  to_agent
  intent
  branch
  base_commit
  files_owned
  execution_corridor
  definition_of_done
  signature
)

ALLOWED_INTENTS="implement review verify refactor investigate document"
ALLOWED_CORRIDORS="docs-only js-additive js-modify sql-additive sql-destructive worker infra module-registry"

if ! command -v jq >/dev/null 2>&1; then
  echo "FAIL: jq not installed (required to parse relay packets)" >&2
  exit 2
fi

# Build target list
declare -a TARGETS
if [[ $# -gt 0 ]]; then
  TARGETS=("$1")
else
  if [[ ! -d "$RELAYS_DIR" ]]; then
    echo "relay-packet: no $RELAYS_DIR/ present — nothing to check."
    exit 0
  fi
  while IFS= read -r -d '' f; do
    TARGETS+=("$f")
  done < <(find "$RELAYS_DIR" -maxdepth 1 -type f -name '*.json' -print0)
fi

if [[ ${#TARGETS[@]} -eq 0 ]]; then
  echo "relay-packet: no packets found in $RELAYS_DIR/."
  exit 0
fi

now_epoch=$(date -u +%s)
fail=0
checked=0

echo "relay-packet report"
echo "───────────────────"

for packet in "${TARGETS[@]}"; do
  checked=$((checked + 1))
  errs=()

  if [[ ! -f "$packet" ]]; then
    errs+=("file not found")
  elif ! jq -e . "$packet" >/dev/null 2>&1; then
    errs+=("invalid JSON")
  else
    for field in "${REQUIRED_FIELDS[@]}"; do
      if ! jq -e --arg k "$field" 'has($k) and (.[$k] != null) and (.[$k] != "")' "$packet" >/dev/null 2>&1; then
        # files_owned / definition_of_done are arrays — verify non-empty
        if [[ "$field" == "files_owned" || "$field" == "definition_of_done" ]]; then
          if ! jq -e --arg k "$field" '.[$k] | type == "array" and length > 0' "$packet" >/dev/null 2>&1; then
            errs+=("missing or empty: $field")
          fi
        else
          errs+=("missing: $field")
        fi
      fi
    done

    # Intent must be in allowed list
    intent=$(jq -r '.intent // ""' "$packet")
    if [[ -n "$intent" ]] && ! echo " $ALLOWED_INTENTS " | grep -q " $intent "; then
      errs+=("invalid intent: $intent")
    fi

    # Corridor must be in allowed list
    corridor=$(jq -r '.execution_corridor // ""' "$packet")
    if [[ -n "$corridor" ]] && ! echo " $ALLOWED_CORRIDORS " | grep -q " $corridor "; then
      errs+=("invalid execution_corridor: $corridor")
    fi

    # packet_version must start with 1.
    pv=$(jq -r '.packet_version // ""' "$packet")
    if [[ -n "$pv" && "$pv" != 1.* ]]; then
      errs+=("unsupported packet_version: $pv (this script understands 1.x only)")
    fi

    # expires_at — warn (not fail) if expired
    exp=$(jq -r '.expires_at // ""' "$packet")
    if [[ -n "$exp" ]]; then
      exp_clean=$(echo "$exp" | sed 's/\.[0-9]*Z$/Z/')
      if exp_epoch=$(date -u -d "$exp_clean" +%s 2>/dev/null); then
        if [[ "$exp_epoch" -lt "$now_epoch" ]]; then
          state=$(jq -r '.state // "open"' "$packet")
          if [[ "$state" != "completed" && "$state" != "escalated" ]]; then
            errs+=("expired at $exp (state=$state)")
          fi
        fi
      fi
    fi
  fi

  pname=$(basename "$packet")
  if [[ ${#errs[@]} -eq 0 ]]; then
    echo "  OK   $pname"
  else
    fail=1
    echo "  FAIL $pname"
    for e in "${errs[@]}"; do echo "       - $e"; done
  fi
done

echo
echo "checked: $checked packet(s)"

if [[ "$fail" -ne 0 ]]; then
  echo
  echo "Authorized response:"
  echo "  - Do NOT silently fix another agent's packet."
  echo "  - The owning agent re-issues the packet, or writes an escalation."
  echo "  - Template: docs/RELAY_PACKET_TEMPLATE.md"
  exit 1
fi

echo "OK: all relay packets valid."
