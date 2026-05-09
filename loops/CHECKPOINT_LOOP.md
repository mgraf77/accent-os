# CHECKPOINT LOOP

## Purpose
Compress the post-patch state into a new canonical checkpoint. Decide whether the
checkpoint qualifies as Last Known Good.

## Inputs
- Latest patch loop result.
- All `runtime-state/*` files.
- METRICS_REGISTER current values.

## Steps
1. **Compute metrics** — RCI, entropy_delta, complexity_velocity, reliability_velocity,
   governance_lag, runtime_health.
2. **Append delta** — write a new entry at top of `RUNTIME_DELTA_REPORT.md` per its schema.
3. **Overwrite canonical state** — write a fresh `CANONICAL_RUNTIME_STATE.md` using the
   updated facts. Increment `last_checkpoint_id`.
4. **LKG eligibility check** (per LAST_KNOWN_GOOD_STATE rules):
   - All P0/P1 priorities green or suspended.
   - No CRIT/HIGH risks unmitigated.
   - Verified-green evidence exists.
   - If all true → write new LKG and archive prior.
5. **Trigger gates** — if RCI < 1.0 or runtime_health < 0.6, surface as escalation E2.
6. **Hand back to runtime** — return new checkpoint id.

## Outputs
- New `CANONICAL_RUNTIME_STATE.md` (overwrite).
- New entry at top of `RUNTIME_DELTA_REPORT.md` (append).
- METRICS_REGISTER append.
- Optionally, new `LAST_KNOWN_GOOD_STATE.md`.

## Atomicity
- Steps 2–4 must commit together. If LKG bumps, that file is part of the same commit.
- Failure mid-commit → rollback to pre-checkpoint state and escalate (E7).

## Bootstrap (v0.1)
- Steps 2 + 3 are manual at v0.1 (specs only). Auto-execution begins at P3.
