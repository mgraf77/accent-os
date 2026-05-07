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

## Run 2026-05-07 (Pass 3+4)  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 100/100 (all dimensions passing from prior run)

### Pass 1 — Deep quality audit

| Change | What was weak | What it became | Reasoning |
|---|---|---|---|
| Trigger: "table profile" → "show me column stats on [table]" | "table profile" is a near-paraphrase of "profile [table]" — same noun, different order | "show me column stats on [table]" is a conversational phrase that covers users who don't know the word "profile" | Trigger distinctness: analyst who says "column stats" never says "table profile" — different vocabulary coverage |
| Anti-pattern: "Never silently skip a column" → specific type list + exact output format | Generic — passes the "Never" check but no AccentOS failure mode named | Names specific problematic types (`jsonb`, `tsvector`, `bytea`) + exact output string `[column]: SKIPPED — type [type] requires manual probe` | Specific types make it actionable; exact output string means a new session produces consistent skip messages |

### Pass 2 — Ralph cold-read challenge

| Change | Ambiguity found | Fix |
|---|---|---|
| Step 3 precondition | Step 3 said "After Michael runs the SQL" but gave no instruction for what to do if results aren't available yet — a new session would be stuck | Added explicit precondition block: if no results present, output BLOCK 3 SQL and pause; Step 3 resumes when Michael re-invokes with results |

### Net matter score change: 100 → 100 (dimension scores unchanged; sub-dimension quality improved)

### Sub-dimension improvements:
- Trigger distinctness: "table profile" (near-duplicate of "profile [table]") replaced with vocabulary-distinct phrase
- Anti-pattern specificity: generic "silently skip" replaced with named types + exact skip-message format
- Step 3 precondition: missing fallback for "no results yet" case made explicit

---

## Run 2026-05-07 (Round 5+6 — sub-dimension quality)  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 100/100 (binary — maintained)

### Round 5 — Sub-dimension quality + regularization
**L1 specificity check:** Found one L1 gap: Anti-pattern 2 ("Never profile a table without first verifying it exists in M*.sql") named the path and the verification step but omitted the stop consequence and named the failure mode. Added exact output string "Target not found in /home/user/accent-os/sql/" and the consequence "stop; do not generate SQL for phantom tables."
**L2 commitment check:** Description ends with "Always produces a per-column table plus an outlier-flag list — never returns prose-only." — specific deliverable types named. Passes.
**Adversarial check:** Dimensions sampled: M7 (zero passive voice), M6 (concrete step outputs). M7: "cannot be handled" in Anti-pattern 4 is a modal passive describing a column property in a conditional instruction — the instruction itself ("output [...]") is active. Acceptable. M6: All steps have concrete output artifacts anchored to hsyjcrrazrzqngwkqsqa. Both pass.
**Cold-read check:** Walked through Step 0 → Step 5 on a 15-column vendors table. Column guardrail passes, Step 1 confirms target in M*.sql, Step 2 generates per-column probes with WIDTH_BUCKET null guard, Step 3 precondition handles no-results case, Step 4 EMPTY guard fires before per-column checks, Step 5 four blocks output. Clean.
**Cross-skill trigger audit:** table-eda vs. supabase-sql-magic: EDA is structural profiling (what is the shape of the data?), SQL-magic is data retrieval (give me filtered rows). Distinction is present and symmetric — each skill's Anti-patterns redirect to the other. No collision. table-eda vs. kpi-data-audit: no overlap found — kpi-data-audit is KPI metric computation, not table profiling.

### Round 6 — Second pass
**L1 re-check:** Edited Anti-pattern 2 now names the path, exact output string, stop consequence, and failure mode ("phantom tables"). Fully actionable. Passes.
**L2 re-check:** Description commitment unchanged and specific. Passes.
**Adversarial re-check on M3 and M4:** M3: "always profile nulls before aggregating — never report a distribution over unguarded nulls" — the commitment links to the WIDTH_BUCKET null-guard anti-pattern. Consistent. M4: Anti-pattern 3 references `schema-contract-tests` — verified that skill directory exists at /home/user/accent-os/skills/schema-contract-tests/. Valid redirect. Both pass.
**Cold-read re-check:** Edited anti-pattern 2 is now directly executable by a new session — exact error string means consistent output formatting. Passes.
**Cross-skill trigger audit:** No new collisions found. table-eda → supabase-sql-magic and table-eda → vendor-cascade redirects both present and named.

### Final: 1 sub-dimension edit across 2 rounds

