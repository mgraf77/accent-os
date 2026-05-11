-- ────────────────────────────────────────────────────────────
-- M44 — Drop redundant + regressive SELECT policies
-- Run in Supabase SQL Editor — project hsyjcrrazrzqngwkqsqa
-- ────────────────────────────────────────────────────────────
--
-- Closes the last two multiple_permissive_policies advisor findings
-- AND fixes a real security regression on telemetry_events.

-- alerts: the broad "authed read" USING (true) already covers all
-- authenticated SELECTs, so the narrower "own reads alerts" is dead
-- weight under Postgres OR-permissive policy semantics.
DROP POLICY IF EXISTS "own reads alerts" ON public.alerts;

-- telemetry_events: the broad "authed read" USING (true) was a
-- regression — telemetry was designed owner-only readable. Drop the
-- over-broad policy to restore the intended posture. The narrower
-- "owner reads telemetry" remains.
DROP POLICY IF EXISTS "authed read" ON public.telemetry_events;
