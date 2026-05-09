PROMPT COMPRESSION RULES
Mobile-First Relay Prompt Design
Version: 1.0 — 2026-05-09

---

PURPOSE

A relay prompt is any instruction sent from iPhone to Claude.
Relay prompts compete with:
  - Phone keyboard autocorrect
  - iOS clipboard volatility (clipboard clears on next copy)
  - Thumb typing fatigue
  - Context loss between app switches
  - Session context compression after long conversations

This document defines how to make relay prompts shorter, more
reliable, and less likely to be mangled by mobile input.

---

IDEAL PROMPT LENGTHS

By operation type:

  Status check:      1-5 words      (status / show queue / next)
  Session resume:    3-5 words      (continue last session)
  Queue add:         5-30 words     (queue: [prompt in plain language])
  Bug report:        5-15 words     (bug: [one plain-text sentence])
  Task redirect:     5-20 words     (stop, new priority: [one sentence])
  Feature request:   20-80 words    (describable in one paragraph)
  Multi-step task:   80-200 words   (phone edge — use desktop if 200+)
  Architecture:      200+ words     (desktop only — do not relay from phone)

Hard rule: if the prompt is over 200 words on mobile, split it
into a queue item (queue: [shorter version]) and flesh it out
in the next desktop session. Trying to type 300 words on iPhone
produces error-prone prompts that require clarification loops.

---

COMPACT HANDOFF PATTERNS

These are reusable relay patterns for common scenarios.

PATTERN 1 — Clean resume
  continue last session
  (3 words, always works, Claude reads WIP + HANDOFF)

PATTERN 2 — Resume with override
  continue — but skip the bug fix, go to next build item
  (catches the case where the bug is low priority)

PATTERN 3 — Queue with defer
  queue when M30 lands: [prompt]
  queue after #2 done: [prompt]
  queue for tomorrow: [prompt]

PATTERN 4 — Redirect in flight
  stop. new priority: [one sentence]
  (stops current task, logs it as paused, starts new priority)

PATTERN 5 — State check before committing
  what branch, last push, current gate
  (returns three fields from STATUS.md without a full status dump)

PATTERN 6 — Approve and continue
  looks good, ship it
  (Claude interprets as: commit + push current changes)

PATTERN 7 — Confirm gate pass
  gate 1 passed — continue to session b
  (Claude marks Gate 1 complete, reads Gate 2 requirements)

PATTERN 8 — Request a status snapshot
  status
  (returns STATUS.md verbatim — 6 lines)

PATTERN 9 — Force a WIP update
  update wip: [one sentence describing current state]
  (Claude writes that sentence to WIP.md WIP field)

PATTERN 10 — Interrupt with a bug
  bug: [description] — fix before continuing
  (logs bug AND triggers immediate fix, unlike bare "bug:")

---

TOKEN MINIMIZATION

These principles reduce both thumb-typing effort and Claude
context consumption.

PRINCIPLE 1 — Omit the obvious
  Bad:  "Please could you check the current status of the
         system and let me know what the next step is"
  Good: status

PRINCIPLE 2 — Use field labels as shortcuts
  Instead of: "What is the current branch we're working on?"
  Send: what branch

PRINCIPLE 3 — One idea per relay
  Do not chain multiple requests in one mobile relay.
  Chain only if the second depends on the first AND both are
  under 10 words each.
  OK:     status, then drain queue if anything ready
  Not OK: status, fix the bug, update the docs, push, and
          also check if M30 was marked done in the build plan

PRINCIPLE 4 — Trust the context
  Claude holds the session context. Relay prompts do NOT need
  to re-explain the current task. They only need to direct.
  Bad:  "We were working on the worker proxy fix where the
         aiParseNotes function is returning 400, can you
         continue with that?"
  Good: continue

PRINCIPLE 5 — Plain language over technical precision
  Claude translates plain language into technical actions.
  Relay prompts are not code. They are intent.
  Bad:  "Run git log --oneline -5 and check if commit 2dca2a6
         is present then verify it was pushed to origin"
  Good: confirm last push landed

PRINCIPLE 6 — Avoid preamble
  Delete: "I wanted to ask you to..."
  Delete: "Could you please..."
  Delete: "I was thinking we should..."
  Start with the verb.

PRINCIPLE 7 — Avoid appendices
  Delete: "...and let me know if you need anything else"
  Delete: "...thanks"
  Delete: "...does that make sense?"
  Claude will ask if clarification is needed.

---

COPY/PASTE ERGONOMICS

The most common mobile failure is clipboard corruption —
the prompt was partially typed, then a copy event replaced
the clipboard before pasting into Claude iOS.

Rules for prompts that require paste:

1. Draft the prompt in one app before copying
   Use Notes.app (not Messages, not email — they add formatting)
   Draft complete → copy once → switch to Claude → paste → send
   
2. Never copy-paste prompts longer than 5 lines on mobile
   5-line limit because iOS paste preview shows 3-4 lines max.
   Anything longer requires scrolling the paste preview to verify
   it wasn't truncated — most people skip that check.

3. For long prompts (20+ lines): use PROMPT_QUEUE.md instead
   Type: "queue: [short version of the prompt]"
   Then send the full prompt in the next desktop session.
   Queue item survives between sessions. Clipboard does not.

4. Multi-line code blocks should never be relayed from mobile
   If the prompt contains a code block longer than 3 lines,
   send: "queue: [description of what the code should do]"
   Claude will write the code. Do not paste code blocks on mobile.

5. JSON should never be relayed from mobile
   iOS autocorrect attacks JSON: it capitalizes keys, adds spaces
   after colons, converts quotes to smart quotes. Any JSON pasted
   into Claude iOS is likely malformed.
   Instead: describe the JSON structure in plain language.

---

RELAY COMPRESSION CHEAT SHEET

Full intent → compact relay:

  "Resume the session from where we left off with the worker
   proxy bug and continue fixing it"
  → continue last session

  "Can you check what's in the prompt queue right now?"
  → show queue

  "I want to queue a prompt to run later when M30 is done"
  → queue when M30 lands: [brief prompt]

  "What branch are we on and when was the last push?"
  → what branch

  "Please commit everything and push it to the remote"
  → ship it

  "Is there anything I need to manually check or verify
   before you keep building?"
  → current gate?

  "I found a bug — the vendor scores page shows blank data
   after login on iPhone"
  → bug: vendor scores blank after iPhone login

  "I'm done for today, please wrap everything up and do
   the session-end writes"
  → done

---

ANTI-WALL-OF-TEXT RULES

These rules prevent Claude's responses from becoming
unreadable on a 6.7" phone screen.

For Claude's responses to relay prompts:

Rule A: Status responses max 8 lines
  A "status" relay should return exactly STATUS.md content.
  No prose, no expansion, no "let me also mention..."

Rule B: One question per gate
  If Claude needs to ask a clarifying question, ask one.
  Not three embedded in a paragraph. One question.

Rule C: Action confirmation in one line
  "Queue item #3 added. Queue: 3 ready / 0 waiting."
  Not a paragraph about what the item contains and when it
  will execute and what the queue drain policy is.

Rule D: No auto-summaries at session end unless requested
  "done" triggers session-end writes, not a 500-word recap.
  The recap is available on request: "summarize this session"

Rule E: Error messages in plain language, one sentence
  Bad:  "I encountered an issue where the git push operation
         failed with exit code 128 indicating that the remote
         repository rejected the push due to the branch not
         having an upstream tracking reference configured"
  Good: "Push failed — branch has no upstream. Send: confirm
         push to set it up."

---

MOBILE-FRIENDLY FORMATTING IN CLAUDE RESPONSES

When responding to a relay prompt from mobile, Claude should:

  Use plain numbered lists (not nested bullets)
  Use labeled fields (FIELD: value) for structured data
  Keep each item under 80 characters
  Put the most important information first
  Limit the total response to under 20 lines unless more
  was explicitly requested
  Never open a response with context re-explanation
  Never close a response with a question unless necessary

These rules apply when Claude detects the session is operating
in relay mode (short inputs, confirmed mobile context).

---

END OF SPEC
