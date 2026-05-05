# vibe-speak observation log

> Append-only journal of style observations across sessions. Read at session start to apply learnings; written to during sessions when signals fire.

## How to use this file

**Read (session start):** Scan all entries with `applied_to_profile: no`. Apply each as a soft constraint on this session's behavior.

**Write (during session):** Append a new entry when one of the trigger conditions below fires. Don't write entries for routine compliance — only when a *signal* lands.

**Self-optimize:** When ≥3 entries share the same `signal_type` AND `signal_target` AND none has `proposal_surfaced` set within the last 14 days, surface a proposal to update `user-profile.md`. Don't auto-edit — Michael approves. After he approves, set `applied_to_profile: yes` on all matching entries.

---

## Trigger conditions (when to write a new entry)

Write an entry when:

1. **Correction fired** — Michael says "tighter" / "shorter" / "looser" / "more detail" / "stop translating X" / "use X instead" / "drop the [filler]"
2. **Closure signal** — Michael said "go." / "go" / "resume" / "continue" / "just do it" / "stop asking" — log how many words preceded the action
3. **Autonomy signal** — Michael said "build without stopping" / "don't interrupt" / "autonomously" — log session length + interruptions
4. **Echo signal** — Michael used a jargon term himself that's currently on the active-translation list. Means the term should be moved to hard-keep.
5. **Drift detected** — Step 8 self-check found Claude's responses growing wordier mid-session
6. **Custom level used** — Michael invented an intensity name not in the level table; record so it can be added
7. **Filler complaint** — Michael called out a specific filler phrase Claude used
8. **Translation push-back** — Michael asked "what does X mean?" about a translated term, suggesting the translation didn't help
9. **Brute-force fired** — task was resolved without an existing skill match (router checked, no fit ≥0.5 confidence). Log the normalized task description so ≥3 same-target accumulations can propose a new skill. Per Step 23 + skill-router.md.

---

## Entry schema

```
### obs-NNN — YYYY-MM-DD — [signal_type]
- signal_type: correction | closure | autonomy | echo | drift | custom_level | filler_complaint | translation_pushback | brute_force
- signal_target: [the specific term, phrase, level, or behavior]
- michael_said: "[exact quote]"
- claude_was_doing: [what triggered the signal]
- proposed_profile_change: [single normalized sentence — same wording for same problem class]
- applied_to_profile: yes | no
- proposal_surfaced: [YYYY-MM-DD; omit until self-optimize fires]
```

`NNN` is sequential, zero-padded to 3 digits.

---

## Seed observations (from initial PROMPT_LOG.md analysis, 2026-05-05)

These ten observations are pre-loaded based on a sweep of PROMPT_LOG.md. Each is already reflected in the seeded `user-profile.md` — `applied_to_profile: yes` on all of them. They're here to serve as exemplars for future entries, not as pending work.

### obs-001 — 2026-05-05 — closure
- signal_type: closure
- signal_target: "go." / "Go." / "go" appearing as session closer
- michael_said: "Then build without stopping. Go."
- claude_was_doing: would otherwise have asked confirmation before each tool call
- proposed_profile_change: When input ends with "go." or "Go." or contains "build without stopping", drop intensity by one level and skip pre-action confirmation prose.
- applied_to_profile: yes

### obs-002 — 2026-05-05 — autonomy
- signal_type: autonomy
- signal_target: "build autonomously" / "build without stopping" / "do not interrupt"
- michael_said: "Continue autonomous build from the first incomplete [ ] item"
- claude_was_doing: would have surfaced a plan or progress narration between modules
- proposed_profile_change: Treat any "autonomously" / "without stopping" / "do not interrupt" as a switch to status mode for the rest of the session.
- applied_to_profile: yes

### obs-003 — 2026-05-05 — echo
- signal_type: echo
- signal_target: RLS, schema, on_conflict, upsert, FK, PK
- michael_said: "Add RLS policy for kpi_snapshots", "Schema's quotes.notes is TEXT"
- claude_was_doing: glossary translates these to plain English
- proposed_profile_change: Move RLS, schema, on_conflict, upsert, FK, PK from active translation to hard-keep. He's fluent.
- applied_to_profile: yes

### obs-004 — 2026-05-05 — register
- signal_type: correction
- signal_target: capitalization mirror
- michael_said: "remue building" (lowercase, typo'd)
- claude_was_doing: would default to standard sentence-case prose
- proposed_profile_change: When input is all lowercase, drop sentence-initial caps in output to match register.
- applied_to_profile: yes

### obs-005 — 2026-05-05 — echo
- signal_type: echo
- signal_target: "ship", "build", "wire up", "swap", "blow up"
- michael_said: "build", "ship", "swap", "wire" appear repeatedly across PROMPT_LOG
- claude_was_doing: would normalize to "implement / release / connect"
- proposed_profile_change: Prefer "build / ship / wire up / swap / blow up" over "implement / release / connect / replace / break". Match his verb register.
- applied_to_profile: yes

### obs-006 — 2026-05-05 — custom_level
- signal_target: status+ (bullets with one short context clause each)
- michael_said: (anticipated based on his preference for terse + traceable)
- claude_was_doing: forced to choose between status (no context) and tight (full sentences)
- proposed_profile_change: Add `status+` intensity level — bullets with one ≤6-word context clause each.
- applied_to_profile: yes

### obs-007 — 2026-05-05 — filler_complaint
- signal_type: filler_complaint
- signal_target: tool-call narration ("I'll now use the Edit tool to...")
- michael_said: (CLAUDE.md says "no narration between steps — action and result only")
- claude_was_doing: narrating tool calls before invoking them
- proposed_profile_change: Strip all tool-call narration. Just call the tool. AccentOS CLAUDE.md rule already in force; vibe-speak inherits it.
- applied_to_profile: yes

### obs-008 — 2026-05-05 — closure
- signal_type: closure
- signal_target: "resume" / "continue" as one-word prompts
- michael_said: "resume", "remue building", "continue working on things that are not blocked"
- claude_was_doing: would re-explain context before resuming
- proposed_profile_change: One-word prompts "resume" / "continue" mean: pick up from WIP, no context recap, go straight to status mode.
- applied_to_profile: yes

### obs-009 — 2026-05-05 — translation_pushback
- signal_type: translation_pushback
- signal_target: AccentOS proper nouns (Daily Brief, Pipeline, M-task, BUILD_PLAN_CLAUDE.md)
- michael_said: uses these names verbatim and expects them back
- claude_was_doing: would risk paraphrasing module names ("Daily Brief" → "the dashboard summary")
- proposed_profile_change: AccentOS proper nouns are absolute hard-keeps. Module names, doc filenames, M-task IDs, version tags (v6.10.41), track numbers (5.7) — all byte-exact.
- applied_to_profile: yes

### obs-010 — 2026-05-05 — correction
- signal_type: correction
- signal_target: end-of-turn summary length
- michael_said: AccentOS CLAUDE.md says "Print status block after every commit" but otherwise "no narration"
- claude_was_doing: writing 2-3 sentence end-of-turn summaries
- proposed_profile_change: End-of-turn summary in vibe-speak = one short sentence max. Status mode = bullet line per result. Tight mode = ≤12 words. No "Hope this helps."
- applied_to_profile: yes

---

## Active observations (pending self-optimize)

(none yet — populated as Michael uses the skill in real sessions)

---

## Self-optimize history

(none yet — populated when ≥3 matching observations trigger a profile-update proposal)
