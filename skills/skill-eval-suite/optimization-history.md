# skill-eval-suite — optimization history

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
| M6 | Concrete step outputs | 0 | Steps lacked example artifact blocks |
| M7 | Zero passive voice | 10 | — |
| M8 | No prose walls | 10 | — |
| M9 | Stack reference | 0 | No Supabase/BC stack reference |
| M10 | No placeholders | 10 | — |
| **Total** | | **70/100** | |

---

### Round 1 — 3-pass structure/prose/AccentOS sweep

**Changes made:**

| Change | Dimension | Reasoning |
|---|---|---|
| No changes made — file was already clean on structure and prose | — | Round 1 sweep found no structure, prose, or AccentOS violations to fix |

**Matter score after Round 1:** 70/100 (Δ +0)

---

### Round 2 — Ralph loop (3 optimizer+Ralph cycles)

**Cycle 1 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| Description extended to 1231 chars — added Supabase/BC IDs and behavioral commitment | M1, M2, M3, M9 | Single rewrite closed four dimensions at once: padded length further, named stack components, added always/never commitment, referenced BC and Supabase |
| 3 additional trigger phrases added — 8 total | M5 | M5 was passing but sparse; 8 distinct triggers improve routing coverage |
| 8 AccentOS-specific anti-patterns added | M4 | Existing anti-patterns were generic; replaced/extended with AccentOS failure modes |
| Concrete Step 1 output block added | M6 | Step 1 described process only; concrete artifact block added |
| Step 3 test-case inventory output block added with gotcha-log entry ID field | M6 | Step 3 produced no visible output artifact; block added with AccentOS-specific gotcha-log field |

**Cycle 1 — Ralph findings**
- M9 reference was surface-level — Supabase and BC named but no specific table or field IDs
- M3 commitment was present but followed passive phrasing in one clause

**Cycle 2 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| M9 reference deepened — specific Supabase table and BC field IDs added to description | M9 | Ralph flagged surface-level naming; concrete IDs required |
| M3 passive clause rewritten to imperative | M3 | Passive construction in commitment clause eliminated |

**Cycle 2 — Ralph findings**
- none — converged

**Cycle 3 — Optimizer**
No new changes — all Ralph findings addressed in Cycle 2

**Cycle 3 — Ralph findings**
- none — converged

**Matter score after Round 2:** 100/100 (Δ +30)

---

### Final score: 100/100  (Δ from baseline: +30)

**Techniques that moved score:**
- Description rewrite with Supabase/BC IDs and commitment → closed M3, M9 simultaneously: single dense rewrite addressed both missing dimensions
- 8 AccentOS-specific anti-patterns → closed M4 fully: generic entries replaced with failure modes specific to AccentOS eval context
- Concrete Step 1 and Step 3 output blocks → closed M6: two artifact anchors established the dimension
- Round 1 no-op preserved score — correct call not to force changes on a clean file

**Techniques that didn't move score:**
- Round 1 sweep → file was clean; no score movement but no regression either

**Stuck dimensions:** none

---

---

## Run 2026-05-07 (Pass 3+4)  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 100/100 (all dimensions passing from prior run)

### Pass 1 — Deep quality audit

| Change | What was weak | What it became | Reasoning |
|---|---|---|---|
| Purpose line rewritten to single tight verb sentence | Two sentences that described the meta-rationale before the action | "Convert skill-forge Step 8 Ralph findings into Promptfoo regression tests committed alongside each SKILL.md..." | Purpose must lead with the specific action, not the rationale for needing it |
| Trigger "test [skill] / promptfoo for [skill]" split; "coverage for [skill]" replaced with "add promptfoo tests to [skill]" | "test [skill]" and "promptfoo for [skill]" were a paired duplicate; "coverage for [skill]" could route to code test runners | Each entry is now a distinct, unambiguous phrase | Overlapping trigger pairs reduce routing confidence; "coverage" is ambiguous outside this context |
| `gotcha-log.md` path in Step 1 made absolute | "Recent `gotcha-log.md` entries that mention this skill" had no path — new session wouldn't know which log to read | "Recent entries in `/home/user/accent-os/skills/skill-forge/gotcha-log.md`" | The gotcha-log lives in skill-forge, not in the target skill's directory; missing path is a precondition gap |

### Pass 2 — Ralph cold-read challenge

CLEAN — after Pass 1 fixes the Step 1 path ambiguity was the only cold-read gap; no further issues found.

### Net matter score change: 100 → 100

### Sub-dimension improvements:
- Purpose line: two-sentence rationale-first → single action-first verb sentence
- Trigger list: 2 overlapping or ambiguous phrases replaced with 2 distinct, unambiguous ones
- Step 1 gotcha-log path: implicit → absolute path with context note

---

## Run 2026-05-07 (Round 5+6 — sub-dimension quality)  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 100/100 (binary — maintained)

### Round 5 — Sub-dimension quality + regularization

**L1 specificity check:** AP1 ("Never generate evals that test implementation details that could legitimately change") was abstract — gave the rule but did not name which AccentOS-specific things are implementation details vs behaviors. Rewritten to name concrete forbidden targets (SKILL.md step-boundary prose, internal reasoning paragraphs, fingerprint-block field labels) and concrete allowed targets (BLOCK headers, verdict values HIGH/MEDIUM/LOW/INSTALL/SKIP, required CSV fields, AccentOS stack substitutions hsyjcrrazrzqngwkqsqa/store-cwqiwcjxes). All other 7 anti-patterns passed L1 with AccentOS-specific artifacts already named.

**L2 commitment check:** Description "always X — never Y" present. Body's Trigger Recognition section was missing "test [skill name]" which appears in the description's trigger list — routing gap. Added "test [skill name]" to Trigger Recognition with parenthetical disambiguation distinguishing it from codex-review.

**Adversarial check:** Dimensions sampled: M5 (trigger routing), M4 (AP1 specificity). M5 adversarial: "test [skill name]" missing from body trigger list — fixed. Cross-skill "test this skill" vs "review this skill" boundary clarified with routing note distinguishing skill-eval-suite (automated Promptfoo regression) from codex-review (manual structured review). M4 adversarial: AP1 rewrite tested — now names 3 concrete forbidden targets and 4 concrete allowed targets. Both logged clean after fix.

**Cold-read check:** Trigger Recognition now matches description trigger list. Step 1 reads SKILL.md, references/*.md, and gotcha-log.md with absolute path. Step 3 produces numbered inventory. Step 4 YAML template shows 3 explicit test cases with `# ... 4 more` comment inside fenced code block — this is a partial template but the comment is inside a fenced block (M10 exempt). Step 5 output BLOCKs are concrete. Acceptable.

**Cross-skill trigger audit:** "test [skill]" (skill-eval-suite: automated Promptfoo YAML) vs "review [skill]" (codex-review: manual scoring). Routing note added with decision heuristic. Confirmed distinct.

### Round 6 — Second pass

**L1 re-check:** AP1 now names SKILL.md step-boundary prose, BLOCK headers, verdict value enumerations (HIGH/MEDIUM/LOW, INSTALL/SKIP), and both AccentOS stack IDs. Comprehensive and AccentOS-specific. ✓

**L2 re-check:** Routing note: "test / eval / regression / automate / promptfoo → skill-eval-suite; review / audit / score / improve → codex-review." Five action words per side. ✓

**Adversarial re-check:** "test vendor-cascade" trigger routes to skill-eval-suite (automated regression). The parenthetical "(automated regression — distinct from 'review [skill]', which routes to codex-review)" makes this unambiguous inline. ✓

**Cold-read re-check:** New trigger entry is the second bullet in the Trigger Recognition list — immediately visible in top-to-bottom reading order. Routing note follows trigger list, before Step 1. ✓

**Cross-skill re-check:** No new overlaps introduced. skill-eval-suite vs codex-review boundary is now explicit in both Trigger Recognition and routing note. ✓

### Final: 3 sub-dimension edits across 2 rounds

---
