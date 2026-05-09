# AccentOS — Active Branch Registry
> Single source of truth for all branches: scope, file ownership, authority level, and retirement rules.
> All agents must read this before creating a branch or claiming ownership of a file.

**Status:** ACTIVE  
**Authority:** Implementation Hub  
**Last Updated:** 2026-05-08  
**Governs:** Branch creation, file ownership, merge cadence, retirement  

---

## BRANCH TOPOLOGY

```
main
├── claude/implement-claude-design-ui-eFn9b   [ACTIVE — UI Proto + Implementation Hub]
│
│   PLANNED (not yet created):
├── claude/accentos-workflow-design-G0opy     [PLANNED — Runtime Authority]
├── claude/accentos-rollout-planning-UTElf    [PLANNED — Governance Authority]
└── claude/research-mobile-pwa-Q6vYN         [PLANNED — Mobile Authority]
```

---

## REGISTRY TABLE

| Branch | Status | Authority Level | Files Owned | Merge Target | Retire Trigger |
|--------|--------|-----------------|-------------|--------------|----------------|
| `main` | ACTIVE | Michael only | All | — | Never |
| `claude/implement-claude-design-ui-eFn9b` | ACTIVE | Hub + Runtime | `ui/*`, `docs/*`, `WORK_IN_PROGRESS.md`, `scripts/*` | `main` | Phase A authorized + merged |
| `claude/accentos-workflow-design-G0opy` | PLANNED | Runtime Authority | TBD at creation | `main` | Per scope declaration |
| `claude/accentos-rollout-planning-UTElf` | PLANNED | Governance Authority | `docs/design/*`, `docs/implementation/*` (read/plan only) | N/A — planning branch | Per scope declaration |
| `claude/research-mobile-pwa-Q6vYN` | PLANNED | Mobile Authority | `docs/design/ACCENTOS_MOBILE_PWA_RULES.md`, `ui/` mobile additions | `claude/implement-claude-design-ui-eFn9b` | Per scope declaration |

---

## BRANCH DETAIL RECORDS

---

### `main`

| Field | Value |
|-------|-------|
| Created | Project origin |
| Owner | Michael Graf (human authority) |
| Authority | FULL — all files, all actions |
| Push authority | Michael only |
| Deployment | Cloudflare Pages auto-deploy on push |
| Boot smoke | Required before merge (run by Claude) |
| Merge frequency | Phase gates only — not continuous |
| Current tip | `5db5ddf v6.10.36: Daily Brief Email Digest` |
| Ahead of main | 0 (this IS main) |

**FROZEN FILES** (no branch may modify without Michael authorization):
- `index.html` — until Phase B authorized
- `worker/anthropic-proxy.js` — until BUG-01 resolved + deployment window
- `wrangler.toml` — always Michael-only
- `supabase/migrations/` — always Michael-only (schema changes never automated)

---

### `claude/implement-claude-design-ui-eFn9b`

| Field | Value |
|-------|-------|
| Created | AccentOS UI Foundation session |
| Purpose | UI prototype evolution + Implementation Hub |
| Owner | Claude Code (Implementation Hub authority) |
| Authority | ui/, docs/, WORK_IN_PROGRESS.md, scripts/ |
| Push authority | Claude (autonomous in scope) |
| Commits | 4 ahead of main |
| Current tip | `ff17ba1` |
| Boot smoke | 27/27 ✓ |
| Merge target | `main` at Phase A authorization |
| Merge condition | Boot smoke 27/27 + Michael Phase A authorization |
| Retirement | After merge to main is authorized |

**Owned files (exclusive while IN FLIGHT):**
```
ui/tokens.css
ui/accentos-shell.css
ui/accentos-shell.js
ui/accentos-shell-prototype.html
docs/design/ACCENTOS_UI_SYSTEM.md
docs/design/ACCENTOS_TOKENS.md
docs/design/ACCENTOS_LAYOUT_ARCHITECTURE.md
docs/design/ACCENTOS_MOBILE_PWA_RULES.md
docs/design/ACCENTOS_ROLE_VISIBILITY_MATRIX.md
docs/design/ACCENTOS_PROGRESSIVE_SHELL_ROLLOUT.md
docs/implementation/  (all — Hub authority)
SYSTEM_STATE.md
GOVERNANCE_RISKS.md
STABILIZATION_PROTOCOL.md
MODULE_OWNERSHIP_MAP.md
WORK_IN_PROGRESS.md
scripts/boot-smoke.sh
```

**Commit history:**
```
ff17ba1  Phase 2C — bulk select, saved views, briefing, drag-drop + rollout plan
b22a9d5  Phase 2B — task inbox, AI assist mode, mobile sheet, keyboard chords
b9e7f58  Phase 2A — rich operational simulation, role-aware dashboard, system modes
d189b3b  AccentOS UI foundation — design system, shell prototype, governance docs
```

---

### `claude/accentos-workflow-design-G0opy` [PLANNED]

| Field | Value |
|-------|-------|
| Status | NOT YET CREATED |
| Authority | Runtime Authority — operational workflow design |
| Planned scope | Runtime workflow patterns, interaction design validation, prototype integration scaffolding |
| File scope (planned) | `ui/*` additions, `js/` module stubs, `docs/design/` additions |
| Cannot touch | `index.html`, `worker/`, `wrangler.toml`, `supabase/` |
| Merge target | `claude/implement-claude-design-ui-eFn9b` or `main` (TBD) |
| Creation trigger | Hub authorizes Phase A work begins |
| Authority ceiling | AML 2 — spawned sub-agents allowed (no sub-sub-agents) |

---

### `claude/accentos-rollout-planning-UTElf` [PLANNED]

| Field | Value |
|-------|-------|
| Status | NOT YET CREATED |
| Authority | Governance Authority — planning only |
| Planned scope | Rollout documentation, risk updates, governance freeze maintenance |
| File scope (planned) | `docs/design/*`, `docs/implementation/*` — READ and PLAN only |
| Cannot touch | Any source file, any `ui/` files (reads only), no commits to prod-adjacent files |
| Merge target | N/A — planning branch, docs merged via PR to ui-proto or main |
| Creation trigger | Need for parallel governance documentation work |
| Authority ceiling | AML 1 — no sub-agents (read/write docs only) |

---

### `claude/research-mobile-pwa-Q6vYN` [PLANNED]

| Field | Value |
|-------|-------|
| Status | NOT YET CREATED |
| Authority | Mobile Authority — mobile/PWA design research |
| Planned scope | Mobile UX research, PWA spec validation, iPhone testing documentation |
| File scope (planned) | `docs/design/ACCENTOS_MOBILE_PWA_RULES.md` additions, `ui/` mobile CSS additions |
| Cannot touch | index.html, worker/, wrangler.toml, supabase/ |
| Merge target | `claude/implement-claude-design-ui-eFn9b` |
| Creation trigger | Phase B authorized (mobile testing becomes critical path) |
| Authority ceiling | AML 2 — research sub-agents allowed |

---

## BRANCH CREATION RULES

A new branch may only be created if:

1. **Hub authorizes it** — Hub writes the creation into this registry before the branch is created
2. **Scope is declared** — file ownership list must be written before first commit
3. **Does not conflict** — no file in the new branch's scope is owned by an active branch
4. **Base is correct** — branch from `main` unless Hub specifies otherwise
5. **Boot smoke passes on creation** — branch inherits 27/27 from base; must maintain it

---

## MERGE RULES

| From | To | Condition | Approver |
|------|----|-----------|----------|
| Any feature branch | `main` | Phase gate complete + boot smoke 27/27 | Michael |
| Research branch | Feature branch | Work complete + no conflicts | Hub |
| Planning branch | Feature branch | Via PR + Hub review | Hub |
| Any | Any (non-`main`) | Scope must not conflict | Hub |

**No branch-to-branch merges without Hub explicit authorization.**  
**No merge to `main` without Michael authorization.**

---

## RETIREMENT RULES

A branch is retired (deleted from remote) when:

1. Its scope has been fully merged to target
2. Boot smoke on target passes 27/27
3. WORK_IN_PROGRESS.md is updated to reflect retirement
4. Hub writes retirement to this registry

Retired branches are logged below.

### Retired Branches

_(none yet)_

---

## BRANCH HEALTH DASHBOARD

| Branch | Boot Smoke | Commits Ahead | Last Activity | Health |
|--------|------------|----------------|---------------|--------|
| `main` | N/A | 0 | `5db5ddf` | ✓ |
| `claude/implement-claude-design-ui-eFn9b` | 27/27 | 4 | `ff17ba1` (today) | ✓ |
| `claude/accentos-workflow-design-G0opy` | — | — | not created | — |
| `claude/accentos-rollout-planning-UTElf` | — | — | not created | — |
| `claude/research-mobile-pwa-Q6vYN` | — | — | not created | — |
