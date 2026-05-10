# Execution Packet Protocol
> AccentOS bounded-session doctrine. Version 1.0.

---

## The Core Distinction

| Concept | What it is | What it is NOT |
|---|---|---|
| **Execution Packet** | A bounded, self-describing Claude Code session with declared scope, stop conditions, and a generated continuation prompt | A durable agent that persists across sessions |
| **Durable Runtime Orchestration** | A persistent supervisor that routes work autonomously across sessions | **This does not exist in AccentOS** |

**Durable orchestration does not exist here.** There is no scheduler, no cross-session state bus, no autonomous router. Each session starts cold. The execution packet protocol is the substitute — it makes each bounded session self-aware enough to hand off cleanly to the next one without requiring Michael to reverse-engineer state.

---

## Execution Packet Structure

Every packet declares these fields at the start of its session prompt:

```
PACKET: <short name>
VERSION: <packet version or N/A>
SCOPE: <what this packet may touch>
FORBIDDEN: <what it must not touch>
INPUTS: <files/state it reads before acting>
OUTPUTS: <files/state it produces>
STOP CONDITIONS: <when to stop even if not done>
ROLLBACK PATH: <how to undo everything this packet did>
VERIFICATION: <how to confirm success before calling done>
ESCALATION TRIGGER: <what makes this packet defer to Michael>
```

None of these fields are suggestions. A packet that omits `STOP CONDITIONS` is not an execution packet — it's an open-ended session, which has no guarantee of clean-freeze behavior.

---

## Continuation Doctrine

**The most important job of a packet is to generate its own continuation.**

At session end, every packet must produce a `NEXT PROMPT` block — a complete, pasteable prompt for the next session. The goal: Michael's only relay action is `Ctrl+C / Ctrl+V`.

A valid continuation prompt:
- Identifies the packet by name and version
- States what was completed
- States what is incomplete (if anything)
- States the current known blockers
- Contains the exact task description for the next session
- Fits in a single copy block

An invalid continuation prompt:
- "Continue where we left off" (no context)
- "See WORK_IN_PROGRESS.md for state" (requires reading to act)
- "Do X next" without specifying scope/forbidden zones

---

## Freeze Doctrine

**Clean freeze** = the session can be abandoned at any point without leaving the repo in a broken state.

Rules for clean-freeze compatibility:
1. Every intermediate state must be committable. Partial work that hasn't broken anything can be committed as WIP.
2. Never hold broken state in uncommitted files. If a file is modified but the system is non-functional, either fix it or revert it before freezing.
3. WORK_IN_PROGRESS.md is overwritten after every discrete step. It always reflects the actual state of the repo, not the intended state.
4. Commits are the freeze checkpoints. Between commits, the session may be in flight — but each commit marks a recoverable state.

**Clean-freeze acquisition:** Before freezing, the packet must:
- Commit all changes (or revert to last clean commit)
- Overwrite WORK_IN_PROGRESS.md with current state
- Write the NEXT PROMPT block to session output or WORK_IN_PROGRESS.md
- Push to remote

---

## Stop Conditions

A packet stops when ANY of these is true:

| Condition | Action |
|---|---|
| Forbidden zone encountered | Stop. Log in WIP. Escalate. |
| Uncertainty about scope | Stop. Log question in WIP. Escalate. |
| Unexpected non-clean state discovered (merge conflict, broken file, stale dep) | Stop. Diagnose. Escalate if uncertain. |
| Step produces no output or wrong-shaped output | Stop. Log. Escalate. |
| Packet reaches declared output | Stop. Verify. Freeze. Generate continuation. |
| Token/context budget clearly running low | Stop gracefully. Commit what's done. Write continuation. |

**Stopping gracefully is always better than continuing into uncertainty.**

---

## Escalation Doctrine

Escalation = a decision that requires Michael. Not every problem requires escalation.

**Escalate when:**
- The correct path requires choosing between two architecturally different approaches
- A forbidden zone would be necessary to complete the declared output
- A discovered state contradicts the packet's assumptions (e.g. schema mismatch, unexpected file contents)
- The verification step fails and the cause is unclear
- A dependency is missing that can't be resolved in-session

**Do NOT escalate when:**
- The issue is mechanical (wrong field name, stale import, broken reference — just fix it)
- The issue is a known pattern with a known fix from BUILD_INTELLIGENCE.md
- The issue would resolve itself if the packet continued

**Escalation format:**
```
ESCALATION REQUIRED
Packet: <name>
Point of failure: <what step triggered the escalation>
Question: <the single yes/no or choice question for Michael>
Option A: <approach A — implication>
Option B: <approach B — implication>
Safe freeze state: <last clean commit>
Resume: <what to do after Michael answers>
```

---

## Forbidden Zone Handling

Forbidden zones are declared per-packet. When a step would require entering a forbidden zone:

1. **Stop immediately.** Do not find a workaround that technically avoids the zone but achieves the same effect.
2. **Log the blocked step** in WORK_IN_PROGRESS.md: which step, which zone, why it was hit.
3. **Assess whether the packet output is achievable without the zone.** If yes, document the limitation and continue. If no, escalate.
4. **Never** add a new step that "just quickly touches" a forbidden zone because it would be more efficient.

The forbidden zone list for AccentOS sessions unless explicitly overridden:
- `index.html` direct mutation (decomposition packets have exceptions — see PHASE1 docs)
- Production deploys (wrangler deploy, Cloudflare Pages)
- SQL/database mutations
- Governance doc writes (unless the packet is a doc-update packet)
- Cloudflare Worker source edits
- `.env` / `wrangler.toml` / `settings.local.json`

---

## Next-Prompt Generation Rules

The continuation prompt must be **self-contained**. It cannot rely on context from the current session being visible to the next session.

Checklist:
- [ ] Packet name and version identified
- [ ] Branch name stated
- [ ] Last clean commit hash or description stated
- [ ] What was completed (brief, not exhaustive)
- [ ] What was NOT completed (if partial)
- [ ] Known blockers that the next packet may encounter
- [ ] Exact scope for next packet (what to touch, what not to touch)
- [ ] Forbidden zones re-stated
- [ ] Expected output of next packet
- [ ] Verification method for next packet

The prompt should be copy-pasteable without editing. If Michael needs to fill in blanks, the prompt failed.

---

## Self-Contained Execution Windows

A self-contained window means the packet does not depend on state that was established in a prior session **unless** that state is readable from the repo at session start.

Always readable (acceptable dependencies):
- Files committed to git
- WORK_IN_PROGRESS.md
- BUILD_PLAN_CLAUDE.md
- BUILD_INTELLIGENCE.md
- Any `.md` or `.js` or `.html` file in the repo

Never acceptable dependencies:
- In-memory state from a prior session
- Output printed to a prior session's terminal that was not committed
- Michael's recollection of a prior session
- Prior session's tool results that were not persisted

**If a packet needs state from a prior session, that state must be written to a file and committed before the prior session ends.**
