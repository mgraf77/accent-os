# GOVERNANCE COMPRESSION REVIEW

> Audit-only. Identifies merge / redundancy / over-granularity candidates.
> NO MERGES are performed at P1 unless extremely obvious.
> tag: CORE

## Method
Walk every governance + runtime-loop file in the P0 layer. For each, classify as:
- **KEEP** — distinct, load-bearing, used independently.
- **MERGE-CANDIDATE** — overlaps another file's purpose; could fold without information loss.
- **GRANULARITY-REVIEW** — too detailed for current operator scale.
- **REDUNDANT** — duplicated content; remove on next pass.

## File-by-File

### governance/MUTATION_POLICY.md — KEEP
Canonical class table. Load-bearing. No merge.

### governance/AUTO_FIX_POLICY.md — KEEP (but disabled at P1)
Distinct allowlist semantics. Stays separate so it can be activated atomically at P3.

### governance/ESCALATION_POLICY.md — KEEP
Distinct trigger semantics (E1–E10). Load-bearing.

### governance/SAFETY_HARD_STOPS.md — KEEP
Non-negotiable refusals. Must stay isolated from soft policies.

### stable-evolution-runtime/STABLE_EVOLUTION_RUNTIME.md — KEEP
The loop spec. Single canonical place.

### loops/AUDIT_LOOP.md — KEEP
### loops/GAP_DETECTION_LOOP.md — GRANULARITY-REVIEW
  rationale: at P1 the gap detector is run by humans/AI manually; the loop file is
             half a page. Consider folding into AUDIT_LOOP.md at P3 once both are
             automated, OR keep separate to ease automation. **Defer decision.**
### loops/PATCH_LOOP.md — KEEP
### loops/CHECKPOINT_LOOP.md — KEEP
  Patch + Checkpoint stay separate because they have different failure semantics.

### audits/CONTINUOUS_GAP_ANALYSIS_RUNTIME.md — KEEP
Specifies the report; orthogonal to loop spec.

### audits/GOTCHA_REGISTER.md — KEEP
Catalog. Cannot be merged.

### registers/METRICS_REGISTER.md — KEEP, but compress active set
  rationale: 11 metrics defined; only 4 are operationally meaningful at P1
             (RCI, governance_lag, recovery_confidence, runtime_health).
             Recommendation: tag the other 7 as `compute_phase: P3+` so the file is
             organized by activation phase. **No deletion.** Tagging only.

### policies/MODES.md — GRANULARITY-REVIEW
  rationale: 7 modes. At P1 only 4 are usable (Passive Audit, Plan-Then-Execute,
             Clean Pause Stabilization, Emergency Recovery — and the last is dormant).
             Gotcha Detection is operationally a *sub-output* of Passive Audit.
             Deferred / Research / Escalation is *what Passive Audit produces*.
             Recommendation: keep all 7 named (extract value already created), but
             explicitly mark which are **active** vs **defined-but-dormant** at P1.
             **Do not merge.** Add an "Active at P1" header column.

### policies/ROLLOUT_PLAN.md — KEEP

### Templates
All 6 templates are distinct and used at different lifecycle points. KEEP.

## Merge Candidates Considered, REJECTED at P1
- AUDIT_LOOP + GAP_DETECTION_LOOP → too coupled to merge prematurely; preserve
  refactor optionality.
- MUTATION_POLICY + AUTO_FIX_POLICY → Auto-Fix is a strict subset operationally, but
  splitting keeps the allowlist obviously narrow. Merging would camouflage scope.
- ESCALATION_POLICY + SAFETY_HARD_STOPS → blast radii differ. Keep separate.

## Recommended P1 Changes (this commit)
1. Add **"Active at P1"** annotation to MODES.md (done in P1_SIMPLIFICATION_PASS).
2. Add **`compute_phase`** annotation to METRICS_REGISTER (deferred to a future minor
   patch — out of P1 scope; tracked as der-0006).
3. No deletions, no merges this commit.

## Q3 Research Items Created
- der-0004 — governance file consolidation candidates (this review's findings).
- der-0005 — mode count reduction proposal (7 → 5 active, post-P3).
- der-0006 — metric phase-tagging in METRICS_REGISTER.
- der-0007 — gap loop / audit loop merge evaluation (post-P3).

## Anti-Pattern Watch
Resist the urge to compress prematurely. The P0 surface area is **specifications**, not
**runtime cost**. Specs that are never executed cost nothing at runtime; merging them
just to feel smaller would lose optionality at P3.

The risk surfaced in ACTIVE_RISKS.md as R5 (governance-overhead-for-solo) is real but
applies to *operational reading frequency*, not *file count*. The mitigation is the
short read-order list in STABILIZATION_LAYER.md §"Read Order for a Fresh AI Session"
(≤4k tokens warm-start), not file deletion.
