# AccentOS skills registry

> Compact index of every skill in `skills/`. Used by `vibe-speak` Step 23 (skill discovery + routing) to detect when a Michael request matches an existing skill instead of brute-forcing the task.
>
> Read at session start (cold path per `vibe-speak` lazy-load contract). ~3k tokens.

## Schema

Each entry: name, 1-line summary, trigger phrases, when-to-use, when-NOT, companion skills.

Auto-regenerable: run `/vibe regenerate skill index` to rebuild from SKILL.md frontmatter.

---

## Skills

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

### decision-log
- summary: Capture go/no-go decisions about AccentOS architecture / vendor / schema / build sequencing.
- triggers: "log this decision", "decision: ...", "for the record", "noting that we chose..."
- when_to_use: any decision worth remembering > 1 week
- when_NOT: trivial implementation choices
- companion: analysis-snapshot, doc-drift

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

### gmc-feed-audit
- summary: Scan Google Merchant Center feed for missing images, disapproved status, schema gaps.
- triggers: "GMC audit", "merchant center check", "feed audit", "GMC compliance"
- when_to_use: weekly cadence, post-feed-update
- when_NOT: site-wide URL audit (use broken-link-rescue)
- companion: broken-link-rescue, bulk-meta-description

### kpi-data-audit
- summary: Cross-reference every KPI in KPI_CATALOG.md against live data sources, flag gaps.
- triggers: "KPI audit", "KPI data check", "KPI catalog audit", "what KPIs are real"
- when_to_use: periodic data integrity, before stakeholder report
- when_NOT: single-KPI verification (just query directly)
- companion: bc-business-review, table-eda

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

### skill-forge
- summary: Deep-research external tool, build custom AccentOS skill from it (extract → assess → forge → log).
- triggers: "look into [X]" (build-or-adapt), "build me a skill based on", "adapt [X] for me", "rip the good parts out of"
- when_to_use: ingest external concept, ship local custom skill
- when_NOT: install as-is (use repo-scout)
- companion: repo-scout, codex-review, skill-eval-suite

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

### podsplain
- summary: Generate a downloadable podcast-style WAV audio learning session on any topic, with two AI hosts in natural conversation. Eight scenarios: learn, boardroom, ralph-loop, interview, customer-onboarding, debate, pitch, postmortem.
- triggers: "podsplain [topic]", "make a podcast on [X]", "audio explainer for [X]", "podsplain [topic] as [scenario]", "create a [scenario] episode on [X]", "walk me through [X] like a podcast", "I want to listen to something on [X]", "pitch mode on [X]", "postmortem on [X]"
- when_to_use: learning a new concept via audio, interview prep, exec pitch practice, incident postmortems, scenario roleplay, anything to listen to hands-free
- when_NOT: quick text answers, live interactive conversation (V1 is WAV-only)
- companion: vibe-speak, skill-forge

### vibe-speak
- summary: AccentOS default communication framework — 9 modes, adaptive learning, native-English compression.
- triggers: auto-active per `.claude/CLAUDE.md`; mode switches: "caveman", "gsd", "vibesplain", "pair up", "teach me", "exec mode"
- when_to_use: every Claude Code session (default-on)
- when_NOT: when raw default Claude is needed (use raw mode)
- companion: skill-forge (proposes new modes / new skills)

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
