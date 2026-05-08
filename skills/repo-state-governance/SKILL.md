---
name: repo-state-governance
description: >
  Generalized, repo-agnostic governance framework for declaring and operating
  a code repository's lifecycle state. Defines named operational modes
  (stabilize, pause, freeze, handoff, resume, audit, recovery, deploy-prep,
  extraction-prep, governance-transition, sandbox), the safe transitions
  between them, the workflows that move a repo through them, and the
  evaluators / schemas / templates that produce auditable artifacts. Use this
  skill when an operator (human or AI) says: "stabilize the repo", "pause
  this branch", "freeze for deploy", "we need to hand this off", "resume
  where we left off", "audit the codebase", "recover from a broken state",
  "prep for deploy", "extract this module to its own repo", "transition
  governance", or any phrasing that asks the repo to enter, exit, or report
  on a lifecycle state. Repo-agnostic: relies on an optional
  `repo-manifest.json` for declarative state but degrades gracefully without
  one. Designed for Claude Code, Codex, ChatGPT, future agents, and human
  operators alike. Never silently changes mode — every transition is
  declared, validated, logged, and reversible (or explicitly marked
  irreversible). Always produces structured artifacts (state report,
  handoff report, migration report, audit report, or recovery plan) — never
  returns prose-only.
---

# repo-state-governance

**Purpose:** Code repositories drift. Multi-agent / multi-session work compounds drift. Without a declared operational state, every actor (Claude, Codex, ChatGPT, the human owner, a CI bot) makes independent assumptions about what's safe to change, what counts as "done", and what artifacts are required. This skill replaces those implicit assumptions with **declared modes** — each one a contract specifying allowed actions, forbidden actions, required artifacts, and valid exits.

This is not a prompt library. It is a governance framework: declarative state + safe transitions + auditable artifacts.

---

## Trigger Recognition

Run this skill when an operator says any of:

| Intent | Trigger phrases |
|---|---|
| Enter mode | "stabilize the repo", "pause this work", "freeze for X", "audit this", "recover from Y", "prep for deploy", "sandbox this experiment" |
| Transition | "hand this off to [agent/person]", "resume where we left off", "transition governance", "extract module X" |
| Report | "what state is this repo in", "is this ready to deploy", "is the handoff complete", "audit readiness" |
| Bootstrap | "set up governance", "install state governance", "give this repo a manifest" |

If the request is ambiguous (e.g. "clean up the repo"), run `detection.md` Step 1 — pick a recommended mode and surface it before acting.

---

## Scope

**In scope:**
- Declaring, entering, executing, and exiting any of the 11 lifecycle modes
- Validating that a transition is safe given current repo state
- Generating the artifact required by the target mode (state report, handoff doc, audit report, etc.)
- Updating the optional `repo-manifest.json` to record the declared state

**Out of scope — fail fast with a redirect:**
- Building features inside the repo → use the repo's normal build workflow; this skill only governs *meta-state*
- Long-running orchestration / scheduling → out of scope for the skill itself; future AgentOS Command Center will own that
- Replacing existing language-specific tooling (linters, test runners, CI) → this skill *invokes* them, never replaces them

---

## Step 0 — Preflight

Before any mode work, do these in parallel:

1. **Read the repo manifest** — `repo-manifest.json` at repo root (or fall back to defaults below). Captures: declared mode, scope, last transition timestamp, next-allowed transitions, validation tier.
2. **Read the audit trail** — `.governance/audit-trail.md` (append-only log of every mode transition). If absent, create on first transition.
3. **Capture branch + working-tree state** — `git rev-parse --abbrev-ref HEAD`, `git status --porcelain`, last 5 `git log --oneline`.
4. **Identify operator** — human (Michael / known user) or agent (Claude Code / Codex / ChatGPT). Some modes require human approval at specific gates.

**Manifest-absent fallback:**
If `repo-manifest.json` does not exist, treat the repo as in mode `sandbox` until explicitly declared otherwise. Surface a one-line note recommending manifest creation; do not block.

Output of Step 0: a 4-line preflight summary — mode, scope, branch, operator.

---

## Step 1 — Determine target mode

Three paths:

**Path A — Operator declared a mode explicitly.** Validate the declared mode against `detection.md` Step 2 transition table. If invalid (e.g. trying to enter `resume` from `audit` directly), surface the conflict and propose the correct intermediate.

**Path B — Operator described intent without naming a mode.** Run `detection.md` Step 1 decision tree. Surface the recommended mode and the runner-up. Wait for confirmation if Path B was triggered by a vague request; proceed if intent was unambiguous.

**Path C — No request, just state inspection.** Skip transition; produce a state report only (see `schemas/state-report.schema.md`).

---

## Step 2 — Validate entry conditions

Open `modes/[target-mode].md` and read the **Entry Conditions** section. Run each as a check:

- File-level conditions: existence / absence checks
- Repo-level conditions: clean working tree, branch protection, etc.
- Process-level conditions: tests passing, no open WIP, etc.

Produce an **entry-conditions report** — pass/fail per condition. If any FAIL:
- For LOW-risk modes (sandbox, audit): proceed with a warning
- For MEDIUM-risk (pause, resume, stabilize): block; surface remediation
- For HIGH-risk (freeze, deploy-prep, extraction-prep, governance-transition): block; require explicit operator override

---

## Step 3 — Run the workflow

If the transition has a named workflow (see `workflows/_index.md`), follow it phase-by-phase. Workflows are step-by-step orchestrations that span modes (e.g. `clean-pause` = stabilize → pause).

If no named workflow applies, execute the mode's `Allowed Actions` directly while honoring its `Forbidden Actions` and `Execution Priorities`.

**Hard rule:** Never perform a `Forbidden Action` for the active mode. If a `Forbidden Action` becomes necessary, exit the mode first (declare a transition), then act.

---

## Step 4 — Produce required artifacts

Every mode lists `Documentation Requirements`. For each:

1. Locate the matching template in `templates/`.
2. Locate the matching schema in `schemas/`.
3. Generate the artifact, validating against schema.
4. Place it where the mode specifies (default: `.governance/artifacts/[YYYY-MM-DD]-[artifact-name].md`).

If the artifact already exists for the current transition, **append** rather than overwrite (history is non-destructive).

---

## Step 5 — Validate exit / completion

Open `modes/[target-mode].md` `Completion Criteria`. Run each. Produce a **completion report**.

If criteria pass: mode is officially active (or transition complete). Update manifest + audit trail.

If criteria fail: mode is **partially entered** — remain in transition state, surface blockers, do not update manifest as "complete."

---

## Step 6 — Update manifest + audit trail

Atomically update both:

```jsonc
// repo-manifest.json
{
  "schema_version": 1,
  "current_mode": "[target-mode]",
  "scope": "whole-repo" | { "paths": ["..."] } | { "modules": ["..."] },
  "entered_at": "[ISO-8601]",
  "entered_by": "[operator]",
  "previous_mode": "[prev-mode]",
  "next_allowed_transitions": ["..."],
  "validation_tier": "universal" | "language-specific" | "repo-specific"
}
```

```markdown
<!-- .governance/audit-trail.md -->
## [ISO-8601] [prev-mode] → [target-mode]
- operator: [human-or-agent]
- workflow: [workflow-name | direct]
- artifacts: [path1, path2, ...]
- entry-conditions: pass/fail
- completion: complete | partial | rolled-back
- notes: [1-2 lines]
```

Audit trail is **append-only**. Never edit prior entries.

---

## Step 7 — Surface state to operator

Output:
- Current mode + scope
- Allowed next transitions (so operator knows what's next)
- Pending blockers (if completion was partial)
- Artifact paths (so operator can read them)

Format depends on caller — Claude Code in `vibe` mode: short bullets. ChatGPT / API: structured JSON if requested via schema.

---

## Mode index (full definitions in `modes/`)

| Mode | Risk | Reversibility | Typical use |
|---|---|---|---|
| stabilize | LOW | REVERSIBLE | Bring repo to a clean, tests-green steady state |
| pause | LOW | REVERSIBLE | Temporarily stop active work, preserve resumability |
| freeze | MEDIUM | REVERSIBLE | Hard stop — only hotfixes / no-op commits allowed |
| handoff | MEDIUM | REVERSIBLE | Transfer ownership across agents or humans |
| resume | LOW | REVERSIBLE | Re-enter active work after pause / freeze |
| audit | LOW | READ-ONLY | Evaluate health, drift, debt, risk |
| recovery | HIGH | SEMI | Restore degraded / broken repo to known-good |
| deploy-prep | HIGH | REVERSIBLE | Pre-production validation gate |
| extraction-prep | HIGH | IRREVERSIBLE-IF-COMPLETED | Prepare a subsystem to be split into its own repo |
| governance-transition | HIGH | SEMI | Migrate ownership / standards / process |
| sandbox | LOW | REVERSIBLE | Free-form experimental space, isolated from main |

---

## Workflow index (full definitions in `workflows/`)

| Workflow | Spans | Output |
|---|---|---|
| clean-pause | active → stabilize → pause | pause-state artifact |
| governance-migration | any → governance-transition → any | migration report |
| repo-recovery | broken → recovery → stabilize | recovery plan + report |
| deployment-preparation | stabilize → deploy-prep → freeze | deploy checklist |
| safe-resumption | pause/freeze → audit → resume | resume report |
| architecture-extraction | stabilize → extraction-prep → split | extraction spec |
| ai-handoff | active → stabilize → handoff | handoff doc |

---

## Evaluator index (full definitions in `evaluators/`)

| Evaluator | Used by | Verdict |
|---|---|---|
| repo-health | audit, stabilize, deploy-prep | score 0-100 + tier |
| pause-readiness | clean-pause workflow | READY / NOT_READY |
| deployment-readiness | deploy-prep mode | GO / NO_GO / GO_WITH_CAVEATS |
| governance-readiness | governance-transition mode | READY / NOT_READY |
| extraction-readiness | extraction-prep mode | READY / NOT_READY |
| handoff-completeness | handoff mode | COMPLETE / INCOMPLETE |

---

## Schema index (full definitions in `schemas/`)

| Schema | Produced by |
|---|---|
| repo-manifest.schema | bootstrap, every transition |
| state-report.schema | audit, status request |
| handoff-report.schema | handoff mode |
| migration-report.schema | governance-transition mode |
| audit-report.schema | audit mode |
| recovery-plan.schema | recovery mode |

---

## Hard rules

1. **Declared, never inferred.** Mode lives in `repo-manifest.json`. Detection only runs at bootstrap or when the manifest is missing/corrupt.
2. **Append-only audit trail.** Never edit or delete prior audit entries.
3. **No silent transitions.** Every mode change writes both manifest + audit trail.
4. **Forbidden actions are forbidden.** If a forbidden action becomes necessary, exit the mode first.
5. **Templates are starting points, not boilerplate.** Tailor every artifact to the actual repo / situation.
6. **Repo-agnostic.** Nothing in this skill assumes a specific language, framework, or hosting. Repo-specific behavior lives in the manifest.
7. **Human-in-the-loop is explicit.** Each mode declares its human approval gates. Never auto-confirm a HIGH-risk irreversible action.
8. **Graceful degradation.** Missing manifest → sandbox + warning. Missing audit trail → create on first write. Missing template → minimal structured output.

---

## Files in this skill

- `SKILL.md` — this file (entry point + step protocol)
- `README.md` — high-level overview, design rationale, integration roadmap
- `detection.md` — decision tree for picking a mode when none is declared
- `modes/` — 11 mode definitions, one per file
- `workflows/` — 7 workflow definitions
- `evaluators/` — 6 readiness rubrics
- `schemas/` — 6 artifact schemas (manifest + 5 reports)
- `templates/` — 6 starting-point artifact templates
- `examples/` — 4 worked examples of full mode cycles

---

## Companion skills (AccentOS context)

- `decision-log` — capture irreversible architecture decisions made during `governance-transition` or `extraction-prep`
- `doc-drift` — verify documentation alignment during `audit` and `stabilize`
- `efficiency-monitor` — surface inefficiency signals captured during long-running modes
- `codex-review` — second-opinion audit during `deploy-prep` or `extraction-prep`

These companions are AccentOS-specific. The framework itself is repo-agnostic — companions are optional integrations, not requirements.
