# GOTCHA REGISTER

## Purpose
Catalog of known anti-patterns ("gotchas") with detection logic, severity, auto-fix
eligibility, escalation rules, and rollback behavior. Read by AUDIT_LOOP every cycle and
by Gotcha Detection mode every session.

## Required Sections of an Entry
1. **id** — short slug (e.g. `arch-drift`).
2. **title** — one line.
3. **detection** — bash- or grep-style detection rule (deterministic).
4. **severity** — CRIT / HIGH / MED / LOW (default; can escalate via context).
5. **auto-fix eligibility** — yes (which Auto-Fix class) / no.
6. **escalation rule** — when to escalate even if individually low.
7. **rollback** — what reverting looks like.
8. **first_seen** — date or `n/a`.
9. **status** — `tracking` / `mitigated` / `recurring` / `closed`.

## Update Rules
- Adding a gotcha: C5 governance edit (this file is policy).
- Adding observations of an existing gotcha: appended to `audits/AUDIT_LOG.md`, not here.
- Closing a gotcha requires evidence of 2 consecutive clean cycles.

## Ownership Rules
- Write: human or Plan-Then-Execute.
- Read: every audit, every mode entering plan-then-execute.

## Compression Standards
- Each gotcha entry ≤ 10 lines.
- Detections must be testable in a single command line where possible.

## The Catalog (v0.1)

```
id:          arch-drift
title:       Architectural drift — files moving outside their declared module boundary
detection:   Module boundary manifest mismatch (P2+); pre-P2: manual review of new top-level dirs
severity:    HIGH
auto-fix:    no
escalation:  immediate (E6) on detection
rollback:    revert offending commit; restore prior dir layout
first_seen:  n/a
status:      tracking
```
```
id:          oversized-files
title:       File size exceeding pragmatic threshold (>30k LoC for code, >2k lines for docs)
detection:   `find . -type f \( -name '*.js' -o -name '*.html' \) -size +500k` ;
             `wc -l <doc>` for tracked docs vs. doc-specific cap
severity:    MED (HIGH if root-of-app file)
auto-fix:    no
escalation:  E10 if recurring 3 cycles
rollback:    n/a (refactor required, planned)
first_seen:  n/a (note: index.html is currently >700KB — already in this category)
status:      tracking
```
```
id:          orchestration-fragility
title:       Multi-step external dependencies (deploy chains, proxies) without a smoke test
detection:   Manual review of worker/, wrangler.toml, fetch-call sites in index.html
severity:    HIGH
auto-fix:    no
escalation:  E1 when production outage observed
rollback:    redeploy LKG worker version + revert client changes
first_seen:  2026-05-07 (proxy 400 issue per WORK_IN_PROGRESS)
status:      tracking
```
```
id:          stale-documentation
title:       Doc claims do not match code/state
detection:   GAP_DETECTION_LOOP G1, G4
severity:    MED
auto-fix:    A1 (text-only typo class only)
escalation:  E10 if recurring
rollback:    revert doc edit
first_seen:  n/a
status:      tracking
```
```
id:          prompt-divergence
title:       Prompt patterns drifting between PROMPT_LOG entries on similar tasks
detection:   Manual diff over PROMPT_LOG.md; later automated against an embedding cluster
severity:    LOW
auto-fix:    no
escalation:  none unless paired with reliability regression
rollback:    n/a
first_seen:  n/a
status:      tracking
```
```
id:          module-boundary-violation
title:       Cross-module imports/calls violating declared boundaries
detection:   Module manifest comparison (P2+); pre-P2: deferred
severity:    HIGH
auto-fix:    no
escalation:  immediate (E6)
rollback:    revert offending commit
first_seen:  n/a
status:      deferred (no manifest yet)
```
```
id:          duplicated-logic
title:       Same logic implemented in 2+ places, drifting independently
detection:   Manual review; later: AST/embedding similarity above threshold
severity:    MED
auto-fix:    no
escalation:  E10 if 3 cycles unresolved
rollback:    n/a (refactor)
first_seen:  n/a
status:      tracking
```
```
id:          todo-accumulation
title:       Unresolved TODO/FIXME comments accumulating
detection:   `grep -rEn 'TODO|FIXME|XXX' --include='*.js' --include='*.html' --include='*.md' .`
severity:    LOW (escalates if growth > 20% cycle-over-cycle)
auto-fix:    no
escalation:  E10 if growth threshold breached
rollback:    n/a
first_seen:  n/a
status:      tracking
```
```
id:          context-pollution
title:       Documents accumulating speculation, dead branches, or future-dated content in canonical files
detection:   Forbidden phrases ("might", "could", "future:") in CANONICAL_RUNTIME_STATE
severity:    MED
auto-fix:    no (move to DER, not edit here)
escalation:  E7 if canonical state itself is polluted
rollback:    revert to prior canonical state
first_seen:  n/a
status:      tracking
```
```
id:          governance-drift
title:       Governance files edited without a recorded patch plan or escalation
detection:   `git log -- governance/ stable-evolution-runtime/ policies/` vs. delta entries
severity:    HIGH
auto-fix:    no
escalation:  immediate (E5 / S1)
rollback:    revert governance edit
first_seen:  n/a
status:      tracking
```
```
id:          reliability-regression
title:       A patch increases failure rate on repeated operations (deploy, parse, etc.)
detection:   Compare recent SESSION_LOG outcomes vs. prior cycle baseline
severity:    HIGH
auto-fix:    no
escalation:  E1 immediately
rollback:    revert offending patch
first_seen:  n/a
status:      tracking
```
```
id:          unstable-dependencies
title:       Pinned-but-floating deps (e.g. model IDs that may sunset, worker runtime drift)
detection:   Manual list maintained at registers/COMPLEXITY_LEDGER (P2+)
severity:    MED (HIGH for security-sensitive deps)
auto-fix:    no
escalation:  E1 on observed sunset
rollback:    pin to a known-good version
first_seen:  2026-05-07 (model id 'claude-sonnet-4-20250514' verification per WIP)
status:      tracking
```
```
id:          unsafe-mutations
title:       Patches that bypass MUTATION_POLICY class checks
detection:   Patch plan absent or commit touches files outside declared scope
severity:    CRIT
auto-fix:    no
escalation:  immediate (E5 / S3)
rollback:    revert + investigation
first_seen:  n/a
status:      tracking
```
```
id:          orphaned-queue-items
title:       DER items stale in near-term queue beyond 30 days, or in research beyond 90 days
detection:   GAP_DETECTION_LOOP G7
severity:    LOW (escalates to MED at 60d / HIGH at 90d for near-term)
auto-fix:    no (re-route required)
escalation:  E10
rollback:    n/a
first_seen:  n/a
status:      tracking
```
```
id:          unstable-orchestration-chains
title:       Chains of agent/tool calls without clear stop conditions or success criteria
detection:   Manual review of agent invocations in SESSION_LOG; later: chain length metric
severity:    HIGH
auto-fix:    no
escalation:  E1
rollback:    halt chain; reduce orchestration depth in next plan
first_seen:  n/a
status:      tracking
```
