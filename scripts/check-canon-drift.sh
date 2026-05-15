#!/usr/bin/env bash
# scripts/check-canon-drift.sh
# Verifies SHA256 hashes of canonical files against the CANON HASHES block in CANON.md.
#
# Usage:
#   bash scripts/check-canon-drift.sh           # verify, exit non-zero on drift
#   bash scripts/check-canon-drift.sh --update  # rewrite the CANON HASHES block in place
#
# Visibility-only in Session 7: this script never edits canonical files,
# never auto-merges, never bypasses anything. It only reports drift.

set -euo pipefail
cd "$(dirname "$0")/.."

CANON_FILE="CANON.md"
BEGIN_MARK="# BEGIN CANON HASHES"
END_MARK="# END CANON HASHES"

CANONICAL_FILES=(
  "MASTER.md"
  "BUILD_INTELLIGENCE.md"
  "AI_INTERACTION_MAP.md"
  "MODULE_DEPENDENCY_AUDIT.md"
  "STARTUP_DEPENDENCY_ORDER.md"
  "module_modes.json"
)

mode="verify"
if [[ "${1:-}" == "--update" ]]; then
  mode="update"
fi

if [[ ! -f "$CANON_FILE" ]]; then
  echo "FAIL: $CANON_FILE not found" >&2
  exit 2
fi

hash_file() {
  local f="$1"
  if [[ ! -f "$f" ]]; then
    echo "MISSING"
    return
  fi
  sha256sum "$f" | awk '{print $1}'
}

# Compute current hashes
declare -a CURRENT_LINES
for f in "${CANONICAL_FILES[@]}"; do
  h=$(hash_file "$f")
  CURRENT_LINES+=("$h  $f")
done

# Extract recorded block (lines strictly between BEGIN/END markers, excluding
# comment placeholders and blanks)
recorded=$(awk -v b="$BEGIN_MARK" -v e="$END_MARK" '
  $0 == b { inside=1; next }
  $0 == e { inside=0; next }
  inside { print }
' "$CANON_FILE" | grep -vE '^[[:space:]]*#' | grep -vE '^[[:space:]]*$' || true)

if [[ "$mode" == "update" ]]; then
  tmp=$(mktemp)
  awk -v b="$BEGIN_MARK" -v e="$END_MARK" '
    $0 == b { print; print_block=1; in_block=1; next }
    $0 == e { in_block=0; print; next }
    !in_block { print }
  ' "$CANON_FILE" > "$tmp"

  # Now splice the fresh hashes between markers
  out=$(mktemp)
  awk -v b="$BEGIN_MARK" -v e="$END_MARK" -v block="$(printf '%s\n' "${CURRENT_LINES[@]}")" '
    $0 == b { print; print block; skip=1; next }
    $0 == e { skip=0; print; next }
    skip { next }
    { print }
  ' "$tmp" > "$out"
  mv "$out" "$CANON_FILE"
  rm -f "$tmp"
  echo "CANON.md hash block updated (${#CANONICAL_FILES[@]} files)."
  exit 0
fi

# Verify mode
drift=0
missing_record=0
status_lines=()

declare -A RECORDED_MAP
while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  rh=$(echo "$line" | awk '{print $1}')
  rp=$(echo "$line" | awk '{print $2}')
  RECORDED_MAP["$rp"]="$rh"
done <<< "$recorded"

# If the block is empty (just placeholders), report uninitialized but exit 0
# so visibility checks don't fail on first install.
recorded_count=${#RECORDED_MAP[@]}

for entry in "${CURRENT_LINES[@]}"; do
  cur_hash=$(echo "$entry" | awk '{print $1}')
  cur_path=$(echo "$entry" | awk '{print $2}')
  rec_hash="${RECORDED_MAP[$cur_path]:-}"
  if [[ -z "$rec_hash" ]]; then
    status_lines+=("?  $cur_path  (no recorded hash)")
    missing_record=1
  elif [[ "$cur_hash" == "MISSING" ]]; then
    status_lines+=("!  $cur_path  (file missing on disk)")
    drift=1
  elif [[ "$cur_hash" != "$rec_hash" ]]; then
    status_lines+=("D  $cur_path  recorded=${rec_hash:0:12}  actual=${cur_hash:0:12}")
    drift=1
  else
    status_lines+=("OK $cur_path")
  fi
done

echo "canon-drift report"
echo "──────────────────"
for s in "${status_lines[@]}"; do echo "  $s"; done
echo

if [[ "$recorded_count" -eq 0 ]]; then
  echo "NOTE: CANON.md hash block is uninitialized. Run with --update to populate."
  exit 0
fi

if [[ "$drift" -ne 0 ]]; then
  echo "DRIFT detected. Authorized response:"
  echo "  1. Confirm the canonical edit is intentional and has a relay packet."
  echo "  2. Run: bash scripts/check-canon-drift.sh --update"
  echo "  3. Commit CANON.md alongside the canonical change."
  exit 1
fi

if [[ "$missing_record" -ne 0 ]]; then
  echo "PARTIAL: some files lack recorded hashes. Run --update to fill them in."
  exit 0
fi

echo "OK: no canonical drift."
