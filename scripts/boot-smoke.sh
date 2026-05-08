#!/usr/bin/env bash
# scripts/boot-smoke.sh — verify Claude Code AUTO-EXECUTE chain references resolve.
#
# Walks every file path the .claude/CLAUDE.md boot chain (step 1 vibe-speak
# activation + step 6 status script) and the Stop hook in .claude/settings.json
# expects to exist. Validates settings.json is well-formed JSON.
#
# Exit codes:
#   0 — all required refs resolve (warnings on optional logs are OK)
#   1 — at least one required ref is missing or settings.json is invalid
#
# Used by:
#   - .github/workflows/boot-smoke.yml          (hard gate, blocks broken PRs)
#   - .claude/settings.json SessionStart hook   (advisory, runs `|| true`)
#
# Run manually: bash scripts/boot-smoke.sh

set -uo pipefail
cd "$(dirname "$0")/.."

errors=0
warnings=0

require() {
  local path="$1"
  local desc="$2"
  if [[ ! -f "$path" ]]; then
    printf 'boot-smoke ERROR: missing required file: %s (%s)\n' "$path" "$desc" >&2
    errors=$((errors + 1))
  fi
}

optional() {
  local path="$1"
  local desc="$2"
  if [[ ! -f "$path" ]]; then
    printf 'boot-smoke WARN:  optional file missing: %s (%s)\n' "$path" "$desc" >&2
    warnings=$((warnings + 1))
  fi
}

# --- Top-level docs referenced by .claude/CLAUDE.md AUTO-EXECUTE ---
require "PROMPT_LOG.md"               "step 2 logging target"
require "WORK_IN_PROGRESS.md"         "step 3 resume contract"
require "BUILD_PLAN_CLAUDE.md"        "step 4 autonomous queue"
require "BUILD_INTELLIGENCE.md"       "step 5 lessons-learned source"

# --- Skills boot chain (step 1) ---
require "skills/_index.md"                                "step 1.h skill registry"
require "skills/vibe-speak/SKILL.md"                      "step 1 default communication framework"
require "skills/vibe-speak/profiles/_default.md"          "step 1.a fallback profile"
require "skills/vibe-speak/profiles/_index.md"            "step 1.a profile index"
require "skills/vibe-speak/profiles/michael.md"           "step 1.b Michael profile"
require "skills/vibe-speak/MODES.md"                      "step 1 modes overview"
require "skills/vibe-speak/modes/vibe.md"                 "step 1.g default mode (vibe)"
require "skills/vibe-speak/session-handoff.md"            "step 1.c cross-session handoff"
require "skills/efficiency-monitor/SKILL.md"              "step 1.j efficiency-monitor activation"

# --- Optional logs (created on first use; absence is not an error) ---
optional "skills/vibe-speak/profiles/_active.md"          "active-user marker"
optional "skills/vibe-speak/feedback-log.md"              "step 1.d feedback log"
optional "skills/vibe-speak/observation-log.md"           "step 1.e observation log"
optional "skills/vibe-speak/kpi-log.md"                   "step 1.f KPI log"
optional "skills/efficiency-monitor/session-end-summary.md" "step 1.j session-end summary"
optional "skills/efficiency-monitor/efficiency-log.md"    "Stop-hook aggregator input"

# --- Scripts ---
require "scripts/status.sh"                "CLAUDE.md step 6"
require "scripts/efficiency-aggregate.sh"  "Stop hook target"

# --- Claude Code config ---
require ".claude/CLAUDE.md"          "auto-instructions"
require ".claude/settings.json"      "hooks + startup config"

# Validate settings.json is well-formed JSON (uses python3, falls back to node)
if [[ -f .claude/settings.json ]]; then
  if command -v python3 >/dev/null 2>&1; then
    if ! python3 -c "import json,sys; json.load(open('.claude/settings.json'))" 2>/dev/null; then
      echo "boot-smoke ERROR: .claude/settings.json is not valid JSON" >&2
      errors=$((errors + 1))
    fi
  elif command -v node >/dev/null 2>&1; then
    if ! node -e "JSON.parse(require('fs').readFileSync('.claude/settings.json','utf8'))" 2>/dev/null; then
      echo "boot-smoke ERROR: .claude/settings.json is not valid JSON" >&2
      errors=$((errors + 1))
    fi
  fi
fi

# --- Detect lingering stale absolute paths (R-06 regression guard) ---
if grep -q "/workspaces/accent-os\|/home/user/accent-os" .claude/settings.json .claude/CLAUDE.md 2>/dev/null; then
  echo "boot-smoke ERROR: stale absolute path /workspaces/accent-os or /home/user/accent-os still present in .claude/" >&2
  errors=$((errors + 1))
fi

# --- Result ---
if (( errors > 0 )); then
  printf 'boot-smoke: FAIL — %d error(s), %d warning(s)\n' "$errors" "$warnings" >&2
  exit 1
fi

if (( warnings > 0 )); then
  printf 'boot-smoke: PASS with %d warning(s) (optional files missing)\n' "$warnings"
else
  echo 'boot-smoke: PASS — all references resolved'
fi
exit 0
