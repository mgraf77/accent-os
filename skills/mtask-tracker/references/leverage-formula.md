# Leverage Formula — mtask-tracker

> One-line purpose: Documents the leverage scoring formula used by `mtask-tracker` Step 3 + 4 so Michael can audit any ranking decision and so future tuning is traceable.

## The formula

For every open M-task `M[NN]` that gates one or more skills:

```
direct_unblock_count = count of skills where M[NN] is a hard_blocker
soft_assist_count    = count of skills where M[NN] is a soft_blocker

avg_skill_score      = mean(gap_optimizer composite score of unblocked skills)
                       (fall back to 30.0 if scores absent — this is the median of
                        the gap-run-002 candidate-queue.md composite distribution)

leverage_raw         = (direct_unblock_count × avg_skill_score)
                     + (soft_assist_count × 0.25 × avg_skill_score)

leverage_with_cascade = leverage_raw + (1-hop cascade contributions)
```

## 1-hop cascade rule

If skill A is unblocked by closing M[NN], and skill A is a hard upstream dependency of skill B (executor pattern: action-queue is upstream of bc-rest-bridge's update_bc_product executor), then closing M[NN] is credited 0.5 × B's gap-optimizer composite score additionally.

**Cap:** one hop only. No transitive cascade beyond the first dependency layer. This prevents leverage explosion when many skills compose through a single hub (action-queue would otherwise dominate every M-task's score).

**Source for cascade edges:** `skills/action-queue/references/executor-registry.md` — every executor entry names the action-queue action_type and the skill that handles it. Cross-reference this registry to find 1-hop edges.

**Failure path — registry missing:** If `executor-registry.md` is unreadable, set `cascade_contributions = 0` and surface "executor-registry.md absent — cascade column zeroed; leverage may underrepresent action-queue-dependent skills" in BLOCK 0 of the output.

## Recommendation thresholds

| Recommendation | Trigger | Examples |
|---|---|---|
| **DO NEXT** | leverage > 50 AND no upstream dep AND effort ≤ 60 min Michael time | M04 (BC creds, ~30 min, unblocks 2 skills + cascade) |
| **DO SOON** | leverage 20–50 OR small upstream dep (1 dep, also DO NEXT) | M10 (depends on M03; unblocks windward-bridge alongside M03) |
| **HOLD** | leverage < 20 OR external blocker not in Michael's control | M03 if Windward rep hasn't replied in 2+ weeks |
| **DEPENDENT** | M-task is itself blocked on another open M-task | M10 (deps M03), M31 (deps M04) |

## Why this formula vs. alternatives

**Why multiplicative count × score** (instead of additive)?
The composite-queue scoring rubric (`skills/gap-optimizer/references/scoring-rubric.md`) already uses multiplicative formula `(I × F × B) ÷ C`. Mirroring that here keeps the leverage rank intuitively aligned with gap-optimizer rank — Michael is already calibrated against the multiplicative shape.

**Why 0.25 weight for soft blockers**?
Soft blockers don't gate the skill; they're "noted but not refused." Empirically (trade-vendor-portal soft list: M09/M10/M12/M18), closing a soft blocker improves skill quality but doesn't activate it. 0.25 reflects the partial-improvement signal without overwhelming the hard-blocker tier.

**Why 0.5 cascade weight** (not 1.0)?
A 1-hop cascade is a real but indirect effect — closing M42 (action_queue schema) activates action-queue, which makes bc-rest-bridge's *executor path* live, but bc-rest-bridge itself is still M04-blocked. Half-credit captures the partial-activation signal.

**Why fall back to 30.0** when gap-optimizer scores are absent?
Median of run-002 candidate scores: `[60, 45, 45, 22.5, 18, 12, 7.5, 7.5]` — sorted gives 22.5 below mid, 30.0 at typical mid-tier. Using a constant fallback (rather than 0.0) prevents scoreless M-tasks from collapsing to count-only ranking that loses cross-rank comparability.

## Worked example — M04 today

Given current state (2026-05-08):
- Hard blockers: bc-rest-bridge, trade-vendor-portal (Trade portal subset)
- Soft blockers: (none recorded for M04)
- gap-optimizer composite scores for unblocked skills:
  - bc-rest-bridge → not in run-002 queue (already shipped); fall back 30.0
  - trade-vendor-portal → not in queue; fall back 30.0
- avg_skill_score = (30.0 + 30.0) / 2 = 30.0

```
direct_unblock_count = 2
soft_assist_count    = 0
leverage_raw         = (2 × 30.0) + (0 × 0.25 × 30.0) = 60.0
```

1-hop cascade — closing M04 activates bc-rest-bridge, which is an executor for action-queue's `update_bc_product` action_type. So action-queue's executor surface gets partial activation.

- action-queue composite score: 30.0 (fallback)
- cascade_contribution = 0.5 × 30.0 = 15.0

```
leverage_with_cascade = 60.0 + 15.0 = 75.0
```

Threshold check: leverage 75.0 > 50, effort ~30 min Michael time, no upstream dep → **DO NEXT**.

## Tuning knobs

If Michael wants to retune the formula (e.g. soft-blocker weight should be 0.4, not 0.25):

1. Edit the constants in this file.
2. Re-run `/mtask` — leverage column recomputes from the new constants.
3. The formula is intentionally simple (no ML, no optimizer learning) — every constant is auditable and editable here.

The formula does NOT auto-tune. mtask-tracker is a deterministic ranker; rank changes if either the formula constants change OR the input set (BUILD_PLAN_MICHAEL.md / candidate-queue.md / SKILL.md gates) changes. No hidden state.
