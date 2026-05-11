-- ────────────────────────────────────────────────────────────
-- M43 — Performance: split FOR ALL write policies into INSERT/UPDATE/DELETE
-- Run in Supabase SQL Editor — project hsyjcrrazrzqngwkqsqa
-- ────────────────────────────────────────────────────────────
--
-- Supabase performance advisor flagged ~28 multiple_permissive_policies
-- warnings caused by tables having BOTH a "authed read" (FOR SELECT)
-- policy AND a write policy declared FOR ALL. The FOR ALL policy
-- implicitly includes SELECT, so Postgres evaluates both on every read.
--
-- Fix: for each affected table, drop the FOR ALL policy and replace
-- with three policies — one each for INSERT, UPDATE, DELETE — using
-- the original qual/with_check expressions verbatim. Net behavior
-- identical; advisor stops complaining; reads only evaluate the
-- single "authed read" policy.
--
-- This DO block is data-driven: it picks up any FOR ALL policy whose
-- table has a separate FOR SELECT sibling, so it's safe to re-run
-- and self-adjusts to schema growth.

DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT p.tablename, p.policyname, p.qual, p.with_check
    FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.cmd = 'ALL'
      AND EXISTS (
        SELECT 1 FROM pg_policies q
        WHERE q.schemaname = 'public'
          AND q.tablename = p.tablename
          AND q.cmd = 'SELECT'
          AND q.policyname != p.policyname
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', rec.policyname, rec.tablename);

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (%s)',
      rec.policyname || ' ins', rec.tablename, rec.with_check
    );

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (%s) WITH CHECK (%s)',
      rec.policyname || ' upd', rec.tablename, rec.qual, rec.with_check
    );

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (%s)',
      rec.policyname || ' del', rec.tablename, rec.qual
    );
  END LOOP;
END $$;
