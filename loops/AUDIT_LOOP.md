# AUDIT LOOP

## Purpose
Recurring read-only sweep that produces findings without mutating anything.

## Inputs
- `runtime-state/CANONICAL_RUNTIME_STATE.md`
- `WORK_IN_PROGRESS.md`, `BUILD_PLAN_CLAUDE.md`, `BUILD_INTELLIGENCE.md` (existing layer)
- `audits/GOTCHA_REGISTER.md` (last 20 entries)
- last 7 days of `SESSION_LOG.md`

## Steps
1. Read canonical state. If `state: bootstrapping`, log finding `boot.unseeded` and stop.
2. Compare top of WORK_IN_PROGRESS with section 3 of canonical state.
3. Run each detector in `audits/GOTCHA_REGISTER.md` against repo signals.
4. Append findings (one entry per detection) to `audits/AUDIT_LOG.md`.
5. Tag any finding with severity ≥ HIGH for ACTIVE_RISKS sync (does not write — that's GAP loop's job).

## Outputs
- 0+ entries appended to `audits/AUDIT_LOG.md`.
- A summary line on stdout (when invoked by status.sh).

## Cadence
- Light: every session start.
- Full: weekly, cycle start.

## Failure Behavior
- No mutations happen here. If reads fail, log finding `audit.read_failed` and exit non-zero.

## Bootstrap (v0.1)
- Detector logic in GOTCHA_REGISTER is specified but not yet automated. Loop runs
  manually-read-only by the human or AI session until P2 wires it to status.sh.
