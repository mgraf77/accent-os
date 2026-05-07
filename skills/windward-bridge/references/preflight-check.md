# Preflight check
> What `SKILL.md` Step 0 verifies before letting any query run.

The preflight check determines whether the M03 + M10 dependencies are resolved enough to skip the BLOCKED stub. It checks Method A first (preferred), then Method B (fallback), and exits 0 only if at least one is fully usable.

---

## What the check verifies

### Method A — Supabase replica
1. Tables exist in Supabase `hsyjcrrazrzqngwkqsqa`:
   - `windward_customers`
   - `windward_invoices`
   - `windward_invoice_lines`
   - `windward_ap_invoices`
   - `windward_inventory`
   - `windward_vendor_balances`
   - `windward_orders`
   - `windward_order_lines`
   - `windward_etl_runs`
2. Most recent `windward_etl_runs` row has `status = 'success'` AND `completed_at >= NOW() - INTERVAL '24 hours'`.
3. At least one row exists in each of `windward_customers`, `windward_invoices`, `windward_inventory` (sanity — empty tables fail).

If all three checks pass → Method A is usable.

### Method B — Direct S5WebAPI
1. Env var `WINDWARD_S5WEBAPI_URL` is set (non-empty).
2. Env var `WINDWARD_S5WEBAPI_USER` is set.
3. Env var `WINDWARD_S5WEBAPI_PASSWORD` is set.
4. `curl -sf "${WINDWARD_S5WEBAPI_URL}/health"` returns HTTP 200 (not 401/403/5xx). If `/health` is not a real endpoint, fall back to a known-safe `GET` on `/customers?limit=1`.

If all four checks pass → Method B is usable.

---

## Exit semantics

- Exit 0 + stdout `METHOD=A` → use Method A in `SKILL.md` Step 2.
- Exit 0 + stdout `METHOD=B` → use Method B.
- Exit 0 + stdout `METHOD=A` (when both work) → prefer A. Note B was available but skipped.
- Exit 1 + stderr explanation → return the BLOCKED stub from `SKILL.md` Step 0.

---

## Implementation outline

Pseudocode — the actual implementation depends on whether the Supabase MCP (M11) is fixed and what Method A's connection method looks like:

```bash
#!/usr/bin/env bash
# /home/user/accent-os/skills/windward-bridge/references/preflight-check.sh
# (this file is intentionally a doc, not the script — script lands when M10 lands)

set -euo pipefail

# --- Method A check ---
A_OK=false
required_tables=(windward_customers windward_invoices windward_invoice_lines \
                 windward_ap_invoices windward_inventory windward_vendor_balances \
                 windward_orders windward_order_lines windward_etl_runs)

# Use Supabase MCP execute_sql to verify each table exists.
# Then check windward_etl_runs latest row freshness.

# SELECT MAX(completed_at) FROM windward_etl_runs WHERE status = 'success';
# If NOW() - that < 24h → A_OK=true

# --- Method B check ---
B_OK=false
if [[ -n "${WINDWARD_S5WEBAPI_URL:-}" && -n "${WINDWARD_S5WEBAPI_USER:-}" && -n "${WINDWARD_S5WEBAPI_PASSWORD:-}" ]]; then
  if curl -sf -u "${WINDWARD_S5WEBAPI_USER}:${WINDWARD_S5WEBAPI_PASSWORD}" \
          "${WINDWARD_S5WEBAPI_URL}/health" >/dev/null 2>&1; then
    B_OK=true
  fi
fi

# --- Decide ---
if $A_OK; then
  echo "METHOD=A"
  exit 0
elif $B_OK; then
  echo "METHOD=B"
  exit 0
else
  echo "BLOCKED on M03 + M10 — neither method is configured" >&2
  exit 1
fi
```

The script is not committed yet. It lands as part of the M10 unblock work. Until then, `SKILL.md` Step 0 returns the stub regardless because no method exists yet.

---

## Stale ETL handling

If Method A's tables exist but the most recent `windward_etl_runs` row is older than 24 hours, the preflight should fail Method A (treat stale data as no data for ERP-of-record queries). If Method B is also unavailable, return the BLOCKED stub with an extra line:

> ETL pipeline appears stale (last successful run >24h ago). Check the ETL job before relying on Windward queries.

This protects downstream skills (`bc-business-review`, `coop-claim-drafter`) from quoting outdated balances as authoritative.
