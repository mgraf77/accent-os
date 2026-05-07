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

---

## Run 2026-05-07 (Pass 3+4)  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 100/100 (all dimensions passing from prior run)

### Pass 1 — Deep quality audit

| Change | What was weak | What it became | Reasoning |
|---|---|---|---|
| Purpose line rewritten to single tight verb sentence | Two-clause compound sentence lacking a single driving verb | "Extract concepts from an external tool, strip everything that doesn't fit AccentOS, and ship a committed, stress-tested SKILL.md to `/home/user/accent-os/skills/` in one uninterrupted pass." | Purpose lines must anchor the skill in one sentence with a specific verb; compound phrasing obscures the core action |
| "Never write a skill longer than the source's docs" expanded with AccentOS consequence | Generic rule with no named failure mode | Names the specific failure: padding that should live in gotcha-log.md ends up in the skill body | Anti-patterns must name a specific AccentOS failure mode, not a general principle |
| "Never stop at the gap analysis" rewritten with named consequence | Generic — didn't state what actually goes wrong | Names the failure: "run produces zero committed files and wastes the research phase" | AccentOS-specific consequence makes the rule actionable, not advisory |
| "Never add Future enhancements" expanded with the correct destination | Said "skills represent shipped state only" — didn't say where deferred items go | Adds: "deferred items go to `/home/user/accent-os/skills/skill-forge/future-builds.md` per Step 5" | A new Claude session needs a fallback action, not just a prohibition |

### Pass 2 — Ralph cold-read challenge

| Change | What was ambiguous | What it became | Reasoning |
|---|---|---|---|
| Step 9 branch-create instruction: `[8-char-rand]` → `$(git -C /home/user/accent-os rev-parse --short=8 HEAD)` | "[8-char-rand]" is a template marker outside a fenced block — a new session has no mechanism to generate it | Concrete shell expression that any session can evaluate | Precondition was ambiguous; new session couldn't execute without guessing the hash source |

### Net matter score change: 100 → 100

### Sub-dimension improvements:
- Purpose line: compound description → single tight verb sentence
- Two anti-patterns: generic principles → AccentOS-specific failure modes with named consequences
- Step 9: ambiguous `[8-char-rand]` → concrete `git rev-parse --short=8 HEAD` expression

---

## Run 2026-05-07 (Round 5+6 — sub-dimension quality)  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 100/100 (binary — maintained)

### Round 5 — Sub-dimension quality + regularization
**L1 specificity check:** All 13 Never anti-patterns name specific AccentOS artifacts or file paths (gotcha-log.md, future-builds.md, PROMPT_LOG.md, hsyjcrrazrzqngwkqsqa, store-cwqiwcjxes). No L1 gaps found.
**L2 commitment check:** Description ends with "Always commits forged skills to the active branch — never leaves work uncommitted." — "active branch" and "uncommitted" are both specific. Passes.
**Adversarial check:** Dimensions sampled: M5 (trigger phrases), M10 (no placeholders). M5: "look into [X]" disambiguation used vague "build-or-adapt intent" — sharpened to "any indication exists that Michael wants a SKILL.md produced (not just an install decision)" and removed the word "cheaper" from the fallback rule. M10: Step 7.5 item 1 `[bracketed]` is a prose example, not an unfilled placeholder — clean. Adversarial finding on M5 was fixed.
**Cold-read check:** Step 0 → Step 10 walkthrough: all steps have concrete output artifacts, the approval gate halt is explicit, the branch-create instruction uses a concrete git expression. Clean.
**Cross-skill trigger audit:** "look into X to build" vs. "look into X to install" — disambiguation sharpened from "build-or-adapt intent" to explicit SKILL.md-production signal. repo-scout chaining rule retained.

### Round 6 — Second pass
**L1 re-check:** Edited disambiguation block now names `SKILL.md` as the specific artifact decision criterion. Passes.
**L2 re-check:** Description commitment unchanged and specific. Passes.
**Adversarial re-check on M4 and M5:** M4: 13 Never anti-patterns all pass L1. M5: potential future gap for "clone this for AccentOS" / "port [X] to my stack" phrases not yet in trigger list — logged as advisory finding; no change made (no evidence in PROMPT_LOG.md mining).
**Cold-read re-check:** Edited disambiguation block reads cleanly — "not just an install decision" is unambiguous. Passes.
**Cross-skill trigger audit:** skill-forge vs. repo-scout boundary now explicitly keyed on SKILL.md-production intent. No other collisions found.

### Final: 1 sub-dimension edit across 2 rounds

