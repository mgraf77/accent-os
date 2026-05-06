-- M30: Internal Meetings Module
-- Tables: meetings, meeting_prep_sections, meeting_notes, meeting_todos, meeting_followups
-- Run via Supabase SQL editor. Idempotent (CREATE TABLE IF NOT EXISTS).

-- Core meetings table
CREATE TABLE IF NOT EXISTS meetings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  meeting_date date,
  meeting_type text DEFAULT 'internal',  -- internal, investor, vendor, team, one_on_one
  attendees    jsonb DEFAULT '[]'::jsonb,
  status       text DEFAULT 'prep',      -- prep, active, complete, archived
  description  text,
  location     text,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- Prep sections per meeting (collapsible content blocks)
CREATE TABLE IF NOT EXISTS meeting_prep_sections (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id  uuid REFERENCES meetings(id) ON DELETE CASCADE,
  section_key text NOT NULL,
  title       text NOT NULL,
  content     text,
  sort_order  int DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (meeting_id, section_key)
);

-- Real-time notes captured during or after meeting
CREATE TABLE IF NOT EXISTS meeting_notes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id  uuid REFERENCES meetings(id) ON DELETE CASCADE,
  content     text NOT NULL,
  note_type   text DEFAULT 'note',  -- note, feedback, decision, action, question
  author      text,
  created_at  timestamptz DEFAULT now()
);

-- To-dos and delegated action items from meetings
CREATE TABLE IF NOT EXISTS meeting_todos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id  uuid REFERENCES meetings(id) ON DELETE CASCADE,
  task        text NOT NULL,
  assignee    text,
  due_date    date,
  status      text DEFAULT 'open',   -- open, in_progress, done, blocked
  priority    text DEFAULT 'normal', -- low, normal, high, critical
  notes       text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Follow-up items with owners and deadlines
CREATE TABLE IF NOT EXISTS meeting_followups (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id  uuid REFERENCES meetings(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  owner       text,
  due_date    date,
  status      text DEFAULT 'open',   -- open, in_progress, done
  priority    text DEFAULT 'normal',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- AI-imported transcripts per meeting
CREATE TABLE IF NOT EXISTS meeting_transcripts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id  uuid REFERENCES meetings(id) ON DELETE CASCADE,
  source      text DEFAULT 'manual', -- manual, otter, firefly, granola, plaud, other
  raw_text    text,
  parsed_json jsonb,  -- extracted: {summary, action_items[], decisions[], participants[]}
  created_at  timestamptz DEFAULT now()
);

-- RLS: authenticated users only
ALTER TABLE meetings               ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_prep_sections  ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_notes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_todos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_followups      ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_transcripts    ENABLE ROW LEVEL SECURITY;

-- Policies: full access for authenticated users
DO $$ BEGIN
  CREATE POLICY "auth_all_meetings"              ON meetings              FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_all_meeting_prep"          ON meeting_prep_sections FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_all_meeting_notes"         ON meeting_notes         FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_all_meeting_todos"         ON meeting_todos         FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_all_meeting_followups"     ON meeting_followups     FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_all_meeting_transcripts"   ON meeting_transcripts   FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
