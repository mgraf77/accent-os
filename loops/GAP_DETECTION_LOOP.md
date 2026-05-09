# GAP DETECTION LOOP

## Purpose
Compare canonical state against reality (existing build layer + filesystem) and emit a
gap list. A gap is a divergence between what canonical state claims and what is true.

## Inputs
- All `runtime-state/*` files.
- `audits/AUDIT_LOG.md` (since last gap run).
- Outputs of `scripts/status.sh`.

## Categories
- **G1 state.stale** — canonical state references a fact that no longer matches the repo.
- **G2 priority.adrift** — CURRENT_PRIORITIES item has no recent activity (per SESSION_LOG).
- **G3 risk.unowned** — risk has no owner or no review since last cycle.
- **G4 doc.divergent** — canonical state contradicts WIP or BUILD_PLAN.
- **G5 metric.unmeasured** — registered metric has no value at last checkpoint.
- **G6 register.untriaged** — gotcha register has unresolved entries older than 7 days.
- **G7 der.aged** — DER item in `near-term` queue older than 30 days without re-evaluation.
- **G8 boundary.violated** — a module imports across a documented boundary (when boundaries
  are declared; not before P2).

## Steps
1. Build current-fact snapshot from inputs.
2. For each canonical claim, compare against snapshot; emit a gap entry if divergent.
3. Run G1–G8 detectors.
4. Update `runtime-state/ACTIVE_RISKS.md` for any gap with severity ≥ MED (C2 mutation).
5. Write gap summary to `audits/AUDIT_LOG.md`.

## Outputs
- Gap list (in-memory + audit log).
- Risk updates (when severity warrants).

## Cadence
- Triggered by AUDIT_LOOP or manually before a Plan-Then-Execute.

## Severity Mapping
- G1, G4, G8 → default HIGH.
- G2, G3, G7 → default MED.
- G5, G6 → default LOW (escalate if recurring 3×).

## Failure Behavior
- Returns the partial gap list it has, marked `partial: true`. Never silent-fails.
