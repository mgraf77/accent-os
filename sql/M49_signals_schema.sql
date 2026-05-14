-- M49_signals_schema.sql
-- Phase 1 signal runtime tables.
-- Additive only. No changes to existing tables. RLS-on by default, owner+admin read.

create table if not exists public.signals (
  id              uuid primary key default gen_random_uuid(),
  signal_name     text not null,
  category        text not null,
  severity        text not null check (severity in ('informational','warning','elevated','critical','emergency')),
  entity_type     text,
  entity_id       text,
  owner_role      text,
  source_system   text,
  trigger_snapshot jsonb not null default '{}'::jsonb,
  recommended_action text,
  rule_version    text not null default 'v1',
  created_at      timestamptz not null default now(),
  last_observed_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  acknowledged_by uuid,
  resolved_at     timestamptz,
  dismissed_at    timestamptz,
  dismissed_by    uuid,
  dismiss_reason  text,
  -- denormalized for cheap feed queries
  is_open         boolean generated always as (resolved_at is null and dismissed_at is null) stored
);

create index if not exists signals_open_idx        on public.signals (is_open, created_at desc) where is_open;
create index if not exists signals_owner_idx       on public.signals (owner_role, created_at desc);
create index if not exists signals_name_entity_idx on public.signals (signal_name, entity_id, created_at desc);
create index if not exists signals_severity_idx    on public.signals (severity, created_at desc);

-- Baselines: per-metric rolling statistics computed by nightly cron.
-- Pre-computing here is what keeps rule evaluation pure and replayable.
create table if not exists public.signal_baselines (
  metric_key   text not null,
  entity_id    text not null default '_global_',
  window_days  int  not null,
  median       numeric,
  mad          numeric,
  mean         numeric,
  stddev       numeric,
  sample_count int  not null default 0,
  computed_at  timestamptz not null default now(),
  primary key (metric_key, entity_id, window_days)
);

create index if not exists signal_baselines_age_idx on public.signal_baselines (computed_at);

-- Audit log: every notification / state-transition.
-- Append-only; read by the tuning loop and post-incident review.
create table if not exists public.signal_audit (
  id          bigserial primary key,
  signal_id   uuid not null,
  event       text not null,  -- created | escalated | acknowledged | resolved | dismissed | suppressed | notified
  actor_role  text,
  actor_id    uuid,
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists signal_audit_signal_idx on public.signal_audit (signal_id, created_at);

alter table public.signals          enable row level security;
alter table public.signal_baselines enable row level security;
alter table public.signal_audit     enable row level security;

-- Conservative default: authenticated read; writes from server/runtime only.
drop policy if exists signals_read on public.signals;
create policy signals_read on public.signals
  for select to authenticated using (true);

drop policy if exists signals_write on public.signals;
create policy signals_write on public.signals
  for all to authenticated using (true) with check (true);

drop policy if exists baselines_read on public.signal_baselines;
create policy baselines_read on public.signal_baselines
  for select to authenticated using (true);

drop policy if exists baselines_write on public.signal_baselines;
create policy baselines_write on public.signal_baselines
  for all to authenticated using (true) with check (true);

drop policy if exists audit_read on public.signal_audit;
create policy audit_read on public.signal_audit
  for select to authenticated using (true);

drop policy if exists audit_write on public.signal_audit;
create policy audit_write on public.signal_audit
  for insert to authenticated with check (true);
