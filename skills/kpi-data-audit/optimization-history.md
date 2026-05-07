# kpi-data-audit — optimization history

---

## Run 2026-05-07  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 70/100

| Dim | Name | Score | Reason failed |
|---|---|---|---|
| M1 | Description ≥300 chars | 10 | — |
| M2 | AccentOS/Accent Lighting named | 10 | — |
| M3 | Behavioral commitment | 0 | Description did not end with "always X — never Y" |
| M4 | Anti-patterns ≥5 "Never" | 10 | — |
| M5 | Trigger phrases ≥5 | 10 | — |
| M6 | Concrete step outputs | 0 | Steps described auditing actions with no artifact-level output format specified |
| M7 | Zero passive voice | 0 | "Also fire" and "should rise" passive constructions present |
| M8 | No prose walls | 10 | — |
| M9 | Stack reference | 10 | — |
| M10 | No placeholders | 10 | — |
| **Total** | | **70/100** | |

---

### Round 1 — 3-pass structure/prose/AccentOS sweep

**Changes made:**

| Change | Dimension | Reasoning |
|---|---|---|
| "Also fire" → "Fire" in trigger section | M7 | "Also fire" is a compound passive construction; imperative "Fire" is direct and active |
| "Never silently guess" rewritten as a direct imperative anti-pattern | M7 | Original phrasing had modal softening; rewrite removes ambiguity and aligns with the "Never X" anti-pattern format |
| Prose tightening throughout description paragraph | M7 | Multiple sentences used weak modal constructions; rewritten to active declarative form |

**Matter score after Round 1:** 80/100 (Δ +10)

---

### Round 2 — Ralph loop (3 optimizer+Ralph cycles)

**Cycle 1 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| Added behavioral commitment ending "always surface the data gap before diagnosing the metric — never report a KPI without its source query" | M3 | M3 requires an "always X — never Y" terminal clause; description previously closed without a commitment statement |
| Added concrete output artifacts on Steps 0–8 (e.g. "outputs: NULL-count table per KPI column", "outputs: discrepancy report block") | M6 | M6 requires artifact-level output specs; steps previously named the action but not the deliverable format or structure |
| Verified [path] placeholder — none found, M10 already clean | M10 | Ralph pre-scan confirmed no unfilled tokens; no change needed, delta 0 |

**Cycle 1 — Ralph findings**
- Confirmed M7 already fully clean after Round 1 — no passive constructions remaining
- Confirmed [path] placeholder absence — no M10 issue
- Requested explicit artifact format on Step 3 output (was listed as "a report" rather than a named block type)

**Cycle 2 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| Step 3 output refined from "a report" to "outputs: markdown discrepancy-report block with column, expected-value, actual-value" | M6 | Direct fix for Ralph's Step 3 artifact-format flag |

**Cycle 2 — Ralph findings**
- none — converged

**Matter score after Round 2:** 100/100 (Δ +20)

---

### Final score: 100/100  (Δ from baseline: +30)

**Techniques that moved score:**
- Imperative voice rewrite of "Also fire" and modal passive constructions (M7: +10 in Round 1)
- Terminal "always X — never Y" behavioral commitment added to description (M3: +10)
- Artifact-level output specs added to Steps 0–8 (M6: +10)

**Techniques that didn't move score:**
- [path] placeholder audit (M10 was already 10/10 — confirmed clean, no delta)
- "should rise" fix (M7 was already resolved by Round 1 prose tightening — no additional delta in Round 2)

**Stuck dimensions:** none

---
