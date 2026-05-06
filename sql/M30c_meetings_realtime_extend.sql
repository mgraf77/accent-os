-- M30c: Extend Supabase Realtime to the meetings list and prep sections
-- Lets new/updated meetings appear on other devices without refresh, and
-- enables collaborative editing of prep sections during owner reviews.
-- Idempotent. Builds on M30b.

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'meetings',
    'meeting_prep_sections'
  ]) LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname='supabase_realtime'
        AND schemaname='public'
        AND tablename=t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END$$;

-- DELETE events need the old row id, which requires REPLICA IDENTITY FULL.
ALTER TABLE meetings              REPLICA IDENTITY FULL;
ALTER TABLE meeting_prep_sections REPLICA IDENTITY FULL;
