# Mode: freeze

## Identity
- **Mode key:** `freeze`
- **Risk tier:** MEDIUM
- **Reversibility:** REVERSIBLE (but with intentional friction)
- **Typical duration:** hours to days (longer is a smell)
- **Concurrency:** MULTI_AGENT_OK (read-mostly; only declared hotfixers can write)

## Purpose
A **hard stop**. While frozen, the repo accepts no changes except explicitly-authorized hotfixes. Used pre-deploy, during incident response, when handing off across organizational boundaries, or when waiting on an external blocker that must not be circumvented.

Distinct from `pause`: pause is "stopping for now, will resume." Freeze is "no one ships anything until X."

## Entry Conditions
- Manifest mode is one of: `stabilize`, `pause`, `deploy-prep`, `extraction-prep`, `governance-transition`, `recovery`
- Operator has authority to freeze (humans: yes; agents: must have explicit operator approval — this is a HIGH-friction mode entry for agents)
- Reason for freeze is documented (no implicit freezes)

## Goals (ordered)
1. Repo is locked to its current state — no merges to protected branches
2. All actors (humans + agents) reading the manifest see freeze + reason + thaw conditions
3. If hotfixes are anticipated, the hotfix protocol is documented before any are accepted
4. Audit-trail entry captures who froze, why, and when thaw is expected

## Allowed Actions
- Read everything
- Document the freeze reason and expected thaw conditions
- Accept hotfixes that match the documented hotfix protocol (typically: critical bug, named approver, narrow scope)
- Update the manifest
- Append to audit trail
- Add or update branch protection rules (if the repo's hosting supports it) — this is the primary "actually-enforce-the-freeze" lever

## Forbidden Actions
- Any commit that is not an authorized hotfix
- Merging open PRs (unless they qualify as hotfixes)
- Adding new features
- Refactors
- Dependency updates
- Schema migrations
- Removing branch protection
- Force-pushing
- Rewriting history
- Bypassing the hotfix protocol "just this once"

## Execution Priorities
1. **Document before locking.** Freeze reason and thaw conditions go into the audit trail and manifest first.
2. **Enforce at the platform layer if possible.** Branch protection rules > honor system. Use what your hosting supports.
3. **Hotfix protocol must be explicit.** "Hotfix only" without a definition leaks. Define: who can approve, what counts, max diff size.
4. **Time-bound the freeze.** Open-ended freezes become abandonment. Set an expected thaw date even if approximate.

## Documentation Requirements
- Freeze declaration at `.governance/artifacts/[YYYY-MM-DD]-freeze-declaration.md` containing:
  - Reason
  - Thaw conditions (specific, testable)
  - Expected thaw date (target, not commitment)
  - Hotfix protocol (or "no hotfixes")
  - Approver (operator who declared)
- Audit-trail entry
- Manifest update with `current_mode = "freeze"` and `freeze_reason` populated
- If hosting supports branch protection: protection rules updated and recorded

## Validation Requirements

**Universal:**
- Freeze declaration artifact exists and is non-empty in all required fields
- Manifest's `freeze_reason` matches the artifact
- Thaw conditions are testable (not "when we feel ready" — must be specific)

**Hosting-specific (if applicable):**
- Branch protection enabled on the protected branch(es)
- Required reviews / required checks configured

## Completion Criteria
- Freeze declaration written
- Manifest updated
- Audit trail appended
- (Optional) Branch protection enforced at the hosting layer

## Allowed Transitions
- `freeze → pause` — when freeze conditions are partially met but full unfreeze is premature
- `freeze → resume` — **NOT ALLOWED** directly; must go freeze → pause → resume (intentional friction)
- `freeze → deploy-prep` — only if freeze was a pre-deploy lockdown and we're ready to ship
- `freeze → recovery` — if the frozen repo is found broken
- `freeze → handoff` — transferring ownership while frozen

## Risk Profile

| Risk | Mitigation |
|---|---|
| Freeze becomes de-facto abandonment | Set expected thaw date; audit trail surfaces "frozen N days, expected thaw was N-7 days ago" |
| "Hotfix" scope creep — "while we're hotfixing, also fix X" | Hotfix protocol defines max diff size and reviewer approval; reject scope creep |
| Branch protection mis-configured allows merges | Verify protection rules on entry (validation requirement) |
| Agents don't read the manifest before committing | Manifest is the contract; agents that ignore it are buggy — file an issue |
| Two parallel freezes (one per branch) confuse the manifest | Manifest supports `scope: { branches: [...] }` for branch-scoped freezes |
| Freeze used to avoid stabilize work that should happen | Audit trail entry must document a real reason; "we don't want to fix the tests" is not one |

## AI Agent Guidance

- **Do not declare a freeze unilaterally.** Freeze is HIGH-friction-for-agents. Always require human operator confirmation before declaring.
- **When operating during a freeze, default to read-only.** Only commit if (a) you are the named hotfixer in the freeze declaration, AND (b) the change matches the documented hotfix protocol.
- **If you find a non-hotfix issue during freeze, log it for later.** Do not fix. Add to a `post-thaw-backlog.md` or the repo's existing TODO file.
- **Never weaken the hotfix protocol to make a fix fit.** If the fix doesn't fit, the fix waits.
- **When in doubt, surface to operator.** Freeze is the mode where over-confirming is correct behavior.

## Human-in-the-Loop Touchpoints

- **Required to enter (when initiated by an agent):** explicit operator approval. Agent cannot self-declare a freeze without it.
- **Required for each hotfix:** explicit operator approval per fix, not blanket approval.
- **Required to thaw:** explicit operator action — verifying thaw conditions are met.
