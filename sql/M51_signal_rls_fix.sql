-- M51 — Signal runtime RLS repair (Session 46)
--
-- Root cause:
--   M49 policies used unqualified `id = auth.uid()` inside the EXISTS
--   subquery against user_profiles. user_profiles has NO `id` column
--   (its PK is `user_id`), so Postgres bound the unqualified `id` to
--   the OUTER table's `id` (e.g. signal_effect_log.id), producing
--   `signal_effect_log.id = auth.uid()`, which is never true because
--   the outer row's id is gen_random_uuid(). Every INSERT/UPDATE
--   from a user JWT failed WITH CHECK → 403 from PostgREST.
--
--   Queue ops still worked because sig_enqueue / sig_claim /
--   sig_finalize / sig_retry / sig_dead_letter are SECURITY DEFINER,
--   and the tables do NOT have FORCE ROW LEVEL SECURITY, so the
--   function owner role bypasses RLS inside the function body.
--   Only the direct POST to /signal_effect_log (from _claimEffect
--   in js/signals_runtime.js) ran under the user JWT and hit the
--   broken policy.
--
-- Fix:
--   Replace the three policies with the correct, fully-qualified column
--   reference `user_profiles.user_id = auth.uid()`. Same Owner/Admin
--   gate, no widening, same set of authenticated principals.
--
-- Idempotent. Safe to re-run.
-- After applying: tell Claude "M51 done — signal RLS repaired."

DROP POLICY IF EXISTS "signal_queue_rw"       ON signal_queue;
DROP POLICY IF EXISTS "signal_effect_log_rw"  ON signal_effect_log;
DROP POLICY IF EXISTS "signal_dead_letter_rw" ON signal_dead_letter;

CREATE POLICY "signal_queue_rw" ON signal_queue
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles up
             WHERE up.user_id = auth.uid()
               AND up.role IN ('Owner','Admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles up
             WHERE up.user_id = auth.uid()
               AND up.role IN ('Owner','Admin'))
  );

CREATE POLICY "signal_effect_log_rw" ON signal_effect_log
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles up
             WHERE up.user_id = auth.uid()
               AND up.role IN ('Owner','Admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles up
             WHERE up.user_id = auth.uid()
               AND up.role IN ('Owner','Admin'))
  );

CREATE POLICY "signal_dead_letter_rw" ON signal_dead_letter
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles up
             WHERE up.user_id = auth.uid()
               AND up.role IN ('Owner','Admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles up
             WHERE up.user_id = auth.uid()
               AND up.role IN ('Owner','Admin'))
  );
