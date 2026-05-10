# OPERATOR PANEL REQUIREMENTS
> AccentOS — Specification for the minimal operator control panel.
> This is a requirements document. Not an implementation plan.
> Defines what information the operator needs. Not how to display it.
> Written: 2026-05-10

---

## REALITY AUDIT · 2026-05-10

**Notation:** `[PROVEN]` = observed · `[EXPERIMENTAL]` = defined, not yet built · `[CONCEPTUAL]` = target only

| Claim / Component | Status | Built? | Measured? |
|-------------------|--------|--------|-----------|
| Information requirements (what operator needs) | PROVEN | ✓ (identified from sessions 1–16) | ✓ |
| Minimal implementation via WIP.md + corridor docs | PROVEN | ✓ (used in every session) | ✓ |
| 30-second scan section (Section 1) | EXPERIMENTAL | requirements defined | no |
| Corridor visibility section (Section 2) | EXPERIMENTAL | requirements defined | no |
| Freeze visibility section (Section 3) | EXPERIMENTAL | requirements defined | no |
| Merge visibility / go/no-go (Section 4) | EXPERIMENTAL | requirements defined | no |
| Synchronization visibility (Section 5) | EXPERIMENTAL | requirements defined | no |
| Alert system with priority levels (Section 6) | EXPERIMENTAL | requirements defined | no |
| Software panel with color coding / hover states | CONCEPTUAL | not built | no |
| Current panel population (text representation) | PROVEN | ✓ (populated from real state) | ✓ |

**The information requirements are PROVEN (we know what the operator needs). The software surface is CONCEPTUAL (not built). The minimal doc-based implementation is PROVEN (WIP.md + corridor docs serve this role now).**

---

## PURPOSE

The operator control panel gives a human the information needed to:
1. Know the current state of all active branches (30-second scan)
2. Know what is safe to do next
3. Know what is blocked and why
4. Make merge decisions with confidence
5. Detect staleness before executing

This is not a dashboard for monitoring. It is a decision-support surface for a human operator taking action.

---

## VIEWING MODES

**30-SECOND SCAN:** The first thing an operator sees at session start. Must be readable without running any commands. Populated from the most recent WORK_IN_PROGRESS.md commit.

**VERIFICATION MODE:** Operator runs specific commands to confirm state before acting. The panel surfaces the commands; the operator runs them.

**DECISION MODE:** Operator is at a go/no-go checkpoint (merge, promote, freeze). Panel surfaces the checklist items and their current status.

---

## SECTION 1: ACTIVE BRANCH STATUS (30-second scan)

One row per active branch (Train + Analysis). Integration shown in a separate row as "landing zone."

**Required fields per row:**
```
Branch name | Role | HEAD commit | Age | Corridor | Corridor state | Owned files | Branch state
```

**Example:**
```
claude/setup-codex-gMAyH   TRAIN     6eeb052  0h   COHORT-2-REG   PENDING   A+B   ACTIVE
claude/phase1-playbooks     ANALYSIS  44c8dea  0h   (none)         -         C     ACTIVE
main                        INTEG     5db5ddf  -    (landing zone) -         -     STABLE
```

**Alert indicators on this row:**
- Branch age > 48h → **YELLOW**
- Branch age > 72h → **RED**
- Branch state = FROZEN → **ORANGE** (show freeze reason on hover/expand)
- Corridor state = EXPIRED → **RED**
- Two rows show Class A in owned files → **CRITICAL RED** (rule violation)

---

## SECTION 2: CORRIDOR VISIBILITY

One block per active corridor. Shown expanded for LIVE corridor. Collapsed for SKETCH.

**Required fields:**
```
Corridor id:           COHORT-2-REGISTRATIONS
Mode:                  GO
Assigned branch:       claude/setup-codex-gMAyH
Calibration commit:    ca7868e
Age:                   0 commits
Freshness:             FRESH
Entry gate:            NOT_RUN
Exit gate:             NOT_RUN
Current packet:        (not started)
```

**Freshness color coding:**
- FRESH → green
- AGED → yellow (show age count)
- STALE → orange (show revalidation prompt)
- EXPIRED → red (show re-calibrate command)

**Packet sub-list (for LIVE corridor):**
Show each packet with its state (PENDING | IN_PROGRESS | VERIFIED | COMMITTED).
If a packet has a rollback command recorded: show ✓ next to it.
If not: show ⚠ (rollback not written).

---

## SECTION 3: FREEZE VISIBILITY

Shown only when at least one branch is FROZEN. Persistent — stays visible until resume.

**Required fields:**
```
FROZEN BRANCH: claude/setup-codex-gMAyH
Reason:        Session ending before verification complete
Frozen at:     2026-05-10 18:30
Freeze commit: ca7868e
Resume trigger: Next session — run corridor entry gate before proceeding
Completed:     shell_utils extracted, cohort-1 registered
Remaining:     cohort-2 registrations, AUTH extraction, VD remnants
```

**Alert:** If freeze duration > 48 hours without resume trigger resolution: **ORANGE alert** on this section.

---

## SECTION 4: MERGE VISIBILITY

Shows branches that are MERGE_READY or approaching merge readiness. One checklist per branch.

**Required fields (per branch approaching merge):**
```
Branch: claude/setup-codex-gMAyH
Target: main

☐ Corridor exit gate passed
☐ Every packet has rollback hash recorded
☐ Branch is 0 commits behind Integration (or rebase done)
☐ SESSION_LOG entry written
☐ Smoke test recorded
☐ No open stop conditions

MERGE_READY: false (3 of 6 conditions met)
```

**Go/no-go signal:** If all 6 = ✓ → green "MERGE READY" button/indicator. If any = ☐ → show exactly which items remain.

---

## SECTION 5: SYNCHRONIZATION VISIBILITY

Shows the gap between Analysis branch corridors and actual Train state. This is the "reconciliation debt" section.

**Required fields:**
```
SYNC STATE

Analysis branch: claude/phase1-playbooks (44c8dea)
Train branch:    claude/setup-codex-gMAyH (6eeb052)
Integration:     main (5db5ddf)

Corridor docs in Analysis:
  LIVE_CORRIDOR_V2.md       calibrated at: pre-departure (STALE — written for 7169-line state)
  POST_REGISTER_CORRIDORS.md calibrated at: pre-departure (STALE)
  CORRIDOR_STALENESS_PROTOCOL.md  calibrated at: pre-departure (docs only — no calibration needed)

Review debt:     CRITICAL (2 docs calibrated against wrong state)
Action required: Re-calibrate both corridor docs against Train HEAD 6eeb052
```

**Sync state indicators:**
- All Analysis corridors current → green "IN SYNC"
- 1–2 corridors drifted → yellow "REVIEW DEBT"
- 3+ corridors or any CRITICAL debt → red "OUT OF SYNC — reconciliation required"

---

## SECTION 6: ALERTS

Surface these immediately at session start. Operator must acknowledge before proceeding.

**Priority 1 (CRITICAL — stop everything):**
- Two Class A branches simultaneously active
- Merge conflict markers found in any active branch file
- Halt trigger fired but no rollback recorded

**Priority 2 (URGENT — address before next packet):**
- Corridor EXPIRED on active Train branch
- Branch age > 72 hours without merge
- Analysis branch CRITICAL sync debt
- Freeze duration > 48 hours

**Priority 3 (ADVISORY — address before merge):**
- Corridor STALE (3–4 commits) — revalidation needed
- Any packet without rollback command recorded
- Branch age 48–72 hours

---

## MINIMAL IMPLEMENTATION REQUIREMENTS

The operator panel does not require software. The minimum viable implementation is:

**For the 30-second scan:** A well-maintained `WORK_IN_PROGRESS.md` with the branch state table filled in at every session start and after every significant event.

**For verification mode:** The corridor doc itself — specifically the entry gate, exit gate, and verification commands per packet.

**For decision mode:** The merge readiness checklist in `WORK_IN_PROGRESS.md` or `SESSION_LOG.md` — one block per branch approaching merge.

**For alerts:** The corridor freshness header in every corridor doc (`Age: N commits · State: FRESH/AGED/STALE/EXPIRED`) combined with the runtime rules table in `LIVE_CORRIDOR_RUNTIME_RULES.md`.

A software panel would surface the same information faster. But the information itself already exists in these docs if maintained correctly.

---

## WHAT THE PANEL DOES NOT SHOW

The panel is not a history viewer. It shows current state only.

The panel does not show:
- All past merged branches (in git log)
- Full commit history (in git log)
- Code diffs (in git diff)
- Test results (run separately)
- Deployment status (separate concern)
- Any information that requires interpreting code — only operational metadata

The panel is the cockpit. git log is the black box. They are different tools.

---

## CURRENT PANEL POPULATION (2026-05-10)

This is what the operator would see right now if the panel existed:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ACTIVE BRANCHES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 [TRAIN]    claude/setup-codex-gMAyH   6eeb052   0h   ACTIVE
            Corridor: COHORT-2-REG (PENDING, FRESH, GO mode)
 [ANALYSIS] claude/phase1-playbooks    44c8dea   0h   ACTIVE
            Corridor: (none active)
 [INTEG]    main                       5db5ddf   -    STABLE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 SYNC STATE                            ⚠ REVIEW DEBT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Analysis LIVE_CORRIDOR_V2.md → STALE (pre-departure, 7169 lines)
 Analysis POST_REGISTER_CORRIDORS.md → STALE (pre-departure)
 Resolution: New LIVE_CORRIDOR_V2.md written on Train at 6eeb052 ✓
             POST_REGISTER_CORRIDORS.md still stale — superseded by
             CLEAN_FREEZE_PHASE_A_STAGE2.md next packet spec

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ALERTS                                (none critical)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Session 10 can resume safely. Run entry gate before proceeding.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## CLAIM REGISTRY

| ID | Claim | Status |
|----|-------|--------|
| OPR-1 | Information requirements (what the operator needs) | PROVEN |
| OPR-2 | Minimal implementation via WIP.md + corridor docs | PROVEN |
| OPR-3 | Current panel population populated from real state | PROVEN |
| OPR-4 | 30-second scan section requirements | EXPERIMENTAL |
| OPR-5 | Corridor visibility section requirements | EXPERIMENTAL |
| OPR-6 | Freeze visibility section requirements | EXPERIMENTAL |
| OPR-7 | Merge go/no-go checklist requirements | EXPERIMENTAL |
| OPR-8 | Sync state / review debt section requirements | EXPERIMENTAL |
| OPR-9 | Alert priority system requirements | EXPERIMENTAL |
| OPR-10 | Software panel with UI indicators and color coding | CONCEPTUAL |
```
