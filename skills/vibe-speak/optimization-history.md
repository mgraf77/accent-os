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

## Run 2026-05-07 (Pass 3+4)  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 100/100 (all dimensions passing from prior run)

### Pass 1 — Deep quality audit

| Change | What was weak | What it became | Reasoning |
|---|---|---|---|
| Purpose line rewritten | 3-sentence narrative — not a single tight verb | Single sentence: "Compresses Claude's AccentOS session output by stripping filler, jargon, and preamble while keeping code identifiers, file paths, and AccentOS proper nouns byte-exact" | Single verb (compresses), names the specific mechanism and the specific preservation guarantee |
| Trigger phrases deduplicated | "vibe mode" / "vibe speak" / "vibe on" — all identical intent; "drop the jargon" / "no jargon" / "human mode" / "explain like I'm vibing" / "vibe coder mode" — 5 paraphrases of 1 intent | Reduced to 7 entries covering distinct activations: mode-switch, jargon-strip, length-reduction, explicit-compression, slash-style, explicit-switch form | 7 phrases now cover at least 5 distinct user mental models instead of 3 mental models in 11 phrases |

### Pass 2 — Ralph cold-read challenge

CLEAN — no additional changes needed. Step 1 reads 7 files in defined order with explicit missing-file handling per state table. Step 7 auto-disengage rules are numbered 1-12 with concrete trigger patterns. Rule 11 cites `hsyjcrrazrzqngwkqsqa`. Step 12 accuracy gate has 5 explicit checks with "action if fails" column. Step 19 mode catalog is complete. Anti-patterns cover 20 specific failure modes with AccentOS identifiers.

### Net matter score change: 100 → 100

### Sub-dimension improvements:
- Purpose line: 3-sentence narrative collapsed to 1 tight sentence with specific verb (compresses) and specific guarantees
- Trigger phrases: 11 entries (with heavy overlap) reduced to 7 entries covering ≥5 distinct user mental models

---

## Run 2026-05-07 (Round 5+6 — sub-dimension quality)  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 100/100 (binary — maintained)

### Round 5 — Sub-dimension quality + regularization
**L1 specificity check:** Anti-patterns lacked AccentOS-specific failure mode examples for mode-compression risk. Generic "never misidentify mode" not present but no AP named the concrete failure of using gsd/caveman during a Supabase SQL migration or a multi-step M-task sequence. Added two new AccentOS-specific APs: (1) gsd/caveman during `hsyjcrrazrzqngwkqsqa` SQL migrations citing `ALTER TABLE`/`CREATE POLICY`/Step 7 Rule 3; (2) gsd/caveman during multi-step AccentOS sequences with order dependencies, citing `BUILD_PLAN_CLAUDE.md`, `BLOCKS ON MICHAEL`, `rep-group-matchmaker → vendor-onboard-checklist` pipeline example, and Step 7 Rule 4.
**L2 commitment check:** Description commitment "Always translates jargon on output and keeps hard-keep identifiers byte-exact — never drops facts to hit a word-count target" — specific to the skill's primary output guarantee. Sufficient.
**Adversarial check:** Dimensions sampled: M13 (adaptive learning signal types), M7 (auto-disengage). M13: "revert" signal had no collision rule when combined with "bump-up" — both can fire when Michael uses a technical term in a question. Added "Revert + bump-up → Revert wins" row to multi-signal collision table. M7: Rule 11 `hsyjcrrazrzqngwkqsqa` — fires for ALL non-raw modes, not just gsd/caveman. The new APs name gsd/caveman because they're highest risk; Rule 11 still covers all modes. No contradiction.
**Cold-read check:** Step 7 Rule 3 and Rule 4 are the auto-disengage rules cited in the new APs. Both rules are present in Step 7 at lines 394 and 395. Cross-reference verified. New AP formatting matches existing AP register voice (Never X — Y). ✓
**Cross-skill trigger audit:** "default mode" → vibe trigger does not collide with any vendor skill trigger phrase. "back to vibe" — unique. "drop the jargon" — unique. "human mode" — unique. No collisions detected.

### Round 6 — Second pass
**L1 re-check:** New AP#1 (gsd/caveman + SQL migration) names `ALTER TABLE`, `CREATE POLICY`, `hsyjcrrazrzqngwkqsqa`, and "migration filename" — all concrete AccentOS artifacts. ✓ New AP#2 (gsd/caveman + multi-step sequence) names `BUILD_PLAN_CLAUDE.md`, `BLOCKS ON MICHAEL`, `rep-group-matchmaker → vendor-onboard-checklist` — all real AccentOS artifacts. ✓
**L2 re-check:** Collision table row "Revert + bump-up → Revert wins" is consistent with feedback-log immediate-write behavior for revert (logs immediately per Step 13). Bump-up has no log (per signal types table). Absorption is clean. ✓
**Adversarial re-check:** "pair mode running SQL migration" — Step 7 Rule 3 fires for pair mode too (not just gsd/caveman). New AP only names gsd/caveman; pair mode is a lower-compression risk but still covered by Rule 3. Acceptable — APs name the highest-risk modes without contradicting the general rule.
**Cold-read re-check:** Multi-signal collision table now has 6 rows. All combos listed are plausible in real sessions. Revert+bump-up combo is the most likely uncovered case. ✓

### Final: 3 sub-dimension edits across 2 rounds
