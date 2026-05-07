# bc-business-review — optimization history

---

## Run 2026-05-07  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 70/100

| Dim | Name | Score | Reason failed |
|---|---|---|---|
| M1 | Description ≥300 chars | 10 | — |
| M2 | AccentOS named | 10 | — |
| M3 | Behavioral commitment | 0 | No "always X — never Y" commitment block present |
| M4 | ≥5 "Never" anti-patterns | 10 | — |
| M5 | ≥5 trigger phrases | 10 | — |
| M6 | Concrete step outputs | 0 | Steps referenced SQL logic but showed no literal output blocks |
| M7 | Zero passive voice | 0 | "Similar query against" used vague passive-adjacent phrasing; other step descriptions used indirect constructions |
| M8 | No prose walls | 10 | — |
| M9 | Stack reference | 10 | — |
| M10 | No placeholders | 0 | `[N]` unfilled placeholder in deals-concentration threshold reference |
| **Total** | | **70/100** | |

---

### Round 1 — 3-pass structure/prose/AccentOS sweep

**Changes made:**

| Change | Dimension | Reasoning |
|---|---|---|
| "Similar query against" → "Run the same query structure against" in the comparative-period step | M7 | "Similar query" is vague and passive-adjacent; "Run the same query structure" is a direct imperative that specifies what to execute |
| 5th trigger phrase solidified: "quarterly BC review" and "channel health check" added as explicit entries | M5 | M5 was passing at baseline but trigger list had gaps in planning-context phrases; Round 1 sweep added review-cycle language |

**Matter score after Round 1:** 80/100 (Δ +10)

---

### Round 2 — Ralph loop (3 optimizer+Ralph cycles)

**Cycle 1 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| 5th trigger phrase solidified: "BC channel health" added as a standalone trigger for single-channel scope queries | M5 | Ralph noted the trigger list still lacked a channel-scoped short form; adding "BC channel health" covers single-channel review requests |
| Step 3 SQL block made explicit: SELECT clause, FROM clause, WHERE conditions (including date range, store_id), and GROUP BY shown as a fenced code block | M6 | M6 requires concrete output examples; Step 3 previously referenced "the revenue query" without showing the SQL; fenced block closes this gap |
| `[N]` placeholder moved out of prose and into the fenced block as a declared variable: `concentration_threshold := 0.40` with a comment noting it is adjustable | M10 | `[N]` in prose is unfilled template syntax; converting to a declared variable in a fenced block removes the M10 violation while preserving the configurability intent |
| Step 1 window confirmation block added: outputs review period start date, end date, store_ids in scope, and run timestamp | M6 | Step 1 was a silent setup step; adding the window confirmation block gives the operator an explicit scope echo before any data is queried |
| Concentration flag output block added: shows the flag format with customer_id, revenue_share, and flag_reason fields | M6 | The concentration analysis produced a flag but the flag format was implicit; naming the fields makes the output concrete and auditable |
| Anomaly one-line flag format added with dollar examples: `ANOMALY: orders -23% ($14,200 vs $18,450 prior period)` | M6 | Anomaly flags were described in prose; showing the literal one-line format with example dollar values makes Step 4 output immediately reproducible |
| 6th anti-pattern added: never join the deals table without a `status='completed'` filter — draft and cancelled deals inflate revenue figures | M4 | Only 5 anti-patterns at baseline; 6th closes a real SQL trap specific to BC deal records where status is not defaulted to completed |
| Behavioral commitment block added: "Always apply the status='completed' filter on any deals join — never let draft or cancelled records inflate revenue figures" | M3 | M3 was entirely absent; commitment mirrors the 6th anti-pattern and is phrased as a testable SQL rule |

**Cycle 1 — Ralph findings**
- M10 clean — `[N]` converted to declared variable; no other brackets in prose
- M6 confirmed: Step 3 SQL block, Step 1 window block, concentration flag block, and anomaly one-liner are all concrete
- M3 commitment is specific to a SQL filter decision — testable and non-decorative
- Suggested: verify the dollar examples in the anomaly format are realistic for BC order volumes, not obviously toy numbers

**Cycle 2 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| Anomaly example dollar values updated: `$14,200 vs $18,450` → `$41,800 vs $54,200` to match realistic BC channel order volumes | M6 | Ralph flagged that $14k anomaly examples read as micro-scale; BC channel reviews typically operate in $40k–$60k range per period |

**Cycle 2 — Ralph findings**
- none — converged

**Matter score after Round 2:** 100/100 (Δ +20)

---

### Final score: 100/100  (Δ from baseline: +30)

**Techniques that moved score:**
- "Run the same query structure against" → closed M7: direct imperative replaced a vague passive-adjacent phrase; M7 requires every instruction to be an unambiguous command
- `[N]` → `concentration_threshold := 0.40` declared variable in fenced block → closed M10: moving the placeholder into a fenced block as a named variable removes the M10 violation without losing the configurability
- Step 3 SQL block + Step 1 window echo + concentration flag fields + anomaly one-liner → closed M6: four distinct output examples across the skill's steps; M6 was failing because zero literal output blocks existed at baseline
- Behavioral commitment anchored to `status='completed'` SQL filter → closed M3: commitment is verifiable by reading the SQL — not generic advice

**Techniques that didn't move score:**
- 5th trigger phrase additions in Round 1 → M5 was already passing; additions increased coverage without changing score
- Pagination / "Omit LIMIT" style checks → not applicable to this skill; no equivalent constructs present

**Stuck dimensions:** none
