# NEXT_STEPS — post-stabilization, post-governance-restructure

> What to do AFTER the upcoming governance/architecture restructuring is complete.
> Pre-restructure: do NOTHING from this list. Stabilize and pause.

---

## Immediate-after-restructure (first session back)

1. **Verify branch state.** Whatever the restructure produced, confirm `claude/accentos-gap-analysis-Dcvcf` work either landed in main or is preserved in a feature branch. Run `bash scripts/status.sh` (or its post-restructure equivalent).

2. **Read these recovery docs first:**
   - `SESSION_SUMMARY.md` — what was done
   - `CURRENT_STATE.md` — operational snapshot
   - `KNOWN_ISSUES.md` — open problems
   - `HANDOFF_FOR_GOVERNANCE_RESTRUCTURE.md` — restructure-related guidance
   - `skills/gap-optimizer/gap-log.md` (last 2 entries) — closed-loop run history
   - `skills/skill-health-monitor/health-report-2026-05-08.md` — first audit report

3. **Re-validate post-restructure invariants:**
   - All 51 skills still resolvable from `skills/_index.md`?
   - vibe-speak Step 23 router still finds them?
   - `.claude/CLAUDE.md` boot sequence still references existing paths?
   - gap-optimizer's `candidate-queue.md` + `gap-log.md` still in place?
   - Companion-link graph still intact (run `/skill-health` for fresh audit)?

---

## Maintenance debt to clear (in priority order)

1. **`/ralph ralph-loop-runner`** — eat-own-dogfood self-test. The 3 Wave-5 skills shipped without inline Ralph passes (forge agents hit usage cap). Running ralph-loop-runner on itself first validates the skill works; then run it on `skill-eval-runner` and `skill-deprecator`.

2. **Generate `eval-cases.yaml` for the 5 meta-infra skills lacking coverage:** gap-optimizer, skill-health-monitor, ralph-loop-runner, skill-eval-runner, skill-deprecator. Use `skill-eval-suite` per its standard process.

3. **Run `skill-eval-runner run-all`** for the first time. Establishes baseline pass-rate; populates `references/run-history.csv`; gives skill-performance-tracker a first signal.

4. **Run `/skill-health`** — first audit since the restructure. Should be GREEN if restructure preserved invariants.

---

## Vision-driven work (when M-tasks land)

| When this M-task lands | Auto-activate / unblock |
|------------------------|--------------------------|
| **M03** (Windward read access) | windward-bridge stub flips to active |
| **M04** (BC API write scope) | bc-rest-bridge stub flips to active |
| **M06** (Google credentials) | ga4-insights + gsc-insights stubs flip to active |
| **M09** (Klaviyo credentials) | klaviyo-flows stub flips to active (needs M44 too for full mode) |
| **M10** (Windward ETL) | windward-bridge full mode |
| **M42** (action_queue table) | action-queue + alert-router writes + downstream agentic L6 work |
| **M43** (vendor_overrides co-op fields) | coop-claim-drafter flips from partial to full-active |
| **M44** (Klaviyo cache tables) | klaviyo-flows persistent mode + cross-run trends |
| **M45** (rfm_scores cache) | churn-predictor cached-baseline (perf only, optional) |

When any M-task above resolves, the corresponding skill auto-activates without code changes — its Step-0 BLOCKED gate just sees the dependency check pass.

---

## When emergent demand appears

The closed-loop is now in maintenance mode. Two re-engagement triggers:

1. **`efficiency-monitor` PROMOTE entries.** When Michael uses Claude across multiple sessions and patterns repeat (≥3 sessions or ≥10 min cumulative savings), efficiency-monitor flags them. Next `/gap` cycle picks them up as emergent gap candidates.

2. **Vision update.** If MASTER.md §14 is amended OR new BUILD_PLAN tracks are added, gap-optimizer's vision-scan picks up the new capability rows.

In both cases: run `/gap` to re-score the queue. If anything ranks ≥25.0, forge it.

---

## When the 2 residue candidates become viable

| Candidate | Becomes viable when |
|-----------|---------------------|
| `customer-card-builder` | M03 + M11 land + Google enrichment APIs are wired |
| `win-loss-predictor` | `win_loss_log` + `pipeline_events` tables accumulate sufficient volume (~6 months of data) |

Until then, both stay in `candidate-queue.md` with score 7.5. Optimizer will surface them automatically once the gates clear.

---

## Strategic next-cycle work (if/when capacity allows)

After the maintenance debt is cleared:

1. **Wire skill-performance-tracker into a session-end aggregator** so it produces real metrics instead of theoretical ones.
2. **Run `mtask-tracker`** to surface the highest-leverage M-task. Tells Michael which schema run unblocks the most downstream skills.
3. **Run `registry-validator`** as a pre-commit hook on action-queue or executor-skill changes.
4. **Run `phrase-miner audit`** retroactively on all 51 skills to surface trigger-phrase mismatches.
5. **Surface `mtask-tracker` and `registry-validator` outputs in `daily-brief-composer`** so Michael sees them in his morning brief.
6. **Cross-link skill-deprecator to a CRON or git hook** so dying skills surface monthly without manual invocation.

Each is small (≤1h) and composable. None require new skills — all use what's already shipped.

---

## What NOT to do

- **Do NOT auto-forge any skills** until the queue scoring logic has been re-verified post-restructure.
- **Do NOT modify `skills/_index.md` by hand** — use `/vibe regenerate skill index` instead (per its own contract).
- **Do NOT run skill-deprecator on day-1.** No skill yet has ≥2 independent deprecation signals; the first run should be after skill-eval-runner has produced 2-3 weeks of history.
- **Do NOT merge `claude/accentos-gap-analysis-Dcvcf` to main pre-restructure** unless the restructure plan accommodates it.
- **Do NOT split repos** until the governance plan is explicit about boundaries (see HANDOFF_FOR_GOVERNANCE_RESTRUCTURE.md for thinking).
