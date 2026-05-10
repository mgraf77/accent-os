# SAFE_OVERNIGHT_QUEUE.md

> Authored under **Safe Overnight Autonomy Mode** on 2026-05-10.
> Branch: `claude/safe-overnight-autonomy-EHEbQ`
> All tasks below are **doc-only or read-only**. No production code, no deploys, no SQL, no `index.html` mutation.

---

## Hard stops (re-stated for the next session)
- ❌ Do NOT begin Phase B work.
- ❌ Do NOT mutate `index.html`, `worker/anthropic-proxy.js`, `wrangler.toml`, `js/`, `patch_quote.js`.
- ❌ Do NOT deploy worker or run `wrangler`.
- ❌ Do NOT run any SQL migration in `sql/`.
- ❌ Do NOT edit governance / runtime-state files (CLAUDE.md, MODULE_MODES.md, module_modes.json, BUILD_INTELLIGENCE.md core rules).
- ❌ Do NOT spawn autonomous swarms or auto-Codex dispatch.
- ❌ Do NOT force-push, amend, rebase, delete branches.
- ❌ Do NOT broad-refactor anything.

## Allowed work classes
1. Documentation hardening (additive only, no rewrite of governance docs).
2. Read-only audits (grep / catalogue / drift detection — no fixes applied).
3. Queue cleanup (this file, `PROMPT_QUEUE.md`).
4. Pattern extraction / refinement (drafts, never installed as live skills).
5. Codex pilot **preparation** docs only — no Codex dispatch.
6. Phase A observation notes.
7. Skill-candidate abstraction drafts (in `skills/_candidates/` if needed; never wired into `_index.md`).
8. `STATUS.md` and `WORK_IN_PROGRESS.md` maintenance.

---

## Active queue (for this overnight + next morning)

| # | Status | Task | Output | Risk |
|---|--------|------|--------|------|
| 1 | done   | Author this queue | `SAFE_OVERNIGHT_QUEUE.md` | none |
| 2 | done   | Draft skill outline: `verified-commit` | `skills/_candidates/verified-commit.outline.md` | none |
| 3 | done   | Draft skill outline: `queue-item-close` | `skills/_candidates/queue-item-close.outline.md` | none |
| 4 | done   | Draft skill outline: `integration-risk-audit` (grep sub-step) | `skills/_candidates/integration-risk-audit.outline.md` | none |
| 5 | done   | Codex pilot candidates list | `CODEX_PILOT_CANDIDATES.md` | none |
| 6 | done   | Overnight status report | `OVERNIGHT_STATUS.md` | none |
| 7 | done   | Initial `STATUS.md` | `STATUS.md` | none (new file) |
| 8 | done   | `WORK_IN_PROGRESS.md` overnight bookmark | edit `WORK_IN_PROGRESS.md` | none (additive note) |

## Deferred / not safe overnight (require Michael)

| Item | Why deferred | Owner |
|------|--------------|-------|
| Worker redeploy + Parse Notes 400 root cause | Needs Michael's local machine + `wrangler deploy` | Michael |
| `M29` Marketing schema | SQL migration — Michael only | Michael |
| `M28` Competitor pricing schema | SQL migration — Michael only | Michael |
| `M27` Deliveries schema | SQL migration — Michael only | Michael |
| `M26` Label batches schema (optional) | SQL migration — Michael only | Michael |
| `M25` Showroom schema | SQL migration — Michael only | Michael |
| `M24` Trade partner + Warranty schema | SQL migration — Michael only | Michael |
| `M11` Supabase MCP permissions | Auth-walled | Michael |
| `M12` Rotate `accentos` shared password | Auth-walled, security-sensitive | Michael |
| `M04` BigCommerce API credentials | Auth-walled | Michael |

## Pause condition
When all queue items above are done, **stop and write OVERNIGHT_STATUS.md, then enter clean pause**. Do not invent new work. Do not touch frozen files.
