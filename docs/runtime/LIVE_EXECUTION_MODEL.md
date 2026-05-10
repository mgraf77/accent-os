# LIVE EXECUTION MODEL
> AccentOS — Ground-truth operational flow for multi-branch decomposition.
> Human-operated. No runtime. No orchestration.
> Written: 2026-05-10

---

## BRANCH ROLES

Three branch types. Each has exactly one role. Roles do not cross.

| Branch type | Role | Touches |
|-------------|------|---------|
| **Train** | Active packet execution | index.html, js/*.js, docs/runtime/ |
| **Analysis** | Corridor planning and docs | docs/runtime/ only |
| **Integration** | Stable landing zone | Receives merges from Train only |

**Current instances:**
- Train: `claude/setup-codex-integration-gMAyH`
- Analysis: `claude/phase1-execution-playbooks-e3Olm`
- Integration: `main`

Analysis never commits to index.html or js/*.js. If it needs to verify anchors, it reads — it does not write.

---

## PROMOTION FLOW

```
Integration HEAD
      │
      ├── Analysis branch cuts from Integration HEAD
      │     └── writes corridor docs based on live grep of Integration HEAD
      │
      ├── Train branch (already exists, running ahead of Integration)
      │     └── reads corridor docs
      │     └── executes packets
      │     └── verifies per-packet
      │
      ▼
Train merges to Integration
      │
      └── Analysis re-calibrates immediately against new Integration HEAD
```

**Critical constraint:** Analysis must calibrate corridor docs against the **actual Train HEAD** if Train is ahead of Integration. Calibrating against Integration HEAD when Train has diverged produces stale corridors.

**How to get Train HEAD for calibration:**
```bash
git log origin/[train-branch] --oneline | head -1   # → actual Train HEAD
git show origin/[train-branch]:index.html | wc -l    # → actual inline size
git show origin/[train-branch]:index.html | grep -c "^const ROLES"  # → anchor check
```

---

## MERGE CHECKPOINTS

Four gates. All four must pass before a Train branch merges to Integration.

### Gate 1: Exit Gate
All corridor exit gate commands return expected values.
```bash
# Example — Cohort-2 registrations exit gate:
grep -rn "^register(" js/ | grep -v shell_utils | wc -l   # → 16
```

### Gate 2: Rollback Documented
SESSION_LOG.md has a rollback command for every commit on this branch.
No corridor packet is marked merged without its rollback hash recorded.

### Gate 3: No Drift
Integration HEAD has not received commits since this Train branch was cut — OR — a clean rebase has been done and verified.
```bash
git log Integration/HEAD..HEAD   # → 0 commits on Integration that aren't on Train
git log HEAD..Integration/HEAD   # → 0 commits on Train that aren't on Integration
```
If Integration moved: rebase Train, re-run exit gate.

### Gate 4: Smoke Test
At minimum: login → dashboard → one data-dependent page → logout.
Recorded in SESSION_LOG with pass/fail per page. No "probably fine" entries.

---

## ROLLBACK FLOW

Regression detected → **stop immediately** → do not attempt to fix forward.

```
1. DETECT
   Criteria: ReferenceError on any previously-working function, blank page,
   new 400/401/404 in network tab, or diff --stat shows wrong file count.

2. DOCUMENT (before reverting)
   Append to SESSION_LOG:
     REGRESSION: [function/page], [symptom], commit [hash]

3. REVERT
   git revert [extraction-commit-hash]
   git push origin [train-branch]

4. VERIFY REVERT
   Reload app. Confirm symptom is gone. Confirm reverted function is back.
   Document in SESSION_LOG: "Reverted [hash]. Symptom resolved."

5. ROOT CAUSE
   Before re-attempting: determine WHY the extraction failed.
   Document in WIP: FAILURE_CAUSE, REQUIRED_FIX.

6. RE-EXTRACT ONLY AFTER ROOT CAUSE IS DOCUMENTED
   New attempt goes on a fresh branch cut from Integration HEAD.
   Do not re-attempt on the original Train branch.
```

**Never debug a broken extraction into stability.** Revert is always faster.

---

## FREEZE BOUNDARIES

A freeze is not a failure. A freeze is controlled parking.

**Trigger any one of these → MUST FREEZE:**
- Session is ending and verification is incomplete
- An external hotfix is in flight that touches the same zones
- A merge conflict is detected that wasn't anticipated
- Train branch age hits 72 hours without merge
- The operator is unavailable to complete verification

**Freeze procedure:**
```
1. Commit all in-progress work with "wip: " prefix
2. Push the branch
3. Update WORK_IN_PROGRESS.md:
     STATE: FROZEN
     REASON: [one sentence]
     RESUME TRIGGER: [the condition that must be true before resuming]
     COMPLETED STEPS: [list]
     REMAINING STEPS: [list]
4. Do NOT merge
5. Do NOT delete the branch
```

**Resume procedure:**
```
1. Check that resume trigger condition is now true
2. git pull origin [train-branch]   — get latest (in case of hotfix rebase)
3. Re-run corridor entry gate        — confirm state is what you expect
4. Continue from REMAINING STEPS in WIP
```

---

## RECONCILIATION POINTS

Reconciliation is required when Analysis wrote corridors for a state that does not match Train.

**Detection:**
```bash
# Run on Analysis branch, checking against actual Train HEAD:
git show origin/[train-branch]:index.html | grep -c "^const ROLES"
# If result differs from what the corridor doc says: RECONCILIATION REQUIRED
```

**Reconciliation procedure:**
```
1. Read actual Train HEAD (grep anchors, wc -l, ls js/*.js)
2. Mark the stale corridor doc as EXPIRED in its header
3. Write a new corridor doc calibrated to actual Train HEAD
4. The old corridor is now archived — do not execute it
5. Log the reconciliation in SESSION_LOG:
     "Reconciliation: [old-corridor-doc] → [new-corridor-doc].
      Cause: [why it was stale]. Train HEAD at reconciliation: [hash]"
```

**Reconciliation does not require a branch switch.** Analysis branch writes the corrected corridor. Train branch reads it. No merge needed for docs-only reconciliation.

---

## WHAT INTEGRATION DOES NOT DO

Integration (main) is a landing zone. It does not:
- Initiate merges
- Validate corridor docs
- Trigger any automation
- Know about Train or Analysis branches

Integration only receives verified, complete, smoke-tested Train merges.
