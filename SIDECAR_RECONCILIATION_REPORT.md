# SIDECAR_RECONCILIATION_REPORT

**Session:** 36
**Branch:** `claude/consolidate-forward-track-ykHmh`
**Baseline:** `main@d4966c7` ("Merge canonical Wave 1A runtime baseline")
**Authority:** HIGH (additive only; no sidecar merges performed)

## Scope

Three sidecars were evaluated for clean reconciliation onto the new canonical
runtime baseline. **No merges were executed.** Each was rebased into a
disposable worktree, conflict-checked, then aborted. Findings recorded below.

| Sidecar | Branch (origin) | Tip | Files Δ vs main | Textual conflicts | Semantic conflicts |
|---|---|---|---|---|---|
| 1. Signal dedupe hardening | `claude/harden-signal-dedupe-CsO6N` | `e0666aa` | 12 (+1089/-36) | **none** | **HIGH** |
| 2. Runtime escalation hardening | `claude/harden-runtime-escalation-eYOqF` | `858b64b` | 4 (+358/-7) | **none** | **HIGH** |
| 3. Emitter ownership visibility | `claude/emitter-ownership-visibility-QfOTG` | `c5d4037` | 7 (+687/-0) | **none** | **LOW** |

## Method

```
for b in <sidecar>; do
  git worktree add -B rebase-test/<b> /tmp/sidecar-rebase/<b> origin/$b
  (cd worktree && git rebase origin/main)   # text-only conflict probe
done
```

Worktrees pruned, test branches deleted. No commits created in any sidecar.

> NOTE: the in-environment git commit-signer returned `400 missing source`
> when re-applying the *original sidecar commits* during rebase. This blocks
> rebase-then-push from this session; reconciliation must be performed in
> an environment with normal commit signing, OR the sidecars must be
> re-authored as cherry-picks/new commits onto main. New commits authored
> in this session sign normally — only replay-of-old-commits is affected.

## Per-sidecar findings

### 1. `claude/harden-signal-dedupe-CsO6N`

- **Adds:** `js/signals.js` (247 lines), `sql/M49_signal_dedupe_index.sql`,
  `scripts/check-signal-dedupe.sh`, `scripts/check-signal-lifecycle.sh`,
  6 docs in `docs/runtime/`.
- **Modifies:** `js/alerts.js` (+96/-36), `index.html` (+3/-0 — additional
  `<script>` tag for `js/signals.js`), `KPI_CATALOG.md`.
- **Textual conflict:** none. Files added (`js/signals.js`) do not exist in main.
- **Semantic conflict — HIGH.** Main now ships the canonical runtime as
  `signals_runtime.js` / `signals_producers.js` / `signals_panel.js` and
  has **no** `js/signals.js`. Re-introducing `js/signals.js` creates a
  parallel signal subsystem that:
  - duplicates `enqueue` / lifecycle primitives,
  - races with `window.SIGNALS` for global ownership,
  - is not gated behind the runtime feature flag,
  - re-adds an SQL migration (`M49_signal_dedupe_index.sql`) whose intent
    overlaps with the canonical `sig_*` tables in main.
- **Salvageable, low-risk content:**
  - `docs/runtime/CANONICAL_SIGNAL_RUNTIME_V1.md`
  - `docs/runtime/SIGNAL_RUNTIME_CANONICAL_PRIMITIVES.md`
  - `docs/runtime/SIGNAL_GOVERNANCE_STANDARD_V1.md`
  - `docs/runtime/SIGNAL_ENTROPY_RISKS.md`
  - `docs/runtime/SIGNAL_IMPLEMENTATION_SEQUENCE_V1.md`
  - `scripts/check-signal-dedupe.sh` (verifier — needs port to runtime)
  - `scripts/check-signal-lifecycle.sh` (verifier — needs port to runtime)
- **Disposition:** **DO NOT MERGE.** Re-author primitives as additive
  hardening *inside* `js/signals_runtime.js` (dedupe is already partially
  present via `effects_skipped_replay` counter and unique index on
  `(idempotency_key, effect_type)` per the runtime header). Salvage docs
  via cherry-pick of doc-only commits.

### 2. `claude/harden-runtime-escalation-eYOqF`

- **Adds:** `js/signals.js` (193 lines, distinct content from sidecar #1),
  `scripts/check-signal-confidence.sh`.
- **Modifies:** `js/alerts.js` (+79/-7), `index.html` (+3/-0).
- **Textual conflict:** none.
- **Semantic conflict — HIGH.** Same root cause as sidecar #1: introduces a
  second `js/signals.js` that conflicts with both main's canonical runtime
  and with sidecar #1's version. Two parallel `js/signals.js` files cannot
  coexist; sidecar #1 and #2 also conflict with each other.
- **Salvageable, low-risk content:** confidence/escalation taxonomy and
  the verifier `scripts/check-signal-confidence.sh` (target needs to be
  re-pointed at `signals_runtime.js`).
- **Disposition:** **DO NOT MERGE.** Re-author escalation logic as a
  thin handler-decorator in `signals_runtime.js` if the behavior is still
  wanted. Otherwise mark superseded.

### 3. `claude/emitter-ownership-visibility-QfOTG`

- **Adds:** `.orchestration/forbidden_runtime_patterns.json`,
  `docs/EVENT_OWNERSHIP_REGISTRY.md`, `docs/RUNTIME_CHANGE_TEMPLATE.md`,
  4 verifier scripts (`check-runtime-boundaries.sh`,
  `check-runtime-emitters.sh`, `check-signal-ownership.sh`).
- **Modifies:** `scripts/status.sh` (+32 — display-only additions).
- **Textual conflict:** none.
- **Semantic conflict — LOW.** Pure additive: report-only verifiers + docs
  + status display block. Does not touch runtime JS or SQL. Compatible with
  the canonical runtime in main.
- **Caveats:**
  - `scripts/check-runtime-emitters.sh` and `check-runtime-boundaries.sh`
    were authored before main split signals into 3 files; they target
    the deleted `js/signals.js`. Need a one-line target update before they
    will produce useful output.
  - `.orchestration/forbidden_runtime_patterns.json` defines
    enforcement patterns; verify none clash with main's emitter set
    before activating.
- **Disposition:** **MERGEABLE after small target-file fix-ups.**
  Recommended next-session lane. See `RUNTIME_CONFLICT_RESOLUTION_NOTES.md`
  for the exact patches.

## Summary

| Sidecar | Recommended action | Owner |
|---|---|---|
| harden-signal-dedupe | Salvage docs, re-author primitives in canonical runtime | Future session |
| harden-runtime-escalation | Salvage taxonomy + verifier, re-author handler | Future session |
| emitter-ownership-visibility | Patch script targets → cherry-pick into main | Next session |

## Residual risks

- Sidecars #1 and #2 share the conflict class "re-introduces deleted
  `js/signals.js`". Any future contributor opening either branch must be
  warned. (See `OBSOLETE_BRANCH_REGISTRY.md`.)
- Sidecar #3's enforcement JSON is *report-only* per its design. Confirm
  no future session promotes it to *blocking* without re-baselining the
  pattern set against `signals_runtime.js`.
- The sidecar branches will continue to drift from main with every
  canonical-runtime change. Recommended TTL: **convert or supersede within
  2 sessions**, after which mark obsolete.
