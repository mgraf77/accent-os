# skill-performance-tracker — Data Sources Map

> Where every metric value comes from. SKILL.md Step 0 reads these files in parallel; this is the authoritative parse-order doc.

---

## Source priority order

When two sources disagree, the higher-priority source wins.

| Source | Priority | Used for |
|---|---|---|
| `skills/efficiency-monitor/efficiency-log.md` | 1 (canonical) | invocations, skill-bypass, retry-loop, redone-wip |
| `PROMPT_LOG.md` | 2 (gap-fill) | slash invocations, undo phrases, natural-language matches |
| `skills/[name]/eval-results.json` | 1 (canonical) | quality_signal |
| `git -C /home/user/accent-os log` | 3 (fallback) | last-touched date when other signals missing |
| `skills/_index.md` | 1 (canonical) | skill name set, trigger phrases, schedule hints |
| `SESSION_LOG.md` | 2 (gap-fill) | session boundary timestamps |

---

## Source 1: `skills/efficiency-monitor/efficiency-log.md`

**Format:** Markdown, append-only. Each session block:

```markdown
## YYYY-MM-DD HH:MM session [shortsha]

### Inefficiencies
- retry-loop ×N — [detail]
- redundant-read ×N — [detail]
- ...

### Recurring sequences (in-session)
- [step1 → step2 → step3] ×N

### Skill bypass
- task: [description]
  matched-skill: [skills/_index.md entry that would have handled it]

### Notes
- [any qualitative obs worth keeping]
```

**Parse rules:**
1. Each `## YYYY-MM-DD HH:MM session [shortsha]` is one session.
2. `### Skill bypass` lines with `matched-skill: [name]` → `match` event for `[name]` (the skill matched a trigger but did NOT run).
3. `### Inefficiencies` retry-loop / redone-wip entries that name a skill → `negative_signal` for that skill.
4. The session shortsha is the dedup key — never count the same session twice for the same skill.
5. `### Notes` lines that mention a skill name in invocation context (verbs: "ran", "invoked", "used") → `invocation` event.

---

## Source 2: `PROMPT_LOG.md`

**Format:** Markdown, append-only. Date-headed blocks:

```markdown
### YYYY-MM-DD — [session label]
- [HH:MM] [user prompt]
- [HH:MM] [next user prompt]
...
```

**Parse rules:**
1. Lines containing `/skill-name` (slash invocation) → `invocation` event for `skill-name`. Date from the heading.
2. Lines containing natural-language phrases that pass Jaccard ≥0.6 against any `triggers` field in `_index.md` → `match` event for the matched skill (NOT an invocation, just a match — Claude may have done the work directly without invoking the skill).
3. Lines within 5 prompts of an invocation containing undo-phrases (`undo`, `redo`, `that's wrong`, `try again`, `actually`, `no, do it differently`) → `negative_signal` for the invoked skill.

---

## Source 3: `skills/[name]/eval-results.json`

**Format:** Promptfoo standard output:

```json
{
  "summary": {
    "numAsserts": {
      "pass": N,
      "total": M
    },
    "timestamp": "..."
  },
  ...
}
```

**Parse rules:**
1. `quality_signal = summary.numAsserts.pass / summary.numAsserts.total`.
2. If `summary.timestamp` is older than 30 days → flag `quality_signal_stale = true`.
3. If file missing → `quality_signal = null`.

---

## Source 4: `git log` (fallback only)

**Format:**
```bash
git -C /home/user/accent-os log --since="60 days ago" --pretty=format:"%h %ad %s" --date=short -- skills/[name]/
```

**Parse rules:**
1. ONLY use when no other source has data for the skill in the window.
2. Last commit date inside `skills/[name]/` → fallback `staleness` proxy.
3. Number of commits → very weak signal of activity, NOT used for invocation counting (commits ≠ invocations).

---

## Source 5: `skills/_index.md`

**Format:** Markdown, sectioned by skill name `### name`:

```markdown
### skill-name
- summary: ...
- triggers: "phrase 1", "phrase 2", "phrase 3"
- when_to_use: ...
- when_NOT: ...
- companion: [comma-separated names]
```

**Parse rules:**
1. `### name` heading defines the canonical skill name set. Skills not in `_index.md` are excluded from reports (registry is authoritative).
2. `triggers` list parsed for Jaccard matching against `PROMPT_LOG.md`.
3. `companion` list parsed for the per-skill drill-down "companion activity" section.
4. Schedule hints (cadence keywords) detected in `summary` or `when_to_use`: `quarterly`, `monthly`, `weekly`, `daily`, `annual`, `yearly`. Used by schedule-aware staleness override.

---

## Composability with other skills

This skill READS the data sources above. It does NOT write to any of them. Specifically:

- Never modify `efficiency-log.md` — that's `efficiency-monitor`'s domain.
- Never modify `PROMPT_LOG.md` — append-only by other parts of the system.
- Never modify `eval-results.json` — written by `skill-eval-suite` runs.
- Never modify `_index.md` — auto-regenerated via `/vibe regenerate skill index`.

Only writes go to `snapshots.csv`, `last-run.md`, and (on save) `reports/YYYY-MM-DD.md`.
