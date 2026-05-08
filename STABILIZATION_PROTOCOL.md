# STABILIZATION_PROTOCOL.md — AccentOS Stabilization Rules
> Rules for keeping the production system stable during active development.

**Last updated:** 2026-05-08

---

## CORE PRINCIPLE

AccentOS is a live production system used by the Accent Lighting team. Every session must leave the system at least as stable as it was found.

---

## PRE-SESSION CHECKLIST

Before writing any code:

- [ ] `git status` — working tree must be CLEAN
- [ ] `bash scripts/boot-smoke.sh` — must pass
- [ ] Read WORK_IN_PROGRESS.md — complete any unfinished task first
- [ ] Read GOVERNANCE_RISKS.md — know active risks before touching anything
- [ ] Read SYSTEM_STATE.md — understand current deployment state

**If any of these fail: stop and surface to Michael before proceeding.**

---

## DURING-SESSION RULES

### Files — Safe to Edit
- js/*.js — module files (safe, isolated, external script)
- docs/ — documentation only
- ui/ — design system + prototype files (new, isolated)
- scripts/ — utility scripts
- skills/ — Claude Code skills

### Files — Caution Required
- index.html — monolith, surgical edits only, < 50 lines per session without approval
- sql/*.sql — append-only, never alter/drop existing migrations

### Files — DO NOT TOUCH
- worker/anthropic-proxy.js — production Cloudflare Worker
- wrangler.toml — Cloudflare deployment config
- Any existing SQL migration (M01–M40) — write new ones only

---

## POST-SESSION CHECKLIST

Before committing and pushing:

- [ ] `git status` — only expected files changed
- [ ] `bash scripts/boot-smoke.sh` — must still pass
- [ ] WORK_IN_PROGRESS.md updated with current state
- [ ] SESSION_LOG.md entry appended
- [ ] BUILD_PLAN_CLAUDE.md items checked off if completed
- [ ] No governance risk gates triggered

---

## ROLLBACK PROTOCOL

If something breaks:

1. `git diff HEAD` — identify what changed
2. `git checkout HEAD -- <file>` — revert specific file if needed
3. `git revert HEAD` — revert entire commit if needed (safer than reset)
4. Never use `git reset --hard` without Michael approval
5. Surface to Michael immediately with: what broke, what was reverted, what still needs fixing

---

## ISOLATION RULES FOR NEW UI/PROTOTYPE WORK

New UI files (ui/ directory, prototype HTML) must be:

- Self-contained — no dependencies on index.html internals
- Non-destructive — cannot break existing production routes
- Clearly labeled as prototype/preview
- Rollback = delete the file(s), zero production impact

---

## PHASE GATES

| Phase | Gate Condition |
|---|---|
| Phase 1 (current) | UI foundation + docs + prototype only. No index.html shell replacement. |
| Phase 2 | Shell can be progressively wired in after Phase 1 docs are reviewed by Michael |
| Phase 3 | Full module-by-module migration to new shell — requires dedicated extraction plan |
| Phase 4 | Real permission enforcement — requires Supabase RLS + JWT claims work |
