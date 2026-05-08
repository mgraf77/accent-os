# Handoff for Governance Restructuring
> Created: 2026-05-08 — stabilization pause before major repo restructuring

This document maps what exists, where coupling is tight, and what decisions the governance phase needs to make about where things live.

---

## Systems touched (this repo)

| System | Path | Runtime? | Dependencies |
|--------|------|----------|-------------|
| AccentOS app | `index.html`, `js/*.js` | Yes (Cloudflare Pages) | Supabase, Cloudflare Worker |
| Cloudflare Worker proxy | `worker/anthropic-proxy.js`, `wrangler.toml` | Yes (deployed separately) | Anthropic API key in Cloudflare secrets |
| SQL migrations | `sql/M##_*.sql` | Pending Michael | Supabase project |
| Skills runtime | `skills/airlock/`, `skills/efficiency-monitor/` | Yes (Node.js) | Node ≥18 |
| Skills docs-only | `skills/*/SKILL.md` | No (prompt instructions) | None |
| AccentOS operating system | `.claude/CLAUDE.md`, `skills/_index.md` | Via Claude Code | All of the above |

---

## What should go WHERE (governance decisions needed)

### Stay in AccentOS
- `index.html`, `js/*.js`, `sql/`, `worker/` — these are product code, AccentOS-specific.
- `BUILD_PLAN_CLAUDE.md`, `BUILD_PLAN_MICHAEL.md`, `BUILD_INTELLIGENCE.md`, `MASTER.md` — AccentOS project management.
- `module_modes.json`, `MODULE_MODES.md` — AccentOS feature rollout registry.
- `KPI_CATALOG.md` — AccentOS business intelligence definitions.

### Candidate for AgentOS / shared skills repo
- `skills/vibe-speak/` — pure communication style system, not AccentOS-specific.
- `skills/airlock/` — session integrity gate, reusable across any Claude Code project.
- `skills/efficiency-monitor/` — session observer, reusable.
- `skills/skill-forge/` — meta-skill for building skills.
- `skills/skill-eval-suite/` — skill quality evaluator.
- `skills/community-skill-vet/` — community skill vetting.
- `skills/brainstorm-build-handoff/` — planning workflow, reusable.
- `skills/codex-review/` — code review skill.
- `skills/doc-drift/` — documentation drift detector.
- `skills/decision-log/` — structured decision logging.
- `skills/priority-articulation/` — helps users articulate priorities.
- `skills/analysis-snapshot/` — snapshot generator.
- `skills/autonomous-mode/` — autonomous operation mode.

### Stay in AccentOS (business-specific skills)
- `skills/bc-business-review/` — AccentOS business analysis.
- `skills/bottleneck-finder/` — AccentOS-specific workflow analysis.
- `skills/broken-link-rescue/` — AccentOS web asset management.
- `skills/bulk-meta-description/` — AccentOS SEO.
- `skills/gmc-feed-audit/` — Google Merchant Center, AccentOS e-commerce.
- `skills/kpi-data-audit/` — AccentOS KPI layer.
- `skills/rep-group-matchmaker/` — AccentOS vendor reps.
- `skills/repo-scout/` — AccentOS-context research.
- `skills/schema-contract-tests/` — AccentOS Supabase schema.
- `skills/supabase-sql-magic/` — AccentOS Supabase.
- `skills/table-eda/` — AccentOS data exploration.
- `skills/vendor-*` (5 skills) — AccentOS vendor management.
- `skills/prompt-queue/` — AccentOS build queue management.
- `skills/build-plan-status/` — AccentOS build tracking.

---

## Areas of high coupling

### 1. `index.html` ↔ `js/*.js` — global state
All modules communicate via window-globals (`CUSTOMERS`, `INVENTORY`, `QUOTES`, `DEALS`, etc.). This is intentional for speed but means module extraction order matters. Any restructuring that splits modules into separate apps needs a state-sharing contract first.

### 2. CLAUDE.md AUTO-EXECUTE chain — linear boot sequence
Steps 1a–1k in `.claude/CLAUDE.md` are order-dependent. airlock runs at 1k; it depends on vibe-speak (1a–1g) and efficiency-monitor (1j) already having loaded. Reordering these breaks the boot chain.

### 3. Skills `_index.md` ↔ CLAUDE.md Step 23 — skill router
The skill router reads `_index.md` to decide when to invoke a skill vs solve ad-hoc. If skills move to a different repo, `_index.md` needs to either merge entries or point to the remote registry.

### 4. `scripts/efficiency-aggregate.sh` ↔ `.claude/settings.json` Stop hook
The Stop hook runs `efficiency-aggregate.sh` at session end. If `scripts/` moves, the hook path breaks. This is a single-line fix but easy to miss.

---

## Incomplete abstractions

| Abstraction | State | Risk |
|-------------|-------|------|
| Skills runtime contract | Each executable skill (airlock, efficiency-monitor) has its own entry-point shape | Low — only 2 runtime skills; divergence manageable now |
| Supabase schema versioning | SQL files are `M##_*.sql` numbered manually | Medium — no migration runner; Michael applies manually |
| Module Modes cross-device sync | localStorage only; Supabase table written, not run | Low — works for single-user now |
| AI proxy abstraction | `worker/anthropic-proxy.js` is a single worker with no routing | Low — works for current use |

---

## Duplicate / overlapping systems

| Overlap | Detail |
|---------|--------|
| `decision-log` skill + `BUILD_INTELLIGENCE.md` | Both capture build lessons. BUILD_INTELLIGENCE.md is per-project; decision-log is a generalized skill. Not harmful duplication. |
| `efficiency-monitor` scratch log + `WORK_IN_PROGRESS.md` | WIP tracks task state; efficiency scratch tracks signal patterns. Different concerns. |
| `session-handoff.md` (vibe-speak) + `WORK_IN_PROGRESS.md` | vibe-speak handoff is communication continuity; WIP is build task continuity. Different concerns. |

---

## Recommended cleanup before governance split

1. Delete `patch_quote.js` (dead code, repo root).
2. Decide the skills split (AccentOS vs AgentOS) and move skills to their target repo before adding more.
3. Add a `skills/_engine/` shared runtime (normalize, log, timeout) so future executable skills don't each re-implement the same patterns.
4. Document the global-state pattern in `BUILD_INTELLIGENCE.md` so future architects understand why modules use window-globals.

---

## Risky architectural zones

| Zone | Risk | Why |
|------|------|-----|
| `index.html` size | Medium | File started at 829KB; currently ~680KB after extraction. If more modules inline here it'll grow again. Discipline required. |
| AI API key handling | Medium | API key stored in sessionStorage, passed via Cloudflare Worker. Worker has no auth. If worker URL is known, anyone can use it. Acceptable for internal tool; not for public-facing. |
| Module Modes localStorage | Low | Single-user acceptable now; becomes a problem when second employee needs different overrides on their device. |
| Supabase anon JWT in source | Low | Publishable-by-design (RLS protects writes). Documented decision. |
