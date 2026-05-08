# DDV Evaluator — Integration Guide

How to wire the DDV Evaluator into the AccentOS Optimization Skill pipeline and other systems.

---

## 1. Integration Architecture

The DDV Evaluator sits between any optimization pass and the next decision point.

```
┌─────────────────────┐
│   Artifact (skill,  │
│   prompt, workflow) │
└─────────┬───────────┘
          │ (before)
          ▼
┌─────────────────────┐
│  Optimization Pass  │ ← skill-forge Ralph loop, codex-review, manual refactor
│  (Ralph loop, etc.) │
└─────────┬───────────┘
          │ (after)
          ▼
┌─────────────────────┐
│   DDV Evaluator     │ ← scores the transition, generates recommendation
└─────────┬───────────┘
          │
          ▼
┌─────────────────────────────────────────────────────┐
│              Decision Branch                         │
│                                                      │
│  CONTINUE → next optimization pass                   │
│  PROMOTE  → add to _index.md as core skill           │
│  SIMPLIFY → targeted complexity reduction pass       │
│  PAUSE    → move to low-priority queue               │
│  REWRITE  → flag in BUILD_PLAN_CLAUDE.md             │
│  ROLL_BACK→ git revert + root-cause analysis         │
└─────────────────────────────────────────────────────┘
```

---

## 2. skill-forge Integration

The skill-forge Ralph loop (Step 8) is the primary auto-trigger context.

### When to call DDV

Call DDV after every Ralph loop pass that modifies the artifact. Do not call DDV for documentation-only changes.

### What to pass in

After a Ralph loop pass completes, construct the EvaluationInput from:

```
target_name:    skill name from SKILL.md frontmatter
target_type:    SKILL
target_path:    skills/[name]/
baseline_state: the state before this Ralph pass (from gotcha-log entry or git diff summary)
result_state:   the current SKILL.md + any updated references
cost_signals:
  tool_calls:             count of tool calls made during this pass
  retries:                count of failed attempts
  human_interventions:    count of Michael redirects during this pass
  complexity_added:       estimate based on lines added / abstraction layers introduced
prior_evaluation: most recent ddv-log.md entry for this skill (null if first)
```

### Ralph loop exit condition

The Ralph loop should exit when DDV produces any of:
- PROMOTE_TO_CORE
- LOW_RETURN_AREA (with result_score ≥ 80)
- PAUSE
- ROLL_BACK
- DEPRECATE
- REWRITE
- REQUIRES_HUMAN_REVIEW

Continue the loop only on:
- CONTINUE_OPTIMIZING
- HIGH_PRIORITY_OPTIMIZATION
- SIMPLIFY (run a simplification pass then re-evaluate)

### skill-forge SKILL.md amendment

Add this step to skill-forge's Step 8 (Ralph loop):

```
After each Ralph pass that modifies the target skill:
1. Run DDV Evaluator on the modified skill
2. If recommendation = CONTINUE_OPTIMIZING → run next Ralph pass
3. If recommendation = SIMPLIFY → run a targeted simplification pass first, then DDV again
4. If recommendation = PROMOTE_TO_CORE → register in _index.md, stop loop
5. All other recommendations → surface to Michael before continuing
```

---

## 3. efficiency-monitor Integration

efficiency-monitor tracks session-level inefficiency patterns. DDV tracks artifact-level optimization trajectory. They integrate at session end.

### What efficiency-monitor sends to DDV

When efficiency-monitor detects a PROMOTE candidate (a pattern repeated 3+ times that should become a skill):

```
target_name:    [pattern name]
target_type:    WORKFLOW
baseline_state: description of the manual multi-step pattern
result_state:   proposed skill design (from efficiency-monitor's PROMOTE entry)
cost_signals:
  human_interventions: count of times Michael directed this pattern
```

DDV scores the proposed skill design and returns whether it's worth skill-forge'ing.

### What DDV sends to efficiency-monitor

After evaluating any skill, if optimization_potential > 7:

```
Append to efficiency-monitor's skill-candidates.md:
  pattern: [skill name] is a HIGH_PRIORITY_OPTIMIZATION candidate
  signal: DDV velocity=[V], optimization_potential=[O]/10
  action: run targeted optimization pass on [skill name]
```

---

## 4. codex-review Integration

codex-review produces a list of suggested changes. DDV evaluates whether those changes collectively improve the artifact.

### Flow

```
1. codex-review runs on a skill → produces change list
2. Changes are applied
3. DDV evaluates before/after
4. If DDV says ROLL_BACK → revert codex changes
5. If DDV says SIMPLIFY → apply only the simplification-related changes from codex
6. If DDV says CONTINUE_OPTIMIZING → apply all codex changes and run another pass
```

### Passing cost signals

For codex-review passes, set cost signals as:

```
tokens_consumed:      [actual tokens from the codex-review run]
tool_calls:           [tool calls during codex pass]
complexity_added:     [estimated from codex diff: +1 per new abstraction layer, -1 per removed one]
```

---

## 5. Manual Evaluation (No Pipeline)

For ad-hoc evaluation without an automation pipeline:

**Michael invokes:**
```
evaluate skill: [skill name]
```
or
```
DDV check on [description of what we just did]
```

**DDV Evaluator:**
1. Reads the target artifact directly from disk
2. Reads the most recent log entry for this target from ddv-log.md (for prior velocity)
3. Prompts Michael for any missing cost signals it cannot infer from context
4. Produces the full report
5. Logs the entry to ddv-log.md

**Michael input format for cost signals (if needed):**
```
Time spent: [N minutes]
Token estimate: [rough estimate]
Retries: [count]
Michael interventions: [count]
```

---

## 6. Logging Integration

Every DDV evaluation appends to `/home/user/accent-os/meta-evaluations/ddv-log.md`.

This log is the calibration data source for all future evaluations of the same target. It must never be deleted or reformatted.

### Log reads

At the start of any evaluation, read the last 3 entries for the target from ddv-log.md to compute:
- prior_velocity (for acceleration calculation)
- optimization_count (for ROI formula)
- trend data (for trajectory narrative)

### Log writes

Append immediately after generating the report. Format per output-template.md abbreviated section.

---

## 7. Future Pipeline Integration Points

These hooks are designed in but not yet active. They will activate as the ecosystem matures.

### Supabase telemetry (future)

When AccentOS gains telemetry logging to Supabase, DDV will ingest:
- actual token costs from API logs
- actual elapsed time from session records
- tool call counts from execution logs

This will replace estimated cost signals with measured ones and raise confidence from ~65% to ~85%.

### Automated promotion (future)

When DDV produces PROMOTE_TO_CORE with confidence ≥ 80%:
- Auto-update `skills/_index.md`
- Auto-update the skill's SKILL.md frontmatter with `promoted: true` and `promoted_date`
- Auto-notify Michael via session-start boot message

### Cross-skill benchmarking (future)

When 20+ skills have DDV evaluation history, enable:
- Percentile rankings (this skill is in the 73rd percentile for velocity)
- Cohort comparisons (this skill vs. all data-query skills)
- Ecosystem health dashboard in bc-business-review or Daily Brief

---

## 8. Integration Anti-patterns

- **Do not run DDV on every commit.** Only on optimization passes that make meaningful behavioral changes. Documentation fixes don't warrant an evaluation.
- **Do not use DDV to justify avoiding optimization.** A LOW_RETURN_AREA recommendation means "don't optimize this right now" — not "this skill is fine and never needs work."
- **Do not chain more than 5 consecutive Ralph passes without a DDV check.** Unbounded optimization loops without measurement are how complexity creep happens.
- **Do not skip logging.** The ddv-log.md is the memory. An evaluation without a log entry is an evaluation that never happened from the next session's perspective.
