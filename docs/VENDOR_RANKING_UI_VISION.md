# VENDOR_RANKING_UI_VISION.md
> AccentOS Foundational Architecture — v1.0 | 2026-05-14
>
> Vision document for the next phase of Vendor Ranking — transforming the current scoring tool into an executive intelligence surface and vendor relationship command center.

---

## Where We Are Now

The current Vendor Ranking module is a solid foundation:
- Vendors scored across configurable categories
- Parent/brand family grouping
- Tier assignment (auto + override)
- Score persistence, changelog, co-op tracker
- Daily Brief tiles for operational visibility

**What it is today:** A digital scorecard. A structured way to track and save vendor evaluations.

**What it needs to become:** An executive decision surface — a place where leadership reads the pulse of the vendor portfolio, acts on friction before it compounds, and enters negotiations with data-backed leverage.

---

## The Transformation

| Current | Vision |
|---|---|
| Scorecard grid | Executive intelligence dashboard |
| Category scores entered manually | Scores enriched by imported operational data |
| Tier shown as a badge | Tier with trend direction (improving / degrading / stable) |
| Changelog as a table | Timeline of significant relationship events |
| Co-op tracker as a tab | Co-op surfaced as a relationship health indicator |
| No AI surface | AI insight layer: risk signals, opportunity flags, anomaly callouts |
| Data in AccentOS only | Data grounded in Windward PO history + AccentOS overlays |

---

## 1. INFORMATION HIERARCHY

The Vendor Intelligence surface has three levels, each with its own use case:

### Level 1 — Portfolio View (Executive Scan)
The top-level Vendor Ranking page. Designed to be read in 60 seconds.

**Key questions answered at this level:**
- Which vendors are in the danger zone right now?
- Which vendors improved or degraded since last review?
- Where is money at risk (open POs, co-op balances)?
- Which vendors deserve attention this week?

**UI concepts:**
- **Health heat map / tier matrix** — vendors arranged in a 2×2 (performance × spend) or tiered grid. Color indicates health status, not just tier.
- **Change indicators** — every vendor row shows a trend arrow: ↑ improving, ↓ degrading, → stable. Based on score delta over trailing 60 days.
- **Risk flags** — icons surfaced inline: 🔴 fill rate below threshold, ⚠️ open PO past ETA, 💰 co-op deadline within 30 days, 🆕 new vendor (less than 90 days of history).
- **Spend concentration bar** — a visual showing what % of total vendor spend is concentrated in top 5 vendors. Instant portfolio risk read.
- **Search / filter strip** — filter by tier, rep, category score, risk flag. Fast access into portfolio segments.

### Level 2 — Vendor Profile (Relationship View)
The individual vendor detail, accessed from the portfolio. Designed to answer: "Everything I need to know before calling this vendor."

**Sections:**
1. **Header card** — vendor name, tier, overall score, rep contact, parent brand, YTD purchases, trend direction
2. **Score breakdown** — category scores with change arrows (vs. last review). Radar chart optional.
3. **Operational health** — live fill rate, average lead time, open PO count and value, return rate
4. **Co-op status** — available balance, earned balance, deadline dates, utilization rate
5. **Relationship timeline** — chronological log of: score changes, significant POs, co-op claims, rep notes, alerts triggered
6. **AI insight panel** — system-generated callouts (see Section 5)
7. **Negotiation leverage card** — (see Section 7)

### Level 3 — Scoring Workspace
The existing scoring input UI — where category scores are entered and notes added. Accessed from the vendor profile via "Edit Score" action. No redesign needed for Level 3 as a starting point.

---

## 2. KPI PRIORITIZATION

The following KPIs should be prominently surfaced in the Vendor Intelligence layer, in rough priority order:

### Tier A — Operational (data-driven, Windward-sourced)
| KPI | Definition | Source |
|---|---|---|
| Fill Rate | Lines received / lines ordered (trailing 90d) | PO snapshot |
| On-Time Rate | % of PO lines received by expected date | PO snapshot |
| Average Lead Time | Days from PO to receipt, median | PO snapshot |
| Open PO Value | Sum of outstanding PO line values | PO snapshot |
| Return Rate | Return/credit lines as % of received lines | Windward returns (future) |

### Tier B — Relationship (AccentOS-enriched)
| KPI | Definition | Source |
|---|---|---|
| Overall Score | Weighted category score | AccentOS |
| Score Trend | Score delta over trailing 60 days | AccentOS changelog |
| Tier Stability | # of tier changes in past 12 months | AccentOS changelog |
| Co-op Utilization | Claimed / earned balance | AccentOS co-op tracker |
| Days Since Last Review | Days since last score was saved | AccentOS timestamps |

### Tier C — Portfolio (derived)
| KPI | Definition | Source |
|---|---|---|
| Spend Share | This vendor's purchases / total purchases (trailing 12m) | Windward sales history |
| Vendor Concentration Risk | % of total spend in top 3 vendors | Derived |
| Portfolio Tier Distribution | % of spend in A / B / C vendors | Derived |

---

## 3. TREND AND CHANGE VISIBILITY

Change visibility is the most undervalued feature in vendor management tools. Teams routinely miss degrading relationships because the dashboard shows a current score with no context about direction.

### Design principles for change visibility:

**Score trend sparklines** — a tiny 8-point sparkline next to each vendor's overall score showing the trajectory over the past 6 review cycles. At a glance: is this relationship improving or degrading?

**"Since last review" delta badges** — on every category score, show the change: `+0.4` (green) or `-1.2` (red) vs. the previous review. No delta = grey.

**Fill rate trend** — a mini bar chart in the vendor profile showing fill rate per month for the trailing 6 months. Directional trend is more actionable than a single number.

**Tier change log** — surface tier changes prominently in the relationship timeline. "Upgraded from C → B on [date] by [user]" is a meaningful relationship event.

**Alert history** — show previously-triggered alerts in the timeline even after they're resolved. A vendor that had three fill rate alerts in one quarter tells a story that the current score might not.

---

## 4. AI INSIGHT SURFACES

The AI insight panel in the vendor profile (and optionally as a portfolio-level feed) provides system-generated callouts that a human reviewing the data might miss.

### Insight categories:

**Risk signals** — conditions that suggest deterioration:
- "Fill rate has declined for 3 consecutive months (94% → 89% → 81%)."
- "Average lead time increased 40% in the last 60 days compared to the prior 60."
- "2 open POs are past expected receipt date by more than 2 weeks."
- "No score review in 87 days — score may not reflect current relationship."

**Opportunity flags** — conditions that suggest leverage or upside:
- "Co-op balance of $3,200 expires in 28 days — unused balance will be forfeited."
- "Fill rate improved significantly in the last 60 days. Consider upgrading from C to B."
- "This vendor represents 38% of total spend but is rated Tier B — review whether terms reflect volume."

**Anomaly callouts** — unusual patterns worth attention:
- "Score dropped 1.8 points since the last review but no notes were added. Consider documenting the reason."
- "YTD purchases are 60% of prior year pace at this point in the calendar. Volume decline may warrant vendor conversation."
- "Two sister brands (Lights America, Usalight) are both Tier C while this brand is Tier A — are they managed independently?"

### AI insight technical approach (v1):
- Rule-based heuristics, not LLM inference
- Computed on vendor profile load from available data (scores, PO snapshot, co-op data, changelog)
- Each insight has a severity: `info` / `warning` / `action`
- Insights are not stored — they are derived fresh on render (no hallucination drift)
- Future v2: LLM-generated insights from the same data payload, with human review step

---

## 5. OPERATIONAL FRICTION INDICATORS

Beyond scores, the vendor profile should surface signals of operational friction — the kind that doesn't show up in a category score but erodes the relationship over time.

### Friction signals to surface:

| Signal | What It Indicates |
|---|---|
| Fill rate declining over 3+ months | Systemic supply or prioritization issue |
| Average lead time creeping up | Capacity or fulfillment process problem at vendor |
| Multiple POs past ETA | Chronic delivery reliability issue |
| Co-op claims consistently near deadline | Vendor co-op process is not proactively managed |
| No rep contact logged for 90+ days | Relationship maintenance gap |
| Score last reviewed >120 days ago | Score is likely stale and unreliable for decisions |
| Recurring partial shipments on same SKUs | Specific inventory shortage pattern |
| Return rate above 5% | Quality or pick accuracy issue |

Each friction signal maps to a recommended action type (conversation, escalation, review, audit).

---

## 6. NEGOTIATION LEVERAGE CONCEPTS

The "Negotiation Leverage Card" in the vendor profile assembles data points that are directly useful before a vendor call or contract renewal.

### Leverage card contents:

**Our position:**
- YTD spend (and vs. prior year)
- Trailing 12-month spend trend (growing / flat / declining)
- % of their likely revenue we represent (if known)
- Number of active SKUs in product mix

**Their performance:**
- Fill rate vs. industry benchmark (configurable, defaults to 95%)
- On-time rate
- Return rate
- Outstanding issues (open alerts, past-ETA POs)

**Relationship health:**
- Co-op commitments and utilization (are they honoring their commitments?)
- Tier history (have we historically been a good partner?)
- Years of relationship

**Talking points (auto-generated):**
- "Fill rate of 82% vs. our 95% target — ask for performance improvement plan or consider reallocation."
- "Co-op balance of $3,200 unredeemed — include in renewal conversation."
- "YTD spend up 22% vs. prior year — leverage volume growth for better terms."
- "Lead time increased 40% in last quarter — establish SLA in contract."

Talking points are heuristic-generated, not LLM. They appear as bullets the rep can use or discard.

---

## 7. VENDOR HEALTH CONCEPTS

"Vendor health" is a composite concept that the module should make legible. A vendor can have a high score but be in poor operational health — or vice versa.

### Health dimensions:

| Dimension | Components | Weight Concept |
|---|---|---|
| **Fulfillment health** | Fill rate + on-time rate + lead time consistency | High (40%) |
| **Relationship health** | Score trend + review recency + rep engagement | Medium (30%) |
| **Financial health** | Co-op utilization + terms compliance | Medium (20%) |
| **Quality health** | Return rate + known quality issues | Low (10%) |

### Health rating display:
- Composite health score rendered as: 🟢 Healthy / 🟡 Watch / 🔴 At Risk
- Not a replacement for the detailed score — it's a 3-second signal at the portfolio level
- Computed from operational data, not from manual category scores (manual scores are relationship assessment; health is operational status)

### Health vs. Tier distinction:
- **Tier** = strategic value classification (based on performance + relationship score)
- **Health** = current operational status (based on recent data signals)

A vendor can be Tier A (historically great) but show Red health (currently struggling). That is actionable — it's a recovery conversation, not a tier demotion. The UI should surface this distinction explicitly.

---

## 8. EXECUTIVE INTELLIGENCE LAYER — PORTFOLIO-LEVEL SURFACES

Beyond individual vendor profiles, the portfolio view needs to answer questions that executives ask:

### Portfolio questions and the UI surfaces that answer them:

| Executive Question | Surface |
|---|---|
| "Which vendors are we most exposed to right now?" | Spend concentration + open PO value + health flags combined |
| "Where are we leaving money on the table?" | Co-op expiring, underutilized balances, growth opportunities |
| "Which vendor relationships are improving vs. declining?" | Score trend matrix — vendors sorted by trend direction |
| "Are we buying from the right vendors?" | Tier distribution by spend: ideally most spend in Tier A |
| "What vendor conversations do I need to have this week?" | AI-generated action queue: vendors with unresolved alerts, review overdue, or active risk signals |
| "How has our vendor portfolio changed year-over-year?" | YoY spend by tier, new vs. exited vendors, tier migration summary |

---

## 9. PHASED IMPLEMENTATION ROADMAP

### Phase 1 — Operational Data Foundation (prerequisite)
- Windward PO export → Cowork → Supabase `purchase_orders` + `po_lines`
- Fill rate and lead time computed from PO data
- Fill rate surfaced as a vendor score input, replacing or supplementing manual entry
- Staleness indicators on vendor profiles when PO data is stale

### Phase 2 — Portfolio View Upgrade
- Trend arrows on vendor list (score delta vs. prior review)
- Risk flags inline (fill rate, co-op deadline, open PO age)
- Spend share derived from sales history snapshot
- Health rating (🟢/🟡/🔴) on portfolio cards

### Phase 3 — Vendor Profile Intelligence
- AI insight panel (rule-based v1)
- Operational friction indicators
- Negotiation leverage card
- Relationship timeline (combining changelog + alerts + notes)

### Phase 4 — Executive Layer
- Portfolio-level executive view
- Spend concentration visualization
- Action queue (AI-generated weekly priorities)
- YoY comparison surfaces

### Phase 5 — AI Insights v2 (future)
- LLM-generated insights from vendor data payload
- Natural language vendor summaries
- Anomaly explanation in plain English

---

## REVISION HISTORY

| Version | Date | Author | Notes |
|---|---|---|---|
| 1.0 | 2026-05-14 | Claude (architecture session) | Initial vision — OPERATIONAL_DATA_ARCHITECTURE_V1 |
