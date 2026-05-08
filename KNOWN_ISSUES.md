# KNOWN_ISSUES — pre-governance-restructure

> Open issues, deferred fixes, and risks at the moment of stabilization.
> All are tracked; none are blocking. Each has a planned resolution path.

---

## OPEN — explicit deferrals

### 1. 3 Wave-5 skills lack inline Ralph passes
- **Affected:** `ralph-loop-runner`, `skill-eval-runner`, `skill-deprecator`
- **Reason:** All 3 forge agents hit "out of extra usage" cap mid-Ralph during gap-run-005. Structural validation passed but Pass 1/2/3 edits never landed.
- **Risk:** trigger phrases not yet mined from PROMPT_LOG; failure-mode hardening not yet applied; ambiguity scrub not yet run. Skills are functional but not refined.
- **Resolution:** Run `/ralph ralph-loop-runner` first as canonical eat-own-dogfood self-test, then ralph the other two. Listed as priority 1 in `NEXT_STEPS.md`.

### 2. 5 meta-infra skills lack `eval-cases.yaml`
- **Affected:** gap-optimizer, skill-health-monitor, ralph-loop-runner, skill-eval-runner, skill-deprecator
- **Reason:** gap-optimizer + skill-health-monitor were forged before eval-suite was applied to gap-run-002 batch; the 3 Wave-5 skills were forged under usage cap.
- **Risk:** No regression coverage for these meta-infra skills. If their behavior drifts, no automated test catches it.
- **Resolution:** Run skill-eval-suite for each. Listed as priority 2 in `NEXT_STEPS.md`.

### 3. skill-eval-runner has never been executed
- **Reason:** Skill shipped at end of session; no time to run.
- **Risk:** The `references/run-history.csv` is empty (just a header row). skill-performance-tracker has no `quality_signal` to consume yet.
- **Resolution:** Run `skill-eval-runner run-all` on first post-restructure session. Listed as priority 3 in `NEXT_STEPS.md`.

### 4. skill-deprecator has nothing to act on
- **Reason:** Requires ≥2 independent deprecation signals per its hard rule. Currently no skill has even 1 signal — efficiency-monitor's invocation log is empty (0 sessions logged) and skill-eval-runner hasn't run yet.
- **Risk:** Low. Skill is shipped but inert until signals accumulate.
- **Resolution:** Naturally emerges after 2-4 weeks of session activity once skill-eval-runner is producing history.

---

## DEFERRED — intentional, documented

### 5. `efficiency-monitor` lacks standard sections
- **Issue:** Skill body uses `## Hard rules` instead of `## Anti-patterns`; no `## Trigger Recognition` because skill is auto-active via CLAUDE.md boot.
- **Status:** Logged in `skills/skill-health-monitor/ignored.md` as **intentional** (sh-2026-05-08-004 + sh-2026-05-08-005). Auto-active observer skills follow alternative conventions.
- **Action:** None unless audit policy changes.

### 6. `vibe-speak` exceeds 5000-token soft cap (~14k tokens)
- **Status:** Logged in `ignored.md` as intentional (sh-2026-05-08-006). Bloat is intentional for boot read-once-per-session performance via lazy-load contract.
- **Action:** Consider splitting modes into `references/modes/[mode].md` if vibe-speak's boot-time impact becomes measurable.

### 7. windward-bridge `preflight-check.sh` is a "future artifact"
- **Status:** Was a broken-ref ERROR pre-fix. Wave 5B replaced bash invocation with `.md` reference + explicit "future, deferred until M03 + M10 unblock" note.
- **Action:** When M03 + M10 land, re-evaluate whether the executable script is needed.

---

## EXTERNAL — gated on Michael / external systems

### 8. 7 skills in BLOCKED stub mode
- **Affected:** ga4-insights (M06), gsc-insights (M06), bc-rest-bridge (M04), klaviyo-flows (M09), windward-bridge (M03+M10), action-queue (M42 schema), trade-vendor-portal (M01/M03/M04/M11/M24/M40 heavy gate)
- **Risk:** Each has a Step-0 gate that returns a stub message until its M-task closes. Functional skills that report "I'm waiting" rather than failing.
- **Resolution:** M-tasks close when Michael runs them. Each unblock auto-activates the skill (no code changes).

### 9. M42–M45 schema tasks owned by Michael
- **M42** — action_queue table (unblocks ≥4 skill writes)
- **M43** — vendor_overrides co-op fields (unblocks coop-claim-drafter full mode)
- **M44** — Klaviyo cache tables (unblocks klaviyo-flows persistent mode)
- **M45** — rfm_scores cache table (perf optional for churn-predictor)
- **Risk:** action-queue schema (M42) blocks the largest downstream surface. Without it, the L6 autonomous-execution narrative stalls.
- **Resolution:** When Michael runs the SQL, skills auto-activate.

### 10. 2 residue gap candidates parked
- **customer-card-builder** (score 7.5) — needs M03 + M11 + Google enrichment APIs
- **win-loss-predictor** (score 7.5) — needs win_loss_log + pipeline_events data volume (~6 months)
- **Resolution:** Auto-promote when their gates clear.

---

## ARCHITECTURAL — to revisit during/after restructure

### 11. Cross-skill companion-link graph
- **Issue:** 51 skills have ~150+ inter-skill references. Restructure could break the reachable graph if skills move repos.
- **Risk:** vibe-speak Step 23 routing depends on `_index.md` resolving every companion. A broken graph = silent skill-bypass.
- **Resolution:** Run `/skill-health` immediately post-restructure to detect drift.

### 12. `_index.md` regeneration
- **Issue:** `_index.md` is meant to be auto-regenerable via `/vibe regenerate skill index`, but has been manually edited extensively in this session (23 new entries inserted via Edit operations).
- **Risk:** A future regeneration pass might overwrite manual entries' tone/wording (the auto-generator pulls from frontmatter only, missing context I added like "(NEW)" annotations or hand-tuned trigger lists).
- **Resolution:** If auto-regeneration is run, diff carefully and preserve hand-tuned summaries. Or: enhance the auto-generator to read trigger phrases from SKILL.md body's Trigger Recognition section, not just frontmatter description.

### 13. Coupling between `.claude/CLAUDE.md` and skill paths
- **Issue:** Boot sequence in `.claude/CLAUDE.md` step 1.j and 1.k references skill paths under `skills/efficiency-monitor/` and `skills/gap-optimizer/`. If these move repos, the boot fails silently (boot reads return empty rather than erroring).
- **Risk:** Silent boot degradation during restructure transition.
- **Resolution:** Update `.claude/CLAUDE.md` to use whatever path resolver the restructure provides (env var? convention?).

### 14. M-task numbering ownership
- **Issue:** `BUILD_PLAN_MICHAEL.md` numbering (M01–M45) is sequential and managed manually. The skill-forge agent culture treats M-task IDs as stable references in skill Step-0 BLOCKED gates.
- **Risk:** If M-tasks get renumbered during restructure, every BLOCKED-stub skill's Step-0 gate cites wrong IDs.
- **Resolution:** Either preserve M-task numbering through restructure, OR run `mtask-tracker` to identify which skills cite which M-tasks before any renumbering.

### 15. Duplicate-scope edge cases
- **Issue:** Audit found 9 near-duplicate trigger pairs (Jaccard 0.5–0.7) that were manually reviewed and kept-distinct (e.g. repo-scout vs skill-forge; bottleneck-finder vs mtask-tracker). The audit's "intentional" classification is human-judgment, not encoded.
- **Risk:** Future audit runs might flag these again. Could create churn.
- **Resolution:** Add to `ignored.md` with explicit "duplicate-scope-acceptable: [reason]" entries. Currently only the 3 frontmatter warnings are in ignored.md.

---

## TOOLING / OPERATIONAL — risks

### 16. Stop-hook git-check loop noise
- **Observation:** Throughout the session, the stop hook (`~/.claude/stop-hook-git-check.sh`) repeatedly fired "uncommitted changes" warnings during multi-agent waves because subagent commits + my parent-agent commits interleaved.
- **Risk:** Noise in session feedback; potential confusion about which work is committed vs in-flight.
- **Resolution:** Consider adjusting the stop-hook to differentiate "uncommitted-because-agents-still-running" vs "uncommitted-and-final". Out of scope for this session.

### 17. Subagent "out of extra usage" cap
- **Observation:** 4 subagents hit usage caps mid-task (skill-performance-tracker in Wave 1; ralph-loop-runner / skill-eval-runner / skill-deprecator in Wave 5). Each had done substantial work but couldn't return clean summaries.
- **Risk:** Silent partial completion. Required parent-agent inspection to determine what landed.
- **Resolution:** Process-level — keep agent prompts shorter, batch tasks more aggressively (Wave 2 pattern of 3-skills/agent worked better than 1-skill/agent for usage budget).

---

## NON-RISKS (operational systems untouched)

The following are listed as "no issue" because they were intentionally not modified:

- BigCommerce store `store-cwqiwcjxes` — no writes, no config changes
- Supabase project `hsyjcrrazrzqngwkqsqa` — no schema changes
- Cloudflare Pages deployment — no config changes
- Anthropic API — no key rotation, no model changes
- All UI modules (Track 1-5) — untouched
- `index.html` (694KB) — unchanged
- All `js/` `css/` `sql/` directories — unchanged
- The closed-loop infrastructure relies entirely on markdown SKILL.md files; no runtime changes occurred.
