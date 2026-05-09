# AccentOS Agent Execution Limits
> **Doc type:** Enforcement specification. Safe-autonomy ceilings for Claude agents operating on AccentOS.
> **Frame:** every agent action falls into one of five autonomy levels. The level determines what the agent may do without explicit Captain approval.
> **Authority:** advisory until adopted by Captain; once adopted, enforced via session-start hook + per-action gates.

---

## 1. Five autonomy levels

| Level | Name | What the agent may do | What it must escalate |
|---|---|---|---|
| **L0** | Read-only | Read any file, run any read-only `git` / `jq` / `grep` / `find` / `wc` | All writes |
| **L1** | Documentation-only | L0 + write `docs/design/*.md` (subject to freeze rules) + append `SESSION_LOG.md`, `WORK_IN_PROGRESS.md` | Any other file |
| **L2** | Hub feat (gated) | L1 + edit `js/*.js`, `js/shell_v2/*.js`, `index.html`, `worker/*` (read but not deploy) | `module_modes.json` flips, schema, `wrangler deploy`, canonical files |
| **L3** | Module-mode flips | L2 + flip `module_modes.json` per Hub authority (one flip per commit) | Flip `→ live` or `→ deprecated` (Captain-go required), schema, worker deploy |
| **L4** | Captain-equivalent | (reserved — not currently delegable) | n/a |

**Default level for an unidentified session = L0.** A session must claim a level explicitly via its branch name and prompt context. If unclaimed → L0.

---

## 2. Level-to-role mapping

| Branch role (`ACCENTOS_GOVERNANCE_BRANCH_LIFECYCLE.md`) | Default level | Can elevate to |
|---|---|---|
| Spoke / Convergence | L1 | (locked at L1) |
| Canonical (`claude/governance-*`) | L1 | L2 only for Captain-authorized canonical-adjacent infra (e.g., `.github/workflows/`) |
| Hub feat (`claude/feat-*`) | L2 | L3 with explicit Captain go logged |
| Adoption (merging to `main`) | L1 (during merge) | n/a |
| Archive | L0 | n/a |

A session cannot self-elevate. Elevation happens via Captain action recorded in SESSION_LOG.

---

## 3. Per-level safety ceilings

### L0 — Read-only
- **Allowed:** any read; any analysis; any planning prose returned in chat (not committed).
- **Forbidden:** any `git commit`, any file write.
- **Escalation triggers:** session needs to commit anything → escalate to L1 by branch role.

### L1 — Documentation-only
- **Allowed:** edits to `docs/design/*.md` (subject to freeze rules per `ACCENTOS_GOVERNANCE_FREEZE_NOTICE.md`); SESSION_LOG and WIP appends.
- **Forbidden:** runtime, schema, worker, canonical files, `module_modes.json`, force-push.
- **Escalation triggers:** edit needed outside doc scope → switch to a Hub feat branch.

### L2 — Hub feat (gated)
- **Allowed:** runtime code authoring (`js/*.js`, `index.html`), worker source edits (no deploy), schema *drafts* in SQL files (no apply).
- **Forbidden:** `module_modes.json` flips, `wrangler deploy`, schema apply, canonical edits, deletion of any file without Captain authorization.
- **Required gates per action:** boot-smoke green; `module_modes.json` parses; no frozen-doc edits.
- **Escalation triggers:** flip needed → request L3 with Captain go.

### L3 — Module-mode flips
- **Allowed:** one `module_modes.json` flip per commit; commit body must contain inverse-flip text.
- **Forbidden:** `→ live` or `→ deprecated` flips without Captain go logged in SESSION_LOG within last 24h; schema apply; worker deploy; canonical edits; multi-flip commits.
- **Required gates per action:** R-AUTO-09, 10, 12, 13, 15 from `ACCENTOS_GOVERNANCE_AUTOMATION_RULES.md`.
- **Escalation triggers:** schema or worker → Captain.

### L4 — Captain-equivalent
- **Status:** reserved. No agent currently authorized at this level.
- **Use case:** future delegated authority for narrow Captain-approved scopes (e.g., a "weekend autopilot" mode for a single tightly-scoped task). Implementation deferred until governance + monitoring are mature.

---

## 4. Hard ceilings (independent of level)

These limits apply at every level and cannot be raised by elevation:

- ❌ **No `git push --force` on `main` or canonical branches.** (R-AUTO-08.)
- ❌ **No `git reset --hard` on `main`.** (MASTER §12.)
- ❌ **No deletion of files in `sql/`, `worker/`, `module_modes.json` without Captain.**
- ❌ **No edits to canonical files outside `claude/governance-*` branches.**
- ❌ **No `wrangler deploy` from any agent session.** Captain executes from local machine.
- ❌ **No spend of money.** No paid API calls, no billable services, no third-party tool subscriptions without Captain.
- ❌ **No external communication on Captain's behalf** (no email send, no Slack, no GitHub PR comments unless explicitly authorized for the specific surface).
- ❌ **No deletion of branches** other than per `ACCENTOS_BRANCH_PROTECTION_RULES.md` §7.

---

## 5. Time-bounded ceilings (cost throttling)

To prevent runaway sessions:

| Limit | Bootstrap value | Why |
|---|---|---|
| Max commits per session | 10 | beyond this, batch and review |
| Max files modified per commit | 1 (for canonical / flip) or 5 (for code) | reviewability |
| Max LoC added per commit | 500 | reviewability |
| Max session duration | 90 min wall-clock advisory | catch runaway loops |
| Max retries on a failing operation | 3 | prevent retry-storms |
| Max parallel `claude/*` branches open | 4 (`ACCENTOS_ROLLOUT_READINESS_SYSTEM.md` §8) | rollout congestion |
| Max modules in `building` | 8 (warn) / 9 (block) | rollout congestion |

These are advisory at Bootstrap tier and enforceable at Standard tier via session-end aggregation.

---

## 6. Approval-gated actions (always require explicit human go)

| Action | Gate type | Captured in |
|---|---|---|
| Flip to `live` | Captain SESSION_LOG entry | R-AUTO-10 |
| Flip to `deprecated` | Captain SESSION_LOG entry | R-AUTO-12 |
| Schema apply (DDL) | Captain manual SQL paste | (cannot be hooked) |
| Worker deploy | Captain `wrangler deploy` from local | (cannot be hooked) |
| Canonical-doc edit | branch + commit-body Captain attribution | R-AUTO-04 |
| Adoption merge to `main` | Captain PR review | branch protection §1 |
| Re-opening a frozen doc | Captain SESSION_LOG entry + `--allow-frozen-edit` | R-AUTO-01 |
| Spend money | Captain explicit chat approval | (out-of-band; never automatable) |
| External comms | Captain explicit chat approval per message | (out-of-band) |

---

## 7. ROI-based escalation policy

Implementation order of automation, by return-on-investment:

| Stage | Automation invested | Return |
|---|---|---|
| **Bootstrap** | Layer-1 hooks for R-AUTO-01/02/03/13 (~50 lines bash) | Eliminates 80% of preventable governance failures |
| **Standard** | Layer-2 hooks for R-AUTO-09/10/12/15/17 + session-end aggregator | Closes the remaining preventable governance failures |
| **Enterprise** | Server-side hooks, GitHub branch protection, Slack alerts, supervisor session | Buys parallelism — only ROI-positive when 2+ Hubs run simultaneously |
| **Off-the-shelf** | Adopt a CI framework (Renovate, semantic-release, etc.) | Only if a frame's existing rules align with this catalog. None currently do. |

Stay at Bootstrap until incidents prove the next tier. Tier-up is a Captain decision recorded in SESSION_LOG.

---

## 8. Bootstrap mode (today)

The current AccentOS environment is single-Captain, single-active-Hub, with occasional Spoke planning sessions. At this scale:

- **Manual review** on every `main` commit suffices for L2/L3.
- **PR is optional** for `claude/feat-*` branches if Captain reviews the diff in chat.
- **Layer-1 hooks** (pre-commit) carry most of the enforcement load.
- **No supervisor session** is needed — Captain is the supervisor.
- **No CI/CD beyond Cloudflare auto-deploy** is needed.

This is intentional. Operating at Bootstrap is the cheapest sustainable steady-state.

---

## 9. Enterprise-mode preconditions

The system tiers up to Enterprise mode only when:

- ≥2 active Hubs run concurrently (Captain cannot review every commit synchronously).
- Multiple repos in the agentos-* family are live and require coordination.
- Compliance / audit requirements (e.g., for paid customer relationships) force formal gates.
- Incident rate at Bootstrap exceeds (~1 per quarter).

Until these preconditions are met, Enterprise tier is over-investment.

---

## 10. Anti-agent-chaos enforcement

Specific rules to prevent agent free-for-all:

- **Single Hub at a time.** Detected via `git log --since=30min --author=claude` showing 2+ Hubs → Block second push to `main`.
- **One Spoke per topic.** Two `claude/<topic-prefix>-*` branches with active commits in 7 days → Flag.
- **No agent-initiated branch creation outside the four named patterns.** Names that don't match → Warn at first push, refuse merge to `main`.
- **No agent-initiated `module_modes.json` mode invention.** New mode strings beyond the nine defined in `MODULE_MODES.md` → Block (R-AUTO-02 fails on unknown enum).
- **No agent-initiated phase invention.** Bare "Phase N" without scope prefix → Warn (R-AUTO-05).
- **No silent role-switching.** Branch role at session start = role at session end; mismatch → Flag.
- **No agent-initiated Captain authorization fabrication.** SESSION_LOG entries claiming Captain go without commit-body co-author or signed marker → Block flip.

These rules collectively ensure that **adding more agents does not multiply chaos** — it multiplies blocked operations until the human catches up.

---

*End of ACCENTOS_AGENT_EXECUTION_LIMITS.md — autonomy ceilings.*
