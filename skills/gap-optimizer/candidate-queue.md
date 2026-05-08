# AccentOS — Gap Candidate Queue

> Auto-rebuilt by `gap-optimizer` each run. Sorted by composite score descending.
> This file is **canonical current-state** — it is overwritten, not appended.
> For history of what's been ranked over time, see `gap-log.md`.

**Last run:** 2026-05-08 (gap-run-003)
**Branch:** `claude/accentos-gap-analysis-Dcvcf`
**HEAD:** `4a091c9`
**Vision artifacts read:** MASTER.md §14 + Appendix A, BUILD_PLAN_CLAUDE Tracks 5/6, BUILD_PLAN_MICHAEL pending M-tasks (M03/M04/M06/M09/M10/M11/M24-M40), KPI_CATALOG, _index.md (45 skills), Capability Ladder
**Current skills:** 45
**Emergent PROMOTE from efficiency-monitor:** 0 (logger has 0 sessions logged; no PROMOTE entries)
**Saturation watch:** GREEN (queue fully drained from gap-run-002)

---

═══ GAP-OPTIMIZER RUN — 2026-05-08 (gap-run-003) ═══
Branch: claude/accentos-gap-analysis-Dcvcf | HEAD: 4a091c9
Vision artifacts: 6 | Current skills: 45 | Emergent PROMOTE: 0
Total gap rows: 8 (5 seeded + 3 newly surfaced) | Scored: 8 | Top-3 surfaced below

---

## Top-3 candidate proposals

```
RANK 1: M-task-tracker
  Type: governance
  Source: BUILD_PLAN_MICHAEL.md gap (29 pending M-tasks scattered across 7 BLOCKED stub-mode skills)
  What it would do: Maps every BLOCKED-stub skill to its blocking M-task IDs, computes
    "skills unblocked per M-task" leverage rank, surfaces unblock cadence + which M-task
    closure unblocks the most downstream skills.
  Closes which gap(s): gap-run-002 surfaced this; BUILD_PLAN_MICHAEL.md L315 ("Recommended
    order from kpi-data-audit"); MASTER §13 (Open Loops & Blockers cadence)
  Score: I=3 F=4 B=5 C=1  →  composite 60.0
  Blocked by: none (pure read-only over BUILD_PLAN_MICHAEL + skills/*/SKILL.md frontmatter)
  Forge effort estimate: LOW (<2h)
```

```
RANK 2: executor-registry-validator
  Type: meta-infra
  Source: gap-run-002 wave-2 cross-skill discipline finding (klaviyo send→propose drift caught at boundary)
  What it would do: Watcher that diffs action-queue/references/executor-registry.md against
    each executor skill's actual SKILL.md contract (action_type accepted, payload shape,
    return-shape contract). Flags drift before it hits production.
  Closes which gap(s): action-queue Step 5 contract surface; gap-run-002 notes "issues only
    visible at the inter-skill boundary surface"
  Score: I=3 F=3 B=5 C=1  →  composite 45.0
  Blocked by: none
  Forge effort estimate: LOW (<2h)
```

```
RANK 3: trigger-phrase-miner
  Type: meta-infra
  Source: gap-run-002 wave-2 pass-1 pattern (PROMPT_LOG → Michael phrasings)
  What it would do: Reads PROMPT_LOG.md, clusters by topic, extracts the actual phrasings
    Michael uses, outputs a per-skill candidate trigger-phrase list. Avoids per-forge
    re-discovery of how Michael actually asks.
  Closes which gap(s): every future forge pass-1; reduces vibe-speak Step 23 false-negatives
  Score: I=3 F=3 B=5 C=1  →  composite 45.0
  Blocked by: none
  Forge effort estimate: LOW (<2h)
```

---

## Full ranked table

| Rank | Candidate | Type | I | F | B | C | Score | Sources | Blocked-by |
|------|-----------|------|---|---|---|---|-------|---------|------------|
| 1 | M-task-tracker | governance | 3 | 4 | 5 | 1 | 60.0 | gap-run-002 seed; BUILD_PLAN_MICHAEL L315; MASTER §13 | none |
| 2 | executor-registry-validator | meta-infra | 3 | 3 | 5 | 1 | 45.0 | gap-run-002 boundary-drift finding | none |
| 3 | trigger-phrase-miner | meta-infra | 3 | 3 | 5 | 1 | 45.0 | gap-run-002 wave-2 pass-1 pattern | none |
| 4 | ralph-loop-runner | meta-infra | 3 | 3 | 5 | 2 | 22.5 | gap-run-002 wave-2 discipline | none |
| 5 | skill-eval-runner | meta-infra | 3 | 3 | 4 | 2 | 18.0 | I02 cadence gap; distinct from skill-eval-suite | partial-dep on skill-eval-suite YAML scaffolds |
| 6 | skill-deprecator | meta-infra | 3 | 2 | 4 | 2 | 12.0 | skill-performance-tracker output feed; closes loop with skill-health-monitor | none (uses existing tracker output) |
| 7 | customer-card-builder | agentic | 5 | 3 | 2 | 4 | 7.5 | MASTER §14 ("profiles build themselves"); Appendix A 25-field card | M03 + M11 (Windward) + Google enrichment APIs |
| 8 | win-loss-predictor | agentic | 5 | 3 | 2 | 4 | 7.5 | MASTER §14 Capability Ladder L5 Predictive | needs win_loss_log volume; partial-block |

---

## Newly surfaced gaps beyond the 5 seeded

The optimizer's scan of the 17 skills forged across gap-run-001 + gap-run-002 surfaced three additional gaps not in the seed list:

1. **customer-card-builder** (agentic L4-L5) — MASTER §14 explicitly states "Customer profiles build themselves from Windward, Google, LinkedIn, and Gmail — no manual entry." Phase 2B Appendix A specifies a 25-field card spanning internal-automatic, public-enrichment, prompted-manual sources. churn-predictor uses RFM but does not BUILD the profile; this is a distinct agentic capability. Heavy block: M03/M11 (Windward) + Google/LinkedIn enrichment APIs. Cost = 4. Score 7.5 keeps it below top-3 today; promotes when M03 + M06 land.

2. **skill-deprecator** (meta-infra) — closes the skill-ecosystem self-maintenance loop. skill-performance-tracker produces an "underperformers" report and skill-health-monitor proposes Edits, but neither retires/archives skills. Without a closer, the underperformers list grows and the queue fills with structurally-fine-but-unused skills. Score 12.0 — second-tier importance.

3. **win-loss-predictor** (agentic L5) — Capability Ladder Level 5 (Predictive) is currently empty; only churn-predictor sits at the L4-L5 boundary (it predicts a single signal, not pipeline win/loss). MASTER §14 calls for "predictive — know what's going to happen before it does." Same M-task structure as customer-card-builder: needs win_loss_log + pipeline_events volume to train heuristics. Score 7.5 — gates on data accumulation, not blockers.

---

## Saturation watch

**Status:** GREEN. 0 unforged top-3 candidates from gap-run-002 remain. Drain-rate matched proposal-rate cleanly. Queue is healthy. Optimizer-forge cadence is sustainable at the current pace.

**Cadence note:** All top-3 (composite ≥ 45) for gap-run-003 are unblocked, LOW-effort meta-infra/governance skills. They can ship in one forge cycle. Recommend forge-top-3 in next session, then re-run /gap to score the residue against any new emergent demand from efficiency-monitor.

---

## ═══ FORGE APPROVAL GATE ═══

To forge from the queue, reply with one of:
  - "forge top 3"          → invokes skill-forge for ranks 1-3 in sequence (M-task-tracker, executor-registry-validator, trigger-phrase-miner)
  - "forge top N"          → invokes skill-forge for ranks 1-N
  - "forge [name]"         → invokes skill-forge for a specific candidate
  - "forge none"           → close run, queue stays for next session
  - "rescan"               → discard this run, re-do Steps 1-5

I am stopping here. Nothing is built until you reply.
═══════════════════════════════
