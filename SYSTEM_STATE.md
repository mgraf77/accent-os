# SYSTEM_STATE.md — Authoritative Repo Snapshot

> Frozen reference point for the governance baseline. Captured before any major restructuring. Do not edit casually — re-snapshot in a new section if state changes.

**Snapshot taken:** 2026-05-08
**Captured by:** Claude Code session — governance-snapshot-prep-k3dBs
**Repo:** mgraf77/accent-os
**Working directory:** /home/user/accent-os

---

## 1. Git State

| Field | Value |
|---|---|
| Current branch | `claude/governance-snapshot-prep-k3dBs` |
| HEAD | `969de17` (wip: pause point — worker proxy needs redeploy + 400 debug) |
| Working tree | clean |
| Uncommitted files | none |
| Untracked files | none |
| Upstream tracking | **NOT CONFIGURED** — first push must use `git push -u origin claude/governance-snapshot-prep-k3dBs` |
| Remote | `origin` → http://local_proxy@127.0.0.1:43419/git/mgraf77/accent-os |
| Total commits on HEAD | 66 |
| Conflict risk | LOW — clean tree, no in-flight merges, no divergent local-only branches detected from this session |

### Recent commits (last 10 on this branch)
```
969de17 wip: pause point — worker proxy needs redeploy + 400 debug
2dca2a6 fix: worker proxy — use arrayBuffer for body passthrough, explicit header forwarding
87f20a2 fix: Anthropic API CORS — add Cloudflare Worker proxy, update all AI fetch URLs
940e7f8 feat: Quote Generator v2 — AI parse, track calc, per-row approval, CSV export
51de122 fix(internal-meetings): ralph iter 3 — page-mount safety and re-mount channels
e14c5cf fix(internal-meetings): ralph iter 2 — fix realtime gaps in iter 1
cffad03 feat(internal-meetings): collaborative prep + live meeting list + status badge
6016c13 chore(internal-meetings): quiet realtime diagnostics now that it works
4988fc9 feat(internal-meetings): auto-promote Paul & Patrick seed to Supabase
03d0fe7 chore(internal-meetings): verbose realtime diagnostics
```

### Remote sync status
Upstream has not been queried in this session (no `git fetch` run, by design — read-only governance pass). Pre-existing pause-point WIP commit indicates the prior session ended cleanly. Run `git fetch origin` before any restructuring to confirm origin has not advanced.

---

## 2. Filesystem Inventory

### Total footprint
- Working tree (excluding `.git/`): **2.9 MB**
- Git objects: **1.6 MB**
- Total: **~4.5 MB**

### Top-level layout
```
accent-os/
├── .claude/                       Claude Code config + hooks
│   ├── CLAUDE.md                  (auto-instructions, AUTO-EXECUTE chain)
│   ├── settings.json              (Stop hook → efficiency-aggregate.sh)
│   └── output-styles/
├── BUILD_INTELLIGENCE.md          49 KB — accumulated lessons learned
├── BUILD_PLAN_CLAUDE.md           23 KB — autonomous build queue (Claude-side)
├── BUILD_PLAN_MICHAEL.md          29 KB — operator-side roadmap (Michael)
├── KPI_CATALOG.md                 30 KB — AccentOS KPI definitions
├── MASTER.md                      43 KB — single source of truth (mixed: AccentOS biz + agent methodology)
├── MODULE_MODES.md                4.6 KB — module enable/disable spec
├── PROMPT_LOG.md                  19 KB — every Michael prompt, append-only
├── PROMPT_QUEUE.md                1.8 KB — queued future prompts
├── README.md                      0.07 KB — minimal
├── SESSION_LOG.md                 68 KB — per-session shipping log
├── WORK_IN_PROGRESS.md            1.9 KB — last paused task (worker proxy 400)
├── index.html                     735 KB / 7,169 lines — AccentOS app monolith
├── patch_quote.js                 52 KB — generated artifact (Quote Generator patch)
├── module_modes.json              5 KB — module mode config
├── wrangler.toml                  Cloudflare Worker config
├── js/                            37 extracted module files (~8–26 KB each)
├── scripts/                       3 scripts (status.sh, efficiency-aggregate.sh, auto-categorize.js)
├── skills/                        28 skills + vibe-speak + efficiency-monitor + _index.md
├── sql/                           25 schema migrations (M01–M40)
└── worker/                        Cloudflare Worker source (anthropic-proxy.js)
```

### Skills inventory (28 + framework)
Framework skills (deep agentic infra, used every session):
- `vibe-speak` (9-mode communication framework, ~always-on)
- `efficiency-monitor` (always-on observer, Stop-hook aggregator)

General-purpose skills (cross-business potential):
- analysis-snapshot, autonomous-mode, bottleneck-finder, build-plan-status, codex-review, community-skill-vet, decision-log, doc-drift, priority-articulation, prompt-queue, repo-scout, schema-contract-tests, skill-eval-suite, skill-forge, supabase-sql-magic, table-eda

Accent-Lighting business-domain skills:
- bc-business-review, broken-link-rescue, bulk-meta-description, gmc-feed-audit, kpi-data-audit, rep-group-matchmaker, vendor-cascade, vendor-clarity-test, vendor-onboard-checklist, vendor-risk-register

### SQL migrations (25 files, M01–M40)
M01 (RLS), M02 (core 18-table schema), M21–M40 (per-feature: inventory, POs, trade partners, warranty, showroom, labels, deliveries, competitors, marketing, customers segment, internal meetings ×3, products cost, deals stage history, deals lost reason, invoices/payments, employees quota, service tickets, surveys, recurring contracts, vendors verify, user module overrides).

### JS modules (37 files in `js/`)
Activity, alerts, bulk select, bulk vendor ops, calendar, commission, competitive pricing, CSV import, customers, deal optimizer, decision engine, deliveries, demand forecast, digest, employees, global search, health, internal meetings, inventory + analytics, jobs, knowledge hub, labels, marketing, module modes, my tasks, pipeline analytics, portal preview, price book, POs, quick actions, reports, saved filters, showroom displays, trade partners, vendor score import, warranty.

---

## 3. Coupling Inventory

| Coupling type | Count | Notes |
|---|---|---|
| Skills with NO AccentOS coupling (clean lift) | **0 / 28** | Every skill references AL infra somewhere |
| Skills with explicit `BUILD_PLAN`/`MASTER.md`/`KPI_CATALOG` references | 12 | autonomous-mode, bottleneck-finder, build-plan-status, decision-log, doc-drift, efficiency-monitor, kpi-data-audit, priority-articulation, prompt-queue, skill-forge, vendor-cascade, vibe-speak |
| Index.html LOC | 7,169 | Monolith — extraction to `js/` is partial |
| Cross-module globals via `window.X` | many | `$`, `esc`, `sbFetch`, `openModal`, etc. — refactor risk |

---

## 4. Active Work State

| Stream | Status |
|---|---|
| Quote Generator AI Parse 400 (worker redeploy) | **PAUSED** at WORK_IN_PROGRESS.md (commit 969de17) |
| Internal Meetings collab feature | **DONE** (51de122) |
| Quote Generator v2 | **DONE** (940e7f8) |
| Vendor scoring foundation (T2.x) | per BUILD_PLAN_CLAUDE.md |
| Governance baseline (this work) | **IN PROGRESS** on branch `claude/governance-snapshot-prep-k3dBs` |

---

## 5. External Dependencies (Cannot Be Migrated Locally)

| System | Coupling point | Notes |
|---|---|---|
| Cloudflare Workers | `worker/anthropic-proxy.js`, `wrangler.toml` | Deployed at `accentos-anthropic-proxy.mgraf77.workers.dev`. Secret: `ANTHROPIC_API_KEY`. Redeploy not possible from Codespace per WORK_IN_PROGRESS.md. |
| Supabase | All `sql/M*.sql` migrations + every `js/*.js` and `index.html` Supabase fetch | RLS policies in M01. |
| BigCommerce | implied in skills (gmc-feed-audit, broken-link-rescue, bulk-meta-description) | Out-of-repo creds. |
| Anthropic API | via worker proxy | Used by Quote Generator AI Parse + others. |
| Cloudflare Pages | hosts `accent-os.pages.dev` | Auto-deploy on `main`. |

Repo restructuring must preserve every fetch URL, RLS policy, and worker route or roll them forward atomically.

---

## 6. Snapshot Verification Commands

To re-confirm this state at the start of any restructuring session:

```bash
git -C /home/user/accent-os status
git -C /home/user/accent-os rev-parse HEAD            # expect 969de17 or descendant
git -C /home/user/accent-os branch --show-current     # expect claude/governance-snapshot-prep-k3dBs
git -C /home/user/accent-os fetch origin               # confirm remote not advanced
find /home/user/accent-os/skills -name "SKILL.md" | wc -l   # expect 28
find /home/user/accent-os/sql -name "*.sql" | wc -l         # expect 25
find /home/user/accent-os/js -name "*.js" | wc -l           # expect 37
wc -l /home/user/accent-os/index.html                       # expect 7169
```

If any of these drift before restructuring begins, re-run governance snapshot.
