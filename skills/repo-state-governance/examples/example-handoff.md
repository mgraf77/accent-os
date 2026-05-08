# Example: AI handoff (Claude → Codex)

End-to-end demonstration of the `ai-handoff` workflow with cross-agent transfer.

---

## Setup

### Initial state

**Repo:** `data-pipeline`
**Branch:** `feature/snowflake-connector`
**Manifest:** `current_mode = "stabilize"`, entered by `claude-code:michael`

**Working tree:** clean

**Recent activity (last 4 commits on this branch):**
- `9b8a7c6` "Add Snowflake connection class with retry logic"
- `8a7b6c5` "Add unit tests for Snowflake retry behavior"
- `7c6b5a4` "Wire Snowflake connector into pipeline runner"
- `6b5a4c3` "Update docs/CONNECTORS.md to include Snowflake"

**Validation:** all passing

---

## Trigger

Michael at 17:30Z: "I want to hand this off to Codex to write the integration tests against a real Snowflake instance — Codex has better Snowflake-specific tooling. Tag the handoff."

---

## Workflow: ai-handoff

### Phase 1 — Stabilize (close out)

Agent runs:
- `git status` → clean
- `npm test` → passing
- `npm run lint` → passing

Stabilize criteria already met (we entered the workflow from a clean stabilize state). No additional commits needed.

**Phase 1 checkpoint:** ✓

### Phase 2 — Handoff

Agent generates handoff report at `.governance/artifacts/2026-05-08-handoff-claude-to-codex.md`:

```markdown
# Handoff: claude-code:michael → codex

**Schema version:** 1
**Handoff at:** 2026-05-08T17:35:00Z
**Tag:** handoff/2026-05-08/claude-to-codex

## Header
- Outgoing operator: claude-code:michael (session 2026-05-08T14:00Z → 17:30Z)
- Outgoing session last action at: 2026-05-08T17:25:00Z
- Incoming operator: codex
- Manifest mode at handoff: handoff
- Previous mode: stabilize

## Repo state at handoff
- Branch: feature/snowflake-connector
- HEAD commit: 6b5a4c3 "Update docs/CONNECTORS.md to include Snowflake"
- Working tree: clean
- Universal validation: passing
- Manifest path: repo-manifest.json

## What was just done
- Added `SnowflakeConnector` class with exponential-backoff retry logic in `src/connectors/snowflake.ts`
- Added 12 unit tests covering connection, retry, and error paths in `src/connectors/snowflake.test.ts`
- Wired the connector into the pipeline runner at `src/pipeline/runner.ts` (lines 142-180)
- Updated documentation at `docs/CONNECTORS.md` to include Snowflake setup and configuration

**Headline result:** Snowflake connector class is feature-complete and unit-tested. Integration testing against a real Snowflake instance is the remaining work.

**Longer-form references:**
- SESSION_LOG: lines 2105-2186
- Decision log: decisions/2026-05-08-retry-strategy.md (rationale for exponential vs. linear backoff)

## What's next
1. **Set up Snowflake test instance.** Use the team's shared dev account; credentials in 1Password vault entry "Snowflake Dev". Account name: `acme-dev.snowflakecomputing.com`. Connection params expected: see `src/connectors/snowflake.ts:24-38`.
2. **Write integration test suite.** Create `tests/integration/snowflake.integration.test.ts`. Pattern: see existing Postgres integration tests at `tests/integration/postgres.integration.test.ts:1-200`. Should cover: connect, simple query, retry on transient error, graceful failure on permanent error.
3. **Add CI integration-test workflow.** Currently CI only runs unit tests; integration tests need a separate workflow that uses the dev Snowflake account. Add `.github/workflows/integration-snowflake.yml`. Trigger: push to `feature/snowflake-*` branches.
4. **Verify and merge.** Once integration tests pass in CI, open PR to merge into `develop`.

### Open decisions / blockers
- Whether to mock Snowflake-specific error types (e.g. `SnowflakeServiceUnavailable`) or trust real-instance behavior. Leaning real-instance to catch actual error shapes, but performance / cost is a concern.

## Gotchas
- **Snowflake auth uses key-pair, not password.** The Connector class supports both via constructor params, but team prefers key-pair. Key file path is `~/.snowflake/dev_key.p8` on the dev account.
- **Snowflake's "transient error" classification differs from Postgres.** Don't reuse the Postgres retry-classifier directly; we have a Snowflake-specific one at `src/connectors/snowflake-retry.ts:18`.
- **Integration tests are slow** (real network). Allocate ~30s per test in timeouts. Default Vitest timeout is too short.

### Failure paths already tried
- Tried mocking Snowflake's HTTP layer — too brittle, mocks didn't match actual response shapes. Use real instance instead (rationale documented in decisions/2026-05-08-retry-strategy.md).
- Tried using snowflake-sdk's built-in retry — it conflicts with our pipeline-level retry; we wrap it instead.

## Commands & access
| Item | Value |
|---|---|
| Test (unit) | `npm test` |
| Test (integration) | `npm run test:integration` (does not exist yet — to be created) |
| Lint | `npm run lint` |
| Type check | `npm run typecheck` |
| Build | `npm run build` |
| Deploy | n/a — feature branch, not deploying |
| Required tooling | Node 20.x, pnpm 8.x, Snowflake account access |
| Credential locations | 1Password vault "Snowflake Dev"; key file `~/.snowflake/dev_key.p8` |

## Risks & required skills
### Outstanding risks
- Risk: Snowflake API changes between SDK versions; pin SDK version explicitly in package.json.
- Risk: Dev account quota — heavy integration test runs could exhaust the dev quota. Use sparingly during development; consider a dedicated CI account if usage grows.

### Required skills
- TypeScript / Vitest
- Snowflake account familiarity (provisioning, key-pair auth, query execution)
- CI workflow authoring (GitHub Actions specifically)

### Time-sensitive items
- None hard-deadlined; targeting end-of-week merge into develop.

## References
- Audit trail: `.governance/audit-trail.md` lines 312-345 (this session)
- Decision log: `decisions/2026-05-08-retry-strategy.md`
- Architecture overview: `docs/ARCHITECTURE.md` (Connectors section, lines 200-300)
- Postgres integration test reference: `tests/integration/postgres.integration.test.ts`
```

Agent runs handoff-completeness evaluator:
- All Required categories pass
- Q1 (length appropriate): pass — 1.2KB, readable
- Q2 (clear language): pass
- Q3 (no secrets): pass — credential locations are paths only
- Verdict: COMPLETE ✓

Agent commits the report. Tags handoff point: `git tag handoff/2026-05-08/claude-to-codex`.

Agent updates manifest:
```json
{
  "schema_version": 1,
  "current_mode": "handoff",
  "entered_at": "2026-05-08T17:35:00Z",
  "entered_by": "claude-code:michael",
  "previous_mode": "stabilize",
  "next_allowed_transitions": ["stabilize", "pause", "audit", "freeze", "sandbox", "deploy-prep", "extraction-prep", "governance-transition", "recovery"],
  "validation_tier": "language-specific",
  "handoff_to": "codex"
}
```

Audit trail entry:
```markdown
## 2026-05-08T17:35:00Z stabilize → handoff
- operator: claude-code:michael → codex
- workflow: ai-handoff
- artifacts: .governance/artifacts/2026-05-08-handoff-claude-to-codex.md
- entry-conditions: pass
- completion: complete (handoff-completeness: COMPLETE)
- notes: handoff for Snowflake integration testing; tag handoff/2026-05-08/claude-to-codex
```

Agent surfaces to Michael: "Handoff complete. Report committed at `.governance/artifacts/2026-05-08-handoff-claude-to-codex.md`. Tag `handoff/2026-05-08/claude-to-codex` created. Next: notify Codex via [comm channel] and have it run safe-resumption on session start."

---

## Codex picks up (next session)

Codex starts a session, reads the manifest, sees `current_mode = "handoff"` with `handoff_to = "codex"`. It runs the `safe-resumption` workflow:

- Phase 1: reads `.governance/artifacts/2026-05-08-handoff-claude-to-codex.md` in full
- Phase 2: lightweight audit — drift check vs. handoff time. No drift on `feature/snowflake-connector`. Validation passing.
- Phase 3: validates next action — confirms `tests/integration/postgres.integration.test.ts` exists at the referenced lines (it does); confirms 1Password vault entry name matches (Codex has access; verifies credential is fetchable but does not store secret).
- Phase 4: transitions to `stabilize` and begins work on integration tests.

Audit trail records the chain.

---

## Outcome

- Cross-agent handoff completed cleanly with comprehensive context transfer
- Codex picked up cold and started productive work without questions
- Tag `handoff/2026-05-08/claude-to-codex` provides a stable reference point for future audits
- Audit trail tells the full story of the agent transition

## What this example demonstrates

- Cross-agent handoffs require **explicit operator-type considerations** (Snowflake-specific tooling for Codex vs. Claude)
- Failure-path documentation (what was tried and rejected) prevents the incoming agent from repeating dead ends
- Credential locations as **paths only** — never values — protects secrets even if the report is committed
- Handoff-completeness evaluator catches missing context before commit
- The handoff tag in git provides a permanent reference even if branches are later deleted
