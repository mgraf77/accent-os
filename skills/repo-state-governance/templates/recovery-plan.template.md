# Recovery Plan

<!--
Validate against: schemas/recovery-plan.schema.md
HIGH-risk: human approval required before executing.
-->

**Schema version:** 1
**Created at:** [ISO-8601]
**Created by:** [operator identity]
**Repo:** [repo name]
**Current (broken) commit:** [hash] "[commit message]"

---

## Trigger event

- **What happened:** [specific, factual description]
- **When:** [ISO-8601 if known, or "between X and Y"]
- **Who noticed:** [operator | monitoring | downstream consumer | etc.]
- **Initial damage assessment:** [1-2 sentences]

## Damage scope assessment

- **Files affected:** [list]
- **Branches affected:** [list]
- **External state affected:** [database, vendor APIs, infrastructure, or "none"]
- **User-facing impact:** [none | low | medium | high; describe]
- **Data loss potential:** [yes | no | unknown; describe]

## Last known-good state

- **Commit:** [hash] "[message]" ([date])
- **How verification was done:** [last green CI build, last successful deploy, etc.]
- **Tags:** [list, e.g. v1.2.2 is at this commit]
- **Snapshots / backups:** [list with IDs and timestamps]

## Recovery strategy

**[Rollback | Forward-fix | Surgical | Reconstruction]**

[Justification: 1-3 sentences. What trade-offs were considered.]

## Pre-recovery state preservation

- **Tag at current HEAD:** `pre-recovery/[YYYY-MM-DD]/[short-description]`
- **Branches preserved:** [list with tag references]
- **External-state snapshots taken now:** [snapshot IDs + timestamps]

---

## Step-by-step plan

### Step 1 — [Name]

- **Action:** [specific commands / operations]
- **Expected result:** [observable outcome]
- **Verification:** [how to confirm success]
- **Authorized destructive operations:** [list, or "none"]
- **If this step fails:** [retry | skip | rollback-of-recovery]

### Step 2 — [Name]

[Same structure]

### Step 3 — [Name]

[Same structure]

<!-- Add more steps as needed. -->

---

## Authorized destructive operations

<!-- Consolidated list. Anything destructive in the steps above must appear here. -->

| Operation | Target | Authorized by | Date |
|---|---|---|---|
| [type, e.g. force-push] | [specific target] | [operator name] | [ISO-8601] |
| [...] | [...] | [...] | [...] |

---

## Rollback-of-recovery plan

<!-- Required. What to do if recovery itself fails. -->

If any step fails:
- [Action 1: e.g. re-enable maintenance mode]
- [Action 2: e.g. restore from `pre-recovery/.../tag`]
- [Action 3: e.g. escalate to specialist]
- [Re-enter recovery with a new plan, or accept the broken state for forensics]

---

## Verification criteria

<!-- Specific, testable conditions for "recovery complete". -->

- [Criterion 1: e.g. "production smoke tests pass"]
- [Criterion 2: e.g. "SELECT count(*) FROM users returns ≥ 49K"]
- [Criterion 3: e.g. "no 'table users does not exist' errors in last 5 minutes"]
- [Criterion 4: ...]

---

## Communications plan

- **During recovery:** [channel + frequency, e.g. "#incident, every 15 minutes"]
- **Affected users:** [maintenance page, status page, etc.]
- **Post-recovery:** [incident summary timeline + post-mortem timeline]

---

## Authorities & sign-offs

- **Recovery plan approved by:** [name + role + ISO-8601 timestamp]
- **DBA / specialist on standby:** [name + ISO-8601 if applicable]
- **Each authorized destructive operation:** re-approved at execution time (record in audit trail)

---

## Outcome

<!-- Fill in after completion. -->

- **What actually happened:** [vs. plan]
- **Deviations from plan:** [list with reasons]
- **Lessons learned:** [for future recoveries]
- **Post-mortem:** [link to post-mortem doc]
- **Completion date:** [ISO-8601]
