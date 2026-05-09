# AccentOS Governance Automation Rules
> **Doc type:** Enforcement specification. Machine-enforceable rules, not philosophy.
> **Frame:** every rule listed here either *is* automatable today (with a shell hook) or *should be* automated when the system has resources.
> **Authority:** advisory until adopted by Captain on a `claude/governance-*` branch; once adopted, enforced via hooks.
> **Anti-pattern:** automation that mutates governance autonomously. Every rule below is **detect-and-pause**, never **detect-and-execute**.

---

## 1. Enforcement primitives

| Primitive | Means | Reversibility | Authority required |
|---|---|---|---|
| **Block** | pre-commit / pre-push hook exits non-zero | reversible (commit retried after fix) | hook-author = Captain on `claude/governance-*` |
| **Warn** | hook prints warning, exit 0 | n/a | same |
| **Flag** | append a line to a `.governance-flags` log | reversible | same |
| **Pause** | print message + advise human action | always reversible | same |

**Forbidden primitive:** any hook that mutates `module_modes.json`, canonical files, `index.html`, `worker/`, or SQL. Hooks read and check; they do not edit governance-scoped surfaces.

---

## 2. Rule catalog (R-AUTO-NN)

Each rule has: trigger, primitive, scope, cost-tier (see §6), and rationale.

### R-AUTO-01 · Frozen-doc edit protection
- **Trigger:** any commit modifying a path listed in `ACCENTOS_GOVERNANCE_FREEZE_NOTICE.md` "What is frozen."
- **Primitive:** Block.
- **Scope:** all branches except a `claude/governance-*` branch with explicit `--allow-frozen-edit` flag.
- **Cost-tier:** Bootstrap (≈ 20 lines of bash).
- **Rationale:** prevents drift after freeze.

### R-AUTO-02 · `module_modes.json` parse validity
- **Trigger:** any commit modifying `module_modes.json`.
- **Primitive:** Block on parse failure (`jq . module_modes.json > /dev/null`).
- **Scope:** all branches.
- **Cost-tier:** Bootstrap (1 line).
- **Rationale:** F7 prevention from `ACCENTOS_ROLLOUT_FAILURE_SCENARIOS.md`.

### R-AUTO-03 · One flip per commit
- **Trigger:** commit modifies `module_modes.json` AND any other tracked file.
- **Primitive:** Block.
- **Scope:** all branches.
- **Cost-tier:** Bootstrap (5 lines).
- **Rationale:** rollback by inversion requires single-file flip diffs.

### R-AUTO-04 · One canonical edit per commit
- **Trigger:** commit modifies a canonical file (`SYSTEM_STATE.md`, `GOVERNANCE_RISKS.md`, `STABILIZATION_PROTOCOL.md`, `MODULE_OWNERSHIP_MAP.md`, `MASTER.md`, `MODULE_MODES.md`) AND any other file.
- **Primitive:** Block.
- **Scope:** `claude/governance-*` branches.
- **Cost-tier:** Bootstrap.
- **Rationale:** canonical changes review one-at-a-time.

### R-AUTO-05 · Phase-numbering scope prefix
- **Trigger:** commit subject matches regex `\bPhase [0-9]+\b` without preceding `canonical|rollout`.
- **Primitive:** Warn.
- **Scope:** all branches.
- **Cost-tier:** Bootstrap.
- **Rationale:** prevents canonical/rollout phase confusion (Canonical Delta C-Δ-4).

### R-AUTO-06 · Branch-naming role enforcement
- **Trigger:** push to a branch whose name does not match one of: `main`, `claude/governance-*`, `claude/feat-*`, `claude/<topic>-<suffix>`.
- **Primitive:** Warn (advisory; Captain may override).
- **Scope:** push hook.
- **Cost-tier:** Bootstrap.
- **Rationale:** branch name = role per Multi-Session Constitution Article I.

### R-AUTO-07 · Spoke role write-scope
- **Trigger:** commit on `claude/<topic>-<suffix>` modifies any path outside `docs/design/` (excluding `SESSION_LOG.md`, `WORK_IN_PROGRESS.md` for the latter when explicit).
- **Primitive:** Block.
- **Scope:** spoke branches.
- **Cost-tier:** Bootstrap.
- **Rationale:** Spoke must never touch runtime per Constitution Article VI.

### R-AUTO-08 · Force-push prohibition
- **Trigger:** any `git push --force` or `--force-with-lease` to `main` or any canonical branch.
- **Primitive:** Block.
- **Scope:** server-side (when available); client-side hook as fallback.
- **Cost-tier:** Bootstrap.
- **Rationale:** MASTER §12 hard rule.

### R-AUTO-09 · Stop-condition freeze trigger detection
- **Trigger:** a Hub session attempts to flip a `module_modes.json` mode toward `live` while WORK_IN_PROGRESS.md is non-empty.
- **Primitive:** Block.
- **Scope:** Hub branches.
- **Cost-tier:** Bootstrap (10 lines).
- **Rationale:** Freeze Protocol §1 hard trigger.

### R-AUTO-10 · Captain-go presence on `→ live` flip
- **Trigger:** commit flips a module to `live` mode without a SESSION_LOG.md entry within the last 24h containing string `Captain` + `live` + module key.
- **Primitive:** Block.
- **Scope:** Hub branches.
- **Cost-tier:** Standard (regex over recent SESSION_LOG entries).
- **Rationale:** Escalation Matrix §1 + Multi-Session Constitution Article II.

### R-AUTO-11 · Cachebust query-string presence
- **Trigger:** any new `import('/js/shell_v2/...')` without `?v=` query.
- **Primitive:** Warn.
- **Scope:** Hub branches modifying `index.html` or `js/shell_v2/*`.
- **Cost-tier:** Bootstrap.
- **Rationale:** F9 stale-client prevention.

### R-AUTO-12 · `→ deprecated` Captain authority
- **Trigger:** flip from `live` to `deprecated` without SESSION_LOG Captain go.
- **Primitive:** Block.
- **Scope:** Hub branches.
- **Cost-tier:** Standard.
- **Rationale:** Escalation Matrix §1 (post C10 row).

### R-AUTO-13 · Multi-flip-per-commit detection
- **Trigger:** commit changes 2+ entries in `module_modes.json`.
- **Primitive:** Block.
- **Scope:** all branches.
- **Cost-tier:** Bootstrap (jq diff).
- **Rationale:** one flip per commit per Constitution Article X.

### R-AUTO-14 · Bare "Phase N" in commit subject
- **Trigger:** commit subject contains `Phase 0`–`Phase 9` not preceded by `canonical|rollout|restructure|shell-v2`.
- **Primitive:** Warn.
- **Scope:** all branches.
- **Cost-tier:** Bootstrap.
- **Rationale:** terminology lint.

### R-AUTO-15 · Inverse-flip in commit body
- **Trigger:** commit modifying `module_modes.json` lacks string `revert:` or `inverse:` in body.
- **Primitive:** Warn.
- **Scope:** all branches.
- **Cost-tier:** Bootstrap.
- **Rationale:** rollback copy-paste discipline.

### R-AUTO-16 · Stale-branch advisory
- **Trigger:** `claude/*` branch idle ≥14 days.
- **Primitive:** Flag (weekly job appends to `.governance-flags`).
- **Scope:** server-side or weekly local script.
- **Cost-tier:** Standard.
- **Rationale:** Constitution Article X.

### R-AUTO-17 · Modules-in-`building` congestion
- **Trigger:** `module_modes.json` contains ≥9 modules with `mode: building`.
- **Primitive:** Warn.
- **Scope:** post-commit hook on Hub branches.
- **Cost-tier:** Bootstrap.
- **Rationale:** Freeze Protocol §1 soft trigger.

### R-AUTO-18 · Open-WIP rollout-Phase-advance block
- **Trigger:** any commit on Hub attempting forward Phase advance with `WORK_IN_PROGRESS.md` non-empty.
- **Primitive:** Block.
- **Scope:** Hub.
- **Cost-tier:** Standard.
- **Rationale:** Escalation Matrix §2 + Freeze Protocol §1.

---

## 3. Approval gates (machine-checkable preconditions)

A Hub session may execute a state-changing operation only when **all** preconditions evaluate true. The hook composes them; the human satisfies them.

| Operation | Preconditions |
|---|---|
| Flip to `live` | R-AUTO-09 clear, R-AUTO-10 satisfied, R-AUTO-13 single, R-AUTO-15 present |
| Flip to `deprecated` | R-AUTO-12 satisfied, R-AUTO-13 single |
| Internal flip (`building`↔`testing`) | R-AUTO-02, R-AUTO-13, R-AUTO-15 |
| Schema change | (cannot be hooked — Captain manual SQL paste) |
| Worker deploy | (cannot be hooked — Captain `wrangler` from local) |
| Canonical-doc edit | branch matches `claude/governance-*`, R-AUTO-04 single |
| Adoption merge | R-AUTO-01 (no frozen-doc edits in merge), Checklist §1 manual checks |

---

## 4. Default-safe principle (machine encoding)

When two rules disagree or a rule's input is missing:
1. The hook **blocks** rather than warns.
2. The blocked operation is preserved (commit-as-draft); not deleted.
3. The hook prints the resolution path: which file to read, who to escalate to.
4. Captain `--override` flag is the only escape; logged to `.governance-flags`.

The system is biased toward false-positive blocks over false-negative passes.

---

## 5. What is **not** automatable

These are explicit gaps; no hook should pretend to enforce them:

- **Captain "go" semantics.** A SESSION_LOG entry containing the right strings is a proxy, not a guarantee.
- **Mobile parity at 390px.** Requires human visual check.
- **Visual parity v1↔v2.** Requires human side-by-side.
- **Captain availability.** Cannot be detected; only declared.
- **Subjective readiness.** S/M/W/G/R sub-scores require human judgment per `ACCENTOS_ROLLOUT_READINESS_SYSTEM.md` §11 anti-gaming rules.
- **Cross-session intent.** Two sessions both committing innocuous changes can still conflict semantically.

For these, the hook's job is to **surface the question to the human**, not answer it.

---

## 6. Cost tiers (when to implement which rule)

| Tier | Description | When |
|---|---|---|
| **Bootstrap** (~20 lines bash, no deps) | R-AUTO-01–08, 11, 13–15, 17 | Implement immediately after Captain canonical merge; cost <1 session each |
| **Standard** (~50 lines bash + `jq`/`grep` + git log queries) | R-AUTO-09, 10, 12, 16, 18 | Implement after Phase 1 ships; ROI proven |
| **Enterprise** (server-side hooks, CI workflows, Slack alerts) | force-push prohibition (server-side), stale-branch reaper, automated Captain-queue surfacing | Defer until headcount or risk justifies |

The system should **always** start at Bootstrap and only ascend tiers when actual incidents prove the tier-up.

---

## 7. Implementation surface (for the future implementer)

Each rule maps to one of:

- `.git/hooks/pre-commit` (client-side; user-bypassable but advisory)
- `.git/hooks/pre-push` (client-side; harder to bypass)
- `.github/workflows/*.yml` (server-side; cannot be bypassed)
- `scripts/governance-*.sh` (manual run or scheduled cron)
- `.claude/settings.json` SessionStart hook (advisory)

Authoring a hook is a **D-priority Captain canonical-adjacent edit** — hooks live in `.git/hooks/` (not version-controlled by default) or `.github/workflows/` (canonical-adjacent infrastructure). Either way, Captain-authored, single-commit.

---

## 8. Feedback loop

When a rule fires:
1. The blocked / flagged event is appended to `.governance-flags` (gitignored or in `_aggregator.log`-style append-only).
2. The aggregator ( `efficiency-monitor` or a sibling skill) summarizes flags at session-end.
3. Captain reviews flag patterns and decides: (a) tighten the rule, (b) loosen it, (c) leave it.
4. Rule changes follow the canonical-edit protocol (single commit, `claude/governance-*` branch, Captain go).

The rules are not static. They evolve with the system. But they evolve **by Captain decision**, not by automation.

---

*End of ACCENTOS_GOVERNANCE_AUTOMATION_RULES.md — enforcement spec.*
