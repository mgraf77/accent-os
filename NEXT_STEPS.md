# NEXT_STEPS.md — Resume points after governance restructuring

## Resume order (post-restructure)

### Step 1 — Re-validate the planning artifacts survived the restructure
Check that these files still exist and are coherent:
- `ROADMAP_2026.md` (v3.1, append-only Decisions Log)
- `BUILD_PLAN_CLAUDE.md` (Tracks 0-14)
- `BUILD_PLAN_MICHAEL.md` (M01-M40)
- `BUILD_STATUS.md` (regenerate via `bash scripts/build-status.sh`)

If any moved repos (e.g., to AgentOS or a new Skills repo), re-anchor cross-references.

### Step 2 — Confirm or revise threshold + roadmap version
The plan reached v3.1 / 93% / leverage 8.0. If governance restructure changed:
- repo boundaries → revisit §13 BC Site Maximization (theme repo location)
- skill organization → revisit §10 retrofit kit (it assumed all skills in `skills/`)
- AI infra ownership → revisit §2 principles 6 (cost-bounded AI) and 7 (security gate)

Append a Decisions Log entry to `ROADMAP_2026.md` capturing what changed.

### Step 3 — First execution target (when "go" is given)
Per `ROADMAP_2026.md` §7 schedule, W1-W16:

**Week 1 work, fully unblocked (no Michael deps):**
- 7.3 Threshold service (Bayesian Beta-LCB)
- 7.4 Heartbeat dashboard v1 (6 metrics)
- 7.6 Dev platform (bundler + types + Playwright) — risky, gate behind feature flag through W4
- 7.13 Module retrofit kit (6 shared primitives)
- 7.14 First 5 retrofit pilots (Daily Brief, Quotes, Pipeline, Vendor Intel, Employee Scorecards)

**Week 1 work needing Michael unblock first:**
- 7.1 `automation_events` schema (needs M30 — write SQL → Michael runs)
- 7.2 AI Gateway (needs M31 — Anthropic billing cap)
- 7.5 Security gate CI (needs M32 — GH Actions + Supabase test creds)

### Step 4 — Pre-flight checklist before starting Phase 0

- [ ] Owner answers the W12 gating question (already pre-committed by Claude — Owner can ratify or revise)
- [ ] M30 SQL written by Claude, reviewed and run by Michael
- [ ] M31 Anthropic billing cap configured by Michael
- [ ] M32 GH Actions enabled with Supabase test creds by Michael
- [ ] Branch off `main` for first Phase 0 PR (one PR per Phase 0 item, not one big merge)

## Owner question still pending

The W12 gating question was pre-committed by Claude with default kill thresholds (see `ROADMAP_2026.md` §10 + my prior chat answer). **Owner should ratify or revise** the kill thresholds before A1-A8 ship to shadow mode.

## Sequencing risk to watch

The biggest scheduling risk identified by round 3:
> 150-pair eval set authoring underestimates Owner's time. Mitigation: agent drafts 200 candidates from `PROMPT_LOG.md` + `SESSION_LOG.md`, Owner edits 20/wk @ 90 sec/pair = 3.75h total. Hard-gate W7 surfaces on eval pass.

Start the agent-drafted candidate set early (W3 background) regardless of overall progress.

## Health gate trigger

Per ROADMAP §5 Phase 4: WAU/MAU <0.4 across top 10 modules for 2 weeks = freeze new module work, fix existing. **This requires Phase 0.A telemetry to be live first** — there is no current adoption baseline.

## Recommended pacing post-restructure

1. **Week 0 (post-restructure):** Re-validate planning docs, capture Decisions Log entry, confirm threshold.
2. **Week 1-2:** Phase 0 unblocked items (7.3, 7.4, 7.13, 7.14)
3. **Week 3:** W4 review gate; ratify Phase 1 priorities against Phase 0 telemetry data
4. **Week 4-12:** Phase 1 + Phase 2 + Phase 3 shadow per W1-W16 schedule
5. **Week 16:** End-to-end live state target

## When NOT to resume directly

If governance restructure significantly changes:
- AccentOS repo boundary
- Supabase project structure (e.g., split into multi-tenant)
- Auth provider
- Module loading mechanism

→ Run a delta-analysis pass on `ROADMAP_2026.md` v3.1 vs new constraints before starting Phase 0. Cheaper to adjust the plan than to mid-build pivot.
