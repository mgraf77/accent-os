# Workflow: ai-handoff

## Identity
- **Name:** `ai-handoff`
- **Motivating use case:** Transfer effective ownership of the repo from one operator (typically an AI agent ending its session) to another (a different agent type, the same agent in a future session, or a human). Produces a comprehensive state-transfer doc.
- **Spans:** active work → `stabilize` → `handoff`

## Inputs
- Manifest mode is one of: `stabilize`, `pause`, `freeze`, `audit`, `sandbox`, or active feature work
- Outgoing operator identified
- Incoming operator named (specific person, agent type, or "next session" for generic)
- Optional: a reason for handoff (e.g. "session timeout", "specialty switch", "hand to human")

## Outputs
- Updated `repo-manifest.json` with `current_mode = "handoff"` and `handoff_to = [incoming]`
- Audit-trail entries for both transitions
- Handoff report at `.governance/artifacts/[YYYY-MM-DD]-handoff-[outgoing]-to-[incoming].md`
- Git tag at the handoff point: `handoff/[date]/[outgoing]-to-[incoming]`

## Phases

### Phase 1 — Stabilize (close out current work)
**Target mode:** `stabilize`

**Actions:**
- If working tree is dirty: commit cleanly OR document WIP per `modes/stabilize.md`
- Run universal validation (tests + lint)
- Resolve any low-cost drift (broken doc references, etc.) — but do not start new work
- If validation fails: surface; operator decides whether to hand off broken (with explicit acceptance) or fix first

**Checkpoint:**
- Validation passing OR explicit acceptance of broken-state handoff
- WIP captured

**Exit criteria:**
- `stabilize` Completion Criteria met (or operator override)

### Phase 2 — Handoff
**Target mode:** `handoff`

**Actions:**
- Generate handoff report using `templates/handoff.template.md`. Required sections include:
  - Outgoing operator + dates
  - Incoming operator
  - Current repo state (mode, branch, recent commits)
  - What was just done (last 5–10 meaningful actions)
  - What's next (ordered list with at least one specific actionable item)
  - Open decisions / blockers
  - Gotchas (things the incoming operator should know that aren't obvious)
  - Test / build / deploy commands the repo expects
  - Credentials / access notes (paths only, never secrets)
  - Where to find more context (PROMPT_LOG, SESSION_LOG, decision-log artifacts, etc.)
- Tag the handoff point: `git tag handoff/[YYYY-MM-DD]/[outgoing]-to-[incoming]`
- Commit the handoff report (so incoming operator can `git pull` and read it on session start)
- Update manifest: `current_mode = "handoff"`, `entered_by = [outgoing]`, `handoff_to = [incoming]`
- Append to audit trail

**Checkpoint:**
- Handoff report exists, all required sections non-empty, validates against `schemas/handoff-report.schema.md`
- "What's next" has ≥1 specific action (not "continue working")
- No secrets in the report
- Tag created
- Manifest updated

**Exit criteria:**
- `handoff` Completion Criteria met
- Run `evaluators/handoff-completeness.md` — verdict must be COMPLETE

## Rollback strategy

- **If Phase 1 fails and operator does not override:** workflow halts; outgoing operator stays active; surface what blocked
- **If Phase 2's handoff-completeness check is INCOMPLETE:** revise the report's missing sections; do not proceed until COMPLETE
- **If incoming operator rejects the handoff (e.g. wrong target agent):** outgoing operator stays active; manifest reverts to pre-handoff mode; audit trail records the rejection
- **If handoff report is committed but manifest update fails:** retry manifest update; if persistent, escalate to recovery (manifest corruption)

## Success criteria
- Manifest mode = `handoff`
- Handoff report committed
- Tag created
- Handoff-completeness evaluator returned COMPLETE
- Incoming operator can run `safe-resumption` later (which reads the handoff report) without unknowns

## Common variations

### Handoff to "next session of same agent type"
Incoming = the same agent type (Claude, Codex, etc.) in a future session. Handoff report can reference session-start hooks / CLAUDE.md / equivalents the agent will read automatically.

### Handoff to a human
Incoming = a named human. Handoff report is written to be readable, not just machine-parseable. Surface to the human via direct comm (Slack, email) — do not rely on them noticing the manifest.

### Cross-agent handoff (Claude → Codex, etc.)
Different agents have different tool conventions. Handoff report includes a "tool conventions" section so the incoming agent isn't surprised.

### Emergency handoff (no time for full stabilize)
Phase 1 is reduced to "commit WIP with clear marker, document broken state in handoff report." Recommend the incoming operator runs full `safe-resumption` + `stabilize` first thing.

## Related workflows
- **Before:** `clean-pause` may precede ai-handoff if pausing first
- **After:** the incoming operator typically runs `safe-resumption` to take over
- **Instead of:** if not transferring ownership, just `clean-pause`; if transferring + freezing the repo (e.g. ownership change with no immediate continuation), use `governance-migration` workflow

## Operator-type considerations

| Outgoing | Incoming | Notable |
|---|---|---|
| Claude | Claude (next session) | Use repo-specific session-start hooks; reference CLAUDE.md if present |
| Claude | Codex | Document Claude-specific tool patterns the report references |
| Claude | Human | Direct communication is mandatory; do not rely on the human reading the manifest |
| Human | Claude / Codex | Human writes the report; agent reads on session start |
| Codex | Claude | Note differences in conventions (e.g. file output formats) |
