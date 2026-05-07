# Scoring rubric — session-end-forge

> 5 perspectives × 20 points each = **100 total**. Ship threshold: **≥85/100**. Used by `session-end-forge` Step 5 (Pass 1, Claude in-context), Step 6 (Pass 2, agent subagent), and any extra passes (Step 7, capped at 4).

Each perspective has 5 score bands. Pick the band that **best matches** the draft — do not average between bands. When between bands, drop to the lower band (forcing a fix is cheaper than letting a borderline skill ship).

---

## Perspective 1 — Reliability Auditor (0–20)

| Score | Band | Criteria |
|-------|------|----------|
| **20** | Bulletproof | Every Step that reads a file has a "if missing, treat as empty / skip / fall back" clause. Every external call (WebFetch, Bash, MCP) names a fallback. Every named output collision is handled. Failure modes are redirected, not swallowed. ≥3 explicit edge cases named in the workflow. |
| **15** | Strong | Most file reads have fallbacks. External calls have at least one fallback layer. 2 edge cases named. One ambiguity remains in a non-critical step. |
| **10** | Adequate | Happy path documented well. Half the file reads have fallbacks. External-call failure unhandled in one place. 1 edge case named. |
| **5** | Naive | Happy path only. No fallback clauses. Edge cases acknowledged in anti-patterns but not in workflow steps. |
| **0** | Broken | Workflow assumes prereqs always exist. Any non-canonical input crashes the run. |

**Auto-cap:** if any Step says "read X" without a missing-file clause AND X is plausibly missing on first run, cap at 10.

---

## Perspective 2 — Trigger Hunter (0–20)

| Score | Band | Criteria |
|-------|------|----------|
| **20** | Verbatim Michael | ≥4 trigger phrases, all mined verbatim or near-verbatim from `PROMPT_LOG.md`. Slash-command trigger present. Explicit "do not use when" disambiguation vs. ≥1 companion skill. Description has "or any phrasing that..." fuzzy-fallback clause. |
| **15** | Strong | 3 PROMPT_LOG-mined phrases. Slash command present. Disambiguation clause present but generic. |
| **10** | Adequate | 3 trigger phrases, mix of mined and reasonable hypotheticals. No slash command, OR no disambiguation clause. |
| **5** | Hypothetical | Triggers feel invented, not mined. ≤2 phrases. No disambiguation. Phrasings are formal ("Could you please initiate the X workflow"). |
| **0** | Won't fire | Triggers are generic ("yes", "do it") OR the description doesn't surface trigger phrasing at all. |

**Auto-cap:** if no PROMPT_LOG mining is evidenced (i.e. phrases don't match recent Michael voice), cap at 10.

---

## Perspective 3 — Stack Native (0–20)

| Score | Band | Criteria |
|-------|------|----------|
| **20** | AccentOS-shaped | ≥5 substantive stack references (Supabase ID, BC store ID, vendor scoring, GMC, /home/user/accent-os, Klaviyo, etc.). At least one concrete example using real AccentOS data (vendor_scores, GMC feed, etc.). "AccentOS" or "Accent Lighting" named ≥3× in body. ENV vars named where relevant. |
| **15** | Native | 3–4 substantive stack references. Concrete example present. AccentOS named ≥2× in body. |
| **10** | Adequate | Exactly 3 substantive references (the minimum). Description names AccentOS but body is generic. |
| **5** | Generic | <3 substantive references. References are throwaway mentions, not used in workflow. |
| **0** | Reusable elsewhere | Skill could be used by a non-AccentOS user without modification. No stack-specific identifiers. |

**Auto-cap:** <3 substantive references (Step 7.5 violation) caps at 5.

---

## Perspective 4 — Maintenance Skeptic (0–20)

| Score | Band | Criteria |
|-------|------|----------|
| **20** | Future-proof | Zero hardcoded line numbers. All paths derived or fully qualified. Model IDs use forward-compatible framing ("latest Claude Sonnet 4.x" not "claude-sonnet-4-6-20250101"). No "Future enhancements" / "Roadmap" sections. No version-pinned tools without justification. Dynamic file references use grep/awk patterns. |
| **15** | Solid | 1 minor brittle assumption (e.g. one hardcoded version). Otherwise clean. |
| **10** | Adequate | 2–3 brittle assumptions. None catastrophic. No "Future enhancements" section. |
| **5** | Brittle | 4+ brittle assumptions OR "Future enhancements" / "Roadmap" section present. Hardcoded line numbers in workflow. |
| **0** | Will rot | Skill depends on file states / SHAs / line numbers that change every session. Will break within weeks. |

**Auto-cap:** any "Future enhancements" or "Roadmap" section present caps at 5.

---

## Perspective 5 — Anti-pattern Cop (0–20)

| Score | Band | Criteria |
|-------|------|----------|
| **20** | Defensive | ≥5 anti-patterns. Each starts with "Never". Each is specific to this skill (not generic "never skip tests"). Coverage includes: skipping a gate, shipping without validation, over-narrating, unauthorized destructive actions, naming-collision shortcuts. Anti-patterns derived from session signature mistakes / near-misses. |
| **15** | Strong | 4 specific anti-patterns. Each named. Coverage solid. |
| **10** | Adequate | Exactly 3 anti-patterns (the minimum). Mostly specific, one or two generic. |
| **5** | Weak | 2 anti-patterns OR all 3 are generic boilerplate. |
| **0** | Missing | Anti-patterns section absent or 1 entry. |

**Auto-cap:** <3 anti-patterns (Step 7.5 violation) caps at 5. Generic-only anti-patterns ("never write bad code") cap at 10.

---

## Total + threshold

| Total | Action |
|-------|--------|
| **≥ 85** | Ship — proceed to Step 7.5 validation, then commit. |
| **70–84** | Run another pass (Pass 3 / Pass 4). Cap total passes at 4. |
| **< 70 after 4 passes** | Abort to WATCH. Log `outcome: aborted_low_score`. Do not commit. |

---

## Why 85 (not 70, not 95)

- **70** would let mediocre skills ship — defeats the purpose of multi-perspective stress test.
- **95** would force gold-plating — most skills hit a long-tail of diminishing returns above 90 and waste passes.
- **85** is the elbow: requires every perspective to score ≥17 OR a strong perspective to compensate for one weak one (e.g. 20+18+18+15+14 = 85 ships; 16+16+16+16+16 = 80 needs another pass).

The threshold is the **contract**. Bump scores, not the threshold.

---

## Self-audit cadence

Every 10 forge-log entries, scan the `final-score` distribution:
- If >50% of shipped skills scored exactly 85–87 (the "just-passing" band), the rubric may be too forgiving. Surface for review.
- If <30% of forge attempts ship (i.e. >70% abort low-score), the rubric may be too harsh. Surface for review.

Both surfaces happen in `forge-log.md` as an annotation, not a SKILL.md edit.
