# Gap-Optimizer → Skill-Forge Briefing
> Read by every parallel forge agent spawned during a `forge top N` cycle.
> Stand-alone, self-contained — agents have no memory of prior conversation.

## AccentOS context (essential)

- **Repo:** `/home/user/accent-os` (Codespace alt: `/workspaces/accent-os`)
- **Active branch:** `claude/accentos-gap-analysis-Dcvcf`
- **Stack:** Supabase project `hsyjcrrazrzqngwkqsqa`, BigCommerce store `store-cwqiwcjxes`, Cloudflare Pages, Anthropic API via `ANTHROPIC_API_KEY`
- **Project:** AccentOS = internal operating system for **Accent Lighting** (a residential lighting retailer)
- **Skills directory:** `/home/user/accent-os/skills/[your-skill-name]/`
- **Skill registry (read but DO NOT modify):** `/home/user/accent-os/skills/_index.md`

## Required reading before writing

1. `/home/user/accent-os/skills/skill-forge/references/skill-template.md` — canonical template
2. `/home/user/accent-os/skills/skill-forge/SKILL.md` — exemplar (multi-phase, deep)
3. `/home/user/accent-os/skills/efficiency-monitor/SKILL.md` — exemplar (observer-style)
4. `/home/user/accent-os/MASTER.md` — read TOC + §14 narrative if your skill is `agentic`-type
5. `/home/user/accent-os/skills/_index.md` — current registry, for companion-link awareness
6. **Pick 1–2 thematically similar skills** from `skills/` for tone/depth calibration. Examples:
   - `agentic` skills closest in spirit: `vendor-cascade`, `bc-business-review`, `priority-articulation`
   - `integration` skills closest in spirit: `gmc-feed-audit`, `bulk-meta-description`
   - `meta-infra` skills closest in spirit: `skill-eval-suite`, `efficiency-monitor`, `gap-optimizer`

## Build requirements (every skill must satisfy these)

### File: `skills/[name]/SKILL.md`

**Frontmatter** (YAML between two `---` lines):
- `name`: kebab-case, ≤25 chars, **must match directory name**
- `description`: multi-line via `>`, **≥250 chars**, **mentions "AccentOS" or "Accent Lighting"**, **ends with shipped-behavior commitment** ("always X — never Y" pattern). The description carries the trigger surface — it's what the harness matches against Michael's natural language.

**Body sections** (in this order, all required):
1. `# [skill-name]` (h1)
2. `**Purpose:**` one-sentence purpose statement
3. `## Trigger Recognition` — bulleted list of 5–8 phrases Michael might naturally say
4. `## Step 0 — Preflight` — parallel reads / context gathering. **If your spec lists "Blocked by [M-tasks]": include here a "BLOCKED ON M## — produces stub output until [M##] resolves" gate that returns a stub message instead of executing the skill.**
5. `## Step 1` through `## Step N` — numbered workflow (4–7 steps total). Each step has one named outcome. Imperative voice. Tables when scanning is the use case.
6. `## Output format` — paste-ready blocks/tables/files. Show the literal structure.
7. `## AccentOS context` — stack, paths, store/project IDs, companion skills
8. `## Anti-patterns` — **≥3 entries**, each "Never X" or "Don't Y"

### Files: `skills/[name]/references/*.md` (optional but recommended)

Use references/ for:
- Templates the skill uses (email templates, prompt patterns, schema scaffolds)
- Lookup tables (M-task IDs, vendor categories, alert signal definitions)
- Long checklists that would bloat SKILL.md past ~5000 tokens

Each reference file has a `# Title` h1 + `> One-line purpose` blockquote at the top.

## AccentOS-specific substitutions (≥3 required, drawn from this allowlist)

`AccentOS` · `Accent Lighting` · `store-cwqiwcjxes` · `hsyjcrrazrzqngwkqsqa` · `vendor scoring` · `vendor_scores` table · `vendor_overrides` table · `GMC` / `Google Merchant Center` · `Feedenomics` · `Klaviyo` · `BigCommerce` · `Supabase` · `Cloudflare Pages` · `Anthropic API` / `ANTHROPIC_API_KEY` · `/home/user/accent-os` · `/workspaces/accent-os`

The 3 must be **substantive references** (used in a workflow step or example), not throwaway mentions in passing.

## Hard "do NOT"

- **Do NOT modify `/home/user/accent-os/skills/_index.md`** — the parent agent aggregates all 15 entries at the end of the wave.
- **Do NOT run git commands** — no commits, no pushes, no branches, no `git add`.
- **Do NOT modify files outside `/home/user/accent-os/skills/[your-name]/`** — stay in your lane.
- **Do NOT modify `/home/user/accent-os/sql/` or any database schema files.** If your skill needs a new table, document the schema in `references/proposed-schema.md` — do not write SQL migration files.
- **Do NOT modify other skills** — no cross-skill edits. If you reference a companion skill, read its SKILL.md to understand its trigger surface, but don't edit it.
- **Do NOT add `## Future enhancements`, `## TODO`, or `## Roadmap` sections** — skills are shipped state.
- **Do NOT ask clarifying questions** — make best-judgment calls. Document the decision in your return summary.

## Stub-mode requirement (for M-task-blocked skills)

If your spec says "Blocked by M##" (e.g. M03, M04, M06, M09, M10):

Step 0 must include this block (adapted to your skill's M-task list):

```
## Step 0 — Preflight (BLOCKED gate)

This skill is gated on **[M-task ID(s) — e.g. M06: Google credentials provisioned]**. Until that resolves:

1. Check whether the blocking dependency exists. For [name], that means: [specific check — e.g. "env var GA4_PROPERTY_ID is set" or "table `klaviyo_flows` exists in Supabase"].
2. If the dependency is missing, return this stub and exit:

   > ⚠ skill `[name]` is BLOCKED on [M##]. To unblock:
   > 1. [Concrete unblock step 1]
   > 2. [Concrete unblock step 2]
   > Skill will activate automatically once [dependency check] passes.

3. If the dependency exists, proceed to Step 1.
```

This is the contract: the skill is shipped, the structure is in place, but it returns a helpful stub message until Michael completes the M-task. Once unblocked, the skill activates without further code changes.

## Output format (return at end of run, ≤150 words)

Return:
- **Files written** (full absolute paths)
- **Top-3 trigger phrases** finalized (the ones the harness will match against)
- **Key design decision** (1–2 sentences on the most consequential choice)
- **Any gotchas surfaced** (anything you noticed that should be a future improvement)
- **Token estimate** for SKILL.md (rough word count × 1.3)

## Quality bar

You're forging a production skill that lives in the AccentOS ecosystem and will be invoked by Michael through natural language. Aim for the depth and care you see in `skill-forge/SKILL.md` and `vendor-cascade/SKILL.md` — not a sketch. If a step has ambiguity, the skill is broken.

Work autonomously. Ship the skill.
