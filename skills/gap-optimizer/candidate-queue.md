# AccentOS — Gap Candidate Queue

> Auto-rebuilt by `gap-optimizer` each run. Sorted by composite score descending.
> This file is **canonical current-state** — it is overwritten, not appended.
> For history of what's been ranked over time, see `gap-log.md`.

**Last run:** 2026-05-07 (seed cycle)
**Branch:** `claude/accentos-gap-analysis-Dcvcf`
**HEAD:** `51de122` (pre-this-commit)
**Vision artifacts read:** MASTER.md §14, BUILD_PLAN_CLAUDE Track 6, BUILD_PLAN_MICHAEL pending M-tasks, KPI_CATALOG, _index.md, Capability Ladder
**Current skills:** 30 (28 prior + gap-optimizer + skill-health-monitor shipped this session)
**Emergent PROMOTE from efficiency-monitor:** 0 (efficiency-log empty — first run)

---

## Top 3 (surfaced for forge approval)

### RANK 1: `email-drafter`
- **Type:** agentic (Capability Ladder L4)
- **Sources:** MASTER §14 ("submitted without touching a keyboard"), L4 ladder ("Draft actions"), V03 voice-note refinement
- **What it would do:** Generate paste-ready outreach / follow-up / co-op-claim / quote-revival emails from a Supabase context (customer, vendor, deal, quote). Uses Anthropic API via `ANTHROPIC_API_KEY`. Always produces draft + subject + send-or-hold recommendation; never sends.
- **Closes:** L4 (Draft actions), V01 (daily brief auto-assembly's outreach component), V06 (co-op auto-claim drafter), MASTER §14 quote-revival narrative
- **Score:** I=5 F=4 B=4 C=2 → **40.0**
- **Blocked by:** none (Anthropic API + Supabase already wired)
- **Forge effort:** MED (2–6h)

### RANK 2: `daily-brief-composer`
- **Type:** agentic (Capability Ladder L3→L4)
- **Sources:** MASTER §14 ("Every role has a daily brief waiting"), V01
- **What it would do:** Assemble a role-aware morning brief by querying Supabase for: today's top-3 actions, deals at risk, vendors needing attention, KPI deviations. Composes the brief in vibe-speak default mode. Output is paste-ready Markdown for the existing Daily Command Center UI.
- **Closes:** V01, partial V07 (alerts surfaced via brief), partial L3 (proactive surfacing)
- **Score:** I=5 F=5 B=3 C=2 → **37.5**
- **Blocked by:** none (Track 1.3 Daily Command Center already shipped — skill is the composer)
- **Forge effort:** MED (3–5h)

### RANK 3: `action-queue`
- **Type:** agentic (Capability Ladder L6)
- **Sources:** MASTER §14 ("Michael approves two, dismisses one, and the approved actions execute automatically"), L6 ladder
- **What it would do:** Persist proposed actions (drafted emails, claim drafts, vendor outreach, price-change pushes) into a Supabase `action_queue` table with state machine: PROPOSED → APPROVED → EXECUTED → ARCHIVED (or DISMISSED). Each action has an executor pointer (function name). Skill manages lifecycle, not execution itself.
- **Closes:** L6, MASTER §14 autonomous narrative, V06 co-op auto-claim execution layer
- **Score:** I=5 F=5 B=2 C=3 → **16.7**
- **Blocked by:** schema design (new `action_queue` table needed; M-task implied)
- **Forge effort:** HIGH (6–10h: SKILL.md + schema + executor registry pattern)

---

## Full ranked queue (15 candidates)

| Rank | Candidate | Type | I | F | B | C | Score | Sources | Blocked-by |
|------|-----------|------|---|---|---|---|-------|---------|------------|
| 1 | email-drafter | agentic | 5 | 4 | 4 | 2 | 40.0 | MASTER §14, L4, V03, V06 | none |
| 2 | daily-brief-composer | agentic | 5 | 5 | 3 | 2 | 37.5 | V01, MASTER §14 | none |
| 3 | next-action-recommender | agentic | 5 | 4 | 3 | 2 | 30.0 | MASTER §14 ("three things to act on") | none |
| 4 | alert-router | agentic | 4 | 5 | 3 | 2 | 30.0 | T6.8, V07 | partial: needs alert schema clarity |
| 5 | churn-predictor | agentic | 5 | 3 | 3 | 2 | 22.5 | V05, L5 | none (RFM data exists in CRM tables) |
| 6 | ga4-insights | integration | 4 | 4 | 2 | 2 | 16.0 | T6.1 | M06 (GA4 credentials) |
| 7 | gsc-insights | integration | 4 | 4 | 2 | 2 | 16.0 | T6.2 | M06 (GSC credentials) |
| 8 | action-queue | agentic | 5 | 5 | 2 | 3 | 16.7 | L6, MASTER §14 | needs new schema |
| 9 | klaviyo-flows | integration | 4 | 3 | 2 | 2 | 12.0 | T6.4 | M09 (Klaviyo credentials) |
| 10 | bc-rest-bridge | integration | 4 | 3 | 2 | 2 | 12.0 | T6.3 | M04 (BC API credentials) |
| 11 | coop-claim-drafter | agentic | 4 | 2 | 4 | 2 | 16.0 | V06 | none (specializes email-drafter — could be a sub-feature) |
| 12 | windward-bridge | integration | 4 | 2 | 1 | 4 | 2.0 | T6.11 | M03 + M10 (Windward read access) |
| 13 | skill-performance-tracker | meta-infra | 3 | 3 | 4 | 2 | 18.0 | I02 | none |
| 14 | demand-forecaster-skill | agentic | 4 | 2 | 3 | 2 | 12.0 | T6.9, L5 | UI exists; skill-side analysis layer |
| 15 | trade-vendor-portal | integration | 3 | 1 | 1 | 5 | 0.6 | T6.5, T6.6 | external-facing — many M-tasks |

Note: some scores in the table differ from the "top-3" composite calculations because the table is sorted on the strict formula; ties broken per `references/scoring-rubric.md` (Impact, then Buildability, then alphabetical).

---

## Closed since last run

(First run — nothing closed yet.)

## Saturation watch

(Queue just seeded — no saturation. After 2 cycles, if ≥3 unforged top-3 candidates remain, the next run will surface a saturation warning at the run header.)

---

## ═══ FORGE APPROVAL GATE ═══

To forge from the queue, reply with one of:

- `forge top 3` → invokes skill-forge for ranks 1–3 in sequence (email-drafter, daily-brief-composer, next-action-recommender)
- `forge top N` → invokes skill-forge for ranks 1–N
- `forge [name]` → invokes skill-forge for a specific candidate (e.g. `forge churn-predictor`)
- `forge none` → close run, queue stays for next session
- `rescan` → discard this run, re-do gap-optimizer Steps 1–5

**The queue is saved. Nothing is built until you reply.**

═══════════════════════════════
