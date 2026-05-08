# AccentOS Multi-Session Governance Constitution
> **Doc type:** Planning only. Constitution-tier — short, unambiguous, durable.
> **Purpose:** prevent entropy when multiple Claude sessions (spoke/hub) operate on the codebase in parallel.
> **Frame:** simple rules, hard boundaries, low overhead.

---

## Article I — Session classes

There are exactly three classes of session:

| Class | Branch pattern | Writes | Reads |
|---|---|---|---|
| **Hub (primary)** | `main` (or fast-forward branch merging to `main`) | Production code, schema, worker, `index.html`, `module_modes.json`, canonical governance docs | Everything |
| **Spoke (planning)** | `claude/<topic>-*` (e.g., `claude/accentos-rollout-planning-UTElf`) | `docs/design/*.md` only | Everything |
| **Captain (human)** | n/a | Anything; final authority | Everything |

A session declares its class by branch name. **A session must not switch class mid-run.**

---

## Article II — Authoritative session rules

1. **At any given moment, exactly one Hub session is authoritative.** The authoritative Hub is the one whose last commit is the tip of `origin/main`.
2. **Spoke sessions are non-authoritative.** They draft. Hub sessions adopt or reject.
3. **Captain is always authoritative.** Captain may override any session.
4. **Authority does not transfer silently.** A session that creates a commit on `main` is asserting Hub authority for that change.

---

## Article III — Canonical ownership

Canonical files (`SYSTEM_STATE.md`, `GOVERNANCE_RISKS.md`, `STABILIZATION_PROTOCOL.md`, `MODULE_OWNERSHIP_MAP.md`, `MASTER.md`, `MODULE_MODES.md`, `module_modes.json`) have these rules:

1. **Single-writer.** At most one session edits a canonical file at any time.
2. **Branch-exclusive.** Canonical-doc edits live on `claude/governance-*` branches; code branches do not touch them.
3. **Read-only for spoke.** Spoke sessions cite canonical files; never edit.
4. **Merge-before-fork.** A canonical file under active edit blocks parallel branches from forking it.
5. **Captain seal.** A canonical-doc PR merges only with explicit Captain go.

---

## Article IV — Merge sequencing

When multiple branches are open:

1. **Canonical-doc PRs merge before code PRs that depend on them.** Never the reverse.
2. **`module_modes.json` flip PRs merge atomically** — one flip per PR, no co-changes.
3. **Spoke planning PRs merge after canonical-doc PRs they reference.**
4. **Code PRs merge in dependency order** (helpers before consumers, schema before code).
5. **Stale branches** (>14 days idle) are presumed abandoned; their work is overridden by canonical content on conflict.

---

## Article V — Conflict handling

When two branches conflict:

1. Classify each branch (Hub / Spoke / governance).
2. Apply precedence: governance > Hub > Spoke.
3. If same class, apply recency: most recently merged-to-`main` wins.
4. If both unmerged and same class, **freeze both** and escalate to Captain.
5. Log the resolution in SESSION_LOG with both commit hashes.

**Forbidden:**
- "Both can be true." Not an option.
- Silent overwrite. Every resolution is logged.
- Cherry-picking parts of both. Pick one winner; recreate desired bits in a new commit.

---

## Article VI — Write-permission boundaries

| Surface | Hub | Spoke | Captain |
|---|---|---|---|
| `index.html` | ✅ | ❌ | ✅ |
| `js/*.js` (existing modules) | ✅ | ❌ | ✅ |
| `js/shell_v2/*.js` (future) | ✅ | ❌ | ✅ |
| `worker/*` | Captain go required | ❌ | ✅ |
| `sql/*` | ❌ | ❌ | ✅ (manual) |
| `module_modes.json` | ✅ (one flip per commit) | ❌ | ✅ |
| Canonical governance docs | ✅ on `claude/governance-*` only | ❌ | ✅ |
| `MASTER.md` | append §15 only | ❌ | ✅ |
| `docs/design/*.md` | ✅ | ✅ | ✅ |
| `SESSION_LOG.md` | ✅ append | ✅ append | ✅ |
| `WORK_IN_PROGRESS.md` | ✅ overwrite | ❌ | ✅ |
| `BUILD_PLAN_*.md` | ✅ check-offs | ❌ | ✅ |

---

## Article VII — Single-writer principles

1. **One writer per surface per moment.** No co-edits to the same file across sessions.
2. **The writer is identified by branch name.** Branch naming is not decorative — it is the access-control mechanism.
3. **Write tokens are not transferable.** A session ends → its write claim ends. Resume = new claim.
4. **Read is always free.** Any session may read any file at any time.

---

## Article VIII — Planning vs. implementation boundary

1. **Planning sessions never produce runtime code.** Markdown, JSON-as-data, checklists — yes. JS/TS/HTML/CSS/SQL — no.
2. **Implementation sessions never author canonical governance docs.** They edit them under Captain direction; they do not draft them.
3. **Spoke planning artifacts are draft until adopted.** Adoption happens via a Hub commit citing the spoke artifact.
4. **A spoke session that produces runtime code is in violation** and its work must be reverted.

---

## Article IX — Escalation during session conflicts

When two sessions conflict in real time:

1. **Both freeze.** No further commits on either branch until resolved.
2. **The detecting session writes a SESSION_LOG entry** naming both branches, both heads, the conflicting surface.
3. **Captain decides** within one session window.
4. **Loser's commits are reverted** on the loser's branch (not on `main`).
5. **Winner proceeds.** Loser's intent is captured in the SESSION_LOG entry.

The detecting session is not the deciding session. Detection ≠ authority.

---

## Article X — Entropy prevention rules

These keep the multi-session system from drifting:

1. **One flip per commit.** Always.
2. **One subsystem extraction per session.** Never two.
3. **No commit bundles a flip with code.** Always separate.
4. **No commit bundles a canonical-doc edit with anything else.** Always alone.
5. **Branch names follow the pattern.** `claude/<topic>-<suffix>`. Off-pattern branches are quarantined.
6. **SESSION_LOG entry per session-end.** Mandatory.
7. **WIP empty before session end.** Mandatory; if not, mark explicitly as paused.
8. **Stale branches close.** 14 days idle → archive or delete.
9. **No "temporary" exceptions.** A "we'll fix it later" is a P2 ticket; it does not bypass these rules.
10. **Captain may waive any rule** for a specific commit, with reason logged.

---

## Article XI — Constitutional changes

This document is a planning artifact (precedence #14 per the escalation matrix). Changes require:

1. A `claude/governance-*` branch.
2. Captain go in SESSION_LOG.
3. A single commit per article changed.
4. No bundling with non-governance changes.

Articles are stable by intent. If three sessions in a row need exceptions, the article is wrong — fix the article, not the practice.

---

## Article XII — When this constitution is silent

If a question is not answered here:

1. Check `MASTER.md` §12 (Hard Rules).
2. Check `ACCENTOS_GOVERNANCE_RECONCILIATION.md`.
3. Check `ACCENTOS_GOVERNANCE_ESCALATION_MATRIX.md`.
4. Default to the safe action (no state change).
5. Escalate to Captain.

Silence is not permission.

---

*End of ACCENTOS_MULTI_SESSION_GOVERNANCE.md — planning only. The multi-agent constitution.*
