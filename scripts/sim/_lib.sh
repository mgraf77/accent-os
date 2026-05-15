#!/usr/bin/env bash
# scripts/sim/_lib.sh — shared helpers for simulate-* scripts.
# Simulations are READ/INJECT against the live signal runtime. The runtime
# itself runs in-browser, so each script:
#   1. Emits a browser-console JS snippet operators paste into DevTools.
#   2. Optionally emits a SQL fragment for direct Supabase SQL editor use.
# Both modes are non-destructive (write only to runtime tables, use unique keys).

hdr() { printf '\n\033[1m%s\033[0m\n' "$1"; }
note(){ printf '  \033[36m%s\033[0m\n' "$1"; }
warn(){ printf '  \033[33m!\033[0m %s\n' "$1"; }
sep() { printf '\n────────────────────────────────────────────────────────\n'; }

emit_js_header() {
  local title="$1"
  sep
  printf '// BROWSER CONSOLE — %s\n' "$title"
  printf '// Paste the block below into DevTools console on a session where SIGNALS is loaded.\n'
  sep
}

emit_sql_header() {
  local title="$1"
  sep
  printf '-- SUPABASE SQL EDITOR — %s\n' "$title"
  printf '-- Runs against runtime tables only. Safe to re-run.\n'
  sep
}
