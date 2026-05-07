# skill-optimizer learning notes

Hard-learned rules extracted from run history. Read at Step 0 before every run.
Each `RULE:` entry overrides default optimizer behavior.

---

### 2026-05-07 — from run on claude/optimize-skills-agents-1u8OO

RULE: Never apply contraction removal ("doesn't" → "does not") as an optimizer technique — it
produces 0 matter-score delta in every case because it doesn't target any of the 10 dimensions.
BETTER: Use edit budget on M6 (concrete output artifacts) or M3 (behavioral commitments) instead.
Source: Run 2026-05-07, 24 wasted edits across 12 skills.

---

RULE: Never apply "Stolen from" → "Origin" label rewrites as an optimizer technique — stylistic
only, 0 dimension impact.
BETTER: Skip entirely; it's a vanity change that consumes edit tokens.
Source: Run 2026-05-07, 8 wasted edits across 8 skills.

---

RULE: Never apply imperative-voice rewrites (M7) when that skill's M7 dimension already scores 10 —
53% miss rate when M7 = 10 because the remaining passive constructions are inside fenced code blocks
(correct-as-is) or in section headers (intentionally non-imperative).
BETTER: Check M7 baseline score first; only apply imperative rewrites when M7 = 0.
Source: Run 2026-05-07, 20 wasted edits on skills where M7 was already passing.

---

RULE: Never attempt to break prose walls (M8) when M8 is already scoring 10 — produces 0 delta.
BETTER: Read the baseline scorecard from Step 1; skip M8 work for any skill already at 10 on M8.
Source: Run 2026-05-07, 6 wasted edits on already-clean prose structure.

---

RULE: Never flag `[placeholder]` text inside a fenced code block as an M10 failure — fenced
code blocks are intentionally illustrative templates; brackets inside them are expected.
BETTER: Only scan prose lines (outside ``` fences) for unfilled placeholders.
Source: Run 2026-05-07, 9 incorrect M10 "failures" on fenced template content.

---

RULE: Always apply M6 (concrete output artifact) fixes before M3 (behavioral commitment) because
M6 is the highest-ROI move (47/47 success rate, 0 misses) and completing M6 often reveals the
natural language for the M3 commitment ("always produces X — never returns Y").
BETTER: Priority order per run: M6 → M3 → M4 → M10 → M5 → M7 → M9 → M1 → M2 → M8.
Source: Run 2026-05-07 leaderboard analysis.

---

RULE: When efficiency-monitor-style skills exist (auto-active, no explicit user triggers), always
check for a missing `## Trigger Recognition` section and add one — auto-active skills still need
explicit invocation phrases for the manual-trigger path. Without this section the skill scores 0
on M5.
BETTER: Check for section existence in Step 1 baseline scan; flag as M5=0 if absent.
Source: Run 2026-05-07, efficiency-monitor was the only skill with M2=0 and M4=0 and M5=0.

---

RULE: The minimum effective group size is 4 skills and maximum is 6. Groups of 3 underuse the
agent (too much overhead per skill). Groups of 7+ produce edit conflicts when skills share
terminology and the Ralph loop finds cross-file inconsistencies.
BETTER: Always group into 4–6 skills per agent.
Source: Run 2026-05-07 (Group 5 had 8 skills; Group 4 had 5 — Group 4 ran faster with fewer
retry loops).

---

### 2026-05-07 — from run Rounds 5+6 on claude/optimize-skills-agents-1u8OO

RULE: Always check for body-level behavioral commitment separately from YAML frontmatter — 8/28
skills had "always X — never Y" in frontmatter but NOT in the skill body. A cold-read session
that doesn't parse YAML receives no commitment signal.
BETTER: In Step 1 baseline scoring, check M3 in both the frontmatter description AND the skill
body text. If YAML has the commitment but the body does not, flag as M3 gap and add body copy.
Source: Run 2026-05-07 Rounds 5+6, broken-link-rescue / build-plan-status / bulk-meta-description
/ codex-review / rep-group-matchmaker and 3 others.

---

RULE: Always add a cross-skill routing note after the Trigger Recognition section when two
skills share overlapping trigger vocabulary — 18/28 skills had unaddressed routing ambiguity
with at least one sibling skill. 100% of routing disambiguation edits improved routing clarity.
BETTER: During Step 1 baseline scan, check each skill's triggers against its documented
companion skills. If any trigger phrase could fire a companion skill, add a "Do NOT trigger
for X — that routes to [companion]" note with a distinguishing mechanism sentence.
Source: Run 2026-05-07 Rounds 5+6, repo-scout/skill-forge, skill-eval-suite/codex-review,
schema-contract-tests/table-eda, gmc-feed-audit/broken-link-rescue, and 14 others.

---

RULE: Never skip adversarial dimension checks on M6 (concrete outputs) and M3 (behavioral
commitment) — these two dimensions are most likely to develop edge-case gaps as skills evolve.
However, never apply adversarial checks to M1 (description length) or M2 (AccentOS named) —
0/28 adversarial checks on those dimensions found failure paths. They are structurally stable.
BETTER: Adversarial sampling priority: M6, M3, M4, M5, M10 — skip M1 and M2 (always stable).
Source: Run 2026-05-07 Rounds 5+6 adversarial checks fleet-wide.

---

RULE: Cold-read executability checks catch correctness bugs that binary Ralph loops miss
entirely — 7 correctness bugs (state-machine inconsistency, CTE scope, phantom file references,
stale dates, M10 violations) were found only in cold-read, not in prior Ralph cycles.
BETTER: Cold-read is not optional — treat it as Check 6 of the sub-dimension cycle on every
skill regardless of binary score. SQL blocks and cross-file references are the highest-yield targets.
Source: Run 2026-05-07 Rounds 5+6, prompt-queue / supabase-sql-magic / schema-contract-tests
/ codex-review / vendor-risk-register / repo-scout / bc-business-review.

---
