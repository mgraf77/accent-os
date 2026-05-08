# BUILD HANDOFF — AIRLOCK Skill
Version: 1.0
Status: BUILD_READY
Target Executor: Claude Code
Generated: 2026-05-08

---

# EXECUTION DIRECTIVE

Build a lightweight session validation gate that checks AI handoff integrity at AccentOS session start — 3 built-in rules, filesystem-only, no external dependencies.

---

# OBJECTIVE

AIRLOCK is a session startup validation skill for AccentOS. When Claude Code begins a session, AIRLOCK reads the incoming handoff context (current branch, WORK_IN_PROGRESS.md state, and prompt payload), runs 3 structural validation rules, and produces a PASS/WARN/BLOCK verdict before any build work begins. All handoff events are appended to an audit log. The goal is to catch corrupted, stale, or manipulated handoff context before it propagates into build decisions.

---

# CONSTRAINTS

## Must Use
- Markdown (rule config, audit log, skill files)
- JSON (normalized HandoffPayload schema)
- Node.js (rule engine + validators)
- Filesystem (all state — no database)
- Git CLI (for actual state verification)

## Must Not Use
- External APIs or network calls
- ML-based anomaly detection
- Databases or vector stores
- Web frontend
- Real-time streaming validation

## Scope Boundary

AIRLOCK validates the handoff context at session start. It does not validate ongoing session behavior, API traffic, or post-session state.

---

# ARCHITECTURE

AIRLOCK consists of four components: a **HandoffPayload normalizer** that reads from WORK_IN_PROGRESS.md, session-handoff.md, and git state; a **rule engine** that runs loaded rules against the normalized payload with a 5-second timeout; a **GateDecision** object that aggregates results into PASS/WARN/BLOCK with reasons; and an **audit log** (airlock-log.md) that records each handoff event.

The normalizer produces a 4-field payload: `source`, `claimed_task`, `claimed_branch`, `claimed_wip_status`. Rules operate only on this normalized format. Input adapters handle source-specific parsing.

Three rules ship with MVP:
1. **branch-match** (severity: block) — claimed_branch must equal `git branch --show-current`
2. **wip-coherence** (severity: warn) — claimed_task must not contradict WORK_IN_PROGRESS.md last entry
3. **injection-pattern** (severity: block) — payload strings must not match known prompt injection signatures

## Entities

| Entity | Role | Owns |
|--------|------|------|
| HandoffPayload | Normalized incoming context | source, claimed_task, claimed_branch, claimed_wip_status |
| Validator | Runs rules against payload | rule_registry, validation_results |
| GateDecision | Pass/warn/block verdict | decision, reasons, warnings[] |
| AuditLog | Persistent handoff record | airlock-log.md |

## Key Workflows

**HandoffValidation (session start)**
1. Read WORK_IN_PROGRESS.md, session-handoff.md, git branch
2. Normalize into HandoffPayload
3. Load rules from `airlock-rules.json`
4. Run each rule (max 5s total timeout)
5. Aggregate into GateDecision
6. Append to airlock-log.md (non-blocking)
7. Return GateDecision to session

## State

```
HandoffStatus:
  PENDING → PASS     (all rules pass, no warnings)
  PENDING → WARN     (rules pass, warnings present, or timeout hit)
  PENDING → BLOCK    (any block-severity rule fails)
```

**OPEN ITEM — BLOCK behavior:** When status=BLOCK, what does Claude do?
- Option A: Halt and surface findings to Michael before continuing
- Option B: Continue with BLOCK logged and flagged in session output
- **Default until decided: Option A (safest)**

---

# IMPLEMENTATION ORDER

## Phase 1 — Core Engine

**Entry criteria:** Branch exists, SKILL.md written

**Deliverables:**
- `skills/airlock/SKILL.md`
- `skills/airlock/engine/normalize.js` — HandoffPayload normalizer
- `skills/airlock/engine/runner.js` — rule runner with timeout
- `skills/airlock/engine/gate.js` — GateDecision aggregator
- `skills/airlock/airlock-rules.json` — rule registry (3 built-in rules)

**Exit criteria:**
- `node runner.js` runs against a mock payload without error
- PASS/WARN/BLOCK verdicts produce correct output for test cases
- Timeout is enforced at 5s

---

## Phase 2 — Input Adapters

**Entry criteria:** Phase 1 complete

**Deliverables:**
- `skills/airlock/adapters/git.js` — reads actual branch from git
- `skills/airlock/adapters/wip.js` — parses WORK_IN_PROGRESS.md
- `skills/airlock/adapters/session-handoff.js` — reads session-handoff.md

**Exit criteria:**
- Normalizer produces valid HandoffPayload from live AccentOS session state
- All 3 adapters handle missing files gracefully (file not found → null field, not error)

---

## Phase 3 — Audit Log + Integration

**Entry criteria:** Phase 2 complete

**Deliverables:**
- `skills/airlock/log.js` — append-only airlock-log.md writer
- AccentOS CLAUDE.md updated: AIRLOCK runs in AUTO-EXECUTE step 1 (before skill routing)
- `skills/airlock/examples/test-payload.json` — sample payload for testing

**Exit criteria:**
- Running AIRLOCK at session start produces a logged entry in airlock-log.md
- BLOCK on test payload halts session with clear output
- WARN on test payload continues session with warning in output

---

# VALIDATION GATES

| Gate | Check | Pass Condition |
|------|-------|---------------|
| branch-match | Compare claimed_branch to `git branch --show-current` | Strings match exactly |
| wip-coherence | Compare claimed_task to last WIP entry | No direct contradiction (fuzzy match OK) |
| injection-pattern | Scan payload strings for injection signatures | No matches found |
| timeout enforcement | Run full validation | Completes in ≤5000ms |
| audit write | Check airlock-log.md after run | Entry appended with timestamp, decision, reasons |
| graceful degradation | Run with missing WORK_IN_PROGRESS.md | WARN (not error), log "wip adapter returned null" |

---

# OPERATING RULES

- Never skip AIRLOCK — even if WORK_IN_PROGRESS.md is missing, run with null WIP state
- BLOCK verdict must produce output Michael can read before proceeding
- Audit log is append-only — never overwrite or delete entries
- Rules are loaded from config at runtime — never hardcoded into the runner
- Timeout result is WARN, not BLOCK — a slow system should not halt builds
- Injection pattern signatures live in a separate config file (`injection-patterns.json`) — updatable without touching the engine

---

# OPEN ITEMS

| Item | Impact | Owner |
|------|--------|-------|
| BLOCK behavior | Determines whether session halts or continues with flag | Michael |
| Injection pattern list | Rule 3 ships empty without this | Michael/Claude (can bootstrap from known patterns) |

---

# WHAT NOT TO BUILD

- ML anomaly detection — rule-based is sufficient for MVP
- Real-time streaming validation — session-start gate is the right scope
- Network-level security or firewall — out of scope entirely  
- Slash command (`/airlock check`) — defer to Phase 2 if needed
- Cross-session state store — filesystem append log is sufficient
- Separate flag_log.md — single airlock-log.md with structured entries
- Validation of ongoing session behavior — AIRLOCK is an entry gate, not a monitor

---

# NEXT PHASE

After MVP ships: add the `/airlock check` slash command for on-demand re-validation mid-session, and integrate GateDecision output into the `efficiency-monitor` session summary so WARN/BLOCK events surface in the stop-hook report.
