# priority-articulation — optimization history

---

## Run 2026-05-07  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 70/100

| Dim | Name | Score | Reason failed |
|---|---|---|---|
| M1 | Description ≥300 chars | 10 | — |
| M2 | AccentOS named | 10 | — |
| M3 | Behavioral commitment | 0 | No "always X — never Y" commitment present |
| M4 | ≥5 "Never" anti-patterns | 10 | — |
| M5 | ≥5 trigger phrases | 10 | — |
| M6 | Concrete step outputs | 10 | — |
| M7 | Zero passive voice | 10 | — |
| M8 | No prose walls | 10 | — |
| M9 | Stack reference | 0 | No Supabase/BC stack reference |
| M10 | No placeholders | 0 | Bracketed placeholder [topic] present in trigger phrases |
| **Total** | | **70/100** | |

---

### Round 1 — 3-pass structure/prose/AccentOS sweep

**Changes made:**

| Change | Dimension | Reasoning |
|---|---|---|
| Trigger preamble "Run this skill when Michael says anything like:" → "Run when Michael says:" | M5 | Tightened phrasing to match AccentOS trigger style |
| YAML trigger description cleaned of filler text | M10 | Reduced placeholder-adjacent boilerplate in trigger block |

**Matter score after Round 1:** 80/100 (Δ +10)

---

### Round 2 — Ralph loop (3 optimizer+Ralph cycles)

**Cycle 1 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| Trigger phrases de-bracketed — [topic] placeholder replaced with concrete example phrase | M10 | Bracketed tokens are placeholders; concrete phrases are required |
| 7 triggers made distinct and concrete — no two share the same opener | M5 | Trigger variety ensures routing across different phrasing patterns |
| Step 2 contradiction with anti-pattern resolved — output now reads "flag and stop" | M6 | Step previously implied proceeding while anti-pattern said stop; made consistent |
| "Aim for" passive construction → "Propose" | M7 | Passive voice removed; imperative verb leads the instruction |
| 6th anti-pattern added — field existence verification required before writing rule spec | M4 | Only 5 existed; added concrete AccentOS-specific failure mode |
| Behavioral commitment added to description — always / never structure | M3 | M3 requires explicit shipped-behavior commitment |
| Stack reference added — Supabase BC field IDs named in step context | M9 | M9 requires reference to AccentOS stack (Supabase/BC) |

**Cycle 1 — Ralph findings**
- M10 still partially flagged — one trigger used "X or Y" phrasing that read as template
- M6 Step 2 output block not yet concrete enough — no example artifact shown

**Cycle 2 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| Remaining ambiguous trigger rewritten with fully concrete phrasing | M10 | Eliminated last template-style phrase |
| Step 2 output block given concrete example artifact with field names | M6 | Satisfies M6 requirement for concrete step outputs |

**Cycle 2 — Ralph findings**
- none — converged

**Cycle 3 — Optimizer**
No new changes — all Ralph findings addressed in Cycle 2

**Cycle 3 — Ralph findings**
- none — converged

**Matter score after Round 2:** 100/100 (Δ +20)

---

### Final score: 100/100  (Δ from baseline: +30)

**Techniques that moved score:**
- De-bracketing trigger phrases → closed M10: [topic] was a live placeholder; concrete example eliminated ambiguity
- Adding behavioral commitment → closed M3: explicit "always / never" commitment was absent from description
- Stack reference (Supabase/BC field IDs) → closed M9: AccentOS-specific context required, not generic
- 6th anti-pattern → reinforced M4: AccentOS-specific failure mode (field existence check) added
- "Propose" replacing "Aim for" → reinforced M7: passive construction removed

**Techniques that didn't move score:**
- Trigger preamble trim (Round 1) → M5 was already passing; contributed to style consistency only

**Stuck dimensions:** none

---
