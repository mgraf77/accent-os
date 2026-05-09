# LAST KNOWN GOOD STATE (LKG)

## Purpose
The exact state to roll back to in Emergency Recovery mode. Updated only on a verified-green
checkpoint. If unsure whether the current state is good, do not update this file.

## Required Sections
1. **Meta** — checkpoint_id, captured_at, captured_by_mode.
2. **Commit** — full SHA, branch, tag (if any), parent SHA.
3. **Verified-Green Evidence** — what was verified (tests passed, manual smoke, deploy reachable).
4. **State Snapshot Pointers** — paths to the runtime-state files at this checkpoint.
5. **Known Caveats** — anything green but partial; do not pretend it's perfect.
6. **Restore Procedure** — exact commands to return repo + deploys to this state.

## Update Rules
- Updated **only** when ALL of:
  - All P0/P1 priorities have a green status, OR are explicitly suspended.
  - No CRIT/HIGH risks are open without mitigation in flight.
  - Verified-green evidence is recorded (not assumed).
- Update is atomic: all sections written in one commit, signed-off by Clean Pause mode.
- Never update during Auto-Fix mode.

## Ownership Rules
- Write owner: Clean Pause mode (human-approved).
- Read owner: Emergency Recovery mode.

## Allowed Mutation Rules
- Replacement only — never partial edits.
- Old LKG records archived; current file always reflects newest verified-green checkpoint.

## Compression Standards
- Hard cap: 60 lines.
- Restore procedure: bash-only, copy-pasteable, no prose.

## Archival Rules
- Each replacement archives the prior LKG to `audits/lkg-archive/<checkpoint_id>.md`.
- Retention: last 20 LKG records on disk; older summarized in AUDIT_LOG.

## Restore Contract
A valid restore procedure must:
- Reach a working tree at the recorded SHA without manual conflict resolution.
- State which deploy artifacts (worker, pages, etc.) need redeploy.
- State which env/secrets must be re-checked (never written in this file).

## Initial Content (v0.1, unseeded)
First LKG to be captured at end of P1 rollout, when the layer is bootstrapped without
disturbing the active build.
