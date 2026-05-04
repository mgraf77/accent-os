## WORK IN PROGRESS
> Overwritten after every discrete build step. Shows exactly what was happening if Codespace dies.

**Last updated:** 2026-05-04 — crash-recovery scaffolding committed
**Current task:** Crash-recovery scaffolding (pre-build setup)
**Step:** Files created (PROMPT_LOG.md + WORK_IN_PROGRESS.md), BUILD_INTELLIGENCE updated with new operating rules. About to commit + push, then resume autonomous build queue.
**Files touched so far this task:**
- PROMPT_LOG.md (created)
- WORK_IN_PROGRESS.md (created — this file)
- BUILD_INTELLIGENCE.md (3 new operating-rule lines appended)
**Commit status:** uncommitted (about to commit as one bundle)
**Next step if interrupted:**
1. `git add PROMPT_LOG.md WORK_IN_PROGRESS.md BUILD_INTELLIGENCE.md`
2. `git commit -m "build: add crash recovery — PROMPT_LOG + WORK_IN_PROGRESS"`
3. `git push origin main`
4. Resume autonomous build from first incomplete `[ ]` in BUILD_PLAN_CLAUDE.md (likely 5.3 Inventory CSV phase 1, since 5.6 Price Book also needs Windward / BC API and most Track 5 / 6 items are blocked or external)
