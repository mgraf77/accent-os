---
name: windward-bridge
description: >
  Read-only bridge between AccentOS and Windward System Five — the ERP-of-record
  for Accent Lighting's invoices, customers, inventory, vendor balances, and
  order history. Provides a stable query surface (customer balance lookup,
  invoice fetch, aging summary, inventory by SKU, vendor balance, recent orders
  by date range) that other AccentOS skills call when they need ERP-grade
  financial or inventory truth. Read-only is a HARD POLICY, not a soft default —
  Windward is the system of record for finance and inventory; AccentOS does not,
  cannot, and must never write to it. Use this skill when Michael says: "pull
  from Windward", "Windward customer balance", "invoice aging", "whats on hand
  for SKU X", "vendor balance from ERP", "Windward orders this week", "Track
  6.11", "Windward live", "ERP truth", "what does Windward say", or any
  phrasing that asks for ERP truth on customers, invoices, inventory, or
  vendor AP. This skill is heavily gated on **M03 + M10** — until both are
  resolved, it ships a documentary stub enumerating the unblock steps for both.
  Always returns either a structured table with "as of [timestamp]" or the
  M03/M10 stub — never invents balances, never proposes writes, never bypasses
  the read-only contract.
---

# windward-bridge

**Purpose:** Give every AccentOS skill that needs ERP-grade financial or inventory truth a single, audited, read-only query surface against Windward System Five. Centralize Windward access so each skill doesn't reinvent connection handling, and so the read-only contract is enforced once.

---

## Trigger Recognition

Run this skill when Michael says anything like:
- "pull from Windward" / "what does Windward say" / "Windward live"
- "Windward customer balance for [name/id]" / "customer balance"
- "invoice aging" / "AR aging from ERP" / "invoice aging summary" / "AR aging"
- "whats on hand for SKU [X]" / "Windward inventory for [SKU]" / "on hand for [SKU]"
- "vendor balance from ERP" / "what do we owe [vendor]" / "vendor AP"
- "Windward orders this week" / "recent orders from Windward"
- "fetch invoice [id] from Windward" / "ERP truth on [customer/invoice]" / "ERP truth"
- "Windward query" / "Track 6.11" / "6.11 Windward" / "Windward integration"

Do NOT run for:
- BigCommerce orders / web revenue → `bc-business-review` or `bc-rest-bridge`
- Klaviyo email engagement → `klaviyo-flows`
- GA4 / GSC traffic → `ga4-insights` / `gsc-insights`
- Anything that *writes* to Windward — that's not a feature gap, that's a P0 bug. Refuse and surface the read-only policy.

---

## Step 0 — Preflight (BLOCKED gate on M03 + M10)

This skill is gated on **two M-tasks from `BUILD_PLAN_MICHAEL.md`** that must BOTH resolve before activation:

- **M03** — Written confirmation from Windward rep that S5WebAPI is read-only and included in the existing license.
- **M10** — Curtis outreach (Windward integration approval + WebAPI credentials).

Until both resolve:

1. Check whether the blocking dependencies exist. For windward-bridge, that means **either** of two connection methods must be configured (see `references/connection-method.md` for why ETL is preferred):

   **Method A — Supabase-replicated Windward tables (preferred):**
   - Table `windward_invoices` exists in Supabase project `hsyjcrrazrzqngwkqsqa`
   - Table `windward_customers` exists
   - Table `windward_inventory` exists
   - Table `windward_vendor_balances` exists
   - Table `windward_orders` exists
   - At least one row in `windward_etl_runs` with `status = 'success'` within the last 24 hours

   **Method B — Direct S5WebAPI (fallback):**
   - Env var `WINDWARD_S5WEBAPI_URL` is set (e.g. `http://<host>:215`)
   - Env var `WINDWARD_S5WEBAPI_USER` is set
   - Env var `WINDWARD_S5WEBAPI_PASSWORD` is set
   - Probe call to `/health` or `/auth` returns HTTP 200 (not 401/403)

   Run the preflight check:
   ```bash
   bash /home/user/accent-os/skills/windward-bridge/references/preflight-check.sh
   ```
   (See `references/preflight-check.md` for what that script does — table existence + row counts for Method A, then env var + curl probe for Method B.)

2. If **neither** method is configured, return this stub verbatim and exit:

   > Warning — skill `windward-bridge` is BLOCKED on **M03 + M10** (Windward read access provisioned + ETL or direct API connection established). Both must resolve.
   >
   > **To unblock M03 — from `BUILD_PLAN_MICHAEL.md`:**
   > 1. Draft email (ask Claude to draft if helpful) to your Windward rep.
   > 2. Specifically request written confirmation of: (a) S5WebAPI is included in the license you currently pay for at no additional charge, (b) read-only access does not violate ToS, (c) the documented authentication procedure for the WebAPI user.
   > 3. Save the reply email in Gmail with label "Windward / S5WebAPI Confirmation".
   > 4. Paste to Claude: `M03 done — Windward written confirmation received. Begin Track 6.11 / Curtis outreach planning.`
   >
   > **To unblock M10 — from `BUILD_PLAN_MICHAEL.md` (do NOT do this until M03 is complete):**
   > 1. Schedule a 15-min meeting with Curtis.
   > 2. Lead with the written confirmation — "I have a letter from Windward confirming S5WebAPI is included in our license and is read-only."
   > 3. Ask for: WebAPI user password OR creation of a read-only user for AccentOS.
   > 4. Document outcome in MASTER.md §13.
   > 5. Paste to Claude: `M10 done — Curtis approved. Credentials: <paste secure ref>. Begin Track 6.11 build.`
   >
   > **Connection-method note:** AccentOS prefers Method A (Supabase ETL of Windward tables) over Method B (direct ODBC/WebAPI calls). Reasons in `skills/windward-bridge/references/connection-method.md`. The actual decision is made at M03 resolution time.
   >
   > **Once unblocked, this skill produces:** structured tables for six query patterns (customer_balance_by_id, invoice_by_id, invoice_aging_summary, inventory_by_sku, vendor_balance_by_id, recent_orders_by_date_range) — each with a literal "as of [ISO-8601 timestamp]" header because Windward is the financial source-of-truth and timing matters for aging and balance reads.

3. If at least one method is configured AND at least one query pattern's underlying table/endpoint responds, proceed to Step 1. Note in the output which method (A or B) was used.

**Failure-mode handling for Step 0:**

- **One of M03/M10 resolved but not the other** — both are required. Even if M03 is done (written confirmation in hand), without M10 (Curtis approval + credentials) there is no way to authenticate against Windward. Return the stub with the partially-resolved status surfaced explicitly: `M03 [x] M10 [ ]` so Michael sees what's left.
- **Method A configured but `windward_etl_runs.completed_at` is older than 24 hours** — treat as stale. Return the stub with a "Method A ETL stale — last successful run was [N] hours ago" line and direct Michael to re-trigger the ETL or fall back to Method B if available.
- **Method B credentials expired (401/403)** — surface as `M10-credential-rotation` failure mode. Direct Michael back to Curtis to re-issue the WebAPI user password. Do NOT retry — silently retrying with bad creds risks account lockout on the ERP side.
- **Both methods report ready but a probe query against Windward returns zero rows where rows are expected** (e.g. `windward_invoices` has 0 rows when Accent's open AR is ~500) — flag possible ETL truncation; return the stub with a "data integrity check failed — surface to skill-health-monitor" line. Do not proceed to query.

---

## Step 1 — Identify the query pattern

The caller (skill or Michael) names one of six pre-defined query patterns. If the request doesn't match a pattern, surface the supported set and stop — do not invent a new pattern on the fly.

| Pattern key | What it returns | Typical caller |
|---|---|---|
| `customer_balance_by_id` | Open balance + last-payment-date for one customer | `churn-predictor`, `bc-business-review` |
| `invoice_by_id` | Single invoice header + line items | `coop-claim-drafter`, ad-hoc |
| `invoice_aging_summary` | Aging buckets (current / 30 / 60 / 90+) for all open AR | `analysis-snapshot`, owner dashboard |
| `inventory_by_sku` | `qty_on_hand`, `qty_committed`, `qty_available`, last-received-date | demand forecasting, sales floor |
| `vendor_balance_by_id` | Open AP balance + 90-day spend for one vendor | `vendor-cascade`, `coop-claim-drafter` |
| `recent_orders_by_date_range` | Orders (header + line count) in [from, to] | `bc-business-review` (non-BC channel orders), `churn-predictor` |

Full SQL/endpoint definitions live in `references/windward-queries.md`. This skill does not write SQL ad-hoc — every query comes from that reference file.

---

## Step 2 — Resolve the connection method

Choose method based on Step 0 preflight result:

- **Method A (preferred):** read from Supabase replica tables. Use `mcp__7131a9a4-433f-4a95-bf4b-905ccac6e3b0__execute_sql` against project `hsyjcrrazrzqngwkqsqa`. Add `AS OF` timestamp from `windward_etl_runs.completed_at` (the moment the ETL last copied Windward state).
- **Method B (fallback):** call S5WebAPI at `WINDWARD_S5WEBAPI_URL`. The `AS OF` timestamp is `NOW()` at call time.

State the chosen method explicitly in the output header. If both methods are available, prefer A and note that B was skipped.

---

## Step 3 — Run the query

Pull the SQL or endpoint mapping from `references/windward-queries.md` for the chosen pattern. Substitute parameters. Execute.

For Method A (Supabase), every query reads from a `windward_*` mirror table — never a write. There are no `INSERT`, `UPDATE`, `DELETE`, `MERGE`, `UPSERT`, or DDL statements anywhere in this skill or in `windward-queries.md`. If a future call attempts one, it's a P0 bug — refuse and alert.

For Method B (direct WebAPI), use only `GET` HTTP verbs. Refuse any `POST`, `PUT`, `PATCH`, `DELETE` against Windward. If the WebAPI returns 401/403, surface the auth failure and direct Michael to Curtis.

If the query exceeds expected rowcount (e.g. aging summary returns >5,000 rows when Accent's open AR is ~500), flag possible joins gone wrong — do not paginate silently.

---

## Step 4 — Format the structured output

Every output begins with a header block:

```
WINDWARD QUERY — [pattern_key]
Connection method: [A — Supabase replica | B — Direct S5WebAPI]
As of: [ISO-8601 timestamp]
Source-of-truth: Windward System Five (read-only)
```

Then the pattern-specific table. See `references/windward-queries.md` for the canonical schema per pattern. Examples:

**`customer_balance_by_id` output:**
```
| customer_id | name | open_balance | currency | last_payment_date | last_invoice_date | days_since_last_pmt |
|-------------|------|--------------|----------|-------------------|-------------------|---------------------|
| WW-12345    | ...  | $4,217.55    | USD      | 2026-04-12        | 2026-04-29        | 25                  |
```

**`invoice_aging_summary` output:**
```
| bucket  | invoice_count | open_amount | pct_of_open_ar |
|---------|---------------|-------------|----------------|
| current | 87            | $142,310    | 64.2%          |
| 1-30    | 31            | $48,902     | 22.1%          |
| 31-60   | 9             | $19,447     | 8.8%           |
| 61-90   | 4             | $8,021      | 3.6%           |
| 90+     | 2             | $2,860      | 1.3%           |
```

For aging and balance patterns, the `As of` timestamp is mandatory — not decorative. Downstream skills (`bc-business-review`, `coop-claim-drafter`) cite that timestamp in their own outputs.

---

## Step 5 — Hand off to companion skills

This skill is a primitive; it does not analyze. After producing the structured table, surface a one-line companion-skill hint when applicable:

| Pattern | Likely companion |
|---|---|
| `customer_balance_by_id` | `churn-predictor` (churn-risk weighting), `bc-business-review` (recap) |
| `invoice_aging_summary` | `analysis-snapshot` (snapshot the aging report for owner dashboard) |
| `inventory_by_sku` | `demand-forecaster-skill` (re-order signal) |
| `vendor_balance_by_id` | `vendor-cascade` (score impact), `coop-claim-drafter` (AP context) |
| `recent_orders_by_date_range` | `bc-business-review` (combine BC + Windward channels) |

Hand-off line format:
```
Next: pass this output to `[companion-skill]` with [param hint].
```

---

## Output format

Single message containing:

```
WINDWARD QUERY — [pattern_key]
Connection method: [A | B]
As of: [ISO-8601 timestamp]
Source-of-truth: Windward System Five (read-only)
Parameters: [the literal params used]

[structured table per pattern — see Step 4 + references/windward-queries.md]

Next: [optional companion-skill hand-off line]
```

If BLOCKED, output is the Step 0 stub message and nothing else.

**Partial-output rules:**

- If a query returns 0 rows where rows were expected (e.g. `customer_balance_by_id` for a known customer returns empty), still emit the header block + a `(no rows — verify [param] against Windward customer master)` body. Never a silent empty response.
- If the chosen method's `As of` timestamp is older than 24h (Method A stale), keep the query but prepend a `⚠ stale: ETL last ran [N]h ago` warning to the header. Caller can decide to re-run after ETL refresh.
- If a query exceeds the expected rowcount band (per `references/windward-queries.md` per-pattern band), emit the header + a `⚠ rowcount [N] exceeds expected band [low-high] — possible join error` line and the first 50 rows. Do NOT silently paginate the rest.
- Never emit a partial structured table without the header block — header is mandatory because downstream skills cite the `As of` timestamp.

---

## AccentOS context

- **Stack:** Supabase `hsyjcrrazrzqngwkqsqa` (Method A — preferred); Windward S5WebAPI port 215 on internal network (Method B — fallback)
- **Project:** AccentOS for Accent Lighting
- **Paths:** `/home/user/accent-os/` (Codespace: `/workspaces/accent-os/`)
- **Windward role:** ERP-of-record for finance + inventory per `MASTER.md` §10–§11. `MASTER.md` §14.2 confirms Windward integration is the gateway to all customer-intelligence skills.
- **BUILD_PLAN reference:** Track 6.11 (Windward live integration); blocked on M03 + M10.
- **Companion skills:**
  - `bc-business-review` — Windward order data feeds the weekly review for non-BC channels (walk-in, electrician).
  - `churn-predictor` — Windward purchase history fuels churn-risk for customers who don't transact on BC.
  - `vendor-cascade` — Windward AP gives the canonical vendor-balance number for cascade scoring.
  - `coop-claim-drafter` — vendor spend = Windward AP data, not a guess.
  - `analysis-snapshot` — snapshot Windward queries for re-runnable artifacts (e.g. month-end aging report).
- **Reference files:**
  - `references/windward-queries.md` — the six canonical query patterns + schemas.
  - `references/connection-method.md` — why Method A (Supabase ETL) is preferred over Method B (direct ODBC/WebAPI).
  - `references/preflight-check.md` — what the preflight script verifies.
  - `references/read-only-policy.md` — the contract this skill enforces, and how to escalate write attempts.

---

## Anti-patterns

- **Never write to Windward.** Read-only is a HARD POLICY, not a soft default. Any `INSERT`, `UPDATE`, `DELETE`, `MERGE`, `UPSERT`, or DDL against `windward_*` Supabase replica tables OR any non-`GET` HTTP verb to S5WebAPI is a **P0 bug, not a feature gap**. Refuse, do not log it as a "future enhancement," and surface `references/read-only-policy.md` to Michael.
- **Never invent a query pattern on the fly.** The six patterns in `references/windward-queries.md` are the surface. New pattern requests get added to that file as a versioned addition — they do not get freestyled in a single call.
- **Never omit the `As of` timestamp.** Windward is the financial source-of-truth; a balance without a timestamp is worse than no balance because it implies false freshness.
- **Never run this skill if the preflight check fails.** Return the M03 + M10 stub and exit. Do not attempt to "best-effort" with partial data.
- **Never mix Method A and Method B in one call.** Pick one, state it in the header. If A is stale and B is unavailable, say so in the output — do not silently switch.
- **Never call Windward from inside another skill without going through this skill.** Centralizing the read-only contract is the whole point. If `bc-business-review` opens a direct S5WebAPI connection, the read-only enforcement is bypassed.
- **Never paginate silently.** If a query returns more rows than expected, surface the count discrepancy — do not chunk and hide it.
- **Never expose Windward credentials in skill output.** If Method B credentials show up in a log or output, treat as a security incident and rotate.
