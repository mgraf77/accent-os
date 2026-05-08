# KNOWN ISSUES
> Updated: 2026-05-08

---

## Active Issues

### ISSUE-001: Quote Generator — Worker proxy not redeployed
- **Severity:** Medium (feature broken, rest of app unaffected)
- **Symptom:** "⚡ Parse Notes" returns 400 from Cloudflare Worker
- **Root cause:** Code fix in commit `2dca2a6` was never deployed via `wrangler deploy`
- **Blocked by:** Michael must run `wrangler deploy` from local Windows machine
- **Workaround:** None — Parse Notes is non-functional until redeployed
- **Files affected:** `worker/anthropic-proxy.js`

---

## Latent Risks (non-blocking)

### RISK-001: skill-optimizer improvement-queue growth
- If the queue reaches 50+ entries without consolidation, it becomes unwieldy to read
- Mitigation: SKILL.md anti-patterns section warns against this; consolidation should be done at session end
- Not a current issue — queue is empty

### RISK-002: CLAUDE.md step 1k reads two files at boot
- Both `improvement-queue.md` and `session-end-summary.md` are now read at session start
- If either file is missing (e.g., after repo clone or skill-optimizer deletion), boot silently fails on that step
- Mitigation: Both files exist and are committed with safe defaults

### RISK-003: Governance research not yet per-system
- `SYSTEM_GOVERNANCE_RESEARCH_HANDOFF_v1.md` is a universal framework
- No system has yet had the governance primitives applied
- Risk: governance restructuring proceeds without this reference being used
- Mitigation: document is in `research/` and easily discoverable

### RISK-004: WORK_IN_PROGRESS.md reflects old (pre-this-session) state
- WIP.md still references the worker proxy bug as the active task
- Should be updated to reflect clean pause state
- No operational impact — documentation gap only

---

## No-action items
- All other skills are unchanged and operational
- No broken imports (skills/ is all markdown, no code dependencies)
- No test suite failures (no test suite exists yet — tracked in BUILD_PLAN)
