---
name: prompt-queue
description: >
  Manage Michael's queued prompts in /home/user/accent-os/PROMPT_QUEUE.md
  — capture new ones without interrupting the current AccentOS session,
  defer items until a build-plan condition resolves (M-task flip,
  Track ship, schema column add, file existence, date, prior queue item
  completion), reorder by drag-drop priority (default chronological),
  pick execution_mode per item (inline | subagent for parallel drain),
  view the queue, execute the next ready prompt at session-end OR on
  demand, and drain the queue under autonomous-mode (serial or parallel
  via subagents). Solves "I have prompts in a notes app and don't want
  to derail current work" AND "this prompt depends on something else
  landing first" with one persistent queue. Use this skill when Michael
  says: "queue this prompt", "queue: [text]", "queue when [X] lands:
  [text]", "defer until [X]: [text]", "do this after [item or M-task]",
  "show the queue", "view queue" / "what's waiting", "reorder queue",
  "promote [item]" / "demote [item]", "execute next queued", "drain
  the queue" / "drain in parallel" / "drain serial", "check waiting
  items" / "promote ready items", "re-evaluate queue", or any phrasing
  that asks to add / view / reorder / defer / execute queued prompts.
  Do not use for prompts meant to interrupt the current session
  immediately (those go inline) or for ephemeral one-off thoughts.
  Always writes the queue state to PROMPT_QUEUE.md immediately so the
  queue survives session restarts and Codespace rebuilds — never holds
  queue state only in memory. Always writes to
  /home/user/accent-os/PROMPT_QUEUE.md on every operation — never
  auto-executes a queued prompt without explicit Michael confirmation.
---

# prompt-queue

**Purpose:** Michael keeps a notes app full of prompts he wants to send "later." Pasting them mid-session derails current work; forgetting them loses signal. This skill gives Claude Code a persistent prompt-stack at /home/user/accent-os/PROMPT_QUEUE.md that survives session boundaries, supports priority reordering, and surfaces the next item at natural completion points — without auto-executing.

---

## Trigger Recognition

Run when Michael says any of:

**ADD:**
- "queue this prompt: [text]"
- "queue: [text]"
- "queue when [X] lands: [text]" / "defer until [X]: [text]"
- "do this after [item N or M-task]: [text]"
- "stack this for later: [text]"
- "next prompt: [text]"

**VIEW:**
- "show the queue" / "view queue"
- "what's queued?" / "what's waiting?"
- "queue status" / "show waiting"

**REORDER:**
- "reorder queue" / "promote [item N]" / "demote [item N]"
- "move [item N] to top / bottom"
- "set priority of [item N] to [n]"

**EXECUTE:**
- "execute next queued" / "pull next from queue"
- "drain the queue" / "drain in parallel" / "drain serial"
- "do the next queued prompt"

**RESOLVE WAITING:**
- "check waiting items" / "promote ready items"
- "what can run now" / "re-evaluate queue"
- (auto-fired by build-plan-status when an M-task or Track flips)

**AUTO (no explicit trigger):**
- At session-end (last action complete, no follow-ups), check queue and surface "Queue has [N] ready, [W] waiting. Pull next?" — do not auto-execute without confirmation.

---

## Step 0 — Parse the operation

Detect from Michael's prompt:

| Operation | Effect |
|---|---|
| ADD | Steps 1–2 (capture + write); accept inline `defer_until:` and `execution_mode:` modifiers |
| VIEW | Step 3 (render queue, including WAITING items + their conditions) |
| REORDER | Step 4 (priority edit) |
| RESOLVE | Step 4.5 (re-evaluate WAITING → QUEUED) |
| EXECUTE next | Step 5 (pull + execute one, honoring execution_mode) |
| DRAIN | Step 6 (sequential or parallel via subagents) |

If the operation is ambiguous, default to VIEW and ask "ADD / VIEW / REORDER / RESOLVE / EXECUTE / DRAIN?"

## defer_until — supported condition types

| Type | Example | Resolves when |
|---|---|---|
| `none` | (default) | always; item is QUEUED immediately |
| `m_task:[id]` | `m_task:M30` | M30 line in `BUILD_PLAN_MICHAEL.md` is `[x]`-marked (or any of `[X]`, `[✓]`, `[done]`, `~~strikethrough~~`) |
| `track:[id]` | `track:6.5` | Track 6.5 in `BUILD_PLAN_CLAUDE.md` is `[x]`-marked |
| `schema:[t.c]` | `schema:customers.segment` | column appears in any `CREATE TABLE` or `ALTER TABLE ... ADD COLUMN` block under `/home/user/accent-os/sql/M*.sql` |
| `file:[path]` | `file:/home/user/accent-os/sql/M30_customers_segment.sql` | file exists |
| `date:[ISO]` | `date:2026-05-12T09:00:00Z` | clock passes that timestamp |
| `prompt:[id]_completed` | `prompt:#5_completed` | queue item #5's status reaches COMPLETED |
| `custom:[bash]` | `custom:psql -c "SELECT 1 FROM customers WHERE segment IS NOT NULL LIMIT 1"` | bash exit code is 0 |

Multiple conditions on one item are AND-joined with literal ` AND ` separator: `defer_until: m_task:M30 AND prompt:#1_completed`. The parser splits on ` AND ` (case-sensitive, with surrounding spaces) and evaluates each part with its own resolver. All parts must resolve true for the item to promote. OR-joining is intentionally not supported in v2 — use two separate items if either-or semantics are needed.

## execution_mode — supported values

| Mode | Mechanism | When to use |
|---|---|---|
| `inline` (default) | execute in the current Claude turn | sequential, simple items |
| `subagent` | dispatch via the Agent tool | parallel-friendly items; complex isolated work; long-running prompts |
| `fresh-session` | Anthropic Managed Agents API (DEFERRED — requires SDK setup) | true detached execution; out of scope until ANTHROPIC_API_KEY env + SDK is configured. Items with this mode FAIL with `BLOCKED: fresh-session unavailable, fall back to subagent?` |

Default policy: if Michael says "drain" without specifying mode, default to `inline` for ≤2 items and `subagent` for ≥3 items. If he says "drain in parallel", force `subagent` regardless of count. If he says "drain serial", force `inline`.

---

## Step 1 — ADD: capture the new queued prompt

Extract from the trigger:
- **prompt_text** — the actual prompt to queue (verbatim)
- **source** — where it came from: "iOS", "desktop", "Mac", "phone notes", default "current-session"
- **sent_at** — current timestamp (ISO-8601)
- **priority** — default = max(existing priorities) + 1 (chronological appending)
- **defer_until** — condition string from supported types (default `none`)
- **execution_mode** — `inline` | `subagent` (default `inline`); `fresh-session` reserved
- **note** — optional metadata: "high-impact", "blocking", "low-priority", etc.

Inline modifier syntax in the trigger:
- `queue when M30 lands: backfill segment for top 100`
  → `defer_until: m_task:M30`
- `queue with parallel: forge 3 skills from [list]`
  → `execution_mode: subagent`
- `queue: weekly review     defer:date:2026-05-12T09:00`
  → explicit `defer_until: date:2026-05-12T09:00:00Z`

If `defer_until` is non-`none`, the item starts in **WAITING**, not QUEUED. Resolution loop (Step 4.5) promotes it when the condition resolves.

If the prompt_text is < 10 chars or empty, ask Michael for the actual prompt before queuing.

If a near-duplicate prompt already exists in QUEUED or WAITING (>80% text similarity), surface: "Similar item already in queue (#3, status QUEUED). Add anyway, or update the existing?" (substitute actual item number and status.)

---

## Step 2 — Write to PROMPT_QUEUE.md

Use this v2 format (extends the prior simple format with `defer_until` + `execution_mode`):

```markdown
## QUEUED  (no deferral, ready to execute)

| # | priority | sent_at (UTC) | source | execution_mode | note | prompt |
|---|----------|---------------|--------|----------------|------|--------|
| 1 | 1 | 2026-05-05T14:30:00Z | iOS | inline | high-impact | "build the kpi-snapshot skill now that infra is confirmed" |
| 2 | 2 | 2026-05-05T14:32:00Z | iOS | subagent | — | "audit the GMC feed and start sprint 1" |

## WAITING  (deferred until condition resolves)

| # | priority | sent_at (UTC) | source | defer_until | execution_mode | note | prompt |
|---|----------|---------------|--------|-------------|----------------|------|--------|
| 3 | 3 | 2026-05-05T14:45:00Z | desktop | m_task:M30 | inline | after-M30 | "backfill customers.segment for top 100 by revenue" |
| 4 | 4 | 2026-05-05T14:50:00Z | desktop | date:2026-05-12T09:00:00Z | inline | weekly | "run bc-business-review and snapshot it" |
| 5 | 5 | 2026-05-05T14:52:00Z | iOS | prompt:#1_completed | inline | — | "audit the kpi data and propose the next 3 forges" |

## IN PROGRESS  (currently executing)

| # | priority | sent_at | started_at | execution_mode | prompt |
|---|----------|---------|------------|----------------|--------|
| (empty when nothing is running) |

## COMPLETED  (graveyard)

- [x] **2026-05-05T14:25:00Z** → executed at 14:28 [inline] — "make the digest skill" → snapshot-001 saved
- ... (newest first)
```

After writing, output a confirmation (substitute actual values):

```
✓ QUEUED #3 — "backfill customers.segment for top 100 by revenue..."
  priority: 3 (chronological default; reorder anytime)
  source:   iOS
  Queue depth: 3 ready, 1 waiting

  Will execute at session-end OR on "execute next queued".
```

---

## Step 3 — VIEW: render the queue

Output the current state:

```
═══ PROMPT QUEUE — depth [Q ready / W waiting / P paused] ═══

QUEUED (priority order, ready):
  1. [pri=1] [age 12m] [iOS]    [inline]   — "build the kpi-snapshot skill..."
  2. [pri=2] [age 10m] [iOS]    [subagent] — "audit the GMC feed and start..."

WAITING (deferred):
  3. [pri=3] [age 5m]  [desktop] [defer: m_task:M30]               — "backfill customers..."
  4. [pri=4] [age 5m]  [desktop] [defer: date:2026-05-12T09:00]    — "weekly review"
  5. [pri=5] [age 4m]  [iOS]     [defer: prompt:#1_completed]      — "audit kpi data..."

PAUSED (mid-run, awaiting Michael's specific reply):
  6. [pri=2] [paused 8m] [skill-forge approval gate] — "forge a skill from Cascade"
     ↳ awaits: "build all" / "build N1 N2" / "skip all"

IN PROGRESS:
  (none)

LAST 3 COMPLETED:
  ✓ 14:28 [inline]   — "make the digest skill" (snapshot-001)
  ✓ 13:52 [subagent] — "vendor risk register run"
  ✓ 11:14 [inline]   — "audit the KPI data" (full audit, 38 gaps)
```

QUEUED items always render in **priority order, ascending** (lower = higher priority = first to execute). WAITING items render in priority order, but the `defer_until` condition is shown so Michael can see at a glance what each is blocked on. PAUSED items render with the gate type and the expected reply pattern.

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

## Step 4.5 — RESOLVE: re-evaluate WAITING items

Run this step at:
- The start of every other operation (cheap, idempotent)
- When `build-plan-status` reports an M-task or Track flip from `[ ]` → `[x]`
- On explicit triggers: "check waiting items", "re-evaluate queue", "promote ready items"

For each row in WAITING:

1. Parse the `defer_until` condition.
2. Evaluate the condition (see resolver functions below). For multi-condition rows (`A AND B`), all conditions must pass.
3. If condition met:
   - Move row from WAITING to QUEUED
   - Drop the `defer_until` field (or set to `none`)
   - Preserve priority, sent_at, source, execution_mode
   - Append to a separate `resolved_at` log line in the COMPLETED graveyard for audit
4. If condition not met: leave the row in WAITING.
5. After all rows processed, write the updated PROMPT_QUEUE.md.

**Resolver functions:**

| Type | How to evaluate |
|---|---|
| `m_task:[id]` | Read `BUILD_PLAN_MICHAEL.md`, find line containing `**[id]**`, check for `[x]` / `[X]` / `[✓]` / strikethrough markers |
| `track:[id]` | Read `BUILD_PLAN_CLAUDE.md`, find line containing `**[id]**`, check same marker patterns |
| `schema:[t.c]` | grep `M*.sql` for `ALTER TABLE [t] ... ADD COLUMN [c]` first; if no match, scan inside `CREATE TABLE [t] (...)` blocks for the column name. If parsing is ambiguous (e.g. column inside a complex multi-line block, computed/generated column, conditional ADD), do NOT auto-promote — leave the item WAITING and add a one-line `note: SCHEMA_PARSE_UNCERTAIN — verify manually`. The skill never promotes on uncertain SQL evidence (see gotcha-026 lesson). |
| `file:[path]` | `[ -f path ]` |
| `date:[ISO]` | current time ≥ ISO timestamp |
| `prompt:#[N]_completed` | item #N exists in COMPLETED graveyard |
| `custom:[bash]` | run the bash; exit code 0 = met. Bound to 5s timeout; failure to evaluate = leave WAITING |

Output of the RESOLVE operation:

```
═══ RESOLVE — 5 waiting items evaluated ═══
PROMOTED (2):
  - #3 "backfill customers.segment for top 100 by revenue" → m_task:M30 resolved (M30 marked [x] at 14:30)
  - #5 "audit the kpi data and propose next 3 forges" → prompt:#1_completed resolved
STILL WAITING (3):
  - #4 "run bc-business-review and snapshot it" → date:2026-05-12T09:00:00Z (in 6 days)
  - #6 "verify deliveries data integrity" → m_task:M27 (still pending in BUILD_PLAN_MICHAEL.md)
  - #7 "update vendor scores after M28 lands" → m_task:M28 (still pending)
```
(Substitute actual item counts, prompt text, and condition details from PROMPT_QUEUE.md.)

If no items promoted, output: "No waiting items ready. Re-evaluate when M-tasks land."

---

## Step 5 — EXECUTE next: pull and run

**Stale-recovery first.** Before pulling a new item, check if IN PROGRESS already has a row. If so:
- If `started_at` is < 10 minutes ago → another active session is running it; abort with "Queue item #N already in progress (started [time]). Wait or override?"
- If `started_at` is ≥ 10 minutes ago AND no recent commit history shows the prompt's effect → likely interrupted. Surface: "Queue item #N appears interrupted. Recover (re-run), abandon (mark FAILED), or wait?"
- Only proceed when IN PROGRESS is empty.

**Pull + execute (per execution_mode):**

1. Run Step 4.5 RESOLVE first (cheap, ensures any newly-ready items appear)
2. Read PROMPT_QUEUE.md
3. Pick the lowest-priority-number item from QUEUED (highest priority first)
4. Move that row to IN PROGRESS section, set `started_at = now`
5. Write back to PROMPT_QUEUE.md
6. Dispatch based on `execution_mode`:

**execution_mode = `inline`:**
- Execute the prompt as if Michael had just sent it inline — same skill-trigger detection, same workflow paths, same approval gates
- This blocks the current Claude turn until completion

**execution_mode = `subagent`:**
- Use the Agent tool to dispatch a subagent with the prompt as input
- Use `subagent_type: general-purpose` unless the prompt is matched to a specialized agent (Plan, Explore, etc.)
- Pass essential context: AccentOS working directory, current branch, "you are draining queue item #N"
- Wait for subagent completion; capture its returned summary as the outcome note
- Subagent runs in isolated context — Michael's main session token budget is preserved for orchestration

**execution_mode = `fresh-session`:**
- Output: `BLOCKED: fresh-session execution unavailable in v2 (requires Anthropic SDK Managed Agents + ANTHROPIC_API_KEY env). Fall back to subagent? (y/n)`
- If Michael confirms, retry as `subagent`; otherwise mark item as `BLOCKED_AWAITING_SDK` in WAITING with a permanent note.

7. On completion (or skill-internal interrupt):
   - Move row from IN PROGRESS → COMPLETED with `completed_at = now` and a one-line outcome note
   - Write back to PROMPT_QUEUE.md
   - Output: "✓ Queue item #N completed [mode] — [outcome]. [N-1] items remaining."
8. If autonomous-mode is active and budgets allow, loop to next item.

**Halt-and-wait gates:** if the executed prompt triggers a halt-and-wait (skill-forge approval gate, codex-review HIGH surface), pause queue execution there. Move the row from IN PROGRESS → **PAUSED** (a fifth lifecycle state) with a note explaining the gate and what input is awaited. PAUSED items are listed separately from WAITING in the queue render — WAITING is "deferred until a condition," PAUSED is "halted mid-run, awaiting Michael's specific input." When Michael responds (e.g. "build all 3" to a skill-forge gate), the next EXECUTE-next pulls the PAUSED row first (priority 0) and resumes from where it stopped.

**Lifecycle states summary** (5 total):
- QUEUED — ready, awaiting EXECUTE
- WAITING — deferred until `defer_until` resolves
- PAUSED — was running, hit halt-and-wait, needs Michael's specific reply to resume
- IN PROGRESS — actively executing right now
- COMPLETED — done (graveyard)

**PAUSED items do NOT auto-pull.** EXECUTE-next never picks a PAUSED item without explicit `resume #N` or `resume all paused` from Michael. Rationale: a PAUSED item is mid-decision; auto-resuming it on a generic "execute next" risks discarding Michael's pending input or pulling an unrelated paused decision. Always require explicit naming.

---

## Step 6 — DRAIN: serial or parallel

Two drain patterns based on Michael's phrasing:

**Serial drain (default for ≤2 items, or "drain serial"):**
- Hand off to `autonomous-mode` with `scope: prompt-queue serial-drain`
- autonomous-mode loops EXECUTE-next sequentially
- Each item completes before next starts

**Parallel drain (default for ≥3 items, or "drain in parallel"):**

Wave-based dispatch — handles mixed `inline` + `subagent` items deterministically:

1. Run Step 4.5 RESOLVE to find all ready items.
2. Sort ready items by priority (ascending).
3. Loop in waves of up to 5:
   - Take the next 5 ready items in priority order
   - Move all 5 from QUEUED → IN PROGRESS atomically before dispatch
   - Within each wave:
     - Dispatch all `subagent`-mode items in parallel via the Agent tool (single message, multiple Agent calls — Claude best-practice)
     - Drain `inline`-mode items serially after the subagents are dispatched (subagents run while Claude executes inline items)
   - Wait for all 5 wave items to finish
   - Move each to COMPLETED with outcome notes
4. After the wave completes, RESOLVE again (some prompts may have completed and unblocked `prompt:#N_completed` deferrals) and start the next wave.
5. Continue until QUEUED is empty OR a halt-and-wait gate fires.

**Wave-cap rationale:** 5 concurrent subagents is Anthropic's published best-practice for parallel Agent tool dispatch. More risks rate-limiting and blast-radius problems on a single failure.

**Halt-and-wait coordination during parallel drain:**
- If any subagent hits a halt-and-wait gate, that item moves to **PAUSED** (not WAITING) — per Step 5 rules, halt-and-wait is a mid-run interruption awaiting Michael's specific reply, not a deferred condition
- Other subagents continue
- Final report lists: completed [N] · paused [N] · failed [N]

**Default-mode policy:**
- Michael says "drain" with no mode → `inline` if total ready ≤2, else `subagent`
- Michael says "drain in parallel" → force `subagent` for all
- Michael says "drain serial" → force `inline` for all
- Per-item `execution_mode` field in PROMPT_QUEUE.md always overrides drain-default

This composes with `autonomous-mode` exactly as before — autonomous-mode is the orchestration runtime that drives prompt-queue's drain. The execution_mode dispatch happens inside the loop.

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

- **Never** auto-execute a queued prompt without an explicit Michael trigger. Non-interruption is the core guarantee — including no surprise execution.
- **Never** drop the COMPLETED graveyard from /home/user/accent-os/PROMPT_QUEUE.md. It is the audit trail and searchable history.
- **Never** delete IN PROGRESS rows on session interrupt. Leave them intact; the next session reads "this was running" and offers recovery options.
- **Never** modify the prompt_text of a queued item. When Michael wants to edit a prompt, he removes it and re-adds with the corrected text.
- **Never** queue a prompt that is already IN PROGRESS or was COMPLETED within the last 24h with >80% text match — surface the duplicate and ask Michael before queuing.
- **Never** hold queue state in memory. Every ADD, REORDER, RESOLVE, and EXECUTE operation writes back to /home/user/accent-os/PROMPT_QUEUE.md before the response is sent.
- **Never** strip Michael's verbatim phrasing from the prompt_text field — execute the prompt exactly as he wrote it, not a paraphrase.
- **Never** auto-promote a queued prompt to higher priority based on Claude's judgment (e.g. inferring urgency from prompt_text content, or reordering because a related M-task just landed). Priority order in `/home/user/accent-os/PROMPT_QUEUE.md` is Michael's call exclusively — reorder only on his explicit instruction.
- **Never** auto-promote a WAITING item on `schema:` type conditions when the SQL evidence is ambiguous. Leave the item WAITING and add a `SCHEMA_PARSE_UNCERTAIN` note rather than risking a false promotion.
