-- ────────────────────────────────────────────────────────────
-- M42 — Performance: wrap auth.uid() in subselect for RLS initplan
-- Run in Supabase SQL Editor — project hsyjcrrazrzqngwkqsqa
-- ────────────────────────────────────────────────────────────
--
-- Supabase performance advisor flagged 18 RLS policies that call
-- auth.uid() unwrapped. Postgres re-evaluates the function per row
-- in that form. Wrapping in (SELECT auth.uid()) lets the planner
-- treat it as an InitPlan (evaluated once per query).
--
-- Net behavior is unchanged — only execution plan changes.
-- Each policy is DROP+CREATE because Postgres has no ALTER POLICY
-- for the qual/with_check expressions. Whole file runs in one
-- transaction; any failure rolls back the entire set.

-- alerts ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "own reads alerts" ON public.alerts;
CREATE POLICY "own reads alerts" ON public.alerts
  FOR SELECT TO authenticated
  USING (((recipient_id = (SELECT auth.uid())) OR (recipient_id IS NULL)));

DROP POLICY IF EXISTS "own updates alerts" ON public.alerts;
CREATE POLICY "own updates alerts" ON public.alerts
  FOR UPDATE TO authenticated
  USING ((recipient_id = (SELECT auth.uid())))
  WITH CHECK ((recipient_id = (SELECT auth.uid())));

-- app_secrets ────────────────────────────────────────────────
DROP POLICY IF EXISTS "app_secrets_auth_owner_admin" ON public.app_secrets;
CREATE POLICY "app_secrets_auth_owner_admin" ON public.app_secrets
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles up
                 WHERE up.user_id = (SELECT auth.uid())
                   AND up.role = ANY (ARRAY['Owner'::text,'Admin'::text])))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles up
                      WHERE up.user_id = (SELECT auth.uid())
                        AND up.role = ANY (ARRAY['Owner'::text,'Admin'::text])));

-- audit_log ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "owner reads audit" ON public.audit_log;
CREATE POLICY "owner reads audit" ON public.audit_log
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles
                 WHERE user_profiles.user_id = (SELECT auth.uid())
                   AND user_profiles.role = 'Owner'::text));

-- build_events ───────────────────────────────────────────────
DROP POLICY IF EXISTS "owner writes" ON public.build_events;
CREATE POLICY "owner writes" ON public.build_events
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles
                 WHERE user_profiles.user_id = (SELECT auth.uid())
                   AND user_profiles.role = 'Owner'::text))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles
                      WHERE user_profiles.user_id = (SELECT auth.uid())
                        AND user_profiles.role = 'Owner'::text));

-- coop_tracker ───────────────────────────────────────────────
DROP POLICY IF EXISTS "manager+ writes" ON public.coop_tracker;
CREATE POLICY "manager+ writes" ON public.coop_tracker
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles
                 WHERE user_profiles.user_id = (SELECT auth.uid())
                   AND user_profiles.role = ANY (ARRAY['Owner'::text,'Admin'::text,'Manager'::text])))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles
                      WHERE user_profiles.user_id = (SELECT auth.uid())
                        AND user_profiles.role = ANY (ARRAY['Owner'::text,'Admin'::text,'Manager'::text])));

-- employee_scores ────────────────────────────────────────────
DROP POLICY IF EXISTS "owner writes" ON public.employee_scores;
CREATE POLICY "owner writes" ON public.employee_scores
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles
                 WHERE user_profiles.user_id = (SELECT auth.uid())
                   AND user_profiles.role = 'Owner'::text))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles
                      WHERE user_profiles.user_id = (SELECT auth.uid())
                        AND user_profiles.role = 'Owner'::text));

-- employees ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "owner writes" ON public.employees;
CREATE POLICY "owner writes" ON public.employees
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles
                 WHERE user_profiles.user_id = (SELECT auth.uid())
                   AND user_profiles.role = 'Owner'::text))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles
                      WHERE user_profiles.user_id = (SELECT auth.uid())
                        AND user_profiles.role = 'Owner'::text));

-- kpi_definitions ────────────────────────────────────────────
DROP POLICY IF EXISTS "owner writes" ON public.kpi_definitions;
CREATE POLICY "owner writes" ON public.kpi_definitions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles
                 WHERE user_profiles.user_id = (SELECT auth.uid())
                   AND user_profiles.role = 'Owner'::text))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles
                      WHERE user_profiles.user_id = (SELECT auth.uid())
                        AND user_profiles.role = 'Owner'::text));

-- parent_companies ───────────────────────────────────────────
DROP POLICY IF EXISTS "authed write" ON public.parent_companies;
CREATE POLICY "authed write" ON public.parent_companies
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles
                 WHERE user_profiles.user_id = (SELECT auth.uid())
                   AND user_profiles.role = ANY (ARRAY['Owner'::text,'Admin'::text,'Manager'::text])))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles
                      WHERE user_profiles.user_id = (SELECT auth.uid())
                        AND user_profiles.role = ANY (ARRAY['Owner'::text,'Admin'::text,'Manager'::text])));

-- probability_model_log ──────────────────────────────────────
DROP POLICY IF EXISTS "owner writes" ON public.probability_model_log;
CREATE POLICY "owner writes" ON public.probability_model_log
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles
                 WHERE user_profiles.user_id = (SELECT auth.uid())
                   AND user_profiles.role = 'Owner'::text))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles
                      WHERE user_profiles.user_id = (SELECT auth.uid())
                        AND user_profiles.role = 'Owner'::text));

-- telemetry_events ───────────────────────────────────────────
DROP POLICY IF EXISTS "owner reads telemetry" ON public.telemetry_events;
CREATE POLICY "owner reads telemetry" ON public.telemetry_events
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles
                 WHERE user_profiles.user_id = (SELECT auth.uid())
                   AND user_profiles.role = 'Owner'::text));

-- user_profiles ──────────────────────────────────────────────
DROP POLICY IF EXISTS "owner updates profiles" ON public.user_profiles;
CREATE POLICY "owner updates profiles" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles user_profiles_1
                 WHERE user_profiles_1.user_id = (SELECT auth.uid())
                   AND user_profiles_1.role = 'Owner'::text));

-- vendor_categories ──────────────────────────────────────────
DROP POLICY IF EXISTS "authed write" ON public.vendor_categories;
CREATE POLICY "authed write" ON public.vendor_categories
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles
                 WHERE user_profiles.user_id = (SELECT auth.uid())
                   AND user_profiles.role = ANY (ARRAY['Owner'::text,'Admin'::text,'Manager'::text])))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles
                      WHERE user_profiles.user_id = (SELECT auth.uid())
                        AND user_profiles.role = ANY (ARRAY['Owner'::text,'Admin'::text,'Manager'::text])));

-- vendor_overrides ───────────────────────────────────────────
DROP POLICY IF EXISTS "manager+ writes" ON public.vendor_overrides;
CREATE POLICY "manager+ writes" ON public.vendor_overrides
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles
                 WHERE user_profiles.user_id = (SELECT auth.uid())
                   AND user_profiles.role = ANY (ARRAY['Owner'::text,'Admin'::text,'Manager'::text])))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles
                      WHERE user_profiles.user_id = (SELECT auth.uid())
                        AND user_profiles.role = ANY (ARRAY['Owner'::text,'Admin'::text,'Manager'::text])));

-- vendor_parent_assignments ──────────────────────────────────
DROP POLICY IF EXISTS "authed write" ON public.vendor_parent_assignments;
CREATE POLICY "authed write" ON public.vendor_parent_assignments
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles
                 WHERE user_profiles.user_id = (SELECT auth.uid())
                   AND user_profiles.role = ANY (ARRAY['Owner'::text,'Admin'::text,'Manager'::text])))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles
                      WHERE user_profiles.user_id = (SELECT auth.uid())
                        AND user_profiles.role = ANY (ARRAY['Owner'::text,'Admin'::text,'Manager'::text])));

-- vendor_score_states ────────────────────────────────────────
DROP POLICY IF EXISTS "authed write" ON public.vendor_score_states;
CREATE POLICY "authed write" ON public.vendor_score_states
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles
                 WHERE user_profiles.user_id = (SELECT auth.uid())
                   AND user_profiles.role = ANY (ARRAY['Owner'::text,'Admin'::text,'Manager'::text])))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles
                      WHERE user_profiles.user_id = (SELECT auth.uid())
                        AND user_profiles.role = ANY (ARRAY['Owner'::text,'Admin'::text,'Manager'::text])));

-- vendor_scores ──────────────────────────────────────────────
DROP POLICY IF EXISTS "manager+ writes" ON public.vendor_scores;
CREATE POLICY "manager+ writes" ON public.vendor_scores
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles
                 WHERE user_profiles.user_id = (SELECT auth.uid())
                   AND user_profiles.role = ANY (ARRAY['Owner'::text,'Admin'::text,'Manager'::text])))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles
                      WHERE user_profiles.user_id = (SELECT auth.uid())
                        AND user_profiles.role = ANY (ARRAY['Owner'::text,'Admin'::text,'Manager'::text])));

-- Verify — should return zero rows once initplan rewrites are applied.
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual ~* 'auth\.uid\(\)' OR with_check ~* 'auth\.uid\(\)')
  AND (qual !~* '\(\s*select\s+auth\.uid' AND (with_check IS NULL OR with_check !~* '\(\s*select\s+auth\.uid'));
