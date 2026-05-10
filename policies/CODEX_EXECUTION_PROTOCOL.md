# CODEX EXECUTION PROTOCOL — P0 (DESIGN)

> Bounded worker-lane definition for Codex inside the AccentOS / AgentOS topology.
> **Codex is a worker, not an authority.** This document defines the lane, the
> queue, the boundaries, and the rollback expectations.
>
> Status: **P0 — design only.** No Codex tasks are queued or executed by this commit.
> tag: CORE

---

## 0. Bounded Execution Philosophy

Codex earns access to the repo by being **boring and reversible**. The lane is
narrow on purpose:

- One task at a time at P0/P1.
- Task scope is mechanical, not architectural.
- Every output is a PR. Nothing is auto-merged.
- Operator supremacy is preserved at every step.
- Reliability compounds faster than complexity. If a Codex task increases entropy
  more than it removes, reject the result.

Codex is a **delegation surface**, not a peer. Claude (this stabilization layer)
owns canonical state and governance. Codex never reads or writes them.

## 1. Orchestration Topology Positioning

```
                     ┌──────────────────┐
                     │     OPERATOR     │   supreme authority
                     └────────┬─────────┘
                              │
         ┌────────────────────┼─────────────────────┐
         ▼                    ▼                     ▼
 ┌──────────────┐    ┌──────────────┐      ┌──────────────┐
 │   ChatGPT    │    │    CLAUDE    │      │    CODEX     │
 │ (assistant)  │    │ (canonical   │      │ (worker)     │
 │              │    │  runtime +   │      │              │
 │ ideation,    │    │  governance) │      │ bounded      │
 │ relay,       │    │              │      │ task         │
 │ summary      │    │ planning,    │      │ executor     │
 │              │    │ audit,       │      │              │
 │              │    │ governance   │      │ produces PRs │
 │              │    │ serialization│      │ only         │
 └──────────────┘    └──────┬───────┘      └──────┬───────┘
                            │                     │
                            └─────── tasks ───────┘
                                queue (operator-curated)
```

- **Operator** decides what to delegate.
- **Claude** can *propose* Codex tasks via patch plans, but cannot dispatch them.
- **Codex** receives a task spec, executes, returns a PR + DONE/KNOWN/NEXT report.
- **ChatGPT** does not commit code on this repo. It is an assistant, not a worker.

## 2. Allowed Task Classes (the Codex lane)

A task is eligible for Codex if it is **mechanical, scoped, and reversible**.

- **TC-1 — Mechanical refactor.** Rename, extract function, deduplicate, inline,
  reorder. No semantic change.
- **TC-2 — Test authoring against existing code.** Unit tests for existing public
  surfaces. Tests must pass at submit; no fakes that hide defects.
- **TC-3 — Lint / format pass.** Run project formatter + lint, fix violations only.
- **TC-4 — Codemod across many similar sites.** Same transformation applied
  consistently (e.g. log-format change, deprecation rewrite).
- **TC-5 — Boilerplate generation.** Stubs, type definitions, scaffold files
  matching an existing pattern. Operator-named.
- **TC-6 — Documentation extraction.** JSDoc, inline-doc → standalone .md, type
  stub generation. No new prose interpretation.
- **TC-7 — Read-only audit.** Static report (counts, references, dead-code) saved
  as a single file. No code changes in this class.
- **TC-8 — Dependency verification.** Run `npm`/`wrangler` checks; report only.
  No installs, no upgrades.

A task that doesn't cleanly fit one class is **out of lane** — escalate to Claude
Plan-Then-Execute or to operator direct work.

## 3. Forbidden Task Classes (hard refusals)

- **F-1 — Architecture mutation.** New top-level directory, deleted module, dir
  restructure, boundary change.
- **F-2 — Governance / runtime / canonical edits.** Anything under
  `runtime-state/`, `governance/`, `stable-evolution-runtime/`, `policies/`,
  `loops/`, `templates/`, `registers/`, `audits/` (specs), `evolution-memory/`,
  or `STABILIZATION_LAYER.md`.
- **F-3 — Security-sensitive code.** Anything touching `worker/`, secrets, auth,
  proxy headers, API keys (S7 territory).
- **F-4 — Schema / migrations.** `sql/`, database migrations, RLS policies.
- **F-5 — Structural index.html edits.** `index.html` is ~700KB. Mechanical
  refactors inside it are LOW priority; structural reorganization is forbidden.
- **F-6 — Patch plans / governance routing decisions.** Codex does not write
  patch plans, severity ratings, mode transitions, or DER entries.
- **F-7 — LKG / canonical state mutation.** Codex never updates LKG, never
  recheckpoints, never edits CANONICAL_RUNTIME_STATE.
- **F-8 — Cross-task synthesis.** Codex does not "decide what to do next" by
  reading the repo. Tasks come from the queue, fully scoped.
- **F-9 — Recursive spawning.** Codex never invokes Codex. Codex never invokes
  Claude. Codex outputs land in a PR; downstream decisions are operator/Claude.
- **F-10 — Multi-branch operations.** One task = one branch = one PR. No
  cross-branch operations.
- **F-11 — Force operations.** No `--force`, no `--no-verify`, no destructive git.
  S3 territory.
- **F-12 — Long-running daemons / scheduled jobs.** Codex does not introduce
  background processes.

If a task spec implies anything in F-1..F-12, **refuse and report**, do not narrow.

## 4. Mutation Boundaries (file-class table)

| Path | Codex permission |
| --- | --- |
| `js/`, `patch_quote.js`, root `*.js` (non-stabilization) | TC-1..TC-3 ALLOWED with PR |
| `index.html` (mechanical edits inside existing functions) | TC-1..TC-3 ALLOWED, ≤100 LoC/PR |
| `index.html` (structural reorganization) | FORBIDDEN |
| `worker/` | FORBIDDEN (S7) |
| `sql/`, schema files | FORBIDDEN (F-4) |
| `wrangler.toml`, `module_modes.json` | FORBIDDEN |
| Anything under `runtime-state/`, `governance/`, `stable-evolution-runtime/`, `policies/`, `loops/`, `templates/`, `registers/`, `audits/` (specs), `evolution-memory/`, `STABILIZATION_LAYER.md` | FORBIDDEN (F-2) |
| `BUILD_PLAN_*`, `MASTER.md`, `BUILD_INTELLIGENCE.md`, `KPI_CATALOG.md`, `WORK_IN_PROGRESS.md`, `SESSION_LOG.md`, `PROMPT_LOG.md`, `PROMPT_QUEUE.md`, `MODULE_MODES.md`, `README.md` | FORBIDDEN unless task is TC-7 read-only audit reporting *to* a separate file |
| `.claude/` | FORBIDDEN |
| `skills/` | FORBIDDEN at P0/P1 (universal-tagged; reserved for operator/Claude) |
| Files generated *by* the Codex task itself (e.g. new test files in a permitted dir) | ALLOWED if the task spec lists them |

Per-PR LoC cap (P0/P1): **≤ 200 LoC net added**, **≤ 400 LoC moved**. Above
that → split the task or reject.

## 5. Branch Ownership Rules

- Codex branches: `codex/<task-id>-<short-slug>` (e.g. `codex/cx-0001-rename-getCwd`).
- Codex **never** commits to:
  - `main`
  - any `claude/*` branch (Claude-owned)
  - any branch named `wip/*`, `feat/*`, `fix/*` opened by operator
- Branch lifecycle:
  1. Operator (or Claude via patch plan) creates the task spec.
  2. Codex creates the branch, commits, opens PR.
  3. Human review required.
  4. Operator merges or closes. Branch is deleted on merge.
- Stale Codex branch (>14 days, no merge): auto-flagged for deletion at next
  cycle review. Codex never deletes its own branches.

## 6. Execution Queue Semantics

A **Codex Task Queue** is a single append-only file (created at P1 — see §16):

`evolution-memory/CODEX_TASK_QUEUE.md`

Each entry contains:

```
id:             cx-XXXX
title:          <one line>
class:          <TC-1..TC-8>
spec:           <pointer to a task-spec file: audits/codex-tasks/cx-XXXX.md>
files_in_scope: <explicit list>
files_out_of_scope: <explicit list>
loc_cap:        <number, ≤200/400 per §4>
created_by:     <operator | claude (patch-plan id)>
created_at:     <ISO date>
status:         queued | running | submitted | merged | rejected | abandoned
branch:         codex/cx-XXXX-<slug>
pr:             <url when opened>
```

Status transitions: `queued → running → submitted → (merged|rejected|abandoned)`.
No skipping. Each transition is appended to `audits/AUDIT_LOG.md`.

## 7. Task Intake Protocol

A Codex task spec is required before queueing. Spec lives at
`audits/codex-tasks/cx-XXXX.md` and contains:

```
1. Goal           — one sentence.
2. Class          — TC-1..TC-8.
3. Inputs         — explicit file list (relative paths).
4. Outputs        — files to create/modify (explicit, exhaustive).
5. Out of scope   — explicit "do not touch" list.
6. Verification   — single command + expected output OR PR-level checklist.
7. Reversibility  — `git revert <merge-sha>` (default) plus any
                    deploy/secrets caveats.
8. LoC cap        — ≤ 200 net / ≤ 400 moved.
9. Deadline       — calendar date (queue ages out otherwise).
10. Operator ack  — yes/no (must be `yes` before status: queued).
```

A task without all ten fields stays in `draft` and is **not queued**.

## 8. DONE / KNOWN / NEXT Reporting Standard

Every Codex submission ends with a single block in the PR description:

```
DONE
  - <fact 1>            (commit:<sha>)
  - <fact 2>            (commit:<sha>)
  - tests:               <count> added / <count> updated / 0 removed
  - loc:                 +<n> / -<m>

KNOWN
  - <gotcha or caveat>   (file:line if relevant)
  - <unresolved item>    (defer to operator)
  - <assumption made>    (state explicitly)

NEXT
  - <recommended human follow-up step, if any>
  - <NEVER auto-executable; always for human approval>
```

Required properties:
- DONE = facts only, with commit refs.
- KNOWN = honest disclosure; missing KNOWN section ⇒ PR rejected.
- NEXT = suggestions, not commitments. Cannot reference further Codex tasks
  except by saying "operator may queue cx-XXXX if desired."

## 9. Runtime-State Interaction Rules

Codex does **not**:
- read `runtime-state/*` to make decisions
- write to `runtime-state/*`
- update `LAST_KNOWN_GOOD_STATE.md`
- modify `RUNTIME_DELTA_REPORT.md`
- modify `CANONICAL_RUNTIME_STATE.md`
- promote / demote DER entries

When a Codex PR is merged, **Claude** (or operator) is responsible for appending a
`RUNTIME_DELTA_REPORT.md` entry under the next checkpoint, recording:
- the merged PR id and SHA
- the Codex task id (cx-XXXX)
- any KNOWN items that warrant follow-up

Codex may *be told* its task came from a particular DER id (for traceability),
but it does not write back to DER.

## 10. Escalation Requirements

Codex escalates by **failing the task and writing a clear refusal** in DONE/KNOWN/NEXT,
not by trying alternative approaches.

Triggers for escalation:
- **CE-1** Spec implies a forbidden task class (F-1..F-12) → refuse, do not narrow.
- **CE-2** Task scope expands during execution (e.g. tests reveal a bug requiring a
  fix outside the spec) → submit partial work or close branch; report in KNOWN.
- **CE-3** LoC cap would be exceeded → stop at cap, submit partial, request split.
- **CE-4** Verification step fails after best-effort → submit failing branch with
  diagnostics; do not force-fix.
- **CE-5** Conflict with another in-flight branch → abandon; report.
- **CE-6** Discovery of security-sensitive surface (S7) → refuse and escalate.

Escalations land in `audits/AUDIT_LOG.md` as `kind:escalation` entries with
`refs: cx-XXXX` and trigger `CE-#`.

## 11. Rollback Expectations

- Default rollback: `git revert <merge-commit>`.
- Codex's PRs must be revert-clean. A PR that combines logically distinct changes
  is rejected.
- If a Codex change touches a file with deploy implications (none allowed at P0/P1
  per §4), the spec must include the redeploy procedure. Otherwise this is moot.
- A Codex task that lands and is later reverted: the task id is **not reused**;
  a new id is created if a fix is desired.

## 12. Clean Pause Expectations

When the runtime enters Clean Pause Stabilization mode (per `policies/MODES.md`):
- All Codex tasks transition `running → abandoned` if they cannot complete within
  the pause window.
- No new Codex tasks are queued during Clean Pause.
- Codex queue is reviewed at pause: stale items archived, in-flight items closed
  or carried over with explicit operator ack.

## 13. Parallel Execution Constraints

- **P0:** 0 concurrent (design only — no Codex runs).
- **P1:** 1 concurrent (one task at a time).
- **P2:** 1 concurrent. Goal of P2 is to validate the protocol, not parallelism.
- **P3:** up to 2 concurrent, with hard rule: no two tasks may touch overlapping
  files (verified by spec `files_in_scope` set intersection).
- **P4:** up to 4 concurrent, same overlap rule. **Hard ceiling.** Beyond 4 is a
  governance change requiring operator + Plan-Then-Execute mode.

Concurrency cap is independent of cost. A higher cap is not a cost optimization —
it is a coordination risk. Increase only when the protocol has run cleanly for
two cycles at the prior cap.

## 14. Anti-Chaos Protections

- **AC-1 One PR per task.** Multi-task PRs are rejected.
- **AC-2 Spec freeze.** A queued task's spec cannot be edited mid-execution. To
  change scope, abandon and re-queue.
- **AC-3 No self-modification.** Codex cannot edit
  `policies/CODEX_EXECUTION_PROTOCOL.md`, the queue file, or task specs once
  queued.
- **AC-4 No queue-jumping.** Codex picks the next queued task in FIFO order at the
  point of dispatch.
- **AC-5 No spawning.** Codex does not launch agents, subprocesses beyond the
  sandbox's normal tooling, or follow-up tasks.
- **AC-6 No external network mutation.** Codex may read remote dependencies for
  build/test, but does not call third-party APIs that mutate state, post
  comments, or alter external resources.
- **AC-7 Honest failure.** A failed task is submitted as a failed PR with full
  diagnostics, never silently retried.
- **AC-8 Idempotency check.** Re-running the same task spec on a clean tree must
  produce a byte-identical (or trivially-equivalent) PR.

## 15. Human Approval Boundaries

Operator approval is **mandatory** at:
- Task spec creation (operator ack field in §7).
- Queueing (operator transitions `draft → queued`).
- PR merge.
- Concurrency cap increases (P-phase boundaries §13).
- Any addition or change to this protocol (C5 governance edit per
  `governance/MUTATION_POLICY.md`).

Operator approval is **not required** for:
- Codex refusing a task (escalation flow in §10).
- Codex submitting a failed PR with diagnostics.
- Reading the queue and task specs.

## 16. Phased Rollout

### P0 — Design (this commit)
- Document the protocol (this file).
- No queue file, no task specs, no Codex execution.
- Update CANONICAL_RUNTIME_STATE to note the lane is `design-only`.
- **Gate to P1:** operator review of this protocol.

### P1 — First Bounded Pilot
- Create `evolution-memory/CODEX_TASK_QUEUE.md` (empty queue).
- Create `audits/codex-tasks/` directory.
- Operator selects ONE task — TC-3 (lint pass) or TC-7 (read-only audit) preferred.
- Codex executes; PR opened; operator reviews + merges or closes.
- **Gate to P2:** one merged PR + zero escalations during pilot.

### P2 — Routine Use, Single Concurrency
- 5+ tasks executed under the protocol.
- Refine task spec template based on what worked / didn't.
- Track latency, cost, defect rate per task.
- **Gate to P3:** two consecutive cycles with no CE-1/CE-6 escalations.

### P3 — Bounded Parallelism
- Up to 2 concurrent tasks; non-overlapping `files_in_scope`.
- Add automated overlap-check at queue-pick time.
- **Gate to P4:** two cycles at P3 with zero collision events.

### P4 — Stable Multi-Worker Lane
- Up to 4 concurrent tasks.
- Quarterly protocol review.
- Beyond P4 is a governance change — see §15.

## 17. Future Swarm Evolution Constraints

If, at some indefinite future time, multi-Codex coordination is desired:

- **Hard cap of 4 workers** stays unless operator + a Plan-Then-Execute C6 patch
  raises it. No autonomous expansion.
- **No worker is ever a coordinator.** Coordination remains operator + Claude.
- **No worker spawns another.** F-9 is permanent.
- **No shared mutable state between workers.** Workers communicate only through
  the queue + audit log, both human-readable.
- **Governance authority is non-distributable.** It stays with Claude /
  stabilization layer. A worker can never edit governance, modes, metrics, or
  canonical state.
- **Telemetry surface is bounded.** Per-worker outputs land in
  `audits/AUDIT_LOG.md` as structured entries, not in a separate observability
  stack.

The **Evolution Governance Runtime (EGR, der-0003)** is the eventual home for
multi-deployment swarm semantics. AccentOS does not adopt EGR-shaped patterns
prematurely.

## 18. What NOT to Automate Yet

At P0/P1 (and conservatively beyond), do **not** automate:

- Codex auto-pickup of tasks from DER. Operator promotes manually.
- Codex auto-merging PRs. Always human review.
- Codex modifying its own queue or task spec.
- Codex chaining tasks without operator approval between.
- Codex writing patch plans, severity ratings, or escalation entries.
- Codex updating canonical state, LKG, or delta reports.
- Codex deciding which TC class a task belongs to. Spec declares it.
- Codex generating its own reading of the repo to "find work to do."
- Cross-deployment Codex coordination. AccentOS is the only deployment now.

## 19. Cost / Risk / Latency Tradeoffs

Three available tools; pick by task shape, not preference.

```
                ChatGPT             Claude (this layer)        Codex
Cost            low/turn            higher/turn                medium/task
Latency         ~seconds            seconds-to-minute          minutes-to-hour
Concurrency     1 (chat)            1-few (parallel sessions)  1-N parallel tasks
Context         conversation        deep code + governance     task-scoped sandbox
Code execution  none integrated     integrated (this CLI)      integrated, isolated
Persistence    session              repo-aware, branched       PR-shaped
Best for        ideation, relay,    planning, audit,           mechanical refactors,
                summarization,      governance, reasoning,     codemods, lint,
                copy-paste flows    state mutation             test authoring,
                                                               read-only audits
Worst for       repo-wide changes   massive parallel chores    architecture,
                                                               governance, planning
Cost-of-error   low (you re-ask)    medium (revert commit)     medium (revert PR)
Risk profile    low: produces text  medium: writes code under  medium: bounded by
                                    governance                 spec + PR review
```

**Routing heuristic** (what to use for what):

- Need a *decision*? → operator or Claude.
- Need a *plan*? → Claude (Plan-Then-Execute mode).
- Need a *governed mutation*? → Claude.
- Need a *mechanical change* with clear scope? → Codex (TC-1..TC-6).
- Need a *read-only report*? → Codex (TC-7) or Claude.
- Need to *brainstorm*? → ChatGPT (cheap, conversational).
- On *mobile only*? → ChatGPT for ideation, Claude (this layer) only for relay
  outputs (Mobile Handoff Mode).

**Anti-pattern: tool laundering.** Do not use ChatGPT to "draft" a Codex task in
order to bypass operator ack. Specs must originate from operator or from Claude
patch plans. Provenance is recorded in the queue's `created_by` field.

## 20. Governance Compatibility

This protocol is a C5 governance file. It is bound by:
- `governance/MUTATION_POLICY.md` — any change to this file is C5.
- `governance/SAFETY_HARD_STOPS.md` — F-3 / F-4 / F-7 alignments are hard stops.
- `governance/ESCALATION_POLICY.md` — Codex escalations land as E-equivalent
  entries (CE-1..CE-6 here, E5 in the broader runtime if a hard-stop is hit).
- `policies/MODES.md` — Codex does not have a mode. It executes inside whatever
  mode the operator/Claude is in. Most commonly, Plan-Then-Execute.

This protocol does **not** create a new mode, a new register, a new metric, or a
new governance file. It defines a worker lane within existing governance.

## 21. Architectural Tagging

- This file: `tag: CORE`. The Codex lane is universal substrate, not a deployment
  artifact. AccentOS is the first deployment to use it; the protocol is intended
  to lift cleanly into AgentOS Core.
- Future task specs (`audits/codex-tasks/cx-XXXX.md`): `tag: DEPLOYMENT` (and
  often `BUSINESS_SPECIFIC` when targeting Accent Roofing modules).
- Future queue file (`evolution-memory/CODEX_TASK_QUEUE.md`): `tag: CORE`.

## 22. P0 Status

- Codex execution lane: **design-only**.
- Active Codex tasks: **0**.
- Queue file: not yet created.
- Concurrency cap: 0.
- Next action (operator): review this protocol; if accepted, schedule a P1
  pilot — preferred shape is one TC-3 or TC-7 task on a non-business-critical
  surface.
