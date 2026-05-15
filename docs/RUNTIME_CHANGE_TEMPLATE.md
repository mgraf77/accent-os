# Runtime Change Template

> Required for any PR or commit that touches a file listed under
> `.orchestration/forbidden_runtime_patterns.json → runtime_files`.
> The runtime is small on purpose. Every addition must justify itself.
> See `RUNTIME_BOUNDARY_ENFORCEMENT.md` and `SIGNAL_RUNTIME_SIMPLICITY_GUARDRAILS.md`.

## 1. Summary
One-sentence description of the runtime change.

## 2. Boundary Justification
- Why does this belong in the runtime layer (not in a feature module)?
- Which boundary rule from `RUNTIME_BOUNDARY_ENFORCEMENT.md` is this honoring?
- What runtime invariant breaks if this lives elsewhere?

## 3. Non-Goals
Explicit list of things this change is **not** doing.
Examples:
- not adding a workflow / policy / rules engine
- not introducing feature-specific branches
- not expanding orchestration surface

## 4. Rollback Path
- Exact steps (commands / commits) to revert.
- Behavior after rollback.
- Is there any data, signal-name, or schema drift left behind? If yes, describe cleanup.

## 5. Ownership Declaration
- Owning file(s):
- Owning signal family (if any), per `signal_owners` in
  `.orchestration/forbidden_runtime_patterns.json`:
- Owner human (Michael / Claude / other):

## 6. Lifecycle Impact Declaration
- New lifecycle branches introduced (if / switch / case): count
- New signals emitted:
- New signals listened to:
- Synonym risk: does any new signal overlap an existing family in
  `signal_synonym_families`? Y/N — explain.
- Will `scripts/check-runtime-boundaries.sh` or
  `scripts/check-signal-ownership.sh` report new findings? Y/N — explain.

## 7. Verification
- [ ] Ran `bash scripts/check-runtime-boundaries.sh`
- [ ] Ran `bash scripts/check-signal-ownership.sh`
- [ ] Findings reviewed and either resolved or explicitly accepted above
