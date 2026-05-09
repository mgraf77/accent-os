MOBILE OPERATION SOP
AccentOS — Phone-First Standard Operating Procedures
Version: 1.0 — 2026-05-09

---

PURPOSE

This is the operational playbook for running AccentOS sessions
primarily from iPhone. Every workflow here is verified against
GitHub iOS and Claude iOS app behavior. Each workflow is
expressed as a numbered sequence of thumb actions.

Thumb budget: every operation must complete in under 5 steps.
A step = one tap, one swipe, or one short phrase typed.

---

ONE-THUMB TRIGGER PHRASES

These are the canonical relay phrases. Each is under 5 words.
Type them into Claude iOS to trigger the corresponding action.

  continue last session     — resume from WIP.md
  status                    — Claude reads and returns STATUS.md
  show queue                — Claude renders PROMPT_QUEUE.md
  queue: [text]             — add prompt to queue
  drain queue               — execute all ready queue items
  execute next queued       — execute top ready queue item
  next                      — Claude states the next action
  what branch               — Claude states the current branch
  done                      — signals session end, triggers wrap
  wrap up                   — same as done, triggers session end
  bug: [one line]           — Claude logs a bug to WIP.md
  skip                      — skip queue surface, continue work

---

WORKFLOW 1 — CONTINUE SESSION

Use when: picking up from a previous session on iPhone.

Steps:
1. Open Claude iOS app
2. Type: continue last session
3. Claude reads WIP.md + SESSION_HANDOFF.md
4. Claude states current status in one paragraph
5. Respond to continue or redirect

What Claude will output:
- Current status (paused / active / blocked)
- The one bug or blocker if any
- The exact next step
- The current gate if any

What NOT to expect:
- Claude will not re-read all 14 research docs
- Claude will not summarize the entire build history
- Claude will not ask for confirmation before starting

Failure mode: if Claude outputs a wall of text instead of a
5-line status, send: "status only, one paragraph"

---

WORKFLOW 2 — QUEUE A PROMPT

Use when: you think of something to do later while Claude is
already working on something else.

Steps:
1. Open Claude iOS app
2. Type: queue: [your prompt text here]
3. Claude writes to PROMPT_QUEUE.md
4. Claude confirms: #N added, queue depth N

Optional defer:
  queue when M30 lands: [prompt text]
  queue after #2 done: [prompt text]
  queue for tomorrow: [prompt text]

The word "when" or "after" triggers defer_until logic.
"queue for tomorrow" sets defer to next calendar day at 09:00.

Thumb budget: 1 tap to open app, 1 phrase to type.
Total: 2 steps.

---

WORKFLOW 3 — CHECK QUEUE STATUS

Use when: you want to know what's waiting before starting a
session, or before sending a prompt that might duplicate a
queued item.

Steps:
1. Open Claude iOS app
2. Type: show queue
3. Claude renders flat numbered list of all items
4. Respond with "drain queue" / "execute next queued" / "skip"

Alternatively on GitHub iOS:
1. Open GitHub iOS
2. Navigate to repo → PROMPT_QUEUE.md
3. Read the READY section (visible without scroll)

GitHub iOS path does not require Claude — useful when Claude
session is busy or you just want a read-only check.

---

WORKFLOW 4 — DRAIN QUEUE

Use when: Claude is idle, queue has items, you want them executed.

Steps:
1. Open Claude iOS app
2. Type: drain queue
3. Claude executes items top to bottom
4. Claude reports each completion
5. Claude surfaces final count: N done, N paused, N failed

For parallel drain (independent items):
  drain queue in parallel

For serial drain (order matters):
  drain queue serial

Failure mode: if an item hits an approval gate, it moves to
paused status. Claude will surface: "item #N paused — awaiting
your input: [gate question]". Answer that, then send "resume".

---

WORKFLOW 5 — STATUS CHECK

Use when: you want to know the current system state without
reading multiple files.

Steps:
1. Open Claude iOS app
2. Type: status
3. Claude returns STATUS.md content verbatim (6 lines)

Or on GitHub iOS:
1. Open repo
2. Tap STATUS.md (visible at repo root, 2 taps)
3. Read 6 lines

STATUS.md is always the authoritative source. Claude's "status"
command reads and returns it — no interpretation, no addition.

---

WORKFLOW 6 — BRANCH VERIFICATION

Use when: you need to confirm which branch is active before
sending a sensitive instruction.

Steps:
1. Open Claude iOS app
2. Type: what branch
3. Claude returns: "Branch: [name], last push: [date]"

Or on GitHub iOS:
1. Open repo
2. Branch selector shows default branch — tap to see all
3. Current branch is starred or marked as default

Note: GitHub iOS does not show the "currently checked out"
branch — it shows the default branch. Only Claude can confirm
the branch the current session is operating on.

Rule: always verify branch before sending any instruction that
will result in a commit or push.

---

WORKFLOW 7 — COMMIT VERIFICATION

Use when: you want to confirm a commit landed after Claude
reports a push.

Steps:
1. Open GitHub iOS
2. Tap repo → Code → Commits
3. Top commit should match Claude's reported message
4. Tap the commit to see full message and file diff

What to check:
- Subject line matches what Claude reported
- Branch name shown in commit detail matches expected branch
- File count in diff matches expected changes

Failure mode: if commit is absent, Claude's push may have
failed silently. Send: "confirm last push status" to Claude.
Claude will run git log and report the last commit hash + date.

---

WORKFLOW 8 — MERGE VERIFICATION

Use when: you want to confirm a PR was merged.

Steps:
1. Open GitHub iOS
2. Tap repo → Pull Requests → Closed
3. Find PR by name — verify "Merged" badge (purple)
4. Tap to see merge commit and which branch was merged into

GitHub iOS can also initiate a merge:
1. Open PR
2. Scroll to bottom
3. Tap "Merge pull request" — confirm dialog appears
4. Tap "Confirm merge"

This works reliably on GitHub iOS. No desktop required.

---

WORKFLOW 9 — INTERRUPTION RECOVERY

Use when: a previous session was cut off mid-task and you are
resuming on a new device or new session.

Steps:
1. Open Claude iOS app
2. Type: continue last session
3. Check SESSION_HANDOFF.md field: MID-TASK: YES or NO
4. If MID-TASK: YES — Claude resumes the interrupted task first
5. If MID-TASK: NO — Claude proceeds to next queued item

What "mid-task: YES" means:
- A multi-step task was in flight when the session ended
- The interrupted task must be completed before anything else
- WIP.md STEP field shows exactly where to resume

What to send if Claude misses the interruption:
  "check wip — were we mid-task?"

This forces Claude to re-read WIP.md and SESSION_HANDOFF.md
before proceeding.

---

WORKFLOW 10 — BUG REPORT FROM PHONE

Use when: you discover a bug on iPhone and want it logged without
opening a full session.

Steps:
1. Open Claude iOS app
2. Type: bug: [one line description]
3. Claude appends to WIP.md BUG field and updates STATUS.md
4. Claude confirms: "logged. current step unchanged."

The bug report does not trigger a fix session automatically.
To trigger a fix: follow with "fix this bug" or queue it.

---

MOBILE-SAFE OPERATIONS (can be done entirely on iPhone)

These operations require no desktop, no terminal, no clipboard
gymnastics.

  - Queue a prompt for later execution
  - Check queue depth and top item
  - Trigger a session resume
  - Check system status (STATUS.md)
  - Verify a commit landed (GitHub iOS)
  - Approve a PR (GitHub iOS)
  - Merge a PR (GitHub iOS)
  - Read any research or spec doc (GitHub iOS)
  - Log a bug one-line
  - Send a relay prompt (any prompt under 200 words)
  - Trigger queue drain
  - Check which gate is active
  - Read WIP and session handoff
  - Interrupt an active session with a new priority

---

DESKTOP-ONLY OPERATIONS (require keyboard/terminal)

These cannot be done from iPhone without significant friction.
Do not attempt them on mobile.

  - wrangler deploy (CLI — no iOS equivalent)
  - git branch switch (terminal — Claude can't switch branches
    without a shell that persists state beyond the response)
  - Run SQL migrations against Supabase (requires psql or
    Supabase dashboard on a real browser)
  - DevTools Network tab (no mobile browser equivalent)
  - Resolve merge conflicts (no GitHub iOS merge conflict UI)
  - Run browser console tests (Safari iOS has a console but it
    is painful for multi-line paste — use desktop)
  - Edit CLAUDE.md or SKILL.md files (not designed for mobile
    edit — consequences of typos are session-wide)
  - Copy-paste multi-line code blocks longer than 5 lines
    (iOS clipboard and paste behavior is unreliable for long
    technical strings)
  - Any git operation beyond reading: fetch, reset, merge, rebase

---

END OF SOP
