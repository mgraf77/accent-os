# AccentOS skills registry

> Compact index of every skill in `skills/`. Used by `vibe-speak` Step 23 (skill discovery + routing) to detect when a Michael request matches an existing skill instead of brute-forcing the task.
>
> Read at session start (cold path per `vibe-speak` lazy-load contract). ~3k tokens.

## Schema

Each entry: name, 1-line summary, trigger phrases, when-to-use, when-NOT, companion skills.

Auto-regenerable: run `/vibe regenerate skill index` to rebuild from SKILL.md frontmatter.

---

## Skills

### action-queue
- summary: Persist proposed AccentOS actions (drafted emails, BC writes, co-op claims, alert routings) to a Supabase action_queue table with state machine PROPOSED → APPROVED → EXECUTED → DISMISSED/ARCHIVED. Lifecycle manager only — execution delegated to executor skills via registry. M-task-blocked until action_queue table runs.
- triggers: "what's pending approval", "show the queue", "approve action [id]", "queue this action", "/queue", "dismiss [id]", "execute [id]"
- when_to_use: any agentic skill that produces a draft requiring approval before execution
- when_NOT: read-only analysis with no actions to queue
- companion: email-drafter, bc-rest-bridge, klaviyo-flows, coop-claim-drafter, alert-router, churn-predictor, daily-brief-composer

### alert-router
- summary: Convert AccentOS 9-signal Intelligent Alerts into routed action_queue items. Per-signal routing table (owner role × suggested skill × urgency tier × dedup key). Suppresses duplicates within 24h, escalates stale alerts to higher-tier surfaces.
- triggers: "route alerts", "process alerts", "alert router", "what alerts fired", "alert triage"
- when_to_use: after alerts generator fires, or on-demand alert review
- when_NOT: alert content authoring (use email-drafter)
- companion: action-queue, daily-brief-composer, email-drafter, churn-predictor

### analysis-snapshot
- summary: Capture an ad-hoc analysis (vendor query, deal investigation, GMC audit) as a named, re-runnable artifact.
- triggers: "save this analysis", "snapshot this query", "make this re-runnable"
- when_to_use: ad-hoc data inspection that should outlive the session
- when_NOT: one-off queries, exploratory work
- companion: supabase-sql-magic, table-eda, decision-log

### autonomous-mode
- summary: Switch Claude into long-running autonomous-work mode for AccentOS builds when Michael steps away.
- triggers: "I'm going to lunch — do X", "I'm going to bed", "build while I'm gone", "autonomous"
- when_to_use: long unattended build sessions
- when_NOT: discussion / design work
- companion: prompt-queue, build-plan-status

### bc-business-review
- summary: Generate weekly Accent Lighting business review (revenue, AOV, top vendors, anomalies).
- triggers: "weekly review", "business review", "weekly numbers", "AccentOS recap"
- when_to_use: scheduled weekly cadence, executive snapshot
- when_NOT: ad-hoc data questions (use supabase-sql-magic)
- companion: kpi-data-audit, vendor-cascade, gmc-feed-audit

### bc-rest-bridge
- summary: BigCommerce REST write-side automation for Accent Lighting store-cwqiwcjxes — price updates, product field edits, custom fields, category assignments. Always invoked as action-queue executor for action_type=update_bc_product; never accepts direct write commands. M04-blocked stub mode until BC API write credentials provisioned.
- triggers: "execute the BC writes", "send the meta updates to BigCommerce", "execute action [id]" (when action_type=update_bc_product)
- when_to_use: only as action-queue executor after Michael approves the diff
- when_NOT: read-side BC queries (use existing BC modules), direct write commands (refused by design)
- companion: action-queue (only invoker), gmc-feed-audit, bulk-meta-description, bc-business-review

### bottleneck-finder
- summary: Identify the single track or M-task whose completion would unblock the most downstream work.
- triggers: "what's blocking us", "biggest bottleneck", "what unblocks the most", "critical path"
- when_to_use: planning sessions, when stuck choosing what to build next
- when_NOT: when next item is obvious
- companion: build-plan-status, priority-articulation

### broken-link-rescue
- summary: Crawl Accent Lighting product URLs and flag 404s, 5xx, redirect chains.
- triggers: "check broken links", "404 audit", "site crawl", "URL health"
- when_to_use: post-deploy verification, periodic SEO health
- when_NOT: feed-specific issues (use gmc-feed-audit)
- companion: gmc-feed-audit, schema-contract-tests

### build-plan-status
- summary: Auto-sync BUILD_PLAN markers from git commits and SESSION_LOG.
- triggers: "sync build plan", "update plan", "what shipped", "plan drift check"
- when_to_use: end of session, after a flurry of commits
- when_NOT: greenfield planning (use priority-articulation)
- companion: doc-drift, bottleneck-finder

### bulk-meta-description
- summary: Generate SEO meta descriptions for batches of Accent Lighting BigCommerce products.
- triggers: "bulk meta", "SEO descriptions", "batch metadata", "GMC fix-up"
- when_to_use: post-feed-audit fixes, vendor batch onboarding
- when_NOT: single-product writing
- companion: gmc-feed-audit, broken-link-rescue

### churn-predictor
- summary: RFM-deviation analysis (recency / frequency / monetary) on Accent Lighting customers. Per-customer baseline (rolling 365-day median) vs. last-90-day window; flags churn risk before manual notice. Outputs ranked customer list with reason codes (RECENCY_DROP_TRADE, FREQUENCY_HALVED, BIG_SPENDER_GONE_QUIET) + suggested intervention skill.
- triggers: "churn risk", "who's about to churn", "RFM check", "predict churn", "churn predictor"
- when_to_use: weekly cadence + ad-hoc when CRM signals look off
- when_NOT: post-churn analysis (use bc-business-review or supabase-sql-magic)
- companion: email-drafter (intervention drafts), action-queue, daily-brief-composer (top-3 risks), klaviyo-flows (segment overlap), supabase-sql-magic, analysis-snapshot

### codex-review
- summary: Have OpenAI Codex audit recent AccentOS work, auto-apply low-risk fixes, surface high-risk for approval.
- triggers: "codex review", "have codex check this", "peer review", "second-opinion", "cross-review"
- when_to_use: branch / commit / file / skill review with safety gate
- when_NOT: long-lived module review (use ultrareview), one-line typos
- companion: skill-eval-suite, skill-forge

### community-skill-vet
- summary: Audit a candidate community Claude skill before installing.
- triggers: "vet this skill", "is this skill safe", "community skill audit"
- when_to_use: before installing skill from external repo
- when_NOT: skills you wrote yourself
- companion: codex-review, skill-forge

### coop-claim-drafter
- summary: Auto-draft vendor co-op claims before deadlines. Specialization of email-drafter for portfolio scan: pulls vendor co-op rules from Supabase, computes eligible spend per vendor, prioritizes by deadline-urgency × claim-amount. Builds context block + delegates voice-pass to email-drafter; routes via action-queue. Partial-block on missing vendor_overrides co-op fields.
- triggers: "draft co-op claims", "what co-op is about to expire", "co-op deadline scan", "claim vendor co-op"
- when_to_use: weekly portfolio scan, monthly co-op deadline review
- when_NOT: single-vendor email (use email-drafter directly)
- companion: email-drafter, action-queue, vendor-cascade, vendor-risk-register, daily-brief-composer

### daily-brief-composer
- summary: Assemble role-aware morning brief (Owner / Sales / Marketing / Ops) from Supabase: today's top-3 actions, deals at risk, vendors needing attention, KPI deviations. Output is paste-ready Markdown for the Daily Command Center UI. Section catalog lives in references/role-templates.md (add roles via Edit, not skill change).
- triggers: "morning brief", "what's on my plate", "[role] brief" (e.g. "owner brief"), "daily brief", "today's brief"
- when_to_use: every morning, or on-demand role-specific snapshot
- when_NOT: weekly cadence (use bc-business-review)
- companion: next-action-recommender, alert-router, kpi-data-audit, vendor-cascade, churn-predictor, supabase-sql-magic

### decision-log
- summary: Capture go/no-go decisions about AccentOS architecture / vendor / schema / build sequencing.
- triggers: "log this decision", "decision: ...", "for the record", "noting that we chose..."
- when_to_use: any decision worth remembering > 1 week
- when_NOT: trivial implementation choices
- companion: analysis-snapshot, doc-drift

### demand-forecaster-skill
- summary: Skill-side counterpart to the Track 6.9 AI Demand Forecasting UI. Two modes: (1) forecast — 30/60/90-day SKU demand projection via rolling-average + seasonality decomposition; (2) recommend-po — for a vendor, list SKUs needing reorder now. Uses Windward orders if connected, BC-only fallback otherwise.
- triggers: "forecast demand for", "what should I reorder", "demand forecast", "recommend a PO", "SKU forecast"
- when_to_use: monthly PO planning, ad-hoc inventory questions
- when_NOT: actual purchase order placement (use action-queue + bc-rest-bridge or Windward write)
- companion: vendor-cascade, bc-business-review, action-queue, coop-claim-drafter, windward-bridge, analysis-snapshot

### doc-drift
- summary: Cross-check AccentOS planning docs (SESSION_LOG, MASTER, BUILD_PLAN, etc.) for inconsistencies.
- triggers: "doc drift", "are docs aligned", "check consistency", "do the docs agree"
- when_to_use: end of session, before a major milestone
- when_NOT: small WIP changes
- companion: build-plan-status, decision-log

### efficiency-monitor
- summary: Always-on observer that flags inefficiencies (retries, redundant reads, recurring multi-step patterns, skill bypass, clarification loops, redone WIP) and recommends patterns for promotion to real skills. Surfaces only at session boundaries.
- triggers: auto-active per `.claude/CLAUDE.md` step 1.j and step 8; manual: "efficiency check", "what could be a skill", "audit this session", "/efficiency end"
- when_to_use: every session (default-on, silent during work, surfaces at start + end)
- when_NOT: when you want raw work with zero meta-observation (use raw mode)
- companion: skill-forge (promotes candidates), vibe-speak (surfaces flags in current mode), build-plan-status

### email-drafter
- summary: Generate paste-ready outreach / follow-up / co-op-claim / quote-revival / vendor-correspondence emails from Supabase context (customer_id / vendor_id / deal_id / quote_id). Uses Anthropic API; preserves Michael's voice from vibe-speak profile. Always produces draft + subject + send-or-hold rec; never sends directly.
- triggers: "draft an email to [name]", "follow up with [customer]", "revive that quote", "draft outreach", "write [type] email"
- when_to_use: any 1:1 customer/vendor/deal email
- when_NOT: bulk marketing flows (use klaviyo-flows), portfolio co-op claims scan (use coop-claim-drafter)
- companion: coop-claim-drafter, action-queue, vendor-cascade, supabase-sql-magic, churn-predictor

### gap-optimizer
- summary: AccentOS goal-seeking optimizer that scans HAVE vs. NEED across the documented vision (MASTER §14, BUILD_PLAN, Capability Ladder, KPI catalog), merges with efficiency-monitor's emergent-demand queue, scores every gap on impact × frequency × buildability ÷ cost, and writes a ranked candidate-queue.md that feeds skill-forge.
- triggers: "run gap analysis", "what should we build next", "close the gap", "optimize skills", "gap optimizer", "/gap", "what skill should we forge"
- when_to_use: cadence-driven (weekly or end-of-milestone) + auto after every skill-forge commit
- when_NOT: building the skill itself (use skill-forge), evaluating an existing skill (use skill-eval-suite)
- companion: skill-forge (consumer), efficiency-monitor (emergent-demand producer), skill-health-monitor (post-build audit)

### ga4-insights
- summary: Pull GA4 data for Accent Lighting trade vs. consumer flows. Weekly traffic by source, top landing pages, conversion funnel split, anomaly flags (>2σ deviations). Hypothesis-library lookup for known root causes. M06-blocked stub mode until GA4 credentials provisioned.
- triggers: "GA4 insights", "GA4 weekly", "trade vs consumer traffic", "GA4 report"
- when_to_use: weekly cadence + ad-hoc traffic anomaly investigation
- when_NOT: SEO query data (use gsc-insights)
- companion: gsc-insights, bc-business-review, daily-brief-composer, analysis-snapshot

### gmc-feed-audit
- summary: Scan Google Merchant Center feed for missing images, disapproved status, schema gaps.
- triggers: "GMC audit", "merchant center check", "feed audit", "GMC compliance"
- when_to_use: weekly cadence, post-feed-update
- when_NOT: site-wide URL audit (use broken-link-rescue)
- companion: broken-link-rescue, bulk-meta-description

### gsc-insights
- summary: Pull Google Search Console queries / clicks / impressions / CTR / position. Surfaces top-mover SKUs, missed-impression opportunities (high impressions + low CTR = needs better meta — feeds bulk-meta-description), ranking drops. M06-blocked stub mode until GSC credentials provisioned.
- triggers: "GSC report", "missed impressions", "ranking drops", "search console insights"
- when_to_use: weekly SEO cadence + post-meta-update verification
- when_NOT: traffic / conversion analysis (use ga4-insights)
- companion: bulk-meta-description (downstream consumer), ga4-insights, broken-link-rescue, gmc-feed-audit

### kpi-data-audit
- summary: Cross-reference every KPI in KPI_CATALOG.md against live data sources, flag gaps.
- triggers: "KPI audit", "KPI data check", "KPI catalog audit", "what KPIs are real"
- when_to_use: periodic data integrity, before stakeholder report
- when_NOT: single-KPI verification (just query directly)
- companion: bc-business-review, table-eda

### klaviyo-flows
- summary: Read Klaviyo flow performance (open / click / conversion / revenue per flow), propose flow edits, monitor email engagement. Three modes: audit (rank flows), propose (draft edits with rationale), engagement (last-N-day summary + churn-segment overlap). Never auto-edits Klaviyo. M09-blocked stub mode until Klaviyo credentials provisioned.
- triggers: "klaviyo audit", "flow performance", "underperforming flows", "klaviyo engagement"
- when_to_use: weekly Klaviyo review + post-flow-edit verification
- when_NOT: single-email drafting (use email-drafter)
- companion: email-drafter, churn-predictor, bc-business-review, action-queue, daily-brief-composer

### next-action-recommender
- summary: Given current AccentOS state (deals, vendors, KPIs, alerts, action-queue depth, BUILD_PLAN_MICHAEL M-tasks), recommends top-3 high-leverage next actions. Leverage formula: (Impact × Time-sensitivity) ÷ (Effort × Blocked-by-penalty). Each recommendation cites a Supabase row or named gap; no generic advice. Self-calibrates against approval pattern.
- triggers: "what should I do next", "what are my top 3", "three things to act on", "highest-leverage move", "what would move the needle"
- when_to_use: morning planning, post-meeting recovery, when stuck
- when_NOT: tactical implementation choices (use bottleneck-finder for build-plan, decision-log for architecture)
- companion: daily-brief-composer (consumer), priority-articulation (input), bottleneck-finder, action-queue (PROPOSED queue source), supabase-sql-magic

### priority-articulation
- summary: Translate vague Accent Lighting priorities into measurable scoring rules with explicit weights.
- triggers: "what does priority X really mean", "make this measurable", "scoring rule for"
- when_to_use: leadership sets a vague goal, need to operationalize
- when_NOT: priorities already explicit
- companion: vendor-cascade, decision-log

### prompt-queue
- summary: Manage Michael's queued prompts in PROMPT_QUEUE.md without interrupting the current session.
- triggers: "queue this", "queue up", "save for later", "add to queue", "next session do"
- when_to_use: batch up future asks during current work
- when_NOT: synchronous urgent requests
- companion: autonomous-mode, build-plan-status

### rep-group-matchmaker
- summary: Suggest rep_group_id for unassigned Accent Lighting vendors based on category / region / overlap.
- triggers: "assign rep group", "match rep group", "M19 fix", "unassigned vendors"
- when_to_use: M19 cleanup, new vendor onboarding without rep
- when_NOT: rep-group-already-assigned cases
- companion: vendor-onboard-checklist, vendor-cascade

### repo-scout
- summary: Autonomous GitHub/MCP/skill repository intelligence for AccentOS — find, evaluate, vet.
- triggers: "find a skill for", "is there a tool that", "look into [X]" (when X is install-or-skip), "MCP for"
- when_to_use: searching for an existing tool to install as-is
- when_NOT: build-or-adapt (use skill-forge)
- companion: skill-forge, community-skill-vet

### schema-contract-tests
- summary: Generate dbt-style contract test SQL for AccentOS Supabase tables (NOT NULL, UNIQUE, FK).
- triggers: "contract tests", "schema tests", "data integrity", "constraint check"
- when_to_use: post-migration, periodic data integrity
- when_NOT: ad-hoc query work
- companion: supabase-sql-magic, table-eda, kpi-data-audit

### skill-eval-suite
- summary: Generate Promptfoo-compatible eval YAML for AccentOS skills (5–8 test cases including gotchas).
- triggers: "eval this skill", "test the skill", "skill regression test"
- when_to_use: after building / modifying a skill
- when_NOT: trivial skill changes
- companion: codex-review, skill-forge

### skill-health-monitor
- summary: AccentOS skill-ecosystem self-maintenance auditor. Scans every skill in skills/ for broken refs, dead companion-links, frontmatter rot, duplicate scope, staleness, and merge candidates. Produces a structured report with proposed Edits — never auto-edits.
- triggers: "skill audit", "skill health", "audit the skills", "are any skills broken", "find duplicate skills", "/skill-health", "should we merge X and Y"
- when_to_use: after skill-forge commits, weekly cadence, when gap-optimizer flags queue saturation
- when_NOT: building a new skill (use skill-forge), choosing what to build (use gap-optimizer)
- companion: gap-optimizer (paired loop), skill-forge (builds), skill-eval-suite (per-skill tests), efficiency-monitor (provides invocation counts)

### skill-forge
- summary: Deep-research external tool, build custom AccentOS skill from it (extract → assess → forge → log).
- triggers: "look into [X]" (build-or-adapt), "build me a skill based on", "adapt [X] for me", "rip the good parts out of"
- when_to_use: ingest external concept, ship local custom skill
- when_NOT: install as-is (use repo-scout)
- companion: repo-scout, codex-review, skill-eval-suite

### skill-performance-tracker
- summary: Per-skill metrics aggregator across sessions. Tracks match-rate (harness considered invoking), invocation-rate, token-savings estimate, user-satisfaction signal, staleness, eval-pass-rate. Three reports: leaderboard, underperformers, opportunity (high match + low invocation = bypass signal). Companion to skill-health-monitor (structural) and efficiency-monitor (in-session).
- triggers: "skill performance", "skill leaderboard", "underperforming skills", "skill metrics", "skill usage"
- when_to_use: monthly cadence, after major skill ecosystem changes
- when_NOT: structural skill issues (use skill-health-monitor), in-session inefficiencies (use efficiency-monitor)
- companion: efficiency-monitor (data source), skill-health-monitor, skill-eval-suite, gap-optimizer (consumer), daily-brief-composer (weekly leaderboard)

### supabase-sql-magic
- summary: Convert natural-language data questions to ready-to-run SQL against AccentOS Supabase.
- triggers: "query for", "SQL for", "show me data on", "ask the db"
- when_to_use: ad-hoc data investigation
- when_NOT: when SQL is already written / known
- companion: table-eda, schema-contract-tests, analysis-snapshot

### table-eda
- summary: One-page exploratory data analysis on any AccentOS Supabase table or query result.
- triggers: "EDA on", "explore this table", "data profile", "what's in [table]"
- when_to_use: first time touching a table, investigating data quality
- when_NOT: known-shape data
- companion: supabase-sql-magic, schema-contract-tests

### trade-vendor-portal
- summary: Contract-document skill for Trade and Vendor portals (Track 6.5 + 6.6). Heavily blocked on M03/M04/M11/M24/M40. Documents personas, surfaces, RLS scoping, hosting strategy, companion-skill bindings, build sequencing. Outputs documentation, not portal interactions, until blockers resolve.
- triggers: "trade portal", "vendor portal", "Track 6.5 / 6.6 plan", "external portal contract"
- when_to_use: portal planning, M-task unblock review
- when_NOT: portal user flow (no live portals exist yet)
- companion: vendor-cascade, bc-rest-bridge, coop-claim-drafter, demand-forecaster-skill, action-queue, daily-brief-composer

### vendor-cascade
- summary: Trace vendor scores from priorities down to metric weights and data fields; surface orphan metrics.
- triggers: "vendor cascade", "score traceability", "metric → priority", "orphan metrics"
- when_to_use: vendor scoring system audit
- when_NOT: single-vendor analysis (use vendor-clarity-test)
- companion: priority-articulation, vendor-risk-register, vendor-clarity-test

### vendor-clarity-test
- summary: Sample N random vendors and verify each one's #1 score driver is consistent across vendor_scores / overrides / metrics tables.
- triggers: "vendor clarity", "spot-check vendors", "vendor scoring sanity"
- when_to_use: post-vendor-scoring-update sanity check
- when_NOT: full system audit (use vendor-cascade)
- companion: vendor-cascade, schema-contract-tests

### vendor-onboard-checklist
- summary: Verify a new AccentOS vendor row is complete (rep_group_id, terms, contact, score baseline).
- triggers: "onboard vendor", "new vendor checklist", "vendor complete?"
- when_to_use: every new vendor add, M19 fixes
- when_NOT: existing-vendor edits
- companion: rep-group-matchmaker, vendor-risk-register

### vendor-risk-register
- summary: Track vendor risk factors (concentration, dispute history, payment terms drift, sourcing) with named risk classes.
- triggers: "vendor risks", "risk register", "concentration risk", "vendor exposure"
- when_to_use: quarterly review, before high-stakes vendor decision
- when_NOT: single-vendor audits
- companion: vendor-cascade, vendor-clarity-test

### vibe-speak
- summary: AccentOS default communication framework — 9 modes, adaptive learning, native-English compression.
- triggers: auto-active per `.claude/CLAUDE.md`; mode switches: "caveman", "gsd", "vibesplain", "pair up", "teach me", "exec mode"
- when_to_use: every Claude Code session (default-on)
- when_NOT: when raw default Claude is needed (use raw mode)
- companion: skill-forge (proposes new modes / new skills)

### windward-bridge
- summary: Read-only Windward ERP bridge. Pre-defined query patterns: customer balance, invoice aging, inventory by SKU, vendor balance, recent orders. Read-only by hard policy — Windward is system of record for finance/inventory; AccentOS never writes. M03+M10-blocked stub mode until Windward read access established.
- triggers: "windward query", "windward balance", "ERP lookup", "windward customer", "windward inventory"
- when_to_use: financial / inventory queries that need Windward source-of-truth
- when_NOT: BC-side data (use existing BC modules), forecasting (use demand-forecaster-skill)
- companion: bc-business-review, churn-predictor, vendor-cascade, coop-claim-drafter, demand-forecaster-skill, analysis-snapshot

---

## How vibe-speak uses this registry

Per SKILL.md Step 23:

1. At session start, read this file (~3k tokens, cached for session)
2. For each Michael request, check description + triggers against the request
3. If match confidence > 0.5, surface the matched skill suggestion
4. If no match but task feels routine (≥3 brute-force tool calls), surface "use skill-forge to build one?"
5. Track repeated brute-force patterns; propose new skill when same pattern hits ≥3 times

## Maintenance

- New skill added: append entry here when committed.
- Skill removed: remove entry here in the same commit.
- Auto-regenerate: `/vibe regenerate skill index` parses every `skills/*/SKILL.md` frontmatter and rebuilds.
- Test: `/vibe find skill [topic]` runs the matching against this file.
