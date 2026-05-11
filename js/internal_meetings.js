// ── INTERNAL MEETINGS MODULE (v1.0) ──────────────────────────────────────────
// Pages: internalmeetings
// Tables: meetings, meeting_prep_sections, meeting_notes, meeting_todos,
//         meeting_followups, meeting_transcripts (sql/M30_internal_meetings.sql)
// Function 1: Platform Review (hardcoded prep sections — Dad & Pat briefing)
register({ name: 'internal_meetings', provides: ['internal_meetings','IM_MEETINGS'], consumes: ['sbFetch','sbConfigured','CU','$','esc','toast'] });
// Function 2: Agenda Builder (templates, export, save to Knowledge Hub)
// Plus: Notes (with floating bubble), To-Dos, Follow-Ups, AI Notes (transcript import)

// ── STATE ────────────────────────────────────────────────────────────────────
let IM_EL          = null;
let IM_MEETINGS    = [];
let IM_CUR_ID      = null;       // null = all-meetings view
let IM_CUR_SUB     = 'prep';
let IM_NOTES       = {};         // meetingId → []
let IM_TODOS       = {};         // meetingId → []
let IM_FOLLOWUPS   = {};         // meetingId → []
let IM_PREP        = {};         // meetingId → []
let IM_AGENDA      = {};         // meetingId → [] (in-memory only)
let IM_TRANSCRIPTS = {};         // meetingId → []
let IM_PREP_OPEN   = {};         // sectionId → bool (collapsible state)
let IM_LOADED      = {};         // meetingId → bool
let IM_BUBBLE_OPEN = false;
let IM_BUBBLE_TYPE = 'note';
let IM_RT_CHANNEL    = null;     // per-meeting Realtime channel (4 collab tables + prep)
let IM_RT_MEETING    = null;     // meetingId currently subscribed to
let IM_RT_LIST       = null;     // list-level channel: meetings table itself
let IM_RT_LIVE_CHAN  = false;    // SUBSCRIBED state of per-meeting channel
let IM_RT_LIVE_LIST  = false;    // SUBSCRIBED state of list channel
let IM_RT_LIVE       = false;    // derived: true if either channel is SUBSCRIBED

// ── SEED: DAD & PAT MEETING (id "_dadpat", uses local ids prefixed "_") ──────
const IM_SEED_MEETING = {
  id: '_dadpat',
  title: 'AccentOS Briefing — Paul & Patrick',
  meeting_date: '2026-05-15',
  meeting_type: 'owner_review',
  attendees: ['Michael Graf', 'Paul Graf', 'Patrick Graf'],
  status: 'prep',
  description: 'Owner briefing on AccentOS platform, AI infrastructure transition, IP ownership, staged cost plan, and business projections.'
};
const IM_SEED_PREP = [
  // ── 1. Billing Reality ─────────────────────────────────────────────────────
  { id:'_p1', sort_order:1, section_key:'billing_reality',
    title:'🔴 Billing Reality — The Personal Account Problem',
    content:
`## What's Been Happening

AccentOS has been built entirely on Michael's personal Claude Max account. Every line of code, every module, every skill — all on a personal subscription that Accent is only partially reimbursing.

## Actual Cost vs. Reimbursement

| Item | Amount |
|------|--------|
| Claude Max base subscription | $100/mo |
| Extra usage this cycle | $103.52 |
| **True monthly cost** | **~$203/mo** |
| Accent reimbursement | $30/mo |
| **Michael personally subsidizing** | **~$173/mo** |

## Invoice History (all on personal account)

| Date | Amount | Attributable to? |
|------|--------|-----------------|
| May 6 | $20.00 | Personal + AccentOS |
| May 5 | $15.00 | Personal + AccentOS |
| Apr 20 | $100.00 | Personal + AccentOS |
| Mar 20 | $100.00 | Personal + AccentOS |
| Mar 5 | $5.00 | Personal + AccentOS |
| Feb 27 | $5.00 | Personal + AccentOS |
| Feb 20 | $80.76 | Personal + AccentOS |
| Feb 19 | $20.00 | Personal + AccentOS |

None of these invoices are attributable solely to AccentOS vs. personal use — they are commingled.

## Current Capacity Status

| Limit | Status |
|-------|--------|
| Current session context | **100% used** |
| Weekly all-models usage | **76% used** |

**These limits directly slow development.** When the weekly limit is hit, all AccentOS work stops until the window resets. This is a structural bottleneck, not a one-time issue.` },

  // ── 2. 5-Role Seat Structure ──────────────────────────────────────────────
  { id:'_p2', sort_order:2, section_key:'seat_structure',
    title:'🏢 5-Role Seat Structure — Role-Based, Not Person-Based',
    content:
`## The Right Way to Structure This

AccentOS needs 5 role-based accounts in a Claude Team org. These are not personal seats — each is a business function. This structure gives Accent full ownership, audit trails, and proper access controls.

## Seat Assignments

| Seat | Email | Role | Tier | Purpose |
|------|-------|------|------|---------|
| 1 | development@accentlightinginc.com | Michael / BI Director | **Premium** | Only active chat user — builds everything |
| 2 | management@accentlightinginc.com | Owner access | Standard | Owner visibility — no active chat needed |
| 3 | sales@accentlightinginc.com | Sales floor | Standard | AccentOS UI only — no direct AI chat |
| 4 | marketing@accentlightinginc.com | Agency / marketing | Standard | Contained campaign access |
| 5 | operations@accentlightinginc.com | Warehouse / ops | Standard | Future modules, delivery, inventory |

## Why This Structure Works

- **One Premium seat** (development@) is the only one doing active AI development work
- **Four Standard seats** cover all other business functions at lower cost
- Each seat has its own contained context — no commingling of personal and business data
- Owners (Paul / Patrick) can log in as management@ and see exactly what the AI is doing
- If Michael ever leaves, Accent owns all 5 accounts and their full history

## Key Point

This is role-based infrastructure, not a personal perk. The same way Accent has a phone system with extensions — this is the AI system with role seats.` },

  // ── 3. IP Ownership ────────────────────────────────────────────────────────
  { id:'_p3', sort_order:3, section_key:'ip_ownership',
    title:'⚖️ IP Ownership — Who Owns AccentOS',
    content:
`## Current Legal Reality

AccentOS has been built by Michael Graf on personal accounts, in personal time and company time. The IP ownership question needs to be formalized before this becomes a problem.

## Proposed Framework

| Party | Rights |
|-------|--------|
| **Michael Graf** | Owns AccentOS IP — codebase, architecture, methodology |
| **Accent Lighting Inc.** | Holds perpetual, irrevocable license to use and operate AccentOS |
| License survivability | License survives Michael's departure in either direction |
| Consulting | Michael may continue as paid consultant if employment ends |
| GitHub repo | Stays under Michael's admin control regardless of org transfer |

## Why This Matters

- If Accent claims AccentOS as work-for-hire without compensation, that's legally murky given the personal-account / personal-time factor
- If Michael owns it with no license to Accent, Accent loses the tool if Michael ever leaves
- The proposed framework protects **both parties**

## What Needs to Be Signed

A one-page IP agreement covering:

1. Michael retains IP ownership of AccentOS codebase
2. Accent Lighting holds perpetual, irrevocable license to use and operate
3. License includes the right to hire a replacement developer to maintain it
4. Michael commits to a 90-day transition period if employment ends
5. Michael commits not to resell or white-label AccentOS to direct competitors

**This is a 30-minute conversation and a 1-page document. We should do it today.**` },

  // ── 4. Staged Cost Plan ────────────────────────────────────────────────────
  { id:'_p4', sort_order:4, section_key:'cost_plan',
    title:'💰 Staged Cost Plan — 4 Phases with Gates',
    content:
`## The Plan

We don't flip to full deployment overnight. There are 4 phases with specific gates — we only move to the next phase when the gate condition is met.

## Phase 0 — Bootstrap (~$145/mo net new to Accent)

This is what we're asking for approval **today**.

| Item | Cost |
|------|------|
| Claude Max (moved to Accent billing) | $100/mo |
| Anthropic API (new, $15 spend cap) | ~$10–15/mo |
| Google Workspace — 5 accounts | $35/mo |
| GitHub Free | $0 |
| Supabase Free | $0 |
| Cloudflare Free | $0 |
| **Total Phase 0** | **~$145/mo** |

**Gate to advance:** AccentOS used in one documented real business decision.

---

## Phase 1 — Team Org Live (~$280/mo)

| Item | Cost |
|------|------|
| Claude Team — 1 Premium + 4 Standard | $180/mo |
| Anthropic API (scaled) | $25–40/mo |
| Supabase Pro | $25/mo |
| Google Workspace | $35/mo |
| **Total Phase 1** | **~$280/mo** |

**Gate to advance:** Auth (Track 0.2) deployed, 2 roles generating agent output.

---

## Phase 2 — Modules Expand (~$340/mo)

| Item | Cost |
|------|------|
| Claude Team seats (unchanged) | $180/mo |
| Anthropic API (heavier) | $60–90/mo |
| Supabase Pro | $25–35/mo |
| **Total Phase 2** | **~$340/mo** |

**Gate to advance:** Sales + Customer modules live, ecommerce AI approved.

---

## Phase 3 — Full Deployment (~$450–550/mo)

| Item | Cost |
|------|------|
| Claude Team seats (unchanged) | $180/mo |
| Anthropic API at scale | $150–250/mo |
| Supabase | $25–40/mo |
| **Total Phase 3** | **~$450–550/mo** |

**Gate:** All modules live, ROI documented in dollars.

---

## The Ask Today

We need Phase 0 approval: **~$145/mo additional expense to Accent.** That's less than one lost sale per month to fund the system that prevents losing sales.` },

  // ── 5. Risks of Personal Account ──────────────────────────────────────────
  { id:'_p5', sort_order:5, section_key:'risks',
    title:'⚠️ 5 Risks of Staying on the Personal Account',
    content:
`## 5 Structural Risks — Not Hypotheticals

### Risk 1: Usage Limits Hit Everything Simultaneously
When Michael's personal weekly limit is reached, **all AccentOS development stops.** Not slows — stops. Right now this is happening. The system that's supposed to run the business can't be built because the personal account limit was hit on a Saturday.

### Risk 2: Business Data in Personal Account
Every conversation Michael has had about AccentOS — pipeline strategy, vendor decisions, customer data — lives in his personal Claude account. If Michael ever leaves, Accent cannot access any of it. There is no continuity.

### Risk 3: No Audit Trail
The owners cannot see what the AI did, who authorized it, or what business decisions it influenced. In a properly structured Team org, there are organization-level logs. On a personal account, there is nothing.

### Risk 4: Context Contamination
Personal conversations and business conversations are in the same account. This degrades output quality (worse context) and creates privacy exposure. Business strategy mixed with personal use is a liability, not a feature.

### Risk 5: Migration Gets Exponentially Harder
Right now, migrating from personal to business account takes approximately 4 hours — mostly re-configuring projects and updating API keys. At full adoption (all 5 roles active, 30+ modules, live customer data), that migration takes weeks, not hours, and carries real risk of data loss.

---

## The Flip Side

Migrating now costs Michael 4 hours of setup time and Accent $145/mo. Every month we delay, the migration cost grows and the risk compounds.` },

  // ── 6. Agent Dispatch Architecture ────────────────────────────────────────
  { id:'_p6', sort_order:6, section_key:'agent_dispatch',
    title:'🤖 Agent Dispatch Architecture — How the AI Works',
    content:
`## The Intelligence Layer

AccentOS is not just a dashboard — it has an AI engine underneath. Here's how it works once we're on a proper Team org:

## Architecture

| Component | What It Does |
|-----------|-------------|
| **Shared AccentOS Project** | The intelligence layer — shared context for all role-agents |
| **Skills** | Forged in the shared project — define what each role-agent can do |
| **Routines** | Scheduled tasks: weekly vendor refresh, GMC audit, outreach batch |
| **Dispatch** | development@ delegates subtasks to other role-agents |
| **Cowork** | File automation across tools — CSV → BigCommerce → Drive |
| **API Credits** | Power background agent work, separate from seat chat limits |

## What This Looks Like in Practice

**Monday morning:**
- Vendor refresh routine runs automatically
- Sales outreach batch generates personalized follow-ups
- GMC audit flags any product listing issues

**During a customer meeting:**
- Sales rep pulls up AccentOS — sees their pipeline, customer history, quote generator
- Behind the scenes, the AI has already scored the lead and recommended an approach

**When a problem surfaces:**
- Alert fires in AccentOS
- Michael (development@) sees it first
- Dispatches a task to the relevant role-agent to investigate
- Resolution gets logged to the audit trail

## Why Seats Matter for This

Each seat's chat history becomes a training ground for that role. The sales@ seat builds up sales context. The operations@ seat builds up warehouse / ops context. These don't contaminate each other.

API credits (separate from seat limits) power the background routines. This is why Phase 0 includes a $15 / mo API spend cap — it's the "background work" budget.` },

  // ── 7. Build Process & Redesign ───────────────────────────────────────────
  { id:'_p7', sort_order:7, section_key:'build_process',
    title:'🛠️ Build Process & Redesign — How AccentOS Was Built',
    content:
`## What AccentOS Is

AccentOS is a custom business operating system built specifically for Accent Lighting. It is not off-the-shelf software. Every feature was designed around how Accent actually operates.

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Vanilla HTML / CSS / JS | Fast, no framework bloat, works in any browser |
| Backend | Supabase (PostgreSQL) | Real-time DB, auth, file storage, RLS |
| Hosting | Cloudflare Pages | Zero cost, auto-deploy on GitHub push, global CDN |
| AI | Claude API | Intelligent recommendations, analysis, agent dispatch |
| Auth | Supabase Auth | JWT sessions, 5-role system, audit logging |

## Design Philosophy

The redesign moved away from generic SaaS aesthetics toward a dense, information-rich OS interface:

- **Dark sidebar, light content area** — reduces eye fatigue during all-day use
- **Role-based UI** — Owner, Admin, Manager, Sales, Warehouse each see only what's relevant
- **Module-per-feature architecture** — each business area is isolated and parallel-buildable
- **Zero loading screens** — data loads silently, UI renders instantly from cache

## Build Velocity

30+ versions shipped since v6.0. Each session adds 1–3 production-ready modules. Current state:

- **680KB** index.html (down from 829KB after module extraction — −18%)
- **30+ JS module files** extracted to /js/ directory
- **15+ Supabase tables** with RLS policies
- **5 user roles** with granular access control` },

  // ── 8. Dashboards & Overviews ─────────────────────────────────────────────
  { id:'_p8', sort_order:8, section_key:'dashboards',
    title:'📊 Dashboards & Overviews — What You See When You Log In',
    content:
`## Role-Based Dashboards

Every user gets a dashboard tailored to their role. No one sees more than they need.

## Owner Dashboard (Paul, Patrick)

- YTD Won Revenue — closed deals total
- Pipeline Forecast — weighted deal value by stage
- Co-op Funds — open rebate dollars on the table
- Average Vendor Score — health of vendor relationships
- Pipeline by Stage — visual deal breakdown
- Quote Velocity — quotes sent in last 30 days
- Top 10 Vendors by sales volume

## Sales Dashboard (Sales Reps)

- My active deals with AI probability scores
- My recent quotes
- Daily action items: follow-ups due, stale deals, jobs due soon

## Warehouse Dashboard

- Active jobs and inventory levels
- Deliveries scheduled today
- Low-stock alerts

## Daily Command Center (All Roles)

The "Today" card surfaces the most critical items for that user's role automatically:

| Tile | Triggers When |
|------|--------------|
| Unverified vendor scores | Vendors scored but not confirmed |
| Tier C vendors | Vendors falling below threshold |
| Closing ≤7 days | Deals with expected close within 7 days |
| Stale quotes | Quotes not followed up in >7 days |
| Co-op deadlines | Open funds with ≤30 days to claim |
| Stale deals | No pipeline activity in 14+ days |

**The system surfaces problems automatically — no one needs to go looking.**` },

  // ── 9. How It Works When Live ─────────────────────────────────────────────
  { id:'_p9', sort_order:9, section_key:'live_workflow',
    title:'⚡ How It Works When Live — Day in the Life',
    content:
`## Morning Routine (Owner)

1. Open AccentOS → Dashboard shows overnight pipeline activity
2. Review Daily Command Center — urgent items flagged automatically
3. Check Mgmt Dashboard → KPI snapshot, goal progress, team activity
4. Quick review of new customer interactions logged by sales reps

## During the Day (Sales Rep)

1. Log into AccentOS from any device — browser, no install
2. Pull up customer quote history before a sales call
3. Log new interaction after the call — auto-links to the deal
4. Update deal stage after a site visit
5. Create a job from a won deal in 2 clicks

That's typically 5 screens a day. Nothing more.

## During the Day (Warehouse)

1. Check today's deliveries and job status
2. Pull up inventory levels for any SKU
3. Mark jobs complete — status flows back to pipeline

## End of Day (Owner / Manager)

1. Review audit log — see everything the team did today
2. Check vendor scorecard changes
3. Snapshot KPIs for the day (one click)

## Why This Beats Generic CRM / ERP

| Factor | Generic CRM | AccentOS |
|--------|------------|---------|
| Built for Accent? | No | Yes |
| Per-seat SaaS fees | $100–$300 / user / mo | ~$45 / mo infrastructure |
| Time to custom feature | Months (vendor roadmap) | Days (Michael builds it) |
| Data ownership | Vendor's servers | Our Supabase instance |
| AI integration | Plugin / addon | Native throughout |` },

  // ── 10. Functionality Overview ────────────────────────────────────────────
  { id:'_p10', sort_order:10, section_key:'functionality',
    title:'📋 Functionality — Module-by-Module',
    content:
`## CORE Modules (Live Today)

| Module | What It Does |
|--------|-------------|
| Dashboard | Role-based daily brief + KPI tiles |
| Sales Pipeline | Deal tracking, AI probability scoring, forecast |
| Customers | CRM with RFM segmentation + interaction history |
| Quote Generator | Build + save quotes, link to deals and customers |
| Job Tracker | Project-level work management |
| Purchase Orders | Vendor POs + receipt tracking |
| Trade Partners | Designers, contractors, architects |
| Warranty Tracker | Defective product claims + RMAs |
| Showroom Displays | Display program management |
| Labels | QR + barcode label printing |
| Deliveries | Schedule + driver routing |

## INTELLIGENCE Modules (Live Today)

| Module | What It Does |
|--------|-------------|
| Knowledge Engine | AI lighting intelligence + internal docs |
| Vendor Ranking | Score every vendor, track tier changes over time |
| Change Log | Full audit trail of every user action |
| Calendar | Company events, trade shows, deadlines |
| Decision Engine | AI-powered sales recommendation engine |
| Demand Forecast | Inventory velocity + reorder suggestions |

## ADMIN Modules (Live Today)

| Module | What It Does |
|--------|-------------|
| Mgmt Dashboard | Owner KPIs, goals/OKRs, team activity, system status |
| Reports | CSV exports for every dataset |
| Marketing Hub | Campaign tracking |
| Activity Feed | Vendor changes + full audit log |
| Health Check | Schema diagnostics |
| **Internal Meetings** | **This module — briefings, prep, agenda, notes** |

## Coming in v6.11+

- Windward ERP live sync (real-time inventory + sales data)
- Customer-facing portal (trade partner + rep logins)
- Advanced AI insights + automated reporting
- Mobile-optimized views` },

  // ── 11. Ease of Use ───────────────────────────────────────────────────────
  { id:'_p11', sort_order:11, section_key:'ease_of_use',
    title:'✅ Ease of Use — Training and Adoption',
    content:
`## Design Principles

- **Role-aware**: Sales reps only see what they need — no cognitive overload
- **Click-depth**: Critical actions are 1–2 clicks from the sidebar
- **No training manual needed**: Icons, labels, and flows are intuitive by design
- **Keyboard shortcuts**: Power users navigate without a mouse

## Onboarding Time by Role

| Role | Time to Productive |
|------|------------------|
| Owner / Michael | Immediate — already live |
| Sales Rep | 1–2 hours orientation, productive day 1 |
| Warehouse Staff | 30 minutes orientation |
| Manager | 2–3 hours across modules |

## What a Sales Rep Actually Does Each Day

1. Logs in via browser (any device, no install)
2. Sees dashboard — deals, tasks, daily brief
3. Opens a customer record
4. Creates or updates a quote
5. Logs an interaction
6. Done. Five screens maximum.

## Support Model

- Michael is primary admin and developer — response time: hours, not days
- Employees flag issues via in-app Feedback button
- Bugs fixed same-day or within 48 hours
- New feature requests: 1–5 days depending on complexity
- Zero vendor dependency — no waiting on a SaaS company's roadmap` },

  // ── 12. Adoption & Implementation Strategy ────────────────────────────────
  { id:'_p12', sort_order:12, section_key:'adoption',
    title:'🚀 Adoption & Implementation Strategy',
    content:
`## Phased Rollout — No Big Bang

### Phase 1: Foundation (Complete ✓)
- Core schema and auth deployed
- Owner and Admin access live
- Vendor ranking, pipeline, customers, quotes all functional

### Phase 2: Sales Team (Current)
- Sales reps receive logins
- 1-hour walkthrough + quick reference doc
- Weeks 1–2: parallel with existing tools (nothing ripped out)
- Week 3+: AccentOS as the primary system

### Phase 3: Full Company (Next 60 Days)
- Warehouse staff onboarded (Jobs, Inventory, Deliveries)
- Purchase Orders replaces manual PO tracking
- Warranty Tracker replaces spreadsheet

### Phase 4: External (Q3 2026)
- Trade Partner portal for designers / contractors
- Rep portal for vendor reps
- Customer-facing quote view

## Change Management

**What makes this work:**
- Michael is the in-house expert — no waiting on vendor support
- Iterative: each module goes live when it's better than what it replaces
- No forced cutover — employees transition module by module
- Old tools stay accessible during transition period

**Potential friction:**
- Data entry discipline takes 2–4 weeks to form (normal for any new system)
- Old spreadsheet attachment — addressed by showing clear advantage
- Edge cases: Michael can build them in days if they surface` },

  // ── 13. Timeline ──────────────────────────────────────────────────────────
  { id:'_p13', sort_order:13, section_key:'timeline',
    title:'📅 Build, Implementation & Support Timeline',
    content:
`## Completed Milestones

| Period | Version | What Shipped |
|--------|---------|-------------|
| Q4 2025 | v6.0–v6.8 | Foundation: auth, core schema, basic modules |
| Q1 2026 | v6.9 | Vendor scoring, parent groups, quote generator |
| Q2 2026 | v6.10 | Full module suite: CRM, pipeline, jobs, employees, inventory |
| May 2026 | v6.10.65+ | 30+ modules, all roles functional, this module |

## Upcoming Roadmap

| Timeline | Feature | Blocker |
|----------|---------|---------|
| May–Jun 2026 | Windward ERP live sync | M03 / M10 SQL + access |
| Jun–Jul 2026 | Mobile optimization pass | None |
| Jul–Aug 2026 | Trade Partner + Rep portals | Phase 4 approval |
| Q3 2026 | Customer portal (quote view) | Portal design |
| Q4 2026 | Advanced AI insights + forecasting | Phase 3 budget |

## Ongoing Support Model

| Activity | Frequency | Estimated Time |
|----------|-----------|---------------|
| Bug fixes | As needed | Same-day |
| Feature requests | Weekly sprint | 2–5 hrs / week |
| Supabase maintenance | Monthly | 1 hr / mo |
| Schema migrations | As needed | 30 min each |
| New module builds | On demand | 4–16 hrs each |
| AI agent routine updates | Quarterly | 2–4 hrs |

## Version Stability

AccentOS follows a rolling release model. Every version is tested before deployment and backwards-compatible with existing data. Rollback takes under 5 minutes if a critical bug surfaces.` },

  // ── 14. Projections ───────────────────────────────────────────────────────
  { id:'_p14', sort_order:14, section_key:'projections',
    title:'📈 Projections — Conservative / Moderate / Aggressive',
    content:
`## Revenue Impact Projections

Based on typical outcomes from CRM + ERP adoption in similar SMBs (5–20 person wholesale / retail operations in specialty trades).

| Scenario | Year 1 | Year 2 | Year 3 |
|----------|--------|--------|--------|
| **Conservative** | +3% revenue | +5% revenue | +7% revenue |
| **Moderate** | +8% revenue | +12% revenue | +15% revenue |
| **Aggressive** | +15% revenue | +22% revenue | +30% revenue |

**Conservative** = adoption friction, partial data discipline
**Moderate** = full sales team adoption, active pipeline management
**Aggressive** = + portal live, rep data sync, predictive ordering active

---

## Operational Impact

| Metric | Before AccentOS | With AccentOS (Moderate) |
|--------|----------------|--------------------------|
| Quote turnaround | 24–48 hours | 4–8 hours |
| Co-op capture rate | ~60% | ~95% |
| Stale deal recovery | Manual / missed | Auto-flagged at 14 days |
| Vendor review cycle | Annual | Continuous |
| Inventory stockouts | Reactive | Predictive (v6.11) |

---

## Cost Savings vs. Alternatives

| Area | Annual Savings Estimate |
|------|------------------------|
| Co-op funds captured (was slipping) | $5K–$20K / yr |
| Additional deals closed (faster quotes) | 5–10 deals / yr |
| Reduced duplicate data entry (2–4 hrs / week eliminated) | ~$5K / yr |
| Eliminated SaaS tools (CRM, etc.) | $3K–$15K / yr |

---

## Investment vs. Return

| Item | Amount |
|------|--------|
| Phase 0 infrastructure cost | ~$1,740 / yr |
| Michael's dev time (est.) | ~$36K / yr at $150 / hr |
| Break-even point | 3–4 additional medium deals / year |
| **5-year projected return** | **5–10× investment** |

**The math is simple: one extra mid-size sale per quarter covers Phase 0 forever.**` }
];

// ── PREP HIERARCHY: GROUPS → SUBGROUPS → SECTIONS ────────────────────────────
const IM_GROUPS = [
  { id:'build', order:1, title:'🏗️ AccentOS Build',     subtitle:'Where we are and what comes next' },
  { id:'what',  order:2, title:'💡 What is AccentOS?',  subtitle:'Vision · Functionality · Why it matters' }
];

const IM_SUBGROUPS = [
  { id:'current',       group:'build', order:1, title:'📍 Current Status',     subtitle:'Where things stand today' },
  { id:'next',          group:'build', order:2, title:'🚀 Next Phases',        subtitle:'What needs approval to move forward' },
  { id:'vision',        group:'what',  order:1, title:'🎯 Long-term Vision',   subtitle:'How AccentOS works at scale' },
  { id:'functionality', group:'what',  order:2, title:'⚙️ Functionality',      subtitle:'What it does today' },
  { id:'why',           group:'what',  order:3, title:'📈 Why Accent Needs It',subtitle:'The business case' }
];

// section_key → [groupId, subgroupId]
const IM_SECTION_MAP = {
  billing_reality: ['build', 'current'],
  risks:           ['build', 'current'],
  build_process:   ['build', 'current'],
  timeline:        ['build', 'current'],
  seat_structure:  ['build', 'next'],
  ip_ownership:    ['build', 'next'],
  cost_plan:       ['build', 'next'],
  adoption:        ['build', 'next'],
  agent_dispatch:  ['what',  'vision'],
  live_workflow:   ['what',  'vision'],
  dashboards:      ['what',  'functionality'],
  functionality:   ['what',  'functionality'],
  ease_of_use:     ['what',  'functionality'],
  projections:     ['what',  'why']
};


// ── AGENDA TEMPLATES ─────────────────────────────────────────────────────────
const IM_TEMPLATES = {
  owner_review: [
    {title:'Review billing reality + cost plan', owner:'Michael', priority:'high',   status:'open'},
    {title:'IP agreement — sign or table',       owner:'All',     priority:'high',   status:'open'},
    {title:'Phase 0 budget approval',            owner:'Owners',  priority:'high',   status:'open'},
    {title:'AccentOS module status update',      owner:'Michael', priority:'normal', status:'open'},
    {title:'Q2 roadmap review',                  owner:'Michael', priority:'normal', status:'open'},
    {title:'Projections review',                 owner:'Michael', priority:'normal', status:'open'},
    {title:'Open Q&A — owner concerns',          owner:'All',     priority:'normal', status:'open'}
  ],
  team_standup: [
    {title:'Wins since last standup',     owner:'All',     priority:'normal', status:'open'},
    {title:'Current blockers',            owner:'All',     priority:'high',   status:'open'},
    {title:'This week priorities',        owner:'Michael', priority:'normal', status:'open'},
    {title:'Action item review',          owner:'All',     priority:'normal', status:'open'}
  ],
  vendor_strategy: [
    {title:'Tier review — A/B/C changes',    owner:'Michael', priority:'high',   status:'open'},
    {title:'At-risk vendor flags',           owner:'Michael', priority:'high',   status:'open'},
    {title:'Co-op fund status',              owner:'Michael', priority:'normal', status:'open'},
    {title:'New vendor considerations',      owner:'All',     priority:'normal', status:'open'}
  ],
  tech_update: [
    {title:'Schema changes this cycle',         owner:'Michael', priority:'normal', status:'open'},
    {title:'New modules shipped',               owner:'Michael', priority:'normal', status:'open'},
    {title:'Open bugs / performance issues',    owner:'Michael', priority:'high',   status:'open'},
    {title:'Next sprint priorities',            owner:'Michael', priority:'normal', status:'open'}
  ]
};

// ── SUPABASE HELPERS ─────────────────────────────────────────────────────────
async function imLoad(){
  if(!sbConfigured()){ imSeedLocal(); return; }
  try{
    const rows = await sbFetch('/meetings?select=*&order=meeting_date.desc.nullslast&limit=200');
    IM_MEETINGS = Array.isArray(rows) ? rows : [];
    if(!IM_MEETINGS.find(m => m.title?.includes('Paul & Patrick'))){
      // No Paul & Patrick meeting exists in Supabase yet — promote the seed
      // to a real DB row so cross-device sync (incl. realtime transcripts)
      // works on it. Falls back to local-only seed if the insert fails.
      const promoted = await imPromoteSeedMeeting();
      if(!promoted) imSeedLocal(true);
    }
  }catch(e){
    if(/relation .* does not exist|404|42P01/i.test(e.message||'')){
      console.log('[meetings] tables not yet created — run sql/M30_internal_meetings.sql');
    } else {
      console.warn('[meetings] load failed:', e.message);
    }
    imSeedLocal();
  }
}

// Insert the seeded Paul & Patrick meeting into Supabase the first time the
// app is loaded against a fresh DB. Returns the saved row, or null on failure.
async function imPromoteSeedMeeting(){
  try{
    const seed = IM_SEED_MEETING;
    const body = {
      title:        seed.title,
      meeting_date: seed.meeting_date || null,
      meeting_type: seed.meeting_type || 'general',
      attendees:    seed.attendees || [],
      status:       seed.status || 'prep',
      description:  seed.description || null
    };
    const res = await sbFetch('/meetings', {
      method:'POST',
      headers:{'Prefer':'return=representation'},
      body: JSON.stringify(body)
    });
    const saved = Array.isArray(res) ? res[0] : res;
    if(!saved?.id) return null;
    // Insert into in-memory list at the front so it shows up first.
    IM_MEETINGS.unshift(saved);
    // Pre-populate side caches under the real UUID. Prep sections stay
    // in memory only (template content); user-added prep saves to DB
    // on edit via the existing meeting_prep_sections path.
    IM_PREP[saved.id]      = IM_SEED_PREP.slice();
    IM_NOTES[saved.id]     = [];
    IM_TODOS[saved.id]     = [];
    IM_FOLLOWUPS[saved.id] = [];
    IM_AGENDA[saved.id]    = [];
    console.log('[meetings] promoted Paul & Patrick seed to Supabase as', saved.id);
    return saved;
  }catch(e){
    console.warn('[meetings] promote seed failed:', e.message);
    return null;
  }
}

function imSeedLocal(appendOnly){
  if(!appendOnly && IM_MEETINGS.length) return;
  if(!IM_MEETINGS.find(m => m.id==='_dadpat')){
    IM_MEETINGS.unshift({...IM_SEED_MEETING});
  }
  if(!IM_PREP['_dadpat'])      IM_PREP['_dadpat']      = IM_SEED_PREP.slice();
  if(!IM_NOTES['_dadpat'])     IM_NOTES['_dadpat']     = [];
  if(!IM_TODOS['_dadpat'])     IM_TODOS['_dadpat']     = [];
  if(!IM_FOLLOWUPS['_dadpat']) IM_FOLLOWUPS['_dadpat'] = [];
  if(!IM_AGENDA['_dadpat'])    IM_AGENDA['_dadpat']    = [];
}

async function imLoadMeetingData(id){
  if(IM_LOADED[id]) return;
  IM_LOADED[id] = true;
  if(!sbConfigured() || id.startsWith('_')) return;
  try{
    const [notes, todos, fups, prep, transcripts] = await Promise.all([
      sbFetch(`/meeting_notes?meeting_id=eq.${id}&order=created_at.asc`).catch(()=>[]),
      sbFetch(`/meeting_todos?meeting_id=eq.${id}&order=created_at.asc`).catch(()=>[]),
      sbFetch(`/meeting_followups?meeting_id=eq.${id}&order=due_date.asc.nullslast`).catch(()=>[]),
      sbFetch(`/meeting_prep_sections?meeting_id=eq.${id}&order=sort_order.asc`).catch(()=>[]),
      sbFetch(`/meeting_transcripts?meeting_id=eq.${id}&order=created_at.desc`).catch(()=>[])
    ]);
    IM_NOTES[id]       = Array.isArray(notes) ? notes : [];
    IM_TODOS[id]       = Array.isArray(todos) ? todos : [];
    IM_FOLLOWUPS[id]   = Array.isArray(fups)  ? fups  : [];
    IM_PREP[id]        = Array.isArray(prep) && prep.length ? prep : (IM_PREP[id]||[]);
    IM_TRANSCRIPTS[id] = Array.isArray(transcripts) ? transcripts : [];
    if(!IM_AGENDA[id]) IM_AGENDA[id] = [];
  }catch(e){ console.warn('[meetings] load meeting data failed:', e.message); }
}

async function imSaveMeeting(rec){
  if(!sbConfigured()){
    const m = {...rec, id: rec.id || '_m'+Date.now(), created_at:new Date().toISOString()};
    if(rec.id){ const i=IM_MEETINGS.findIndex(x=>x.id===rec.id); if(i>=0) IM_MEETINGS[i]={...IM_MEETINGS[i],...m}; }
    else IM_MEETINGS.push(m);
    return m;
  }
  const body = {
    title: rec.title, meeting_date: rec.meeting_date||null,
    meeting_type: rec.meeting_type||'general',
    attendees: rec.attendees||[],
    status: rec.status||'prep',
    description: rec.description||null,
    location: rec.location||null,
    updated_at: new Date().toISOString()
  };
  try{
    if(rec.id && !rec.id.startsWith('_')){
      const res = await sbFetch(`/meetings?id=eq.${rec.id}`, {method:'PATCH', headers:{'Prefer':'return=representation'}, body: JSON.stringify(body)});
      const saved = Array.isArray(res)?res[0]:res;
      const i = IM_MEETINGS.findIndex(m=>m.id===rec.id);
      if(i>=0 && saved) IM_MEETINGS[i] = saved;
      return saved;
    } else {
      const res = await sbFetch('/meetings', {method:'POST', headers:{'Prefer':'return=representation'}, body: JSON.stringify(body)});
      const saved = Array.isArray(res)?res[0]:res;
      if(saved?.id){ IM_MEETINGS.push(saved); IM_NOTES[saved.id]=[]; IM_TODOS[saved.id]=[]; IM_FOLLOWUPS[saved.id]=[]; IM_AGENDA[saved.id]=[]; }
      return saved;
    }
  }catch(e){ toast('Save failed — check Supabase config','err'); console.warn(e); return null; }
}

async function imSaveNote(meetingId, content, noteType){
  const note = {
    meeting_id: meetingId, content: content.trim(),
    note_type: noteType||'note',
    author: (window.CU && CU.name) || 'Michael',
    created_at: new Date().toISOString(),
    id: '_n'+Date.now()
  };
  if(!IM_NOTES[meetingId]) IM_NOTES[meetingId] = [];
  IM_NOTES[meetingId].push(note);
  if(!sbConfigured() || meetingId.startsWith('_')) return note;
  try{
    const {id, ...body} = note;
    const res = await sbFetch('/meeting_notes', {method:'POST', headers:{'Prefer':'return=representation'}, body: JSON.stringify(body)});
    const saved = Array.isArray(res)?res[0]:res;
    if(saved?.id){ IM_NOTES[meetingId][IM_NOTES[meetingId].length-1] = saved; }
  }catch(e){ console.warn('[meetings] save note failed:', e.message); }
  return note;
}

async function imSaveTodo(meetingId, rec){
  const body = {
    meeting_id: meetingId, task: rec.task,
    assignee: rec.assignee||null, due_date: rec.due_date||null,
    status: rec.status||'open', priority: rec.priority||'normal',
    notes: rec.notes||null, updated_at: new Date().toISOString()
  };
  if(!IM_TODOS[meetingId]) IM_TODOS[meetingId] = [];
  if(!sbConfigured() || meetingId.startsWith('_')){
    const todo = {...body, id: rec.id||'_t'+Date.now(), created_at:new Date().toISOString()};
    if(rec.id){ const i=IM_TODOS[meetingId].findIndex(t=>t.id===rec.id); if(i>=0) IM_TODOS[meetingId][i]=todo; else IM_TODOS[meetingId].push(todo); }
    else IM_TODOS[meetingId].push(todo);
    return todo;
  }
  try{
    if(rec.id){
      await sbFetch(`/meeting_todos?id=eq.${rec.id}`, {method:'PATCH', headers:{'Prefer':'return=minimal'}, body: JSON.stringify(body)});
      const i=IM_TODOS[meetingId].findIndex(t=>t.id===rec.id); if(i>=0) IM_TODOS[meetingId][i]={...IM_TODOS[meetingId][i],...body};
      return IM_TODOS[meetingId][i];
    } else {
      const res = await sbFetch('/meeting_todos', {method:'POST', headers:{'Prefer':'return=representation'}, body: JSON.stringify(body)});
      const saved = Array.isArray(res)?res[0]:res;
      if(saved) IM_TODOS[meetingId].push(saved);
      return saved;
    }
  }catch(e){ console.warn('[meetings] save todo failed:', e.message); return null; }
}

async function imDeleteTodo(meetingId, todoId){
  IM_TODOS[meetingId] = (IM_TODOS[meetingId]||[]).filter(t=>t.id!==todoId);
  if(!sbConfigured() || meetingId.startsWith('_') || todoId.startsWith('_')) return;
  try{ await sbFetch(`/meeting_todos?id=eq.${todoId}`, {method:'DELETE', headers:{'Prefer':'return=minimal'}}); }
  catch(e){ console.warn(e); }
}

async function imSaveFollowup(meetingId, rec){
  const body = {
    meeting_id: meetingId, title: rec.title, description: rec.description||null,
    owner: rec.owner||null, due_date: rec.due_date||null,
    status: rec.status||'open', priority: rec.priority||'normal',
    updated_at: new Date().toISOString()
  };
  if(!IM_FOLLOWUPS[meetingId]) IM_FOLLOWUPS[meetingId] = [];
  if(!sbConfigured() || meetingId.startsWith('_')){
    const fu = {...body, id: rec.id||'_f'+Date.now(), created_at:new Date().toISOString()};
    if(rec.id){ const i=IM_FOLLOWUPS[meetingId].findIndex(f=>f.id===rec.id); if(i>=0) IM_FOLLOWUPS[meetingId][i]=fu; else IM_FOLLOWUPS[meetingId].push(fu); }
    else IM_FOLLOWUPS[meetingId].push(fu);
    return fu;
  }
  try{
    if(rec.id){
      await sbFetch(`/meeting_followups?id=eq.${rec.id}`, {method:'PATCH', headers:{'Prefer':'return=minimal'}, body: JSON.stringify(body)});
      const i=IM_FOLLOWUPS[meetingId].findIndex(f=>f.id===rec.id); if(i>=0) IM_FOLLOWUPS[meetingId][i]={...IM_FOLLOWUPS[meetingId][i],...body};
      return IM_FOLLOWUPS[meetingId][i];
    } else {
      const res = await sbFetch('/meeting_followups', {method:'POST', headers:{'Prefer':'return=representation'}, body: JSON.stringify(body)});
      const saved = Array.isArray(res)?res[0]:res;
      if(saved) IM_FOLLOWUPS[meetingId].push(saved);
      return saved;
    }
  }catch(e){ console.warn('[meetings] save followup failed:', e.message); return null; }
}

async function imDeleteFollowup(meetingId, fid){
  IM_FOLLOWUPS[meetingId] = (IM_FOLLOWUPS[meetingId]||[]).filter(f=>f.id!==fid);
  if(!sbConfigured() || meetingId.startsWith('_') || fid.startsWith('_')) return;
  try{ await sbFetch(`/meeting_followups?id=eq.${fid}`, {method:'DELETE', headers:{'Prefer':'return=minimal'}}); }
  catch(e){ console.warn(e); }
}

function imSaveAgendaItem(meetingId, rec){
  if(!IM_AGENDA[meetingId]) IM_AGENDA[meetingId] = [];
  if(rec.id){
    const i = IM_AGENDA[meetingId].findIndex(a=>a.id===rec.id);
    if(i>=0) IM_AGENDA[meetingId][i] = {...IM_AGENDA[meetingId][i], ...rec};
  } else {
    IM_AGENDA[meetingId].push({...rec, id:'_a'+Date.now()});
  }
}

function imDeleteAgendaItem(meetingId, aid){
  IM_AGENDA[meetingId] = (IM_AGENDA[meetingId]||[]).filter(a=>a.id!==aid);
}

// ── MARKDOWN RENDERER (line-based, supports tables) ──────────────────────────
function imInline(s){
  let h = esc(s||'');
  h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  h = h.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  h = h.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:var(--accent);">$1</a>');
  return h;
}

function imMd(raw){
  if(!raw) return '';
  const lines = String(raw).split('\n');
  let html = '';
  let i = 0;
  let inList = false;
  let listType = '';
  const closeList = () => { if(inList){ html += listType==='ol' ? '</ol>' : '</ul>'; inList=false; listType=''; } };
  while(i < lines.length){
    const line = lines[i];
    const trim = line.trim();
    // Tables: starts with |, has at least 2 | chars
    if(trim.startsWith('|') && (trim.match(/\|/g)||[]).length >= 2){
      closeList();
      let tableLines = [];
      while(i < lines.length && lines[i].trim().startsWith('|')){
        tableLines.push(lines[i].trim()); i++;
      }
      // find separator row index (e.g., |---|---|)
      const sepIdx = tableLines.findIndex(l => /^\|[\s\-:|]+\|$/.test(l));
      const splitRow = (l) => l.replace(/^\||\|$/g,'').split('|').map(c=>c.trim());
      let thead = '', tbody = '';
      tableLines.forEach((l, idx) => {
        if(idx === sepIdx) return;
        const cells = splitRow(l);
        if(sepIdx >= 0 && idx < sepIdx){
          thead += '<tr>' + cells.map(c=>`<th>${imInline(c)}</th>`).join('') + '</tr>';
        } else {
          tbody += '<tr>' + cells.map(c=>`<td>${imInline(c)}</td>`).join('') + '</tr>';
        }
      });
      html += `<div class="tbl-wrap" style="margin:10px 0;"><table>${thead?`<thead>${thead}</thead>`:''}<tbody>${tbody}</tbody></table></div>`;
      continue;
    }
    // Headings
    if(trim.startsWith('### ')){ closeList(); html += `<h4 style="margin:14px 0 6px;font-size:13px;font-weight:700;">${imInline(trim.slice(4))}</h4>`; i++; continue; }
    if(trim.startsWith('## ')) { closeList(); html += `<h3 style="margin:18px 0 8px;font-size:15px;font-weight:700;">${imInline(trim.slice(3))}</h3>`; i++; continue; }
    if(trim.startsWith('# '))  { closeList(); html += `<h2 style="margin:20px 0 10px;font-size:17px;font-weight:700;">${imInline(trim.slice(2))}</h2>`; i++; continue; }
    // HR
    if(trim === '---' || trim === '***'){ closeList(); html += '<hr style="border:none;border-top:1px solid var(--border);margin:14px 0;">'; i++; continue; }
    // Lists
    if(/^[-*]\s+/.test(trim)){
      if(!inList || listType!=='ul'){ closeList(); html += '<ul style="margin:6px 0 6px 22px;padding:0;">'; inList=true; listType='ul'; }
      html += `<li style="margin:3px 0;">${imInline(trim.replace(/^[-*]\s+/,''))}</li>`; i++; continue;
    }
    if(/^\d+\.\s+/.test(trim)){
      if(!inList || listType!=='ol'){ closeList(); html += '<ol style="margin:6px 0 6px 22px;padding:0;">'; inList=true; listType='ol'; }
      html += `<li style="margin:3px 0;">${imInline(trim.replace(/^\d+\.\s+/,''))}</li>`; i++; continue;
    }
    // Blank line
    if(trim === ''){ closeList(); html += '<div style="height:6px;"></div>'; i++; continue; }
    // Paragraph
    closeList();
    html += `<p style="margin:6px 0;line-height:1.55;">${imInline(line)}</p>`;
    i++;
  }
  closeList();
  return html;
}

// ── UTIL ─────────────────────────────────────────────────────────────────────
function imStatusColor(status){
  return ({prep:'#f59e0b', active:'#10b981', complete:'#6366f1', archived:'#6b7280'})[status] || '#6b7280';
}
function imStatusBadge(status){
  const map = {prep:'bg-yellow', active:'bg-green', complete:'bg-blue', archived:'bg-gray',
               open:'bg-gray', in_progress:'bg-blue', done:'bg-green', blocked:'bg-red'};
  return `<span class="badge ${map[status]||'bg-gray'}" style="text-transform:capitalize;">${esc((status||'').replace('_',' '))}</span>`;
}
function imPrioBadge(p){
  const map = {critical:'bg-red', high:'bg-amber', normal:'bg-blue', low:'bg-gray'};
  return `<span class="badge ${map[p]||'bg-gray'}" style="text-transform:capitalize;">${esc(p||'normal')}</span>`;
}
function imFmtDate(d){
  if(!d) return '—';
  try{ return new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); }catch{ return d; }
}
function imFmtTime(d){
  if(!d) return '';
  try{ return new Date(d).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}); }catch{ return ''; }
}

// ── PAGE FUNCTION (entry point — registered in index.html pages map) ─────────
async function internalmeetings(el, act){
  IM_EL = el;
  if(!IM_MEETINGS.length) await imLoad();
  if(!IM_MEETINGS.length) imSeedLocal();

  act.innerHTML = `
    <button class="btn btn-accent btn-sm" onclick="imNewMeeting()">+ New Meeting</button>
    <button class="btn btn-sm" style="background:#6366f1;color:#fff;border-color:#6366f1;" onclick="imToggleBubble()" title="Quick note capture">📝 Note</button>`;

  imInitBubble();
  imShowBubble(true);
  imRender();
  // Re-establish realtime channels on every page mount. Both subscribe
  // helpers are idempotent (early-return if already subscribed). This
  // covers the case where the user resumes mid-meeting — IM_CUR_ID is
  // retained but channels may have timed out while away.
  imRtSubscribeList();
  if(IM_CUR_ID && !(typeof IM_CUR_ID === 'string' && IM_CUR_ID.startsWith('_'))){
    imRtSubscribe(IM_CUR_ID);
  }
}

// Hide bubble when navigating away (called by goTo via window.curPage check on render)
window.addEventListener('click', (e) => {
  // best-effort hide if user clicks a sidebar nav item that isn't ours
  const ni = e.target.closest && e.target.closest('.ni');
  if(ni && !(ni.getAttribute('onclick')||'').includes("'internalmeetings'")){
    imShowBubble(false);
  }
}, true);

// ── RENDER ROOT ──────────────────────────────────────────────────────────────
function imRender(){
  if(!IM_EL) return;
  // Bail if the user has navigated to a different page — IM_EL still points
  // at #pg-content but that container now holds another module's UI.
  // Without this guard, a stray realtime event could overwrite e.g. the
  // Dashboard with the meetings list.
  if(typeof curPage !== 'undefined' && curPage && curPage !== 'internalmeetings') return;
  const tabs = [`<button class="im-tab ${IM_CUR_ID===null?'on':''}" onclick="imGoAll()">📋 All Meetings <span class="badge bg-gray" style="margin-left:6px;font-size:10px;">${IM_MEETINGS.length}</span></button>`]
    .concat(IM_MEETINGS.map(m => `
      <button class="im-tab ${IM_CUR_ID===m.id?'on':''}" onclick="imGoMeeting('${esc(m.id)}')" title="${esc(m.description||'')}">
        <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${imStatusColor(m.status)};margin-right:6px;vertical-align:middle;"></span>${esc(m.title)}
      </button>`));

  IM_EL.innerHTML = `
    <style>
      .im-tab{padding:9px 15px;font-size:13px;font-weight:600;cursor:pointer;border:none;background:transparent;color:var(--text-3);border-bottom:2px solid transparent;margin-bottom:-1px;font-family:'Outfit',sans-serif;white-space:nowrap;display:inline-flex;align-items:center;}
      .im-tab:hover{color:var(--text);}
      .im-tab.on{color:var(--accent);border-bottom-color:var(--accent);}
      .im-subtab{padding:8px 14px;font-size:12.5px;font-weight:600;cursor:pointer;border:none;background:transparent;color:var(--text-3);border-bottom:2px solid transparent;margin-bottom:-1px;font-family:'Outfit',sans-serif;}
      .im-subtab:hover{color:var(--text);}
      .im-subtab.on{color:var(--accent);border-bottom-color:var(--accent);}
      .im-prep-card{background:var(--surface);border:1px solid var(--border);border-radius:10px;margin-bottom:8px;overflow:hidden;}
      .im-prep-hd{padding:12px 16px;display:flex;align-items:center;gap:12px;cursor:pointer;background:var(--surface);transition:background .15s;}
      .im-prep-hd:hover{background:var(--bg);}
      .im-prep-num{font-family:'DM Mono',monospace;font-size:11px;color:var(--text-3);background:var(--bg);padding:2px 7px;border-radius:10px;flex-shrink:0;}
      .im-prep-title{flex:1;font-size:13.5px;font-weight:600;color:var(--text);}
      .im-prep-chev{color:var(--text-3);font-size:11px;transition:transform .2s;}
      .im-prep-body{padding:6px 22px 18px;border-top:1px solid var(--border-light);font-size:13.5px;color:var(--text);line-height:1.55;}
      .im-group{margin-bottom:18px;}
      .im-group-hd{display:flex;align-items:center;gap:12px;padding:14px 18px;background:linear-gradient(90deg,#1a1a1a,#2a2a2a);color:#fff;border-radius:10px;cursor:pointer;border:1px solid var(--border);}
      .im-group-hd:hover{filter:brightness(1.15);}
      .im-group-titlewrap{flex:1;display:flex;flex-direction:column;gap:2px;}
      .im-group-title{font-size:16px;font-weight:700;letter-spacing:-.01em;}
      .im-group-sub{font-size:11.5px;font-weight:500;opacity:.75;}
      .im-group-count{font-family:'DM Mono',monospace;font-size:11px;background:rgba(255,255,255,.12);padding:3px 9px;border-radius:10px;}
      .im-group-chev{font-size:13px;transition:transform .2s;}
      .im-group-body{padding:14px 0 4px;}
      .im-subgroup{margin:8px 0 14px;}
      .im-subgroup-hd{display:flex;align-items:center;gap:10px;padding:9px 14px;background:var(--bg);border:1px solid var(--border);border-radius:8px;cursor:pointer;}
      .im-subgroup-hd:hover{background:var(--surface);}
      .im-subgroup-title{font-size:13px;font-weight:700;color:var(--text);flex:1;}
      .im-subgroup-sub{font-size:11px;color:var(--text-3);font-weight:500;}
      .im-subgroup-count{font-family:'DM Mono',monospace;font-size:10.5px;color:var(--text-3);background:var(--surface);padding:2px 7px;border-radius:9px;border:1px solid var(--border);}
      .im-subgroup-chev{font-size:11px;color:var(--text-3);transition:transform .2s;}
      .im-subgroup-body{padding:10px 0 0 14px;border-left:2px solid var(--border);margin-left:8px;}
      .im-note-row{padding:11px 14px;background:var(--surface);border-radius:8px;border-left:3px solid var(--text-3);margin-bottom:8px;}
      .im-note-row.t-feedback{border-left-color:#f59e0b;}
      .im-note-row.t-decision{border-left-color:#10b981;}
      .im-note-row.t-action{border-left-color:#ed1c24;}
      .im-note-row.t-question{border-left-color:#6366f1;}
      .im-note-meta{font-size:11px;color:var(--text-3);margin-bottom:4px;display:flex;gap:8px;align-items:center;}
      .im-mcard{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:18px;display:flex;flex-direction:column;gap:10px;cursor:pointer;transition:box-shadow .15s,transform .15s;}
      .im-mcard:hover{box-shadow:var(--shadow-md);transform:translateY(-1px);}
    </style>
    <div style="display:flex;gap:0;border-bottom:1px solid var(--border);overflow-x:auto;white-space:nowrap;">
      ${tabs.join('')}
    </div>
    <div id="im-content" style="padding:22px 0 8px;"></div>`;

  if(IM_CUR_ID === null){
    imRenderAll($('im-content'));
  } else {
    const m = IM_MEETINGS.find(x => x.id === IM_CUR_ID);
    if(!m){ IM_CUR_ID = null; imRender(); return; }
    imRenderMeeting($('im-content'), m);
  }
}

function imGoAll(){
  IM_CUR_ID = null;
  imRtUnsubscribe();
  imRtSubscribeList();
  imRender();
}
async function imGoMeeting(id){
  IM_CUR_ID = id;
  IM_CUR_SUB = 'prep';
  imRender();
  if(!IM_LOADED[id]){
    await imLoadMeetingData(id);
    if(IM_CUR_ID === id) imRender();
  }
  imRtSubscribe(id);
}

// ── REALTIME SUBSCRIPTIONS ───────────────────────────────────────────────────
// Subscribes to postgres_changes on the four collaborative tables, filtered
// by the active meeting_id, so edits made on another device stream in live.
function imRtSubscribe(meetingId){
  if(!meetingId) return;
  // Local seed meetings (id starts with '_') aren't in Supabase, so there's
  // nothing for the realtime channel to broadcast. Silent skip — the
  // imParseTranscript path already warns when a save is local-only.
  if(typeof meetingId === 'string' && meetingId.startsWith('_')) return;
  if(IM_RT_MEETING === meetingId && IM_RT_CHANNEL) return;
  imRtUnsubscribe();
  // Keep the list channel subscribed in parallel — it's how we hear about
  // updates/deletes to the *meetings* row itself (title, status, date)
  // while the user is inside it. Two channels per active tab is cheap.
  imRtSubscribeList();
  if(typeof sbConfigured !== 'function' || !sbConfigured()) return;
  if(typeof supabase === 'undefined'){ console.warn('[meetings] realtime: supabase-js CDN did not load'); return; }
  const rt = (typeof sbRealtime === 'function') ? sbRealtime() : null;
  if(!rt || !rt.channel){ console.warn('[meetings] realtime client unavailable'); return; }

  const filter = `meeting_id=eq.${meetingId}`;
  try{
    IM_RT_CHANNEL = rt.channel(`im-meeting-${meetingId}`)
      .on('postgres_changes', {event:'*', schema:'public', table:'meeting_transcripts',    filter}, p => imRtApply('transcripts', meetingId, p))
      .on('postgres_changes', {event:'*', schema:'public', table:'meeting_notes',          filter}, p => imRtApply('notes',       meetingId, p))
      .on('postgres_changes', {event:'*', schema:'public', table:'meeting_todos',          filter}, p => imRtApply('todos',       meetingId, p))
      .on('postgres_changes', {event:'*', schema:'public', table:'meeting_followups',      filter}, p => imRtApply('followups',   meetingId, p))
      .on('postgres_changes', {event:'*', schema:'public', table:'meeting_prep_sections',  filter}, p => imRtApply('prep',        meetingId, p))
      .subscribe(status => {
        if(status === 'SUBSCRIBED'){ console.log('[meetings] realtime live for', meetingId); imRtSetLive('chan', true); }
        else if(status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED'){ console.warn('[meetings] realtime status:', status); imRtSetLive('chan', false); }
      });
    IM_RT_MEETING = meetingId;
  }catch(e){ console.warn('[meetings] realtime subscribe failed:', e.message); IM_RT_CHANNEL = null; IM_RT_MEETING = null; imRtSetLive('chan', false); }
}

// List-level channel: streams INSERT/UPDATE/DELETE on the `meetings` table
// while the user is on the all-meetings view, so meetings created on
// another device appear without refresh.
function imRtSubscribeList(){
  if(IM_RT_LIST) return; // already subscribed
  if(typeof sbConfigured !== 'function' || !sbConfigured()) return;
  if(typeof supabase === 'undefined') return;
  const rt = (typeof sbRealtime === 'function') ? sbRealtime() : null;
  if(!rt || !rt.channel) return;
  try{
    IM_RT_LIST = rt.channel('im-meetings-list')
      .on('postgres_changes', {event:'*', schema:'public', table:'meetings'}, p => imRtApplyList(p))
      .subscribe(status => {
        if(status === 'SUBSCRIBED'){ console.log('[meetings] realtime list live'); imRtSetLive('list', true); }
        else if(status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED'){ imRtSetLive('list', false); }
      });
  }catch(e){ console.warn('[meetings] realtime list subscribe failed:', e.message); IM_RT_LIST = null; imRtSetLive('list', false); }
}

function imRtUnsubscribeList(){
  if(!IM_RT_LIST){ imRtSetLive('list', false); return; }
  try{
    const rt = (typeof sbRealtime === 'function') ? sbRealtime() : null;
    if(rt && rt.removeChannel) rt.removeChannel(IM_RT_LIST);
  }catch(e){}
  IM_RT_LIST = null;
  imRtSetLive('list', false);
}

function imRtApplyList(payload){
  const evt = payload.eventType;
  const row = payload.new;
  const old = payload.old;
  let touchedCurrent = false;
  if(evt === 'INSERT' && row){
    if(!IM_MEETINGS.find(m => m.id === row.id)) IM_MEETINGS.unshift(row);
  } else if(evt === 'UPDATE' && row){
    const i = IM_MEETINGS.findIndex(m => m.id === row.id);
    if(i >= 0) IM_MEETINGS[i] = {...IM_MEETINGS[i], ...row};
    else IM_MEETINGS.unshift(row);
    if(IM_CUR_ID === row.id) touchedCurrent = true;
  } else if(evt === 'DELETE' && old){
    const i = IM_MEETINGS.findIndex(m => m.id === old.id);
    if(i >= 0) IM_MEETINGS.splice(i, 1);
    if(IM_CUR_ID === old.id){
      // Meeting we're viewing was deleted elsewhere — bounce to list.
      IM_CUR_ID = null;
      imRtUnsubscribe();
      try{ toast && toast('This meeting was deleted on another device','err'); }catch(_){ }
    }
  }
  // Re-render whenever the currently-displayed view depends on the change:
  // list view (always), or meeting view when the current meeting was updated.
  if(IM_CUR_ID === null || touchedCurrent) imRender();
}

// Update the live badge in the meeting header when subscription state changes.
// Tracks the per-meeting and list channels separately so the badge stays
// "Live" as long as at least one channel is SUBSCRIBED.
function imRtSetLive(which, on){
  if(which === 'chan') IM_RT_LIVE_CHAN = !!on;
  else if(which === 'list') IM_RT_LIVE_LIST = !!on;
  IM_RT_LIVE = IM_RT_LIVE_CHAN || IM_RT_LIVE_LIST;
  const el = document.getElementById('im-rt-badge');
  if(el){
    el.textContent = IM_RT_LIVE ? '● Live' : '○ Offline';
    el.style.color = IM_RT_LIVE ? 'var(--grn, #22c55e)' : 'var(--text-3, #888)';
    el.title = IM_RT_LIVE ? 'Live cross-device sync is active' : 'Sync offline — refresh to reconnect';
  }
}

function imRtUnsubscribe(){
  if(!IM_RT_CHANNEL) { IM_RT_MEETING = null; imRtSetLive('chan', false); return; }
  try{
    const rt = (typeof sbRealtime === 'function') ? sbRealtime() : null;
    if(rt && rt.removeChannel) rt.removeChannel(IM_RT_CHANNEL);
  }catch(e){}
  IM_RT_CHANNEL = null;
  IM_RT_MEETING = null;
  imRtSetLive('chan', false);
}

// Apply a postgres_changes payload to the in-memory cache and re-render if visible.
// Dedupes by id, and reconciles temp-id placeholders by content key (raw_text /
// content / task / title) for the brief race window before a local POST resolves.
function imRtApply(kind, meetingId, payload){
  const caches = {transcripts:IM_TRANSCRIPTS, notes:IM_NOTES, todos:IM_TODOS, followups:IM_FOLLOWUPS, prep:IM_PREP};
  const tmpKeys = {transcripts:'raw_text', notes:'content', todos:'task', followups:'title', prep:'section_key'};
  const cache = caches[kind]; if(!cache) return;
  if(!cache[meetingId]) cache[meetingId] = [];
  const arr = cache[meetingId];
  const evt = payload.eventType;
  const row = payload.new;
  const old = payload.old;

  if(evt === 'INSERT' && row){
    if(arr.find(x => x.id === row.id)) return; // already have it
    const key = tmpKeys[kind];
    const tmp = key ? arr.find(x => typeof x.id === 'string' && x.id.startsWith('_') && x[key] === row[key]) : null;
    if(tmp){ Object.assign(tmp, row); }
    else { kind === 'transcripts' ? arr.unshift(row) : arr.push(row); }
  } else if(evt === 'UPDATE' && row){
    const i = arr.findIndex(x => x.id === row.id);
    if(i >= 0) arr[i] = {...arr[i], ...row};
    else arr.push(row);
  } else if(evt === 'DELETE' && old){
    const i = arr.findIndex(x => x.id === old.id);
    if(i >= 0) arr.splice(i, 1);
  }

  if(IM_CUR_ID === meetingId) imRenderSub(meetingId);
}

// ── ALL MEETINGS VIEW ────────────────────────────────────────────────────────
function imRenderAll(el){
  const counts = {prep:0, active:0, complete:0, archived:0};
  IM_MEETINGS.forEach(m => { counts[m.status||'prep'] = (counts[m.status||'prep']||0)+1; });

  const stats = `
    <div class="g4" style="margin-bottom:18px;">
      <div class="card stat-card"><div class="stat-label">Total</div><div class="stat-value">${IM_MEETINGS.length}</div><div class="stat-sub">All meetings</div></div>
      <div class="card stat-card"><div class="stat-label">In Prep</div><div class="stat-value" style="color:#f59e0b;">${counts.prep||0}</div><div class="stat-sub">Pre-meeting</div></div>
      <div class="card stat-card"><div class="stat-label">Active</div><div class="stat-value" style="color:#10b981;">${counts.active||0}</div><div class="stat-sub">In progress</div></div>
      <div class="card stat-card"><div class="stat-label">Complete</div><div class="stat-value" style="color:#6366f1;">${counts.complete||0}</div><div class="stat-sub">Done</div></div>
    </div>`;

  let body;
  if(!IM_MEETINGS.length){
    body = `<div class="card" style="padding:48px;text-align:center;">
      <div style="font-size:32px;margin-bottom:10px;">📋</div>
      <div style="font-size:16px;font-weight:600;margin-bottom:6px;">No meetings yet</div>
      <div class="muted sm" style="margin-bottom:16px;">Create your first meeting to organize prep, notes, agenda, and follow-ups.</div>
      <button class="btn btn-accent" onclick="imNewMeeting()">+ New Meeting</button>
    </div>`;
  } else {
    const grid = IM_MEETINGS.map(m => {
      const att = (m.attendees||[]).join(', ') || '—';
      const desc = (m.description||'').slice(0,140) + ((m.description||'').length>140?'…':'');
      const noteCt = (IM_NOTES[m.id]||[]).length;
      const todoCt = (IM_TODOS[m.id]||[]).length;
      const fupCt  = (IM_FOLLOWUPS[m.id]||[]).length;
      return `
        <div class="im-mcard" onclick="imGoMeeting('${esc(m.id)}')">
          <div style="display:flex;align-items:flex-start;gap:10px;">
            <div style="flex:1;min-width:0;">
              <div style="font-size:15px;font-weight:700;margin-bottom:4px;">${esc(m.title)}</div>
              <div class="muted sm" style="display:flex;gap:10px;flex-wrap:wrap;">
                <span>📅 ${imFmtDate(m.meeting_date)}</span>
                <span>👥 ${esc(att)}</span>
              </div>
            </div>
            ${imStatusBadge(m.status)}
          </div>
          ${desc ? `<div class="sm" style="color:var(--text-2);">${esc(desc)}</div>` : ''}
          <div style="display:flex;gap:14px;margin-top:6px;font-size:11.5px;color:var(--text-3);font-family:'DM Mono',monospace;">
            <span>📝 ${noteCt} notes</span>
            <span>✓ ${todoCt} todos</span>
            <span>↗ ${fupCt} follow-ups</span>
          </div>
        </div>`;
    }).join('');
    body = `<div class="g2">${grid}</div>`;
  }

  el.innerHTML = stats + body;
}

// ── MEETING DETAIL VIEW (header + sub-tab bar + sub-tab content) ─────────────
function imRenderMeeting(el, m){
  const att = (m.attendees||[]).join(', ') || '—';
  const subs = [
    {k:'prep',       l:'📑 Prep'},
    {k:'notes',      l:'📝 Notes'},
    {k:'agenda',     l:'📋 Agenda'},
    {k:'todos',      l:'✓ To-Dos'},
    {k:'followups',  l:'↗ Follow-Ups'},
    {k:'ainotes',    l:'🤖 AI Notes'}
  ];
  el.innerHTML = `
    <div class="card" style="padding:18px 22px;margin-bottom:16px;">
      <div style="display:flex;align-items:flex-start;gap:14px;">
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px;">
            <span style="font-size:18px;font-weight:700;">${esc(m.title)}</span>
            ${imStatusBadge(m.status)}
            <span class="badge bg-gray" style="font-size:10px;text-transform:capitalize;">${esc((m.meeting_type||'general').replace('_',' '))}</span>
            <span id="im-rt-badge" style="font-size:11px;font-family:'DM Mono',monospace;color:${IM_RT_LIVE?'var(--grn,#22c55e)':'var(--text-3,#888)'};" title="${IM_RT_LIVE?'Live cross-device sync is active':'Sync offline — refresh to reconnect'}">${IM_RT_LIVE?'● Live':'○ Offline'}</span>
          </div>
          <div class="muted sm" style="display:flex;gap:14px;flex-wrap:wrap;">
            <span>📅 ${imFmtDate(m.meeting_date)}</span>
            <span>👥 ${esc(att)}</span>
          </div>
          ${m.description ? `<div class="sm" style="margin-top:8px;color:var(--text-2);">${esc(m.description)}</div>` : ''}
        </div>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-outline btn-sm" onclick="imEditMeeting('${esc(m.id)}')">Edit</button>
        </div>
      </div>
    </div>
    <div style="display:flex;gap:0;border-bottom:1px solid var(--border);overflow-x:auto;margin-bottom:16px;">
      ${subs.map(s => `<button class="im-subtab ${IM_CUR_SUB===s.k?'on':''}" onclick="imSubtab('${esc(m.id)}','${s.k}')">${s.l}</button>`).join('')}
    </div>
    <div id="im-sub"></div>`;

  imRenderSub(m.id);
}

function imSubtab(id, sub){
  IM_CUR_SUB = sub;
  qsa('.im-subtab').forEach(b => b.classList.remove('on'));
  const matches = qsa('.im-subtab');
  // re-mark active by matching onclick string
  matches.forEach(b => { if((b.getAttribute('onclick')||'').includes(`'${sub}'`)) b.classList.add('on'); });
  imRenderSub(id);
}

function imRenderSub(id){
  const el = $('im-sub');
  if(!el) return;
  switch(IM_CUR_SUB){
    case 'prep':       imRenderPrep(el, id); break;
    case 'notes':      imRenderNotes(el, id); break;
    case 'agenda':     imRenderAgenda(el, id); break;
    case 'todos':      imRenderTodos(el, id); break;
    case 'followups':  imRenderFollowups(el, id); break;
    case 'ainotes':    imRenderAiNotes(el, id); break;
    default:           imRenderPrep(el, id);
  }
}

// ── PREP SUB-TAB (3-level collapsible: groups → subgroups → sections) ────────
function imRenderPrep(el, id){
  const sections = (IM_PREP[id]||[]).slice().sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));
  if(!sections.length){
    el.innerHTML = `
      <div class="card" style="padding:32px;text-align:center;">
        <div style="font-size:28px;margin-bottom:8px;">📑</div>
        <div style="font-size:15px;font-weight:600;margin-bottom:6px;">No prep sections yet</div>
        <div class="muted sm" style="margin-bottom:14px;">Add briefing sections to organize meeting talking points, presentations, or reference material.</div>
        <button class="btn btn-accent btn-sm" onclick="imAddPrepSection('${esc(id)}')">+ Add Section</button>
      </div>`;
    return;
  }

  // Bucket sections by group/subgroup using IM_SECTION_MAP; unmapped sections fall under a "custom" group
  const buckets = {};
  sections.forEach(s => {
    const map = IM_SECTION_MAP[s.section_key];
    const g = map ? map[0] : 'custom';
    const sg = map ? map[1] : 'custom';
    (buckets[g] = buckets[g] || {})[sg] = (buckets[g][sg] || []);
    buckets[g][sg].push(s);
  });

  const groupsToRender = IM_GROUPS.slice().sort((a,b) => a.order - b.order);
  if(buckets.custom){
    groupsToRender.push({ id:'custom', order:99, title:'➕ Custom Sections', subtitle:'Sections you added' });
  }

  const renderSection = (s, idx) => {
    const sid = s.id || `_p_${idx}`;
    const open = IM_PREP_OPEN[sid] === true;
    return `
      <div class="im-prep-card">
        <div class="im-prep-hd" onclick="imTogglePrep('${esc(sid)}')">
          <span class="im-prep-num">${String(s.sort_order||idx+1).padStart(2,'0')}</span>
          <span class="im-prep-title">${esc(s.title)}</span>
          <span class="im-prep-chev" style="transform:rotate(${open?'0':'-90'}deg);">▼</span>
        </div>
        ${open ? `<div class="im-prep-body">${imMd(s.content)}</div>` : ''}
      </div>`;
  };

  const renderSubgroup = (sg, list) => {
    const key = `sg:${sg.group}_${sg.id}`;
    const open = IM_PREP_OPEN[key] !== false;
    const cards = list.map(renderSection).join('');
    return `
      <div class="im-subgroup">
        <div class="im-subgroup-hd" onclick="imToggleSubgroup('${esc(sg.group)}','${esc(sg.id)}')">
          <span class="im-subgroup-title">${esc(sg.title)}</span>
          ${sg.subtitle?`<span class="im-subgroup-sub">${esc(sg.subtitle)}</span>`:''}
          <span class="im-subgroup-count">${list.length}</span>
          <span class="im-subgroup-chev" style="transform:rotate(${open?'0':'-90'}deg);">▼</span>
        </div>
        ${open ? `<div class="im-subgroup-body">${cards}</div>` : ''}
      </div>`;
  };

  const renderGroup = (g) => {
    const gKey = `g:${g.id}`;
    const open = IM_PREP_OPEN[gKey] !== false;
    const groupBucket = buckets[g.id] || {};
    const subgroups = IM_SUBGROUPS.filter(sg => sg.group === g.id).sort((a,b) => a.order - b.order);
    let inner = '';
    let total = 0;
    if(g.id === 'custom'){
      const list = groupBucket.custom || [];
      total = list.length;
      inner = list.map(renderSection).join('');
    } else {
      subgroups.forEach(sg => {
        const list = groupBucket[sg.id] || [];
        if(!list.length) return;
        total += list.length;
        inner += renderSubgroup(sg, list);
      });
    }
    if(!total) return '';
    return `
      <div class="im-group">
        <div class="im-group-hd" onclick="imToggleGroup('${esc(g.id)}')">
          <div class="im-group-titlewrap">
            <span class="im-group-title">${esc(g.title)}</span>
            ${g.subtitle?`<span class="im-group-sub">${esc(g.subtitle)}</span>`:''}
          </div>
          <span class="im-group-count">${total}</span>
          <span class="im-group-chev" style="transform:rotate(${open?'0':'-90'}deg);">▼</span>
        </div>
        ${open ? `<div class="im-group-body">${inner}</div>` : ''}
      </div>`;
  };

  const groupsHtml = groupsToRender.map(renderGroup).join('');

  el.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;gap:10px;flex-wrap:wrap;">
      <div class="muted sm">${sections.length} sections across ${groupsToRender.filter(g=>buckets[g.id]).length} groups — click any header to expand</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        <button class="btn btn-outline btn-sm" onclick="imExpandAllPrep('${esc(id)}',true)">Expand all</button>
        <button class="btn btn-outline btn-sm" onclick="imExpandAllPrep('${esc(id)}',false)">Collapse all</button>
        <button class="btn btn-outline btn-sm" onclick="imCollapseSectionsOnly('${esc(id)}')">Collapse sections</button>
        <button class="btn btn-accent btn-sm" onclick="imAddPrepSection('${esc(id)}')">+ Section</button>
      </div>
    </div>
    ${groupsHtml}`;
}

function imTogglePrep(sid){
  IM_PREP_OPEN[sid] = !IM_PREP_OPEN[sid];
  imRenderSub(IM_CUR_ID);
}

function imToggleGroup(gid){
  const k = `g:${gid}`;
  IM_PREP_OPEN[k] = !(IM_PREP_OPEN[k] !== false); // default open → first click closes
  imRenderSub(IM_CUR_ID);
}

function imToggleSubgroup(gid, sgid){
  const k = `sg:${gid}_${sgid}`;
  IM_PREP_OPEN[k] = !(IM_PREP_OPEN[k] !== false);
  imRenderSub(IM_CUR_ID);
}

function imExpandAllPrep(id, open){
  // sections
  (IM_PREP[id]||[]).forEach((s, idx) => { IM_PREP_OPEN[s.id || `_p_${idx}`] = open; });
  // groups
  IM_GROUPS.forEach(g => { IM_PREP_OPEN[`g:${g.id}`] = open; });
  IM_PREP_OPEN['g:custom'] = open;
  // subgroups
  IM_SUBGROUPS.forEach(sg => { IM_PREP_OPEN[`sg:${sg.group}_${sg.id}`] = open; });
  imRenderSub(id);
}

// Keep groups/subgroups open, collapse only the section-level cards
function imCollapseSectionsOnly(id){
  (IM_PREP[id]||[]).forEach((s, idx) => { IM_PREP_OPEN[s.id || `_p_${idx}`] = false; });
  imRenderSub(id);
}

async function imAddPrepSection(id){
  const body = `
    <div class="field"><label>Title</label><input id="im-ps-title" placeholder="e.g. Q3 Budget Review"></div>
    <div class="frow">
      <div class="fcol field"><label>Sort Order</label><input id="im-ps-order" type="number" value="${(IM_PREP[id]||[]).length+1}"></div>
      <div class="fcol field"><label>Section Key</label><input id="im-ps-key" placeholder="custom_section"></div>
    </div>
    <div class="field"><label>Content (markdown supported — ## headings, **bold**, - lists, | tables |)</label>
      <textarea id="im-ps-content" rows="10" placeholder="## Section Heading\n\nContent here…"></textarea>
    </div>`;
  const foot = `
    <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
    <button class="btn btn-accent" onclick="imSavePrepSection('${esc(id)}')">Save Section</button>`;
  openModal('+ Add Prep Section', body, foot);
}

async function imSavePrepSection(id){
  const title = $('im-ps-title')?.value?.trim();
  const sort = parseInt($('im-ps-order')?.value||'0',10) || ((IM_PREP[id]||[]).length+1);
  const key = $('im-ps-key')?.value?.trim() || 'custom_'+sort;
  const content = $('im-ps-content')?.value || '';
  if(!title){ toast('Title required','err'); return; }
  if(!IM_PREP[id]) IM_PREP[id] = [];
  const rec = { id:'_ps'+Date.now(), sort_order:sort, section_key:key, title, content };
  IM_PREP[id].push(rec);
  IM_PREP_OPEN[rec.id] = true;
  if(sbConfigured() && !id.startsWith('_')){
    try{
      const body = { meeting_id:id, sort_order:sort, section_key:key, title, content };
      const res = await sbFetch('/meeting_prep_sections', {method:'POST', headers:{'Prefer':'return=representation'}, body: JSON.stringify(body)});
      const saved = Array.isArray(res)?res[0]:res;
      if(saved?.id){ rec.id = saved.id; IM_PREP_OPEN[saved.id] = true; }
    }catch(e){ console.warn(e); }
  }
  closeModal();
  toast('Section added','ok');
  imRenderSub(id);
}

// ── NOTES SUB-TAB (chronological feed + quick add) ───────────────────────────
function imRenderNotes(el, id){
  const notes = (IM_NOTES[id]||[]).slice().sort((a,b)=>new Date(a.created_at||0)-new Date(b.created_at||0));
  const list = notes.length ? notes.map(n => `
    <div class="im-note-row t-${esc(n.note_type||'note')}">
      <div class="im-note-meta">
        <span class="badge bg-gray" style="font-size:10px;text-transform:capitalize;">${esc(n.note_type||'note')}</span>
        <span>${esc(n.author||'—')}</span>
        <span style="margin-left:auto;font-family:'DM Mono',monospace;">${imFmtDate(n.created_at)} ${imFmtTime(n.created_at)}</span>
      </div>
      <div style="font-size:13.5px;line-height:1.5;color:var(--text);">${esc(n.content).replace(/\n/g,'<br>')}</div>
    </div>`).join('') : `
    <div class="card" style="padding:24px;text-align:center;">
      <div class="muted sm">No notes yet. Use the input below or the floating 📝 bubble (bottom-right) to capture notes during the meeting.</div>
    </div>`;

  el.innerHTML = `
    <div class="card" style="padding:14px 18px;margin-bottom:14px;">
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
        <span style="font-size:13px;font-weight:600;">Quick capture</span>
        <select id="im-n-type" style="padding:4px 10px;border:1px solid var(--border);border-radius:6px;font-size:12px;background:var(--surface);">
          <option value="note">📝 Note</option>
          <option value="feedback">💡 Feedback</option>
          <option value="decision">✅ Decision</option>
          <option value="action">🎯 Action</option>
          <option value="question">❓ Question</option>
        </select>
        <span class="muted sm" style="margin-left:auto;">⏎ Enter to save · Shift+⏎ for new line</span>
      </div>
      <textarea id="im-n-input" rows="2" placeholder="Type a note, decision, or feedback…" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:6px;font-family:inherit;font-size:13px;resize:vertical;outline:none;" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();imQuickNote('${esc(id)}');}"></textarea>
      <div style="display:flex;justify-content:flex-end;margin-top:8px;">
        <button class="btn btn-accent btn-sm" onclick="imQuickNote('${esc(id)}')">Save Note</button>
      </div>
    </div>
    <div class="muted sm" style="margin-bottom:8px;">${notes.length} note${notes.length===1?'':'s'}</div>
    <div id="im-notes-list">${list}</div>`;
}

async function imQuickNote(id){
  const input = $('im-n-input');
  const type = $('im-n-type')?.value || 'note';
  const content = input?.value?.trim();
  if(!content){ toast('Write something first','err'); return; }
  await imSaveNote(id, content, type);
  if(input) input.value = '';
  toast('Note captured','ok');
  imRenderSub(id);
}

// ── FLOATING NOTE BUBBLE (singleton) ─────────────────────────────────────────
function imInitBubble(){
  if(document.getElementById('im-bubble-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'im-bubble-btn';
  btn.innerHTML = '📝';
  btn.title = 'Capture meeting note (any sub-tab)';
  btn.style.cssText = 'position:fixed;bottom:26px;right:24px;background:#6366f1;color:#fff;border:none;width:48px;height:48px;border-radius:50%;font-size:20px;cursor:pointer;z-index:450;box-shadow:0 4px 14px rgba(99,102,241,.45);transition:transform .15s,background .15s;display:none;align-items:center;justify-content:center;';
  btn.onmouseenter = () => { btn.style.transform = 'translateY(-2px)'; btn.style.background = '#4f46e5'; };
  btn.onmouseleave = () => { btn.style.transform = 'translateY(0)'; btn.style.background = '#6366f1'; };
  btn.onclick = imToggleBubble;
  document.body.appendChild(btn);

  const panel = document.createElement('div');
  panel.id = 'im-bubble-panel';
  panel.style.cssText = 'position:fixed;bottom:84px;right:24px;width:340px;background:var(--surface);border:1px solid var(--border);border-radius:14px;box-shadow:0 12px 36px rgba(0,0,0,.18);z-index:451;display:none;flex-direction:column;overflow:hidden;font-family:Outfit,sans-serif;';
  panel.innerHTML = `
    <div style="padding:13px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;background:#1a1a1a;color:#fff;">
      <span style="font-size:13px;font-weight:700;">📝 Capture Note</span>
      <button onclick="imToggleBubble()" style="background:none;border:none;color:#fff;cursor:pointer;font-size:16px;padding:0 4px;">✕</button>
    </div>
    <div style="padding:10px 14px 6px;display:flex;gap:5px;flex-wrap:wrap;">
      ${['note','feedback','decision','action','question'].map(t => `
        <button id="im-b-t-${t}" onclick="imBubbleSetType('${t}')" style="font-size:11px;padding:4px 10px;border-radius:14px;border:1px solid var(--border);background:${t==='note'?'#6366f1':'transparent'};color:${t==='note'?'#fff':'var(--text-2)'};cursor:pointer;font-family:Outfit,sans-serif;font-weight:600;text-transform:capitalize;">${t}</button>`).join('')}
    </div>
    <textarea id="im-bubble-input" placeholder="Type your note. ⏎ Enter to save, Shift+⏎ for new line." style="width:100%;box-sizing:border-box;padding:12px 16px;background:transparent;border:none;outline:none;resize:none;font-size:13px;color:var(--text);min-height:90px;font-family:inherit;"></textarea>
    <div style="padding:8px 14px 12px;display:flex;gap:8px;align-items:center;border-top:1px solid var(--border-light);">
      <button class="btn btn-accent btn-sm" style="flex:1;background:#6366f1;border-color:#6366f1;" onclick="imBubbleSave()">Save Note</button>
      <button class="btn btn-outline btn-sm" onclick="imToggleBubble()">Cancel</button>
    </div>
    <div id="im-bubble-status" style="padding:0 16px 12px;font-size:11px;color:var(--text-3);">Saves to current meeting's Notes tab.</div>`;
  document.body.appendChild(panel);

  const input = panel.querySelector('#im-bubble-input');
  if(input){
    input.addEventListener('keydown', (e) => {
      if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); imBubbleSave(); }
      if(e.key === 'Escape'){ imToggleBubble(); }
    });
  }
}

function imShowBubble(show){
  const btn = document.getElementById('im-bubble-btn');
  const panel = document.getElementById('im-bubble-panel');
  if(btn) btn.style.display = show ? 'flex' : 'none';
  if(!show && panel){ panel.style.display = 'none'; IM_BUBBLE_OPEN = false; }
}

function imToggleBubble(){
  IM_BUBBLE_OPEN = !IM_BUBBLE_OPEN;
  const panel = document.getElementById('im-bubble-panel');
  if(panel) panel.style.display = IM_BUBBLE_OPEN ? 'flex' : 'none';
  if(IM_BUBBLE_OPEN){
    setTimeout(() => document.getElementById('im-bubble-input')?.focus(), 50);
    const status = document.getElementById('im-bubble-status');
    if(status){
      if(IM_CUR_ID){
        const m = IM_MEETINGS.find(x=>x.id===IM_CUR_ID);
        status.textContent = `Saves to: ${m?.title||'current meeting'}`;
        status.style.color = 'var(--text-3)';
      } else {
        status.textContent = '⚠ Open a meeting first to save notes there.';
        status.style.color = '#f59e0b';
      }
    }
  }
}

function imBubbleSetType(type){
  IM_BUBBLE_TYPE = type;
  ['note','feedback','decision','action','question'].forEach(t => {
    const b = document.getElementById('im-b-t-'+t);
    if(b){
      b.style.background = (t===type) ? '#6366f1' : 'transparent';
      b.style.color = (t===type) ? '#fff' : 'var(--text-2)';
    }
  });
}

async function imBubbleSave(){
  const input = document.getElementById('im-bubble-input');
  const content = input?.value?.trim();
  if(!content){ toast('Write something first','err'); return; }
  if(!IM_CUR_ID){ toast('Open a meeting first','err'); return; }
  await imSaveNote(IM_CUR_ID, content, IM_BUBBLE_TYPE);
  if(input) input.value = '';
  toast('Note captured','ok');
  imToggleBubble();
  if(IM_CUR_SUB === 'notes') imRenderSub(IM_CUR_ID);
}

// ── AGENDA SUB-TAB (templates + builder + export + save-to-knowledge) ────────
function imRenderAgenda(el, id){
  const items = IM_AGENDA[id] || [];

  const templateRow = `
    <div class="card" style="padding:14px 18px;margin-bottom:14px;">
      <div style="font-size:13px;font-weight:600;margin-bottom:8px;">📋 Quick Templates</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-outline btn-sm" onclick="imLoadTemplate('${esc(id)}','owner_review')">👔 Owner Review</button>
        <button class="btn btn-outline btn-sm" onclick="imLoadTemplate('${esc(id)}','team_standup')">👥 Team Standup</button>
        <button class="btn btn-outline btn-sm" onclick="imLoadTemplate('${esc(id)}','vendor_strategy')">🏷️ Vendor Strategy</button>
        <button class="btn btn-outline btn-sm" onclick="imLoadTemplate('${esc(id)}','tech_update')">🛠️ Tech Update</button>
        <span class="muted sm" style="margin-left:auto;align-self:center;">Loading a template appends — clear first to replace.</span>
      </div>
    </div>`;

  let body;
  if(!items.length){
    body = `
      <div class="card" style="padding:32px;text-align:center;">
        <div style="font-size:28px;margin-bottom:8px;">📋</div>
        <div style="font-size:15px;font-weight:600;margin-bottom:6px;">No agenda items yet</div>
        <div class="muted sm" style="margin-bottom:14px;">Pick a template above or add items manually.</div>
        <button class="btn btn-accent btn-sm" onclick="imAddAgendaItem('${esc(id)}')">+ Add Item</button>
      </div>`;
  } else {
    const rows = items.map((a, idx) => `
      <div class="card" style="padding:12px 16px;margin-bottom:8px;display:flex;align-items:center;gap:12px;">
        <span style="font-family:'DM Mono',monospace;font-size:11px;color:var(--text-3);background:var(--bg);padding:3px 8px;border-radius:10px;flex-shrink:0;">${String(idx+1).padStart(2,'0')}</span>
        <div style="flex:1;min-width:0;">
          <div style="font-size:13.5px;font-weight:600;margin-bottom:3px;">${esc(a.title)}</div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            ${a.owner ? `<span class="badge bg-gray" style="font-size:10px;">👤 ${esc(a.owner)}</span>` : ''}
            ${imPrioBadge(a.priority||'normal')}
            ${imStatusBadge(a.status||'open')}
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" title="Edit" onclick="imEditAgendaItem('${esc(id)}','${esc(a.id)}')">✎</button>
        <button class="btn btn-ghost btn-sm" title="Delete" onclick="imRemoveAgendaItem('${esc(id)}','${esc(a.id)}')">✕</button>
      </div>`).join('');
    body = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <div class="muted sm">${items.length} agenda item${items.length===1?'':'s'}</div>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-outline btn-sm" onclick="imCopyAgenda('${esc(id)}')">📋 Copy as Text</button>
          <button class="btn btn-outline btn-sm" onclick="imSendAgendaToKnowledge('${esc(id)}')">📚 Save to Knowledge Hub</button>
          <button class="btn btn-outline btn-sm" onclick="imClearAgenda('${esc(id)}')">Clear</button>
          <button class="btn btn-accent btn-sm" onclick="imAddAgendaItem('${esc(id)}')">+ Item</button>
        </div>
      </div>
      ${rows}`;
  }

  // Optional notes textarea + save to meeting_notes table
  const notesArea = `
    <div class="card" style="padding:14px 18px;margin-top:18px;">
      <div style="font-size:13px;font-weight:600;margin-bottom:6px;">📝 Meeting Summary Notes</div>
      <div class="muted sm" style="margin-bottom:8px;">Persisted to Supabase meeting_notes table when "Save Summary" is clicked. Use the floating bubble for in-meeting captures.</div>
      <textarea id="im-ag-notes" rows="5" placeholder="Summary, key decisions, outcomes…" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:6px;font-family:inherit;font-size:13px;resize:vertical;outline:none;"></textarea>
      <div style="display:flex;justify-content:flex-end;margin-top:8px;gap:8px;">
        <button class="btn btn-accent btn-sm" onclick="imSaveAgendaSummary('${esc(id)}')">Save Summary</button>
      </div>
    </div>`;

  el.innerHTML = templateRow + body + notesArea;
}

function imLoadTemplate(id, key){
  const tmpl = IM_TEMPLATES[key];
  if(!tmpl){ toast('Template not found','err'); return; }
  if(!IM_AGENDA[id]) IM_AGENDA[id] = [];
  tmpl.forEach(t => IM_AGENDA[id].push({...t, id:'_a'+Date.now()+Math.random().toString(36).slice(2,5)}));
  toast(`Loaded ${tmpl.length} items`,'ok');
  imRenderSub(id);
}

function imClearAgenda(id){
  if(!confirm('Clear all agenda items?')) return;
  IM_AGENDA[id] = [];
  imRenderSub(id);
}

function imRemoveAgendaItem(id, aid){
  imDeleteAgendaItem(id, aid);
  imRenderSub(id);
}

function imAddAgendaItem(id, existing){
  const a = existing || {title:'', owner:'', priority:'normal', status:'open'};
  const body = `
    <div class="field"><label>Title</label><input id="im-ai-title" value="${esc(a.title||'')}" placeholder="Discussion topic"></div>
    <div class="frow">
      <div class="fcol field"><label>Owner</label><input id="im-ai-owner" value="${esc(a.owner||'')}" placeholder="Michael / All / Owners"></div>
      <div class="fcol field"><label>Priority</label>
        <select id="im-ai-prio">
          ${['low','normal','high','critical'].map(p => `<option value="${p}" ${a.priority===p?'selected':''}>${p}</option>`).join('')}
        </select>
      </div>
      <div class="fcol field"><label>Status</label>
        <select id="im-ai-status">
          ${['open','pending','resolved'].map(s => `<option value="${s}" ${a.status===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
    </div>`;
  const foot = `
    <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
    <button class="btn btn-accent" onclick="imSaveAgendaItemModal('${esc(id)}','${esc(a.id||'')}')">Save</button>`;
  openModal(a.id ? 'Edit Agenda Item' : '+ Add Agenda Item', body, foot);
}

function imEditAgendaItem(id, aid){
  const a = (IM_AGENDA[id]||[]).find(x => x.id===aid);
  if(a) imAddAgendaItem(id, a);
}

function imSaveAgendaItemModal(id, aid){
  const title = $('im-ai-title')?.value?.trim();
  if(!title){ toast('Title required','err'); return; }
  const rec = {
    id: aid || undefined,
    title,
    owner: $('im-ai-owner')?.value?.trim() || '',
    priority: $('im-ai-prio')?.value || 'normal',
    status: $('im-ai-status')?.value || 'open'
  };
  imSaveAgendaItem(id, rec);
  closeModal();
  imRenderSub(id);
}

function imCopyAgenda(id){
  const m = IM_MEETINGS.find(x => x.id===id);
  const items = IM_AGENDA[id] || [];
  const lines = [
    `AGENDA — ${m?.title||'Meeting'}`,
    `Date: ${imFmtDate(m?.meeting_date)}`,
    `Attendees: ${(m?.attendees||[]).join(', ')||'—'}`,
    '',
    ...items.map((a, i) => `${i+1}. ${a.title}${a.owner?' ['+a.owner+']':''}${a.priority&&a.priority!=='normal'?' ('+a.priority+')':''}`),
    ''
  ];
  const text = lines.join('\n');
  if(navigator.clipboard?.writeText){
    navigator.clipboard.writeText(text).then(() => toast('Agenda copied to clipboard','ok'));
  } else {
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    toast('Agenda copied','ok');
  }
}

async function imSaveAgendaSummary(id){
  const notes = $('im-ag-notes')?.value?.trim();
  if(!notes){ toast('Write a summary first','err'); return; }
  const m = IM_MEETINGS.find(x=>x.id===id);
  if(!sbConfigured()){ toast('Supabase not configured — summary held in session','err'); return; }
  try{
    const body = {
      meeting_date: m?.meeting_date || new Date().toISOString().slice(0,10),
      meeting_type: m?.meeting_type || 'general',
      attendees: m?.attendees || [],
      agenda: IM_AGENDA[id] || [],
      notes,
      action_items: (IM_TODOS[id]||[]).map(t => ({task:t.task, assignee:t.assignee, due_date:t.due_date})),
      created_by: (window.CU?.name) || 'development'
    };
    await sbFetch('/meeting_notes', {method:'POST', headers:{'Prefer':'return=minimal'}, body: JSON.stringify(body)});
    toast('Summary saved to Supabase','ok');
  }catch(e){
    if(/relation .* does not exist|404|42P01/i.test(e.message||'')){
      toast('Run M30 SQL migration first','err');
    } else {
      toast('Save failed: '+e.message,'err');
    }
  }
}

async function imSendAgendaToKnowledge(id){
  const m = IM_MEETINGS.find(x => x.id===id);
  const items = IM_AGENDA[id] || [];
  const notes = $('im-ag-notes')?.value?.trim() || '';
  const body =
`# ${m?.title||'Meeting'} — Agenda

**Date:** ${imFmtDate(m?.meeting_date)}
**Attendees:** ${(m?.attendees||[]).join(', ')||'—'}
**Type:** ${m?.meeting_type||'general'}

## Agenda

${items.map((a, i) => `${i+1}. **${a.title}**${a.owner?' — '+a.owner:''}${a.priority&&a.priority!=='normal'?' *('+a.priority+')*':''}`).join('\n')}

${notes ? `## Summary Notes\n\n${notes}\n` : ''}

## Action Items

${(IM_TODOS[id]||[]).map(t => `- [ ] ${t.task}${t.assignee?' — '+t.assignee:''}${t.due_date?' (due '+t.due_date+')':''}`).join('\n') || '_None_'}
`;

  if(!sbConfigured()){ toast('Supabase not configured','err'); return; }
  try{
    const article = {
      title: `${m?.title||'Meeting'} — ${imFmtDate(m?.meeting_date)}`,
      slug: `meeting-${id}-${Date.now()}`,
      category: 'meetings',
      body, tags: ['meeting','agenda', m?.meeting_type||'general'],
      pinned: false, updated_at: new Date().toISOString()
    };
    await sbFetch('/articles', {method:'POST', headers:{'Prefer':'return=minimal'}, body: JSON.stringify(article)});
    toast('Saved to Knowledge Hub','ok');
  }catch(e){
    if(/relation .* does not exist|404|42P01/i.test(e.message||'')){
      toast('Knowledge Hub schema not deployed (M21)','err');
    } else {
      toast('Save failed: '+e.message,'err');
    }
  }
}

// ── TO-DOS SUB-TAB ───────────────────────────────────────────────────────────
function imRenderTodos(el, id){
  const todos = (IM_TODOS[id]||[]).slice().sort((a,b) => {
    const sOrder = {open:0, in_progress:1, blocked:2, done:3};
    return (sOrder[a.status]||0) - (sOrder[b.status]||0);
  });

  const stats = {open:0, in_progress:0, done:0, blocked:0};
  todos.forEach(t => { stats[t.status||'open'] = (stats[t.status||'open']||0)+1; });

  const statRow = `
    <div class="g4" style="margin-bottom:14px;">
      <div class="card stat-card"><div class="stat-label">Open</div><div class="stat-value">${stats.open}</div></div>
      <div class="card stat-card"><div class="stat-label">In Progress</div><div class="stat-value" style="color:#3b82f6;">${stats.in_progress}</div></div>
      <div class="card stat-card"><div class="stat-label">Done</div><div class="stat-value" style="color:#10b981;">${stats.done}</div></div>
      <div class="card stat-card"><div class="stat-label">Blocked</div><div class="stat-value" style="color:#ed1c24;">${stats.blocked}</div></div>
    </div>`;

  let body;
  if(!todos.length){
    body = `
      <div class="card" style="padding:32px;text-align:center;">
        <div style="font-size:28px;margin-bottom:8px;">✓</div>
        <div style="font-size:15px;font-weight:600;margin-bottom:6px;">No to-dos yet</div>
        <div class="muted sm" style="margin-bottom:14px;">Track delegated tasks and action items from the meeting.</div>
        <button class="btn btn-accent btn-sm" onclick="imEditTodo('${esc(id)}',null)">+ Add To-Do</button>
      </div>`;
  } else {
    const rows = todos.map(t => {
      const overdue = t.due_date && t.status !== 'done' && new Date(t.due_date) < new Date();
      return `
      <tr>
        <td>${imPrioBadge(t.priority||'normal')}</td>
        <td><div style="font-weight:600;${t.status==='done'?'text-decoration:line-through;color:var(--text-3);':''}">${esc(t.task)}</div>${t.notes?`<div class="muted sm" style="margin-top:3px;">${esc(t.notes)}</div>`:''}</td>
        <td>${esc(t.assignee||'—')}</td>
        <td style="${overdue?'color:#ed1c24;font-weight:600;':''}">${imFmtDate(t.due_date)}${overdue?' ⚠':''}</td>
        <td>${imStatusBadge(t.status||'open')}</td>
        <td style="white-space:nowrap;">
          ${t.status!=='done'?`<button class="btn btn-ghost btn-sm" title="Mark done" onclick="imToggleTodoDone('${esc(id)}','${esc(t.id)}')">✓</button>`:''}
          <button class="btn btn-ghost btn-sm" title="Edit" onclick="imEditTodo('${esc(id)}','${esc(t.id)}')">✎</button>
          <button class="btn btn-ghost btn-sm" title="Delete" onclick="imRemoveTodo('${esc(id)}','${esc(t.id)}')">✕</button>
        </td>
      </tr>`;
    }).join('');
    body = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <div class="muted sm">${todos.length} to-do${todos.length===1?'':'s'}</div>
        <button class="btn btn-accent btn-sm" onclick="imEditTodo('${esc(id)}',null)">+ Add To-Do</button>
      </div>
      <div class="card" style="padding:0;overflow:hidden;">
        <div class="tbl-wrap"><table>
          <thead><tr><th>Priority</th><th>Task</th><th>Assignee</th><th>Due</th><th>Status</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>
      </div>`;
  }
  el.innerHTML = statRow + body;
}

function imEditTodo(id, todoId){
  const t = todoId ? (IM_TODOS[id]||[]).find(x=>x.id===todoId) : {task:'', assignee:'', due_date:'', priority:'normal', status:'open', notes:''};
  if(!t){ toast('Not found','err'); return; }
  const body = `
    <div class="field"><label>Task</label><input id="im-t-task" value="${esc(t.task||'')}" placeholder="What needs to happen"></div>
    <div class="frow">
      <div class="fcol field"><label>Assignee</label><input id="im-t-asg" value="${esc(t.assignee||'')}" placeholder="Person / role"></div>
      <div class="fcol field"><label>Due Date</label><input id="im-t-due" type="date" value="${esc(t.due_date||'')}"></div>
    </div>
    <div class="frow">
      <div class="fcol field"><label>Priority</label>
        <select id="im-t-prio">${['low','normal','high','critical'].map(p=>`<option value="${p}" ${t.priority===p?'selected':''}>${p}</option>`).join('')}</select>
      </div>
      <div class="fcol field"><label>Status</label>
        <select id="im-t-status">${['open','in_progress','done','blocked'].map(s=>`<option value="${s}" ${t.status===s?'selected':''}>${s.replace('_',' ')}</option>`).join('')}</select>
      </div>
    </div>
    <div class="field"><label>Notes</label><textarea id="im-t-notes" rows="3">${esc(t.notes||'')}</textarea></div>`;
  const foot = `
    <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
    <button class="btn btn-accent" onclick="imSaveTodoModal('${esc(id)}','${esc(todoId||'')}')">Save</button>`;
  openModal(todoId?'Edit To-Do':'+ New To-Do', body, foot);
}

async function imSaveTodoModal(id, todoId){
  const task = $('im-t-task')?.value?.trim();
  if(!task){ toast('Task required','err'); return; }
  const rec = {
    id: todoId || undefined,
    task,
    assignee: $('im-t-asg')?.value?.trim() || null,
    due_date: $('im-t-due')?.value || null,
    priority: $('im-t-prio')?.value || 'normal',
    status: $('im-t-status')?.value || 'open',
    notes: $('im-t-notes')?.value?.trim() || null
  };
  await imSaveTodo(id, rec);
  closeModal();
  imRenderSub(id);
  toast(todoId?'Updated':'Added','ok');
}

async function imToggleTodoDone(id, todoId){
  const t = (IM_TODOS[id]||[]).find(x=>x.id===todoId);
  if(!t) return;
  await imSaveTodo(id, {...t, status:'done'});
  imRenderSub(id);
}

async function imRemoveTodo(id, todoId){
  if(!confirm('Delete this to-do?')) return;
  await imDeleteTodo(id, todoId);
  imRenderSub(id);
}

// ── FOLLOW-UPS SUB-TAB ───────────────────────────────────────────────────────
function imRenderFollowups(el, id){
  const fups = (IM_FOLLOWUPS[id]||[]).slice();
  // Group by status
  const groups = {open:[], in_progress:[], done:[]};
  fups.forEach(f => { (groups[f.status]||groups.open).push(f); });

  const renderGroup = (label, color, list) => {
    if(!list.length) return '';
    const cards = list.map(f => `
      <div class="card" style="padding:14px 16px;margin-bottom:10px;border-left:3px solid ${color};">
        <div style="display:flex;align-items:flex-start;gap:10px;">
          <div style="flex:1;min-width:0;">
            <div style="font-size:14px;font-weight:600;margin-bottom:4px;">${esc(f.title)}</div>
            ${f.description ? `<div class="sm" style="color:var(--text-2);margin-bottom:6px;">${esc(f.description)}</div>` : ''}
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
              ${imPrioBadge(f.priority||'normal')}
              ${f.owner ? `<span class="badge bg-gray" style="font-size:10px;">👤 ${esc(f.owner)}</span>` : ''}
              ${f.due_date ? `<span class="badge bg-gray" style="font-size:10px;">📅 ${imFmtDate(f.due_date)}</span>` : ''}
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:5px;">
            ${f.status!=='done'?`<button class="btn btn-outline btn-sm" onclick="imResolveFollowup('${esc(id)}','${esc(f.id)}')">Resolve</button>`:''}
            <button class="btn btn-ghost btn-sm" title="Edit" onclick="imEditFollowup('${esc(id)}','${esc(f.id)}')">✎</button>
            <button class="btn btn-ghost btn-sm" title="Delete" onclick="imRemoveFollowup('${esc(id)}','${esc(f.id)}')">✕</button>
          </div>
        </div>
      </div>`).join('');
    return `<div style="margin-bottom:18px;"><div class="sec-label" style="margin-bottom:8px;">${label} (${list.length})</div>${cards}</div>`;
  };

  const body = fups.length
    ? renderGroup('Open', '#f59e0b', groups.open) + renderGroup('In Progress', '#3b82f6', groups.in_progress) + renderGroup('Done', '#10b981', groups.done)
    : `<div class="card" style="padding:32px;text-align:center;">
        <div style="font-size:28px;margin-bottom:8px;">↗</div>
        <div style="font-size:15px;font-weight:600;margin-bottom:6px;">No follow-ups yet</div>
        <div class="muted sm" style="margin-bottom:14px;">Track items that need to circle back after the meeting.</div>
        <button class="btn btn-accent btn-sm" onclick="imEditFollowup('${esc(id)}',null)">+ Add Follow-Up</button>
      </div>`;

  el.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
      <div class="muted sm">${fups.length} follow-up${fups.length===1?'':'s'}</div>
      <button class="btn btn-accent btn-sm" onclick="imEditFollowup('${esc(id)}',null)">+ Follow-Up</button>
    </div>
    ${body}`;
}

function imEditFollowup(id, fid){
  const f = fid ? (IM_FOLLOWUPS[id]||[]).find(x=>x.id===fid) : {title:'', description:'', owner:'', due_date:'', priority:'normal', status:'open'};
  if(!f){ toast('Not found','err'); return; }
  const body = `
    <div class="field"><label>Title</label><input id="im-f-title" value="${esc(f.title||'')}" placeholder="Follow-up item"></div>
    <div class="field"><label>Description</label><textarea id="im-f-desc" rows="3">${esc(f.description||'')}</textarea></div>
    <div class="frow">
      <div class="fcol field"><label>Owner</label><input id="im-f-owner" value="${esc(f.owner||'')}" placeholder="Person / role"></div>
      <div class="fcol field"><label>Due Date</label><input id="im-f-due" type="date" value="${esc(f.due_date||'')}"></div>
    </div>
    <div class="frow">
      <div class="fcol field"><label>Priority</label>
        <select id="im-f-prio">${['low','normal','high','critical'].map(p=>`<option value="${p}" ${f.priority===p?'selected':''}>${p}</option>`).join('')}</select>
      </div>
      <div class="fcol field"><label>Status</label>
        <select id="im-f-status">${['open','in_progress','done'].map(s=>`<option value="${s}" ${f.status===s?'selected':''}>${s.replace('_',' ')}</option>`).join('')}</select>
      </div>
    </div>`;
  const foot = `
    <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
    <button class="btn btn-accent" onclick="imSaveFollowupModal('${esc(id)}','${esc(fid||'')}')">Save</button>`;
  openModal(fid?'Edit Follow-Up':'+ New Follow-Up', body, foot);
}

async function imSaveFollowupModal(id, fid){
  const title = $('im-f-title')?.value?.trim();
  if(!title){ toast('Title required','err'); return; }
  const rec = {
    id: fid || undefined,
    title,
    description: $('im-f-desc')?.value?.trim() || null,
    owner: $('im-f-owner')?.value?.trim() || null,
    due_date: $('im-f-due')?.value || null,
    priority: $('im-f-prio')?.value || 'normal',
    status: $('im-f-status')?.value || 'open'
  };
  await imSaveFollowup(id, rec);
  closeModal();
  imRenderSub(id);
  toast(fid?'Updated':'Added','ok');
}

async function imResolveFollowup(id, fid){
  const f = (IM_FOLLOWUPS[id]||[]).find(x=>x.id===fid);
  if(!f) return;
  await imSaveFollowup(id, {...f, status:'done'});
  imRenderSub(id);
  toast('Resolved','ok');
}

async function imRemoveFollowup(id, fid){
  if(!confirm('Delete this follow-up?')) return;
  await imDeleteFollowup(id, fid);
  imRenderSub(id);
}

// ── AI NOTES SUB-TAB (transcript import + auto-extract) ──────────────────────
function imRenderAiNotes(el, id){
  const transcripts = IM_TRANSCRIPTS[id] || [];

  const services = [
    {k:'otter',   l:'Otter.ai',   url:'https://otter.ai/home',         note:'Open the meeting → Export → copy transcript.'},
    {k:'firefly', l:'Fireflies',  url:'https://app.fireflies.ai',      note:'Open meeting → Notepad → copy transcript.'},
    {k:'granola', l:'Granola',    url:'https://granola.ai',            note:'Click meeting → Copy AI summary or full transcript.'},
    {k:'plaud',   l:'Plaud',      url:'https://web.plaud.ai',          note:'Open recording → Transcript tab → copy text.'},
    {k:'manual',  l:'Other',      url:'',                              note:'Paste any transcript text from any source.'}
  ];

  const recordersHtml = services.map(s => `
    <div class="card" style="padding:12px 14px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">
        <span style="font-weight:700;font-size:13px;">${esc(s.l)}</span>
        ${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener" class="badge bg-blue" style="font-size:10px;text-decoration:none;">Open ↗</a>` : ''}
      </div>
      <div class="muted sm">${esc(s.note)}</div>
    </div>`).join('');

  const tHtml = transcripts.length ? transcripts.map(t => `
    <div class="card" style="padding:14px 18px;margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <div style="display:flex;gap:8px;align-items:center;">
          <span class="badge bg-gray" style="font-size:10px;text-transform:capitalize;">${esc(t.source||'manual')}</span>
          <span class="muted sm" style="font-family:'DM Mono',monospace;">${imFmtDate(t.created_at)} ${imFmtTime(t.created_at)}</span>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="imRemoveTranscript('${esc(id)}','${esc(t.id)}')">✕</button>
      </div>
      ${t.parsed_json ? `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
          <div>
            <div class="sec-label">Extracted Action Items</div>
            ${(t.parsed_json.action_items||[]).length ? '<ul style="margin:6px 0 6px 20px;font-size:13px;">' + t.parsed_json.action_items.map(a=>`<li>${esc(a)}</li>`).join('') + '</ul>' : '<div class="muted sm">None detected</div>'}
            ${(t.parsed_json.action_items||[]).length ? `<button class="btn btn-outline btn-sm" onclick="imAddTranscriptToTodos('${esc(id)}','${esc(t.id)}')">+ Add all to To-Dos</button>` : ''}
          </div>
          <div>
            <div class="sec-label">Extracted Decisions</div>
            ${(t.parsed_json.decisions||[]).length ? '<ul style="margin:6px 0 6px 20px;font-size:13px;">' + t.parsed_json.decisions.map(d=>`<li>${esc(d)}</li>`).join('') + '</ul>' : '<div class="muted sm">None detected</div>'}
            ${(t.parsed_json.decisions||[]).length ? `<button class="btn btn-outline btn-sm" onclick="imAddTranscriptDecisionsToNotes('${esc(id)}','${esc(t.id)}')">+ Add as decision notes</button>` : ''}
          </div>
        </div>` : ''}
      <details style="margin-top:10px;">
        <summary style="cursor:pointer;font-size:12px;color:var(--text-3);">View raw transcript (${(t.raw_text||'').length} chars)</summary>
        <div class="raw-block" style="margin-top:8px;max-height:240px;">${esc(t.raw_text||'')}</div>
      </details>
    </div>`).join('') : '';

  el.innerHTML = `
    <div class="alert alert-info" style="margin-bottom:14px;">
      <strong>How AI Note Taking Works in AccentOS:</strong> Use any meeting recorder (Otter, Fireflies, Granola, Plaud), then export the transcript and paste it below. AccentOS extracts action items and decisions automatically. Direct API integration is on the roadmap once Phase 1 budget is approved.
    </div>

    <div style="font-size:13px;font-weight:700;margin:18px 0 10px;">🎙️ Connect Your Recorder</div>
    <div class="g3" style="margin-bottom:18px;">${recordersHtml}</div>

    <div style="font-size:13px;font-weight:700;margin:18px 0 10px;">📥 Import Transcript</div>
    <div class="card" style="padding:16px 18px;margin-bottom:14px;">
      <div class="frow" style="margin-bottom:10px;">
        <div class="fcol field" style="margin-bottom:0;"><label>Source</label>
          <select id="im-tx-source">
            <option value="otter">Otter.ai</option>
            <option value="firefly">Fireflies</option>
            <option value="granola">Granola</option>
            <option value="plaud">Plaud</option>
            <option value="manual" selected>Other / Manual</option>
          </select>
        </div>
      </div>
      <div class="field"><label>Paste Transcript</label>
        <textarea id="im-tx-text" rows="8" placeholder="Paste the full transcript here…&#10;&#10;Tips that help extraction:&#10;• Action items: 'will do', 'needs to', 'todo:', 'follow up'&#10;• Decisions: 'decided', 'agreed', 'we will', 'plan is to'"></textarea>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:8px;">
        <button class="btn btn-accent btn-sm" onclick="imParseTranscript('${esc(id)}')">🔍 Extract Key Items</button>
      </div>
    </div>

    ${transcripts.length ? `<div style="font-size:13px;font-weight:700;margin:18px 0 10px;">📜 Imported Transcripts (${transcripts.length})</div>` : ''}
    ${tHtml}`;
}

function imParseTranscript(id){
  const text = $('im-tx-text')?.value?.trim();
  const source = $('im-tx-source')?.value || 'manual';
  if(!text){ toast('Paste a transcript first','err'); return; }

  // Simple line-based extraction — robust enough for most transcripts
  const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);
  const action_items = [];
  const decisions = [];
  const aRe = /(action item|todo|to-do|will do|needs to|need to|follow up|follow-up|let'?s|we should|i'?ll|she'?ll|he'?ll|they'?ll|assign|owner)\s*[:\-]?\s*(.{8,200})/i;
  const dRe = /(decided|decision|agreed|we will|the plan is|approved|chose|going with|consensus)\s*[:\-]?\s*(.{8,200})/i;

  lines.forEach(line => {
    // strip speaker labels e.g. "Michael:" or "[09:32] Michael —"
    const clean = line.replace(/^\[?\d{1,2}:\d{2}\]?\s*/, '').replace(/^[A-Z][a-zA-Z\s.]{1,40}[:—-]\s*/, '').trim();
    const a = clean.match(aRe);
    if(a && a[2]){ action_items.push(a[2].replace(/[.,;]+$/,'').trim()); return; }
    const d = clean.match(dRe);
    if(d && d[2]){ decisions.push(d[2].replace(/[.,;]+$/,'').trim()); }
  });

  const transcript = {
    id: '_tx'+Date.now(),
    meeting_id: id,
    source,
    raw_text: text,
    parsed_json: { action_items: [...new Set(action_items)].slice(0,40), decisions: [...new Set(decisions)].slice(0,40) },
    created_at: new Date().toISOString()
  };
  if(!IM_TRANSCRIPTS[id]) IM_TRANSCRIPTS[id] = [];
  IM_TRANSCRIPTS[id].unshift(transcript);

  // Persist if Supabase configured — reconcile temp id with real DB UUID so same-session delete works
  if(id.startsWith('_')){
    console.warn('[meetings] transcript saved locally only — meeting "'+id+'" is not a Supabase row, other devices will not see it.');
  }
  if(sbConfigured() && !id.startsWith('_')){
    const {id:_, ...body} = transcript;
    sbFetch('/meeting_transcripts', {method:'POST', headers:{'Prefer':'return=representation'}, body: JSON.stringify(body)})
      .then(res => {
        const saved = Array.isArray(res) ? res[0] : res;
        if(saved?.id){
          const i = IM_TRANSCRIPTS[id].findIndex(x => x.id === transcript.id);
          if(i >= 0) IM_TRANSCRIPTS[id][i] = saved;
        }
      })
      .catch(e => console.warn('[transcripts] save failed:', e.message));
  }

  if($('im-tx-text')) $('im-tx-text').value = '';
  toast(`Extracted ${transcript.parsed_json.action_items.length} actions, ${transcript.parsed_json.decisions.length} decisions`,'ok');
  imRenderSub(id);
}

async function imAddTranscriptToTodos(id, tid){
  const t = (IM_TRANSCRIPTS[id]||[]).find(x => x.id===tid);
  if(!t?.parsed_json?.action_items?.length){ toast('No actions to add','err'); return; }
  for(const task of t.parsed_json.action_items){
    await imSaveTodo(id, { task, status:'open', priority:'normal' });
  }
  toast(`Added ${t.parsed_json.action_items.length} to-dos`,'ok');
}

async function imAddTranscriptDecisionsToNotes(id, tid){
  const t = (IM_TRANSCRIPTS[id]||[]).find(x => x.id===tid);
  if(!t?.parsed_json?.decisions?.length){ toast('No decisions to add','err'); return; }
  for(const d of t.parsed_json.decisions){
    await imSaveNote(id, d, 'decision');
  }
  toast(`Added ${t.parsed_json.decisions.length} decisions to notes`,'ok');
}

function imRemoveTranscript(id, tid){
  if(!confirm('Remove this transcript? Extracted items already added to to-dos/notes will remain.')) return;
  IM_TRANSCRIPTS[id] = (IM_TRANSCRIPTS[id]||[]).filter(x => x.id!==tid);
  // delete from supabase if applicable
  if(sbConfigured() && !id.startsWith('_') && !tid.startsWith('_')){
    sbFetch(`/meeting_transcripts?id=eq.${tid}`, {method:'DELETE', headers:{'Prefer':'return=minimal'}}).catch(()=>{});
  }
  imRenderSub(id);
}

// ── NEW MEETING MODAL ────────────────────────────────────────────────────────
function imNewMeeting(){
  const today = new Date().toISOString().slice(0,10);
  const body = `
    <div class="field"><label>Title</label><input id="im-m-title" placeholder="e.g. Q3 Owner Briefing"></div>
    <div class="frow">
      <div class="fcol field"><label>Meeting Date</label><input id="im-m-date" type="date" value="${today}"></div>
      <div class="fcol field"><label>Type</label>
        <select id="im-m-type">
          <option value="general">General</option>
          <option value="owner_review">Owner Review</option>
          <option value="team_standup">Team Standup</option>
          <option value="vendor_strategy">Vendor Strategy</option>
          <option value="tech_update">Tech Update</option>
          <option value="one_on_one">One-on-One</option>
        </select>
      </div>
      <div class="fcol field"><label>Status</label>
        <select id="im-m-status">
          <option value="prep">In Prep</option>
          <option value="active">Active</option>
          <option value="complete">Complete</option>
          <option value="archived">Archived</option>
        </select>
      </div>
    </div>
    <div class="field"><label>Attendees (comma-separated)</label><input id="im-m-att" placeholder="Michael Graf, Paul Graf, Patrick Graf"></div>
    <div class="field"><label>Description</label><textarea id="im-m-desc" rows="3" placeholder="Purpose of the meeting…"></textarea></div>`;
  const foot = `
    <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
    <button class="btn btn-accent" onclick="imSaveNewMeeting()">Create Meeting</button>`;
  openModal('+ New Meeting', body, foot);
}

async function imSaveNewMeeting(){
  const title = $('im-m-title')?.value?.trim();
  if(!title){ toast('Title required','err'); return; }
  const att = ($('im-m-att')?.value || '').split(',').map(s=>s.trim()).filter(Boolean);
  const rec = {
    title,
    meeting_date: $('im-m-date')?.value || null,
    meeting_type: $('im-m-type')?.value || 'general',
    status: $('im-m-status')?.value || 'prep',
    attendees: att,
    description: $('im-m-desc')?.value?.trim() || null
  };
  const saved = await imSaveMeeting(rec);
  closeModal();
  if(saved?.id){
    IM_CUR_ID = saved.id;
    IM_CUR_SUB = 'prep';
    if(!IM_PREP[saved.id]) IM_PREP[saved.id] = [];
    if(!IM_NOTES[saved.id]) IM_NOTES[saved.id] = [];
    if(!IM_TODOS[saved.id]) IM_TODOS[saved.id] = [];
    if(!IM_FOLLOWUPS[saved.id]) IM_FOLLOWUPS[saved.id] = [];
    if(!IM_AGENDA[saved.id]) IM_AGENDA[saved.id] = [];
    toast('Meeting created','ok');
  }
  imRender();
}

function imEditMeeting(id){
  const m = IM_MEETINGS.find(x => x.id===id);
  if(!m){ toast('Not found','err'); return; }
  const body = `
    <div class="field"><label>Title</label><input id="im-em-title" value="${esc(m.title||'')}"></div>
    <div class="frow">
      <div class="fcol field"><label>Date</label><input id="im-em-date" type="date" value="${esc(m.meeting_date||'')}"></div>
      <div class="fcol field"><label>Type</label>
        <select id="im-em-type">
          ${['general','owner_review','team_standup','vendor_strategy','tech_update','one_on_one'].map(t => `<option value="${t}" ${m.meeting_type===t?'selected':''}>${t.replace('_',' ')}</option>`).join('')}
        </select>
      </div>
      <div class="fcol field"><label>Status</label>
        <select id="im-em-status">
          ${['prep','active','complete','archived'].map(s => `<option value="${s}" ${m.status===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="field"><label>Attendees</label><input id="im-em-att" value="${esc((m.attendees||[]).join(', '))}"></div>
    <div class="field"><label>Description</label><textarea id="im-em-desc" rows="3">${esc(m.description||'')}</textarea></div>`;
  const foot = `
    <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
    <button class="btn btn-accent" onclick="imSaveEditedMeeting('${esc(id)}')">Save</button>`;
  openModal('Edit Meeting', body, foot);
}

async function imSaveEditedMeeting(id){
  const title = $('im-em-title')?.value?.trim();
  if(!title){ toast('Title required','err'); return; }
  const rec = {
    id,
    title,
    meeting_date: $('im-em-date')?.value || null,
    meeting_type: $('im-em-type')?.value || 'general',
    status: $('im-em-status')?.value || 'prep',
    attendees: ($('im-em-att')?.value || '').split(',').map(s=>s.trim()).filter(Boolean),
    description: $('im-em-desc')?.value?.trim() || null
  };
  if(id.startsWith('_')){
    const i = IM_MEETINGS.findIndex(x => x.id===id);
    if(i>=0) IM_MEETINGS[i] = {...IM_MEETINGS[i], ...rec};
  } else {
    await imSaveMeeting(rec);
  }
  closeModal();
  toast('Saved','ok');
  imRender();
}




