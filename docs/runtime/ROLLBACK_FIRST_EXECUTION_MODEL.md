# ROLLBACK-FIRST EXECUTION MODEL
> AccentOS — Reversible Decomposition + Entropy-Aware Doctrine  
> Status: PLANNING ONLY — no implementation authorized from this document  
> Last updated: 2026-05-10

---

## THE ROLLBACK-FIRST PRINCIPLE

> **Every extraction starts with its rollback command.**

Before a single line of code is moved, the operator writes the exact `git revert` or manual revert steps in SESSION_LOG.md. This is not documentation hygiene — it is a forcing function. If you cannot describe how to undo the extraction, you do not yet understand it well enough to execute it.

---

## DECISION MATRIX: THE FOUR STATES

Every decomposition packet at every moment is in exactly one of four states:

### STATE 1: SAFE TO CONTINUE

**Definition:** The extraction is in progress, all verification checks so far are passing, no blocking conditions have appeared.

**Criteria for SAFE:**
- No console errors introduced by changes so far
- Any checks run show expected results
- No new feature branches touching the same file have been cut
- Time elapsed since branch cut < 48 hours
- `main` has not received commits since this branch was cut (or a clean rebase was just done)

**Action:** Continue executing the packet steps in order.

---

### STATE 2: MUST FREEZE

**Definition:** A blocking external condition has appeared that is not a code error — the packet is otherwise correct but cannot safely merge right now.

**Criteria for MUST FREEZE:**
- A hotfix or feature branch targeting `index.html` has been cut from `main` and is not yet merged
- Michael has started building on the page being extracted
- A Supabase migration is being run that may affect the auth/data layer being extracted
- The session is ending before verification is complete
- Branch age has hit 48 hours without merge

**Action:**
1. Commit all in-progress changes to the packet branch with `wip:` prefix in commit message
2. Push the branch
3. Update `WORK_IN_PROGRESS.md` with the freeze reason and resume trigger
4. Do NOT merge
5. Do NOT delete the branch
6. Resume when blocking condition is resolved

**Freeze is not failure.** A frozen packet is safe. An unverified merge is not.

---

### STATE 3: MUST ROLLBACK

**Definition:** The extraction has introduced a verifiable regression — a function that worked before now does not work, or errors that did not exist before now appear.

**Criteria for MUST ROLLBACK:**
- Console shows `ReferenceError: [function] is not defined` that was not present before extraction
- A page that previously loaded data now shows empty or throws errors
- Login, session restore, or role gating behavior has changed
- Any modal, toast, or navigation that worked before now fails
- Network tab shows 400/401/404 that were not present before

**Action:**
```bash
# If the extraction was one clean commit:
git revert [extraction-commit-hash]
git push origin [branch-name]

# If the extraction was multiple commits on a branch:
git checkout main
git branch -d [packet-branch]
git checkout -b [packet-branch-v2]
# Start the extraction fresh
```

**Do not debug a broken extraction into stability.** The time cost of debugging is always higher than the time cost of reverting and re-extracting cleanly. Rollback is not defeat — it is the correct move.

---

### STATE 4: UNSAFE TO MERGE

**Definition:** The extraction work is complete and passes local checks, but a condition exists that makes merging to `main` unsafe right now.

**Criteria for UNSAFE TO MERGE:**
- `main` has received commits since this branch was cut and no rebase has been done
- The pre-merge checklist (see MERGE_SAFE_DECOMPOSITION.md) has unchecked items
- SESSION_LOG.md entry has not been written for this packet
- Rollback command has not been documented
- Verification checks were run but not all passed (even if "close enough")

**Action:** Do not merge. Address each unsafe condition:
- Age drift: `git rebase origin/main`, re-run verification
- Missing SESSION_LOG entry: write it before merging
- Failed verification: freeze or rollback depending on cause

**"Almost passing" is not passing.** An unsafe merge on a decomposition packet is worse than not extracting at all — it introduces ambiguity about what the codebase state is, which costs more time to recover from than a clean rollback.

---

## REVERSIBLE DECOMPOSITION DOCTRINE

### Rule 1: One Revert = Full Undo

Every packet commit must be revertible with a single `git revert [hash]`. If a packet spans multiple commits, they must be squashed before merge or the revert command must be documented for each commit hash in order.

### Rule 2: No Forward-Only State

A packet extraction must not introduce any state that cannot be reverted. Examples of forbidden irreversible actions during decomposition:
- Deleting a function without copying it to the output file first
- Running a database migration as part of a decomposition packet
- Renaming a function (old name is now broken for callers that haven't been updated)

### Rule 3: Dual-Write Window

During the extraction commit, the function exists in BOTH places briefly — in the new JS file and still in the index.html inline block — until the delete-from-inline step runs. This is intentional for complex extractions. The dual-write window allows verification of the new file before the inline copy is removed. Maximum dual-write window: one commit. The cleanup (removing from inline) must be the immediately following commit.

### Rule 4: Rollback Commands in SESSION_LOG Before Merge

The session log entry for a packet merge must include:
```
Rollback: git revert [hash]
```
If the hash isn't known yet (branch not merged), write the manual revert steps instead. This entry must exist before the merge happens, not after.

---

## ENTROPY-AWARE EXECUTION

**Entropy** in this context means: accumulated risk from deferred decisions, partial states, unverified assumptions, and aging branches.

AccentOS has 37 external modules and a 7,169-line index.html. The entropy budget is limited. Every skipped verification step, every "I'll fix that later," every frozen branch left open — these accumulate as entropy. High-entropy state is when small changes have unpredictable consequences.

### Entropy Signals (Warning Signs)

| Signal | What it means |
|---|---|
| "I'll verify after the next step" | Skipping a verification checkpoint — adds entropy |
| "This other thing is probably fine" | Unverified assumption — adds entropy |
| "I'll just quickly fix this too" | Scope creep during extraction — adds entropy |
| A decomposition branch aging past 48h | Context drift + rebase risk — adds entropy |
| Two sessions working on index.html simultaneously | High collision risk — maximum entropy |
| "It seems to work" | Qualitative verification instead of measurable checks — adds entropy |

### Entropy-Reduction Rules

1. **Verify before continuing.** No "I'll check it at the end." Check at each verification step.
2. **Scope is sacred.** If you discover something to fix during an extraction, note it in `WORK_IN_PROGRESS.md` and continue the extraction verbatim. Fix it on a separate branch after this packet merges.
3. **Close stale branches.** A decomposition branch that isn't going to merge today should be closed, not left open as "I might come back to it."
4. **Never merge under uncertainty.** If there is any doubt about the merge being clean, it is not clean. Address the doubt first.

---

## BOUNDED MUTATION DOCTRINE

A decomposition packet is bounded when:
- Its change surface is exactly 2 files (index.html + one new JS file)
- Its change to index.html is exclusively deletions (plus one `<script src>` tag addition)
- Its new JS file contains exclusively the code that was deleted from index.html
- It introduces no new logic, no new behavior, no new dependencies

**Mutation boundary enforcement:**

Before committing a packet, run:
```bash
git diff --stat
```
Expected output:
```
 index.html    | [N] deletions(-), [1-2] insertions(+)    # the <script src> line
 js/[file].js  | [N] insertions(+)
 2 files changed, [N] insertions(+), [N] deletions(-)
```

If the diff shows a third file or modifications to an existing `js/` file — the packet has escaped its boundary. Stop. Separate the boundary violation into its own branch. Do not merge a boundary violation as part of a decomposition packet.

---

## FREEZE-SAFE IMPLEMENTATION RULES

A frozen packet must be safe to resume by a different operator (or the same operator after 48 hours) without losing context.

### Freeze Artifact Requirements

When a packet is frozen, the following must be written before the session ends:

**1. WORK_IN_PROGRESS.md entry:**
```
PACKET: [packet name]
STATE: FROZEN
REASON: [one sentence — what caused the freeze]
RESUME TRIGGER: [the condition that must be true before resuming]
COMPLETED STEPS: [list what has been extracted so far]
REMAINING STEPS: [list what still needs to be extracted]
BRANCH: [branch name]
ROLLBACK: git revert [hash] OR [manual steps if not yet committed]
```

**2. The partial extraction committed and pushed** — even if incomplete, the work-in-progress state is preserved in the branch so another operator doesn't duplicate work.

**3. No merge until unfreezing** — a frozen branch never merges. It either resumes and completes, or it is abandoned and the packet is re-extracted from scratch on a fresh branch.

---

## IDEAL EXECUTION PACKETS

### Ideal Phase 1 Bounded Execution Packet

```
PACKET: CSS Extraction
BRANCH: decomp/css-extraction
DURATION: < 1 hour
COMMIT 1:
  - Create css/accent-os.css (copy of <style> block verbatim)
  - Replace <style>…</style> in index.html with <link rel="stylesheet" href="css/accent-os.css?v=1.0.0">
  - Commit message: "decomp(css): extract inline styles to css/accent-os.css"
VERIFICATION:
  - Load app: no visual regression on any page
  - DevTools: accent-os.css 200 OK
  - DevTools: no inline <style> in <head>
MERGE:
  - git rebase origin/main
  - Pre-merge checklist: all checked
  - Merge to main
  - Tag: v-decomp-css-done
SESSION_LOG entry:
  "Merged: decomp/css-extraction. Rollback: git revert [hash]"
NEXT:
  - Cut decomp/utils-extraction from new main
```

---

### Ideal Decomposition Rollback Packet

```
SCENARIO: Utils extraction broke all 37 external modules (ReferenceError on boot)
DETECTION: Console shows "esc is not defined" on page load
STATE: MUST ROLLBACK

STEP 1: Document the failure
  WORK_IN_PROGRESS.md → "Utils extraction failed: esc not in scope on load. Rolling back."

STEP 2: Execute rollback
  git revert [utils-extraction-commit-hash]
  # OR if on feature branch, not yet merged to main:
  git checkout main
  git branch -D decomp/utils-extraction

STEP 3: Verify rollback
  Load app → no console errors → typeof esc === 'function' → CONFIRMED

STEP 4: Root cause analysis (before next attempt)
  Likely cause: <script src="js/utils.js"> tag was placed AFTER other module scripts
  Fix: Place utils.js script tag as the FIRST script in <head>

STEP 5: Re-extract on fresh branch
  git checkout main
  git checkout -b decomp/utils-extraction-v2
  Apply fix: utils.js script tag before all other module scripts
  Re-run verification → all 5 typeof checks pass
  Merge
```

---

### Ideal Unsafe Merge Escalation Packet

```
SCENARIO: Auth extraction branch is ready but main received a hotfix to the login flow
           2 days after this branch was cut, before it was merged.
STATE: UNSAFE TO MERGE

DETECTION:
  git log main..HEAD  → shows 0 commits on branch ahead of main that aren't on main
  git log HEAD..main  → shows 1 commit (hotfix) on main that isn't on this branch
  The hotfix changed doLogin() — the exact function being extracted in this packet

ESCALATION STEPS:
  1. DO NOT MERGE the extraction branch as-is.
     The branch contains the pre-hotfix version of doLogin().
     Merging it would silently overwrite the hotfix.

  2. Assess the conflict:
     git diff main -- index.html   → shows the hotfix change to doLogin()
     git diff main -- js/auth.js   → shows this branch's version of doLogin()

  3. Options:
     A. Abandon and re-extract:
        - Close the extraction branch
        - git checkout main (which has the hotfix)
        - git checkout -b decomp/auth-extraction-v2
        - Re-extract from the current main — auth.js will now include the hotfix
        - Preferred: clean, no risk of silent regression

     B. Cherry-pick the hotfix onto the extraction branch (only if the change is trivial):
        - git cherry-pick [hotfix-commit-hash]
        - Resolve conflict (doLogin() in both auth.js and index.html)
        - Re-run all auth verification checks
        - Only use this path if the hotfix was a 1-line change

  4. Document the escalation in SESSION_LOG.md before taking any action.

  5. After resolution (whichever path), re-run the full pre-merge checklist before merging.

RULE: When in doubt between Option A and Option B, always choose Option A.
      A clean re-extraction takes 30 minutes.
      An undetected regression from Option B takes hours to diagnose.
```
