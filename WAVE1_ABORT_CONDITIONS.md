# WAVE1_ABORT_CONDITIONS.md
> Session 31 — Wave 1
> Decision table for "stop / roll back / continue / escalate" during execution.

---

## DECISION CATEGORIES

- **STOP** — halt the wave immediately; no further steps.
- **ROLLBACK** — undo the failed step (and any dependents) per the rollback row in MERGE_EXECUTION_CHECKLIST_V1.md; do not continue.
- **CONTINUE** — non-blocking; log and proceed.
- **MANUAL** — STOP and request human decision before proceeding.

---

## CONDITIONS — WHAT STOPS THE WAVE

| # | Condition | Action |
|---|-----------|--------|
| S1 | Any cherry-pick produces a merge conflict NOT covered in MERGE_CONFLICT_RESOLUTION_PLAYBOOK.md | STOP + MANUAL |
| S2 | `git status` shows untracked deletions of files we did not touch | STOP + MANUAL |
| S3 | A Wave 1 step alters a file outside its declared scope (e.g., B1 touches `js/` or `sql/`) | STOP + ROLLBACK that step |
| S4 | Supabase staging not snapshotted before B2 (quote RPC) | STOP until snapshot exists |
| S5 | SQL files M45/M46 with BigCommerce content remain in `sql/` after F1 | STOP + ROLLBACK F1, redo |
| S6 | More than one writer of `window.__AOS_HYDRATED__` detected | STOP + MANUAL (signal ownership breach) |
| S7 | `MODULE_REGISTRY.ecommerce` duplicated or missing after C1 | STOP + ROLLBACK C1 |
| S8 | Post-merge sha256 of `index.html` matches pre-Wave baseline (i.e., index.html unchanged when it must have changed) | STOP + investigate |
| S9 | Any new adapter sets up a worker or interval before hydration | STOP + ROLLBACK C1 |
| S10 | `openRepOutreach` still present after B3 | STOP + ROLLBACK B3 |
| S11 | Production Supabase touched accidentally (not staging) | STOP + MANUAL (incident) |
| S12 | Boot sequence (WAVE1_POSTMERGE_BOOT_SEQUENCE.md) fails any RUNTIME or GOVERNANCE check | STOP + ROLLBACK to last green gate |

---

## CONDITIONS — WHAT ROLLS BACK (without stopping the wave)

These are step-local failures that resolve via the step's own rollback row. Resume from that step after fixing.

| # | Condition | Action |
|---|-----------|--------|
| R-a | Cherry-pick fails with a conflict listed in playbook Class 2 (index.html overlap) | Resolve per playbook → continue same step |
| R-b | Doc-import step (E1–E3) modifies a runtime file | ROLLBACK that step → re-run with stricter pathspec |
| R-c | SQL rename produces wrong filename | ROLLBACK F1 → redo via `git show` |
| R-d | Canon hash mismatch in CZ | Revert canon-update commit → recompute → recommit |
| R-e | A new adapter's `<script>` tag was inserted out of order | ROLLBACK the script-tag manual hunk → reapply in correct order |

---

## CONDITIONS — WHAT CAN CONTINUE

| # | Condition | Action |
|---|-----------|--------|
| C-a | Docs from E1–E3 carry minor markdown lint warnings | CONTINUE |
| C-b | New JS file has lint warnings (not errors) | CONTINUE; log to BUILD_INTELLIGENCE.md |
| C-c | KPI_CATALOG.md entry count unchanged (Wave 1 is additive but not required to add KPIs) | CONTINUE |
| C-d | Optional step E4 (stabilization docs) skipped | CONTINUE — this is the default |
| C-e | Boot timing slightly slower (< 20% delta vs baseline) | CONTINUE; flag to efficiency-monitor |

---

## CONDITIONS — WHAT REQUIRES MANUAL INTERVENTION

| # | Condition | Required of operator |
|---|-----------|----------------------|
| M-a | Two source branches both touch `sbFetch` body | Decide canonical version; document in playbook before resuming |
| M-b | New SQL collision (M49/M50 etc.) appears unexpectedly | Apply Conflict Class 1 rule + confirm with operator |
| M-c | Supabase RPC `upsert_quote_with_lines` signature changed between commits c0714b4 and f57b5bf | Diff and decide; do not auto-merge |
| M-d | A skill from `skills/_index.md` claims to own one of the touched signal namespaces | Confirm ownership before C1 |
| M-e | Optional E4 governance docs requested at last minute | Operator approves before E4 runs |
| M-f | Any production-impacting flag toggles surface in the diff | Operator approves; otherwise STOP |
| M-g | More than 3 ROLLBACKs trigger in a single wave attempt | Operator decides to STOP or continue (likely instability) |

---

## ESCALATION POLICY

- 1 ROLLBACK: routine, continue.
- 2 ROLLBACKs: continue with heightened scrutiny; log in BUILD_INTELLIGENCE.md.
- 3 ROLLBACKs: MANUAL gate (M-g).
- 1 STOP: wave halted; do not retry until root cause identified and added to playbook.

---

## ABORT PROCEDURE (full wave abandonment)

1. `git checkout main`
2. `git branch -m integration/reconcile-v2 integration/reconcile-v2-aborted-<timestamp>` (preserve forensics; do NOT delete).
3. Restore Supabase from snapshot only if any SQL migration was applied to staging (Wave 1 prep should NOT apply SQL — verify first).
4. Append abort record to SESSION_LOG.md with: trigger condition #, last green gate, last red gate, residual state.
5. Update BUILD_INTELLIGENCE.md with the lesson learned.
6. WORK_IN_PROGRESS.md: write "Wave 1 aborted at <step>; resume after <decision>."
