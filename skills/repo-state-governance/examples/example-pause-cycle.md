# Example: Pause + Resume cycle

End-to-end demonstration of the `clean-pause` and `safe-resumption` workflows.

---

## Setup

### Initial state (before pause)

**Repo:** `acme-app`
**Branch:** `feature/user-onboarding`
**Manifest:**
```json
{
  "schema_version": 1,
  "current_mode": "stabilize",
  "entered_at": "2026-05-08T13:00:00Z",
  "entered_by": "claude-code:michael",
  "previous_mode": "audit",
  "next_allowed_transitions": ["pause", "freeze", "deploy-prep", "handoff", "audit", "sandbox"],
  "validation_tier": "language-specific"
}
```

**Working tree:**
- `src/onboarding/wizard.tsx` — modified (in flight: extracting `<StepIndicator>` component)
- `src/onboarding/wizard.test.tsx` — modified (4 of 6 new tests written, all passing)
- 2 commits ahead of `main`

**Last commit:** `e3f4a5b "Refactor: extract StepIndicator component (4/6 tests done)"`

---

## Trigger

Michael at 16:55Z: "Heading out for the day. Pause this cleanly so I can pick up tomorrow."

---

## Workflow: clean-pause

### Phase 1 — Stabilize

Agent runs:
- `git status --porcelain` → 2 modified files
- Universal validation:
  - `npm test` → passing (the 4 written tests pass; the unwritten 2 are not yet in the file)
  - `npm run lint` → passing
  - `npm run typecheck` → passing
- Decision: working tree is dirty but in-flight work is meaningful (4 of 6 tests passing); decide to commit as WIP

Agent commits:
```
WIP: extract StepIndicator (4/6 tests done; 2 remaining)
```

Tags: `git tag wip/2026-05-08/feature-user-onboarding`

**Phase 1 checkpoint:** Working tree clean (post-commit), validation passing, WIP captured. ✓

### Phase 2 — Pause

Agent generates pause-state artifact at `.governance/artifacts/2026-05-08-pause-state.md`:

```markdown
# Pause State

**Schema version:** 1
**Paused at:** 2026-05-08T17:00:00Z
**Paused by:** claude-code:michael
**Repo:** acme-app

## Repo state at pause

- Branch: feature/user-onboarding
- HEAD commit: f7d8e9c "WIP: extract StepIndicator (4/6 tests done; 2 remaining)"
- Working tree: clean
- WIP commit: f7d8e9c
- Tag preserving WIP: wip/2026-05-08/feature-user-onboarding
- Universal validation: passing

## Why we stopped

End of work day. Resuming tomorrow morning.

## What was in flight

- What I was doing: extracting `<StepIndicator>` from `wizard.tsx` into its own component file at `src/onboarding/StepIndicator.tsx`
- How far I got: ~70%. Component file created; props interface defined; consumers updated; 4 of 6 tests written.
- What works: existing wizard tests still pass; first 4 StepIndicator tests pass
- What doesn't work yet: tests for "active step changes" and "click-to-jump" interactions are not yet written

## Next action on resume

**Next:** Write the remaining 2 tests at `src/onboarding/StepIndicator.test.tsx`:
- Test: "highlights active step" — assert step N has `data-active=true`
- Test: "click-to-jump fires onJump prop with target index"

Reference test pattern: lines 28-44 in the same file (existing tests follow the same structure).

**Then:** Run `npm test src/onboarding/StepIndicator.test.tsx` to verify all 6 pass; squash WIP into a clean commit; open PR.

## Open decisions / blockers

- Decision: should `<StepIndicator>` accept `onJump` as required or optional? Current implementation: optional (no-op default). Consumers expect optional. Keep as-is unless a real need emerges.

## Gotchas to remember on resume

- The wizard test file uses a custom `renderWithRouter` helper from `test-utils.tsx:18` — don't import @testing-library/react's `render` directly here.
- The `data-active` attribute is read by an e2e test in `e2e/onboarding.spec.ts:42` — don't rename it.

## Expected resume window

Tomorrow morning, ~09:00Z.

## References

- Audit trail: .governance/audit-trail.md (this session entries: 2026-05-08T13:00 → T17:00)
- Decision log: decisions/2026-05-08-extract-step-indicator.md
```

Agent updates manifest:
```json
{
  "schema_version": 1,
  "current_mode": "pause",
  "entered_at": "2026-05-08T17:00:00Z",
  "entered_by": "claude-code:michael",
  "previous_mode": "stabilize",
  "next_allowed_transitions": ["resume", "handoff", "freeze"],
  "validation_tier": "language-specific"
}
```

Agent appends to audit trail:
```markdown
## 2026-05-08T17:00:00Z stabilize → pause
- operator: claude-code:michael
- workflow: clean-pause
- artifacts: .governance/artifacts/2026-05-08-pause-state.md
- entry-conditions: pass
- completion: complete
- notes: end of work day; expected resume tomorrow ~09:00Z
```

Pause-readiness evaluator: READY.

Agent surfaces to Michael: "Paused. Pick-up note at `.governance/artifacts/2026-05-08-pause-state.md`. Manifest in pause; allowed next transitions: resume, handoff, freeze. WIP tagged `wip/2026-05-08/feature-user-onboarding`."

---

## (Next morning)

Michael at 09:15Z: "Resume."

---

## Workflow: safe-resumption

### Phase 1 — Read prior artifact

Agent reads `.governance/artifacts/2026-05-08-pause-state.md` in full. Confirms operator identity (claude-code:michael, same as outgoing). Notes the next action: write 2 remaining StepIndicator tests.

### Phase 2 — Lightweight audit (drift check)

Agent updates manifest: `current_mode = "audit"` (transient), entered_by, entered_at.

Audit-trail entry: `pause → audit`.

Drift checks:
- `git fetch --all` → 1 new commit on `main`: "Update README badges"
- `git log feature/user-onboarding..main` → 1 commit, low impact (no functional code change)
- `npm test` → all passing
- `npm run lint` → passing
- `package-lock.json` vs. installed deps → in sync

Drift summary: low — 1 cosmetic main update, no impact on the in-flight feature.

### Phase 3 — Resume

Agent updates manifest: `current_mode = "resume"` (transient).

Audit-trail entry: `audit → resume`.

Validates next action: `src/onboarding/StepIndicator.test.tsx` exists; lines 28-44 still match the structure described; the existing 4 tests still pass. "Next action" is current.

### Phase 4 — Transition to active mode

Agent transitions to `stabilize` (since the resuming work is feature work, which lives under stabilize for ongoing development).

Updates manifest:
```json
{
  "schema_version": 1,
  "current_mode": "stabilize",
  "entered_at": "2026-05-09T09:20:00Z",
  "entered_by": "claude-code:michael",
  "previous_mode": "resume",
  "next_allowed_transitions": ["pause", "freeze", "deploy-prep", "handoff", "audit", "sandbox"],
  "validation_tier": "language-specific"
}
```

Audit-trail entries (the full chain):
```markdown
## 2026-05-09T09:15:00Z pause → audit
- operator: claude-code:michael
- workflow: safe-resumption
- artifacts: (none)
- entry-conditions: pass
- completion: complete
- notes: drift-check; 1 cosmetic main commit, no impact

## 2026-05-09T09:18:00Z audit → resume
- operator: claude-code:michael
- workflow: safe-resumption
- artifacts: (none — handoff inline in audit trail)
- entry-conditions: pass
- completion: complete
- notes: next action validated; in-flight files unchanged

## 2026-05-09T09:20:00Z resume → stabilize
- operator: claude-code:michael
- workflow: safe-resumption
- artifacts: (none)
- entry-conditions: pass
- completion: complete
- notes: returning to active feature work
```

Agent surfaces to Michael: "Resumed. Drift was minimal (1 cosmetic main commit). Next action confirmed valid: write 2 remaining StepIndicator tests in `src/onboarding/StepIndicator.test.tsx` (highlights-active, click-to-jump). Manifest in stabilize."

---

## Outcome

- 14h pause cycle completed cleanly
- Resuming operator (same agent identity, but functionally a new session) had complete context
- 1 commit of drift was identified and surfaced, not silently absorbed
- Pause-state artifact remains in `.governance/artifacts/` as historical record

## What this example demonstrates

- The pause-state artifact captures both **code state** (commit, branch, validation) and **mental state** (next action, gotchas, open decisions)
- The safe-resumption workflow's audit phase is brief but mandatory — it caught the upstream commit that the resuming session would have otherwise missed
- The full audit trail (5 entries across the cycle) tells the story without losing fidelity
- WIP commit + tag pattern: even cosmetic ("nothing important happened") sessions produce auditable history
