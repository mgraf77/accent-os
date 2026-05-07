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
