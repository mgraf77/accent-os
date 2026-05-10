# EXECUTION STATE SCHEMA
> AccentOS — Minimal operational state model for multi-branch decomposition.
> Human-readable. Not machine-enforced. Populated manually by the operator.
> Written: 2026-05-10

---

## REALITY AUDIT · 2026-05-10

**Notation:** `[PROVEN]` = observed · `[EXPERIMENTAL]` = defined, not yet validated at scale · `[CONCEPTUAL]` = target only

| Entity / Claim | Status | Observed? | Machine-enforced? |
|----------------|--------|-----------|-------------------|
| Schema as vocabulary in WIP.md / SESSION_LOG.md | PROVEN | ✓ | no — manual |
| FREEZE STATE entity fields | PROVEN | ✓ (used in ca7868e) | no |
| BRANCH STATE — role, head_commit, state fields | PROVEN | ✓ (used in WIP.md) | no |
| CORRIDOR STATE — freshness decay thresholds | EXPERIMENTAL | defined; decay counting used once | no |
| PACKET STATE — rollback_command before IN_PROGRESS | EXPERIMENTAL | defined; not yet enforced pre-execution | no |
| MERGE READINESS — 6-item checklist | EXPERIMENTAL | not yet run end-to-end | no |
| STALENESS MARKER format | EXPERIMENTAL | format defined; used in corridor headers | no |
| REVIEW DEBT thresholds (CURRENT/DRIFTED/CRITICAL) | EXPERIMENTAL | applied once (session 3); thresholds defined | no |
| State transitions (ACTIVE→FROZEN→MERGED) | PROVEN | ✓ (observed lifecycle) | no |

**This schema is vocabulary and discipline. No field is machine-read, no transition is machine-triggered, no threshold is machine-enforced.**

---

## HOW TO USE THIS SCHEMA

This document defines the fields that describe the state of every active branch, corridor, packet, and freeze. The operator populates these fields in WORK_IN_PROGRESS.md or SESSION_LOG.md at the start of each session and after each significant event.

The schema is a checklist and vocabulary. It is not a database.

---

## ENTITY: BRANCH STATE

One record per active branch.

```
BRANCH
  id:                 [branch name, e.g. claude/setup-codex-integration-gMAyH]
  role:               TRAIN | ANALYSIS | INTEGRATION
  head_commit:        [short hash, e.g. ca7868e]
  cut_from:           [commit hash branch was cut from]
  cut_date:           [YYYY-MM-DD]
  age_hours:          [hours since cut]
  file_class_owned:   A | B | C  (A = index.html, B = js/*.js, C = docs only)
  active_corridor_id: [corridor id, or null]
  state:              ACTIVE | FROZEN | MERGE_READY | MERGED | ABANDONED
  freeze_reason:      [string, only if state=FROZEN]
  resume_trigger:     [string, only if state=FROZEN]
  commits_ahead_of_integration: [number]
  commits_behind_integration:   [number]
```

**State transitions:**
```
null → ACTIVE         (branch cut)
ACTIVE → FROZEN       (freeze procedure triggered)
FROZEN → ACTIVE       (resume trigger met)
ACTIVE → MERGE_READY  (all four merge gates pass)
MERGE_READY → MERGED  (merge to Integration completes)
ACTIVE → ABANDONED    (branch too stale, operator abandons)
FROZEN → ABANDONED    (freeze reason never resolves)
```

---

## ENTITY: CORRIDOR STATE

One record per active corridor.

```
CORRIDOR
  id:                 [corridor name, e.g. COHORT-2-REGISTRATIONS]
  assigned_branch:    [branch id]
  mode:               GO | CAUTION | CRAWL
  calibration_commit: [commit hash when corridor was written]
  calibration_date:   [YYYY-MM-DD]
  age_commits:        [commits to affected files since calibration]
  freshness:          FRESH | AGED | STALE | EXPIRED
  entry_gate_passed:  true | false | NOT_RUN
  exit_gate_passed:   true | false | NOT_RUN
  current_packet_id:  [packet id, or null if corridor not started or complete]
  packets:            [ordered list of packet ids]
  state:              PENDING | IN_PROGRESS | COMPLETE | EXPIRED | ABANDONED
```

**Freshness thresholds:**
```
FRESH:   0 commits to affected files since calibration
AGED:    1–2 commits
STALE:   3–4 commits  (run revalidation before executing)
EXPIRED: 5+ commits   (do not execute — re-calibrate from HEAD)
```

**Affected files for decay counting:**
- Class A corridors (index.html work): count commits to `index.html`
- Class B corridors (js/*.js work): count commits to the specific `js/*.js` files in scope
- Mixed corridors: count commits to any file in scope

---

## ENTITY: PACKET STATE

One record per packet within a corridor. Updated as each packet executes.

```
PACKET
  id:               [packet name, e.g. AUTH-EXTRACTION]
  corridor_id:      [parent corridor id]
  zone:             [inline zone name, e.g. AUTH, VD-CONSTS]
  output_file:      [new JS file path, e.g. js/auth.js — or null for metadata-only]
  state:            PENDING | IN_PROGRESS | VERIFIED | COMMITTED | MERGED | ROLLED_BACK
  rollback_command: [pre-written, e.g. "git revert abc1234"]
  commit_hash:      [null until committed]
  verify_passed:    true | false | NOT_RUN
  stop_conditions_hit: [list, or empty]
  notes:            [anything the operator noticed during execution]
```

**Rollback command must be written BEFORE state transitions to IN_PROGRESS.**
If `rollback_command` is null and state is IN_PROGRESS: stop and write it before continuing.

---

## ENTITY: FREEZE STATE

Written to WORK_IN_PROGRESS.md when any branch enters FROZEN state.

```
FREEZE
  branch:             [branch id]
  state:              FROZEN
  reason:             [one sentence — the specific cause]
  freeze_date:        [YYYY-MM-DD HH:MM]
  freeze_commit:      [HEAD commit at time of freeze]
  resume_trigger:     [the specific condition that must be true to resume]
  completed_steps:    [list of packet ids or step descriptions that finished]
  remaining_steps:    [list of packet ids or step descriptions still to do]
  wip_commit:         [commit hash of the WIP commit pushed at freeze time]
```

**Resume trigger must be specific and verifiable.** Not "when it feels right." Example resume triggers:
- "External hotfix for doLogin() merges to Integration"
- "Session ends and operator has bandwidth for 45-min verification"
- "branch age resets after rebase on Integration HEAD"

---

## ENTITY: MERGE READINESS

Checklist evaluated before merging Train to Integration. All must be true.

```
MERGE_READINESS
  branch:                         [branch id]
  evaluated_at:                   [YYYY-MM-DD]

  corridor_exit_gate_passed:      true | false
  every_packet_has_rollback_hash: true | false
  branch_commits_behind_integration: [number — must be 0 or rebase done]
  session_log_entry_written:      true | false
  smoke_test_recorded:            true | false
  no_open_stop_conditions:        true | false

  MERGE_READY: [true only if ALL above = true]
```

If `MERGE_READY = false`: identify which fields are false. Address each before merging.
"Close enough" does not set any field to true.

---

## ENTITY: STALENESS MARKER

Attached to any corridor doc or branch state record to indicate calibration drift.

```
STALENESS_MARKER
  entity_type:          CORRIDOR | BRANCH
  entity_id:            [corridor or branch id]
  calibration_commit:   [commit when this was last calibrated]
  current_head_commit:  [actual HEAD of the affected files right now]
  age_commits:          [difference]
  status:               FRESH | AGED | STALE | EXPIRED
  last_revalidated:     [date, or null]
  revalidation_commands: [the specific grep/wc commands that confirm validity]
```

Staleness markers live in the corridor doc header:
```markdown
> Calibrated: 2026-05-10 · commit ca7868e
> Age: [N] commits since calibration
> State: FRESH / AGED / STALE / EXPIRED
```

---

## ENTITY: REVIEW DEBT

Tracks corridor docs on Analysis branch that haven't been verified against Train's actual state.

```
REVIEW_DEBT
  corridor_doc:       [filename in docs/runtime/]
  analysis_commit:    [commit on Analysis branch when doc was written]
  train_head_at_writing: [Train HEAD that Analysis used as reference]
  current_train_head: [actual current Train HEAD]
  debt_status:        CURRENT | DRIFTED | CRITICAL
  debt_commits:       [number of Train commits since corridor was calibrated]
```

**Debt thresholds:**
- CURRENT: debt_commits = 0–2 (corridor is still usable)
- DRIFTED: debt_commits = 3–4 (revalidation needed before Train consumes corridor)
- CRITICAL: debt_commits = 5+ (corridor must be rewritten before use)

Review debt is recorded in a REVIEW_DEBT section at the bottom of WORK_IN_PROGRESS.md.

---

## CURRENT INSTANCE (as of 2026-05-10)

### Active Branch States

```
BRANCH
  id:               claude/setup-codex-integration-gMAyH
  role:             TRAIN
  head_commit:      6eeb052
  age_hours:        ~0 (active session)
  file_class_owned: A+B  (index.html + js/*.js)
  active_corridor_id: COHORT-2-REGISTRATIONS
  state:            ACTIVE (resuming from FROZEN)
  commits_ahead_of_integration: ~28
  commits_behind_integration:   unknown (diverged history)

BRANCH
  id:               claude/phase1-execution-playbooks-e3Olm
  role:             ANALYSIS
  head_commit:      44c8dea
  file_class_owned: C  (docs/runtime/ only)
  state:            ACTIVE
  active_corridor_id: null  (planning, not executing)
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
  corridor_doc:         LIVE_CORRIDOR_V2.md (on analysis branch 44c8dea)
  train_head_at_writing: pre-departure (7169 lines — stale)
  current_train_head:   6eeb052 (1258 lines — actual)
  debt_status:          CRITICAL (written for wrong state)
  resolution:           new LIVE_CORRIDOR_V2.md written on Train branch at 6eeb052
```

---

## CLAIM REGISTRY

| ID | Claim | Status |
|----|-------|--------|
| ESS-1 | Schema fields used in WIP.md / SESSION_LOG.md | PROVEN |
| ESS-2 | FREEZE STATE entity (freeze commit, resume trigger, remaining steps) | PROVEN |
| ESS-3 | BRANCH STATE fields (role, state, head_commit) | PROVEN |
| ESS-4 | State transitions (null→ACTIVE→FROZEN→MERGED) | PROVEN |
| ESS-5 | CORRIDOR freshness thresholds (FRESH/AGED/STALE/EXPIRED) | EXPERIMENTAL |
| ESS-6 | PACKET rollback_command written before IN_PROGRESS | EXPERIMENTAL |
| ESS-7 | MERGE READINESS 6-item checklist run before every merge | EXPERIMENTAL |
| ESS-8 | STALENESS MARKER in corridor doc headers | EXPERIMENTAL |
| ESS-9 | REVIEW DEBT thresholds (CURRENT/DRIFTED/CRITICAL) | EXPERIMENTAL |
| ESS-10 | Schema is machine-enforced at any point | FALSE — manual only |
