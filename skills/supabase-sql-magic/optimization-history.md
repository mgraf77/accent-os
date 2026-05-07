# supabase-sql-magic — optimization history

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
| M6 | Concrete step outputs | 0 | Steps described SQL actions with no artifact-level output format specified |
| M7 | Zero passive voice | 0 | "Never rely on guesses" and "Estimate query cost" contained passive or indirect constructions |
| M8 | No prose walls | 10 | — |
| M9 | Stack reference | 10 | — |
| M10 | No placeholders | 10 | — |
| **Total** | | **70/100** | |

---

### Round 1 — 3-pass structure/prose/AccentOS sweep

**Changes made:**

| Change | Dimension | Reasoning |
|---|---|---|
| "Never rely on guesses" → "Never guess schema — read it from information_schema" | M7 | Original used the weak indirect form "rely on guesses"; rewrite converts to a direct imperative "Never guess" with an active corrective action |
| "Never ask Michael to clarify" rewritten as a direct imperative anti-pattern | M7 | Original phrasing was indirect; rewrite removes modal softening and asserts the prohibition clearly |
| "Estimate query cost" trimmed to remove passive trailing clause | M7 | Trailing clause used a passive construction describing the estimate as something that "should be included"; rewritten to active imperative |

**Matter score after Round 1:** 80/100 (Δ +10)

---

### Round 2 — Ralph loop (3 optimizer+Ralph cycles)

**Cycle 1 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| Added behavioral commitment ending "always read schema before writing SQL — never infer column names from memory" | M3 | M3 requires an "always X — never Y" terminal clause in the description; no such clause existed at baseline |
| Added concrete output artifacts on Steps 1–5 (e.g. "outputs: annotated SQL block with inline cost estimate", "outputs: results table with row count header") | M6 | M6 requires artifact-level output specs; steps previously described the SQL action without naming the deliverable format |
| Added 7th anti-pattern: "Never use a Bigquery-style DATE_TRUNC syntax — Supabase Postgres uses DATE_TRUNC with interval literals" | M4 | M4 was already passing; Ralph flagged that all existing anti-patterns were generic SQL patterns; adding a BC-vs-Supabase distinction hardened AccentOS specificity |
| Step 4 output label consolidated into single artifact line | M6 | M6 refinement: Step 4 had two separate output statements that Ralph identified as ambiguous; merged into one concrete block label |

**Cycle 1 — Ralph findings**
- Flagged Step 4 as having two competing output labels — sent back for M6 consolidation
- Confirmed M7 fully clean after Round 1

**Cycle 2 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| Step 4 dual output labels merged into "outputs: execution-result block with row count, duration, and cost estimate" | M6 | Direct fix for Ralph's Step 4 ambiguity flag |

**Cycle 2 — Ralph findings**
- none — converged

**Matter score after Round 2:** 100/100 (Δ +20)

---

### Final score: 100/100  (Δ from baseline: +30)

**Techniques that moved score:**
- Imperative voice rewrite of indirect "rely on guesses" and passive trailing clauses (M7: +10 in Round 1)
- Terminal "always X — never Y" behavioral commitment added to description (M3: +10)
- Artifact-level output specs added to Steps 1–5 (M6: +10)

**Techniques that didn't move score:**
- Adding a 7th BC-vs-Supabase anti-pattern (M4 was already 10/10 — added AccentOS specificity, no delta)
- Step 4 output consolidation (M6 refinement within the same dimension — no additional delta beyond the initial M6 fix)

**Stuck dimensions:** none

---
