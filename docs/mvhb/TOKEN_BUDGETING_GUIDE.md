# TOKEN BUDGETING GUIDE
> AccentOS MVHB — Token discipline for solo-dev relay sessions.
> Goal: maximize useful work per dollar; minimize context bloat.

---

## PROMPT SIZE TARGETS

| Prompt type | Target | Hard cap |
|-------------|--------|----------|
| Compact / queue | 5–20 tokens | 50 |
| Resume prompt | 1–5 tokens | 10 |
| Error relay | raw paste | 200 |
| Feature request | 50–100 tokens | 200 |
| Full session brief | 100–200 tokens | 400 |

**Rule:** If your prompt exceeds 200 tokens, it probably contains context Claude already has.
Check WORK_IN_PROGRESS.md, BUILD_PLAN_CLAUDE.md, BUILD_INTELLIGENCE.md first — then write a 20-token prompt.

---

## RESPONSE SIZE TARGETS

| Response type | Target | Hard cap |
|---------------|--------|----------|
| Status update | 30–80 tokens | 150 |
| Commit message | 10–20 tokens | 40 |
| Handoff block | 100–150 tokens | 300 |
| Code change | varies | no cap |
| Explanation | 100–300 tokens | 500 |
| Error analysis | 50–150 tokens | 300 |

**Rule:** Explanations that exceed 500 tokens are usually padding.
If the user didn't ask "why", don't explain why.

---

## SESSION TOKEN BUDGETS

**Sonnet session (standard build work):**
- Input context: keep under 10K tokens
- Output target: 500–2K tokens per turn
- Session total: 20K–50K tokens
- When to end: task complete OR context approaching 40K

**Opus session (complex design / architecture):**
- Input context: keep under 8K tokens
- Output target: 300–1K tokens per turn
- Session total: 10K–25K tokens
- When to end: decision made, hand off to Sonnet for implementation

**iOS relay session (human as relay, typing constrained):**
- Prompt budget: 10–50 tokens (thumb-typed)
- Response budget: 150 tokens visible before scroll
- Handoff block: 300 token hard cap
- Session total: under 15K tokens (fatigue kills relay at ~10 relay hops)

---

## COMPRESSION HEURISTICS

**Compress when:**
- Input context > 30K tokens
- Same file has been read >3 times in session
- Conversation has >10 turns with no commit
- User is on iOS (all responses should self-compress)
- Session started with a pasted handoff block (don't re-expand context)

**How to compress:**
1. Summarize prior turns into a single context paragraph
2. Anchor to: current branch + last commit hash + next action
3. Drop all intermediate reasoning
4. Drop file contents that are now stable (committed)

**Never compress:**
- Raw error text (context destroys debuggability)
- Commit hashes (precision required)
- Exact file paths (no abbreviations)
- Security-relevant values (API keys, env var names)

---

## WHEN TO SUMMARIZE

Summarize mid-session when:
- Claude has produced 3+ explanations that weren't used
- A dead-end was explored and abandoned
- A feature was partially built and then scrapped

Summarize at session end always:
- Write to WORK_IN_PROGRESS.md (authoritative)
- Write compact handoff block (relay format)
- Write SESSION_LOG.md entry (≤5 lines)

Do NOT summarize:
- Active code paths (read the file, don't paraphrase it)
- Pending errors (keep raw)
- The build plan (it's already in BUILD_PLAN_CLAUDE.md)

---

## WHEN TO TERMINATE SESSIONS

Terminate the session and start fresh when ANY of these are true:

1. **Context bloat** — session context > 50K tokens and no commit in last 5 turns
2. **Loop detected** — same error or same question appears 3+ times
3. **Task complete** — all queued items done, handoff block ready
4. **Blocked on Michael** — next step requires human action outside Claude's reach
5. **Model swap needed** — task type has changed (e.g., build → architecture decision)
6. **Relay fatigue** — >10 relay hops in session, compress and hand off

**Termination protocol:**
1. Commit everything committable
2. Write WORK_IN_PROGRESS.md
3. Produce handoff block (COMPACT_HANDOFF_SPEC format)
4. End turn

---

## TOKEN WASTE PATTERNS (avoid)

- Reading the same file twice in one turn
- Producing commit messages > 40 tokens
- Repeating the task back to the user before doing it
- Summarizing what you just did after every step
- Asking "shall I proceed?" when context is clear
- Including unchanged file content in responses
- Writing STATUS blocks mid-session (only at end)
- Re-reading WORK_IN_PROGRESS.md after writing it
