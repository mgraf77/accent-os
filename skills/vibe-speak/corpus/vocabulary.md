# vibe-speak — vocabulary database

> Every distinct term/phrase in Michael's prompt corpus. First-seen date, frequency, classification, adoption velocity. Refreshed by `/vibe backtest`.

Last backtest: 2026-05-05 from `imports/PROMPT_LOG.md.import` (18 entries seed).

## Schema

```
### [term-or-phrase]
- first_seen:        YYYY-MM-DD
- last_seen:         YYYY-MM-DD
- frequency:         N occurrences across corpus
- adoption_velocity: new (<7d) | adopted (7-30d) | established (>30d)
- classification:    hard-keep | active-translation | filler-candidate | trigger-phrase | closure-signal | autonomy-signal | bump-up-signal | domain-noun | action-verb | state-marker
- contexts:          [3 representative quotes]
- profile_action:    add-to-hard-keep | add-to-glossary | add-to-trigger-list | none-yet
```

---

## Closure signals (high-priority hard-keeps)

### "go." / "Go."
- first_seen: 2026-05-04
- last_seen: 2026-05-05
- frequency: 3 (corpus seed)
- adoption_velocity: established
- classification: closure-signal
- contexts:
  - "Then build without stopping. Go."
  - "...go."
  - (matches Step 3 closure detection rules)
- profile_action: already-in-profile (Step 3)

### "resume" / "resume building" / "remue building"
- first_seen: 2026-05-04
- last_seen: 2026-05-05
- frequency: 8 (3 "resume", 2 "resume building", 1 "remue building" typo)
- adoption_velocity: established
- classification: closure-signal + autonomy-signal hybrid (one-word prompt = closure; with "building" = autonomy)
- contexts:
  - "resume building"
  - "remue building" (typo, should still match)
  - "resume. also i have done some of my todo list..."
- profile_action: already-in-profile; typo tolerance verified

### "continue" / "continue working"
- first_seen: 2026-05-05
- last_seen: 2026-05-05
- frequency: 5
- adoption_velocity: adopted
- classification: closure-signal
- contexts:
  - "continue"
  - "continue working on things that are not blocked by me"
- profile_action: already-in-profile

---

## Autonomy signals

### "build without stopping"
- first_seen: 2026-05-04
- last_seen: 2026-05-04
- frequency: 1
- adoption_velocity: established
- classification: autonomy-signal
- profile_action: already-in-profile

### "knock out" / "knock out whatever you can"
- first_seen: 2026-05-05
- last_seen: 2026-05-05
- frequency: 1
- adoption_velocity: new
- classification: autonomy-signal (new pattern!)
- contexts:
  - "knock out whatever you can in the next hour that is unblocked"
- profile_action: **add-to-trigger-list** — propose adding "knock out" to autonomy signal recognizers

### "while i'm gone" (implicit autonomy)
- first_seen: (referenced in autonomous-mode skill)
- frequency: 0 in PROMPT_LOG (referenced in skill description only)
- profile_action: track for emergence

---

## Action verbs (Michael's preferred register)

### "ship" / "shipped" / "ship it"
- first_seen: 2026-05-04
- last_seen: 2026-05-05
- frequency: 9 (high)
- classification: action-verb (Michael's preferred register)
- contexts: "shipped v6.10.39", "ship it", "Total session count: 19 ships"
- profile_action: hard-keep (Michael uses "ship", not "deploy" or "release")

### "build" / "build out"
- first_seen: 2026-05-04
- last_seen: 2026-05-05
- frequency: 14
- classification: action-verb
- profile_action: hard-keep — preferred over "implement"

### "extract" / "extracted"
- first_seen: 2026-05-05
- last_seen: 2026-05-05
- frequency: 3
- adoption_velocity: adopted
- classification: action-verb
- contexts: "finally extracted csvImportFlow()", "extracted into js/csv_import.js"
- profile_action: hard-keep

### "pivot" / "pivoted"
- first_seen: 2026-05-05
- last_seen: 2026-05-05
- frequency: 2
- adoption_velocity: new
- classification: action-verb
- profile_action: hard-keep — Michael's term for "change direction mid-task"

### "knock out"
- See autonomy signals above. Also doubles as action verb in same sentence.

### "wire" / "wire up" / "wired"
- first_seen: (in BUILD_INTELLIGENCE.md — pre-corpus)
- frequency: 4 (in PROMPT_LOG context blocks)
- classification: action-verb
- profile_action: already in profiles/michael.md hard-keep list

---

## State markers (recurring phrases)

### "tree clean" / "clean state"
- first_seen: 2026-05-04
- last_seen: 2026-05-05
- frequency: 5
- adoption_velocity: established
- classification: state-marker
- profile_action: hard-keep — concise state report

### "BLOCKS ON MICHAEL"
- first_seen: 2026-05-04
- last_seen: 2026-05-04
- frequency: 4
- classification: domain-noun (AccentOS workflow term)
- profile_action: already-in-profile

### "session-end state"
- first_seen: 2026-05-04
- last_seen: 2026-05-05
- frequency: 3
- classification: state-marker
- profile_action: hard-keep

---

## AccentOS proper nouns (verified hard-keeps from corpus)

All confirmed in profiles/michael.md hard-keep list. Frequencies for visibility:

| Term | Frequency in corpus |
|---|---|
| BUILD_PLAN_CLAUDE.md | 7 |
| BUILD_PLAN_MICHAEL.md | 6 |
| BUILD_INTELLIGENCE | 4 |
| PROMPT_LOG.md | 5 |
| PROMPT_QUEUE.md | 4 |
| WORK_IN_PROGRESS.md | 3 |
| MASTER.md | 1 (referenced in CLAUDE.md scope) |
| Codespace | 6 |
| Supabase | 9 |
| BigCommerce | 3 |
| GMC | 2 |
| Cloudflare | 2 |
| M21..M30 (numeric) | 18 (across the M-task ID space) |
| v6.10.37..v6.10.57 | 21 (shipped versions referenced) |
| Track 5 / Track 6 | 6 |

---

## Domain nouns (project-specific topics)

### "module modes" / "module-mode" / "rollout-state registry"
- first_seen: 2026-05-05
- last_seen: 2026-05-05
- frequency: 1 (sole entry — the prompt that introduced the concept)
- adoption_velocity: new
- classification: domain-noun (new topic emerging)
- contexts: "now i want you and i to be able to toggle different module mode statuses"
- profile_action: **add-to-domain-list** — new topic Michael started this session

### "inline edit" / "inline-edit"
- first_seen: 2026-05-05
- last_seen: 2026-05-05
- frequency: 11 (high — pattern repeated extensively in the day)
- adoption_velocity: new (entered vocabulary 2026-05-05, used 11× same day)
- classification: domain-noun + action pattern
- profile_action: **add-to-hard-keep** — confirmed adopted vocabulary; trend signal: this became a major theme today

### "bulk import" / "bulk CSV"
- first_seen: 2026-05-05
- last_seen: 2026-05-05
- frequency: 7
- adoption_velocity: new
- classification: domain-noun
- profile_action: hard-keep

### "autonomous build" / "autonomous mode"
- first_seen: 2026-05-04
- last_seen: 2026-05-05
- frequency: 4
- classification: domain-noun
- profile_action: hard-keep

### "vibe-speak" / "vibe mode"
- first_seen: 2026-05-05 (this session!)
- frequency: 4 (entered today; will be high going forward)
- adoption_velocity: new (today!)
- classification: domain-noun
- profile_action: hard-keep — meta-skill name

---

## Stylistic patterns (register markers)

### Lowercase opens (no caps on first word)
- frequency: 9 of 18 prompts (50%)
- classification: register-marker
- profile_action: register_mirror=on (already set)

### Comma splices / run-on sentences
- frequency: 6 of 18 prompts (33%)
- classification: register-marker
- profile_action: lower formal-grammar bar (already in Step 4)

### Numbered chains "1) X 2) Y"
- frequency: 3 of 18 prompts (17%)
- classification: register-pattern
- profile_action: mirror in output (Step 4)

### Time-budgeted requests ("i have an hour", "by EOD")
- first_seen: 2026-05-05
- last_seen: 2026-05-05
- frequency: 1 (new pattern!)
- adoption_velocity: new
- classification: time-constraint signal
- profile_action: **propose** — add time-budget recognition. When Michael says "i have N minutes" / "in the next hour", switch to gsd mode for max efficiency.

---

## New-to-vocabulary terms (last 7 days)

These appeared in 2026-05-04 or 2026-05-05 for the first time:

1. `inline edit` — 11 uses, adopted same day → hard-keep
2. `extract` / `extracted` — 3 uses, adopted same day → hard-keep
3. `pivot` / `pivoted` — 2 uses, adopted → hard-keep
4. `module modes` / `module mode statuses` — 1 use, new concept emerging → watch
5. `vibe-speak` / `vibe mode` — 4 uses (this session) → hard-keep
6. `knock out` — 1 use, autonomy signal → propose adding to recognizers
7. `time-budgeted` (concept implied) → propose new signal type
8. `bulk import` — 7 uses, established this week → hard-keep
9. `Module Modes` (capitalized as feature name) — 1 use → hard-keep

**Total new vocabulary this week: 9 terms.**

---

## Removed-from-vocabulary candidates (no recent use)

(none — corpus too small to detect declines yet; needs 30+ days of data)

---

## Profile-update proposals (pending Michael review)

Run `/vibe propose calibration` to surface these as actionable proposals:

1. **Add `knock out` to autonomy-signal list** (Step 3 trigger words)
2. **Add `time-budgeted` recognition** — when input contains "i have [N] minutes" / "by EOD" / "in the next hour", auto-suggest gsd mode
3. **Add `Module Modes` to AccentOS hard-keeps** — feature name
4. **Add `inline edit` / `inline-edit` to AccentOS hard-keeps** — adopted vocabulary
5. **Add `pivot` / `pivoted` to action-verb hard-keeps**
6. **Add `extract` / `extracted` to action-verb hard-keeps** (already implicit but make explicit)

---

## Corpus stats

- Source: `imports/PROMPT_LOG.md.import` (mirror of /home/user/accent-os/PROMPT_LOG.md)
- Total prompts: 18 (single-repo seed)
- Date range: 2026-05-04 → 2026-05-05 (2 days)
- Unique terms: ~85 (after stop-word filtering)
- New-this-week: 9
- Hard-keep additions proposed: 6
- Trigger-phrase additions proposed: 2

**To grow this corpus:** export claude.ai history (per `imports/_README.md`), drop in `imports/`, run `/vibe import`. Each import multiplies the vocabulary database.
