---
name: airlock
description: >
  Runtime quarantine layer for community-installed AccentOS skills. Intercepts every file
  read/write, cross-skill invocation, and outbound network call a quarantined skill
  attempts, records observations to an append-only ledger, and manages promotion to
  trusted status via /airlock promote. Use this skill when Michael says: "quarantine
  this skill", "put X in airlock", "/airlock status", "/airlock promote X", "/airlock
  demote X", "check-promote X", "how clean is X", or any phrasing that asks to install,
  observe, promote, or demote a community skill. Distinct from community-skill-vet
  (pre-install audit) and codex-review (code review): AIRLOCK is the runtime policy
  layer that operates after installation.
---

# AIRLOCK

**Purpose:** Quarantine community-installed AccentOS skills until they demonstrate safe
behavior. Observe every action. Promote when thresholds are met. Demote if they misbehave.

---

## Trigger phrases

- `/airlock init <skill>`
- `/airlock status [skill]`
- `/airlock promote <skill> --reason "..."`
- `/airlock demote <skill> --reason "..."`
- `/airlock check-promote <skill>`
- `/airlock validate-ledger <skill>`
- "quarantine this skill"
- "put <skill> in airlock"
- "how clean is <skill>"
- "is <skill> promotion-ready"

---

## Scope

**In scope:**
- Community skills installed via skill-forge or repo-scout.
- File read/write interception through explicit gate calls.
- Cross-skill invocation tracking.
- Outbound HTTP blocking.
- Promotion / demotion lifecycle.

**Out of scope (never in MVP):**
- Network sandboxing of shell commands.
- Multi-tenant quarantine across AccentOS clones.
- Cryptographic provenance.
- Replacement for community-skill-vet pre-install audit.

---

## Execution: how Claude uses AIRLOCK during a quarantined skill run

### Before the skill runs (session start)

1. Load the gate:
   ```js
   const gate = require('/home/user/accent-os/skills/airlock/gate.js');
   ```
2. Call preflight. Abort if not ok:
   ```js
   const { ok, error, trusted } = gate.preflight('<skill-name>');
   if (!ok) { console.error(error); return; }
   ```
3. If `trusted === true` — skip all interception hooks and run normally.

### During the skill run

For every **file read** the skill requests:
```js
const { allowed } = gate.interceptRead('<skill>', filePath);
if (!allowed) { return `[AIRLOCK] read blocked: ${filePath}`; }
```

For every **file write** the skill requests:
```js
const { allowed, shadowPath } = gate.interceptWrite('<skill>', filePath);
if (!allowed) { /* write to shadowPath instead */ }
```

For every **cross-skill invocation**:
```js
const { allowed } = gate.routerHook('<caller-skill>', '<callee-skill>');
if (!allowed) { return `[AIRLOCK] invoke blocked: ${callee}`; }
```

For every **outbound HTTP call**:
```js
const { allowed } = gate.networkBlock('<skill>', url);
if (!allowed) { return `[AIRLOCK] network blocked: ${url}`; }
```

### After the skill run completes

```js
const { outcome, clean_streak } = gate.flushLedger('<skill>', 'clean');
// outcome is 'clean' or 'violated' depending on what was intercepted
```

---

## Operator commands

Run directly or invoke from Claude Code:

```bash
# Scaffold policy.yaml for a newly installed skill
node skills/airlock/operator.js init <skill>

# Show status of all (or one) quarantined skill
node skills/airlock/operator.js status [skill]

# Check if a skill is promotion-eligible (dry run)
node skills/airlock/operator.js check-promote <skill>

# Promote to trusted
node skills/airlock/operator.js promote <skill> --reason "10 clean runs, no violations"

# Demote back to quarantined (e.g., after a misbehavior report)
node skills/airlock/operator.js demote <skill> --reason "violated MASTER.md write policy"

# Verify ledger append-only invariant
node skills/airlock/operator.js validate-ledger <skill>
```

---

## Policy manifest (airlock/<skill>/policy.yaml)

Scaffold with `node skills/airlock/operator.js init <skill>`. Edit before first run:

```yaml
schema_version: "1"
skill: my-skill
status: quarantined
read_paths:
  - skills/my-skill/**
write_paths:
  - skills/my-skill/**
invoke_skills: []
threshold_runs: 10
threshold_clean_streak: 5
```

JSON Schema: `skills/airlock/policy.schema.json`.

---

## Ledger (airlock/<skill>/ledger.jsonl)

Append-only JSONL. One entry per intercepted action plus one `run-end` entry per run.
Never edit manually. Read with:

```js
const ledger = require('/home/user/accent-os/skills/airlock/ledger.js');
const summary = ledger.runSummary('<skill>');
```

---

## Files

```
skills/airlock/
  SKILL.md              this file
  gate.js               AirlockGate: preflight, intercept-*, router, network, flush
  ledger.js             read-only ledger analysis utilities
  operator.js           /airlock slash command handlers + CLI
  policy.schema.json    JSON Schema for policy.yaml
  schemas/
    ledger-entry.schema.json
  templates/
    policy.yaml         scaffold template
  tests/
    ledger.test.js      append-only invariant test

airlock/
  promotion-log.md      human-readable promotion/demotion history
  <skill>/
    policy.yaml         per-skill policy manifest
    ledger.jsonl        append-only observation log
    shadow/             ephemeral redirected writes (per-run, discarded)
```

---

## Governance

| Rule | Enforced by |
|------|-------------|
| Policy must exist before first run | `gate.preflight()` aborts if missing |
| Promotion requires --reason flag | `operator.cmdPromote()` rejects without it |
| Ledger is append-only | `gate.flushLedger()` uses fs.appendFileSync |
| Violations halt run before side effects | Caller checks `allowed` before acting |
| Trusted skills skip all interception | `gate.preflight()` returns `trusted: true` |

---

## Operating rules

- AccentOS-shipped skills skip quarantine.
- policy.yaml is source of truth; runtime state reconstructed from policy + ledger.
- Ledger writes are buffered in memory and flushed once per run-end.
- Policy is cached in memory at session start; call `loadPolicy(skill, { force: true })` to bust.
- Promotion mid-run takes effect on the next run.
- AccentOS is a single-process system; concurrent runs are not expected.

---

## Companion skills

- `community-skill-vet` — run BEFORE installing. AIRLOCK runs AFTER.
- `codex-review` — code review of the skill source. AIRLOCK observes runtime behavior.
- `skill-forge` — builds the skill. AIRLOCK guards its first runs.
- `repo-scout` — evaluates whether to install. Hand off to AIRLOCK on install.
