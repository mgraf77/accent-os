# Connection method — Method A (preferred) vs Method B (fallback)
> Why AccentOS prefers Supabase-replicated Windward tables over direct ODBC/WebAPI calls.

The actual decision is gated on M03 resolution. This document records the recommendation; Curtis + Michael may overrule it during M10 negotiation.

---

## Method A — Supabase replica via ETL (PREFERRED)

A scheduled ETL job copies Windward read-only views into mirror tables in Supabase project `hsyjcrrazrzqngwkqsqa`. Every AccentOS skill (including this one) reads from those mirror tables.

### Tables expected after M03 + M10 + ETL setup
| Mirror table | Source (Windward view/table) | Refresh cadence |
|---|---|---|
| `windward_customers` | customer master | hourly |
| `windward_invoices` | invoice header | hourly |
| `windward_invoice_lines` | invoice lines | hourly |
| `windward_ap_invoices` | AP invoice header | hourly |
| `windward_inventory` | inventory item with qty_on_hand / qty_committed | every 15 min |
| `windward_vendor_balances` | vendor master + AP rollup | hourly |
| `windward_orders` | order header (all channels) | every 15 min |
| `windward_order_lines` | order lines | every 15 min |
| `windward_etl_runs` | ETL run log (started, completed, status, row_counts_json) | written by ETL itself |

### Why preferred

1. **AccentOS already runs on Supabase.** No new infrastructure, no new auth model, no new credential surface. Existing RLS policies (M01) extend naturally.
2. **Replication scopes naturally to read-only.** The ETL job has WRITE access to `windward_*` mirror tables in Supabase, but every other actor (the AccentOS app, every skill, every Edge Function) has READ-ONLY access. The Windward side never sees a write attempt because no AccentOS code talks to Windward — only the ETL does.
3. **ETL job is the single point of failure** rather than every skill calling Windward. If Windward is down, the mirror is stale (but readable). If the ETL is down, `windward_etl_runs.completed_at` ages out and the preflight check in `SKILL.md` Step 0 detects staleness.
4. **No per-skill connection handling.** `vendor-cascade`, `churn-predictor`, `bc-business-review`, `coop-claim-drafter`, and `analysis-snapshot` all read the same mirror — no five copies of S5WebAPI auth logic.
5. **Aging / balance reads get a real `As of` timestamp** from `windward_etl_runs.completed_at`, which is more meaningful than a `NOW()` from a direct call (the underlying data was a snapshot taken at ETL run time anyway).
6. **MASTER.md §14.2 anticipates this:** "Build (Supabase Edge Function SQL bridge)" for Windward ERP data, $0 cost. Method A *is* that bridge.

### Drawbacks
- Up to 15-min staleness for inventory; up to 1-hour staleness for AR / AP. For Accent Lighting's volume, that's acceptable for every use case in `windward-queries.md` except possibly real-time inventory checks during a live sales call (see Method B).
- ETL pipeline must be built. Not free in engineering time, but free in licensing.

---

## Method B — Direct S5WebAPI (FALLBACK)

`windward-bridge` calls Windward's S5WebAPI on port 215 directly, with WebAPI user credentials provisioned in M10. Every skill that needs Windward data goes through `windward-bridge` (which then opens its own connection per call).

### When to use
- M03 confirms S5WebAPI is licensed-included and read-only, AND
- Curtis (M10) provides credentials, AND
- ETL pipeline (Method A) is not yet built — interim mode.

### Auth state (per `MASTER.md` §9 Windward S5WebAPI Strategy)
Port 215 returns HTTP 200 but all endpoints return 401/403 — WebAPI user password is undocumented. Three recovery options noted in MASTER:
- (a) search filesystem/credential manager
- (b) check Feedenomics admin for existing Windward connector
- (c) email Windward support for password recovery

M10 resolves this by Curtis either revealing the existing password or creating a fresh read-only WebAPI user.

### Drawbacks
- Each skill call opens a fresh HTTP connection to Windward's local network. Latency, retry handling, and rate limiting all become per-call concerns.
- Read-only enforcement depends on Windward server-side ACLs being correct. M03's written confirmation is the contract; Method A makes the contract architectural rather than policy-based.
- Credential rotation requires updating env vars and restarting Edge Functions. With Method A, only the ETL job's credentials need rotation.
- No `As of` snapshot — every call is "as of now" but with no audit trail of what data was visible at what time. For aging reports re-run a week later, output may differ in ways that are hard to explain.

---

## Recommendation

**Default to Method A.** Treat M10 as also covering "stand up the ETL pipeline," not just "get WebAPI credentials." If Curtis pushes back on the ETL approach, fall back to Method B with a documented plan to migrate to A within 90 days.

`SKILL.md` Step 0 preflight checks for Method A first; Method B is only consulted if A's tables don't exist or the latest `windward_etl_runs` row is stale.
