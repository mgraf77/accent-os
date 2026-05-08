# Gap-Optimizer → Skill-Forge Optimization Briefing
> Read by every Wave-2 optimizer agent. The Ralph-loop spec for refining
> a freshly-forged skill across 3 quality dimensions before final ship.

## Context (stand-alone)

- **Repo:** `/home/user/accent-os` (Codespace alt: `/workspaces/accent-os`)
- **Active branch:** `claude/accentos-gap-analysis-Dcvcf`
- **Stack:** Supabase `hsyjcrrazrzqngwkqsqa`, BigCommerce `store-cwqiwcjxes`, Cloudflare Pages, Anthropic API
- **Skills directory:** `/home/user/accent-os/skills/[name]/`
- **Frontmatter contract source:** `/home/user/accent-os/skills/skill-forge/references/skill-template.md`

## What Ralph loop is

A short iterative quality pass on a forged skill: simulate using it, find what breaks, fix the SKILL.md, repeat. Comes from `skill-forge` Step 8. Each pass focuses on a different failure dimension. **Three passes per skill, in this order:**

### Pass 1 — Trigger-phrase quality + Michael-voice match

For each assigned skill:

1. Read `/home/user/accent-os/skills/[name]/SKILL.md` — note the current `## Trigger Recognition` phrases.
2. Read `/home/user/accent-os/PROMPT_LOG.md` (last 50 entries) and `/home/user/accent-os/SESSION_LOG.md` (last 30 entries) — search for any phrasing related to this skill's domain. Mine Michael's actual phrasing.
3. For each existing trigger phrase, ask:
   - Would Michael ACTUALLY say this? (vs. a hypothetical user)
   - Is it unique enough that it doesn't collide with another skill's triggers?
   - Does it match Michael's terse, lowercase, often-typo'd register? (read `skills/vibe-speak/profiles/michael.md`)
4. For each phrase that fails: edit it to match Michael's real phrasing OR replace with a mined phrase from PROMPT_LOG.
5. Add 1–3 NEW trigger phrases if any high-frequency phrasing surfaced in the logs that the skill should catch.
6. Verify the frontmatter `description` block also includes the top-3 strongest triggers (the harness matches against description heavily).

Edit SKILL.md in place. Do not change non-trigger sections in this pass.

### Pass 2 — Failure-mode hardening

For each assigned skill:

1. Re-read the SKILL.md after Pass 1's edits.
2. Imagine 3 plausible scenarios where the skill is invoked. For each, walk through Step 0 → final step. List what could go wrong silently:
   - Missing input data
   - Malformed input
   - Companion skill not yet forged
   - Schema field doesn't exist
   - API rate-limited
   - Conflicting concurrent run
3. List the 3 MOST likely failure modes for this skill. Add explicit handling to the SKILL.md:
   - For each, add a sentence in the relevant Step describing the failure path
   - Add an entry to the `## Anti-patterns` section if the failure is something the skill should never silently swallow
4. Check Step 0 — does it gate against missing prerequisites? If not, add a precondition check.
5. Check the `## Output format` section — does it specify what happens on partial-success? If no, add a "partial output" sub-block.

Edit SKILL.md in place.

### Pass 3 — Pre-commit validation + ambiguity scrub

For each assigned skill:

1. Re-read after Pass 2's edits.
2. Run the validation checklist from `skill-forge/SKILL.md` Step 7.5:
   - **YAML frontmatter parses** — `name` + `description` present, description is multi-line `>` block, ≥250 chars, contains "AccentOS" or "Accent Lighting"
   - **Name uniqueness** — directory matches frontmatter name
   - **Substitution count** — at least 3 substantive AccentOS-stack-specific references (Supabase, BigCommerce, store-cwqiwcjxes, hsyjcrrazrzqngwkqsqa, vendor scoring, vendor_scores/vendor_overrides, GMC, Klaviyo, /home/user/accent-os, ANTHROPIC_API_KEY)
   - **Anti-pattern section** — present, ≥3 entries
   - **No prose walls** — every section is a list, table, or ≤4-sentence block
   - **No "Future enhancements" / "TODO" / "Roadmap"** sections
   - **Total ≤5000 tokens** — rough word count × 1.3
3. Ambiguity scrub: for each `## Step` heading, ask "could two different humans interpret this step differently?" If yes, tighten the imperative.
4. Cross-skill references: every "Pairs with" / "Companion" mention must point to a skill that exists in `skills/_index.md` OR a skill in this Wave 1 batch (check `/home/user/accent-os/skills/` directory).

Edit SKILL.md in place. Fix any failure found.

## Hard "do NOT"

- **Do NOT modify `/home/user/accent-os/skills/_index.md`** — only SKILL.md inside each skill's directory.
- **Do NOT run git commands.**
- **Do NOT modify files outside `/home/user/accent-os/skills/[your-assigned-skills]/`**.
- **Do NOT make 4+ Ralph iterations** — stopping rule is "3 passes done OR 2 consecutive passes find nothing new" (per skill-forge Step 8).
- **Do NOT add new sections beyond what was forged in Wave 1** — this is refinement, not expansion. Only edit existing sections.
- **Do NOT delete sections.**

## Output (return at end of run, ≤200 words)

For each of your assigned skills, one block:

```
[skill-name] — Ralph 3 passes complete
  Pass 1 edits: [count] trigger-phrase changes ([what changed])
  Pass 2 edits: [count] failure-mode hardenings ([brief])
  Pass 3 edits: [count] validation fixes ([brief])
  Final state: PASS (validation green) | RETRY-NEEDED (specify)
```

If any skill cannot be brought to PASS within 3 passes, surface in your return — don't iterate to 4+ passes.
