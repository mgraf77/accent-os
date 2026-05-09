# Patch Plan — patch-0001

> **Status: PROPOSAL ONLY.** Not applied this commit. Awaits human approval.
> tag: CORE

```
patch_id:       patch-0001
created_at:     2026-05-09
mode:           Plan-Then-Execute
linked_der:     der-0001 (promoted at P1; status: promoted)
class:          C5 (governance — affects every session via .claude/CLAUDE.md)
```

## intent
Insert a new top-of-AUTO-EXECUTE step that requires reading the canonical runtime
state before BUILD_PLAN_CLAUDE.md, anchoring every session in low-entropy state first.

## files_touched
- `.claude/CLAUDE.md`           class: C5

## reasoning
- The Runtime Stabilization Layer is dead weight if not read at session start.
- Without this, R4 (stale-doc-divergence) will worsen each cycle as canonical state
  drifts from BUILD_PLAN-driven sessions.
- Inserting **before** BUILD_PLAN ensures priority decisions reference current state,
  not a stale plan.
- Inserting **after** vibe-speak boot keeps the voice/calibration loop intact.
- Rejected alternative: separate slash-command (`/canonical`) — too easy to skip.

## reversibility
```
command: git revert <patch-0001 commit sha>
side_effects: none — CLAUDE.md is consumed by Claude Code at session start;
              reverting restores the prior auto-execute order on next session.
```

## verification
```
green_check:
  1. Land patch on a small no-op commit.
  2. Open a fresh Claude Code session.
  3. Confirm session output references CANONICAL_RUNTIME_STATE before BUILD_PLAN.
  4. Confirm vibe-speak boot still completes (steps 1a–1j unchanged).

expected_output:
  Session-start narration mentions reading runtime-state/CANONICAL_RUNTIME_STATE.md
  prior to BUILD_PLAN_CLAUDE.md, with no missed vibe-speak boot steps.
```

## risks
- **Risk-1 (LOW):** the canonical state file may be absent on a fresh clone before
  this branch merges. Mitigation: the patch wording allows a graceful skip if the
  file does not exist (text below tolerates missing file).
- **Risk-2 (LOW):** read-order change may surface other latent doc dependencies
  (e.g. a step that assumed BUILD_PLAN was the first repo read). Mitigation: a one-
  session smoke test before bumping LKG.
- **Risk-3 (LOW):** Increases warm-start token count slightly. Bounded by
  CANONICAL_RUNTIME_STATE's 200-line cap.

## mutation_risk_score
M6 estimate: **3** (C5 governance × 1 file × fully reversible × no security flag).

---

## Proposed CLAUDE.md Change (exact diff)

Insert a new step between current step 3 and step 4. Renumber subsequent steps.

```diff
@@ ## AUTO-EXECUTE ON START
@@ 3. Read WORK_IN_PROGRESS.md — if shows incomplete task, finish it before anything else
+4. Read `runtime-state/CANONICAL_RUNTIME_STATE.md` (if present) — anchor the session
+   in canonical low-entropy state. If absent, treat repo as `state: bootstrapping` and
+   continue without error.
-4. Read BUILD_PLAN_CLAUDE.md — find first [ ] item with no unresolved BLOCKS ON MICHAEL
+5. Read BUILD_PLAN_CLAUDE.md — find first [ ] item with no unresolved BLOCKS ON MICHAEL
-5. Read BUILD_INTELLIGENCE.md — apply all lessons before touching any code
+6. Read BUILD_INTELLIGENCE.md — apply all lessons before touching any code
-6. Run bash /workspaces/accent-os/scripts/status.sh
+7. Run bash /workspaces/accent-os/scripts/status.sh
-7. Begin building without waiting for Michael input
+8. Begin building without waiting for Michael input
-8. **At session end** ...
+9. **At session end** ...
```

Net effect: one inserted line + step renumbering. No deletions.

## Why This Is C5 (and not C4)
`.claude/CLAUDE.md` is consumed every session — it has higher operational reach than
any code file. MUTATION_POLICY classifies it as C5 (governance) explicitly for this
reason.

## Application Procedure (when approved)
1. Operator (or Claude in Plan-Then-Execute mode) applies the diff above.
2. Commit message: `chore(governance): pre-read canonical state before BUILD_PLAN (patch-0001)`.
3. Append RUNTIME_DELTA_REPORT entry under next checkpoint with `Governance: policy:
   .claude/CLAUDE.md changed via patch-0001`.
4. Mark der-0001 status `applied`.
5. Run one fresh session as the green check.
6. If green for one full cycle, consider it the trigger for an LKG bump (jointly with
   R1 closure).

## Application Block (NOT EXECUTED YET)
```
# Approval required before running.
# To apply manually after approval:
#   1. Edit .claude/CLAUDE.md per diff above.
#   2. Stage + commit:
#      git add .claude/CLAUDE.md
#      git commit -m "chore(governance): pre-read canonical state before BUILD_PLAN (patch-0001)"
#   3. Append delta entry to runtime-state/RUNTIME_DELTA_REPORT.md.
```
