# AccentOS — Gap Analysis & Closed-Loop Skill Strategy

**Date:** 2026-05-07
**Branch:** `claude/accentos-gap-analysis-Dcvcf`
**Author:** Claude (auto-session)
**Companion files:** `skills/gap-optimizer/`, `skills/skill-health-monitor/`, `skills/_index.md`

---

## 1. What AccentOS is — and what it's becoming

AccentOS today is a 28-skill, vanilla-JS, Supabase-backed internal operating system for Accent Lighting. It already covers communication framing (`vibe-speak`), pattern observation (`efficiency-monitor`), skill creation (`skill-forge`), vendor intelligence, data exploration, and most of Tracks 1–5 in the build plan.

The long-term vision (per `MASTER.md` §14 + the Agentic Capability Ladder) is an **agentic** OS — a system that proactively alerts, drafts actions, predicts outcomes, and executes approved decisions. Today AccentOS is somewhere between Level 2 (reactive display) and Level 3 (proactive alerts). The vision is Level 6: autonomous execution after one-click human approval.

The skill ecosystem has the same arc. Today: 28 hand-built skills, mostly forged on demand when Michael says "look into X." Vision (per `_index.md` and the skill-forge SKILL): **40–50 self-maintaining skills** that get proposed, built, evaluated, deprecated, and merged with minimal manual orchestration.

---

## 2. The gap, in one sentence

**There is no closed loop.** `skill-forge` builds skills when asked. `efficiency-monitor` flags emergent patterns at session boundaries. But nothing scans the *gap between current capabilities and the documented vision* and prioritizes which skill to build next. The system is reactive, not goal-seeking.

---

## 3. HAVE vs. NEED matrix

### 3a. HAVE (current 28 skills, grouped by domain)

| Domain | Skills | Coverage |
|--------|--------|----------|
| Communication framework | `vibe-speak` | strong |
| Pattern observation | `efficiency-monitor` | strong |
| Skill creation | `skill-forge`, `skill-eval-suite`, `repo-scout`, `community-skill-vet`, `codex-review` | strong |
| Build-ops / governance | `bottleneck-finder`, `build-plan-status`, `decision-log`, `doc-drift`, `prompt-queue`, `autonomous-mode` | strong |
| Data investigation | `supabase-sql-magic`, `table-eda`, `schema-contract-tests`, `kpi-data-audit`, `analysis-snapshot` | strong |
| Vendor intelligence | `vendor-cascade`, `vendor-clarity-test`, `vendor-onboard-checklist`, `vendor-risk-register`, `rep-group-matchmaker`, `priority-articulation` | strong |
| E-commerce / SEO | `bc-business-review`, `bulk-meta-description`, `gmc-feed-audit`, `broken-link-rescue` | partial |

### 3b. NEED (per MASTER.md vision, Capability Ladder, BUILD_PLAN Track 6)

| # | Capability gap | Source of need | Type |
|---|----------------|----------------|------|
| 1 | **Closed-loop gap-to-skill optimization** | This document | meta-infra |
| 2 | **Skill-ecosystem self-maintenance** (regression detect, broken refs, merge proposals) | `_index.md` "By 2027: skills are self-maintaining" | meta-infra |
| 3 | GA4 insights pull + interpret | BUILD_PLAN Track 6.1 | integration |
| 4 | Google Search Console pull + analysis | BUILD_PLAN Track 6.2 | integration |
| 5 | BigCommerce REST write-side automation | BUILD_PLAN Track 6.3 | integration |
| 6 | Klaviyo flow management | BUILD_PLAN Track 6.4 | integration |
| 7 | Windward ERP read bridge | BUILD_PLAN Track 6.11 | integration |
| 8 | Outreach / follow-up email drafter | Capability Ladder L4 | agentic |
| 9 | Co-op / rebate claim drafter w/ deadline triggers | MASTER §14 vision | agentic |
| 10 | Churn predictor (RFM-deviation alerts) | Capability Ladder L5 | agentic |
| 11 | Action queue (approve-then-execute pipeline) | Capability Ladder L6 | agentic |
| 12 | Daily-brief composer (role-aware morning brief assembly) | MASTER §14 vision | agentic |
| 13 | Alert router (9-signal generator → action queue) | Phase 4 / 6.8 | agentic |
| 14 | Next-action recommender (state → top-3 high-leverage actions) | MASTER §14 vision | agentic |
| 15 | Skill performance / KPI tracker (matched/used/saved-per-skill) | `_index.md` "feedback loops" | meta-infra |

Total identified gaps: **15**. Hand-building all of them would take months and bypass the approval discipline already encoded in `skill-forge`. The right move is to build the **mechanism** for ranking and closing them, not the skills themselves.

---

## 4. Closed-loop architecture (the answer to the user's ask)

```
                      ┌──────────────────────────────────┐
                      │            VISION                │
                      │  MASTER.md  + BUILD_PLAN +       │
                      │  Capability Ladder + KPIs        │
                      └───────────────┬──────────────────┘
                                      │ reads
                                      ▼
                      ┌──────────────────────────────────┐
   ┌──────────────────┤    gap-optimizer      (NEW)      │◄───────┐
   │  emergent-demand │  scans HAVE vs NEED, scores      │        │
   │  feed            │  and ranks, writes               │        │
   │                  │  candidate-queue.md              │        │
   │  ┌─────────────┐ └───────────────┬──────────────────┘        │
   │  │ efficiency- │                 │ proposes top-N            │
   │  │ monitor     │─────────────────┤                           │
   │  │ (existing)  │                 ▼                           │
   │  └─────────────┘ ┌──────────────────────────────────┐        │
   │                  │     APPROVAL GATE  (Michael)     │        │
   │                  └───────────────┬──────────────────┘        │
   │                                  │ build [name1] [name2]     │
   │                                  ▼                           │
   │                  ┌──────────────────────────────────┐        │
   │                  │     skill-forge   (existing)     │        │
   │                  │  forges + Ralph-loops + commits  │        │
   │                  └───────────────┬──────────────────┘        │
   │                                  │ writes to skills/         │
   │                                  ▼                           │
   │                  ┌──────────────────────────────────┐        │
   │                  │  skill-health-monitor  (NEW)     │        │
   │                  │  watches skills/ for regression, │        │
   │                  │  broken refs, merge candidates,  │        │
   │                  │  dying skills                    │        │
   │                  └───────────────┬──────────────────┘        │
   │                                  │ feeds                     │
   │                                  ▼                           │
   │                  ┌──────────────────────────────────┐        │
   └──────────────────┤  gap-optimizer re-scans  ────────┴────────┘
                      │  measures closure, picks next    │   (loop)
                      └──────────────────────────────────┘
```

**Repeatability:** every cycle of the loop is one `gap-optimizer` run + one `skill-forge` run. The cadence Michael chooses (weekly, after a big ship, end-of-month). Each loop iteration:
1. `gap-optimizer` reads vision + current `_index.md` + `efficiency-monitor` queue + last `gap-log.md` entry → scores all 15+ gaps → outputs ranked top-3.
2. Michael runs the standard skill-forge approval gate.
3. `skill-forge` builds approved candidates.
4. `skill-health-monitor` audits the new skill against existing ecosystem (no duplicates, no broken refs).
5. `gap-optimizer` re-scans; logs what closed, what surfaced anew.

---

## 5. Build plan for this session

| # | Artifact | Status | Why |
|---|----------|--------|-----|
| 1 | `GAP_ANALYSIS.md` (this file) | shipping | the analysis itself |
| 2 | `skills/gap-optimizer/SKILL.md` + supporting files | shipping | the missing closed-loop piece |
| 3 | `skills/skill-health-monitor/SKILL.md` + supporting files | shipping | top-1 gap from vision: "skills are self-maintaining" |
| 4 | `skills/_index.md` updates (2 new entries) | shipping | registry sync |
| 5 | Light edits to `skill-forge/SKILL.md` Step 0 | shipping | accept gap-optimizer queue as input |
| 6 | Light edits to `efficiency-monitor/SKILL.md` Step 0 | shipping | surface gap-optimizer queue at boot |
| 7 | `.claude/CLAUDE.md` boot sequence updated | shipping | wire optimizer into auto-execute |
| 8 | First gap-optimizer run → `candidate-queue.md` populated with 15 ranked gaps | shipping | demonstrate the loop end-to-end |
| 9 | All other 13 gap skills (GA4, Klaviyo, churn-predictor, etc.) | **deferred** | go through approval gate next session |

The 13 deferred gap skills are now the *output* of the loop, not direct deliverables of this session. They wait in `candidate-queue.md` for Michael's approval. That respects skill-forge's hard rule: "Never skip the Step 5 approval gate."

---

## 6. Success criteria

The loop is working when:
- `gap-optimizer` runs in <60s and produces a ranked queue without prompting.
- The queue stays current — every new skill shipped via `skill-forge` triggers a re-scan automatically (or on next session boot).
- `gap-log.md` shows monotonic gap-closure: number of unresolved gaps decreasing over time, or new gaps appearing only when the vision itself expands.
- `efficiency-monitor` PROMOTE candidates and `gap-optimizer` candidates merge into a single ranked list — no duplicate proposals.
- After 4 cycles, the skill ecosystem reaches the 35–40 skill range with the Capability Ladder Level 4 (Draft actions) substantially covered.

---

## 7. What this document is NOT

- Not a commit of all 15 gap-closing skills. Those go through the approval gate.
- Not a critique of existing skills. They're solid; the gap is in *orchestration*, not in any individual skill.
- Not a one-time analysis. It's the seed input for the first run of the closed loop.
