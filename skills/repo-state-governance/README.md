# repo-state-governance

> Generalized, repo-agnostic governance framework for declaring and operating a code repository's lifecycle state.

This skill replaces implicit assumptions about "what's safe to change in this repo right now" with **declared operational modes** — each one a named contract specifying allowed actions, forbidden actions, required artifacts, and valid exits.

**Designed for:** multi-agent / multi-session software development where Claude Code, Codex, ChatGPT, future agents, and human operators all touch the same repo and need a single source of truth about what state the repo is in.

---

## Why this exists

In solo-human-developer workflows, repo state is implicit and lives in the developer's head. Add a single AI agent and that's still mostly fine. Add **multiple agents across multiple sessions** and the implicit-state model breaks down:

- Agent A leaves a half-finished refactor on a branch and ends its session.
- Agent B starts a new session, reads the branch, and either (a) finishes the refactor with different assumptions, (b) abandons it and starts fresh, or (c) breaks something because it didn't know the refactor was in flight.
- Human operator returns and has no idea what happened or what state things are in.

Without a declared state, every actor makes independent assumptions. With one, every actor reads the same manifest and behaves accordingly.

That's the entire purpose of this skill.

---

## Core concepts

### 1. Modes
A repo at any moment is in exactly one **mode** (with optional path-scoped sub-modes). Modes are not arbitrary tags — each is a structured contract:

- **Entry conditions** — must be true to enter
- **Allowed actions** — explicitly permitted operations
- **Forbidden actions** — explicitly denied operations (no surprises)
- **Execution priorities** — what to do first when actions conflict
- **Documentation requirements** — artifacts that must be produced
- **Validation requirements** — checks that must pass
- **Completion criteria** — what makes the mode "done"
- **Allowed transitions** — which modes you can legally go to next
- **Risk profile** — what can go wrong, mitigations
- **AI agent guidance** — how an agent should operate in this mode
- **Human-in-the-loop touchpoints** — where humans must approve or review

11 modes ship with the skill: `stabilize`, `pause`, `freeze`, `handoff`, `resume`, `audit`, `recovery`, `deploy-prep`, `extraction-prep`, `governance-transition`, `sandbox`. See `modes/` for full definitions.

### 2. Manifest
The repo's declared state lives in `repo-manifest.json` at repo root. Schema in `schemas/repo-manifest.schema.md`. Single source of truth — never inferred at runtime by reading repo state.

### 3. Audit trail
Every mode transition appends to `.governance/audit-trail.md`. Append-only, no edits, no deletes. This is the operational history.

### 4. Workflows
Workflows are step-by-step orchestrations that span modes. Example: `clean-pause` = stabilize → pause. `safe-resumption` = pause → audit → resume.

7 workflows ship with the skill. See `workflows/`.

### 5. Evaluators
Rubrics that score readiness. Each is a structured checklist with a verdict (READY / NOT_READY, GO / NO_GO, score 0-100, etc.).

6 evaluators ship with the skill. See `evaluators/`.

### 6. Schemas + Templates
Schemas define artifact structure (machine-readable). Templates are starting points (human-friendly). Every required artifact has both.

---

## Design principles

1. **Declared, never inferred.** Mode lives in the manifest. Detection only runs at bootstrap.
2. **Repo-agnostic.** Nothing assumes a specific language, framework, or hosting.
3. **Append-only history.** Operational state changes are events, not edits.
4. **Graceful degradation.** Missing manifest → sandbox mode + recommendation. Missing template → minimal structured output. Missing optional companion skill → skip.
5. **Modular.** Modes, workflows, evaluators, schemas, templates are loosely coupled. Add or replace one without rewriting the others.
6. **Forbidden actions are forbidden.** Not "discouraged" — forbidden. If you need to do one, exit the mode first.
7. **Human-in-the-loop is explicit.** Each mode declares its approval gates. HIGH-risk irreversible actions never auto-confirm.
8. **Multi-agent first.** Designed assuming Claude, Codex, ChatGPT, and humans will all read the same manifest and behave accordingly.

---

## Folder structure

```
skills/repo-state-governance/
├── README.md                          ← this file
├── SKILL.md                           ← skill entry point + step protocol
├── detection.md                       ← decision tree for picking a mode
├── modes/                             ← 11 mode definitions
│   ├── _index.md
│   ├── stabilize.md
│   ├── pause.md
│   ├── freeze.md
│   ├── handoff.md
│   ├── resume.md
│   ├── audit.md
│   ├── recovery.md
│   ├── deploy-prep.md
│   ├── extraction-prep.md
│   ├── governance-transition.md
│   └── sandbox.md
├── workflows/                         ← 7 cross-mode orchestrations
│   ├── _index.md
│   ├── clean-pause.md
│   ├── governance-migration.md
│   ├── repo-recovery.md
│   ├── deployment-preparation.md
│   ├── safe-resumption.md
│   ├── architecture-extraction.md
│   └── ai-handoff.md
├── evaluators/                        ← 6 readiness rubrics
│   ├── _index.md
│   ├── repo-health.md
│   ├── pause-readiness.md
│   ├── deployment-readiness.md
│   ├── governance-readiness.md
│   ├── extraction-readiness.md
│   └── handoff-completeness.md
├── schemas/                           ← 6 artifact schemas
│   ├── _index.md
│   ├── repo-manifest.schema.md
│   ├── state-report.schema.md
│   ├── handoff-report.schema.md
│   ├── migration-report.schema.md
│   ├── audit-report.schema.md
│   └── recovery-plan.schema.md
├── templates/                         ← 6 starting-point artifacts
│   ├── _index.md
│   ├── handoff.template.md
│   ├── audit-report.template.md
│   ├── recovery-plan.template.md
│   ├── pause-state.template.md
│   ├── deploy-checklist.template.md
│   └── extraction-spec.template.md
└── examples/                          ← 4 worked examples
    ├── _index.md
    ├── example-pause-cycle.md
    ├── example-handoff.md
    ├── example-deploy-prep.md
    └── example-extraction.md
```

---

## Integration roadmap

This skill is the **state contract layer**. It sits below an orchestration layer that does not yet exist.

```
   ┌─────────────────────────────────────────────────┐
   │            AgentOS Command Center               │  ← future
   │  (orchestrates multi-repo, multi-agent ops)    │
   └────────────────┬────────────────────────────────┘
                    │
                    ↓
   ┌─────────────────────────────────────────────────┐
   │       Repo State Governance Skill               │  ← THIS skill
   │  (declares modes, validates transitions,       │
   │   produces auditable artifacts)                │
   └────────────────┬────────────────────────────────┘
                    │
                    ↓
   ┌─────────────────────────────────────────────────┐
   │            Repo Manifest                        │  ← per-repo state
   │  (single source of truth: declared mode,       │
   │   scope, history)                              │
   └────────────────┬────────────────────────────────┘
                    │
                    ↓
   ┌─────────────────────────────────────────────────┐
   │      Governed AI / Human Workflow               │  ← actual work
   │  (constrained by current mode's contract)      │
   └─────────────────────────────────────────────────┘
```

This skill has no orchestration runtime. The Command Center will fill that gap. This skill is intentionally **just** the contract layer.

---

## Usage examples

### Bootstrap a repo
```
operator: "set up state governance on this repo"
→ skill detects no manifest → recommends sandbox mode + manifest creation
→ produces repo-manifest.json + .governance/audit-trail.md
→ surfaces next-allowed transitions
```

### Pause active work
```
operator: "pause this work — meeting in 10 min, want a clean stop"
→ skill validates: clean working tree? open WIP? tests passing?
→ runs clean-pause workflow (stabilize → pause)
→ produces pause-state artifact at .governance/artifacts/[date]-pause-state.md
→ updates manifest: current_mode = "pause"
→ appends audit-trail entry
```

### Resume after pause
```
operator: "resume where we left off"
→ skill reads manifest (mode = pause) + last pause-state artifact
→ runs safe-resumption workflow (pause → audit → resume)
→ produces resume report
→ updates manifest: current_mode = "resume" → "stabilize" or actively-working
```

### Hand off to a different agent
```
operator: "hand this off to Codex"
→ skill runs ai-handoff workflow (active → stabilize → handoff)
→ produces handoff-report.md (full state transfer doc)
→ updates manifest: current_mode = "handoff", entered_by = source agent
→ next agent reads manifest + handoff-report on session start
```

### Audit repo state
```
operator: "audit this repo"
→ skill runs audit mode (read-only)
→ runs repo-health evaluator
→ produces audit-report.md with score + tier + risks
→ does not modify manifest beyond appending audit-trail entry
```

---

## Risks & limitations

- **No runtime enforcement.** This skill defines contracts; agents and humans must voluntarily honor them. Real enforcement requires a hook layer (CI, pre-commit, or an orchestrator). Out of scope here.
- **Manifest drift.** If two agents edit the manifest concurrently, last-write-wins corrupts state. Mitigation: a future Command Center owns manifest writes. Today, agents must coordinate through git (commit each transition atomically).
- **Mode proliferation risk.** 11 modes is already a lot. Adding more without retiring old ones creates decision paralysis. Hard rule: any new mode must replace or strictly subsume an existing one.
- **Repo-specific tier.** "Repo-specific validation" is a hand-wave — repos must define their own checks. Templates show the shape; content is per-repo.
- **No rollback automation.** Most modes are reversible in principle but the skill provides no automated rollback. Each mode's `Risk Profile` describes manual rollback. Automation is a future Command Center concern.
- **Detection is best-effort.** When the manifest is missing, `detection.md` recommends a mode based on heuristics. It is not authoritative — operators should confirm.

---

## Future evolution

| Capability | Where it goes |
|---|---|
| Runtime enforcement (block forbidden actions) | Command Center + git hooks |
| Concurrent-write safety | Command Center owns manifest writes |
| Multi-repo orchestration (e.g. mode all repos in a portfolio at once) | Command Center |
| Auto-detection of mode from repo state | Improve `detection.md` heuristics |
| Per-mode metrics / SLOs | Add `metrics/` directory + dashboard integration |
| Pluggable evaluators (custom rubrics per repo) | Add `evaluators/repo-overrides/` directory |
| Mode-aware CI templates | Add `ci-templates/` directory |
| Skill-pack installer (`agentos-skills add repo-state-governance`) | Future agentos-skills package manager |

---

## Migration path to `agentos-skills`

This skill currently lives at `skills/repo-state-governance/` inside AccentOS. When `agentos-skills` becomes a real package:

1. The folder moves verbatim — no AccentOS-specific content needs to be stripped.
2. The "Companion skills (AccentOS context)" block in `SKILL.md` moves to a per-repo overlay file.
3. The manifest schema and audit-trail format remain stable.
4. Each AccentOS skill that depends on this one updates its import path.

This was designed migration-ready from day one.

---

## Authoring & contribution

When adding a new mode:
1. Copy `modes/sandbox.md` as a template (it has all required sections).
2. Fill every section. Empty sections are not acceptable.
3. Add the new mode to `modes/_index.md` and to the table in `SKILL.md`.
4. Update `detection.md` Step 2 transition table.
5. If the new mode produces a new artifact, add a schema in `schemas/` and a template in `templates/`.

When adding a new workflow:
1. Copy any existing workflow file as a template.
2. List every phase with its mode, inputs, outputs, checkpoint criteria.
3. Add to `workflows/_index.md` and to the table in `SKILL.md`.

When adding a new evaluator:
1. Define checklist items with explicit pass/fail criteria.
2. Define scoring rubric (binary, weighted, or tiered).
3. Define verdict mapping (e.g. score → READY / NOT_READY / WARN).
4. Add to `evaluators/_index.md`.
