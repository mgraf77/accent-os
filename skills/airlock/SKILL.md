---
name: airlock
description: >
  Session startup validation gate for AccentOS. Runs at AUTO-EXECUTE step 1k,
  before any build work. Reads session-handoff.md, WORK_IN_PROGRESS.md, and git
  state to produce a HandoffPayload, runs 3 structural validation rules
  (branch-match, wip-coherence, injection-pattern), and emits a PASS/WARN/BLOCK
  verdict. BLOCK halts the session and surfaces findings. WARN continues with
  flagged output. All events are appended to airlock-log.md (append-only).
  Trigger: AUTO-EXECUTE only. No manual invocation in MVP.
---

# AIRLOCK

**Purpose:** Catch corrupted, stale, or manipulated handoff context before it propagates into AccentOS build decisions. Runs as a gate at session start — everything downstream is downstream of this.

---

## How It Works

```
session start
  → adapters read (git branch, WORK_IN_PROGRESS.md, session-handoff.md)
  → normalize → HandoffPayload {source, claimed_task, claimed_branch, claimed_wip_status}
  → rule engine (5s timeout)
      rule 1: branch-match    [severity: block]
      rule 2: wip-coherence   [severity: warn]
      rule 3: injection-pattern [severity: block]
  → GateDecision {decision: PASS|WARN|BLOCK, reasons[], warnings[]}
  → audit log append (non-blocking)
  → output to session
  → exit 0 (PASS/WARN) | exit 1 (BLOCK)
```

---

## Integration

Runs via: `node skills/airlock/engine/runner.js`

Called from: AUTO-EXECUTE step 1k in `.claude/CLAUDE.md`

On **PASS**: continue session normally. Brief "✓ AIRLOCK PASS" line in output.
On **WARN**: surface warnings, continue session. Warnings appear before build work.
On **BLOCK**: surface block reason, halt. Do not proceed with build until Michael reviews.

---

## Rules

Defined in `airlock-rules.json`. Checks implemented in `engine/checks.js`.

| Rule | Severity | What It Checks |
|------|----------|---------------|
| branch-match | block | claimed_branch (from session-handoff.md) == `git branch --show-current` |
| wip-coherence | warn | WORK_IN_PROGRESS.md has no obvious internal contradictions |
| injection-pattern | block | No known injection signatures in payload strings |

Injection signatures: `injection-patterns.json` — editable without touching the engine.

---

## Files

```
skills/airlock/
  SKILL.md
  airlock-rules.json        rule registry
  injection-patterns.json   injection signature list
  log.js                    append-only audit log writer
  adapters/
    git.js                  reads actual branch
    wip.js                  parses WORK_IN_PROGRESS.md
    session-handoff.js      reads session-handoff.md
  engine/
    normalize.js            produces HandoffPayload from adapter outputs
    checks.js               3 check implementations
    gate.js                 aggregates results into GateDecision
    runner.js               entry point — run this
  examples/
    test-payload.json       sample payload for testing
```

---

## Audit Log

Location: `skills/airlock/airlock-log.md`

Format per entry:
```
### [ISO timestamp] — [DECISION]
- source: session-start
- claimed_branch: claude/some-branch
- actual_branch: claude/some-branch
- elapsed: 43ms
- warnings: []
- reasons: []
```

Append-only. Never overwrite.

---

## Operating Rules

- Never skip AIRLOCK — missing files produce WARN, not crash
- Timeout (5s) produces WARN, not BLOCK
- BLOCK is binary — one failing block-severity rule = BLOCK
- Log writes are fire-and-forget (non-blocking via setImmediate)
- Injection patterns live in separate config — update them, not the engine
