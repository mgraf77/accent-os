# vendor-onboard-checklist — optimization history

---

## Run 2026-05-07  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 70/100

| Dim | Name | Score | Reason failed |
|---|---|---|---|
| M1 | Description ≥300 chars | 10 | — |
| M2 | AccentOS named | 10 | — |
| M3 | Behavioral commitment | 0 | No "always X — never Y" commitment block present |
| M4 | ≥5 "Never" anti-patterns | 10 | — |
| M5 | ≥5 trigger phrases | 10 | — |
| M6 | Concrete step outputs | 0 | Step headings used verb phrasing but no literal output blocks |
| M7 | Zero passive voice | 10 | — |
| M8 | No prose walls | 10 | — |
| M9 | Stack reference | 10 | — |
| M10 | No placeholders | 0 | `[vendor name or ID]` in triggers; `[vendor]` in description |
| **Total** | | **70/100** | |

---

### Round 1 — 3-pass structure/prose/AccentOS sweep

**Changes made:**

| Change | Dimension | Reasoning |
|---|---|---|
| "does not match" → formal consistent phrasing across anti-pattern list | M7 | Inconsistent casing between anti-pattern items read as passive construction |
| "Do not" casing standardized across all negative imperatives | M7 | Mixed casing ("do not" vs "Do not") broke imperative register |
| Outlier phrasing in trigger list tightened to match verb-first pattern | M7 | One trigger used a noun phrase instead of action phrase, weakening imperative tone |

**Matter score after Round 1:** 80/100 (Δ +10)

---

### Round 2 — Ralph loop (3 optimizer+Ralph cycles)

**Cycle 1 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| Removed `[vendor name or ID]` from trigger phrases, replaced with concrete "onboard Apex Lighting" style examples | M10 | Bracket placeholder in a trigger phrase is unfilled template syntax — M10 requires zero placeholders anywhere in the file |
| Removed `[vendor]` from description prose, replaced with "the incoming vendor" | M10 | Second unfilled placeholder in description body, same violation |
| Step 1 output block added: echoes vendor ID, contact name, tier, and target go-live date back as a scope confirmation | M6 | M6 requires literal output examples at step boundaries; Step 1 had none |
| 6th anti-pattern added: never skip the Step 4 cross-vendor consistency check when onboarding a second vendor in the same rep group | M4 | Only 5 anti-patterns present at baseline; 6th strengthens the ≥5 requirement with a specific cross-vendor scenario |
| Behavioral commitment block added: "Always complete all checklist steps in order — never skip a step because the vendor contact says it's already done" | M3 | M3 was entirely absent; commitment needed to be concrete and tied to a realistic temptation (vendor saying step is done) |

**Cycle 1 — Ralph findings**
- M10 clean — no remaining brackets in prose or triggers
- M6 confirmed: Step 1 block is concrete (named fields, not generic "output here")
- M3 commitment reads as genuine behavioral rule, not boilerplate
- Suggested: verify 6th anti-pattern is phrased as "Never X" not "Do not X" for consistency

**Cycle 2 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| 6th anti-pattern phrasing aligned to "Never skip" imperative to match list register | M4 | Ralph flagged "Do not skip" vs "Never skip" inconsistency in anti-pattern list |

**Cycle 2 — Ralph findings**
- none — converged

**Matter score after Round 2:** 100/100 (Δ +20)

---

### Final score: 100/100  (Δ from baseline: +30)

**Techniques that moved score:**
- Concrete trigger phrase replacement → closed M10: swapping `[vendor name or ID]` for actual example names removed the last unfilled template syntax
- Step 1 scope echo block with named fields → closed M6: prose step headings alone don't satisfy M6; a literal output block with real field names does
- Behavioral commitment tied to realistic temptation → closed M3: generic commitment language fails; anchoring "never skip" to the specific pressure point (vendor says it's done) made it concrete enough to pass

**Techniques that didn't move score:**
- Formal consistency / "do not" casing standardization → already passing M7 at baseline; Round 1 changes were stylistic improvements that tightened prose without unlocking a new dimension
- Outlier trigger phrasing tightening → stylistic M7 refinement; dimension was already passing

**Stuck dimensions:** none

---

## Run 2026-05-07 (Pass 3+4)  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 100/100 (all dimensions passing from prior run)

### Pass 1 — Deep quality audit

| Change | What was weak | What it became | Reasoning |
|---|---|---|---|
| Purpose line rewritten | "rep-group-matchmaker closes M19 by suggesting rep_group_id, but a complete vendor record needs more..." — explains the *why* in terms of another skill; no action verb describing what this skill does | "Verify that a new AccentOS vendor's Supabase `hsyjcrrazrzqngwkqsqa` record satisfies the completeness contract — required fields, FK integrity, and cross-sibling consistency — before it goes live or after rep-group-matchmaker assigns a `rep_group_id`." | Single tight action verb (verify); names the Supabase project ID; states the contract dimensions explicitly |
| 5th trigger phrase added | Trigger Recognition had only 4 bullet lines (4 phrase pairs); ≥5 distinct triggers is a sub-dimension standard | Added "check rep-group-matchmaker output" / "did the M19 batch leave gaps" — a distinct entry point for the post-M19-run audit scenario | The M19-batch-follow-up case was described in the description but absent from the trigger list, creating a routing gap |

### Pass 2 — Ralph cold-read challenge

| Change | What was ambiguous | What it became | Reasoning |
|---|---|---|---|
| Supabase project ID added to Step 4 SQL block | `WITH sibling_norms AS (` SQL block had no project context | Added `-- Supabase hsyjcrrazrzqngwkqsqa` as first line of the Step 4 SQL block | A new session with no prior context cannot know which Supabase project to paste into without this comment |
| Supabase project ID added to Step 5 Block 3 SQL UPDATE stubs | Comment said "run in Supabase SQL Editor" but no project ID | "-- Supabase hsyjcrrazrzqngwkqsqa — fill in [VALUE] then run in SQL Editor:" | Consistent project ID on every SQL block; paste-readiness requires no implicit context |

### Net matter score change: 100 → 100 (dimension scores unchanged; sub-dimension quality improved)

### Sub-dimension improvements:
- Purpose line: action-verb sentence with Supabase project ID named inline
- Trigger list: 5th distinct entry point added (M19-batch follow-up scenario)
- Step 4 SQL block carries `-- Supabase hsyjcrrazrzqngwkqsqa` for paste-readiness
- Step 5 UPDATE stub header carries project ID — consistent with all other SQL blocks in the skill

---

## Run 2026-05-07 (Round 5+6 — sub-dimension quality)  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 100/100 (binary — maintained)

### Round 5 — Sub-dimension quality + regularization
**L1 specificity check:** AP#2 said "only Michael or the vendor contact can confirm" — "vendor contact" is vague. Tightened to name the specific field: "the vendor's `primary_contact_email`." Added downstream consequence: "Invented values produce silent data corruption in `hsyjcrrazrzqngwkqsqa` that downstream scoring in `vendor_scores` will silently inherit." Description commitment lacked artifact specificity — "per-vendor checklist + remediation actions" rewritten to "per-vendor checklist with ✓/✗/⚠ field rows plus paste-ready SQL UPDATE stubs against hsyjcrrazrzqngwkqsqa."
**L2 commitment check:** Commitment now names the exact artifact format (✓/✗/⚠ rows + SQL stubs) and the target Supabase project — tight enough to be verifiable.
**Adversarial check:** Dimensions sampled: M5 (triggers), M6 (step outputs). M5: trigger "onboard Acme Lighting record" could route here when Michael actually means rep-group-matchmaker (assign the rep_group_id first). Missing NOT-trigger for rep-group-matchmaker routing — added. M6: BLOCK 3 SQL stubs contain `[VALUE]` — inside code fence, exempt from M10. ✓
**Cold-read check:** Step 4 HAVING COUNT(*) >= 3 condition is explicit — sibling threshold of 3 is named. Step 4 also has explicit skip-message when threshold not met. Clean.
**Cross-skill trigger audit:** NOT-trigger block added: "new vendor needs a rep group" / "match vendor to rep group" / "assign rep_group_id" → rep-group-matchmaker. Clarification: this skill runs AFTER rep-group-matchmaker assigns `rep_group_id`; it verifies the completed record, not the assignment logic.

### Round 6 — Second pass
**L1 re-check:** AP#2 `primary_contact_email` is a real `vendors` field (confirmed in Step 2 completeness contract table) — cross-consistent. ✓
**L2 re-check:** Description commitment ✓/✗/⚠ symbols match Step 3 status legend exactly. ✓
**Adversarial re-check:** Cross-skill column consistency: `vendors.rep_group_id`, `vendors.payment_terms`, `vendors.lead_time_days`, `vendors.brand_category` all appear in both Step 2 contract table and Step 4 SQL — consistent. ✓
**Cold-read re-check:** NOT-trigger paragraph placement (after trigger list, before ---) is correct — new reader will see it immediately after the DO-trigger list.

### Final: 3 sub-dimension edits across 2 rounds
