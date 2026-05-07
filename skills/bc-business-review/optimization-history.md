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

---

## Run 2026-05-07 (Pass 3+4)  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 100/100 (all dimensions passing from prior run)

### Pass 1 — Deep quality audit

| Change | What was weak | What it became | Reasoning |
|---|---|---|---|
| Purpose line rewritten | "Accent Lighting has no current 'what happened this week' digest" — describes the problem, no action verb | "Produce a weekly aggregate performance digest for Accent Lighting from Supabase hsyjcrrazrzqngwkqsqa — answering 'is the business moving in the right direction' with WoW revenue, AOV, anomaly flags, and concentration risk callouts…" | Verb-first ("Produce"), names Supabase ID, lists the specific output types |
| Step 5 BLOCK 1 emoji removed | `⚠ Concentration:` used a warning emoji | `CONCENTRATION FLAG:` — text-only label | Project instructions prohibit emojis; emoji also renders inconsistently across output targets |

### Pass 2 — Ralph cold-read challenge

| Change | What was missing | What it became | Reasoning |
|---|---|---|---|
| Step 4 SQL invalid double-CTE fixed | Two sequential `WITH` clauses (`WITH historical AS (…) WITH this_week_rev AS (…)`) — PostgreSQL syntax error; a new session executing this SQL would get an immediate parse failure | Merged into a single `WITH weekly_rev AS (…), historical AS (…), this_week_rev AS (…)` block | PostgreSQL requires all CTEs in a single `WITH` clause; the broken query would halt the entire anomaly detection step |

### Net matter score change: 100 → 100

### Sub-dimension improvements:
- Purpose line: verb-first, Supabase project ID named, output type list added
- Step 5 BLOCK 1: emoji replaced with text-only concentration flag label
- Step 4 SQL: invalid double-WITH syntax corrected to single CTE block with three named CTEs

---

## Run 2026-05-07 (Round 5+6 — sub-dimension quality)  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 100/100 (binary — maintained)

### Round 5 — Sub-dimension quality + regularization

**L1 specificity check:**
AP1 ("Never report KPIs without WoW comparison — point-in-time numbers without trend are noise") was generic — no AccentOS artifact or failure example named. Rewrote to include a concrete failure example ("$142,000 revenue with no prior-period delta fails the BLOCK 1 output spec and gives Michael nothing to act on"). APs 2–6 already had specific artifacts (js/demand_forecast.js, deals table, status='completed', analysis-snapshot skill, 4-week threshold).

**L2 commitment check:**
Commitment ("Always produces a 4-block paste-ready review — never returns prose-only") has no vague words. "4-block" is defined in Step 5 template; "paste-ready" is concrete. Already tight.

**Adversarial check:**
Dimensions sampled: M6, M9
- M6: Step 2 SQL has $1/$2/$3/$4 parameterized bindings. Step 3 SQL blocks have $1/$2. Step 4 uses $1/$2. Step 5 4-block template is concrete. No failure path found.
- M9: `hsyjcrrazrzqngwkqsqa` in frontmatter and Step 2 SQL comment; `deals`, `vendors`, `products` tables; `bc-store-cwqiwcjxes` in frontmatter. Stack references strong. No failure path found.

**Cold-read check:**
Two issues found and fixed:
1. Step 1 window example used hardcoded 2024 dates — stale relative to current 2026 context. Replaced with `YYYY-MM-DD` format template inside fenced block plus a 2026-dated illustrative example.
2. Step 5 BLOCK 3 "Reason hypotheses (best-guess from vendor metadata)" gave no guidance on what metadata to use — a cold-read session would guess or skip. Replaced with "best-guess from vendor name + category pattern" with two concrete hypothesis types (seasonal/promo pattern; cross-reference against BLOCK 2 category breakdown).

**Cross-skill trigger audit:**
- "weekly review" / "BC business review" — distinct to bc-business-review. Clean.
- "anomaly check on revenue" — not claimed by analysis-snapshot or vendor-cascade. Clean.
- "show me the numbers" — generic phrasing but scoped to bc-business-review by AccentOS context. No overlap with supabase-sql-magic (which fires on explicit SQL queries, not aggregate review requests). Clean.

**SQL validation (special note):**
Step 4 single-WITH-clause verified: `WITH weekly_rev AS (...), historical AS (...), this_week_rev AS (...)` — three CTEs all defined and all referenced in SELECT. No double-WITH. No undefined CTEs. No phantom columns. Clean.

### Round 6 — Second pass

**L1 specificity check:**
AP1 rewrite from Round 5 verified: names BLOCK 1, cites "$142,000 revenue" as concrete failure example. All APs specific.

**L2 commitment check:**
Commitment unchanged — still tight. No rewrite needed.

**Adversarial check:**
Dimensions sampled: M3, M4
- M3: "Always produces a 4-block paste-ready review" — failure path: empty anomaly section. Step 4 "Insufficient history" block handles this explicitly with a named BLOCK 3 message. 4-block structure maintained even when anomaly detection unavailable. No failure path found.
- M4 AP6 ("Never join deals to vendors without filtering status='completed'"): verified — status filter present in Step 2, Step 3 vendor query, Step 3 category query, Step 4 all CTEs. Consistent. No failure path found.

**Cold-read check:**
Step 4 SQL USING clause (`JOIN this_week_rev tw USING (vendor_id)`) — valid PostgreSQL syntax. `HAVING COUNT(*) >= 4` counts week-rows per vendor; matches the "≥4 weeks history" threshold. Clean.

**Cross-skill trigger audit:**
No new triggers added in Round 5. No overlaps found.

### Final: 3 sub-dimension edits applied across 2 rounds
Techniques that moved quality: L1-specificity rewrite on AP1 (named BLOCK 1 + concrete failure example); cold-read fix on Step 1 window dates (stale 2024 → YYYY-MM-DD template + 2026 example); cold-read fix on Step 5 BLOCK 3 hypothesis guidance (named vendor name + category pattern as hypothesis source)
Techniques that didn't: Adversarial checks on M6/M9/M3/M4 — no failure paths found; L2 check — commitment already tight
