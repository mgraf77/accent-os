# AccentOS — Gap Candidate Queue

> Auto-rebuilt by `gap-optimizer` each run. Sorted by composite score descending.
> This file is **canonical current-state** — it is overwritten, not appended.
> For history of what's been ranked over time, see `gap-log.md`.

**Last run:** 2026-05-08 (gap-run-004 — post-Wave-4-drain rescan)
**Branch:** `claude/accentos-gap-analysis-Dcvcf`
**HEAD:** `3d9b292`
**Vision artifacts read:** MASTER.md §14 + Capability Ladder, BUILD_PLAN_CLAUDE Tracks 5/6/7, BUILD_PLAN_MICHAEL pending M-tasks (now M03/M04/M06/M09/M10/M11/M24-M45), KPI_CATALOG, _index.md (48 skills)
**Current skills:** 48
**Emergent PROMOTE from efficiency-monitor:** 0
**Saturation watch:** GREEN (top-3 from gap-run-003 fully drained)

---

## ✅ gap-run-003 top-3 are now BUILT

| Rank | Candidate | Status | Notes |
|------|-----------|--------|-------|
| 1 | mtask-tracker | ✅ BUILT (Wave 4 forge + 3-pass Ralph PASS) | active; canonical name kebab-case from M-task-tracker |
| 2 | registry-validator | ✅ BUILT (Wave 4 PASS) | active; canonical name from executor-registry-validator (≤25 char rule) |
| 3 | phrase-miner | ✅ BUILT (Wave 4 PASS) | active; canonical name from trigger-phrase-miner |

---

## Remaining ranked candidates (residue from gap-run-003)

| Rank | Candidate | Type | I | F | B | C | Score | Sources | Blocked-by |
|------|-----------|------|---|---|---|---|-------|---------|------------|
| 1 | ralph-loop-runner | meta-infra | 3 | 3 | 5 | 2 | 22.5 | gap-run-002 wave-2 discipline | none |
| 2 | skill-eval-runner | meta-infra | 3 | 3 | 4 | 2 | 18.0 | I02 cadence gap; distinct from skill-eval-suite | partial-dep on skill-eval-suite YAML scaffolds |
| 3 | skill-deprecator | meta-infra | 3 | 2 | 4 | 2 | 12.0 | skill-performance-tracker output feed; closes loop with skill-health-monitor | none (uses existing tracker output) |
| 4 | customer-card-builder | agentic | 5 | 3 | 2 | 4 | 7.5 | MASTER §14 ("profiles build themselves"); Appendix A 25-field card | M03 + M11 (Windward) + Google enrichment APIs |
| 5 | win-loss-predictor | agentic | 5 | 3 | 2 | 4 | 7.5 | MASTER §14 Capability Ladder L5 Predictive | needs win_loss_log volume; partial-block |

---

## Newly surfaced gaps (post Wave 4)

The Wave 4 ship of mtask-tracker + registry-validator + phrase-miner closed several smaller follow-on gaps surfaced during Wave 3, but did NOT surface new top-tier candidates. The Wave 4 forge was clean — no contract drift, no duplicate scope, no companion-link gaps. Re-scoring the residue against the current 48-skill state did not change relative rank.

**Health audit residue still open** (from Wave 3A skill-health-monitor):
- efficiency-monitor description missing "AccentOS"/"Accent Lighting" — ERROR severity, needs Michael's call (rewrite vs grandfather)
- windward-bridge references nonexistent `preflight-check.sh` — needs path decision
- 3 WARN-level structural-section gaps on efficiency-monitor + vibe-speak (predate the contract rule)

These are NOT gap-optimizer queue items; they're skill-health-monitor findings awaiting Michael's review. Documented in `skills/skill-health-monitor/health-report-2026-05-08.md`.

---

## Saturation watch

**Status:** GREEN. The closed-loop has now drained two full cycles (gap-run-002: 15 skills; gap-run-003 top-3: 3 skills). Drain-rate matches proposal-rate. Top remaining residue (ralph-loop-runner) is below the 25.0 "ship-now" threshold — discretionary forge.

---

## ═══ FORGE APPROVAL GATE ═══

Top-3 from gap-run-003 are drained. Remaining queue (5 items) is below the 25.0 ship-now threshold or M-task-blocked. Recommend running `/gap` next session to re-score against any new emergent demand from efficiency-monitor.

To forge from the residue, reply with one of:
  - "forge ralph-loop-runner"      → invokes skill-forge for the highest-scoring residue
  - "forge skill-eval-runner"      → second-highest (partial-dep on skill-eval-suite)
  - "forge skill-deprecator"       → closes the meta-loop with skill-performance-tracker
  - "rescan"                       → re-run gap-optimizer Steps 1-5 against the 48-skill state

═══════════════════════════════
