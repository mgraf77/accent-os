# action-queue executor registry
> Maps each `action_type` to the AccentOS skill that executes it. Read by `action-queue` Step 5 (execute). When a row in `action_queue` transitions APPROVED → EXECUTED, the action-queue skill looks up the executor here and invokes it via the harness Skill tool with the row's `payload`. No business logic lives in action-queue itself — it is a router and ledger.

This file is the **only** place where action_type → executor binding lives. To add a new action_type:
1. `ALTER TYPE action_type_enum ADD VALUE` in Supabase (see `proposed-schema.md`).
2. Add the row to the registry table below.
3. Forge or extend the executor skill so it accepts the documented payload shape.

---

## Registry — current bindings (initial set)

| action_type | executor skill | what the executor does | payload shape |
|---|---|---|---|
| `send_email` | `email-drafter` | Composes and saves a draft email in Michael's Gmail drafts folder. Never auto-sends. | `{ "to": [...], "cc": [...], "subject": str, "body_md": str, "thread_context": str?, "vendor_id": uuid? }` |
| `claim_coop` | `coop-claim-drafter` | Generates a co-op claim packet (line items, invoice refs, vendor portal field map) ready for Michael to submit. | `{ "vendor_id": uuid, "claim_period": "YYYY-Q#", "line_items": [...], "total": number, "deadline": "YYYY-MM-DD" }` |
| `update_bc_product` | `bc-rest-bridge` | Pushes a product field change to BigCommerce store `store-cwqiwcjxes` via REST. | `{ "product_id": int, "field": str, "value": any, "reason": str }` |
| `send_klaviyo_flow` | `klaviyo-flows` | Triggers a Klaviyo flow for a customer or segment. | `{ "flow_id": str, "profile_id": str?, "segment_id": str?, "context": object }` |
| `route_alert` | `alert-router` | Sends a structured alert to the appropriate channel (Slack, email, dashboard tile). | `{ "severity": "info\|warn\|crit", "channel": str, "title": str, "body_md": str, "source_skill": str }` |
| `churn_nudge` | `churn-predictor` | Issues a churn-prevention touch (email, Klaviyo, manual call task) for an at-risk customer. | `{ "customer_id": uuid, "risk_score": number, "tactic": "email\|klaviyo\|call_task", "context": object }` |
| `vendor_outreach` | `email-drafter` | Specialised email draft addressed to a vendor rep — uses `email-drafter` with a `vendor_outreach` template. | `{ "vendor_id": uuid, "rep_email": str, "campaign": str, "merge_fields": object }` |
| `price_change_push` | `bc-rest-bridge` | Bulk price change to BC products — wraps `update_bc_product` for multi-SKU pushes. | `{ "changes": [ { "product_id": int, "new_price": number, "reason": str } ], "vendor_id": uuid }` |

---

## How action-queue invokes the executor

Pseudocode (Step 5):

```
row = SELECT * FROM action_queue WHERE id = $id AND state = 'APPROVED'
executor = registry[row.action_type]      # this file
result = invoke_skill(executor, row.payload)
UPDATE action_queue
  SET state = 'EXECUTED',
      executed_at = NOW(),
      executor_result = result
  WHERE id = $id AND state = 'APPROVED'
```

If `result` matches `{"error": ...}` → state stays at `APPROVED`, `executor_result` records the error, receipt prompts RETRY-OR-DISMISS. No auto-retry.

---

## Result contract every executor must return

Every executor skill listed above MUST return a JSON object matching one of:

**Success:**
```json
{
  "status": "ok",
  "summary": "one-line human description (e.g. 'Draft saved to Gmail drafts, thread g1c2…')",
  "artifacts": {
    "thread_id": "...",
    "draft_id": "...",
    "bc_product_id": 0,
    "...": "any executor-specific ids"
  },
  "duration_ms": 0
}
```

**Partial success** (some sub-actions completed):
```json
{
  "status": "partial",
  "summary": "...",
  "completed": [...],
  "failed": [...],
  "duration_ms": 0
}
```

**Failure:**
```json
{
  "status": "error",
  "error": {
    "code": "EXECUTOR_TIMEOUT | RATE_LIMITED | AUTH_FAILED | VALIDATION | OTHER",
    "message": "human readable",
    "retryable": true
  },
  "duration_ms": 0
}
```

Action-queue stores the entire object in `executor_result` (jsonb).

---

## Producer-side reference (skills that call action-queue.propose)

These skills produce rows for the queue. They should never execute the underlying action themselves — they always go through this queue.

| producer skill | typical action_type emitted | trigger |
|---|---|---|
| `email-drafter` | `send_email` | when a queueable email is needed (vendor outreach, customer follow-up) |
| `coop-claim-drafter` | `claim_coop` | when a co-op claim window is open |
| `churn-predictor` | `churn_nudge` | when a customer's risk_score crosses threshold |
| `alert-router` | `route_alert` | when a signal needs a structured alert delivery |
| `bc-rest-bridge` | `update_bc_product`, `price_change_push` | when a price/field change is detected as needed |
| `klaviyo-flows` | `send_klaviyo_flow` | when a flow trigger is needed for a segment |
| `next-action-recommender` | any | when promoting a recommendation to a queued action |
| `vendor-cascade` | `vendor_outreach` | when the cascade pipeline reaches outreach stage |

---

## Anti-patterns at the registry level

- **Never add an action_type without also forging/binding an executor skill.** Step 5 will mark the row APPROVED with `executor_result = {"error": "no executor registered"}` — that's a code smell, not a feature.
- **Never let two action_types share an executor without a discriminator in payload.** If `email-drafter` handles both `send_email` and `vendor_outreach`, the payload's `template` or `campaign` field MUST disambiguate at the executor side.
- **Never duplicate the registry inline in another skill.** Companion skills read this file (or query it via the harness) — they do not maintain their own copy.
