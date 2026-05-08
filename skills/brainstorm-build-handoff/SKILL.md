---
name: brainstorm-build-handoff
description: >
  Convert a raw idea, fragmented brainstorm, or partially formed system vision into a
  deterministic, build-ready handoff suitable for Claude Code, Codex, autonomous agents, or
  an engineering team. Runs a fixed seven-phase pipeline (concept extraction → systems
  thinking → failure analysis → 3-pass Ralph optimization → MVP reduction → build plan →
  handoff assembly), writing one JSON artifact per phase plus a final HANDOFF.md. Use this
  skill when Michael says: "turn this into a build plan", "make this build-ready",
  "structure this idea", "generate a handoff", "I've been brainstorming — make it
  executable", "design the architecture for [X]", "convert this transcript into a system",
  "stop the prompt soup — give me a real spec", or any phrasing that asks to convert
  unstructured thinking into a deterministic build artifact. Distinct from skill-forge:
  skill-forge ingests an external tool and produces a local skill; brainstorm-build-handoff
  ingests Michael's own raw thinking and produces a handoff for *any* downstream executor.
  End deliverable is the handoff document — never stops at "here's how it would work."
  Ralph loop runs exactly 3 bounded passes, each writing a structured delta against the
  prior pass; no free-form iteration. Reads validators/checklist.md before writing the
  handoff and re-runs validators/validate.js at the end so output is verifiable.
---

# brainstorm-build-handoff

**Purpose:** Take unstructured brainstorming and produce a deterministic, modular,
machine-readable build handoff in one pass. Optimize for downstream-AI execution and
long-term maintainability — not for conversational verbosity.

Seven phases in strict order: **extract → analyze → fail-hunt → ralph(3) → reduce →
plan → assemble**. Every phase writes exactly one artifact at a fixed path. No phase is
optional. No phase is free-form.

---

## Trigger Recognition

Run this skill when Michael says anything like:
- "turn this into a build plan"
- "make this build-ready"
- "convert this transcript into a system"
- "structure this idea"
- "generate a handoff for [Codex / Claude Code / the team]"
- "stop the prompt soup — give me a real spec"
- "design the architecture for [X]"
- "I've been brainstorming — make it executable"
- "ralph this idea"
- "give me a deterministic spec for [X]"

Also chain after `priority-articulation` when the priority surfaced is "ship a system"
rather than "make a decision."

---

## Scope

**In scope:**
- Raw chat transcripts, voice-memo dumps, fragmented notes, mixed brainstorming.
- Targets that resolve to a *system* (a workflow, a service, an agent loop, an
  orchestration spec, a schema, an infrastructure layer).
- Output executors: Claude Code, Codex, an internal engineer, an autonomous agent,
  another orchestration framework.

**Out of scope — fail fast:**
- Single-feature requests on an existing codebase → use Edit directly, not this skill.
- "Should we build X?" decision questions → use `priority-articulation` or
  `decision-log` instead.
- External-tool ingestion ("rip the good parts out of [X]") → use `skill-forge`.
- Pure data analysis or reporting → use `supabase-sql-magic` / `analysis-snapshot`.

If the input does not contain a system to build, return one line: `OUT OF SCOPE — <why>
— recommended skill: <name>`. Do not run the pipeline.

---

## Operating Philosophy

Every artifact must satisfy:

| Property            | Concrete meaning                                                |
|---------------------|-----------------------------------------------------------------|
| Deterministic       | Same input + same phase → semantically equivalent output.       |
| Modular             | Each phase artifact stands alone and is consumed by name.       |
| Resumable           | Pipeline can resume from any phase given prior artifacts.       |
| Auditable           | Every claim traces back to a concrete prior-artifact key.       |
| Low-entropy         | No filler, no narration, no duplication.                        |
| Machine-readable    | JSON until the final phase; final phase is structured Markdown. |
| Low-ambiguity       | Validator catches words like "various", "some", "etc.", "TBD".  |
| AI-collaborative    | Output usable by Claude Code or Codex with zero context loss.   |

If a phase can't satisfy these, mark the offending key as `"_unresolved": "<reason>"`
in its JSON artifact instead of guessing. The validator surfaces unresolved keys at
the end so Michael can resolve them in one pass.

---

## Step 0 — Preflight

Run in parallel:

1. **Check the validator checklist** —
   `/home/user/accent-os/skills/brainstorm-build-handoff/validators/checklist.md`.
   Apply every rule before writing any artifact. If the file does not exist, treat as
   empty.
2. **Pick a project slug** — kebab-case, ≤24 chars, derived from the raw input's
   apparent system name. Slug becomes the artifact directory:
   `artifacts/<slug>/`. If a directory already exists, append `-v2`, `-v3`, etc.
3. **Capture branch state** —
   `git -C /home/user/accent-os branch --show-current`. If on `main`, auto-create
   `claude/handoff-<slug>-<short-hash>` before any commit. Do not push to `main`
   without explicit permission.
4. **Scan AccentOS context** — read `MASTER.md` and `BUILD_PLAN_CLAUDE.md` for the
   first 200 lines. The handoff must not contradict shipped architecture.

Output of Step 0: a one-block preflight note: `slug | branch | profile | gotchas
applied`.

---

## Step 1 — PHASE 1: Concept Extraction

**Input:** raw idea (text). **Output:** `artifacts/<slug>/01-concept.json`.

Extract, in this exact key order:

```
{
  "true_objective":      "<single sentence — the system's reason to exist>",
  "system_category":     "<workflow | orchestration | agent | infra | schema | tool>",
  "primary_executor":    "<claude-code | codex | engineer | autonomous-agent | mixed>",
  "operational_goals":   ["<verb-noun bullet>", ...],
  "implied_workflows":   ["<actor → action → effect>", ...],
  "hidden_assumptions":  ["<assumption being made implicitly>", ...],
  "constraints":         ["<hard limit — token, time, cost, infra>", ...],
  "non_goals":           ["<thing this is explicitly NOT>", ...]
}
```

Rules:
- Every key is required. If genuinely unknowable, write
  `"_unresolved": "<reason>"`.
- `true_objective` must be a single sentence — not a paragraph.
- `non_goals` must contain at least one entry. Force a scoping decision.
- Do not invent constraints. If none stated, write
  `"constraints": ["_unresolved: none stated; assume markdown + filesystem only"]`.

---

## Step 2 — PHASE 2: Systems Thinking

**Input:** `01-concept.json`. **Output:** `artifacts/<slug>/02-systems.json`.

Decompose the system into:

```
{
  "entities":         [{"name": "...", "owns": "...", "lifecycle": "..."}],
  "orchestration":    [{"trigger": "...", "actor": "...", "effect": "..."}],
  "state":            [{"key": "...", "shape": "...", "owner": "...", "persistence": "..."}],
  "dependencies":     [{"upstream": "...", "downstream": "...", "kind": "data|control|time"}],
  "governance":       [{"rule": "...", "enforced_by": "...", "failure_mode": "..."}],
  "scaling_axes":     [{"axis": "...", "current_limit": "...", "future_limit": "..."}],
  "interop_surface":  [{"protocol": "...", "consumer": "...", "format": "..."}]
}
```

Rules:
- Each entity must have an explicit owner. No "shared" or "everyone".
- Every orchestration row must trace to one operational_goal from Phase 1.
- If a key has no entries, write `"<key>": []` and add a note in Phase 3 explaining
  why the absence is intentional.

---

## Step 3 — PHASE 3: Failure & Entropy Analysis

**Input:** `02-systems.json`. **Output:** `artifacts/<slug>/03-failures.json`.

For each category, list ≤7 concrete failure modes:

```
{
  "bottlenecks":         [{"where": "...", "why": "...", "mitigation": "..."}],
  "ambiguity_risks":     [{"surface": "...", "ambiguity": "...", "fix": "..."}],
  "token_explosions":    [{"surface": "...", "trigger": "...", "cap": "..."}],
  "orchestration_drift": [{"actor": "...", "drift_mode": "...", "guardrail": "..."}],
  "governance_gaps":     [{"rule": "...", "gap": "...", "owner": "..."}],
  "sync_problems":       [{"surface": "...", "race": "...", "resolution": "..."}],
  "scalability_cliffs":  [{"axis": "...", "cliff_at": "...", "next_step": "..."}],
  "maintainability":     [{"surface": "...", "decay_mode": "...", "preventer": "..."}]
}
```

Rules:
- ≤7 entries per category — force prioritization.
- Each entry must reference a key from `02-systems.json`. No abstract risk-talk.
- No category may be empty unless explicitly justified in the entry's "why" field.

---

## Step 4 — PHASE 4: Ralph Loop (3 bounded passes)

**Input:** `03-failures.json` + all prior artifacts. **Output:** three files —
`04-ralph-pass-1.json`, `04-ralph-pass-2.json`, `04-ralph-pass-3.json`.

Each pass writes a *delta*, not a full re-derivation:

```
{
  "pass":            <1 | 2 | 3>,
  "focus":           "simplify | de-risk | unify",
  "removals":        [{"target": "<artifact.path.to.key>", "reason": "..."}],
  "merges":          [{"targets": ["...", "..."], "into": "...", "reason": "..."}],
  "renames":         [{"from": "...", "to": "...", "reason": "..."}],
  "additions":       [{"target": "...", "value": "...", "reason": "..."}],
  "determinism_wins":[{"surface": "...", "before": "...", "after": "..."}],
  "open_issues":     ["<remaining ambiguity>"]
}
```

Pass focuses are fixed:
- **Pass 1: simplify** — remove premature abstractions, collapse near-duplicates.
- **Pass 2: de-risk** — neutralize the top 5 entries from `03-failures.json`.
- **Pass 3: unify** — make naming, ordering, and key shapes consistent across all
  artifacts.

Rules:
- ≤10 changes per pass. Force prioritization.
- A pass with `open_issues: []` and ≤2 changes signals convergence — note this in
  the assembled handoff.
- Never modify earlier artifacts in place. Deltas only.

---

## Step 5 — PHASE 5: MVP Reduction

**Input:** all `04-ralph-pass-*.json` deltas applied conceptually + prior artifacts.
**Output:** `artifacts/<slug>/05-mvp.json`.

```
{
  "must_build":     [{"item": "...", "phase_ref": "...", "reason": "..."}],
  "defer":          [{"item": "...", "until": "<trigger condition>", "reason": "..."}],
  "delete":         [{"item": "...", "reason": "<scope creep | speculation | duplicate>"}],
  "future_hooks":   [{"surface": "...", "extension_point": "...", "rationale": "..."}],
  "scope_boundary": "<one sentence: what counts as done>"
}
```

Rules:
- `must_build` must include only items required for the system to be useful end-to-end.
- `defer` is the pressure-relief valve — over-eager additions go here, not into
  `must_build`.
- `delete` requires a reason from the fixed enum.
- `scope_boundary` is the deterministic done-criterion. If ambiguous, the validator
  fails.

---

## Step 6 — PHASE 6: Build Plan Generation

**Input:** `05-mvp.json` + `02-systems.json`. **Output:**
`artifacts/<slug>/06-build-plan.json`.

```
{
  "directory_structure": [{"path": "...", "purpose": "..."}],
  "schemas":             [{"name": "...", "owner_phase": "...", "format": "json-schema|yaml"}],
  "implementation_phases":[
    {"id": "P1", "title": "...", "outputs": ["..."], "depends_on": [], "validation": "..."}
  ],
  "validation_gates":    [{"gate": "...", "applies_to": "...", "passes_if": "..."}],
  "operating_rules":     ["..."],
  "next_phases":         [{"trigger": "...", "scope": "..."}]
}
```

Rules:
- `implementation_phases` must form a DAG — no cycles. The validator checks this.
- Every phase must declare at least one validation gate.
- `next_phases` exist *outside* the MVP — they document the scaling path without
  expanding scope.

---

## Step 7 — PHASE 7: Build-Ready Handoff Assembly

**Input:** all prior artifacts. **Output:** `artifacts/<slug>/07-HANDOFF.md`.

Run `node scripts/assemble-handoff.js <slug>`. The script reads artifacts 01–06 and
fills `templates/handoff.md`. Do not hand-write the handoff — assembly is
deterministic.

After assembly, run `node scripts/validate.js <slug>`. If the validator reports any
failures, do not present the handoff to Michael — fix the offending artifact and
re-assemble.

The final handoff includes:
- Objective + scope boundary
- Architecture summary (entities, orchestration, governance)
- Implementation phases (DAG order)
- Validation gates
- Operating rules
- Out-of-scope list (`defer` + `delete` from Phase 5)
- Next phases (scaling path)
- Pointer to all source artifacts (so the executor can drill in)

---

## Step 8 — Final Output to Michael

After validation passes, output exactly:

1. Path to `07-HANDOFF.md`.
2. Architecture improvements made during Ralph passes (≤5 bullets, sourced from
   `04-ralph-pass-*.json`).
3. Simplifications made (≤5 bullets, sourced from `05-mvp.json` `delete` + `defer`).
4. Tradeoffs taken (≤3 bullets).
5. Remaining risks (top 3 from `03-failures.json` not fully neutralized in Ralph).
6. Scaling path (sourced from `06-build-plan.json` `next_phases`).
7. What NOT to build yet (sourced from `05-mvp.json` `defer`).

Then stop. Do not expand. The handoff is the deliverable.

---

## Behavioral Constraints

- Never produce free-form prose where a JSON artifact is required.
- Never modify a prior phase's artifact — only Ralph deltas.
- Never skip the validator. If it fails, fix and re-assemble.
- Never present the handoff before validation passes.
- Never expand scope after Phase 5. New ideas go to `defer` or `next_phases`.
- Never wrap up without writing all 8 required output sections.

---

## Companion Skills

- `skill-forge` — when the input is an external tool, not raw thinking.
- `priority-articulation` — when the input is "what should we build" rather than
  "build this."
- `decision-log` — capture the architecture decisions surfaced in Phase 4.
- `efficiency-monitor` — observes Ralph-loop convergence patterns across runs.
