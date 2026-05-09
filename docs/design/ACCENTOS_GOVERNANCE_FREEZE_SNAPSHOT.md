# AccentOS Governance Freeze Snapshot
> **Doc type:** Handoff packet. The single document a future implementation/runtime phase reads to start.
> **Status:** Convergence-ready snapshot of branch `claude/accentos-rollout-planning-UTElf`.
> **Reading time:** ~10 minutes.
> **Use:** read this first, then the Index, then the Terminology, then the doc you actually need.

---

## 1. The system in one paragraph

AccentOS is a vanilla-JS, no-build single-page app served from Cloudflare Pages, backed by Supabase, with one Cloudflare Worker for AI proxying. It currently lives as a 7,169-line `index.html` shell + 37 lazy-loaded `js/*.js` modules. We are planning a progressive migration to a new "shell-v2" architecture without breaking the live monolith. The rollout instrument is `module_modes.json` — a state machine that already exists and ships. There is no framework, no build step, and no second deployment surface.

---

## 2. Current governance architecture

```
                        ┌──────────────────────┐
                        │    CAPTAIN (human)    │
                        │   final authority     │
                        └──────────┬───────────┘
                                   │
                ┌──────────────────┼──────────────────┐
                │                  │                  │
        ┌───────▼──────┐    ┌─────▼─────┐    ┌──────▼───────┐
        │   HUB on     │    │ canonical │    │ SPOKE on     │
        │    main      │    │ governance│    │ claude/*     │
        │ writes code, │    │ branches  │    │ writes only  │
        │ flips, all   │    │ (4 docs   │    │ docs/design/*│
        │ runtime      │    │ on other  │    │              │
        └──────────────┘    │ branches) │    └──────────────┘
                            └───────────┘
```

- **Captain** is final, always.
- **Hub** is the authoritative implementation session. One Hub at a time.
- **Spoke** sessions plan in markdown only. They never touch runtime.
- **Canonical governance docs** live in dedicated branches with single-writer rules.
- **`module_modes.json`** is the live rollout state. It is the only flag system.

---

## 3. Rollout philosophy

> **Survivable progressive integration.** Not fast rollout.

- v1 stays alive through Phase 6. v1 is the survival layer.
- v2 is born inside `index.html` — not a second app.
- One module migrates at a time. Reads before writes. One write at a time.
- Each phase has measurable gates (Readiness System) and a rollback dial.
- The default action when ambiguous is *no state change* (freeze, hold, rollback).
- Every flip is one commit. Every commit is reversible.

Phases (Rollout Strategy §3):

```
Phase 0 Stabilize   → Anthropic-proxy WIP closed; SESSION_LOG live
Phase 1 Beachhead   → 1 module (Daily Command Center) at `building`, Owner-only
Phase 2 Admin test  → flip to `testing`, Owner+Admin
Phase 3 Read live   → flip to `live`, role-gated; v1 still default
Phase 4 Reads       → migrate one module's read view at a time
Phase 5 Writes      → migrate the smallest write per module first
Phase 6 Deprecate   → 30-day cooldown, then v1 deletable
```

---

## 4. Rollback philosophy

> **Always additive. Never destructive.**

- Rollback = a new commit, a flip-back, a tag.
- Never `git reset --hard` on `main`. Never `git push --force` on `main`.
- The fastest rollback is a `module_modes.json` flip — under 2 minutes.
- Every flip commit body contains the inverse-flip text — rollback is copy-paste.
- Worker rollback is Captain-only (credentials live on Captain's local machine).
- Schema rollback is Captain-only (manual reverse SQL).
- During an active P0, Primary has standing emergency authority for module flips, per-user `deny`, `git revert`, and cachebust bumps. Not for workers, schema, or canonical docs.
- There is no global kill switch. The system uses layered partial disablement: per-user → module → role → CSS guard → `git revert`.

---

## 5. Session authority model

| Class | Branch | Writes | Authority |
|---|---|---|---|
| **Captain** | n/a (human) | anything | final |
| **Hub** | `main` (or fast-forward) | code, schema, worker, `index.html`, `module_modes.json`, canonical docs | authoritative implementation |
| **Spoke** | `claude/<topic>-*` | `docs/design/*.md` only | non-authoritative drafts |

Rules:

- One Hub at a time (defined by `origin/main` tip).
- Spoke is read-only on `module_modes.json` and canonical files.
- Class is set by branch name and does not change mid-session.
- Conflicts: governance > Hub > Spoke; same-class → recency-of-merge wins; both unmerged → freeze both, escalate to Captain.
- "Both can be true" is forbidden; one canonical answer always.

(Full constitution: `ACCENTOS_MULTI_SESSION_GOVERNANCE.md`.)

---

## 6. Readiness philosophy

> **Measurable, not subjective.**

A module is scored 0–10 across five dimensions before any flip:

| Sub-score | What it measures | Weight |
|---|---|---|
| **S** Survivability | rollback cost, blast radius | 25% |
| **M** Mobile | iPhone Safari 390px usability | 15% |
| **W** Workflow | golden path + role checks | 25% |
| **G** Governance | gates, owners, freezes clear | 15% |
| **R** Rollback | dry-run rehearsed and verified | 20% |

Composite must clear the phase threshold AND every sub-score must clear its floor (veto rule). G must equal 10 for `→ live`. Captain may downgrade any score; Captain cannot upgrade beyond evidence.

Operational confidence (system-wide 0–10) is checked at session start. <6 = freeze candidate.

---

## 7. Survivability philosophy

> **The system survives because v1 outlives v2's rollout.**

- v1 is reachable for every user through Phase 6.
- v2 reads land before v2 writes (per module).
- Per-record single-shell rule: never two write surfaces visible to the same user for the same record.
- v2 writes carry `source: 'shell_v2'` for audit/replay/revert.
- No service worker until post-Phase 6 — no cached-stale-shell traps.
- `?v=<commit-sha>` cachebust on every shell-v2 import.
- `mount(rootEl, ctx) → { unmount, version }` contract: the host can `unmount` everything in one sweep.
- No global event bus, no shared in-memory state across shells. Supabase is the only sync point.

---

## 8. Anti-entropy philosophy

> **One writer per surface. One flip per commit. One subsystem per session. One canonical answer.**

Practical rules:

- One flip per commit. Never bundled with code.
- One canonical-doc edit per commit. Never bundled with anything.
- One subsystem extraction per session.
- Branch names follow `claude/<topic>-*` — naming *is* access control.
- Stale branches (>14 days) are presumed abandoned.
- New terms require a Terminology entry in the same commit.
- "We'll fix it later" is a P2, not a bypass.
- Captain may waive any rule for a specific commit, with reason logged.

(Full set: Multi-Session Constitution Article X.)

---

## 9. Failure-mode coverage

Ten predictable failure modes are documented (`ACCENTOS_ROLLOUT_FAILURE_SCENARIOS.md` F1–F10):

| # | Mode | Containment |
|---|---|---|
| F1 | Failed shell injection | Flip to `idea_only` |
| F2 | Lazy-load partial | Flip + bundle dep |
| F3 | v1↔v2 state divergence | Replay from audit_log; per-record single-shell |
| F4 | Role visibility breach | Instant `→ idea_only`; P0 |
| F5 | Mobile/PWA regression | Flip + CSS guard |
| F6 | Rollback failure | Force redeploy or Captain `wrangler` |
| F7 | `module_modes.json` corruption | `git revert` |
| F8 | Partial rollout drift | Override audit + cleanup |
| F9 | Stale client | Cachebust bump |
| F10 | Cross-session conflict | Freeze both; Captain decides |

Each maps to a sub-score in the Readiness System; recurring failures tighten the score components.

---

## 10. Phase 0 status (gate to begin)

Before Phase 1 can start, all of:

- 🔴 **Open:** Anthropic-proxy WIP (commit `2dca2a6` not redeployed; Parse Notes 400). Phase 1 hard-blocks until this clears.
- ⚠️ **Pending merge:** four canonical governance files exist on another branch and have not been read into this branch's verification context.
- ✅ **Complete:** spoke planning layer (this branch).
- ⚠️ **Pending:** SESSION_LOG.md initialization in repo (per `MASTER.md` open loops).

---

## 11. The single-page consumer guide

A future implementation session executes Phase 1 by:

1. Read this snapshot.
2. Confirm Phase 0 gates clear (§10).
3. Read `ACCENTOS_PRODUCTION_ROLLOUT_STRATEGY.md` §1–§5 (the plan).
4. Read `ACCENTOS_ROLLOUT_READINESS_SYSTEM.md` §2–§7 (how to score).
5. Read `docs/design/test/daily_command_center.md` (the runbook).
6. Open `ACCENTOS_GOVERNANCE_ESCALATION_MATRIX.md` for the decision flowchart on standby.
7. Score; if composite ≥5 with floors clear, scaffold `js/shell_v2/daily_command_center.js`.
8. Add `daily_command_center` entry to `module_modes.json` at `building`. **One commit.**
9. Verify on `accent-os-staging.pages.dev` per checklist.
10. SESSION_LOG entry. Done.

A future incident-response session recovers by:

1. Open `ACCENTOS_GOVERNANCE_ESCALATION_MATRIX.md` §10 (decision flowchart).
2. Classify P0/P1/P2/P3.
3. Apply `ACCENTOS_ROLLOUT_FREEZE_PROTOCOL.md` §1–§7 in order.
4. Contain first; investigate after.
5. SESSION_LOG entry; Captain notified.

---

## 12. Known unaddressed items

These remain open and the implementation phase will inherit them:

1. Anthropic-proxy WIP redeploy (Phase 0 hard block).
2. Per-user override cross-device (M30 / Supabase `user_module_overrides`) — Phase 4 prerequisite.
3. Module-key naming convention not in `MODULE_MODES.md` — Captain canonical edit needed.
4. Worker P0 + Captain unreachable = wait-state (intentional; documented gap).
5. The four canonical governance files have not been merged into this branch's verification context.
6. The 15 contradictions catalogued in `ACCENTOS_GOVERNANCE_CONTRADICTIONS.md` await Hub adoption pass.

---

## 13. What this snapshot does NOT contain

- Implementation code (correct — this is planning).
- Captain decisions on the open contradictions (those wait).
- Verification against the four canonical files (deferred to next prompt).
- The actual content of `SYSTEM_STATE.md`, `GOVERNANCE_RISKS.md`, `STABILIZATION_PROTOCOL.md`, `MODULE_OWNERSHIP_MAP.md` (canonical, other branch).

---

## 14. The handoff contract

When the next phase consumes this branch:

- ✅ It may treat this snapshot as authoritative for spoke-level planning.
- ✅ It must defer to canonical governance docs where they exist.
- ✅ It must run the contradiction cleanup pass (§8 of `ACCENTOS_GOVERNANCE_CONTRADICTIONS.md`) before introducing new planning content on top.
- ❌ It must not re-author canonical files.
- ❌ It must not skip Phase 0.
- ❌ It must not bundle a `module_modes.json` flip with code in one commit.

---

## 15. Branch state at freeze

- **Branch:** `claude/accentos-rollout-planning-UTElf`
- **System-state baseline:** see canonical `SYSTEM_STATE.md` on branch `claude/governance-snapshot-prep-k3dBs` (snapshot 2026-05-08 against `969de17`) — authoritative for repo state, filesystem inventory, and coupling counts cited throughout this packet.
- **Spoke planning files:** 13 (this Snapshot, Index, Terminology, Contradictions, Rollout Strategy, Reconciliation, Failure Scenarios, Escalation Matrix, Readiness System, Multi-Session Constitution, Freeze Protocol, plus 7 test checklists incl. template).
- **Production touched:** none.
- **`module_modes.json` touched:** none.
- **`index.html` touched:** none.
- **Worker touched:** none.
- **Schema touched:** none.

This branch is ready for: (a) consumption by a Hub adoption session, or (b) a canonical-merge / reconciliation session that brings the four canonical files into verification contact.

---

*End of ACCENTOS_GOVERNANCE_FREEZE_SNAPSHOT.md — the handoff packet. Begin reading here.*
