# ACCENTOS_PARALLEL_WORK_RULES.md — Collision Prevention Protocol

| Field         | Value |
|---|---|
| Status        | **ACTIVE — applies to all Claude sessions and all spawned agents** |
| Authority     | Governance authority. These rules supersede any per-branch or per-session preference. |
| Owner         | Claude (enforce) + Michael (can override with explicit written instruction) |
| Last Updated  | 2026-05-09 |
| Related       | `ACCENTOS_IMPLEMENTATION_SEQUENCE.md`, `GOVERNANCE_RISKS.md`, `STABILIZATION_PROTOCOL.md` |

---

## 1. CORE PRINCIPLE

**No two agents own the same file at the same time.**

This is not a preference. It is the single rule from which all others derive. AccentOS has no CI system to detect merge conflicts automatically, no staging environment to absorb bad merges, and one production surface (`accent-os.pages.dev`) that is always live.

Parallel work is an accelerator when it operates on non-overlapping file sets. It is a multiplier of damage when it does not. These rules define the boundary.

A "file" includes: any source file, any doc file, any config file. Two agents reading the same file is always safe. Two agents writing the same file in the same session is never safe.

---

## 2. FILE OWNERSHIP MAP

Files are in one of four states: **FROZEN** (no Claude writes ever), **OWNED** (one active branch holds write rights), **SHARED-SAFE** (multiple branches may write, conflicts structurally impossible), or **UNOWNED** (available for claim by any branch that declares scope).

| File / Path | State | Owner / Notes |
|---|---|---|
| `index.html` | FROZEN until Phase A authorized | No branch owns write rights until Michael writes Phase 2 auth phrase. After auth: one branch at a time, serial only. |
| `worker/anthropic-proxy.js` | FROZEN permanently to Claude | Michael deploys only. GATE-01. No Claude session may write this file. |
| `wrangler.toml` | FROZEN permanently to Claude | Michael manages. GATE-01. |
| `supabase/migrations/` | FROZEN to Claude writes | Michael-executed only. Claude may write new migration SQL files for Michael to run; Claude may not execute them directly. |
| `ui/tokens.css` | OWNED: ui-proto branch | Claude writes on `claude/implement-claude-design-ui-eFn9b` only. |
| `ui/accentos-shell.css` | OWNED: ui-proto branch | Same as above. |
| `ui/accentos-shell.js` | OWNED: ui-proto branch | Same as above. |
| `ui/accentos-shell-prototype.html` | OWNED: ui-proto branch | Reference + demo only. |
| `ui/` (any new file) | OWNED: ui-proto branch | New UI files belong to the ui-proto branch until merged to main. |
| `js/*.js` (existing) | FROZEN until Phase E per-module auth | No edits to existing module files until their individual Phase E migration is authorized. |
| `js/<new-module>.js` | OWNED: claiming branch | Any new module JS file is owned by the branch that creates it. Claim must be declared in branch scope doc. |
| `docs/design/` | SHARED-SAFE | Multiple branches may write different files here. No two branches should write the *same* file concurrently. |
| `docs/implementation/` | SHARED-SAFE | Same as docs/design/. |
| `WORK_IN_PROGRESS.md` | OWNED: active branch | Only the currently executing agent writes this. It is the last-writer-wins state file. |
| `GOVERNANCE_RISKS.md` | SHARED-SAFE (append-only) | Any agent may append new risk entries. Never delete or edit existing entries. |
| `BUILD_PLAN_CLAUDE.md` | OWNED: Hub session | Only the Hub (primary implementation) session checks off items. Sub-agents do not touch this file. |
| `BUILD_PLAN_MICHAEL.md` | FROZEN to Claude writes | Michael writes. Claude reads only. |
| `SESSION_LOG.md` | SHARED-SAFE (append-only) | Each session appends one entry at end. Never edit prior entries. |
| `scripts/boot-smoke.sh` | FROZEN unless test expansion authorized | No edits without explicit Michael authorization. Phase F will require an update — plan for it then. |
| `SYSTEM_STATE.md` | OWNED: Hub session | Hub session updates after phase gates. Sub-agents do not touch. |
| `MASTER.md` | OWNED: Hub session | Same as SYSTEM_STATE.md. |

---

## 3. CONCURRENCY TIERS

### Tier 1 — Always Safe to Parallelize

Operations in this tier can run concurrently without coordination.

- Read-only research agents (any file, any branch)
- Doc-only writes to non-conflicting files in `docs/design/` or `docs/implementation/` — where "non-conflicting" means no two agents are writing the *same filename*
- Planning documents (this file, IMPLEMENTATION_SEQUENCE, etc.)
- Appending to append-only logs (`SESSION_LOG.md`, `GOVERNANCE_RISKS.md`, `PROMPT_LOG.md`)
- Reading `WORK_IN_PROGRESS.md` to assess current state

### Tier 2 — Safe with Coordination

Operations in this tier can run concurrently if and only if the scope declaration is confirmed distinct before either agent starts.

- Different feature branches working on different `js/` module files (each branch declares its target file before first write)
- Different doc subdirectories (e.g., one agent writes `docs/design/X.md`, another writes `docs/implementation/Y.md`)
- Phase 8 sub-branches working on different module targets (one agent per module)
- Mobile authority branch doing PWA research while runtime authority branch does shell work — safe as long as they don't share a target file

**Coordination protocol for Tier 2:** Before first write, the agent must read `WORK_IN_PROGRESS.md` and confirm its target file is not listed as active by another agent. If conflict detected, stop and surface to Michael.

### Tier 3 — Must Serialize

Operations in this tier must complete fully (including commit + push) before the next begins.

- Any write to `index.html` — one session at a time, no exceptions
- Any write to the same `js/` file by two different agents or sessions
- Changes to `scripts/boot-smoke.sh`
- SQL migration file creation (to avoid numbering conflicts — M-numbers must be sequential and unique)
- Merges to `main` — one merge at a time; verify smoke before next merge begins

### Tier 4 — Never Concurrent

These operations must never overlap under any circumstances.

- Two agents writing the same file (any file)
- Production deployments — only one deploy active at a time; Michael is the sole deploy authority
- Any two operations that modify the same Supabase table schema
- `git reset --hard` or other destructive git operations — Michael-only, never concurrent

---

## 4. BRANCH CONFLICT PREVENTION RULES

### Rule 1: One agent per branch at a time
A branch may only have one active writing agent. If a second agent needs to work on the same branch, the first must have committed and pushed all pending changes first.

### Rule 2: Branch scope declaration before first commit
Before any agent makes its first commit to a branch, it must write its scope declaration to `WORK_IN_PROGRESS.md`. Scope declaration format:

```
Branch: <branch-name>
Agent: <session description>
Scope: <exact list of files this agent will write>
Start: <date>
```

### Rule 3: No branch may write to frozen files
See File Ownership Map. FROZEN means FROZEN. No exception without explicit Michael written authorization, committed to `BUILD_PLAN_MICHAEL.md`.

### Rule 4: No branch may write to files owned by another active branch
Before writing any file, check: is this file in another branch's declared scope? If yes, stop. Surface the conflict to Michael.

### Rule 5: All merges through main — no branch-to-branch merges
```
feature-branch → main → (other-feature-branch pulls from main)
```
Never:
```
feature-branch-A → feature-branch-B  ← FORBIDDEN
```
Branch-to-branch merges create unauditable dependency chains and can bypass boot smoke gates.

### Rule 6: A branch's scope is fixed at declaration
A branch that declared it would modify `js/vendors-shell.js` may not mid-session also begin editing `js/customers-shell.js` without a new scope declaration committed to `WORK_IN_PROGRESS.md` and a scope-expansion check (confirm no other agent has claimed that file).

---

## 5. SPAWN AUTHORITY MATRIX

Defines who may spawn sub-agents and what those agents are permitted to do.

```
Implementation Hub (primary session)
├── MAY SPAWN: Research agents (read-only, any file)
├── MAY SPAWN: Doc-writer agents (Tier 1 writes only)
├── MAY SPAWN: Phase E module sub-branches (one per module)
│   └── Each sub-branch: CANNOT spawn further agents
└── MAY SPAWN: Governance review agent (read-only GOVERNANCE_RISKS.md)

Runtime Authority Branch (claude/accentos-workflow-design-G0opy)
├── MAY SPAWN: UI sub-agents within declared file scope
│   └── Sub-agent file scope must be subset of parent branch scope
│   └── Sub-agent CANNOT spawn further agents
└── CANNOT SPAWN: Agents that touch frozen files

Governance Authority Branch (claude/accentos-rollout-planning-UTElf)
├── CANNOT SPAWN any agents — this branch is read-only planning
└── All work in this branch is done by a single agent per session

Mobile Authority Branch (claude/research-mobile-pwa-Q6vYN)
├── MAY SPAWN: Research agents (read-only)
├── MAY SPAWN: Design agents (docs/design/ writes only)
└── CANNOT SPAWN: Agents that touch ui/ or js/ without explicit scope declaration

Any spawned agent (first-generation sub-agent)
└── CANNOT SPAWN further sub-agents — cascade prevention
```

**Why no cascade:** Each spawn level adds coordination overhead and reduces auditability. Two levels (hub + one sub-agent) is the maximum viable depth without a dedicated orchestration system.

---

## 6. MERGE CADENCE RULES

### Sub-branches merge to feature branch within 3 sessions
A Phase E module sub-branch that has been open for 3 sessions without merging is considered stale. Stale branches must either merge or be closed with state committed to `WORK_IN_PROGRESS.md`.

### Feature branches merge to main at phase gates — not continuously
```
Phase A complete → merge ui-proto to main → tag v[next]
Phase B complete → merge runtime-authority branch to main → tag v[next]
```
Do not merge mid-phase. Merging before a phase gate means main is between stable states, which violates the "main is always deployable" rule.

### main is always deployable
Every commit on `main` must pass boot smoke. If a merge causes smoke to fail, revert the merge immediately. Do not leave `main` in a failing state while debugging.

### No merge without boot smoke passing
Before any merge to `main`, the merging agent must:
1. Run `bash scripts/boot-smoke.sh` on the source branch
2. Confirm 0 failures
3. Include smoke output in the merge commit message or PR description

The current smoke test covers 26 checks across core files, module JS, UI foundation, governance docs, design docs, and git state. All 26 must pass.

---

## 7. HANDOFF PROTOCOL

When a session ends without task completion, or when an agent completes its scoped work and hands off to the next agent, the following is required.

### Required handoff content
Every handoff must include all five fields:

```
## Handoff — [date]

### Files Changed
- [list every file written this session, with 1-line description of change]

### Files Read (for context)
- [list files read but not modified]

### Unresolved Questions
- [any open question that blocks continuation]

### Blocking Items
- [anything waiting on Michael or another agent]

### Suggested Continuation Prompt
[exact prompt text the next session should use to pick up the work]
```

### Handoff destination
Overwrite `WORK_IN_PROGRESS.md` with the handoff. Per existing operating rules, this file represents the live state of the active task. It is always overwritten — never appended.

### No implicit state
No agent may assume that the next agent "knows" something that is not written in a file. Session memory does not persist. All state must be explicit in files. If it's not in `WORK_IN_PROGRESS.md`, `SESSION_LOG.md`, or a committed doc file, it does not exist for the next agent.

---

## 8. EMERGENCY FREEZE PROTOCOL

### Any agent may call a freeze
If any agent encounters a condition that poses a risk to production stability, data integrity, or governance compliance, it must immediately:

1. Stop all file writes
2. Commit any in-progress changes to a WIP branch (do not push to `main`)
3. Append a FREEZE entry to `GOVERNANCE_RISKS.md` in this format:

```
### FREEZE — [date] — [brief description]
- **Triggered by:** [session/agent description]
- **Condition:** [what was found]
- **Severity:** [Critical / High / Medium]
- **Affected files/branches:** [list]
- **Status:** FROZEN — awaiting Michael
```

4. Overwrite `WORK_IN_PROGRESS.md` with the freeze state and the continuation prompt Michael should use to unfreeze.

### Freeze supersedes all active agents
When a FREEZE entry is written:
- All other active agents must complete their current atomic operation and stop
- No new merges to `main`
- No new spawned agents
- No new `index.html` edits

### Recovery requires explicit unfreeze
Michael or the Hub (with explicit Michael written authorization in `BUILD_PLAN_MICHAEL.md`) must write an UNFREEZE entry to `GOVERNANCE_RISKS.md`:

```
### UNFREEZE — [date]
- **Authorized by:** Michael
- **Resolution:** [what was fixed or decided]
- **Resumption point:** [which phase/task]
```

Agents do not self-unfreeze. A freeze is not lifted by the passage of time.

### Conditions that automatically trigger a freeze
The following conditions require an immediate freeze without judgment:
- Any write to `worker/anthropic-proxy.js` or `wrangler.toml` was made or attempted
- Boot smoke failures increased (new failures that weren't present at session start)
- A `git reset --hard` was run without Michael authorization
- A branch-to-branch merge occurred (bypassing `main`)
- A SQL migration was executed directly by Claude (not Michael)
- A file in FROZEN state was modified

---

## 9. QUICK-REFERENCE DECISION TREE

When about to write a file, run this check:

```
1. Is the file in the FROZEN list?
   YES → Stop. Do not write. Surface to Michael if task requires it.
   NO  → Continue.

2. Is another active branch's scope declaration claiming this file?
   YES → Stop. Coordinate with that branch's owner or surface to Michael.
   NO  → Continue.

3. Is this a Tier 3 or Tier 4 operation?
   YES → Confirm no other agent is in the middle of a Tier 3/4 operation on this file.
   NO  → Continue.

4. Does this write exceed 50 lines on index.html?
   YES → GATE-05. Stop. Get Michael approval. Document approval in commit message.
   NO  → Continue.

5. Write the file. Commit. Run boot smoke. If smoke fails → rollback immediately.
```
