# RUNTIME RECOVERY PLAN

**Session 34 — Runtime Reality Reconciliation**
**Status:** recommendation only — NO IMPLEMENTATION, NO MERGE.

---

## Root cause of the discrepancy

`integration/wave1a-runtime-governance@fb8a12e` recorded an execution
report stating "E1 applied, E2/E3/D1/F1 already on main." That claim is
false: zero Wave 1A runtime code is on `main`. Subsequent planning
sessions (32, 33) inherited that incorrect assumption and treated the
runtime as merged when it was never merged.

## Canonical runtime branch

**`claude/pricing-runtime-conversion-9ZISb`**

Reasons:

- It contains the most-recent, most-complete superset of the Wave 1A
  runtime: M49 schema, `signals_runtime.js`, `signals_runtime.test.js`,
  `signals_producers.js`, `check-runtime-wiring.sh`,
  `check-pricing-runtime-path.sh`, plus the M50 pricing producer.
- Its three commits are cherry-picked / rebased forward from the upstream
  minimal/wire branches, so it is a clean linear baseline.
- It is forked from current `main@ce5853f` and is 0 behind.

## Obsolete (already covered by canonical)

These branches' content is fully re-applied in the canonical branch.
Recommend **archive after Wave 1B confirms parity** (do not delete until
verified):

- `claude/minimal-signal-runtime-ZEwod` — subsumed by pricing branch's
  rebased commit `383345a`.
- `claude/wire-minimal-runtime-tgo0c` — subsumed by pricing branch's
  rebased commit `51a847e`.

## Stale / superseded — recommend archive

- `claude/operational-signal-framework-UGMDn` — parallel implementation
  with conflicting file naming (`signal_runtime.js` singular vs the
  canonical `signals_runtime.js` plural) and a different M49 schema.
  Predates canonical line by ~2h. Archive to prevent future cherry-pick
  confusion.
- `claude/mvhb-queue-runtime-UG9pN` — 68 commits behind `main`, docs only,
  6 days older than canonical work. Migrate any salvageable design notes
  into `docs/runtime/` then archive.
- `claude/runtime-boundary-enforcement-XcoKi` — strict subset of
  `claude/emitter-ownership-visibility-QfOTG`. Archive.
- `integration/wave1a-runtime-governance` — fix or rewrite the false
  "already on main" claim in `fb8a12e`, then either fast-forward it to
  reflect actual integration state or archive.

## To reconcile (sidecars to layer on top of canonical)

Each forks from `main@ce5853f`. None are ancestors of each other; merging
all four will produce conflicts in `js/signals.js`, `index.html`,
`scripts/status.sh`, and `sql/M49_*.sql`. Suggested reconciliation order:

1. **Base merge:** `claude/pricing-runtime-conversion-9ZISb` → integration
   branch (call it `integration/wave1a-canonical`).
2. **Add lifecycle hardening:** rebase
   `claude/harden-signal-dedupe-CsO6N` onto the integration branch.
   Conflict surface: `js/signals.js` (Phase 2 +247 lines), `index.html`
   wiring, new `sql/M49_signal_dedupe_index.sql`.
3. **Add confidence/escalation hardening:** rebase
   `claude/harden-runtime-escalation-eYOqF` onto the result. Conflict
   surface: `js/signals.js` (Phase 3 +193 lines — overlaps with Phase 2),
   `js/alerts.js`, `index.html` wiring.
4. **Add governance visibility:** rebase
   `claude/emitter-ownership-visibility-QfOTG` onto the result.
   Conflict surface: `scripts/status.sh`, new check-scripts,
   `.orchestration/forbidden_runtime_patterns.json`.
5. **Re-do execution report:** rewrite
   `integration/wave1a-runtime-governance@fb8a12e` so its claim matches
   the *new* integration branch's actual contents.

## Safest path forward

1. **Freeze new runtime feature work** on the listed feature branches —
   no further code commits on them — until the canonical integration
   branch exists.
2. **Open a single integration PR** that merges `pricing-runtime-conversion`
   first (no rebase needed: 0 behind). Land it as a single squash or merge
   commit on `main` so the runtime baseline becomes auditable.
3. **Then** open separate PRs for the three sidecars, in the order above,
   one at a time. Each PR's only job is to resolve its conflict surface
   cleanly and ship one capability (dedupe, confidence, ownership).
4. **Only after** step 3 is fully on `main`, redo a Session-33-style live
   runtime verification — this time with the actual symbols expected, and
   ideally from an environment that can boot a browser.
5. **Archive** the obsolete branches listed above. Use a `archive/<old-name>`
   prefix so they remain reachable but are out of the active list.
6. **Update** the false claim in `integration/wave1a-runtime-governance`
   and `WAVE1_RUNTIME_BASELINE.md` so future sessions inherit accurate
   state.

## Risk if we instead try to "fix forward" without reconciliation

- Wave 1B work would build on a base where the runtime objects it
  depends on (signal producers, replay metrics, debug panel) **do not
  exist on main**. Any feature flag or instrumentation Wave 1B adds will
  reference symbols that are not present, producing runtime errors on
  every page load.
- Each subsequent integration branch will continue to inherit the
  "already on main" misclaim and the divergence will widen.

## Out-of-scope reminders

- This plan is observation + recommendation only.
- No merges, no rebases, no force-pushes have been performed.
- No feature branches were modified.
