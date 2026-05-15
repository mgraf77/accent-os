#!/usr/bin/env bash
# scripts/check-signal-ownership.sh — verify one owner per signal family.
#
# Checks:
#   - declared owners in .orchestration/forbidden_runtime_patterns.json
#     are the only files registering handlers for that signal
#   - no duplicate handlers for the same signal in the owner file
#   - no duplicate listeners across files for owned signals
#   - no synonym signal families coexist in the tree
#
# Report-only. Exit code: always 0.

set -uo pipefail
cd "$(dirname "$0")/.."

CONF=".orchestration/forbidden_runtime_patterns.json"
[[ -f "$CONF" ]] || { echo "signal-ownership: missing $CONF"; exit 0; }

bold() { printf '\033[1m%s\033[0m\n' "$*"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$*"; }
ok()   { printf '  \033[32mok\033[0m %s\n' "$*"; }
dim()  { printf '\033[2m%s\033[0m\n' "$*"; }

have_jq=0
command -v jq >/dev/null 2>&1 && have_jq=1

bold "Signal ownership scan"
echo

findings=0

if (( ! have_jq )); then
  dim "  (jq missing — install jq for full ownership checks)"
  exit 0
fi

# 1) one owner per signal family
bold "Declared signal owners"
mapfile -t signals < <(jq -r '.signal_owners | keys[]?' "$CONF")
for sig in "${signals[@]}"; do
  owner=$(jq -r ".signal_owners[\"$sig\"]" "$CONF")
  # find any file referencing the signal by literal name
  refs=$(grep -rEln "['\"]${sig}['\"]" js/ worker/ scripts/ 2>/dev/null | sort -u)
  ref_count=$(echo "$refs" | grep -c . || true)
  if (( ref_count == 0 )); then
    dim "  $sig: not referenced (owner: $owner)"
    continue
  fi
  bad=$(echo "$refs" | grep -v "^${owner}$" || true)
  if [[ -n "$bad" ]]; then
    warn "$sig owner=$owner but also referenced in:"
    while IFS= read -r b; do [[ -n "$b" ]] && echo "      $b"; done <<< "$bad"
    findings=$((findings+1))
  else
    ok "$sig owned solely by $owner"
  fi

  # duplicate handler inside owner
  if [[ -f "$owner" ]]; then
    dups=$(grep -cE "addEventListener\(['\"]${sig}['\"]" "$owner" 2>/dev/null || echo 0)
    if (( dups >= 2 )); then
      warn "$sig: $dups addEventListener calls inside $owner (duplicate handler)"
      findings=$((findings+1))
    fi
  fi
done
echo

# 2) duplicate listeners across files for ANY signal
bold "Duplicate listeners across files"
grep -rEhn "addEventListener\(['\"][a-zA-Z0-9_:.-]+['\"]" js/ worker/ scripts/ 2>/dev/null \
  | sed -E "s/.*addEventListener\(['\"]([a-zA-Z0-9_:.-]+)['\"].*/\1/" \
  | sort | uniq -c | sort -rn \
  | while read -r count name; do
      [[ -z "$name" ]] && continue
      if (( count >= 2 )); then
        files=$(grep -rEln "addEventListener\(['\"]${name}['\"]" js/ worker/ scripts/ 2>/dev/null \
                | wc -l | tr -d ' ')
        if (( files >= 2 )); then
          warn "'$name' listened in $files files ($count handlers total)"
        fi
      fi
    done
echo

# 3) synonym signal families
bold "Synonym signal families"
fam_count=$(jq -r '.signal_synonym_families | length' "$CONF")
for ((i=0; i<fam_count; i++)); do
  fam=$(jq -r ".signal_synonym_families[$i] | join(\"|\")" "$CONF")
  [[ -z "$fam" ]] && continue
  matches=$(grep -rEho "['\"](${fam})['\"]" js/ worker/ scripts/ 2>/dev/null \
            | tr -d "'\"" | sort -u)
  distinct=$(echo "$matches" | grep -c . || true)
  if (( distinct >= 2 )); then
    warn "synonyms coexist: $(echo "$matches" | tr '\n' ' ')"
    findings=$((findings+1))
  fi
done
echo

bold "Summary"
echo "  findings: $findings (report-only; non-blocking)"
exit 0
