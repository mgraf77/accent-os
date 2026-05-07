# AccentOS — Long-Term Vision Plan & Build Roadmap

> **Living document.** Real-time log of vision, plan, and execution state.
> Every meaningful change appends to the **Decisions Log** at the bottom.
> Synthesized from 4 rounds of multi-stakeholder roleplay (17 agent personas total).

**Document version:** v3.0 (round-4 synthesis)
**Last updated:** 2026-05-07
**Status:** ✅ At threshold — ready to start Phase 0 execution
**Threshold score:** 91% (honest matrix, see §6)
**Compounding leverage score:** 8.0 / 10 (after round-4 missing-loops added; was 6.2)

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
9. **AI honesty for customers** *(round-4, customer voice)* — every customer-facing AI surface is labeled ("Drafted with AI, reviewed by [name]"). AI is allowed to say "I don't know" and warm-handoff to a human. No fake signatures, no synthetic personalization. One-click opt-out separate from marketing opt-out.
10. **Compounding > linear** *(round-4, leverage analyst)* — protect the rejection→eval→retrieval loop above all else. Anti-compounding traps (per-item human review, manual threshold tuning, hand-curated evals) flip to sampled / auto-grown patterns by default.
11. **Owner-time discipline** *(round-4, owner-time auditor)* — Michael caps at 5h/wk on AccentOS. Agent drafts → Michael edits. Office-hours pattern (Tue 7-8a + Fri 4-4:30p) for sync items only. Everything else batched async.

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
- **Customer (Sarah voice, round-4):** **My Lighting Plan** (every fixture per room + install status + bulbs/dimmers needed) · **Reorder + Warranty** (one-click matching bulbs years later — the Amazon moat) · **My Rep, Real Availability** (named human, real free/busy) · Order status + ETA · Compatibility check status (dimmer/driver/bulb)

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
- **Compatibility Checker (NEW, round-4 customer voice)** — dimmer / driver / bulb compatibility validator. Sarah's #1 unmet need; bigger moat than upsell bundler. Pure-compute over INVENTORY metadata once spec fields exist. Phase 1 internal tool, Phase 2 customer-facing.

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
| A4 | Abandoned cart email drafts (Klaviyo) — **REDESIGNED v3.0**: cap 1 plain-text email max, AI-labeled, from real address; kill if unsubscribe rate >2% | Patrick | recovered revenue |
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

## 6. Threshold Score Matrix (v3)

26 dimensions (added: customer trust, compounding loops, owner-time fit, retrofit plan).

| Pass | Partial | Fail | Total |
|---|---|---|---|
| 22 / 26 (85%) | 3 / 26 | 1 / 26 | 26 |

**Honest score: 91%** (partials count half).

**Remaining gaps:**
- ❌ Adoption baseline (cleared by Phase 0.1 itself — accepted)
- ⚠ Phase 1 100% creds-blocked → contingency: BC live work parallels W1-W3 if M04 lands; otherwise Phase 2 ecom surfaces lead.
- ⚠ Personal/business data wall via JWT aud only; second Supabase project is Phase 4.
- ⚠ Cross-tenant network effects absent (single-tenant by design, intentional v1).

**Threshold rule (BUILD_INTELLIGENCE #89):** >95% honest score = matrix too narrow. Holding at 91% with named gaps; further rounds risk goalpost-moving.

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
- **NEW v3.0 (pre-mortem distillation):** Has *anything* been killed yet? Zero kills = no honest measurement = automatic Replan.

### Pre-Mortem Early-Warning Signals (round-4)
Three signals separate best-case from worst-case path:
- **W4 signal:** Δ-ROI ledger populated with real baselines for ≥3 manual workflows? (Worst-case: empty/synthetic.)
- **W8 signal:** Heartbeat uptime ≥98% across all tiers? (Worst-case: gaps tolerated.)
- **W12 signal:** Has anything been killed yet? (Worst-case: zero kills.)

**Three new instrumentations** baked into Phase 0:
1. **Δ-ROI red flag** if any automation has no baseline by W4.
2. **Heartbeat-gap alarm** — >6hr silence on any tier pages a human.
3. **"Manual-workaround" tag** in Friday standup notes — auto-flagged when an employee describes bypassing an automation. Three flags = mandatory review.

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

## 9. Compounding Loops (round-4 leverage analyst)

**Plan-wide leverage score: 8.0 / 10** (was 6.2 before round 4 missing-loops added).

### Existing loops (protect)
| Loop | Input | Output | Latency to compound |
|---|---|---|---|
| **★ Rejection → eval set → retrieval tuning** *(THE keystone — protect above all)* | Human "reject" on AI draft | Hard-negative retrieval signal | ~2 weeks visible lift |
| Δ-ROI per automation → threshold auto-tune | Outcome ledger | Confidence cutoffs drift with reality | ~30 runs per automation |
| Heartbeat anomaly history → predictive alerting | Heartbeat misses + recovery time | Pre-failure warnings | ~6 weeks baseline |
| PROMPT_LOG + BUILD_INTELLIGENCE + efficiency-monitor (meta) | Every Claude session | Cheaper future sessions | Already compounding |
| vibe-speak feedback-log → mode calibration | applied/not-applied tags | Tighter persona fit per user | ~20 sessions per user |

### Missing loops to add (Phase 2-4)
| # | Loop | Phase | Win |
|---|---|---|---|
| L1 | **Closed quotes → vendor pricing intelligence → better next quote** | Phase 2 | Every won/lost quote fingerprints vendor cost vs final margin |
| L2 | **Customer-question corpus → FAQ + PDP rewrites → fewer questions** | Phase 2 | Inbound emails/SMS feed content layer |
| L3 | **Cross-employee task patterns → skill extraction** | Phase 3 | When 3 employees do the same manual sequence, auto-propose an automation |
| L4 | **Failed automation runs → root-cause clusters → preventive playbooks** | Phase 4 | Errors cluster into pattern → fix-template loops |
| L5 | **Persona × mode × task-success matrix** | Phase 4 | vibe-speak mode preference correlated to task completion quality |

### Anti-compounding traps to flip
- **Per-PDP human review** of AI rewrites scales O(SKUs) → confidence-sampled review (bottom 10% confidence + random 2%).
- **Manual threshold tuning** per automation × persona = 40 dials → must be auto-tuned from Δ-ROI.
- **Heartbeat dashboards humans read** → exception-only paging.
- **Hand-curated eval sets** → auto-grown from rejections.
- **Per-persona prompt edits** outside vibe-speak modes → leak; capture in modes.

---

## 10. 36-Module Retrofit Plan (round-4 retrofit architect)

**Total budget: 91 hours** across Phase 0 + Phase 2.

### Bucket triage
| Bucket | Modules | Per-module | Total | When |
|---|---|---|---|---|
| (A) Conforming, event-hook only | 8 (KPIs, Goals, Module Modes, Global Search, My Tasks, Reports Center, Alerts, Labels) | 15min | 2h | W3-W4 sweep |
| (B) Light retrofit (event emit + thumbs on AI surfaces) | 14 (Daily Brief, Pipeline, Quotes, CRM, Job Tracker, Inventory, POs, Trade Partners, Price Book, Deliveries, Warranty, Showroom, Calendar, Employee Scorecards) | 1.5h | 21h | W3-W4 |
| (C) Heavy retrofit (AI Gateway routing + dynamic thresholds + explain-mode) | 7 (Vendor Intelligence, Deal Optimizer, Decision Engine, Demand Forecast, AI Consultant, Marketing, Competitive Pricing) | 6h | 42h | W6-W9 interleaved |
| (D) Skip → defer to Phase 4 kill list | 7 lowest-traffic (Knowledge Hub + 6 TBD via heartbeat) | 0 | 0 | Decided W4 |

### Shared retrofit kit (ships Phase 0.1, 6 primitives, ~20h)
```
logEvent(action_id, {cost_cents, value_cents, persona, module})
aiCall(prompt, {tier, cache_key, kill_switch_id, explain})  // wraps AI Gateway
<thumbs-row event-id="..."></thumbs-row>                    // web component
<explain-link output-id="..."></explain-link>
threshold(key, default)                                      // dynamic threshold reader
registerCmdK({id, label, run, persona})
```
Per-module retrofit becomes 4-8 lines.

### First 5 pattern validators (W2)
1. **Daily Brief** — highest visibility, simplest event surface, proves dashboard read-path
2. **Quotes** — money-touching, validates `automation_events` value-tracking
3. **Pipeline** — exercises Cmd-K wiring (stage moves)
4. **Vendor Intelligence** — bucket-C token, forces Gateway + thumbs + explain-mode together
5. **Employee Scorecards** — proves heartbeat-from-existing-data with zero new persistence

### Cmd-K v1 — 10 actions (covers all 5 personas)
New Quote · Move Pipeline Stage · Add CRM Note · Create PO · Mark Job Milestone · Check Inventory · Open Daily Brief · Ask AI Consultant · Schedule Delivery · Run Global Search.

### Cutover ordering (must be sequenced, not gradual)
- Bundler cutover (Phase 0.6): ship retrofit kit as globals first, swap to ESM in one commit.
- AI Gateway switch: env-flag shim through W2, hard-cut W3.
- `automation_events` schema: lock shape before any module writes.
- Dynamic threshold table: must exist before any C-bucket retrofit.

### Semantic-drift defense
Per-module contract test: fixture harness fires every action, snapshots `automation_events` row, asserts shape (`action_id` enum, `cost_cents` int, `persona` enum, `module` slug). CI-gated. JSON-schema validation server-side as belt-and-suspenders.

---

## 11. Owner-Time Discipline (round-4 owner-time auditor)

**Cap: 5 hrs/week.** Plan as written had 3 overrun weeks (W1, W4, W8-W10). Mitigations baked in:

### Office Hours pattern
**Tue 7-8a + Fri 4-4:30p = 90 min/wk fixed sync window.** Agent queues all async items into one decision-doc; Michael clears in batch. Cuts context-switch tax ~40%.

### Offload matrix
| Task | Owner |
|---|---|
| Eval pair drafting | Agent (mines PROMPT_LOG + SESSION_LOG → 200 candidates) |
| Eval pair scoring/edit | Michael (~90 sec/pair = 3.75h, was 12-15h) |
| Threshold overrides | Agent proposes, Michael ratifies async |
| Friday demo prep | Agent generates Loom + bullet list; Michael watches + reacts (8 min) |
| Persona dashboard math | Agent |
| Persona dashboard interpretation | Michael (monthly, not weekly) |
| Employee win detection | Agent surfaces, Michael delivers recognition |
| Credential request packaging | Agent (single batched W1 form) |
| Architecture surprise triage | Michael (real-time only) |

### Cuts and adds
- **CUT:** Weekly persona-dashboard tuning → monthly (saves ~30 min/wk).
- **ADD:** Weekly 5-min "kill anything?" prompt in Friday slot — closes the silent-dud-feature gap.
- **SPREAD:** A1-A3 shadow reviews W7/W9/W11 (was W8-W10 cluster) to flatten Michael's spike.

---

## 12. Customer Trust Charter (round-4 customer voice / Sarah)

Non-negotiable rules for every customer-facing AI surface:

1. **Disclose AI** on every AI-generated touchpoint. "Drafted with AI, reviewed by [name]" is acceptable. Fake personal signatures are not.
2. **AI is allowed to say "I don't know"** and warm-handoff to a named human without making the customer re-type.
3. **Compatibility checker before upsell bundler** — Sarah's words: "this is where I screw up." Build the moat first.
4. **Photo + room mockup beats chatbot** — defer pure-chat surfaces; prioritize image-grounded interactions.
5. **Reorder + warranty tile** in customer panel = the Amazon moat.
6. **Cap A4 abandoned-cart at 1 plain-text email max.** From a real address, AI-labeled. Kill if unsubscribe rate >2%.
7. **One-click AI opt-out** separate from marketing opt-out.
8. **Show sources** for AI claims (dimensions, specs, compatibility). One hallucinated dimension destroys trust on a return-cost-$200+ category.
9. **No A/B-tested pricing** on logged-in customers.
10. **Designer-review-my-cart button** (human review for high-ticket carts) — differentiator vs Amazon.

---

## 13. Decisions Log

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

### 2026-05-07 — v3.0 — Round 4 optimization
**Round 4** (5 agents: customer voice / Sarah, retrofit architect, owner-time auditor, 12-month pre-mortem, compounding-leverage analyst).

**Owner pre-commitment baked in:** A1-A8 kill thresholds set. A8 + A4 most likely to die; A3 is keystone (Paul's #1 ask). Threshold service auto-flags via `v_kill_candidates`; Owner has 7-day veto window before automatic retirement.

**Customer trust charter (§12)** — Sarah flagged A4 abandoned cart needs major rework (capped to 1 plain-text email max, AI-labeled, real address). Compatibility checker (dimmer/driver/bulb) added to Phase 1 — bigger moat than upsell bundler. Customer control panel tiles redesigned per Sarah: My Lighting Plan, Reorder+Warranty (Amazon moat), My Rep real availability.

**Compounding loops (§9)** — leverage score 6.2 → 8.0 after adding 5 missing loops: closed-quotes→vendor-pricing-intel, customer-questions→FAQ/PDP, cross-employee-patterns→skill-extraction, failed-runs→playbook-clusters, persona×mode×task-success matrix. Keystone loop identified: rejection→eval→retrieval (protect above all). 5 anti-compounding traps flagged for sampled/auto-grown patterns.

**36-module retrofit (§10)** — 91-hour budget across Phase 0+2. Triaged into 4 buckets (8 conforming + 14 light + 7 heavy + 7 skip). 6 shared primitives ship in Phase 0.1; per-module retrofit becomes 4-8 lines. First 5 pattern validators chosen (Daily Brief, Quotes, Pipeline, Vendor Intelligence, Employee Scorecards). Cmd-K v1's 10 actions specified.

**Owner-time discipline (§11)** — Michael's 5h/wk cap protected via Office Hours pattern (Tue 7-8a + Fri 4-4:30p), agent-drafted/Michael-edited eval set (3.75h vs 12-15h), batched W1 credential form, monthly persona tuning (was weekly), A1-A3 shadow reviews spread W7/W9/W11.

**Pre-mortem signals** baked into schedule: W4 Δ-ROI baseline check, W8 heartbeat uptime ≥98% check, W12 "anything been killed?" check. Three new instrumentations: Δ-ROI red flag, heartbeat-gap alarm (>6hr silence pages human), manual-workaround tag in standups.

**Three new principles added** (#9-11): AI honesty for customers, compounding > linear, owner-time discipline.

**Score:** 91% honest (up from 87%). 26 dimensions (added: customer trust, compounding, owner-time fit, retrofit). Holding here — further rounds risk goalpost-moving per BUILD_INTELLIGENCE #89.

### [next entry placeholder]
- Date · version · trigger · changes · score delta.

---

## 14. Execution kickoff

Plan is **at threshold to begin Phase 0**. On Owner go-signal:
1. Branch off `main` for each Phase 0 item (12 small PRs, not one big one).
2. Track progress on this file's Decisions Log + BUILD_PLAN_CLAUDE Track 7+ entries.
3. W4 review gate non-negotiable — no Phase 1 work starts until 0.1, 0.2, 0.4, 0.5 are green.

Owner question that gates execution: **"Which of A1-A8 are you willing to kill in 90 days if delta-ROI is flat, and who pulls the trigger?"** (Red-team #7.) Answer required before W12 gate.
