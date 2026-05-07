# rep-group-matchmaker — optimization history

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
| M6 | Concrete step outputs | 0 | Step 3 fingerprint logic described but no literal output block shown |
| M7 | Zero passive voice | 0 | Two-sentence schema-adapt instruction used passive construction; "Use these patterns" was indirect |
| M8 | No prose walls | 10 | — |
| M9 | Stack reference | 10 | — |
| M10 | No placeholders | 0 | `[vendor]` in YAML frontmatter; `[vendor name]` in trigger phrase list |
| **Total** | | **60/100** | |

---

### Round 1 — 3-pass structure/prose/AccentOS sweep

**Changes made:**

| Change | Dimension | Reasoning |
|---|---|---|
| Two-sentence schema-adapt instruction merged into one active imperative: "Adapt the fingerprint schema to the current vendor dataset before scoring" | M7 | Passive two-sentence form ("the schema should be adapted…") converted to single direct command |
| "Use these patterns to suggest assignments" tightened to "Apply these patterns to produce assignments" | M7 | "suggest" is hedging language; "produce" is a direct output verb that eliminates passive-adjacent softening |

**Matter score after Round 1:** 70/100 (Δ +10)

---

### Round 2 — Ralph loop (3 optimizer+Ralph cycles)

**Cycle 1 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| `[vendor]` removed from YAML frontmatter trigger field; field updated to list concrete skill name instead | M10 | Bracket in YAML frontmatter is unfilled template syntax — M10 applies to all file regions including metadata |
| `[vendor name]` trigger phrase replaced with concrete examples: "match Apex Lighting to a rep group", "which rep group fits Cornerstone Hardware" | M10 / M5 | Unfilled bracket in a trigger phrase is doubly problematic: M10 violation and weakens M5 (trigger phrases must be recognizable natural-language inputs) |
| Concrete fingerprint block example added to Step 3: shows actual YAML output with territory, category_focus, avg_order_size, and existing_vendor_overlap fields | M6 | Step 3 described the fingerprint concept but showed no literal output; M6 requires a concrete example block at the step boundary |
| 6th anti-pattern added: never skip the INSUFFICIENT_DATA block when fewer than 3 data points are available for a vendor | M4 | Only 5 anti-patterns at baseline; 6th closes a real edge case — sparse vendor data produces unreliable fingerprints |
| UNASSIGNED SET count-echo block added to Step 1: outputs count of unassigned vendors, run timestamp, and schema version detected | M6 | Step 1 had no output block; count-echo gives the operator an immediate sanity check before committing to the full match run |
| Behavioral commitment block added: "Always emit the INSUFFICIENT_DATA block for sparse vendors — never suppress it to keep output clean" | M3 | M3 was entirely absent; commitment is anchored to the 6th anti-pattern scenario, making it operational rather than decorative |

**Cycle 1 — Ralph findings**
- M10 clean — no remaining brackets in frontmatter or trigger list
- M6 confirmed: fingerprint block and count-echo block both use real field names, not placeholders
- M3 commitment directly references the INSUFFICIENT_DATA output, tying it to observable behavior
- Suggested: confirm the YAML fingerprint example uses realistic numeric ranges, not dummy values like "999"

**Cycle 2 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| Fingerprint block example values updated to realistic ranges: avg_order_size 4200–8800, overlap_score 0.3–0.7 | M6 | Ralph flagged dummy numeric values in the example block; realistic ranges make the output block useful as a reference |

**Cycle 2 — Ralph findings**
- none — converged

**Matter score after Round 2:** 100/100 (Δ +30)

---

### Final score: 100/100  (Δ from baseline: +40)

**Techniques that moved score:**
- Concrete trigger phrase examples replacing `[vendor name]` → closed M10 and reinforced M5: named real-sounding companies make triggers immediately recognizable as natural-language inputs
- YAML fingerprint block with real field names and realistic values → closed M6: the step description alone doesn't satisfy M6; a literal output example with domain-appropriate numbers does
- UNASSIGNED SET count-echo at Step 1 → reinforced M6: every major step boundary needs a concrete output; Step 1 was a silent gather step before this change
- Behavioral commitment anchored to INSUFFICIENT_DATA suppression → closed M3: the commitment is specific enough to prevent a real behavior (hiding sparse-data warnings)

**Techniques that didn't move score:**
- "suggest" → "produce" verb swap → contributed to M7 fix but Round 1 M7 was the main driver; this change was stylistic within an already-addressed dimension

**Stuck dimensions:** none

---

## Run 2026-05-07 (Pass 3+4)  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 100/100 (all dimensions passing from prior run)

### Pass 1 — Deep quality audit

| Change | What was weak | What it became | Reasoning |
|---|---|---|---|
| 5th trigger phrase added | Trigger Recognition had only 4 bullet lines; ≥5 distinct triggers is the sub-dimension standard | Added "which vendors still have no rep group" / "how many are still unmatched" — a distinct count-query entry point | The unassigned-count-check case (Michael wants to see progress without running a full match) had no trigger, creating a routing gap |
| `-- Supabase hsyjcrrazrzqngwkqsqa` added to Step 1 SQL | SQL block had no project context; only the description frontmatter named the project | Added comment as first line of Step 1 SELECT | Every SQL block that touches Supabase must carry the project ID |
| `-- Supabase hsyjcrrazrzqngwkqsqa` added to Step 2 SQL | Same as Step 1 — no project context in the code block | Added comment as first line of Step 2 SELECT/JOIN | Consistent project ID on every SQL block for paste-readiness |

### Pass 2 — Ralph cold-read challenge

| Change | What was ambiguous | What it became | Reasoning |
|---|---|---|---|
| `state_proximity` "neighboring" definition added | "0.5 if neighboring" — undefined; a new session cannot determine what "neighboring" means for US states without external context | "0.5 if a state sharing a border with the cluster's modal state (use US contiguous-border adjacency)" | Precondition was ambiguous; a new session could not execute this dimension deterministically without knowing the adjacency rule |
| Supabase project ID added to Block 3 UPDATE SQL | "-- Apply only after Michael spot-checks..." — no project context in the SQL comment | "-- Supabase hsyjcrrazrzqngwkqsqa — apply only after Michael spot-checks the HIGH rows above" | Paste-ready SQL must carry the project ID; this block was the only SQL block without it after Pass 1 edits |

### Net matter score change: 100 → 100 (dimension scores unchanged; sub-dimension quality improved)

### Sub-dimension improvements:
- Trigger list: 5th distinct entry point added (unassigned-count progress check)
- Step 1 and Step 2 SQL blocks carry `-- Supabase hsyjcrrazrzqngwkqsqa` for paste-readiness
- `state_proximity` adjacency rule is now deterministic (US contiguous-border adjacency)
- Block 3 UPDATE SQL carries project ID — all SQL blocks now consistent

---

## Run 2026-05-07 (Round 5+6 — sub-dimension quality)  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 100/100 (binary — maintained)

### Round 5 — Sub-dimension quality + regularization

**L1 specificity check:** AP4 ("Never ignore the state_proximity dimension") was generic — named geography as important but did not identify the AccentOS artifact or consequence. Rewritten to name `rep_groups.regions` field and AccentOS M19 as the specific artifact harmed.

**L2 commitment check:** No explicit always/never behavioral commitment existed in the skill body (only in the frontmatter description). Added commitment between Step 5 and Step 6: "Always emit all five BLOCKs in Step 6 for every run — never collapse BLOCK 4 or BLOCK 5 into a footnote because the vendor count is small." Names specific BLOCKs (4 and 5), specific failure scenario (small vendor count suppression), and M19 tracking rationale.

**Adversarial check:** Dimensions sampled: M4 (AP4), M3 (new commitment). AP4 adversarial: fixed by L1 rewrite. M3 adversarial: zero-INSUFFICIENT_DATA edge case — commitment "never collapse" still emits an empty BLOCK 5 correctly; no dead-end. Both logged clean after fix.

**Cold-read check:** All five BLOCKs in Step 6 are fully defined. Scoring formula in Step 4 uses deterministic rules. State adjacency rule is explicit. Fingerprint output in Step 3 uses realistic values. Clean.

**Cross-skill trigger audit:** "M19 batch" / "M19 fix" triggers verified distinct from vendor-onboard-checklist. vendor-onboard-checklist handles individual vendor setup; rep-group-matchmaker handles bulk unassigned-vendor scoring. No overlap. Clean.

### Round 6 — Second pass

**L2 re-check:** "Always emit all five BLOCKs... never collapse BLOCK 4 or BLOCK 5 into a footnote because the vendor count is small" — both artifact names (BLOCK 4, BLOCK 5) and failure scenario specified. Strong L2 commitment. ✓

**L1 re-check:** AP4 now names `rep_groups.regions`, territory coverage, and AccentOS M19 as specific failure artifacts. Strong L1. ✓

**Adversarial re-check:** M3 commitment zero-vendor edge case clean. No further issues found.

**Cold-read re-check:** Step 5 → Step 6 transition now has explicit commitment anchoring expected output. Clean.

**Cross-skill re-check:** No new overlaps introduced. Clean.

### Final: 2 sub-dimension edits across 2 rounds
