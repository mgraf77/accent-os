-- M37 — survey_responses table (CSAT / NPS / eNPS)
-- Unblocks 3 KPIs: X4 (CSAT), X5 (NPS), H8 (eNPS)
--
-- Survey delivery is via external tool: Delighted, Typeform, Google Forms,
-- or BC's native review collection. This table stores the responses; the
-- delivery is a webhook/integration, not part of this schema.
--
-- DECISION POINT: pick a survey tool before going live. The schema is
-- tool-agnostic — webhook payload maps to these columns.

BEGIN;

CREATE TABLE IF NOT EXISTS survey_responses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What was surveyed
  survey_type     text CHECK (survey_type IN ('CSAT','NPS','eNPS','custom'))
                    NOT NULL,
  trigger_event   text,                          -- e.g. 'ticket_resolved', 'order_delivered', 'quarterly_pulse'

  -- Who responded
  customer_id     uuid REFERENCES customers(id),
  employee_id     uuid REFERENCES employees(id), -- for eNPS
  ticket_id       uuid REFERENCES service_tickets(id),
  deal_id         uuid REFERENCES pipeline_deals(id),

  -- The answer
  score           int CHECK (score BETWEEN 0 AND 10),  -- NPS scale; CSAT 1-5 stored as 1-5
  comment         text,
  promoter_class  text,                          -- 'promoter','passive','detractor' for NPS

  -- Source tool tracking
  source_tool     text CHECK (source_tool IN ('delighted','typeform','google-forms','bc-reviews','manual','other')),
  source_id       text,                          -- external survey response ID

  responded_at    timestamptz DEFAULT now(),
  metadata        jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_sr_survey_type ON survey_responses(survey_type);
CREATE INDEX IF NOT EXISTS idx_sr_customer_id ON survey_responses(customer_id);
CREATE INDEX IF NOT EXISTS idx_sr_responded_at ON survey_responses(responded_at DESC);
CREATE INDEX IF NOT EXISTS idx_sr_promoter_class ON survey_responses(promoter_class)
  WHERE promoter_class IS NOT NULL;

-- Trigger: classify NPS responses into promoter/passive/detractor
CREATE OR REPLACE FUNCTION classify_nps_response()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.survey_type = 'NPS' OR NEW.survey_type = 'eNPS' THEN
    NEW.promoter_class := CASE
      WHEN NEW.score >= 9 THEN 'promoter'
      WHEN NEW.score >= 7 THEN 'passive'
      ELSE 'detractor'
    END;
  END IF;
  RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS trg_classify_nps ON survey_responses;
CREATE TRIGGER trg_classify_nps
  BEFORE INSERT OR UPDATE OF score, survey_type ON survey_responses
  FOR EACH ROW EXECUTE FUNCTION classify_nps_response();

COMMIT;

-- Verify:
--   SELECT survey_type, AVG(score), COUNT(*) FROM survey_responses GROUP BY survey_type;
--   SELECT promoter_class, COUNT(*) FROM survey_responses
--     WHERE survey_type='NPS' AND responded_at > NOW() - INTERVAL '90 days'
--     GROUP BY promoter_class;
