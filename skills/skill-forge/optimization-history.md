# skill-forge — optimization history

---

## Run 2026-05-07  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 80/100

| Dim | Name | Score | Reason failed |
|---|---|---|---|
| M1 | Description ≥300 chars | 10 | — |
| M2 | AccentOS named | 10 | — |
| M3 | Behavioral commitment | 0 | No "always X — never Y" commitment present |
| M4 | ≥5 "Never" anti-patterns | 10 | — |
| M5 | ≥5 trigger phrases | 10 | — |
| M6 | Concrete step outputs | 0 | Steps described process but showed no example artifacts |
| M7 | Zero passive voice | 10 | — |
| M8 | No prose walls | 10 | — |
| M9 | Stack reference | 10 | — |
| M10 | No placeholders | 10 | — |
| **Total** | | **80/100** | |

---

### Round 1 — 3-pass structure/prose/AccentOS sweep

**Changes made:**

| Change | Dimension | Reasoning |
|---|---|---|
| Description appended shipped-behavior commitment: "Always commits forged skills to the active branch — never leaves work uncommitted" | M3 | M3 requires explicit always/never behavioral commitment; none existed |

**Matter score after Round 1:** 90/100 (Δ +10)

---

### Round 2 — Ralph loop (3 optimizer+Ralph cycles)

**Cycle 1 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| 13th anti-pattern added — never run Step 2 on only one source class | M4 | Existing anti-patterns were general; added AccentOS-specific forge failure mode |
| Step 1.5 prose wall broken into bullet list | M8 | Dense paragraph exceeded prose-wall threshold; bullets improve scanability |
| Concrete preflight output block added to Step 0 | M6 | Step 0 had no artifact example; added concrete checklist output block |
| "should be rare" → "is rare" | M7 | "Should be" is passive-adjacent hedge; declarative form required |
| Step 4 concrete STEAL/DROP/ADD count output block added | M6 | Step 4 described action without showing output shape; concrete block added |

**Cycle 1 — Ralph findings**
- Step 0 output block used generic field names — not AccentOS-specific
- M8 flag: one remaining paragraph in Step 3 still read as prose wall

**Cycle 2 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| Step 0 output block field names updated to AccentOS conventions | M6 | Ralph flagged generic fields; replaced with skill-registry-specific names |
| Step 3 paragraph broken into bullets | M8 | Last remaining prose wall eliminated |

**Cycle 2 — Ralph findings**
- none — converged

**Cycle 3 — Optimizer**
No new changes — all Ralph findings addressed in Cycle 2

**Cycle 3 — Ralph findings**
- none — converged

**Matter score after Round 2:** 100/100 (Δ +10)

---

### Final score: 100/100  (Δ from baseline: +20)

**Techniques that moved score:**
- Shipped-behavior commitment in description → closed M3: the always/never sentence was the sole missing element
- Concrete preflight output block at Step 0 → closed M6: first concrete artifact anchor in the skill
- Step 4 STEAL/DROP/ADD count block → reinforced M6: second concrete output cemented the dimension
- 13th anti-pattern → reinforced M4: AccentOS-specific forge failure mode added depth
- "is rare" replacing "should be rare" → reinforced M7: removed last passive-adjacent hedge

**Techniques that didn't move score:**
- Step 1.5 bullet conversion → M8 was already passing; improved clarity without changing score

**Stuck dimensions:** none

---
