-- ────────────────────────────────────────────────────────────
-- M41 — Performance: covering indexes for foreign keys
-- Run in Supabase SQL Editor — project hsyjcrrazrzqngwkqsqa
-- ────────────────────────────────────────────────────────────
--
-- Supabase performance advisor flagged 19 FK columns without
-- covering indexes. Without these, FK-targeted queries (parent
-- deletes, JOINs, RPC filters) do sequential scans. Each index
-- is small and safe; CREATE INDEX IF NOT EXISTS makes the file
-- idempotent.
--
-- Naming: ix_<table>_<column>. All B-tree.

CREATE INDEX IF NOT EXISTS ix_articles_author_id                ON public.articles(author_id);
CREATE INDEX IF NOT EXISTS ix_calendar_events_owner_id          ON public.calendar_events(owner_id);
CREATE INDEX IF NOT EXISTS ix_customer_interactions_user_id     ON public.customer_interactions(user_id);
CREATE INDEX IF NOT EXISTS ix_employee_scores_recorded_by       ON public.employee_scores(recorded_by);
CREATE INDEX IF NOT EXISTS ix_inventory_items_updated_by        ON public.inventory_items(updated_by);
CREATE INDEX IF NOT EXISTS ix_jobs_customer_id                  ON public.jobs(customer_id);
CREATE INDEX IF NOT EXISTS ix_jobs_related_deal_id              ON public.jobs(related_deal_id);
CREATE INDEX IF NOT EXISTS ix_jobs_related_quote_id             ON public.jobs(related_quote_id);
CREATE INDEX IF NOT EXISTS ix_meeting_followups_meeting_id      ON public.meeting_followups(meeting_id);
CREATE INDEX IF NOT EXISTS ix_meeting_notes_meeting_id          ON public.meeting_notes(meeting_id);
CREATE INDEX IF NOT EXISTS ix_meeting_todos_meeting_id          ON public.meeting_todos(meeting_id);
CREATE INDEX IF NOT EXISTS ix_meeting_transcripts_meeting_id    ON public.meeting_transcripts(meeting_id);
CREATE INDEX IF NOT EXISTS ix_pipeline_deals_customer_id        ON public.pipeline_deals(customer_id);
CREATE INDEX IF NOT EXISTS ix_pipeline_deals_quote_id           ON public.pipeline_deals(quote_id);
CREATE INDEX IF NOT EXISTS ix_pipeline_events_user_id           ON public.pipeline_events(user_id);
CREATE INDEX IF NOT EXISTS ix_purchase_orders_created_by        ON public.purchase_orders(created_by);
CREATE INDEX IF NOT EXISTS ix_purchase_orders_related_job_id    ON public.purchase_orders(related_job_id);
CREATE INDEX IF NOT EXISTS ix_purchase_orders_related_quote_id  ON public.purchase_orders(related_quote_id);
CREATE INDEX IF NOT EXISTS ix_quotes_created_by                 ON public.quotes(created_by);

-- Verify — should return 19 rows with the new ix_ names.
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE indexname LIKE 'ix_%'
  AND schemaname = 'public'
ORDER BY tablename, indexname;
