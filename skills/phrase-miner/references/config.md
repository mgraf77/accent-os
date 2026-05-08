# phrase-miner — config

> Tunable knobs for `phrase-miner` SKILL.md Steps 0–4. Read at run start.
> Edit values in place; the skill re-reads on every invocation (no cache).

---

## Corpus window

| Knob | Default | Range | Notes |
|------|---------|-------|-------|
| `prompt_log_window` | 50 entries | 10–200 | Lookback in PROMPT_LOG.md (newest first) |
| `session_log_window` | 25 entries | 5–100 | Half of prompt window — SESSION_LOG is secondary |
| `session_weight` | 0.5 | 0.0–1.0 | Frequency weight for SESSION_LOG-only phrasings |
| `min_corpus_size` | 10 entries | 5–50 | Combined PROMPT+SESSION minimum for audit mode (Step 0.6 guard); below this, audit refuses |

Override per-invocation: "mine triggers for vendor-cascade window=100" → `prompt_log_window=100`.

---

## Filter thresholds

| Knob | Default | Notes |
|------|---------|-------|
| `min_overlap_match` | 0.7 | Char-overlap ratio for STALE/MATCH classification in audit mode |
| `min_freq_strong` | 2 | Minimum occurrences to qualify as a strong candidate |
| `min_freq_keep` | 1 | Singletons kept only if register-tag count ≥ 3 |
| `register_tag_min` | 3 | Number of register tags that promotes a singleton to weak candidate |

---

## Output sizing

| Knob | Default | Notes |
|------|---------|-------|
| `mine_top_n` | 8 | Top candidates per topic in mine mode |
| `audit_top_n` | 5 | Per-skill candidates in audit mode |
| `audit_high_priority_threshold` | 3 | STALE count that promotes a skill to "high-priority" recommend list |

---

## Mode-trigger phrasings (read by Step 0)

If invocation matches any of these, mode is forced:

**`mine` mode forced when:** "mine triggers for", "phrase mine", "/mine", "what does michael actually say [about|for]", "extract phrasings for", "mine [skill-or-topic]".

**`audit` mode forced when:** "trigger-phrase audit", "audit triggers", "audit phrasings", "/phrase-audit", "are these triggers right".

**Caller-driven mode** (no Michael invocation, called from another skill):
- `skill-forge` calls with `mode=mine, topic=[concept]` — passed via the briefing block, not parsed from natural language.
- `skill-health-monitor` calls with `mode=audit` — passed by skill-health-monitor's audit step.
- Ralph-loop pass-1 (per `gap-optimizer/references/optimizer-briefing.md`) calls with `mode=mine, topic=[skill-being-optimized]`.

---

## Save-to-references behavior

| Mode | Default save path |
|------|-------------------|
| `mine` | stdout only; save to `references/last-mine-[topic]-[YYYY-MM-DD].md` if invocation includes `save: true` OR caller is `skill-forge` |
| `audit` | always saves to `references/last-audit-[YYYY-MM-DD].md` AND surfaces stdout |

Old saved runs are kept for trend analysis. No auto-prune. `skill-health-monitor` runs the prune (e.g. "drop saved mines older than 90 days") as part of its ecosystem maintenance.

---

## Fallback behavior

- **Both PROMPT_LOG.md and SESSION_LOG.md missing/empty** → output the empty-corpus stub message and exit. Do not synthesize candidates.
- **Only one corpus available** → run with what exists, note in run header.
- **`_index.md` missing** → cannot run audit mode. Mine mode falls back to topic-only filter (no skill-cluster matching).
- **Michael profile missing** → Step 3 register tagging downgrades to `lowercase` only; flag in run header.
