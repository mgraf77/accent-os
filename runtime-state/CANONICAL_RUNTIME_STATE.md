# CANONICAL RUNTIME STATE — checkpoint cp-0001

> Single low-entropy "what is true now". Overwritten per checkpoint.
> Read this BEFORE any other doc each session.
> tag: CORE

## 1. Meta
last_updated:        2026-05-09
last_checkpoint_id:  cp-0002
current_mode:        Passive Audit
phase:               P1 held (codex protocol P0 design-only added)

## 2. Active Build Surface
- quote-gen:        UI shipped at 940e7f8; AI Parse blocked by proxy 400 (see WIP).
- worker-proxy:     code at 2dca2a6 in tree, NOT redeployed; previous deploy still live.
- internal-meetings: v1.0 shipped at 57940d6; stable.
- runtime-stabilizer: P0 + P1 hardening landed; held pending patch-0001 + R1.
- codex-execution-lane: protocol P0 design-only; no queue, no tasks, no execution.
- vibe-speak:       active skill (default mode `vibe`).
- efficiency-monitor: always-on observer skill.
- skills-router:    `skills/_index.md` registry.

## 3. In-Flight Work
pointer: WORK_IN_PROGRESS.md
summary: Worker proxy redeploy verification + 400 root-cause for AI Parse.
         Three-step plan in WIP (verify deploy; capture upstream response; verify model id).
         No code on this stabilization branch touches the worker.

## 4. Last Known Good
commit:        940e7f8
checkpoint_id: lkg-0001
captured_at:   2026-05-09 (provisional seed; see LAST_KNOWN_GOOD_STATE.md caveats)

## 5. Open Mutations
- patch:patch-0001 owner:human ETA:next-session status:proposed
  scope: CLAUDE.md AUTO-EXECUTE step — pre-read CANONICAL_RUNTIME_STATE before BUILD_PLAN.
  class: C5 (governance). Plan only at P1; not applied.

## 6. Active Risks (top 5)
pointer: runtime-state/ACTIVE_RISKS.md
- R1 sev:HIGH worker-redeploy-uncertainty       AI Parse blocked until verified.
- R2 sev:MED  model-id-sunset-unknown           `claude-sonnet-4-20250514` unverified.
- R3 sev:MED  oversized-files                   index.html >700KB; tracked gotcha.
- R4 sev:MED  stale-doc-divergence              canonical state vs WIP/BUILD_PLAN drift.
- R5 sev:MED  governance-overhead-for-solo      P0 surface area large for one operator.

## 7. Suspended Areas
- (none)

## 8. Runtime Health (snapshot)
RCI:           null   (M2/M3 not computable until P3)
entropy_delta: null   (baseline missing)
gov_lag:       0d     (DER seed item promoted same cycle)
cv:            null
rv:            null
runtime_health: null

## 9. Next Required Read
1. runtime-state/CURRENT_PRIORITIES.md
2. runtime-state/ACTIVE_RISKS.md
3. WORK_IN_PROGRESS.md
4. policies/CODEX_EXECUTION_PROTOCOL.md (only if a Codex task is being considered)
