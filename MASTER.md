# ACCENT LIGHTING — MASTER PROJECT REFERENCE
> **Version:** 2.0 | **Last updated:** 2026-05-04  
> **Maintainer:** Michael Graf | **Scope:** AccentOS + Ecommerce + Website + All Ops  
> **Location:** `github.com/mgraf77/accent-os/MASTER.md` (source of truth)  
> **Rule:** This file is updated at the end of every working session. It replaces Notion, stale PDFs, and scattered docs.

---

## TABLE OF CONTENTS

1. [Company Overview](#1-company-overview)
2. [Operating Model — How We Work](#2-operating-model--how-we-work)
3. [AccentOS — Current State](#3-accentos--current-state)
4. [AccentOS — Architecture](#4-accentos--architecture)
5. [AccentOS — Full Build Plan](#5-accentos--full-build-plan)
6. [AccentOS — Database Schema](#6-accentos--database-schema)
7. [Website Redesign](#7-website-redesign)
8. [Ecommerce & Google Ecosystem](#8-ecommerce--google-ecosystem)
9. [Vendor Ranking & Rep Strategy](#9-vendor-ranking--rep-strategy)
10. [All Accounts & Credentials Map](#10-all-accounts--credentials-map)
11. [Tech Stack & Integrations](#11-tech-stack--integrations)
12. [Hard Rules & Constraints](#12-hard-rules--constraints)
13. [Open Loops & Blockers](#13-open-loops--blockers)
14. [Long-Term Vision](#14-long-term-vision)
15. [Session Log](#15-session-log)

---

## 1. COMPANY OVERVIEW

**Accent Lighting Inc.**  
10322 E. Stonegate Ln., Suite 100, Wichita, KS 67206  
(316) 636-1278 | Mon–Fri 8:00am–5:30pm, Sat 10:00am–3:00pm  
Founded: 1979 | Brick-and-mortar lighting showroom + ecommerce

**Ownership:** Paul Graf & Patrick Graf  
**Director of BI & Operations:** Michael Graf

**Business contact email:** lamessages@accentlightinginc.com  
**Michael's work email:** michaelg@accentlightinginc.com

**Core business:** Commercial and residential lighting sales — showroom (primary) + online. 475+ vendor relationships. Wichita market.

**Current ecommerce actuals (Jan–May 2026):**
- 1,254,303 visits | 55 orders | $18,541 revenue | $337 AOV | 0.004% conversion rate
- Google Shopping campaigns currently paused

---

## 2. OPERATING MODEL — HOW WE WORK

### Roles
- **Michael = Captain.** Direction, approvals, content, internal coordination. Does not write code. Uses Claude on iPhone, work Windows desktop, and home Windows laptop.
- **Claude = Primary builder and executor.** All code, all analysis, all external communications drafted. Acts autonomously; states assumptions in one line and proceeds.
- **ChatGPT Pro = Secondary.** Deep research tasks, bulk scoring runs, parallel workstreams when needed.
- **Codespace = Build environment.** All AccentOS edits happen at `https://jubilant-meme-6966xvqw6594f59gp.github.dev/`.

### Session Protocol — AccentOS
1. Fetch live HTML fresh: `curl https://accent-os.pages.dev`
2. All edits via surgical `str_replace` patches — never rewrite from scratch
3. Deliver changes as a single copy-pasteable Claude Code block
4. Auto-commit and push: `git add -A && git commit -m "[message]" && git push origin main`
5. Cloudflare auto-deploys in ~15 seconds
6. Verify on live URL only — never as starting point

### Session Protocol — This Document
- Append to Section 15 (Session Log) at end of every session
- Update Section 13 (Open Loops) whenever something is blocked or resolved
- Update Section 3 (Current State) when version changes

### Autopilot Rules
- State assumptions in one line → proceed. Never stall.
- Never ask Michael to do something Claude can execute directly.
- Only pause before: changes to canonical vendor workbook, spending money, strategy decisions affecting agency relationships.

### Communication Style
- External emails (Eugene, Feedenomics, reps): concise, technically accurate, professional without being overly formal. Never signal reduced purchasing intent.
- Internal: plain English, business outcomes only.

---

## 3. ACCENTOS — CURRENT STATE

### Version
**v6.11.1** (as of 2026-05-06)  
File size: ~651KB JS / ~680KB total HTML | Split trigger: 900KB hard limit (76% used)

### What's Live
| Module | Status | Notes |
|---|---|---|
| Vendor Ranking | ✅ Live | 478 vendors (2 inactive), 14 scoring categories, A–F adaptive tiers |
| Scores Tab | ✅ Live | Supabase persistence via `vendor_score_states` table — 14 rows/vendor |
| Rep List | ✅ Live | Rep company view with contact info |
| Rep View | ✅ Live | Rep-facing view — Rep Score category hidden |
| Inventory Tab | ✅ Live | Display only |
| History Tab | ✅ Live | Changelog display |
| Sales Tab | ✅ Live | SVG sales chart |
| Changelog | ✅ Live | Version history |
| Parent Company / Brand Family | ✅ Live | 130 vendors assigned to parent groups |
| Edit Modals | ✅ Live | Score entry, vendor metadata |
| Outreach Email Generator | ✅ Live | Scaffold per vendor |
| Score States Persistence | ✅ Live | Verified/Unverified/N/A per category per vendor |
| File Split (Track 0.1) | ✅ Live | index.html (shell) + module-vendor.js + module-pipeline.js + module-knowledge.js + module-marketing.js |
| Auth / Login | ✅ Live | Track 0.2 Chunk A — Supabase Auth (email/password), 5-role system, JWT-backed session. 3 users seeded: Michael=Owner, Paul=Admin, Patrick=Admin. Tables: `user_profiles`, `audit_log`. Sidebar gated by `data-roles` whitelist. Anon JWT embedded (v6.9.6a) so login works on fresh browsers. Settings → Users panel still pending (Chunk B). |
| Customers Module | 🔲 Scoped — LOCKED | Visibility: Sales+. Source: Windward CSV import (waiting). Schema in M02. UI build pending CSV. |
| Employees Module | 🔲 Scoped — LOCKED | Visibility: Owner/Admin/Manager only (employees can NOT see own scores). Source: Windward CSV import (waiting). Schema in M02. UI build pending CSV. |
| Owner Dashboard | ✅ Live | Mgmt Dashboard with Overview / KPIs / Goals / Team Activity / System sub-tabs (Track 4.1) |
| KPI Master Registry | ✅ Live | 8-KPI seed catalog · per-role visibility · Owner-snapshot button (Track 4.2) |
| Goals & OKRs | ✅ Live | 5-level hierarchy · parent/child tree · progress bars (Track 4.3) |
| Co-op / Rebate Tracker | ✅ Live | coop_tracker · deadline alerts on Daily Brief (Track 2.3) |
| Pipeline (Persistent) | ✅ Live | pipeline_deals · 8-factor probability · forecast / close-rate stats · archive view (Track 1.5) |
| Quote Generator (Persistent) | ✅ Live | quotes + quote_lines · save/list/reopen/delete (Track 1.2) |
| Daily Command Center | ✅ Live | Role-aware Today card · 10 brief tiles across roles (Track 1.3) |
| Role-Based Dashboards | ✅ Live | Per-role landing — Warehouse / Sales / Owner+Admin+Manager variants (Track 3.2) |
| CRM / Sales Pipeline | 🔲 Planned | Track 1 |
| Daily Command Center | 🔲 Planned | Track 1 |
| **AccentOS Wiki** | ✅ Live | **v6.11.1** — Karpathy LLM Wiki · 42 pages (concepts, decisions, entities, sources, syntheses) · js/wiki.js two-pane module · sendChat wiki-grounding · 9 /aos-* slash commands · 5 Python tooling scripts · 88.2% eval composite (Track 6.13) |

### Vendor Data State
- 478 total vendors in `VD_RAW`
- 2 inactive (`ELK HOME` id=137, `SAYLITE TX` id=399) — null wl scores, sales history preserved
- 476 active vendors
- 306 vendor score categories still showing "Unverified" badge — outreach campaign will close these
- Web Listing: top-30 vendors by sales scored via direct web research; 226 lower-volume vendors bulk-assigned score=3 (deferred)
- Parent company metadata: 130 vendors assigned to parent groups (Visual Comfort Group, HVLG, Maska, Acuity, Minka Group, etc.)
- Vendor tier eligibility: Tier A (full score, active 24mo + $5K+ lifetime), Tier B (light score), Tier C (archived/inactive)

### Scoring Categories (14)
Discount, Freight, Returns Policy, Lead Time, IMAP Enforcement, Marketing Funds, Display Allowance, Spiff, Web Listing, DTC/Consumer Direct, Consumer Demand, Rebates, Co-op, Rep Score (hidden from Rep View)

### Scoring Rules
- Missing data = **0** for scoring purposes (penalizes gaps)
- "Confirmed absent" = 0
- "Unverified / never asked" = 0 for score, flagged "Unverified" in UI
- "Case-by-case" = N/A in all categories
- Scoring curve: average = 5, bell-shaped distribution, 10 = perfect, 0 = worst
- Inactive vendors excluded from tier cutoff calculations

### Supabase Tables (Live)
| Table | Purpose |
|---|---|
| `vendor_categories` | Per-vendor category overrides (manually set category names/weights) |
| `vendor_changelog` | Version history entries |
| `vendor_score_states` | Verified/Unverified/N/A state per vendor per category (14 rows/vendor) |
| `vendor_parents` | Parent company / brand family assignments |

### Known Supabase Issue
Supabase MCP returns permission errors for project `hsyjcrrazrzqngwkqsqa` consistently. **All schema changes run manually by Michael via SQL Editor.** Claude provides the exact SQL to paste.

---

## 4. ACCENTOS — ARCHITECTURE

### URLs
| Environment | URL |
|---|---|
| Production | https://accent-os.pages.dev |
| Staging (Session A) | https://accent-os-staging.pages.dev |
| Repo | https://github.com/mgraf77/accent-os |
| Codespace | https://jubilant-meme-6966xvqw6594f59gp.github.dev/ |
| Supabase | https://hsyjcrrazrzqngwkqsqa.supabase.co |

### Repo Structure (Post-Split)
```
accent-os/
├── index.html              # Shell: nav, routing, shared utilities, auth
├── module-vendor.js        # Vendor Intelligence module
├── module-pipeline.js      # Sales Pipeline module
├── module-knowledge.js     # Knowledge Hub module
├── module-marketing.js     # Marketing + Settings module
├── MASTER.md               # THIS FILE — source of truth for everything
├── SESSION_LOG.md          # Append-only session log (replaces Notion)
├── ACCENTOS_ARCHITECTURE.html  # Interactive architecture reference
└── ACCENTOS_ARCHITECTURE.pdf   # PDF version
```

### File Split Architecture
- **index.html** = shell + nav + shared utilities + auth. Lazy-loads module files on tab activation.
- Each module file loads **only** when that tab is opened — zero impact on initial load time
- Split trigger: 900KB hard limit on any single file
- Zero user-facing change from the split

### Design System (LOCKED — never changes)
```
Background:  #f4f4f2
Accent/Red:  #ed1c24
Sidebar:     #1a1a1a (dark)
Cards:       #ffffff
Font UI:     Outfit
Font Nums:   DM Mono
Theme:       Light only
Framework:   None — vanilla JS, no build step
```

### Intelligence Architecture (4 Layers)
```
LAYER 0 — DATA SOURCES
  Windward ERP → BigCommerce → Google Suite (GA4/GMC/GSC) → Lights America → Public Web APIs
  Gmail/Calendar → Klaviyo → Supabase Staging → Behaviour Telemetry → SESSION_LOG.md

LAYER 1 — INTELLIGENCE ENGINE
  Probability Matrix → RFM Engine → LTV Calculator → Alert Engine → Agentic CRM
  Product Affinity → Goal Tracker → Loss Intelligence → Content Supply Chain → Skills Catalog

LAYER 2 — ACCENTOS MODULES
  Vendor Intelligence → CRM Customer 360 → Sales Pipeline → Daily Command Center → Owner Dashboard
  Employee Scorecards → Ecommerce Module → Co-op Tracker → Goal Architecture → Inventory PO

LAYER 3 — OUTPUTS
  Role-Based Dashboards (Owner / Sales / Ops / Warehouse)
  Proactive Alerts & Recommendations
  Approved Actions (Emails / Claims / Outreach / Fixes)
```

### Execution Sessions (Codespace Model)
- **Session A** = Production work on main branch (`accent-os.pages.dev`)
- **Session B** = Staging for pre-production testing (`accent-os-staging.pages.dev`)
- Claude Code runs in Codespace, auto-commits, pushes to main, Cloudflare deploys in ~15s

### Tech Decisions Locked
| Decision | Choice | Rationale |
|---|---|---|
| Framework | None (Vanilla JS) | No build step, no dependencies, no terminal needed |
| Hosting | Cloudflare Pages | Auto-deploy from GitHub push, ~15s |
| Database | Supabase (Postgres) | Free tier, MCP-accessible (when fixed), SQL Editor fallback |
| Auth | Supabase Auth (planned) | Roles: Owner, Manager, Sales, Warehouse, Admin |
| AI in-app | Anthropic API | Claude Sonnet 4, wired via fetch |
| Session log | SESSION_LOG.md in repo | Replaces Notion — append-only, version-controlled |

### Code Patterns (Critical — Never Break These)
- All `onclick` handlers must wrap dynamic values in `${...}` template literals to prevent null-id bugs
- `sbFetch` must not call `response.json()` on empty response bodies (`Prefer: return=minimal`)
- Module edits must never overwrite other modules — surgical patches only
- Never rewrite from scratch — always `str_replace` against freshly-fetched HTML
- `VD_RAW` is the vendor data variable name in AccentOS HTML (not `VENDORS` or `VENDOR_DATA`)

---

## 5. ACCENTOS — FULL BUILD PLAN

> **Active execution lists:** See [BUILD_PLAN_CLAUDE.md](./BUILD_PLAN_CLAUDE.md) and [BUILD_PLAN_MICHAEL.md](./BUILD_PLAN_MICHAEL.md) in repo root. The tracks below are the strategic plan; the BUILD_PLAN files are the working checklists Claude and Michael run in parallel each session.

**Overall progress: ~12%** | Infrastructure: 30% | Daily Ops: 8% | Sales & Revenue: 5%

### TRACK 0 — Infrastructure (Do First — Unlocks Everything)

| Item | Status | Notes |
|---|---|---|
| 0.1 File Architecture Split | ✅ Done | index.html + 4 module files live |
| 0.2 User Authentication & Role-Based Access | 🔲 Next | Supabase Auth, 5 roles, audit_log, role assignment UI |
| 0.3 Supabase MCP Fix | ⚠️ Blocked | Michael must paste SQL grant in SQL Editor |
| 0.4 Core Database Schema | 🔲 After 0.3 | All tables in one SQL execution |

**0.2 Auth spec:** Login screen (AccentOS design system), Supabase Auth email/password, Roles: Owner/Manager/Sales/Warehouse/Admin, sidebar visibility controlled by role, role assignment UI in Settings (owner-only), `audit_log` table writes from moment auth is live.

### TRACK 1 — Highest Immediate Business Impact

| Item | Priority | Est. Value |
|---|---|---|
| 1.1 Vendor Score Persistence (full) | HIGH | Foundation for outreach |
| 1.2 Quote Generator — Persistence + Save/Retrieve | HIGH | $22.8K/yr value |
| 1.3 Daily Command Center | HIGH | Drives daily adoption |
| 1.4 CRM & Customer Intelligence | HIGH | $19.2K/yr value |
| 1.5 Sales Pipeline — Persistent with Loss Tracking | HIGH | Dynamic probability |

**Pipeline probability model:** 8 factors — lead source, customer history, segment, project type, quote age vs. customer baseline, communication recency, quote size. No fixed stage percentages. Recalibrates from real Accent win/loss data as it accumulates.

### TRACK 2 — Vendor Intelligence (Complete the Foundation)

| Item | Priority | Notes |
|---|---|---|
| 2.1 Brand Family / Parent Company Grouping UI | MEDIUM | Data already imported (130 vendors) |
| 2.2 Vendor Metadata, Notes & Override Persistence | MEDIUM | `vendor_overrides` table |
| 2.3 Rebate & Co-Op Fund Tracker | HIGH — Money Left | `coop_tracker` table |

### TRACK 3 — Employee Intelligence

| Item | Notes |
|---|---|
| 3.1 Employee Scorecards | Two open questions before building: (1) Should scores be admin-only? (2) Manual entry or Windward CSV import? |
| 3.2 Role-Based Dashboards | 6 role types. Owner and Sales dashboards spec'd in Phase 2B doc. |

### TRACK 4 — Owner Intelligence & Strategy

| Item | Notes |
|---|---|
| 4.1 Owner Dashboard | Revenue, pipeline, team activity, goal progress, ecommerce snapshot |
| 4.2 KPI Master Registry | Financial, Sales, Ecommerce, Customer Intelligence KPIs by role |
| 4.3 Goal Architecture / OKRs | 5-level hierarchy, daily action cascade |

### TRACK 5 — Phase 3 (Fall 2026)

Knowledge Hub, Job Tracker, Inventory Module, Purchase Orders, Trade Partner Network, Price Book, Vendor Deal Optimization, Showroom Display Management, QR/Barcode, Delivery Scheduling, Warranty Tracker, Marketing Hub, E-Commerce Command Center, Competitive Pricing Intelligence, Sales Decision Engine, Company Calendar

### TRACK 6 — Phase 4 Integrations & AI Automation (EOY 2026)

Windward ERP Live Integration, BigCommerce Integration, Google Ads + GA4, Klaviyo, Trade & Designer Portal, Vendor Rep Portal, AI Lighting Consultant (customer-facing), Intelligent Alerts, AI Demand Forecasting, AccentOS → accentlightinginc.com embed

### Build vs. Connect Decision Matrix (Zero Added Cost Law)

| Integration | Decision | Cost |
|---|---|---|
| Windward ERP data | Build (Supabase Edge Function SQL bridge) | $0 |
| Google Analytics 4 | Connect (free API) | $0 |
| Google Merchant Center | Connect (free API) | $0 |
| Google Search Console | Connect (free API) | $0 |
| Gmail / Calendar | Connect (MCP already connected) | $0 |
| BigCommerce | Connect (REST API in existing plan) | $0 |
| Klaviyo | Connect (API free on existing plan) | $0 |
| CRM | Build (AccentOS IS the CRM) | $0 |
| BI / Analytics | Build (native Supabase) | $0 |
| Salesforce / HubSpot | Build instead | $0 |

### Development Philosophies
- **Ship → Use → Improve (RLHF Loop):** Build it, use it, improve from what actually happened
- **Atomic Design:** Every UI element built from shared reusable parts
- **Progressive Disclosure:** Simple view first, detail on demand. Reps see summaries. Managers click deeper. Owners see everything.
- **Feature Flags:** New features built in live codebase but hidden until ready
- **Boring Middle First:** Reliable data input and solid saves before flashy UI
- **Jobs-to-be-Done:** Every module designed around a specific job, nothing else
- **Module Isolation:** A bug in Customers never affects Vendor Intelligence
- **Dependency-first Sequencing:** Nothing built until its infrastructure is confirmed complete

---

## 6. ACCENTOS — DATABASE SCHEMA

### Live Tables
```sql
-- Vendor category overrides
vendor_categories (
  id uuid PRIMARY KEY,
  vendor_id text,
  category_name text,
  custom_weight numeric,
  created_at timestamptz,
  updated_at timestamptz
)

-- Session changelog
vendor_changelog (
  id uuid PRIMARY KEY,
  version text,
  summary text,
  details text,
  created_at timestamptz
)

-- Score verification states (14 rows per vendor)
vendor_score_states (
  id uuid PRIMARY KEY,
  vendor_id text,
  category_key text,
  state text,  -- 'verified' | 'unverified' | 'na'
  created_at timestamptz,
  updated_at timestamptz
)
RLS: anon read/insert/update enabled

-- Parent company assignments
vendor_parents (
  id uuid PRIMARY KEY,
  vendor_id text,
  parent_name text,
  created_at timestamptz
)
```

### Planned Tables (Need SQL paste from Michael)
```sql
-- Full score persistence
vendor_scores (id, vendor_id, category_key, score numeric, justification text, ...)

-- Vendor metadata overrides
vendor_overrides (id, vendor_id, notes text, tags text[], ...)

-- Customer records (agentic CRM)
customer_records (id uuid, windward_id text, name text, segment text, ...)

-- Customer interactions
customer_interactions (id, customer_id, type text, notes text, ...)

-- Sales quotes
quotes (id, customer_id, amount numeric, probability numeric, stage text, ...)

-- Quote line items
quote_items (id, quote_id, sku text, qty int, price numeric, ...)

-- Win/loss log
win_loss_log (id, quote_id, outcome text, loss_reason text, matrix_factors_snapshot jsonb, ...)

-- RFM scores + baselines
rfm_scores (id, customer_id, recency int, frequency int, monetary numeric, segment text, order_freq_baseline_days int, ...)

-- AI-personalised alerts
alerts (id, customer_id, type text, trigger_data jsonb, status text, ...)

-- Behaviour telemetry
telemetry_events (id, user_id, action text, module text, element text, timestamp timestamptz, ...)

-- Build event audit
build_events (id, version text, session_date date, built text, changed text, ...)

-- Rebate / co-op tracker
coop_tracker (id, vendor_id, type text, amount numeric, deadline date, claimed bool, ...)

-- Audit log (Auth)
audit_log (id, user_id uuid, action text, module text, timestamp timestamptz)

-- Probability model log
probability_model_log (id, version int, recalibration_date date, factors jsonb, ...)
```

---

## 7. WEBSITE REDESIGN

### Status
**Sandbox/prototype phase.** Two production-ready HTML sandbox files built (in project files). Nothing goes to production until owner-approved and rigorously tested.

### Files
- `accent-v1-no-cost.html` — "No new spend" scenario (primary presentation path)
- `accent-v2-full-plan.html` — Full plan with all features

### Visual Direction (Approved)
- Dark hero with warm gold lighting effects
- Typography: Playfair Display (headings) + Outfit (body)
- Primary accent: Red `#ed1c24`

### Key Decisions Made
- **Windward integration:** Fully deferred. Version A shows "call us" fallback, Version B shows "coming soon" treatment
- **AR (Roomvo ~$299/mo) and Matterport virtual showroom:** Positioned as Phase 2
- **"No new spend" is the primary owner presentation path**

### Features Built Into Sandbox
- Customer login (BigCommerce orders)
- Employee login routing to AccentOS
- Trade login with designer/builder application flows
- Rebate finder
- Style quiz
- Checklists
- Closeout section
- Newsletter opt-in (Klaviyo-ready)
- AI chatbot (Anthropic API)
- Virtual showroom placeholder
- AR visualizer placeholder
- Full local business SEO schema markup

### Phase 2 Additions (Not Yet Built)
- Roomvo AR (~$299/mo)
- Matterport virtual showroom (~$300 one-time + ~$10/mo)

---

## 8. ECOMMERCE & GOOGLE ECOSYSTEM

### Platform
**BigCommerce** | Store: `store-cwqiwcjxes` | Admin: `store-cwqiwcjxes.mybigcommerce.com`

### Product Feed
**Feedenomics Surface Basic** (100K SKU cap) | DB: 26082 | Surface app: 199612  
Source: **Lights America** feed (Data52) | Contact: Eugene Klein — eugene@lightsamerica.com

### Google Merchant Center
Account: 687520574 | authuser=2  
~14 issue categories active  
**Dominant problem: 20K+ products missing images**

### Structured Data Fix (Deployed)
BigCommerce Script Manager — Header placement with `DOMContentLoaded` wrapper. Converts JSON-LD `Offer` to `AggregateOffer`, sets price to `highPrice`, updates OG meta tag.

### MAP Violations (Minka Group)
Response work completed. 4 products manually added to GMC. 4 URL re-index requests submitted (P053-077 batch). 4 URLs still pending.

### Feed Strategy — Reaching 100K SKUs
Filter criteria:
1. 62 qualifying vendors (Lights America score = 10)
2. Inventory availability (Accent + manufacturer stock > 0)
3. Minimum price threshold
4. Category exclusions (except downrods)

### GMC "Needs Attention" Audit
Dominated by missing product images. Full resolution strategy pending. Meta descriptions: Eugene (Lights America) building CSV for bulk update. Feedenomics to configure "new products only" rule going forward.

### BigCommerce Admin Notes
- Cross-origin iframe architecture — direct URL navigation and iframe JS both fail
- Visual click approach via Chrome MCP is the correct method for admin interactions
- Category SEO: correct field is "Meta description" under "Search engine optimization" at bottom of edit page (not the rich text Description editor at top)
- Return policy lives under "Shipping & Returns"

### Key External Contacts
| Name | Company | Role | Contact |
|---|---|---|---|
| Eugene Klein | Lights America | Product feed supplier | eugene@lightsamerica.com |
| Seth Masutthi | Feedenomics | Feed management | — |
| Jacki Peltier | Feedenomics | Feed management | — |
| Stacy Sykes | Williams Lighting Source | Minka Group rep | — |

---

## 9. VENDOR RANKING & REP STRATEGY

### Vendor Ranking System
See Section 3 and 5 for scoring details.

**BigCommerce export template:** "Accent Vendor Analysis" (created for vendor-level analysis)

### Rep Outreach Campaign (Built, Not Sent)
- 20 emailable rep companies identified
- 8 need call lists (no email on file)
- 257 vendors have no rep group assigned
- Full campaign assets (PDF per rep, email template, call list) — not yet built

### Windward S5WebAPI Strategy
**Status: Parked pending written confirmation**

Plan:
1. Get written confirmation from Windward rep that S5WebAPI is read-only and included in existing license
2. Use that as leverage with Curtis (internal IT, manages Windward, resistant to new technology integrations)
3. No integration work begins until confirmation in hand

Port 215 returns HTTP 200 but all endpoints return 401/403 — WebAPI user password is undocumented. Three recovery options: (a) search filesystem/credential manager, (b) check Feedenomics admin for existing Windward connector, (c) email Windward support for password recovery.

**Curtis outreach strategy:** Deferred until written confirmation is in hand.

---

## 10. ALL ACCOUNTS & CREDENTIALS MAP

> ⚠️ No actual passwords stored here. This is a map of what exists and where to find credentials.

### Development & Infrastructure
| System | Account / ID | Notes |
|---|---|---|
| GitHub | mgraf77 | Repo: `mgraf77/accent-os` |
| Cloudflare Pages | — | Auto-deploy from GitHub main; accent-os.pages.dev |
| Supabase | hsyjcrrazrzqngwkqsqa.supabase.co | Anon key stored in sessionStorage under `aos-sb-key`, configured via Settings UI |
| Anthropic API | — | Wired in-app; used for AccentOS AI features |
| Claude.ai | Michael's account | Primary build interface |

### Ecommerce
| System | Account / ID | Notes |
|---|---|---|
| BigCommerce | store-cwqiwcjxes | Admin: store-cwqiwcjxes.mybigcommerce.com |
| Google Merchant Center | 687520574 | authuser=2 |
| Feedenomics | DB 26082, Surface app 199612 | Contacts: Seth Masutthi, Jacki Peltier |
| Lights America | — | Contact: Eugene Klein — eugene@lightsamerica.com |
| Klaviyo | — | Email marketing, connected to BigCommerce |

### Analytics & Ads
| System | Notes |
|---|---|
| Google Analytics 4 | Connected to accentlightinginc.com |
| Google Search Console | Connected |
| Google Ads | No API access — admin changes manual only |
| Meta Business | Pixel ID 1311141804223008 installed on BigCommerce store; no API access |

### Internal Systems
| System | Notes |
|---|---|
| Windward System Five | ERP/POS — Curtis manages; S5WebAPI at port 215 (auth blocked) |
| Clover | POS/payments |
| Netlify/Cloudflare Pages | Hosting |

### Chrome MCP
Tab ID: 2035713132 (may need refresh each session)  
Use michaelg@accentlightinginc.com Chrome profile for all Accent admin work

### Google Drive MCP
Connected to michaelg@accentlightinginc.com  
Reads Google Docs natively; export Sheets as CSV for data

### AccentOS Vendor Ranking Spreadsheet
Google Sheets ID: `1EETnYq9pl8OwvbOVdCG-g6uaddjFezzPNPDo2PNnk5I`

---

## 11. TECH STACK & INTEGRATIONS

### Core Stack
| Layer | Technology |
|---|---|
| Frontend | Vanilla JS, HTML, CSS — no framework, no build step |
| Hosting | Cloudflare Pages (auto-deploy from GitHub) |
| Database | Supabase (PostgreSQL) |
| Auth (planned) | Supabase Auth |
| AI (in-app) | Anthropic API — Claude Sonnet 4 |
| Version control | GitHub — repo `mgraf77/accent-os` |
| Dev environment | GitHub Codespace |
| Ecommerce | BigCommerce |
| ERP/POS | Windward System Five |
| POS/Payments | Clover |
| Email Marketing | Klaviyo |
| Product Feed | Feedenomics → Lights America (Data52) |
| Feed Destination | Google Merchant Center |

### MCP Stack (Connected)
| MCP | Status | Use |
|---|---|---|
| Google Drive | ✅ Connected | michaelg@accentlightinginc.com; reads Docs natively |
| Gmail | ✅ Connected | Draft emails, search threads |
| Google Calendar | ✅ Connected | — |
| Notion | ✅ Connected | **Session logging DISABLED for Accent work** |
| Chrome MCP | ✅ Connected | BigCommerce admin visual click approach |
| Supabase MCP | ⚠️ Auth errors | Project hsyjcrrazrzqngwkqsqa returns permission errors consistently |
| Canva | ✅ Connected | — |
| Make | ✅ Connected | — |
| Vercel | ✅ Connected | — |
| Indeed | ✅ Connected | — |

### Fonts (In Use)
- **Outfit** — UI elements, body text
- **DM Mono** — Numbers, code, data
- **Playfair Display** — Website redesign headings only

---

## 12. HARD RULES & CONSTRAINTS

### AccentOS Build Rules
1. **Codespace-only.** All work at `https://jubilant-meme-6966xvqw6594f59gp.github.dev/`. Never drag-and-drop files.
2. **Never rewrite from scratch.** Always surgical `str_replace` patches against freshly-fetched HTML.
3. **Single Claude Code prompt block.** All changes delivered as one continuous copy-pasteable block. No splits, no sections, no exceptions.
4. **Module isolation.** Edits to one module must never touch any other module's code.
5. **Auto-commit after every session.** `git add -A && git commit -m "..." && git push origin main`
6. **Rep Score category never visible on Rep View tab.** Vendors must not know they are being scored on rep performance.
7. **Supabase MCP = manual.** All schema changes run by Michael via SQL Editor. Claude provides the exact SQL.
8. **Session log is SESSION_LOG.md** in the repo. Notion logging permanently disabled for Accent work.

### Data Rules
- **Blank beats guessed.** No placeholders. Missing data = blank (or 0 for scoring).
- **`sbFetch` cannot call `response.json()` on empty bodies** (`Prefer: return=minimal` responses).
- **All `onclick` handlers** must use `${...}` template literals for dynamic values.
- **`VD_RAW`** is the vendor data array variable name in AccentOS. Never search for `VENDORS` or `VENDOR_DATA`.
- **Inactive vendor scores** must be excluded from tier cutoff calculations.

### Spend Rules
- **Zero added cost unless absolutely necessary.** Every integration built internally if possible.
- No money spent on ads, tools, or print without Michael approval.

### BigCommerce Admin Rules
- Cross-origin iframe architecture means direct URL navigation and iframe JS both fail
- Use Chrome MCP visual click approach (screenshot → left_click at pixel coordinates)
- Script Manager scripts: Header placement with `DOMContentLoaded` wrapper (Footer placement fails)

### Agency / External Rules
- Agital/Go Fish Digital dismissed — all theme and feed work done by Michael + Claude only
- Never mix Accent strategy with any other business strategy

### Intelligence Laws (Phase 2B)
1. **Data Quality Over Feature Quantity** — Blank beats wrong
2. **Zero Added Cost** — Build internally unless impossible or the value doesn't justify the build time
3. **No Curtis Dependency** — Data integration is a system design problem; no individual is a gating factor

---

## 13. OPEN LOOPS & BLOCKERS

### 🔴 Active Blockers
| Item | Blocker | Path to Unblock |
|---|---|---|
| Supabase MCP permissions | Permission errors on project | Michael pastes SQL grant in SQL Editor |
| Windward S5WebAPI | Auth blocked (401/403), password undocumented | (a) filesystem search, (b) Feedenomics connector check, (c) Windward support email |
| Curtis / Windward integration | Needs written confirmation API is read-only + included in license | Get written confirmation from Windward rep first |

### 🟡 Open Loops — In Progress
| Item | Status | Notes |
|---|---|---|
| Track 0.2 Auth | Not started | Waiting on 0.3 (MCP fix) for DB work, but auth can start independently |
| Vendor score persistence (full) | Partial — `vendor_score_states` live | `vendor_scores` table needed for full numeric persistence |
| Vendor metadata persistence | Not started | `vendor_overrides` table needed |
| Parent company UI grouping | Data imported | UI (filter/group in Vendor View) not yet built |
| Rep outreach campaign | Not built | 20 emailable reps ID'd, 8 need call lists, 257 vendors unassigned |
| GMC missing images (20K+ products) | Not resolved | Dominant GMC issue |
| GMC URL re-index | 4 URLs still pending | P053-077 batch submitted |
| Meta description bulk update | Waiting on Eugene's CSV | Feedenomics to configure "new products only" rule |
| Website prototype | Sandbox built | Needs owner presentation + approval before production |
| Customers module | Scoped | Two open questions: (1) admin-only scores? (2) manual or Windward CSV? |
| Employees module | Scoped | Same two questions as Customers |
| SESSION_LOG.md | Not created | Needs to be initialized in repo |

### 🟢 Resolved (Recent)
| Item | Resolution |
|---|---|
| MAP violations (Minka Group) | Response completed, 4 products added to GMC manually |
| File split (Track 0.1) | Complete — index.html + 4 module files |
| Vendor score states persistence | `vendor_score_states` table + UI live (v6.9.5) |
| Web listing rescore (top 30) | Researched and scored; 226 bulk-deferred |
| ELK HOME + SAYLITE TX inactive flag | Added to VD_RAW (v6.9.3) |
| Agital/Go Fish dismissed | All future work internal |
| BigCommerce structured data fix | Script Manager deployed |

---

## 14. LONG-TERM VISION

### What AccentOS Becomes
AccentOS is being built to be an **agentic operating system** for Accent Lighting — a system that doesn't just store data but actively recommends, drafts, and executes actions on behalf of the business.

**End state (Phase 4, EOY 2026):**
- Every role has a daily brief waiting when they log in — what to do today, what's at risk, what's an opportunity
- Sales quotes are auto-generated from a takeoff photo, refined with one voice note, submitted without touching a keyboard
- Customer profiles build themselves from Windward, Google, LinkedIn, and Gmail — no manual entry
- The system knows which customers are about to churn before any human notices
- Vendor co-op money is claimed automatically before deadlines
- Google Shopping feed is self-healing — product quality issues flagged and queued for fix
- The website is personalized per visitor type (trade vs. consumer vs. designer)
- All integrations are self-maintained; no vendor dependency on Curtis or any individual

### Why Internal vs. SaaS
If built as off-the-shelf tools, AccentOS would cost **$8,300+/month** in software alone, plus **$151K/year** in labor value. Current monthly cost: **$30**. Every capability is built for exactly how Accent operates — no feature bloat, no seat fees, no integrations that half-work.

### Agentic Capability Ladder
| Level | State | Description |
|---|---|---|
| 1 | ✅ Done | Passive data store — read/write vendor scores |
| 2 | ✅ Done | Reactive display — show rankings, reps, history |
| 3 | 🔲 In Progress | Proactive alerts — tell you what needs attention |
| 4 | 🔲 Planned | Draft actions — email scaffolds, claim drafts, outreach |
| 5 | 🔲 Phase 3 | Predictive — know what's going to happen before it does |
| 6 | 🔲 Phase 4 | Autonomous — execute approved actions without being asked |

### Projected Business Impact
- **E-commerce conversion lift:** +10–25% from site redesign + better feed
- **Google Shopping revenue (with feed fixed):** $30K–$80K/yr estimate
- **Co-op / rebate money recovered:** Currently left on table due to tracking gaps
- **Time savings by role:** 40–60 hours/month across the team when fully built
- **Sales pipeline:** Dynamic probability model + follow-up automation expected to improve close rate meaningfully

---

## 15. SESSION LOG

> **Format:** Most recent at top. One entry per session. Auto-appended at session end.

---

### 2026-05-06 — AccentOS Wiki shipped (v6.11.1)
**Shipped:** Karpathy LLM Wiki primary path. 42 wiki pages (25 concepts, 7 ADRs, 3 employee entities, 6 sources, 1 synthesis). `js/wiki.js` two-pane sidebar module with wikilink navigation, search, and `renderWikiMd`. `sendChat()` wiki-grounding (term overlap → fetch top-3 → inject context → "Grounded · N wiki" pill). 9 `/aos-*` slash commands. 5 Python tooling scripts (wiki_lint, wiki_seed, rag_build_index, rag_search, rag_eval). `.claude/CLAUDE.md` AUTO-EXECUTE step 0 reads `wiki/hot.md` + last 10 `wiki/log.md` entries. BM25 index with 1.3× wiki boost + `--wiki-only` flag. RAG eval: 88.2% composite (recall 84.4%, precision 44.8%, coverage 100%). 3 Ralph loops; zero issues after loop 3.  
**Fixes:** Synthesis page exclusion from grounding (self-contamination), lint code-block skip for inline code wikilinks, offline fallback in wiki fetch.  
**Open loops:** wiki/entities/vendors/ top-30 auto-gen (wiki_seed.py --vendors pending), wiki/modules/ auto-gen from js/*.js pending. M42/M43 pgvector optional path not activated.  
**Next:** Run wiki_seed.py --modules + --vendors to populate remaining wiki sections.

---

### 2026-05-04 — Master project reference file created
**Shipped:** MASTER.md — complete aggregate of all project knowledge, architecture, build plan, accounts, open loops, and vision. Covers AccentOS v6.9.5 state, file split completion, all 15 sections. Proposed for repo root at `mgraf77/accent-os/MASTER.md` alongside `SESSION_LOG.md`.  
**Open loops:** SESSION_LOG.md not yet initialized in repo; Auth (Track 0.2) not started; Supabase MCP still broken.  
**Next:** Add MASTER.md and SESSION_LOG.md to the Codespace repo root. Start Track 0.2 (Auth).

---

### 2026-05-04 — Vendor score states persistence shipped (v6.9.5)
**Shipped:** `vendor_score_states` Supabase table with RLS. `sbLoadScoreStates()` and `sbSaveScoreState()` wired. Verified/Unverified/N/A radio UI in edit modal. Persistence confirmed — 14 rows/vendor writing and reading cleanly.  
**Open loops:** 306 unverified badges remaining — need rep outreach to close. Full numeric score persistence (`vendor_scores` table) still pending.  
**Next:** Build parent company grouping UI in Vendor View (data already imported for 130 vendors).

---

### 2026-05-04 — Scoring engine updates (v6.9.4)
**Shipped:** Vendor tier classification (Tier A/B/C eligibility filter). Hybrid missing-data scoring — confirmed absent = 0, unverified = 0 flagged. Bell curve scoring intent locked. Tier cutoffs exclude inactive vendors.  
**Open loops:** `vendor_score_states` persistence (done in next session).  
**Next:** Persistence layer for score states.

---

### 2026-05-03 — Track 0.1 file split shipped
**Shipped:** index.html split into shell + module-vendor.js + module-pipeline.js + module-knowledge.js + module-marketing.js. Lazy-load on tab activation. Staging verified. Zero user-facing change.  
**Open loops:** Auth (0.2), Supabase MCP fix (0.3), full DB schema (0.4).  
**Next:** Track 0.2 — Auth and role-based access.

---

### 2026-05-03 — AccentOS infrastructure planning + architecture reference
**Shipped:** ACCENTOS_ARCHITECTURE.html — full 12-section interactive reference (System Overview, Tech Stack, Execution Sessions, Repo Structure, DB Schema, Code Patterns, RAG Layer, Cloudflare Worker, MCP Stack, Custom Skills, Pipelines, Hard Constraints). SESSION_LOG.md concept established to replace Notion.  
**Open loops:** File not yet in repo. Notion log officially retired.  
**Next:** Add ACCENTOS_ARCHITECTURE.html to repo. Run Track 0.1 file split.

---

### 2026-05-03 — Agentic OS vision map
**Shipped:** AccentOS agentic operating system vision map — 6-level capability ladder, end-state capability list, build timeline, ROI projection.  
**Open loops:** Vision is documented; execution is Track 0 infrastructure.  
**Next:** Infrastructure planning session.

---

### 2026-05-01 — Web listing rescore + inactive vendor flags
**Shipped:** Top-30 vendors by sales scored via direct web research (0–10 rubric). 226 lower-volume vendors bulk-assigned score=3 (deferred). ELK HOME (id=137) and SAYLITE TX (id=399) flagged inactive in VD_RAW — wl scores nulled, sales history preserved (v6.9.3).  
**Open loops:** 306 unverified score badges remaining. Inactive vendor filter needed in tier cutoff logic.  
**Next:** Tier cutoff logic update to exclude inactive vendors. Scoring engine improvements.

---

### 2026-05-01 — Scoring rubric improvements (6 categories)
**Shipped:** Updated rubrics for IMAP markup & enforcement, marketing funds, display allowance, web listing, DTC/consumer direct, consumer demand. Bell curve distribution intent. Works across vendor types (commercial/residential/hardware) and markets (in-store/ecommerce).  
**Open loops:** Score persistence not yet built.  
**Next:** Apply updated rubrics, then persistence layer.

---

### 2026-04-29 — Vendor detail modal, auto-zero scoring, outreach email overhaul, rubric download
**Shipped:** Vendor detail modal with full score breakdown. Auto-zero for missing/unverified data. Outreach email generator overhaul. Rubric PDF download.  
**Open loops:** Web listing rescore, parent company UI.  
**Next:** Web listing rescore with direct web research.

---

*Older sessions archived — see Notion Live Log for history prior to 2026-04-29.*

---

## APPENDIX A — PHASE 2B INTELLIGENCE ADDENDUM SUMMARY

> Full spec in `/mnt/project/AccentOS_Phase2B_v2.docx`. Key highlights below.

### Intelligence Laws
1. Build for the job to be done — not the tool to be built
2. Intelligence compounds — every module makes every other module smarter
3. Personalisation over generalisation — every alert uses the customer's personal baseline
4. Automation enables humans — the system handles grunt work, humans handle judgment
5. Data quality over feature quantity — blank beats wrong
6. Zero added cost unless absolutely necessary

### Dynamic Pipeline Probability (8 Factors)
Lead source weight → Customer history → Customer segment → Project type → Quote age vs. customer baseline → Communication recency → Quote size → Product category mix

### Agentic CRM (25-Field Customer Card)
**Internal automatic:** Windward order history, Clover transactions, BigCommerce orders, quote history, interaction log  
**Public enrichment:** Google Business, LinkedIn, Maps, BBB, KS Secretary of State, Facebook/Instagram  
**Prompted manual:** Personal context, decision-making style, key relationships

### 12 AI-Personalised Alerts
All thresholds dynamic — based on per-customer baseline, not fixed company-wide timers:
- Quote stale (activity gap > 1.5x customer baseline)
- Customer at risk (days since order > 1.5x order frequency baseline)
- Co-op deadline approaching
- New project signal detected
- Competitor mention
- Large order anomaly
- Price change on active quote
- Product back-in-stock
- MAP violation detected
- Feed health degradation
- GMC approval rate drop
- New customer profile enriched

### Minimum Viable Intelligence Package (4–6 sessions)
1. SESSION_LOG.md (~30 min) — eliminates session fragility
2. Windward SQL Bridge (1 session) — unlocks all customer intelligence
3. `customer_records` + `customer_orders` tables — data foundation
4. Agentic CRM profile builder — profiles build themselves from day one
5. Dynamic probability pipeline — real forecasting
6. AI-personalised alert engine — AccentOS becomes proactive

---

## APPENDIX B — VENDOR RANKING SCORING RUBRIC QUICK REFERENCE

> Full rubrics in AccentOS app. This is the reference for alignment.

| Category | Weight | 10 = | 0 = |
|---|---|---|---|
| Discount | High | ≥50% off MSRP, consistent | No discount / full list |
| Freight | High | Free freight always | Charged always, high minimum |
| Returns Policy | Medium | Accepts returns, no restock | No returns accepted |
| Lead Time | Medium | Ships same/next day | 8+ weeks consistently |
| IMAP Enforcement | High | Actively enforces, takes action | No policy or never enforces |
| Marketing Funds | Medium | ≥3% of purchases, easy to claim | No funds offered |
| Display Allowance | Medium | Dedicated $$, paid on schedule | No allowance |
| Spiff | Medium | >15% spiff, all products | No spiff program |
| Web Listing | Medium | Featured/premier dealer on vendor site | Listed but not Accent, or no locator |
| DTC/Consumer Direct | High | No DTC — dealer exclusive | Sells direct, undercuts dealers |
| Consumer Demand | High | High organic search + brand recognition | Unknown brand, no demand |
| Rebates | Medium | ≥5% of annual purchases | No rebate program |
| Co-op | Medium | ≥2% accrual, easy claims | No co-op |
| Rep Score | Admin only | Proactive, knowledgeable, responsive | Unresponsive, no value add |

**Scoring curve:** Average should be 5. Bell-shaped distribution. 10 = perfect, 0 = worst.  
**Missing data rule:** Unverified = 0 (flagged). Confirmed absent = 0.

---

*End of MASTER.md — Update at end of every session.*
