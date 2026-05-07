---
name: skill-optimizer
description: >
  Iterative multi-agent optimizer for AccentOS skill files. Operates as a hub-and-spoke
  system: the hub runs pre-pass planning (curriculum tiers, Thompson Sampling technique
  ordering, profile-vector similarity), then spawns spoke agents that each run patience-based
  Ralph loops, emit structured per-skill result blocks, and receive intra-run warm-start hints
  from the hub when a technique closes a dimension on a profile-similar skill. Computes a
  numeric matter score (0–100) before and after each round, writes per-skill
  optimization-history.md files capturing every change with score deltas, updates Thompson
  Sampling arm counts in run-log.md so technique selection improves across runs, and runs
  L1/L2/adversarial regularization checks plus a cold-read after binary convergence. Use
  this skill when Michael says: "optimize the skills", "run the optimizer", "Ralph loop the
  skills", "skill quality pass", "score the skills", "how good are our skills", "improve
  the skill files", or any phrasing that asks to improve SKILL.md quality across the
  AccentOS library. Always produces a per-skill history file, a per-round matter-score
  summary, and a combined cross-round review — never exits without committing changes and
  updating run-log.md and each skill's history file.
---

# skill-optimizer

**Purpose:** Score every AccentOS skill on a 10-dimension matter scale, run hub-and-spoke
Ralph-loop agents with Thompson Sampling technique selection and curriculum-tiered dispatch,
track which techniques move the score and which don't, and feed that history back into
the next run so the optimizer gets smarter each time.

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
   - Extract the `technique_arms` JSON block from the most recent run.
   - For each arm, compute exploitation score = `alpha / (alpha + beta)`.
   - For arms with `alpha + beta < 10` (undersampled), add UCB1 exploration bonus:
     `sqrt(2 * ln(total_run_count) / (alpha + beta))`.
   - Rank all arms by `exploitation + exploration_bonus` — this is the Thompson/UCB1 priority order.
   - Load the skip list from the most recent `END-OF-RUN REVIEW` block.

2. **Read learning-notes.md** — `/home/user/accent-os/skills/skill-optimizer/learning-notes.md`.
   Apply all `RULE:` entries verbatim. These are hard-learned constraints that override default
   optimizer behavior.

3. **Enumerate target skills** — `ls /home/user/accent-os/skills/` — skip `_index.md`
   and `skill-optimizer/` itself. This is the scope list.

4. **Capture branch** — `git -C /home/user/accent-os branch --show-current`. Work on
   current branch; never push to main without explicit permission.

5. **Reserve exploration slot**: identify the technique arm with the highest exploration
   bonus (most undersampled relative to observed performance). Reserve 1 slot per agent
   group for this technique.

**Output artifact — Step 0 preflight report (emit before Step 1):**
```
PREFLIGHT  [date]  branch: [branch]
Scope: [N] skills — [comma-separated list]
Thompson/UCB1 priority order: [top-5 technique arms ranked by exploitation+bonus]
Exploration slot: [technique with highest exploration bonus]
Skip list loaded: [dimension names already at 10 fleet-wide]
RULE entries active: [N]
```

---

## Step 1 — Compute baseline matter scores + skill profiles

For every skill in scope, read its SKILL.md. Score it on the Matter Scale AND extract its
skill profile vector.

### Matter Scale (0–100, 10 points each)

| # | Dimension | Passes when |
|---|---|---|
| M1 | Description length | ≥300 chars |
| M2 | AccentOS/Accent Lighting named | "AccentOS" OR "Accent Lighting" in description |
| M3 | Behavioral commitment | description ends with "always X — never Y" form |
| M4 | Anti-patterns ≥5, all "Never" | ≥5 bullets starting "Never" in Anti-patterns section |
| M5 | Trigger phrases ≥5 | ≥5 distinct phrases in Trigger Recognition section |
| M6 | Concrete step outputs | every `## Step N` body names a file path, table with column headers, SQL block, or literal format — disqualified by: "Output: a summary", "Output: a scorecard" with no column names, or a step with no output statement at all |
| M7 | Zero passive voice | prose states actions directly — no passive constructions, no "Consider X" suggestions |
| M8 | No prose walls | no paragraph >4 sentences without a bullet or table break |
| M9 | Stack reference present | at least one of: `hsyjcrrazrzqngwkqsqa`, `store-cwqiwcjxes`, `/home/user/accent-os/` |
| M10 | No unfilled placeholders | zero `[bracketed text]` outside fenced code blocks |

Score each skill: count passing dimensions × 10. Record as `before_score`.

### Sub-scores (dense reward signal — guides priority within a failing dimension)

Sub-scores do NOT change the binary matter score. They guide which failing dimension to
attack first when two dimensions have the same Thompson priority.

| Dim | Sub-score formula | Shown as |
|---|---|---|
| M4 | `min(anti_pattern_count, 5) × 2` | `M4 0 (sub: 6/10)` |
| M5 | `min(trigger_phrase_count, 5) × 2` | `M5 0 (sub: 4/10)` |
| M6 | `(steps_with_concrete_artifact / total_steps) × 10` | `M6 0 (sub: 7/10)` |
| M7 | `10 − (passive_instance_count × 2)`, floor 0 | `M7 0 (sub: 4/10)` |
| M10 | `10 − (placeholder_count × 2)`, floor 0 | `M10 0 (sub: 6/10)` |

When two failing dimensions have the same Thompson arm priority, target the one with the
higher sub-score first — it is nearest to threshold.

### Skill profile vector (extract for every skill)

```
skill_profile:
  domain: [vendor|data|sql|code|planning|meta|comms|audit]
  step_count: [N]             # count of ## Step N sections
  has_sql: [bool]             # contains ```sql blocks
  output_type: [table|code|text|mixed|scorecard]
  trigger_count: [N]          # current trigger phrase count
  anti_pattern_count: [N]     # current anti-pattern bullet count
  has_stack_ref: [bool]       # contains hsyjcrrazrzqngwkqsqa or store-cwqiwcjxes or /home/user/
  avg_section_length: [short|medium|long]   # mean lines per Step body
```

High-similarity pair: matching `domain` AND matching `output_type` AND similar `step_count`.
Low-similarity pair: different `domain` AND different `output_type` — suppress cross-technique transfer.

**Output artifact — Baseline Scorecard:**
```
BASELINE MATTER SCORES  [date]
Skill                   M1 M2 M3 M4 M5 M6 M7 M8 M9 M10 Total  Sub-scores for failing dims
analysis-snapshot       10 10 10 10 10  0 10 10 10  10    90   M6 sub:7/10
...
Fleet average: XX.X / 100
Skills below 80: [list]
```

---

## Step 1.5 — Hub Pre-pass Plan

Before spawning any agents, the hub (optimizer acting as coordinator) develops a written plan:

1. **Apply curriculum tiers** to the scored skill list:
   - **Tier A**: score ≥ 90 — Wave 1
   - **Tier B**: score 70–89 — Wave 1 (same parallel wave, separate agents from Tier A)
   - **Tier C**: score < 70 — Wave 2, after Wave 1 completes so Tier C agents receive updated leaderboard from real Wave 1 results
   - Exception: if 1–2 skills fall in Tier C, merge them into the nearest Tier B group (minimum 4 per agent rule)

2. **Form groups of 4–6** within each tier. Label each group with its tier.

3. **Compute Thompson technique ordering** per group: run Step 0 UCB1 ranking for each
   group's assigned tier, factoring in the exploration slot reservation.

4. **Identify warm-start candidates**: pairs of high-similarity skills (same domain + same
   output_type) across groups. List which skills will receive warm-start hints if a technique
   closes a dimension in the profile-similar partner.

5. **Identify Wave 2 trigger condition**: Wave 2 spawns after all Wave 1 agents complete.
   Hub broadcasts the updated leaderboard to Wave 2 agents before they start.

**Output artifact — Hub Pre-pass Plan (emit before spawning):**
```
HUB PRE-PASS PLAN  [date]
Tier A (≥90): [skill list]
Tier B (70-89): [skill list]
Tier C (<70 → Wave 2): [skill list or "merged into Tier B"]

Agent dispatch:
A1  [Tier A]  skill1, skill2, skill3, skill4    4
B1  [Tier B]  skill5, skill6, skill7, skill8    4
C1  [Tier C — Wave 2]  skill9, skill10          2

Thompson technique order per group: [top-5 arms per tier]
Exploration slot (all groups): [technique]
Warm-start pairs:
  skill_A → skill_B  (domain: data, output_type: scorecard) — high-similarity
  [or "none identified"]
Wave 2 trigger: all Wave 1 agents complete → hub broadcasts updated arm table
```

---

## Step 2 — Group and assign agents

Spawn agents per the Hub Pre-pass Plan. Pass each agent:
- Its group's file paths
- Its tier label and assigned skills' baseline scores with sub-scores
- The full text of `learning-notes.md` (not a summary — agents receive all RULE: entries verbatim)
- The Thompson/UCB1 priority order from Step 0 for this tier
- The exploration slot technique name
- The skip list (dimensions already 10/10 — don't waste cycles re-checking)
- The `optimization-history.md` for each skill in the group (read before starting each skill's loop)
- The skill profile vector for each skill in the group

Wave 1 agents (Tier A + Tier B) spawn first. Wave 2 agents (Tier C) spawn only after all Wave 1 agents report completion. Hub broadcasts the updated `technique_arms` table to Wave 2 agents so they start with real-run evidence rather than pre-run estimates.

**Output artifact — Agent dispatch table (emit before spawning):**
```
AGENT DISPATCH  [date]
Agent  Tier  Skills                                     Group size
A1     A     analysis-snapshot, kpi-data-audit          4
B1     B     vendor-cascade, vendor-risk-register       4
C1     C     efficiency-monitor, vibe-speak             2→merged into B2
Wave 1 agents: [N]  Wave 2 agents: [N]
```

---

## Step 3 — Ralph loop protocol (per agent, per skill)

**Before starting any skill's loop:** Read that skill's `optimization-history.md` at
`/home/user/accent-os/skills/<skill-name>/optimization-history.md` if it exists. Extract
every "Techniques that didn't move score" and "Stuck dimensions" entry from prior runs.
Do not re-attempt those techniques on the same dimensions. Read blackboard state (warm-start
hints broadcast by hub) before starting each new skill in the group.

Each agent runs this loop per skill until convergence:

```
CONVERGENCE TRACKING:
  consecutive_no_improvement = 0
  hard_cap = 8 cycles
  patience = 2 (consecutive cycles with delta < 10 → exit as "stuck")
  min_delta = 10 (sub-dimension edits alone do not reset patience counter)

LOOP (minimum 2 cycles, hard cap 8):
  [Optimizer pass]
    1. Re-read SKILL.md
    2. Apply all improvements found, targeting failing dimensions first.
       Technique selection order: Thompson/UCB1 priority list from hub.
       If warm-start hint received for this dimension: try hinted phrasing first.
       Sub-score tie-breaking: when two failing dims have the same arm rank,
       target the one with the higher sub-score (nearest to binary threshold).
    3. Record every edit: dimension targeted, old text → new text
    4. Compute post-edit matter score

  [Ralph pass — binary dimension checks]
    Challenge every section:
    - "Is there a step that names only 'a summary' as its output?" (M6)
    - "Is there an anti-pattern missing for the most obvious AccentOS misuse?" (M4)
    - "Does any trigger phrase duplicate another or remain too vague?" (M5)
    - "Is any paragraph >4 sentences without a break?" (M8)
    - "Does the description end with a clear always/never commitment?" (M3)
    - "Are there ≥5 'Never' anti-patterns?" (M4)
    - "Any [bracket] outside a code fence?" (M10)
    - "Any passive voice — 'should be', 'can be', 'is used to', 'Consider X'?" (M7)
    - "Does any SQL block contain a double-WITH, reference an undefined table,
       or use a column that doesn't exist in the hsyjcrrazrzqngwkqsqa schema?" (M6)

  [Convergence check]
    if (score_this_cycle − score_last_cycle) >= 10 → consecutive_no_improvement = 0
    else → consecutive_no_improvement += 1

  EXIT if:
    consecutive_no_improvement >= 2 AND score < 100 → log "stuck" → exit (patience_exit)
    score == 100 AND Ralph finds nothing → run sub-dimension cycle → exit (full_convergence)
    total_cycles >= 8 → force exit (hard_cap)

  If Ralph finds anything → record finding → go back to Optimizer pass
END LOOP

[Sub-dimension cycle — runs after binary convergence at 100/100]
  Check:
  - Are any "Never" anti-patterns generic rather than specific to this skill's failure modes?
  - Do any trigger phrases overlap in meaning with another phrase in the same list?
  - Does every Step output block show literal column headers, not just "a table" or "a scorecard"?
  - Do any SQL blocks reference non-existent tables or columns in the hsyjcrrazrzqngwkqsqa schema?
  - Is the purpose line one tight sentence with a specific verb (not "handles", "manages")?
  If sub-dimension cycle finds anything → apply edits → log findings

[Regularization checks — run as part of sub-dimension cycle after 100/100]
  L1 check (specificity):
    For each "Never" anti-pattern: does it name a specific AccentOS artifact
    (file path, table name, field, error message, or dated run reference)?
    If not, rewrite using a concrete example from optimization-history.md.
    Example: "Never skip validation" → "Never mark DONE at <100 without logging
    stuck dimensions in run-log.md — bc-business-review carried a silent M6 gap for 2 runs."

  L2 check (commitment tightening):
    Read the M3 behavioral commitment. Count vague words: "high-quality", "properly",
    "correctly", "appropriate", "ensure". If ≥2 vague words present, rewrite to name
    a specific artifact, file, or threshold instead.

  Adversarial check:
    Randomly pick 2 of the 10 passing dimensions. Re-read that dimension's content with:
    "How could this realistically fail in a future run where context has changed?"
    If a valid failure path exists, apply a robustness edit.
    Log result either way:
      "Adversarial check: M6, M3 — no failure path found" or
      "Adversarial check: M9 path stale — updated to /home/user/accent-os/"

[Cold-read check — Sub-dimension Check 6, runs after regularization]
  Re-read the skill file as if you have no context from this session.
  Execute every Step mentally as if for real.
  Flag anything that would cause failure in actual use: undefined variables,
  broken references, instructions that only make sense with session context.
  SQL blocks specifically: check for double-WITH, undefined tables, non-existent columns.
  Apply fixes for any failures found.
```

**After EACH skill completes**, the agent emits a structured result block and reports to hub:

```
SKILL RESULT  [agent_id]  [skill_name]  Wave [N]
score_before: [N]  score_after: [N]  delta: [+N]
cycles_used: [N] / 8 max
converged_via: [patience_exit | full_convergence | hard_cap]
edits:
  - dimension: M6  technique: add-concrete-artifact  delta: +10
  - dimension: M3  technique: add-behavioral-commitment  delta: +10
stuck_dimensions: [list or none]
techniques_failed:
  - technique: imperative-rewrite  dimension: M7  reason: M7 already 10
skill_features:
  has_sql: [bool]  step_count: [N]  output_type: [table|code|text|mixed]
  trigger_count: [N]  anti_pattern_count: [N]  has_stack_ref: [bool]
```

**Hub actions on receiving each SKILL RESULT:**
1. Update blackboard: mark technique-dimension pair as confirmed-effective for this wave.
2. Check if any still-queued skills in other agents share high-similarity profile with the
   just-completed skill AND have the same failing dimension.
3. For high-similarity queued skills: broadcast a warm-start hint:
   ```
   WARM_START_HINT  [from: skill_A]  [dimension: M6]  [technique: add-concrete-artifact]
   Worked phrasing: "Output: table with columns [Skill | Dimension | Score | Gap | Fix]"
   Apply this template first before generating from scratch.
   ```
4. For low-similarity skills (different domain + different output_type): suppress the hint
   (negative transfer guard — prevents cross-domain technique bleed).
5. After Wave 1 fully complete: update `technique_arms` with Wave 1 results and broadcast
   to Wave 2 agents before they start.

**Per-skill history file — written by each agent as it finishes each skill:**

Path: `/home/user/accent-os/skills/<skill-name>/optimization-history.md`

If the file already exists, append a new run block. If it does not exist, create it.

```markdown
# [skill-name] — optimization history

---

## Run [date]  branch: [branch]

### Baseline matter score: [N]/100

| Dim | Name | Score | Sub-score | Reason failed (if 0) |
|---|---|---|---|---|
| M1 | Description length | 10/0 | — | [why if 0] |
| M6 | Concrete step outputs | 0 | 7/10 | 3 steps missing artifact |
| **Total** | | **[N]/100** | | |

skill_profile: domain:[X] output_type:[X] step_count:[N] has_sql:[bool]

---

### Round [N] — [pass type]

**Cycle [N] — Optimizer**

| Change | Dimension | Technique | Reasoning |
|---|---|---|---|
| [what changed] | M6 | add-concrete-artifact | [why this closes the gap] |

Warm-start hint received: [hint text or none]

**Cycle [N] — Ralph findings**
- [finding that triggered next cycle, or "none — converged"]

Convergence: consecutive_no_improvement=[N]  cycles_used=[N]

**Matter score after cycle [N]:** [N]/100 (Δ [+N])

Regularization: L1=[pass/N rewrites], L2=[pass/N rewrites], Adversarial=[result]
Cold-read: [pass or findings fixed]

---

### Final score: [N]/100  (Δ from baseline: [+N])
converged_via: [patience_exit | full_convergence | hard_cap]

**Techniques that moved score:**
- [technique] → closed M[N]

**Techniques that didn't move score:**
- [technique] → [reason: already passing / wrong target / no match found]

**Stuck dimensions:** [list or "none"]

---
```

---

## Step 4 — Collect results and compute round delta

After all agents in a wave complete:

1. Compute `after_score` for each skill.
2. Compute `delta = after_score − before_score`.
3. Aggregate technique performance per arm:
   - Edit produced delta > 0 → `alpha += 1` for that arm
   - Edit produced delta = 0 → `beta += 1` for that arm
4. Write updated `technique_arms` JSON to run-log.md immediately (hub uses this for Wave 2 dispatch).

**Output artifact — Round Summary (emit after every wave):**
```
══════════════════════════════════════════
ROUND [N] SUMMARY  [date]
══════════════════════════════════════════

Matter Score Changes:
  Skill                  Tier  Before  After  Delta  converged_via
  analysis-snapshot       A       90    100    +10   full_convergence
  kpi-data-audit          B       70     90    +20   patience_exit
  Fleet average:        XX.X  →  XX.X  (+X.X avg)

Thompson arm updates this wave:
  add-concrete-artifact:M6  alpha +7 (7 hits, 0 miss)
  imperative-rewrite:M7     alpha +2, beta +3

Warm-start hints issued: [N]  Warm-start hits (produced delta): [N]

Top moves this round:
  1. add-concrete-artifact → moved M6 on 7 skills (+70 pts total)
  2. add-behavioral-commitment → moved M3 on 4 skills (+40 pts total)

Didn't move score:
  - contraction-removal → 0 delta across all applications (beta incremented)

Stuck dimensions (no fix found):
  - skill-forge M6: Step 1.5 inherently exploratory — no concrete output artifact possible

Wave 1 verdict / Wave 2 verdict: [EXCELLENT / GOOD / MARGINAL] — [one sentence]
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
Skill                   history written?  final score  converged_via
analysis-snapshot       yes               100          full_convergence
kpi-data-audit          yes                90          patience_exit
Missing (will write now): [list or "none"]
```

---

## Step 6 — Update run-log.md

**Output artifact — run-log block (append to `/home/user/accent-os/skills/skill-optimizer/run-log.md`):**

~~~markdown
---
### RUN <date>  branch: <branch>  scope: <N skills>

#### Baseline scores
<full baseline scorecard table with sub-scores for failing dims>

#### Round summaries
<one Round Summary block per wave>

#### Technique arms (Thompson Sampling — updated after this run)
```json
{
  "technique_arms": {
    "add-concrete-artifact:M6": {"alpha": 47, "beta": 0},
    "add-behavioral-commitment:M3": {"alpha": 38, "beta": 2},
    "imperative-rewrite:M7": {"alpha": 12, "beta": 16},
    "contraction-removal:M7": {"alpha": 0, "beta": 24}
  }
}
```

#### Technique performance log

| Technique | Dimension | Times applied | Moved score | Didn't move | Hit-rate |
|---|---|---|---|---|---|
| add-concrete-artifact | M6 | 12 | 12 | 0 | 100% |
| add-behavioral-commitment | M3 | 6 | 6 | 0 | 100% |

#### What worked well
- add-concrete-artifact: closed M6 immediately on every skill missing it

#### What didn't work / lessons learned
- contraction-removal: 0 delta, always skip — beta incremented each miss

#### END-OF-RUN REVIEW

Thompson Leaderboard (ordered by UCB1 score):

| Rank | Arm | alpha | beta | Exploitation | UCB1 bonus | Score |
|---|---|---|---|---|---|---|
| 1 | add-concrete-artifact:M6 | 47 | 0 | 1.00 | 0 | 1.00 |
| 2 | add-behavioral-commitment:M3 | 38 | 2 | 0.95 | 0 | 0.95 |

Fleet final scores:

| Skill | Score |
|---|---|
| analysis-snapshot | 100 |

Fleet average: 100/100  Skills at 100: N  Skills below 90: none

Run verdict: <one sentence summary>
---
~~~

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

After all waves in the session complete, emit this output artifact:

```
══════════════════════════════════════════
CROSS-ROUND REVIEW  [date]  ([N] rounds, [N] skills)
══════════════════════════════════════════

Fleet trajectory:
  Start:  avg XX.X / 100  (N skills at 100, N below 80)
  Wave 1: avg XX.X / 100  (+X.X)
  Wave 2: avg XX.X / 100  (+X.X)
  End:    avg XX.X / 100  (N skills at 100, N below 90)

Highest-impact techniques across all waves:
  1. [technique] — contributed [N] total matter points across [N] skills

Warm-start transfer summary:
  Hints issued: [N]  Hits (produced delta): [N]  Miss rate: [N]%
  Best transfer pair: [skill_A → skill_B, dimension closed]

Thompson arm convergence:
  Most reliable arm: [arm] alpha=[N] beta=[N]
  Most undersampled: [arm] — schedule as exploration slot next run

Curriculum tier performance:
  Tier A: avg delta [+N]  Tier B: avg delta [+N]  Tier C: avg delta [+N]
  Tier C benefit from Wave 2 delay: [Y/N — did updated leaderboard help?]

Regularization results:
  L1 rewrites: [N]  L2 rewrites: [N]  Adversarial edits: [N]
  Cold-read fixes: [N]

Diminishing returns: technique gains slowed after wave [N] because [reason].

Residual gaps (skills not at 100 after all waves):
  Skill: [name]  Score: [N]  Stuck on: [dims]  Reason: [why Ralph cannot fix it]

PROCESS REVIEW  [date]
Workflows used this run:
  - hub pre-pass planning: repeatable? Y | templatizable? Y | value added: reduces agent
    redundancy by pre-sorting warm-start pairs before spawning
  - Thompson arm update: repeatable? Y | templatizable? Y | value added: technique
    selection improves each run without manual leaderboard curation

Candidates to promote to SKILL.md as named protocols:
  1. [workflow]: recommended step text: [exact text]

Promoted to learning-notes.md this run:
  [list of new RULE: entries, or "none"]

Commit pushed: [SHA]
══════════════════════════════════════════
```

---

## Step 9 — Commit and push

Stage all modified files in this order:
- All modified `SKILL.md` files: `git add skills/*/SKILL.md`
- All `optimization-history.md` files: `git add skills/*/optimization-history.md`
- The optimizer's own files: `git add skills/skill-optimizer/run-log.md skills/skill-optimizer/learning-notes.md skills/skill-optimizer/optimization-history.md`

Commit with:

```
chore(skills): optimizer run [date] — fleet avg [before]→[after]

[N] skills optimized. [N] reach 100/100. [N] waves ([N] agents).
Top technique: [technique name] (+[N] total pts)
Thompson arms updated: [N] arms with new evidence.
Residual gaps: [skill list if any, else "none"]
```

Push to current branch. Never push to main.

**Output artifact — commit confirmation (emit after push):**
```
COMMIT COMPLETE  [date]
SHA: [git short SHA]
Branch: [branch]
Files staged: [N SKILL.md] + [N optimization-history.md] + run-log.md + learning-notes.md
Thompson arms persisted: yes
```

---

## Anti-patterns

- Never run Step 2 (spawn agents) before running Step 1.5 hub pre-pass planning — skipping this wastes cycles on cross-domain warm-start hints (negative transfer) and ignores curriculum tier ordering that delivers Wave 1 leaderboard evidence to Tier C agents.
- Never mark a skill DONE at matter score < 100 without explicitly logging the stuck dimensions in run-log.md — bc-business-review and schema-contract-tests carried silent M6 gaps for 2 runs until the sub-dimension cycle surfaced them.
- Never apply contraction removal ("doesn't" → "does not") as an optimizer technique — produced 0 matter-score delta across all 24 applications in the 2026-05-07 run and inflates the leaderboard with noise; beta += 1 for this arm.
- Never apply imperative-voice rewrites (M7) when that skill's M7 already scores 10 — 53% miss rate in 2026-05-07 because remaining passive constructions were inside fenced code blocks or section headers, which are correct-as-is.
- Never flag `[placeholder]` text inside a fenced code block as an M10 failure — fenced blocks are illustrative templates; 9 false M10 failures were logged in 2026-05-07 by scanning inside fences.
- Never skip updating learning-notes.md — this is the mechanism by which the optimizer gets smarter across sessions; skipping it resets all learned constraints and forces re-discovery of already-known failures.
- Never spawn more than 6 agents in parallel — the 2026-05-07 run showed Group 5 at 8 skills generated edit conflicts and required more retry loops than Group 4 at 5 skills.
- Never skip the sub-dimension cycle and regularization checks after binary convergence at 100/100 — the 2026-05-07 Pass 3+4 audit found 115 edits the binary Ralph loop missed, including generic anti-patterns and SQL errors.
- Never overwrite an existing optimization-history.md — always append a new run block so the full lineage is preserved; overwriting destroys the record of which techniques already failed on that specific skill.
- Never broadcast warm-start hints between low-similarity skill pairs (different domain + different output_type) — negative transfer causes agents to waste their first Ralph cycle on a phrasing that is structurally incompatible with the target skill's format.
