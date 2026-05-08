# Handoff: [OUTGOING_OPERATOR] → [INCOMING_OPERATOR]

<!--
Validate against: schemas/handoff-report.schema.md
Run evaluator: evaluators/handoff-completeness.md
Required: every section below must be filled in. Delete this comment when done.
-->

**Schema version:** 1
**Handoff at:** [ISO-8601 timestamp]
**Tag:** handoff/[YYYY-MM-DD]/[OUTGOING]-to-[INCOMING]

---

## Header

- **Outgoing operator:** [e.g. claude-code:michael, codex, human:michael]
- **Outgoing session started:** [ISO-8601]
- **Outgoing session last action at:** [ISO-8601]
- **Incoming operator:** [specific identity, agent type, or "next session of [agent]"]
- **Manifest mode at handoff:** handoff
- **Previous mode (before handoff):** [mode]

## Repo state at handoff

- **Branch:** [branch name]
- **HEAD commit:** [hash] "[commit message]"
- **Working tree status:** [clean | dirty-tracked | dirty-untracked | dirty-mixed]
- **Universal validation:** [passing | failing — list]
- **Manifest path:** [path to repo-manifest.json]

## What was just done

<!-- 3–10 meaningful actions; be specific. Reference longer artifacts. -->

- [Action 1: what + why + outcome]
- [Action 2: ...]
- [Action 3: ...]
- ...

**Headline result:** [1-2 sentences capturing the overall result of the outgoing session]

**Longer-form references:**
- [Path to PROMPT_LOG / SESSION_LOG / decision-log entry / etc.]
- [...]

## What's next

<!-- Ordered list. At least one item. Each specific enough to start without questions. -->

1. **[Action]** — [Specific instructions: what file, what line, what command, what expected result]
2. **[Action]** — [...]
3. **[Action]** — [...]

### Open decisions / blockers

- [Decision-still-pending #1: what's the question, what are the options, what's blocking]
- [Blocker #1: what's blocked, on what, by whom]

## Gotchas

<!-- Things the incoming operator should know that aren't obvious. May say "no known gotchas" if genuinely none. -->

- **[Gotcha name]** — [What it is. Why it matters. How to avoid.]
- **[Gotcha name]** — [...]

### Failure paths already tried

<!-- Save the incoming operator from repeating dead ends. -->

- [Tried X — failed because Y. Don't try this again.]
- [Considered Z — rejected because W.]

## Commands & access

| Item | Value |
|---|---|
| Test | `[verbatim command]` |
| Lint | `[verbatim]` |
| Type check | `[verbatim or n/a]` |
| Build | `[verbatim or n/a]` |
| Deploy | `[verbatim or n/a — not deploying this branch]` |
| Required tooling | [versions, e.g. "Node 20.x, pnpm 8.x"] |
| Credential locations | [file paths only — never secrets, e.g. "see .env.example; actual .env at ~/.config/myapp/.env"] |

## Risks & required skills

### Outstanding risks

- [Risk #1: description, likelihood, impact]
- [Risk #2: ...]

### Required skills (for the incoming operator)

- [Skill #1, e.g. "TypeScript", "Async testing patterns"]
- [Skill #2, ...]

### Time-sensitive items

- [Item: deadline, why it matters]
- [Item: ...]

## References

- **Audit trail:** [path] [line range covering this session]
- **Decision log:** [path to relevant decisions]
- **Prior artifacts:**
  - [Path to pause-state, prior handoff, prior audit, etc.]
  - [...]
- **Repo-specific docs to read:** [e.g. ARCHITECTURE.md, CONTRIBUTING.md, README sections]

---

<!--
Before committing:
1. Run evaluators/handoff-completeness.md against this report.
2. Verify no secrets leaked (run secrets scanner).
3. Tag the handoff point: git tag handoff/[date]/[outgoing]-to-[incoming]
4. Update repo-manifest.json: current_mode = "handoff", entered_by = [outgoing], handoff_to = [incoming]
5. Append to .governance/audit-trail.md

Delete this trailer block before commit.
-->
