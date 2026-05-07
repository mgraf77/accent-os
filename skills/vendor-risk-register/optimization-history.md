# vendor-risk-register — optimization history

---

## Run 2026-05-07  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 60/100

| Dim | Name | Score | Reason failed |
|---|---|---|---|
| M1 | Description ≥300 chars | 10 | — |
| M2 | AccentOS named | 10 | — |
| M3 | Behavioral commitment | 0 | No "always X — never Y" commitment block present |
| M4 | ≥5 "Never" anti-patterns | 10 | — |
| M5 | ≥5 trigger phrases | 10 | — |
| M6 | Concrete step outputs | 0 | Steps described actions but produced no literal output examples |
| M7 | Zero passive voice | 0 | "Do not proceed" missing after NULL-total abort; "do not exist" used passive construction |
| M8 | No prose walls | 10 | — |
| M9 | Stack reference | 10 | — |
| M10 | No placeholders | 0 | `[window]` unfilled in severity-window description |
| **Total** | | **60/100** | |

---

### Round 1 — 3-pass structure/prose/AccentOS sweep

**Changes made:**

| Change | Dimension | Reasoning |
|---|---|---|
| "Do not proceed" added as explicit imperative after NULL-total abort condition | M7 | NULL-total abort block ended with a passive conditional; adding "Do not proceed" makes the instruction an active command |
| "do not exist" → "are missing" in vendor-record validation step | M7 | "do not exist" is passive-adjacent and formal-awkward; "are missing" is direct and active |

**Matter score after Round 1:** 70/100 (Δ +10)

---

### Round 2 — Ralph loop (3 optimizer+Ralph cycles)

**Cycle 1 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| `[window]` unfilled placeholder in severity-window field replaced with "rolling 90-day window" as the concrete default | M10 | Bracket syntax in a field description is unfilled template — M10 requires zero such instances anywhere in the file |
| 6th anti-pattern added: never use the composite score alone to define severity when the individual-factor breakdown is available | M4 | Only 5 anti-patterns at baseline; 6th closes a real analytical gap — composite scores can mask a single catastrophic factor |
| RUN PARAMETERS echo block added to Step 1: outputs vendor_id, lookback window, severity thresholds, and run timestamp | M6 | M6 requires literal output blocks at step boundaries; Step 1 had no output, only a list of inputs to gather |
| Behavioral commitment block added: "Always surface the individual risk factors alongside the composite score — never report composite alone" | M3 | M3 was entirely absent; commitment is tied directly to the 6th anti-pattern for reinforcement |

**Cycle 1 — Ralph findings**
- M10 clean — `[window]` resolved; no other brackets found
- M6 confirmed: RUN PARAMETERS block has concrete named fields (vendor_id, lookback, thresholds, timestamp)
- M3 commitment is specific to the skill's analytical output, not boilerplate
- Suggested: ensure 6th anti-pattern uses "Never" imperative, not "Do not"

**Cycle 2 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| 6th anti-pattern re-phrased from "Do not use" to "Never use composite alone" | M4 | Ralph flagged casing inconsistency with existing "Never" imperatives in the anti-pattern list |

**Cycle 2 — Ralph findings**
- none — converged

**Matter score after Round 2:** 100/100 (Δ +30)

---

### Final score: 100/100  (Δ from baseline: +40)

**Techniques that moved score:**
- "Do not proceed" imperative after NULL-total abort → closed M7: passive conditional became an active command; M7 requires every instruction to be an active imperative
- `[window]` → "rolling 90-day window" → closed M10: replacing bracket with a concrete default removes template syntax without losing meaning
- RUN PARAMETERS echo block at Step 1 → closed M6: naming actual output fields (vendor_id, lookback, thresholds, timestamp) satisfies the "concrete step output" requirement
- Behavioral commitment anchored to composite-vs-factor distinction → closed M3: commitment is actionable because it references a specific output format decision

**Techniques that didn't move score:**
- "do not exist" → "are missing" → stylistic M7 tightening; M7 was already failing for the bigger NULL-abort issue, so this change contributed to the fix but wasn't the sole driver

**Stuck dimensions:** none

---

## Run 2026-05-07 (Pass 3+4)  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 100/100 (all dimensions passing from prior run)

### Pass 1 — Deep quality audit

| Change | What was weak | What it became | Reasoning |
|---|---|---|---|
| Purpose line rewritten | "Concentration risk on Accent Lighting top vendors is currently invisible — no skill surfaces 'if vendor X disappeared tomorrow, what % of revenue evaporates.' This is the diagnostic." — states the problem, not what the skill does; "This is the diagnostic" is shape-vague | "Rank the top-N AccentOS vendors by composite risk across concentration, volatility, stockouts, and GMC failures so that existential single-vendor exposure at Accent Lighting surfaces before a surprise, not after." | Single tight sentence with a specific verb (rank); names all four dimensions; states the outcome benefit |

### Pass 2 — Ralph cold-read challenge

No ambiguous steps, preconditions, or missing fallbacks found — CLEAN

All four risk dimensions have explicit fallback handling (NULL-total abort for dim A; sample_count<2 exclusion for dim B; missing-table flag for dims C/D). Weight re-normalization covers every missing-dimension combination. Severity bands are fully defined with no undefined ranges. The composite score maps deterministically to severity with override rules stated.

### Net matter score change: 100 → 100 (dimension scores unchanged; sub-dimension quality improved)

### Sub-dimension improvements:
- Purpose line: action-verb sentence (rank) naming all four dimensions and the outcome benefit; replaced a problem-description with a skill-description

---

## Run 2026-05-07 (Round 5+6 — sub-dimension quality)  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 100/100 (binary — maintained)

### Round 5 — Sub-dimension quality + regularization
**L1 specificity check:** AP#6 contained garbled text "BC store-cwqiwcjxes score" — not a real table/column name. Replaced with `vendor_scores.score` (the actual column name used in Dim B SQL). AP#1 "underlying dimension values" was generic — tightened to name all four SQL aliases: `pct_of_revenue`, `score_volatility` σ, `stockout_count_90d`, `disapproved_count` (verified against Step 2 SQL column aliases). Description commitment "paste-ready risk register table plus mitigation list" lacked column specificity — tightened to name all 8 register columns matching Step 4 table header.
**L2 commitment check:** Description commitment now names Rank/Vendor/Revenue %/Volatility/Stockouts/GMC fails/Composite/Severity columns — exact match to Step 4 table. Verifiable at a glance.
**Adversarial check:** Dimensions sampled: M4 (anti-patterns), M5 (triggers). M4: AP#6 had garbled text — fixed. M5: "concentration risk" is broad enough to collide with a financial dashboard request; added NOT-trigger for "orphan metrics" / "vendor cascade" / "why did vendor X score drop" → vendor-cascade. Distinguishes portfolio-rank (this skill) from single-vendor diagnosis (vendor-cascade).
**Cold-read check:** SQL Dim D references `marketing.feed_status` table — schema-qualified table name. AP states "flag missing source and proceed" — consistent with Step 2 fallback. ✓ Weight re-normalization formula in Step 3 is concrete with numbers (0.40/0.75 = 0.533) — cold-readable. ✓
**Cross-skill trigger audit:** NOT-trigger block added distinguishing this skill (portfolio risk rank from `vendor_scores`, `deals`, `inventory`, `marketing.feed_status`) from vendor-cascade (single-vendor diagnosis from `vendor_scores.priority_id` weights).

### Round 6 — Second pass
**L1 re-check:** AP#1 column names verified against Step 2 SQL aliases: `pct_of_revenue` (Dim A SELECT), `score_volatility` (Dim B STDDEV alias), `stockout_count_90d` (Dim C COUNT alias), `disapproved_count` (Dim D COUNT FILTER alias). All four match exactly. ✓
**L2 re-check:** Description commitment column list "Rank/Vendor/Revenue %/Volatility/Stockouts/GMC fails/Composite/Severity" matches Step 4 table header exactly. ✓
**Adversarial re-check:** "orphan metrics" in NOT-trigger is a valid vendor-cascade trigger phrase. "why did vendor X score drop" is a natural diagnostic question. Both correctly route to vendor-cascade, not this skill. ✓
**Cold-read re-check:** No new ambiguities. Garbled AP#6 text was the most visible issue; now resolved.

### Final: 4 sub-dimension edits across 2 rounds
