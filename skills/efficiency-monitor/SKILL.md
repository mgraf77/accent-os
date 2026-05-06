---
name: efficiency-monitor
description: >
  Always-on observer that watches Michael ↔ Claude back-and-forth for
  inefficiencies (retries, redundant reads, recurring multi-step
  patterns, skill bypass, long clarification loops, redone WIP) and
  flags patterns that should be promoted to a real skill. Surfaces
  findings ONLY at session boundaries (start = replay last session's
  flags; end = write this session's flags). Never interrupts mid-flow.
  Auto-active per `.claude/CLAUDE.md` AUTO-EXECUTE step 1.j and step 8.
  Pairs with `skill-forge` to promote candidates into real skills.
---

# efficiency-monitor

**Purpose:** Solo Claude builds drift slowly. Same multi-step pattern run 3× before anyone notices it should be a skill. Same file re-read 4× in a session. Same retry loop. This skill catches that without interrupting the work.

**Hybrid design:**
- **Path A (in-flight, instruction-driven):** Claude tracks signals in working memory while working. Does not speak about them mid-session.
- **Path B (post-hoc, hook-driven):** `scripts/efficiency-aggregate.sh` runs at session end via Stop hook, parses `efficiency-log.md`, updates `skill-candidates.md` cross-session counts.

**Hard rule:** Never interrupt. Surface only at session start (boot) and session end (wrap-up). Never mid-flow.

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

## Step 1 — During session (silent observation)

Maintain a mental ledger of signal hits. Do **not** narrate. Track:

```
session_id: [date-time-shortsha]
flags:
  - signal: [type]
    occurrences: [count]
    detail: [one-line]
sequences:
  - steps: [step1 → step2 → step3]
    occurrences: [count]
```

Do not write to disk during the session — only at end (Step 2). Reason: avoids interleaving doc commits with build commits (per CLAUDE.md OPERATING RULES).

---

## Step 2 — Session end (wrap-up)

Triggered by:
- Stop hook in `.claude/settings.json` (preferred)
- OR explicit user signal: "wrap up", "end session", "we're done", "/efficiency end"
- OR final session-end commit

When triggered:

### 2a. Compile findings
For each signal type, total count + worst-offender one-liner.

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

### 2d. Run aggregator
Invoke `bash /home/user/accent-os/scripts/efficiency-aggregate.sh`. This:
- Parses `efficiency-log.md` cross-session
- Updates `skill-candidates.md` running counts
- Promotes candidates per thresholds in `_thresholds.md`

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
- `skill-candidates.md` — running tally + promotion status
- `session-end-summary.md` — overwritten each session; consumed by next boot
- `_history/` — (optional) per-session snapshots if Michael wants forensic detail

---

## Hard rules

1. **Never interrupt mid-flow.** Boundaries only.
2. **No false positives over false negatives** — when in doubt, do not flag.
3. **Skill-bypass flag must cite which `_index.md` entry would have matched.** No vague "could have used a skill."
4. **All file writes batched into the session-end commit.** Never standalone commits from this skill.
5. **Aggregator script is the source of truth for promotion status.** SKILL.md only writes raw flags; promotion logic lives in bash.
