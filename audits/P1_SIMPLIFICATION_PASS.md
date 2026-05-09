# P1 SIMPLIFICATION PASS

> Stabilization-oriented review. Identifies premature complexity and synchronization
> burden in P0. **Recommendations only.** No deletions this cycle.
> tag: CORE

## Optimization Target
> The most evolvable stable system — not the most complex one.
> If complexity grows without proportional stability, defer / simplify / reject.

## Findings

### F1 — Mode Surface Over-Specified for P1
- **Finding:** 7 modes defined. Only 4 are usable at P1 (Passive Audit,
  Plan-Then-Execute, Clean Pause Stabilization, Emergency Recovery — last is dormant).
- **Risk:** operator confusion if all 7 appear equally weighted.
- **Recommendation:** annotate `policies/MODES.md` with **Active at P1** column at next
  touch. Do not delete dormant modes; their definitions cost nothing and preserve
  optionality at P3.
- **Action this cycle:** none beyond noting in this report and DER der-0005.

### F2 — Metric Catalog Larger Than Computable Set
- **Finding:** 11 metrics defined (M1–M11). Only 4 are operationally meaningful at P1
  (RCI, governance_lag, recovery_confidence, runtime_health). The rest depend on
  baselines that don't yet exist (cv, rv, entropy_delta, etc.).
- **Risk:** ritualistic recording of `null` values in delta entries.
- **Recommendation:** add `compute_phase: P1 | P3 | P4` field to each metric in
  METRICS_REGISTER at next touch. P1 metrics produce real values; others record `null`
  with `pending_baseline` rather than imply they are broken.
- **Action this cycle:** captured as DER der-0006.

### F3 — Two Loop Files With Adjacent Purpose
- **Finding:** AUDIT_LOOP and GAP_DETECTION_LOOP could conceivably be one document.
- **Why kept separate:** different inputs, different cadences, different failure modes.
  Merging now would obscure that audit (read-only sweep) and gap detection (state
  reconciliation) have distinct trigger logic.
- **Recommendation:** revisit at P3 once both are automated. Tracked as der-0007.
- **Action this cycle:** none.

### F4 — Mutation Class Granularity
- **Finding:** 8 classes (C0–C7). In practice, day-to-day decisions reduce to 4 buckets:
  read-only, append, planned, hard-stop. Sub-classes (C2 state refresh, C3 auto-fix,
  C5 governance edit) are useful precision but only operationally meaningful when their
  tools/modes are active.
- **Recommendation:** keep all 8 in MUTATION_POLICY (their precision matters when
  routing). Add a "quick-decision" 4-bucket mapping to OPERATIONAL_ERGONOMICS so the
  operator does not need to look up the full table for routine ops.
- **Action this cycle:** captured for next touch of OPERATIONAL_ERGONOMICS (defer).

### F5 — Template Count
- **Finding:** 6 templates. All are used at distinct lifecycle points. No simplification.
- **Action:** none.

### F6 — Doc Proliferation Risk
- **Finding:** 27 P0 + 6 P1 hardening docs = 33 specification files.
- **Risk:** real, but absorbed by short read-order list (≤4k token warm-start).
- **Mitigation already in place:**
  - File-size hard caps in each spec (e.g. 200 lines for canonical state).
  - Append-only + archival rules to bound growth.
  - Single STABILIZATION_LAYER.md index.
- **Action this cycle:** confirm read-order list still ≤4k tokens at end of P1 (yes,
  no canonical reads exceeded their caps).

### F7 — Governance Files Self-Modifying Risk
- **Finding:** S1 + S8 hard stops already block recursive self-modification, but the
  stabilization layer itself has many MD files that could be edited without leaving
  obvious trace.
- **Mitigation:** GOVERNANCE_LEDGER discipline (gotcha `governance-drift` detector
  monitors `git log -- governance/ stable-evolution-runtime/ policies/`).
- **Action this cycle:** confirmed; no new mechanism needed at P1.

### F8 — DER Schema Over-Specified for Solo Operator
- **Finding:** idea-intake template has 12 fields. For a quick brain-dump idea, this
  is friction.
- **Recommendation:** keep the schema, but allow a `quick:` shortcut — a single-line
  intake that promotes to full schema at routing time. Track as DER der-0008 (do not
  build at P1; the existing template still works for now).
- **Action this cycle:** none.

## Net Recommendation
**Do not simplify aggressively at P1.** Most findings are pre-emptive. The system
exhibits *spec sprawl*, not *runtime sprawl*: nothing in P0 is automated, so cost is
read-cost only, which is bounded by the warm-start list and section caps.

The single simplification adopted this commit: **mark modes / metrics by active-phase
implicitly via this report + DER items**, without editing the original spec files.
That preserves optionality and avoids governance-on-governance edits.

## DER Items Added
- der-0005 — mode count reduction (7 → 5 active) — Q3 Research
- der-0006 — metric phase-tagging in METRICS_REGISTER — Q3 Research
- der-0007 — gap loop / audit loop merge evaluation — Q3 Research
- der-0008 — DER `quick:` intake shortcut — Q3 Research

## Anti-Pattern Avoided
We did **not** rewrite existing P0 files this cycle. Editing the spec layer in the
same cycle that adds compression review (S8 territory) is forbidden by SAFETY_HARD_STOPS.
Compression edits land in a future cycle, after a verified-green checkpoint between.
