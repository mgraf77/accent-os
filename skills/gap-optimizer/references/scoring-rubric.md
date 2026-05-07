# gap-optimizer — Scoring Rubric

> Tunable. Edit weights freely; the optimizer reads this at run time.

## Composite formula

```
score = (Impact × Frequency × Buildability) ÷ Cost
```

Each dimension is a 1–5 integer. Composite range: 0.2 (worst, 1×1×1÷5) → 125.0 (best, 5×5×5÷1).

Why multiply impact/frequency/buildability and divide by cost: these dimensions compound — a high-impact, high-frequency skill that's hard to build is *not* additively penalized, it's hammered. A skill that scores 5/5/5/5 still beats one that scores 5/5/5/1 (125 vs 25 if cost were also multiplicative — instead 125 vs 625, which would reward cheap throwaways too much). Multiplying impact-axis dimensions and dividing by cost gives the right curve: cheap-and-good beats expensive-and-good, but expensive-and-killer-impact still shows up at the top.

## Impact (1–5) — vision-gap closure

| Score | Meaning | Signal |
|-------|---------|--------|
| 5 | Closes a Capability Ladder L4–L6 gap (draft / predict / autonomous) | Cited in MASTER.md §14 + ladder |
| 4 | Closes a BUILD_PLAN Track 6 integration gap | Cited in BUILD_PLAN_CLAUDE.md as pending integration |
| 3 | Closes a meta-infra gap (skill-ecosystem self-maintenance) | Cited in `_index.md` future-state |
| 2 | Closes a domain operations gap that's not on the critical path | Mentioned in MASTER but not flagged as blocking |
| 1 | Quality-of-life skill, no vision citation | Useful but not gap-closing |

Rule of thumb: if a skill would earn a row in the README's "what AccentOS can do that competitors charge for," it's a 4 or 5.

## Frequency (1–5) — invocation rate

| Score | Meaning | Signal |
|-------|---------|--------|
| 5 | Daily — invoked every session or near-every | PROMOTE in efficiency-monitor with ≥5 separate sessions, or daily ops (daily-brief-composer) |
| 4 | Weekly — used in weekly cadence work | weekly-cadence skills (bc-business-review precedent) |
| 3 | Monthly — used in monthly review or specific events | monthly review, vendor onboarding waves |
| 2 | Quarterly — used in periodic deep-work | vendor risk register, KPI catalog refresh |
| 1 | One-off / annual | rare ad-hoc analyses |

Default to 3 if no signal — it's the safe-middle estimate. Override upward only with a citation.

## Buildability (1–5) — clarity + unblocked-ness

| Score | Meaning |
|-------|---------|
| 5 | Clear scope, no blockers, all data/APIs available, similar skill exists as precedent |
| 4 | Clear scope, no blockers, requires one new pattern (acceptable risk) |
| 3 | Clear scope but one M-task blocker exists OR data shape is uncertain |
| 2 | Two+ blockers OR scope requires a discovery step before forge |
| 1 | Vision-stated but architectural pieces missing — not forgeable yet |

Hard rule: if **any** unresolved M-task in `BUILD_PLAN_MICHAEL.md` blocks this skill (data access, credentials, schema not run), buildability ≤ 2.

## Cost (1–5) — forge + maintenance burden

| Score | Meaning | Forge time + ongoing |
|-------|---------|----------------------|
| 1 | Tiny — one-page SKILL.md, no references, no Ralph iterations | <1h forge, ~zero ongoing |
| 2 | Small — SKILL.md + one references file, 1-2 Ralph iterations | 1-3h forge, light ongoing |
| 3 | Medium — full SKILL.md + 2-3 references, 3 Ralph iterations | 3-6h forge, periodic refresh |
| 4 | Large — multi-file skill, scripts, hooks, several Ralph iterations | 6-10h forge, regular maintenance |
| 5 | Major — new skill + amends to existing skills + new hooks + script + cross-cutting docs | >10h forge, ongoing investment |

`vibe-speak` is a 5. `bulk-meta-description` is a 2. Most domain skills are 2-3.

## Tie-breakers

When two candidates share the same composite score:
1. Higher Impact wins (the long-term game)
2. Then higher Buildability (ship-the-ready-thing)
3. Then lower Cost
4. Then alphabetical by skill name (deterministic)

## Calibration

The rubric is designed so that a typical "ship-now" skill lands around 24–48 (e.g. 4×3×4÷2 = 24; 5×3×4÷1 = 60). A 100+ score is rare — saved for the obvious next moves. A <10 score should not be ranked top-3 unless the queue is otherwise empty.

If after 3 cycles the top-3 consistently score >60 or <20, recalibrate dimension definitions — don't change the formula.

## Why these dimensions, not others

Considered and rejected:
- **Reversibility** — skills are easy to delete, doesn't matter
- **Risk** — captured in Buildability (M-task blockers) + Cost (Ralph iteration count)
- **Strategic priority** — captured in Impact (vision citation strength)
- **Dependency depth** — captured in Buildability (one blocker = score 3, two = score 2)

Keep the formula stable. Re-running with shifted weights mid-loop breaks the gap-log.md trend signal.
