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
  at "here's what it would look like." Reads gotcha-log.md before each run and writes new
  gotchas after, so the skill self-optimizes over time.
---

# skill-forge

**Purpose:** Take an external tool or methodology, extract its real concepts from primary sources, drop the parts that don't fit AccentOS, add the parts that are missing, and ship a usable local skill in one pass.

Five things in order: **preflight → extract → gap → forge → log**. No step is optional, no step is skippable.

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

## Scope (what this skill is and is not)

**In scope:**
- External targets: GitHub repos, SaaS products, methodologies, frameworks, individual community skills.
- Targets identified by name, URL, or description.

**Out of scope — fail fast with a one-line redirect:**
- No target named at all → "Name a target tool/methodology, or use skill-creator for blank-slate skills."
- Target is internal (an AccentOS file or existing skill) → "Use Edit on the existing skill, not skill-forge."
- Target is Michael's own past workflow → "Use skill-creator with your workflow as input."

---

## Step 0 — Preflight

Before any search, do these in parallel:

1. **Read the gotcha log** — `/home/user/accent-os/skills/skill-forge/gotcha-log.md`. Apply every prevention rule listed. If the file does not exist yet, treat as empty.
2. **Load AccentOS context** — `/home/user/accent-os/skills/repo-scout/references/project-profiles.md`. If missing, fall back to `/home/user/accent-os/BUILD_PLAN_CLAUDE.md` and `/home/user/accent-os/MASTER.md` to recover named gaps.
3. **Mine Michael's phrasing** — read the last ~50 entries of `/home/user/accent-os/PROMPT_LOG.md` and tail of `/home/user/accent-os/SESSION_LOG.md`. Note recurring phrases for use as trigger candidates in Step 5. If either file is absent or empty, skip silently and fall back to phrases from existing `skills/*/SKILL.md` description blocks for tone.
4. **Capture branch state** — `git -C /home/user/accent-os branch --show-current`. Note the current branch for Step 7. If on `main`, Step 7 will auto-create a `claude/forge-[skill-name]-[short-hash]` branch before committing — do not push to main without explicit permission.

Output of Step 0: a short pre-run note: gotcha rules applied, profile source used, branch.

---

## Step 1 — Identify the target

Pin down exactly what is being forged from. Confirm:
- Name (e.g. "Cascade", "OKR cascade methodology", "alirezarezvani/c-level-advisor")
- Type (repo, SaaS product, methodology, framework, single skill, **multi-skill pack**)
- Anchor URL if known (GitHub repo, marketing site, docs)

If the target is ambiguous, pick the highest-likelihood match given AccentOS context and state which one in the output. Do not ask Michael to disambiguate — pick and explain.

### Step 1.5 — Pattern vs. product check

The target Michael named may be the *wrapper* around a pattern, not the pattern itself. If the surface framing fails Step 4 (KEEP < 3), retry exactly once with the target re-framed as the underlying pattern (e.g. Cascade-the-board-reporting-tool → cascade-the-mechanic). Document the re-frame in Step 0's preflight note. Do not retry twice — if the re-framed target still fails, abort to WATCH.

---

## Step 2 — Multi-source extraction

Run parallel searches across **all five source classes**. See `references/extraction-sources.md` for the full checklist. Minimum coverage:

**GitHub layer**
- Primary repo: README, SKILL.md(s), folder structure, top-level docs/
- **If target is a multi-skill pack** (>3 SKILL.md files): enumerate every sub-skill folder and harvest each SKILL.md frontmatter description before consolidating. The pack-level README is not enough.
- Adjacent repos: forks, "awesome-X" lists referencing it, related-tools sections
- Issues + Discussions: real user friction, requested features, anti-patterns

**Official-site layer**
- Marketing site, docs site, pricing page (paid features = signal of where actual value lives)

**Social layer**
- X/Twitter, Reddit, Hacker News, LinkedIn — weight independent technical posts heavily

**Review/blog layer**
- Independent blog reviews, YouTube demos (transcripts when available), podcasts

**Pricing/access layer (paid tools only)**
- What's gated behind which tier — gates reveal core value props

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

Three explicit columns. No skipping. See `references/gap-analysis-template.md`.

| KEEP (target does it, AccentOS needs it) | DROP (target does it, AccentOS doesn't) | ADD (AccentOS needs it, target doesn't) |

Rules:
- KEEP must include reasoning tied to a specific AccentOS gap from the profile loaded in Step 0.
- DROP must explain why — usually "wrong project type" or "redundant with existing skill."
- ADD captures what makes the forged skill better than the original — vendor scoring, BigCommerce store-cwqiwcjxes, Supabase hsyjcrrazrzqngwkqsqa, ecommerce ops, vendor_scores/vendor_overrides tables.

**Decision gate:**
- KEEP ≥ 3 → proceed to Step 5.
- KEEP < 3 → invoke Step 1.5 once. If still < 3 after re-frame, output "Insufficient signal. Recommendation: WATCH [target]" and stop. Log a gotcha entry with `outcome: aborted_to_watch`.

---

## Step 5 — Skill design

Decide before writing:

- **Skill name** — kebab-case, action-oriented, ≤3 words. Names describe what it does for AccentOS, not where concepts came from. Verify uniqueness: `ls /home/user/accent-os/skills/` must not contain a directory of the same name.
- **Description block** — ≥250 chars, multi-line via `>`. Must include "AccentOS" or "Accent Lighting" by name. Trigger phrases in the description are sourced from Step 0's mining of `PROMPT_LOG.md` when available — match Michael's phrasing, not hypothetical phrasing. Always include a "do not use when" pair.
- **Workflow** — 4–7 numbered steps. Each step has a concrete output. Imperatives only.
- **Output format** — paste-ready blocks. Tables when scanning is the use case.
- **References** — split overflow into `references/*.md`. Keep SKILL.md under ~5000 tokens.

---

## Step 6 — Forge the skill files

Write to `/home/user/accent-os/skills/[skill-name]/`:
- `SKILL.md` — frontmatter + workflow, following `references/skill-template.md`
- `references/*.md` — extracted templates, checklists, lookup tables

AccentOS-mandatory substitutions everywhere:
- Paths → `/home/user/accent-os/` (note Codespace alt `/workspaces/accent-os/` only when relevant)
- "your project" → AccentOS or Accent Lighting (specific)
- Generic store → BigCommerce store-cwqiwcjxes
- Generic DB → Supabase hsyjcrrazrzqngwkqsqa
- At least one concrete example referencing vendor scoring, vendor ranking, GMC feed, or Klaviyo
- Anthropic API key via `ANTHROPIC_API_KEY` env var

Use the Write tool. Never use bash heredocs for skill files.

### Step 6.5 — Pre-commit validation

Before staging any file:

1. **YAML frontmatter parses** — name + description present, description is multi-line `>` block, description is ≥250 characters, contains "AccentOS" or "Accent Lighting" by name, no unfilled `[bracketed]` placeholders anywhere in the file.
2. **Name uniqueness** — directory does not collide with an existing skill.
3. **Substitution count** — at least 3 AccentOS-stack-specific substitutions present, drawn from this allowlist: AccentOS, Accent Lighting, store-cwqiwcjxes, hsyjcrrazrzqngwkqsqa, vendor scoring, vendor_scores, vendor_overrides, GMC, Google Merchant Center, Feedenomics, Klaviyo, BigCommerce, Supabase, Cloudflare Pages, Anthropic API, /home/user/accent-os, /workspaces/accent-os. The 3 must be substantive references, not throwaway mentions.
4. **Anti-pattern section** — present, ≥3 entries.
5. **No prose walls** — every section is either a list, table, or ≤4-sentence block.
6. **Gotcha-log integrity** — if appending a gotcha entry, it conforms to the schema in `gotcha-log.md`: 7 required fields present (target, what_happened, root_cause, fix_this_run, prevention_rule, applied_to_skill_md, outcome), NNN sequential, valid `outcome` enum value, `prevention_rule` is one normalized sentence. The 8th field `proposal_surfaced` is optional and only present after self-optimize fires.

Any failure → fix in place, do not commit. Log the failure as a gotcha.

---

## Step 7 — Commit and report

After Step 6.5 passes:

1. Confirm branch (Step 0 output). If on main, create `claude/forge-[skill-name]-[8-char-rand]` first.
2. `git add skills/[skill-name]/`
3. Commit message: `feat: forge [skill-name] skill (from [target])`
4. Push to the active branch (NOT main without explicit permission).
5. Output a single scan-block report:

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
Gotchas hit this run: [count, see gotcha-log.md]
```

---

## Step 8 — Write the gotcha log

After the report, update `/home/user/accent-os/skills/skill-forge/gotcha-log.md`:

- If the run was clean (no surprises, all validations passed first try) → write nothing.
- If anything was non-trivial (re-frame triggered, validation failed, source layer empty, naming collision, branch on main, sub-skill enumeration, etc.) → append one entry per surprise using the schema below.
- After appending, scan the full log. If any `prevention_rule` line (exact string match) appears in ≥2 entries with `applied_to_skill_md: no` AND no entry in that group has a `proposal_surfaced` date within the last 7 days, propose an Edit to this SKILL.md in the report (do not auto-edit) and set `proposal_surfaced: YYYY-MM-DD` on the matching entries. After Michael approves and the edit lands, set `applied_to_skill_md: yes` on those entries.

Entry schema:

```
### gotcha-NNN — YYYY-MM-DD — [target name]
- target: [full target identifier]
- what_happened: [one sentence]
- root_cause: [one sentence]
- fix_this_run: [what was done in-flight]
- prevention_rule: [single normalized sentence — same wording for same problem class]
- applied_to_skill_md: no
- outcome: [success | aborted_to_watch | validation_retry]
- proposal_surfaced: [YYYY-MM-DD only after self-optimize fires; omit otherwise]
```

NNN is sequential. Same `prevention_rule` wording across entries is what lets the self-optimization rule fire — be deliberate about phrasing it as a class, not a one-off.

---

## Anti-patterns

- **Never** stop at the gap analysis. Always produce the SKILL.md file or an explicit WATCH abort.
- **Never** include concepts in KEEP that don't tie to a named AccentOS gap.
- **Never** generate a skill with <3 concrete AccentOS substitutions.
- **Never** ship a skill where the description is generic enough to also fit a non-AccentOS user.
- **Never** copy SKILL.md prose verbatim from the target. Forge means rewrite from concepts, not paraphrase.
- **Never** write a skill longer than the source's docs. If it's longer, it's bloated.
- **Never** add "Future enhancements" or "Roadmap" sections — skills are shipped state.
- **Never** ask Michael which trigger phrases to use — mine PROMPT_LOG.md, infer from his actual phrasing.
- **Never** auto-edit this SKILL.md from the gotcha-log without surfacing the proposed Edit in the report first.
- **Never** push to main without explicit permission.
