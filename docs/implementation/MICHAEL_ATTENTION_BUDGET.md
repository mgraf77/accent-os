# Michael Attention Budget
**Relay cost model and recommended operational parameters**

**Version:** 1.0  
**Authority:** Implementation Hub  
**Branch:** claude/implement-claude-design-ui-eFn9b  
**Created:** 2026-05-09  
**Status:** Active  

---

## Purpose

AccentOS is built by a team of one human (Michael) coordinating with AI sessions.
The bottleneck is not compute, storage, or network — it is Michael's attention.

This document models the attention cost of each relay activity, identifies the
highest-cost friction points, and produces a concrete set of operational recommendations
designed to keep the total relay overhead below an acceptable threshold.

The target: Michael can maintain meaningful oversight of 1–3 active sessions
while running a real business, from a phone, in a total of ≤ 30 minutes/day
of active relay time.

---

## Relay Cost Components

### 1. App Switching Cost

Every time Michael must switch from Accent Lighting business context to AccentOS
development context, there is a cognitive load cost. This includes:

- Opening Claude Code / terminal app
- Re-orienting to last known session state
- Deciding what to do next

**Estimated cost per switch:** 2–5 minutes cold (no context), 45–90 seconds warm
(relay digest read in prior 4 hours).

**Mitigation:** Relay digest (`runtime/handoffs/_relay.md`) reduces cold-start to
warm-start. Phase 2 / Phase 4 MVHB features.

---

### 2. Clipboard Risk

Relay prompts that are too long get truncated on mobile clipboard paste.
Truncated prompts produce sessions that start with partial context — these sessions
often waste the first 5–10 minutes reconstructing missing context via file reads.

**iOS clipboard limit:** ~30,000 characters (effectively unlimited for prompts)
**Practical mobile typing limit:** Anything Michael must TYPE (not paste) is lost.
All session prompts must be pasteable, not typed.

**Risk threshold:** Relay prompts > 2,000 characters become fragile on mobile.
If Michael must scroll to understand the prompt, he's less likely to send it accurately.

**Recommended relay prompt max:** 400 characters body + structured header.
If more context is needed, it lives in `runtime/handoffs/_relay.md` which Claude reads
automatically at session start.

---

### 3. Prompt Fatigue

Prompt fatigue occurs when Michael must make decisions that should have been
pre-resolved. Indicators:

- Session asks Michael to choose between Option A and Option B when the spec already decides
- Session asks for confirmation on a safe, reversible action
- Session asks Michael to explain project context that CLAUDE.md answers
- Session produces output requiring Michael to copy-edit before pasting as next prompt

**Cost per unnecessary decision point:** 30–120 seconds + cognitive load.
**Compound effect:** 3+ unnecessary questions in one session → Michael disengages.

**Mitigation:** CLAUDE.md `dangerouslySkipPermissions: always on`. Sessions should
NOT ask for confirmation on file writes, git operations, or bash commands. If a
decision is genuinely blocking, write it to the queue as DEC-xx and terminate.
Do not ask Michael to resolve it in-session.

---

### 4. Governance Fatigue

Governance fatigue is distinct from prompt fatigue. It occurs when the overhead of
reading governance documents (CLAUDE.md, risk matrices, decision logs) exceeds their
utility. Signals:

- Michael skips reading handoff and just types "continue"
- DEC-xx items pile up without resolution (currently: DEC-01 still unresolved)
- Michael asks Claude to summarize a doc he wrote last week

**Current governance debt:**

| Item | Days unresolved | Cost if unresolved |
|------|----------------|-------------------|
| BUG-01 wrangler deploy | ~30 days est | Phase A blocked |
| DEC-01 Phase A decisions | ~30 days est | Phase A blocked |
| SQL-01 migrations | ~30 days est | Production data blocked |

**Mitigation:** Keep Michael action items to ≤ 3 simultaneously. If queue grows
beyond 3 BLOCKED items, the next session should produce a Decision Lock document
(R-02 in queue) that lets Michael resolve all open decisions in one sitting.

---

### 5. Mobile Interaction Cost

Mobile-specific friction factors:

| Action | Estimated time |
|--------|---------------|
| Read 50-line relay digest | 45 sec |
| Read 400-line handoff packet | 4–6 min |
| Paste prompt to Claude Code | 15 sec |
| Navigate to runtime/ in GitHub mobile | 90 sec |
| Read queue index | 60 sec |
| Compose next prompt from scratch | 3–5 min |
| Copy-edit AI-generated relay prompt | 2–4 min |
| Approve suggested next prompt | 10 sec |

**Key insight:** The difference between "copy-edit a relay prompt" (3 min) and
"approve suggested next prompt" (10 sec) is 18x. Sessions should always produce
a suggested next prompt in the relay output. Michael can approve it verbatim.

---

### 6. Session Monitoring Burden

Monitoring cost is incurred when Michael must check on active sessions during execution.
This should be near zero for well-structured sessions.

**Ideal:** Session runs, completes, emits handoff. Michael gets one notification (push),
reads relay, approves next prompt. Total: 90 seconds.

**Current state:** Sessions produce long output that Michael must scan for key findings.
No relay digest exists yet. Monitoring burden is ~5 minutes per session boundary.

**Phase 2 target:** Relay digest reduces monitoring burden to 90 seconds per boundary.

---

### 7. Opportunity Cost

Every minute Michael spends on AccentOS relay overhead is a minute not spent on:
- Actual Accent Lighting business operations
- Sales / customer relationships
- Strategic planning
- Rest

This is the real cost. Governance and tooling should treat Michael's attention as
a scarce resource, not an abundant one.

**Budget constraint:** ≤ 30 minutes/day total relay time across all sessions.
At current session cadence (1–2 sessions/day), that's ≤ 15 minutes per session boundary.

---

## Relay Overhead Model

**Per session boundary (start + end):**

| Component | Current state | Phase 2 target |
|-----------|--------------|----------------|
| Read handoff / relay digest | 4–6 min | 45 sec |
| Compose next prompt | 3–5 min | 10 sec (approve suggested) |
| Monitor session mid-run | 2–5 min | 0 (no mid-run check needed) |
| App switching (×2) | 4–10 min | 1.5 min |
| **Total per boundary** | **13–26 min** | **~2.5 min** |

Current overhead is unsustainable at any volume > 1 session/day.
Phase 2 relay compression is the single highest-leverage intervention.

---

## Recommended Operational Parameters

### Active Session Count

**Recommended:** 1 active session at a time  
**Rationale:** Each additional concurrent session adds ~5 min monitoring overhead
and risks merge conflicts. Until relay compression (Phase 4) is in place, parallelism
costs more than it saves for Michael.  
**Exception:** A second session may run if: (a) it is documentation-only, (b) it
touches no files in common with the first, (c) both have separate queue items.  
**Maximum:** 2 (never 3 until Phase 3 queue locking is active).

### Frozen Session Count

**Target:** 0 frozen sessions at all times  
**Rationale:** Each frozen session creates ambiguity about what work is in progress.
Michael must spend time reconstructing state rather than moving forward.  
**Acceptable maximum:** 1 (recoverable in next session's spawn phase).  
**Action required if > 1:** Hub session performs cleanup before any new task work.

### Maximum Session Lifespan

**Recommended:** 2–3 hours of wall-clock time for standard tasks  
**Hard limit:** 4 hours  
**Rationale:** Context quality degrades past ~80% window usage. Sessions beyond 4
hours are statistically more likely to produce context drift, scope expansion, or
missed boot smoke checks.  
**Emergency exception:** A session working on a single critical bug may extend to
6 hours with explicit Michael override.

### Ideal Prompt Size

**Maximum relay prompt from Michael:** 400 characters (fits one mobile screen)  
**Maximum structured prompt with attachments:** 1,500 characters  
**Ideal:** The session always produces a suggested next prompt. Michael copies and sends.  
**Never:** Michael composes a prompt from scratch for a continuation session.

### Ideal Handoff Format

**Full handoff packet:** ≤ 500 lines. Required fields per SCHEMA.md v1.  
**Relay digest:** ≤ 50 lines. Fast read from phone.  
**Next prompt suggestion:** Always present. Paste-ready, 200–400 characters.  
**Michael action items:** Bulleted list, max 3. If > 3 items queue up, consolidate into a Decision Lock doc.

### Ideal Queue Depth

**READY items:** 2–4 (enough for session variety, not overwhelming)  
**BLOCKED items:** ≤ 3 at any time (beyond 3, create Decision Lock doc)  
**IN FLIGHT items:** ≤ 2 (one hub, one bounded worker at most currently)  
**GATE-LOCKED items:** Any number (these don't require Michael attention now)

**Queue stagnation warning:** If the same items sit in READY for > 7 days without
being claimed, either (a) they are actually blocked and mislabeled, or (b) session
cadence is too low.

### Ideal Merge Cadence

**Recommended:** Merge to main every 2–3 weeks (aligned with Phase gates)  
**Not recommended:** Merge on every commit (introduces production risk) or never
(branch divergence grows unmanageable)  
**Current state:** This branch is 5+ commits ahead of main, no merge authorized
(pending DEC-01 + DEC-02 resolution). First merge = Phase A gate passage.  
**Trigger for merge:** Phase gate criteria satisfied (see ACCENTOS_IMPLEMENTATION_SEQUENCE.md)
+ Michael explicit authorization.

### Ideal Relay Cadence

**Session boundary relay:** Every session end. Non-negotiable.  
**Mid-session relay:** Only if session discovers a Michael-blocking item. Then:
emit the blocking item + partial handoff + terminate. Do not continue without resolution.  
**Status relay (STATUS.md update):** Every session start + session end (Phase 2 feature).  
**Never relay:** Mid-task status updates that don't require Michael action.
These add to monitoring burden without adding value.

---

## Decision Lock Integration

The highest-leverage single action Michael can take to reduce relay overhead is
resolving DEC-01 (Phase A decisions). This unlocks:
- gl-01-phase-a-integration
- dec-02-phase-a-auth
- All Phase A integration work (Phase A = major scope of build)

**Estimated Michael time to resolve DEC-01:** 15–30 minutes of focused reading
+ answering 5 questions inline in `docs/design/ACCENTOS_PROGRESSIVE_SHELL_ROLLOUT.md §11`.

**ROI:** Resolving DEC-01 unblocks dozens of sessions of work. It is the highest
ROI use of 30 minutes of Michael's attention in this project.

---

## Monitoring This Budget

This document should be updated when:
- Session cadence changes (more or fewer sessions per week)
- A new blocking item type emerges
- Relay format changes (Phase 2/4 activation)
- Michael explicitly reports relay fatigue

The efficiency-monitor skill (see CLAUDE.md §1.j) tracks session-level efficiency
signals. Its session-end-summary.md surfaces patterns that indicate attention budget
violations (e.g., recurring clarification loops = prompt design failure).

---

## Summary: Recommended Parameters

| Parameter | Recommended | Max |
|-----------|-------------|-----|
| Active sessions simultaneously | 1 | 2 |
| Frozen sessions tolerated | 0 | 1 |
| Session lifespan | 2–3 hours | 4 hours |
| Relay prompt size (Michael → Claude) | 200–400 chars | 1,500 chars |
| Handoff packet size | ≤ 500 lines | 800 lines |
| Relay digest size | ≤ 50 lines | 75 lines |
| Michael action items in flight | ≤ 3 | 5 |
| Queue READY depth | 2–4 | 6 |
| Merge cadence | 2–3 weeks | 4 weeks |
| Michael relay time/day | ≤ 30 min | 45 min |
| Michael relay time/session boundary | ≤ 15 min | 20 min (pre-Phase 2) / 3 min (post-Phase 2) |
