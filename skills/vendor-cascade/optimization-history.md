# vendor-cascade — optimization history

---

## Run 2026-05-07  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 60/100

| Dim | Name | Score | Reason failed |
|---|---|---|---|
| M1 | Description ≥300 chars | 10 | — |
| M2 | AccentOS/Accent Lighting named | 10 | — |
| M3 | Behavioral commitment | 0 | Description did not end with "always X — never Y" |
| M4 | Anti-patterns ≥5 "Never" | 10 | — |
| M5 | Trigger phrases ≥5 | 10 | — |
| M6 | Concrete step outputs | 0 | Steps described cascade actions with no artifact-level output format specified |
| M7 | Zero passive voice | 0 | "Trigger also when" and "do not apply it" were passive or indirect constructions |
| M8 | No prose walls | 10 | — |
| M9 | Stack reference | 10 | — |
| M10 | No placeholders | 0 | Unfilled [a]/[b] tokens present in reverse-cascade prose section |
| **Total** | | **60/100** | |

---

### Round 1 — 3-pass structure/prose/AccentOS sweep

**Changes made:**

| Change | Dimension | Reasoning |
|---|---|---|
| "Trigger also when" → "Trigger when" with formal rewrite of secondary trigger clause | M7 | "Trigger also when" is a compound passive construction; imperative "Trigger when" with a clean subordinate clause removes the passive ambiguity |
| "do not apply it" → "never apply this cascade" | M7 | "do not apply it" uses an indirect pronoun reference and a softened negation; "never apply this cascade" is direct, imperative, and self-referential |
| Formal consistency rewrites across description and step bodies | M7 | Multiple sentences used weak modal constructions ("it would", "this can"); rewritten to active declarative form |

**Matter score after Round 1:** 70/100 (Δ +10)

---

### Round 2 — Ralph loop (3 optimizer+Ralph cycles)

**Cycle 1 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| Added behavioral commitment ending "always propagate vendor status changes downstream in a single transaction — never apply partial cascades" | M3 | M3 requires an "always X — never Y" terminal clause; description had no commitment statement at baseline or after Round 1 |
| Fixed [a]/[b] unfilled placeholders in reverse-cascade prose (replaced with concrete vendor-status examples: "active → inactive" and "inactive → suspended") | M10 | M10 requires zero unfilled placeholder tokens; [a]/[b] were literal token strings left in the reverse-cascade description prose |
| Added concrete 5-column example table for reverse-cascade output: "vendor_id | old_status | new_status | cascade_target | action_taken" | M6 | M6 requires artifact-level output specs; steps previously described the cascade result without naming the deliverable format or structure |
| Added 7th anti-pattern: "Never apply a status cascade across stores without checking for cross-store ID mismatch in store-cwqiwcjxes" | M4 | M4 was already passing; Ralph flagged that the cross-store ID mismatch risk specific to store-cwqiwcjxes was not covered by existing anti-patterns |

**Cycle 1 — Ralph findings**
- Confirmed [a]/[b] fix resolved M10 — no residual placeholder tokens
- Flagged reverse-cascade output table as missing a header-row example — sent back for M6 clarification

**Cycle 2 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| Reverse-cascade output table header row added with explicit column names and a sample data row | M6 | Direct fix for Ralph's flag that the output table lacked a concrete header + data row example |

**Cycle 2 — Ralph findings**
- none — converged

**Matter score after Round 2:** 100/100 (Δ +30)

---

### Final score: 100/100  (Δ from baseline: +40)

**Techniques that moved score:**
- Imperative voice rewrite of "Trigger also when" and "do not apply it" passive constructions (M7: +10 in Round 1)
- Replacing [a]/[b] unfilled placeholder tokens with concrete status examples (M10: +10 in Round 2)
- Terminal "always X — never Y" behavioral commitment added to description (M3: +10)
- Concrete 5-column reverse-cascade output table with header and sample row (M6: +10)

**Techniques that didn't move score:**
- Adding 7th anti-pattern for cross-store ID mismatch in store-cwqiwcjxes (M4 was already 10/10 — added AccentOS specificity, no delta)

**Stuck dimensions:** none

---

## Run 2026-05-07 (Pass 3+4)  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 100/100 (all dimensions passing from prior run)

### Pass 1 — Deep quality audit

| Change | What was weak | What it became | Reasoning |
|---|---|---|---|
| Purpose line rewritten | Two sentences; second sentence restated the orphan rule already implied by the skill name | "Trace every AccentOS vendor score component back to a named Accent Lighting priority and flag anything that does not connect as an orphan." | Single tight sentence with a specific verb; eliminates redundancy |
| Reverse-cascade Step 1 Supabase table named | "Pull vendor Y's per-metric values from BC store-cwqiwcjxes / Supabase" — slash-Supabase is vague; no table named | "from BC store-cwqiwcjxes and from the `vendor_scores` table in Supabase `hsyjcrrazrzqngwkqsqa`" | Every Supabase reference must name the project ID and the specific table |
| Reverse-cascade Step 4 output instruction clarified | "Vendor Y's score is X" — X is a shape-vague placeholder; instructional note said "actual computed values" but didn't say what to do with X | Replaced X with "[computed total 0–1]" and added "replace each bracketed token with the actual numeric result — never leave as-is" | Fill-in requirement was implied but not stated; now unambiguous |

### Pass 2 — Ralph cold-read challenge

| Change | What was ambiguous | What it became | Reasoning |
|---|---|---|---|
| "Trigger also when" clause rewritten | "Trigger also when Michael questions a specific vendor's rank..." — "also" implies conjunction with the primary trigger list; new-session reader could require one of the 8 phrases to also be present | "Trigger when Michael questions a specific vendor's rank or asks for score explainability for a partner, board member, or store owner — even if none of the phrases above appear verbatim." | Removes the "also" conjunction ambiguity; trailing clause confirms standalone trigger |

### Net matter score change: 100 → 100 (dimension scores unchanged; sub-dimension quality improved)

### Sub-dimension improvements:
- Purpose line: single-verb sentence, no redundancy
- Reverse-cascade Supabase reference names exact table (`vendor_scores` in `hsyjcrrazrzqngwkqsqa`)
- Reverse-cascade output token fill-in is explicitly instructed, not implied
- Secondary trigger clause is now a standalone condition, not an "also" conjunction

---

## Run 2026-05-07 (Round 5+6 — sub-dimension quality)  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 100/100 (binary — maintained)

### Round 5 — Sub-dimension quality + regularization
**L1 specificity check:** All 7 existing Never anti-patterns name specific AccentOS artifacts. Cross-skill boundary gap found: no anti-patterns directed to vendor-clarity-test or vendor-risk-register, despite both being adjacent skills with overlapping surface triggers. Added two new anti-patterns naming both skills with their specific tables and dimensions.
**L2 commitment check:** Description ends with "Always produces three paste-ready outputs: a cascade table, an orphan list, and a vendor_scores SQL stub for Supabase hsyjcrrazrzqngwkqsqa — never returns prose-only analysis." — three specific deliverables named with project ID. Passes.
**Adversarial check:** Dimensions sampled: M6 (concrete step outputs), M10 (no placeholders). M6: Steps 3–6 all have concrete example tables and output blocks with real column names. Reverse-cascade variant has a 5-column table with actual computed values as examples. M10: `[computed total 0–1]` and `[computed]` in reverse-cascade prose are runtime instruction tokens with explicit fill-in requirement ("replace each bracketed token with the actual numeric result — never leave as-is") — not unfilled placeholders. Both pass.
**Cold-read check:** Walked through reverse-cascade variant: Michael asks "why is Acme Lighting ranked 3rd?" → Steps 1-3, then branch, pull from BC store-cwqiwcjxes and `vendor_scores` in `hsyjcrrazrzqngwkqsqa`, multiply weights, output 5-column table. Step 4 says "replace each bracketed token" — unambiguous instruction. Clean.
**Cross-skill trigger audit:** vendor-cascade vs. vendor-clarity-test: vendor-clarity-test already has an explicit Do-Not-Trigger naming vendor-cascade; vendor-cascade previously had no reciprocal redirect. Added. vendor-cascade vs. vendor-risk-register: vendor-risk-register description says "Do not use for individual vendor diagnosis (that's vendor-cascade)"; vendor-cascade previously had no reciprocal redirect. Added. Both gaps now closed.

### Round 6 — Second pass
**L1 re-check:** Both new anti-patterns name specific artifacts: `vendor_scores`, `vendor_overrides`, `project-profiles.md` for clarity-test; concentration/volatility/stockouts/GMC dimensions for risk-register. Passes.
**L2 re-check:** Description commitment unchanged and specific. Passes.
**Adversarial re-check on M5 and M3:** M5: 8 trigger phrases, all distinct — no near-duplicates. "where does this score come from" vs. "what's actually driving the ranking" ask subtly different questions (source vs. contributor); both valid. M3: commitment names three specific output artifacts. Both pass.
**Cold-read re-check:** New anti-patterns are immediately actionable — each names the target skill and its scope. A new session encountering a "consistency across multiple vendors" request now has an explicit redirect rather than needing to reason about skill scope. Passes.
**Cross-skill trigger audit:** All three vendor skill boundaries are now bidirectional: vendor-cascade ↔ vendor-clarity-test, vendor-cascade ↔ vendor-risk-register. No further collisions found.

### Final: 2 sub-dimension edits across 2 rounds

