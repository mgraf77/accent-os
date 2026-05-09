# ACTIVE RISKS — cycle-2026-W19

> Open risks that could destabilize the runtime.
> tag: CORE

## Meta
last_review: 2026-05-09
next_review: 2026-05-16

## Risk Table

```
R1. worker-redeploy-uncertainty           id: r-worker-redeploy
    severity:    HIGH
    likelihood:  expected
    owner:       Michael
    trigger:     Worker at 2dca2a6 not yet redeployed → AI Parse 400 persists.
    mitigation:  Run wrangler deploy from local terminal; verify via console fetch.
    status:      open

R2. model-id-sunset-unknown               id: r-model-id
    severity:    MED
    likelihood:  possible
    owner:       Michael
    trigger:     `claude-sonnet-4-20250514` may be deprecated or renamed at any time.
    mitigation:  Verify model id on next Parse call; pin to a confirmed id.
    status:      open

R3. oversized-files                       id: r-oversized-index
    severity:    MED
    likelihood:  expected
    owner:       (deferred)
    trigger:     index.html is currently ~700KB; refactor pressure increasing each cycle.
    mitigation:  No active mitigation; tracked as gotcha `oversized-files`.
    status:      open

R4. stale-doc-divergence                  id: r-doc-divergence
    severity:    MED
    likelihood:  likely
    owner:       runtime-stabilizer
    trigger:     CANONICAL_RUNTIME_STATE may drift from WIP/BUILD_PLAN if not refreshed.
    mitigation:  Pre-read CANONICAL state at session start (CLAUDE.md patch proposed).
    status:      mitigating

R5. governance-overhead-for-solo          id: r-gov-overhead
    severity:    MED
    likelihood:  likely
    owner:       runtime-stabilizer
    trigger:     27 P0 spec files + 7 modes + 11 metrics may exceed solo-operator budget.
    mitigation:  GOVERNANCE_COMPRESSION_REVIEW + P1_SIMPLIFICATION_PASS this commit.
    status:      mitigating
```

## Watchlist (sub-threshold)
- w1. orchestration-load-creep — chains of agent/tool calls trending longer; revisit at cycle close.
- w2. canonical-state-bypass — if next session ignores pre-read order, R4 escalates.

## Closed Since Last Review
(none — first review)
