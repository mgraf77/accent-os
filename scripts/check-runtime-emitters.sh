#!/usr/bin/env bash
# scripts/check-runtime-emitters.sh — report-only emitter ownership visibility.
#
# Counterpart to check-signal-ownership.sh. That script audits listeners;
# this one audits emitters (the dispatch side) so both ends of the signal
# bus have visibility.
#
# Checks:
#   - dispatchEvent(...) and new CustomEvent(...) call sites
#   - emitted event names without a declared owner in signal_owners
#   - emitted events with no listener anywhere in the tree
#   - listened events with no emitter anywhere in the tree
#   - owner mismatch: event emitted from a file other than declared owner
#
# Excludes:
#   - known browser/DOM/system events (configurable)
#   - known intentional orphans (configurable)
#
# Report-only. Exit code: always 0.

set -uo pipefail
cd "$(dirname "$0")/.."

CONF=".orchestration/forbidden_runtime_patterns.json"
[[ -f "$CONF" ]] || { echo "emitter-ownership: missing $CONF"; exit 0; }

bold() { printf '\033[1m%s\033[0m\n' "$*"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$*"; }
ok()   { printf '  \033[32mok\033[0m %s\n' "$*"; }
dim()  { printf '\033[2m%s\033[0m\n' "$*"; }

have_jq=0
command -v jq >/dev/null 2>&1 && have_jq=1

SEARCH_PATHS=(js worker scripts index.html)

bold "Emitter ownership scan"
echo

if (( ! have_jq )); then
  dim "  (jq missing — install jq for full emitter checks)"
  exit 0
fi

# Build exclusion sets
mapfile -t known_external < <(jq -r '.known_external_events[]?' "$CONF")
mapfile -t known_orphans  < <(jq -r '.known_orphan_emitters[]?' "$CONF")
mapfile -t declared_owners_keys < <(jq -r '.signal_owners | keys[]?' "$CONF")

is_external() {
  local name="$1"
  for e in "${known_external[@]}"; do [[ "$name" == "$e" ]] && return 0; done
  return 1
}
is_known_orphan() {
  local name="$1"
  for e in "${known_orphans[@]}"; do [[ "$name" == "$e" ]] && return 0; done
  return 1
}
has_declared_owner() {
  local name="$1"
  for e in "${declared_owners_keys[@]}"; do [[ "$name" == "$e" ]] && return 0; done
  return 1
}

# Collect emitter call sites (file:line:name)
emitter_sites=$(grep -rEhno "(dispatchEvent\(new (Custom)?Event\(['\"][a-zA-Z0-9_:.-]+['\"]|new CustomEvent\(['\"][a-zA-Z0-9_:.-]+['\"])" \
                "${SEARCH_PATHS[@]}" 2>/dev/null || true)
# With file paths
emitter_full=$(grep -rEn "(dispatchEvent\(new (Custom)?Event\(['\"][a-zA-Z0-9_:.-]+['\"]|new CustomEvent\(['\"][a-zA-Z0-9_:.-]+['\"])" \
                "${SEARCH_PATHS[@]}" 2>/dev/null || true)

# Emitter names (deduped)
emitter_names=$(echo "$emitter_full" \
  | sed -E "s/.*(dispatchEvent\(new (Custom)?Event|new CustomEvent)\(['\"]([^'\"]+)['\"].*/\3/" \
  | sort -u)

# Listener names (deduped)
listener_full=$(grep -rEn "addEventListener\(['\"][a-zA-Z0-9_:.-]+['\"]" \
                "${SEARCH_PATHS[@]}" 2>/dev/null || true)
listener_names=$(echo "$listener_full" \
  | sed -E "s/.*addEventListener\(['\"]([^'\"]+)['\"].*/\1/" \
  | sort -u)

emit_count=$(echo "$emitter_full" | grep -c . || true)
listen_count=$(echo "$listener_full" | grep -c . || true)

bold "Emitter call sites"
echo "  dispatch/CustomEvent sites: $emit_count"
echo "  addEventListener sites:     $listen_count"
echo

findings=0
orphan_emit=0
orphan_listen=0
mismatch=0
undeclared=0

bold "Custom emitted events"
if [[ -z "$emitter_names" ]]; then
  dim "  (none)"
else
  while IFS= read -r name; do
    [[ -z "$name" ]] && continue
    if is_external "$name"; then
      dim "  $name: skipped (external/system event)"
      continue
    fi

    # files that emit this name
    emit_files=$(echo "$emitter_full" \
      | grep -E "(dispatchEvent\(new (Custom)?Event|new CustomEvent)\(['\"]${name}['\"]" \
      | cut -d: -f1 | sort -u)

    # owner mismatch
    if has_declared_owner "$name"; then
      owner=$(jq -r ".signal_owners[\"$name\"]" "$CONF")
      bad=$(echo "$emit_files" | grep -v "^${owner}$" || true)
      if [[ -n "$bad" ]]; then
        warn "$name: declared owner=$owner but emitted from:"
        while IFS= read -r b; do [[ -n "$b" ]] && echo "      $b"; done <<< "$bad"
        mismatch=$((mismatch+1))
        findings=$((findings+1))
      else
        ok "$name: emitted by declared owner $owner"
      fi
    else
      if ! is_known_orphan "$name"; then
        warn "$name: no declared owner in signal_owners"
        while IFS= read -r f; do [[ -n "$f" ]] && echo "      emitted in $f"; done <<< "$emit_files"
        undeclared=$((undeclared+1))
        findings=$((findings+1))
      else
        dim "  $name: undeclared owner (known orphan, allowed)"
      fi
    fi

    # listener presence
    if ! echo "$listener_names" | grep -qx "$name"; then
      if ! is_known_orphan "$name"; then
        warn "$name: emitted but no addEventListener found"
        orphan_emit=$((orphan_emit+1))
        findings=$((findings+1))
      fi
    fi
  done <<< "$emitter_names"
fi
echo

bold "Listened events without emitter"
if [[ -z "$listener_names" ]]; then
  dim "  (none)"
else
  while IFS= read -r name; do
    [[ -z "$name" ]] && continue
    is_external "$name" && continue
    if ! echo "$emitter_names" | grep -qx "$name"; then
      if ! is_known_orphan "$name"; then
        warn "$name: addEventListener with no dispatch site"
        orphan_listen=$((orphan_listen+1))
        findings=$((findings+1))
      fi
    fi
  done <<< "$listener_names"
fi
echo

bold "Summary"
echo "  emitter sites:       $emit_count"
echo "  listener sites:      $listen_count"
echo "  orphan emitters:     $orphan_emit"
echo "  orphan listeners:    $orphan_listen"
echo "  owner mismatches:    $mismatch"
echo "  undeclared owners:   $undeclared"
echo "  findings: $findings (report-only; non-blocking)"
exit 0
