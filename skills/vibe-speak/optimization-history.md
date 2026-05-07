# vibe-speak — optimization history

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
| M7 | Zero passive voice | 0 | Passive constructions present — "should be counted", etc. |
| M8 | No prose walls | 10 | Passed |
| M9 | Stack reference | 10 | Passed |
| M10 | No placeholders | 0 | 7 bracketed placeholder tokens outside code fences — highest M10 debt in the fleet |
| **Total** | | **60/100** | |

---

### Round 1 — 3-pass structure/prose/AccentOS sweep

**Changes made:**

| Change | Dimension | Reasoning |
|---|---|---|
| Added shipped-behavior commitment: "Always translates jargon on output and keeps hard-keep identifiers byte-exact — never drops facts to hit a word-count target" | M3 | No behavioral commitment existed; M3 required an explicit always/never pair |
| Added "Origin: JuliusBrussee/caveman" label | — | Stylistic provenance marker, no score impact |

**Matter score after Round 1:** 70/100 (Δ +10)

---

### Round 2 — Ralph loop (3 optimizer+Ralph cycles)

**Cycle 1 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| Rewrote anti-patterns with AccentOS-specific paths — profiles/[user].md and Supabase project ref hsyjcrrazrzqngwkqsqa as hard-keep identifier examples | M4 | Reinforced Never entries with concrete AccentOS identifiers that must survive translation; M9 reinforced simultaneously |
| Replaced "should be counted" passive with imperative "count" | M7 | Eliminated passive construction; imperative form required |
| Replaced [phrase] placeholder with concrete example "vibesplain this" plus substitution note | M10 | [phrase] is a placeholder token outside a code fence — 1 of 7 replaced |
| Replaced [date or never] placeholder with concrete "2026-04-01 or never" plus substitution note | M10 | [date or never] is a placeholder token outside a code fence — 2 of 7 replaced |
| Replaced [archive path] placeholder with concrete "skills/vibe-speak/archive/2026-04-01-vibe.md" plus substitution note | M10 | [archive path] is a placeholder token outside a code fence — 3 of 7 replaced |
| Replaced [3 closest matches] placeholder with concrete "vibe / gsd / caveman" plus substitution note | M10 | [3 closest matches] is a placeholder token outside a code fence — 4 of 7 replaced |
| Replaced [mode] placeholder with concrete "gsd" plus substitution note | M10 | [mode] is a placeholder token outside a code fence — 5 of 7 replaced |

**Cycle 1 — Ralph findings**
- M10: two remaining placeholder tokens detected — [percentages] and [none|tightened by 1|loosened by 1]
- M6 output artifacts partially added but two Steps still used intent language

**Cycle 2 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| Replaced [percentages] placeholder with concrete "formality 40 % / density 60 % / emoji 0 %" plus substitution note | M10 | [percentages] is a placeholder token outside a code fence — 6 of 7 replaced |
| Replaced [none|tightened by 1|loosened by 1] placeholder with concrete "tightened by 1 (formality: 40 → 50)" plus substitution note | M10 | [none|tightened by 1|loosened by 1] is a placeholder token outside a code fence — 7 of 7 replaced |
| Added concrete output artifacts to remaining two Steps | M6 | Addressed Ralph's finding; Steps now name the profiles/[user].md write and the observation-log.md append |

**Cycle 2 — Ralph findings**
- none — converged

**Cycle 3 — Optimizer**
No new changes — all Ralph findings addressed in Cycle 2.

**Cycle 3 — Ralph findings**
- none — confirmed 100/100

**Matter score after Round 2:** 100/100 (Δ +30)

Note: vibe-speak had the most placeholder instances in the fleet (7) — all outside code fences — making it the highest M10 debt carrier. Replacing them all required 6 separate Edit calls across 2 optimizer cycles.

---

### Final score: 100/100  (Δ from baseline: +40)

**Techniques that moved score:**
- Shipped-behavior commitment ("Always translates jargon on output and keeps hard-keep identifiers byte-exact — never drops facts to hit a word-count target") → closed M3: no always/never pair existed before
- Replacing "should be counted" passive with imperative "count" → closed M7: passive voice eliminated
- Replacing all 7 [bracketed] placeholder tokens with concrete examples plus substitution notes → closed M10: highest M10 debt in the fleet cleared; required 6 Edit calls across 2 cycles
- Adding profiles/[user].md write and observation-log.md append as named Step outputs → closed M6: Steps now specify produced files

**Techniques that didn't move score:**
- "Origin: JuliusBrussee/caveman" label → stylistic only, no dimension maps to provenance markers

**Stuck dimensions:** none

---
