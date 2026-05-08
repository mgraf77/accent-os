# HANDOFF FOR GOVERNANCE RESTRUCTURE
> Prepared: 2026-05-08
> Branch: `claude/self-aware-skill-optimizer-D6jEW`
> Purpose: Clean handoff context before major ecosystem-wide governance + architecture restructuring

---

## Systems Touched This Session

| System | What changed | Coupling risk |
|--------|-------------|---------------|
| `skills/skill-optimizer/` | New skill — instruction-only, no code | Low — markdown only |
| `skills/_index.md` | One entry added | Low — additive |
| `.claude/CLAUDE.md` | Two line additions (step 1k, step 8 extension) | Medium — boot chain order matters |
| `research/SYSTEM_GOVERNANCE_RESEARCH_HANDOFF_v1.md` | New research doc | None — no dependencies |
| Prior session: `worker/anthropic-proxy.js` | Patched, undeployed | Low — isolated worker |
| Prior session: `index.html` (Quote Generator) | All fetch calls point to worker | Medium — broken until worker deployed |

---

## Dependency Map

```
CLAUDE.md (boot chain)
  └── reads: skills/vibe-speak/... (steps 1a-1g)
  └── reads: skills/_index.md (step 1h)
  └── reads: skills/efficiency-monitor/session-end-summary.md (step 1j)
  └── reads: skills/skill-optimizer/improvement-queue.md (step 1k) ← NEW
  └── reads: skills/skill-optimizer/session-end-summary.md (step 1k) ← NEW
  └── at session end: writes efficiency-monitor + skill-optimizer files (step 8)

skill-optimizer
  └── observes: all skills in skills/ (passive, no file dependency)
  └── writes to: skills/skill-optimizer/skill-usage-log.md
  └── writes to: skills/skill-optimizer/improvement-queue.md
  └── writes to: skills/skill-optimizer/optimization-history.md
  └── writes to: skills/skill-optimizer/session-end-summary.md
  └── reads edits to: any target SKILL.md (when optimizing)
  └── can invoke: skill-forge (for structural rewrites)
  └── can invoke: skill-eval-suite (for post-optimization validation)
```

---

## Assumptions Made (will interact with restructuring)

1. **Skills live in `skills/`** — All skill routing, index, and CLAUDE.md references assume `skills/` at repo root. If skills/ moves to a separate repo, CLAUDE.md boot chain breaks.

2. **CLAUDE.md is the single boot authority** — The entire auto-execute chain lives in `.claude/CLAUDE.md`. If governance restructure creates multiple CLAUDE.md files or a different boot mechanism, the skill-optimizer activation in step 1k must be migrated.

3. **skill-optimizer is AccentOS-local** — It references AccentOS-specific paths, Supabase project, and BigCommerce store. It is NOT designed to be portable to AgentOS or SideKick OS without modification.

4. **skills/_index.md is manually maintained** — No automated sync. If skills are restructured across repos, the index becomes stale immediately.

5. **research/ directory is new** — First document stored there. Governance restructure should decide: does research/ belong at repo root? In a separate knowledge-base repo? Inline with docs/?

6. **improvement-queue.md uses append-only flat markdown** — Not a database, not structured JSON. Works fine at current scale (~0–50 entries). If restructure introduces a multi-agent or multi-repo scenario, this needs to become a shared datastore.

---

## What Should Be Extracted vs. Kept

### Extract to AccentOS (stays here, rename/reorganize only)
- `skills/skill-optimizer/` — AccentOS-specific skill observation layer
- `skills/_index.md` — AccentOS skill routing registry
- `.claude/CLAUDE.md` — AccentOS boot chain

### Extract to AgentOS (if restructure creates AgentOS as separate layer)
- The governance architecture in `research/SYSTEM_GOVERNANCE_RESEARCH_HANDOFF_v1.md` Part 2.6 (AI agent governance)
- The permission tier model (Tier 0–4)
- The 4-layer Human+AI interaction stack
- Multi-agent orchestration governance spec (not yet built — in NEXT_STEPS)

### Extract to Skills Repo (if skills/ becomes standalone)
- All of `skills/` directory
- `skills/_index.md`
- References within `.claude/CLAUDE.md` must update to point to new location

### Extract to Command Center (if a unified ops dashboard is planned)
- `research/SYSTEM_GOVERNANCE_RESEARCH_HANDOFF_v1.md` governance primitives
- `skills/efficiency-monitor/` session data
- `skills/skill-optimizer/` improvement-queue data

### Stays at AccentOS root regardless
- `WORK_IN_PROGRESS.md`, `BUILD_PLAN_CLAUDE.md`, `BUILD_INTELLIGENCE.md`
- `SESSION_LOG.md`, `PROMPT_LOG.md`
- App files: `index.html`, `worker/`, `js/`, `css/`

---

## High Coupling Zones (handle carefully during restructure)

| Zone | Coupling description | Risk |
|------|---------------------|------|
| `.claude/CLAUDE.md` boot chain | Any change to step ordering, file paths, or skill activation breaks session start | HIGH |
| `skills/_index.md` | vibe-speak Step 23 reads this for skill routing; stale entries = routing failures | MEDIUM |
| `efficiency-monitor` ↔ `skill-optimizer` | Both write at session end in step 8; must commit in same batch or one overwrites timing data | MEDIUM |
| `skills/skill-forge/SKILL.md` | Referenced by skill-optimizer as the structural rewrite handler; if skill-forge moves, skill-optimizer step 2c breaks | LOW |

---

## Incomplete Abstractions

1. **skill-optimizer observation is Claude-judgment-based** — there's no structured parser verifying that suggestions are generated correctly. It depends entirely on Claude following the SKILL.md instructions. A future hardening pass could add a structured output format with explicit validation.

2. **Governance primitives not instantiated** — `SYSTEM_GOVERNANCE_RESEARCH_HANDOFF_v1.md` scored 85 and authorized implementation planning, but the actual primitives (constitution template, authority map template, permission tier spec, failure mode checklist) have not been built as usable artifacts. They're described in Part 4 but not yet shipped.

3. **No skill eval suite integration** — skill-optimizer recommends invoking `skill-eval-suite` after optimizations, but no eval suite tests currently exist for any skill. The integration point is documented but untested.

---

## Duplicate Systems (flag for consolidation)

| Overlap | System A | System B | Recommended resolution |
|---------|----------|----------|----------------------|
| Session-end summaries | `efficiency-monitor/session-end-summary.md` | `skill-optimizer/session-end-summary.md` | Keep separate (different signal types) — but could consolidate into one session summary file |
| Skill quality tracking | `skill-optimizer/improvement-queue.md` | `skill-forge/gotcha-log.md` | Complementary, not duplicate — skill-optimizer catches in-session signals; gotcha-log catches forge-time issues |
| Boot output | efficiency-monitor boot block | skill-optimizer boot block | Both in step 1; currently sequential — consider merging into one `⚙ system status` block |

---

## Recommended Cleanup Opportunities (post-restructure, not now)

1. **Merge efficiency-monitor + skill-optimizer boot output** — single `⚙ AccentOS status` block instead of two sequential blocks
2. **skill-optimizer session-end-summary format** — align with efficiency-monitor's summary format so both are readable in the same context
3. **skills/_index.md auto-regeneration** — the index says it's auto-regenerable but the mechanism (`/vibe regenerate skill index`) is not implemented; either build it or remove the claim
4. **research/ directory** — decide if this is the right home for governance docs or if they belong in a `docs/` or `knowledge/` directory

---

## Areas Likely Impacted by Upcoming Governance Restructuring

1. **CLAUDE.md** — primary impact zone. Any restructure of boot sequence, permission model, or skill routing will require updating steps 1a–1k and step 8.
2. **skills/ as a directory** — if skills become a separate repo or shared package, all path references need updating.
3. **AccentOS-specific assumptions in skills** — nearly every skill has hardcoded references to AccentOS, store-cwqiwcjxes, hsyjcrrazrzqngwkqsqa. Governance restructure may require abstracting these.
4. **research/SYSTEM_GOVERNANCE_RESEARCH_HANDOFF_v1.md** — this document explicitly anticipates restructuring and has a per-system priority table. It should be the primary input to the restructure decisions.

---

## Resumability Checklist

- [x] All work committed and pushed
- [x] Branch name: `claude/self-aware-skill-optimizer-D6jEW`
- [x] Working tree is clean
- [x] WORK_IN_PROGRESS.md describes the one open issue (worker redeployment — Michael action)
- [x] SESSION_SUMMARY.md written
- [x] CURRENT_STATE.md written
- [x] NEXT_STEPS.md written
- [x] KNOWN_ISSUES.md written
- [x] This handoff document written
- [x] No experimental or debug artifacts left in repo
- [x] No architectural changes made that would conflict with governance restructure
- [ ] WORK_IN_PROGRESS.md not yet updated to clean-pause state (do in final commit)

---

*End of HANDOFF_FOR_GOVERNANCE_RESTRUCTURE.md*
