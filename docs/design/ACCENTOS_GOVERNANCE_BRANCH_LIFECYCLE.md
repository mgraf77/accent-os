# AccentOS Governance Branch Lifecycle Model
> **Doc type:** Planning. Branch-strategy reference for multi-session orchestration.
> **Frame:** every Claude session lives in one role; roles are determined by branch name and commit pattern; no role-switching mid-session.

A future multi-session run should consult this doc once and never need to re-discover branch strategy.

---

## 1. Seven branch roles

| Role | Pattern | Purpose | Authority |
|---|---|---|---|
| **Spoke** | `claude/<topic>-<suffix>` | Drafts in `docs/design/*.md` | Non-authoritative |
| **Convergence** | `claude/<topic>-<suffix>` (continued) | Same branch evolves through alignment passes (A → B → C → freeze) | Non-authoritative; advances in single-file commits |
| **Canonical** | `claude/governance-<topic>-<suffix>` | Edits canonical files (`SYSTEM_STATE.md`, `GOVERNANCE_RISKS.md`, `STABILIZATION_PROTOCOL.md`, `MODULE_OWNERSHIP_MAP.md`, `MASTER.md`, `MODULE_MODES.md`, `module_modes.json`) | Captain-authorized; single-writer |
| **Freeze** | Any branch at the freeze commit + freeze notice | A frozen state of a spoke or canonical branch | No edits permitted to frozen scope |
| **Adoption** | `main` (or fast-forward to `main`) | Hub merges spoke planning into `main` | Hub-authoritative under Captain go |
| **Execution** | `main` (or short-lived `claude/feat-*` fast-forwarding) | Production code, schema, worker, `module_modes.json` flips | Hub-authoritative under Captain go |
| **Archive** | retained tag/branch reference; no further commits | Read-only history | None |

A branch may move through roles (e.g., spoke → convergence → freeze → adoption). It cannot occupy two roles simultaneously.

---

## 2. Per-role rules

### Spoke
- **Allowed:** create / edit any file under `docs/design/`. Append to `SESSION_LOG.md`.
- **Forbidden:** runtime code, canonical files, `module_modes.json`, `index.html`, `worker/`, SQL, force-push, merge-to-`main`.
- **Merge authority:** none. Merges to `main` only via Hub adoption under Captain go.
- **Retirement:** when frozen + adopted, or when archived after 14 days idle (multi-session constitution Article X).
- **Example:** `claude/accentos-rollout-planning-UTElf` from creation through C-priority pass.

### Convergence
- A spoke branch in its alignment-pass phase. Same rules as Spoke; the role is descriptive of *commit cadence*: single-file commits, one alignment edit per commit.
- **Allowed:** read-only consults of canonical branches (e.g., `git fetch origin claude/governance-snapshot-prep-k3dBs`).
- **Forbidden:** anything Spoke forbids; additionally, no broad refactors or new subsystem authoring.
- **Retirement:** when freeze notice lands.
- **Example:** `claude/accentos-rollout-planning-UTElf` during A/B/C passes.

### Canonical
- **Allowed:** edits to canonical files only. One file per commit.
- **Forbidden:** non-canonical edits in the same commit; runtime code; force-push.
- **Merge authority:** Captain authorizes; merges to `main` first per `ACCENTOS_MULTI_SESSION_GOVERNANCE.md` Article IV.
- **Retirement:** after merge to `main` and verification.
- **Example:** `claude/governance-snapshot-prep-k3dBs`.

### Freeze
- **Allowed:** read; cite by commit hash.
- **Forbidden:** any edit to frozen-scope files.
- **Merge authority:** the same as the underlying role's merge authority — freeze is a *state*, not a separate branch.
- **Retirement:** when adopted to `main` (state dissolves).
- **Example:** this branch immediately following the `ACCENTOS_GOVERNANCE_FREEZE_NOTICE.md` commit.

### Adoption
- **Allowed:** merge commits, `git revert` of merge commits, fast-forward updates.
- **Forbidden:** original feature work in adoption commits; bundling code with merges.
- **Merge authority:** Hub session under Captain go.
- **Retirement:** never (this is `main`).

### Execution
- A `main` (or fast-forward) state during runtime feature work. Same as Adoption rules with the addition that runtime code, `module_modes.json` flips, and schema changes happen here.
- **Allowed:** one flip per commit; one extraction per session; runtime feature work per Hub authority.
- **Forbidden:** force-push to `main`; bundling flips with code; canonical-doc edits (those need a `claude/governance-*` branch).
- **Merge authority:** Hub under Captain go for `→ live` flips.
- **Retirement:** never.

### Archive
- A retained reference to a completed branch. Tagged for history.
- **Allowed:** none (read-only).
- **Forbidden:** any commit.
- **Retirement:** when explicitly garbage-collected (extremely rare).
- **Example:** prior session branches (e.g., `claude/build-quote-generator-mUEQ1`, ~50 dormant `claude/*` branches per `git ls-remote --heads origin`).

---

## 3. Lifecycle transitions

```
                  Captain creates spec
                        │
                        ▼
        Spoke ──────────────────────────────► drafts created
        (claude/<topic>-<suffix>)
                        │
                        │  alignment passes (A, B, C)
                        ▼
       Convergence ─────────────────────────► single-file commits
                        │
                        │  freeze notice committed
                        ▼
         Freeze ────────────────────────────► no further edits in scope
                        │
                        │  Captain "go" for adoption
                        ▼
       Adoption ────────────────────────────► merge to main
                        │
                        │  Captain "go" for execution
                        ▼
      Execution ────────────────────────────► runtime work begins
                        │
                        │  feature complete
                        ▼
        Archive ───────────────────────────► tag retained, no edits

   (Canonical branches run in parallel and merge to main BEFORE
    spoke branches whose content depends on them.)
```

---

## 4. Merge sequencing across the seven roles

Per multi-session constitution Article IV, with role labels:

```
1. Canonical merges     →  main
2. D-priority canonical merges (Captain-prepared edits)  →  main
3. Adoption of frozen spoke planning branch  →  main
4. Execution feature branches (claude/feat-*)  →  main, one at a time
```

Forbidden: a spoke / convergence branch merging before its canonical dependency.

---

## 5. Examples from current sessions (2026-05-09 snapshot)

| Branch | Role at freeze time | Notes |
|---|---|---|
| `main` | Adoption / Execution (active) | Last commit `969de17` worker-proxy WIP |
| `claude/governance-snapshot-prep-k3dBs` | Canonical (pre-merge) | Holds the four canonical governance files |
| `claude/accentos-rollout-planning-UTElf` | Spoke → Convergence → Freeze | This branch — frozen at C-pass + this lifecycle commit |
| ~50 `claude/<topic>-<suffix>` dormant branches | Spoke (idle) → Archive (after 14d) | Per stale-branch rule |
| `claude/add-autonomous-governance-NwHL7` | Spoke (presumed idle; not consulted) | Outside current scope |
| `claude/internal-meetings-module-2LSUN` | Execution (completed) | Merged feature work |

---

## 6. Retirement conditions (compact)

- **Spoke / Convergence:** 14 days idle → presumed abandoned; canonical wins on conflict.
- **Canonical:** retires when merged to `main`; tag preserved (e.g., `governance-baseline-2026-05-08`).
- **Freeze:** retires when adopted (state dissolves at merge).
- **Adoption / Execution:** never (this is `main`).
- **Archive:** never garbage-collected unless Captain explicitly approves.

---

## 7. Anti-patterns

- ❌ A spoke branch that creates runtime code → revert, refactor onto a Hub branch.
- ❌ Two spoke branches editing the same `docs/design/*.md` file in parallel → freeze both, Captain decides.
- ❌ A canonical branch editing non-canonical files → split into two branches.
- ❌ A freeze branch receiving any edits → revert.
- ❌ An adoption commit containing original feature work → split.
- ❌ Force-push to `main` (forbidden by hard rules).
- ❌ Re-classifying a branch's role mid-session → start a new branch.

---

*End of ACCENTOS_GOVERNANCE_BRANCH_LIFECYCLE.md — branch-strategy reference.*
