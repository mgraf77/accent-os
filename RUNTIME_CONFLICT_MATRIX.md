# RUNTIME_CONFLICT_MATRIX.md
> Session 29 — file-level + semantic conflict map across 23 active branches
> Base: `main` @ ce5853f

---

## §1 — OVERLAPPING FILES (≥2 branches modify same path)

| File | # branches | Branches |
|------|-----------|----------|
| `MERGE_PLAN.md` | 9+ | minimal-signal-runtime, consolidate-signal-system, harden-signal-dedupe, harden-runtime-escalation, harden-generator-confidence, wire-minimal-runtime, runtime-boundary-enforcement, pricing-runtime-conversion, emitter-ownership-visibility |
| `.github/workflows/deploy-worker.yml` | 16 | all Wave 3 + Wave 4 + Wave 5 branches |
| `index.html` | 7+ | wire-minimal-runtime, harden-runtime-escalation, harden-generator-confidence, pricing-runtime-conversion, emitter-ownership-visibility, operational-queue-ux-finalization, orchestration-layer-design |
| `sql/M49_signals.sql` | 3 | minimal-signal-runtime, harden-runtime-escalation, harden-generator-confidence |
| `sql/M50_pricing*.sql` | 2 | wire-minimal-runtime, pricing-runtime-conversion |
| `sql/M48_*.sql` | 2 | consolidate-signal-system, (potential renumber collision with reconcile-v2 already in main) |
| `js/jobs.js` | 3 | harden-signal-dedupe, harden-generator-confidence, harden-runtime-escalation |
| `js/module_modes.js` | 2 | harden-runtime-escalation, wire-minimal-runtime |
| `worker/anthropic-proxy.js` | 4+ | minimal-signal-runtime, harden-runtime-escalation, harden-generator-confidence, pricing-runtime-conversion |
| `docs/runtime/CLOUDFLARE_DEPLOYMENT_FLOW.md` | 3 | consolidate-signal-system, harden-operational-workflows, orchestration-layer-design |
| `KPI_CATALOG.md` | 2 | harden-signal-dedupe, (impacted by canon-enforcement-scripts indirectly) |
| `PROMPT_LOG.md`, `WORK_IN_PROGRESS.md`, `BUILD_PLAN_MICHAEL.md` | 15+ each | Session-metadata churn — NOT semantic conflicts but will produce git conflicts on every merge. Auto-resolve "ours" on main during merge wave. |
| `forbidden_runtime_patterns.json` | 2 | runtime-boundary-enforcement, emitter-ownership-visibility |

---

## §2 — LIKELY GIT CONFLICTS (textual, mechanical)

**HIGH** (same hunk likely touched):
- `sql/M49_signals.sql` across 3 branches — each defines signals schema differently.
- `js/jobs.js` across harden-signal-dedupe + harden-generator-confidence — both add dedupe / confidence gates near the same emit path.
- `worker/anthropic-proxy.js` across signal runtime + pricing branches — competing route additions.
- `MERGE_PLAN.md` across 9 branches — every branch rewrites it for its own scope.

**MEDIUM** (different hunks, same file):
- `index.html` — wire-minimal-runtime touches module wiring; harden-runtime-escalation touches escalation handlers; pricing-runtime-conversion touches pricing module. Likely sequential-resolvable.
- `.github/workflows/deploy-worker.yml` — all branches diverge from same parent. Likely identical updates.

**LOW** (mechanical):
- `PROMPT_LOG.md` / `WORK_IN_PROGRESS.md` — pure session churn. Resolve "ours".

---

## §3 — SEMANTIC CONFLICTS (compatible files, incompatible meaning)

| # | Conflict | Branches | Impact |
|---|----------|----------|--------|
| S1 | **M49 schema ownership** | minimal-signal-runtime defines `signals` table; harden-runtime-escalation extends it; harden-generator-confidence adds confidence columns | Three concurrent schemas claim M49. Whoever lands first sets canon; others need re-migrate as M51/M52. |
| S2 | **M50 ownership** | wire-minimal-runtime (`M50_pricing.sql`) vs pricing-runtime-conversion (`M50_pricing_runtime.sql`) | Two files claim slot M50. Rename loser to M53. |
| S3 | **Signal emitter ownership** | emitter-ownership-visibility defines ownership metadata; minimal-signal-runtime emits signals without ownership tags | Order matters: ownership rails must precede emitters or emitters need backfill. |
| S4 | **Governance enforcement vs runtime boundary** | add-autonomous-governance defines runtime policy; runtime-boundary-enforcement defines forbidden patterns. If patterns reject what governance allows, runtime fails boot. | Co-design required before either merges. |
| S5 | **Confidence vs dedupe gating** | harden-signal-dedupe and harden-generator-confidence both intercept the signal emission path | Combined behavior unspecified — semantic gap. |
| S6 | **Queue runtime spec divergence** | mvhb-queue-runtime defines queue v0; operational-queue-ux-finalization assumes a different queue contract | Surface contract must reconcile pre-merge. |

---

## §4 — CANON CONFLICTS

| # | Surface | Conflict |
|---|---------|----------|
| C1 | `CANON.md` | canon-enforcement-scripts modifies canon; other branches predate the canon hash they reference. Re-baseline after C1 lands. |
| C2 | `status-wiring.json` | canon-enforcement-scripts introduces this; consumed implicitly by runtime-boundary-enforcement. Order is canon → boundary → governance. |
| C3 | `MERGE_PLAN.md` | 9 branches all rewrite this. Treat as ephemeral — accept latest, regenerate post-wave. |
| C4 | `module_modes.json` / `module_modes.js` | Already in main; harden-runtime-escalation + wire-minimal-runtime mutate it. Must register new modes through canon registry, not direct edit. |

---

## §5 — RUNTIME OWNERSHIP CONFLICTS

| Subsystem | Conflicting owners | Resolution required |
|-----------|-------------------|---------------------|
| Signal emission | minimal-signal-runtime, harden-signal-dedupe, harden-generator-confidence, emitter-ownership-visibility | One emitter pipeline — pick canonical (minimal-signal-runtime) and layer dedupe + confidence + ownership as middleware on top. |
| Queue surface | mvhb-queue-runtime (spec), operational-queue-ux-finalization (UX), forge-prompt-queue-v2 (already in main) | Contract must trace: spec → in-main runtime → UX. |
| Worker proxy | minimal-signal-runtime, harden-runtime-escalation, pricing-runtime-conversion, orchestration-layer-design | Single worker entrypoint must serialize route additions. |
| Governance gates | add-autonomous-governance (behavioral), canon-enforcement-scripts (lint), runtime-boundary-enforcement (runtime guard) | Three layers; explicit precedence: canon-lint (pre-commit) → boundary-guard (boot) → governance (runtime). |
| Pricing pipeline | wire-minimal-runtime (M50_pricing), pricing-runtime-conversion (M50_pricing_runtime), trade_partners.js | One pricing schema. Rename + de-dupe before merge. |

---

## §6 — SUMMARY: BIGGEST RISKS

1. **Signal-runtime stack collision** (6 branches, all M49 + worker overlap) — single highest-conflict surface.
2. **M49/M50 SQL slot collisions** — block any Wave 3/4 merge until renumbered.
3. **MERGE_PLAN.md as a write target** — every branch overwrites it. Treat as derived artifact, regenerate per wave.
4. **Governance vs boundary enforcement contract gap** — semantic, not textual. Easy to miss in CI.
