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

## Run 2026-05-07 (Pass 3+4)  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 100/100 (all dimensions passing from prior run)

### Pass 1 — Deep quality audit

| Change | What was weak | What it became | Reasoning |
|---|---|---|---|
| Trigger: "ad-hoc query for [X]" → "pull the data for [X]" | "ad-hoc query for [X]" is a near-paraphrase of "query for [X]" — different adjective, same pattern | "pull the data for [X]" captures a conversational entry point that doesn't use the word "query" | Trigger distinctness: user who says "pull" never says "ad-hoc query" — replacing covers a different vocabulary set |
| Step 1 output artifact: generic description repeated → `TABLE → pk: [col], fk: [col→table], relevant columns: [col_list]` with purpose clause | Shape-vague — artifact description exactly restated the Step's build-instructions | Named literal format + explicit downstream use ("Used in Step 3 to validate every column reference") | Literal shape + downstream use tells a new session exactly what to produce and why |
| Step 3 LIMIT rule: "unless aggregation" → explicit exception definition | Ambiguous — "unless aggregation" doesn't say when to omit, how many rows an aggregation returns, or what counts as "true aggregation" | "omit only when query returns a single summary row or a fixed small count" | Removes interpretation: a new session now knows exactly when LIMIT is omitted |

### Pass 2 — Ralph cold-read challenge

No ambiguous steps, preconditions, or missing fallbacks found — CLEAN

### Net matter score change: 100 → 100 (dimension scores unchanged; sub-dimension quality improved)

### Sub-dimension improvements:
- Trigger distinctness: "ad-hoc query" (near-duplicate) replaced with vocabulary-distinct "pull the data for"
- Step 1 output literal shape: named field format + downstream use clause specified
- Step 3 LIMIT exception: ambiguous "unless aggregation" replaced with precise definition of when to omit

---

## Run 2026-05-07 (Round 5+6 — sub-dimension quality)  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 100/100 (binary — maintained)

### Round 5 — Sub-dimension quality + regularization
**L1 specificity check:** Found two L1 failures: (1) frontmatter description still listed "ad-hoc query" (near-duplicate of "query for" — redundant vocabulary coverage, fixed to "pull the data for [X]" to match the Trigger Recognition body); (2) Step 1 hard-coded M-file list "currently M01, M02, M21...M29" was stale — actual directory now extends to M40+ series; rewritten to a glob instruction with explicit note that the list grows.
**L2 commitment check:** Description ends with "Always produces a paste-ready SQL block plus a cost note about row count and join depth — never returns the result data inline." — specific deliverables named. Passes.
**Adversarial check:** Dimensions sampled: M8 (no prose walls), M9 (stack reference). M8: No prose walls — all steps are lists, code blocks, or short paragraphs. Resilient. M9: `hsyjcrrazrzqngwkqsqa` hard-coded in Step 5 paste URL — intentionally bound to this project; no failure path. Both pass.
**Cold-read check:** Walked Michael's prompt "show me vendors whose score dropped more than 10 points in the last 7 days" through all 5 steps. Step 1 schema load, Step 2 decomposition, Step 3 window-function SQL, Step 4 cost note, Step 5 three-block output all execute without ambiguity. Clean.
**Cross-skill trigger audit:** "query for [X]" collides with kpi-data-audit when X is a business KPI metric. Added kpi-data-audit redirect to both description frontmatter and Trigger Recognition Do-Not-Trigger clause. Also removed phantom "M04" integration reference from anti-pattern 7 — no M04 file exists in /home/user/accent-os/sql/.

### Round 6 — Second pass
**L1 re-check:** Step 1 glob instruction now avoids hard-coding any file range. Description trigger phrase updated. Anti-pattern 7 no longer references non-existent M04. All L1 specific to AccentOS artifacts. Passes.
**L2 re-check:** Description commitment unchanged and specific. Passes.
**Adversarial re-check on M5 and M6:** M5: Trigger Recognition now has 8 distinct phrases, none near-duplicate. M6: All 5 steps have explicit output artifacts. Both pass.
**Cold-read re-check:** kpi-data-audit redirect now fires on "what's our CAC this quarter" and "query for conversion rate" — concrete examples anchor the routing decision for a new session. Passes.
**Cross-skill trigger audit:** supabase-sql-magic vs. kpi-data-audit boundary is now bidirectional in description + Trigger Recognition. No other collisions found.

### Final: 4 sub-dimension edits across 2 rounds

