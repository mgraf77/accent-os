# AccentOS — Long-Term Vision Plan & Build Roadmap

> **Living document.** Real-time log of vision, plan, and execution state.
> Every meaningful change appends to the **Decisions Log** at the bottom.
> Synthesized from 3 rounds of multi-stakeholder roleplay (12 agent personas total).

**Document version:** v2.0 (round-3 synthesis)
**Last updated:** 2026-05-07
**Status:** ✅ At threshold — ready to start Phase 0 execution
**Threshold score:** 87% (honest matrix, see §6)

---

## 1. Vision

AccentOS is the **control panel** for Accent Lighting and the **heartbeat** of the business itself. Every user — owner, employee, customer — sees their own goals, their own scoreboard, their own next-best-action, surfaced through a unified intelligence layer.

**Core mandates (from Owner):**
- Make Accent better, more profitable, smarter, higher converting.
- Increase sales, business operations, and employee satisfaction.
- Empower every user to be the best version of themselves at work.
- Be a control panel — each user type sees what helps *their* particular goals.

**Per-persona goals:**
| Persona | Primary AccentOS goal |
|---|---|
| Michael (Owner) | Profitability, conversion, smarter ops, control |
| Patrick (Ecom growth lead) | **Maximize ecommerce sales** — full funnel |
| Paul (Sales) | **Understand the business** — deals, customers, vendors |
| All employees | Be sharper, more autonomous, recognized |
| Customers (future) | Buy the right lighting, equipped not managed |

---

## 2. Foundational Principles (non-negotiable)

1. **Multi-metric heartbeat** — not one north-star. The dashboard is the pulse of Accent Lighting itself, not just AccentOS adoption.
2. **Delta-ROI system-wide** — every button, automation, and AI skill tracks `value_generated − cost_to_fire` via the `automation_events` table. Negative or near-zero ΔROI auto-flags for kill/optimize.
3. **Dynamic thresholds** — no hardcoded gates. Bayesian Beta-LCB recalibration with anti-Goodhart guards, minimum-N protection, and holdout counterfactuals.
4. **Control-panel UX per persona** — each user's dashboard surfaces *their* goals first, company KPIs second.
5. **Anti-deskill by default** — explain-mode + edit-distance telemetry on every AI surface; AI makes people sharper, not just faster.
6. **Cost-bounded AI** — workspace cap with kill-switch, prompt caching, model tiering (Haiku → Sonnet → Opus), per-user/action quotas.
7. **Security as gate** — RLS regression CI, hash-chained audit_log, JWT audience split before any external-facing surface.
8. **Recalibrate, don't ratify** — every round updates thresholds toward maximizing performance, not minimizing risk.

---

## 3. Heartbeat Dashboard (multi-metric)

Four tiers, ~15 metrics. v1 ships 6; expands in Phase 2.

### Tier 1 — Business Pulse
| Metric | Threshold band | Healthy / Warn / Red |
|---|---|---|
| Daily Revenue (blended ecom + showroom + trade) | vs 28d avg | >1.0× / 0.7-1.0× / <0.7× |
| Gross Margin % (rolling 7d) | absolute | >42 / 35-42 / <35 |
| Conversion Rate (ecom) | sessions→orders 24h | >2.0 / 1.2-2.0 / <1.2 |
| AOV | vs band | dynamic |
| Quote→Close % (trade/showroom) | 30d | >35 / 25-35 / <25 |
| **Revenue / Session (RPS)** *(Patrick's headline)* | vs baseline | dynamic |

### Tier 2 — Ops Pulse
| Metric | Notes |
|---|---|
| Inventory Health Score | % SKUs in stock weighted by 30d velocity |
| Fulfillment SLA | % shipped within promised window |
| Vendor Score Trend | Composite Δ vs 90d |
| Cart→Ship Time | median order placed → shipped |

### Tier 3 — People Pulse
| Metric | Notes |
|---|---|
| Actions per Active User per Day | per role |
| Role DAU/WAU | stickiness ratio |
| Empowerment Signal | weekly 1-tap pulse |
| Skill Growth | new tools/skills used per user 30d |

### Tier 4 — AI Pulse
| Metric | Notes |
|---|---|
| **Delta-ROI per Automation** | $ saved/earned − AI cost, per skill, 30d. **Primary KPI.** |
| AI Cost Burn | $ MTD vs budget; kill-switch at 80% |
| Eval Score | golden-set pass rate per CI run |
| Retrieval Relevance | % RAG queries with user-confirmed useful answer |

### Per-persona top-of-dashboard (5 tiles each)
- **Michael:** Daily Revenue · Gross Margin · Delta-ROI · Empowerment Signal · Conversion Rate
- **Patrick:** RPS · Conversion Rate · Inventory Health · Fulfillment SLA · Cart→Ship
- **Paul:** Daily Revenue · Quote→Close % · Gross Margin · AOV · Vendor Score Trend
- **Employee:** Their role's top metric · Their Actions/Day · Empowerment pulse · One team KPI · Personal sharpness trend
- **Customer (future):** Order status · Lighting plan · Reorder list · Their rep · Designer notes

---

## 4. Phase 0 — Foundation Gate (12 work items, ~3 weeks)

After Occam-pass merges. Nothing in Phase 1+ ships until 0.1–0.12 land.

| # | Item | Merges |
|---|---|---|
| 0.1 | **`automation_events` table** (the spine) | adoption + edit-distance + cost telemetry collapse here |
| 0.2 | **AI Gateway** module (cost + tiering + caching) | prompt caching + Haiku/Sonnet/Opus router + token logging |
| 0.3 | **Threshold service** (Beta-LCB + ΔROI promotion + holdout) | dynamic registry + anti-Goodhart guards |
| 0.4 | **Heartbeat dashboard v1** (6 metrics) | scales to 15 in Phase 2 |
| 0.5 | **Security gate CI** (RLS regression + JWT aud split + hash-chained audit_log) | one CI job, three checks |
| 0.6 | **Dev platform** (bundler + type-gen + migration runner + Playwright harness) | one PR series |
| 0.7 | **Cmd-K v1** (10 hardcoded commands, no fuzzy yet) | universal entry, breaks sidebar dependency |
| 0.8 | **First-run checklist v1** (static markdown rendered in-app) | onboarding-as-code seed |
| 0.9 | **Friday "what shipped" demo ritual** (20 min cadence) | recognition + adoption signal |
| 0.10 | **Per-persona control-panel scaffold** (goals + thresholds editable per user) | enables persona dashboards |
| 0.11 | **Late/short/damaged board** (filtered view of existing orders, no new schema — Patrick's #1 ask) | unified ops view |
| 0.12 | **Thumbs telemetry hook** (one tap per AI surface → `automation_events`) | satisfaction signal without surveys |

### Deferred from Phase 0 (per Occam pass)
- Loom-per-module library (record reactively when asked twice)
- AI-off Fridays (edit-distance telemetry covers the deskill signal)
- Sharpness Score 5-dim engine (becomes derived view in Phase 2)
- Full explain-mode panels (ship one "why?" link in Phase 1; full panel later)
- Craft Review monthly digest (Friday standup carries it)

### Phase 0 exit criteria
- Telemetry events flowing ≥5k/day; cost-per-task baseline established
- Heartbeat dashboard rendering all v1 metrics
- Audit log verifiable via hash chain; RLS CI green
- 36 shipped modules bucketed Hot/Warm/Cold/Dead
- Threshold registry has schema; Beta-LCB dormant until N≥50 (red-team fix)

---

## 5. Phases 1-4

### Phase 1 — ROI Integrations (W4-W10)
- **6.3 BigCommerce** (write-back path is gating: PDP copy, meta, schema markup) — *blocked on M04*
- **6.11 Windward ERP** (real inventory + sales velocity) — *blocked on M03/M10*
- **Review platform** (Yotpo or equivalent) + PDP widget — unblocked
- **GMC feed health monitor** — *blocked on M05*
- **Public AI Consultant embed (6.10)** — UN-DEFERRED per ecom lead; biggest single CVR lever for high-consideration lighting. Internal-only first (Phase 1), public surface in Phase 2 after eval.

**Deferred from Phase 1:** GA4 (6.1), GSC (6.2), Klaviyo (6.4) — revisit when revenue case from Phase 0 telemetry is concrete.

### Phase 2 — Inline Retrieval + Ecom Surfaces (W6-W12)
**Stack:** pgvector + per-source chunking + hybrid search (FTS + vector + RRF) + cross-encoder reranker + mandatory citations + per-source ACL (`tenant_id`, `vendor_id`, `sensitivity`).

**Internal surfaces:** Quote (similar past quotes sidecar) · Pipeline (stale-deal context) · Knowledge Hub (grounded answers).

**Ecom surfaces:** PDP copy gen · Meta description gen · Schema markup gen · FAQ gen · Alt-text gen.

**Eval:** 150-pair golden set (started W3, Michael 20/wk review). **Red-team fix:** monthly auto-rebuild of eval set from real failed queries — not curated by author.

**Public AI Consultant** opens here (Phase 2) on PDP/category pages once internal eval ≥80%.

### Phase 3 — 8 Named Automations on Dynamic Ladder (W9-W16)
| ID | Automation | Owner | Est. Δ-ROI driver |
|---|---|---|---|
| A1 | PO drafts (top-50 fast-movers) | Patrick | hours saved + cost variance |
| A2 | Follow-up drafts (stale deals) | Paul | revenue (delayed attribution 60d) |
| A3 | Auto call-note logging | Sales | 10-15h/wk saved |
| A4 | Abandoned cart email drafts (Klaviyo) | Patrick | recovered revenue |
| A5 | PDP rewrite drafts (low-CVR SKUs) | Patrick | conversion lift |
| A6 | GMC disapproval auto-fix drafts | Patrick | shopping-spend recovery |
| A7 | Bundle/cross-sell drafts | Patrick | AOV |
| A8 | Negative-keyword drafts (paid search) | Patrick | wasted-spend recovery |

**Promotion ladder:** Shadow → Draft → Auto-with-approval → Auto.
**Promotion math:** Beta(2+accepts, 2+rejects) lower 80% credible bound ≥ moving target percentile across portfolio. Step size capped ±0.10 per round; tightens fast (1 round), loosens slow (3-round confirmation).
**Counterfactual:** 10% holdout in shadow even after promotion; freeze threshold if shadow accept-rate diverges >15pp.
**Auto-execute allowlist:** tag, status-flip, internal note, draft-save, regenerate report. **Never:** external send, BC mutation (without click), pricing change, comp/scores writes, cross-tenant read.

**Red-team handoff contracts (double-count fixes):**
- A5 PDP rewrite drafts ↔ Phase 2 PDP copy gen → ONE generator, two trigger paths (manual + scheduled).
- A6 GMC fix drafts ↔ Phase 1 GMC monitor → monitor emits alert; A6 subscribes to alert; ΔROI credited to A6 only.

### Phase 4 — Continuous Ralph + Quarterly Kill (W17+)
- Per-module 3-iter Ralph loop (proven on internal-meetings).
- **Quarterly kill review:** Cold/Dead bucket >30d → hidden via Module Modes. ΔROI < $0 for 14d AND ≥30 fires → demote default → shadow. ΔROI < 0 for another 14d → killed.
- **Health gate:** WAU/MAU ≥0.5 across top 10 modules. <0.4 for 2 weeks = freeze new module work; fix existing.

---

## 6. Threshold Score Matrix (v2)

22 dimensions; honest including failure dimensions.

| Pass | Partial | Fail | Total |
|---|---|---|---|
| 18 / 22 (82%) | 3 / 22 | 1 / 22 | 22 |

**Honest score: 87%** (partials count half).

**Remaining gaps:**
- ❌ Adoption baseline (cleared by Phase 0.1 itself — accepted)
- ⚠ Phase 1 100% creds-blocked → contingency: BC live work parallels W1-W3 if M04 lands; otherwise Phase 2 ecom surfaces lead.
- ⚠ A5/A6 double-count → resolved via handoff contracts above.
- ⚠ Personal/business data wall via JWT aud only; second Supabase project is Phase 4.

**Threshold rule (BUILD_INTELLIGENCE #89):** >95% honest score = matrix too narrow. 87% with named gaps is the right place to start.

---

## 7. Week-by-Week Schedule (W1-W16)

| Wk | Track A | Track B (parallel) | Blockers | Δ-ROI proof |
|----|---------|--------------------|----------|-------------|
| W1 | 0.1 telemetry · 0.5 audit_log+RLS · 0.6 migration runner | 0.8 first-run checklist · 0.9 Friday demo cadence | none | First events flowing; tamper-evident log; W1 demo recorded |
| W2 | 0.2 AI Gateway (cost + caching + tiering) | 0.6 bundler+types+Playwright | 0.1 done | $/task graph live; cache ≥30% hit |
| W3 | 0.4 Heartbeat v1 (6 metrics) | 0.5 JWT aud · eval set authoring starts (background) | 0.1, 0.2 | Single-pane dashboard renders |
| W4 | **REVIEW GATE 1** · 0.3 threshold service · 0.10 persona scaffold | 0.7 Cmd-K v1 · 0.11 late/short/damaged board · 0.12 thumbs hook | 0.4 | Per-persona views render; thumbs flowing |
| W5 | Phase 2: pgvector + chunking + ACL | Review platform integration | 0.3, 0.5 | Vectors indexed; first hybrid query returns |
| W6 | Phase 2: hybrid search + reranker | 150-pair eval set authoring 50% done | W5 | Reranker beats baseline ≥15% on eval |
| W7 | Phase 2 internal surfaces (Quote · Pipeline · Knowledge Hub) | GMC monitor *(if M05)* | W6 | RAG cites in Quote tool |
| W8 | 6.3 BC *(needs M04)* + Phase 2 ecom (PDP/meta/schema) | A1 shadow launch | M04 | BC sync live; A1 logs decisions |
| W9 | 6.11 Windward *(needs M03/M10)* + alt-text + FAQ gen | A2-A3 shadow | M03/M10 | Windward parseable; 3 ecom gens shipped |
| W10 | 6.10 AI Consultant embed (internal) | A1 shadow→draft promotion (Beta-LCB) | W8 stable | First public-surface AI internal; A1 drafts live |
| W11 | A4-A6 shadow + GMC monitor finish | Eval set rerun · cost regression | M05 | Auto-decision rate ≥1/day |
| W12 | **REVIEW GATE 2** · A2-A4 → draft | A5 PDP rewrite + A6 GMC fix (with handoff contract) | W11 | A1 promoted to auto on 1 sub-flow |
| W13 | A7-A8 shadow · Public Consultant goes live (PDP/category) | Klaviyo *(M09)* if creds in | M09 optional | Public AI live; abandoned-cart flow active |
| W14 | A2-A4 → auto · A5-A8 → draft | GA4 *(M06)*; per-persona dashboards refined | M06 optional | 4 automations in draft state |
| W15 | A5-A8 → auto promotions; threshold loop running | Onboarding polish · Cmd-K coverage to 80% | KPIs | 3+ automations in auto |
| W16 | **End-to-end live state**: ladder running, dashboard green, ΔROI ledger published | Phase 4 Ralph kickoff | all | First Friday demo of system running unattended |

### W4 Gate (must show)
- Telemetry ≥5k events/day · cost-per-task baseline · heartbeat rendering · audit log verifiable · RLS CI green.
- **Replan trigger:** any not green → freeze Phase 2 start, fix foundation.

### W12 Gate (must show)
- ≥1 automation promoted shadow→draft→auto with Beta-LCB evidence · RAG eval ≥80% · cost flat or down vs W4.
- **Replan trigger:** auto-promotion blocked OR eval <70% → defer A5-A8, extend Phase 2 by 2 weeks, push live to W18.

### Top scheduling risk
**150-pair eval set authoring** could underestimate Michael's 6h commitment. **Contingency:** agent drafts 100 pairs from existing tickets/quotes in W3; Michael reviews 20/wk. Hard-gate W7 surfaces on eval pass.

**Secondary:** bundler migration breaks 36 modules. Keep old path behind flag through W4; cutover only after Playwright green for 1 week.

---

## 8. Killed / Deferred (with re-trigger)

| Item | Status | Re-trigger |
|---|---|---|
| External Trade Designer portal | Deferred | Internal WAU/MAU >0.5 across top 10 + designer demand |
| Vendor Rep portal | Deferred | Same |
| Customer-facing quote pipeline (external) | Deferred | After A2 default-on for 90 days |
| GA4 (6.1), GSC (6.2), Klaviyo (6.4) | Deferred to W13-14 optional | Revenue case from Phase 0 telemetry |
| Google/Meta Ads (6.12) | Killed | API access not granted |
| L4/L5 autonomy beyond A1-A8 | Killed | After A1-A8 at default-on 90d |
| Sharpness Score 5-dim engine | Deferred to Phase 2 | Eval set established |
| Loom-per-module library | Reactive only | When a module gets asked about twice |
| AI-off Fridays | Killed | Edit-distance telemetry covers it |

---

## 9. Decisions Log

This section is **append-only**. Every meaningful change to vision, plan, scope, or threshold gets a dated entry.

### 2026-05-07 — v1.0 — Initial roadmap
- 7-stakeholder roleplay (Owner, CTO, CFO, Sales+Ops, Security, AI/ML, Adoption+Skeptic).
- Phase 0 promoted from Phase D; Phase E external portals deferred; RAG demoted to inline plumbing; L1-L5 ladder replaced with 3 named automations.
- Score: 73% honest. Committed `5addb12`.

### 2026-05-07 — v2.0 — Round 2 + 3 optimization
**Round 2** (5 agents: heartbeat architect, ΔROI architect, control-loop engineer, ecom growth lead, EX/empowerment).
- Replaced single north-star with **multi-tier heartbeat** (~15 metrics, 6 in v1).
- Designed **ΔROI as system-wide principle** — `automation_events` schema with attribution methods, holdout counterfactuals, anti-gaming guards.
- Designed **dynamic threshold loop** — Bayesian Beta-LCB with min-N gate, EMA smoothing, asymmetric tightening, owner override semantics.
- Un-deferred public AI Consultant embed (Patrick's call: biggest CVR lever for high-consideration lighting).
- Added 5 ecom-direct automations (A4-A8) + 5 ecom RAG surfaces.
- Added Sharpness Score, explain-mode, Cmd-K, onboarding-as-code from EX agent.

**Round 3** (3 agents: red team, sequencer, Occam).
- **Red team** flagged: threshold death spiral (fixed: min-N gate before Beta-LCB trusted), heartbeat-as-wallpaper (fixed: alert lane for breaches), citation theater (fixed: monthly auto-rebuild from real failed queries), speed↔explain contradiction (fixed: per-surface pedagogical-vs-productive choice), A5↔P2 + A6↔P1 double-counts (fixed: handoff contracts).
- **Sequencer** produced W1-W16 schedule with W4 + W12 review gates and replan triggers.
- **Occam** collapsed Phase 0 from 26 items to 12 via 5 merges (automation_events spine, AI Gateway, Threshold service, Security gate CI, Dev platform). Deferred Sharpness Score / AI-off Fridays / Craft Review / Loom library / full explain-mode panels.

**Score:** 87% honest (up from 73%). At threshold to start Phase 0 execution.

### [next entry placeholder]
- Date · version · trigger · changes · score delta.

---

## 10. Execution kickoff

Plan is **at threshold to begin Phase 0**. On Owner go-signal:
1. Branch off `main` for each Phase 0 item (12 small PRs, not one big one).
2. Track progress on this file's Decisions Log + BUILD_PLAN_CLAUDE Track 7+ entries.
3. W4 review gate non-negotiable — no Phase 1 work starts until 0.1, 0.2, 0.4, 0.5 are green.

Owner question that gates execution: **"Which of A1-A8 are you willing to kill in 90 days if delta-ROI is flat, and who pulls the trigger?"** (Red-team #7.) Answer required before W12 gate.
