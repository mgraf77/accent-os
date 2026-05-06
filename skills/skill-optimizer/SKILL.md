---
name: skill-optimizer
description: >
  Systematically upgrades any existing AccentOS skill or code file using a
  nine-phase loop: score the current version against a dynamic weighted rubric
  (output quality, methodology fitness, trigger coverage, accuracy,
  speed/efficiency, AccentOS fit, anti-pattern compliance), calibrate weights
  to match desired outcomes (accuracy-heavy, output-heavy, trigger-focused,
  custom), set a target threshold (default +15 pts or user-specified as "+10%",
  "minimum 85", "add ability to X"), run Ralph-loop brainstorm sessions
  (cap: 5) targeting highest gap-contribution dimensions first until a plan
  can hit the threshold, gate on Michael's approval, execute the approved
  changes, and verify with a real scored matrix test. If the threshold is not
  met after 3 refinement passes, the highest-scored version is committed and
  flagged. Ends with a full optimization breakdown and updated how-to-use
  instructions for the improved skill.
  Use this skill when Michael says: "optimize [skill]", "tune [skill]",
  "make [skill] better", "level up [skill]", "score this skill",
  "skill optimizer", "run skill optimizer on [skill]", "upgrade [skill]",
  "squeeze more out of [skill]", "what's wrong with [skill]",
  "tighten up [skill]", "batch optimize", "optimize all skills",
  or any phrasing that asks to systematically improve an existing AccentOS skill.
  Do not use to build a new skill from scratch (use skill-forge) or to
  run automated test suites (use skill-eval-suite). Always edits files
  and produces a scored report — never stops at advice-only output.
---

# skill-optimizer

**Purpose:** Score any AccentOS skill against a dynamic weighted rubric, calibrate weights to match desired outcomes, brainstorm targeted improvements in Ralph loops (gap-contribution-aware) until a plan can clear the threshold, gate on Michael's approval, execute, and verify with a scored matrix test before shipping the final breakdown.

Nine phases in order: **preflight → profile → score → weight-calibration → threshold → brainstorm-loop → plan-gate → execute → score-test → report**. The weight calibration, plan gate, and score test are non-negotiable checkpoints — nothing executes without approval and nothing ships without a verified score.

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

**Do NOT trigger for:**
- Building a new skill from scratch → use skill-forge
- Automated promptfoo regression tests → use skill-eval-suite
- One-line typo or label fix → use Edit directly

---

## Step 0 — Preflight

Do in parallel:

1. **Identify target.** Accept: skill name (`vibe-speak`), path (`skills/vibe-speak/SKILL.md`), or description ("the vendor cascade skill"). If ambiguous, pick the highest-likelihood match given context — do not ask.
2. **Detect scope.** Check both locations:
   - Global: `~/.claude/skills/[skill-name]/SKILL.md`
   - Project: `/home/user/accent-os/skills/[skill-name]/SKILL.md`
   - Found in both → **scope = BOTH** (optimize both; universal changes apply to both, project-specific to project only)
   - Found only in `~/.claude/skills/` → **scope = GLOBAL**
   - Found only in project → **scope = PROJECT**
   - Found in neither → "Skill not found" + list candidates from both locations, then stop.
3. **Record branch.** `git -C /home/user/accent-os branch --show-current`. If on main, Step 6 will create `claude/optimize-[skill-name]-[8-char-rand]` before committing.
4. **Check recent history.** `git -C /home/user/accent-os log --oneline -5 -- skills/[skill-name]/` — note whether skill has been recently modified.

Output: one-line preflight block: target path(s), scope (GLOBAL/PROJECT/BOTH), branch, last-touch commit.

---

## Step 1 — Profile Current

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

## Step 2 — Score Current

Score the current skill against the weighted rubric. See `references/rubric-weights.md` for scoring guidance per dimension.

| Dimension | Weight | Raw (0–10) | Weighted | Gap Contribution | Evidence |
|---|---|---|---|---|---|
| **Output Quality** | 25% | | | (10−raw)×0.25 | Each step names a concrete output; output blocks defined |
| **Methodology Fitness** | 20% | | | (10−raw)×0.20 | Steps ordered, non-overlapping, imperative-voiced |
| **Trigger Coverage** | 15% | | | (10−raw)×0.15 | ≥4 triggers; match Michael's actual phrasing vs. hypothetical |
| **Accuracy** | 15% | | | (10−raw)×0.15 | Constraints, edge cases, and validation explicitly handled |
| **Speed / Efficiency** | 10% | | | (10−raw)×0.10 | No unnecessary loops, redundant context reads, or token waste |
| **AccentOS Fit** | 10% | | | (10−raw)×0.10 | ≥3 AccentOS-stack substitutions; correct paths and stack names |
| **Anti-pattern Compliance** | 5% | | | (10−raw)×0.05 | ≥3 anti-patterns; specific and enforceable |

**Baseline Score** = Σ (Weight × Raw / 10) × 100. Range: 0–100.

**Gap Contribution** = (10 − raw) × weight for each dimension. Higher gap contribution = higher improvement potential per unit of effort. This drives Step 2.5 calibration and Step 4 brainstorm targeting.

**BOTH scope note:** If scope is BOTH, score the project version as primary. Note any divergence between global and project versions — divergence in anti-patterns, triggers, or AccentOS Fit counts as an Accuracy penalty.

Output below the table:
```
BASELINE: [X.X / 100]
Scoring notes:
  - [Strongest dimension and why]
  - [Weakest dimension and why]
  - [2–3 additional observations — what's crisp, what's vague, what's missing]

Gap contribution ranking (highest → lowest):
  1. [Dimension]: [gap contribution value] — [one sentence on why this has room]
  2. [Dimension]: [gap contribution value]
  3. [Dimension]: [gap contribution value]
  ...
```

---

## Step 2.5 — Weight Calibration (Dynamic Scoring Matrix)

Adjust rubric weights to match the desired outcome profile before setting the threshold. This runs once per optimization session.

**Default profile (balanced):** Use the weights in Step 2 as-is. Skip this step if Michael gives no weight override.

**Built-in profiles:**

| Profile | When to use | Weight adjustments |
|---|---|---|
| **balanced** | Default | No change — use Step 2 weights as-is |
| **accuracy-heavy** | Critical logic / data correctness skills | Accuracy → 30%, Output Quality → 20%, Speed → 5% |
| **output-heavy** | Report / artifact generation skills | Output Quality → 35%, Methodology → 20%, AccentOS Fit → 5% |
| **trigger-focused** | Trigger recognition / routing skills | Trigger Coverage → 30%, Accuracy → 20%, Anti-pattern → 5% |
| **efficiency-heavy** | High-frequency / token-sensitive skills | Speed/Efficiency → 25%, Methodology → 25%, Anti-pattern → 5% |

**Custom weight overrides (any of these):**
- `"accuracy is critical"` → apply accuracy-heavy profile
- `"output matters most"` → apply output-heavy profile
- `"focus on triggers"` → apply trigger-focused profile
- `"make it lean"` → apply efficiency-heavy profile
- `"[dimension] = [N]%"` → set that dimension's weight to N%; auto-redistribute remaining weights proportionally to sum to 100%
- `"per-dimension goals: [dim] ≥ [X]"` → record per-dimension floor targets; flag any dimension that stays below floor even if total score passes
- No override stated → use balanced (default) — do not ask

**After applying overrides:**
1. Confirm all weights sum to 100%. If not, normalize proportionally.
2. Recalculate baseline score using new weights.
3. Recalculate all gap contribution values.
4. Update the gap contribution ranking.

Output:
```
WEIGHT CALIBRATION
  Profile: [balanced | accuracy-heavy | output-heavy | trigger-focused | efficiency-heavy | custom]
  Adjusted weights: [list any changed dimensions with old → new]
  Recalculated baseline: [X.X / 100]  (was: [Y.Y])
  Updated gap contribution ranking:
    1. [Dimension]: [gap contribution]
    2. [Dimension]: [gap contribution]
    ...
  Per-dimension floor targets (if set): [list or "none"]
```

If weights are unchanged (balanced default): output one line — `WEIGHT CALIBRATION: balanced (no changes)` — and continue.

---

## Step 3 — Set Threshold

Recommend a target threshold. Apply this logic in order:

| Baseline range | Default threshold |
|---|---|
| ≥ 80 | Baseline + 10 pts (cap 95) |
| 60–79 | Baseline + 15 pts (cap 95) |
| 40–59 | Baseline + 20 pts |
| < 40 | Baseline + 25 pts (major overhaul signal) |

**Accept Michael overrides (any of these):**
- "+10%" or "+20 points" → recalculate from baseline.
- "minimum 85" → set threshold to 85 regardless of baseline.
- "add ability to [X]" → add a custom dimension with user-specified weight; auto-redistribute remaining weights to sum to 100%.
- "just fix the triggers" → set threshold to baseline + 5, scope rubric to Trigger Coverage only.
- No override stated → apply the default above.

Output:
```
THRESHOLD SET: [X.X / 100]
  Baseline: [Y.Y]  →  Target: [X.X]  (gap: [delta] pts)
  Scope: [full rubric | trigger-only | custom: [dimension]]
```

Proceed to Step 4 immediately unless Michael explicitly says to stop here.

---

## Step 4 — Brainstorm Loop (Ralph style, gap-contribution-aware)

**Goal:** Produce a consolidated plan whose estimated post-change score ≥ threshold.

**Hard cap: 5 loops.** Run them in sequence:

**Each loop:**
1. Sort dimensions by gap contribution (highest first). Target the top-2 gap-contribution dimensions this loop — hypotheses that don't address a top-2 gap dimension require explicit justification.
2. Generate 3–5 concrete improvement hypotheses. Each hypothesis must name:
   - The specific change (e.g., "Rewrite Step 3 output block as a paste-ready table")
   - The dimension it improves
   - Estimated raw-score delta (+1 / +2 / +3 only — no fractional estimates)
   - Gap contribution delta: (delta) × (dimension weight) — this is the expected weighted-score gain
3. Stack the non-overlapping hypotheses with the highest combined gap-contribution delta into a running plan.
4. Simulate the plan's total score: apply deltas to the baseline, re-weight, sum.
5. Check per-dimension floor targets (if set from Step 2.5) — flag any dimension still below floor even if total score passes.
6. **If estimated score ≥ threshold AND all floors met** → lock the plan. Output the final loop summary and proceed to Step 5.
7. **If estimated score < threshold OR any floor unmet** → log the gap, drop already-stacked hypotheses from the pool, generate 3–5 fresh hypotheses targeting the remaining highest-gap-contribution dimensions, and loop.

After each loop:
```
LOOP [N/5]: estimated [X.X] vs. threshold [Y.Y]
  Gap remaining: [Z.Z pts]
  Top gap-contribution dimensions this loop: [Dim1] ([gap contrib]), [Dim2] ([gap contrib])
  New hypotheses this loop:
    H1. [Change] — [Dimension] +[delta raw] → +[weighted gain] pts
    H2. [Change] — [Dimension] +[delta raw] → +[weighted gain] pts
    H3. [Change] — [Dimension] +[delta raw] → +[weighted gain] pts
  Running plan (cumulative):
    1. [Change]
    2. [Change]
    ...
  Floor targets: [all met | [Dimension] still at [X] < floor [Y]]
```

**If 5 loops complete and estimated score < threshold:**
- Flag: "Threshold not reachable in 5 brainstorm loops. Proceeding with best plan found."
- Continue to Step 5 with the highest-estimated plan. Actual score may fall short — Step 7 will confirm.

---

## Step 5 — Plan Gate

Present the consolidated plan. Output exactly:

```
═══ OPTIMIZATION PLAN ═══
Target skill: [skill-name]
Scope: GLOBAL | PROJECT | BOTH
  GLOBAL:  ~/.claude/skills/[skill-name]/SKILL.md
  PROJECT: /home/user/accent-os/skills/[skill-name]/SKILL.md
  BOTH:    both paths above (universal changes → both; project-specific → project only)

Baseline: [X.X / 100]  →  Estimated post-change: [Y.Y / 100]  →  Threshold: [Z.Z / 100]
Weight profile: [balanced | accuracy-heavy | ...]

Planned changes:
  1. [Change — what, where in the file, applies to: GLOBAL | PROJECT | BOTH]
  2. [Change — what, where in the file, applies to: GLOBAL | PROJECT | BOTH]
  3. [Change — ...]
  ...

Files to edit:
  [list each file path explicitly — global and/or project, references if any]

═══ AWAITING APPROVAL ═══
Reply with one of:
  "go" / "execute" / "looks good"      → apply plan as-is
  "[item N] — adjust this: [change]"   → modify that item, then execute
  "drop [item N]"                       → remove from plan, then execute
  "add [X]"                             → add this change to the plan
  "stop" / "cancel"                     → abort; no files are changed

I am stopped here. Nothing is edited until you reply.
═════════════════════════
```

Parse Michael's reply. Apply edits to the plan. Ask one targeted clarifying question only if the reply is genuinely ambiguous. Do not proceed until the plan is locked.

---

## Step 6 — Execute

Apply each approved change using the Edit tool for surgical edits. Use Write (full file rewrite) only when ≥60% of the file changes.

**Write to the correct location(s) per scope:**
- **GLOBAL**: edit `~/.claude/skills/[skill-name]/SKILL.md` — no project-specific hardcoding allowed.
- **PROJECT**: edit `/home/user/accent-os/skills/[skill-name]/SKILL.md` — AccentOS refs required.
- **BOTH**: apply universal changes to both files; apply project-specific changes to project file only. Run validation on each file independently.

After writing all changes, run validation per scope:

**PROJECT or BOTH (project file):**
1. YAML parses — `name` + `description` present; ≥250 chars; contains "AccentOS" or "Accent Lighting"; no unfilled `[bracketed]` placeholders outside fenced blocks.
2. ≥3 AccentOS-stack substitutions (AccentOS, Accent Lighting, store-cwqiwcjxes, hsyjcrrazrzqngwkqsqa, vendor scoring, GMC, BigCommerce, Supabase, /home/user/accent-os).
3. ≥3 anti-pattern entries. No prose walls.

**GLOBAL or BOTH (global file):**
1. YAML parses — `name` + `description` present; ≥250 chars; no project-specific hardcoding.
2. No AccentOS/Accent Lighting hardcoding — uses `[project-root]/`, generic language.
3. ≥3 anti-pattern entries. No prose walls.

**BOTH scope — divergence check:**
After writing both files, diff them at the structural level (step count, anti-pattern count, trigger count). Flag any unintentional divergence — universal changes must be in both.

If any validation check fails → fix in place before committing.

**Branch handling:**
- If NOT on main → commit to current branch.
- If on main → create `claude/optimize-[skill-name]-[8-char-rand]` first.

Commit message: `optimize: [skill-name] ([scope]) — [one-line summary of top change]`

---

## Step 7 — Score Matrix Test

Re-run the full rubric from Step 2 against the updated SKILL.md using the calibrated weights from Step 2.5. Produce the same table format with new scores. Output:

```
SCORE TEST RESULT
Dimension            | Weight | Before | After  | Delta | Gap Contrib (after)
Output Quality       | 25%    | [X.X]  | [Y.Y]  | [±Z]  | [remaining gap]
Methodology Fitness  | 20%    | [X.X]  | [Y.Y]  | [±Z]  | [remaining gap]
Trigger Coverage     | 15%    | [X.X]  | [Y.Y]  | [±Z]  | [remaining gap]
Accuracy             | 15%    | [X.X]  | [Y.Y]  | [±Z]  | [remaining gap]
Speed / Efficiency   | 10%    | [X.X]  | [Y.Y]  | [±Z]  | [remaining gap]
AccentOS Fit         | 10%    | [X.X]  | [Y.Y]  | [±Z]  | [remaining gap]
Anti-pattern         | 5%     | [X.X]  | [Y.Y]  | [±Z]  | [remaining gap]
─────────────────────────────────────────────────────────────────────────────
FINAL SCORE:  [X.X / 100]   Threshold: [Y.Y]   Weight profile: [name]
Floor targets: [all met ✓ | [Dimension] at [X] < floor [Y] ✗]
STATUS: PASSED ✓  |  FAILED ✗
```

**If PASSED:** proceed to Step 8 (report).

**If FAILED — refinement loop (cap: 3 passes):**

Each refinement pass:
1. Identify which dimensions still fall short of their threshold contribution AND have the highest gap contribution remaining.
2. Generate 2–3 targeted fixes for those dimensions only.
3. Apply fixes via Edit, re-run validation, re-score.
4. Output score update and status after each pass.
5. If PASSED → stop, proceed to Step 8.

**If FAILED after 3 refinement passes:**
- Output: "Threshold not met after 3 refinement passes. Pushing highest-scored version."
- Already-committed changes represent the best version found — do not revert.
- Proceed to Step 8 and flag the shortfall.

---

## Step 8 — Optimization Report

```
═══ SKILL OPTIMIZER — FINAL REPORT ═══

Skill:  [skill-name]
Scope:  GLOBAL | PROJECT | BOTH
Files:  [list all files that were edited — global and/or project]
Branch: [branch-name]   Commit: [SHA short]

SCORE SUMMARY
  Weight profile: [name]
  Baseline:   [X.X / 100]
  Final:      [Y.Y / 100]
  Threshold:  [Z.Z / 100]
  Status:     MET ✓  |  BEST AVAILABLE ✗  (gap: [delta] pts)
  Floor targets: [all met ✓ | [Dimension] at [X] < floor [Y] ✗]

WHAT CHANGED
  1. [Change title] — [one sentence: what was done + why it moved the score]
  2. [Change title] — [...]
  3. [Change title] — [...]

BIGGEST SCORE GAINS
  [Dimension]:  [before] → [after]  (+[delta])
  [Dimension]:  [before] → [after]  (+[delta])

REMAINING WEAKNESSES  (if any)
  - [Dimension]: still [X.X] — [one sentence on why this dimension resists improvement]

HOW TO USE THE OPTIMIZED SKILL
  Trigger with:   "[top trigger phrase 1]"
                  "[top trigger phrase 2]"
                  "[top trigger phrase 3]"
  Input needed:   [what to provide when invoking]
  Output shape:   [what to expect back]
  Pairs well with: [companion skills]

Brainstorm loops run: [N / 5]   Refinement passes: [M / 3]
═══════════════════════════════════════════════════════
```

---

## AccentOS context

- Stack: Claude API (Anthropic), file system, git
- Project: AccentOS / Accent Lighting
- Skill root: /home/user/accent-os/skills/ (Codespace: /workspaces/accent-os/skills/)
- Skill registry: /home/user/accent-os/skills/_index.md
- Rubric guidance: /home/user/accent-os/skills/skill-optimizer/references/rubric-weights.md
- Gotcha log: /home/user/accent-os/skills/skill-forge/gotcha-log.md (read for known edge cases on target skill)

---

## Anti-patterns

- **Never** start the brainstorm loop without a baseline score — delta estimates are meaningless without an anchor.
- **Never** skip the Step 5 plan gate — no file is edited before Michael approves the plan.
- **Never** exceed 5 brainstorm loops or 3 refinement passes — cap is hard.
- **Never** score a skill from memory or a summary — read the actual SKILL.md file first.
- **Never** revert committed changes when the threshold isn't met — push the best version found and flag the gap.
- **Never** use this skill to build a new skill — use skill-forge for blank-slate builds.
- **Never** claim the threshold is met without running the Step 7 scored matrix test — estimated scores are estimates, not facts.
- **Never** push to main without explicit permission — branch first.
- **Never** run more than one dimension's custom weight adjustment at a time without re-summing all weights to 100%.
- **Never** skip Step 2.5 weight calibration when Michael specifies a desired outcome profile — brainstorm targeting without calibrated weights misses the highest-value improvements.
- **Never** target low gap-contribution dimensions first in brainstorm loops — always sort by gap contribution and address the top-2 dimensions each loop.
