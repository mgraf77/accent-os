# Relay Packet Template (V1)

> Authoritative spec: `AUTONOMOUS_HANDOFF_PROTOCOL_V1.md` §2.
> Validator: `scripts/check-relay-packet.sh`.

Every cross-agent handoff produces a Relay Packet committed at:

```
.orchestration/relays/<UTC-timestamp>__<from-agent>__<to-agent>__<short-slug>.json
```

A sibling state-log file `.orchestration/relays/<id>.log.jsonl` records lifecycle transitions (append-only).

---

## Canonical JSON template

Copy, fill in, commit. Field order is illustrative; only structure matters.

```json
{
  "packet_version": "1.0",
  "id": "REL-2026-05-15-001",
  "from_agent": "claude-code",
  "to_agent": "codex",
  "intent": "implement",
  "branch": "claude/your-branch-name",
  "base_commit": "0000000000000000000000000000000000000000",
  "files_owned": [
    "docs/example.md"
  ],
  "files_readonly": [
    "MASTER.md",
    "AI_INTERACTION_MAP.md"
  ],
  "execution_corridor": "docs-only",
  "preconditions": [
    "BUILD_PLAN_CLAUDE.md item M-XX is [ ]"
  ],
  "definition_of_done": [
    "scripts/status.sh passes",
    "scripts/check-canon-drift.sh OK",
    "scripts/check-relay-packet.sh OK",
    "commit pushed to <branch>",
    "this packet transitioned to 'completed'"
  ],
  "escalation_triggers": [
    "any change to wrangler.toml",
    "any new top-level dependency",
    "spec ambiguity with >1 reasonable interpretation"
  ],
  "context_refs": [
    "CANON.md",
    "BUILD_INTELLIGENCE.md"
  ],
  "expires_at": "2026-05-22T00:00:00Z",
  "human_required": false,
  "signature": "<from-agent-id>@<commit-sha>",
  "state": "open"
}
```

---

## Field reference

| Field | Required | Notes |
|---|---|---|
| `packet_version` | yes | Must start with `1.` for this validator. |
| `id` | yes | `REL-YYYY-MM-DD-NNN`, unique per repo. |
| `from_agent` | yes | `claude-code`, `codex`, `jules`, `cowork`, `michael`. |
| `to_agent` | yes | Same vocabulary as `from_agent`. |
| `intent` | yes | One of: `implement`, `review`, `verify`, `refactor`, `investigate`, `document`. |
| `branch` | yes | Owning branch — must match the prefix rules in protocol §3. |
| `base_commit` | yes | SHA the receiver should be at (or rebase to). |
| `files_owned` | yes | Non-empty array. Receiver MAY edit only these. |
| `files_readonly` | no | Reference-only; receiver MUST NOT edit. |
| `execution_corridor` | yes | One of: `docs-only`, `js-additive`, `js-modify`, `sql-additive`, `sql-destructive`, `worker`, `infra`, `module-registry`. |
| `preconditions` | no | Free-form strings the receiver verifies before starting. |
| `definition_of_done` | yes | Non-empty array. Acceptance checklist. |
| `escalation_triggers` | no | Conditions that force `human_required: true`. |
| `context_refs` | no | Minimal set of docs the receiver should read. Keep small — see `AGENT_MEMORY_AND_CONTEXT_STRATEGY.md` §7. |
| `expires_at` | no | ISO-8601 UTC. Expired non-terminal packets are flagged by the validator. |
| `human_required` | no | `true` = escalation, do not auto-act. |
| `signature` | yes | `<agent-id>@<commit-sha>` of the issuer at packet-write time. |
| `state` | no | `open` (default) → `claimed` → `in_progress` → `completed` \| `escalated` \| `expired`. |

---

## Lifecycle (append, never rewrite)

State transitions are appended to `.orchestration/relays/<id>.log.jsonl`. Each line:

```json
{ "ts": "2026-05-15T16:00:00Z", "by": "codex", "from_state": "open", "to_state": "claimed", "note": "starting" }
```

The packet JSON's `state` may be updated by the owning agent at commit time; the `.log.jsonl` is the audit trail.

---

## Refusal rules (mandatory)

A receiving agent MUST refuse the packet (transition to `escalated` with `human_required: true`) when ANY hold:

1. `execution_corridor` is outside its allowed list.
2. `base_commit` is not an ancestor of its working branch.
3. Work would require editing a file outside `files_owned`.
4. A canonical file (CANON.md §1) would change without an accompanying `docs-only` packet authorizing it.
5. The packet is expired and the work has not started.

See `AUTONOMOUS_HANDOFF_PROTOCOL_V1.md` §6 for the full escalation list.

---

## Validation

Run before commit:
```
bash scripts/check-relay-packet.sh
```
Or validate a single packet:
```
bash scripts/check-relay-packet.sh .orchestration/relays/2026-05-15T160000__claude-code__codex__example.json
```
