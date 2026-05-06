---
name: skill-optimizer
description: >
  Systematically upgrades any existing AccentOS skill using a multi-pass
  iterative loop: score the current version against a dynamic weighted rubric
  (output quality, methodology fitness, trigger coverage, accuracy,
  speed/efficiency, AccentOS fit, anti-pattern compliance), calibrate weights
  to match desired outcomes (accuracy-heavy, output-heavy, trigger-focused,
  custom), set a target threshold (default +15 pts or user-specified as "+10%",
  "minimum 85", "add ability to X"), run Ralph-loop brainstorm sessions
  (cap: 5) targeting highest gap-contribution dimensions first until a plan
  can hit the threshold, gate on Michael's approval, execute, verify with a
  real scored matrix test, then synthesize next-pass opportunities and ask
  if another pass is wanted. Each pass seeds the next with pattern history
  from optimization-history.md — a persistent log of every run that becomes
  a reusable optimization framework. Rubric weights evolve pass-over-pass
  based on momentum (diminishing returns detection). Supports auto-continue
  mode ("keep going until 90") for unattended multi-pass runs.
  Use this skill when Michael says: "optimize [skill]", "tune [skill]",
  "make [skill] better", "level up [skill]", "score this skill",
  "skill optimizer", "run skill optimizer on [skill]", "upgrade [skill]",
  "squeeze more out of [skill]", "what's wrong with [skill]",
  "tighten up [skill]", "another pass", "keep going", "batch optimize",
  "optimize all skills", or any phrasing that asks to systematically improve
  an existing AccentOS skill.
  Do not use to build a new skill from scratch (use skill-forge) or to
  run automated test suites (use skill-eval-suite). Always edits files
  and produces a scored report — never stops at advice-only output.
---

# skill-optimizer

**Purpose:** Iteratively score, calibrate, brainstorm, execute, and verify improvements to any AccentOS skill. Each pass learns from the previous one via history tracking, rubric momentum analysis, and cross-skill pattern matching. Ends only when Michael says stop or a score cap is reached.

Eleven phases per pass: **preflight → history-check → profile → score → rubric-review → weight-calibration → threshold → brainstorm-loop → plan-gate → execute → score-test → next-pass-analysis → pass-gate → history-log**. The plan gate and score test are non-negotiable — nothing executes without approval and nothing ships without a verified score.

---

## Trigger Recognition

Run when Michael says:
- "optimize [skill name]"
- "tune [skill]" / "tune this skill"
- "make [skill] better" / "improve [skill]"
- "level up [skill]" / "upgrade [skill]"
- "score this skill" / "score [skill]"
- "skill optimizer" / "run skill optimizer on [skill]"
- "what's wrong with [skill]" / "analyze [skill]"
- "squeeze more out of [skill]" / "tighten up [skill]"
- "how can [skill] be better"
- "batch optimize" / "optimize all skills"
- "another pass" / "run another pass on [skill]"
- "keep going" / "keep going until [score]"

**Batch mode:** When Michael says "optimize all skills" or "batch optimize", run Steps 0–2 (profile + score) for all target skills in parallel, then present a priority-ranked list (lowest score first) with estimated effort. Run the full pass loop on each skill in sequence. Commit each skill independently before moving to the next — never bundle multiple skills in one commit.

**Auto-continue mode:** When Michael says "keep going until [N]" or "run [N] more passes" — skip the Step 8.5 pass gate and loop automatically. Hard cap: 3 auto-continue passes before requiring explicit confirmation. Still requires plan gate approval before each execute step.

**Do NOT trigger for:**
- Building a new skill from scratch → use skill-forge
- Automated promptfoo regression tests → use skill-eval-suite
- One-line typo or label fix → use Edit directly

---

## Session State

Track these values throughout the session. Initialize in Step 0, update each pass:

```
SESSION STATE
  Skill:                [skill-name]
  Scope:                GLOBAL | PROJECT | BOTH
  Branch:               [branch]
  Pass:                 [N]   (increment each time loop restarts at Step 3)
  Pass baseline:        [score at start of THIS pass]
  Session start:        [score at start of Pass 1]
  Pass scores:          [P1: X.X | P2: X.X | ...]  (all actual scores, appended each pass)
  Rubric version:       v[N]  (matches current pass number)
  Weight profile:       [name]
  Auto-continue:        YES (until [N]) | NO
  Already tried:        [list of changes applied in prior passes this session]
  History loaded:       YES | NO
  Last pass delta:      [X.X pts | — (first pass)]
  Consecutive thin:     [N]   (passes with delta < 2.0 pts in a row; reset to 0 on meaningful gain)
  Plateau:              NO | YES (triggered at consecutive thin = 2)
  Thin threshold:       2.0 pts  (override with "meaningful means [X] pts" at session start)
```

---

## Step 0 — Preflight

Do in parallel:

1. **Identify target.** Accept: skill name (`vibe-speak`), path (`skills/vibe-speak/SKILL.md`), or description ("the vendor cascade skill"). If ambiguous, pick the highest-likelihood match given context — do not ask.
2. **Detect scope.** Check both locations:
   - Global: `~/.claude/skills/[skill-name]/SKILL.md`
   - Project: `/home/user/accent-os/skills/[skill-name]/SKILL.md`
   - Found in both → **scope = BOTH**
   - Found only in `~/.claude/skills/` → **scope = GLOBAL**
   - Found only in project → **scope = PROJECT**
   - Found in neither → "Skill not found" + list candidates from both locations, then stop.
3. **Record branch.** `git -C /home/user/accent-os branch --show-current`. If on main, Step 6 will create `claude/optimize-[skill-name]-[8-char-rand]` before committing.
4. **Check recent history.** `git -C /home/user/accent-os log --oneline -5 -- skills/[skill-name]/` — note whether skill has been recently modified.
5. **Load optimization history.** Read `/home/user/accent-os/skills/skill-optimizer/optimization-history.md`. Extract all prior entries for this skill. If none found: `History: none (first run)`.
6. **Load skill feedback.** Read `/home/user/accent-os/skills/skill-feedback.md`. Extract FAIL/PARTIAL entries for this skill — these are real-world failure reports from live runs. They become high-priority brainstorm seeds labeled `[FEEDBACK: real failure]`. If none found: `Feedback: none`.

Output: preflight block + session state initialized.

---

## Step 1 — History Check

**Skip on Pass 1 if no history found.** Otherwise:

From `optimization-history.md` entries for this skill, extract:
- **Already tried:** list of changes applied in prior sessions (seed the "already tried" pool for Step 4)
- **What moved most:** dimensions that consistently improved across runs (candidates for momentum tracking)
- **What resisted:** dimensions that barely moved despite targeting (candidates for weight reconsideration)
- **Cross-skill patterns:** improvements applied to similar skills that achieved +2 or higher delta — import as candidate hypotheses for Step 4

Output:
```
HISTORY CHECK: [N prior passes found for this skill]
  Already tried (skip in brainstorm): [list or "none"]
  Momentum dimensions (improving): [list]
  Resistance dimensions (stalled): [list]
  Cross-skill patterns available: [N] — [brief description of most relevant]
```

---

## Step 2 — Profile Current

Read `skills/[skill-name]/SKILL.md` in full, plus any `references/*.md`. Extract:

| Field | What to capture |
|---|---|
| **Trigger phrases** | Every phrase under Trigger Recognition |
| **Workflow steps** | Step titles + stated output per step |
| **Output format** | Named blocks, tables, or file artifacts produced |
| **Anti-patterns** | Every listed prohibition |
| **AccentOS substitutions** | Specific mentions: paths, Supabase ID, BC store ID, stack tools |
| **Description length** | Character count of YAML description block |
| **Companion skills** | Any listed pairs or dependencies |

List each field's raw content — no summaries. This is the scoring source of truth.

---

## Step 3 — Score Current (Updated Rubric Matrix)

Score the current skill against the weighted rubric. On Pass 1, use default weights. On Pass N>1, use the weights last approved in Step 3.5 (Rubric Review).

See `references/rubric-weights.md` for scoring guidance per dimension.

| Dimension | Weight | Raw (0–10) | Weighted | Gap Contribution | Momentum | Evidence |
|---|---|---|---|---|---|---|
| **Output Quality** | 25% | | | (10−raw)×0.25 | [↑↓→] | Each step names a concrete output; output blocks defined |
| **Methodology Fitness** | 20% | | | (10−raw)×0.20 | [↑↓→] | Steps ordered, non-overlapping, imperative-voiced |
| **Trigger Coverage** | 15% | | | (10−raw)×0.15 | [↑↓→] | ≥4 triggers; match Michael's actual phrasing |
| **Accuracy** | 15% | | | (10−raw)×0.15 | [↑↓→] | Constraints, edge cases, and validation explicitly handled |
| **Speed / Efficiency** | 10% | | | (10−raw)×0.10 | [↑↓→] | No unnecessary loops, redundant context reads, or token waste |
| **AccentOS Fit** | 10% | | | (10−raw)×0.10 | [↑↓→] | ≥3 AccentOS-stack substitutions; correct paths and stack names |
| **Anti-pattern Compliance** | 5% | | | (10−raw)×0.05 | [↑↓→] | ≥3 anti-patterns; specific and enforceable |

**Momentum key:** ↑ = improved last pass, ↓ = declined or stalled last pass, → = first pass or unchanged.

**Baseline Score** = Σ (Weight × Raw / 10) × 100. Range: 0–100.

**Edge cases:**
- If all dimensions score 10/10 → baseline is 100; output "Already at maximum. Optimization will improve enforceability."
- If a dimension cannot be scored (missing content) → score it 0 and flag: "Cannot score [Dimension] — no relevant content found."
- If two versions (BOTH scope) produce identical scores → note "No divergence detected" and treat as a single optimization target.

**Gap Contribution** = (10 − raw) × weight. Higher = more improvement potential per unit effort.

**BOTH scope note:** Score project version as primary. Divergence between global and project versions in anti-patterns, triggers, or AccentOS Fit counts as an Accuracy penalty.

Output:
```
PASS [N] BASELINE: [X.X / 100]   (Session start: [Y.Y] | Delta from start: [±Z])
Scoring notes:
  - Strongest: [Dimension] — [why]
  - Weakest: [Dimension] — [why]
  - [2–3 additional observations]

Gap contribution ranking:
  1. [Dimension]: [value] ([momentum ↑↓→]) — [why this has room]
  2. [Dimension]: [value] ([momentum])
  3. ...

Rubric drift alert: [YES — weights changed since last pass | NO]
```

---

## Step 3.5 — Rubric Review & New Rubric Matrix (Pass N > 1 only)

**Skip on Pass 1** — Rubric v1 is the default balanced weights. On Pass N>1, build a new versioned rubric based on what actually moved last pass.

**Momentum analysis rules:**
- ↑ dimension now at raw ≥ 8 → diminishing returns → reduce weight 3–5%, redistribute to lowest-raw dimension
- ↓ dimension (targeted but moved < +0.5) → resistance → reduce weight 3–5%, redistribute to a moving dimension
- Untargeted dimension at raw < 5 → opportunity → increase weight 3–5%
- Max ±5% per dimension per pass. Always renormalize to sum = 100%.

**Output the new rubric as a named versioned matrix:**

```
╔══════════════════════════════════════════════════════════════════════╗
║  RUBRIC v[N]  —  Effective for Pass [N]  (replaces Rubric v[N-1])  ║
╠══════════════════════╦════════╦══════════╦════════════╦═════════════╣
║ Dimension            ║ Weight ║ Old Wt   ║ Gap Contrib║ Adjustment  ║
╠══════════════════════╬════════╬══════════╬════════════╬═════════════╣
║ Output Quality       ║  XX%   ║  XX%     ║   X.XX     ║ [reason]    ║
║ Methodology Fitness  ║  XX%   ║  XX%     ║   X.XX     ║ [reason]    ║
║ Trigger Coverage     ║  XX%   ║  XX%     ║   X.XX     ║ [reason]    ║
║ Accuracy             ║  XX%   ║  XX%     ║   X.XX     ║ [reason]    ║
║ Speed / Efficiency   ║  XX%   ║  XX%     ║   X.XX     ║ [reason]    ║
║ AccentOS Fit         ║  XX%   ║  XX%     ║   X.XX     ║ [reason]    ║
║ Anti-pattern         ║  XX%   ║  XX%     ║   X.XX     ║ [reason]    ║
╠══════════════════════╬════════╬══════════╬════════════╬═════════════╣
║ TOTAL                ║ 100%   ║  100%    ║            ║             ║
╚══════════════════════╩════════╩══════════╩════════════╩═════════════╝

Weights sum: 100% ✓
Rubric drift from v[N-1]: [YES — [N] dimensions changed | NO — weights unchanged]
Recalculated Pass [N] baseline on Rubric v[N]: [X.X / 100]
  (was [Y.Y] on Rubric v[N-1] — delta is rubric drift, not skill change)
```

**Adjustment reason shorthand:** `↓ dim-returns` | `↓ resisted` | `↑ untargeted` | `unchanged`

Auto-apply adjustments ≤3% per dimension without waiting. Flag adjustments >3% in the rubric drift alert so weight-adjusted cross-pass comparisons are clearly labeled.

This rubric matrix is the scoring authority for Step 9. All recommendations in Step 10 are derived from Rubric v[N] gap contributions — not the prior rubric.

---

## Step 4 — Weight Calibration (Dynamic Scoring Matrix)

Adjust rubric weights to match the desired outcome profile. On Pass 1, apply user-requested profile. On Pass N>1, apply momentum-adjusted weights from Step 3.5.

**Built-in profiles:**

| Profile | When to use | Weight adjustments |
|---|---|---|
| **balanced** | Default | No change — use Step 3 weights |
| **accuracy-heavy** | Critical logic / data correctness skills | Accuracy → 30%, Output Quality → 20%, Speed → 5% |
| **output-heavy** | Report / artifact generation skills | Output Quality → 35%, Methodology → 20%, AccentOS Fit → 5% |
| **trigger-focused** | Trigger recognition / routing skills | Trigger Coverage → 30%, Accuracy → 20%, Anti-pattern → 5% |
| **efficiency-heavy** | High-frequency / token-sensitive skills | Speed/Efficiency → 25%, Methodology → 25%, Anti-pattern → 5% |

**Custom overrides:** `"accuracy is critical"` → accuracy-heavy; `"output matters most"` → output-heavy; `"focus on triggers"` → trigger-focused; `"make it lean"` → efficiency-heavy; `"[dim] = [N]%"` → set directly, redistribute rest; `"per-dimension goals: [dim] ≥ [X]"` → set floor targets.

Confirm all weights sum to 100%. Recalculate baseline + gap contributions.

Output one line if no change: `WEIGHT CALIBRATION: [profile] (no changes from Step 3.5)` — else full table.

---

## Step 5 — Set Threshold

On Pass 1, set threshold per baseline:

| Baseline range | Default threshold |
|---|---|
| ≥ 80 | Baseline + 10 pts (cap 95) |
| 60–79 | Baseline + 15 pts (cap 95) |
| 40–59 | Baseline + 20 pts |
| < 40 | Baseline + 25 pts |

On Pass N>1, threshold = Pass N baseline + 10 pts (cap 95), unless Michael overrides.

**Accept overrides:** "+10%", "+20 points", "minimum 85", "add ability to [X]", "just fix the triggers".

Output:
```
THRESHOLD SET: [X.X / 100]
  Pass [N] baseline: [Y.Y]  →  Target: [X.X]  (gap: [delta] pts)
  Session target: [overall target if different]
```

---

## Step 6 — Brainstorm Loop (Ralph style, gap-contribution-aware, history-seeded)

**Goal:** Produce a consolidated plan whose estimated post-change score ≥ threshold.

**Hard cap: 5 loops per pass.**

**Before Loop 1:** Load the "already tried" pool from session state + history check. Any hypothesis that matches an already-tried change is excluded from consideration — do not re-attempt changes that didn't hold or were already applied.

**Load cross-skill patterns:** From history check, import candidate hypotheses from similar skills where a pattern achieved +2 delta. Label these `[PATTERN: from [skill]]` and evaluate them first.

**Load real-world failures:** From `skill-feedback.md` entries for this skill, extract gap descriptions. These become highest-priority hypotheses — a skill that failed in real use has a documented gap that is definitionally worth fixing. Label these `[FEEDBACK: real failure]` and target them before any estimated-delta hypotheses.

**Each loop:**
1. Sort dimensions by gap contribution (highest first). Target top-2 gap-contribution dimensions this loop — lower-gap hypotheses need explicit justification.
2. Generate 3–5 concrete improvement hypotheses. Each must name:
   - The specific change
   - The dimension it improves
   - Estimated raw-score delta (+1 / +2 / +3 only)
   - Gap contribution delta: delta × weight = expected weighted-score gain
   - Source: `[PATTERN: from skill]` or `[NEW]`
   - Not in already-tried: confirmed
3. Stack non-overlapping hypotheses with highest combined gap-contribution delta into running plan.
4. Simulate total score: apply deltas to baseline, sum.
5. Check per-dimension floor targets.
6. **If estimated score ≥ threshold AND all floors met** → lock plan, proceed to Step 7.
7. **If not** → log gap, drop stacked hypotheses from pool, generate fresh hypotheses for remaining top-gap dimensions, loop.

After each loop:
```
LOOP [N/5]: estimated [X.X] vs. threshold [Y.Y]
  Gap remaining: [Z.Z pts]
  Top gap-contribution dims: [Dim1] ([gap]), [Dim2] ([gap])
  New hypotheses:
    H1. [Change] — [Dim] +[Δraw] → +[Δweighted] pts  [FEEDBACK: real failure | PATTERN: X | NEW]
    H2. [Change] — [Dim] +[Δraw] → +[Δweighted] pts  [NEW]
    H3. ...
  Running plan:
    1. [Change]
    2. ...
  Already-tried exclusions: [list if any skipped]
  Floor targets: [all met | [Dim] still at [X] < floor [Y]]
```

**If 5 loops exhaust without meeting threshold:**
Flag: "Threshold not reachable in 5 loops. Proceeding with best plan." Continue to Step 7 with highest-estimated plan.

---

## Step 7 — Plan Gate

Present consolidated plan. Output exactly:

```
═══ OPTIMIZATION PLAN — PASS [N] ═══
Target skill: [skill-name]
Scope: GLOBAL | PROJECT | BOTH
Pass: [N]   Session score so far: [start] → [current]
Weight profile: [name]   Rubric drift: [YES | NO]

Baseline: [X.X / 100]  →  Estimated: [Y.Y / 100]  →  Threshold: [Z.Z / 100]

Planned changes:
  1. [Change — what, where, applies to: GLOBAL | PROJECT | BOTH]
  2. [Change — ...]
  ...

Changes excluded (already tried):
  - [Change] — applied in Pass [N] / prior session

Files to edit:
  [list each file path explicitly]

═══ AWAITING APPROVAL ═══
  "go" / "execute"                    → apply as-is
  "[item N] — adjust: [change]"       → modify then execute
  "drop [item N]"                     → remove then execute
  "add [X]"                           → add to plan
  "stop" / "cancel"                   → abort; no files changed

I am stopped here. Nothing is edited until you reply.
═════════════════════════════════════
```

---

## Step 8 — Execute

Apply each approved change using Edit for surgical edits. Use Write only when ≥60% of the file changes.

**Write to the correct location(s) per scope:**
- **GLOBAL**: `~/.claude/skills/[skill-name]/SKILL.md` — no project-specific hardcoding.
- **PROJECT**: `/home/user/accent-os/skills/[skill-name]/SKILL.md` — AccentOS refs required.
- **BOTH**: universal changes to both; project-specific changes to project only. Validate each independently.

**Validation — PROJECT or BOTH (project file):**
1. YAML parses; `name` + `description` present; ≥250 chars; contains "AccentOS" or "Accent Lighting"; no unfilled `[bracketed]` placeholders outside fenced blocks.
2. ≥3 AccentOS-stack substitutions (AccentOS, Accent Lighting, store-cwqiwcjxes, hsyjcrrazrzqngwkqsqa, /home/user/accent-os).
3. ≥3 anti-pattern entries. No prose walls.

**Validation — GLOBAL or BOTH (global file):**
1. YAML parses; `name` + `description` present; ≥250 chars; no project-specific hardcoding.
2. No AccentOS/Accent Lighting hardcoding — uses `[project-root]/`, generic language.
3. ≥3 anti-pattern entries. No prose walls.

**BOTH scope — divergence check:** Diff structural elements (step count, anti-pattern count, trigger count). Flag unintentional divergence.

Fix any validation failure before committing.

**Branch:** If NOT on main → commit to current branch. If on main → create `claude/optimize-[skill-name]-[8-char-rand]`.

Commit: `optimize: [skill-name] (pass [N], [scope]) — [top change]`

Update session state: add changes to "already tried" list.

---

## Step 9 — Score Matrix Test

Re-score the updated SKILL.md against **Rubric v[N]** (the rubric produced in Step 3.5 for this pass). Show all previous passes for longitudinal comparison — fill `—` for passes that haven't occurred yet.

```
SCORE TEST — PASS [N]  (Rubric v[N])
─────────────────────────────────────────────────────────────────────────────────────────
Dimension            | Wt  | Start | P1  | P2  | P3  | P4  | P5  | NOW  | Δ pass | Gap
Output Quality       | XX% | X.X   | X.X | X.X | —   | —   | —   | X.X  | [±Z]   | X.XX
Methodology Fitness  | XX% | X.X   | X.X | X.X | —   | —   | —   | X.X  | [±Z]   | X.XX
Trigger Coverage     | XX% | X.X   | X.X | X.X | —   | —   | —   | X.X  | [±Z]   | X.XX
Accuracy             | XX% | X.X   | X.X | X.X | —   | —   | —   | X.X  | [±Z]   | X.XX
Speed / Efficiency   | XX% | X.X   | X.X | X.X | —   | —   | —   | X.X  | [±Z]   | X.XX
AccentOS Fit         | XX% | X.X   | X.X | X.X | —   | —   | —   | X.X  | [±Z]   | X.XX
Anti-pattern         | XX% | X.X   | X.X | X.X | —   | —   | —   | X.X  | [±Z]   | X.XX
─────────────────────────────────────────────────────────────────────────────────────────
TOTAL                |     | X.X   | X.X | X.X | —   | —   | —   | X.X  | [±Z]   |

PASS [N] SCORE:  [X.X / 100]   on Rubric v[N]
Threshold:       [Y.Y / 100]
Session start:   [Z.Z / 100]   Total session gain: +[Δ] pts across [N] passes
Rubric drift:    [YES — [N] dims weight-changed; cross-pass comparison is approximate | NO]
Floor targets:   [all met ✓ | [Dim] at [X] < floor [Y] ✗]
STATUS:          PASSED ✓  |  FAILED ✗

Pass delta log:  P1 +[X.X] | P2 +[X.X] | P3 +[X.X] | ...
Thin passes:     [N consecutive passes below 2.0 pts]
```

**Note on rubric drift:** When Rubric v[N] weights differ from prior versions, the "Start" and prior-pass columns are re-expressed on the new weights for visual consistency. Flag this clearly — the numbers changed because the rubric changed, not because the skill regressed.

**If PASSED:** proceed to Step 10.

**If FAILED — refinement loop (cap: 3 passes):**
1. Identify dimensions still short with highest remaining gap contribution.
2. Generate 2–3 targeted fixes for those only.
3. Apply via Edit, validate, re-score.
4. Output score + status after each pass.
5. If PASSED → proceed to Step 10.

**If FAILED after 3 refinement passes:**
Output: "Threshold not met after 3 refinement passes. Pushing highest-scored version." Do not revert. Flag shortfall in Step 11.

---

## Step 10 — Next-Pass Analysis

Generate actionable intelligence for the next pass. Always run, even if score is high.

**Identify:**
1. Top 3 remaining gap-contribution dimensions (from Step 9 score table)
2. Any momentum ↓ dimensions that were targeted this pass but didn't move — flag as resistance
3. Cross-skill patterns not yet tried that could apply to remaining gaps
4. Whether a rubric weight adjustment would change which dimensions are prioritized next pass

Output:
```
NEXT-PASS ANALYSIS
  Remaining gap-contribution ranking:
    1. [Dimension]: [gap value] ([momentum]) — [why still has room]
    2. [Dimension]: [gap value] ([momentum])
    3. [Dimension]: [gap value] ([momentum])

  Resistance flagged: [Dimension] — targeted in Pass [N], moved only +[X]. Likely cause: [reason].
  Recommend deprioritizing in Pass [N+1] or adjusting weight.

  Next-pass hypotheses (3–5, targeting top gaps):
    H1. [Change] — [Dimension] +[estimated delta] → +[weighted gain] pts
    H2. [Change] — [Dimension] +[estimated delta] → +[weighted gain] pts
    H3. [Change] — [Dimension] +[estimated delta] → +[weighted gain] pts

  Cross-skill patterns available for next pass:
    - "[Pattern description]" (applied to [skill], moved [Dim] +[delta])

  RUBRIC v[N+1] PREVIEW (proposed adjustments for next pass):
    [Dimension]: [old]% → [new]%  ([reason])
    Under new weights, top gaps would shift to: [Dim1] ([new gap contrib]), [Dim2] ([new gap contrib])
    These become the brainstorm targets for Pass [N+1].

  Estimated next-pass score: [current] + [estimated gain] = [projected]
  Estimated pass delta: +[X] pts  ([MEANINGFUL ≥2.0 | THIN <2.0 — warning])
```

---

## Step 11 — Optimization Report

```
═══ SKILL OPTIMIZER — PASS [N] REPORT ═══

Skill:  [skill-name]
Scope:  GLOBAL | PROJECT | BOTH
Files:  [all edited files]
Branch: [branch]   Commit: [SHA short]   Pass: [N]

SCORE SUMMARY
  Weight profile: [name]   Rubric drift: [YES | NO]
  Session start:  [X.X / 100]  (Pass 1 baseline)
  Pass [N] start: [Y.Y / 100]
  Pass [N] final: [Z.Z / 100]
  Threshold:      [T.T / 100]
  Status:         MET ✓  |  BEST AVAILABLE ✗  (gap: [delta])
  Floor targets:  [all met ✓ | [Dim] at [X] < floor [Y] ✗]

WHAT CHANGED THIS PASS
  1. [Change] — [why it moved the score]
  2. [Change] — [...]

BIGGEST GAINS THIS PASS
  [Dimension]:  [before] → [after]  (+[delta])

SESSION CUMULATIVE GAINS  (Pass 1 → Pass [N])
  [Dimension]:  [session start] → [now]  (+[total delta])
  Total score movement: +[N] pts across [N] passes

REMAINING WEAKNESSES
  - [Dimension]: [X.X] — [why this resists improvement]

HOW TO USE THE OPTIMIZED SKILL
  Trigger with:   "[top trigger 1]"
                  "[top trigger 2]"
                  "[top trigger 3]"
  Input needed:   [what to provide]
  Output shape:   [what to expect]
  Pairs well with: [companion skills]

Brainstorm loops: [N/5]   Refinement passes: [M/3]   Total session passes: [P]
═══════════════════════════════════════════════════════════════════════
```

---

## Step 12 — Pass Gate

**Always runs after Step 11.** Auto-continue mode skips this gate (up to 3 auto-continue passes, but plateau detection still applies).

**First: evaluate this pass's delta and update plateau state.**

```
PASS [N] DELTA ASSESSMENT
  This pass gain:       +[X.X] pts
  Meaningful threshold: ≥2.0 pts
  Assessment:           MEANINGFUL ✓  |  THIN ✗
  Consecutive thin:     [N]  (was [N-1])
  Session pass deltas:  P1 +[X] | P2 +[X] | P3 +[X] | ...
```

Update session state:
- If delta ≥ 2.0 → set `Consecutive thin: 0`. Continue normally.
- If delta < 2.0 → increment `Consecutive thin`. If now = 1 → warn. If now = 2 → set `Plateau: YES`.

**If Plateau = YES (2 consecutive thin passes):**

```
🛑 PLATEAU DETECTED
  Pass [N-1] gain: +[X] pts (thin)
  Pass [N] gain:   +[X] pts (thin)
  Two consecutive passes below the 2.0 pt meaningful threshold.

  The skill has reached a local ceiling under the current rubric and approach.
  Best committed version is: [score] / 100.

  Recommendation: STOP HERE.
  Continuing is likely to produce marginal changes that add noise without
  meaningful quality gain. The best version is already committed.

  To override: "force another pass" — overrides plateau once, then re-evaluates.
  To accept:   "done" / "stop"
═════════════════════════
```

Do NOT present "another pass" as a standard option when Plateau = YES. Require explicit "force another pass" to continue. Log the plateau in Step 13 history entry.

**If no plateau, output the standard pass gate:**

```
═══ PASS GATE ═══
Pass [N] complete.
  Score:    [before] → [after]   (+[delta] this pass — [MEANINGFUL | THIN])
  Session:  [start] → [now]      (+[total] across [N] passes)
  Rubric:   v[N] applied this pass

NEXT PASS PREVIEW  (based on Rubric v[N+1])
  Rubric v[N+1] shifts priority to: [Dim1] ([new gap]), [Dim2] ([new gap])
  Estimated gain: +[X] pts → projected [Y.Y]  ([MEANINGFUL ≥2.0 | THIN <2.0 — consider stopping])
  Key hypotheses:
    1. [H from Step 10]
    2. [H from Step 10]

  [If thin warning]: ⚠ Estimated next pass is also thin (+[X] pts). Two thin passes = auto-stop.
  [If resistance detected]: ⚠ [Dimension] resisted twice — rubric weight reduced in v[N+1].

UNRESOLVED FEEDBACK
  [If entries exist]: ⚠ [N] FAIL/PARTIAL entries in skill-feedback.md not yet addressed.
  [If none]: ✓ No unresolved feedback entries.

OPTIONS
  "another pass"                   → run Pass [N+1] with Rubric v[N+1] and next-pass hypotheses
  "keep going until [score]"       → auto-continue (plateau detection still active)
  "another pass, focus on [X]"     → next pass targets [X] dimension; Rubric v[N+1] reweights accordingly
  "new idea: [change]"             → add to next-pass plan, then run
  "meaningful means [X] pts"       → change thin threshold for this session
  "done" / "stop" / "looks good"  → end session, skip to Step 13

I am stopped here. Waiting for your reply.
═════════════════════════
```

Parse reply:
- "another pass" / "force another pass" → increment pass counter, increment Rubric version, return to Step 3.5 (build Rubric v[N+1]) → Step 3 (re-score on new rubric) → continue. Seed brainstorm with Step 10 hypotheses.
- "done" / "stop" → proceed to Step 13.
- "meaningful means [X]" → update thin threshold in session state, re-evaluate current pass, re-output gate.

---

## Step 13 — History Log

Append a structured entry to `/home/user/accent-os/skills/skill-optimizer/optimization-history.md`. Always run at session end (after final pass gate "done" or after auto-continue cap).

**Entry format:**
```markdown
---

## [YYYY-MM-DD] [skill-name] — Pass [N] (Session total: [total passes])

**Skill:** [skill-name]
**Scope:** GLOBAL | PROJECT | BOTH
**Pass:** [N of this session] | **Session passes:** [total]
**Weight profile:** [name] | **Rubric drift:** YES | NO

### Score Matrix

| Dimension | Weight | Session Start | Pass End | Session Delta | Momentum |
|---|---|---|---|---|---|
| Output Quality | 25% | | | | |
| Methodology Fitness | 20% | | | | |
| Trigger Coverage | 15% | | | | |
| Accuracy | 15% | | | | |
| Speed / Efficiency | 10% | | | | |
| AccentOS Fit | 10% | | | | |
| Anti-pattern | 5% | | | | |
| **TOTAL** | | **[start]** | **[end]** | **+[delta]** | |

**Threshold:** [T.T] | **Status:** MET ✓ | BEST AVAILABLE ✗ | PLATEAU STOP ✗
**Plateau triggered:** YES (after passes [N-1] and [N] both thin) | NO

### Changes Applied
1. [Change] — [Dimension] +[delta]
2. ...

### What Moved Most
[Dimension] (+[delta]) — [one sentence on why it moved]

### What Resisted
[Dimension] (+[delta]) — [one sentence on why it resisted] — **Recommendation for next session:** [deprioritize | try approach X]

### Next-Session Proposals
1. [Hypothesis] — [Dimension] +[estimated delta]
2. ...

### Patterns Confirmed Effective (reusable across skills)
- "[Pattern]" → [Dimension] +[delta avg] — applies to: [skill types]

**Branch:** [branch] | **Commits:** [SHA list]
```

After appending, output: `HISTORY LOGGED — [skill-name] Pass [N] appended to optimization-history.md`

---

## AccentOS context

- Stack: Claude API (Anthropic), file system, git
- Project: AccentOS / Accent Lighting
- Skill root: /home/user/accent-os/skills/ (Codespace: /workspaces/accent-os/skills/)
- Skill registry: /home/user/accent-os/skills/_index.md
- Rubric guidance: /home/user/accent-os/skills/skill-optimizer/references/rubric-weights.md
- Optimization history: /home/user/accent-os/skills/skill-optimizer/optimization-history.md
- Skill feedback queue: /home/user/accent-os/skills/skill-feedback.md
- Gotcha log: /home/user/accent-os/skills/skill-forge/gotcha-log.md
- Skill-finder: planned companion — routes FAIL outcomes to optimizer (fix) vs. forge (rebuild)

---

## Anti-patterns

- **Never** start the brainstorm loop without a baseline score — delta estimates are meaningless without an anchor.
- **Never** skip the Step 7 plan gate — no file is edited before Michael approves the plan.
- **Never** exceed 5 brainstorm loops per pass or 3 refinement passes — caps are hard.
- **Never** score a skill from memory or a summary — read the actual SKILL.md file first.
- **Never** revert committed changes when the threshold isn't met — push the best version found and flag the gap.
- **Never** use this skill to build a new skill — use skill-forge for blank-slate builds.
- **Never** claim the threshold is met without running the Step 9 scored matrix test — estimated scores are estimates, not facts.
- **Never** push to main without explicit permission — branch first.
- **Never** run more than one dimension's custom weight adjustment at a time without re-summing all weights to 100%.
- **Never** skip Step 4 weight calibration when Michael specifies a desired outcome profile.
- **Never** target low gap-contribution dimensions first in brainstorm loops — always sort by gap contribution and address the top-2 dimensions each loop.
- **Never** re-attempt a change already in the "already tried" list — it was either applied or rejected; trying again wastes a brainstorm loop.
- **Never** skip Step 13 history log — every session end must append to optimization-history.md, even if threshold was not met.
- **Never** auto-continue more than 3 passes without re-confirming with Michael — unattended loops without a cap can produce diminishing-return changes that make the skill harder to read.
- **Never** compare before/after scores when weights changed between passes without flagging rubric drift — the numbers are on different scales.
- **Never** ignore FAIL/PARTIAL entries in `skill-feedback.md` for the target skill — real-world failure data outranks estimated-delta hypotheses and must be addressed first or explicitly deferred.
- **Never** close a session with unresolved skill-feedback entries without flagging them in the pass gate output.
- **Never** score a pass on a different rubric version without re-expressing all prior pass scores on the new weights — silent rubric drift makes longitudinal comparisons meaningless.
- **Never** continue past 2 consecutive thin passes (<2.0 pts gain each) without explicit "force another pass" — plateau detection exists to prevent marginal changes that add noise and reduce skill readability without meaningful quality gain.

## Outcome Signal

At the end of every optimization session, emit:

**If threshold MET:**
```
SKILL OUTCOME: PASS — skill-optimizer → [skill-name] optimized [X.X → Y.Y / 100] in [N] passes
```

**If threshold NOT MET (best available):**
```
SKILL OUTCOME: PARTIAL — skill-optimizer
  Delivered: [skill-name] improved [X.X → Y.Y / 100]
  Gap:       [delta] pts below threshold [T.T] after [N] passes + 3 refinement passes
  Options:   "another pass" → continue optimizing | "done" → accept best available
  → Logged to skills/skill-feedback.md
```
