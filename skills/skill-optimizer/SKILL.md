---
name: skill-optimizer
description: >
  Systematically upgrades any AccentOS skill using an OODA-inspired multi-pass
  iterative loop (Observe → Orient → Decide → Act). Each pass runs: parallel
  history-check + profile; dimension registry review (dimensions are variable
  — add, retire, rename, reweight per pass; not fixed at 7); score on the
  active rubric with Socratic root-cause drilling for dims below 7; calibrate
  weights and set threshold in one step; methodology-enhanced brainstorm with
  Devil's Advocate challenges and Scientific Method predictions on every
  hypothesis, Red Team pass on every assembled plan, Occam's Razor tie-breaking;
  plan gate; execute; score test with prediction-vs-actual tracking; rubric
  evolution via Expected Impact weight formula; optimization report; pass gate
  with plateau detection (stops after 2 consecutive thin passes below 2.0 pts).
  Supports auto-continue mode, Perspective Sweeps (6 named roles deployed in
  parallel), and a First Principles reset for plateau breakthroughs. Scoring
  is calibrated: 50 = average functional skill, 75 = genuinely good, 85+
  = exceptional (formal validation required to substantiate), 100 = practically
  unachievable. Every session logged to optimization-history.md.
  Use this skill when Michael says: "optimize [skill]", "tune [skill]",
  "make [skill] better", "level up [skill]", "score this skill",
  "skill optimizer", "run skill optimizer on [skill]", "upgrade [skill]",
  "squeeze more out of [skill]", "what's wrong with [skill]",
  "tighten up [skill]", "another pass", "keep going", "batch optimize",
  "optimize all skills", or any phrasing that asks to systematically improve
  an existing AccentOS skill. Do not use to build a new skill from scratch
  (use skill-forge) or to run automated test suites (use skill-eval-suite).
  Always edits files and produces a scored report — never stops at advice-only.
---

# skill-optimizer

**Purpose:** Iteratively score, calibrate, brainstorm, execute, and verify improvements to any AccentOS skill using an OODA-loop structure and baked-in reasoning methodologies. Rubric dimensions and weights evolve every pass — the rubric is a variable, not a constant. Ends only when Michael says stop or a plateau is confirmed.

**Workflow per pass (13 steps, 0–12):**
preflight → [history-check + profile] → dimension-registry → score → calibrate+threshold → brainstorm → plan-gate → execute → score-test → rubric-evolution → report → pass-gate → history-log

Plan gate and score test are non-negotiable — nothing executes without approval, nothing ships without a verified score on the same rubric used for the baseline.

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
- "tighten [skill]" / "sharpen [skill]" / "polish [skill]"
- "work on [skill]" / "next pass on [skill]" / "one more pass" / "go again"
- "optomize [skill]" / "optimise [skill]" (common misspellings — match and route correctly)
- "gap analysis [skill]" / "do a gap analysis of [skill]"
- "find ways to push [skill] further" / "push [skill] further" / "push yourself on [skill]"
- "how do we get [skill] to 100" / "push [skill] to 100" / "get [skill] to [score]"

**Batch mode:** When Michael says "optimize all skills" or "batch optimize", run Steps 0–3 (profile + score) for all target skills in parallel, present a priority-ranked list (lowest score first) with estimated effort, then run the full pass loop on each skill in sequence. Commit each skill independently before moving to the next.

Output after parallel profiling:
```
BATCH PRIORITY LIST  (profiled in parallel)
  Skill          | Score | Gap  | Est. passes | Priority reason
  ─────────────────────────────────────────────────────────────
  [skill-1]      | X.X   | XX.X | 1–2         | [why highest priority]
  [skill-2]      | X.X   | XX.X | 1           |
  ...
  Starting with: [skill-1]   Sequence: [skill-1] → [skill-2] → ...
```

**Auto-continue mode:** When Michael says "keep going until [N]" or "run [N] more passes" — skip Step 11 pass gate and loop automatically. Hard cap: 3 auto-continue passes before requiring explicit confirmation. Plan gate approval still required before each execute step. Plateau detection still active.

**Do NOT trigger for:** new skill from scratch → skill-forge | automated regression tests → skill-eval-suite | one-line typo fix → Edit directly.

---

## Session State

Initialize in Step 0, update each pass:

```
SESSION STATE
  Skill:                [skill-name]
  Scope:                GLOBAL | PROJECT | BOTH
  Branch:               [branch]
  Pass:                 [N]
  Pass baseline:        [score at start of THIS pass]
  Session start:        [score at start of Pass 1]
  Pass scores:          [P1: X.X | P2: X.X | ...]
  Rubric version:       v[N]
  Dimension count:      [N] active   changes: none | added [X] | retired [Y] | renamed [Z]
  Weight profile:       [name]
  Auto-continue:        YES (until [N]) | NO
  Already tried:        [list of changes applied this session]
  History loaded:       YES | NO
  Last pass delta:      [X.X pts | — (first pass)]
  Consecutive thin:     [N]   (reset to 0 on meaningful gain)
  Plateau:              NO | YES
  Thin threshold:       2.0 pts
  Predictions tracked:  [N made | N accurate | N over | N under]
```

---

## Perspective Sweep Framework

A **Perspective Sweep** deploys multiple named roles simultaneously, each evaluating the same question from their angle and reporting independently. Results are synthesized before proceeding. Use sweeps to surface ideas that single-perspective reasoning misses — especially at decision inflection points like brainstorm finalization, rubric evolution, and plan review.

**Default Perspective Roster:**

| Role | Lens | Key question |
|---|---|---|
| **Contrarian** | Challenges all assumptions | "What's wrong here? What are we not seeing?" |
| **User Advocate** | Michael's real-session value | "Would this output be useful in a live AccentOS session?" |
| **Efficiency Critic** | Token and time cost | "Is this the leanest path to the outcome? What can be cut?" |
| **Domain Expert** | AccentOS stack fit | "Is this wired for AccentOS workflows, or is it generic?" |
| **Methodologist** | Rigor and reproducibility | "Are steps ordered, non-overlapping, and reliably reproducible?" |
| **Red Teamer** | Failure modes and edge cases | "How would I break this? What input kills this?" |

**Running a sweep:**

1. State the question or proposal being evaluated.
2. Each role evaluates independently and reports in 1–3 sentences.
3. Synthesis step: note where roles agree (signal), where they diverge (tension to resolve), and list net changes to hypotheses, plans, or rubric proposals.

```
PERSPECTIVE SWEEP — [question or context]

  Contrarian:     "[observation from this lens]"
  User Advocate:  "[observation]"
  Efficiency:     "[observation]"
  Domain Expert:  "[observation]"
  Methodologist:  "[observation]"
  Red Teamer:     "[observation]"

  SYNTHESIS:
    Consensus: [what most roles agree on]
    Tension:   [where roles diverge — worth resolving before proceeding]
    Net:       [hypotheses added | plan modifications | dim proposals | none]
```

**Auto-trigger points** (deploy subset of roles — not all six every time):
- **Step 3** (scoring): when a dim score is surprising → Contrarian + Methodologist
- **Step 5** (brainstorm, final loop before Red Team): all 6 roles generate one hypothesis each → merge non-overlapping novel ones into the running plan
- **Step 6** (plan gate, on request): User Advocate + Red Teamer + Efficiency Critic
- **Step 9** (rubric evolution, when changes proposed): Domain Expert + Contrarian + User Advocate

**Manual trigger:** "sweep [step/question]" or "get all perspectives on [X]" at any point. Michael can also name a custom perspective: "add a [role] perspective" → deploy it alongside the default roster for that sweep.

---

## Step 0 — Preflight

Do in parallel:

Run items 1 and 2 first to resolve skill name and scope. Once resolved, run items 3–6 in parallel (all depend on the skill name).

1. **Identify target.** Accept skill name, path, or description. If ambiguous, pick highest-likelihood match — do not ask.
2. **Detect scope.** Check both `~/.claude/skills/[skill]/SKILL.md` and `/home/user/accent-os/skills/[skill]/SKILL.md`. Both found → BOTH. One only → that scope. Neither → output `SKILL NOT FOUND: [name]` — list all SKILL.md paths found under both skill roots — stop. Do not continue past this point.
3. **Record branch.** `git -C /home/user/accent-os branch --show-current`. If on main, Step 7 creates `claude/optimize-[skill]-[8-char-rand]`.
4. **Check recent history.** `git -C /home/user/accent-os log --oneline -5 -- skills/[skill]/` — note recent changes.
5. **Load optimization history.** Read `/home/user/accent-os/skills/skill-optimizer/optimization-history.md`. Extract all prior entries for this skill. If the file does not exist → create it with the standard header and entry format from Step 12 (first two comment lines only); note `First run — no history` in PREFLIGHT output.
6. **Load skill feedback.** Read `/home/user/accent-os/skills/skill-feedback.md`. Extract FAIL/PARTIAL entries for this skill — real-world failure reports. Label these `[FEEDBACK: real failure]`.

Output:
```
PREFLIGHT
  Skill:    [name]   Scope: [GLOBAL | PROJECT | BOTH]   Branch: [branch]
  History:  [N prior passes | none — first run]
  Feedback: [N FAIL/PARTIAL entries | none]
  Est. session: [1 pass (~10–15k tokens)] | [2–3 passes (~30–50k tokens)]
               (based on: baseline gap [X pts], skill size [N lines], history depth)
```
Session state: initialized.

---

## Step 1 — History Check + Profile (parallel)

Do both simultaneously. Do not wait for one before starting the other.

**1a — History Check** (from optimization-history.md loaded in Step 0):
- **Already tried:** changes applied in prior sessions → seed the "already tried" pool for Step 5
- **Momentum dims:** consistently improving → candidates for continued targeting
- **Resistance dims:** stalled despite targeting → candidates for weight reduction or approach change
- **Cross-skill patterns:** improvements achieving ≥+2 delta on similar skills → import as `[PATTERN: from [skill]]` hypotheses
- **Prior dimension changes:** any additions/retirements/renames for this skill
- **Gotcha log (Pass 1 only):** Read `/home/user/accent-os/skills/skill-forge/gotcha-log.md` for entries matching this skill type — real-failure patterns from skill-forge sessions. Label as `[FEEDBACK: gotcha]` in brainstorm. Skip on Pass N>1 (already absorbed into already-tried pool).

```
HISTORY CHECK: [N prior passes found]
  Already tried:         [list or "none"]
  Momentum dims:         [list or "none"]
  Resistance dims:       [list or "none"]
  Cross-skill patterns:  [N available — brief description]
  Prior dim changes:     [none | [list]]
```

**1b — Profile Current** (read `SKILL.md` + `references/*.md` in full):

| Field | What to capture |
|---|---|
| Trigger phrases | Every phrase under Trigger Recognition |
| Workflow steps | Step titles + stated output per step |
| Output format | Named blocks, tables, or file artifacts |
| Anti-patterns | Every listed prohibition |
| AccentOS substitutions | Paths, Supabase ID, BC store ID, stack tools |
| Description length | Character count of YAML description |
| Companion skills | Listed pairs or dependencies |

List each field's raw content — no summaries. This is the scoring source of truth.

```
SKILL PROFILE — [skill-name]  (Pass [N], from Step 1b read)
  Trigger phrases:       [N] total — [list first 5, "...N more"]
  Workflow steps:        Steps [0–N] — [step title → output block name]
  Output blocks:         [N] named — [list block names]
  Anti-patterns:         [N] entries
  AccentOS substitutions: [list paths, IDs, tool names found]
  Description length:    [N] chars
  Companion skills:      [list]
  Scope signals:         [AccentOS/project refs | generic only]
```

_(On Pass N+1: re-read the SKILL.md as written by Step 7 — not the pre-execution version from Pass N. The skill changed; the profile must reflect the updated file.)_

_`references/*.md`: re-read only if Step 9 (prior pass) evolved rubric structure or anchor definitions. If no structural rubric changes, the Step 9 Rubric Evolution output from the prior pass is sufficient — skip the re-read._

Wait for both 1a and 1b outputs before proceeding.

---

## Step 2 — Dimension Registry Review

The dimension registry is the set of named quality dimensions used for scoring this pass. It is **variable** — not fixed at 7. Each pass can add, retire, rename, or reweight dimensions.

**Default starter set (not mandates):**

| Dimension | Default Weight | Applies To |
|---|---|---|
| Output Quality | 25% | all skills |
| Methodology Fitness | 20% | all skills |
| Trigger Coverage | 15% | all skills |
| Accuracy | 15% | all skills |
| Speed / Efficiency | 10% | all skills |
| AccentOS Fit | 10% | PROJECT and BOTH scope |
| Anti-pattern Compliance | 5% | all skills |

**Identify skill type:** routing | artifact-generation | workflow | meta | guidance

**Retirement candidates — propose retirement if:**
- Raw ≥9 for 2+ consecutive passes with no realistic headroom
- Dimension not applicable to this skill type (e.g., AccentOS Fit for a GLOBAL-only meta skill)

**Addition candidates — propose addition if:**
- Feedback entries mention a quality aspect unmeasured (e.g., repeated "it doesn't explain why" → add Reasoning Transparency)
- Skill type has a critical quality gap (e.g., routing skill → add Route Accuracy)
- A current dimension is doing two jobs that would be better measured separately

**Rename candidates — propose rename if:**
- Dimension name is misleading relative to what it actually measures in practice

**Weight redistribution:**
- Adding: new dim gets specified % or default 10%; carve proportionally from highest-weighted dims
- Retiring: redistribute weight proportionally to remaining active dims
- Always renormalize to 100%

**Auto-apply:** single change with weight shift ≤5%. Flag and confirm if 2+ changes or any shift >5%.

On Pass N>1: apply rubric evolved from previous pass's Step 9 as the starting registry.

```
DIMENSION REGISTRY — PASS [N]  (Rubric v[N])

  Dimension               | Weight | Since | Status
  ─────────────────────────────────────────────────────
  [active dimensions]     |  [%]   | v[N]  | active
  [retired dimension]     |   —    | v[1]  | retired v[N] — [reason]

  Changes this pass:
    Added:   [DimName — reason — weight X%]                      | none
    Retired: [DimName — reason — weight → [dim] (+X%), [dim] (+Y%)] | none
    Renamed: [OldName → NewName — reason]                        | none

  Weights sum: 100% ✓
```

This registry is the scoring authority for Steps 3 and 8 in this pass. Do not change it between Step 3 and Step 8.

---

## Step 3 — Score on Active Rubric

Score the current skill against the dimension registry from Step 2. **Read `references/rubric-weights.md` before scoring.** Scoring is calibrated: 5.0 = average, 7.5 = good, 9.0+ requires formal validation evidence. Do not score from intuition — match behavior to the anchors in rubric-weights.md.

| Dimension | Weight | Score (0–10) | Weighted | Gap Contrib (pts) | Momentum | Evidence cited |
|---|---|---|---|---|---|---|
[one row per active dimension from Step 2 registry]

**Score**: match to rubric-weights.md anchors. 5.0 = average. Do not round up without evidence.

**Weighted** = Weight × Score / 10 × 100 = Weight_pct × Score / 10

**Gap Contribution (pts)** = (10 − Score) × Weight_pct / 100. This is the points this dimension can still add to the total. Sort by this to find highest-leverage targets.

**Momentum:** ↑ improved last pass, ↓ stalled or declined, → first pass or unchanged.

**Baseline** = Σ(Weight_pct × Score / 10). Range: 0–100.

**Evidence requirements:**
- Score > 7.5: must cite specific evidence from the SKILL.md. Quote the section, don't describe it.
- Score > 8.0: Contrarian + Methodologist Perspective Sweep required. Both must confirm. Cap at 8.0 if either raises an unresolved objection.
- Score > 9.0: must cite formal validation (passing test suite or 3+ documented real sessions). Label "PROVISIONAL 9.X" if informal only. Provisional scores do not count toward threshold.

**Floor penalty:** Any dimension at Score < 3.0 → apply −5 pts to total. Multiple dims below 3.0 stack.

**Edge cases:**
- All dimensions at 10/10 → output "Already at maximum. Optimization would improve formal validation coverage, not behavior."
- Dimension cannot be scored (missing content) → score 0, flag "Cannot score [Dim] — no relevant content found."
- BOTH scope: score project version as primary. Divergence between global and project versions counts as an Accuracy penalty.

**Socratic root-cause drilling** — for each dimension at Score < 7.0:

```
[SOCRATIC ROOT — DimName at X.X/10]
  Why is it at [X]?     →  [surface observation]
  Why does that happen? →  [underlying cause]
  Root cause:           →  [specific, actionable finding — becomes brainstorm target]
```

Cap at 3 levels per dimension. Skip if dim ≥7.0.

**Parallelism:** Score all dimensions simultaneously — no sequential dependencies between dim scores. When multiple dims require Socratic drilling, run all drills in parallel.

Output:
```
PASS [N] BASELINE: [X.X / 100]   (Session start: [Y.Y] | Session delta: [±Z])
Floor penalties: [none | −5 pts × N dims below 3.0]
Adjusted baseline: [X.X / 100]
Socratic roots: [N]   (seeds for Step 5)

Score interpretation: [<40 broken | 40-54 functional | 55-64 competent | 65-74 good | 75-84 excellent | 85-91 outstanding | 92+ requires formal validation]

Gap contribution ranking (descending):
  1. [Dim]: [gap contrib pts] ([momentum]) — [why still has room]
  2. [Dim]: [gap contrib pts]
  3. ...
```

**Perspective Sweep (auto when any score > 8.0 OR when any score differs from prior-pass score by >1.0; optional otherwise):** Run Contrarian + Methodologist. "Why is [Dim] at [X] and not lower?" Inflation is the expected failure mode. Their challenge must be resolved before finalizing the score.

---

## Step 4 — Calibrate + Set Threshold

Two sub-steps run sequentially — threshold depends on calibrated weights.

**4a — Weight Calibration:**

On Pass 1: apply user-requested profile. On Pass N>1: Rubric v[N] weights from Step 2 are already calibrated — check only for user override.

| Profile | When | Weight adjustments |
|---|---|---|
| **balanced** | default | no change |
| **accuracy-heavy** | critical logic / data correctness | Accuracy → 30%, Output Quality → 20%, Speed → 5% |
| **output-heavy** | report / artifact generation | Output Quality → 35%, Methodology → 20%, AccentOS Fit → 5% |
| **trigger-focused** | routing / invocation | Trigger Coverage → 30%, Accuracy → 20%, Anti-pattern → 5% |
| **efficiency-heavy** | high-frequency / token-sensitive | Speed → 25%, Methodology → 25%, Anti-pattern → 5% |

Custom overrides: "[dim] = [N]%" → set directly; "accuracy is critical" → accuracy-heavy; etc. Renormalize to 100% after any override.

If no override: `CALIBRATION: Rubric v[N] weights in effect (no override)`.

**4b — Set Threshold:**

| Baseline range | Default threshold |
|---|---|
| ≥80 | Baseline + 10 (cap 95) |
| 60–79 | Baseline + 15 (cap 95) |
| 40–59 | Baseline + 20 |
| <40 | Baseline + 25 |

Pass N>1: threshold = baseline + 10 (cap 95). Accept overrides: "+10%", "+20 points", "minimum 85", "add ability to [X]", "just fix the triggers".

```
THRESHOLD: [X.X / 100]
  Baseline: [Y.Y] → Target: [X.X] (gap: [delta] pts)
  Profile: [name]   Calibration: [applied | unchanged]
```

---

## Step 5 — Brainstorm Loop

**Cap: 5 loops per pass.**

**Before Loop 1, print the full combined already-tried pool** (session + all prior history). Distinguish status:
```
ALREADY TRIED — [N] total (skip all):
  Succeeded:   [change] (Pass [N])
  Failed:      [change] — [reason it didn't move the score]
  Deferred:    [change] — [reason skipped, not tried]
  From history: [list or none]
```

**Load in priority order:**
1. `[FEEDBACK: real failure]` — from skill-feedback.md. Documented real failures outrank all estimated-delta hypotheses. These are addressed first or explicitly deferred with a reason.
2. `[ROOT: DimName]` — Socratic root causes from Step 3. Each root must appear as a hypothesis target or be explicitly deferred.
3. `[PATTERN: from [skill]]` — cross-skill patterns from Step 1 history check (≥+2 delta confirmed).
4. `[NEW]` — novel hypotheses generated this loop.
5. Exclude: entire already-tried pool (session + history).

**Each hypothesis uses this format:**
```
H[N]. [Change description]
  Targets:    [Dimension] via [root cause if applicable]
  Delta:      +[X] raw → +[Y] weighted pts
  Source:     [FEEDBACK: real failure | PATTERN: from X | ROOT: DimName | NEW]
  DA:         "Assumes [X]. Fails if [Y]."  Confidence: HIGH | MED | LOW
  Predict:    "[Specific, checkable output change if applied]"
  Complexity: LOW (single edit) | MED (multi-edit) | HIGH (structural)
  Tried:      NO ✓
```

**Occam's Razor tie-break:** Equal estimated gain → prefer lower complexity.

**Each loop:**
1. Sort dimensions by **gap contribution pts** (highest first — not raw gap score; pts = (10 − score) × weight / 10). Target top-2 dims this loop.
2. Generate hypotheses for those dims using priority order above. When top-2 dims have independent root causes, generate their hypotheses in parallel.
3. Stack non-overlapping hypotheses with highest combined gap-contribution delta.
4. Simulate score: apply deltas to baseline, sum.
5. Check per-dimension floor targets.
6. If simulated score ≥ threshold AND all floors met → lock plan, proceed to Red Team Pass.
7. If not → log gap, generate fresh hypotheses for remaining top-gap dims, loop.

```
LOOP [N/5]: estimated [X.X] vs. threshold [Y.Y]
  Gap remaining: [Z.Z pts]   Top gap dims: [Dim1] ([gap]), [Dim2] ([gap])
  New hypotheses:
    H1. [Change] — [Dim] +[Δraw] → +[Δwt] pts  [source]  DA: "[assumption]"  Predict: "[outcome]"
    H2. ...
  Running plan: 1. [Change]  2. [Change] ...
  Already-tried exclusions: [list if any skipped]
  Feedback entries addressed: [list if any | none yet]
```

**Perspective Sweep (auto in final loop — before Red Team):** All 6 roles each generate one hypothesis from their angle. Merge non-overlapping, non-already-tried ones into the running plan. Output as a labeled `PERSPECTIVE SWEEP` block (format: see Perspective Sweep Framework above) positioned between the final loop's output and the Red Team Pass — not inline in the `LOOP [N/5]` block.

**Red Team Pass** (run once, after plan is assembled):
```
RED TEAM PASS  (Blue Team plan: [N] changes)
  ⚔ [Plan assumes X — what fails if Y?]
    🛡 [Counter / mitigation]  → HOLD ✓ | ADJUST: [modification]
  ⚔ [Attack on a second assumption]
    🛡 [Counter]  → HOLD ✓ | ADJUST: [modification]
PLAN VERDICT: HOLDS ✓ | ADJUSTED (modifications incorporated)
```

If 5 loops exhaust without meeting threshold: "Threshold not reachable in 5 loops. Proceeding with best plan."

---

## Step 6 — Plan Gate

```
═══ OPTIMIZATION PLAN — PASS [N] ═══
Target skill: [skill-name]
Scope: GLOBAL | PROJECT | BOTH
Pass: [N]   Session score so far: [start] → [current]
Weight profile: [name]   Rubric: v[N] ([N] active dimensions)

Baseline: [X.X / 100]  →  Estimated: [Y.Y / 100]  →  Threshold: [Z.Z / 100]

Planned changes:
  1. [Change — what, where, scope: GLOBAL | PROJECT | BOTH]
  2. ...

Red Team verdict: HOLDS ✓ | ADJUSTED — [modification]

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

## Step 7 — Execute

Apply each approved change using Edit for surgical edits. Use Write only when ≥60% of the file changes.

**Write to the correct location(s) per scope:**
- **GLOBAL**: `~/.claude/skills/[skill]/SKILL.md` — no project-specific hardcoding.
- **PROJECT**: `/home/user/accent-os/skills/[skill]/SKILL.md` — AccentOS refs required.
- **BOTH**: universal changes to both; project-specific changes to project only. Validate each independently.

**Validation — PROJECT or BOTH (project file):**
1. YAML parses; name + description present; ≥250 chars; contains "AccentOS" or "Accent Lighting"; no unfilled `[bracketed]` placeholders outside fenced blocks.
2. ≥3 AccentOS-stack substitutions (AccentOS, Accent Lighting, store-cwqiwcjxes, hsyjcrrazrzqngwkqsqa, /home/user/accent-os).
3. ≥3 anti-pattern entries. No prose walls.

**Validation — GLOBAL or BOTH (global file):**
1. YAML parses; name + description present; ≥250 chars; no project-specific hardcoding.
2. No AccentOS/Accent Lighting hardcoding — uses `[project-root]/`, generic language.
3. ≥3 anti-pattern entries.

**BOTH scope — divergence check:** Diff step count, anti-pattern count, trigger count. Flag unintentional divergence.

```
BOTH SCOPE DIVERGENCE CHECK
  Step count:       global [N] | project [N]  [MATCH ✓ | DIVERGE ✗]
  Trigger count:    global [N] | project [N]  [MATCH ✓ | DIVERGE ✗]
  Anti-pattern ct:  global [N] | project [N]  [MATCH ✓ | DIVERGE ✗]
  Verdict: [NO DIVERGENCE ✓ | DIVERGENCE DETECTED — [describe] — resolve before committing]
```

Fix any validation failure before committing. **Validation failure procedure:** identify which specific check failed; fix that element only; re-run the entire checklist from check 1 before attempting commit. Never commit a partially-valid file.

**Branch:** NOT on main → commit to current branch. On main → create `claude/optimize-[skill]-[8-char-rand]`.

Commit: `optimize: [skill-name] (pass [N], [scope]) — [top change]`

Update session state: add changes to "already tried". Update prediction count.

---

## Step 8 — Score Test

Re-score the updated SKILL.md against **the same Rubric v[N] used in Step 3** — same dimensions, same weights. Fair comparison. (Rubric evolution happens in Step 9, after this verification.)

Show all prior passes for longitudinal comparison; fill `—` for passes not yet run.

```
SCORE TEST — PASS [N]  (Rubric v[N])
─────────────────────────────────────────────────────────────────────────
Dimension            | Wt  | Start | P1  | P2  | P3  | NOW  | Δ pass | Gap
[active dimensions]  | XX% | X.X   | X.X | X.X | —   | X.X  | [±Z]   | X.XX
─────────────────────────────────────────────────────────────────────────
TOTAL                |     | X.X   | X.X | X.X | —   | X.X  | [±Z]   |

PASS [N] SCORE: [X.X / 100]  on Rubric v[N]
Threshold:      [Y.Y / 100]
Session start:  [Z.Z / 100]   Total session gain: +[Δ] pts across [N] passes
Rubric drift:   [YES — prior pass columns re-expressed on v[N] weights | NO]
STATUS:         PASSED ✓ | FAILED ✗

Pass delta log:  P1 +[X] | P2 +[X] | ...
Thin passes:     [N consecutive below 2.0 pts]
```

**Note on rubric drift:** When active dimensions differ from prior passes, prior-pass columns are re-expressed on current weights. Flag this — numbers changed because the rubric changed, not because the skill regressed.

**Prediction vs. Actual** (update session state Predictions tracked):
```
PREDICTION vs. ACTUAL
  H1: [Dim] predicted +[X] raw — observed +[Y] raw  [ACCURATE ✓ | OVER ↑ | UNDER ↓ | MISS ✗]
  H2: ...
  Session accuracy: [N/M correct]
  Calibration note: [e.g., "3/4 over-estimates → reduce future +1 estimates to +0.5 for this skill"]
```

**If new score is lower than Step 3 baseline (regression):** On feature branch not yet pushed → `git reset --soft HEAD~1` to unstage the commit, then restore the file. Already pushed → `git revert HEAD` (creates a new revert commit). Log the change as `[tried + regression: score dropped X → Y]` in the already-tried list. Do not retry the same change.

**If PASSED:** proceed to Step 9.

**If FAILED — refinement loop (cap: 3 passes):**
1. Identify highest remaining gap-contribution dims.
2. Generate 2–3 targeted fixes for those only.
3. Apply via Edit, validate, re-score.
4. If PASSED → Step 9. If FAILED after 3 passes → push highest-scored version, flag shortfall in Step 10.

---

## Step 9 — Rubric Evolution + Dimension Updates

Runs AFTER Step 8 (uses actual results). Builds Rubric v[N+1] for the next pass. Does NOT affect current pass scores.

**Dimension changes — evaluate:**
- Retirement candidate: Score ≥9.0 this pass AND ≥9.0 last pass (real ceiling reached) → propose retirement
- Addition candidate: prediction misses, emerging patterns, unaddressed root causes pointing to an unmeasured quality axis
- Rename: dimension name is misleading vs. what it actually measured in practice

**Weight optimization — Expected Impact Method** (full formula in `references/rubric-weights.md`):

For each active dimension i, compute:
1. `gap_i = 10 − score_i`
2. `potential_i`: actual delta if targeted, halved if resisted (<0.5 delta while targeted), 0 if structural ceiling (±0.5 for 3+ passes), 0.5 default if not targeted
3. `expected_impact_i = gap_i × potential_i`
4. `new_weight_i ∝ expected_impact_i` — renormalize; clamp min 3%, max 35%

**Definition — "targeted":** A dimension is targeted in a pass if it appeared as a top-2 gap-contribution dim in any brainstorm loop OR if a hypothesis specifically addressing it was included in the final assembled plan. Dimensions addressed only by Perspective Sweep roles (not in the assembled plan) are NOT counted as targeted.

**Parallelism:** Compute all Expected Impact values simultaneously — each dim's computation depends only on its own gap and potential, with no cross-dim dependencies.

This replaces simple momentum heuristics. Weight flows toward dimensions with the highest combination of remaining gap AND realistic improvement potential. Ceilings — structural or design — receive floor weight (3%) and are no longer targeted.

**Structural ceiling detection:** Flag any dim with identical score ±0.5 for 3+ consecutive passes despite targeting. Set `potential_i = 0`. Note in rubric output.

**Check for new dimension additions** based on prediction misses, emerging patterns, or unaddressed root causes.

**Perspective Sweep (auto when changes proposed):** Domain Expert + Contrarian + User Advocate on any proposed addition, retirement, or rename. Their synthesis answers: "Does this dimension actually measure what matters for this skill?"

```
RUBRIC EVOLUTION — v[N] → v[N+1]  (effective next pass)

DIMENSION CHANGES:
  [+] Added:   [DimName — reason — starting weight: X%]              | none
  [-] Retired: [DimName — reason — weight redistributed to: X (+Y%)] | none
  [~] Renamed: [OldName → NewName — reason]                          | none

WEIGHT ADJUSTMENTS:
  [Dim]  [old]% → [new]%  [↓ dim-returns | ↓ resisted | ↑ untargeted | ↑ new-dim | unchanged]
  ...
  Weights sum: 100% ✓

RUBRIC v[N+1] SUMMARY:
  [N] active dimensions   Drift from v[N]: [YES — [X] changes | NO]
  Top gap dims under v[N+1]: [Dim1] ([new gap contrib]), [Dim2] ([new gap contrib])
  These become primary brainstorm targets next pass.
```

Pass Rubric v[N+1] to Step 2 of the next pass as the starting registry.

---

## Step 10 — Optimization Report

```
═══ SKILL OPTIMIZER — PASS [N] REPORT ═══

Skill:  [skill-name]
Scope:  GLOBAL | PROJECT | BOTH
Files:  [all edited files]
Branch: [branch]   Commit: [SHA]   Pass: [N]

SCORE SUMMARY
  Dimensions:     [N] active (Rubric v[N])   Profile: [name]   Rubric drift: [YES | NO]
  Session start:  [X.X / 100]   (Pass 1 baseline)
  Pass [N] start: [Y.Y / 100]
  Pass [N] final: [Z.Z / 100]
  Threshold:      [T.T / 100]
  Status:         MET ✓ | BEST AVAILABLE ✗ (gap: [delta])

WHAT CHANGED THIS PASS
  1. [Change] — [why it moved the score]
  2. ...

BIGGEST GAINS
  [Dim]: [before] → [after]  (+[delta])

SESSION CUMULATIVE GAINS  (Pass 1 → Pass [N])
  [Dim]: [session start] → [now]  (+[total])
  Total: +[N] pts across [N] passes

REMAINING WEAKNESSES
  - [Dim]: [X.X] — [why this resists]

PREDICTION ACCURACY THIS SESSION
  [N/M hypotheses accurate]   Calibration: [summary]

HOW TO USE THE OPTIMIZED SKILL
  Trigger:     "[top trigger 1]" / "[top trigger 2]" / "[top trigger 3]"
  Input:       [what to provide]
  Output:      [what to expect]
  Pairs with:  [companion skills]

Brainstorm loops: [N/5]   Refinement passes: [M/3]   Session passes: [P]
═══════════════════════════════════════════════════════════
```

---

## Step 11 — Pass Gate + Next-Pass Analysis

**11a — Plateau Assessment:**

```
PASS [N] DELTA ASSESSMENT
  This pass gain:       +[X.X] pts
  Meaningful threshold: ≥2.0 pts
  Assessment:           MEANINGFUL ✓ | THIN ✗
  Consecutive thin:     [N]
  Session pass deltas:  P1 +[X] | P2 +[X] | ...
```

Update session state: delta ≥2.0 → `Consecutive thin: 0`. Delta <2.0 → increment. At 2 → `Plateau: YES`.

**If Plateau = YES:**

```
🛑 PLATEAU DETECTED
  Pass [N-1] gain: +[X] pts (thin)
  Pass [N] gain:   +[X] pts (thin)
  Two consecutive passes below the 2.0 pt meaningful threshold.
  The skill has reached a local ceiling under the current rubric and approach.
  Best committed version: [score] / 100.

  Recommendation: STOP HERE.

  To override: "force another pass" — overrides once, then re-evaluates
  To reset:    "first principles reset" — rebuild dimension registry from core purpose
  To accept:   "done" / "stop"
═════════════════════════
```

Do NOT present "another pass" as a standard option when Plateau = YES. Require explicit override.

**11b — Pass Gate + Next-Pass Analysis (runs only if 11a finds no plateau):**

```
═══ PASS GATE ═══
Pass [N] complete.
  Score:   [before] → [after]  (+[delta] — [MEANINGFUL ✓ | THIN ✗])
  Session: [start] → [now]     (+[total] across [N] passes)
  Rubric:  v[N] applied → v[N+1] ready for next pass

NEXT-PASS ANALYSIS  (on Rubric v[N+1])
  Top gaps:
    1. [Dim]: [gap contrib] ([momentum]) — [why still has room]
    2. [Dim]: [gap contrib] ([momentum])
    3. [Dim]: [gap contrib] ([momentum])

  Resistance: [Dim] — targeted in P[N], moved +[X] only. Suggest: [deprioritize | try approach X]

  Next-pass hypotheses (pre-seeded from Roots + History + Patterns):
    H1. [Change] — [Dim] +[est delta] → +[weighted gain]  Source: [ROOT | PATTERN | NEW]
    H2. [Change] — [Dim] +[est delta] → +[weighted gain]
    H3. [Change] — [Dim] +[est delta] → +[weighted gain]

  Dim changes in v[N+1]: [none | added [X] | retired [Y]]

  Estimated delta: +[X] pts → projected [Y.Y]
  [MEANINGFUL ≥2.0 ✓ | THIN <2.0 — ⚠ second thin pass would trigger plateau stop]

RUBRIC IMPROVEMENT ROADMAP  (what it takes to close each dim's gap toward 100)
  Dim                | Now | Next achievable       | Practical ceiling | What blocks the ceiling
  ───────────────────────────────────────────────────────────────────────────────────────────────
  [Dim 1]            | X.X | X.X ([what enables it]) | X.X             | [evidence / design / test gap]
  [Dim 2]            | X.X | X.X ([what enables it]) | X.X             | [evidence / design / test gap]
  ...
  Session ceiling:   ~[X.X]  (without formal test suite — evidence constraints)
  Formal ceiling:    ~[X.X]  (with promptfoo test suite covering all documented cases)

PASS VALUE ANALYSIS  (is the next pass worth doing?)
  Projected gain:         +[X.X] pts
  Skill size:             ~[N] lines  →  ~[N] steps × ~[avg tokens/step] ≈ ~[N]k tokens/pass
  Estimated next session: ~[N]k tokens   ~[N] min
  Points per 10k tokens:  [X.X]

  Thresholds:
    HIGH VALUE    ≥1.0 pt/10k tokens  →  clear structural gaps; strong ROI — proceed
    MARGINAL      0.3–1.0 pt/10k      →  evidence-only or near-ceiling gains; weigh cost
    LOW VALUE    <0.3 pt/10k          →  diminishing returns — consider stopping

  Verdict:   [HIGH VALUE ✓ | MARGINAL — explain | LOW VALUE — stop recommended]
  Recommendation: [proceed / stop / force-another-pass]
  Note: token estimates are heuristic (~lines × avg step cost). Actual usage may vary ±30%.

UNRESOLVED FEEDBACK
  [⚠ N FAIL/PARTIAL entries in skill-feedback.md not yet addressed]
  [✓ No unresolved feedback entries]

OPTIONS
  "another pass"                   → Pass [N+1] on Rubric v[N+1]
  "keep going until [score]"       → auto-continue (plateau detection still active)
  "another pass, focus on [X]"     → Pass [N+1] reweights Rubric v[N+1] for [X] dimension
  "first principles reset"         → strip to core purpose, rebuild dimension registry from scratch
  "new idea: [change]"             → inject hypothesis into next-pass brainstorm
  "force another pass"             → override thin-pass warning and continue
  "meaningful means [X] pts"       → change thin threshold for this session
  "done" / "stop" / "looks good"  → end session, proceed to Step 12
═════════════════════════
```

**First Principles Reset** (use when plateau is confirmed or on request):

Run these substeps before returning to Step 2:

1. **State core purpose.** One sentence: "This skill exists to [single most important job]." If more than one sentence is needed, the purpose is unclear — that's the root of the plateau.
2. **List minimum dimensions.** Ask: "What 4–6 dimensions directly measure whether this skill does its core job well?" Exclude proxies and nice-to-haves.
3. **Justify each.** For each proposed dimension: "If this scored 10/10, would the skill be reliably better at its core job?" If no → drop it.
4. **Output a REGISTRY RESET block:**

```
REGISTRY RESET — v1-fp  (First Principles rebuild)
  Core purpose: "[single-sentence purpose statement]"

  Dimension          | Weight | Justification
  ─────────────────────────────────────────────────────────────────
  [Dim 1]            |  [%]   | [why this directly measures the core job]
  [Dim 2]            |  [%]   |
  ...
  Weights sum: 100% ✓

  Retired from prior registry:
    [OldDim] — [reason: measuring a proxy, not the core job]

  Note: Cross-pass score comparison paused — new registry.
        Rubric resets to v1-fp. Longitudinal tracking resumes at v2-fp.
```

Resets rubric version to v1-fp. Useful when the current rubric is plateauing because it's measuring proxies rather than the core job. Plateau detection can trigger from rubric mismatch, not because the skill can't improve.

Parse reply:
- "another pass" / "force another pass" → increment pass counter, increment rubric version, return to Step 1b (re-profile updated skill) → Step 2 (apply v[N+1] registry) → Step 3 → continue. Seed brainstorm with pre-loaded hypotheses from this step.
- "first principles reset" → rebuild registry, return to Step 2.
- "done" / "stop" → Step 12.
- "meaningful means [X]" → update thin threshold, re-evaluate current pass delta, re-output gate.

---

## Step 12 — History Log

Append to `/home/user/accent-os/skills/skill-optimizer/optimization-history.md`:

```markdown
---

## [YYYY-MM-DD] [skill-name] — Pass [N] (Session total: [P] passes)

**Skill:** [skill-name]
**Scope:** GLOBAL | PROJECT | BOTH
**Pass:** [N] | **Session passes:** [P]
**Weight profile:** [name] | **Rubric drift:** YES | NO
**Plateau triggered:** YES (after [N-1] and [N] both thin) | NO

### Score Matrix

| Dimension | Weight | Session Start | Pass End | Session Delta | Momentum |
|---|---|---|---|---|---|
[active dimensions]
| **TOTAL** | | **[start]** | **[end]** | **+[delta]** | |

**Threshold:** [T.T] | **Status:** MET ✓ | BEST AVAILABLE ✗ | PLATEAU STOP ✗

### Dimension Registry at Session End

| Dimension | Final Weight | Status | Added | Retired |
|---|---|---|---|---|
| [Dim] | [X%] | active | v[N] or "default" | — |
| [Dim] | — | retired | default | v[N] — [reason] |

### Changes Applied
1. [Change] — [Dimension] +[delta]

### What Moved Most
[Dimension] (+[delta]) — [why it moved]

### What Resisted
[Dimension] (+[delta]) — [why it resisted] — **Next session:** [deprioritize | try approach X]

### Next-Session Proposals
1. [Hypothesis] — [Dimension] +[estimated delta]

### Patterns Confirmed Effective (cross-skill reusable)
- "[Pattern]" → [Dimension] +[avg delta] — applies to: [skill types]

### Prediction Calibration
- Session accuracy: [N/M]   [calibration note for future estimates]

**Branch:** [branch] | **Commits:** [SHA list]
```

Output: `HISTORY LOGGED — [skill-name] Pass [N] appended to optimization-history.md`

---

## AccentOS context

- Stack: Claude API (Anthropic), file system, git
- Project: AccentOS / Accent Lighting
- Skill root: /home/user/accent-os/skills/
- Skill registry: /home/user/accent-os/skills/_index.md
- Rubric guidance: /home/user/accent-os/skills/skill-optimizer/references/rubric-weights.md
- Optimization history: /home/user/accent-os/skills/skill-optimizer/optimization-history.md
- Skill feedback queue: /home/user/accent-os/skills/skill-feedback.md
- Gotcha log: /home/user/accent-os/skills/skill-forge/gotcha-log.md

**Profile guidance by AccentOS skill type:**
- **BC sync / inventory skill** (store-cwqiwcjxes) → efficiency-heavy profile — runs frequently; token cost matters; correctness failures are caught downstream by BC itself
- **Supabase query / data skill** (hsyjcrrazrzqngwkqsqa) → accuracy-heavy — wrong data silently corrupts AccentOS operations; correctness is the primary deliverable
- **Klaviyo / GMC integration skill** → accuracy-heavy + trigger-focused — routing precision and data field mapping are both critical; errors reach customers
- **Claude API / inference skill** → balanced or output-heavy — response quality is the primary deliverable; latency is secondary
- **Meta / workflow skill** (like this one) → balanced — all dimensions matter roughly equally; AccentOS Fit ceiling is ~6-7 by design

---

## Anti-patterns

- **Never** start the brainstorm loop without a baseline score — delta estimates are meaningless without an anchor.
- **Never** skip the Step 6 plan gate — no file is edited before Michael approves the plan.
- **Never** exceed 5 brainstorm loops per pass or 3 refinement passes — caps are hard.
- **Never** score a skill from memory or a summary — read the actual SKILL.md first (Step 1b).
- **Never** revert committed changes when threshold isn't met — push best version found and flag the gap.
- **Never** use this skill to build a new skill — use skill-forge for blank-slate builds.
- **Never** claim the threshold is met without running the Step 8 scored matrix test — estimated scores are estimates, not facts.
- **Never** push to main without explicit permission — branch first.
- **Never** target low gap-contribution dimensions first in brainstorm loops — always sort by gap contribution and address the top-2 each loop.
- **Never** re-attempt a change in the already-tried list — it was applied or rejected; retrying wastes a loop.
- **Never** skip Step 12 history log — every session end must append to optimization-history.md, even if threshold was not met.
- **Never** auto-continue more than 3 passes without re-confirming with Michael — unattended loops without a cap produce diminishing-return noise.
- **Never** compare before/after scores across rubric versions without re-expressing prior passes on the new weights — silent rubric drift makes longitudinal comparisons meaningless.
- **Never** ignore FAIL/PARTIAL entries in skill-feedback.md for the target skill — real-world failures outrank estimated-delta hypotheses and must be addressed first or explicitly deferred.
- **Never** close a session with unresolved skill-feedback entries without flagging them in the pass gate.
- **Never** continue past 2 consecutive thin passes without explicit "force another pass" — plateau detection prevents marginal noise changes.
- **Never** fix the rubric at exactly 7 dimensions — dimensions are variable; add, retire, or rename when score evidence warrants it.
- **Never** skip the Red Team pass after assembling the brainstorm plan — one unchallenged assumption can invalidate an entire plan.
- **Never** ignore Socratic root causes from Step 3 — each root cause must appear as a brainstorm hypothesis target in Step 5 or be explicitly deferred with a stated reason.
- **Never** run Step 8 score test on a different rubric than Step 3 baseline — rubric evolution happens in Step 9, AFTER score test, not before.
- **Never** use First Principles reset mid-pass — only between passes (Step 11 option) or at confirmed plateau; resetting mid-pass discards baseline comparability.
- **Never** skip the Perspective Sweep in the final brainstorm loop — it is the mechanism for surfacing hypotheses that single-lens reasoning misses; bypassing it produces plans with preventable blind spots.
- **Never** deploy all 6 perspectives at every trigger point — use only the recommended subset per step (see Perspective Sweep Framework); over-sweeping adds noise without incremental insight.
- **Never** score a dimension above 7.5 without citing specific evidence from the SKILL.md — "it has output blocks" is not evidence; quote the specific section that earns the score.
- **Never** score a dimension above 8.0 without running the Contrarian + Methodologist Perspective Sweep and resolving all objections; if either raises an unresolvable objection, cap the score at 8.0.
- **Never** report a total score above 90 without formal validation (passing promptfoo test suite or 3+ documented real sessions showing correct behavior); label as **PROVISIONAL** if citing informal evidence only — provisional scores do not count toward threshold.

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
  Options:   "another pass" → continue | "done" → accept best available
  → Logged to skills/skill-feedback.md
```
