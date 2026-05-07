---
name: skill-optimizer
description: >
  Iterative multi-agent optimizer for AccentOS skill files. Reads every target
  SKILL.md, computes a numeric matter score (0–100) before and after each
  optimization round, runs parallel Ralph-loop agents until all skills reach
  the high threshold, writes a per-skill optimization-history.md capturing
  every change made with reasoning and score deltas, logs every technique that
  did and did not move the score, and learns from that history to prioritize
  highest-delta techniques in future runs. Use this skill when Michael says:
  "optimize the skills", "run the optimizer", "Ralph loop the skills", "skill
  quality pass", "score the skills", "how good are our skills", "improve the
  skill files", or any phrasing that asks to improve SKILL.md quality across
  the AccentOS library. Always produces a per-skill history file, a per-round
  matter-score summary, and a combined cross-round review — never exits without
  committing changes and updating run-log.md and each skill's history file.
---

# skill-optimizer

**Purpose:** Score every AccentOS skill on a 10-dimension matter scale, run Ralph-loop
parallel agents to close gaps, track which techniques move the score and which don't, and
feed that history back into the next run so the optimizer gets smarter each time.

---

## Trigger Recognition

Run when Michael says:
- "optimize the skills" / "run the optimizer"
- "Ralph loop the skills" / "run the Ralph loop"
- "skill quality pass" / "skill audit"
- "score the skills" / "matter score check"
- "how good are our skills" / "skill health"
- "improve the skill files" / "tighten the skills"
- "what changed in the optimizer" / "optimizer history"

---

## Step 0 — Preflight

Before any work, do these in parallel:

1. **Read run-log.md** — `/home/user/accent-os/skills/skill-optimizer/run-log.md`.
   - Extract the **Technique Leaderboard** from the most recent `### END-OF-RUN REVIEW` block.
   - From the technique performance log, compute hit-rate = `(times_moved_score / times_applied)` for each technique.
   - Load the top-5 techniques ordered by hit-rate (not raw delta points) as **priority moves** — hit-rate predicts reliability on new skills better than total points, since high-point techniques with low hit-rates (e.g. imperative voice at 53%) waste cycles on already-passing dimensions.
   - Load the "Didn't-move-score" list as **skip list** for skills that already pass that dimension.

2. **Read learning-notes.md** — `/home/user/accent-os/skills/skill-optimizer/learning-notes.md`.
   Apply all `RULE:` entries. These are hard-learned constraints that override default
   optimizer behavior.

3. **Enumerate target skills** — `ls /home/user/accent-os/skills/` — skip `_index.md`
   and `skill-optimizer/` itself. This is the scope list.

4. **Capture branch** — `git -C /home/user/accent-os branch --show-current`. Work on
   current branch; never push to main without explicit permission.

**Output artifact — Step 0 preflight report (emit before Step 1):**
```
PREFLIGHT  [date]  branch: [branch]
Scope: [N] skills — [comma-separated list]
Priority moves loaded: [top-5 technique names from leaderboard]
Skip list loaded: [dimension names already at 10 fleet-wide]
RULE entries active: [N]
```

---

## Step 1 — Compute baseline matter scores

For every skill in scope, read its SKILL.md and score it on the **Matter Scale**.

### Matter Scale (0–100, 10 points each)

| # | Dimension | Passes when |
|---|---|---|
| M1 | Description length | ≥300 chars |
| M2 | AccentOS/Accent Lighting named | "AccentOS" OR "Accent Lighting" in description |
| M3 | Behavioral commitment | description ends with "always X — never Y" form |
| M4 | Anti-patterns ≥5, all "Never" | ≥5 bullets starting "Never" in Anti-patterns section |
| M5 | Trigger phrases ≥5 | ≥5 distinct phrases in Trigger Recognition section |
| M6 | Concrete step outputs | every `## Step N` body names a file path, table with column headers, SQL block, or literal format — disqualified by: "Output: a summary", "Output: a scorecard" with no column names, or a step with no output statement at all |
| M7 | Zero passive voice | no "should be", "can be", "is used to", "Consider X" in prose |
| M8 | No prose walls | no paragraph >4 sentences without a bullet or table break |
| M9 | Stack reference present | at least one of: `hsyjcrrazrzqngwkqsqa`, `store-cwqiwcjxes`, `/home/user/accent-os/` |
| M10 | No unfilled placeholders | zero `[bracketed text]` outside fenced code blocks |

Score each skill: count passing dimensions × 10. Record as `before_score`.

**Output artifact — Baseline Scorecard:**
```
BASELINE MATTER SCORES  [date]
Skill                     M1  M2  M3  M4  M5  M6  M7  M8  M9 M10  Total
analysis-snapshot         10  10  10  10  10  10  10  10  10  10   100
...
Fleet average: XX.X / 100
Skills below 80: [list]
```

---

## Step 2 — Group and assign agents

Split the scope list into groups of 4–6 skills each. Groups of 3 underuse the agent; groups of 7+ produce edit conflicts. Spawn one agent per group **in parallel** using the Ralph loop protocol (Step 3). Pass each agent:
- Its group's file paths
- The full text of `learning-notes.md` (not a summary — agents must receive all RULE: entries verbatim)
- The priority moves from Step 0 ordered by hit-rate `(times_moved_score / times_applied)`, highest first
- The skip list (dimensions already 10/10 — don't waste cycles re-checking)
- The per-skill baseline scores (so agents know which dimensions to target)
- The `optimization-history.md` for each skill in the group (agents read it before starting that skill's loop to see which techniques already failed on that specific skill)

**Output artifact — Agent dispatch table (emit before spawning):**
```
AGENT DISPATCH  [date]
Agent  Skills                        Group size
A1     analysis-snapshot, kpi-data-audit, supabase-sql-magic, table-eda    4
A2     ...
Agents spawned: [N]
```

---

## Step 3 — Ralph loop protocol (per agent, per skill)

**Before starting any skill's loop:** Read that skill's `optimization-history.md` at `/home/user/accent-os/skills/<skill-name>/optimization-history.md` if it exists. Extract every "Techniques that didn't move score" entry and every "Stuck dimensions" entry from prior runs. Do not re-attempt those techniques on the same dimensions — they were already tried and failed.

Each agent runs this loop per skill until no new findings:

```
LOOP (minimum 3 cycles, maximum 10):
  [Optimizer pass]
    1. Re-read SKILL.md
    2. Apply all improvements found, targeting failing dimensions first,
       in priority order from Step 0 leaderboard (highest hit-rate first)
    3. Record every Edit made: which dimension it targeted, old text → new text
    4. Compute post-edit matter score for this skill

  [Ralph pass — binary dimension checks]
    Challenge every section:
    - "Is there a step that names only 'a summary' as its output?" (M6)
    - "Is there an anti-pattern missing for the most obvious AccentOS misuse?" (M4)
    - "Does any trigger phrase duplicate another or remain too vague?" (M5)
    - "Is any paragraph >4 sentences without a break?" (M8)
    - "Does the description end with a clear always/never commitment?" (M3)
    - "Are there ≥5 'Never' anti-patterns?" (M4)
    - "Any [bracket] outside a code fence?" (M10)
    - "Any passive voice remaining — 'should be', 'can be', 'is used to', 'Consider X'?" (M7)
    - "Does any SQL block contain a double-WITH clause, reference an undefined table,
       or use a column that doesn't exist in the named schema?" (M6 integrity)

  If Ralph finds anything → record finding → go back to Optimizer pass
  If Ralph finds nothing AND matter score = 100 → run ONE sub-dimension cycle (below) → mark DONE
  If Ralph finds nothing AND matter score < 100 → log as "stuck dimension" → mark DONE
END LOOP

[Sub-dimension cycle — runs once after binary dimensions converge at 100/100]
  Check:
  - Are any "Never" anti-patterns generic rather than specific to this skill's failure modes?
    (e.g. "Never skip validation" is generic; rewrite using actual observed failures)
  - Do any trigger phrases overlap in meaning with another phrase in the same list?
  - Does every Step's output block show the literal column headers of its table, not just
    "a table" or "a scorecard"? (Disqualifier: "Output: a summary table" with no column names)
  - Do any SQL blocks reference project IDs or table names that don't exist in the
    hsyjcrrazrzqngwkqsqa schema?
  - Is the purpose line one tight sentence with a specific verb (not "handles", "manages",
    "deals with")?
  If sub-dimension cycle finds anything → apply edits → log findings
```

Each agent returns: per-skill edit log with dimension tags, final matter score, stuck
dimensions, techniques that did/didn't move the score, and a completed
`optimization-history.md` for each skill it touched.

**Per-skill history file — written by each agent as it finishes each skill:**

Path: `/home/user/accent-os/skills/<skill-name>/optimization-history.md`

If the file already exists, append a new run block. If it does not exist, create it.

```markdown
# [skill-name] — optimization history

---

## Run [date]  branch: [branch]

### Baseline matter score: [N]/100

| Dim | Name | Score | Reason failed (if 0) |
|---|---|---|---|
| M1 | Description length | 10/0 | [why if 0] |
| M2 | AccentOS named | 10/0 | |
| M3 | Behavioral commitment | 10/0 | |
| M4 | Anti-patterns ≥5 "Never" | 10/0 | |
| M5 | Trigger phrases ≥5 | 10/0 | |
| M6 | Concrete step outputs | 10/0 | |
| M7 | Zero passive voice | 10/0 | |
| M8 | No prose walls | 10/0 | |
| M9 | Stack reference | 10/0 | |
| M10 | No placeholders | 10/0 | |
| **Total** | | **[N]/100** | |

---

### Round [N] — [pass type]

**Cycle [N] — Optimizer**

| Change | Dimension targeted | Reasoning |
|---|---|---|
| [what changed] | M[N] | [why this edit closes the gap] |
| [old text → new text summary] | M[N] | [Ralph finding that prompted it] |

**Cycle [N] — Ralph findings**
- [finding that triggered next cycle, or "none — converged"]

**Matter score after cycle [N]:** [N]/100 (Δ [+N])

---

### Final score: [N]/100  (Δ from baseline: [+N])

**Techniques that moved score:**
- [technique] → closed M[N]

**Techniques that didn't move score:**
- [technique] → [reason: already passing / wrong target / no match found]

**Stuck dimensions:** [list or "none"]

---
```

---

## Step 4 — Collect results and compute round delta

After all agents complete:

1. Compute `after_score` for each skill.
2. Compute `delta = after_score − before_score`.
3. Aggregate technique performance:
   - For each technique applied: record (technique_name, skill, dimension_targeted, delta_contribution)
   - A technique "worked" if it moved a dimension from 0→10. "Didn't work" if it produced 0 delta.

**Output artifact — Round Summary (emit after every round):**
```
══════════════════════════════════════════
ROUND [N] SUMMARY  [date]
══════════════════════════════════════════

Matter Score Changes:
  Skill                  Before  After  Delta
  analysis-snapshot         90    100   +10  ✓ 100
  kpi-data-audit            70     90   +20
  ...
  Fleet average:          XX.X  →  XX.X  (+X.X avg)

Top moves this round:
  1. Added concrete output artifact block         → moved M6  on 7 skills  (+70 pts total)
  2. Replaced [placeholder] with concrete value   → moved M10 on 5 skills  (+50 pts total)
  3. Added "always X — never Y" commitment        → moved M3  on 4 skills  (+40 pts total)

Didn't move score:
  - "Removed Stolen from: label"   → stylistic only, no dimension impact (M7 already passing)
  - "Normalized Do NOT → Do not"   → no dimension impact

Stuck dimensions (no fix found):
  - skill-forge M6: Step 1.5 is inherently exploratory — no concrete output artifact possible

Round verdict: [EXCELLENT / GOOD / MARGINAL] — [one sentence on what drove the gains]
══════════════════════════════════════════
```

---

## Step 5 — Verify per-skill history files complete

Before updating run-log.md, confirm every skill in scope has an `optimization-history.md`
with an entry for this run. If any are missing (agent crash, edit collision), write them
now from the collected agent results. Never proceed to Step 6 with incomplete history files.

**Output artifact — history file verification (emit before Step 6):**
```
HISTORY FILE VERIFICATION  [date]
Skill                     history written?  final score
analysis-snapshot         yes               100
kpi-data-audit            yes               100
...
Missing (will write now): [list or "none"]
```

---

## Step 6 — Update run-log.md

Append to `/home/user/accent-os/skills/skill-optimizer/run-log.md`:

```markdown
---
### RUN [date]  branch: [branch]  scope: [N skills]

#### Baseline scores
[full baseline scorecard table]

#### Round summaries
[one Round Summary block per round run]

#### Technique performance log

| Technique | Dimension | Times applied | Moved score | Didn't move |
|---|---|---|---|---|
| Add concrete output artifact | M6 | 12 | 12 | 0 |
| Replace [placeholder] | M10 | 8 | 7 | 1 |
| Add behavioral commitment | M3 | 6 | 6 | 0 |
| Remove passive "should be" | M7 | 9 | 4 | 5 |
...

#### What worked well
- [technique]: [why it worked, what it unlocked]

#### What didn't work / lessons learned
- [technique]: [why it failed to move the score, what to try instead]

#### END-OF-RUN REVIEW

Technique Leaderboard (for next run's priority moves — ordered by hit-rate, not raw points):
| Rank | Technique | Hit-rate (moved/applied) | Total pts contributed |
|---|---|---|---|
| 1 | Add concrete output artifact block | 47/47 = 100% | 470 |
| 2 | ... | ... | ... |

Fleet final scores:
  Skill                  Score
  analysis-snapshot       100
  ...
  Fleet average: XX.X / 100
  Skills at 100: [N]
  Skills below 90: [list]

Run verdict: [one sentence]
---
```

---

## Step 7 — Update learning-notes.md

Read existing `/home/user/accent-os/skills/skill-optimizer/learning-notes.md`. For each
new "What didn't work" entry from this run, check if a matching `RULE:` exists. If not,
append:

```markdown
### [date] — from run on [branch]
RULE: Never attempt [technique] on skills where [condition] — it produces 0 delta because [reason].
BETTER: [what to do instead]
Source: Run [date], skills [list]
```

Only write new rules; never duplicate existing ones.

**Output artifact — learning-notes update (emit after writing):**
```
LEARNING-NOTES UPDATE  [date]
New RULE entries written: [N]
  - RULE: [first line of each new rule]
Skipped (already existed): [N]
```

---

## Step 8 — Combined cross-round review

After all rounds in the session complete, emit this output artifact:

```
══════════════════════════════════════════
CROSS-ROUND REVIEW  [date]  ([N] rounds, [N] skills)
══════════════════════════════════════════

Fleet trajectory:
  Start:  avg XX.X / 100  (N skills at 100, N below 80)
  Round 1: avg XX.X / 100  (+X.X)
  Round 2: avg XX.X / 100  (+X.X)
  End:    avg XX.X / 100  (N skills at 100, N below 90)

Highest-impact techniques across all rounds:
  1. [technique] — contributed [N] total matter points across [N] skills
  2. ...

Diminishing returns: technique gains slowed after round [N] because [reason].

Residual gaps (skills not at 100 after all rounds):
  Skill: [name]  Score: [N]  Stuck on: [dimensions]  Reason: [why Ralph can't fix it]

Process improvements for next optimizer run:
  1. [concrete change to the optimizer protocol itself]
  2. ...

Commit pushed: [SHA]
══════════════════════════════════════════
```

---

## Step 9 — Commit and push

Stage all modified files in this order:
- All modified `SKILL.md` files: `git add skills/*/SKILL.md`
- All `optimization-history.md` files (new and updated): `git add skills/*/optimization-history.md`
- The optimizer's own files: `git add skills/skill-optimizer/run-log.md skills/skill-optimizer/learning-notes.md skills/skill-optimizer/optimization-history.md`

Commit with:

```
chore(skills): optimizer run [date] — fleet avg [before]→[after]

[N] skills optimized. [N] reach 100/100. Ralph loop [N] rounds.
Top technique: [technique name] (+[N] total pts)

Residual gaps: [skill list if any, else "none"]
```

Push to current branch. Never push to main.

**Output artifact — commit confirmation (emit after push):**
```
COMMIT COMPLETE  [date]
SHA: [git short SHA]
Branch: [branch]
Files staged: [N SKILL.md] + [N optimization-history.md] + run-log.md + learning-notes.md
```

---

## Anti-patterns

- Never run Step 2 (spawn agents) before reading run-log.md priority moves and computing hit-rates — skipping this caused 24 wasted contraction-removal edits in the 2026-05-07 run because the low-ROI technique wasn't filtered out before agents started.
- Never mark a skill DONE at matter score < 100 without explicitly logging the stuck dimensions in run-log.md — silent gaps accumulated across runs on bc-business-review and schema-contract-tests until the sub-dimension cycle surfaced them.
- Never apply contraction removal ("doesn't" → "does not") or "Stolen from" → "Origin" rewrites as optimizer techniques — these produced 0 matter-score delta across all 38 applications in the 2026-05-07 run and inflate the leaderboard with noise.
- Never apply imperative-voice rewrites (M7) when that skill's M7 already scores 10 — 53% miss rate in 2026-05-07 because remaining passive constructions are inside fenced code blocks or section headers, which are correct-as-is.
- Never flag `[placeholder]` text inside a fenced code block as an M10 failure — fenced blocks are illustrative templates; 9 false M10 failures were logged in 2026-05-07 by scanning inside fences.
- Never skip updating learning-notes.md — this is the mechanism by which the optimizer gets smarter across sessions; skipping it resets all learned constraints and forces re-discovery of already-known failures.
- Never spawn more than 6 agents in parallel — in the 2026-05-07 run, Group 5 with 8 skills generated edit conflicts and required more retry loops than Group 4 with 5 skills.
- Never commit without running Step 6 (run-log update) first — a commit with no log entry loses the learning signal for that run permanently.
- Never skip the sub-dimension cycle after binary dimensions converge at 100/100 — the 2026-05-07 Pass 3+4 sub-dimension audit found 115 additional edits (generic anti-patterns, shape-vague outputs, SQL errors) that the binary Ralph loop missed entirely.
- Never overwrite an existing optimization-history.md — always append a new run block so the full lineage is preserved; overwriting destroys the record of which techniques already failed on that specific skill.
