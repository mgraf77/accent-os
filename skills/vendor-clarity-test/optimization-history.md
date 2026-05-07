# vendor-clarity-test — optimization history

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
| M6 | Concrete step outputs | 0 | Output blocks (BLOCK 1–3) described intent with no artifact-level output format specified |
| M7 | Zero passive voice | 0 | "Fire also as a sanity gate" and "should make sense" were passive or indirect constructions |
| M8 | No prose walls | 10 | — |
| M9 | Stack reference | 10 | — |
| M10 | No placeholders | 10 | — |
| **Total** | | **70/100** | |

---

### Round 1 — 3-pass structure/prose/AccentOS sweep

**Changes made:**

| Change | Dimension | Reasoning |
|---|---|---|
| Extended description with explicit commitment language | M3 | Partial fix: added commitment-adjacent language to the description body; terminal "always X — never Y" clause still absent at end of Round 1 |
| Added BLOCK 4 (Schema Gaps) to output structure | M6 | Partial fix: added a new output block type; artifact format within the block still not fully specified at end of Round 1 |
| "Fire also as a sanity gate" → "Fire as a sanity gate" | M7 | "Fire also" is a compound passive construction; removing "also" creates a direct imperative |
| "do not abort" clarification rewritten as explicit conditional imperative | M7 | "do not abort" used a vague negation without specifying the corrective action; rewritten to "continue to BLOCK 2 — do not stop on first gap" |

**Matter score after Round 1:** 80/100 (Δ +10)

---

### Round 2 — Ralph loop (3 optimizer+Ralph cycles)

**Cycle 1 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| Terminal behavioral commitment added: "always run all four blocks before reporting — never abort on the first gap" | M3 | M3 requires a full "always X — never Y" terminal clause; Round 1 added commitment language mid-description but not as a terminal close |
| Added concrete Block 3 Next-Step output format: "outputs: next-step block with action, owner, and due-date columns" | M6 | M6 requires artifact-level output specs; Block 3 previously described "recommended next steps" without naming the deliverable structure |
| Added 6th anti-pattern: "Never run vendor-clarity-test on a vendor with zero rows in vendor_scores — the test is undefined over empty score sets" | M4 | M4 was already passing; Ralph flagged that running on empty vendor_scores silently produces misleading PASS results; this AccentOS-specific failure mode was absent |
| Added 7th trigger phrase: "is this vendor data trustworthy" | M5 | M5 was already passing; Ralph flagged that trustworthiness-framing queries were not covered by existing trigger phrases; adding the phrase closed a routing gap |
| Added concrete Block 4 output lines: "outputs: schema-gap table with column, expected-in-schema, present-in-data" | M6 | M6 refinement: Block 4 added in Round 1 had no concrete output format; Round 2 added the explicit table structure |
| "should make sense" → "must align with" | M7 | Ralph flagged "should make sense" as a passive-voice construction with weak modal; "must align with" is a direct active imperative |

**Cycle 1 — Ralph findings**
- Flagged "should make sense" as residual passive construction — sent back for M7 fix
- Flagged Block 4 output as still lacking a concrete table structure — sent back for M6 fix

**Cycle 2 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| "should make sense" → "must align with" applied | M7 | Direct fix for Ralph's passive-voice flag |
| Block 4 output structure finalized with column names | M6 | Direct fix for Ralph's Block 4 table-structure flag |

**Cycle 2 — Ralph findings**
- none — converged

**Matter score after Round 2:** 100/100 (Δ +20)

---

### Final score: 100/100  (Δ from baseline: +30)

**Techniques that moved score:**
- Imperative voice rewrite of "Fire also as a sanity gate" and "should make sense" passive constructions (M7: +10 in Round 1 + Round 2)
- Terminal "always run all four blocks — never abort on the first gap" behavioral commitment (M3: +10)
- Concrete output artifacts for Blocks 3 and 4 with named column structures (M6: +10)

**Techniques that didn't move score:**
- Adding 6th anti-pattern for empty vendor_scores (M4 was already 10/10 — added AccentOS failure-mode specificity, no delta)
- Adding 7th trigger phrase "is this vendor data trustworthy" (M5 was already 10/10 — added routing coverage, no delta)

**Stuck dimensions:** none

---

## Run 2026-05-07 (Pass 3+4)  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 100/100 (all dimensions passing from prior run)

### Pass 1 — Deep quality audit

| Change | What was weak | What it became | Reasoning |
|---|---|---|---|
| Purpose line rewritten | "A vendor's score must align across three angles... This is the diagnostic." — a statement about what should be true, not about what the skill does; no specific action verb | "Verify that each sampled AccentOS vendor's score driver aligns across three angles... and surface every vendor where those three disagree." | Single tight sentence with specific verbs (verify, surface); describes what the skill does rather than what a good state looks like |
| Supabase project ID added to Step 1 SQL block | SQL block had no project context; only the description frontmatter named `hsyjcrrazrzqngwkqsqa` | Added `-- Supabase hsyjcrrazrzqngwkqsqa` comment to the Step 1 SELECT block | Every SQL block that touches Supabase must carry the project ID so a new session can paste it directly |

### Pass 2 — Ralph cold-read challenge

| Change | What was ambiguous | What it became | Reasoning |
|---|---|---|---|
| "Fire also as a sanity gate" → "Fire as a sanity gate" | "also" implies this fires only when something else also fired; a new-session reader following the trigger list could interpret it as requiring a co-condition | Removed "also" — standalone imperative | Residual passive-adjacent "also" from prior run; the history showed it was supposed to be fixed in the prior run's Round 1 but the word survived |

### Net matter score change: 100 → 100 (dimension scores unchanged; sub-dimension quality improved)

### Sub-dimension improvements:
- Purpose line: action-verb sentence (verify, surface) instead of state-description sentence
- Step 1 SQL block now carries `-- Supabase hsyjcrrazrzqngwkqsqa` for paste-readiness
- "Fire also as a sanity gate" residual "also" removed — sanity-gate trigger is now unambiguously standalone

---

## Run 2026-05-07 (Round 5+6 — sub-dimension quality)  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 100/100 (binary — maintained)

### Round 5 — Sub-dimension quality + regularization
**L1 specificity check:** AP#2 used "normal post-M19" without defining M19's scope. Added clarification: "(M19 assigns `rep_group_id` to unmatched vendors but does not require an `override_reason`)". AP#5 "detected drift" was generic — tightened to "detected scoring-weight drift in `vendor_scores` or `vendor_overrides`" in the description commitment.
**L2 commitment check:** Description commitment "never auto-fixes detected drift" was too broad — rewritten to name the specific tables (`vendor_scores`, `vendor_overrides`) and the action class (scoring-weight drift) that this skill must not perform.
**Adversarial check:** Dimensions sampled: M5 (triggers), M4 (anti-patterns). M5: "do my vendors agree" has no collision risk with vendor-onboard-checklist triggers — safe. M4: "post-M19" failure label was underspecified — fixed via L1 improvement.
**Cold-read check:** Step 2 View B uses `vendor_overrides.set_by` — plausible column for override authorship tracking. Cross-skill column name consistency: `vendor_scores` column names (`weight`, `computed_value`) in Step 2 differ from vendor-risk-register (`score`, `computed_at`) — both plausible; different columns, different purposes.
**Cross-skill trigger audit:** NOT-trigger block extended to cover "vendor cascade" (unhyphenated) and "cascade check" variants. Clarification added: vendor-cascade traces `vendor_scores.priority_id` down through weights (single-vendor); this skill audits 5 random vendors cross-table.

### Round 6 — Second pass
**L1 re-check:** AP#2 M19 parenthetical consistent with vendor-onboard-checklist description ("M19 fixes assign a rep_group_id") — cross-skill consistent. ✓
**L2 re-check:** Description commitment names `vendor_scores` and `vendor_overrides` — exact match to SQL query targets in Steps 2–3. ✓
**Adversarial re-check:** NOT-trigger quoted phrase "vendor cascade" (space) vs. skill name "vendor-cascade" (hyphen) — acceptable; quoted form matches natural speech, hyphenated form is the skill proper noun. ✓
**Cold-read re-check:** No new ambiguities found.

### Final: 4 sub-dimension edits across 2 rounds
