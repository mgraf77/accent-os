# Continuation Chain Template
> Reusable session-end output patterns for AccentOS bounded execution packets.
> Copy the relevant section. Fill in the blanks. Do not summarize — be specific.

---

## DONE / KNOWN / NEXT / BLOCKERS Block

Use at end of every session, even trivial ones.

```
═══════════════════════════════════════════════
DONE
═══════════════════════════════════════════════
- [file/function/module]: [what was done — 1 line]
- [file/function/module]: [what was done — 1 line]
Commits: [hash1] [hash2]
Branch: [branch-name] — pushed ✓

KNOWN
═══════════════════════════════════════════════
- [Bug/issue that exists but was not fixed this session — 1 line each]
- [Technical debt created — 1 line each]
- [Assumption made that needs verification — 1 line each]

NEXT
═══════════════════════════════════════════════
- [The specific next action — not "continue" — the actual task]
- [Second action if first completes — optional]

BLOCKERS
═══════════════════════════════════════════════
- [What Michael must do before next session can proceed — or "None"]
- [External credential / deploy / SQL needed — or "None"]
```

---

## SAFE CONTINUE Block

Use when the next session can proceed without any Michael input.

```
SAFE CONTINUE ✓
Branch: [branch-name]
Last commit: [hash] — [message]
Next packet: [PACKET_NAME_V1]
Paste this to start: → see NEXT PROMPT block below
```

---

## CLEAN FREEZE Block

Use when stopping mid-scope. Work is committed but incomplete.

```
CLEAN FREEZE
Branch: [branch-name]
Last clean commit: [hash] — [message]
State: [WIP commit / clean]
What's done: [specific completed steps]
What's NOT done: [specific incomplete steps]
Why frozen: [context limit / Michael decision needed / end of session]
Resume: copy NEXT PROMPT block below and paste into new session
```

---

## NEXT PROMPT Block

The single most important output of a session. This block must be completely copy-pasteable. The next session reads this and nothing else.

```
══════════════════════════════════════════════════
NEXT PROMPT — paste this into the next session
══════════════════════════════════════════════════

Packet: [PACKET_NAME] v[N]
Branch: [branch-name]
Resuming from: [hash] ([message])

Context:
[2-4 sentences max describing what has been done so far in this chain.
No jargon. Enough to understand the current state of the work.]

Completed this packet:
- [specific thing done]
- [specific thing done]

Your task this session:
[Exact task description. What to build/fix/extract/document.
Be specific about file names, function names, line ranges if relevant.]

Scope (you may touch):
- [file or dir]
- [file or dir]

Forbidden zones (do NOT touch under any circumstances):
- index.html [unless explicitly stated otherwise]
- Production deploys
- SQL / Supabase schema
- Cloudflare Worker source
- governance docs (BUILD_PLAN_CLAUDE.md, CLAUDE.md, etc.) [unless this is a doc packet]

Stop conditions:
- [Specific condition that means stop]
- [Specific condition that means stop]
- [Any Michael-decision point that would require escalation]

Verification before committing:
- [How to confirm the output is correct — grep, test, count, visual check]

Rollback path if something breaks:
- git checkout -- [file]
- OR: git revert HEAD --no-edit

Expected output:
- [Specific file(s) created or modified]
- [Specific function(s) added or changed]
- Commit message should start with: [feat/fix/docs/refactor]([scope]): [description]

After completing, generate the next NEXT PROMPT block for the following task:
[Brief description of what comes after this packet — or "CHAIN COMPLETE" if this is the last.]

══════════════════════════════════════════════════
```

---

## ESCALATION REQUIRED Block

Use when the packet has hit a point that requires a Michael decision before continuing.

```
══════════════════════════════════════════════════
ESCALATION REQUIRED — Michael input needed
══════════════════════════════════════════════════

Packet: [PACKET_NAME]
Frozen at: [step name / line range / function]
Safe freeze commit: [hash]

The problem:
[1-3 sentences describing exactly what was encountered and why it requires a decision.]

The question:
[Single yes/no or A/B question for Michael]

Option A: [approach]
  → Impact: [what this changes]
  → Risk: [what could go wrong]

Option B: [approach]
  → Impact: [what this changes]
  → Risk: [what could go wrong]

After Michael answers "[A / B / other]":
  Resume prompt: → see NEXT PROMPT block below, filling in [MICHAEL_ANSWER]

══════════════════════════════════════════════════
```

---

## CHAIN COMPLETE Block

Use when the final packet in a continuation chain is done.

```
══════════════════════════════════════════════════
CHAIN COMPLETE
══════════════════════════════════════════════════

Chain: [CHAIN_NAME]
Started: [date or first commit hash]
Completed: [date or final commit hash]
Branch: [branch-name] — pushed ✓

Packets executed:
1. [PACKET_1] — [hash] — [1-line summary]
2. [PACKET_2] — [hash] — [1-line summary]
N. [PACKET_N] — [hash] — [1-line summary]

What changed in the repo:
- [file changed and why]
- [new file and why]

What did NOT change (explicitly out of scope):
- [file/module that was considered but left alone]

Known issues introduced (if any):
- [issue] — [suggested fix]

Merge-safe: [YES / NO — if no, explain]

Next action for Michael:
[The single most important thing to do next — deploy, test, merge, etc.]

══════════════════════════════════════════════════
```

---

## Quick Reference — Which Block to Use

| Situation | Block |
|---|---|
| Normal session end, all scope done | DONE/KNOWN/NEXT/BLOCKERS + SAFE CONTINUE + NEXT PROMPT |
| Session done, next session needs Michael first | DONE/KNOWN/NEXT/BLOCKERS + ESCALATION REQUIRED |
| Session stopped mid-scope (context, time) | CLEAN FREEZE + NEXT PROMPT |
| Final packet in a multi-session chain | DONE/KNOWN/NEXT/BLOCKERS + CHAIN COMPLETE |
| Hit a decision point, stopping | ESCALATION REQUIRED |
| Minor maintenance session | DONE/KNOWN/NEXT/BLOCKERS only (skip full NEXT PROMPT if trivial) |

---

## Anti-Patterns (Never Use)

| Phrase | Why it fails |
|---|---|
| "Continue where we left off" | No context. Next session starts cold. |
| "See WIP.md for details" | Forces reading before acting. Breaks copy-paste relay. |
| "Pick up from step 3" | Step 3 of what? Self-referential without the DONE block. |
| "Everything is working" | Not a verification. What was verified, how? |
| "You know what to do next" | I don't. I start cold. |
| "This is mostly done" | What's done and what's not? Specific. |
| "Run the usual checks" | What are those? State them. |
