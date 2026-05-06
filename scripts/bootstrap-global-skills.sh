#!/usr/bin/env bash
# bootstrap-global-skills.sh
# Installs generalized global Claude Code skills to ~/.claude/
# Run from any machine after cloning accent-os.
# Safe to re-run: it overwrites, does not duplicate.

set -euo pipefail

REPO="$(git rev-parse --show-toplevel)"
DST="$HOME/.claude"

echo "=== Global skills bootstrap ==="
echo "Source: $REPO/skills/"
echo "Target: $DST/"
echo ""

# ── Directories ───────────────────────────────────────────────────────────────
mkdir -p \
  "$DST/skills/vibe-speak/modes" \
  "$DST/skills/vibe-speak/profiles" \
  "$DST/skills/vibe-speak/sessions" \
  "$DST/skills/vibe-speak/benchmarks" \
  "$DST/skills/skill-forge/references" \
  "$DST/skills/skill-optimizer/references" \
  "$DST/skills/skill-eval-suite" \
  "$DST/skills/decision-log" \
  "$DST/skills/codex-review" \
  "$DST/skills/community-skill-vet" \
  "$DST/skills/repo-scout/references" \
  "$DST/skills/autonomous-mode" \
  "$DST/skills/bottleneck-finder" \
  "$DST/skills/prompt-queue" \
  "$DST/skills/doc-drift" \
  "$DST/skills/analysis-snapshot" \
  "$DST/skills/table-eda"

# ── Copy portable SKILL.md files ──────────────────────────────────────────────
PORTABLE=(
  skill-eval-suite
  decision-log
  community-skill-vet
  autonomous-mode
  bottleneck-finder
  prompt-queue
  doc-drift
  analysis-snapshot
  table-eda
  codex-review
  repo-scout
)

for skill in "${PORTABLE[@]}"; do
  cp "$REPO/skills/$skill/SKILL.md" "$DST/skills/$skill/SKILL.md"
done

# skill-forge + references
cp "$REPO/skills/skill-forge/SKILL.md"                            "$DST/skills/skill-forge/SKILL.md"
cp "$REPO/skills/skill-forge/references/skill-template.md"        "$DST/skills/skill-forge/references/skill-template.md"
cp "$REPO/skills/skill-forge/references/gap-analysis-template.md" "$DST/skills/skill-forge/references/gap-analysis-template.md"
cp "$REPO/skills/skill-forge/references/extraction-sources.md"    "$DST/skills/skill-forge/references/extraction-sources.md"
touch "$DST/skills/skill-forge/gotcha-log.md" "$DST/skills/skill-forge/future-builds.md"

# skill-optimizer (already generic — written from scratch without AccentOS refs)
cp "$REPO/skills/skill-optimizer/SKILL.md"                        "$DST/skills/skill-optimizer/SKILL.md"
cp "$REPO/skills/skill-optimizer/references/rubric-weights.md"    "$DST/skills/skill-optimizer/references/rubric-weights.md"

# vibe-speak: portable files only (not corpus/, sessions/, michael.md)
cp "$REPO/skills/vibe-speak/SKILL.md"          "$DST/skills/vibe-speak/SKILL.md"
cp "$REPO/skills/vibe-speak/MODES.md"          "$DST/skills/vibe-speak/MODES.md"
cp "$REPO/skills/vibe-speak/quickstart.md"     "$DST/skills/vibe-speak/quickstart.md"
cp "$REPO/skills/vibe-speak/skill-router.md"   "$DST/skills/vibe-speak/skill-router.md"
cp "$REPO/skills/vibe-speak/scoring-matrix.md" "$DST/skills/vibe-speak/scoring-matrix.md"
cp "$REPO/skills/vibe-speak/profiles/_default.md" "$DST/skills/vibe-speak/profiles/_default.md"
cp "$REPO/skills/vibe-speak/profiles/_index.md"   "$DST/skills/vibe-speak/profiles/_index.md"
cp "$REPO/skills/vibe-speak/modes/"*.md           "$DST/skills/vibe-speak/modes/"

# Create empty log files if they don't already exist
for f in feedback-log.md observation-log.md kpi-log.md session-handoff.md; do
  if [[ ! -f "$DST/skills/vibe-speak/$f" ]]; then
    printf "# %s\n> Cross-session log — append only.\n" "$f" > "$DST/skills/vibe-speak/$f"
  fi
done
touch "$DST/skills/vibe-speak/profiles/_active.md"

# ── Batch generalize: strip AccentOS-specific hardcoding ─────────────────────
echo "Generalizing AccentOS-specific references..."

find "$DST/skills" -name "*.md" | while read -r f; do
  sed -i \
    -e 's|/home/user/accent-os/\.claude/|[project-root]/.claude/|g' \
    -e 's|/home/user/accent-os/skills/|~/.claude/skills/|g' \
    -e 's|/home/user/accent-os/analyses/|[project-root]/analyses/|g' \
    -e 's|/home/user/accent-os/decisions/|[project-root]/decisions/|g' \
    -e 's|/home/user/accent-os/|[project-root]/|g' \
    -e 's|/workspaces/accent-os/|[project-root]/|g' \
    -e 's|hsyjcrrazrzqngwkqsqa|[your-supabase-project-id]|g' \
    -e 's|store-cwqiwcjxes|[your-bc-store-id]|g' \
    -e 's|github\.com/mgraf77/accent-os|[your-github-repo]|g' \
    -e 's|AccentOS + Accent Lighting\|AccentOS and Accent Lighting\|AccentOS or Accent Lighting\|AccentOS\/Accent Lighting|your project|g' \
    -e 's|AccentOS skills|your project skills|g' \
    -e 's|AccentOS skill|your skill|g' \
    -e 's|AccentOS-stack|project-stack|g' \
    -e 's|AccentOS-specific|project-specific|g' \
    -e 's|AccentOS-native|project-native|g' \
    -e 's|AccentOS-mandatory|mandatory|g' \
    -e 's|AccentOS-scoped|project-scoped|g' \
    -e "s|AccentOS's|your project's|g" \
    -e 's|AccentOS|your project|g' \
    -e 's|Accent Lighting|your project|g' \
    -e "s|Michael's|your|g" \
    -e 's|Michael says|you say|g' \
    -e 's| Michael | you |g' \
    -e 's|BigCommerce|your ecommerce platform|g' \
    -e 's|Supabase backend|your database backend|g' \
    -e 's|Cloudflare Pages|your hosting platform|g' \
    -e 's|skills/vibe-speak/|~/.claude/skills/vibe-speak/|g' \
    -e 's|`skills/_index\.md`|`~/.claude/skills/_index.md`|g' \
    -e 's|your your project|your project|g' \
    -e 's|"your project" or "your project"|your project name|g' \
    "$f"
done

# ── Write global CLAUDE.md (only if not already present) ─────────────────────
if [[ ! -f "$DST/CLAUDE.md" ]]; then
  cp "$REPO/.claude-global/CLAUDE.md" "$DST/CLAUDE.md"
  echo "Wrote ~/.claude/CLAUDE.md"
else
  echo "~/.claude/CLAUDE.md already exists — not overwritten. Compare with $REPO/.claude-global/CLAUDE.md if needed."
fi

# ── Write global _index.md ────────────────────────────────────────────────────
cp "$REPO/.claude-global/skills-index.md" "$DST/skills/_index.md"

echo ""
echo "=== Bootstrap complete ==="
echo "Global skills: $(find "$DST/skills" -name "SKILL.md" | wc -l) SKILL.md files installed"
echo ""
echo "Next steps:"
echo "  1. Set up your vibe-speak profile:"
echo "     cp ~/.claude/skills/vibe-speak/profiles/_default.md \\"
echo "        ~/.claude/skills/vibe-speak/profiles/[your-name].md"
echo "     # Edit the file to set your default mode and preferences"
echo ""
echo "  2. Verify global CLAUDE.md is active:"
echo "     # Claude Code reads ~/.claude/CLAUDE.md automatically"
echo "     # No extra config needed"
echo ""
echo "  3. Open any repo with Claude Code — global skills load automatically"
