# table-eda — optimization history

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
| M6 | Concrete step outputs | 0 | Steps described EDA actions with no artifact-level output format specified |
| M7 | Zero passive voice | 0 | "should be split" used passive voice in the anti-pattern section |
| M8 | No prose walls | 10 | — |
| M9 | Stack reference | 10 | — |
| M10 | No placeholders | 10 | — |
| **Total** | | **70/100** | |

---

### Round 1 — 3-pass structure/prose/AccentOS sweep

**Changes made:**

| Change | Dimension | Reasoning |
|---|---|---|
| Added anti-pattern: "Never run WIDTH_BUCKET without a null guard — null values silently corrupt histogram bins" | M4 | M4 was already passing; Ralph flagged that a WIDTH_BUCKET null-guard pitfall specific to AccentOS analytics queries was missing; adding it hardened the dimension |
| Added anti-pattern: "Never run table-eda when the real task is schema validation — redirect to schema-contract-tests" | M4 | Wrong-skill redirect is an AccentOS-specific concern; baseline anti-patterns were all data-quality patterns with no skill-boundary guidance |
| "should be split" → "split this table into separate EDA runs" | M7 | "should be split" is passive; imperative rewrite names the action and its subject directly |

**Matter score after Round 1:** 80/100 (Δ +10)

---

### Round 2 — Ralph loop (3 optimizer+Ralph cycles)

**Cycle 1 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| Added behavioral commitment ending "always profile nulls before aggregating — never report a distribution over unguarded nulls" | M3 | M3 requires an "always X — never Y" terminal clause; description previously had no commitment statement |
| Added concrete output artifacts on Steps 0–5 referencing AccentOS project identifier hsyjcrrazrzqngwkqsqa (e.g. "outputs: null-rate table for hsyjcrrazrzqngwkqsqa.[table]", "outputs: histogram block with bin edges and counts") | M6 | M6 requires artifact-level output specs tied to the actual stack; steps previously named the analysis without specifying the deliverable format |
| Added trigger phrase "check the shape of [table]" | M5 | M5 was already passing; Ralph flagged that "shape of" is a common analyst phrase not covered by existing triggers; adding it prevented false-negative routing |

**Cycle 1 — Ralph findings**
- Flagged Steps 3 and 5 outputs as still too generic ("a profile") — sent back for M6 specificity fix
- Confirmed M7 fully clean after Round 1

**Cycle 2 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| Step 3 output refined to "outputs: value-frequency table (value, count, pct_of_total) for each categorical column" | M6 | Direct fix for Ralph's Step 3 generic-output flag |
| Step 5 "evaluate whether split" rewritten to "evaluate whether this table warrants separate EDA runs per segment — if yes, requeue with filter" | M6 | Direct fix for Ralph's Step 5 flag; added the concrete action following the evaluation |

**Cycle 2 — Ralph findings**
- none — converged

**Matter score after Round 2:** 100/100 (Δ +20)

---

### Final score: 100/100  (Δ from baseline: +30)

**Techniques that moved score:**
- Imperative rewrite of "should be split" passive construction (M7: +10 in Round 1)
- Terminal "always X — never Y" behavioral commitment added to description (M3: +10)
- Artifact-level output specs with hsyjcrrazrzqngwkqsqa stack identifier on Steps 0–5 (M6: +10)

**Techniques that didn't move score:**
- Adding WIDTH_BUCKET null-guard and wrong-skill-redirect anti-patterns (M4 was already 10/10 — added AccentOS specificity, no delta)
- Adding "check the shape of [table]" trigger phrase (M5 was already 10/10 — added routing coverage, no delta)

**Stuck dimensions:** none

---
