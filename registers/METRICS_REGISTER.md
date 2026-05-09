# METRICS REGISTER

## Purpose
Canonical metric definitions, formulas, units, thresholds, and escalation rules. The
runtime loop computes these at every checkpoint and writes the values into the delta
report.

## Required Sections per Metric
1. **id** — short slug.
2. **definition** — one sentence, operational.
3. **formula** — explicit, computable from artifacts in the repo.
4. **unit** — dimensionless / count / days / ratio.
5. **window** — checkpoint / cycle / rolling-N-cycles.
6. **threshold** — green / amber / red bands.
7. **on-red** — escalation trigger reference (E#).
8. **source** — files/scripts the value is derived from.

## Update Rules
- Adding a metric: C5 governance edit.
- Recording a value: C1 append to `registers/metric-values.log` (created at P3).
- A metric without a defined `source` may not be referenced in policies.

## Compression Standards
- Each metric ≤ 12 lines.
- Formulas are written as plain expressions, not pseudocode paragraphs.

## Catalog (v0.1)

### M1 — Reliability Compounding Index (RCI)
```
definition:  Ratio of stability gain to complexity gain per cycle.
formula:     RCI = (reliability_velocity / max(complexity_velocity, ε)) × (1 - clamp(entropy_delta, 0, 1))
unit:        dimensionless
window:      cycle (rolling 1)
threshold:   green ≥ 1.2 ; amber 0.8–1.2 ; red < 0.8
on-red:      E2 (RCI < 1.0 across two consecutive checkpoints)
source:      M2, M3, M4
```

### M2 — Reliability Velocity
```
definition:  Net reduction in open HIGH+ risks + closed-recurring gotchas, per cycle.
formula:     rel_v = closed_high_risks + closed_recurring_gotchas - opened_high_risks
unit:        count / cycle
window:      cycle
threshold:   green > 0 ; amber = 0 ; red < 0
on-red:      E1 (when paired with HIGH risk open)
source:      ACTIVE_RISKS history, GOTCHA observations log
```

### M3 — Complexity Velocity
```
definition:  Net new structural complexity per cycle.
formula:     cmp_v = Δ(file_count) + Δ(top_level_dirs)×3 + Δ(LoC_in_root_app_files)/500
unit:        composite count / cycle
window:      cycle
threshold:   green ≤ 5 ; amber 5–15 ; red > 15
on-red:      throttle to Safe Auto-Fix only until next cycle
source:      git diff --stat between checkpoint commits
```

### M4 — Entropy Delta
```
definition:  Disorder change: stale items, untriaged register entries, governance lag.
formula:     entropy_delta = (stale_canonical + untriaged_register + aged_DER) / baseline_total
unit:        ratio (0–1; clamped)
window:      checkpoint
threshold:   green ≤ 0.05 ; amber 0.05–0.15 ; red > 0.15
on-red:      Clean Pause forced next cycle
source:      runtime-state, audits, evolution-memory
```

### M5 — Governance Lag
```
definition:  Days since the oldest unrouted DER intake or unresolved escalation.
formula:     gov_lag = max(today - oldest_unrouted_idea_date, today - oldest_open_escalation_date, 0)
unit:        days
window:      checkpoint
threshold:   green ≤ 3 ; amber 4–7 ; red > 7
on-red:      E3
source:      DEFERRED_EVOLUTION_QUEUE timestamps, AUDIT_LOG escalations
```

### M6 — Mutation Risk
```
definition:  Estimated per-patch risk score (used in patch plans).
formula:     mut_risk = w1·class + w2·blast_radius + w3·reversibility_inv + w4·security_flag
             where class ∈ {C1=1..C6=6}, blast_radius = files_touched, reversibility_inv = 1/lines_to_revert, security_flag ∈ {0,1}
unit:        composite (0–10)
window:      per-patch
threshold:   green ≤ 3 ; amber 3–6 ; red > 6
on-red:      Plan-Then-Execute required regardless of class
source:      patch plan declared values
```

### M7 — Recovery Confidence
```
definition:  How confidently the LKG procedure restores a working system.
formula:     rec_conf = lkg_age_days_factor × verified_evidence_factor × deploy_path_factor
             each factor ∈ [0,1]; product ∈ [0,1]
unit:        ratio
window:      checkpoint
threshold:   green ≥ 0.7 ; amber 0.4–0.7 ; red < 0.4
on-red:      block all C4+ until rec_conf ≥ 0.7 (force a Clean Pause LKG bump)
source:      LAST_KNOWN_GOOD_STATE.md fields
```

### M8 — Architecture Drift
```
definition:  Count of new top-level dirs / cross-module edges added without a C6 patch plan.
formula:     arch_drift = unsanctioned_new_top_dirs + unsanctioned_cross_module_edges
unit:        count / cycle
window:      cycle
threshold:   green = 0 ; amber 1 ; red ≥ 2
on-red:      E6
source:      git log --diff-filter=A -- ':!*.md' compared to ROLLOUT_PLAN
```

### M9 — Stabilization Ratio
```
definition:  Share of merged patches in cycle that are stabilization (vs. feature).
formula:     stab_ratio = stabilization_patches / max(total_patches, 1)
unit:        ratio
window:      cycle
threshold:   green 0.2–0.5 ; amber <0.2 or 0.5–0.8 ; red >0.8 or =0
on-red:      red-low (=0): runaway features → Clean Pause
              red-high (>0.8): runaway stabilization → reassess CURRENT_PRIORITIES
source:      delta entries' Mutation section
```

### M10 — Context Pollution
```
definition:  Forbidden-content occurrences in canonical files.
formula:     ctx_poll = grep_count("might|could|future:|TODO|FIXME", runtime-state/*)
unit:        count
window:      checkpoint
threshold:   green = 0 ; amber 1–3 ; red ≥ 4
on-red:      E7
source:      grep over runtime-state/
```

### M11 — Orchestration Load
```
definition:  Depth and breadth of agent/tool chains per session.
formula:     orch_load = max_chain_depth × distinct_tools_invoked
unit:        composite
window:      session
threshold:   green ≤ 12 ; amber 13–25 ; red > 25
on-red:      reduce delegation; consider direct work
source:      SESSION_LOG agent/tool invocation summaries (when emitted; pre-P2: manual)
```

## Composite Health
```
runtime_health = clamp( RCI × (1 - normalized(gov_lag)) × rec_conf , 0, 1 )
where normalized(gov_lag) = min(gov_lag / 14, 1)
green ≥ 0.7 ; amber 0.5–0.7 ; red < 0.5
```

## Bootstrap (v0.1)
- Definitions are canonical at v0.1. Computation begins at P3 once CHECKPOINT_LOOP is
  active. Until then, metrics may be hand-recorded in delta entries when relevant.
