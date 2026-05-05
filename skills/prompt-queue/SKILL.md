---
name: prompt-queue
description: >
  Manage Michael's queued prompts in /home/user/accent-os/PROMPT_QUEUE.md
  — capture new ones without interrupting the current AccentOS session,
  reorder by drag-drop priority (default chronological by sent_at),
  view the queue, execute the next queued prompt at session-end OR on
  demand, and drain the queue under autonomous-mode. Solves the "I have
  prompts in a notes app and don't want to derail current work" problem
  by giving Claude Code a persistent prompt-stack with priority. Use
  this skill when Michael says: "queue this prompt", "add to queue",
  "queue: [text]", "do this after current task", "stack this for
  later", "next prompt: [text]", "show the queue", "view queue",
  "reorder queue", "promote [item]", "demote [item]", "execute next
  queued", "pull next from queue", "drain the queue", or any phrasing
  that asks to add/view/reorder/execute queued prompts. Do not use for
  prompts meant to interrupt the current session immediately (those go
  inline as normal prompts) or for ephemeral one-off thoughts (those
  don't need queuing). Always writes the queue state to PROMPT_QUEUE.md
  immediately so the queue survives session restarts and Codespace
  rebuilds — never holds queue state only in memory.
---

# prompt-queue

**Purpose:** Michael keeps a notes app full of prompts he wants to send "later." Pasting them mid-session derails current work; forgetting them loses signal. This skill gives Claude Code a persistent prompt-stack that survives session boundaries, supports priority reordering, and auto-pulls the next item when the current session completes.

Stolen from: Anthropic's Agent Skills compounding execution pattern + the existing `PROMPT_QUEUE.md` AccentOS convention. The skill formalizes operations and expands the storage format to support priority + structured fields.

---

## Trigger Recognition

Run when Michael says any of:

**ADD:**
- "queue this prompt: [text]"
- "queue: [text]"
- "add to queue [text]"
- "stack this for later: [text]"
- "next prompt: [text]" (when current session is mid-flow)
- "do this after current task: [text]"

**VIEW:**
- "show the queue" / "view queue"
- "what's queued?"
- "queue status"

**REORDER:**
- "reorder queue"
- "promote [item N]" / "demote [item N]"
- "move [item N] to top"
- "set priority of [item N] to [n]"

**EXECUTE:**
- "execute next queued"
- "pull next from queue"
- "do the next queued prompt"
- "drain the queue" (delegates to autonomous-mode for safe long-running)

**AUTO (no explicit trigger):**
- At session-end (last action complete, no follow-ups), check queue and surface "Queue has [N] items. Pull next?" — do not auto-execute without confirmation.

---

## Step 0 — Parse the operation

Detect from Michael's prompt:

| Operation | Effect |
|---|---|
| ADD | Steps 1–2 (capture + write) |
| VIEW | Steps 3 (render queue) |
| REORDER | Steps 4 (priority edit) |
| EXECUTE next | Steps 5 (pull + execute one) |
| DRAIN | Hand off to autonomous-mode with scope=prompt-queue |

If the operation is ambiguous, default to VIEW and ask "ADD / VIEW / REORDER / EXECUTE?"

---

## Step 1 — ADD: capture the new queued prompt

Extract from the trigger:
- **prompt_text** — the actual prompt to queue (verbatim)
- **source** — where it came from: "iOS", "desktop", "Mac", "phone notes", default "current-session"
- **sent_at** — current timestamp (ISO-8601)
- **priority** — default = max(existing priorities) + 1 (chronological appending)
- **note** — optional metadata: "high-impact", "blocking", "low-priority", "after-M30"

If the prompt_text is < 10 chars or empty, ask Michael for the actual prompt before queuing.

If a near-duplicate prompt already exists in QUEUED (>80% text similarity), surface: "Similar item already queued (#N). Add anyway, or update the existing?"

---

## Step 2 — Write to PROMPT_QUEUE.md

Append to the QUEUED section. Use this format (extends the existing simple format):

```markdown
## QUEUED

| # | priority | sent_at (UTC) | source | note | prompt |
|---|----------|---------------|--------|------|--------|
| 1 | 1 | 2026-05-05T14:30:00Z | iOS | high-impact | "build the kpi-snapshot skill now that infra is confirmed" |
| 2 | 2 | 2026-05-05T14:32:00Z | iOS | — | "audit the GMC feed and start sprint 1" |
| 3 | 3 | 2026-05-05T14:45:00Z | desktop | after-M30 | "backfill customers.segment for top 100 by revenue" |

## IN PROGRESS
(empty — or one row when EXECUTE pulls)

## COMPLETED (graveyard)

- [x] **2026-05-05T14:25:00Z** → executed at 14:28 — "make the digest skill" → snapshot-001 saved
- ... (newest first)
```

After writing, output a confirmation:

```
✓ QUEUED #N — "[truncated prompt 60 chars]..."
  priority: [n] (chronological default; reorder anytime)
  source:   [src]
  Queue depth: [total queued]
  
  Will execute at session-end OR on "execute next queued".
```

---

## Step 3 — VIEW: render the queue

Output the current state:

```
═══ PROMPT QUEUE — depth [N] ═══

QUEUED (priority order):
  1. [priority=1] [age 12m] [iOS] — "build the kpi-snapshot skill now that..."
  2. [priority=2] [age 10m] [iOS] — "audit the GMC feed and start sprint 1"
  3. [priority=3] [age 5m]  [desktop] [after-M30] — "backfill customers..."

IN PROGRESS:
  (none)

LAST 3 COMPLETED:
  ✓ 14:28 — "make the digest skill" (snapshot-001)
  ✓ 13:52 — "vendor risk register run" (analyses/snapshot-007)
  ✓ 11:14 — "audit the KPI data" (full audit, 38 gaps)
```

Always show the QUEUED section in **priority order, ascending** (lower number = higher priority = will execute first).

---

## Step 4 — REORDER: priority edits

Operations supported:

| Phrase | Effect on priority field |
|---|---|
| "promote N" | priority -= 1; cascade rebalance if collision |
| "demote N" | priority += 1; cascade |
| "move N to top" | priority = 0; rebalance others |
| "move N to bottom" | priority = max + 1 |
| "set N priority to P" | direct assignment; rebalance |
| "swap N and M" | priority swap |

After every reorder operation, **renormalize**: priorities become 1, 2, 3, ... contiguous integers, no gaps. This makes drag-drop reordering predictable.

Output the new priority order after every reorder.

**Drag-drop semantics (UI side):** The AccentOS web app at `accent-os.pages.dev` (Cloudflare Pages) reads PROMPT_QUEUE.md as the single source-of-truth for queue state. When a queue UI module ships, it lets Michael drag rows; drop fires a fetch that either edits PROMPT_QUEUE.md directly via Claude Code OR writes through a thin Supabase mirror table on `hsyjcrrazrzqngwkqsqa` if cross-device sync is needed. The skill remains the authoritative editor for priority changes regardless of UI.

---

## Step 5 — EXECUTE next: pull and run

**Stale-recovery first.** Before pulling a new item, check if IN PROGRESS already has a row. If so:
- If `started_at` is < 10 minutes ago → another active session is running it; abort with "Queue item #N already in progress (started [time]). Wait or override?"
- If `started_at` is ≥ 10 minutes ago AND no recent commit history shows the prompt's effect → likely interrupted. Surface: "Queue item #N appears interrupted. Recover (re-run), abandon (mark FAILED), or wait?"
- Only proceed when IN PROGRESS is empty.

**Pull + execute:**

1. Read PROMPT_QUEUE.md
2. Pick the lowest-priority-number item from QUEUED (highest priority first)
3. Move that row to IN PROGRESS section, set `started_at = now`
4. Write back to PROMPT_QUEUE.md
5. **Execute the prompt as if Michael had just sent it inline** — same skill-trigger detection, same workflow paths, same approval gates
6. On completion (or skill-internal interrupt):
   - Move row from IN PROGRESS → COMPLETED with `completed_at = now` and a one-line outcome note
   - Write back to PROMPT_QUEUE.md
   - Output: "✓ Queue item #N completed — [outcome]. [N-1] items remaining."
7. If autonomous-mode flag is set and time/token budget allows, automatically loop to next; else stop and let Michael trigger again.

If the executed prompt itself triggers a halt-and-wait (skill-forge approval gate, codex-review HIGH-risk surface, etc.), pause queue execution there. Don't auto-skip past gates. Mark the row as `WAITING` instead of `IN PROGRESS` until Michael provides input, then resume from where it paused.

---

## Step 6 — DRAIN: delegate to autonomous-mode

When Michael says "drain the queue":

1. Confirm scope: how many items to drain? Until empty? Until time-cap?
2. Hand off to `autonomous-mode` with:
   ```
   scope: prompt-queue drain
   exit_criteria:
     - queue empty
     - any halt-and-wait gate hit (skill-forge proposal, codex-review HIGH)
     - time/token caps from autonomous-mode defaults
   ```
3. autonomous-mode then drives the loop, calling EXECUTE-next repeatedly until exit.

This is the natural pattern for "I'm going to lunch — drain the queue." prompt-queue manages the queue; autonomous-mode manages the runtime.

---

## Step 7 — Surface at natural completion points

Don't try to auto-detect "session end" — it's fuzzy. Instead, surface a queue-peek at **natural completion points**:

- After any successful `git push` to main (visible commit landed)
- After any skill-forge run that produced and merged skills
- After any codex-review run that completed (auto-applied + surfaced)
- After kpi-data-audit completes
- When Michael explicitly asks "queue status" / "anything queued"

Do **not** surface inside an active task (mid-flow), inside an approval gate (Michael is mid-decision), or inside autonomous-mode (already iterating).

When surfacing:

- 0 items: silent
- 1+ items: append ONE peek block to the response:

```
─── QUEUE PEEK ───
[N] queued prompt(s). Top of stack:
  #1 [age Xm] — "[truncated 80 chars]..."

Reply "execute next queued" / "drain queue" / "show queue" / "skip"
─────────────────
```

Do not auto-execute without explicit confirmation. The "I don't want to interrupt the current session" guarantee includes "I don't want surprise execution either."

---

## Anti-patterns

- **Never** auto-execute a queued prompt without explicit Michael trigger. The whole point is non-interruption — including non-surprise execution.
- **Never** drop the COMPLETED graveyard. It's audit + searchable history.
- **Never** delete IN PROGRESS rows on session interrupt. Leave them; next session sees "this was running, what happened?"
- **Never** modify the prompt_text of a queued item. If Michael wants to edit a prompt, he removes + re-adds.
- **Never** queue a prompt that's already in IN PROGRESS or recently COMPLETED (within 24h, >80% text match) without flagging the duplicate.
- **Never** hold queue state in memory. Every operation writes to PROMPT_QUEUE.md immediately.
- **Never** strip Michael's verbatim phrasing from the prompt — execute it as he wrote it, not a paraphrase.
- **Never** auto-promote a queued prompt to higher priority based on "what Claude thinks is important." Priority is Michael's call.
