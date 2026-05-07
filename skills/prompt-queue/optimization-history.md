# prompt-queue — optimization history

---

## Run 2026-05-07  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 70/100

| Dim | Name | Score | Reason failed |
|---|---|---|---|
| M1 | Description ≥300 chars | 10 | Passed |
| M2 | AccentOS named | 10 | Passed |
| M3 | Behavioral commitment | 0 | No "always X — never Y" shipped-behavior statement present |
| M4 | ≥5 "Never" anti-patterns | 10 | Passed |
| M5 | ≥5 trigger phrases | 10 | Passed |
| M6 | Concrete step outputs | 0 | Steps described actions without specifying output artifacts |
| M7 | Zero passive voice | 10 | Passed |
| M8 | No prose walls | 10 | Passed |
| M9 | Stack reference | 10 | Passed |
| M10 | No placeholders | 0 | [QUEUED|WAITING] and similar bracketed tokens present outside code fences |
| **Total** | | **70/100** | |

---

### Round 1 — 3-pass structure/prose/AccentOS sweep

**Changes made:**

| Change | Dimension | Reasoning |
|---|---|---|
| Added shipped-behavior commitment: "Always writes to /home/user/accent-os/PROMPT_QUEUE.md on every operation — never auto-executes a queued prompt without explicit Michael confirmation" | M3 | No behavioral commitment existed; M3 required an explicit always/never pair naming the concrete file path and the confirmation gate |
| Added "Origin:" label | — | Stylistic provenance marker, no score impact |

**Matter score after Round 1:** 80/100 (Δ +10)

---

### Round 2 — Ralph loop (3 optimizer+Ralph cycles)

**Cycle 1 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| Expanded to 9 anti-patterns — SCHEMA_PARSE_UNCERTAIN and verbatim-phrasing rules added | M4 | Two new Never entries: one covering uncertain schema parse behavior, one prohibiting verbatim prompt phrasing that could leak sensitive context |
| Rewrote purpose line to name /home/user/accent-os/PROMPT_QUEUE.md file path | M6 | Partial M6 fix — purpose line now references the concrete file produced |
| Replaced [QUEUED|WAITING] placeholder with concrete example "status: QUEUED — added 2026-05-07" plus substitution note | M10 | [QUEUED|WAITING] is a placeholder token outside a code fence — replaced with real format example |
| Added concrete output artifacts to every Step | M6 | Steps now name the PROMPT_QUEUE.md entry format and the confirmation-receipt line written on execution |

**Cycle 1 — Ralph findings**
- M6 output artifacts present in all Steps; PROMPT_QUEUE.md entry format clearly specified
- M10 clean — no remaining placeholder tokens detected
- M4 SCHEMA_PARSE_UNCERTAIN rule could be more specific about what "uncertain" means in AccentOS context

**Cycle 2 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| Tightened SCHEMA_PARSE_UNCERTAIN anti-pattern with concrete example: schema parse returns ambiguous column mapping → prompt goes to PROMPT_QUEUE.md with status SCHEMA_UNCERTAIN, not auto-executed | M4 | Addressed Ralph's finding that the rule was underspecified |

**Cycle 2 — Ralph findings**
- none — converged

**Cycle 3 — Optimizer**
No new changes — all Ralph findings addressed in Cycle 2.

**Cycle 3 — Ralph findings**
- none — confirmed 100/100

**Matter score after Round 2:** 100/100 (Δ +20)

---

### Final score: 100/100  (Δ from baseline: +30)

**Techniques that moved score:**
- Shipped-behavior commitment naming /home/user/accent-os/PROMPT_QUEUE.md and the Michael-confirmation gate → closed M3: no always/never pair existed before
- Replacing [QUEUED|WAITING] with concrete "status: QUEUED — added 2026-05-07" example → closed M10: placeholder token removed
- Adding PROMPT_QUEUE.md entry format and confirmation-receipt artifact to Steps → closed M6: Steps now specify produced file content

**Techniques that didn't move score:**
- "Origin:" label → stylistic only, no dimension maps to provenance markers

**Stuck dimensions:** none

---
