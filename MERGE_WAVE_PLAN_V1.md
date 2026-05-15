# MERGE_WAVE_PLAN_V1.md
> Session 29 — Merge Readiness + Conflict Audit
> Generated: 2026-05-15
> Base: `main` @ ce5853f
> Authority: HIGH for analysis, LOW for implementation. **No code changes performed.**

---

## SCOPE

Categorizes 23 active unmerged branches across 7 mission categories:
signal runtime, governance enforcement, runtime hardening, producer
conversion, queue implementation, confidence hardening, orchestration enforcement.

`origin/claude/forge-prompt-queue-v2-f31c66a9` is already merged into main — excluded.

---

## WAVE 1 — MERGE IMMEDIATELY (LOW RISK, ADDITIVE, NO RUNTIME OWNERSHIP CONFLICT)

Pure docs / design artifacts. Zero runtime code. Safe to land first to establish canon.

| # | Branch | Type | Notes |
|---|--------|------|-------|
| 1 | `claude/extract-orchestration-intelligence-BhxXb` | docs/runtime only (1 commit) | Adds bounded-autonomy + procedural intelligence docs. No collisions. |
| 2 | `claude/mvhb-queue-runtime-UG9pN` | docs/mvhb only (1 commit) | Queue v0 spec + bounded worker pattern. New directory. |
| 3 | `claude/orchestration-maturity-analysis-qdJ5W` | docs/runtime + sql (10 commits) | Additive analysis docs; SQL is observational only — verify before merge. |
| 4 | `claude/governance-doctrine-design-kNUPb` | docs/runtime + sql (3 commits) | Escalation matrix + M42 governance schema. Schema additive. |
| 5 | `claude/runtime-stabilization-layer-Tneyd` | new top-level dirs (audits/, governance/, policies/, etc.) | Pure design tree. Zero index.html / runtime impact. |

---

## WAVE 2 — MERGE AFTER WAVE 1 (GOVERNANCE PRIMITIVES — MUST PRECEDE RUNTIME)

These define canon and enforcement rails. Runtime hardening + producer
conversion downstream depend on these patterns existing.

| # | Branch | Why this order |
|---|--------|----------------|
| 6 | `claude/governance-snapshot-prep-k3dBs` | Adds `boot-smoke.sh`, R-01 lockstep plan. Foundation for post-merge validation. |
| 7 | `claude/canon-enforcement-scripts-wp0M4` | `.orchestration/` rules + `status-wiring.json`. Required by enforcement branches downstream. |
| 8 | `claude/runtime-boundary-enforcement-XcoKi` | `forbidden_runtime_patterns.json`. Must land after canon scripts (consumes them). |
| 9 | `claude/add-autonomous-governance-NwHL7` | `governance.js` + M41 schema. Behavioral but isolated; depends on canon rails. |

---

## WAVE 3 — RUNTIME HARDENING (BEHAVIORAL, SCOPED, INDEX.HTML TOUCHES)

Touches `index.html` and core runtime files. Must merge after governance
rails are in place. **Sequential — do NOT batch.** Re-run smoke + status.sh
between each.

| # | Branch | Risk | Conflict surface |
|---|--------|------|-----------------|
| 10 | `claude/harden-operational-workflows-gP9bP` | LOW | sbFetch / hydration regions (already in main from reconcile-v2 — verify it's not re-doing) |
| 11 | `claude/harden-quote-transactions-zukcz` | LOW | M45/M46 SQL — already in main; expect mostly no-op or rebase |
| 12 | `claude/harden-runtime-escalation-eYOqF` | MEDIUM | M49 signals SQL, module_modes.js, worker — overlaps with signal runtime wave |
| 13 | `claude/harden-signal-dedupe-CsO6N` | MEDIUM | KPI_CATALOG.md, jobs.js — overlaps Wave 4 |
| 14 | `claude/harden-generator-confidence-SBtlt` | MEDIUM | M49 SQL, jobs.js — overlap with #12 + #13 |

Strong recommendation: resolve M49 ownership (see RUNTIME_CONFLICT_MATRIX §SQL) before merging any of 12/13/14.

---

## WAVE 4 — SIGNAL RUNTIME CONSOLIDATION (HEAVIEST OVERLAP)

Six branches all created 2026-05-15, all 36–39 commits ahead, all touch
`MERGE_PLAN.md`, `.github/workflows/deploy-worker.yml`, `sql/M48–M50`, and
`index.html`. **These are variants of the same stack** and cannot be
merged in parallel.

Recommended strategy: pick the **canonical** branch (lowest delta vs intended
behavior), squash-merge it, then cherry-pick deltas from the others.

| # | Branch | Role |
|---|--------|------|
| 15 | `claude/minimal-signal-runtime-ZEwod` | **CANDIDATE CANONICAL** — smallest scope, M49_signals.sql primitive |
| 16 | `claude/consolidate-signal-system-Z5Xhb` | Adds M48 schema; merge as delta on #15 |
| 17 | `claude/operational-signal-framework-UGMDn` | Doc/framework layer — merge as docs after runtime lands |
| 18 | `claude/wire-minimal-runtime-tgo0c` | M50_pricing.sql + index.html wiring — merge after #15 |
| 19 | `ox-signal-audit-design-9200557531541259754` | Design docs — merge last in wave |
| 20 | `claude/emitter-ownership-visibility-QfOTG` | Ownership metadata on customers.js — merge after signal runtime lands |

---

## WAVE 5 — PRODUCER / QUEUE / ORCHESTRATION SURFACES

Behavioral expansion. Must follow Wave 3 + Wave 4 to inherit hardened
runtime and signal primitives.

| # | Branch | Notes |
|---|--------|-------|
| 21 | `claude/pricing-runtime-conversion-9ZISb` | M50_pricing_runtime.sql + trade_partners.js. Conflict with #18 over M50 ownership — resolve in CANON_UPDATE. |
| 22 | `operational-queue-ux-finalization-14686126636490175698` | Mobile queue UX + docs/runtime. Depends on queue surface from #2. |
| 23 | `claude/orchestration-layer-design-fkUMQ` | Control-plane docs + worker. Land last. |

---

## ARCHIVE / NO-MERGE

| Branch | Reason |
|--------|--------|
| `claude/forge-prompt-queue-v2-f31c66a9` | Already merged into main (0 commits ahead). Delete remote ref. |

---

## RECOMMENDED MERGE WAVE STRATEGY (TL;DR)

1. **Land docs-only branches first** (Wave 1) — establish canon language.
2. **Land governance enforcement rails** (Wave 2) — canon scripts → boundary patterns → behavioral governance.
3. **Resolve M49/M50 SQL ownership conflict** before any Wave 3/4 merge. See CANON_UPDATE_REQUIREMENTS.
4. **Pick one signal-runtime canonical branch** (Wave 4 #15) — merge, then cherry-pick deltas. Do NOT attempt to merge all six.
5. **Sequential merges** through Wave 3, running status.sh + boot-smoke between each.
6. **Wave 5 last** — producers + orchestration ride on hardened primitives.

Total ordered merges expected: **~15 effective integrations** (after squash-merge of signal-runtime variants).
