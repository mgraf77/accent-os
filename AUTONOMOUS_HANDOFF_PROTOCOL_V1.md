# AUTONOMOUS HANDOFF PROTOCOL V1
> **Status:** Draft — Session 4 orchestration design
> **Scope:** Standardize relay between Claude Code, Codex, Jules, Cowork, and future agents
> **Goal:** Remove Michael as a copy/paste router. Make agent-to-agent handoffs deterministic, auditable, and safe.

---

## 1. WHY THIS EXISTS

Today Michael is the relay bus:
- Reads output from Agent A.
- Hand-edits a prompt for Agent B.
- Resolves ambiguity in his head.
- Carries unstated context between sessions.

This caps the system at human keystroke speed and human memory. V1 defines a packet format and a small set of corridor rules so agents can hand off without him in the middle for routine work.

---

## 2. STANDARDIZED RELAY PACKET

Every cross-agent handoff produces a **Relay Packet** committed to the repo at:

```
.orchestration/relays/<UTC-timestamp>__<from-agent>__<to-agent>__<short-slug>.json
```

### 2.1 Required fields

```json
{
  "packet_version": "1.0",
  "id": "REL-2026-05-15-001",
  "from_agent": "claude-code",
  "to_agent": "codex",
  "intent": "implement | review | verify | refactor | investigate | document",
  "branch": "claude/orchestration-layer-design-fkUMQ",
  "base_commit": "<sha>",
  "files_owned": ["docs/foo.md", "js/bar.js"],
  "files_readonly": ["index.html"],
  "execution_corridor": "docs-only | js-additive | sql-additive | worker | infra",
  "preconditions": ["BUILD_PLAN_CLAUDE.md item M47 [ ]"],
  "definition_of_done": [
    "tests pass: scripts/status.sh",
    "no edits to MODULE_REGISTRY",
    "commit pushed to <branch>"
  ],
  "escalation_triggers": [
    "any change to wrangler.toml",
    "any new top-level dependency",
    "ambiguity in spec > 1 reasonable interpretation"
  ],
  "context_refs": [
    "MASTER.md#section-4",
    "BUILD_INTELLIGENCE.md",
    "AI_INTERACTION_MAP.md"
  ],
  "expires_at": "2026-05-16T00:00:00Z",
  "human_required": false,
  "signature": "<from-agent-id>@<commit-sha>"
}
```

### 2.2 Lifecycle states

`open → claimed → in_progress → completed | escalated | expired`

State transitions are appended (never overwritten) to a sibling file:
`.orchestration/relays/<id>.log.jsonl`

### 2.3 Acceptance rules
- An agent MUST refuse a packet whose `execution_corridor` is outside its allowed list.
- An agent MUST refuse if `base_commit` is no longer an ancestor of its working branch.
- An agent MUST escalate (not silently expand scope) if its work would touch a file outside `files_owned`.

---

## 3. BRANCH OWNERSHIP RULES

| Agent | Owns prefix | May read | May NOT push to |
|---|---|---|---|
| Claude Code | `claude/**` | all | `codex/**`, `jules/**`, `main` |
| Codex | `codex/**` | all | `claude/**`, `jules/**`, `main` |
| Jules | `jules/**` | all | others | `main` |
| Cowork | `cowork/**` | all | others | `main` |
| Michael | any | all | — (merge authority) |

Rules:
1. **One agent owns one branch at a time.** No co-writers.
2. Cross-agent collaboration happens through Relay Packets, not shared branches.
3. Branches are short-lived. If a branch is older than 7 days with no commits, it auto-expires (cleanup script in `scripts/`).
4. `main` is write-locked to Michael (or future merge-bot under §5).

---

## 4. EXECUTION CORRIDORS

A corridor is a declared blast radius. Agents pick the **narrowest** corridor that fits the task.

| Corridor | Allowed changes | Auto-mergeable? |
|---|---|---|
| `docs-only` | `*.md`, `docs/**` | yes (if CI green) |
| `js-additive` | new `js/*.js` files, no edits to existing modules | yes |
| `js-modify` | edits to existing `js/*.js` | no — human review |
| `sql-additive` | new files in `sql/`, no edits to deployed migrations | yes |
| `sql-destructive` | edits/drops on existing tables | no — explicit Michael approval |
| `worker` | `worker/**`, `wrangler.toml` | no — Michael approval |
| `infra` | `.github/**`, scripts that touch prod | no — Michael approval |
| `module-registry` | `MODULE_REGISTRY` / `MODULE_MODES.md` / `module_modes.json` | no — Michael approval (high drift risk) |

The corridor is declared in the relay packet AND in the commit trailer:
```
Corridor: js-additive
Relay: REL-2026-05-15-001
```

---

## 5. MERGE AUTHORITY

Tiered authority — start strict, loosen as trust accumulates.

**Tier 0 (today):** All merges to `main` require Michael.

**Tier 1 (after V1 stabilizes):** Auto-merge allowed when ALL hold:
- Corridor in {`docs-only`, `js-additive`, `sql-additive`}
- CI green (`scripts/status.sh` passes)
- Relay packet `completed` and signed
- No file in `files_owned` overlaps an open relay packet from another agent
- Diff size below threshold (e.g. 400 LOC)

**Tier 2 (future):** Autonomous review loop — second agent (different vendor) signs off before auto-merge. See `PARALLEL_EXECUTION_GOVERNANCE.md` §4.

**Always human:** worker, infra, sql-destructive, module-registry, anything touching secrets or auth.

---

## 6. ESCALATION TRIGGERS

An agent MUST stop, write a `human_required: true` packet, and clean-pause if any of these fire:

1. Spec ambiguity with >1 reasonable interpretation
2. A file outside `files_owned` would need to change
3. A dependency would be added or upgraded
4. A test that previously passed now fails and the cause is not in the current diff
5. Two relay packets target overlapping files
6. A secret, credential, or env var would change
7. `BUILD_INTELLIGENCE.md` shows a prior lesson that contradicts the current plan
8. The agent has retried the same operation ≥3 times without progress (loop guard)

Escalation packet sits in `.orchestration/escalations/` and surfaces in the Control Plane dashboard (see `ACCENTOS_DEVELOPMENT_CONTROL_PLANE.md`).

---

## 7. CLEAN PAUSE SEMANTICS

A "clean pause" is a deterministic state any agent can leave the system in, such that any other agent can resume without asking Michael what's going on.

Required artifacts at clean pause:
1. Working tree clean OR all in-progress work committed to a WIP commit with prefix `wip:`
2. `WORK_IN_PROGRESS.md` overwritten with: last step, next step, branch, blockers
3. Relay packet either `completed` or transitioned to `escalated`
4. No orphan background processes
5. Commit pushed to remote
6. Session-end summary appended to `SESSION_LOG.md` (batched per OPERATING RULES)

A clean pause is the ONLY acceptable end state. Crashes or context exhaustion that leave non-clean state trigger a recovery routine on next session start.

---

## 8. VERSIONING

This protocol is V1. Breaking changes bump major version and require Michael sign-off. Additive fields in the relay packet are minor versions and backward-compatible. Agents MUST reject packets whose major version they don't understand.

---

## 9. OPEN QUESTIONS FOR V2

- Cross-repo relays (when AccentOS ecommerce repo splits off)
- Time-bounded delegation tokens (an agent grants another agent temporary write to its branch)
- Reputation / trust score per agent feeding into Tier 1 thresholds
- Rollback packets (declarative "undo this relay")
