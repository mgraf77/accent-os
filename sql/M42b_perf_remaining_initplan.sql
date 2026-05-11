-- ────────────────────────────────────────────────────────────
-- M42b — Remaining auth.uid() initplan wrappers
-- Run in Supabase SQL Editor — project hsyjcrrazrzqngwkqsqa
-- ────────────────────────────────────────────────────────────
--
-- Three INSERT policies that M42 missed because they live on
-- audit_log / telemetry_events / user_profiles and had bare
-- auth.uid() = user_id rather than the EXISTS pattern M42 swept.

DROP POLICY IF EXISTS "authed inserts audit" ON public.audit_log;
CREATE POLICY "authed inserts audit" ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "own inserts telemetry" ON public.telemetry_events;
CREATE POLICY "own inserts telemetry" ON public.telemetry_events
  FOR INSERT TO authenticated
  WITH CHECK (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "owner inserts profiles" ON public.user_profiles;
CREATE POLICY "owner inserts profiles" ON public.user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles user_profiles_1
                      WHERE user_profiles_1.user_id = (SELECT auth.uid())
                        AND user_profiles_1.role = 'Owner'::text));
