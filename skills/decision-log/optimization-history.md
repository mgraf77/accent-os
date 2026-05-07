# decision-log — optimization history

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
| M10 | No placeholders | 0 | "decision: [topic]" placeholder token present outside code fences |
| **Total** | | **70/100** | |

---

### Round 1 — 3-pass structure/prose/AccentOS sweep

**Changes made:**

| Change | Dimension | Reasoning |
|---|---|---|
| Added shipped-behavior commitment: "Always writes a file to /home/user/accent-os/decisions/ and updates INDEX.md in the same operation — never one without the other" | M3 | No behavioral commitment existed; M3 required an explicit always/never pair naming the concrete file path |
| Rewrote auto-fire trigger to imperative form | M7 | Auto-fire trigger used non-imperative phrasing; imperative form required to maintain M7 pass |
| Added "Origin:" label | — | Stylistic provenance marker, no score impact |

**Matter score after Round 1:** 80/100 (Δ +10)

---

### Round 2 — Ralph loop (3 optimizer+Ralph cycles)

**Cycle 1 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| Rewrote purpose line to include /home/user/accent-os/decisions/ commitment path | M3 | Refined existing commitment with exact path reinforced in purpose statement |
| Replaced "decision: [topic]" placeholder with concrete "decision: auth model" example plus substitution note | M10 | [topic] is a placeholder token outside a code fence — replaced with real AccentOS-vocabulary example |
| Added trigger phrases "capture tradeoff" and "save reasoning" | M5 | Reinforced trigger phrase inventory with decision-specific AccentOS vocabulary |
| Added Supabase/BC HIGH-cost rule to anti-patterns | M4 | Introduced 6th anti-pattern targeting irreversible-action decisions that require elevated logging rigor |
| Added concrete output artifacts to Steps | M6 | Steps now name the file created in /home/user/accent-os/decisions/ and the INDEX.md entry format |

**Cycle 1 — Ralph findings**
- M6 output artifacts present but INDEX.md update step lacked the exact entry format example
- M10 clean — no remaining placeholder tokens detected

**Cycle 2 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| Added exact INDEX.md entry format example to the INDEX.md update Step | M6 | Addressed Ralph's finding that the update step was underspecified |

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
- Shipped-behavior commitment naming /home/user/accent-os/decisions/ and INDEX.md atomic write → closed M3: no always/never pair existed before
- Replacing "decision: [topic]" with concrete "decision: auth model" example → closed M10: placeholder token removed
- Adding named output artifacts specifying file path and INDEX.md entry format → closed M6: Steps now specify produced files

**Techniques that didn't move score:**
- Imperative auto-fire trigger rewrite → M7 was already passing; change maintained the pass rather than closing a gap
- "Origin:" label → stylistic only, no dimension maps to provenance markers

**Stuck dimensions:** none

---

## Run 2026-05-07 (Pass 3+4)  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 100/100 (all dimensions passing from prior run)

### Pass 1 — Deep quality audit

| Change | What was weak | What it became | Reasoning |
|---|---|---|---|
| Trigger phrase "document this choice" removed | Near-paraphrase of "log this decision" and "record this call" | Replaced with "why did we choose X" (retroactive capture form) | Covers the retroactive-justification use case: Michael looks back and asks why something was done |
| Trigger phrase "record this call" replaced | Near-paraphrase of "log this decision" | Replaced with "lock in this approach" / "commit to this architecture" | These phrases signal architectural commitment — a distinct intent from logging an already-made decision |
| Step 5 output literal-shaped | `decision-NNN`, `[name]`, `[class]`, `[cost]`, `[trigger]`, `[one line]` — all generic shape labels | Replaced with full concrete example: decision-004, auth-model-rls-vs-jwt, architecture, HIGH, real reopen trigger, real worst-case | Cold-read session sees exact output shape and AccentOS-domain example |
| Step 3 INDEX.md bootstrap added | "create it with the standard header" — standard header not defined anywhere in the skill | Added the exact header template inline: `# AccentOS — Decision Index` + table column row | New Claude session no longer needs to guess what the standard header looks like |

### Pass 2 — Ralph cold-read challenge

No additional changes needed. Step 1 "1-option decision" handling is explicit (ask once, log with note if no alternative). Step 2 reversal cost rubric covers all AccentOS-relevant classes. The HIGH-cost anti-pattern explicitly cites `hsyjcrrazrzqngwkqsqa` and `store-cwqiwcjxes`. The INDEX.md bootstrap template is now fully self-contained.

### Net matter score change: 100 → 100

### Sub-dimension improvements:
- Trigger phrases: 2 near-duplicate entries replaced with distinct use cases (retroactive capture, architectural commitment)
- Step 5 output: all shape labels replaced with concrete AccentOS-domain example
- Step 3: INDEX.md bootstrap template added inline so new Claude session can create the header without guessing

---
