---
id: supabase-source
title: Source Summary — Supabase (AccentOS Primary DB)
type: source_summary
status: published
weight: 7
tags: [supabase, database, postgres, REST, RLS, auth, migrations, M-tasks, AccentOS, backend, integration, tables, schema, source-summary]
related: [adr-002-supabase-backend, adr-003-localstorage-personal, adr-005-append-only-observations, emp-owner]
created: 2026-05-06
updated: 2026-05-06
---

# Source Summary — Supabase (AccentOS Primary DB)

## What it is

Supabase is AccentOS's primary backend: managed Postgres database, PostgREST REST API, Supabase Auth, and Row Level Security. All shared business data lives here.

## Connection

All AccentOS JavaScript modules use the `sbFetch(table, method, body, headers)` helper. The Supabase URL and anon key are stored as `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `index.html` (or environment config). RLS policies enforce role-based access at the database layer.

## Core tables (shipped)

| table | purpose | migration |
|---|---|---|
| vendor_scores | numeric scores per vendor × category | M01 schema |
| vendor_overrides | tier overrides, notes, inactive flag | M01 |
| coop_tracker | co-op and rebate fund tracking | M01 |
| customers | customer CRM records | M02 |
| customer_interactions | interaction log per customer | M02 |
| quotes | quote headers | M02 |
| quote_lines | quote line items | M02 |
| pipeline_deals | sales pipeline deals | M02 |
| pipeline_events | stage change event log | M02 |
| probability_model_log | win/loss probability training data | M02 |
| employees | employee directory | M02 |
| employee_scores | employee scorecard data (append-only) | M02 |
| goals | OKR goal tree | M02 |
| kpi_definitions | KPI catalog | M02 |
| kpi_snapshots | KPI values over time (append-only) | M02 |
| alerts | intelligent alert queue | M02 |
| telemetry_events | UI telemetry (optional) | M02 |
| build_events | build tracking (optional) | M02 |
| inventory_items | warehouse inventory | M22 |
| purchase_orders | PO headers | M23 |
| po_lines | PO line items | M23 |
| trade_partners | designer/contractor network | M24 |
| warranty_claims | warranty claim tracking | M24 |
| showroom_displays | showroom display management | M25 |
| label_batches | QR label print batches | M26 |
| deliveries | delivery schedule + tracking | M27 |
| competitor_prices | competitive price observations (append-only) | M28 |
| marketing_campaigns | marketing campaigns | M29 |
| marketing_assets | marketing asset library | M29 |
| calendar_events | company calendar | M21 |
| articles | knowledge hub articles | M21 |
| jobs | job tracker | M21 |

## Schema migration process

Migrations live in `sql/M##_name.sql`. They are idempotent (safe to re-run). Michael runs them in the Supabase SQL editor — this is the M-task pattern (M01, M02, M03, etc.).

New tables require an M-task:
1. Claude writes the SQL file in `sql/`.
2. Michael runs it in Supabase.
3. Claude's JS modules activate (tables return data instead of 404).

## RLS pattern

Every table has three RLS tiers:
- **Read**: authenticated users with matching role(s)
- **Write**: senior roles (Owner / Admin / Manager) or all authenticated (for lower-stakes data)
- **Delete**: Owner / Admin only

The plpgsql DO block pattern (`DO $$ FOREACH table_name IN ARRAY [...] EXECUTE ... $$`) applies identical policies to groups of tables, reducing SQL file size.

## Gotchas

- `on_conflict` upsert requires the `Prefer: resolution=merge-duplicates` header — without it, POST on a conflicting unique key returns a 409 error.
- Supabase REST filters use `?column=eq.value` syntax, not SQL WHERE. Complex filters: `?and=(col1.eq.X,col2.gte.Y)`.
- RLS policies don't fire for the `service_role` key (admin bypass) — only `anon` and `authenticated` keys enforce RLS. AccentOS always uses `authenticated` for user sessions.
- Table-missing returns a 400 with `{"message":"relation \"public.tablename\" does not exist"}`. AccentOS modules check for this and log at INFO level (not WARN) — expected before the M-task is run.
