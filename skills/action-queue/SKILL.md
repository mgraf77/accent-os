---
name: action-queue
description: >
  AccentOS approval-gated action queue — the L6 (Autonomous-execution-after-
  approval) backbone for Accent Lighting. Persists every proposed action
  (drafted emails, co-op claim drafts, vendor outreach, BigCommerce price-change
  pushes, Klaviyo flow triggers, churn-prevention nudges, alert routings) into
  a Supabase `action_queue` table on hsyjcrrazrzqngwkqsqa, runs each row
  through a five-state machine — PROPOSED → APPROVED → EXECUTED → ARCHIVED
  (or DISMISSED) — and delegates the actual execution to a registry of
  executor skills (email-drafter, coop-claim-drafter, bc-rest-bridge,
  klaviyo-flows, alert-router). Use this skill when Michael says: "queue
  this", "whats pending", "show the queue", "approve N", "approve all",
  "confirm bulk approve", "dismiss N", "kill that action", "blow out action N",
  "fire action N", "fire it", "run action N", "execute N", "knock out the queue",
  "ship the queue", "push approved", "queue depth", "whats waiting on me",
  "archive executed", "clean up the queue", or any phrasing that touches the
  propose/approve/execute/dismiss loop. Do not use this skill for one-off ad-hoc emails (those go straight
  through email-drafter without queueing) or for read-only data questions
  (use supabase-sql-magic). Always persists to Supabase with an
  idempotency_key, requires explicit per-action approval (never auto-
  approves), and emits a paste-ready receipt block on every state transition
  — never sends, drafts, or claims anything outside the executor delegation
  protocol, never bulk-approves without an explicit "approve all" confirmation
  phrase, and never modifies executor skills directly.
---

# action-queue

**Purpose:** Be the single approval-gated ledger for every action AccentOS proposes on Accent Lighting's behalf — the linchpin of MASTER §14's autonomous-execution narrative — so Michael approves once and the system executes via the right downstream skill, with full audit history.

Closes: Capability Ladder L6 (Autonomous execution after approval) · MASTER §14 ("Michael approves two, dismisses one, and the approved actions execute automatically") · V06 co-op auto-claim execution layer.

---

## Trigger Recognition

Run this skill when Michael says anything like:
- "queue this" / "queue it" / "queue for approval"
- "whats pending" / "show the queue" / "show pending" / "show me the queue"
- "approve 7" / "approve [id]" / "approve all" / "approve all pending" / "confirm bulk approve"
- "dismiss 3" / "kill that action" / "blow out action [id]" / "blow it out" / "throw out [id]"
- "fire action 5" / "fire that" / "fire it" / "run it" / "run action 5" / "execute 5" / "execute that"
- "knock out the queue" / "knock out pending" / "archive executed" / "clean up the queue"
- "whats waiting on me" / "whats waiting" / "whats in the queue"
- "queue depth" / "how many pending" / "how deep is the queue"
- "ship the queue" / "push the queue" / "push approved" / "ship approved"

Also trigger when a sibling skill (email-drafter, coop-claim-drafter, churn-predictor, alert-router, daily-brief-composer, bc-rest-bridge, klaviyo-flows) emits a "should we queue this?" suggestion or when `next-action-recommender` proposes promoting a recommendation to a queued action.

---

## Step 0 — Preflight (BLOCKED gate)

This skill is gated on the `action_queue` table existing in Supabase project `hsyjcrrazrzqngwkqsqa`. Until that resolves:

1. Check whether the `action_queue` table exists. Delegate the check to `supabase-sql-magic` with this query:
   ```sql
   SELECT to_regclass('public.action_queue') AS exists;
   ```
   If the result is `null`, the table does not exist.

2. If the table is missing, return this stub and exit:

   > skill `action-queue` is BLOCKED on schema provisioning. To unblock:
   > 1. Open the SQL Editor at https://hsyjcrrazrzqngwkqsqa.supabase.co/project/_/sql
   > 2. Paste and run the SQL block in `skills/action-queue/references/proposed-schema.md`
   > 3. Re-run any action-queue command — skill will activate automatically once the table check passes.
   >
   > Schema reminder (see proposed-schema.md for the full DDL): columns include
   > `id`, `proposed_at`, `proposed_by_skill`, `action_type`, `payload`, `state`,
   > `approved_at`, `approved_by`, `executed_at`, `executor_result`,
   > `dismissed_reason`, `idempotency_key`. State enum: PROPOSED, APPROVED,
   > EXECUTED, DISMISSED, ARCHIVED. Action_type enum drawn from
   > `references/executor-registry.md`.

3. If the table exists, also verify the `action_state` and `action_type_enum` enum types exist (per proposed-schema.md). If either is missing, return the same stub. Then verify `references/executor-registry.md` exists and is readable — if missing or unreadable, abort with "executor-registry.md missing — re-clone the action-queue skill directory" (the skill cannot route Step 5 without it). Otherwise proceed to Step 1.

4. Branch on Michael's verb. Each verb maps to one sub-step below:
   - "queue" / "propose"          → Step 1 (propose)
   - "show" / "list" / "pending"  → Step 2 (list-by-state)
   - "approve" / "approve all"    → Step 3 (approve)
   - "dismiss"                    → Step 4 (dismiss)
   - "execute" / "run"            → Step 5 (execute via delegation)
   - "archive" / "clean up"       → Step 6 (archive)

---

## Step 1 — Propose

Insert a new row into `action_queue` in state `PROPOSED`. Required input from caller (skill or Michael):
- `action_type` (must match a row in `references/executor-registry.md`)
- `payload` (jsonb — action-specific; shape defined per action_type in the registry)
- `proposed_by_skill` (text — the skill that originated this proposal)
- `idempotency_key` (text — caller-supplied; unique constraint prevents double-queue on same input)

If the caller does not supply `idempotency_key`, derive one as `sha256(action_type || canonical_payload || proposed_by_skill)`. Document the derivation in the receipt.

Validate `action_type` against the registry. If unknown → return error "action_type X not in executor-registry.md — register before queueing" and stop.

Use this SQL (delegate to `supabase-sql-magic`):
```sql
INSERT INTO action_queue
  (action_type, payload, proposed_by_skill, idempotency_key, state, proposed_at)
VALUES
  ($1, $2::jsonb, $3, $4, 'PROPOSED', NOW())
ON CONFLICT (idempotency_key) DO NOTHING
RETURNING id, state, proposed_at;
```

If `RETURNING` is empty, the action was a duplicate — emit "duplicate (idempotency_key already queued)" in the receipt instead of a new id.

Emit a single-action receipt block (see Output format).

---

## Step 2 — List by state

Default behaviour: list all `PROPOSED` actions sorted oldest-first.

Variants Michael may invoke:
- "show pending" / "what's waiting"        → state = PROPOSED
- "show approved but not yet executed"     → state = APPROVED
- "show recently executed"                 → state = EXECUTED, last 7 days
- "show dismissed"                         → state = DISMISSED, last 30 days
- "show all"                               → no state filter, paginated

SQL pattern:
```sql
SELECT id, proposed_at, proposed_by_skill, action_type,
       state, idempotency_key,
       jsonb_pretty(payload) AS payload_pretty
FROM action_queue
WHERE state = $1
ORDER BY proposed_at ASC
LIMIT 50;
```

Emit a list-view table (see Output format). Include a footer line with queue-depth counts per state for situational awareness.

---

## Step 3 — Approve

Two sub-paths:

**3A. Single approval** (`approve [id]`):
1. Read the action by id. Confirm `state = PROPOSED`. If not, abort with "action [id] is in state X — cannot approve" (covers concurrent-approve race: only one Update will return a row because the WHERE clause includes `state = 'PROPOSED'`).
2. Update to APPROVED:
   ```sql
   UPDATE action_queue
   SET state = 'APPROVED', approved_at = NOW(), approved_by = $1
   WHERE id = $2 AND state = 'PROPOSED'
   RETURNING id, action_type, payload;
   ```
   If `RETURNING` is empty → another approver beat us; abort with "race lost — action [id] no longer PROPOSED". Never patch state forward without the row returning.
3. Immediately proceed to Step 5 (execute) for that single action — approval and execution chain by default unless Michael's prompt contains the literal phrase "approve only" or "approve don't execute" (then stop after the UPDATE and emit an approval-only receipt; the row stays APPROVED until a later `execute [id]`).
4. Emit single-action approval-and-execution receipt.

**3B. Bulk approval** (`approve all`):
1. NEVER auto-approve on this phrase alone. Echo back: "Bulk approve confirms execution of N pending actions: [type breakdown]. Reply 'confirm bulk approve' to proceed." and stop.
2. Only on the literal phrase `confirm bulk approve` (or explicit "approve all confirmed"), proceed:
   ```sql
   UPDATE action_queue
   SET state = 'APPROVED', approved_at = NOW(), approved_by = $1
   WHERE state = 'PROPOSED'
   RETURNING id, action_type, payload;
   ```
3. Loop the returned rows through Step 5 sequentially (not parallel — preserves ordering and lets a single failure stop the cascade).
4. Emit a bulk receipt block (one summary header + one execution-result line per action).

Approval is the **only** state transition that mutates business reality. Treat the approval gate as the production-safety boundary.

---

## Step 4 — Dismiss

Dismissal is non-destructive — the row stays in the table for audit. Required input: `dismissed_reason` (text, ≥ 5 chars).

```sql
UPDATE action_queue
SET state = 'DISMISSED', dismissed_reason = $1
WHERE id = $2 AND state IN ('PROPOSED', 'APPROVED')
RETURNING id, action_type, dismissed_reason;
```

If state was already EXECUTED or ARCHIVED → abort with "cannot dismiss action in state X". If Michael did not provide a reason, prompt for one before mutating.

Emit a dismissal receipt.

---

## Step 5 — Execute (via executor delegation)

Action-queue **never executes business logic directly**. It only routes APPROVED rows to the executor skill named in `references/executor-registry.md` and records the result.

For each approved action:

1. Look up the executor skill name for `action_type` in `references/executor-registry.md`. If missing → mark `executor_result = {"error": "no executor registered", "action_type": "<value>"}`, leave state at APPROVED, surface in receipt with the literal text "register the executor in references/executor-registry.md and re-approve", stop.

   1a. **Executor in BLOCKED stub mode** (e.g. `bc-rest-bridge` blocked on M04, `klaviyo-flows` blocked on M09): the executor will return `{"error": "<skill> blocked on <M-task>"}`. Treat this as a partial-failure: keep state at APPROVED, record the blocker in `executor_result`, and surface the unblock steps from the executor's stub message in the receipt. Do not auto-retry — the row will execute on the next run after the M-task lands without re-approval.

   1b. **Executor refuses the action_type** (e.g. klaviyo-flows is read+propose only and will refuse `send_klaviyo_flow`): the executor returns `{"error": "action_type not supported by this executor"}`. Treat as a registry-binding bug: keep state at APPROVED, surface "registry says executor X handles Y but X refuses — fix references/executor-registry.md" in the receipt, stop.

2. Invoke the executor skill via the harness (Skill tool, with `skill: <executor-name>` and `args: payload`). Treat the executor's structured return as `executor_result`. Wrap the invocation with a 90-second soft timeout — if the executor does not return in 90s, mark `executor_result = {"error": "executor timeout 90s", "executor": "<name>"}`, keep state at APPROVED, surface RETRY-OR-DISMISS, stop.

3. Update the row:
   ```sql
   UPDATE action_queue
   SET state = 'EXECUTED', executed_at = NOW(), executor_result = $1::jsonb
   WHERE id = $2 AND state = 'APPROVED'
   RETURNING id, action_type, executed_at, executor_result;
   ```

4. If the executor returns an error structure (any `{"error": ...}` shape) → keep state at APPROVED (not EXECUTED), record the error in `executor_result`, and surface a `RETRY-OR-DISMISS` prompt in the receipt. Do not auto-retry.

5. Emit an execution receipt block.

Execution is sequential, never parallel — co-op claim portals, BigCommerce REST, and Klaviyo all rate-limit, and ordering matters when Michael is reviewing an action stream.

---

## Step 6 — Archive

Archive moves EXECUTED rows out of the active list view (housekeeping, not deletion). Default sweep: rows in state EXECUTED for ≥ 30 days.

```sql
UPDATE action_queue
SET state = 'ARCHIVED'
WHERE state = 'EXECUTED' AND executed_at < NOW() - INTERVAL '30 days'
RETURNING COUNT(*);
```

Manual variant `archive [id]` archives a single executed row. Never archive PROPOSED, APPROVED, or DISMISSED rows — they belong in the active audit window.

Emit a sweep receipt.

---

## Output format

### List view (Step 2)

```
ACTION QUEUE — state: [STATE]   |   shown: [N]   |   as of [timestamp]

| id (short) | proposed_at        | by_skill         | action_type        | idempotency_key (short) |
|------------|--------------------|------------------|--------------------|-------------------------|
| a3f2…      | 2026-05-07 09:14   | email-drafter    | send_email         | sha256:1c4e…            |
| 8b1d…      | 2026-05-07 10:02   | churn-predictor  | send_klaviyo_flow  | sha256:9a02…            |

Queue depth — PROPOSED: 7  |  APPROVED: 1  |  EXECUTED: 12 (last 7d)  |  DISMISSED: 3 (last 30d)
```

### Single-action detail / propose / approve / dismiss receipt

```
═══ ACTION [id] — [STATE_BEFORE → STATE_AFTER] ═══

action_type:       [send_email | claim_coop | update_bc_product | ...]
proposed_by:       [skill name]
proposed_at:       [ISO timestamp]
approved_at:       [ISO timestamp or —]
executed_at:       [ISO timestamp or —]
idempotency_key:   [sha256 prefix or caller-supplied]

payload (pretty-printed jsonb):
[multi-line jsonb]

executor_result (if executed):
[multi-line jsonb]

Next available actions: [approve N] [dismiss N] [execute N] [archive N]
```

### Execution receipt (Step 5)

```
═══ EXECUTED ACTION [id] ═══

routed_to_executor: [skill name]
result_status:      [ok | error | partial]
result_summary:     [one-line — e.g. "draft sent to Michael's Gmail drafts folder, thread_id g1c2…"]
duration_ms:        [N]

executor_result (full jsonb):
[multi-line jsonb]
```

### Bulk-approve confirmation prompt (Step 3B, pre-confirm)

```
BULK APPROVE — N pending actions

Type breakdown:
  send_email           ×3
  claim_coop           ×2
  update_bc_product    ×1
  send_klaviyo_flow    ×1

Reply 'confirm bulk approve' to approve and execute all N actions sequentially.
Reply 'cancel' to leave the queue untouched.
```

### Sweep receipt (Step 6)

```
ARCHIVE SWEEP — [date]

Rows archived: [N]
Cutoff: executed_at < [timestamp]
Active queue depth after sweep:
  PROPOSED: [n]   APPROVED: [n]   EXECUTED: [n]   ARCHIVED: [n]
```

### Partial-success / blocked-executor receipt (Step 5 sub-output)

When an executor returns BLOCKED-stub or a bulk run completes with mixed outcomes, the row state stays at APPROVED for the failed/blocked items. Receipt format:

```
═══ ACTION [id] — APPROVED (execution deferred) ═══

action_type:        [type]
routed_to_executor: [skill name]
result_status:      blocked | error | timeout
blocker:            [M-task id, e.g. M04 / M09 / "executor timeout 90s"]
unblock_steps:      [verbatim from executor stub, OR "register executor in registry"]
auto_retry:         no — retries on next manual `execute [id]` once blocker clears
                    (no re-approval required; idempotency_key preserved)

Next available actions: [execute N (after unblock)] [dismiss N]
```

For bulk runs in Step 3B/5, append a per-row line for each non-ok outcome under the bulk summary header — never silently swallow a blocked row.

---

## AccentOS context

- Stack: Supabase (`hsyjcrrazrzqngwkqsqa`) · Anthropic API (`ANTHROPIC_API_KEY`) for any payload-summarization pre-execute · BigCommerce (`store-cwqiwcjxes`) reached only through the `bc-rest-bridge` executor · Klaviyo only through the `klaviyo-flows` executor
- Project: AccentOS / Accent Lighting
- Paths: `/home/user/accent-os/skills/action-queue/` (Codespace: `/workspaces/accent-os/skills/action-queue/`)
- Schema: `references/proposed-schema.md` (DDL Michael runs once in Supabase SQL Editor)
- Registry: `references/executor-registry.md` (action_type → executor skill name)
- Companion skills:
  - **Producers** (call action-queue.propose): `email-drafter`, `coop-claim-drafter`, `churn-predictor`, `alert-router`, `bc-rest-bridge`, `klaviyo-flows`, `next-action-recommender`
  - **Surfaces queue depth**: `daily-brief-composer` (PROPOSED count tile), `next-action-recommender` (recommends top-N approvals from PROPOSED)
  - **Executors invoked by Step 5**: `email-drafter` (send_email), `coop-claim-drafter` (claim_coop), `bc-rest-bridge` (update_bc_product), `klaviyo-flows` (send_klaviyo_flow), `alert-router` (route_alert)

---

## Anti-patterns

- **Never auto-approve.** Single approve requires explicit id; bulk approve requires the literal phrase `confirm bulk approve` after a preview. The approval gate is the production-safety boundary — collapsing it breaks MASTER §14's whole narrative.
- **Never execute business logic inline.** Action-queue is a router and ledger. Sending an email, hitting the BigCommerce REST API, or claiming co-op happens inside the executor skill — not here.
- **Never bypass the idempotency_key.** Every propose call must yield (or derive) one. A duplicate key is a no-op return, not a second row — this is what protects against double-charging vendors / double-emailing customers when a producer skill retries.
- **Never delete rows.** Dismissal and archival are state transitions, not DELETEs. The audit history is the entire point of the queue.
- **Never advance state out of order.** Allowed transitions: PROPOSED→APPROVED, APPROVED→EXECUTED, EXECUTED→ARCHIVED, PROPOSED→DISMISSED, APPROVED→DISMISSED. Anything else aborts with a state-error receipt.
- **Never mutate other skills.** If an `action_type` needs a new executor, add the row to `references/executor-registry.md` and instruct Michael to forge the executor skill — do not edit the executor skill from here.
- **Never write SQL migration files.** The schema lives in `references/proposed-schema.md` for Michael to paste into Supabase SQL Editor — per AccentOS hard rule, no `sql/*.sql` migration files are authored by skills.
- **Never silently swallow a BLOCKED-stub return from an executor.** If `bc-rest-bridge` returns "blocked on M04" or `klaviyo-flows` returns "blocked on M09", the row stays at APPROVED, the receipt shows the unblock steps verbatim, and the Step 5 retry path uses the existing idempotency_key — no re-approval. Treating the stub as an EXECUTED erases the M-task tracking and double-executes once the blocker clears.
- **Never trust the registry without reverifying executor capability.** If an executor refuses an `action_type` it's listed for (e.g. klaviyo-flows is read+propose only and will refuse `send_klaviyo_flow`-shaped sends), the failure mode is a registry-binding bug, not a runtime error. Receipt must surface "fix references/executor-registry.md" — do not patch the row to EXECUTED, do not silently re-route.
