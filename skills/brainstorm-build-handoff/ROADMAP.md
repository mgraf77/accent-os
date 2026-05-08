# brainstorm-build-handoff — Roadmap

## MVP (current)

- [x] 5-phase pipeline (extract → analyze → audit → optimize → handoff)
- [x] JSON schemas for all phase outputs
- [x] Markdown templates for handoff and reviews
- [x] AIRLOCK worked example
- [x] Validators (ambiguity, entropy, overengineering)
- [x] scaffold.js for new handoff workspaces
- [x] AccentOS skill registry entry

## Phase 2 — Execution Tracking

- [ ] `handoff-tracker.md` — lightweight status file per active handoff
- [ ] Integration with `build-plan-status` skill to auto-convert handoff phases into BUILD_PLAN items
- [ ] `decision-log` auto-write during Phase 4 Ralph loop

## Phase 3 — Multi-Agent Interop

- [ ] Codex-compatible output format (YAML front-matter + JSON schema export)
- [ ] GitHub Issues export (one issue per implementation phase)
- [ ] Handoff diff — compare two versions of a handoff to surface scope creep

## Phase 4 — Skill Self-Optimization

- [ ] `gotcha-log.md` — track recurring failure patterns across handoff runs
- [ ] Auto-adjust Ralph loop pass count based on complexity score
- [ ] Confidence scoring per handoff section (flags low-confidence sections for human review)

## Non-Goals (permanent)

- No API endpoints
- No database storage of handoffs (filesystem only)
- No autonomous execution of the handoff itself (handoff is an artifact, not a runner)
- No web UI
- No vector search over past handoffs
