# PARALLEL EXECUTION GOVERNANCE
> **Status:** Draft — Session 4 orchestration design
> **Goal:** Allow multiple agents to work concurrently without overlap, collision, or silent overwrite. Default posture: additive and explicit.

---

## 1. PRINCIPLES

1. **Declare before doing.** No work starts without a relay packet that declares files, corridor, and dependencies.
2. **Semantic ownership > file locks.** Agents own intents, not just paths. Two agents touching the same file for orthogonal reasons is the failure mode to prevent.
3. **Additive by default.** New files beat edits. New functions beat in-place rewrites. Edits require a stronger justification.
4. **Fail loud.** Collisions abort. They do not auto-merge, auto-rebase, or "best effort."
5. **Reversibility is a feature.** Every parallel lane must be revertable as a single unit.

---

## 2. PREVENTING OVERLAPPING WORK

### 2.1 The Active Lane Table

A machine-readable registry of in-flight work:
`.orchestration/lanes.json`

```json
{
  "lanes": [
    {
      "lane_id": "LANE-orchestration-design",
      "agent": "claude-code",
      "branch": "claude/orchestration-layer-design-fkUMQ",
      "relay_id": "REL-2026-05-15-001",
      "files_owned": ["AUTONOMOUS_HANDOFF_PROTOCOL_V1.md", "..."],
      "files_readonly": ["MASTER.md", "AI_INTERACTION_MAP.md"],
      "corridor": "docs-only",
      "started_at": "2026-05-15T14:00:00Z",
      "depends_on": [],
      "status": "in_progress"
    }
  ]
}
```

### 2.2 Pre-flight check (mandatory)

Before any agent edits a file, it runs `scripts/lane-check.sh <file>` which:
1. Returns the list of active lanes that own or readonly-reference the file.
2. Exits non-zero if another lane owns it.

Agents MUST refuse to edit a file owned by another active lane. Escalate via relay packet instead.

### 2.3 Lane registration on session start

The auto-execute block registers a new lane (or resumes an existing one) before doing any work. Stop hook deregisters it.

---

## 3. DEPENDENCY DECLARATION

Every relay packet declares `depends_on`. The control plane builds a DAG:

```
LANE-A (worker upgrade)
   ↓
LANE-B (new module that calls worker)
   ↓
LANE-C (docs update for new module)
```

Rules:
- A lane cannot start while any `depends_on` lane is `in_progress` or `escalated`.
- If a dependency is `completed`, the dependent lane MUST rebase on the dependency's merge commit before starting.
- Cycles are rejected at registration time.

---

## 4. SEMANTIC OWNERSHIP

File ownership alone is not enough. Two agents could edit different functions in the same file with different intents and still collide on imports, exports, or assumptions.

**Semantic ownership** is declared as a tuple: `(file, region, intent)` where:
- `region`: function name, exported symbol, line range, or `whole-file`
- `intent`: one of `add-feature`, `fix-bug`, `refactor`, `document`, `delete`

Conflict matrix:

| Existing intent | New intent | Allowed? |
|---|---|---|
| add-feature (different region) | add-feature | yes |
| add-feature (same region) | anything | no |
| refactor (whole-file) | anything | no |
| document | add-feature | yes (with re-doc after merge) |
| delete | anything | no |

`refactor` is the most exclusive intent. Refactors hold the whole file.

---

## 5. BRANCH COLLISION PREVENTION

- Branch names are namespaced per agent (see Handoff Protocol §3) — collision-free by construction.
- Two lanes that own non-overlapping files but share a parent commit can run fully parallel.
- Two lanes that share even one owned file are forbidden; one must wait.
- Merge order is determined by the lane DAG, not by completion time. A "later finisher" can merge first if it has no dependents waiting.

### 5.1 Rebase policy
- Default: lanes do NOT rebase mid-flight. They merge into a target via merge commit so the lane is preserved as a unit (revertibility).
- Exception: a lane whose dependency just merged MUST rebase before continuing.

---

## 6. ADDITIVE EXECUTION SAFETY

Patterns that maximize safety:

| Instead of... | Prefer... |
|---|---|
| Editing `js/module_x.js` | New file `js/module_x_extension.js` + small registration edit |
| Editing existing SQL migration | New migration file |
| Modifying `MODULE_REGISTRY` array in place | Declarative addition via `module_modes.json` patch |
| Rewriting a function | Adding a sibling function, deprecating old one in a follow-up lane |
| Editing prod worker | Deploying a new worker route, cutover after verification |

The relay packet should challenge any non-additive plan: "Why is this not additive?" If no clear answer, refactor the plan.

---

## 7. CONFLICT RESOLUTION

If a collision is detected at commit time (the lane-check missed it):
1. The lane that committed second aborts (does NOT force-push).
2. Its agent writes an escalation packet citing the colliding lane.
3. Human resolves OR the two agents negotiate via relay packets (one yields, one proceeds).
4. The aborted lane resumes by rebasing on the merged work.

No silent merges. No auto-resolve. Conflicts are first-class events.

---

## 8. PARALLELISM LIMITS

Initial soft limits (tune via Control Plane):
- Max 3 concurrent lanes total
- Max 1 concurrent lane per corridor in {`worker`, `module-registry`, `sql-destructive`} — these are serializable
- Max 2 lanes per agent (most agents are single-threaded today; this leaves headroom)
- Lanes idle > 4 hours auto-suspend; idle > 24 hours auto-expire

---

## 9. AUDIT TRAIL

Every lane produces a final record at completion:
`.orchestration/lanes/completed/<lane_id>.json` with: relay_id, branch, merge_sha, duration, files_touched, conflicts_encountered, escalations.

This feeds:
- Control Plane telemetry
- `efficiency-monitor` skill aggregation
- Trust scores for future Tier-1/Tier-2 merge authority decisions
