# bottleneck-finder — optimization history

---

## Run 2026-05-07  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 60/100

| Dim | Name | Score | Reason failed |
|---|---|---|---|
| M1 | Description ≥300 chars | 10 | Passed |
| M2 | AccentOS named | 10 | Passed |
| M3 | Behavioral commitment | 0 | No "always X — never Y" shipped-behavior statement present |
| M4 | ≥5 "Never" anti-patterns | 10 | Passed |
| M5 | ≥5 trigger phrases | 10 | Passed |
| M6 | Concrete step outputs | 0 | Steps described actions without specifying output artifacts |
| M7 | Zero passive voice | 0 | Passive constructions present throughout Steps |
| M8 | No prose walls | 10 | Passed |
| M9 | Stack reference | 10 | Passed |
| M10 | No placeholders | 0 | Bracketed placeholder tokens present outside code fences |
| **Total** | | **60/100** | |

---

### Round 1 — 3-pass structure/prose/AccentOS sweep

**Changes made:**

| Change | Dimension | Reasoning |
|---|---|---|
| Added shipped-behavior commitment: "Always names the constraint before proposing exploits — never returns 'wait for Michael' as the only option" | M3 | No behavioral commitment existed; M3 required an explicit always/never pair |
| Added "Origin:" label | — | Stylistic provenance marker, no score impact |

**Matter score after Round 1:** 70/100 (Δ +10)

---

### Round 2 — Ralph loop (3 optimizer+Ralph cycles)

**Cycle 1 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| Upgraded description with /home/user/accent-os/ path | M9 | Reinforced stack reference with concrete repo path |
| Added 7 anti-patterns — cycle-detection and fabricated-exploit entries added | M4 | Expanded and strengthened Never entries; cycle-detection rule targets a real failure mode |
| Added trigger phrases "leverage" and "priority analysis" | M5 | Brought trigger phrase inventory to 7 distinct AccentOS-vocabulary phrases |
| Added concrete output artifacts to every Step | M6 | Steps now name the file written and the structure of each output |
| Eliminated passive voice throughout Steps | M7 | Replaced all passive constructions with active imperative voice |
| Removed all [bracketed] placeholder tokens | M10 | Placeholder tokens outside code fences replaced with concrete examples or substitution notes |

**Cycle 1 — Ralph findings**
- M4 anti-patterns list present but fabricated-exploit entry lacked specificity on what "fabricated" means in AccentOS context
- M6 output artifacts present across all Steps

**Cycle 2 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| Tightened fabricated-exploit anti-pattern with concrete example referencing BUILD_PLAN_CLAUDE.md | M4 | Addressed Ralph's finding that the entry was underspecified |

**Cycle 2 — Ralph findings**
- none — converged

**Cycle 3 — Optimizer**
No new changes — all Ralph findings addressed in Cycle 2.

**Cycle 3 — Ralph findings**
- none — confirmed 100/100

**Matter score after Round 2:** 100/100 (Δ +30)

---

### Final score: 100/100  (Δ from baseline: +40)

**Techniques that moved score:**
- Shipped-behavior commitment ("Always names the constraint before proposing exploits — never returns 'wait for Michael' as the only option") → closed M3: no always/never pair existed before
- Passive voice elimination across all Steps → closed M7: imperative active voice throughout
- Removing [bracketed] placeholder tokens → closed M10: no placeholder tokens remain outside code fences
- Adding named output artifacts to every Step → closed M6: Steps now specify produced file and format

**Techniques that didn't move score:**
- "Origin:" label → stylistic only, no dimension maps to provenance markers

**Stuck dimensions:** none

---
