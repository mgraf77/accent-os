#!/usr/bin/env bash
# AccentOS — Operator Health Check
# Performs a live health check of all external AccentOS dependencies.
# Usage: bash scripts/health-check.sh [--json]
# Output: Human-readable status or JSON (--json flag)

WORKER_URL="https://accentos-anthropic-proxy.mgraf77.workers.dev"
PAGES_URL="https://accent-os.pages.dev"
SUPABASE_REST="https://hsyjcrrazrzqngwkqsqa.supabase.co/rest/v1"
JSON_MODE=false
[[ "${1:-}" == "--json" ]] && JSON_MODE=true

TMPDIR_CHECKS=$(mktemp -d)
trap 'rm -rf "$TMPDIR_CHECKS"' EXIT

# ── Colors ───────────────────────────────────────────────────────────────────
if [[ -t 1 ]] && ! $JSON_MODE; then
  GRN='\033[0;32m'; YEL='\033[0;33m'; RED='\033[0;31m'; BLU='\033[0;34m'
  RST='\033[0m'; BOLD='\033[1m'
else
  GRN=''; YEL=''; RED=''; BLU=''; RST=''; BOLD=''
fi
ok()   { echo -e "${GRN}✓${RST} $*"; }
warn() { echo -e "${YEL}⚠${RST} $*"; }
fail() { echo -e "${RED}✗${RST} $*"; }
info() { echo -e "${BLU}·${RST} $*"; }

write_result() {
  local name="$1" state="$2" detail="$3"
  echo "${state}|${detail}" > "$TMPDIR_CHECKS/${name}"
}

read_result() {
  local name="$1"
  cat "$TMPDIR_CHECKS/${name}" 2>/dev/null || echo "UNKNOWN|"
}

# ── Checks ───────────────────────────────────────────────────────────────────
check_worker() {
  local t0 t1 ms resp version env_key build
  t0=$(date +%s%3N)
  resp=$(curl -sf --max-time 8 "$WORKER_URL/" 2>/dev/null || echo "")
  t1=$(date +%s%3N)
  ms=$((t1 - t0))

  if [[ -z "$resp" ]]; then
    write_result worker "FAIL" "probe unreachable (network blocked or down) ${ms}ms"
    return
  fi

  version=$(echo "$resp" | grep -o '"version":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "")
  env_key=$(echo "$resp" | grep -o '"env_key_set":[^,}]*' | cut -d: -f2 | tr -d ' ' 2>/dev/null || echo "false")
  build=$(echo "$resp" | grep -o '"build":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "unknown")

  if [[ -z "$version" ]]; then
    write_result worker "FAIL" "non-JSON response ${ms}ms"
    return
  fi

  if [[ "$version" == "v3-env-fallback" && "$env_key" == "true" ]]; then
    write_result worker "HEALTHY" "v=${version} env_key=true build=${build} ${ms}ms"
  elif [[ "$version" == "v3-env-fallback" ]]; then
    write_result worker "WARN" "v=${version} env_key=false (AI needs user key) build=${build} ${ms}ms"
  else
    write_result worker "FAIL" "stale version=${version} build=${build} ${ms}ms"
  fi
}

check_pages() {
  local http_code ms t0 t1 version tmp_html
  tmp_html="$TMPDIR_CHECKS/pages.html"
  t0=$(date +%s%3N)
  http_code=$(curl -s --max-time 12 -o "$tmp_html" -w "%{http_code}" "$PAGES_URL/" 2>/dev/null)
  local curl_exit=$?
  t1=$(date +%s%3N)
  ms=$((t1 - t0))
  [[ -z "$http_code" ]] && http_code="000"

  if [[ "$http_code" == "200" ]]; then
    version=$(grep -o 'v[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*' "$tmp_html" 2>/dev/null | head -1 || echo "unknown")
    write_result pages "HEALTHY" "HTTP 200 SPA=${version} ${ms}ms"
  elif [[ "$http_code" == "000" ]]; then
    write_result pages "FAIL" "unreachable (network blocked or down) ${ms}ms"
  else
    write_result pages "FAIL" "HTTP ${http_code} ${ms}ms"
  fi
}

check_supabase() {
  local http_code ms t0 t1
  t0=$(date +%s%3N)
  # Public anon key — will get 401/403 but proves REST is responding
  http_code=$(curl -s --max-time 8 -o /dev/null -w "%{http_code}" \
    "${SUPABASE_REST}/categories?limit=1" \
    -H "apikey: public" 2>/dev/null)
  [[ -z "$http_code" ]] && http_code="000"
  t1=$(date +%s%3N)
  ms=$((t1 - t0))

  if [[ "$http_code" == "200" || "$http_code" == "401" || "$http_code" == "403" ]]; then
    write_result supabase "HEALTHY" "REST responding HTTP=${http_code} ${ms}ms"
  elif [[ "$http_code" == "000" ]]; then
    write_result supabase "FAIL" "REST unreachable (network blocked or down) ${ms}ms"
  else
    write_result supabase "WARN" "REST returned HTTP=${http_code} ${ms}ms"
  fi
}

check_git() {
  local branch ahead behind dirty state detail
  branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
  ahead=$(git rev-list --count "@{u}..HEAD" 2>/dev/null || echo "?")
  behind=$(git rev-list --count "HEAD..@{u}" 2>/dev/null || echo "?")
  dirty=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')

  if [[ "$dirty" -gt 0 ]]; then
    state="WARN"
    detail="branch=${branch} ahead=${ahead} behind=${behind} dirty=${dirty} files"
  elif [[ "$ahead" != "0" && "$ahead" != "?" ]]; then
    state="INFO"
    detail="branch=${branch} ${ahead} commit(s) unpushed (push to origin)"
  else
    state="HEALTHY"
    detail="branch=${branch} clean ahead=${ahead} behind=${behind}"
  fi
  write_result git "$state" "$detail"
}

# ── Run checks ───────────────────────────────────────────────────────────────
if ! $JSON_MODE; then
  echo ""
  echo -e "${BOLD}AccentOS Health Check${RST} · $(date '+%Y-%m-%d %H:%M:%S')"
  echo "─────────────────────────────────────────────────"
fi

check_worker &
PID_W=$!
check_pages &
PID_P=$!
check_supabase &
PID_S=$!
check_git &
PID_G=$!
wait $PID_W $PID_P $PID_S $PID_G

# ── Output ───────────────────────────────────────────────────────────────────
overall="HEALTHY"
declare -A STATE_MAP

for key in worker pages supabase git; do
  raw=$(read_result "$key")
  state="${raw%%|*}"
  detail="${raw#*|}"
  STATE_MAP[$key]="$state"

  [[ "$state" == "FAIL" ]] && overall="FAIL"
  [[ "$state" == "WARN" && "$overall" != "FAIL" ]] && overall="WARN"

  if ! $JSON_MODE; then
    label=$(printf "%-9s" "${key^^}")
    case "$state" in
      HEALTHY) ok  "$label $detail" ;;
      WARN)    warn "$label $detail" ;;
      INFO)    info "$label $detail" ;;
      FAIL)    fail "$label $detail" ;;
      *)       info "$label $detail" ;;
    esac
  fi
done

if $JSON_MODE; then
  cat <<EOF
{
  "ts": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "overall": "${overall}",
  "worker":   {"state": "${STATE_MAP[worker]:-UNKNOWN}", "detail": "$(read_result worker | cut -d'|' -f2)"},
  "pages":    {"state": "${STATE_MAP[pages]:-UNKNOWN}",  "detail": "$(read_result pages  | cut -d'|' -f2)"},
  "supabase": {"state": "${STATE_MAP[supabase]:-UNKNOWN}", "detail": "$(read_result supabase | cut -d'|' -f2)"},
  "git":      {"state": "${STATE_MAP[git]:-UNKNOWN}",    "detail": "$(read_result git    | cut -d'|' -f2)"}
}
EOF
else
  echo "─────────────────────────────────────────────────"
  case "$overall" in
    HEALTHY) ok  "OVERALL: All systems operational" ;;
    WARN)    warn "OVERALL: Degraded — review warnings above" ;;
    FAIL)    fail "OVERALL: One or more systems down — see FAILURE_RECOVERY_PATHS.md" ;;
  esac
  echo ""
  echo -e "  ${BLU}Docs:${RST} docs/ops/OPERATOR_DIAGNOSTICS_GUIDE.md"
  echo -e "  ${BLU}Fix:${RST}  docs/ops/FAILURE_RECOVERY_PATHS.md"
  echo ""
fi
