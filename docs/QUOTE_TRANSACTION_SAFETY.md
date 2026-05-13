# Quote Transaction Safety — Operational Notes
> Applies to: AccentOS quote save path. Updated: 2026-05-13.

---

## Transactional Strategy

All quote writes (header + line items) now route through a single Postgres RPC:

```
POST /rest/v1/rpc/upsert_quote_with_lines
Body: { p_header: {...}, p_lines: [...] }
```

The function (`sql/M45_quote_save_rpc.sql`) runs three operations inside **one implicit Postgres transaction**:

1. `UPSERT INTO quotes ON CONFLICT (number)` — creates or updates header, returns UUID
2. `DELETE FROM quote_lines WHERE quote_id = <uuid>` — wipes stale lines
3. `INSERT INTO quote_lines SELECT … FROM jsonb_array_elements(p_lines)` — writes new lines

If any step fails, Postgres rolls back all three. The client receives a non-2xx HTTP error. No partial state can reach the DB.

---

## Corruption Risks Removed

| Risk | Previous behaviour | Now |
|------|-------------------|-----|
| Delete succeeds, insert fails | Header exists, zero lines in DB | Full rollback — DB unchanged |
| "Saved" toast on failed write | Shown before async completes | Toast only fires after `await` resolves |
| Duplicate-click concurrent saves | Two saves race; interleaved deletes/inserts | `_quoteSaving` flag blocks second call until first completes |
| Silent failure | `sbSaveQuote` returned `false`; caller showed success | Error is re-thrown; `saveQ` catches and shows error toast with retry prompt |
| In-memory vs DB split | Optimistic in-memory update with no DB confirmation | In-memory update still optimistic, but failure message tells user to retry |

---

## Remaining Integrity Risks

**Accepted / low priority:**

- **In-memory optimistic state:** `QUOTES[]` is updated before the DB write completes. If the write fails and the user navigates away without retrying, the in-session view differs from DB until next reload. The error toast prompts retry.
- **Customer FK silent resolution failure:** `resolveCustomerByName` can return `null` on ambiguous names. The quote is saved with `customer_name` text only — no FK. Not a data loss risk; FK can be set later.
- **Empty line set is valid:** A quote with zero lines is accepted (valid draft). The RPC does not enforce minimum line count — that remains a UI validation concern.
- **Auth expiry mid-save:** If the JWT expires between the UI save trigger and the RPC call, Supabase returns 401. `sbFetch` throws, `saveQ` catches and shows "Save failed — Supabase 401". User must re-authenticate and press Save again. No partial write occurs.
- **Network timeout:** Browser default fetch timeout is ~90–120 s. If the RPC takes longer (unusual), the browser aborts with a network error. `saveQ` catches it. The DB transaction will still complete or rollback server-side regardless of client timeout; the client will not know the outcome. On reload the current DB state is authoritative.

---

## Rollback Strategy

The RPC is fully idempotent on the same `number` key:

- Re-saving the same quote number always overwrites — no duplicates.
- If a save fails, pressing Save again replays the same payload with no side effects.
- To revert to the last committed version: reload the page. `sbLoadQuotes` pulls the authoritative DB state.

**Manual recovery (operator):**

```sql
-- Check if a quote has lines (run in Supabase SQL editor)
SELECT q.number, q.project_name, COUNT(ql.id) AS line_count
FROM quotes q
LEFT JOIN quote_lines ql ON ql.quote_id = q.id
WHERE q.number = 'QT-0042'
GROUP BY q.number, q.project_name;
```

If `line_count = 0` for a quote that should have lines, the user should reload and re-save. The in-memory session state holds the line items until page refresh.

---

## Recovery Guarantees

| Failure scenario | DB state | In-memory state | User action |
|---|---|---|---|
| RPC network error | Unchanged (rollback) | Updated | Press Save to retry |
| RPC Postgres exception | Unchanged (rollback) | Updated | Press Save to retry |
| Auth expired (401) | Unchanged | Updated | Re-login, press Save |
| Browser closes mid-save | Unchanged (server-side rollback) | Lost | Re-open, re-enter or reload from DB |
| Duplicate click | First save wins; second blocked | Consistent | None needed |

---

---

## V2 Additions (M46)

### Stale-edit detection

`sbLoadQuotes` now fetches `updated_at` and stores it as `q._updatedAt`. Each save passes `p_expected_updated_at: q._updatedAt` to the RPC. If the DB row is newer, the RPC raises `CONFLICT: …`. `_doSaveQuote` catches the prefix and shows a confirm dialog:

- **Overwrite:** clears `q._updatedAt`, retries without the stale guard.
- **Cancel → Reload:** calls `reloadQuoteFromDB(id)`, replaces in-memory quote, re-renders with the authoritative DB version.

On success the RPC returns `updated_at` and the client stores it back into `q._updatedAt` so the next save has a fresh baseline.

### Local draft recovery

- `_saveQuoteDraft()` writes current form state to `localStorage['accent_quote_draft']` on: (a) any save failure, (b) `beforeunload`.
- Recovery banner shown at the top of the Quotes page if a draft < 24 h exists.
- **Restore draft** repopulates `CQ`, `LI`, and all form fields. **Discard** clears the slot.
- Single slot — cleared on successful save.

### Observability (`_quoteObs`)

In-session counters: `attempts`, `successes`, `failures`, `conflicts`, `retries`, `lastMs`, `totalMs`, `lastError`. Each successful save routes `{ timing_ms, line_count, retries }` into `sbAuditLog('quote_save', 'quotes', …)`.

### Reload affordance

`reloadQuoteFromDB(numberId)` fetches a single quote from DB with fresh `_updatedAt`, merges into `QUOTES[]`. Called automatically on conflict-cancel; also available for manual use.

---

## Migration

Apply in order:

1. `sql/M45_quote_save_rpc.sql` — creates `upsert_quote_with_lines(p_header, p_lines)`
2. `sql/M46_quote_stale_guard.sql` — `CREATE OR REPLACE` adds `p_expected_updated_at` + `updated_at` in response

M46 is idempotent. If only M45 is applied, the stale guard is silently skipped (NULL baseline always passes).

**Verification:**

```sql
SELECT routine_name, security_type
FROM information_schema.routines
WHERE routine_name = 'upsert_quote_with_lines';
-- Expected: security_type = 'INVOKER'

-- Stale guard smoke test (should raise CONFLICT):
SELECT upsert_quote_with_lines(
  '{"number":"QT-TEST","project_name":"Test","status":"draft","subtotal":0,"tax":0,"total":0}'::jsonb,
  '[]'::jsonb,
  '2020-01-01 00:00:00+00'::timestamptz
);
```
