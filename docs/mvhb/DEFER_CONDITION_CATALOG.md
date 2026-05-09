# DEFER CONDITION CATALOG
# Version: 0.1 | Date: 2026-05-09

---

## PURPOSE

Named, testable conditions that cause a queue item to enter WAITING state.
Each entry defines: what it means, how to check it, and what clears it.

Worker sessions must reference condition_id from this catalog.
Do not invent ad-hoc condition strings. Add new entries here instead.

---

## CATALOG

---

### waiting-for-merge

Waiting for a pull request to be merged into the target branch.

check_target:  PR url (e.g. https://github.com/mgraf77/accent-os/pull/42)
check_method:  poll
how_to_check:  Query PR status. Cleared when PR state = merged.
recheck_after: 15 min
clears_when:   PR merged into target branch
escalate_at:   72h without merge → notify Michael
notes:         Do not proceed on PR closed-without-merge. That is a FAILED
               condition, not a clear. Worker must detect and handle.

---

### waiting-for-captain

Waiting for Michael (Captain) to make a decision or provide direction
that cannot be inferred or assumed.

check_target:  Slack thread url, GitHub comment url, or WORK_IN_PROGRESS note
check_method:  manual-confirm
how_to_check:  Cannot be polled. Session must yield and wait for Michael
               to explicitly resume or provide the decision as context.
recheck_after: 0 (no automatic recheck — resumes only when Michael acts)
clears_when:   Michael provides the required input or decision
escalate_at:   N/A — Michael IS the escalation path
notes:         Use sparingly. Most ambiguity should be resolved by the worker
               using best judgment + documenting the assumption.
               Reserve for: irreversible actions, high-stakes architecture
               decisions, conflicting requirements with no clear winner.

---

### waiting-for-deploy

Waiting for a deploy to complete and stabilize before proceeding.

check_target:  Deploy id, Vercel deployment url, or CI run url
check_method:  poll
how_to_check:  Query deploy status. Cleared when deploy state = ready/success
               AND health check passes (if applicable).
recheck_after: 5 min
clears_when:   Deploy status = ready AND no error spike in first 5 min
escalate_at:   30 min without stable deploy → treat as FAILED
notes:         Do not proceed on partial deploy or deploy-in-progress.
               A deploy that succeeds but introduces errors should be treated
               as cleared (deploy itself done) — downstream error is a new item.

---

### waiting-for-review

Waiting for a code review to be approved (or for review comments to be
addressed and re-approved).

check_target:  PR url
check_method:  poll
how_to_check:  Query PR review state. Cleared when:
               - all required reviewers have approved, AND
               - no open change-requests remain
recheck_after: 20 min
clears_when:   PR review state = approved, no pending change-requests
escalate_at:   48h without review → notify Michael
notes:         If reviewer requests changes, item stays WAITING.
               Worker should NOT auto-address review comments without
               Michael confirmation unless change is clearly mechanical
               (typo, lint, formatting).

---

### waiting-for-gate

Waiting for a CI/CD gate, feature flag, or release gate to open.

check_target:  CI run url, gate name, or feature flag id
check_method:  poll | manual-confirm (depends on gate type)
how_to_check:  For CI: query run status. Cleared when all required checks pass.
               For feature flags: check flag state. Cleared when flag = enabled.
               For release gates: manual-confirm required.
recheck_after: 10 min
clears_when:   Gate opens / all checks green / flag enabled
escalate_at:   4h without gate clearing → notify Michael
notes:         A gate that fails (not just pending) is a FAILED condition.
               If CI is flaky and fails intermittently, use retry semantics
               rather than sitting in WAITING indefinitely.

---

### waiting-for-dependency

Waiting for another queue item to reach DONE state before this item
can begin or continue.

check_target:  Dependency item id (e.g. fix-auth-refresh-01)
check_method:  poll
how_to_check:  Read QUEUE_STATE.md or DONE_LOG.md for dependency item.
               Cleared when dependency item status = DONE.
recheck_after: 10 min
clears_when:   Dependency item status = DONE
escalate_at:   If dependency reaches DEAD → this item also fails with reason
               "dependency dead: [dependency_id]"
notes:         Circular dependencies are a fatal design error.
               Worker must detect and refuse circular deps at item creation.
               Max dependency chain depth: 3 levels.

---

### waiting-for-runtime

Waiting for a runtime environment to be available, healthy, or provisioned
before a task can execute.

check_target:  Runtime name, environment url, or service endpoint
check_method:  poll
how_to_check:  Health check the target endpoint or service status page.
               Cleared when runtime returns healthy response.
recheck_after: 5 min
clears_when:   Runtime health check passes
escalate_at:   60 min without healthy runtime → notify Michael
notes:         Covers: local dev server not started, Supabase project paused,
               external API in maintenance, test environment not seeded.
               Worker cannot fix runtime issues — only wait or escalate.

---

### waiting-for-mobile-validation

Waiting for a human to validate the feature on a physical mobile device
or in the mobile app testing environment. Cannot be automated.

check_target:  TestFlight build id, Expo URL, or test protocol doc
check_method:  manual-confirm
how_to_check:  Cannot be polled. Michael or designated tester must validate
               and explicitly signal pass/fail.
recheck_after: 0 (no automatic recheck)
clears_when:   Michael or tester signals validation passed
escalate_at:   N/A — this is the human gate by design
notes:         This condition exists because mobile layout, haptics, gesture
               responsiveness, and audio (accent coaching) cannot be verified
               in emulator or automated tests alone. If validation fails,
               item transitions to FAILED with tester notes in error_log.

---

## ADDING NEW CONDITIONS

To add a new defer condition:
1. Add entry to this catalog with all fields populated
2. Commit the catalog change first, before any item references the new condition_id
3. condition_id format: waiting-for-[noun] (kebab-case, lowercase)
4. check_method must be one of: poll | webhook | manual-confirm
5. escalate_at must be defined — "never escalate" is not acceptable

---

## CONDITION ID QUICK REFERENCE

waiting-for-merge
waiting-for-captain
waiting-for-deploy
waiting-for-review
waiting-for-gate
waiting-for-dependency
waiting-for-runtime
waiting-for-mobile-validation
