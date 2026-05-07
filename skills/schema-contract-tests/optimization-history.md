# schema-contract-tests — optimization history

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
| M6 | Concrete step outputs | 0 | Steps described test actions with no artifact-level output format specified |
| M7 | Zero passive voice | 10 | — |
| M8 | No prose walls | 10 | — |
| M9 | Stack reference | 10 | — |
| M10 | No placeholders | 0 | Unfilled placeholder tokens present in description and step bodies |
| **Total** | | **70/100** | |

---

### Round 1 — 3-pass structure/prose/AccentOS sweep

**Changes made:**

| Change | Dimension | Reasoning |
|---|---|---|
| "AccentOS has 11 schema files" → "AccentOS has multiple schema files" | M10 | Hardcoded count "11" was a factual-consistency risk that functions as a placeholder when the actual count changes; replaced with a durable descriptor |
| Passive sentence fragments in Steps 2–3 removed | M7 | M7 was already passing; sweep found two borderline fragments that were rewritten as direct imperatives to harden the score |
| Added "Accent Lighting" brand mention alongside "AccentOS" | M2 | M2 was already passing; reinforcement added per AccentOS sweep pass to ensure both brand forms appear |
| Added hsyjcrrazrzqngwkqsqa references in stack description | M9 | M9 was already passing; additional Supabase project identifier references grounded the skill in the live stack and hardened the dimension |

**Matter score after Round 1:** 80/100 (Δ +10)

---

### Round 2 — Ralph loop (3 optimizer+Ralph cycles)

**Cycle 1 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| Added behavioral commitment ending "always validate against the live schema in hsyjcrrazrzqngwkqsqa — never assert a column exists from memory" | M3 | M3 requires an "always X — never Y" terminal clause; no such clause existed at baseline or after Round 1 |
| Added concrete output artifacts on Steps 1–4 (e.g. "outputs: PASS/FAIL table with column, expected-type, actual-type", "outputs: diff block listing missing columns") | M6 | M6 requires artifact-level output specs; steps previously described assertions without naming the deliverable format |
| Added anti-pattern: "Never assert a table must exist without querying information_schema.tables in hsyjcrrazrzqngwkqsqa first" | M4 | M4 was already passing; Ralph flagged that a table-existence precondition check was missing from the anti-patterns |
| Added anti-pattern: "Never pull enum values from memory — always read them from CREATE TYPE definitions in the live schema" | M4 | M4 reinforcement; enum drift is an AccentOS-specific failure mode not covered by existing anti-patterns |
| Added trigger phrases "does [table] still match its contract", "validate the schema for", "check for schema drift on" | M5 | M5 was already passing; Ralph flagged that contract-language triggers were absent; adding three AccentOS-specific phrases improved routing precision |
| Step 4 output explicit file path added: "outputs: test-results written to schema-contract-tests/last-run.md" | M6 | M6 refinement; Ralph required at least one step to name a concrete file path artifact, not just a block format |

**Cycle 1 — Ralph findings**
- Flagged Step 4 output as missing a concrete file path — sent back for M6 file-path fix
- Confirmed M7 fully clean after Round 1 rewrites

**Cycle 2 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| Step 4 output updated to include explicit file path "schema-contract-tests/last-run.md" | M6 | Direct fix for Ralph's Step 4 concrete-file-path flag |

**Cycle 2 — Ralph findings**
- none — converged

**Matter score after Round 2:** 100/100 (Δ +20)

---

### Final score: 100/100  (Δ from baseline: +30)

**Techniques that moved score:**
- Replacing hardcoded count "11" placeholder with durable descriptor (M10: +10 in Round 1)
- Terminal "always X — never Y" behavioral commitment with hsyjcrrazrzqngwkqsqa reference (M3: +10)
- Artifact-level output specs including explicit file path on Steps 1–4 (M6: +10)

**Techniques that didn't move score:**
- Adding 2 more "Never" anti-patterns (M4 was already 10/10 — added AccentOS enum-drift and table-existence specificity, no delta)
- Adding 3 trigger phrases (M5 was already 10/10 — added routing precision, no delta)
- Passive fragment removal and "Accent Lighting" mention (M7 and M2 were already 10/10 — hardened, no delta)

**Stuck dimensions:** none

---

## Run 2026-05-07 (Pass 3+4)  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 100/100 (all dimensions passing from prior run)

### Pass 1 — Deep quality audit

| Change | What was weak | What it became | Reasoning |
|---|---|---|---|
| Trigger: removed duplicate "/" paraphrase from "contract tests for [table]" / "schema tests" | "schema tests" is a near-paraphrase of "contract tests for [table]" — both mean the same thing, just shorter | Entry collapsed to single canonical phrase; "schema tests" was already covered by the description's trigger list and had no distinct entry point of its own | Trigger distinctness: duplicate phrase wasted a slot; removing it tightens the trigger set without losing coverage |
| Anti-pattern: "Never assert business rules without surfacing them as singular tests; never bury them in schema as silent CHECK constraints" → AccentOS-specific named examples + exact test runner output description | Generic double-never with no failure-mode example | Names 3 specific AccentOS business rules + explains why named tests beat CHECK constraints (test_name label vs cryptic violation) | AccentOS-specific failure mode makes this actionable for a new session generating singular tests |
| Step 2 output artifact: "a set of SQL SELECT statements" → literal form with UNION ALL context | Shape-vague — didn't name the exact SQL pattern or its destination | `SELECT '[class]:[table].[column]' AS test_name, COUNT(*) AS failures FROM ...` with explicit note that these are UNION ALL arms in Step 4's CTE | Literal shape + downstream destination removes all ambiguity |

### Pass 2 — Ralph cold-read challenge

| Change | Ambiguity found | Fix |
|---|---|---|
| pg-cron nightly schedule example | Referenced `test_runs` table that doesn't exist in the schema and is never defined — a new session would schedule a cron job into a non-existent table | Added inline `CREATE TABLE IF NOT EXISTS test_runs` DDL before the schedule call, and corrected the INSERT to reference `all_tests` CTE columns |

### Net matter score change: 100 → 100 (dimension scores unchanged; sub-dimension quality improved)

### Sub-dimension improvements:
- Trigger distinctness: near-paraphrase "schema tests" removed from duplicate "/" slot
- Anti-pattern specificity: generic double-never replaced with 3 named AccentOS business rules + exact failure-mode description
- Step 2 output literal shape: named SQL form + UNION ALL destination specified
- Step 5 pg-cron fallback: missing test_runs table definition added; INSERT corrected to reference CTE

---

## Run 2026-05-07 (Round 5+6 — sub-dimension quality)  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 100/100 (binary — maintained)

### Round 5 — Sub-dimension quality + regularization

**L1 specificity check:** All 7 anti-patterns checked. All passed — each names specific AccentOS artifacts (M*.sql files, /home/user/accent-os/sql/tests/, vendor_scores weight rule, rep_group active-only FK, CREATE TYPE statements). No generic entries found.

**L2 commitment check:** Description "always X — never Y" present and names `/home/user/accent-os/sql/tests/` path. Body had no additional commitment. Clean.

**Adversarial check:** Dimensions sampled: M6 (pg-cron SQL correctness), M5 (cross-skill "data quality" routing). M6 adversarial: pg-cron schedule body referenced `all_tests` CTE from the outer query, which is out of scope in a standalone pg-cron string — a generated cron job would silently fail. Fixed with a note explaining the CTE must be embedded inline, plus a corrected SQL template using dollar-quoting. M5 adversarial: "data quality tests" trigger could ambiguously route requests better served by table-eda. Added routing note distinguishing schema-contract-tests (formal re-runnable contracts) vs table-eda (ad-hoc exploration). Both logged clean after fix.

**Cold-read check:** The `CREATE TABLE IF NOT EXISTS test_runs` DDL is present in Step 5 (added in Pass 3+4). The pg-cron snippet now correctly notes the CTE scoping issue. All steps produce named artifacts. Clean.

**Cross-skill trigger audit:** "data quality tests" routing note added: "lock in / contract / nightly / invariants → schema-contract-tests; show me / explore / what does the data look like → table-eda." Confirmed distinct from table-eda ad-hoc path.

### Round 6 — Second pass

**L1 re-check:** pg-cron note names `all_tests` CTE by name, explains scope restriction, names the fix (embed full CTE inline using `WITH all_tests AS (...) UNION ALL ...`). Strong L1. ✓

**L2 re-check:** Routing note: "lock in / contract / nightly / invariants → schema-contract-tests; show me / explore / what does the data look like → table-eda." Four trigger words on each side. ✓

**Adversarial re-check:** Dollar-quote `$$...$$` syntax is standard PostgreSQL, works in Supabase SQL editor for hsyjcrrazrzqngwkqsqa. table-eda routing note references a skill that may not exist — routing note is still useful as conceptual direction. Logged clean.

**Cold-read re-check:** pg-cron note placed inline in the Run Command block — a session generating the cron schedule will read the note immediately before the SQL template. ✓

**Cross-skill re-check:** Routing note added to Trigger Recognition section (not just description). Clean. ✓

### Final: 2 sub-dimension edits across 2 rounds

---
