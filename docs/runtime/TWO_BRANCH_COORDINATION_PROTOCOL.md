# TWO-BRANCH COORDINATION PROTOCOL
> AccentOS — Smallest viable coordination protocol for two simultaneous Train branches.
> Human-operated. No runtime. No enforcement.
> Written: 2026-05-10

---

## FILE CLASS MODEL

Every file in the repo belongs to exactly one class. Classes define which branches can touch which files simultaneously.

| Class | Files | Concurrency rule |
|-------|-------|-----------------|
| **A** | `index.html`, `css/*.css` | ONE branch at a time — exclusive lock |
| **B** | `js/*.js` | Multiple branches allowed IF non-overlapping modules |
| **C** | `docs/runtime/*.md`, `WORK_IN_PROGRESS.md`, `SESSION_LOG.md` | Any branch, any time |

**Class A is the critical constraint.** Two branches writing to `index.html` simultaneously is a collision. It will produce conflicts that cannot be resolved safely.

---

## CONCURRENT BRANCH RULES

**Maximum 2 active Train branches at any time.**

| Train count | Allowed configuration |
|------------|----------------------|
| 1 | Any work — Class A, B, or C |
| 2 | Branch 1: Class A (index.html extraction). Branch 2: Class B only (js/*.js — metadata, registration, isolated module edits). |
| 3+ | NOT ALLOWED. Third branch must wait until one of the first two merges or freezes. |

**Class B branches cannot "sneak" Class A work.** If a Class B branch discovers it needs to edit `index.html`, it must stop, declare itself as needing Class A, and wait for the current Class A branch to merge first.

---

## SHARED-FILE AVOIDANCE PROCEDURE

Before cutting any new Train branch, run this check:

```bash
# Check who currently owns Class A:
git log --oneline --all -- index.html | head -5
# Look for commits on open branches (not yet merged to Integration)
# If any open branch has recent commits: Class A is owned — do not cut a new Class A branch

# Check specific module ownership for Class B:
git log --oneline --all -- js/[target-module].js | head -3
# If another open branch has recent commits to the same module: conflict risk
```

If Class A is owned: your options are:
1. Wait for the current Class A branch to merge
2. Open a Class B branch (js/*.js only) and work there while waiting

---

## MERGE ORDERING

When two Train branches are both ready to merge simultaneously:

**Rule: Class B merges first, then Class A rebases on the updated Integration.**

```
Train B (js/*.js only) — verified and ready
      │
      ▼ merge to Integration
      │
Integration HEAD advances
      │
Train A (index.html) — rebase on new Integration HEAD
      │   (only the script tag additions and inline deletions rebase —
      │    Class B's js/*.js changes don't conflict with index.html work)
      ▼ re-run exit gate → merge to Integration
```

**Why B first:** Class B branches don't touch index.html. Class A's rebase after B merges is always clean (zero conflicts on the Class A files).

**Exception:** If Class A is a rollback (reverting a broken extraction), it merges before any Class B work, regardless of readiness. Rollbacks have priority.

---

## VERIFICATION ORDERING

Two branches cannot verify against each other. Each verifies against its own state.

**Class B verification:** Run in isolation. Class B work (e.g., adding `register()` to js files) verifies independently — load the app, check `Object.keys(AOS_REGISTRY)`, done. No dependency on Class A state.

**Class A verification:** Must include all pages that use the extracted zone. Run against the current Train A HEAD. Class B's unmerged state is irrelevant — if Class A verifies cleanly, it's ready to merge.

**After both merge:** Integration-level smoke test. Both sets of changes are now in Integration HEAD. Run the full smoke test checklist once. This is the only time you need both changes active simultaneously.

---

## ESCALATION HANDLING

**Scenario: Two branches accidentally touch the same file.**

Detection:
```bash
git diff [branch-A] [branch-B] -- index.html | head -20
# If non-empty: collision detected
```

Resolution:
```
1. Stop both branches immediately.
2. Determine which change is higher priority:
   - Rollback/regression fix > feature extraction > metadata
3. Let priority branch merge first to Integration.
4. Second branch: re-cut from new Integration HEAD.
   (Do NOT cherry-pick across branches. Re-cut is cleaner.)
5. Re-run the second branch's corridor entry gate from the new base.
6. Document the collision in SESSION_LOG:
     "Collision on [file] between [branch-A] and [branch-B].
      Resolution: [branch] merged first. [branch] re-cut."
```

**Scenario: Class B branch discovers it needs to edit index.html.**

```
1. Stop Class B work immediately (commit wip: prefix, push, freeze).
2. Document the index.html change needed in WIP as: REQUIRES CLASS A WORK.
3. Wait for current Class A branch to merge.
4. Either: resume the frozen Class B branch as a Class A branch (re-cut from Integration HEAD)
   Or: add the index.html change as a new packet on the next Class A corridor.
```

---

## STALE-BRANCH INVALIDATION

A Train branch becomes stale when it cannot safely merge without risk of overwriting Integration changes.

**Staleness thresholds:**

| Class | Hard limit | Soft warning |
|-------|-----------|-------------|
| Class A (index.html) | 72 hours since cut | 48 hours |
| Class B (js/*.js) | 7 days since cut | 4 days |
| Analysis (docs) | No hard limit | Re-calibrate after each Integration merge |

**Staleness check:**
```bash
git log --format="%cr" origin/[branch] | head -1   # → "2 hours ago", "3 days ago"
git log Integration/HEAD..origin/[branch] --oneline | wc -l  # → commits ahead
git log origin/[branch]..Integration/HEAD --oneline | wc -l  # → commits behind
```

**Branch is stale if:** `commits-behind > 0` AND `age > threshold`.

**Stale resolution:**
```
Option A — Rebase (preferred if < 5 commits behind):
  git rebase Integration/HEAD
  Re-run corridor exit gate
  If exit gate passes: merge-ready again

Option B — Abandon and re-cut (if 5+ commits behind or rebase has conflicts):
  Document abandoned state in SESSION_LOG
  Cut fresh branch from Integration HEAD
  Re-execute the corridor (it's short — worth the clean start)
```

**Never force-merge a stale branch.** The Integration changes that happened during staleness may overlap with the stale branch's zones. A force-merge can silently overwrite Integration fixes.

---

## WHAT COORDINATION IS NOT

This protocol is a set of rules the operator checks before acting. It is not:
- Automated — nothing enforces these rules at commit time
- Transactional — there is no distributed lock on index.html
- Monitored — no process watches for violations

Violations are caught when the operator runs the checks above. The checks are the coordination.
