# RUNTIME REALITY MATRIX

**Session 34 — Runtime Reality Reconciliation**
**Date:** 2026-05-15
**Scope:** Observed truth only. Source: `git ls-tree`, `git log`,
`git merge-base`, `git grep`, `git branch --merged` on `origin/main`
(@ `ce5853f`).

---

## Legend

- **Merged?** = `origin/<branch>` appears in `git branch -r --merged origin/main`.
- **Active?** = branch's tip commit landed within the last 14 days
  AND introduces runtime artifacts beyond docs.
- **Stale?** = tip is older than 30 days OR branch is behind `main`
  by >10 commits OR is superseded by a later branch with identical intent.
- **Canonical?** = "yes" only if the branch is the most-recent superset of
  all upstream feature work and is intended to feed the next merge wave.

## Matrix

| Feature                          | Branch                                          | Merged? | Active? | Stale? | Canonical? |
|----------------------------------|-------------------------------------------------|:-------:|:-------:|:------:|:----------:|
| Signals runtime (M49 base)       | `claude/minimal-signal-runtime-ZEwod`           | no      | yes     | super  | no (rebased into pricing) |
| Signals runtime + producers/panel| `claude/wire-minimal-runtime-tgo0c`             | no      | yes     | super  | no (rebased into pricing) |
| Pricing runtime (queue + producer + replay metrics + debug) | `claude/pricing-runtime-conversion-9ZISb` | no | yes | no | **YES — canonical Wave 1A runtime baseline** |
| Signal lifecycle hardening (transitionSignal, DAG, dedupe SQL) | `claude/harden-signal-dedupe-CsO6N` | no | yes | no | sidecar — reconcile on top |
| Signal confidence + escalation hardening (Phase 3) | `claude/harden-runtime-escalation-eYOqF` | no | yes | no | sidecar — reconcile on top |
| Emitter ownership visibility (governance scripts) | `claude/emitter-ownership-visibility-QfOTG` | no | yes | no | sidecar — reconcile on top |
| Runtime boundary enforcement     | `claude/runtime-boundary-enforcement-XcoKi`     | no      | yes     | yes (subset of emitter-ownership) | superseded |
| Signal system consolidation (docs) | `claude/consolidate-signal-system-Z5Xhb`      | no      | yes     | no     | docs-only sidecar |
| Operational signal framework (parallel impl) | `claude/operational-signal-framework-UGMDn` | no | yes (13:53) | yes — conflicting file naming (`signal_runtime.js` vs canonical `signals_runtime.js`) | NO — superseded by minimal/wire/pricing line |
| MVHB queue runtime v0 (docs)     | `claude/mvhb-queue-runtime-UG9pN`               | no      | no — 68 behind main, dated 2026-05-09 | yes | NO — archive |
| Wave 1A integration (docs)       | `integration/wave1a-runtime-governance`         | no      | yes     | misleading — see note below | NO |
| Wave 1 merge prep (docs)         | `claude/merge-wave-preparation-FuKpj`           | no      | yes     | no     | docs-only sidecar |
| Worker proxy / BC hardening (already in main) | `main` (`ce5853f`)                | yes     | yes     | n/a    | yes (current production base) |

## Symbol presence by branch (from `git grep`)

`signalRuntime | signals_runtime | pricing.?queue | priceQueue | replayMetrics | runtimeMetrics | queueRuntime | queue_runtime | signal_runtime`

| Branch | js/* | sql/* | scripts/* | index.html |
|---|---|---|---|---|
| `main` (ce5853f) | — | — | — | — |
| `integration/wave1a-runtime-governance` | — | — | — | — |
| `claude/minimal-signal-runtime-ZEwod` | `signals_runtime.js`, `signals_runtime.test.js` | `M49_signal_runtime_schema.sql` | — | yes (wires `<script>`) |
| `claude/wire-minimal-runtime-tgo0c` | `signals_runtime.js`, `signals_runtime.test.js`, `signals_producers.js` | `M49_signal_runtime_schema.sql` | `check-runtime-wiring.sh` | yes |
| `claude/pricing-runtime-conversion-9ZISb` | `signals_runtime.js`, `signals_runtime.test.js`, `signals_producers.js` (+ pricing producer M50) | `M49_signal_runtime_schema.sql` | `check-runtime-wiring.sh`, `check-pricing-runtime-path.sh` | yes |
| `claude/operational-signal-framework-UGMDn` | `signal_runtime.js`, `signal_engine.js`, `signal_feed.js`, `signal_baselines.js`, `signal_command_surface.js`, `signal_rules_phase1.js` | `M49_signals_schema.sql` (different schema!) | — | yes (parallel wiring) |
| `claude/harden-signal-dedupe-CsO6N` | `signals.js` (+247 lines) | `M49_signal_dedupe_index.sql` | `check-signal-dedupe.sh`, `check-signal-lifecycle.sh` | yes |
| `claude/harden-runtime-escalation-eYOqF` | `signals.js` (+193 lines) | — | `check-signal-confidence.sh` | yes |
| `claude/emitter-ownership-visibility-QfOTG` | — | — | `check-runtime-boundaries.sh`, `check-runtime-emitters.sh`, `check-signal-ownership.sh` | — |
| `claude/runtime-boundary-enforcement-XcoKi` | — | — | `check-runtime-boundaries.sh`, `check-signal-ownership.sh` | — |
| `claude/consolidate-signal-system-Z5Xhb` | — | — | — | — (docs only) |
| `claude/mvhb-queue-runtime-UG9pN` | — | — | — | — (docs only, 68 behind) |

## Critical note: integration/wave1a-runtime-governance

The branch's latest commit message states:

> "wave1a: execution report — E1 applied, E2/E3/D1/F1 already on main"

Verified false. `origin/main@ce5853f`:

- contains **no** `signals_runtime.js`, `signals_producers.js`,
  `signal_runtime.js`, or `signals_runtime.test.js`
- contains **no** `M49_signal_runtime_schema.sql`,
  `M49_signal_dedupe_index.sql`, or `M49_signals_schema.sql`
- contains **no** `check-runtime-wiring.sh`, `check-pricing-runtime-path.sh`,
  `check-signal-*` scripts

This false-positive claim is the root cause of the Session 33 discrepancy.
