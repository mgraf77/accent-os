# OPERATIONAL MODES

## Purpose
Defines the seven operational modes the runtime can be in. A mode constrains what the
session may do — permissions, mutation classes, escalation behavior, and required outputs.

## Mode Index

| # | Mode | Default Mutation Cap | Output |
| --- | --- | --- | --- |
| 1 | Passive Audit | C0 (read-only) | findings → AUDIT_LOG |
| 2 | Gotcha Detection | C0–C1 | append GOTCHA_REGISTER observations to AUDIT_LOG |
| 3 | Safe Auto-Fix | C0–C3 (allowlist only) | bounded patch + revert-on-fail |
| 4 | Plan-Then-Execute | C0–C6 (per plan) | patch plan → reviewed commit |
| 5 | Deferred / Research / Escalation | C0–C1 | DER intake / escalation entry |
| 6 | Clean Pause Stabilization | C0–C2 + C5 (governance) | checkpoint + optional LKG |
| 7 | Emergency Recovery | C0 + restore script only | rollback to LKG + post-restore audit |

## 1 — Passive Audit
- **Permissions:** read-only across all paths.
- **Mutation limits:** none. C0 only.
- **Escalation requirements:** must escalate on E1, E5, E7 immediately.
- **Rollback behavior:** n/a.
- **Output requirements:** findings appended to AUDIT_LOG; no other artifacts.

## 2 — Gotcha Detection
- **Permissions:** read + append to AUDIT_LOG and GOTCHA_REGISTER observations log.
- **Mutation limits:** C1 append only.
- **Escalation:** as Passive Audit; plus E10 if gotcha recurs 3×.
- **Rollback:** revert any append on syntax/format error.
- **Output:** structured observation entries with detector id + evidence pointer.

## 3 — Safe Auto-Fix
- **Permissions:** AUTO_FIX_POLICY allowlist only.
- **Mutation limits:** ≤ 5 fixes / session, ≤ 1 fix / file, ≤ 20 LoC / fix.
- **Escalation:** auto-revert on failure; E5 / strike rule on 3× revert.
- **Rollback:** automatic via `git revert`.
- **Output:** diff, class declaration, linked observation id, rollback command.

## 4 — Plan-Then-Execute
- **Permissions:** any class up to C6 *only* if the plan declares it.
- **Mutation limits:** one C4+ patch in flight per branch (S4).
- **Escalation:** any unscoped-file touch → E8.
- **Rollback:** revert command stated in plan; auto-revert on verification failure.
- **Output:** committed patch + delta entry + register/audit updates.

## 5 — Deferred / Research / Escalation
- **Permissions:** read + append to DER and AUDIT_LOG/escalation entries.
- **Mutation limits:** C0–C1 only.
- **Escalation:** generates them, does not act on them.
- **Rollback:** revert append on schema violation.
- **Output:** DER intake entries (template-conforming) and/or escalation entries.

## 6 — Clean Pause Stabilization
- **Permissions:** C0–C2 plus C5 (governance edits when explicitly approved).
- **Mutation limits:** all changes batched into a single atomic commit.
- **Escalation:** E2 / E7 if metrics cannot be computed cleanly.
- **Rollback:** the prior canonical state is itself the rollback target.
- **Output:** updated CANONICAL_RUNTIME_STATE, delta entry, optional LKG bump,
  optional governance edit.

## 7 — Emergency Recovery
- **Permissions:** restricted to executing the LKG restore procedure.
- **Mutation limits:** none beyond what restore procedure prescribes.
- **Escalation:** preceded by an E5 escalation; followed by mandatory Passive Audit.
- **Rollback:** this *is* rollback. If LKG restore fails, escalate to human and stop.
- **Output:** restore evidence appended to AUDIT_LOG; new LKG only after Clean Pause.

## Mode Transitions
- Default starting mode at session start: **Passive Audit**.
- Promotion to higher modes requires either an explicit user request or a governance trigger.
- Demotion is automatic on:
  - Hard-stop hit → Passive Audit.
  - Auto-fix strike → Passive Audit (+ HIGH risk).
  - LKG restore needed → Emergency Recovery.

## Mode Compatibility with vibe-speak
- Modes here are runtime modes (what the system *does*); vibe-speak modes are voice modes
  (what the system *sounds like*). They compose. A session may be in `Plan-Then-Execute`
  runtime mode while in `gsd` voice mode.
- Auto-disengage rules in vibe-speak SKILL.md still apply to voice; they do not change
  runtime mode.

## Bootstrap (v0.1)
- Modes 1, 2, 5, 6 are usable at v0.1 (read-only + intake + clean pause for governance).
- Modes 3, 4, 7 require subsequent rollout phases (P2, P2, P3 respectively).
