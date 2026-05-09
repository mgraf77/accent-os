# ACCENTOS_AGENT_AUTONOMY_RULES.md — Autonomous Agent Governance

| Field | Value |
|---|---|
| Status | **DESIGN — not yet operational** |
| Authority | Planning artifact only. No automation described here is active. Rules become operational when explicitly activated by Michael in `BUILD_PLAN_MICHAEL.md`. |
| Owner | Michael Graf (authority) / Claude (implementation) |
| Last Updated | 2026-05-09 |
| Related | `GOVERNANCE_RISKS.md`, `STABILIZATION_PROTOCOL.md`, `BUILD_PLAN_CLAUDE.md`, `docs/design/ACCENTOS_PROGRESSIVE_SHELL_ROLLOUT.md` |
| Supersedes | None |

---

## 1. PHILOSOPHY

### Why autonomous agents?

Michael is one person running a lighting distribution business AND building an internal platform simultaneously. Every minute spent narrating prompts to Claude is a minute not spent on customers, vendors, or product decisions. The goal is not automation for its own sake — it is **freeing Michael's cognitive bandwidth for decisions only he can make**.

Autonomous agents are useful exactly where:
1. The task is well-scoped and the output is verifiable.
2. The risk of an incorrect action is bounded and reversible.
3. The bottleneck is execution throughput, not judgment.

### The cost of autonomy vs the cost of Michael's time

| Cost of Autonomy | Cost of Michael's Time |
|---|---|
| Incorrect output requires cleanup | Correct output delayed costs revenue |
| Runaway agent touches wrong files | Michael blocked on a prompt costs focus |
| Token bill from inefficient agent | Opportunity cost of manual narration |
| Cascade failure from unchecked sub-spawn | Cognitive overhead of tracking N sessions |

The target: autonomous execution where Michael's time is more expensive than the autonomy risk. Conservative defaults everywhere else.

### The trust model

Autonomy is earned incrementally:
1. Claude demonstrates rollback-safe behavior at the current AML level.
2. A new action class is proposed, documented here, and approved by Michael.
3. The approved class activates — not before.

There is no implicit trust escalation. Completing 100 successful doc-write sessions does not automatically authorize code commits. Each tier requires explicit authorization.

### The governance invariant

> **Autonomy ceiling = rollback safety of the action.**

An action is rollback-safe if it can be fully undone in under 10 minutes without data loss, production downtime, or Michael's physical presence. This invariant is not negotiable — no efficiency argument overrides it.

| Rollback-Safe | Not Rollback-Safe |
|---|---|
| Editing a `.md` file | Running a `DROP TABLE` migration |
| Writing to `ui/` prototype | Deploying to Cloudflare Pages |
| Committing to a feature branch | Merging to `main` |
| Adding a `js/` module file | Modifying `worker/anthropic-proxy.js` |

---

## 2. AUTOMATION MATURITY LEVELS (AML 0–5)

| AML | Name | Description | Who Executes | Who Reviews |
|---|---|---|---|---|
| **0** | Manual Only | Michael types every prompt. Claude executes one task per session, no sub-agents. | Claude | Michael (synchronous) |
| **1** | Prompt Templates | Michael selects from a pre-approved prompt menu. Claude executes the selected template. | Claude | Michael (selects before run) |
| **2** | Supervised Agents | Claude spawns sub-agents within a session. Michael reviews output before any commit is made. | Claude + sub-agents | Michael (output gate) |
| **3** | Approved Automation | Claude spawns + commits autonomously for pre-approved action classes (defined in Section 4). Non-approved actions still require Michael gate. | Claude + sub-agents | Automatic (pre-approved class check) |
| **4** | Dynamic Routing | Hub classifies incoming prompts and routes to the correct branch/agent automatically. No Michael routing overhead. | Hub → Claude agents | Michael (exception only) |
| **5** | Full Orchestration | Hub spawns, routes, merges, and deploys autonomously within defined boundaries. Michael handles escalations only. | Hub → agent mesh | Michael (escalation only) |

### Current state: **AML 2**

Sub-agents can be spawned within a session. All commits require Michael's implicit or explicit approval via session review.

### Target state

| Work Type | Target AML |
|---|---|
| Doc / planning writes | AML 3 (autonomous, no Michael gate per commit) |
| Prototype writes (`ui/`) | AML 3 (autonomous, boot-smoke gate required) |
| Code changes to `js/` | AML 2 (Claude proposes, Michael reviews) |
| Any `index.html` edit | AML 2 (Claude proposes, Michael explicitly approves) |
| Production changes | AML 0 (Michael hand-action, non-delegatable) |

---

## 3. SPAWNED AGENT AUTHORITY CEILINGS

Each agent type has a hard ceiling on what it may touch. Ceilings are defined per task type, not per session. An agent operating outside its ceiling must stop and escalate.

| Agent Type | May Read | May Write | May Commit | Max Depth |
|---|---|---|---|---|
| **Research agent** | Any file, any branch | Nothing | Never | Unlimited |
| **Doc-writer agent** | Any file | `docs/` only — no `src/`, `js/`, `ui/`, `sql/` | Yes (docs/ only) | 1 (no sub-spawn) |
| **Prototype agent** | `ui/`, `docs/`, `CLAUDE.md` | `ui/` only — no `index.html`, `worker/`, `sql/` | Yes (after boot-smoke pass) | 1 (no sub-spawn) |
| **Sub-feature agent** | Assigned files per parallel work rules | Assigned files only — no cross-boundary writes | Yes (assigned files only) | 1 (no sub-spawn) |
| **Production agent** | — | — | — | **Not yet authorized** |

### Sub-spawning rule

**Spawned agents cannot spawn further agents.** Hub → Agent is the maximum chain length. Agent → Agent spawning is a cascade violation and must never occur regardless of task scope or efficiency argument. See Section 8 (anti-chaos rules).

---

## 4. APPROVAL-GATED ACTION CLASSES

| Action | Approval Required | Notes |
|---|---|---|
| Write to `docs/` | **None — autonomous** | Boot-smoke not required for doc-only changes |
| Write to `ui/` prototype | **None — autonomous** | Boot-smoke pass required before commit |
| Write to `js/[module].js` | **Hub authorization** | Hub validates against MODULE_OWNERSHIP_MAP before spawn |
| Modify `index.html` | **Michael authorization + Phase B gate** | Phase gate must be open; > 50-line edits require explicit session approval |
| Push to `main` | **Michael authorization** | Never automated |
| Deploy to Cloudflare Pages | **Michael hand-action** | Not automatable at any AML level currently |
| Run SQL migrations (any M##) | **Michael only** | Non-delegatable; no exception |
| Add npm / wrangler packages | **Michael only** | Non-delegatable |
| Change `wrangler.toml` | **Michael only** | GATE-01 hard stop |
| Delete or rename any file | **Michael authorization** | Irreversible; always requires explicit approval |
| Add new Supabase table | **Michael only** | Requires schema review + migration file |
| Modify `worker/anthropic-proxy.js` | **Michael only** | GATE-01 hard stop |

---

## 5. COST THROTTLING PHILOSOPHY

### Token budget tiers

| Session Type | Complexity | Token Ceiling | Notes |
|---|---|---|---|
| Research / planning | Low | 20K output tokens | Read-heavy, write-light |
| Doc writing | Low-Medium | 30K output tokens | Write-heavy but bounded |
| Prototype iteration | Medium | 50K output tokens | UI + CSS + JS cycles |
| Feature implementation | High | 80K output tokens | Code + tests + doc updates |
| Multi-agent session | Very High | 120K output tokens | Pause for review at ceiling |

### ROI-ramp philosophy

Cheapest path first. Escalate only if the cheap path demonstrably fails.

```
1. Read existing code → can it be reused? (0 cost)
2. Adapt existing pattern → copy-rename from closest sibling (minimal cost)
3. Write custom implementation → only if 1 and 2 are ruled out
4. External library → only for infrastructure (auth, storage); never for business logic
```

### Off-the-shelf vs custom thresholds

- **Prefer off-the-shelf for:** auth flows, file storage, deployment infrastructure, date/time formatting, CSV parsing.
- **Prefer custom for:** business logic (pricing rules, vendor scoring, role visibility), AccentOS-specific data shapes, anything that will be modified frequently.

Reason: off-the-shelf infrastructure is maintained externally; custom business logic stays readable and diff-able without library upgrade churn.

### Model selection by task

| Task | Model | Rationale |
|---|---|---|
| File search, pattern matching, grep assistance | Haiku | Low reasoning requirement, high throughput |
| Doc writing, planning, risk analysis | Sonnet | Balanced reasoning + context window |
| Complex architecture decisions, multi-file refactors | Sonnet | Preferred; Opus only if Sonnet fails |
| Security review, governance decisions | Sonnet | Sufficient; escalate to Opus only for final review |
| Sub-agent spawns (research) | Haiku | Cost control; research agents need breadth not depth |
| Sub-agent spawns (implementation) | Sonnet | Accuracy matters more than cost per token |

**Opus usage:** reserve for decisions that are irreversible or have multi-month downstream consequences. Do not use Opus for tasks where Sonnet's accuracy is adequate. Cost delta is 5-15×.

### Batch doc updates (extended from CLAUDE.md)

Doc-only edits (SESSION_LOG, BUILD_PLAN check-offs, MASTER.md updates, BUILD_INTELLIGENCE entries) MUST be batched into a single commit per session. Never interleave doc commits with code commits. Rationale: doc commits have zero rollback value on their own; bundling them reduces noise in the git log and avoids false-positive "something changed" signals in status checks.

### Context compaction triggers

Trigger context compaction when:
- Current session exceeds 60K input tokens consumed.
- More than 4 files have been read that are no longer relevant to the current task.
- A sub-agent completes and its output has been summarized in WORK_IN_PROGRESS.md.

Do not trigger compaction mid-task. Always finish the current discrete step, write WORK_IN_PROGRESS.md, then compact.

### Session length targets

| Session Type | Target Length | Warning Sign |
|---|---|---|
| Research | Short (< 30 min equivalent) | Reading > 15 files suggests scope creep |
| Implementation | Long (as needed, bounded by cost ceiling) | Sub-agents exceeding ceiling = pause |
| Review | Short (< 20 min equivalent) | Re-reading same file > 2× = inefficiency flag |

---

## 6. AUTONOMOUS HANDOFF SYSTEM — FUTURE STATE

> Not yet implemented. This section defines the target design for AML 4+.

### Handoff object schema

When a task transitions between sessions or between branches, a handoff object must be written to WORK_IN_PROGRESS.md. Schema:

```json
{
  "from_branch": "claude/implement-claude-design-ui-eFn9b",
  "to_branch": "claude/accentos-workflow-design-G0opy",
  "task_type": "doc | prototype | feature | research | review",
  "files_touched": ["path/to/file.js", "docs/foo.md"],
  "files_read": ["path/to/reference.md"],
  "open_questions": ["Should X use pattern A or B? Awaiting Michael decision."],
  "blocking_conditions": ["M22 SQL not yet run by Michael"],
  "continuation_prompt": "Pick up from Step 3 of WORK_IN_PROGRESS.md. Prototype agent scope: ui/ only.",
  "cost_used": 42000,
  "cost_ceiling": 80000
}
```

### Routing table (target state)

| task_type | Preferred Branch | Fallback Branch |
|---|---|---|
| `doc` | `claude/accentos-rollout-planning-UTElf` | `main` (docs/ only) |
| `prototype` | `claude/implement-claude-design-ui-eFn9b` | N/A |
| `feature` | `claude/implement-claude-design-ui-eFn9b` | N/A (no fallback for code) |
| `research` | any read-only branch | N/A |
| `workflow-design` | `claude/accentos-workflow-design-G0opy` | N/A |
| `mobile` | `research-mobile-pwa-Q6vYN` | N/A |

### Auto-generate continuation prompts

Continuation prompts are auto-generated from WORK_IN_PROGRESS.md using the "Next step if interrupted" field. The generated prompt format:

```
[Branch: {to_branch}] [Scope: {task_type}]
Resume: {next_step_if_interrupted}
Constraints: {files_touched} only. Do not write to {frozen_files}. Boot-smoke required before commit.
Open questions (do not resolve autonomously): {open_questions}
```

### Escalation triggers

A running agent must stop and surface to Michael if any of these occur:

| Trigger | Action |
|---|---|
| Unexpected file found in target path | Stop. Write file path + surprise to WORK_IN_PROGRESS.md. Wait. |
| Governance risk discovered mid-task | Stop. Append to GOVERNANCE_RISKS.md. Surface to Michael. |
| Cost ceiling hit | Stop. Write handoff object. Surface cost used vs ceiling. |
| Boot-smoke fails after prototype write | Stop. Do not commit. Surface failing check. |
| Two agents assigned same output file | Stop both. Surface conflict to Hub. Re-scope before resuming. |
| Open question requires irreversible decision | Stop. Append to decision queue. Do not proceed with assumption. |

---

## 7. ANTI-AGENT-CHAOS RULES

These rules are unconditional. No efficiency argument, deadline pressure, or scope justification overrides them.

| # | Rule |
|---|---|
| 1 | **Never spawn more than 3 concurrent agents** in a single session. |
| 2 | **Never let a spawned agent spawn further agents.** Hub → Agent is the maximum chain. |
| 3 | **Never commit without a boot-smoke pass.** Prototype and feature agents: no exceptions. |
| 4 | **Never write to frozen files from any agent.** Frozen: `worker/`, `wrangler.toml`, `sql/M01–M40`, `main` branch directly. |
| 5 | **Never route to a branch that doesn't own the target file** per MODULE_OWNERSHIP_MAP. |
| 6 | **Never allow two agents to write to the same file in the same session.** File-level lock is enforced by scope declaration at spawn time. |
| 7 | **Never delete or overwrite WORK_IN_PROGRESS.md without first reading it.** Always check for in-progress state before any write. |
| 8 | **Never let cost exceed session ceiling without pausing for review.** Ceiling hit = mandatory stop, not a soft warning. |
| 9 | **Never make production-visible changes without Michael authorization.** Staging and `ui/` prototype are exempt; `index.html`, `worker/`, and Cloudflare Pages are not. |
| 10 | **Never assume a task is complete without boot-smoke + explicit WIP checkpoint.** Completion is declared, not inferred. |

---

## 8. BETIQ CASE STUDY — OPERATOR MODEL

### The productization insight

AccentOS's governance framework is a **domain-specific operator ruleset**. The framework itself — autonomy tiers, file ownership map, spawn authority ceilings, cost throttle, anti-chaos rules — is domain-agnostic. What is domain-specific is the file inventory, the role configs, the vendor intelligence, and the business data.

This means the framework is reusable. A "BetIQ" instance would substitute:
- Lighting vendor primitives → sports data primitives (game feeds, odds APIs, player stats)
- `index.html` monolith → sports platform monolith (or equivalent)
- `ui/accentos-shell.*` → BetIQ shell prototype
- SQL migrations M01–M40 → BetIQ schema migrations

The governance layer (this doc, PARALLEL_WORK_RULES, SEQUENCE, STABILIZATION_PROTOCOL) ships unchanged.

### What is reusable across verticals

| Reusable (framework) | Not reusable (domain) |
|---|---|
| Automation maturity levels 0–5 | Lighting vendor scoring weights |
| Spawned agent authority ceilings | AccentOS role definitions |
| Approval-gated action class table | Supabase schema for Accent Lighting |
| Anti-chaos rule set | Quote generator AI parsing logic |
| Cost throttling philosophy | Cloudflare Worker proxy business logic |
| Handoff object schema | Michael's decision queue |
| Escalation triggers | Production URL / deployment config |
| Boot-smoke gate pattern | MODULE_OWNERSHIP_MAP entries |

### The operator pattern

```
AccentOS-as-operator = {
  rule_files:    [AGENT_AUTONOMY_RULES, PARALLEL_WORK_RULES, STABILIZATION_PROTOCOL],
  ownership_map: MODULE_OWNERSHIP_MAP,
  spawn_ceiling: per Section 3,
  cost_throttle: per Section 5,
  domain_config: [vendor_intelligence, role_matrix, sql_schema]
}

BetIQ-as-operator = {
  rule_files:    [same],          // reuse verbatim
  ownership_map: BetIQ_OWNERSHIP_MAP,
  spawn_ceiling: same,            // reuse verbatim
  cost_throttle: same,            // reuse verbatim
  domain_config: [sports_feeds, betiq_role_matrix, betiq_sql_schema]
}
```

The productizable layer is `rule_files` + `spawn_ceiling` + `cost_throttle`. Charging for domain configuration is the business model; the framework is the moat.

---

## 9. IMPLEMENTATION ROADMAP FOR AUTONOMY

| Phase | AML Transition | Work Required | Status |
|---|---|---|---|
| **Now** | AML 2 → 3 (docs) | Define approved action classes in this doc | Done when this doc is written |
| **Now** | AML 2 → 3 (prototype) | Boot-smoke gate validated in `scripts/boot-smoke.sh` | R-05 mitigated (script exists) |
| **Next** | AML 3 → 4 (routing) | Build task classifier + routing table; requires Claude API integration | Future |
| **Future** | AML 4 → 5 (orchestration) | Build handoff object schema + auto-prompt generation; significant investment | Future |

### Current session's contribution

This document lays the conceptual foundation for AML 3. It defines:
- What can be done autonomously (Section 4).
- What constraints bound any autonomous execution (Sections 3, 7).
- What the future system will look like when built (Section 6).

No code changes are implied by this document. AML 3 activation requires Michael to confirm in `BUILD_PLAN_MICHAEL.md`.

---

## APPENDIX: QUICK REFERENCE

### Autonomous (no gate needed)
- Write/edit any file in `docs/`
- Write/edit any file in `ui/` + pass boot-smoke
- Append to `WORK_IN_PROGRESS.md`, `BUILD_INTELLIGENCE.md`, `PROMPT_LOG.md`

### Requires Hub authorization
- Any write to `js/[module].js`
- Spawning a sub-feature agent

### Requires Michael authorization
- Any write to `index.html`
- Push to `main`
- SQL migrations
- `worker/`, `wrangler.toml` changes
- Package additions

### Never automatable (Michael hand-action only)
- `wrangler deploy` (Cloudflare Pages deploy)
- Supabase SQL editor execution
- External credential changes
