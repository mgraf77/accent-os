# Mode: sandbox

## Identity
- **Mode key:** `sandbox`
- **Risk tier:** LOW
- **Reversibility:** REVERSIBLE
- **Typical duration:** minutes to days
- **Concurrency:** MULTI_AGENT_OK (sandbox spaces are isolated by path/branch, so multiple agents can sandbox in different spaces)

## Purpose
Free-form experimental space. Sandbox relaxes most rules so agents and humans can prototype, spike, or try ideas without polluting the main repo state. Sandbox is **isolated** — work in sandbox does not leak into stabilize, deploy-prep, or any other mode.

Sandbox is also the **default fallback mode** when no manifest exists.

## Entry Conditions
- Sandbox is the most permissive mode to enter — almost no preconditions
- If scope is path-based (e.g. `experiments/`), the path exists or can be created
- If scope is branch-based (e.g. `spike/*`), the branch exists or can be created
- The sandbox scope is documented (whole-repo sandbox is rare and discouraged for non-trivial repos)

## Goals (ordered)
1. Provide a safe space to experiment without affecting main work
2. Document what's being tried (so the experiment leaves behind learnings, not just artifacts)
3. Cleanly transition to either:
   - `stabilize` — promote successful experiment to mainline
   - delete — abandon experiment and remove the sandbox scope cleanly

## Allowed Actions
- Create files in the sandbox scope
- Modify files in the sandbox scope
- Delete files in the sandbox scope (within sandbox itself)
- Try anything: new dependencies, refactors, new approaches, prototypes
- Commit to sandbox branches
- Append to audit trail (lightly — sandbox audit entries are short)
- Update manifest (only the `current_mode` and `scope` fields)

## Forbidden Actions
- Modifying files **outside** the sandbox scope (this is the entire point of sandbox)
- Merging sandbox branches into main without going through stabilize first
- Deploying anything from sandbox
- Treating sandbox as production
- Letting sandbox accumulate indefinitely (sandbox without a decision = clutter)
- Keeping secrets / credentials in sandbox files (sandbox is not a privacy boundary)

## Execution Priorities
1. **Stay in scope.** The first sign of sandbox-leakage is touching a file outside the sandbox path.
2. **Document the hypothesis.** Sandbox without a "what am I trying to learn" is just noise.
3. **Time-box.** Sandbox should resolve within hours-to-days; longer-running sandboxes deserve their own branch + plan.
4. **Decide explicitly.** Promote to stabilize OR delete. "Leave it for now" is a decision deferred, not a decision made.

## Documentation Requirements
- Lightweight: a README or comment in the sandbox scope describing what's being tried (no formal artifact required)
- Audit-trail entry: `[date] [previous-mode] → sandbox` with scope (path or branch) and short hypothesis
- Manifest update: `current_mode = "sandbox"`, `scope = { paths: ["..."] }` or `{ branches: ["..."] }`

## Validation Requirements

**Universal:**
- Sandbox scope is documented in the manifest (not implicit)
- No files outside the sandbox scope have been modified during the sandbox period

**Repo-specific:**
- If repo has a convention for experiment/spike directories, sandbox scope matches it (e.g. `experiments/`, `spikes/`, `_sandbox/`)

## Completion Criteria
Sandbox itself does not have a "completion" in the strong sense — it persists until explicitly transitioned out. The transition (sandbox → stabilize OR sandbox → delete) is what completes the sandbox episode.

For the **transition** to be valid:
- Decision documented (promote / abandon)
- If promoting: changes copied / cherry-picked / rebased into the path or branch they're going to live in long-term
- If abandoning: sandbox scope deleted (or branch deleted) and audit-trail entry confirms the decision

## Allowed Transitions
- `sandbox → stabilize` — promote experiment to mainline (must go through stabilize, not directly to deploy-prep / freeze / etc.)
- `sandbox → audit` — read-only inspection (rare, but allowed)
- `sandbox → (delete)` — abandon experiment; manifest returns to whatever the prior mode was

**Not allowed:**
- `sandbox → deploy-prep` directly
- `sandbox → freeze` directly
- `sandbox → extraction-prep` directly

## Risk Profile

| Risk | Mitigation |
|---|---|
| Sandbox work leaks into main | Hard rule: forbidden to modify files outside scope; validation checks |
| Sandbox accumulates as graveyard | Audit trail surfaces "sandbox open >30 days" as a flag |
| Successful experiment never gets promoted | Time-box; require an explicit decision |
| Failed experiment lingers as cruft | Time-box; if abandoned, delete cleanly |
| Sandbox used to evade governance ("I'll just sandbox this fix to skip review") | Sandbox cannot deploy; promotion to mainline goes through stabilize + normal review |
| Two agents sandbox the same scope | Manifest scope is single-occupancy; if two agents need sandboxes, use distinct scopes |
| Sandbox contains secrets that get committed | Sandbox is not a privacy boundary; secrets in sandbox = secrets in repo |

## AI Agent Guidance

- **Sandbox is your default fallback.** When the manifest is missing or you can't determine state, sandbox in a clearly-named scope and recommend manifest creation to the operator.
- **Be honest about what you're trying.** A one-line hypothesis ("trying X to see if it solves Y") is required.
- **Stay in your scope.** The single rule of sandbox is "don't touch files outside scope." If you find yourself needing to, exit sandbox first.
- **Decide quickly.** A 2-hour spike that runs for 2 weeks is not a spike, it's a project; promote it.
- **Clean up on abandon.** If you're abandoning, delete the sandbox scope. Don't leave dead branches / dead directories.
- **Promote intentionally.** Cherry-pick the parts that worked; don't just merge the whole sandbox branch into main.

## Human-in-the-Loop Touchpoints

- **Required:** none for entering sandbox.
- **Required to promote to stabilize:** normal stabilize-mode review applies (human review depends on repo's review rules).
- **Recommended:** if a sandbox runs longer than the repo's typical experiment window, surface to operator with the question "promote or abandon?"
