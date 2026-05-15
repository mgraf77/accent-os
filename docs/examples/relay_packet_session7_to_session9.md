# Example Relay Packet — Session 7 → Session 9

> **Purpose:** Reference example showing a well-formed V1 relay packet.
> **Schema:** `AUTONOMOUS_HANDOFF_PROTOCOL_V1.md` §2.1 · template `docs/RELAY_PACKET_TEMPLATE.md`
> **Live packet:** `.orchestration/relays/2026-05-15T1700__session7__session9__status-wiring.json`
> **Validator:** `scripts/check-relay-packet.sh` (exits 0 against the live packet — see below)

This example is also the **actual** packet authorizing Session 9's status-wiring work. The JSON below is verbatim from the live packet at the path above. Either copy of the JSON is parseable; the canonical artifact lives under `.orchestration/relays/`.

---

## Why this packet exists

Session 7 landed the canon-enforcement scripts as visibility-only checks. Session 9's job is to **wire those checks into operator-visible status output** without introducing any blocking behavior. That handoff is recorded as a relay packet so the work is auditable and the receiver's allowed scope is explicit.

Key properties:
- `from_agent` = `to_agent` = `claude-code` — same agent, different session. Relay packets work for intra-agent / cross-session handoff too, not only cross-vendor.
- `intent = "implement"` — concrete change, not investigation.
- `execution_corridor = "docs-only"` — even though `scripts/status.sh` is shell, the corridor for this packet covers no runtime behavior change. The status script's exit semantics are preserved.
- `files_owned` is a closed list. The receiver MUST NOT edit anything outside it. Worker, Supabase, and runtime JS are explicitly excluded.
- `definition_of_done` is fully checkable — every line is a binary pass/fail observable from the repo.
- `escalation_triggers` includes the most likely scope-creep risks (worker, sql, canonical-file edits without hash refresh).
- `state = "completed"` is set at commit time because this packet IS authoring its own completion. In a normal cross-agent flow, the receiver would transition `open → claimed → in_progress → completed` via `.log.jsonl`.

---

## Packet JSON

```json
{
  "packet_version": "1.0",
  "id": "REL-2026-05-15-007",
  "from_agent": "claude-code",
  "to_agent": "claude-code",
  "intent": "implement",
  "branch": "claude/canon-enforcement-scripts-wp0M4",
  "base_commit": "812ea61fc909c41b81453701864c1772962c05c1",
  "files_owned": [
    "scripts/status.sh",
    ".orchestration/lanes.json",
    ".orchestration/README.md",
    "docs/examples/relay_packet_session7_to_session9.md"
  ],
  "files_readonly": [
    "CANON.md",
    "scripts/check-canon-drift.sh",
    "scripts/check-lane-claims.sh",
    "scripts/check-relay-packet.sh",
    "docs/RELAY_PACKET_TEMPLATE.md",
    "docs/LANE_REGISTRY.md",
    "AUTONOMOUS_HANDOFF_PROTOCOL_V1.md",
    "AGENT_MEMORY_AND_CONTEXT_STRATEGY.md",
    "PARALLEL_EXECUTION_GOVERNANCE.md"
  ],
  "execution_corridor": "docs-only",
  "preconditions": [
    "Session 7 commit 812ea61 is HEAD of claude/canon-enforcement-scripts-wp0M4",
    "scripts/check-canon-drift.sh exits 0 against current tree",
    "scripts/check-lane-claims.sh exits 0 against current tree",
    "scripts/check-relay-packet.sh available for self-validation"
  ],
  "definition_of_done": [
    "scripts/status.sh prints a Governance section listing canon-drift, lane-claims, relay-packet results",
    "scripts/status.sh exit code is unaffected by check failures (report-only)",
    ".orchestration/lanes.json contains the Session-7 seed lane in clean_pause state",
    ".orchestration/README.md documents lane registration, claim semantics, collision visibility, stale policy",
    "docs/examples/relay_packet_session7_to_session9.md exists and references this packet",
    "scripts/check-relay-packet.sh validates this packet successfully",
    "commit pushed to claude/canon-enforcement-scripts-wp0M4"
  ],
  "escalation_triggers": [
    "any change to worker/** or wrangler.toml",
    "any change to sql/** deployed migrations",
    "any change to a canonical file listed in CANON.md §1 without an accompanying hash refresh",
    "scripts/status.sh propagating a non-zero exit from a governance check",
    "spec ambiguity with more than one reasonable interpretation"
  ],
  "context_refs": [
    "CANON.md",
    "AUTONOMOUS_HANDOFF_PROTOCOL_V1.md",
    "PARALLEL_EXECUTION_GOVERNANCE.md",
    "docs/RELAY_PACKET_TEMPLATE.md",
    "docs/LANE_REGISTRY.md"
  ],
  "expires_at": "2026-05-22T00:00:00Z",
  "human_required": false,
  "signature": "claude-code@812ea61fc909c41b81453701864c1772962c05c1"
}
```

---

## Validate this example

```
bash scripts/check-relay-packet.sh .orchestration/relays/2026-05-15T1700__session7__session9__status-wiring.json
```

Or run the full-tree scan (picks up this packet automatically):

```
bash scripts/check-relay-packet.sh
```

Both should report `OK`.
