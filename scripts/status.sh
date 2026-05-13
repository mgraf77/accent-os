#!/usr/bin/env bash
# scripts/status.sh — AccentOS session boot status
# Run from repo root: bash scripts/status.sh

set -euo pipefail
cd "$(dirname "$0")/.."

bold()  { printf '\033[1m%s\033[0m\n' "$*"; }
dim()   { printf '\033[2m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
yellow(){ printf '\033[33m%s\033[0m\n' "$*"; }
red()   { printf '\033[31m%s\033[0m\n' "$*"; }
hr()    { printf '%s\n' "────────────────────────────────────────────────────────────"; }

ok()   { printf '  \033[32m✓\033[0m  %s\n' "$*"; }
warn() { printf '  \033[33m⚠\033[0m  %s\n' "$*"; }
info() { printf '  \033[2m·\033[0m  %s\n' "$*"; }

bold "AccentOS — Session Status"
hr

# ── Git ──────────────────────────────────────────────────────────────────────
bold "Git"
branch=$(git rev-parse --abbrev-ref HEAD)
last=$(git log -1 --pretty=format:'%h %s' 2>/dev/null || echo '(no commits)')
printf "  branch:     %s\n" "$branch"
printf "  last:       %s\n" "$last"
ahead_behind=$(git rev-list --left-right --count "@{upstream}...HEAD" 2>/dev/null || echo "0	0")
behind=$(echo "$ahead_behind" | cut -f1)
ahead=$(echo  "$ahead_behind" | cut -f2)
if [[ "$ahead" -gt 0 ]]; then
  warn "$ahead commit(s) not pushed → run: git push origin ${branch}:claude/audit-repository-Fg9xI"
else
  ok "Branch in sync with upstream"
fi
dirty=$(git status --short 2>/dev/null | wc -l | tr -d ' ')
if [[ "$dirty" -gt 0 ]]; then
  warn "$dirty file(s) uncommitted"
else
  ok "Working tree clean"
fi
echo

# ── File sizes ───────────────────────────────────────────────────────────────
bold "File sizes"
if [[ -f index.html ]]; then
  bytes=$(wc -c < index.html | tr -d ' ')
  kb=$(( bytes / 1024 ))
  pct=$(( bytes * 100 / 921600 ))
  if [[ $pct -ge 90 ]]; then
    warn "index.html: ${kb}KB  (${pct}% of 900KB split trigger) — approaching limit"
  elif [[ $pct -ge 75 ]]; then
    warn "index.html: ${kb}KB  (${pct}% of 900KB split trigger) — monitor"
  else
    ok "index.html: ${kb}KB  (${pct}% of 900KB split trigger)"
  fi
fi
for f in MASTER.md SESSION_LOG.md BUILD_PLAN_CLAUDE.md BUILD_PLAN_MICHAEL.md BUILD_INTELLIGENCE.md; do
  [[ -f $f ]] && printf "  %-26s %s lines\n" "$f" "$(wc -l < "$f" | tr -d ' ')"
done
echo

# ── Build plans ──────────────────────────────────────────────────────────────
bold "BUILD_PLAN_CLAUDE.md"
if [[ -f BUILD_PLAN_CLAUDE.md ]]; then
  done_c=$(grep -c '^- \[x\]' BUILD_PLAN_CLAUDE.md 2>/dev/null || echo 0)
  todo_c=$(grep -c '^- \[ \]' BUILD_PLAN_CLAUDE.md 2>/dev/null || echo 0)
  ok "$done_c shipped"
  info "$todo_c pending"
  next=$(grep -m1 '^- \[ \]' BUILD_PLAN_CLAUDE.md 2>/dev/null | sed 's/^- \[ \] //' | cut -c1-90 || true)
  [[ -n ${next:-} ]] && info "next: $next"
fi
echo

bold "BUILD_PLAN_MICHAEL.md"
if [[ -f BUILD_PLAN_MICHAEL.md ]]; then
  done_m=$(grep -c '^- \[x\]' BUILD_PLAN_MICHAEL.md 2>/dev/null || echo 0)
  todo_m=$(grep -c '^- \[ \]' BUILD_PLAN_MICHAEL.md 2>/dev/null || echo 0)
  ok "$done_m done"
  if [[ "$todo_m" -gt 0 ]]; then
    warn "$todo_m M-tasks pending"
    grep -E '^- \[ \] \*\*M[0-9]+\*\*' BUILD_PLAN_MICHAEL.md 2>/dev/null \
      | sed -E 's/.*\*\*(M[0-9]+)\*\* — (.*)/    \1: \2/' | head -8 || true
    info "Blocked features won't progress until M-tasks are run"
  fi
fi
echo

# ── Database ─────────────────────────────────────────────────────────────────
bold "Database"
if [[ -f sql/M02_core_schema.sql ]]; then
  table_count=$(grep -cE '^CREATE TABLE IF NOT EXISTS' sql/M02_core_schema.sql 2>/dev/null || echo 0)
  ok "M02: $table_count tables defined"
fi
sql_count=$(ls sql/M*.sql 2>/dev/null | wc -l | tr -d ' ')
applied=$(ls sql/M*.sql 2>/dev/null | sort -V | tail -1 | sed 's/.*\(M[0-9]*\).*/\1/' || echo "none")
info "$sql_count migration files · latest: $applied"
echo

# ── Deployment infrastructure ────────────────────────────────────────────────
bold "Deployment"
if [[ -f .github/workflows/deploy-worker.yml ]]; then
  ok "GitHub Actions worker workflow present (.github/workflows/deploy-worker.yml)"
  info "Triggers: push to main touching worker/** or wrangler.toml · also workflow_dispatch"
  info "Requires GitHub secrets: CF_API_TOKEN + CF_ACCOUNT_ID"
else
  warn "No GitHub Actions worker workflow found"
  info "Fix: create .github/workflows/deploy-worker.yml (see docs/runtime/CLOUDFLARE_DEPLOYMENT_FLOW.md)"
fi
if [[ -f wrangler.toml ]]; then
  wname=$(grep '^name' wrangler.toml | cut -d'"' -f2 || true)
  wmain=$(grep '^main' wrangler.toml | cut -d'"' -f2 || true)
  ok "wrangler.toml: name=$wname main=$wmain"
else
  warn "wrangler.toml missing — worker deploy will fail"
fi
echo

# ── Module JS integrity ───────────────────────────────────────────────────────
bold "Module JS integrity"
missing_js=0
while IFS= read -r jsfile; do
  if [[ ! -f "$jsfile" ]]; then
    warn "Missing: $jsfile"
    missing_js=$(( missing_js + 1 ))
  fi
done < <(grep -o "js/[a-zA-Z_]*.js" index.html 2>/dev/null | sort -u)
if [[ "$missing_js" -eq 0 ]]; then
  total_js=$(grep -o "js/[a-zA-Z_]*.js" index.html 2>/dev/null | sort -u | wc -l | tr -d ' ')
  ok "All $total_js js/ modules present"
fi
echo

# ── Quote workflow sanity ─────────────────────────────────────────────────────
bold "Quote workflow sanity"
if [[ -f index.html ]]; then
  checks_ok=0; checks_fail=0
  for sym in loadSavedQ aiParseNotes undoAIParse exportQuoteCSV sbSaveQuote printQ; do
    if grep -q "function $sym" index.html 2>/dev/null; then
      checks_ok=$(( checks_ok + 1 ))
    else
      warn "Missing function: $sym"
      checks_fail=$(( checks_fail + 1 ))
    fi
  done
  if [[ "$checks_fail" -eq 0 ]]; then
    ok "All $checks_ok quote workflow functions present"
  fi
fi
echo

# ── Live worker probe (optional, non-blocking) ───────────────────────────────
bold "Live Worker Probe"
WORKER_URL="https://accentos-anthropic-proxy.mgraf77.workers.dev/"
if command -v curl &>/dev/null; then
  probe=$(curl -sf --max-time 6 "$WORKER_URL" 2>/dev/null || echo '')
  if [[ -z "$probe" ]]; then
    warn "Probe timed out or failed — worker unreachable or URL changed"
    info "Manual check: curl $WORKER_URL"
  elif echo "$probe" | grep -q '"version"'; then
    ver=$(echo "$probe" | grep -o '"version":"[^"]*"' | head -1 | cut -d'"' -f4)
    env_key=$(echo "$probe" | grep -o '"env_key_set":[^,}]*' | head -1 | cut -d':' -f2 | tr -d ' }')
    if [[ "$env_key" == "true" ]]; then
      ok "Worker live: $ver · env_key_set=true"
    elif [[ "$env_key" == "false" ]]; then
      warn "Worker live: $ver · env_key_set=false"
      info "Fix: go to Cloudflare dashboard → Workers → accentos-anthropic-proxy → Settings → add ANTHROPIC_API_KEY secret"
    else
      ok "Worker live: $ver (secret state unknown)"
    fi
  else
    warn "Worker returned non-JSON (likely stale v1/v2): ${probe:0:80}"
    info "Fix: GitHub Actions → Deploy Cloudflare Worker → Run workflow (after adding CF_API_TOKEN + CF_ACCOUNT_ID secrets)"
  fi
else
  info "curl not available — skipping live probe (install curl to enable)"
fi
echo

# ── Runtime docs ─────────────────────────────────────────────────────────────
bold "Runtime docs"
for f in docs/runtime/CLOUDFLARE_DEPLOYMENT_FLOW.md docs/runtime/WORKER_RUNTIME_RECOVERY.md docs/runtime/DEPLOYMENT_STATE_MODEL_V1.md; do
  [[ -f $f ]] && ok "$f" || warn "Missing: $f"
done
echo

# ── Recent session log ───────────────────────────────────────────────────────
bold "SESSION_LOG.md (most recent 3 entries)"
if [[ -f SESSION_LOG.md ]]; then
  grep -m3 '^### ' SESSION_LOG.md | sed 's/^/  /'
fi
echo

hr
dim "Tip: read WORK_IN_PROGRESS.md first on resume. Worker issues → docs/runtime/WORKER_RUNTIME_RECOVERY.md."
