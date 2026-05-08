# AccentOS — Gap Candidate Queue

> Auto-rebuilt by `gap-optimizer` each run. Sorted by composite score descending.
> This file is **canonical current-state** — it is overwritten, not appended.
> For history of what's been ranked over time, see `gap-log.md`.

**Last run:** 2026-05-08 (gap-run-005 — Wave 5 sub-threshold drain)
**Branch:** `claude/accentos-gap-analysis-Dcvcf`
**Vision artifacts read:** MASTER.md §14 + Capability Ladder, BUILD_PLAN_CLAUDE Tracks 5/6/7, BUILD_PLAN_MICHAEL pending M-tasks, KPI_CATALOG, _index.md (51 skills)
**Current skills:** 51
**Saturation watch:** GREEN (top-tier fully drained; only M-task-blocked / data-volume-gated residue remains)

---

## ✅ gap-run-003 residue (sub-threshold) is now BUILT

| Candidate | Status | Score | Notes |
|-----------|--------|-------|-------|
| ralph-loop-runner | ✅ BUILT (Wave 5C) | 22.5 | active; structural-pass; inline Ralph deferred (eat own dogfood next session) |
| skill-eval-runner | ✅ BUILT (Wave 5D) | 18.0 | active; sibling to skill-eval-suite (author/runner pair) |
| skill-deprecator | ✅ BUILT (Wave 5E) | 12.0 | active; ≥2-signal hard rule; closes the meta-loop with skill-performance-tracker + skill-health-monitor |

---

## Remaining queue (M-task-blocked or data-volume-gated)

| Rank | Candidate | Type | I | F | B | C | Score | Sources | Blocked-by |
|------|-----------|------|---|---|---|---|-------|---------|------------|
| 1 | customer-card-builder | agentic | 5 | 3 | 2 | 4 | 7.5 | MASTER §14 ("profiles build themselves"); Appendix A 25-field card | M03 + M11 (Windward) + Google enrichment APIs |
| 2 | win-loss-predictor | agentic | 5 | 3 | 2 | 4 | 7.5 | MASTER §14 Capability Ladder L5 Predictive | needs win_loss_log volume; partial-block |

These are bottom-of-barrel — they wait on EXTERNAL inputs (M-task closures, data volume accumulation, enrichment API credentials). Not actionable until those resolve.

---

## Saturation watch

**Status:** GREEN. Top-tier queue (≥25.0 score) fully drained across 5 cycles. Top sub-threshold queue (≥10.0) also drained. Remaining 2 candidates score 7.5 — would only become top-3 in a future cycle if M-task blockers resolve OR if higher-scoring candidates emerge from efficiency-monitor PROMOTE feed.

**Cadence shift:** the optimizer-forge loop has consumed its initial backlog. Going forward, the loop is in **maintenance mode** — driven by external inputs (M-task closures, emergent demand from efficiency-monitor PROMOTE, vision updates that surface new capability rows). Recommend weekly `/gap` rescan rather than per-session.

---

## Maintenance debt for next session

1. **3 Wave-5 skills lack inline Ralph passes** (agents hit usage cap mid-pass after structural completion). Run `/ralph ralph-loop-runner` first (canonical self-test), then `/ralph skill-eval-runner` and `/ralph skill-deprecator`.
2. **3 Wave-5 skills lack eval-cases.yaml**. After ralph-loop-runner stabilizes, run `skill-eval-suite` for each.
3. **Re-run `/skill-health`** to confirm post-Wave-5-fixes the audit is GREEN.
4. **M42–M45 schema runs** still pending Michael — unblock 5+ skills from BLOCKED stub mode when they land.
5. **M03/M11/data-volume gates** for the 2 residue candidates.

---

## ═══ FORGE APPROVAL GATE ═══

Top-tier and sub-threshold queues are both drained. The 2 remaining candidates are externally gated.

To explore further, reply with one of:
  - "rescan"                        → re-run gap-optimizer Steps 1-5 against the 51-skill state
  - "watch [name]"                  → set a watch trigger on a candidate (auto-promote when blockers resolve)
  - "drain residue [name]"          → forge despite the M-task block (returns BLOCKED stub)

═══════════════════════════════
