-- M32 — pipeline_deals stage history + last_stage_change + change-tracking trigger
-- Unblocks 5 KPIs: L3 (lead→opportunity conversion), L4 (stage-to-stage),
--                  L5 (pipeline aging), L6 (win rate by stage), partial L7

BEGIN;

CREATE TABLE IF NOT EXISTS pipeline_deals_stage_history (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id     uuid NOT NULL REFERENCES pipeline_deals(id) ON DELETE CASCADE,
  from_stage  text,
  to_stage    text NOT NULL,
  changed_at  timestamptz DEFAULT now(),
  changed_by  uuid REFERENCES employees(id)
);

CREATE INDEX IF NOT EXISTS idx_pdsh_deal_id ON pipeline_deals_stage_history(deal_id);
CREATE INDEX IF NOT EXISTS idx_pdsh_changed_at ON pipeline_deals_stage_history(changed_at DESC);

ALTER TABLE pipeline_deals
  ADD COLUMN IF NOT EXISTS last_stage_change timestamptz DEFAULT now();

-- Trigger: write history row + bump last_stage_change on every stage update
CREATE OR REPLACE FUNCTION track_pipeline_deal_stage_change()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.stage IS DISTINCT FROM OLD.stage THEN
    INSERT INTO pipeline_deals_stage_history (deal_id, from_stage, to_stage, changed_by)
    VALUES (NEW.id, OLD.stage, NEW.stage, NEW.updated_by);
    NEW.last_stage_change := now();
  END IF;
  RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS trg_pipeline_deals_stage_change ON pipeline_deals;
CREATE TRIGGER trg_pipeline_deals_stage_change
  BEFORE UPDATE OF stage ON pipeline_deals
  FOR EACH ROW EXECUTE FUNCTION track_pipeline_deal_stage_change();

COMMIT;

-- Verify:
--   UPDATE pipeline_deals SET stage='qualified' WHERE id='<some-id>';
--   SELECT * FROM pipeline_deals_stage_history WHERE deal_id='<some-id>';
