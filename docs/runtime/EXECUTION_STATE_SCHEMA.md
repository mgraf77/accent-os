# EXECUTION STATE SCHEMA
> AccentOS — Formal runtime contract for multi-branch decomposition state.
> Human-operated. No machine enforcement. Operator holds all mutation authority.
> v2 — Hardened: 2026-05-10

---

## REALITY AUDIT · 2026-05-10

**Notation:** `[PROVEN]` = observed · `[EXPERIMENTAL]` = defined, not yet validated · `[CONCEPTUAL]` = target only

| Entity / Claim | Status | Observed? | Machine-enforced? |
|----------------|--------|-----------|-------------------|
| Schema fields used in WIP.md / SESSION_LOG.md | PROVEN | ✓ | no |
| FREEZE STATE entity and fields | PROVEN | ✓ (ca7868e freeze) | no |
| BRANCH STATE (role, head_commit, state) | PROVEN | ✓ | no |
| State transitions observed (ACTIVE→FROZEN→ACTIVE) | PROVEN | ✓ | no |
| Advisory vs Authoritative distinction | PROVEN | ✓ (git wins) | no |
| CORRIDOR freshness decay thresholds | EXPERIMENTAL | defined; used once | no |
| PACKET rollback_command before IN_PROGRESS | EXPERIMENTAL | defined; not enforced | no |
| MERGE READINESS 6-item checklist | EXPERIMENTAL | not run end-to-end | no |
| Checkpoint semantics | EXPERIMENTAL | concept defined | no |
| Heartbeat expectations | EXPERIMENTAL | concept defined | no |
| Corridor lock semantics | EXPERIMENTAL | concept defined | no |
| Timeout semantics (48h/72h hard stops) | EXPERIMENTAL | thresholds defined; not hit | no |
| Operator override authority (documented) | EXPERIMENTAL | framework defined | no |

**This schema is vocabulary and discipline. No field is machine-read. No transition is machine-triggered. No timeout is machine-enforced. The operator runs the checks. The checks ARE the enforcement.**

---

## PART I — STATE AUTHORITY MODEL

### Advisory State vs Authoritative State

These are not equivalent. When they conflict, authoritative wins — always.

| Layer | What | Authority | When it conflicts with Authoritative |
|-------|------|-----------|--------------------------------------|
| **AUTHORITATIVE** | git branch HEAD, file content, commit history | Ground truth | Cannot be wrong by definition |
| **ADVISORY** | WIP.md, SESSION_LOG.md, corridor docs, this schema | Interpretation | Must be corrected to match git |

**Advisory state records what the operator believes is true.**
**Authoritative state records what is actually committed.**

A branch can say it is ACTIVE in WIP.md and simultaneously be stale in git. Git is right. WIP.md is stale. The operator updates WIP.md to match git — not the other way around.

### Ground Truth Chain

```
git log / git status / git diff        ← authoritative — run these when uncertain
      │
      ▼
WORK_IN_PROGRESS.md                    ← advisory — must match git
      │
      ▼
SESSION_LOG.md                         ← advisory — historical record
      │
      ▼
corridor docs (LIVE_CORRIDOR_V2.md)    ← advisory — calibration snapshots
      │
      ▼
this schema (EXECUTION_STATE_SCHEMA.md) ← advisory — vocabulary only
```

If any advisory layer contradicts a higher layer: update the lower layer. Never update git to match docs.

### Stale-State Handling

When advisory state is detected to be out of sync with authoritative state:

```
1. Stop any execution in progress (do not commit in a stale-advisory state)
2. Run authoritative checks:
     git log --oneline -5
     git status
     wc -l index.html
     ls js/*.js | wc -l
3. Identify the discrepancy: what does the doc say vs what does git show?
4. Update advisory docs to match authoritative state
5. Log the discrepancy in SESSION_LOG:
     "State drift: [doc] said [X], git shows [Y]. Corrected. Cause: [reason]."
6. Re-run corridor entry gate before proceeding
```

Stale advisory state is not a crisis. It is correctable. The protocol above takes 10 minutes. Proceeding on stale advisory state takes hours to trace when it causes an error.

---

## PART II — ENTITY CONTRACTS

### Entity: BRANCH STATE

One record per active branch. Updated in WIP.md at session start and after each significant event.

**Schema:**
```
BRANCH
  id:                 [branch name]
  role:               TRAIN | ANALYSIS | INTEGRATION
  head_commit:        [short hash]
  cut_from:           [commit hash]
  cut_date:           [YYYY-MM-DD]
  age_hours:          [hours since cut]
  file_class_owned:   A | B | C
  active_corridor_id: [corridor id, or null]
  state:              ACTIVE | FROZEN | MERGE_READY | MERGED | ABANDONED
  freeze_reason:      [string — only if FROZEN]
  resume_trigger:     [string — only if FROZEN]
  commits_ahead_of_integration:  [number]
  commits_behind_integration:    [number]
```

**Canonical states and meaning:**
| State | Meaning | Work allowed? |
|-------|---------|---------------|
| ACTIVE | Normal execution — corridor running or entry gate pending | Yes |
| FROZEN | Controlled pause — WIP commit exists, pushed, documented | No — read-only until resumed |
| MERGE_READY | All 4 merge gates passed — awaiting Integration merge | No new work — merge only |
| MERGED | Merge to Integration complete | No — archived |
| ABANDONED | Operator terminated branch without merging | No — archived |

**Legal transitions:**
```
null → ACTIVE          cut from Integration HEAD
ACTIVE → FROZEN        any freeze trigger fires (session end, hotfix, conflict, 72h age)
FROZEN → ACTIVE        resume trigger verifiably met AND entry gate passes
ACTIVE → MERGE_READY   all 4 merge gates pass simultaneously
MERGE_READY → ACTIVE   re-check reveals a gate has failed (re-run gate before accepting)
MERGE_READY → MERGED   merge to Integration complete
ACTIVE → ABANDONED     operator decision (age, irrecoverable conflict, scope change)
FROZEN → ABANDONED     freeze reason resolves to "not resumable"
```

**Illegal transitions:**
```
MERGED → any           merges are permanent; use git revert on Integration instead
ABANDONED → any        abandonments are permanent; cut a fresh branch if needed
FROZEN → MERGE_READY   must pass through ACTIVE first (entry gate required)
any → ACTIVE           without verifying resume trigger (if resuming from FROZEN)
any → MERGE_READY      without all 4 gates simultaneously passing
```

**Mutation authority:** OPERATOR ONLY. No automated process may change branch state.

**Timeout semantics:**
| Age | Threshold | Response |
|-----|-----------|----------|
| 48h | Advisory alert | Plan for merge; do not open new corridors |
| 72h | Hard stop | Must FREEZE, MERGE, or ABANDON before any additional work |
| >72h frozen | Advisory alert | Evaluate if resumable; document if continuing freeze |

**Operator override authority:**
- Operator MAY force `ABANDONED` from any non-MERGED state with a documented reason in SESSION_LOG
- Operator MAY extend a FROZEN state beyond 72h with explicit documented reason (e.g., "waiting for hotfix — estimated 12h")
- Operator MAY NOT push to MERGED without running all 4 merge gates

---

### Entity: CORRIDOR STATE

One record per active corridor. Updated in WIP.md and the corridor doc itself.

**Schema:**
```
CORRIDOR
  id:                 [corridor name]
  assigned_branch:    [branch id]
  mode:               GO | CAUTION | CRAWL
  calibration_commit: [commit hash when corridor was written]
  calibration_date:   [YYYY-MM-DD]
  age_commits:        [commits to affected files since calibration]
  freshness:          FRESH | AGED | STALE | EXPIRED
  entry_gate_passed:  true | false | NOT_RUN
  exit_gate_passed:   true | false | NOT_RUN
  current_packet_id:  [packet id, or null]
  packets:            [ordered list]
  state:              PENDING | IN_PROGRESS | COMPLETE | EXPIRED | ABANDONED
```

**Freshness thresholds:**
```
FRESH:   0 commits to affected files since calibration
AGED:    1–2 commits  (safe to execute with revalidation check)
STALE:   3–4 commits  (must run revalidation commands before executing)
EXPIRED: 5+ commits   (must re-calibrate — no exceptions, no override)
```

**Canonical states:**
| State | Meaning | Entry gate? | Execution allowed? |
|-------|---------|-------------|-------------------|
| PENDING | Corridor defined, not started | Not run | No — run entry gate first |
| IN_PROGRESS | Entry gate passed, packets executing | Passed | Yes |
| COMPLETE | Exit gate passed, all packets committed | Passed + Exit | No — archived |
| EXPIRED | Age ≥ 5 commits — do not use | Irrelevant | No — re-calibrate |
| ABANDONED | Corridor discarded mid-execution | N/A | No — archived |

**Legal transitions:**
```
PENDING → IN_PROGRESS     entry gate commands all return expected values
IN_PROGRESS → COMPLETE    exit gate passes, all packets COMMITTED
PENDING → EXPIRED         age_commits reaches 5 (detected at any point)
IN_PROGRESS → EXPIRED     age_commits reaches 5 detected mid-session
EXPIRED → PENDING         re-calibration complete, new corridor doc written at HEAD
IN_PROGRESS → ABANDONED   halt trigger fired, rollback executed, root cause undetermined
PENDING → ABANDONED       operator decides corridor scope is no longer valid
```

**Illegal transitions:**
```
EXPIRED → IN_PROGRESS     must re-calibrate — no exceptions, no override
COMPLETE → any            complete corridors are archived
ABANDONED → IN_PROGRESS   abandoned corridors are archived; write a fresh corridor
PENDING → IN_PROGRESS     without entry gate passing (hard stop)
```

**Corridor lock semantics:**

A corridor lock is advisory (not enforced by git). It is a discipline constraint.

- **Lock acquisition:** corridor transitions to IN_PROGRESS on Branch A
- **Lock scope:** no other branch may begin a corridor whose affected files overlap with Branch A's corridor affected files
- **Lock release:** corridor exits IN_PROGRESS (COMPLETE, EXPIRED, or ABANDONED)
- **Lock check command:**
  ```bash
  git log --oneline --all -- [affected-file] | head -5
  # Look for commits on open branches — indicates overlap risk
  ```
- **Lock conflict resolution:** see TWO_BRANCH_COORDINATION_PROTOCOL.md → ESCALATION HANDLING

**Mutation authority:** OPERATOR ONLY.

**Operator override authority:**
- Operator MAY force `EXPIRED` from any state (always conservative — always safe)
- Operator MAY force `ABANDONED` with documented reason
- Operator MAY NOT begin `IN_PROGRESS` without entry gate (no override for this)
- Operator MAY NOT begin `IN_PROGRESS` on an EXPIRED corridor (no override for this)

---

### Entity: PACKET STATE

One record per packet within a corridor. Updated in WIP.md after each packet.

**Schema:**
```
PACKET
  id:                  [packet name]
  corridor_id:         [parent corridor id]
  zone:                [inline zone name]
  output_file:         [new JS file path, or null for metadata-only]
  state:               PENDING | IN_PROGRESS | VERIFIED | COMMITTED | MERGED | ROLLED_BACK
  rollback_command:    [pre-written before execution begins]
  commit_hash:         [null until committed]
  verify_passed:       true | false | NOT_RUN
  stop_conditions_hit: [list, or empty]
  notes:               [operator observations]
```

**Canonical states:**
| State | Meaning | Rollback command required? |
|-------|---------|--------------------------|
| PENDING | Defined, not started | Must write before starting |
| IN_PROGRESS | File edits underway, not committed | Must already exist |
| VERIFIED | Verify commands passed, not yet committed | Already exists |
| COMMITTED | `git commit` executed successfully | Already exists (with hash) |
| MERGED | Included in Integration merge | Hash recorded |
| ROLLED_BACK | `git revert` or `git restore` executed | N/A — rollback completed |

**Legal transitions:**
```
PENDING → IN_PROGRESS     rollback_command written, corridor IN_PROGRESS, operator ready
IN_PROGRESS → VERIFIED    all verify commands return expected values
VERIFIED → COMMITTED      git commit executed, hash recorded
COMMITTED → MERGED        included in Integration merge
COMMITTED → ROLLED_BACK   git revert [hash] executed and verified
IN_PROGRESS → ROLLED_BACK git restore [file] executed (pre-commit rollback)
IN_PROGRESS → PENDING     operator decides to pause before commit (no changes lost)
```

**Illegal transitions:**
```
PENDING → IN_PROGRESS     without rollback_command written (hard stop)
MERGED → any              merges are permanent
ROLLED_BACK → IN_PROGRESS on same branch (must re-cut fresh branch from Integration HEAD)
VERIFIED → IN_PROGRESS    regression — if verify failed: re-verify, do not revert to IN_PROGRESS
```

**Rollback authority:**
- Operator MAY rollback from IN_PROGRESS (pre-commit): `git restore [file]`
- Operator MAY rollback from COMMITTED (post-commit, pre-push): `git revert HEAD`
- Operator MAY rollback from COMMITTED (post-push): `git revert [hash]`
- Operator MAY rollback from MERGED (post-Integration-merge): `git revert [hash]` on Integration
- There is no state from which rollback is impossible. If operator says "can't roll back" — a step was skipped.

**Mutation authority:** OPERATOR ONLY.

**Pre-execution hard stop:** If `rollback_command` is null and packet is about to enter IN_PROGRESS — STOP. Write the rollback command first. No exceptions. No override.

---

### Entity: FREEZE STATE

A FREEZE record is written when a branch enters FROZEN state. It lives in WORK_IN_PROGRESS.md and remains there until the branch is resumed, merged, or abandoned.

**Schema:**
```
FREEZE
  branch:           [branch id]
  state:            FROZEN
  reason:           [one sentence — specific cause, not "session ending"]
  freeze_date:      [YYYY-MM-DD HH:MM]
  freeze_commit:    [HEAD commit at freeze time — must be pushed]
  resume_trigger:   [specific, verifiable condition]
  completed_steps:  [list of packet ids or descriptions that finished]
  remaining_steps:  [list of packet ids or descriptions still to do]
  wip_commit:       [commit hash of the WIP commit pushed at freeze time]
```

**Pause semantics — what must be true before FROZEN:**
```
✓ All in-progress work committed with "wip: " prefix
✓ Branch pushed to remote (freeze_commit must exist on origin)
✓ WORK_IN_PROGRESS.md updated with FREEZE record
✓ resume_trigger is specific and verifiable (not "when ready")
✓ remaining_steps is complete (nothing left ambiguous)
```

**Resume semantics — what must be true before ACTIVE (resumed):**
```
✓ Resume trigger condition is verifiably met
✓ git pull origin [branch] — ensure local is at freeze_commit
✓ Entry gate commands run and return expected values
✓ No halt triggers detected
✓ WIP.md updated: state=ACTIVE, freeze record cleared
```

If entry gate fails on resume: do not resume. Either the branch has drifted (rebase needed) or the corridor has expired (re-calibrate). Resolve before resuming.

**Heartbeat expectations for FROZEN branches:**
- Freeze commit must exist on remote (required at freeze time)
- If freeze duration > 48h without resume: evaluate if resumable; document decision
- If freeze duration > 72h: operator must make an explicit FROZEN → ACTIVE or FROZEN → ABANDONED decision before the next session touches this branch

---

### Entity: MERGE READINESS

Evaluated before any Train branch merges to Integration. All six must be true.

**Schema:**
```
MERGE_READINESS
  branch:                            [branch id]
  evaluated_at:                      [YYYY-MM-DD HH:MM]

  corridor_exit_gate_passed:         true | false
  every_packet_has_rollback_hash:    true | false
  branch_commits_behind_integration: [number — must be 0]
  session_log_entry_written:         true | false
  smoke_test_recorded:               true | false
  no_open_stop_conditions:           true | false

  MERGE_READY: [true only if ALL above = true]
```

**Gate semantics:**
- Every gate is binary. True or false. No "probably true."
- If any gate is false or uncertain: run the verification command. It takes 30 seconds.
- `branch_commits_behind_integration` of 1+ means rebase required. After rebase: re-run exit gate.
- `smoke_test_recorded` means it is written in SESSION_LOG. "I tested it" does not count.
- `no_open_stop_conditions` means zero items in stop_conditions_hit for any packet.

**Checkpoint semantics:**

A checkpoint is a moment when advisory state and authoritative state are fully synchronized. Checkpoints are required at:

| Checkpoint | When | What to verify |
|------------|------|----------------|
| Session start | Before any work | WIP.md matches git log; entry gate passes |
| Post-packet commit | After each `git commit` | commit_hash recorded in WIP; rollback_command updated with hash |
| Pre-freeze | Before committing freeze state | All wip: commits pushed; WIP.md updated |
| Pre-merge | Before merging to Integration | All 6 merge readiness gates |
| Session end | After final push | WIP.md reflects actual state; nothing ambiguous left |

A session without a session-start checkpoint and session-end checkpoint is an incomplete session. The next session will spend the first 10 minutes reconstructing state that should have been recorded.

---

### Entity: STALENESS MARKER

Attached to corridor docs and branch records to indicate calibration drift.

**Schema:**
```
STALENESS_MARKER
  entity_type:           CORRIDOR | BRANCH
  entity_id:             [corridor or branch id]
  calibration_commit:    [commit when last calibrated]
  current_head_commit:   [actual HEAD right now]
  age_commits:           [difference]
  status:                FRESH | AGED | STALE | EXPIRED
  last_revalidated:      [date, or null]
  revalidation_commands: [the specific grep/wc commands to confirm validity]
```

Format in corridor doc headers:
```markdown
> Calibrated: 2026-05-10 · commit ca7868e
> Age: [N] commits since calibration · State: FRESH / AGED / STALE / EXPIRED
```

**When EXPIRED — no work until re-calibrated:**
```
1. Mark corridor header: State: EXPIRED
2. Run calibration commands fresh (wc -l, grep anchors, ls js/*.js)
3. Write a new corridor doc at current HEAD
4. Old corridor is archived — do not use
5. Log: "Corridor EXPIRED. Re-calibrated at [HEAD]. New doc: [filename]."
```

---

### Entity: REVIEW DEBT

Tracks corridor docs on Analysis branch that haven't been verified against Train's actual state.

**Schema:**
```
REVIEW_DEBT
  corridor_doc:          [filename in docs/runtime/]
  analysis_commit:       [commit on Analysis branch when doc was written]
  train_head_at_writing: [Train HEAD Analysis used as reference]
  current_train_head:    [actual current Train HEAD]
  debt_status:           CURRENT | DRIFTED | CRITICAL
  debt_commits:          [Train commits since corridor was calibrated]
```

**Debt thresholds:**
| Status | debt_commits | Action |
|--------|-------------|--------|
| CURRENT | 0–2 | Corridor usable — spot-check anchors before consuming |
| DRIFTED | 3–4 | Revalidation required before Train consumes corridor |
| CRITICAL | 5+ | Corridor must be rewritten before use — do not consume |

Review debt is recorded in a REVIEW_DEBT section at the bottom of WORK_IN_PROGRESS.md and cleared when the corridor is rewritten.

---

## PART III — CROSS-ENTITY AUTHORITY

### Mutation Authority Summary

| Entity | Who may mutate | Trigger |
|--------|---------------|---------|
| BRANCH.state | OPERATOR ONLY | Manual decision, documented in WIP.md |
| CORRIDOR.state | OPERATOR ONLY | Gate result or age threshold |
| PACKET.state | OPERATOR ONLY | Execution step completion |
| FREEZE record | OPERATOR ONLY | Freeze/resume event |
| MERGE_READINESS gates | OPERATOR ONLY | Verification command results |
| Any advisory doc | OPERATOR ONLY | Correction to match authoritative state |
| git (authoritative) | git + OPERATOR | Commits, reverts, merges |

No process, script, or agent may mutate state without operator awareness. If a script is written to check state: it reads and reports — it does not write.

### Operator Override Authority

**Operator MAY:**
- Force ABANDONED on any non-MERGED branch (document reason in SESSION_LOG)
- Force EXPIRED on any corridor (always conservative — never wrong to be more restrictive)
- Force ROLLED_BACK on any non-MERGED packet
- Extend FROZEN duration with documented justification
- Declare a merge gate as "verified by alternative means" — but must record what the alternative was

**Operator MAY NOT (no override exists):**
- Begin IN_PROGRESS on an EXPIRED corridor — must re-calibrate first
- Begin IN_PROGRESS on a packet without a rollback_command — must write it first
- Push to MERGED without all 6 merge gates true — must resolve each gate
- Revert or change a MERGED entity in git — only `git revert` on Integration HEAD

### Rollback Authority Summary

| State | Rollback method | Who authorizes |
|-------|----------------|----------------|
| IN_PROGRESS (pre-commit, file edits only) | `git restore [file]` | OPERATOR |
| COMMITTED (not pushed) | `git revert HEAD` | OPERATOR |
| COMMITTED (pushed, not merged) | `git revert [hash]` then push | OPERATOR |
| MERGED to Integration | `git revert [hash]` on Integration HEAD | OPERATOR — document in SESSION_LOG |

There is no state from which rollback is unavailable. The claim "I can't roll back from here" indicates a skipped step. Find the step.

---

## PART IV — HEARTBEAT EXPECTATIONS

Heartbeat is the minimum update frequency required to keep advisory state trustworthy.

| Entity | Heartbeat | What gets updated |
|--------|-----------|------------------|
| ACTIVE Train branch | Each session | WIP.md head_commit, age_hours, corridor state |
| IN_PROGRESS corridor | Each packet completion | WIP.md current_packet_id, packet state |
| FROZEN branch | Once at freeze time | Freeze record in WIP.md — no further updates required until resume |
| Analysis branch | After each Integration merge | Corridor docs re-validated or marked DRIFTED |

**Session start heartbeat (minimum):**
```
1. git pull origin [branch]
2. Read WORK_IN_PROGRESS.md
3. Run git log --oneline -5 (verify head_commit matches WIP.md)
4. Run entry gate commands (verify state matches corridor expectations)
5. Update WIP.md head_commit and age_hours
```

A session that skips this heartbeat is operating on unverified state. If something goes wrong, the root cause is unverified state — not bad luck.

---

## PART V — CURRENT INSTANCE (as of 2026-05-10)

### Active Branch States

```
BRANCH
  id:               claude/setup-codex-integration-gMAyH
  role:             TRAIN
  head_commit:      9355843
  age_hours:        ~0 (active session)
  file_class_owned: A+B
  active_corridor_id: COHORT-2-REGISTRATIONS
  state:            ACTIVE
  commits_ahead_of_integration: ~30
  commits_behind_integration:   unknown (diverged history — reconciliation session needed)

BRANCH
  id:               claude/phase1-execution-playbooks-e3Olm
  role:             ANALYSIS
  head_commit:      44c8dea
  file_class_owned: C
  state:            ACTIVE
  active_corridor_id: null
```

### Active Corridor State

```
CORRIDOR
  id:                 COHORT-2-REGISTRATIONS
  assigned_branch:    claude/setup-codex-integration-gMAyH
  mode:               GO
  calibration_commit: ca7868e
  calibration_date:   2026-05-10
  age_commits:        0
  freshness:          FRESH
  entry_gate_passed:  NOT_RUN
  exit_gate_passed:   NOT_RUN
  current_packet_id:  null (corridor not yet started)
  state:              PENDING
```

### Review Debt

```
REVIEW_DEBT
  corridor_doc:          LIVE_CORRIDOR_V2.md (analysis branch 44c8dea)
  train_head_at_writing: pre-departure (7169 lines — stale)
  current_train_head:    9355843
  debt_status:           CRITICAL (written for wrong state)
  resolution:            new LIVE_CORRIDOR_V2.md written on Train at 6eeb052 ✓
```

---

## CLAIM REGISTRY

| ID | Claim | Status |
|----|-------|--------|
| ESS-1 | Schema fields used in WIP.md / SESSION_LOG.md | PROVEN |
| ESS-2 | FREEZE STATE entity and fields | PROVEN |
| ESS-3 | BRANCH STATE (role, head_commit, state) | PROVEN |
| ESS-4 | State transitions (ACTIVE→FROZEN→ACTIVE observed) | PROVEN |
| ESS-5 | Advisory vs Authoritative distinction (git wins) | PROVEN |
| ESS-6 | Rollback available from any state | PROVEN |
| ESS-7 | CORRIDOR freshness decay thresholds | EXPERIMENTAL |
| ESS-8 | PACKET rollback_command before IN_PROGRESS | EXPERIMENTAL |
| ESS-9 | MERGE READINESS 6-item checklist | EXPERIMENTAL |
| ESS-10 | Checkpoint semantics (session-start / post-commit / pre-merge) | EXPERIMENTAL |
| ESS-11 | Heartbeat expectations for active branches | EXPERIMENTAL |
| ESS-12 | Corridor lock semantics (advisory) | EXPERIMENTAL |
| ESS-13 | Timeout semantics (48h/72h hard stops) | EXPERIMENTAL |
| ESS-14 | Operator override authority framework | EXPERIMENTAL |
| ESS-15 | Schema is machine-enforced at any point | FALSE — manual only |
