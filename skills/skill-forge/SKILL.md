---
name: skill-forge
description: >
  Deep-research a target tool, repo, methodology, or skill across multiple sources
  (GitHub, official site, social, docs, reviews), run a gap analysis against AccentOS +
  Accent Lighting needs, and ship a custom AccentOS-scoped SKILL.md that captures only
  the relevant concepts. Use this skill when Michael says: "look into [X]", "extract
  concepts from [X]", "build me a skill based on [X]", "deep-dive [X] and make it mine",
  "I want a [X]-style skill for AccentOS", "adapt [X] for me", "forge a skill from [X]",
  "research [X] and give me a custom version", "rip the good parts out of [X]", or any
  phrasing that asks to ingest an external tool and produce a tailored local skill. Distinct from repo-scout:
  repo-scout decides whether to install something as-is; skill-forge assumes the as-is
  version is the wrong fit and builds the right-fit version. End deliverable is a working
  skill committed to skills/, not a recommendation. Always produces the file — never stops
  at "here's what it would look like." Reads gotcha-log.md before each run and writes new
  gotchas after, so the skill self-optimizes over time.
---

# skill-forge

**Purpose:** Take an external tool or methodology, extract its real concepts from primary sources, drop the parts that don't fit AccentOS, add the parts that are missing, and ship a usable local skill in one pass.

Six phases in order: **preflight → extract → assess → propose-and-approve → forge-and-ralph → log**. No phase is optional. The approve gate (Step 5) and Ralph loop (Step 8) are non-negotiable — they exist to prevent over-shipping and under-testing respectively.

---

## Quickstart

| Michael says | Entry point |
|---|---|
| "look into [X]" / "build me a skill based on [X]" | Full run, Step 0 → 10 |
| "look into [URL]" (direct URL given) | Fast-extract: skip Steps 0.3 + 1.5; anchor Step 2 on URL directly |
| "extract concepts from [X]" / "what can we steal from [X]" | Steps 2–4 only — surface concept table, stop before Step 5 gate |
| "build [name1] and [name2] from [X]" | Step 5 pre-approved; skip gate, use named list as approval |

**Step 5 approval gate reply syntax:** `build all` · `build [name1] [name2]` · `build all except [name]` · `build with changes: [name] - [change]` · `skip all`

---

## Trigger Recognition

Run this skill when Michael says anything like:
- "look into [X]"  ← when paired with a tool/URL/repo, this is the standard entry point
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

**"Look into" disambiguation:**
- Specific tool/URL/repo + build-or-adapt intent → **skill-forge** (this skill)
- Category search or install-or-skip intent → **repo-scout** instead
- Ambiguous: run repo-scout first (cheaper); chain to skill-forge if verdict is EVALUATE or FORGE

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

The target Michael named may be the *wrapper* around a pattern, not the pattern itself. If the surface framing fails Step 4 (STEAL = 0), retry exactly once with the target re-framed as the underlying pattern (e.g. Cascade-the-board-reporting-tool → cascade-the-mechanic). Document the re-frame in Step 0's preflight note. Do not retry twice — if the re-framed target still fails, abort to WATCH.

---

## Step 1.8 — Community Inspiration Sweep

After confirming the target (and re-framing if Step 1.5 fired), run a 60-second parallel GitHub sweep for existing Claude Code skills in the same domain. Fire this alongside the first Step 2 search batch — do not block on it.

**Searches to run in parallel:**
- `site:github.com "SKILL.md" [domain keyword from Step 1]`
- `awesome-claude-skills [domain keyword]`
- rohitg00/awesome-claude-code-toolkit index
- ComposioHQ/awesome-claude-skills index

**For each community skill found in the same domain (cap: top 3):**
- Extract its trigger phrases, unique workflow steps, and anti-patterns section
- Tag with `[community]` in Step 3's concept inventory
- In Step 4: community patterns are valid STEAL candidates even when the primary target doesn't use them — the community has already stress-tested them

**Output:** `Community sweep: [N] skill(s) found — [name1], [name2]` (or "Community sweep: 0 found")

Do not skip. This step prevents reinventing patterns the community has battle-tested and surfaces steal candidates the primary target's docs would never reveal.

---

## Step 2 — Multi-source extraction

Run parallel searches across all five source classes per `references/extraction-sources.md`. Aim for ≥15 concepts/features before moving on. Step 4 filters — Step 2 surfaces everything.

**Special cases (read; layer details are in the checklist):**
- **Multi-skill pack** (>3 SKILL.md files in repo): enumerate every sub-skill SKILL.md individually — the pack README is not enough.
- **WebFetch 403/404**: fall back in order → (1) `WebSearch` quoted filename + distinctive concepts; (2) `site:` operator on blocked host; (3) search-engine snippets. Mark source empty only after all three fail.
- **Saturation**: stop after 3 consecutive sources yield 0 new concepts.

Harvest concept by concept, not summarized. List every named primitive, workflow step, integration, AI/automation feature, paid-tier feature, and anti-pattern individually. The goal is the longest possible raw list.

---

## Step 3 — Concept inventory

Consolidate the Step 2 harvest into one structured table. Group near-duplicates only when they're literally the same thing (e.g. "Magic AI" and "AI assistant" → one row). Do not aggressively dedupe — keep concepts separate when they have distinct inputs/outputs.

| # | Concept / feature | Best source | Freq | AccentOS relevance | Community? |
|---|---|---|---|---|---|

Relevance values: **HIGH** (direct fit), **MEDIUM** (needs translation), **LOW** (interesting only), **NONE** (drop).
`Community?` column: **Y** if found in Step 1.8 sweep, **N** otherwise. Community=Y concepts are STEAL-eligible regardless of how the primary target packages them.

Aim for ≥15 rows for any non-trivial target. Step 4 will filter — Step 3's job is to make every feature visible so nothing slips through.

---

## Step 4 — Concept theft assessment

For each concept in the Step 3 inventory, decide: **steal** or **drop**.

The question is **not** "does AccentOS have a gap this fills." The question is: "is this concept a reusable pattern worth rebuilding in AccentOS-native form?" Even if a concept overlaps something AccentOS or Claude Code already does, a tighter, named, paste-ready AccentOS-native version is usually worth forging.

**STEAL** (rebuild as a skill — default for any concept with reusable structure):
- Reusable primitives — data shapes, validation patterns, named workflows
- Patterns whose value transcends their original tool wrapper (cascade mapping, named-analysis-as-artifact, NL→SQL with schema context, parameterized queries)
- Concepts that overlap existing skills if rebuilding gives a tighter, differently-scoped, or more invokable version
- Anything Michael could plausibly invoke once a quarter or more

**DROP**:
- Marketing fluff with no underlying capability
- Tool-specific UI conveniences that don't translate (multiplayer cursors, drag-and-drop, brand-colored buttons)
- Pure infrastructure (their auth model, billing system, hosting)
- Concepts whose AccentOS-native version is already implemented in an existing skill AND a rebuild would only add noise

**ADD** (concepts neither the target nor the community has, but the new skill should incorporate):
- Supabase `hsyjcrrazrzqngwkqsqa` awareness, real schema references
- BigCommerce store-cwqiwcjxes context
- AccentOS module paths, vendor_scores / vendor_overrides table awareness
- Anthropic API conventions
- Step 1.8 community patterns not already captured under STEAL (tag these `[community-ADD]`)

For each STOLEN concept, classify:
- **STANDALONE** — becomes its own SKILL.md (preferred when concept has clear named inputs and outputs)
- **SUB-FEATURE** — folds into one of the standalone skills as a workflow step

**Decision gate:**
- STEAL ≥ 1 standalone → proceed to Step 5 (proposals + approval gate). **Do not start designing or building yet.**
- STEAL = 0 after re-frame → output WATCH and stop. Log gotcha with `outcome: aborted_to_watch`. WATCH should be **rare** — most non-trivial targets have at least one stealable concept.

**Step 4's output is a candidate list, not a build manifest.** The candidates go through Michael's approval gate in Step 5 before any file is written.

---

## Step 5 — Skill proposals & approval gate

For **each STANDALONE candidate** from Step 4, output one row in the proposal table. Then append a reason line for every DEFER or SKIP below it.

```
| Skill | Stolen from | What it does | Effort | Pairs with | Rec |
|-------|-------------|--------------|--------|------------|-----|
| [name] | [concept / community] | [one sentence] | L/M/H | [skill, skill] | BUILD / DEFER / SKIP |
```

Below the table, one line per DEFER or SKIP:
- **[name]**: [one sentence — blocked by, premature for, or redundant with X]

Recommendation values:
- **BUILD** — high signal, AccentOS-shaped, low-friction. Ship now.
- **DEFER** — promising but blocked: missing data, premature, dependent on a future AccentOS state.
- **SKIP** — better as a one-off than a skill (single SQL query, fully redundant with existing skill).

After all proposal blocks, output the approval gate exactly:

```
═══ APPROVAL GATE ═══
To approve, reply with one of:
  - "build all"               → builds every BUILD-recommended candidate
  - "build [name1] [name2]"   → builds only the named candidates
  - "build all except [name]" → builds every recommendation except the named
  - "build with changes: [name] - [change]"  → tweaks a proposal before build
  - "skip all"                → no builds; close the run

I am stopping here. Nothing is built until you reply.
═══════════════════
```

**Halt the run.** Do not proceed to Step 6 until Michael's reply specifies which proposals to build. If Michael's reply is ambiguous, ask one targeted clarifying question rather than guessing.

When Michael replies, parse the approval into a build list. Only the approved skills proceed to Step 6+.

**Auto-log DEFERs.** After Michael's approval lands, every candidate Michael deferred (whether via "build all except [name]" or by accepting the recommendation) gets appended to `/home/user/accent-os/skills/skill-forge/future-builds.md`. Schema:

```
### future-NNN — YYYY-MM-DD — [skill-name]
- proposed_from: [target name + URL]
- what_it_does: [one sentence]
- why_deferred: [one sentence — blocked by, premature for, etc.]
- revisit_when: [explicit trigger condition — "3+ quarters of data", "next module refactor"]
- pairs_with: [related skills if any]
```

NNN is sequential. The future-builds.md log is what Michael consults when picking the next thing to build. Do not skip this step — DEFERs that aren't logged get lost.

---

## Step 6 — Skill design (per approved concept)

For **each APPROVED concept** from Step 5, run this design pass independently. Skills run through Steps 6–8 in a per-skill loop, then commit together at Step 9.

Decide before writing:

- **Skill name** — kebab-case, action-oriented, ≤3 words. Names describe what it does for AccentOS, not where concepts came from. Verify uniqueness: `ls /home/user/accent-os/skills/` must not contain a directory of the same name.
- **Description block** — ≥250 chars, multi-line via `>`. Must include "AccentOS" or "Accent Lighting" by name. Trigger phrases in the description are sourced from Step 0's mining of `PROMPT_LOG.md` when available — match Michael's phrasing, not hypothetical phrasing. Always include a "do not use when" pair.
- **Workflow** — 4–7 numbered steps. Each step has a concrete output. Imperatives only.
- **Output format** — paste-ready blocks. Tables when scanning is the use case.
- **References** — split overflow into `references/*.md`. Keep SKILL.md under ~5000 tokens.
- **Composability contracts** — if the skill outputs structured data (IDs, tables, scores), declare the output schema in one line (e.g. `Output: vendor_id list, sorted by score desc`). If it reads another skill's output, name the expected input. This makes skills chain cleanly without ambiguity.

### Step 6.1 — Prereq-redirect analysis (mandatory for every skill)

Answer these before writing a single workflow step:

1. **Inputs** — What data or prior-skill output must exist before this skill is useful? List each dependency by name.
2. **Outputs** — What skills or workflows consume this skill's result? List each.
3. **Pre-check block** — For every identified input dependency, add a pre-check + redirect to the forged SKILL.md. Place it as Step 0 or the opening of Step 1 in the forged skill's workflow — not buried mid-document:

```
Pre-check: If [prereq condition not met]:
  Output: "Run [prereq-skill] first — [one-line why this matters for AccentOS]."
  Stop.
```

This fires for every approved skill without exception. "Simple" skills have dependencies too — discovering them in the Ralph loop costs more than adding them here.

---

## Step 7 — Forge the skill files

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

### Step 7.5 — Pre-commit validation

Before staging any file:

1. **YAML frontmatter parses** — name + description present, description is multi-line `>` block, description is ≥250 characters, contains "AccentOS" or "Accent Lighting" by name, no unfilled `[bracketed]` placeholders **outside fenced code blocks**. Bracketed strings inside ``` fenced blocks are template/runtime markers (e.g. `[metric name]`, `[full Step 3 table]`) and are intentional — do not flag them.
2. **Name uniqueness** — directory does not collide with an existing skill.
3. **Substitution count** — at least 3 AccentOS-stack-specific substitutions present, drawn from this allowlist: AccentOS, Accent Lighting, store-cwqiwcjxes, hsyjcrrazrzqngwkqsqa, vendor scoring, vendor_scores, vendor_overrides, GMC, Google Merchant Center, Feedenomics, Klaviyo, BigCommerce, Supabase, Cloudflare Pages, Anthropic API, /home/user/accent-os, /workspaces/accent-os. The 3 must be substantive references, not throwaway mentions.
4. **Anti-pattern section** — present, ≥3 entries.
5. **No prose walls** — every section is either a list, table, or ≤4-sentence block.
6. **Gotcha-log integrity** — if appending a gotcha entry, it conforms to the schema in `gotcha-log.md`: 7 required fields present (target, what_happened, root_cause, fix_this_run, prevention_rule, applied_to_skill_md, outcome), NNN sequential, valid `outcome` enum value, `prevention_rule` is one normalized sentence. The 8th field `proposal_surfaced` is optional and only present after self-optimize fires.

Any failure → fix in place, do not commit. Log the failure as a gotcha.

---

## Step 8 — Ralph loop (per-skill stress test + refinement)

For **each forged skill** that passed Step 7.5, run a Ralph loop before committing. The Ralph loop is the iterative stress-test pattern: simulate using the skill, find what breaks, fix the SKILL.md, repeat until 2 consecutive passes surface no new issues.

**Per skill:**

1. **Mental dry-run** — pick 2 plausible Michael phrasings that should trigger this skill. For each, walk through every workflow step and ask: what's missing, what's ambiguous, what could fail silently?
2. **Edge cases** — list the 4 most likely failure modes: (a) no/malformed input, (b) missing dependency file, (c) ambiguous result or conflict with another skill, (d) **community-duplicate check** — does a community skill found in Step 1.8 already do this better? If yes, should the forged skill redirect to it instead of running?
3. **Apply fixes** in the skill's SKILL.md via Edit. Re-run Step 7.5 validation after fixes.
4. **Repeat** until a pass surfaces 0 new issues OR 4 iterations have run (cap to prevent over-iteration).
5. **Log Ralph notes** as a comment in the commit message: "Ralph: N iterations, M issues fixed, [one-line summary of biggest fix]".

If a Ralph iteration surfaces a class-of-issue that affects skill-forge itself (not just the forged skill), append a gotcha entry per Step 10 rules — that's how skill-forge improves over time.

**Stopping rule:** the loop ends when two consecutive iterations find nothing new. Do not iterate "for completeness" — Ralph is for finding actual issues, not gold-plating.

---

## Step 9 — Commit and report

After every skill in this run has passed Step 7.5 and Step 8:

1. Confirm branch (Step 0 output). If on main, create `claude/forge-[target-slug]-[8-char-rand]` first — one branch per forge run, regardless of how many skills were forged.
2. `git add skills/[skill-1]/ skills/[skill-2]/ ...`
3. Commit message: `feat: forge N skills from [target] — [skill-1], [skill-2], ...`
4. Push to the active branch (NOT main without explicit permission).
5. Output a single scan-block report listing all forged skills:

```
SKILL FORGED — [skill-name]

Source: [target name + URL]
Sources mined: [count]
Concepts harvested: [count]  →  STEAL: X  DROP: Y  ADD: Z

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

Quality score: [N/5]
  Specificity  [0-2]: 2 = ≥5 AccentOS stack refs; 1 = ≥3; 0 = <3
  Ralph depth  [0-2]: 2 = hit 4-iter cap on ≥1 skill; 1 = 2+ clean passes; 0 = 1 pass
  Anti-patterns[0-1]: 1 = ≥5 entries per skill; 0 = only the 3-entry minimum
```

---

## Step 10 — Write the gotcha log

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

- **Never** skip the Step 5 approval gate. Building before Michael approves means producing skills he didn't sign off on.
- **Never** skip the Step 8 Ralph loop. A skill that hasn't been stress-tested ships hidden gotchas.
- **Never** stop at the gap analysis. Either produce proposals (Step 5) or an explicit WATCH abort with reasoning.
- **Never** DROP a concept solely because AccentOS already does something similar — overlap is not disqualifying; a tighter AccentOS-native version is the point of the skill.
- **Never** generate a skill with <3 concrete AccentOS substitutions.
- **Never** ship a skill where the description is generic enough to also fit a non-AccentOS user.
- **Never** copy SKILL.md prose verbatim from the target. Forge means rewrite from concepts, not paraphrase.
- **Never** write a skill longer than the source's docs. If it's longer, it's bloated.
- **Never** add "Future enhancements" or "Roadmap" sections — skills are shipped state.
- **Never** ask Michael which trigger phrases to use — mine PROMPT_LOG.md, infer from his actual phrasing.
- **Never** auto-edit this SKILL.md from the gotcha-log without surfacing the proposed Edit in the report first.
- **Never** push to main without explicit permission.
