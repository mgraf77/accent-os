# OPERATIONAL ERGONOMICS

> Solo-operator + mobile-relay usability rules. Optimizes for friction, not features.
> Includes Mobile Handoff Mode (now a permanent protocol).
> tag: CORE

## Operator Profile
- 1 human (Michael).
- 1 primary AI session at a time (Claude Code on web / desktop / iOS).
- Frequent device switches (desktop ↔ mobile ↔ Codespace ↔ iOS app).
- Relay handoffs between devices via copy/paste.

## Friction Audit (P1 baseline)

| Source | Severity | Notes |
| --- | --- | --- |
| Multi-message session continuations | HIGH | Mobile copy/paste loses content across messages. |
| Fragmented status output (chunks across turns) | HIGH | Forces the operator to scroll + reassemble. |
| Spec-heavy reading at session start | MED | Mitigated by the ≤4k-token warm-start list. |
| Cross-file pointer chasing | MED | Mitigated by canonical state being the first read. |
| Governance overhead for trivial ops | MED | Mitigated by AUTO_FIX_POLICY allowlist (when active). |
| Long agent/tool chains without status | LOW | Mitigated by status-block-after-commit rule. |

## # MOBILE HANDOFF MODE (permanent protocol)

A protocol for **all session output that is intended for relay** (i.e. content the
operator copies from one device/session to another).

### Requirements
1. **Single copy block** — final summary fits in one ``` fenced block. No prose after it.
2. **No fragmented relay** — do not split the summary across multiple messages or
   tool-call narration interleaved with summary lines.
3. **No multi-message continuations** — if more is needed, ask in a separate turn.
4. **Mobile-first ergonomics** — assume small screen; prefer short lines (~80 chars),
   no horizontal-scroll tables, no nested code fences.
5. **Self-contained** — the block must be readable cold. No "see file X" pointers
   without a one-line summary of what's there.

### When Mobile Handoff Mode applies
- End-of-turn session summary.
- Status snapshots intended for paste-back.
- Cross-device handoffs ("continue last session", "wrap up").
- Any output prefixed by the operator with `mh:` or `relay:`.

### When it does NOT apply
- Active tool-call narration (one-sentence updates per CLAUDE.md tone rules).
- Plan-Then-Execute patch plans (those have their own template).
- Inline code edits.

### Compliance Checklist (pre-send)
- [ ] Final block is one fenced section.
- [ ] No prose follows it.
- [ ] Lines ≤ 100 chars where practical.
- [ ] All key facts (commit, branch, files changed, next required action) are inside
      the block — not above it.
- [ ] No "see [file]" without one-line gloss.

## Other Ergonomics Rules

### Status Block Standard
Every session-end output (mobile or not) must include:
- branch + commit SHA (short)
- files added / changed (counts)
- next required action (one line)
- any open escalation id

### Read-Order Discipline
- CANONICAL_RUNTIME_STATE first, every session.
- BUILD_PLAN_CLAUDE second.
- WORK_IN_PROGRESS third.
- All other docs only when the canonical state's "Next Required Read" list points to them.

### Anti-Bureaucracy Rule
If a governance step would consume more time than the underlying change, escalate the
process for simplification rather than performing both. Record the friction in the
`audits/AUDIT_LOG.md` with `kind:note action:routed-to-DER`.

### Patch-Plan Threshold
A patch plan is **required** at C4+. For C0–C3, no patch plan is required and prose
description in the commit message is sufficient.

### Tool-Use Discipline
- Prefer one tool call per message line update; do not narrate every internal step.
- Batch independent tool calls into a single message for parallelism.
- Sleep / poll patterns are forbidden; rely on event-driven returns.
