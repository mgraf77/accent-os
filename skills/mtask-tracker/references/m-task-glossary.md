# M-Task Glossary — Canonical ID → Title Map

> One-line purpose: Mirror of BUILD_PLAN_MICHAEL.md M-task identifiers, used by `mtask-tracker` Step 2 when the live build plan is mid-edit or unparseable. Source of truth is BUILD_PLAN_MICHAEL.md — this file is regenerable from it.

## How this is used

`mtask-tracker` Step 2 cross-references each BLOCKED skill's cited M-task IDs against BUILD_PLAN_MICHAEL.md to extract title + status. If the live build plan is missing or has a parse error, the skill falls back to this glossary to surface human-readable titles in BLOCK 2 of the output.

This file is regenerated whenever a new M-task lands. To regenerate: `grep -E "^- \[[ x]\] \*\*M[0-9]{2}\*\*" /home/user/accent-os/BUILD_PLAN_MICHAEL.md` and refresh the table below.

## Canonical M-task table (last refresh: 2026-05-08)

| M-task | Title | Category | Skills currently gated by it |
|---|---|---|---|
| **M01** | Tighten RLS on existing vendor_* tables | RLS / Security | trade-vendor-portal (resolved 2026-05-04) |
| **M02** | Run §0.4 Core Database Schema (consolidated CREATE TABLE block) | Schema | (resolved) |
| **M03** | Get written confirmation from Windward rep that S5WebAPI is read-only and included in the existing license | External — vendor confirmation | windward-bridge, trade-vendor-portal |
| **M04** | BigCommerce API credentials | External — credential | bc-rest-bridge, trade-vendor-portal |
| **M05** | Google Merchant Center API access | External — credential | (gmc-feed-audit live mode — soft) |
| **M06** | Google Analytics 4 + Search Console service account | External — credential | ga4-insights, gsc-insights |
| **M07** | Customers module: scoping LOCKED 2026-05-04 | Scoping | (resolved) |
| **M08** | Employees module: scoping LOCKED 2026-05-04 | Scoping | (resolved) |
| **M09** | Klaviyo API key | External — credential | klaviyo-flows, trade-vendor-portal (soft) |
| **M10** | Curtis outreach (Windward integration approval) | External — vendor approval; depends on M03 | windward-bridge, trade-vendor-portal |
| **M11** | Fix Supabase MCP permissions | Internal — permissions | trade-vendor-portal |
| **M12** | Rotate shared `accentos` password | Security hygiene | trade-vendor-portal (soft) |
| **M13** | Add Sales / Warehouse users when those people onboard | User provisioning | (none currently) |
| **M14** | Resolve GMC missing images (20K+ products) | Product data | (gmc-feed-audit live signal) |
| **M15** | Eugene's CSV for meta description bulk update | Content delivery | (bulk-meta-description live signal) |
| **M16** | 4 GMC URLs still pending re-index (P053-077 batch) | GMC re-index | (none currently) |
| **M17** | Feedenomics "new products only" rule | Feed configuration | (none currently) |
| **M18** | Website redesign: owner approval to go to production | Branding gate | trade-vendor-portal (soft) |
| **M19** | 257 vendors with no rep group assigned | Data cleanup | (rep-group-matchmaker workflow) |
| **M20** | 8 rep companies need call lists (no email on file) | Data enrichment | (rep outreach workflow) |
| **M21** | Run Phase 3 schema (Calendar + Knowledge Hub + Job Tracker) | Schema | (resolved) |
| **M22** | Run Inventory schema (Track 5.3 phase 1) | Schema | (resolved) |
| **M23** | Run Purchase Orders schema (Track 5.4) | Schema | (resolved) |
| **M24** | Run Trade Partner + Warranty schema (Tracks 5.5 + 5.11) | Schema | trade-vendor-portal |
| **M25** | Run Showroom Display schema (Track 5.8) | Schema | (none currently) |
| **M26** | Run Label Batches schema (Track 5.9 — optional) | Schema | (none currently) |
| **M27** | Run Deliveries schema (Track 5.10) | Schema | (none currently) |
| **M28** | Run Competitive Pricing schema (Track 5.14) | Schema | (none currently) |
| **M29** | Run Marketing Hub schema (Track 5.12) | Schema | (none currently) |
| **M30** | Add `customers.segment` enum (HIGHEST LEVERAGE: 22 KPIs) | Schema — KPI | (kpi-data-audit signal) |
| **M31** | Decide products source-of-truth + add cost column | Schema — KPI; depends on M04 | (kpi-data-audit signal) |
| **M32** | Run `pipeline_deals_stage_history` schema | Schema — KPI | (kpi-data-audit signal) |
| **M33** | Run `pipeline_deals.lost_reason` enum | Schema — KPI | (kpi-data-audit signal) |
| **M34** | Decide invoices/payments source + run mirror schema | Schema — KPI; depends on M03/M10/M11 if Windward path | (kpi-data-audit signal) |
| **M35** | Run `employees.quota + hire_date + terminated_at` | Schema — KPI | (kpi-data-audit signal) |
| **M36** | Run `service_tickets` schema | Schema — KPI | (kpi-data-audit signal) |
| **M37** | Pick survey tool + run `survey_responses` schema | Schema — KPI | (kpi-data-audit signal) |
| **M38** | Run `recurring_contracts` schema | Schema — KPI | (kpi-data-audit signal) |
| **M39** | Verify/extend `vendors` table | Schema — KPI | (vendor-cascade enrichment signal) |
| **M40** | Run `user_module_overrides` schema (cross-device per-user gating) | Schema | trade-vendor-portal |
| **M41** | Install OpenAI API key into Claude Code settings | External — credential | (codex-review live mode) |
| **M42** | Run `action_queue` schema | Schema | action-queue (and downstream executor skills) |
| **M43** | Add 3 co-op rule columns to `vendor_overrides` | Schema | coop-claim-drafter (active mode) |
| **M44** | Run Klaviyo flow cache schema | Schema | klaviyo-flows (persistent mode) |
| **M45** | Run `rfm_scores` cache schema | Schema | churn-predictor (perf boost — optional) |

## Schema-task virtual M-tasks

When BUILD_PLAN_MICHAEL.md does not assign a numbered M-task to a schema gate (e.g. action-queue's gate predates M42 being assigned), the skill emits a virtual ID:

| Virtual ID | Maps to | Skill that uses it |
|---|---|---|
| `SCHEMA:action_queue` | M42 (per BUILD_PLAN_MICHAEL.md L449) | action-queue |
| `SCHEMA:rfm_scores` | M45 (per BUILD_PLAN_MICHAEL.md L481) | churn-predictor (optional) |
| `SCHEMA:klaviyo_flow_cache` | M44 (per BUILD_PLAN_MICHAEL.md L470) | klaviyo-flows (persistent mode) |
| `SCHEMA:vendor_overrides_coop` | M43 (per BUILD_PLAN_MICHAEL.md L460) | coop-claim-drafter (active mode) |

## Status legend

- `[x]` — done, M-task confirmed via paste-to-Claude phrase + status block
- `[ ]` — open, gating one or more skills
- `(resolved)` — done before mtask-tracker shipped; included for completeness
- `(none currently)` — open M-task that does not gate any skill in `skills/`

## Hard vs. soft blocker rules

A skill's Step 0 gate decides hard vs. soft. The mtask-tracker Step 1 reads the gate text:

- **Hard blocker** — the skill returns the BLOCKED stub if this M-task is `[ ]`. Default for any M-task cited in `BLOCKED on M[NN]` or `gated on **M[NN]**`.
- **Soft blocker** — the skill mentions the M-task but proceeds without it. Pattern: trade-vendor-portal lists M09/M12/M18 as "noted but does not block."

When `references/blocking-m-tasks.md` exists in a skill's directory (canonical for trade-vendor-portal), prefer its hard/soft classification over inferring from Step 0 text.

## Refresh procedure

Run when BUILD_PLAN_MICHAEL.md is meaningfully edited (new M-task added, an M-task title changed, or a `[ ]` flips to `[x]`):

```
grep -E "^- \[[ x]\] \*\*M[0-9]{2}\*\*" /home/user/accent-os/BUILD_PLAN_MICHAEL.md
```

Pipe through a manual diff vs. the table above; update the changed rows. The table is human-curated for the "Skills currently gated by it" column (which requires reading each skill's Step 0). The other columns are mechanical from the build plan.
