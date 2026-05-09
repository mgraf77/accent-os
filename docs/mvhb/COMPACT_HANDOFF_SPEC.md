# COMPACT HANDOFF SPEC
> AccentOS MVHB — Format rules for zero-friction human relay between Claude sessions.
> Non-negotiable: one copyable block, no split boxes, mobile-readable.

---

## CORE RULE
Every Claude session that ends with a handoff MUST produce exactly ONE fenced code block.
No exceptions. No split boxes. No markdown tables.

---

## OUTPUT FORMAT

```
SESSION HANDOFF — [date] [feature/task]

BRANCH: [branch-name]
LAST COMMIT: [hash] — [message]
STATUS: [DONE | WIP | BLOCKED | FAILED]

WIP:
[1-3 line summary of exact stopping point]

NEXT:
[single next action — imperative, <10 words]

CONTEXT:
[any critical env facts Claude can't read from files — credentials status, deploy state, external dependency state]

ERRORS (if any):
[raw error text or "none"]

RELAY IN:
resume
```

---

## CONSTRAINTS

**Single code block:**
- One ``` open, one ``` close
- No nested fences
- No multi-block output

**No split boxes:**
- Never produce separate code blocks for "status" and "next steps"
- Never split commit hashes from context
- Never break handoff across multiple tool calls visible to relay

**No markdown tables:**
- Tables don't copy cleanly on iOS
- Use labeled lines instead: `LABEL: value`

**Copy-once format:**
- Everything the next session needs is in one block
- The relay pastes once, session loads, types `resume`
- No "also check X" footnotes outside the block

**Compact summaries:**
- WIP section: 3 lines max
- NEXT section: 1 action, 10 words max
- CONTEXT section: only facts not in git/WIP files

**Bounded verbosity:**
- No greetings, no sign-offs inside the block
- No "here's what we accomplished" recaps
- No redundancy with what's in WORK_IN_PROGRESS.md

**Mobile readability:**
- Line width: 60 chars max inside block
- No inline code with backticks (they render oddly in iOS paste)
- Use ALL-CAPS labels for scannability

**Token discipline:**
- Handoff block: target 150 tokens, hard cap 300
- If context would exceed 300 tokens, summarize — don't truncate mid-thought

---

## RELAY-IN TRIGGER

When a session receives a pasted handoff block, it detects:
- `SESSION HANDOFF` header line
- `RELAY IN:` section

And immediately:
1. Reads WORK_IN_PROGRESS.md (authoritative state)
2. Cross-checks pasted NEXT against WIP
3. Executes NEXT
4. No confirmation prompt

---

## BAD HANDOFF (avoid)

```
Here's a summary of what we did:

**Status:** We fixed the worker proxy and it's mostly working now.

**Next steps:**
- Check if the deploy went through
- Test the Parse button
- Maybe look at the model ID

**Branch:** claude/fix-worker-proxy (I think)

Let me know if you need anything else!
```

Problems: split intent, hedged language, no commit hash, no exact next action, verbose, non-copyable as relay.

---

## GOOD HANDOFF

```
SESSION HANDOFF — 2026-05-09 worker-proxy

BRANCH: claude/prompt-compression-relay-UN7sY
LAST COMMIT: 2dca2a6 — fix: worker proxy body passthrough
STATUS: BLOCKED

WIP:
Worker redeploy pending on Michael's local machine.
400 on /v1/messages — new code not live yet.
Debug step 1: confirm worker version.

NEXT:
Run browser console test, paste response here.

CONTEXT:
Worker URL: accentos-anthropic-proxy.mgraf77.workers.dev
API key in sessionStorage as aos-api.
New code = returns {"error":"Missing x-api-key header"} on bare POST.

ERRORS:
POST /v1/messages 400 — [aiParseNotes] JSON parse error

RELAY IN:
resume
```

---

## ENFORCEMENT

Claude must reject requests to produce multi-block handoffs.
If asked for "detailed handoff", produce one block with more CONTEXT lines — not multiple blocks.
