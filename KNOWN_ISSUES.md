# KNOWN_ISSUES.md — Open items at clean-pause

## From this session

### 1. `BUILD_STATUS.md` self-reference loop (RESOLVED, but watch)
- **Symptom:** Stop hook left BUILD_STATUS.md dirty after every session, triggering "unpushed commit" warnings.
- **Cause:** Three self-references — captured commit SHA, "Working tree" count included itself, timestamp always changed.
- **Fix:** Drop SHA from captured fields; exclude BUILD_STATUS.md from dirty count; idempotency check ignores `Last updated:` line.
- **Watch:** if anyone re-adds `%h` to commit captures or removes the timestamp filter, the loop returns. Fix is in `scripts/build-status.sh` lines 14, 18, 130-ish.

### 2. `.git/hooks/pre-push` is not tracked by git
- **Symptom:** Hook lives in `.git/hooks/pre-push`. Git intentionally doesn't track this directory.
- **Impact:** Cloning the repo elsewhere (or restructure into new repo) loses the hook. Must re-create on each new clone.
- **Mitigation:** consider moving to a tracked path like `scripts/git-hooks/pre-push` and document a `make install-hooks` step. Did NOT do this in stabilization mode (would be new architecture).

### 3. Pre-push amend can divergence with remote on retry
- **Symptom:** On the first push of a new commit, the pre-push hook amends BUILD_STATUS.md into HEAD, creating a different SHA than what was originally `git commit`'d. If someone has the pre-amend SHA cached or referenced, it points to a non-existent commit.
- **Mitigation:** pre-push hook checks `git merge-base --is-ancestor HEAD origin/branch` before amending — only amends if HEAD is unpushed. Verified working but worth a once-over post-restructure.

## From the broader plan (carried into Phase 0)

### 4. No adoption baseline exists yet
- 36 modules shipped, no DAU/WAU per module data. Phase 0.A produces this. Plan acknowledges and accepts this as a Phase 0 deliverable.

### 5. Phase 1 100% creds-blocked
- M03 Windward, M04 BigCommerce, M05 GMC, M10 Curtis, M38 Stencil CLI, M39 Supabase MFA all need Owner action.
- Mitigation: Phase 0 + Phase 2 internal surfaces are unblocked; Phase 1 can run in parallel once any one cred lands.

### 6. Personal/business data wall is JWT-aud-only
- The "second Supabase project" hard wall is deferred to Phase 4. Until then, personal and business data co-mingle in one project, separated only by RLS + JWT audience claims. Acceptable risk for v1; not acceptable long-term.

### 7. Single-tenant by design
- No cross-tenant network effects. If governance restructure pushes toward multi-tenant SaaS framing, the plan needs a re-architecture pass before Phase 1+ ships.

### 8. `BUILD_STATUS.md` doesn't track Phase 1 owner-blockers visually
- The dashboard shows blocked items in a list but doesn't surface "Phase 1 is fully blocked" prominently. Acceptable; can be enhanced post-restructure if needed.

### 9. `automation_events` table doesn't exist yet
- The plan's spine is Phase 0 item 7.1. SQL not yet written. M30 is the Owner-blocker. Until shipped, no Δ-ROI tracking is possible — and most of the safety / threshold / kill-list logic depends on it.

### 10. Anthropic prompt caching not yet enabled
- Plan calls for it as Phase 0.2 (AI Gateway). Until then, AI Consultant pays full input tokens every turn. Cost burn is a real risk pre-Phase-0.

## Operational risks at pause

- **None blocking.** Repo is clean, app runs, no broken imports. The restructure can proceed without Phase 0 starting first.
- **One concern:** if restructure moves `scripts/build-status.sh` or splits `BUILD_PLAN_CLAUDE.md` into multiple files, the dashboard regenerator breaks silently (it greps the single file). Update paths in the script accordingly.

## Things explicitly NOT done in stabilization mode

- Did NOT split `index.html` further (still 694KB, well under 900KB trigger).
- Did NOT create new abstractions or frameworks.
- Did NOT touch Supabase schema.
- Did NOT modify auth flow.
- Did NOT restructure folders.
- Did NOT create orchestration infra.
- Did NOT implement Phase 0 / 7.x items — those are queued, not started.
