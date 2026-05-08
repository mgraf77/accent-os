# BUILD HANDOFF — Quarantine community-installed AccentOS skills in an observation-only runtime la

> Generated: 2026-05-08T12:37:17.613Z
> Source slug: `airlock`
> Skill: brainstorm-build-handoff v1.0.0
> Validator: pending — run scripts/validate.js after assembly

---

## Objective

Quarantine community-installed AccentOS skills in an observation-only runtime layer until they have demonstrated safe behavior across enough runs to be promoted to trusted status.

**System category:** `infra`
**Primary executor:** `claude-code`

### Operational goals

- Intercept every file read and write a quarantined skill performs
- Intercept every cross-skill invocation a quarantined skill triggers
- Block external network calls from quarantined skills by default
- Track per-skill run outcomes against a promotion threshold
- Promote a skill to trusted on threshold met or explicit override
- Demote a trusted skill on policy violation or operator command

### Constraints

- Markdown plus JSON plus Node.js standard library only
- Must run on Codespace and on local Claude Code with identical behavior
- No background daemons, no external services, no databases
- Total quarantine overhead per run capped at one extra filesystem read and one extra write

### Non-goals

- Network sandboxing of compiled binaries or user-shell commands
- Multi-tenant quarantine across multiple AccentOS clones
- Cryptographic attestation of skill provenance
- Replacement for community-skill-vet pre-install audit

---

## Scope Boundary

AIRLOCK is shipped when a freshly installed community skill can run, accumulate ledger entries, and be promoted via /airlock promote with no manual code edits to AccentOS itself.

---

## Architecture

### Entities

| name | owns | lifecycle |
|---|---|---|
| QuarantinedSkill | policy.yaml + observation ledger | registered → observed → promoted | demoted | uninstalled |
| PolicyManifest | per-skill allow lists and promotion thresholds | authored once on install → versioned by git commit |
| ObservationLedger | append-only run records per quarantined skill | appended each run → archived on promotion |
| AirlockOperator | promotion + demotion decisions | interactive across sessions |
| AirlockGate | filesystem and router interception logic | loaded at session start, evaluated per skill action |

### Orchestration

| trigger | actor | effect | traces_to_goal |
|---|---|---|---|
| skill installed via skill-forge or repo-scout | AirlockGate | PolicyManifest scaffold created in airlock/<skill>/policy.yaml | Track per-skill run outcomes against a promotion threshold |
| quarantined skill reads a file | AirlockGate | read recorded; allowed if path matches policy.read_paths | Intercept every file read and write a quarantined skill performs |
| quarantined skill writes a file | AirlockGate | write redirected to airlock/<skill>/shadow/ unless path matches policy.write_paths | Intercept every file read and write a quarantined skill performs |
| quarantined skill triggers another skill via vibe-speak | AirlockGate | propagation chain recorded; nested skill inherits caller policy | Intercept every cross-skill invocation a quarantined skill triggers |
| quarantined skill issues an outbound HTTP call | AirlockGate | blocked by default; recorded as policy violation if attempted | Block external network calls from quarantined skills by default |
| run completes without violations | AirlockGate | ObservationLedger.success_count incremented; promotion check runs | Track per-skill run outcomes against a promotion threshold |
| operator runs /airlock promote <skill> | AirlockOperator | policy.status flipped to trusted; ledger archived | Promote a skill to trusted on threshold met or explicit override |
| operator runs /airlock demote <skill> | AirlockOperator | policy.status flipped back to quarantined; observation_window reset | Demote a trusted skill on policy violation or operator command |

### State

| key | shape | owner | persistence |
|---|---|---|---|
| policy.yaml | {status, read_paths[], write_paths[], invoke_skills[], threshold_runs, threshold_clean_streak} | PolicyManifest | git |
| ledger.jsonl | one JSON object per run: {ts, skill, action, target, allowed, violation_kind|null} | ObservationLedger | git |
| shadow/<paths> | redirected file writes mirroring real paths under skill scope | AirlockGate | ephemeral |
| promotion-log.md | human-readable log of promotion + demotion decisions with operator + reason | AirlockOperator | git |

### Governance

| rule | enforced_by | failure_mode |
|---|---|---|
| Every quarantined skill must have a policy.yaml before its first run | AirlockGate session-start check | skill load aborts with policy-missing error |
| Trusted-status flip requires either threshold met or operator command | AirlockOperator promotion path | promotion command rejected with insufficient-evidence error |
| Ledger entries are append-only and never edited | AirlockGate write path | rewrite rejected; new appended entry annotates the prior one |
| Policy violations halt the current run before any observable side effect | AirlockGate per-action check | skill returns violation error, run marked failed in ledger |

### Interop surface

| protocol | consumer | format |
|---|---|---|
| AccentOS skill SDK Read/Write hooks | AirlockGate | Node module exporting interceptors |
| vibe-speak router invocation event | AirlockGate | router emits {caller, callee, args} |
| operator slash commands /airlock * | AirlockOperator | markdown command set in skill router |
| git commit hook | PolicyManifest | pre-commit checks policy.yaml schema |

---

## Implementation Phases

### P1 — Policy schema and scaffold

- **Depends on:** —
- **Outputs:** `policy.schema.json`, `templates/policy.yaml`
- **Validation:** AccentOS git pre-commit hook validates every airlock/<skill>/policy.yaml against policy.schema.json

### P2 — AirlockGate preflight

- **Depends on:** P1
- **Outputs:** `gate.js preflight()`
- **Validation:** session-start integration test loads a fixture skill missing policy and asserts preflight aborts

### P3 — Filesystem interception and ledger

- **Depends on:** P2
- **Outputs:** `gate.js intercept-read`, `gate.js intercept-write`, `ledger.js`
- **Validation:** fixture skill performs read+write; ledger contains expected entries and shadow directory contains redirected writes

### P4 — Router and network hooks

- **Depends on:** P3
- **Outputs:** `gate.js router-hook`, `gate.js network-block`
- **Validation:** fixture skill triggers another skill and attempts an outbound fetch; ledger records propagation chain and network-block violation

### P5 — Operator slash commands

- **Depends on:** P3
- **Outputs:** `operator.js`
- **Validation:** /airlock promote without --reason flag is rejected; with --reason flag flips status and appends promotion-log.md entry

### P6 — Documentation and skill registration

- **Depends on:** P2, P3, P4, P5
- **Outputs:** `skills/airlock/SKILL.md`, `skills/_index.md update`
- **Validation:** AccentOS skill router can resolve airlock by trigger phrase and slash command in a smoke session

### Directory structure

```
skills/airlock/SKILL.md                 # skill contract for AccentOS skill router
skills/airlock/gate.js                  # AirlockGate runtime: preflight, intercept-read, intercept-write, router hook, network block
skills/airlock/ledger.js                # buffered append-only writer for ledger.jsonl
skills/airlock/operator.js              # /airlock status, promote, demote command handlers
skills/airlock/policy.schema.json       # JSON Schema for policy.yaml
skills/airlock/templates/policy.yaml    # scaffold template emitted on skill install
airlock/<quarantined-skill>/policy.yaml # per-skill policy manifest
airlock/<quarantined-skill>/ledger.jsonl# per-skill observation ledger
airlock/<quarantined-skill>/shadow/     # ephemeral redirected writes per run
airlock/promotion-log.md                # human-readable promotion and demotion record
```

### Schemas

| name | owner_phase | format |
|---|---|---|
| policy.yaml | P1 | json-schema |
| ledger.jsonl entry | P3 | json-schema |

---

## Validation Gates

1. **policy schema validity** — applies to `every airlock/<skill>/policy.yaml` — passes if: policy passes JSON Schema validation in git pre-commit hook
2. **ledger append-only invariant** — applies to `ledger.jsonl writer` — passes if: writer rejects non-append modes and is verified by ledger.test.js
3. **preflight blocks orphan skills** — applies to `session start with quarantined skill` — passes if: skill without policy.yaml fails to load and emits policy-missing error
4. **promotion requires reason** — applies to `/airlock promote command` — passes if: command rejects without --reason and writes promotion-log.md entry with reason
5. **AirlockGate version pin** — applies to `AirlockGate hook contract` — passes if: integration test asserts gate.js declared SDK_VERSION matches AccentOS skill SDK version

---

## Operating Rules

- Every quarantined skill runs through AirlockGate.preflight before any other code executes in the session
- policy.yaml is treated as source of truth; runtime state is reconstructed from policy plus ledger on demand
- ledger writes are buffered in memory and flushed once at run end
- compiled policy is cached in memory at session start
- AccentOS-shipped skills are exempt from quarantine and skip AirlockGate hooks
- Promotion mid-run takes effect on the next run; the current run finishes under quarantined policy

---

## Out of Scope

### Deferred (will revisit on trigger)

- **Wildcard support in policy.invoke_skills** — until: operator reports policy authoring overhead exceeds five minutes per skill — _explicit list is sufficient at current skill count_
- **Outbound shell-command sandboxing** — until: any quarantined skill needs to run shell commands — _filesystem and router cover existing skills_
- **Monthly ledger archive rotation** — until: any single skill ledger exceeds 1 MB — _premature at current activity levels_
- **Ledger sha attestation in promotion-log.md** — until: first observed ledger rewrite or rebase incident — _single-operator workflow makes rebase low risk_

### Deleted (will not build)

- **Cryptographic skill-provenance attestation** — _speculation_
- **Multi-tenant quarantine across AccentOS clones** — _scope creep_
- **Background daemon for live observation streaming** — _premature abstraction_

---

## Next Phases

- **Trigger:** any quarantined skill needs to run shell commands — **Scope:** extend AirlockGate with shell-command interceptor and add policy.yaml.shell_allowlist
- **Trigger:** operator reports policy authoring exceeds five minutes per skill — **Scope:** introduce wildcard support and a policy-author wizard
- **Trigger:** any single skill ledger exceeds 1 MB — **Scope:** monthly archive rotation with sha-pinned promotion-log.md cross-references
- **Trigger:** first observed ledger rewrite incident — **Scope:** ledger sha attestation captured at promotion time

---

## Source Artifacts

The artifacts listed below are the canonical source of truth. The executor MAY drill
into any of them for additional detail; this handoff is a deterministic projection
of their contents.

- `artifacts/airlock/01-concept.json`
- `artifacts/airlock/02-systems.json`
- `artifacts/airlock/03-failures.json`
- `artifacts/airlock/04-ralph-pass-1.json`
- `artifacts/airlock/04-ralph-pass-2.json`
- `artifacts/airlock/04-ralph-pass-3.json`
- `artifacts/airlock/05-mvp.json`
- `artifacts/airlock/06-build-plan.json`
- `artifacts/airlock/meta.json`

---

## Architecture decisions surfaced during Ralph passes

### Pass 1 — focus: simplify

**Determinism wins:**
- `promotion threshold`: `after some clean runs` → `threshold_runs and threshold_clean_streak as explicit ints`
- `shadow lifecycle`: `ephemeral` → `per-run, discarded at run end`

**Removed:** `02-systems.entities[shadow-fs as separate entity]`, `02-systems.scaling_axes.interception-surfaces.future_limit.shell`
**Merged:** `promotion auto path` + `promotion manual path` → `AirlockOperator promotion path with auto-trigger flag`
**Renamed:** `AirlockGate session-start check` → `AirlockGate.preflight`; `shadow/<paths>` → `airlock/<skill>/shadow/`
**Open issues carried forward:**
- Cross-skill invocation chain depth 8 cap — verify against real router traces before promotion to v1.1

### Pass 2 — focus: de-risk

**Determinism wins:**
- `policy violation handling`: `halt the run` → `skill returns violation error and run is marked failed in ledger before any side effect`

**Open issues carried forward:**
- Concurrent runs invariant relies on AccentOS single-process — document this dependency explicitly in handoff

### Pass 3 — focus: unify _(converged)_

**Determinism wins:**
- `naming convention`: `mixed snake and space-delimited` → `EntityName.dotted-action across all governance and orchestration entries`

**Renamed:** `ObservationLedger.success_count` → `ledger.clean_streak`; `AirlockGate write path` → `AirlockGate.intercept-write`


---

*End of handoff. Begin building.*
