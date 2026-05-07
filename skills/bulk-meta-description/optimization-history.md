# bulk-meta-description — optimization history

---

## Run 2026-05-07  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 90/100

| Dim | Name | Score | Reason failed |
|---|---|---|---|
| M1 | Description ≥300 chars | 10 | — (925 chars) |
| M2 | AccentOS named | 10 | — |
| M3 | Behavioral commitment | 10 | — |
| M4 | ≥5 "Never" anti-patterns | 10 | — |
| M5 | ≥5 trigger phrases | 10 | — |
| M6 | Concrete step outputs | 10 | — |
| M7 | Zero passive voice | 10 | — |
| M8 | No prose walls | 10 | — |
| M9 | Stack reference | 10 | — |
| M10 | No placeholders | 0 | `[145, 160]` bracket notation in Step 4 prose (outside code fence); `[must land in 145–160]` bracket in Step 4 check description |
| **Total** | | **90/100** | |

---

### Round 1 — 3-pass structure/prose/AccentOS sweep

**Changes made:**

| Change | Dimension | Reasoning |
|---|---|---|
| No structural or prose changes made | — | Passes 1 and 2 found no passive voice, no prose walls, no M3/M5/M9 gaps. M10 bracket issue was subtle — bracket notation blended with code-style formatting and was missed in the sweep |

**Matter score after Round 1:** 90/100 (Δ +0)

---

### Round 2 — Ralph loop (3 optimizer+Ralph cycles)

**Cycle 1 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| Step 4 char-count range `[145, 160]` → `145–160` (en-dash, no brackets) | M10 | Square-bracket notation outside a code fence is unfilled template syntax under M10 — even a numeric range fails if wrapped in brackets |
| Step 4 check description `[must land in 145–160]` → `must land in 145–160` (brackets stripped) | M10 | Same violation: bracket wrapping a constraint description reads as placeholder syntax |
| 6th anti-pattern added: never run the batch without a pre-run quality check confirming product_name and category fields are non-null for all rows in scope | M4 | M4 already had ≥5; 6th anti-pattern adds defensive value — null upstream fields produce malformed descriptions that pass char-count but fail content quality |
| BLOCK 3 CSV output example updated to include concrete `upstream_action` column values: `rewrite`, `keep`, `flag_for_review` | M6 | M6 was already passing; Ralph reinforcement pass confirmed the CSV example needed the upstream_action column populated with real enum values, not an empty column |
| Step 1 scope confirmation block refined: added explicit count of rows in scope and batch_id for traceability | M6 | M6 reinforcement — the existing Step 1 output block lacked a batch_id field, which makes cross-referencing against the CSV harder |

**Cycle 1 — Ralph findings**
- M10 confirmed clean — no remaining bracket notation anywhere in file
- M6 CSV block now has upstream_action populated with concrete enum values
- Step 1 block now carries batch_id
- Suggested: verify the 6th anti-pattern is phrased as "Never run" not "Do not run" for list consistency

**Cycle 2 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| 6th anti-pattern phrasing aligned: "Never run the batch without…" matches existing "Never" register | M4 | Ralph flagged "Do not run" vs "Never run" inconsistency |

**Cycle 2 — Ralph findings**
- none — converged

**Matter score after Round 2:** 100/100 (Δ +10)

---

### Final score: 100/100  (Δ from baseline: +10)

**Techniques that moved score:**
- Stripping brackets from `[145, 160]` and `[must land in 145–160]` → closed M10: the violation was subtle because the brackets looked like code syntax, but M10 applies to any bracket-wrapped non-literal text outside a fenced block

**Techniques that didn't move score:**
- Round 1 full sweep → no score change: all 9 passing dimensions were already clean; the M10 issue was not detected in the 3-pass sweep because bracket-wrapped numeric ranges are easy to misread as intentional formatting
- 6th anti-pattern and M6 reinforcements → M4 and M6 were already passing; these changes added quality without changing dimension scores

**Stuck dimensions:** none
