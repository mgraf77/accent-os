# Schema: handoff-report

## Identity
- **Schema:** `handoff-report`
- **Version:** v1
- **Purpose:** Comprehensive state-transfer document so an incoming operator (different agent type, future session, or human) can pick up cold without unknowns.
- **Format:** Markdown (primary) — readable by both humans and agents
- **Default location:** `.governance/artifacts/[YYYY-MM-DD]-handoff-[outgoing]-to-[incoming].md`

## Required sections

The schema is enforced by section presence + non-empty required fields within each section.

### Section: Header
| Field | Description |
|---|---|
| `schema_version` | `1` |
| `outgoing_operator` | Identity (e.g. `claude-code:michael`, `human:michael`) |
| `incoming_operator` | Identity (specific person, agent type, or "next session of [agent]") |
| `handoff_at` | ISO-8601 |
| `outgoing_session_started` | ISO-8601 |
| `outgoing_session_last_action_at` | ISO-8601 |
| `handoff_tag` | Git tag (e.g. `handoff/2026-05-08/claude-to-codex`) |

### Section: Repo state at handoff
| Field | Description |
|---|---|
| `branch` | Current branch |
| `head_commit` | HEAD hash + message |
| `working_tree_status` | clean / dirty-tracked / dirty-untracked / dirty-mixed |
| `manifest_mode` | Mode at time of handoff (`handoff`) |
| `previous_mode` | Mode prior to handoff |

### Section: What was just done
- Last 3–10 meaningful actions (bullet list)
- Headline result of the outgoing session (1-2 sentences)
- References to longer artifacts (links / paths) for full context

### Section: What's next
- Ordered list of actionable items, each specific enough to start without questions
- At least one item required (cannot be empty)
- Open decisions / blockers in a sub-section (separate from "next")

### Section: Gotchas
- Any "things the incoming operator should know that aren't obvious"
- May be marked "no known gotchas" if genuinely none — but the section must exist
- Failure paths the outgoing operator already tried (so incoming doesn't repeat)

### Section: Commands & access
| Field | Description |
|---|---|
| `test_command` | Verbatim shell command |
| `lint_command` | Verbatim |
| `type_check_command` | Verbatim or `n/a` |
| `build_command` | Verbatim or `n/a` |
| `deploy_command` | Verbatim or `n/a` |
| `required_tooling_versions` | List (node version, python version, etc.) |
| `credential_locations` | File paths only — no secrets |

### Section: Risks & required skills
- Outstanding risks / known issues
- Skills required of the incoming operator (so target can self-verify fit)
- Time-sensitive items flagged (if any)

### Section: References
- Link to relevant audit-trail entries
- Link to relevant decision-log entries (if used)
- Link to relevant prior artifacts (pause-state, audit reports, etc.)
- Link to repo-specific docs the incoming operator should read

## Validation rules

1. All required sections must exist as headers.
2. All required fields within sections must be non-empty.
3. "What's next" must have at least one specific actionable item (not "continue working").
4. No secrets / API keys / passwords anywhere in the report (validated by secrets scanner).
5. Header timestamps must be self-consistent: `outgoing_session_started ≤ outgoing_session_last_action_at ≤ handoff_at`.

## Markdown rendering example

See `templates/handoff.template.md` for the canonical layout. Skeleton:

```markdown
# Handoff: [outgoing] → [incoming]

**Handoff at:** 2026-05-08T17:30:00Z
**Tag:** handoff/2026-05-08/claude-to-codex

## Header
- Outgoing: claude-code:michael (session 2026-05-08T13:00Z → 17:25Z)
- Incoming: codex
- Manifest mode at handoff: handoff
- Previous mode: stabilize

## Repo state
- Branch: feature/auth-refactor
- HEAD: a1b2c3d "Refactor token validation"
- Working tree: clean
- All universal validation: passing

## What was just done
- Refactored token validation: extracted `validateToken` from `auth.ts` into `utils/token.ts`
- Updated 3 call sites
- Added 5 unit tests for the new module
- Headline: token validation now isolated; integration with sessions is next

(Full session log: `SESSION_LOG.md` lines 1042–1089)

## What's next
1. **Wire `utils/token.ts` into `session.ts`**. Specific: in `session.ts:215`, replace inline token validation with `import { validateToken } from './utils/token.js'`.
2. **Update integration test**: `session.test.ts:88` — currently failing with `MockClock undefined`; fix is to import `MockClock` from `test-utils.ts:12`.
3. **Run full test suite** before committing the integration changes.

### Open decisions / blockers
- Whether to keep the legacy `auth.ts` shim or delete it (decision deferred to after integration tests pass).

## Gotchas
- `npm install` in `worker/` directory uses pnpm (workspace setup). Use `pnpm install` from repo root instead.
- The `MockClock` helper has a non-obvious side effect: it freezes Date.now() globally for the test process. Reset with `MockClock.restore()` in afterEach.
- Tried using vitest's built-in fake timers; they don't play nice with our async middleware. Stick with MockClock.

## Commands & access
- Test: `npm test`
- Lint: `npm run lint`
- Type check: `npm run typecheck`
- Build: `npm run build`
- Deploy: n/a — not deploying this branch
- Required: Node 20.x, pnpm 8.x
- Credentials: see `.env.example`; actual `.env` is at `~/.config/myapp/.env` (do not commit)

## Risks & required skills
- Risk: integration test was passing before refactor; if it still fails after Mock fix, deeper issue exists.
- Skills required: TypeScript, async testing patterns, familiarity with our auth flow.
- Time-sensitive: target merge by 2026-05-09 EOD for v1.2.3 release.

## References
- Audit trail: `.governance/audit-trail.md` lines 234–289 (this session)
- Decision log: `decisions/2026-05-08-extract-token-validation.md`
- Prior pause-state (start of session): `.governance/artifacts/2026-05-08-pause-state.md`
- Architecture overview: `MASTER.md` lines 200-450 (auth section)
```
