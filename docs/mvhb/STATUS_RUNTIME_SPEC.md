STATUS RUNTIME SPEC
STATUS.md Lifecycle and Ownership Rules
Version: 1.0 — 2026-05-09

---

PURPOSE

STATUS.md is the single source of truth for system state on
mobile. It is designed to be readable in under 5 seconds on
an iPhone with no interaction beyond opening the file.

This spec defines what STATUS.md contains, who writes it, when
it is written, and how it relates to every other operational file.

---

THE FILE

Location: /STATUS.md (repo root)
Max lines: 10
Format: bare labeled fields, no markdown

  BRANCH:  [current branch name, max 30 chars]
  PUSHED:  [ISO date or NO]
  WIP:     [one sentence, max 80 chars]
  QUEUE:   [N ready / N waiting]
  NEXT:    [one action, max 80 chars]
  GATE:    [gate name or CLEAR]

All six fields are always present. If a field has no value,
write NONE — never omit the label.

---

FIELD DEFINITIONS

BRANCH
  The git branch currently in use by the active Claude session.
  Not necessarily the default branch. Not necessarily main.
  If the branch name is longer than 30 characters, truncate
  and append "…" to signal truncation.
  Example: claude/ph-a-mobile-Q6vY

PUSHED
  Date of the most recent successful git push on any branch.
  Format: YYYY-MM-DD
  If no push has occurred in the current session, write NO.
  This does NOT mean "pushed to main" — any branch push counts.
  Example: 2026-05-09

WIP
  One sentence describing the current in-flight task or
  the primary blocker. If no task is in flight, write CLEAR.
  Maximum 80 characters. No sub-clauses. No technical jargon
  that requires context to understand. Write it so a person
  returning from a 48-hour break can understand it immediately.
  Bad:  Worker 400 — arrayBuffer passthrough + CORS * issue
  Good: Worker proxy returning 400 — redeploy needed to fix

QUEUE
  Number of items in PROMPT_QUEUE.md by state.
  Always format: "N ready / N waiting"
  If queue is empty: "0 ready / 0 waiting"
  Running and paused items are NOT counted here — they are
  captured in WIP. QUEUE only counts ready and waiting items.
  Example: 2 ready / 1 waiting

NEXT
  The single most important next action for the next session.
  Starts with an imperative verb. Max 80 characters.
  This is the field Michael reads on mobile to know what to do.
  If multiple next actions exist, write only the FIRST one.
  The second and third are in WIP.md.
  Bad:  Need to confirm wrangler redeploy, then test the worker,
        then verify the model ID is valid, then check the response
  Good: Confirm wrangler redeploy, then run browser console test

GATE
  The name of the current validation gate from GATES.md.
  If no gate is pending: CLEAR
  If a gate is pending manual check: [gate name] — manual check
  If a gate is pending a build milestone: [gate name] — building
  Example: Gate 1 — manual check
  Example: CLEAR

---

UPDATE CADENCE

STATUS.md is updated by Claude in the following situations.
All updates are committed together with whatever other change
triggered the update. STATUS.md is never committed alone.

  After every git push             — BRANCH, PUSHED, NEXT update
  After every commit               — WIP may update
  After task completion            — NEXT updates, WIP clears
  After queue modification         — QUEUE updates
  After gate state changes         — GATE updates
  After session start (if stale)   — all fields refreshed

STATUS.md is never updated more than once per Claude response.
If multiple changes happen in one response, STATUS.md gets one
write at the end with all changes reflected.

---

OWNERSHIP RULES

Claude owns STATUS.md. Michael never writes to STATUS.md
directly. This is intentional.

Rationale: STATUS.md must always reflect what Claude knows
about the current system state. If Michael edits it manually
and Claude overwrites it, the manual edit is lost. If Claude
owns it exclusively, the file is always machine-consistent.

Michael reads STATUS.md. Claude writes STATUS.md.

Exception: if Claude is unavailable (session crashed, context
lost), Michael may write a temporary STATUS.md with:
  BRANCH:  unknown — verify before committing
  PUSHED:  unknown
  WIP:     [Michael's one-line description of the situation]
  QUEUE:   unknown
  NEXT:    resume session and verify all fields
  GATE:    unknown

This is a fallback state marker, not a normal write path.

---

BRANCH VISIBILITY

The BRANCH field is the primary mobile branch visibility surface.

GitHub iOS does NOT show which branch is checked out on the
repository home page. The branch selector shows all branches
but does not mark the "active" one from the user's perspective.

STATUS.md BRANCH field fills this gap. It is the first field
in the file — visible on first open on mobile, no scroll.

Branch naming rule enforced here:
  Maximum 30 characters
  Format: [who]/[phase]-[topic]-[id]
  Example: claude/ph-a-mobile-Q6vY
  Example: michael/sql-m30-Q9xR
  Example: claude/fix-worker-Q2mN

Branches longer than 30 chars are NOT prohibited but MUST be
truncated in the BRANCH field with … appended to signal it.

---

GATE VISIBILITY

The GATE field surfaces the current validation gate from
GATES.md. This tells Michael at a glance whether a manual
check is required before the next session can proceed.

Gate states:
  CLEAR                       — no gate pending, build freely
  Gate 1 — manual check       — gate defined, needs human test
  Gate 1 — building           — gate not yet reached, in progress
  Gate 2 — prototype required — gate requires prototype PASS first

Gate field must never contain instructions. It is a signal only.
The actual gate checklist lives in GATES.md.

---

QUEUE VISIBILITY

The QUEUE field is a two-integer summary of PROMPT_QUEUE.md.

It answers the question: "is there anything waiting for me?"

Format is always: "N ready / N waiting"

Ready items will execute when "drain queue" or "execute next
queued" is sent. Waiting items have a defer condition not yet met.

This field does NOT show item text. For item text, read
PROMPT_QUEUE.md or send "show queue" to Claude.

The QUEUE field updates every time PROMPT_QUEUE.md changes.
They must always be in sync — Claude verifies this on every write.

---

NEXT ACTION SEMANTICS

The NEXT field is the highest-value field in STATUS.md for
mobile operation.

It answers: "what do I type or do to move things forward?"

NEXT must always be:
  Actionable       — something that can actually be done now
  Specific         — not "continue work" or "check things"
  Imperative       — starts with a verb
  Single           — one action, not a list
  Complete         — enough context to act without reading more

Good NEXT values:
  Confirm wrangler redeploy — run browser console test
  Run Gate 1 manual check on iPhone 13 Pro Max
  Send: drain queue — 2 items ready
  Merge PR #14 on GitHub iOS
  Queue is empty — start new session or send next prompt

Bad NEXT values:
  Continue
  Check things
  Do the next step
  See WIP for details
  Various items pending

If the next action requires desktop: say so explicitly.
  Desktop required: wrangler deploy from local terminal

If the next action is on Michael: say "Michael:" prefix.
  Michael: run SQL M30 via Supabase dashboard

---

RELATIONSHIP TO OTHER FILES

STATUS.md is the summary. These are the sources:

  WIP.md           — WIP field comes from here (first sentence)
  PROMPT_QUEUE.md  — QUEUE field comes from here (counts)
  GATES.md         — GATE field comes from here (current gate)
  git log          — BRANCH and PUSHED come from here

STATUS.md must never contradict any of its source files.
If a discrepancy exists, source files win. Claude resolves
discrepancies during every STATUS.md write by reading sources.

---

END OF SPEC
