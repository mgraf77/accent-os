# BUILD_PLAN_CLAUDE.md — Autonomous Build Queue

> **Rules of engagement.**
> 1. Work this list **top to bottom**. Do not skip ahead arbitrarily.
> 2. Mark `[x]` the moment an item is shipped (committed + pushed).
> 3. Never stop and wait unless the item has an unresolved `BLOCKS ON MICHAEL: M##`. If blocked, **skip to the next unblocked `[ ]` item** — do not idle.
> 4. After each ship, append a SESSION_LOG.md entry. Update MASTER.md §3 if module status flipped.
> 5. Keep commits scoped per item. Use semver-ish: `vX.Y.Z` for code, `docs:` for doc-only.
> 6. If an item is too large for a single session, split into Chunks (A/B/C) inline and check off each chunk.

---

## TRACK 0 — Infrastructure

- [x] **0.1** — File architecture split
  - What: split monolithic index.html into shell + 4 module files (vendor / pipeline / knowledge / marketing)
  - Blocks: nothing immediate (already done)

- [x] **0.2.A** — Auth Chunk A: Supabase Auth + role-based sidebar
  - What: replace hardcoded auto-login with Supabase Auth (REST), 5-role system, JWT session, `data-roles` sidebar gating, audit_log writes for login/logout/session_resume/score_save
  - Blocks: 0.2.B, 0.2.C, all RLS-tightening work

- [ ] **0.2.B** — Auth Chunk B: Settings → Users panel
  - What: owner-only Users section in Settings — list user_profiles, role dropdown, save → updates user_profiles + audit_log; "Invite user" button drafts an email scaffold (Owner sends invite from Supabase dashboard manually; UI just stages the request)
  - Blocks: ability to add Sales / Warehouse staff without Claude rewriting SQL each time

- [ ] **0.2.C** — Auth Chunk C: tighten RLS on vendor_* tables
  - What: replace `TO anon` policies on `vendor_categories`, `vendor_score_states`, `vendor_changelog`, `vendor_parent_assignments`, `parent_companies` with `TO authenticated` (read for all authed; write requires non-Sales/Warehouse for vendor data)
  - What Claude does: write the SQL block; hand to BUILD_PLAN_MICHAEL.md
  - Blocks: production hardening of existing data
  - BLOCKS ON MICHAEL: **M01** (paste SQL)

- [ ] **0.4** — Core database schema
  - What: produce a single consolidated SQL block creating every table needed by tracks 1–4 (`vendor_scores`, `vendor_overrides`, `coop_tracker`, `customers`, `customer_interactions`, `quotes`, `quote_lines`, `pipeline_deals`, `pipeline_events`, `employees`, `employee_scores`, `goals`, `kpi_definitions`, `kpi_snapshots`, `alerts`, `telemetry_events`, `build_events`, `probability_model_log`)
  - What Claude does: write all CREATE TABLE / RLS / index SQL; hand to BUILD_PLAN_MICHAEL.md
  - Blocks: Tracks 1, 2, 3, 4 persistence work
  - BLOCKS ON MICHAEL: **M02** (paste SQL)

---

## TRACK 1 — Highest Immediate Business Impact

- [ ] **1.1** — Vendor numeric score persistence (full)
  - What: `vendor_scores` table wiring — every numeric score write goes to Supabase. Currently only `data_state` persists via `vendor_score_states`; the score values themselves live only in VD_RAW
  - Blocks: real outreach data integrity, score history
  - BLOCKS ON MICHAEL: **M02** (vendor_scores table needs to be in the §0.4 SQL block first)

- [ ] **1.2** — Quote Generator — Persistence + Save/Retrieve
  - What: build `quotes` + `quote_lines` schema; UI: Save / List / Re-open; PDF/email export; tag to customer + project
  - Value: $22.8K/yr per MASTER §5
  - Blocks: 1.4 CRM (quotes are evidence of customer activity)
  - BLOCKS ON MICHAEL: **M02**

- [ ] **1.3** — Daily Command Center
  - What: top-of-app daily brief per role — what needs attention today (open quotes >7d, unverified vendor scores, pending outreach, deal followups). Auto-generates from existing data
  - Blocks: daily adoption / habit formation; Agentic Level 3 (proactive alerts)
  - BLOCKS ON MICHAEL: nothing immediate (uses existing tables)

- [ ] **1.4** — CRM & Customer Intelligence
  - What: `customers` + `customer_interactions` tables, customer profile UI, RFM scoring, lifecycle tagging, basic timeline view
  - Value: $19.2K/yr per MASTER §5
  - Blocks: 1.5 Pipeline (deals attach to customers), 4.1 Owner Dashboard
  - BLOCKS ON MICHAEL: **M02** AND **M07** (decision: manual entry vs. Windward CSV import)

- [ ] **1.5** — Sales Pipeline — Persistent + Loss Tracking
  - What: `pipeline_deals` + `pipeline_events` schema; replace static stages with 8-factor dynamic probability model (lead source, customer history, segment, project type, quote age vs. baseline, comm recency, quote size, win/loss feedback); `probability_model_log` for recalibration history
  - Blocks: 4.1 Owner Dashboard pipeline view
  - BLOCKS ON MICHAEL: **M02**

---

## TRACK 2 — Vendor Intelligence (Foundation Completion)

- [ ] **2.1** — Parent Company / Brand Family Grouping UI
  - What: filter + group-by-parent in Vendor Ranking tab; collapse/expand parent rows; rolled-up sales + avg weighted score; sister-brand badge on vendor detail
  - Note: data already imported (130 vendors mapped); only UI missing
  - Blocks: nothing immediate (cosmetic, but listed in priority queue)
  - BLOCKS ON MICHAEL: nothing

- [ ] **2.2** — Vendor Metadata, Notes & Override Persistence
  - What: `vendor_overrides` table for editable fields (notes, custom rep group, tier override, inactive flag) — currently lives only in VD_RAW
  - Blocks: durable vendor edits across sessions
  - BLOCKS ON MICHAEL: **M02**

- [ ] **2.3** — Rebate & Co-Op Fund Tracker
  - What: `coop_tracker` table; UI to log fund availability, deadlines, claim status per vendor; alerts when deadline <30d
  - Note: HIGH priority — Money Left flag in MASTER §5
  - Blocks: 4.1 Owner Dashboard money-left widget
  - BLOCKS ON MICHAEL: **M02**

---

## TRACK 3 — Employee Intelligence

- [ ] **3.1** — Employee Scorecards
  - What: `employees` + `employee_scores` schema; scorecard UI per employee
  - BLOCKS ON MICHAEL: **M07** AND **M08** (two scoping decisions: admin-only visibility? manual entry vs Windward CSV?)

- [ ] **3.2** — Role-Based Dashboards
  - What: per-role landing pages for the 6 role types beyond the 5 auth roles (Owner / Manager / Sales / Warehouse / Admin / + the variant in Phase 2B doc); Owner + Sales already spec'd
  - Blocks: full personalization of daily experience
  - BLOCKS ON MICHAEL: nothing immediate

---

## TRACK 4 — Owner Intelligence & Strategy

- [ ] **4.1** — Owner Dashboard
  - What: revenue · pipeline · team activity · goal progress · ecommerce snapshot — single-page Owner-only view
  - Blocks: nothing immediate (assembles existing data)
  - BLOCKS ON MICHAEL: nothing (depends on 1.4 + 1.5 + 2.3 being shipped)

- [ ] **4.2** — KPI Master Registry
  - What: `kpi_definitions` + `kpi_snapshots` schema; per-role KPI catalog (Financial, Sales, Ecommerce, Customer Intelligence); daily snapshot job
  - BLOCKS ON MICHAEL: **M02**

- [ ] **4.3** — Goal Architecture / OKRs
  - What: 5-level hierarchy (company → dept → team → individual → daily action); cascade UI
  - BLOCKS ON MICHAEL: **M02**

---

## TRACK 5 — Phase 3 Modules (Fall 2026)

> Each is a standalone module. Parallel-buildable once §0.4 schema is in place.

- [ ] **5.1** — Knowledge Hub (internal docs, vendor playbooks, rep contact protocols)
- [ ] **5.2** — Job Tracker (project-level work tracking)
- [ ] **5.3** — Inventory Module (live data — currently display-only)
  - BLOCKS ON MICHAEL: **M03** (Windward S5WebAPI confirmation) for live data; can ship CSV-import version without
- [ ] **5.4** — Purchase Orders
- [ ] **5.5** — Trade Partner Network (external designers/contractors)
- [ ] **5.6** — Price Book (catalog with margin analysis)
- [ ] **5.7** — Vendor Deal Optimization (recommend negotiation moves from score deltas)
- [ ] **5.8** — Showroom Display Management (display program tracking)
- [ ] **5.9** — QR/Barcode (warehouse + showroom labeling)
- [ ] **5.10** — Delivery Scheduling
- [ ] **5.11** — Warranty Tracker
- [ ] **5.12** — Marketing Hub (full build — current `marketing` page is a scaffold)
- [ ] **5.13** — E-Commerce Command Center
  - BLOCKS ON MICHAEL: **M04** (BigCommerce API key) AND **M05** (GMC API access)
- [ ] **5.14** — Competitive Pricing Intelligence
- [ ] **5.15** — Sales Decision Engine
- [ ] **5.16** — Company Calendar

---

## TRACK 6 — Phase 4 Integrations & AI Automation (EOY 2026)

- [ ] **6.1** — Google Analytics 4 integration
  - BLOCKS ON MICHAEL: **M06** (GA4 service account credential)
- [ ] **6.2** — Google Search Console integration
  - BLOCKS ON MICHAEL: **M06**
- [ ] **6.3** — BigCommerce REST integration
  - BLOCKS ON MICHAEL: **M04**
- [ ] **6.4** — Klaviyo integration
  - BLOCKS ON MICHAEL: **M09** (Klaviyo API key)
- [ ] **6.5** — Trade & Designer Portal (external-facing)
- [ ] **6.6** — Vendor Rep Portal (external-facing)
- [ ] **6.7** — AI Lighting Consultant (customer-facing chat for accentlightinginc.com)
- [ ] **6.8** — Intelligent Alerts (Agentic Level 3 → 4 cross-system)
- [ ] **6.9** — AI Demand Forecasting
- [ ] **6.10** — AccentOS → accentlightinginc.com embed (employee tools on the public site, role-gated)
- [ ] **6.11** — Windward ERP Live Integration (read-only via S5WebAPI Edge Function)
  - BLOCKS ON MICHAEL: **M03** (Windward written confirmation) AND **M10** (Curtis outreach)
- [ ] **6.12** — Google Ads / Meta Ads
  - Status: **No API access** per MASTER §10. Manual admin only — not automatable until Google Ads API auth granted by account holder.

---

## How to use this file

When you start a session:
1. Open this file. Find the first `[ ]` item from the top.
2. If it has `BLOCKS ON MICHAEL: M##`, check BUILD_PLAN_MICHAEL.md — if M## is `[ ]` (still pending), skip to the next `[ ]` item that isn't blocked.
3. Build it. Commit. Push.
4. Mark `[x]` here. Update SESSION_LOG.md.
5. If multiple items completed in one session, batch the SESSION_LOG entry.

When everything is `[x]`, AccentOS Phase 4 is done.
