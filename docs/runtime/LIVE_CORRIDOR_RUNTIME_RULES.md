# LIVE CORRIDOR RUNTIME RULES
> AccentOS — Hard operational rules for corridor execution.
> These rules are non-negotiable. Each rule has a specific trigger and response.
> Human-operated. No exceptions clause.
> Written: 2026-05-10

---

## REALITY AUDIT · 2026-05-10

**Notation:** `[PROVEN]` = observed · `[EXPERIMENTAL]` = defined, not yet hit in practice · `[CONCEPTUAL]` = target only

| Rule | Status | Trigger observed? | Response validated? |
|------|--------|-------------------|---------------------|
| R1 — Max 2 concurrent trains | EXPERIMENTAL | not yet (only 1 train run) | not yet |
| R2 — One Class-A owner | PROVEN | ✓ (single train, single Class-A owner) | ✓ (maintained by discipline) |
| R3 — Halt on trigger | PROVEN | ✓ (halt + rollback executed in prior sessions) | ✓ |
| R4 — Age 5+ = EXPIRED, no exceptions | EXPERIMENTAL | decay model defined; 5+ not hit | not yet |
| R5 — Reduce to single train when Train 1 in trouble | EXPERIMENTAL | not yet — N=2 not run | not yet |
| R6 — Invalidation is immediate | PROVEN | ✓ (invalidation triggers deterministic) | ✓ |
| R7 — Planning stale at 2+ merges behind | EXPERIMENTAL | once (session 3); threshold formal | not yet |
| R8 — Reconciliation cannot be skipped | PROVEN | ✓ (reconciliation run in session 3) | ✓ |
| R9 — Never merge under uncertainty | PROVEN | ✓ (merge gates maintained) | ✓ |
| R10 — Freeze/rollback always available | PROVEN | ✓ (git revert; freeze used) | ✓ |
| R11 — Max 2 corridors ahead | EXPERIMENTAL | violated once (sessions 2–3); now capped | not yet at scale |

**Rules R1, R4, R5, R7, R11 are EXPERIMENTAL — the triggers have not been exercised under the formal protocol. Rules R3, R6, R8, R9, R10 are PROVEN in completed sessions.**

---

## RULE 1 — MAX CONCURRENT TRAINS: 2

At most two Train branches active simultaneously. Never three.

**Enforcement:**
```bash
git branch -a | grep "claude/" | grep -v "phase1-execution-playbooks"
# Count open branches — if 2 already exist: do not cut a third
```

If a third is needed: one of the first two must reach MERGED or ABANDONED before the third is cut.

---

## RULE 2 — ONE CLASS-A OWNER: ALWAYS

Only one Train branch can have uncommitted (or unmerged) changes to `index.html` at any time.

**Enforcement:**
```bash
git log --oneline --all -- index.html | head -10
# If any non-Integration branch appears with recent commits: Class A is owned
```

Violation is not resolved by "we'll be careful." It is resolved by one of the following:
- The existing Class A branch merges to Integration, then the new branch opens
- The new work is redesigned to be Class B only (js/*.js), which requires no index.html changes

---

## RULE 3 — HALT IMMEDIATELY ON ANY OF THESE

Stop. Do not commit. Do not continue to the next step. Investigate.

| Trigger | Command that reveals it |
|---------|------------------------|
| ReferenceError for a function that worked before extraction | Browser console |
| Page that previously loaded data now shows blank or throws | Browser — reload |
| `wc -l index.html` is MORE than expected post-extraction (extraction overshot) | `wc -l index.html` |
| `git diff --stat` shows 3+ files when exactly 2 were expected | `git diff --stat` |
| `<<<<<<` merge conflict markers in any file | `grep -rc "^<<<<<<<" .` |
| New 400, 401, or 404 in Network tab that weren't there before extraction | DevTools Network |

**Response to any halt trigger:**
1. Do not commit in this state
2. Assess: is this MUST ROLLBACK or a fixable pre-commit issue?
3. If fixable (missed line, wrong file): fix, re-verify, then commit
4. If regression (app behavior changed): execute rollback flow

---

## RULE 4 — CORRIDOR AGE HARD STOP: 5+ COMMITS

A corridor with age ≥ 5 commits (to its affected files) cannot be executed.

**No exceptions.** "It probably still works" is not a bypass. Age 5+ means re-calibrate.

**Check before executing any corridor:**
```bash
git log --oneline -- index.html | head -10   # for Class A corridors
git log --oneline -- js/[affected-file].js | head -10  # for Class B
# Count commits since corridor's calibration_commit in the header
```

**Recovery from EXPIRED corridor:**
1. Mark corridor header: `State: EXPIRED`
2. Run calibration commands from scratch (wc -l, grep anchors)
3. Write a new corridor doc with today's date and current HEAD
4. The old corridor is now archived — do not use it

---

## RULE 5 — REDUCE TO SINGLE TRAIN WHEN

Reduce from 2 active trains to 1 when ANY of these are true:

| Condition | Why |
|-----------|-----|
| Train 1 is in MUST ROLLBACK state | Full attention required on recovery |
| Train 1's halt trigger fired and cause is unknown | Unknown regression is contagious — stop all changes |
| Integration received an emergency fix to a zone Train 1 is extracting | Collision risk — Train 1 must rebase before continuing |
| Train 1's age approaches 72 hours | Imminent staleness — prioritize merge over Train 2 progress |
| Two trains both touch the same module | Stop Train 2 immediately |

**Reduce procedure:**
1. Freeze Train 2 (commit wip:, push, document resume trigger in WIP)
2. Resolve Train 1's situation to completion (merge or abandon)
3. Resume Train 2 after Train 1 is resolved

---

## RULE 6 — CORRIDOR INVALIDATION IS IMMEDIATE

When an invalidation trigger fires, the corridor is EXPIRED. No partial status. No "let me check if it still works."

**Invalidation triggers:**
- Output file already exists (`ls js/[planned-file].js` → exists)
- Zone anchor function is missing from inline (`grep -c "^function [anchor]" index.html` → 0 but output file doesn't exist)
- Another branch touched the same zone since calibration
- `wc -l index.html` differs by >50 lines from what the corridor expects at entry

**Response to invalidation:** See Rule 4 recovery.

---

## RULE 7 — PLANNING BECOMES STALE AFTER 2 INTEGRATION MERGES

If Analysis branch has not re-calibrated its corridor docs against Integration HEAD within 2 Integration merges, any corridor it contains is marked CRITICAL debt and cannot be consumed by a Train branch.

**Count:**
```bash
git log Integration/HEAD --oneline | head -5
# Find the Analysis branch's last calibration commit in this list
# If 2+ merges have landed since that commit: CRITICAL debt
```

**Response:** Analysis branch operator re-calibrates immediately before Train consumes any corridor from that branch.

---

## RULE 8 — RECONCILIATION CANNOT BE SKIPPED

When Train consumed a corridor that was calibrated for the wrong state, reconciliation is mandatory.

Reconciliation is not:
- Re-reading the stale corridor and hoping it still applies
- Skipping a verification step because "this part is probably still right"
- Adjusting the corridor's expected values after the fact

Reconciliation IS:
- Reading actual Train HEAD (fresh grep, fresh wc -l)
- Writing a new corridor doc from actual anchors
- Marking the old corridor EXPIRED
- Running the new corridor's entry gate before proceeding

Time cost: 15 minutes. The cost of proceeding on a stale corridor: unknown regressions that take hours to trace.

---

## RULE 9 — NEVER MERGE UNDER UNCERTAINTY

Merge readiness requires all checklist items to be true. No item can be "probably true" or "skipped this time."

**Items that are frequently skipped incorrectly:**
- "Rollback is documented" — many merges happen without a recorded rollback hash
- "Smoke test is recorded" — "I tested it" is not a smoke test record
- "No drift" — "main probably hasn't changed" is not a verification

If any item is uncertain: run the verification command. It takes 30 seconds.
If any item fails: do not merge. Resolve it first.

---

## RULE 10 — FREEZE AND ROLLBACK ARE ALWAYS AVAILABLE

There is no execution state from which you cannot freeze or rollback.

- **Mid-extraction, file partially edited:** `git restore index.html` returns the file to HEAD state. No harm done.
- **Extraction committed but not pushed:** `git revert HEAD` creates a clean revert commit.
- **Extraction committed and pushed:** `git revert [hash]` reverts the push.
- **Extraction merged to Integration:** `git revert [hash]` on Integration creates a revert commit. Integration never force-resets.

If an operator says "I can't roll back from here" — a step was skipped somewhere. Find the step.

---

## RULE 11 — WHEN PLANNING OUTPACES EXECUTION: PAUSE PLANNING

If the Analysis branch has written corridors for states that don't yet exist on Train:
- Stop writing new corridors
- Sync to actual Train state
- Write only one LIVE corridor (for the current actual state)
- Write one SKETCH corridor (for the immediate next state)
- Nothing further

Planning farther than one SKETCH corridor ahead increases reconciliation debt faster than it saves execution time. Two corridors ahead is the maximum. This is not a guideline — it is the boundary.

---

## RULE SUMMARY TABLE

| Rule | Trigger | Response | Status |
|------|---------|----------|--------|
| 1 | 3rd Train branch needed | Merge or abandon one first | EXPERIMENTAL |
| 2 | 2nd Class A branch needed | Merge Class A #1 first | PROVEN |
| 3 | Halt trigger fires | Stop. Assess. Rollback or fix pre-commit. | PROVEN |
| 4 | Corridor age ≥ 5 | EXPIRED. Re-calibrate before executing. | EXPERIMENTAL |
| 5 | Train 1 regression or 72h age | Freeze Train 2. Resolve Train 1. | EXPERIMENTAL |
| 6 | Invalidation trigger fires | EXPIRED immediately. No assessment. | PROVEN |
| 7 | Analysis 2+ merges behind Integration | CRITICAL debt. Re-calibrate before use. | EXPERIMENTAL |
| 8 | Train consumed stale corridor | Mandatory reconciliation. Cannot be skipped. | PROVEN |
| 9 | Merge item uncertain | Run verification. Do not merge until true. | PROVEN |
| 10 | "Can't roll back" claim | False. Find the missed step. | PROVEN |
| 11 | Planning more than 2 corridors ahead | Stop. Sync to actual state. | EXPERIMENTAL |
