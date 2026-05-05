# vibe-speak — corpus

> Historical-prompt-history ingestion + analysis. Backtests every prompt Michael has sent to learn his communication style, vocabulary, register, topic clusters, and trend direction. Used by SKILL.md Step 24 (corpus learning).

## What this is for

vibe-speak v8 calibrates from one local file (`PROMPT_LOG.md`, ~80 entries). v9 expands the calibration to Michael's full historical prompt corpus across all Claude projects.

The skill becomes much more accurate when it's seen 1,000+ real prompts vs 80 local ones — it learns:
- His full vocabulary (not just AccentOS-domain words)
- His evolution over time (when he started using new tools / concepts / phrasing)
- His project-specific dialects (vibe-speak should adapt across projects)
- Cross-project pattern repetition (brute-forces that span projects → propose a universal skill)

## Honest about access limits

**Claude Code CANNOT directly read claude.ai chat history.** The web app stores conversations on Anthropic's servers; they're not file-system-accessible from a Claude Code session. So full backtesting requires Michael to export his data.

**What IS accessible right now:**
- `PROMPT_LOG.md` (this repo, ~80 entries)
- Any file Michael drops in `corpus/imports/`

**What needs Michael's action:**
- Export from claude.ai → Settings → Privacy → Request Account Export
- Wait for email with download link (typically <24h)
- Unzip → drop `conversations.json` in `corpus/imports/`
- Run `/vibe import` (parses JSON, normalizes to entries, runs backtest)

**Cross-project corpus expansion path:**
- Each AccentOS-style repo has its own `PROMPT_LOG.md` → drop those files in `imports/` too
- Or: a unified prompt log at `~/claude-prompts/` if you ever set one up
- Or: Anthropic Console exports if you use the API (different format, parser stub included)

---

## Directory structure

```
skills/vibe-speak/corpus/
├── _index.md            ← this file
├── imports/             ← raw imports drop here
│   ├── _README.md       ← how to import (claude.ai format spec)
│   ├── PROMPT_LOG.md.import   ← seed import from local PROMPT_LOG.md
│   └── [claude-export-YYYY-MM-DD.json]  ← future imports
├── vocabulary.md        ← extracted n-grams + frequency + first-seen
├── trends.md            ← weekly emergence, velocity, shifts
├── topics.md            ← clustered domain topics
└── backtest-runs.md     ← log of every backtest run (when, what corpus, what was learned)
```

## Three core artifacts

### 1. vocabulary.md
Every distinct term/phrase Michael has used, with:
- First-seen date (when did this enter his vocabulary?)
- Frequency (how often does it appear?)
- Classification (hard-keep / active-translation / filler / trigger / closure)
- Adoption velocity (new < 7 days, adopted 7-30 days, established >30 days)

### 2. trends.md
Per-week / per-month rollups:
- New vocabulary terms entering Michael's lexicon
- Topic shifts (what he was working on this week vs prior)
- Velocity changes (terms growing vs declining)
- Self-improvement signals (when his prompts get terser → adapt default mode)

### 3. topics.md
Clustered topic groups, each:
- Recurring noun phrases
- Project / domain context
- First seen, last seen, count
- Cross-project links

---

## /vibe corpus commands (defined in SKILL.md Step 14)

| Command | Does |
|---|---|
| `/vibe import [path]` | Read and parse a prompt file (markdown PROMPT_LOG, claude.ai JSON, or text file). Normalize, append to `imports/`, trigger backtest. |
| `/vibe import claude.ai` | Wizard for claude.ai data export — prints the export instructions, watches `imports/` for new files. |
| `/vibe backtest` | Re-run analysis on entire corpus, refresh vocabulary.md / trends.md / topics.md. |
| `/vibe backtest [date-range]` | Backtest a specific window. |
| `/vibe vocab` | Print top 20 vocabulary terms grouped by classification. |
| `/vibe vocab new` | Print terms first-seen in last 7 days. |
| `/vibe trends` | Print weekly emergence + velocity report. |
| `/vibe trends [period]` | Print specific period (e.g. `last month`, `2026 Q1`). |
| `/vibe topics` | Print active topic clusters. |
| `/vibe topics [name]` | Drill into one cluster. |
| `/vibe propose calibration` | After a backtest, surface profile-update proposals (new hard-keeps, new triggers, new filler-kill candidates) for Michael to approve. |

---

## How backtest works (per SKILL.md Step 24)

For every prompt in the corpus:

1. **Extract entities** — code identifiers, file paths, SQL keywords, AccentOS / Accent Lighting / Supabase / GMC mentions, M-task IDs, version tags, track refs. All become hard-keep candidates.
2. **Detect signals** — closure phrases, autonomy phrases, register markers (lowercase, typos, comma splices), bump-up signals.
3. **Classify vocabulary** — common nouns get tagged by domain; verbs get tagged by action class.
4. **Track timeline** — first-seen + last-seen + frequency for each term.
5. **Detect topic clusters** — recurring noun-phrase co-occurrences.

Output:
```
─── backtest complete ───
Corpus:        [N] prompts across [M] dates
Vocabulary:    [X] unique terms (Y new since last backtest)
Hard-keep candidates: [list of new high-confidence terms]
Trigger phrases:      [list of detected phrasings]
Topic clusters:       [list]
Profile updates proposed: [count]

Run `/vibe propose calibration` to review and apply.
```

---

## Trend awareness — the "growing with you" loop

vibe-speak surfaces vocabulary / topic changes proactively when they cross thresholds:

| Signal | Threshold | Surfacing |
|---|---|---|
| New term used 5+ times in 7 days | Adoption | "Noticed you've started using `[term]` 5× this week. Adding to hard-keep." |
| Term frequency drops 80% over 14 days | Decline | "`[term]` usage dropped — keep on hard-keep or remove?" |
| New topic cluster forms (3+ unique noun phrases co-occurring 3+ times) | Topic emergence | "New topic detected: `[cluster]`. Want to mark this as a domain in the profile?" |
| Cross-project pattern (3+ same brute-force across imports) | Skill candidate | Per Step 23 — propose forging a new skill |
| Style drift (avg prompt length / register / closure-frequency changes >30%) | Style change | "Your prompts have gotten [shorter / lowercase / more autonomous] this month. Adjust default mode?" |

These surfacings are **never auto-applied** — Michael approves each one. Same pattern as Step 13 self-optimize.

---

## Privacy

- Imports are git-tracked unless they contain PII / secrets — those go in `corpus/imports/.gitignored/` (auto-skipped from commits).
- Claude.ai exports may contain sensitive customer / vendor / financial data — automatically scan for `customer.email`, `phone`, `auth_token`, `api_key`, `password` patterns and redact before adding to vocabulary.md.
- Original imports stay raw in `imports/` (not parsed into vocabulary.md beyond hashed n-grams) so Michael can audit.

---

## What v9 ships (right now)

- This `_index.md`
- `imports/_README.md` with claude.ai export workflow
- `imports/PROMPT_LOG.md.import` — seed import from this repo's PROMPT_LOG.md
- `vocabulary.md` — seeded from real PROMPT_LOG analysis (~30 terms)
- `trends.md` — seeded with 2026-05-04 → 2026-05-05 baseline
- `topics.md` — seeded with detected clusters (autonomous-build / inline-edit / module-modes / etc.)
- 11 new `/vibe corpus...` commands
- SKILL.md Step 24 — Corpus learning

Future v9.x adds: claude.ai JSON parser, Anthropic API export parser, multi-repo PROMPT_LOG aggregation.
