# phrase-miner — Michael register cues

> Heuristics for tagging mined phrasings with register notes.
> Sourced from `skills/vibe-speak/profiles/michael.md` "Register mirror" + observation-log.md.
> Read at SKILL.md Step 3.

---

## Purpose

When phrase-miner ranks candidate triggers, it tags each one with **register notes** that show *why* a phrasing matches Michael's voice. This file is the canonical mapping. Update when Michael profile gets a new register signal.

---

## Tag definitions

| Tag | Detection rule | Why it matters |
|-----|----------------|----------------|
| `lowercase` | Phrasing contains zero uppercase letters (excluding obvious proper nouns like AccentOS, M21, Klaviyo, BigCommerce) | Michael's default register — the strongest single voice signal |
| `typo` | Phrasing matches any known typo pattern (see below) | Michael phrasings frequently include typos — preserving them keeps the trigger surface authentic |
| `run-on` | Phrasing has 2+ comma-spliced clauses with no period before end | Michael writes long imperatives with commas |
| `imperative` | Phrasing starts with a known build/ship verb (see below) | Michael leads with the action |
| `time-budgeted` | Phrasing matches `i have [N] (minute|hour|min|hr)s?`, `in the next [time]`, `by EOD`, `before [time]`, `[N] minute budget` | Signals max-density mode (gsd) — important context for downstream skills |
| `lazy` | Single-word or two-word phrasing — "resume", "continue", "go", "go.", "do it", "knock out", "build it", "next" | Michael's terminal mode after extended back-and-forth |
| `meta` | Phrasing is about the skill ecosystem itself — "build a skill", "forge", "skill-forge", "gap analysis", "mine triggers", "audit" | Phrasings that drive meta-infra skill invocation |

---

## Known Michael typo patterns

These appear repeatedly in PROMPT_LOG.md. Detection is exact substring match (case-insensitive):

| Typo | Correct form |
|------|--------------|
| `remue` | resume |
| `ideea` | idea |
| `i have` (no apostrophe) | I've |
| `dont` | don't |
| `its` (when "it is") | it's |
| `becuase` | because |
| `accentlightinginc` | accentlightinginc.com (he sometimes drops the TLD when writing fast) |
| `claud` | claude |

Adding new patterns: append a row when the same typo is observed ≥2 times across separate PROMPT_LOG entries.

---

## Build / ship verbs (imperative-tag detection)

Phrasings starting with any of these words get the `imperative` tag. Sourced from `vibe-speak/profiles/michael.md` HARD-KEEP block.

```
build, ship, wire up, hook up, swap, push, pull, run, save, load, fire, kill,
blow up, extract, pivot, knock out, look into, gap analysis, resume, continue,
pause, commit, scan, audit, mine, forge, find, optimize, rip, do, give me,
make, add, hand off, drop, turn on, turn off, knock, score, rank, pop
```

(Note: `look into` is two words but functions as a single verb — match as a phrase.)

---

## Hard-keep proper nouns (do NOT mark as caps-violation in `lowercase` detection)

These are valid uppercase tokens even in an otherwise-lowercase phrasing. Detection of `lowercase` ignores them.

```
AccentOS, Accent Lighting, M01..M40, M-task, BUILD_PLAN, BUILD_PLAN_CLAUDE.md,
BUILD_PLAN_MICHAEL.md, BUILD_INTELLIGENCE.md, SESSION_LOG, PROMPT_LOG,
PROMPT_QUEUE, WORK_IN_PROGRESS, WIP, MASTER, KPI, KPI_CATALOG,
Track 0.1..6.10, v6.10.41..v6.10.65, Codespace, Cloudflare, BigCommerce,
GMC, MCP, Anthropic, Codex, Klaviyo, Supabase, RLS, SQL, JSON, API, FK, PK,
CSV, GA4, GSC, store-cwqiwcjxes, hsyjcrrazrzqngwkqsqa
```

---

## Frequency weighting

When the same canonical form appears in both PROMPT_LOG (full weight 1.0) and SESSION_LOG (default weight 0.5 — see `config.md`), sum:

- `effective_freq = prompt_count + (session_count × session_weight)`

When ranking candidates by frequency, use `effective_freq`, not raw count. This prevents SESSION_LOG-only phrasings (which are paraphrases by Claude) from outranking actual Michael utterances.

---

## Confidence scoring (for `mine` mode output table)

| Confidence | Rule |
|------------|------|
| `strong` | `effective_freq` ≥ 2 AND ≥ 2 register tags |
| `weak` | `effective_freq` = 1 AND ≥ 3 register tags (high register fit compensates for low frequency) |
| `noise` | Doesn't qualify for strong or weak → dropped, never reported |

---

## Anti-cues (signals to NOT tag)

- A phrasing inside a `**Context:**` block in PROMPT_LOG.md is Claude's narration, NOT Michael — skip it. Only `**Prompt:** "..."` strings count.
- A phrasing inside a fenced code block is config or output, not natural language — skip it.
- A phrasing that's a pure file path or SQL fragment — skip it.
- A phrasing containing emoji or rich Unicode — preserve verbatim but flag `lang=other` and let the consumer decide.
