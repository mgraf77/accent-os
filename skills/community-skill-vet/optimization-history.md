# community-skill-vet — optimization history

---

## Run 2026-05-07  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 70/100

| Dim | Name | Score | Reason failed |
|---|---|---|---|
| M1 | Description ≥300 chars | 10 | — |
| M2 | AccentOS named | 10 | — |
| M3 | Behavioral commitment | 0 | No "always X — never Y" commitment present |
| M4 | ≥5 "Never" anti-patterns | 0 | No "Never" anti-pattern block present |
| M5 | ≥5 trigger phrases | 10 | — |
| M6 | Concrete step outputs | 0 | Step headings were noun phrases, not verb-phrase actions with outputs |
| M7 | Zero passive voice | 10 | — |
| M8 | No prose walls | 10 | — |
| M9 | Stack reference | 10 | — |
| M10 | No placeholders | 10 | — |
| **Total** | | **70/100** | |

---

### Round 1 — 3-pass structure/prose/AccentOS sweep

**Changes made:**

| Change | Dimension | Reasoning |
|---|---|---|
| Step 2 "Permissions audit" → "Audit permissions" (verb-phrase heading) | M6 | Noun headings describe topics; verb headings describe actions with deliverables |
| Steps 3–7 all given verb-phrase headings | M6 | Consistent verb-phrase heading pattern across all steps |
| Path "Codespace terminal" → "terminal" | M9 | Codespace is environment-specific; AccentOS stack uses /home/user/accent-os/ paths |

**Matter score after Round 1:** 90/100 (Δ +20)

---

### Round 2 — Ralph loop (3 optimizer+Ralph cycles)

**Cycle 1 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| 3 additional trigger phrases added — 7 total | M5 | M5 was passing but at minimum; 7 distinct triggers improve routing breadth |
| 7 anti-patterns added — including vet-blind and HOLD-without-specifics entries with Supabase credential exfiltration consequence | M4 | No Never block existed at baseline; 7 AccentOS-specific entries with consequences added |
| Step 4 fill-in reputation table added | M6 | Step 4 described review action without showing output shape; table added |
| Step 5 passive note → imperative rule | M7 | M7 was passing; passive phrasing in note clause tightened to imperative |
| Behavioral commitment added to description | M3 | M3 was failing; added always/never shipped-behavior sentence |

**Cycle 1 — Ralph findings**
- HOLD-without-specifics anti-pattern consequence needed clearer impact statement
- Step 4 reputation table columns were generic — not AccentOS-specific

**Cycle 2 — Optimizer**

| Change | Dimension | Reasoning |
|---|---|---|
| HOLD-without-specifics consequence rewritten with explicit Supabase credential exfiltration risk | M4 | Ralph flagged vague impact; concrete consequence (credential exfiltration) added |
| Step 4 reputation table columns renamed to AccentOS-specific fields | M6 | Ralph flagged generic columns; replaced with skill-registry and community-source fields |

**Cycle 2 — Ralph findings**
- none — converged

**Cycle 3 — Optimizer**
No new changes — all Ralph findings addressed in Cycle 2

**Cycle 3 — Ralph findings**
- none — converged

**Matter score after Round 2:** 100/100 (Δ +10)

---

### Final score: 100/100  (Δ from baseline: +30)

**Techniques that moved score:**
- Verb-phrase step headings → closed M6: noun-phrase headings gave no output contract; verb-phrases do
- 7 AccentOS-specific anti-patterns with consequences → closed M4: dimension was absent at baseline
- Behavioral commitment → closed M3: only missing dimension after Round 1
- Supabase credential exfiltration consequence in HOLD anti-pattern → reinforced M4: concrete stakes make the rule actionable

**Techniques that didn't move score:**
- Additional trigger phrases → M5 was already passing; routing coverage improved without score delta
- Step 5 passive → imperative → M7 was already passing; style improvement only

**Stuck dimensions:** none

---

---

## Run 2026-05-07 (Pass 3+4)  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 100/100 (all dimensions passing from prior run)

### Pass 1 — Deep quality audit

| Change | What was weak | What it became | Reasoning |
|---|---|---|---|
| Purpose line rewritten to single tight verb sentence | Three sentences building to "This skill is the gate" — delayed the action and omitted the output artifact | Single sentence: "Gate every community skill before it lands in `/home/user/accent-os/skills/`... INSTALL / HOLD / REJECT verdict with one-paragraph evidence before any copy command runs" | Purpose must lead with the action and the output shape; three-sentence wind-up obscures both |
| Trigger "is [skill name] trustworthy" replaced with "does [skill name] have any hidden permissions" | Semantically overlapped "is this skill safe" — same intent, different wording | "does [skill name] have any hidden permissions" targets a distinct inspection request (permissions scope, not general safety) | Overlapping triggers reduce routing confidence; the new phrase routes a permission-audit intent specifically |
| "Never auto-install" expanded with AccentOS-specific consequence | Generic prohibition with no named consequence | Names the specific risk: unaudited code in the same directory tree as `hsyjcrrazrzqngwkqsqa` credentials and session hooks | Anti-patterns must name a specific AccentOS failure mode; "auto-install" without a consequence is advisory, not preventive |

### Pass 2 — Ralph cold-read challenge

| Change | What was ambiguous | What it became | Reasoning |
|---|---|---|---|
| Step 1 plugin manifest fetch method made explicit | "If the source is a plugin, fetch the plugin manifest" — no URL, no tool, no fallback | WebFetch on `https://claude-code-skills.com/plugins/[identifier]/manifest.json` specified as the fetch mechanism | A new Claude session reading Step 1 had no executable instruction for plugin manifests; ambiguous precondition |

### Net matter score change: 100 → 100

### Sub-dimension improvements:
- Purpose line: three-sentence rationale → single action-and-output-shape sentence
- Trigger list: semantically overlapping "is [skill name] trustworthy" → distinct "does [skill name] have any hidden permissions"
- Anti-pattern "Never auto-install": generic prohibition → AccentOS-specific consequence naming credentials directory
- Step 1: plugin manifest fetch was an unexecutable precondition → explicit WebFetch URL pattern added

---

## Run 2026-05-07 (Round 5+6 — sub-dimension quality)  branch: claude/optimize-skills-agents-1u8OO

### Baseline matter score: 100/100 (binary — maintained)

### Round 5 — Sub-dimension quality + regularization
**L1 specificity check:** AP2 "Skill-quality signals (good description, clean formatting) do not substitute for the per-tool permission classification table" was generic — no AccentOS failure scenario named. Rewrote to describe a 100/100-quality-score skill that still contains an unjustified Bash pipe to the Supabase MCP server routing `hsyjcrrazrzqngwkqsqa` to an external host.
**L2 commitment check:** M3 commitment in description uses no vague words. Clean.
**Adversarial check:** Dimensions sampled: M5 (trigger phrases), M4 (anti-patterns). M5: argument-slot brackets in trigger phrases are not M10 failures. M4: AP2 had a generic failure scenario — fixed. No other failure paths found.
**Cold-read check:** Step 1 plugin manifest WebFetch URL was added in prior run — still executable. Auth-required fallback is clear. No gaps.
**Cross-skill trigger audit:** "is this skill safe" does not collide with doc-drift or schema-contract-tests — those operate on code/planning docs, not community skill installation. No collision.

### Round 6 — Second pass
All binary Ralph checks passed on post-Round-5 state. No new passive voice introduced. AP2 new text is dense but not a prose wall (single bullet). No additional L1 opportunities found in rewritten sections. Adversarial check on AP3 (trust SKILL.md description alone): handles edge case of no numbered steps via "any `references/*.md` files or scripts" fallback.

### Final: 1 sub-dimension edit across 2 rounds

---
