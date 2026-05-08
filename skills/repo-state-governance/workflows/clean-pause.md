# Workflow: clean-pause

## Identity
- **Name:** `clean-pause`
- **Motivating use case:** Operator needs to stop active work in a way that preserves resumability — e.g. end of session, taking a break, switching tasks, scheduled handoff.
- **Spans:** active work → `stabilize` → `pause`

## Inputs
- Manifest mode is one of: `stabilize`, `sandbox`, `audit`, or active feature work (which we treat as effectively stabilize for this workflow's entry)
- Optional: a reason for the pause (recorded in artifact)
- Optional: an expected resume time (recorded in artifact, helps audit-trail flag stale pauses)

## Outputs
- Updated `repo-manifest.json` with `current_mode = "pause"`
- Audit-trail entries for the workflow's mode transitions
- Pause-state artifact at `.governance/artifacts/[YYYY-MM-DD]-pause-state.md`
- (Optional) WIP commit tag if uncommitted work was preserved

## Phases

### Phase 1 — Stabilize
**Target mode:** `stabilize`

**Actions:**
- If working tree is dirty: decide commit vs. stash vs. WIP-tag (per `modes/stabilize.md` Allowed Actions)
- Run universal validation (tests + lint + type check)
- If validation fails: surface to operator — pause should not happen on a broken repo unless explicitly chosen

**Checkpoint:**
- Working tree is documented (clean OR captured in WIP commit/tag)
- Validation passed OR operator explicitly accepts pausing on broken state

**Exit criteria:**
- `stabilize` mode's Completion Criteria are satisfied — unless operator overrode after broken-validation

**If checkpoint fails:**
- Surface failures to operator
- Operator chooses: (a) fix and retry, (b) pause anyway with broken state documented, (c) abort workflow

### Phase 2 — Pause
**Target mode:** `pause`

**Actions:**
- Generate pause-state artifact using `templates/pause-state.template.md`
- Capture: what was in flight, why we stopped, what to do first on resume
- Tag a recovery point if WIP was preserved (`git tag wip/[date]/[branch]`)
- Update manifest with `current_mode = "pause"` + scope + entered_at + entered_by + next_allowed_transitions
- Append to audit trail

**Checkpoint:**
- Pause-state artifact exists, is non-empty in required fields
- Manifest is updated atomically with audit-trail entry

**Exit criteria:**
- `pause` mode's Completion Criteria satisfied

## Rollback strategy

- **If Phase 1 fails:** workflow halts before any manifest changes; no rollback needed
- **If Phase 2 fails after partial completion:** revert manifest to previous mode using audit-trail's previous-mode field; pause-state artifact (if written) remains as a draft, marked invalid in audit trail
- **If operator changes mind mid-workflow:** they can issue cancel; workflow halts at current phase, audit trail records the cancellation

## Success criteria
- Manifest mode = `pause`
- Pause-state artifact exists and is valid
- Audit trail has entries for both transitions (active → stabilize, stabilize → pause)
- Operator can run `safe-resumption` later without unknowns

## Common variations

### Express clean-pause (when stabilize is already complete)
If the repo is already in `stabilize` and validation passed recently (within manifest's `validation_freshness_minutes`), skip Phase 1's validation re-run. Always run Phase 2.

### Pause with broken state (escape hatch)
Operator explicitly accepts pausing despite validation failures. Audit-trail entry is annotated `pause: validation-failures-accepted`. Recommend recovery on resume.

### Pause-into-handoff
If the operator says "pause and hand it off," chain `clean-pause` into `ai-handoff` — pause first, then handoff.

## Related workflows
- **Before:** none typically — clean-pause is usually the first stop in a session-end sequence
- **After:** `safe-resumption` (when work resumes), `ai-handoff` (when pausing is into a handoff), `governance-migration` (rare; pausing during a governance change)
- **Instead of:** if work is *broken* not just *stopping*, run `repo-recovery` instead of clean-pause
