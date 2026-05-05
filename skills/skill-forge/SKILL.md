---
name: skill-forge
description: >
  Deep-research a target tool, repo, methodology, or skill across multiple sources
  (GitHub, official site, social, docs, reviews), run a gap analysis against AccentOS +
  Accent Lighting needs, and ship a custom AccentOS-scoped SKILL.md that captures only
  the relevant concepts. Use this skill when Michael says: "extract concepts from [X]",
  "build me a skill based on [X]", "deep-dive [X] and make it mine", "I want a [X]-style
  skill for AccentOS", "adapt [X] for me", "forge a skill from [X]", "research [X] and
  give me a custom version", "rip the good parts out of [X]", or any phrasing that asks
  to ingest an external tool and produce a tailored local skill. Distinct from repo-scout:
  repo-scout decides whether to install something as-is; skill-forge assumes the as-is
  version is the wrong fit and builds the right-fit version. End deliverable is a working
  skill committed to skills/, not a recommendation. Always produces the file — never stops
  at "here's what it would look like."
---

# skill-forge

**Purpose:** Take an external tool or methodology, extract its real concepts from primary sources, drop the parts that don't fit AccentOS, add the parts that are missing, and ship a usable local skill in one pass.

Three things in order: **extract → gap → forge**. No step is optional, no step is skippable.

---

## Trigger Recognition

Run this skill when Michael says anything like:
- "extract concepts from [X]"
- "build me a skill based on [X]"
- "deep-dive [X] and make it mine"
- "I want a [X]-style skill for AccentOS"
- "adapt [X] for me / for AccentOS"
- "forge a skill from [X]"
- "rip the good parts out of [X]"
- "research [X] and give me a custom version"
- "I like what [X] does, build me one"

Also trigger when repo-scout returns an EVALUATE verdict and Michael says "build it custom" or similar.

---

## Step 1 — Identify the target

Pin down exactly what is being forged from. Confirm:
- Name (e.g. "Cascade", "OKR cascade methodology", "alirezarezvani/c-level-advisor")
- Type (repo, SaaS product, methodology, framework, single skill)
- Anchor URL if known (GitHub repo, marketing site, docs)

If the target is ambiguous (e.g. "Cascade" could be 3 different things), pick the highest-likelihood match given AccentOS context and state which one in the output. Do not ask Michael to disambiguate — pick and explain.

---

## Step 2 — Multi-source extraction

Run parallel searches across **all five source classes**. See references/extraction-sources.md for the full checklist. Minimum coverage:

**GitHub layer**
- Primary repo: README, SKILL.md(s), folder structure, top-level docs/
- Adjacent repos: forks, "awesome-X" lists referencing it, related-tools sections
- Issues + Discussions: real user friction, requested features, anti-patterns

**Official-site layer**
- Marketing site: features page, use-cases page, customer logos
- Docs site: getting-started, core-concepts, API/CLI reference
- Pricing page (paid features = signal of where actual value lives)

**Social layer**
- X/Twitter: founder/maintainer recent posts, threads with real demos
- Reddit: r/ClaudeAI, r/LocalLLaMA, vertical subreddits — real complaints
- Hacker News: launch threads, technical critique
- LinkedIn: case studies, B2B angle

**Review/blog layer**
- Independent blog reviews (Medium, Substack, dev.to)
- YouTube demos — pull transcripts when available
- Podcast appearances by maintainers

**Pricing/access layer (paid tools only)**
- What's gated behind which tier — gates reveal core value props
- What integrations exist out-of-the-box

For each source, harvest into a flat list:
- Use cases
- Core concepts/primitives (named things — "cascade map", "orphan goal", "board package")
- Workflows / step sequences
- Concrete outputs / deliverables
- Anti-patterns or "don't use this for"
- Killer-feature claims (vs. fluff)

Stop adding sources once 3 consecutive new sources produce 0 new concepts. That's saturation.

---

## Step 3 — Concept inventory

Consolidate into one structured table. Group near-duplicates. Score each:

| Concept | Best source | Mention frequency | AccentOS relevance |

Relevance values: **HIGH** (direct fit), **MEDIUM** (needs translation), **LOW** (interesting only), **NONE** (drop).

Identify the 80/20: the 5–10 concepts that carry the actual value. Everything else is decoration.

---

## Step 4 — Gap analysis

Three explicit columns. No skipping.

| KEEP (target does it, AccentOS needs it) | DROP (target does it, AccentOS doesn't) | ADD (AccentOS needs it, target doesn't) |

Rules:
- KEEP must include reasoning tied to a specific AccentOS gap from references/project-profiles.md (loaded via repo-scout's profile file at /home/user/accent-os/skills/repo-scout/references/project-profiles.md)
- DROP must explain why — usually "wrong project type" (e.g. board reporting on a solo build) or "redundant with existing skill"
- ADD captures what makes the forged skill better than the original for Michael's use — vendor scoring, BigCommerce store-cwqiwcjxes context, Supabase hsyjcrrazrzqngwkqsqa, ecommerce ops

If KEEP has fewer than 3 entries, the target is not worth forging — stop and report "insufficient signal, recommend WATCH" instead of producing a thin skill.

---

## Step 5 — Skill design

Decide before writing:

- **Skill name** — kebab-case, action-oriented, ≤3 words. Not "cascade-skill"; prefer "vendor-cascade" or "exec-rollup". Names should describe what it does for AccentOS, not where the concepts came from.
- **Description block** — must include AccentOS-specific trigger phrases Michael actually uses, named projects (AccentOS, Accent Lighting), and a clear "use when" + "do not use when" pair. Description ≥ 250 chars so the harness reliably auto-triggers.
- **Workflow** — 4–7 numbered steps. Each step has a concrete output. No "consider doing X" — only imperatives.
- **Output format** — paste-ready blocks. Tables when scanning is the use case. No prose walls.
- **References** — split out checklists, templates, and lookup tables into references/*.md. Keep SKILL.md under ~5K tokens.

Sanity check before writing: would this skill auto-trigger correctly on the trigger phrases? If unsure, expand the description.

---

## Step 6 — Forge the skill files

Write to `/home/user/accent-os/skills/[skill-name]/`:
- `SKILL.md` — frontmatter + workflow, following references/skill-template.md
- `references/*.md` — any extracted templates, checklists, or reference tables

AccentOS-mandatory substitutions everywhere:
- Paths → `/home/user/accent-os/` (Codespace mounts to `/workspaces/accent-os/` if Michael is in Codespace — include both forms when relevant)
- "your project" → AccentOS or Accent Lighting (be specific)
- Generic store → BigCommerce store-cwqiwcjxes
- Generic DB → Supabase hsyjcrrazrzqngwkqsqa
- At least one example must reference vendor scoring, vendor ranking, GMC feed, or Klaviyo — pick the one closest to the skill's purpose
- Anthropic API key reference: `ANTHROPIC_API_KEY` env var, never hardcoded

Use the Write tool. Never use bash heredocs for skill files — they make diffs hard to review.

---

## Step 7 — Commit and report

After writing files:

1. `git add skills/[skill-name]/`
2. Commit on the active feature branch with message: `feat: forge [skill-name] skill (from [target])`
3. Push to the active branch (NOT main without explicit permission)
4. Output a single scan-block report:

```
SKILL FORGED — [skill-name]

Source: [target name + URL]
Sources mined: [count]
Concepts harvested: [count]  →  KEEP: X  DROP: Y  ADD: Z

Files written:
  skills/[skill-name]/SKILL.md
  skills/[skill-name]/references/...

Trigger phrases (one of these auto-invokes it):
  - "[phrase 1]"
  - "[phrase 2]"
  - "[phrase 3]"

First-use example:
  > [a sentence Michael would actually say]

Branch: [branch-name]  |  Commit: [SHA short]  |  Pushed: yes/no
```

Done. No "want me to also..." follow-ups unless there's a real blocker.

---

## Anti-patterns

- **Never** stop at the gap analysis. Always produce the SKILL.md file.
- **Never** include concepts in KEEP that don't tie to a named AccentOS gap.
- **Never** generate a skill with <3 concrete AccentOS substitutions.
- **Never** ship a skill where the description is generic enough to also fit a non-AccentOS user — the description IS the trigger surface.
- **Never** copy SKILL.md prose verbatim from the target. Forge means rewrite from concepts, not paraphrase.
- **Never** write a skill longer than the source's docs. If it's longer, it's bloated — cut to the 80/20.
- **Never** add fields like "## Future enhancements" or "## Roadmap" — skills are shipped state, not plans.
- **Never** ask Michael which trigger phrases to use — infer from how he talks in his actual prompts.
