# ACTIVE_SESSION_REGISTRY.md — Claude Code Session Coordination

> Tracks every active and recently-paused Claude Code session against this repo. Used to verify no in-flight work conflicts with major structural changes.
>
> **Rule:** Before any destructive or restructuring operation, every entry below must show `STATE: paused-clean` or `STATE: ended-clean`.

**Last updated:** 2026-05-08
**Updated by:** governance-snapshot-prep-k3dBs

---

## Session Schema

Each session entry tracks:
- `id` — branch name or session label
- `started` — when first commit landed
- `last-touch` — most recent commit / activity
- `state` — `active` | `paused-clean` | `paused-dirty` | `ended-clean` | `ended-with-loss-risk`
- `pause-marker` — file/commit pointing to resume contract
- `resume-trigger` — phrase that re-engages the session
- `blockers` — anything preventing clean pause
- `clearance-for-restructure` — `YES` | `NO`

---

## Active / Recent Sessions

### S-001: governance-snapshot-prep-k3dBs (THIS SESSION)
- **id:** `claude/governance-snapshot-prep-k3dBs`
- **started:** 2026-05-08
- **last-touch:** 2026-05-08 (governance baseline write — current commit pending)
- **state:** `active`
- **pause-marker:** none yet — completes when governance docs commit + push lands
- **resume-trigger:** "continue governance snapshot" / "restructure now"
- **blockers:** none
- **clearance-for-restructure:** `NO` (this session is the gate; cannot self-clear)
- **scope:** Read-only governance + doc creation. NO source code, SQL, or worker changes. NO destructive ops.

### S-000: Quote Generator AI Parse — worker proxy 400 debug
- **id:** branch unknown (work was on prior branch before `claude/governance-snapshot-prep-k3dBs` was cut); HEAD when paused = `969de17`
- **started:** ~2026-05-07
- **last-touch:** 2026-05-07 — commit `969de17` "wip: pause point — worker proxy needs redeploy + 400 debug"
- **state:** `paused-clean`
- **pause-marker:** `WORK_IN_PROGRESS.md` (committed) + commit message includes "wip: pause point"
- **resume-trigger:** "continue last session" / "resume worker proxy"
- **blockers:**
  1. Cloudflare Worker `accentos-anthropic-proxy` needs redeploy of commit `2dca2a6` from a non-Codespace terminal (`wrangler deploy`).
  2. Until redeploy, "⚡ Parse Notes" returns 400. This is a deployment-environment blocker, not a code blocker.
- **clearance-for-restructure:** `YES` — no in-flight code changes; worker proxy lives in `worker/anthropic-proxy.js` and would survive any internal accentos restructuring as long as `worker/` and `wrangler.toml` move atomically.
- **note:** When this resumes, it should resume on a NEW branch off the post-restructure HEAD, not on `claude/governance-snapshot-prep-k3dBs`.

---

## Multi-Repo Future State (NOT YET ACTIVE)

These will exist after a successful big-change phase. Pre-creating slots so future sessions register here:

### agentos-core (FUTURE, not yet a repo)
No active sessions. Repo does not exist. See EXTRACTION_CANDIDATES.md.

### agentos-command-center (FUTURE, not yet a repo)
No active sessions. Repo does not exist. See EXTRACTION_CANDIDATES.md.

### agentos-skills (FUTURE, not yet a repo)
No active sessions. Repo does not exist. See EXTRACTION_CANDIDATES.md.

---

## Pre-Restructure Clearance Checklist

Before invoking the next phase (actual restructuring), verify:

- [ ] All sessions above show `clearance-for-restructure: YES`
- [ ] `git status` clean on `claude/governance-snapshot-prep-k3dBs`
- [ ] `git fetch origin` shows no surprise advance on `main` since snapshot
- [ ] Cloudflare Worker last-known-good deploy is documented (currently: commit `87f20a2` is what's live; `2dca2a6` is the patched version awaiting redeploy)
- [ ] Supabase has no pending migration that would conflict (last applied = whatever Michael ran most recently per BUILD_PLAN_CLAUDE.md)
- [ ] No open PRs on `mgraf77/accent-os` (check via `mcp__github__list_pull_requests` — not run in this snapshot session)
- [ ] WORK_IN_PROGRESS.md has been updated to confirm the worker-proxy task is officially deferred to post-restructure

Until every box is checked, **the restructuring phase is NOT cleared.**

---

## Coordination Protocol

When a new session is opened:
1. Read this file FIRST.
2. Add an entry under "Active / Recent Sessions" with `state: active`.
3. On clean wrap-up, flip to `state: paused-clean` or `state: ended-clean`.
4. Set `clearance-for-restructure: YES` when leaving the session.
5. Commit the registry update as part of session-end batch.
