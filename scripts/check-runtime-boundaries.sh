#!/usr/bin/env bash
# scripts/check-runtime-boundaries.sh — lightweight, report-only governance scan.
#
# Detects:
#   - feature nouns inside runtime files
#   - forbidden phrases (orchestration/workflow engine/policy engine/...)
#   - forbidden runtime imports (feature-specific modules pulled into runtime)
#   - lifecycle branch growth warnings (if/else/switch density in runtime files)
#   - duplicate signal registrations (same signal handled in >1 file)
#   - synonym signal names (families defined in forbidden_runtime_patterns.json)
#
# Output: human-readable findings to stdout.
# Exit: always 0 (visibility-first; non-blocking).
#
# Per RUNTIME_BOUNDARY_ENFORCEMENT.md + SIGNAL_RUNTIME_SIMPLICITY_GUARDRAILS.md:
# stay lightweight, no AST parsing, no platform-building. Grep only.

set -uo pipefail
cd "$(dirname "$0")/.."

CONF=".orchestration/forbidden_runtime_patterns.json"
[[ -f "$CONF" ]] || { echo "boundary-check: missing $CONF"; exit 0; }

# jq optional; fall back to grep where possible
have_jq=0
command -v jq >/dev/null 2>&1 && have_jq=1

bold() { printf '\033[1m%s\033[0m\n' "$*"; }
dim()  { printf '\033[2m%s\033[0m\n' "$*"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$*"; }
ok()   { printf '  \033[32mok\033[0m %s\n' "$*"; }

read_arr() {
  # $1=jq path. Prints one element per line.
  if (( have_jq )); then
    jq -r "$1[]?" "$CONF" 2>/dev/null
  else
    # crude fallback: pull quoted strings between the named key and next ]
    local key="${1##*.}"
    key="${key%%\[*}"
    awk -v k="\"$key\"" '
      $0 ~ k {found=1; next}
      found && /\]/ {found=0}
      found {
        while (match($0, /"[^"]*"/)) {
          s=substr($0,RSTART+1,RLENGTH-2); print s
          $0=substr($0,RSTART+RLENGTH)
        }
      }' "$CONF"
  fi
}

RUNTIME_FILES=()
while IFS= read -r f; do [[ -n "$f" ]] && RUNTIME_FILES+=("$f"); done < <(read_arr '.runtime_files')

FEATURE_NOUNS=()
while IFS= read -r f; do [[ -n "$f" ]] && FEATURE_NOUNS+=("$f"); done < <(read_arr '.forbidden_feature_nouns')

PHRASES=()
while IFS= read -r f; do [[ -n "$f" ]] && PHRASES+=("$f"); done < <(read_arr '.forbidden_phrases')

IMPORTS=()
while IFS= read -r f; do [[ -n "$f" ]] && IMPORTS+=("$f"); done < <(read_arr '.forbidden_runtime_imports')

LIFE_FILES=()
while IFS= read -r f; do [[ -n "$f" ]] && LIFE_FILES+=("$f"); done < <(read_arr '.lifecycle_branch_files')

if (( have_jq )); then
  LIFE_THRESHOLD=$(jq -r '.lifecycle_branch_threshold // 6' "$CONF")
else
  LIFE_THRESHOLD=6
fi

bold "Runtime boundary scan"
dim  "  config: $CONF  (jq=$have_jq)"
echo

findings=0

# 1) feature nouns + forbidden phrases inside runtime files
bold "Feature nouns & forbidden phrases in runtime files"
for rf in "${RUNTIME_FILES[@]}"; do
  if [[ ! -f "$rf" ]]; then
    dim "  skip (missing): $rf"
    continue
  fi
  hit=0
  for n in "${FEATURE_NOUNS[@]}" "${PHRASES[@]}"; do
    [[ -z "$n" ]] && continue
    c=$(grep -ciE "\\b${n}\\b" "$rf" 2>/dev/null || true)
    if (( c > 0 )); then
      warn "$rf: '$n' x$c"
      hit=1; findings=$((findings+1))
    fi
  done
  (( hit == 0 )) && ok "$rf clean"
done
echo

# 2) forbidden runtime imports
bold "Forbidden runtime imports"
for rf in "${RUNTIME_FILES[@]}"; do
  [[ -f "$rf" ]] || continue
  for imp in "${IMPORTS[@]}"; do
    [[ -z "$imp" ]] && continue
    if grep -qE "(require|import|from)\\b.*${imp}|${imp}\\.(js|mjs)" "$rf" 2>/dev/null; then
      warn "$rf imports '$imp'"
      findings=$((findings+1))
    fi
  done
done
echo

# 3) lifecycle branch growth warnings
bold "Lifecycle branch density (warn at >= ${LIFE_THRESHOLD})"
for rf in "${LIFE_FILES[@]}"; do
  [[ -f "$rf" ]] || { dim "  skip (missing): $rf"; continue; }
  branches=$(grep -cE '^\s*(if|else if|else|switch|case )\b' "$rf" 2>/dev/null || echo 0)
  if (( branches >= LIFE_THRESHOLD )); then
    warn "$rf: $branches branch tokens (>= ${LIFE_THRESHOLD})"
    findings=$((findings+1))
  else
    ok "$rf: $branches branches"
  fi
done
echo

# 4) duplicate signal registrations across whole tree
bold "Duplicate signal registrations (addEventListener / on(...) handlers)"
tmp_sig=$(mktemp)
grep -rEn "addEventListener\(['\"][a-zA-Z0-9_:.-]+['\"]" js/ worker/ scripts/ 2>/dev/null \
  | sed -E "s/.*addEventListener\(['\"]([a-zA-Z0-9_:.-]+)['\"].*/\1/" \
  | sort | uniq -c | sort -rn > "$tmp_sig" || true
while IFS= read -r line; do
  count=$(echo "$line" | awk '{print $1}')
  sig=$(echo "$line" | awk '{print $2}')
  [[ -z "$sig" ]] && continue
  if (( count >= 2 )); then
    # only flag if registered in >1 distinct file
    files=$(grep -rEln "addEventListener\(['\"]${sig}['\"]" js/ worker/ scripts/ 2>/dev/null | wc -l | tr -d ' ')
    if (( files >= 2 )); then
      warn "signal '$sig' registered $count times across $files files"
      findings=$((findings+1))
    fi
  fi
done < "$tmp_sig"
rm -f "$tmp_sig"
echo

# 5) synonym signal names
bold "Synonym signal families"
if (( have_jq )); then
  fam_count=$(jq -r '.signal_synonym_families | length' "$CONF")
  for ((i=0; i<fam_count; i++)); do
    fam=$(jq -r ".signal_synonym_families[$i] | join(\"|\")" "$CONF")
    [[ -z "$fam" ]] && continue
    matches=$(grep -rEho "['\"](${fam})['\"]" js/ worker/ scripts/ 2>/dev/null \
              | tr -d "'\"" | sort -u)
    distinct=$(echo "$matches" | grep -c . || true)
    if (( distinct >= 2 )); then
      warn "family [$fam] used as: $(echo "$matches" | tr '\n' ' ')"
      findings=$((findings+1))
    fi
  done
else
  dim "  (jq missing — skipping synonym scan)"
fi
echo

bold "Summary"
echo "  findings: $findings (report-only; non-blocking)"
exit 0
