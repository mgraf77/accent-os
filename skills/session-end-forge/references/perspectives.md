# Multi-perspective ralph personas

> Used by `session-end-forge` Steps 5 (Pass 1, Claude in-context) and 6 (Pass 2, agent subagent). Five distinct personas, each scoring 0–20 against `scoring-rubric.md`. Total score 0–100. Ship threshold 85.

Each persona has: **voice**, **interrogations** (the questions they ask of the draft), **scoring focus**, **most-common fixes** they trigger.

---

## 1. Reliability Auditor (0–20)

**Voice:** "I'm paranoid. I assume inputs are wrong, prereqs are missing, prior steps failed silently, the user supplied junk, dependent files don't exist. My job is to find every place this skill's workflow assumes the happy path and make it explicit about the unhappy ones."

**Interrogations:**
- What happens if the input is empty?
- What happens if the input is malformed (wrong shape, wrong type)?
- What happens if a prereq file (`PROMPT_LOG.md`, `_session-scratch.md`, `skills/_index.md`) doesn't exist or is empty?
- What happens if a Bash command fails or times out?
- What happens if WebFetch returns 403/404/non-200?
- What happens if two of the named outputs collide?
- Is there a fallback specified for every read that could plausibly fail?
- Are failure modes redirected, not swallowed?

**Scoring focus:** every plausible failure mode named in the SKILL.md and either handled inline or explicitly redirected.

**Most-common fixes:**
- Add a "if the file does not exist yet, treat as empty" clause to every Step that reads a file
- Add a fallback chain when external calls (WebFetch, Bash) fail
- Convert silent assumptions into named anti-patterns

---

## 2. Trigger Hunter (0–20)

**Voice:** "I am Michael's voice transcript. I have read 50 of his recent prompts. I know how he actually phrases requests — short, lowercase, often verbless, often profane, often with backticks around tool names. I will not let this skill ship with sanitized hypothetical trigger phrases like 'Could you please initiate the workflow.' If the trigger phrasing doesn't sound like Michael typed it, the skill will never auto-fire."

**Interrogations:**
- Are the trigger phrases verbatim or near-verbatim from `PROMPT_LOG.md`?
- Does the trigger list cover at least 3 distinct phrasings (short, mid, long)?
- Is there a slash-command trigger (`/skill-name`) for explicit invocation?
- Do the triggers avoid common Michael phrasings that would auto-trigger unintentionally ("yes", "ok", "do it")?
- Does the description include "or any phrasing that [describes the surface]" so vibe-speak Step 23 routing has fuzzy fallback?
- Is there an explicit "do not use when" / disambiguation clause vs. similar skills?

**Scoring focus:** trigger phrasing realism + coverage + disambiguation.

**Most-common fixes:**
- Replace formal triggers with PROMPT_LOG-mined phrasings
- Add slash-command trigger
- Add "do not use when" pair to disambiguate from companion skills
- Strip overly-generic phrasings that would over-trigger

---

## 3. Stack Native (0–20)

**Voice:** "I check whether this skill is AccentOS-shaped or generic. A generic skill that mentions 'your database' or 'the project' is a smell. The real test: could a non-Accent-Lighting user pick this skill up and use it without modification? If yes, it failed. If the skill names Supabase project ID, BigCommerce store ID, vendor scoring tables, or specific AccentOS paths, it passed."

**Interrogations:**
- Is `hsyjcrrazrzqngwkqsqa` (Supabase) referenced when DB context is relevant?
- Is `store-cwqiwcjxes` (BigCommerce) referenced when commerce context is relevant?
- Are paths fully qualified to `/home/user/accent-os/...` (or Codespace `/workspaces/accent-os/...`)?
- Are concrete examples drawn from real AccentOS work — vendor scoring, GMC feed, Klaviyo, vendor_scores/vendor_overrides tables?
- Is "AccentOS" or "Accent Lighting" named in the description (mandatory) and ≥2× in the body?
- Are environment variables named (`ANTHROPIC_API_KEY`, etc.) where relevant?

**Scoring focus:** allowlist substitution count (≥3 substantive references required) + concrete example quality.

**Most-common fixes:**
- Replace "the database" with "Supabase hsyjcrrazrzqngwkqsqa"
- Replace "the store" with "BigCommerce store-cwqiwcjxes"
- Add a concrete example using vendor_scores or GMC feed
- Fully qualify all file paths

---

## 4. Maintenance Skeptic (0–20)

**Voice:** "I am six months in the future. I am reading this skill cold. Some files it references no longer exist. Some Supabase columns have been renamed. Some workflows have been replaced. My job is to flag every brittle assumption that will rot — every hardcoded path that should be derived, every magic number, every step that depends on a file's exact line count."

**Interrogations:**
- Are line numbers / column positions hardcoded, or are they discovered via grep/awk?
- Are there "read line N" or "edit line N" instructions that will break on edit?
- Are there hardcoded SHAs, version numbers, or specific tool versions that will go stale?
- Are file paths discovered via `git ls-files` / `find`, or hardcoded?
- Does the skill version-pin anything that should be flexible?
- Does the description include a "Future enhancements" or "Roadmap" section (forbidden — those rot)?
- Are model IDs version-pinned in a way that won't survive Claude 4.7 → 4.8?
- Is there a step that depends on the current state of a doc that gets edited every session (PROMPT_LOG, BUILD_PLAN)?

**Scoring focus:** how many brittle assumptions are present, how visible they are in the SKILL.md.

**Most-common fixes:**
- Replace hardcoded paths with derived (`git -C ... rev-parse --show-toplevel` etc.)
- Replace version-pinned model IDs with "latest Claude Sonnet 4.x" framing
- Remove "Future enhancements" sections
- Convert line-number references to grep/awk patterns

---

## 5. Anti-pattern Cop (0–20)

**Voice:** "I read the Anti-patterns section first. If I don't find at least 3 specific failure modes named — not generic 'never write bad code' filler — the skill is not shippable. Anti-patterns are how the skill defends itself against future-Claude shortcuts. They must be specific to this skill, not boilerplate."

**Interrogations:**
- Is the Anti-patterns section present?
- Does it have ≥3 entries? (5+ preferred for non-trivial skills.)
- Is each entry **specific** to this skill's failure modes, not generic ("never skip tests")?
- Does each entry start with "Never X"?
- Does the section name failure modes that have actually occurred or are plausible (not hypothetical)?
- Are anti-patterns derived from this session's actual mistakes / near-misses?
- Do anti-patterns cover: skipping a gate, shipping without validation, over-narrating, unauthorized destructive actions?

**Scoring focus:** anti-pattern specificity + count + coverage of the skill's actual failure surface.

**Most-common fixes:**
- Add 2 more specific anti-patterns derived from session signature
- Replace generic anti-patterns with concrete ones ("Never skip Step 7.5 validation" beats "Never skip validation")
- Add a "Never push to main without permission" entry if the skill writes files
- Add a "Never ship without scoring" entry if the skill has a quality gate

---

## How the personas compose

In **Pass 1**, Claude embodies each persona in turn, top of the SKILL.md to bottom, scoring and recording findings per persona. Fixes are applied between perspectives (so later perspectives see earlier fixes). Order: Reliability → Trigger → Stack → Maintenance → Anti-pattern.

In **Pass 2**, an agent subagent (general-purpose) reads the perspectives + rubric files cold and runs the same five evaluations independently. The agent does not see Pass 1's findings — that's the "outside eyes" point. The agent surfaces `PASS-2-FINDINGS` with totals + top-3-fixes. Claude applies those fixes.

A **Pass 3 / Pass 4** (only triggered if score < 85 after Pass 2) repeats the Pass 1 shape — Claude walks the personas again. Cap is 4 passes total.

---

## When findings conflict

If two perspectives disagree (e.g. Reliability wants more failure modes documented; Maintenance wants the skill shorter):

1. Stack Native and Anti-pattern Cop tie-break in favor of MORE specificity.
2. Reliability and Maintenance tie-break in favor of EXPLICIT failure handling (Reliability wins) over LEAN docs (Maintenance loses on this axis).
3. Trigger Hunter never tie-breaks on length — only on phrasing realism.

Rule of thumb: when in doubt, the skill should be more specific to AccentOS, not less.
