# brainstorm-build-handoff

> Convert raw ideas into deterministic, build-ready handoffs.

## What this skill does

Takes unstructured input — chat transcripts, brainstorms, voice-memo dumps, partial
specs — and produces a single Markdown handoff that another AI (Claude Code, Codex)
or an engineer can execute against without further clarification.

It runs a fixed seven-phase pipeline. Each phase writes one JSON artifact. The final
phase assembles those artifacts into `07-HANDOFF.md`.

## Why it exists

Brainstorming is high-entropy. Build execution is low-entropy. Without a structured
bridge between them, ideas either lose fidelity ("here's a vague spec") or never ship
("we kept iterating on the prompt"). This skill is the bridge.

## Repository layout

```
brainstorm-build-handoff/
  SKILL.md                  # the executable contract — read first
  README.md                 # this file
  ARCHITECTURE.md           # why the pipeline looks the way it does
  PROCESS.md                # operator guide — running the skill end-to-end
  ROADMAP.md                # what to build next, what to never build
  schemas/                  # JSON Schema for every phase artifact
  templates/                # markdown + JSON templates for each phase
  examples/                 # AIRLOCK worked example, end-to-end
  validators/               # checklist + validate.js (no deps)
  scripts/                  # init.js, assemble-handoff.js (no deps)
  artifacts/                # runtime workspace — one subdir per project slug
```

## Quickstart

```bash
# 1. Pick a project slug (kebab-case, ≤24 chars)
SLUG=airlock

# 2. Scaffold artifact dir
node skills/brainstorm-build-handoff/scripts/init.js $SLUG

# 3. Drop the raw brainstorm into artifacts/$SLUG/00-raw.md

# 4. Run the pipeline (the skill itself drives Claude through phases 1-6)
#    Each phase writes artifacts/$SLUG/0N-*.json

# 5. Assemble the final handoff
node skills/brainstorm-build-handoff/scripts/assemble-handoff.js $SLUG

# 6. Validate
node skills/brainstorm-build-handoff/scripts/validate.js $SLUG
```

The handoff lands at `artifacts/$SLUG/07-HANDOFF.md`.

## Naming convention

The directive document used `brainstorm_build_handoff/` (snake_case). This skill is
checked in as `brainstorm-build-handoff/` (kebab-case) to align with AccentOS
conventions for skill directory names. All references inside artifacts use the
kebab-case form.

## Companion skills

- `skill-forge` — ingest an external tool into a custom local skill.
- `priority-articulation` — decide *whether* to build before designing *how*.
- `decision-log` — capture architecture decisions discovered during Ralph passes.
