# gap-optimizer — Vision Map

> Distilled HAVE/NEED matrix from the AccentOS vision artifacts. Re-derive from
> source (MASTER.md §14, BUILD_PLAN, KPI_CATALOG, _index.md) on every gap-optimizer
> run; this file is a starting point, not a substitute for live reads.

## NEED set (capabilities the vision names)

### From MASTER.md §14 (the narrative)

| ID | Capability | Quote / paraphrase | Type |
|----|------------|--------------------|------|
| V01 | Daily brief auto-assembly | "Every role has a daily brief waiting when they log in" | agentic |
| V02 | Quote auto-generation from takeoff photos | "Sales quotes auto-generated from a takeoff photo" | agentic |
| V03 | Voice-note quote refinement | "refined with one voice note, submitted without touching a keyboard" | agentic |
| V04 | Customer profile auto-build | "Customer profiles build themselves from Windward, Google, LinkedIn, Gmail" | integration + agentic |
| V05 | Churn pre-detection | "knows which customers are about to churn before any human notices" | agentic L5 |
| V06 | Co-op auto-claim | "Vendor co-op money is claimed automatically before deadlines" | agentic L4-6 |
| V07 | Self-healing GMC feed | "Google Shopping feed is self-healing — issues flagged and queued for fix" | agentic L4 |
| V08 | Per-visitor-type personalization | "website personalized per visitor type (trade vs consumer vs designer)" | integration |
| V09 | Self-maintained integrations | "All integrations are self-maintained; no vendor dependency on Curtis" | meta-infra |

### From BUILD_PLAN_CLAUDE.md Track 6 (Phase 4 integrations)

| ID | Capability | Status | Type |
|----|------------|--------|------|
| T6.1 | GA4 pull + interpret | blocked on M06 | integration |
| T6.2 | Search Console pull + interpret | blocked on M06 | integration |
| T6.3 | BigCommerce REST API write-side | blocked on M04 | integration |
| T6.4 | Klaviyo flow management | blocked on M09 | integration |
| T6.5 | Trade Portal external-facing | open | integration |
| T6.6 | Vendor Portal external-facing | open | integration |
| T6.7 | AI Lighting Consultant customer-mode | shipped (no skill yet) | agentic |
| T6.8 | Intelligent Alerts (9-signal) | shipped UI; no skill router | agentic L3-4 |
| T6.9 | AI Demand Forecasting | shipped UI; no skill for analysis | agentic L5 |
| T6.10 | Public site embed | open | integration |
| T6.11 | Windward ERP read bridge | blocked on M03+M10 | integration |

### From Capability Ladder (MASTER.md)

| Level | Description | Coverage today |
|-------|-------------|----------------|
| 1 | Passive data store | ✅ |
| 2 | Reactive display | ✅ |
| 3 | Proactive alerts | ⚠ partial — no skill orchestrates the alert lifecycle |
| 4 | Draft actions (emails, claims, outreach) | ❌ no skill exists |
| 5 | Predictive (RFM, churn, demand) | ⚠ partial — UI exists, no skills |
| 6 | Autonomous (approve-then-execute) | ❌ no skill exists |

### From `_index.md` future-state

| ID | Capability | Source |
|----|------------|--------|
| I01 | Skill-ecosystem self-maintenance | "By 2027: skills are self-maintaining — meta-skill that watches for skill-regressions, auto-fixes broken references, proposes skill merges" |
| I02 | Skill performance tracking | "skill performance (how often matched, how often used, token savings, user satisfaction) tracked per skill" |
| I03 | Skill auto-deprecation | "Dying skills deprioritized; thriving skills taught to new MCPs" |
| I04 | Closed-loop gap optimization | (this document, this skill) |

## HAVE set (current 28-skill registry)

Categorized by which NEED rows each skill addresses:

| Skill | Primary capability covered |
|-------|----------------------------|
| vibe-speak | foundational comms framework |
| efficiency-monitor | emergent-demand pattern detection |
| skill-forge | skill creation from external sources |
| skill-eval-suite | per-skill regression testing |
| repo-scout | install-as-is evaluation |
| community-skill-vet | pre-install audit |
| codex-review | cross-agent review with safety gate |
| autonomous-mode | long-running unattended work |
| prompt-queue | deferred-prompt management |
| build-plan-status | git → build plan sync |
| bottleneck-finder | TOC-style critical path |
| decision-log | architectural decision capture |
| doc-drift | planning doc consistency |
| priority-articulation | vague priority → measurable rule |
| supabase-sql-magic | NL → SQL |
| table-eda | one-page table EDA |
| schema-contract-tests | dbt-style contract tests |
| kpi-data-audit | KPI catalog vs schema |
| analysis-snapshot | ad-hoc analysis → re-runnable artifact |
| vendor-cascade | vendor score traceability |
| vendor-clarity-test | vendor scoring sanity |
| vendor-onboard-checklist | new vendor verification |
| vendor-risk-register | vendor exposure tracking |
| rep-group-matchmaker | rep_group_id assignment |
| bc-business-review | weekly business review |
| bulk-meta-description | bulk SEO meta |
| gmc-feed-audit | GMC feed compliance |
| broken-link-rescue | URL health crawl |

## GAP set (NEED minus HAVE)

Derived live by gap-optimizer Steps 1–3. As of the seed date (2026-05-07), the unforged gaps are:

| Source ID | Gap | Type |
|-----------|-----|------|
| (this skill) | Closed-loop gap optimization | meta-infra |
| I01 | Skill regression / merge / deprecation watcher | meta-infra |
| I02 | Per-skill performance tracker (matched / used / saved) | meta-infra |
| T6.1 | GA4 insights skill | integration |
| T6.2 | Search Console skill | integration |
| T6.3 | BigCommerce REST write-side skill | integration |
| T6.4 | Klaviyo flow skill | integration |
| T6.11 | Windward ERP read-bridge skill | integration |
| V01 | Daily brief composer skill | agentic |
| V05 / L5 | Churn predictor skill | agentic |
| V06 | Co-op auto-claim drafter | agentic |
| V07 / T6.8 | Alert router (9-signal → action queue) | agentic |
| L4 | Email / outreach drafter skill | agentic |
| L6 | Action queue (approve-then-execute) | agentic |
| MASTER §14 | Next-action recommender (state → top-3 actions) | agentic |

## How this map gets updated

- Each gap-optimizer run reads MASTER.md, BUILD_PLAN, _index.md fresh — this file is for human reference and recovery, not the source of truth.
- When a vision artifact changes (MASTER.md edit, BUILD_PLAN check-off, new ladder level), the optimizer's next run will detect the delta automatically.
- When a skill ships and lands in `_index.md`, the optimizer's next run will mark its gap as COVERED, removing it from the queue, and append a `closed_since_last` entry to gap-log.md.
- Manually re-derive this file (`vision-map.md`) from source maybe once per quarter — only as a sanity check, not as the primary feed.
