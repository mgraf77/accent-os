# Session 46 — Signal Runtime RLS Repair

**Status:** ✅ Fix applied to live Supabase + persisted in repo. Awaiting browser re-run.
**Date (UTC):** 2026-05-16T19:11:29Z
**Branch:** `claude/prove-ui-runtime-m49-jTw1O`
**Pre-fix commit:** `9ba8545` (Session 43 report)
**DB project:** `hsyjcrrazrzqngwkqsqa` (accent-lighting-engine, us-east-2)

## 1. Root cause

M49's RLS policies on `signal_queue`, `signal_effect_log`, and
`signal_dead_letter` were written as:

```sql
EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('Owner','Admin'))
```

`user_profiles` has **no `id` column**. Its PK is `user_id` (verified live via
`information_schema.columns`). When the subquery referenced an unqualified
`id`, Postgres' name-resolution rules bound it to the **only** `id` in scope:
the *outer* table's PK (`signal_effect_log.id`, `signal_queue.id`,
`signal_dead_letter.id`). The deployed `pg_policies.qual` confirmed this:

```sql
EXISTS (SELECT 1 FROM user_profiles
  WHERE signal_effect_log.id = auth.uid()
    AND user_profiles.role = ANY (ARRAY['Owner','Admin']))
```

Because the outer row's `id` is `gen_random_uuid()`, it can never equal
`auth.uid()`. The `WITH CHECK` clause therefore evaluated to `false` on every
INSERT from a user JWT → PostgREST returned **403 Forbidden**.

## 2. Why queue RPCs succeeded but direct POST failed

- `sig_enqueue`, `sig_claim`, `sig_finalize`, `sig_retry`, `sig_dead_letter`,
  `sig_dead_letter_unknown`, `sig_metrics` are all declared
  **`SECURITY DEFINER`** in M49.
- The three signal tables have RLS enabled but **not** `FORCE ROW LEVEL
  SECURITY` (verified: `pg_class.relforcerowsecurity = false`).
- Per Postgres rules, `SECURITY DEFINER` functions execute as the function
  owner, and the owner role bypasses RLS on tables that don't have
  `FORCE`. So all queue mutations issued through the RPCs slipped past the
  broken policy.
- The only path that ran under the live user JWT was
  `js/signals_runtime.js:127` (`_claimEffect`) which does a direct
  `POST /rest/v1/signal_effect_log`. That hit the broken policy and got 403.

This explains the exact symptom report: "queue runtime passed" /
"replay+idempotency passed" / "claim+dispatch+finalize fails" /
"retry→dead-letter fails" (both failing paths go through `_claimEffect`).

## 3. Exact fix applied

Live DB (via Supabase MCP `apply_migration` name `m51_signal_rls_fix`):

- Dropped: `signal_queue_rw`, `signal_effect_log_rw`, `signal_dead_letter_rw`.
- Recreated all three with fully-qualified column reference:

  ```sql
  EXISTS (SELECT 1 FROM user_profiles up
           WHERE up.user_id = auth.uid()
             AND up.role IN ('Owner','Admin'))
  ```

Same Owner/Admin gate. Same `authenticated` role grant. No widening, no
new principals, no change to grants (table grants were already fully
permissive — issue was purely the policy expression).

Verified post-state in `pg_policies` — all three policies now show
`up.user_id = auth.uid()`.

## 4. Negative + positive proof (executed live)

| Test | Principal simulated via `set_config('request.jwt.claims',...)` | Expected | Result |
| --- | --- | --- | --- |
| INSERT `signal_effect_log` as Owner uid | Owner JWT | allowed | ✅ INSERT returned id, row deleted in same tx — no residue |
| INSERT `signal_effect_log` as `anon` | role=anon, no sub | denied (RLS) | ✅ caught `insufficient_privilege OR check_violation` |
| INSERT `signal_effect_log` as auth user with no profile | role=authenticated, sub=`00000000-…` | denied (RLS) | ✅ caught `insufficient_privilege OR check_violation` |

Source of truth: two `DO $$ ... $$` blocks executed via Supabase MCP
`execute_sql`. Neither raised the explicit "SECURITY REGRESSION" `RAISE`
that the blocks would have fired on a permissive failure.

## 5. Repo changes

| File | Change |
| --- | --- |
| `sql/M51_signal_rls_fix.sql` | New — canonical migration for the repair, idempotent, drops + recreates the 3 policies. |
| `sql/M49_signal_runtime_schema.sql` | In-place edit of the policy block: same shape, now uses `up.user_id = auth.uid()` + a comment pointing at M51 explaining the original bug. Re-running M49 will no longer reintroduce the bug. |
| `docs/runtime/SESSION_46_RUNTIME_AUTH_REPAIR.md` | This report. |

No code changes to `js/signals_runtime.js`, `js/signals_producers.js`,
`js/signals_panel.js`, `js/signals_runtime.test.js`, or `index.html`. The
runtime contract is unchanged.

## 6. Re-run instructions (browser; agent cannot execute)

Same authenticated context Michael used in Session 45 (Owner login on
`https://accent-os.pages.dev`). In DevTools console:

```js
// (Re)load the test bundle — it is not shipped in index.html
await fetch('js/signals_runtime.test.js').then(r=>r.text()).then(t => (0,eval)(t));

// Capture pre-state
const before = await window.SIGNALS.metrics();
console.log('before', before.snapshot);

// Run the full suite
const results = await SIGNALS_TESTS.runAll();
console.table(results);   // expect 5/5 ok:true

// Post-state
const after = await window.SIGNALS.metrics();
console.log('after',  after.snapshot);
```

Expected after the fix:

| Test | Expected |
| --- | --- |
| enqueue+dedup | PASS (unchanged — already passing) |
| unknown→dead-letter | PASS (unchanged — already passing) |
| claim+dispatch+finalize | **PASS** (was 403 → now 200/204) |
| retry→dead-letter | **PASS** (was 403 → now 200/204) |
| metrics surface | PASS (unchanged) |

If any test still 403s on `/signal_effect_log` the JWT did not refresh —
**sign out and back in once** to pick up a clean session, then re-run.

## 7. Security implications

- **No widening.** Authorization gate is unchanged (Owner/Admin only).
  Grants on the table were already fully permissive (anon and
  authenticated have full DML), but the policies (which now actually
  evaluate correctly) are what gate access — confirmed live for anon and
  unprofiled-auth deny paths.
- **`SECURITY DEFINER` queue RPCs are unchanged.** They have always
  bypassed RLS via the owner role; the M49 design assumed that. This
  fix re-aligns the direct-table path with the same intent, not the
  function path.
- **Replay safety preserved.** The unique index
  `(idempotency_key, effect_type)` on `signal_effect_log` is untouched.
  `_claimEffect` still raises and translates `23505` → inert replay.
- **Deterministic behavior preserved.** Worker loop, claim/lease,
  backoff math, dead-letter routing all unchanged.

## 8. Remaining risks / blockers

1. **M47 (BigCommerce schema) carries the identical bug** — six policies
   in `sql/M47_bigcommerce_schema.sql:122-157` use the same
   `id = auth.uid()` pattern against `user_profiles`. **Out of scope for
   this session** per mission constraints ("DO NOT widen scope / touch
   unrelated tables / fix deliveries/KPI/module issues"). Recommend a
   focused follow-up session to audit and repair M47 the same way, plus
   any other table whose owner role has been bypassing RLS via
   `SECURITY DEFINER` paths and therefore never surfaced the bug. A
   one-liner audit query:

   ```sql
   SELECT tablename, policyname, qual FROM pg_policies
   WHERE schemaname='public'
     AND (qual LIKE '%user_profiles%' OR with_check LIKE '%user_profiles%')
     AND qual NOT LIKE '%user_profiles.user_id%';
   ```

2. **Browser re-run not executed from this agent.** This session is in
   the remote sandbox with no browser; Michael runs §6 in a real
   authenticated tab to confirm 5/5 green. See Session 43 report for the
   same blocker rationale.

3. **`js/signals_runtime.test.js` is still not loaded by `index.html`.**
   By design — it's a test bundle, not production code. The §6 snippet
   uses `fetch + eval` to load it on demand.

## 9. Clean pause

- **Branch:** `claude/prove-ui-runtime-m49-jTw1O`
- **Commit (pre-fix):** `9ba8545`
- **Repo changes pending commit:** `sql/M51_signal_rls_fix.sql` (new),
  `sql/M49_signal_runtime_schema.sql` (in-place comment + qualifier),
  this report.
- **DB changes (already live):** migration `m51_signal_rls_fix` applied.
  3 RLS policies dropped+recreated on the 3 signal tables. No data
  rows added/changed.
- **Runtime status:** unblocked at the DB layer; pending live browser
  re-run to confirm `SIGNALS_TESTS.runAll() === 5/5 PASS`.
- **Remaining blockers:** §8.2 above (browser re-run only).

## 10. Next safest move

Michael runs §6 in an authenticated Owner tab and pastes the
`console.table(results)` output into this file. If 5/5 green:
- mark M49 + M50 runtime proven end-to-end;
- open a fresh, narrowly scoped session to audit M47's identical bug
  using the §8.1 query.
