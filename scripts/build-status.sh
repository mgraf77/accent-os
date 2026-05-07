#!/usr/bin/env bash
# build-status.sh — regenerates BUILD_STATUS.md from sources.
# Wired into the Stop hook (.claude/settings.json) and pre-push hook (.git/hooks/pre-push).
# Sources: BUILD_PLAN_CLAUDE.md, BUILD_PLAN_MICHAEL.md, ROADMAP_2026.md, git log, WORK_IN_PROGRESS.md.

set -euo pipefail

REPO="${REPO:-/home/user/accent-os}"
cd "$REPO"

OUT="$REPO/BUILD_STATUS.md"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT
TS="$(date -u +'%Y-%m-%d %H:%M UTC')"
BRANCH="$(git branch --show-current 2>/dev/null || echo unknown)"
# Use commit message subject only (no SHA) — capturing SHA creates a self-reference loop
# where every regen-amend changes the SHA which changes the file which needs amending again.
LAST_COMMIT="$(git log -1 --pretty='%s' 2>/dev/null || echo none)"
# Exclude BUILD_STATUS.md from the count — it self-references and creates a loop on each regen.
DIRTY_COUNT="$(git status --porcelain 2>/dev/null | grep -v 'BUILD_STATUS.md' | wc -l | tr -d ' ')"

# ---- count tasks per track in BUILD_PLAN_CLAUDE ----
count_track() {
  local track="$1"
  awk -v t="^## TRACK $track " '
    $0 ~ t { in_t=1; next }
    /^## TRACK / { in_t=0 }
    in_t && /^- \[x\]/ { done++ }
    in_t && /^- \[ \]/ { todo++ }
    END { printf "%d %d", done+0, todo+0 }
  ' BUILD_PLAN_CLAUDE.md
}

# ---- counts ----
TOTAL_DONE=$(grep -cE '^- \[x\]' BUILD_PLAN_CLAUDE.md || echo 0)
TOTAL_TODO=$(grep -cE '^- \[ \]' BUILD_PLAN_CLAUDE.md || echo 0)
TOTAL_TASKS=$((TOTAL_DONE + TOTAL_TODO))
PCT=$((TOTAL_TASKS > 0 ? 100 * TOTAL_DONE / TOTAL_TASKS : 0))

M_DONE=$(grep -cE '^- \[x\] \*\*M' BUILD_PLAN_MICHAEL.md || echo 0)
M_TODO=$(grep -cE '^- \[ \] \*\*M' BUILD_PLAN_MICHAEL.md || echo 0)

# ---- per-track stats ----
track_line() {
  local track="$1" name="$2"
  read -r d t < <(count_track "$track")
  local total=$((d + t))
  local pct=$((total > 0 ? 100 * d / total : 0))
  printf "| %s | %s | %d / %d | %d%% |\n" "$track" "$name" "$d" "$total" "$pct"
}

# ---- next 5 unblocked Claude tasks (first 5 [ ] without BLOCKS ON MICHAEL on M-task that's still [ ]) ----
# Get list of pending M-tasks
PENDING_M=$(awk '/^- \[ \] \*\*M[0-9]+/ { match($0, /\*\*M[0-9]+/); print substr($0, RSTART+2, RLENGTH-2) }' BUILD_PLAN_MICHAEL.md | tr '\n' '|' | sed 's/|$//')

NEXT_UNBLOCKED=$(awk -v pending="|$PENDING_M|" '
  /^- \[ \] \*\*[0-9]+\.[0-9]+\*\*/ {
    item=$0
    blocked=0
    # Look ahead for BLOCKS ON MICHAEL on next 5 lines
    for (i=1; i<=5 && (getline line) > 0; i++) {
      if (line ~ /BLOCKS ON MICHAEL/) {
        # Extract M## codes
        while (match(line, /M[0-9]+/)) {
          m = substr(line, RSTART, RLENGTH)
          if (index(pending, "|" m "|") > 0) { blocked=1; break }
          line = substr(line, RSTART+RLENGTH)
        }
      }
      if (line ~ /^- \[/) break
    }
    if (!blocked) print item
    if (++shown >= 8) exit
  }
' BUILD_PLAN_CLAUDE.md | head -5)

# ---- blocked items (top 5) ----
BLOCKED_ITEMS=$(awk '
  /^- \[ \] \*\*[0-9]+\.[0-9]+\*\*/ {
    item=$0
    for (i=1; i<=5 && (getline line) > 0; i++) {
      if (line ~ /BLOCKS ON MICHAEL/) {
        print item " — " line
        break
      }
      if (line ~ /^- \[/) break
    }
  }
' BUILD_PLAN_CLAUDE.md | head -5)

# ---- last 5 commits ----
# Drop SHA prefix from recent commits to avoid self-reference loop on amend.
RECENT_COMMITS=$(git log -5 --pretty='- %s' 2>/dev/null || echo '_(no git history)_')

# ---- WIP snapshot ----
WIP_TASK=$(grep -m1 '^\*\*Current task:\*\*' WORK_IN_PROGRESS.md 2>/dev/null | sed 's/\*\*Current task:\*\*//' | xargs || echo "—")
WIP_STEP=$(grep -m1 '^\*\*Step:\*\*' WORK_IN_PROGRESS.md 2>/dev/null | head -c 200 | sed 's/\*\*Step:\*\*//' | xargs || echo "—")

# ---- ROADMAP score ----
ROADMAP_VERSION=$(grep -m1 '^\*\*Document version:\*\*' ROADMAP_2026.md 2>/dev/null | sed 's/.*version://;s/\*\*//g' | xargs || echo "—")
ROADMAP_SCORE=$(grep -m1 '^\*\*Threshold score:\*\*' ROADMAP_2026.md 2>/dev/null | sed 's/.*score://;s/\*\*//g' | xargs || echo "—")
LEVERAGE=$(grep -m1 '^\*\*Compounding leverage score:\*\*' ROADMAP_2026.md 2>/dev/null | sed 's/.*score://;s/\*\*//g' | xargs || echo "—")

# ---- write file ----
{
cat <<EOF
# AccentOS — Build Status Dashboard

> **Auto-generated.** Do not hand-edit. Regenerated on every session-end (Stop hook) and pre-push (git hook).
> Source of truth: \`BUILD_PLAN_CLAUDE.md\`, \`BUILD_PLAN_MICHAEL.md\`, \`ROADMAP_2026.md\`, \`WORK_IN_PROGRESS.md\`, git log.
> Manual refresh: \`bash scripts/build-status.sh\`

**Last updated:** $TS
**Branch:** \`$BRANCH\`
**Last commit:** \`$LAST_COMMIT\`
**Working tree:** $DIRTY_COUNT uncommitted file(s)
**Roadmap version:** $ROADMAP_VERSION
**Threshold score:** $ROADMAP_SCORE   ·   **Leverage:** $LEVERAGE

---

## 1. Headline progress

\`\`\`
████████████████████████████████████████  $TOTAL_DONE / $TOTAL_TASKS  ($PCT%)
\`\`\`

- **Claude tasks:** $TOTAL_DONE shipped · $TOTAL_TODO pending
- **Michael unblocks:** $M_DONE done · $M_TODO pending

---

## 2. Per-track status

| Track | Name | Shipped / Total | % |
|---|---|---|---|
$(track_line "0" "Infrastructure (auth + RLS + core schema)")
$(track_line "1" "High-impact (CRM / Quotes / Pipeline / Daily Brief)")
$(track_line "2" "Vendor Intelligence")
$(track_line "3" "Employee Intelligence")
$(track_line "4" "Owner Intelligence (KPIs / Goals)")
$(track_line "5" "Phase 3 modules (Knowledge / Inventory / POs / etc.)")
$(track_line "6" "Phase 4 integrations (BC / GA4 / Windward / AI)")
$(track_line "7" "Phase 0 Foundation Gate (ROADMAP_2026)")
$(track_line "8" "Phase 1 Integrations + Compatibility Checker")
$(track_line "9" "Phase 2 Inline Retrieval + Ecom RAG")
$(track_line "10" "Phase 3 Named Automations A1-A8")
$(track_line "11" "BC Site Maximization E1-E10")
$(track_line "12" "User-Safety Charter S1-S10")
$(track_line "13" "Compounding Loops L1-L5")
$(track_line "14" "Phase 4 Continuous Ralph + Quarterly Kill")

---

## 3. Right Now (Work-In-Progress)

- **Current task:** $WIP_TASK
- **Step:** $WIP_STEP

---

## 4. Next 5 unblocked tasks (in queue order)

$(if [ -n "$NEXT_UNBLOCKED" ]; then echo "$NEXT_UNBLOCKED" | sed 's/^- \[ \] /1. /' | awk '{ if (NR==1) sub(/^1\./, "1."); else if (NR==2) sub(/^1\./, "2."); else if (NR==3) sub(/^1\./, "3."); else if (NR==4) sub(/^1\./, "4."); else if (NR==5) sub(/^1\./, "5."); print }'; else echo "_(none — all pending tasks blocked or queue empty)_"; fi)

---

## 5. Blocked on Michael (top 5)

$(if [ -n "$BLOCKED_ITEMS" ]; then echo "$BLOCKED_ITEMS" | sed 's/^/- /'; else echo "_(none blocked)_"; fi)

---

## 6. Vision progress vs ROADMAP_2026 phases

| Phase | Roadmap section | Track(s) | Status |
|---|---|---|---|
| **Phase 0** Foundation Gate | §4 | 7 | $(read -r d t < <(count_track "7"); if [ "$d" -eq 0 ]; then echo "⏳ not started"; elif [ "$d" -lt "$((d+t))" ]; then echo "🚧 $d / $((d+t)) shipped"; else echo "✅ complete"; fi) |
| **Phase 1** ROI Integrations | §5 | 8 | $(read -r d t < <(count_track "8"); if [ "$d" -eq 0 ]; then echo "⏳ not started"; elif [ "$d" -lt "$((d+t))" ]; then echo "🚧 $d / $((d+t)) shipped"; else echo "✅ complete"; fi) |
| **Phase 2** Retrieval + Ecom RAG | §5 | 9 | $(read -r d t < <(count_track "9"); if [ "$d" -eq 0 ]; then echo "⏳ not started"; elif [ "$d" -lt "$((d+t))" ]; then echo "🚧 $d / $((d+t)) shipped"; else echo "✅ complete"; fi) |
| **Phase 3** Named Automations | §5 | 10 | $(read -r d t < <(count_track "10"); if [ "$d" -eq 0 ]; then echo "⏳ not started"; elif [ "$d" -lt "$((d+t))" ]; then echo "🚧 $d / $((d+t)) shipped"; else echo "✅ complete"; fi) |
| **BC Site Maximization** | §13 | 11 | $(read -r d t < <(count_track "11"); if [ "$d" -eq 0 ]; then echo "⏳ not started"; elif [ "$d" -lt "$((d+t))" ]; then echo "🚧 $d / $((d+t)) shipped"; else echo "✅ complete"; fi) |
| **User-Safety Charter** | §14 | 12 | $(read -r d t < <(count_track "12"); if [ "$d" -eq 0 ]; then echo "⏳ not started"; elif [ "$d" -lt "$((d+t))" ]; then echo "🚧 $d / $((d+t)) shipped"; else echo "✅ complete"; fi) |
| **Compounding Loops** | §9 | 13 | $(read -r d t < <(count_track "13"); if [ "$d" -eq 0 ]; then echo "⏳ not started"; elif [ "$d" -lt "$((d+t))" ]; then echo "🚧 $d / $((d+t)) shipped"; else echo "✅ complete"; fi) |
| **Phase 4** Continuous | §5 | 14 | $(read -r d t < <(count_track "14"); if [ "$d" -eq 0 ]; then echo "⏳ not started"; elif [ "$d" -lt "$((d+t))" ]; then echo "🚧 $d / $((d+t)) shipped"; else echo "✅ complete"; fi) |

---

## 7. Schedule gates

- **W4 Review Gate:** telemetry ≥5k events/day · cost-per-task baseline · heartbeat rendering · audit log verifiable · RLS CI green
- **W12 Review Gate:** ≥1 automation promoted shadow→draft→auto with Beta-LCB · RAG eval ≥80% · cost flat or down · *anything killed yet?*

Pre-mortem early-warning instrumentation (must be live by phase end):
- Δ-ROI red flag if any automation has no baseline by W4
- Heartbeat-gap alarm — >6hr silence pages a human
- Manual-workaround tag in Friday standups; 3 flags = mandatory review

---

## 8. Recent commits

$RECENT_COMMITS

---

## 9. How this file stays current

- **Stop hook** (\`.claude/settings.json\`) regenerates on session end
- **pre-push git hook** (\`.git/hooks/pre-push\`) regenerates before every push
- **Manual:** \`bash scripts/build-status.sh\`

If this file is stale, the hooks aren't firing — investigate \`.claude/settings.json\` Stop hook + \`.git/hooks/pre-push\` exec bit.
EOF
} > "$TMP"

# Idempotency: only replace OUT if substantive content changed (ignore the timestamp line).
# Without this guard the Stop hook creates an infinite loop: regen → dirty file → next-session warning → regen.
if [ -f "$OUT" ] && diff <(grep -v '^\*\*Last updated:\*\*' "$OUT") <(grep -v '^\*\*Last updated:\*\*' "$TMP") >/dev/null 2>&1; then
  echo "BUILD_STATUS.md unchanged (timestamp-only diff suppressed)"
  exit 0
fi

mv "$TMP" "$OUT"
trap - EXIT
echo "BUILD_STATUS.md regenerated → $OUT"
