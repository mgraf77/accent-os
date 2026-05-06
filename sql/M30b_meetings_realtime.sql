-- M30b: Enable Supabase Realtime for collaborative meeting tables
-- Lets phone-imported transcripts (and notes/todos/followups) stream
-- to other connected devices via WebSocket — no refresh needed.
-- Idempotent. Run via Supabase SQL editor (or applied via MCP).

-- 1. Add the four tables to the supabase_realtime publication if not already present.
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'meeting_transcripts',
    'meeting_notes',
    'meeting_todos',
    'meeting_followups'
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

-- 2. REPLICA IDENTITY FULL so DELETE events carry the old row id.
--    Without this, the client can't know which row to remove from cache.
ALTER TABLE meeting_transcripts REPLICA IDENTITY FULL;
ALTER TABLE meeting_notes       REPLICA IDENTITY FULL;
ALTER TABLE meeting_todos       REPLICA IDENTITY FULL;
ALTER TABLE meeting_followups   REPLICA IDENTITY FULL;
