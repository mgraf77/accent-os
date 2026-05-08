# AccentOS — Gap Candidate Queue

> Auto-rebuilt by `gap-optimizer` each run. Sorted by composite score descending.
> This file is **canonical current-state** — it is overwritten, not appended.
> For history of what's been ranked over time, see `gap-log.md`.

**Last run:** 2026-05-08 (post-forge rescan after gap-run-002 closure)
**Branch:** `claude/accentos-gap-analysis-Dcvcf`
**HEAD:** `b367277` (post-Wave-1 _index.md aggregation; Wave 2 Ralph edits in working tree at run-time)
**Vision artifacts read:** MASTER.md §14, BUILD_PLAN_CLAUDE Track 6, BUILD_PLAN_MICHAEL pending M-tasks, KPI_CATALOG, _index.md, Capability Ladder
**Current skills:** 45 (28 prior + gap-optimizer + skill-health-monitor + 15 from gap-run-002)
**Emergent PROMOTE from efficiency-monitor:** 0

---

## ✅ All 15 ranked candidates from gap-run-001 are now BUILT

| Rank | Candidate | Status | Notes |
|------|-----------|--------|-------|
| 1 | email-drafter | ✅ BUILT (Wave 1 forged + Wave 2 Ralph 3-pass PASS) | active |
| 2 | daily-brief-composer | ✅ BUILT (W1+W2 PASS) | active |
| 3 | next-action-recommender | ✅ BUILT (W1+W2 PASS) | active |
| 4 | alert-router | ✅ BUILT (W1+W2 PASS) | active |
| 5 | churn-predictor | ✅ BUILT (W1+W2 PASS) | active |
| 6 | ga4-insights | ✅ BUILT (W1+W2 PASS) | BLOCKED stub on M06 |
| 7 | gsc-insights | ✅ BUILT (W1+W2 PASS) | BLOCKED stub on M06 |
| 8 | action-queue | ✅ BUILT (W1+W2 PASS) | BLOCKED stub on `action_queue` schema (proposed in references/) |
| 9 | klaviyo-flows | ✅ BUILT (W1+W2 PASS) | BLOCKED stub on M09 |
| 10 | bc-rest-bridge | ✅ BUILT (W1+W2 PASS) | BLOCKED stub on M04 |
| 11 | coop-claim-drafter | ✅ BUILT (W1+W2 PASS) | partial-block on vendor_overrides co-op fields |
| 12 | windward-bridge | ✅ BUILT (W1+W2 PASS) | BLOCKED stub on M03+M10 |
| 13 | skill-performance-tracker | ✅ BUILT (W1+W2 PASS) | active |
| 14 | demand-forecaster-skill | ✅ BUILT (W1+W2 PASS) | active (Windward soft-dep) |
| 15 | trade-vendor-portal | ✅ BUILT (W1+W2 PASS) | heavy-blocked stub (M01/M03/M04/M09/M10/M11/M12/M18/M24/M40) |

**Loop closure:** 15/15 candidates moved BUILT. 7 of 15 ship in BLOCKED stub mode pending M-tasks; the remaining 8 are immediately invocable.

---

## Next-cycle gap candidates (newly surfaced)

After Wave 1 + Wave 2, the optimizer's rescan picked up these new gap candidates. They will be the seed of gap-run-003:

| Rank | Candidate | Type | Source | Notes |
|------|-----------|------|--------|-------|
| 1 | ralph-loop-runner | meta-infra | this run | The 3-pass Ralph loop discipline used in Wave 2 should become its own skill — pattern is reusable on every fresh forge |
| 2 | M-task-tracker | governance | BUILD_PLAN_MICHAEL gap | A skill that maps every BLOCKED-stub skill to its blocking M-tasks and surfaces unblock cadence — currently this knowledge is scattered across each skill's Step 0 |
| 3 | executor-registry-validator | meta-infra | action-queue surface | After this run's executor-registry alignment fix, a watcher that catches contract drift between action_queue's registry and individual executor skills' actual contracts |
| 4 | skill-eval-runner | meta-infra | I02 | Distinct from skill-eval-suite (which AUTHORS evals) — this skill RUNS them on a cadence and reports failures |
| 5 | trigger-phrase-miner | meta-infra | this run | Wave 2 Pass 1 mined PROMPT_LOG for real Michael phrasings — extracting that into a reusable skill avoids per-forge re-discovery |

These will go through the standard gap-optimizer scoring on the next `/gap` run.

---

## Saturation watch

**Status:** GREEN. Queue fully drained — 0 unforged top-3 candidates from gap-run-001 remain. The loop's drain-rate has matched its proposal-rate. Healthy.

---

## ═══ FORGE APPROVAL GATE ═══

The previous queue is fully drained. Run `/gap` to score the new-cycle candidates above and produce a fresh top-3 for the next forge cycle.

═══════════════════════════════
