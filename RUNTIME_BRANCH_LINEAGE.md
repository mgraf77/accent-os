# RUNTIME BRANCH LINEAGE

**Session 34 — Runtime Reality Reconciliation**

All branches below were forked from `origin/main` (verified by
`git merge-base origin/main origin/<branch>` returning `ce5853f` —
the current `main` HEAD — unless noted).

---

## Canonical runtime line (cherry-picked / rebased forward)

```
origin/main @ ce5853f
        │
        ├── claude/minimal-signal-runtime-ZEwod  (1 ahead)
        │     └── f1ebdb0 feat(signals): minimal SQL-backed signal runtime (M49)
        │
        ├── claude/wire-minimal-runtime-tgo0c    (2 ahead)
        │     ├── f1ebdb0 [SAME SHA — true ancestor of minimal-signal-runtime]
        │     └── e839ccd feat(signals): wire minimal runtime — producers, panel, verification
        │
        └── claude/pricing-runtime-conversion-9ZISb  (3 ahead)
              ├── 383345a feat(signals): minimal SQL-backed signal runtime (M49)
              │     [SAME message as f1ebdb0 but DIFFERENT SHA → cherry-pick/rebase]
              ├── 51a847e feat(signals): wire minimal runtime — producers, panel, verification
              │     [SAME message as e839ccd but DIFFERENT SHA → cherry-pick/rebase]
              └── 16ceb3b feat(signals): convert inventory.list_price inline edit
                                          to pricing runtime queue (M50)
```

- `pricing-runtime-conversion-9ZISb` is **NOT** a topological descendant of
  the minimal/wire branches (`git merge-base --is-ancestor` returns false).
  It re-applies their content via cherry-pick or rebase. This means a
  merge of pricing **plus** either of the upstream feature branches will
  produce conflicts unless one is dropped.
- Recommendation: treat `pricing-runtime-conversion-9ZISb` as the
  canonical line and **archive** `minimal-signal-runtime-ZEwod` and
  `wire-minimal-runtime-tgo0c` once Wave 1B confirms parity.

## Hardening / governance sidecars (independent, forked from main)

Each forked from `ce5853f`; none of them are ancestors of the canonical line.

```
ce5853f main
   ├── claude/harden-signal-dedupe-CsO6N         (2 ahead — Phase 2 lifecycle + DAG + dedupe SQL)
   ├── claude/harden-runtime-escalation-eYOqF    (1 ahead — Phase 3 confidence + escalation)
   ├── claude/emitter-ownership-visibility-QfOTG (2 ahead — Session 27 governance scripts)
   ├── claude/runtime-boundary-enforcement-XcoKi (1 ahead — subset of emitter-ownership; superseded)
   └── claude/consolidate-signal-system-Z5Xhb    (1 ahead — docs only)
```

Verified: `harden-signal-dedupe` is **NOT** an ancestor of `harden-runtime-escalation`,
even though their commit narratives reference shared "Phase N" sequencing.
They both edit `js/signals.js` with overlapping diffs (+247 vs +193 lines)
and will conflict at merge time. Each branch is an independently authored
hardening pass; they must be reconciled (rebase one onto the other) before
either lands.

## Superseded parallel implementation

```
ce5853f main
   └── claude/operational-signal-framework-UGMDn (4 ahead, 2026-05-15 13:53)
         · introduces a separate `signal_runtime.js` (singular)
         · separate `M49_signals_schema.sql` (different file, different schema)
         · multiple `signal_*.js` modules (engine, feed, baselines, command_surface, rules_phase1)
```

This branch predates the minimal/wire/pricing line by ~2 hours and uses
incompatible naming (`signal_runtime` singular vs canonical `signals_runtime` plural).
It is **superseded** and should be archived to avoid future cherry-pick
confusion.

## Stale

```
969de17 (older main) — base
   └── claude/mvhb-queue-runtime-UG9pN (1 ahead, 68 BEHIND main, 2026-05-09)
         · docs only (QUEUE_RUNTIME_V0.md, QUEUE_ITEM_SCHEMA.md)
         · does not touch js/* or sql/*
```

68 commits behind `main`; tip is 6 days older than the canonical line.
Archive.

## Docs-only integration / planning branches

```
ce5853f main
   ├── integration/wave1a-runtime-governance (2 ahead)
   │     ├── aa69d04 wave1a/E1: import architecture+operations+archive docs
   │     └── fb8a12e wave1a: execution report — claims "E2/E3/D1/F1 already on main" (FALSE)
   │           · 25 files changed, 1120 insertions, all under docs/architecture/,
   │             docs/operations/, docs/archive/
   │           · zero js/, sql/, scripts/, worker/ touches
   │
   └── claude/merge-wave-preparation-FuKpj (1 ahead, Session 31)
         · WAVE1_POSTMERGE_BOOT_SEQUENCE.md
         · WAVE1_RUNTIME_BASELINE.md
         · 5 files changed, 633 insertions — docs only
```

## Already merged (for reference)

Branches that `git branch -r --merged origin/main` confirms landed:

- `accent-work` (KPI scheduler, dashboard pinning, csvDownload cleanup, etc.)
- `integration/reconcile`
- `integration/reconcile-v2` (BC adapter v3 prefix, BC sync 429 retry fix)
- `codex/execute-autonomous-build-session-for-accentos`
- `claude/forge-autonomous-mode-and-queue-dbeb339b`
- `claude/forge-prompt-queue-v2-f31c66a9`
- `claude/always-on-efficiency-monitor-2LiuS`
- `claude/caveman-conversational-english-jr6Vy`
- `claude/internal-meetings-module-2LSUN`
- `claude/add-repo-scout-skill-Plare`

None of these contribute Wave 1A runtime code.

## Forward path

The canonical Wave 1A runtime baseline is
**`claude/pricing-runtime-conversion-9ZISb`**.
Wave 1B should branch from a merge of:

1. `claude/pricing-runtime-conversion-9ZISb`  (M49 + wire + M50 pricing producer)
2. `claude/harden-signal-dedupe-CsO6N`         (Phase 2 lifecycle)
3. `claude/harden-runtime-escalation-eYOqF`    (Phase 3 confidence)
4. `claude/emitter-ownership-visibility-QfOTG` (governance)

with explicit conflict resolution on `js/signals.js`, `index.html`,
`scripts/status.sh`, and `M49_*.sql`.
