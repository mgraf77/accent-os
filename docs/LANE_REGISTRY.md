# Lane Registry

> Authoritative spec: `PARALLEL_EXECUTION_GOVERNANCE.md` §2.
> Validator: `scripts/check-lane-claims.sh`.

A **lane** is one unit of in-flight work owned by one agent on one branch. The registry lives at:

```
.orchestration/lanes.json
```

It is the single source of truth for "who is doing what right now." Every agent registers a lane before editing files and deregisters it at clean pause.

---

## File shape

```json
{
  "schema_version": "1.0",
  "lanes": [
    {
      "lane_id": "LANE-canon-enforcement",
      "agent": "claude-code",
      "branch": "claude/canon-enforcement-scripts-wp0M4",
      "relay_id": "REL-2026-05-15-007",
      "files_owned": [
        "CANON.md",
        "scripts/check-canon-drift.sh",
        "scripts/check-lane-claims.sh",
        "scripts/check-relay-packet.sh",
        "docs/RELAY_PACKET_TEMPLATE.md",
        "docs/LANE_REGISTRY.md"
      ],
      "files_readonly": [
        "AUTONOMOUS_HANDOFF_PROTOCOL_V1.md",
        "AGENT_MEMORY_AND_CONTEXT_STRATEGY.md",
        "PARALLEL_EXECUTION_GOVERNANCE.md"
      ],
      "corridor": "docs-only",
      "started_at": "2026-05-15T15:30:00Z",
      "depends_on": [],
      "status": "in_progress"
    }
  ]
}
```

---

## Lane fields

| Field | Required | Notes |
|---|---|---|
| `lane_id` | yes | `LANE-<short-slug>`, unique. |
| `agent` | yes | Owning agent. One agent, one lane at a time, one branch. |
| `branch` | yes | Must match the agent's allowed prefix (protocol §3). |
| `relay_id` | no | The relay packet that authorized this lane. |
| `files_owned` | yes | Non-empty array. Other lanes MUST NOT claim overlap. |
| `files_readonly` | no | Reference set. No edits. |
| `corridor` | yes | Same enum as relay packet `execution_corridor`. |
| `started_at` | yes | ISO-8601 UTC. Used for staleness (default >7d = stale). |
| `depends_on` | no | List of `lane_id` values. Cycles rejected at registration. |
| `status` | yes | `open` \| `claimed` \| `in_progress` \| `completed` \| `escalated` \| `expired`. |

Active = status in `{ open, claimed, in_progress }`.

---

## Lifecycle

```
            register
                │
                ▼
    open ─► claimed ─► in_progress ─► completed
                                 │
                                 ├─► escalated   (requires human_required relay)
                                 └─► expired     (stale-sweep or explicit deregister)
```

- Lanes are registered before the first file edit.
- `status` is updated by the owning agent only.
- Deregistration = transition to `completed` / `escalated` / `expired` at clean pause; the lane stays in the file as an audit record.

---

## Collision rule

If any file appears in `files_owned` of more than one active lane, that is a **collision**. The validator exits non-zero and prints the offending file + lane ids.

The newer lane MUST:
1. Stop editing the contested file.
2. Write an escalation relay packet (`human_required: true`).
3. Wait for resolution.

The older lane keeps the claim by default. This is intentional: it favors completing in-flight work over racing in.

---

## Validation

```
bash scripts/check-lane-claims.sh
```

Reports:
- active lane summary
- file collisions across active lanes  (exit 1 if any)
- stale lanes (> `LANE_STALE_DAYS`, default 7)
- dangling `depends_on` references

The script is read-only. It never edits `lanes.json`.

---

## What this layer does NOT do (Session 7)

- No pre-commit hook yet (visibility-only).
- No automatic lane expiration sweep (manual deregister).
- No semantic-ownership tuple enforcement — that lives in `PARALLEL_EXECUTION_GOVERNANCE.md` §4 and is a later automation lane.
- No DAG execution gate — the script reports dependencies but does not block.

Promotion to enforcement requires Michael sign-off per `OPERATOR_BOTTLENECK_REDUCTION_PLAN.md`.
