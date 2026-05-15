# `.orchestration/` — Cross-Agent Coordination Layer

This directory is the operational substrate for AccentOS's multi-agent orchestration. It carries the **machine-readable** state that humans and agents both read: who is working on what, what handoffs are pending, and which decisions are settled.

The directory is **additive**. Files are append-mostly. Nothing here is auto-deleted by tooling.

| Path | Purpose | Spec |
|---|---|---|
| `lanes.json` | Active and historical lane registry | `PARALLEL_EXECUTION_GOVERNANCE.md` §2 · `docs/LANE_REGISTRY.md` |
| `relays/*.json` | Cross-agent relay packets | `AUTONOMOUS_HANDOFF_PROTOCOL_V1.md` §2 · `docs/RELAY_PACKET_TEMPLATE.md` |
| `relays/<id>.log.jsonl` | Lifecycle audit trail per packet | Handoff §2.2 |
| `decisions/ADR-NNNN-*.md` | Architectural decision records | `AGENT_MEMORY_AND_CONTEXT_STRATEGY.md` §5 |
| `escalations/*.json` | Human-required packets that fired an escalation trigger | Handoff §6 |
| `checkpoints/<branch>.json` | Mid-session recovery snapshots | Memory strategy §4.3 |

Validators (visibility-only, Session 7):
- `scripts/check-canon-drift.sh`
- `scripts/check-lane-claims.sh`
- `scripts/check-relay-packet.sh`

All three are wired into `scripts/status.sh` (Session 9). Failures **report** but do not block.

---

## 1. Lane registration

A **lane** is one unit of in-flight work: one agent, one branch, one set of owned files, one corridor.

### Register a lane
Before editing any file, the agent appends an entry to `lanes.json`:

```json
{
  "lane_id": "LANE-<short-slug>",
  "session": "session-N",
  "agent": "claude-code",
  "branch": "claude/<branch>",
  "relay_id": "REL-YYYY-MM-DD-NNN",
  "files_owned": ["..."],
  "files_readonly": ["..."],
  "corridor": "docs-only",
  "started_at": "YYYY-MM-DDTHH:MM:SSZ",
  "depends_on": [],
  "status": "in_progress"
}
```

Rules:
- `lane_id` is unique. Never reuse.
- One agent may hold at most one **active** lane at a time. Active = `status` in `{ open, claimed, in_progress }`.
- `branch` must match the agent's allowed prefix (Handoff §3).
- `depends_on` must reference existing `lane_id` values. Cycles are rejected.
- `corridor` uses the same enum as relay packets (Handoff §4).

### Deregister at clean pause
At the end of work, the owning agent updates the lane's `status` to one of the terminal values and adds an `ended_at` timestamp:

| Terminal status | Meaning |
|---|---|
| `completed` | Work landed, packet (if any) signed off, branch ready for merge review. |
| `clean_pause` | Work paused mid-feature with all clean-pause artifacts in place. Resumeable. |
| `escalated` | Hit an escalation trigger; human action required before resume. |
| `expired` | Timed out (>7d inactive by default) — must be re-confirmed to resume. |

Terminal lanes stay in `lanes.json` as an audit record; the validator ignores them for collision checks.

---

## 2. Claim semantics

`files_owned` is a **claim** on edit rights. While a lane is active:

- Only that lane's agent may edit those files.
- Any other agent that needs to edit one of those files MUST escalate via a relay packet (`human_required: true`).
- `files_readonly` is a reference declaration — those files may be read freely but never edited by this lane.

The claim is **semantic-by-file** in V1. File-region semantic ownership (the `(file, region, intent)` tuple in `PARALLEL_EXECUTION_GOVERNANCE.md` §4) is a later automation lane.

---

## 3. Collision visibility

`scripts/check-lane-claims.sh` enforces the claim **by report, not by block**:

- Scans all active lanes.
- If any file appears in `files_owned` of more than one active lane → exits non-zero with the conflicting `lane_id`s.
- Surfaces in `scripts/status.sh` output.

The newer lane is expected to back off and escalate. The older lane retains the claim — this favors completing in-flight work over racing in.

There is **no pre-commit hook, no CI gate, and no auto-rebase** in this layer. Promotion to blocking enforcement requires Michael sign-off (see `OPERATOR_BOTTLENECK_REDUCTION_PLAN.md`).

---

## 4. Stale lane policy

A lane is **stale** if its `started_at` is older than `LANE_STALE_DAYS` (default 7) and its `status` is still active.

When a stale lane is detected:
1. The owning agent (next time it boots) must either:
   - Resume the lane and refresh `started_at` (treat as a checkpoint), or
   - Transition the lane to `clean_pause` / `completed` / `escalated` / `expired`.
2. No other agent should claim files from a stale lane silently. The stale lane's claim still stands; only its owner may release it.
3. If the owning agent is unreachable (e.g. a vendor outage longer than the staleness window), Michael may force-expire the lane.

Override per-run: `LANE_STALE_DAYS=14 bash scripts/check-lane-claims.sh`.

---

## 5. What this directory does NOT do (yet)

- No automatic lane registration on session start (agents register manually).
- No automatic stale-sweep (manual transition only).
- No DAG execution gate (script reports `depends_on`, doesn't block).
- No relay-packet auto-issuance (humans/agents author them by hand from `docs/RELAY_PACKET_TEMPLATE.md`).
- No `forbidden.json` enforcement (designed in `AGENT_MEMORY_AND_CONTEXT_STRATEGY.md` §6.4, not yet implemented).

Each of these is a candidate for a future lane. All require visibility data from this layer first — which is exactly what Sessions 7 and 9 establish.
