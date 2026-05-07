# Proposed Schema — klaviyo_flows cache tables
> Documented here per skill-forge briefing: skills do NOT write SQL migrations. When/if a future M-task lands these tables, klaviyo-flows starts caching automatically.

This file documents the Supabase `hsyjcrrazrzqngwkqsqa` schema additions needed to enable cross-run trends and proposal history for the `klaviyo-flows` skill on the Accent Lighting account. Until an M-task creates these tables, the skill runs stateless against the live Klaviyo REST API and silently skips the cache step.

**Do not write a SQL migration from the skill itself.** This is documentation only — the SQL author is a future M-task (likely numbered M42+ in `BUILD_PLAN_MICHAEL.md`).

---

## Tables

### `klaviyo_flows`
One row per live Klaviyo flow. Upserted on every Mode A run.

```sql
CREATE TABLE IF NOT EXISTS klaviyo_flows (
  flow_id          text PRIMARY KEY,
  name             text NOT NULL,
  status           text NOT NULL,           -- 'live' | 'draft' | 'archived' | 'manual'
  trigger_type     text,                    -- 'metric' | 'list' | 'date'
  trigger_metric   text,                    -- e.g. 'Started Checkout', 'Placed Order'
  created_at       timestamptz,             -- from Klaviyo
  updated_at       timestamptz,             -- from Klaviyo
  last_synced_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE klaviyo_flows ENABLE ROW LEVEL SECURITY;
-- RLS: allow read for all authenticated; allow upsert only for service_role (matches RLS pattern in M01)
```

### `klaviyo_flow_metrics`
Append-only per-day metric rows per flow. Time series for trend analysis.

```sql
CREATE TABLE IF NOT EXISTS klaviyo_flow_metrics (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id          text NOT NULL REFERENCES klaviyo_flows(flow_id),
  metric_date      date NOT NULL,
  recipients       integer NOT NULL DEFAULT 0,
  delivered        integer NOT NULL DEFAULT 0,
  opens_unique     integer NOT NULL DEFAULT 0,
  clicks_unique    integer NOT NULL DEFAULT 0,
  placed_order     integer NOT NULL DEFAULT 0,
  placed_order_value numeric(12,2) NOT NULL DEFAULT 0,
  unsubscribes     integer NOT NULL DEFAULT 0,
  pulled_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (flow_id, metric_date)
);
ALTER TABLE klaviyo_flow_metrics ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_klaviyo_flow_metrics_flow_date ON klaviyo_flow_metrics (flow_id, metric_date DESC);
```

### `klaviyo_flow_proposals`
One row per Mode B proposed edit. State machine: PROPOSED → APPROVED → APPLIED → REJECTED.

```sql
CREATE TABLE IF NOT EXISTS klaviyo_flow_proposals (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id          text NOT NULL REFERENCES klaviyo_flows(flow_id),
  edit_type        text NOT NULL,           -- 'subject' | 'segment' | 'send_time'
  message_id       text,                    -- Klaviyo message_id when edit_type='subject'
  current_value    text NOT NULL,
  proposed_value   text NOT NULL,
  rationale        text NOT NULL,
  spam_score_current  smallint,             -- 0–10, only for subject edits
  spam_score_proposed smallint,             -- 0–10, only for subject edits
  status           text NOT NULL DEFAULT 'PROPOSED',  -- PROPOSED | APPROVED | APPLIED | REJECTED
  proposed_at      timestamptz NOT NULL DEFAULT now(),
  approved_at      timestamptz,
  applied_at       timestamptz,
  rejected_at      timestamptz,
  applied_by       text                     -- user_profile.email when status=APPLIED
);
ALTER TABLE klaviyo_flow_proposals ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_klaviyo_flow_proposals_status ON klaviyo_flow_proposals (status, proposed_at DESC);
```

---

## Why these three tables

- `klaviyo_flows` — without this, every Mode A run re-pulls the flow list from Klaviyo (fine for a 20-flow account, but the source of truth for "which flows existed on date X" disappears).
- `klaviyo_flow_metrics` — append-only daily rollup enables trend lines (Mode A leaderboard becomes "this week vs last week"). Without it, every audit is a snapshot in time only.
- `klaviyo_flow_proposals` — the action-queue state machine for Mode B edits. Without it, proposals only live in `analysis-snapshot` files and lose linkage to apply timestamp.

---

## Unblock path

When/if Michael wants persistent cache:
1. Open `https://supabase.com/dashboard/project/hsyjcrrazrzqngwkqsqa/sql/new`.
2. Paste the three CREATE TABLE blocks above + RLS policies matching the M01 pattern.
3. Run.
4. Re-invoke `klaviyo-flows audit` — Step 4 of SKILL.md detects the tables and starts upserting automatically. No skill edits required.

Until then: skill runs in stateless mode, snapshots are the only audit trail. That's fine for the BLOCKED phase — once M09 lands the skill works; once the cache lands the skill works *better* (cross-run trends).
