---
name: efficiency-monitor
description: >
  Always-on observer that watches Michael and Claude back-and-forth in
  AccentOS build sessions at /home/user/accent-os/ for inefficiencies
  (retries, redundant reads, recurring multi-step patterns, skill bypass,
  long clarification loops, redone WIP) and flags patterns ready for
  promotion to a real skill via skill-forge. Surfaces findings only at
  session boundaries — boot replays last session's top 3 flags and any
  PROMOTE-status candidates; wrap writes this session's flags to
  skills/efficiency-monitor/efficiency-log.md and overwrites
  session-end-summary.md. Auto-active per .claude/CLAUDE.md AUTO-EXECUTE
  steps 1.j and 8. Always surfaces findings at session boundaries only —
  never interrupts mid-flow, never flags a skill-bypass without citing the
  exact skills/_index.md entry that would have matched.
---

# efficiency-monitor

**Purpose:** Solo Claude builds drift slowly. The same multi-step pattern runs 3× before anyone notices it belongs in a dedicated skill. The same file gets re-read 4× in a session. This skill catches those patterns without interrupting the work.

**Hybrid design:**
- **Path A (in-flight, instruction-driven):** Claude tracks signals in working memory while working. Does not speak about them mid-session.
- **Path B (post-hoc, hook-driven):** `scripts/efficiency-aggregate.sh` runs at session end via Stop hook, parses `efficiency-log.md`, updates `skill-candidates.md` cross-session counts.

**Hard rule:** Never interrupt. Surface only at session start (boot) and session end (wrap-up). Never mid-flow.

---

## Trigger Recognition

Auto-active — no invocation needed. Also run explicitly when Michael says:
- "efficiency report" / "what's inefficient"
- "end session" / "wrap up" / "we're done" (fires Step 2 wrap-up)
- "/efficiency end" (explicit Step 2 trigger)
- "what patterns do you see" / "show efficiency flags"
- "skill candidates" / "what should we forge next"

For mid-session manual queries ("what patterns do you see"), surface the scratch-file count only — never the detail — then continue silently.

---

## Signals tracked

| # | Signal | Trigger condition |
|---|--------|-------------------|
| 1 | retry-loop | Same operation attempted 2+ times after failure |
| 2 | redundant-read | Re-read file already read this session |
| 3 | recurring-sequence | Same N-step pattern (N≥2) appears 2+ times in session |
| 4 | skill-bypass | Did work that an existing skill in `skills/_index.md` would handle |
| 5 | clarification-loop | 3+ user messages of clarification before any code change |
| 6 | redone-wip | Work that BUILD_PLAN_CLAUDE.md or git log shows already done |

Thresholds tunable in `_thresholds.md`.

---

## Step 0 — Boot (auto, on session start)

Triggered by CLAUDE.md AUTO-EXECUTE step 1.j and step 8.

1. Read `skills/efficiency-monitor/session-end-summary.md` (last session's findings).
2. Read `skills/efficiency-monitor/skill-candidates.md` — note any patterns at PROMOTE status.
3. Surface to Michael in current vibe-speak mode:
   - Top 3 inefficiencies from last session (one-liners)
   - Any skill candidates at PROMOTE status (recommend `skill-forge` to build)
4. If `session-end-summary.md` does not exist (first run), say nothing — silent.

Boot output format:

```
⚙ efficiency-monitor — last session
  • [signal] [count]× — [one-line]
  • ...
🛠 skill candidates at PROMOTE
  • [pattern] — [N sessions, est. savings] → run `skill-forge`
```

Skip section entirely if empty. Do NOT show INFO-level flags at boot.

---

## Step 1 — During session (silent observation, crash-safe)

Maintain observations in `skills/efficiency-monitor/_session-scratch.md` (gitignored, runtime-only). Append as you go — do **not** narrate to Michael. Format per line:

```
[HH:MM] [signal-type] | [one-line detail]
```

Example entries:
```
[14:22] retry-loop | npm install failed 3× before noticing missing node_modules
[14:35] redundant-read | re-read js/csv_import.js (already read at 14:08)
[14:51] recurring-sequence | read→grep→edit→test (3rd time this session)
[15:02] skill-bypass | did weekly review by hand; bc-business-review would have done it
```

**Why scratch file vs. mental ledger:** if the session ends abruptly (Codespace stop, crash, manual kill), mental observations evaporate. The scratch file persists. Step 2 reads + clears it.

Append-only during the session. Only Step 2 (wrap-up) reads/clears it. Do not show its contents to Michael unless asked.

---

## Step 2 — Session end (wrap-up)

Triggered by:
- Stop hook in `.claude/settings.json` (preferred)
- OR explicit user signal: "wrap up", "end session", "we're done", "/efficiency end"
- OR final session-end commit

When triggered:

### 2a. Compile findings
Read `_session-scratch.md`. Group entries by signal type, total count per type, worst-offender one-liner. If scratch is empty, fall back to mental ledger (for sessions where Claude forgot to journal).

### 2b. Append to `efficiency-log.md`

```markdown
## [YYYY-MM-DD HH:MM] session [shortsha]

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

### 2c. Overwrite `session-end-summary.md`
Same content as 2b but ONLY this session's data, formatted for next-session boot consumption.

### 2d. Run aggregator + clear scratch
Invoke `bash /home/user/accent-os/scripts/efficiency-aggregate.sh`. This:
- Parses `efficiency-log.md` cross-session
- Updates `skill-candidates.md` running counts (no rewrite if no semantic change)
- Promotes candidates per thresholds in `_thresholds.md`

Then truncate `_session-scratch.md` (it's already been folded into the log). The file is gitignored — no commit churn.

### 2e. Surface summary
In current vibe-speak mode, one block:

```
⚙ efficiency-monitor — this session
  flags: [n] inefficiencies logged
  candidates: [n] new / [n] promoted
  see: skills/efficiency-monitor/session-end-summary.md
```

Bundle the file writes into the existing session-end commit (per CLAUDE.md batch-doc-update rule).

---

## Step 3 — Skill candidate detection

A "skill candidate" is a recurring sequence (signal #3) that meets `_thresholds.md` rules. Promotion ladder:

| Status | Trigger | Action |
|--------|---------|--------|
| OBSERVED | 1 occurrence | logged silently |
| CANDIDATE | 3+ occurrences in one session OR 2+ separate sessions | tracked in skill-candidates.md |
| PROMOTE | 3+ separate sessions OR cross-session est. savings > 10 min/occurrence | surfaced at next boot, recommend `skill-forge` |
| BUILT | promoted to real skill | archived in skill-candidates.md with reference |

Aggregator script handles status transitions deterministically.

---

## Step 4 — Skill bypass detection

When closing the session, scan the work done against `skills/_index.md` triggers + when_to_use. If any task matches an existing skill that wasn't invoked, log as `skill-bypass` flag in 2b.

This is the single most-valuable signal — catching when we're brute-forcing work an existing skill already covers.

---

## Step 5 — Coordination with vibe-speak

- vibe-speak Step 23 (skill router) handles **proactive** matching at request time (mid-session, can speak).
- efficiency-monitor handles **retrospective** auditing at session boundaries (cannot speak mid-session).
- Both read `skills/_index.md`. No duplication: vibe-speak suggests, efficiency-monitor audits what was actually done.

---

## Files

- `SKILL.md` — this file
- `_thresholds.md` — tunable detection knobs
- `efficiency-log.md` — append-only ledger of all session flags
- `skill-candidates.md` — running tally + promotion status (auto-rebuilt, semantic-diff suppressed)
- `session-end-summary.md` — overwritten each session; consumed by next boot
- `_session-scratch.md` — gitignored runtime journal during session (Step 1); cleared at wrap-up (Step 2d)
- `_aggregator.log` — gitignored Stop-hook stdout

---

## Hard rules

1. **Never interrupt mid-flow.** Boundaries only.
2. **No false positives over false negatives** — when in doubt, do not flag.
3. **Skill-bypass flag must cite which `_index.md` entry would have matched.** No vague "could have used a skill."
4. **All file writes batched into the session-end commit.** Never standalone commits from this skill.
5. **Aggregator script is the source of truth for promotion status.** SKILL.md only writes raw flags; promotion logic lives in bash.
---

## Anti-patterns

- **Never** interrupt Michael mid-flow with efficiency observations. Surface only at session start (boot replay) and session end (wrap-up). All mid-session flags go to `skills/efficiency-monitor/_session-scratch.md` silently.
- **Never** flag a skill-bypass without citing the exact `skills/_index.md` entry that would have matched. Vague "could have used a skill" is not actionable.
- **Never** auto-promote a skill candidate without `scripts/efficiency-aggregate.sh` confirming the threshold (3+ separate sessions or cross-session savings > 10 min/occurrence). SKILL.md writes raw flags only; the script owns promotion logic.
- **Never** include assistant responses in signal analysis — track patterns in the Michael → Claude direction only. Mixing Claude's output into the count inflates every signal type.
- **Never** create standalone commits for efficiency-monitor file writes. Bundle all writes (efficiency-log.md, session-end-summary.md, skill-candidates.md) into the session-end commit per CLAUDE.md batch-doc-update rule.
- **Never** surface INFO-level flags at boot. Boot output lists only the top 3 inefficiencies and any PROMOTE-status skill candidates.
- **Never** clear `_session-scratch.md` before Step 2d runs the aggregator. The scratch file is the aggregator's input; deleting it early loses the session's signal data.
