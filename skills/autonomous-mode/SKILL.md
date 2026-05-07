---
name: autonomous-mode
description: >
  Switch Claude Code into long-running autonomous-work mode for AccentOS
  builds when Michael steps away. Triggered by phrases like "I'm going
  to lunch — do X while I'm gone", "I'm going to bed, continue working",
  "work through the build plan for an hour", "go autonomous until 3pm",
  "drain the prompt queue while I'm out", "unattended mode". Parses the
  prompt for: scope (a specific task, BUILD_PLAN_CLAUDE walk, prompt-queue
  drain, or a stated subset), time bound (return-time, duration, or
  token-budget threshold), and exit criteria. Writes mode state to
  /home/user/accent-os/.claude/autonomous_mode.json, logs the entry to
  PROMPT_LOG.md and SESSION_LOG.md, then executes the work loop —
  committing+pushing each completed item, updating WORK_IN_PROGRESS.md
  after every step, and checking exit criteria between items. On exit,
  writes a final summary so Michael's resume sees exactly what happened.
  Use this skill when Michael says: "going to lunch", "going to bed",
  "stepping away", "go autonomous", "work while I'm gone", "unattended
  mode", "until I'm back", "until 3pm", "for the next 2 hours",
  "drain the prompt queue", "work through the build plan". Do not use
  for one-off tasks (just execute), for tasks needing owner approval
  mid-flow, or for any external-API call with billing implications
  without explicit pre-approval. Always writes
  /home/user/accent-os/.claude/autonomous_mode.json with scope and exit
  criteria before touching any code — never executes autonomously without
  a disk-persisted, timestamped plan.
---

# autonomous-mode

**Purpose:** Runs the AccentOS work loop autonomously — committing items from BUILD_PLAN_CLAUDE.md or PROMPT_QUEUE.md, checking exit criteria between commits, and persisting state so the next session resumes exactly where this one stopped. Always writes a timestamped state file before touching any code — never runs blind.

---

## Trigger Recognition

Run when Michael says any of:
- "going to lunch — do X while I'm gone"
- "going to bed, continue working"
- "stepping away — build Track 5.7 while I'm gone" (stepping-away + inline scope form)
- "go autonomous" / "unattended mode"
- "drain the prompt queue while I'm out"
- "until 3pm" / "for the next 2 hours" (time-bound forms)
- "work through the build plan without stopping"
- "build autonomously until I get back"

If the trigger is ambiguous about scope OR exit criteria, ask one clarifying question and wait — never guess.

---

## Step 0 — Parse the invocation

Extract three things:

| Field | Examples | Default if unstated |
|---|---|---|
| **scope** | "build the next 3 KPI M-tasks", "drain prompt-queue", "BUILD_PLAN_CLAUDE walk" | BUILD_PLAN_CLAUDE walk |
| **time_bound** | "until 3pm", "for 2 hours", "until I'm back" | "until I'm back" = no time limit; rely on token-budget threshold |
| **exit_criteria** | "stop after 3 commits", "stop on first failed test", "stop when queue empty" | inferred from scope + time_bound |

If `time_bound` is ambiguous, default to **2-hour soft cap with token-budget hard stop**.

If `scope` is "until I'm back" without further context, default to **drain prompt-queue if non-empty, else BUILD_PLAN_CLAUDE walk in priority order**.

---

## Step 1 — Validate the work plan

Before writing the mode-state file:

**Auto-approved task types (safe under autonomous-mode):**
- AccentOS module builds / refactors (js/* changes, index.html edits)
- Skill forging via skill-forge (proposal gate halts naturally — see below)
- KPI catalog updates, doc-drift fixes, build-plan-status edits
- SQL stub creation in `/sql/` (Michael runs them himself; never auto-apply to Supabase)
- Reading + analysis skills (kpi-data-audit, vendor-cascade trace, table-eda)
- Commit + push to feature branches; FF merge to main with standard flow
- Codex-review LOW-risk auto-applies (pre-approved as a class)

**Needs Michael present (hard-stop if encountered):**
- Schema migrations executed against production Supabase (only M-tasks; Michael runs)
- New external-API integrations with billing implications
- Force-pushes to main
- Public deploy promotions (Cloudflare Pages production push, BC config changes)
- Email/SMS/social sends to real recipients
- Codex-review HIGH-risk recommendations (always require Michael's approval)
- skill-forge approval gate — when reached, autonomous-mode halts cleanly with state saved
- Any task that triggers a "halt-and-wait" pattern in another skill

**Validation steps:**
1. Walk through every item in scope; classify each as auto-approved OR needs-Michael
2. If any item is needs-Michael AND it's the next item in priority order → halt with `BLOCKED: cannot operate autonomously on [item] — needs Michael present`
3. If a needs-Michael item is encountered mid-loop → finish current commit, log the block, exit cleanly
4. Estimate scope: how many discrete commits? How many tokens approximately?

---

## Step 2 — Write mode state to disk

Create `/home/user/accent-os/.claude/autonomous_mode.json`:

```json
{
  "started_at": "2026-05-05T14:30:00Z",
  "scope": "drain prompt-queue, then BUILD_PLAN_CLAUDE walk",
  "time_bound": {
    "type": "duration",
    "value": "2h",
    "soft_cap_at": "2026-05-05T16:30:00Z"
  },
  "exit_criteria": [
    "queue empty AND no [ ] BUILD_PLAN_CLAUDE items unblocked",
    "token budget > 80% of session estimate",
    "Michael returns (any non-queue prompt arrives)",
    "any commit fails CI / pre-commit hook"
  ],
  "estimated_commits": 5,
  "estimated_tokens": 80000,
  "actual_commits": 0,
  "actual_tokens": 0,
  "items_completed": [],
  "current_item": null,
  "last_heartbeat": "2026-05-05T14:30:00Z",
  "status": "running"
}
```

Set perms 644 (readable for any session). Do not gitignore — this file is signal across sessions.

---

## Step 3 — Log the autonomous-mode entry

Append to `/home/user/accent-os/PROMPT_LOG.md`:

```
### YYYY-MM-DD HH:MM — Autonomous mode start
**Prompt:** "[verbatim Michael's invocation]"
**Mode state:** scope=[scope]; time_bound=[bound]; exit=[criteria summary]
**Estimated work:** [N commits, ~Ktokens]
```

And to `/home/user/accent-os/SESSION_LOG.md`:

```
### Autonomous mode started YYYY-MM-DD HH:MM
Michael stepped away. Scope: [scope]. Working until [exit].
```

Then begin Step 4.

---

## Step 4 — Execute the work loop

```
while (mode is running):
  1. Update autonomous_mode.json: current_item, last_heartbeat
  2. Pick next item per scope:
     - prompt-queue: top-priority QUEUED item from PROMPT_QUEUE.md
     - BUILD_PLAN_CLAUDE walk: first [ ] item with no unresolved BLOCKS ON MICHAEL
     - named tasks: next in stated list
  3. Execute it:
     - Standard branch + commit + push flow
     - Run skill-forge / kpi-data-audit / etc. as needed
     - Update WORK_IN_PROGRESS.md after every discrete sub-step
  4. On item complete: append to items_completed in autonomous_mode.json
  5. Check exit criteria:
     - time_bound exceeded → stop
     - token budget high → stop, log "stopping early to preserve session"
     - new non-queue prompt detected → stop, hand back to Michael
     - commit failure / CI failure → stop, surface for review
     - scope exhausted → stop, "all scope completed"
  6. If stopping → Step 5; else continue loop
```

**Heartbeat cadence:** update WORK_IN_PROGRESS.md after every sub-step (file save, commit, etc.) — not just after item completion. This keeps the resume-point fresh.

**Mid-item time-cap check.** Time/token budget checks must fire after every commit inside an item, not only between items. A single Track-level item can run >30 min and burn 60K+ tokens; checking only between items risks blowing past the soft cap by hours. Rule: after each `git commit`, evaluate `now() vs soft_cap_at` and `actual_tokens vs estimated_tokens × 0.8`; if either threshold trips, finish the current commit cleanly (no half-applied edits) and exit immediately.

---

## Step 5 — Exit and write summary

On any exit reason:

1. Set `autonomous_mode.json` status to one of: `completed`, `time_capped`, `token_capped`, `interrupted`, `failed`
2. Write final summary to SESSION_LOG.md:

```
### Autonomous mode ended YYYY-MM-DD HH:MM
**Reason:** [completed | time-capped | token-capped | interrupted by Michael | failed: [error]]
**Items completed:** [count]
  - [item 1] (commit SHA)
  - [item 2] (commit SHA)
  - ...
**Items skipped:** [count] [why]
**Final commit:** [SHA]
**Resume hint:** [next pending work, where Michael picks up]
```

3. Update WORK_IN_PROGRESS.md with a clear resume hint that the existing CLAUDE.md auto-execute pattern will pick up:
   ```
   **Last updated:** YYYY-MM-DD HH:MM — autonomous-mode exited ([reason])
   **Current task:** —
   **Step:** Autonomous block of [N] items completed. See SESSION_LOG for
              detail. Resume from: [next-pending-item] OR drain remaining
              prompt-queue ([M] items still queued).
   **Next step if interrupted:** read SESSION_LOG.md last entry; pick
              up [next-pending-item].
   ```

4. **Do not delete autonomous_mode.json** — leave it for the next session as the audit trail. Next autonomous-mode run will overwrite the file.

---

## Step 6 — Output to Michael

When Michael returns, the next session-start will see autonomous_mode.json's `status` field. If `running`, he asks "what happened?" → resume with summary. If `completed/capped/etc`, he sees the SESSION_LOG entry.

The skill's run-time output (the prompt that triggered it) returns immediately:

```
AUTONOMOUS MODE STARTED — 2026-05-07 14:30

Scope:        drain PROMPT_QUEUE.md (3 items), then BUILD_PLAN_CLAUDE walk
Time bound:   2h soft cap (hard stop at 2026-05-07T16:30:00Z)
Exit:         queue empty AND no unblocked [ ] items; OR token budget >80%; OR Michael returns
Est. work:    5 commits, ~80K tokens
State file:   /home/user/accent-os/.claude/autonomous_mode.json
Resume:       WORK_IN_PROGRESS.md will reflect current step

Going dark. Will surface a summary in SESSION_LOG.md on exit.
```
(Substitute actual scope, time bound, exit criteria, and estimates from Step 0 parse.)

---

## Composability

- **autonomous-mode + prompt-queue:** "drain the prompt queue while I'm out" → autonomous-mode operates with scope=prompt-queue, executing each queued prompt in priority order
- **autonomous-mode + bottleneck-finder:** "work through the build plan" → autonomous-mode runs bottleneck-finder once, then attacks the constraint
- **autonomous-mode + skill-forge:** "drain the prompt queue (which has 3 forge requests) while I'm at lunch" → each queued forge request goes through full skill-forge workflow including approval gate, BUT the gate auto-rejects (treats as DEFER) for HIGH-effort items if Michael isn't present to approve

---

## Anti-patterns

- **Never** start autonomous work without writing /home/user/accent-os/.claude/autonomous_mode.json first. The file IS the directive; missing it means no record of scope exists.
- **Never** silently extend the time_bound. When a soft cap hits, stop and let Michael decide whether to extend.
- **Never** push to main when the soft cap fires mid-commit. Finish the current commit on its branch, then stop — no half-finished work on main.
- **Never** make billing-implication external-API calls in autonomous mode without prior approval. Codex-review LOW-risk auto-apply is pre-approved; every new API integration requires Michael present.
- **Never** auto-rebase or auto-resolve merge conflicts in autonomous mode. Stop, flag the conflict in SESSION_LOG.md, and await Michael.
- **Never** delete autonomous_mode.json on exit. Leave it as audit trail; the next autonomous-mode run overwrites it.
- **Never** treat WORK_IN_PROGRESS.md as a queue — it is a resume-point indicator only. The queue lives in /home/user/accent-os/PROMPT_QUEUE.md.
- **Never** execute a needs-Michael task (schema migration against Supabase hsyjcrrazrzqngwkqsqa, BC store-cwqiwcjxes config, force-push to main) autonomously — halt with a BLOCKED notice and preserve state.
