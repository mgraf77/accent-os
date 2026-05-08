# AccentOS — Handoff for Governance Restructuring

> Generated: 2026-05-07
> Branch: `claude/ai-task-router-7iRmZ`
> Status: CLEAN PAUSE — tree clean, all pushed, no in-flight work

---

## What Was Built (This Branch)

The `ai-task-router` skill — an always-on AI command center that:
- Classifies every incoming task into 1 of 15 task types
- Scores 8 tools across 8 dimensions using weighted composites
- Surfaces a routing nudge when another tool scores ≥25% higher than Claude Code
- Stays silent when Claude Code wins; active mode produces a full breakdown on `/route`
- Is token-budget aware, tier-aware, and self-updating (daily model-version check)
- Hooks into `.claude/CLAUDE.md` AUTO-EXECUTE step 1j and vibe-speak Step 23

**Optimization loops completed:** 5 loops, 23 total fixes across all skill files.

---

## Files Modified / Created (This Branch)

### New files:
- `skills/ai-task-router/SKILL.md` — core skill (7 steps, 13 anti-patterns)
- `skills/ai-task-router/references/tool-registry.md` — 8 tools × 15 task types × 8 dims
- `skills/ai-task-router/references/scoring-matrix.md` — weights + gap formula + thresholds
- `skills/ai-task-router/references/task-taxonomy.md` — 15 task type signal tables
- `skills/ai-task-router/references/tier-config.md` — Michael's account tiers + TC overrides
- `skills/ai-task-router/references/model-versions.md` — current model versions + staleness tracker
- `skills/ai-task-router/routing-log.md` — append-only nudge outcome log (empty)
- `skills/ai-task-router/routing-defaults.md` — persistent /route default overrides (empty)

### Modified files:
- `.claude/CLAUDE.md` — added AUTO-EXECUTE step 1j (ai-task-router load hook)
- `skills/_index.md` — added ai-task-router registry entry
- `PROMPT_LOG.md` — session entries
- `WORK_IN_PROGRESS.md` — updated
- `SESSION_LOG.md` — session entry appended
- `PROMPT_QUEUE.md` — tier confirmation reminders added

---

## Systems Touched

| System | What Changed | Coupling Level |
|---|---|---|
| `.claude/CLAUDE.md` | Added step 1j load hook | High — session-start critical path |
| `skills/_index.md` | Added ai-task-router entry | Low — additive only |
| `skills/ai-task-router/` | New skill (8 files) | Self-contained |
| `skills/vibe-speak/` | Referenced but not modified | Read dependency only |

---

## Architectural Assumptions Made

1. **Skill files are read + cached at session start** — assumes CLAUDE.md AUTO-EXECUTE runs synchronously before any user task
2. **Effective TC scores are computed at runtime** — base scores in tool-registry.md are NOT the same as the scores used for routing; tier-config overrides are applied each session
3. **routing-log.md is append-only in the repo** — writes happen during sessions; concurrent sessions would create merge conflicts on this file
4. **routing-defaults.md is a flat text override file** — no schema enforcement; format is human-maintained
5. **Step 7 model-update check uses WebSearch** — depends on WebSearch MCP being available; degrades gracefully if not

---

## Pending Actions (Michael Required)

| Action | File to Update | Impact |
|---|---|---|
| Confirm Claude.ai tier (Free vs Pro) | `tier-config.md` | Affects brainstorm/cross-check/doc-write routing |
| Confirm Dispatch plan | `tier-config.md` | Affects automation routing |
| Confirm Routines plan | `tier-config.md` | Affects automation routing |

---

## Known Issues / Risks

| Risk | Severity | Notes |
|---|---|---|
| Branch not merged to main | Low | All work on `claude/ai-task-router-7iRmZ`; merge after governance restructure if appropriate |
| routing-log.md concurrent writes | Low | Only one active session at a time in current usage; becomes medium risk if multi-agent setup runs |
| Tier unconfirmed for 3 tools | Low | Router flags these as "(tier unconfirmed)"; routing still works, scores are conservative placeholders |
| Step 7 model-update check untested in live session | Medium | Logic is correct but has never actually fired; first live run will validate search query format |
| No automated test for composite score math | Low | Scoring is done in-context; wrong weights or score values won't be caught automatically |

---

## What Belongs Where (Governance Restructuring Guide)

| Component | Current Location | Likely Future Home | Notes |
|---|---|---|---|
| `skills/ai-task-router/` | AccentOS repo | **Skills repo** or **AgentOS** | Pure meta-skill — no AccentOS product logic; would work in any Claude Code session |
| `.claude/CLAUDE.md` AUTO-EXECUTE hook | AccentOS | **AccentOS** (stays) | Project-specific session config |
| `skills/_index.md` registry | AccentOS | **Skills repo** | Should be the central registry if skills are extracted |
| Tool score data (tool-registry.md) | AccentOS | **Skills repo** | Session-agnostic capability data |
| Tier configuration (tier-config.md) | AccentOS | **AccentOS** or **per-user config** | Michael-specific; not generalizable |
| routing-log.md / routing-defaults.md | AccentOS | **Session state store** (future) | Should live outside repo if multi-user |

---

## Areas of High Coupling

1. **CLAUDE.md ↔ all skills** — AUTO-EXECUTE is the activation mechanism for every skill. If CLAUDE.md structure changes in governance restructure, all skill hooks need to be re-evaluated.
2. **vibe-speak Step 23 ↔ ai-task-router** — the skill router in vibe-speak references ai-task-router; any rename or move of the skill breaks this reference.
3. **skills/_index.md** — single registry file; becomes a merge conflict hotspot if multiple branches add skills simultaneously.

---

## Incomplete Abstractions

- **routing-defaults.md** — defined but empty; no `/route default` has ever been executed. The file + schema are ready but untested.
- **Pattern detection** (Step 6) — the "≥3 accepted routes → suggest default" logic is specified but has zero data to trigger on (routing-log.md is empty). Will auto-activate once real routing happens.
- **`/route review scores`** — Step 7 flags rows for review but this command has never been used. REVIEW comment format is defined; the review workflow is not tested.

---

## Recommended Next Steps (Post Governance Restructure)

1. **Merge this branch** to main (or whatever target branch governance establishes)
2. **Confirm the 3 tiers** — 15-minute task; unblocks accurate routing immediately
3. **Let the skill run live for 1 week** — routing-log.md will accumulate real data; pattern detection and score accuracy can be tuned from actual outcomes
4. **If skills are extracted to a separate repo** — ai-task-router is the cleanest extraction candidate; zero product logic, no Supabase or BigCommerce dependencies
5. **Consider routing-log.md rotation** — currently defined at 300 entries / 75KB ceiling; may want to move to session-local storage if repo size becomes a concern

---

## Operational Status

```
Branch:           claude/ai-task-router-7iRmZ
Tree state:       CLEAN (nothing uncommitted)
Last commit:      f3bf251 — session wrap
App functional:   Yes — no broken imports; skill is additive only
Core AccentOS:    Unmodified — no product code touched this branch
Merge risk:       LOW — only new files + 2 additive edits to CLAUDE.md and _index.md
Resumable:        YES — WORK_IN_PROGRESS.md current, pending actions documented
```

---

*This document was generated at session end. Do not modify during governance restructuring — treat as a point-in-time snapshot.*
