---
name: phrase-miner
description: >
  Mines AccentOS PROMPT_LOG.md + SESSION_LOG.md for the actual phrasings Michael
  uses, clusters them by topic against `skills/_index.md`, and outputs candidate
  trigger-phrase lists for new or existing skills. Eliminates the per-forge
  re-discovery cost where every skill-forge Step 6 + every Ralph pass-1 re-mines
  the same logs from scratch. Two modes: `mine` (for one skill or topic — produce
  a ranked candidate-phrase list with frequency + register notes) and `audit`
  (for the whole skills/ tree — produce a mismatch report flagging skills whose
  current trigger phrases don't match how Michael actually asks). Use this skill
  when Michael says: "mine triggers for [X]", "what does michael actually say",
  "phrase mine [X]", "trigger-phrase audit", "/mine [skill]", "audit triggers",
  "look at the prompt log for [X]", "do these triggers match how i talk",
  "backtest the triggers", or any phrasing that asks to extract Michael-voice
  phrasings from the prompt corpus. Companion to
  skill-forge (Step 6 consumer), vibe-speak (Step 23 router consumer), and
  skill-health-monitor (audit consumer). Always produces a paste-ready phrase
  list with frequency and register notes — never auto-edits any SKILL.md trigger
  section. Output is read-only proposal; the human (or skill-forge approval gate)
  decides what to apply.
---

# phrase-miner

**Purpose:** Stop reinventing trigger-phrase mining on every forge cycle and every Ralph pass. This skill is the canonical mining tool — read PROMPT_LOG, cluster, surface Michael's real phrasings, output a paste-ready candidate list.

Two modes, both read-only: **`mine`** (one skill / one topic — produce candidate phrases) and **`audit`** (all skills — produce mismatch report). Same workflow, different scope at Step 2.

---

## Trigger Recognition

Run this skill when Michael says anything like:
- "mine triggers for [X]"
- "what does michael actually say [about X]"
- "phrase mine [X]" / "/mine [X]"
- "trigger-phrase audit" / "audit triggers"
- "what phrasings does michael use for [topic]"
- "look at the prompt log for [topic]"
- "do these triggers match how i talk"
- "backtest the triggers"

Also run **automatically** when:
- `skill-forge` Step 6 hits the design pass for a new skill — it calls phrase-miner in `mine` mode with `topic=[concept]` instead of re-implementing the mining inline
- `skill-health-monitor` runs an ecosystem audit and detects no recent trigger-phrase audit — it calls phrase-miner in `audit` mode
- Any Ralph loop pass-1 fires (per `gap-optimizer/references/optimizer-briefing.md` Pass 1 spec) — calls phrase-miner with `topic=[skill-name]`

---

## Scope

**In scope:**
- Reading raw Michael phrasings from `PROMPT_LOG.md` (canonical) and `SESSION_LOG.md` (secondary corroborator).
- Clustering phrasings by topic using simple keyword match against `skills/_index.md` summaries.
- Producing per-skill or per-topic candidate trigger-phrase tables with frequency + register notes.
- Auditing existing skills' `## Trigger Recognition` sections against mined phrasings.

**Out of scope — fail fast with a one-line redirect:**
- Editing trigger sections in any SKILL.md → "phrase-miner is read-only. Apply edits via skill-forge or manual Edit."
- Mining for a non-Michael user → "phrase-miner is calibrated to Michael's register only. For other profiles, see vibe-speak/profiles/."
- Building a new skill end-to-end → "Use skill-forge. phrase-miner is its sub-tool, not a substitute."
- Cross-project corpus mining (claude.ai imports etc.) → "Use vibe-speak/corpus/ tooling. phrase-miner stays scoped to the repo's PROMPT_LOG + SESSION_LOG."

---

## Step 0 — Preflight

In parallel:

1. **Read source corpora** —
   - `/home/user/accent-os/PROMPT_LOG.md` — last N entries (default N=50, configurable per `references/config.md`)
   - `/home/user/accent-os/SESSION_LOG.md` — last N/2 entries (secondary; weights phrasings half-strength)
   - If either file is missing or empty, do NOT abort. Note the gap in the run header and proceed with whatever exists. If BOTH are missing, output the stub message "PROMPT_LOG and SESSION_LOG both empty — no corpus to mine. phrase-miner cannot run until at least one log has Michael phrasings." and stop.
2. **Read skill registry** — `/home/user/accent-os/skills/_index.md`. Cache the per-skill `summary` + `triggers` + `when_to_use` strings for the run.
3. **Read Michael register profile** — `/home/user/accent-os/skills/vibe-speak/profiles/michael.md` — specifically the "Vocabulary — terms Michael uses naturally (HARD-KEEP)" block + "Register mirror" rules. These tell you what Michael's lowercase / typo / fragment register looks like and which terms to preserve verbatim.
4. **Determine mode + scope** —
   - **Topic parse rule:** the topic is the first token AFTER any of these phrases in the invocation: "mine triggers for", "mine ", "phrase mine ", "what does michael actually say [about|for]", "look at the prompt log for", "/mine ". Examples: "mine triggers for vendor-cascade" → topic=`vendor-cascade`; "/mine email-drafter" → topic=`email-drafter`; "phrase mine churn" → topic=`churn`. Match against `_index.md` to resolve "churn" → `churn-predictor` if exact-name match fails.
   - If invocation matches a topic-parse rule → mode=`mine`, scope=parsed topic.
   - If invocation matches `audit` rules from `references/config.md` (bare "audit triggers" / "trigger-phrase audit" / "/phrase-audit") → mode=`audit`, scope=all skills.
   - If invocation came from skill-forge Step 6 (caller-driven) — mode=`mine`, scope=the candidate concept passed in via the briefing block (no natural-language parse needed).
   - If ambiguous (no topic parsed, no audit phrase, no caller context) — surface ONE clarifying question: "mine for which skill or topic, or run a full audit?" Do not default-guess.
5. **Self-circularity check** — if scope = `phrase-miner` itself, proceed (eat the dogfood) but flag in the output that the mining is recursive: "self-mining run — beware that the mined phrases will not yet appear in PROMPT_LOG until this skill has been used in production for ≥3 sessions."
6. **Corpus-size guard (audit mode only)** — if combined PROMPT_LOG + SESSION_LOG entries < `min_corpus_size` (default 10, see `references/config.md`), refuse audit mode and surface: "corpus too small for ecosystem audit — only [N] entries. Run mine mode against specific skills instead, or wait until corpus reaches ≥10 entries." Skip audit and exit. Mine mode has no minimum corpus — it can run with 1 entry and report "no candidates yet" cleanly.
7. **Topic-without-registry-entry handling** — if mode=mine and `topic` does not appear in `skills/_index.md` (e.g. skill-forge passes a brand-new skill name still being designed), fall back to using the topic name itself + any `topic_keywords` passed by the caller as the keyword set for Step 2. Note in the run header: "topic=[X] not in registry yet — keyword filter using topic name only."

Output of Step 0: a one-line preflight note: "mode=[mine|audit], scope=[topic|all], corpus=[N PROMPT entries + M SESSION entries], registry=[K skills], Michael-register loaded, guards=[passed|downgraded:reason]."

---

## Step 1 — Extract phrasings (raw harvest)

Walk the corpus from newest to oldest. For each entry, pull every quoted Michael utterance — these are the phrasings inside `**Prompt:** "..."` blocks in PROMPT_LOG.md and the `Michael:` / direct-quote markers in SESSION_LOG.md.

Preserve **verbatim**:
- Original casing (lowercase stays lowercase)
- Original typos (`remue building`, `ideea`)
- Original punctuation (or lack of it)
- Original word boundaries (don't auto-split run-ons)

Strip:
- Surrounding quotes (just the inner string)
- Markdown bullet markers
- File-path-only utterances ("path:line" without prose) — these aren't trigger phrases

Produce a flat list — one phrasing per row, no clustering yet:

| # | Phrasing (verbatim) | Source | Date |
|---|---------------------|--------|------|

Aim to harvest every Michael utterance in the configured window. Do not pre-filter for length or relevance — that happens in Step 2.

**Failure modes for this step:**
- PROMPT_LOG.md entry has no `**Prompt:**` block (older format) → fall back to extracting any `"..."`-wrapped string in the entry body.
- Phrasing is multi-sentence — keep as one row but split into named clauses in Step 3 if any clause looks like a stand-alone trigger.
- Phrasing is non-English or contains code blocks — keep verbatim, mark `lang=other` in a notes column.

---

## Step 2 — Cluster by topic

For each phrasing in Step 1's flat list, assign one or more topic labels.

**Mode `mine` (one topic):**
- Filter the flat list to phrasings that mention any keyword from the target skill's `summary` + `triggers` strings (case-insensitive substring match).
- Keep only matched rows. Order by date descending.

**Mode `audit` (all skills):**
- For each skill in `_index.md`, run the same keyword filter against the flat list.
- Build a per-skill phrasing bucket. Skills with 0 matches get flagged as "no Michael phrasings in corpus" — usually means the skill is too new, never invoked, or its triggers don't match Michael's vocabulary.

**Tie-breaking when one phrasing matches multiple skills:**
- Compare keyword overlap count — assign to highest-overlap skill, list as secondary on others.
- Companion-cluster heuristic: if the phrasing also matches a companion-listed skill in `_index.md`, prefer the companion match (signals an established workflow chain).

Output of Step 2 internal scratch (not surfaced): per-skill (or per-topic in mine mode) bucket of matched phrasings.

**Edge cases:**
- Skill summary uses jargon Michael never uses (e.g. summary says "vendor scoring orphan metrics" but Michael says "what vendors are messed up") → keyword filter misses. The audit mode flags this as `register-mismatch: high` and surfaces the gap as an explicit row.
- Phrasing matches no skill in registry — bucket as `unmatched: candidate-for-new-skill` and surface in the output. These are skill-forge inputs.

---

## Step 3 — Score + extract candidate triggers

For each phrasing in each bucket, normalize and rank.

**Normalization steps (build a "canonical form" for frequency counting):**
1. Lowercase the entire phrasing.
2. Strip leading filler ("now", "ok so", "so", "and", "also")
3. Collapse internal whitespace.
4. Replace specific proper nouns with `[X]` placeholders for variable extraction (e.g. "look into Caveman" → "look into [X]"). Keep both the variable form and one verbatim instance.
5. Strip trailing punctuation.

**Frequency counting:**
- Group canonical forms.
- Count occurrences. Track which dates each occurrence came from.
- Tag with **register notes** drawn from the Michael profile read in Step 0:
  - `lowercase` (no caps used)
  - `typo` (contains a known Michael typo pattern — `remue`, `ideea`, missing apostrophe in `i have`/`dont`/`its`)
  - `run-on` (comma-spliced, no terminal period)
  - `imperative` (starts with verb — "build", "look into", "knock out")
  - `time-budgeted` (matches "i have [N] [time-unit]" pattern)
  - `lazy` (single-word like "resume", "continue", "go")

**Candidate triggers — selection rules:**
- A canonical form is a **strong candidate** if frequency ≥ 2 AND it's at least 2 words OR it's a known Michael lazy-trigger ("resume", "go", "continue").
- A canonical form is a **weak candidate** if frequency = 1 BUT register notes match Michael profile heavily (≥3 register tags).
- Singletons with no register match are **noise** — drop them.

For mine mode: produce candidate list per topic (default top 8).
For audit mode: produce candidate list per skill (default top 5 each).

**Zero-candidate fallback (mine mode):** If after Step 3 the candidate list is empty, do NOT silently emit an empty table. Instead, output:
1. The empty-candidate notice with the topic + keyword set used
2. A "synthesize-from-summary" suggestion: pull the existing skill's `summary` from `_index.md` (or the caller's `topic_keywords`) and propose 3 candidate phrases derived by lowercasing + Michael-imperative-prefixing the summary (e.g. summary "Trace vendor scores" → candidate "trace vendor scores"). Mark each as `confidence: synthesized — no corpus evidence yet`.
3. Recommend invoking phrase-miner again after ≥3 production uses to replace synthesized candidates with real ones.

---

## Step 4 — Compare to existing triggers (audit mode only)

Skip this step in mine mode.

For each skill that already exists in `_index.md`:
1. Read its current `## Trigger Recognition` section from `skills/[name]/SKILL.md`.
2. Diff each existing trigger phrase against the Step 3 candidate list:
   - **MATCH** — existing phrase ≈ canonical form of a mined candidate (≥70% character overlap or shared keywords)
   - **STALE** — existing phrase has 0 matches in mined candidates AND has frequency 0 in the corpus
   - **MISSING** — mined candidate has frequency ≥ 2 and no existing trigger covers it
3. Tag each row with one of MATCH / STALE / MISSING.

Output:
- Per-skill diff table.
- Aggregate summary: total skills, MATCH count, STALE count, MISSING count.

**Partial-output handling:**
If a skill's SKILL.md is missing or unreadable, mark it `unreadable: skipped` in the diff and continue. Don't abort the whole audit for one bad file.

---

## Step 5 — Compose the output report

Use the format in `## Output format` below. Always include:
- Run header (mode, scope, corpus size, date)
- Step 3 candidate table (mine mode) OR Step 4 diff tables + aggregate (audit mode)
- "Apply this output" footer naming the consumer skill (skill-forge / Edit / skill-health-monitor)

For mine mode: write to stdout AND optionally to `references/last-mine-[topic]-[date].md` if the invocation included `save: true` or was triggered by skill-forge.

For audit mode: write to stdout AND to `references/last-audit-[date].md` (always — audits are valuable history).

**Never** edit any other skill's SKILL.md directly. Always surface a paste-ready proposal block with explicit `apply via Edit` or `apply via skill-forge approval gate` instruction.

---

## Output format

### Mine mode (single topic)

```
═══ PHRASE-MINER — mine mode ═══
Topic: [skill-name or concept-name]
Corpus: [N PROMPT entries + M SESSION entries] | Window: last [N] entries
Date: YYYY-MM-DD

## Top candidate trigger phrases (frequency × register fit)

| # | Canonical form | Verbatim example | Freq | Register notes | Confidence |
|---|----------------|------------------|------|----------------|------------|
| 1 | look into [X]  | "Look into Caveman..." | 4 | imperative, lazy-leadin | strong |
| 2 | gap analysis   | "do a gap analysis of..." | 3 | imperative | strong |
| 3 | rip the good parts out of [X] | "rip the good parts out of cascade" | 1 | imperative, lowercase | weak |
| ... |

## Suggested trigger block (paste into skills/[name]/SKILL.md)

Run this skill when Michael says anything like:
- "[top-1]"
- "[top-2]"
- "[top-3]"
- "[top-4]"
- "[top-5]"

Apply via: skill-forge Step 6 (if forging new) OR Edit on existing SKILL.md.
═══════════════════
```

### Audit mode (all skills)

```
═══ PHRASE-MINER — audit mode ═══
Corpus: [N PROMPT + M SESSION] | Skills audited: K | Date: YYYY-MM-DD

## Per-skill diff (top 10 most-mismatched first)

| Skill | Current trigger | Status | Mined candidate | Note |
|-------|-----------------|--------|-----------------|------|
| vendor-cascade | "score traceability" | STALE | "what vendors are messed up" | register-mismatch: jargon vs. plain |
| ...   | ...             | MATCH  | (existing trigger ≈ mined)    |      |
| ...   | (none — frequency≥2) | MISSING | "look at the cascade" | strong candidate |

## Aggregate
- Skills audited: K
- Triggers MATCH: A (X%)
- Triggers STALE: B (Y%)
- Triggers MISSING: C (Z%)
- Skills with zero corpus matches: D (likely never invoked OR register mismatch)

## Recommended action
- High-priority (≥3 STALE in one skill): [list]
- Apply via: skill-health-monitor (proposes Edits, never auto-applies)
═══════════════════
```

### Partial / failure output

```
═══ PHRASE-MINER — partial run ═══
Mode: [mine|audit]
Issues encountered:
- [skill X]: SKILL.md unreadable, skipped
- [skill Y]: zero corpus matches, flagged register-mismatch
- corpus PROMPT_LOG.md: only N entries available, requested N=50

Partial output below — re-run after fixing the listed issues for full coverage.
[continues with whatever was produced]
═══════════════════
```

### Zero-candidate fallback (mine mode, no corpus signal)

```
═══ PHRASE-MINER — mine mode (no corpus signal) ═══
Topic: [topic]
Corpus: [N entries] | Keyword set: [keyword list]

No mined candidates — the corpus contains zero phrasings matching the keyword
filter for this topic. This usually means:
  - the skill is brand new (no production usage yet)
  - the skill is M-task-blocked (Michael hasn't had reason to invoke it)
  - the skill's summary uses jargon Michael doesn't naturally say (register mismatch)

## Synthesized candidates (NO corpus evidence — labeled clearly)

| # | Synthesized phrase | Source | Confidence |
|---|--------------------|--------|------------|
| 1 | [lowercase summary phrase] | derived from _index.md summary | synthesized |
| 2 | "look at [topic]"          | Michael imperative-prefix template | synthesized |
| 3 | "/[topic-slug]"            | slash-command convention | synthesized |

Re-run phrase-miner against this topic after ≥3 production invocations to replace
synthesized candidates with corpus-backed ones.
═══════════════════
```

### Audit-mode corpus-too-small refusal

```
═══ PHRASE-MINER — audit refused ═══
Reason: corpus too small ([N] entries < min_corpus_size=10)
Recommendation: run mine mode against specific skills you care about, or wait
until the corpus has ≥10 PROMPT_LOG entries.
═══════════════════
```

---

## AccentOS context

- **Stack:** read-only — operates on `/home/user/accent-os/PROMPT_LOG.md`, `/home/user/accent-os/SESSION_LOG.md`, and `/home/user/accent-os/skills/_index.md`. No Supabase, no BigCommerce, no Anthropic API call. Pure file IO.
- **Project:** AccentOS — Accent Lighting's internal operating system.
- **Paths:** `/home/user/accent-os/` (Codespace alt: `/workspaces/accent-os/`)
- **Companion skills:**
  - `skill-forge` — Step 6 consumer (calls phrase-miner in mine mode for new skill candidates)
  - `vibe-speak` — Step 23 router consumer (uses mined phrasings to improve match-confidence)
  - `skill-health-monitor` — audit-mode consumer (uses diff to propose Edit blocks; never auto-applies)
  - `efficiency-monitor` — composes with: when efficiency-monitor flags a `skill-bypass`, phrase-miner explains *why* the bypass happened by surfacing the Michael phrasing the matched skill failed to catch
  - `gap-optimizer` — refers Pass-1 of every Ralph loop here per `references/optimizer-briefing.md`
- **Stack-vocab examples this skill mines for:** vendor scoring, vendor_scores, vendor_overrides, GMC, Klaviyo, BigCommerce, Supabase, M-task IDs (M03/M04/M06/M09/M10), `BUILD_PLAN_CLAUDE.md`, `BUILD_PLAN_MICHAEL.md`, `KPI_CATALOG.md`. Michael uses these verbatim — preserve them in the canonical form, do NOT translate.

---

## Anti-patterns

- **Never** edit another skill's `## Trigger Recognition` section directly. phrase-miner is read-only — output is always a paste-ready proposal, never an automatic Edit.
- **Never** invent phrasings Michael hasn't actually used. If the corpus is empty for a topic, output zero candidates with a "no corpus signal" note. Do not synthesize.
- **Never** strip Michael's lowercase + typo + fragment register when surfacing candidates. The whole point is that those *are* the trigger surface.
- **Never** mine outside the AccentOS repo. Cross-project corpus is vibe-speak's job, not phrase-miner's.
- **Never** call phrase-miner recursively from inside its own output. If a forge run for `phrase-miner` itself fires, the recursion stops at one pass — flag the result as self-mining (per Step 0.5).
- **Never** auto-apply a candidate to `skills/_index.md`. The registry is regenerated by `/vibe regenerate skill index`, not by phrase-miner.
- **Never** drop verbatim examples when reporting. Frequency without verbatim is meaningless — Michael's voice is the artifact.
- **Never** ship a mine-mode run that produced 0 candidates without surfacing the empty-corpus reason explicitly. Silent zero-output looks like success.
- **Never** run audit mode against a corpus with fewer than `min_corpus_size` entries. Small-corpus audits produce mostly noise — refuse and downgrade to mine mode per Step 0.6.
- **Never** treat a topic-not-in-registry case as an error. Skill-forge passes brand-new skill names mid-design; phrase-miner's job is to mine for them anyway, using the topic name as the keyword fallback per Step 0.7.
- **Never** mark synthesized-from-summary candidates as `strong` or `weak` confidence. They are a separate `synthesized` tier — clearly labeled so consumers know there's no corpus evidence behind them.
