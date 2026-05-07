# repo-scout — optimization history

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
| M6 | Concrete step outputs | 0 | Steps described actions without artifact examples |
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
| Step headings verb-phrased throughout | M6 | Noun headings replaced with verb-phrase equivalents to imply deliverable output |
| Filter table pipe-formatted | M8 | Inline filter criteria converted to pipe table for scan speed |
| Absolute path substituted — /workspaces/ → /home/user/accent-os/ | M9 | Codespace-era path replaced with AccentOS canonical working directory |
| **Never** bold added to all 6 anti-pattern entries | M4 | Visual consistency with AccentOS anti-pattern style; aids scanning |

**Matter score after Round 1:** 90/100 (Δ +10)

---

### Round 2 — Ralph loop (3 optimizer+Ralph cycles)

**Cycle 1 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| Description rewritten to 1090 chars — Supabase/BC IDs named, behavioral commitment appended | M3, M9 | Description already passed M1 length; rewrite deepened M9 specificity and added M3 commitment |
| 8 anti-patterns total — expanded from 6 | M4 | Two additional AccentOS-specific scout failure modes added |
| Step 4 verdict table with definitions added | M6 | Step 4 produced no visible output shape; verdict table (ADOPT/HOLD/SKIP) with definitions added |
| Concrete paste-ready output format added to Step 5 | M6 | Step 5 final output had no artifact example; paste-ready block added |
| Step 2 raw candidate list output block added | M6 | Step 2 search had no output shape; raw candidate list block added |
| Step 3 filtered candidate list output block with count summary added | M6 | Step 3 filter had no output shape; filtered list block with before/after count added |

**Cycle 1 — Ralph findings**
- Step 4 verdict table definitions were one-liners — ADOPT/HOLD/SKIP needed clearer criteria boundary
- M3 commitment clause used "when appropriate" hedge

**Cycle 2 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| Step 4 ADOPT/HOLD/SKIP criteria boundaries sharpened with explicit thresholds | M6 | Ralph flagged ambiguous boundaries; thresholds added to each verdict |
| M3 commitment clause "when appropriate" removed — unconditional form | M3 | Hedge eliminated; commitment is unconditional |

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
- Description rewrite with Supabase/BC IDs and behavioral commitment → closed M3 and deepened M9 simultaneously
- Output blocks at Steps 2, 3, 4, 5 → closed M6: four concrete artifact anchors established the dimension across the full flow
- 8 anti-patterns → reinforced M4: two additional AccentOS-specific scout failure modes added

**Techniques that didn't move score:**
- Verb-phrase step headings (Round 1) → partially addressed M6 but did not close it alone; output blocks were required
- **Never** bold on anti-patterns → M4 was already passing; style consistency only

**Stuck dimensions:** none

---

---

## Run 2026-05-07 (Pass 3+4)  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 100/100 (all dimensions passing from prior run)

### Pass 1 — Deep quality audit

| Change | What was weak | What it became | Reasoning |
|---|---|---|---|
| Purpose line rewritten to single tight verb sentence | Two-sentence plus one-word fragment ("Michael does not read. He scans and acts.") — the action was implied, not stated | Single sentence naming the search targets, the filter criterion (live AccentOS stack with both IDs), and the output contract | Purpose must be one sentence with a specific verb; the three-piece structure buried the output shape |
| "Never skip the filter pass because a repo has high stars" given AccentOS-specific contrast | Generic — "star count is not a relevance signal for AccentOS + Accent Lighting stack fit" | Contrasts a 10k-star generic Supabase tool against a 40-star BigCommerce-native MCP that fits store-cwqiwcjxes | Anti-patterns must name a specific AccentOS failure mode; named contrast makes the rule memorable and actionable |
| "Never run Step 2 searches without first loading AccentOS context" given concrete failure consequence | Named the file but said only "blind searches produce irrelevant candidates" | Names the specific irrelevant categories: Shopify, WooCommerce, AWS-native tools vs. the actual BigCommerce + Cloudflare + vanilla-JS stack | The consequence tells a new session *what class of noise* to expect, making the rule actionable |

### Pass 2 — Ralph cold-read challenge

| Change | What was ambiguous | What it became | Reasoning |
|---|---|---|---|
| Step 2 hardcoded search queries given explicit note that they are baseline + gap-extension terms | A new session reading Step 2 would run only the hardcoded queries and miss the Step 1 context-to-search-term mapping | Added "The queries below are the baseline set; extend with gap-specific terms pulled from the named gaps in project-profiles.md" | The connection between Step 1 context-load and Step 2 search tuning was implicit; new session had no instruction to extend the queries |

### Net matter score change: 100 → 100

### Sub-dimension improvements:
- Purpose line: two-sentence-plus-fragment → single action-and-output-shape sentence with both stack IDs named
- Two anti-patterns: generic principles → AccentOS-specific failure modes with named components (store-cwqiwcjxes, Shopify/WooCommerce contrast)
- Step 2: hardcoded queries clarified as baseline + gap-extension set, closing the implicit Step 1→Step 2 link

---

## Run 2026-05-07 (Round 5+6 — sub-dimension quality)  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 100/100 (binary — maintained)

### Round 5 — Sub-dimension quality + regularization

**L1 specificity check:** All 8 anti-patterns checked. All passed — each names a specific AccentOS artifact (store-cwqiwcjxes, hsyjcrrazrzqngwkqsqa, project-profiles.md path, MCP stack list) or a concrete behavior failure mode. No generic entries found.

**L2 commitment check:** Description's "always X — never Y" is present and unconditional. Body trigger list had `[project]` bracket in "find me tools for [project]" — this is an M10 violation outside a fenced code block. Replaced with concrete examples: "find me tools for AccentOS" / "find me tools for Accent Lighting".

**Adversarial check:** Dimensions sampled: M5 (trigger phrases), M10 (placeholder check). M5 adversarial: "find new skills" could collide with skill-forge (build) path — added routing note distinguishing repo-scout (find existing) vs skill-forge (build new). M10 adversarial: `[project]` bracket in trigger list — fixed. Both logged clean after fix.

**Cold-read check:** Step 1 loads project-profiles.md before searches. Step 2 has concrete baseline queries with gap-extension instruction. Step 3 filter table is deterministic. Step 4 verdict definitions have clear criteria. Step 5 output block is concrete and paste-ready. Clean.

**Cross-skill trigger audit:** "find new skills" → repo-scout (find as-is) vs skill-forge (build/adapt). Routing note added in Trigger Recognition with decision heuristic: "find / scout / is X worth it" → repo-scout; "build / create / write a skill for" → skill-forge. Confirmed distinct.

### Round 6 — Second pass

**L1 re-check:** Fixed trigger "find me tools for AccentOS" / "find me tools for Accent Lighting" — both concrete AccentOS entities. ✓

**L2 re-check:** Routing note heuristic: "find / scout / is X worth it → repo-scout; build / create / write a skill for → skill-forge" — four action words on each side, specific enough for deterministic routing. ✓

**Adversarial re-check:** "find me a skill for vendor scoring" routes to repo-scout first (correct); if nothing exists, gap surfaces for skill-forge. No dead-end. Clean. ✓

**Cold-read re-check:** Routing note placement (after trigger list, before Step 1) is the correct location for a session reading top-to-bottom. Clean. ✓

**Cross-skill re-check:** No new overlaps introduced by routing note. Clean. ✓

### Final: 2 sub-dimension edits across 2 rounds

---
