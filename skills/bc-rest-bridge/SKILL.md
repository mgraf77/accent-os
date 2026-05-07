---
name: bc-rest-bridge
description: >
  AccentOS BigCommerce write-side executor — the REST mutation bridge for
  Accent Lighting's store-cwqiwcjxes catalog. Receives APPROVED rows from
  the action-queue executor protocol (action_type `update_bc_product`)
  and translates each payload into one or more idempotent BigCommerce
  V3 REST writes: PUT /catalog/products/{id} for product field edits,
  PUT /catalog/products/{id}/custom-fields/{cf_id} for custom-field
  rewrites, POST /pricelists/{id}/records for price-list edits, and
  PUT /catalog/categories/{id}/products for category assignments. Every
  call is preceded by a before/after diff preview, gated on a
  caller-supplied idempotency_key (sha256 of product_id + field_name +
  new_value + proposer_skill), throttled to BigCommerce's 50/sec limit
  via 25ms inter-call sleep, and emits a per-write receipt plus batch
  summary. Use this skill when Michael says: "push that price update",
  "bulk meta CSV is approved — fire it", "execute the BC writes", "run
  the bc-rest-bridge", "send the meta updates to BigCommerce", "apply
  the approved BC edits", "execute action N" (when action_type is
  update_bc_product), or any phrasing that asks for write-side
  BigCommerce API execution against approved AccentOS proposals. Do not
  use this skill for read-side BC analytics (use bc-business-review),
  for proposing changes (use bulk-meta-description, gmc-feed-audit, or
  whatever upstream skill produced the action), or for direct write
  commands that bypass action-queue. Always routes every write through
  the action-queue APPROVED→EXECUTED transition with a derived
  idempotency_key and produces a per-write receipt with BC response
  excerpt — never accepts direct write commands, never bypasses the
  diff-preview gate, never exceeds 50/sec, and never silently retries a
  failed write.
---

# bc-rest-bridge

**Purpose:** Be the single, safety-gated write executor for Accent Lighting's BigCommerce store-cwqiwcjxes — the L6 autonomous-execution leg that turns APPROVED `update_bc_product` rows in `action-queue` into idempotent REST mutations against the V3 catalog and price-list endpoints.

Closes: BUILD_PLAN Track 6.3 (BigCommerce write-side automation) · Capability Ladder L6 (autonomous execution after approval) · MASTER §14 narrative ("Michael approves, the system executes").

Read-side counterpart: `bc-business-review` (already shipped) reads BC analytics. This skill is the write counterpart — they share store-cwqiwcjxes context but never share an execution path.

---

## Trigger Recognition

Run this skill when Michael says anything like:
- "push that price update" / "fire the BC writes"
- "execute the BC writes" / "run bc-rest-bridge"
- "send the meta updates to BigCommerce" / "ship the meta CSV"
- "apply the approved BC edits" / "execute the queued product updates"
- "execute action N" (when action_type is `update_bc_product`)
- "bulk meta CSV is approved — fire it"
- "BC catalog write" / "BC field update"

Also trigger when `action-queue` Step 5 routes an APPROVED row whose `action_type = update_bc_product` — that is the canonical invocation path.

---

## Step 0 — Preflight (BLOCKED gate)

This skill is gated on **M04 (BigCommerce API credentials with write scope)** from `BUILD_PLAN_MICHAEL.md`. Until that resolves, the skill ships in stub mode.

1. Check three environment variables in order:
   - `BC_STORE_HASH` — must equal `store-cwqiwcjxes`
   - `BC_API_TOKEN` — non-empty access token (V2/V3)
   - `BC_API_TOKEN_HAS_WRITE_SCOPE` — must be the literal string `true`

2. If any check fails, return this stub and exit:

   > skill `bc-rest-bridge` is BLOCKED on M04. To unblock:
   > 1. Open `https://store-cwqiwcjxes.mybigcommerce.com/manage/settings/auth/api-accounts`
   > 2. Click **Create API account** → name "AccentOS Write" → token type V2/V3 API token
   > 3. Scopes: **modify** on Products, Price Lists, and Custom Fields (read on Categories is sufficient for assignment lookups)
   > 4. Save the access token. Set env vars in `/home/user/accent-os/.claude/settings.local.json`:
   >    `BC_STORE_HASH=store-cwqiwcjxes`, `BC_API_TOKEN=<paste>`, `BC_API_TOKEN_HAS_WRITE_SCOPE=true`
   > 5. Tell Claude: `M04 done — BC write token in. bc-rest-bridge unblocked.`
   >
   > Until M04 lands, action-queue rows with `action_type = update_bc_product` stay in APPROVED state with `executor_result = {"error": "bc-rest-bridge blocked on M04"}`. They will execute automatically once env vars are set — no re-approval required.

3. If all three checks pass, proceed to Step 1.

---

## Step 1 — Reject any direct write command

This skill is **not** a direct CLI for BC mutations. It is an **executor** in the action-queue protocol. Refuse any invocation whose payload was not produced by an APPROVED action_queue row.

Concretely:

- If the caller is the `action-queue` skill (Step 5 routing) → proceed to Step 2.
- If the caller is Michael typing a write command directly ("set product 12345 price to $99") → respond:

   > bc-rest-bridge does not accept direct write commands. To push this change:
   > 1. Have the upstream skill (e.g. `bulk-meta-description`, a manual `action-queue propose`) queue a row with `action_type = update_bc_product` and the payload shape in `references/payload-schemas.md`.
   > 2. Approve it via `action-queue` (`approve [id]`).
   > 3. Approval auto-routes the row here for execution.
   >
   > This guard preserves the L6 autonomous-execution discipline — every BC mutation has an approval audit row.

This refusal is non-negotiable. Document the attempt in the receipt and stop.

---

## Step 2 — Resolve the payload to an endpoint plan

Read the action_queue row's `payload` jsonb. Match its shape to one of the four action variants documented in `references/payload-schemas.md` and `references/bc-endpoints.md`:

| Variant | Trigger field in payload | BC endpoint |
|---|---|---|
| **product_field_edit** | `product_id` + `fields` (object of column→new_value) | `PUT /catalog/products/{product_id}` |
| **custom_field_edit** | `product_id` + `custom_field_id` + `value` | `PUT /catalog/products/{product_id}/custom-fields/{custom_field_id}` |
| **price_list_record** | `price_list_id` + `variant_id` + `price` | `POST /pricelists/{price_list_id}/records` |
| **category_assignment** | `product_id` + `categories` (array of category_id) | `PUT /catalog/products/{product_id}` (categories array attribute) |

If the payload doesn't match any variant → mark the action_queue row as failed-execution (state stays APPROVED, `executor_result = {"error": "payload shape not recognized — see references/payload-schemas.md"}`) and exit. Never guess at endpoint mapping.

If the payload is a **batch** (top-level key `batch: [array of variants]`) → produce a plan with one endpoint call per element, ordered by element index. Batches are valid; treat each call as a sub-write with its own receipt.

---

## Step 3 — Produce the before/after diff preview

For every endpoint call planned in Step 2, fetch the current state of the field being mutated and emit a diff. This diff is what Michael actually approves at the action-queue layer — by Step 3 here it has already been approved, but the diff is recorded in the receipt so the audit row shows what was changed.

For `product_field_edit` and `custom_field_edit`:
1. GET the current value via the read endpoint (e.g. `GET /catalog/products/{product_id}` returning the current fields).
2. Compute a row-level diff: `{ field_name: { before: <current>, after: <new> } }`.
3. If `before == after` → mark as `NO_CHANGE`, skip the write, advance to the next call. Idempotency at the value level.

For `price_list_record`:
1. GET `/pricelists/{price_list_id}/records?variant_id={variant_id}` to find the current record (if any).
2. Diff: `{ price: { before: <current or null>, after: <new> } }`.
3. If no current record exists, the POST creates one — diff shows `before: null`.

For `category_assignment`:
1. GET the current `categories[]` from the product.
2. Diff: `{ categories: { added: [...], removed: [...] } }` so additions and removals are explicit.

If any GET returns 404 → mark the call as failed (`error: "BC entity not found"`), do not proceed with the PUT/POST. The action_queue row stays APPROVED for retry-or-dismiss.

---

## Step 4 — Derive the idempotency key

Per call, derive `idempotency_key = sha256(product_id || "::" || field_name || "::" || canonical(new_value) || "::" || proposed_by_skill)`. The action_queue row already has a top-level idempotency_key; this is the per-call key for batches and the BC-side dedupe.

Use it in two places:
1. As an `If-Match` header where the BC endpoint supports it (custom-field edits do; product PUT supports `If-None-Match` for last-write-wins detection).
2. In the executor_result JSON so a re-execution by action-queue produces an identical key — making double-fire on retry a no-op locally before the request even leaves.

If the same key has already been recorded as `EXECUTED` for this action_queue id → skip the call, mark `NO_CHANGE (idempotency_key already executed)`, and advance.

---

## Step 5 — Execute the write with rate limiting

Send each planned call sequentially. Between calls, **sleep 25 ms** to stay safely under BigCommerce's 50/sec rate limit (25ms × 40 = 1000ms; 40 calls/sec leaves headroom for retries).

Per call:

1. Build the request:
   - URL: `https://api.bigcommerce.com/stores/store-cwqiwcjxes/v3/<endpoint>`
   - Headers: `X-Auth-Token: $BC_API_TOKEN`, `Content-Type: application/json`, `Accept: application/json`, `If-Match: <idempotency_key>` where supported
   - Body: the field-update jsonb derived in Step 2

2. Send the request. Capture: HTTP status, response body (truncated to first 2KB for the receipt), `X-Rate-Limit-Time-Reset-Ms` and `X-Rate-Limit-Requests-Left` headers.

3. Handle the response:
   - **2xx** → success. Record the response excerpt and idempotency_key in `executor_result.calls[i]`.
   - **409 Conflict** (If-Match mismatch) → BC reports the row was modified after our diff. Mark `error: "BC row changed since diff — re-propose"`, do NOT retry, surface in receipt.
   - **422 Unprocessable** → field validation failed at BC. Record the BC error message verbatim. Do NOT retry — proposer skill produced an invalid payload.
   - **429 Too Many Requests** → we exceeded rate limit despite the 25ms sleep. Sleep `X-Rate-Limit-Time-Reset-Ms`, then retry **once**. If the retry also returns 429, mark as failed and abort the rest of the batch.
   - **5xx** → BigCommerce-side error. Mark as failed; do NOT auto-retry (the proposer skill or Michael decides whether to re-queue).

4. After the response, **never** auto-retry on any 4xx (except the 429 single-retry above). Surface the failure and let Michael decide.

When all calls complete (or one aborts the batch), build the executor_result jsonb (see Output format) and return it to action-queue.

---

## Step 6 — Emit per-write and batch receipts

For a single-call execution: emit the per-write receipt block.

For a batch: emit one batch summary table at the top followed by per-write receipts for any calls that failed or had `NO_CHANGE` status. Successful calls in a batch do not need their own block — the summary table covers them.

Surface the BC-side rate-limit headers at the bottom of the receipt so Michael can monitor headroom across batches.

---

## Output format

### Single-write receipt

```
═══ BC-REST-BRIDGE — action_queue id [N] ═══

variant:           [product_field_edit | custom_field_edit | price_list_record | category_assignment]
endpoint:          [HTTP_VERB url]
idempotency_key:   sha256:[12-char prefix]…
status:            [ok | NO_CHANGE | error | conflict-409 | rate-limited-429 | server-error-5xx]
duration_ms:       [N]

diff:
  [field_name]:
    before: [value]
    after:  [value]

bc_response_excerpt (first 2KB):
[raw response body, truncated]

bc_rate_limit_remaining: [X-Rate-Limit-Requests-Left] / 50 in [X-Rate-Limit-Time-Reset-Ms]ms
```

### Batch summary table

```
═══ BC-REST-BRIDGE BATCH — action_queue id [N] — [M] writes ═══

| # | variant            | product_id | field            | status     | idem_key (short) |
|---|--------------------|------------|------------------|------------|------------------|
| 1 | product_field_edit | 12345      | meta_description | ok         | a3f2…            |
| 2 | product_field_edit | 12346      | meta_description | NO_CHANGE  | 8b1d…            |
| 3 | product_field_edit | 12347      | meta_description | error      | 9c40…            |
| … | …                  | …          | …                | …          | …                |

Totals: ok [N]   NO_CHANGE [N]   error [N]   conflict [N]   rate-limited [N]
Aggregate duration: [N]ms   |   BC rate-limit remaining at end: [N]/50

[Per-write blocks for any non-ok rows follow below.]
```

### executor_result jsonb (returned to action-queue)

```json
{
  "skill": "bc-rest-bridge",
  "variant": "product_field_edit | custom_field_edit | price_list_record | category_assignment | batch",
  "calls": [
    {
      "endpoint": "PUT /catalog/products/12345",
      "idempotency_key": "sha256:a3f2…",
      "status": "ok",
      "http_status": 200,
      "diff": { "meta_description": { "before": "...", "after": "..." } },
      "bc_response_excerpt": "{\"data\":{\"id\":12345,...}}",
      "duration_ms": 142
    }
  ],
  "totals": { "ok": 38, "NO_CHANGE": 1, "error": 1, "conflict": 0, "rate_limited": 0 },
  "aggregate_duration_ms": 6420,
  "bc_rate_limit_remaining": 47
}
```

---

## AccentOS context

- Stack: BigCommerce V3 REST API (`store-cwqiwcjxes`) · environment-vars `BC_STORE_HASH`, `BC_API_TOKEN`, `BC_API_TOKEN_HAS_WRITE_SCOPE` injected via `/home/user/accent-os/.claude/settings.local.json` · Supabase `hsyjcrrazrzqngwkqsqa` only as the source of action_queue rows (this skill never reads Supabase directly — it receives payload from action-queue Step 5)
- Project: AccentOS / Accent Lighting
- Paths: `/home/user/accent-os/skills/bc-rest-bridge/` (Codespace: `/workspaces/accent-os/skills/bc-rest-bridge/`)
- Endpoints reference: `references/bc-endpoints.md` (URL templates, headers, sample bodies)
- Payload reference: `references/payload-schemas.md` (the four variant shapes action-queue producers must use)
- Companion skills:
  - **Upstream — proposers** that queue `update_bc_product` rows: `bulk-meta-description` (high-volume meta CSV writes), `gmc-feed-audit` (remediation-queue follow-up writes), any future `competitive-pricing-sync` skill. Each calls `action-queue.propose` with the payload — never calls bc-rest-bridge directly.
  - **Approval gate**: `action-queue` (this skill is registered in `action-queue/references/executor-registry.md` for `action_type = update_bc_product`).
  - **Read-side counterpart**: `bc-business-review` (reads BC analytics; never writes — strict separation).
  - **Downstream — re-validation triggers**: `gmc-feed-audit` (a successful BC write often invalidates GMC feed cache; rerun the audit after a batch of meta or category changes).
  - **Receipt consumers**: `daily-brief-composer` (executed-action tile), `decision-log` (when Michael wants a write batch logged as a deliberate strategy choice).

---

## Anti-patterns

- **Never accept direct write commands.** Step 1 refuses anything that didn't come from action-queue's APPROVED→EXECUTED routing. The L6 discipline is the whole point of this skill — collapsing it turns AccentOS into a generic BC CLI and erases the audit trail.
- **Never skip the diff preview.** Even for "trivial" mutations like a single price tweak, Step 3 GETs the current value and records the before/after diff in `executor_result`. NO_CHANGE detection at the value level is what makes idempotent retries safe.
- **Never bypass the 25 ms inter-call sleep.** BigCommerce's 50/sec rate limit is per store, not per token; bursting past it 429s the entire AccentOS workload. The 25ms gate is non-negotiable.
- **Never auto-retry on 4xx (other than the single 429 retry).** A 422 means the proposer skill produced an invalid payload — fix it upstream. A 409 means BC changed under us — re-propose. Auto-retry hides bugs.
- **Never write to BC without an `idempotency_key`.** Step 4 derives one if the payload doesn't carry it. A retry with the same key is a no-op; a retry without one is a duplicate.
- **Never read Supabase directly.** This skill's only inputs are the payload from action-queue Step 5 and the BC GET responses for the diff. Mixing in Supabase reads couples this executor to schema drift it shouldn't care about.
- **Never silently truncate a batch on first error.** If call N fails, calls N+1..M still run unless the failure was a 429 hard-stop or an auth failure — the receipt's batch summary shows partial-success explicitly so Michael can re-queue only the failed ids.
- **Never mutate other skills.** If a new BC endpoint is needed (e.g. `/v3/inventory`), add the variant to `references/bc-endpoints.md` and `references/payload-schemas.md`, register the new `action_type` in `action-queue/references/executor-registry.md`, and have Michael re-approve. Do not edit upstream proposer skills from here.
