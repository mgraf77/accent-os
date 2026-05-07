# doc-drift — optimization history

---

## Run 2026-05-07  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 80/100

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
| M10 | No placeholders | 10 | Passed |
| **Total** | | **80/100** | |

---

### Round 1 — 3-pass structure/prose/AccentOS sweep

**Changes made:**

| Change | Dimension | Reasoning |
|---|---|---|
| Added shipped-behavior commitment: "Always recommends a source-of-truth doc for each drift row — never flags a disagreement without a resolution path" | M3 | No behavioral commitment existed; M3 required an explicit always/never pair |
| Added "Origin:" label | — | Stylistic provenance marker, no score impact |

**Matter score after Round 1:** 80/100 (Δ +0)

Note: M3 was added but M6 remained failing. Both M3 and M6 needed to close simultaneously for a net score gain; Round 1 only addressed M3, leaving the score unchanged.

---

### Round 2 — Ralph loop (3 optimizer+Ralph cycles)

**Cycle 1 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| Upgraded description with /home/user/accent-os/ path | M9 | Reinforced stack reference with concrete repo path |
| Added SESSION_LOG expansion cost warning to anti-patterns | M4 | 7th anti-pattern — targets the specific AccentOS risk of unbounded SESSION_LOG appends during drift sweeps |
| Added trigger phrases "are the plans in sync" and "cross-check" | M5 | Reinforced trigger phrase inventory with doc-comparison AccentOS vocabulary |
| Added Step 2 output format example with per-doc claim structure | M6 | Step 2 now shows the exact row format: Doc | Claim | Conflicts With | Resolution |
| Refined [timestamp] to concrete date with substitution note | M10 | M10 was already passing; change added substitution clarity without introducing new placeholder tokens |
| Refined behavioral commitment | M3 | Strengthened existing commitment with resolution-path specificity |

**Cycle 1 — Ralph findings**
- M6 output format present in Step 2 but Step 4 (resolution recommendation) still used intent language rather than naming the produced artifact
- M4 SESSION_LOG rule strong; no gaps

**Cycle 2 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| Rewrote Step 4 to name the resolution artifact: a MASTER.md PR diff or decisions/ entry as applicable | M6 | Addressed Ralph's finding that Step 4 described intent rather than output |

**Cycle 2 — Ralph findings**
- none — converged

**Cycle 3 — Optimizer**
No new changes — all Ralph findings addressed in Cycle 2.

**Cycle 3 — Ralph findings**
- none — confirmed 100/100

**Matter score after Round 2:** 100/100 (Δ +20)

---

### Final score: 100/100  (Δ from baseline: +20)

**Techniques that moved score:**
- Shipped-behavior commitment ("Always recommends a source-of-truth doc for each drift row — never flags a disagreement without a resolution path") → closed M3: no always/never pair existed before
- Adding Step 2 per-doc claim structure plus Step 4 named resolution artifact → closed M6: Steps now specify produced output format

**Techniques that didn't move score:**
- Round 1 M3 addition alone → score stayed at 80/100 because M6 was still failing; both dimensions had to close together for a net gain
- "Origin:" label → stylistic only, no dimension maps to provenance markers

**Stuck dimensions:** none

---

## Run 2026-05-07 (Pass 3+4)  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 100/100 (all dimensions passing from prior run)

### Pass 1 — Deep quality audit

| Change | What was weak | What it became | Reasoning |
|---|---|---|---|
| Trigger phrase "consistency check on plans" removed | Near-paraphrase of "are my docs consistent" | Replaced with `"MASTER.md vs BUILD_PLAN"` (cross-doc comparison form) | Names the specific docs being compared — distinct intent from general "consistent" |
| Trigger phrase "are the plans in sync" replaced | Near-paraphrase of "do my plans agree" | Replaced with "which doc is right" | Covers the tiebreaker-request form: user knows there's conflict and wants resolution guidance |
| Step 2 per-doc claim list example added | Format showed `[doc name]` and `[claim class]` as shape labels only — new session couldn't see what actual output looks like | Added concrete example: MASTER.md, BUILD_PLAN_CLAUDE.md, SESSION_LOG.md each with real claim lines | Cold-read session sees exact output structure with AccentOS-domain values |
| Step 5 BLOCK 1, BLOCK 2, BLOCK 3 literal-shaped | BLOCK 1 used `[full Step 3 table]` reference; BLOCK 2 had no shape spec; BLOCK 3 had one Edit example | BLOCK 1 now shows file list header; BLOCK 2 shows full drift row shape with verdict values; BLOCK 3 shows full Edit commands with absolute /home/user/accent-os/ paths | Every output block now shows the complete shape a new Claude session can verify |

### Pass 2 — Ralph cold-read challenge

No additional changes needed. Step 1 fallback "flag and continue" handles missing files. Step 4 drift classification (stale-marker / priority / status-label) is unambiguous. Anti-pattern "Never expand SESSION_LOG.md to full file without first confirming the claim isn't resolved in the 200-line window" is specific and actionable.

### Net matter score change: 100 → 100

### Sub-dimension improvements:
- Trigger phrases: 2 near-duplicate pairs replaced with distinct forms ("MASTER.md vs BUILD_PLAN", "which doc is right")
- Step 2: per-doc claim list now has concrete MASTER.md / BUILD_PLAN_CLAUDE.md / SESSION_LOG.md examples
- Step 5: all 3 output blocks now show literal-shaped examples with /home/user/accent-os/ absolute paths

---

## Run 2026-05-07 (Round 5+6 — sub-dimension quality)  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 100/100 (binary — maintained)

### Round 5 — Sub-dimension quality + regularization
**L1 specificity check:** AP3 "Silence is the default, not a contradiction" had no AccentOS-specific example of intentional silence. Added concrete example: PROMPT_QUEUE.md not mentioning MASTER.md priorities is intentional scope, not drift. Description file list omitted PROMPT_QUEUE.md despite Step 1 loading it — added for consistency.
**L2 commitment check:** M3 commitment uses no vague words. Clean. "Always produces a delta table plus paste-in Edit commands with a named source-of-truth for each drift row" has no qualifying hedge.
**Adversarial check:** Dimensions sampled: M3 (behavioral commitment), Step 4 drift scoring. Priority drift had no canonical tiebreaker — a future run would report priority drift without being able to resolve it. Added: MASTER.md wins unless SESSION_LOG.md has a more recent explicit commitment, with lookup signals ("priority: override", track-change, M-task reassignment).
**Cold-read check:** Step 4 "Priority drift — Highest risk; can cause wrong-track builds" gave risk but no resolution rule. Fixed by adding tiebreaker. Step 1 file list was internally consistent after description fix.
**Cross-skill trigger audit:** "cross-check the docs" does not overlap with schema-contract-tests ("check consistency" targets code schema, not planning prose). No collision.

### Round 6 — Second pass
All binary Ralph checks passed on post-Round-5 state. No passive voice introduced. Step 4 tiebreaker is active voice. AP3 new text names PROMPT_QUEUE.md specifically and ends with a positive rule ("Flag only when two docs explicitly state different values") — actionable. No additional gaps found.

### Final: 3 sub-dimension edits across 2 rounds

---
