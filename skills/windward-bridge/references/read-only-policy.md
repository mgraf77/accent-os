# Read-only policy
> The hard contract this skill enforces. Read this when any caller asks "can we just write back to Windward this once?"

The answer is **no**. Not now, not later, not "as a special case." Windward System Five is the ERP-of-record for Accent Lighting's finance and inventory data. AccentOS is a *read-side* consumer of that data. There is no scenario in which AccentOS legitimately writes to Windward.

A write attempt is a **P0 bug**, not a feature gap, not a roadmap item, not a "future enhancement."

---

## Why this contract exists

1. **License posture.** M03 obtains written confirmation from Windward that S5WebAPI is read-only and included in the existing license. Writing back voids that posture. The day AccentOS writes to Windward is the day the license interpretation is in dispute.
2. **Single source of truth.** Finance and inventory have one canonical home. If AccentOS can update an invoice or adjust on-hand qty, two sources can diverge. Reconciliation between two writable systems is a non-trivial engineering problem AccentOS is not budgeted to solve.
3. **Curtis trust.** M10 (Curtis outreach) succeeds only on the read-only premise. Write-back capability re-opens a closed political loop and likely terminates the integration.
4. **Audit trail.** Windward has an internal audit trail. AccentOS writing through the WebAPI bypasses some of that, depending on how the WebAPI is configured. We do not want to be the cause of an unaudited finance change.
5. **Reversibility.** Reads are safe to retry, cache, snapshot, replay. Writes are not. The design value of read-only is operational, not just political.

---

## What "read-only" means in practice

### Method A (Supabase replica)
- Mirror tables (`windward_*`) in `hsyjcrrazrzqngwkqsqa` are populated by the ETL job and only by the ETL job.
- AccentOS RLS policies grant SELECT-only on these tables to every role except the ETL service role.
- No skill, including this one, opens a transaction that includes any of: `INSERT`, `UPDATE`, `DELETE`, `MERGE`, `UPSERT`, `TRUNCATE`, `ALTER`, `DROP`, `CREATE`, `GRANT`, `REVOKE` on a `windward_*` table.
- The ETL job itself writes to `windward_*` mirror tables but **never to Windward**. The data flow is one-way: Windward → mirror, never mirror → Windward.

### Method B (Direct S5WebAPI)
- Only `GET` HTTP verbs. Never `POST`, `PUT`, `PATCH`, `DELETE`.
- If a future helper function in `references/windward-queries.md` introduces a non-`GET` verb, the file fails the read-only audit (below) and must not ship.

---

## Read-only audit

Run this whenever `windward-queries.md` or any code in `windward-bridge` changes:

```bash
# Audit the queries file for any write keywords
grep -iE '\b(insert|update|delete|merge|upsert|truncate|alter|drop|create|grant|revoke)\b' \
  /home/user/accent-os/skills/windward-bridge/references/windward-queries.md \
  | grep -v '^\s*--' \
  | grep -v '^>' \
  | grep -v '^#'
# Expected output: nothing.

# Audit Method B references for non-GET verbs
grep -iE '(POST|PUT|PATCH|DELETE)\b' \
  /home/user/accent-os/skills/windward-bridge/ -r \
  | grep -v 'never' | grep -v 'refuse' | grep -v 'no '
# Expected output: nothing.
```

If either grep returns anything that is not a comment / negation / policy reference, fail the change.

---

## Escalation path for write-attempt requests

If Michael or another skill author asks "can `windward-bridge` write [field] back to Windward?" the answer is one of:

1. **The change belongs in AccentOS, not Windward.** Build a Supabase table for the new field; surface it in AccentOS UI; leave Windward untouched. Most "write to Windward" requests collapse to this on inspection.
2. **The change belongs in Windward via Curtis.** Manual update by Curtis or whoever owns that data domain. AccentOS surfaces the request as a notification, never executes it.
3. **The change is a reconciliation artifact.** Build a `windward_overrides` table in Supabase that layers over the mirror without modifying it. Same query patterns return the override-merged value. Windward is unchanged.

There is no fourth option.

---

## What this skill does on a write-attempt

If any caller (skill or human) attempts to invoke `windward-bridge` with a parameter that implies a write (e.g. `pattern_key = 'update_customer_balance'`):

1. Refuse the call. Do not "soft-fail" — surface a hard error.
2. Print the policy summary:
   > Write attempts against Windward are a P0 bug. Read `skills/windward-bridge/references/read-only-policy.md`. The three legitimate paths for state changes are: (1) AccentOS-side Supabase, (2) manual Curtis update, (3) `windward_overrides` table.
3. Log the attempt to `efficiency-monitor`'s scratch file as a `skill-bypass` candidate so the pattern surfaces at session-end review.
4. Do NOT add the requested write capability to a "future enhancements" list. There is no such list.

This contract is non-negotiable and predates any individual call site.
