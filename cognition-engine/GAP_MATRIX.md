# Gap Analysis Matrix — AccentOS → Organizational Cognition Engine
> Author: Claude Code | Date: 2026-05-08

---

## SCORING LEGEND

**Maturity Score** (0–5):
- 0 = Does not exist
- 1 = Concept documented, nothing built
- 2 = Partial/prototype exists
- 3 = Functional but incomplete
- 4 = Production-quality, some gaps
- 5 = Fully mature

**Risk Level**: 🔴 High | 🟡 Medium | 🟢 Low
**Leverage Score** (ROI per unit of effort, 1–10): 10 = highest leverage
**Notes**: Honest assessment of what the gap actually means operationally

---

## THE MATRIX

| Dimension | Current AccentOS | Bootstrapped Target | Unlimited Budget | Theoretical Ideal | Key Risk | Leverage |
|---|---|---|---|---|---|---|
| **Memory: Working** | 3 — JS globals, session-scoped | 4 — module registry + session store | 5 — Redis-backed distributed session | 5 — sub-10ms context hydration | 🟡 | 6 |
| **Memory: Episodic** | 1 — system_events table exists, nothing writes | 4 — all actions write events; queryable | 5 — real-time streaming + ML pipeline | 5 — temporal query over any period | 🔴 | 10 |
| **Memory: Semantic** | 1 — keyword search only | 4 — pgvector on articles/vendor notes | 5 — dedicated vector DB + fine-tuned embeddings | 5 — sub-second semantic search, 100K docs | 🔴 | 9 |
| **Memory: Procedural** | 2 — BUILD_INTELLIGENCE.md stores patterns manually | 4 — procedures table; AI retrieves before acting | 5 — auto-extracted from successful actions | 5 — self-updating with confidence decay | 🟡 | 8 |
| **Memory: Strategic** | 4 — goals + KPI registry built | 4 — same | 5 — auto-linked to operational metrics | 5 — goals cascade to daily actions automatically | 🟢 | 4 |
| **Orchestration** | 1 — isolated fetch calls, no coordination | 3 — router + retriever + synthesizer pattern | 5 — multi-agent with specialized models | 5 — dynamic agent selection + capability routing | 🔴 | 9 |
| **Governance** | 2 — role gating exists; no action approval layer | 4 — pending_actions queue + approval gates | 5 — policy engine + automated compliance | 5 — constitutional AI + formal verification | 🔴 | 9 |
| **Observability** | 1 — telemetry_events table empty | 3 — navigation + save + AI call telemetry | 5 — real-time dashboards + anomaly detection | 5 — full system observability + ML-powered insights | 🔴 | 8 |
| **Execution: Action Layer** | 2 — alerts exist; no draft/execute layer | 4 — pending_actions queue + draft generator | 5 — autonomous execution with human escalation | 5 — full agentic execution with rollback | 🔴 | 9 |
| **Reliability** | 3 — Supabase + Cloudflare is stable; no fallbacks in AI features | 4 — confidence gates + deterministic fallbacks | 5 — redundant systems + SLA guarantees | 5 — 99.99% uptime, zero data loss | 🟡 | 7 |
| **Ontology** | 2 — implicit; no canonical entity graph | 4 — entity registry + relationship table | 5 — formal ontology with automated validation | 5 — self-updating ontology with conflict detection | 🔴 | 10 |
| **Temporal Awareness** | 2 — created_at/updated_at exists; no versioning | 4 — append-only history for key entities | 5 — bi-temporal model on all tables | 5 — any-point-in-time reconstruction of system state | 🔴 | 9 |
| **Workflows** | 3 — CRUD workflows are mature; no multi-step automation | 4 — action queue enables multi-step flows | 5 — Make/n8n integration + event-driven triggers | 5 — self-designing workflows from intent | 🟡 | 7 |
| **AI Reasoning** | 2 — single-shot prompts; no chain-of-thought; no retrieval | 4 — retrieval-augmented; confidence-gated | 5 — chain-of-thought + self-consistency + RAG | 5 — multi-model deliberation + uncertainty quantification | 🟡 | 8 |
| **Scalability** | 3 — adequate for current load; no horizontal scale | 3 — same (not needed) | 5 — global distribution + auto-scaling | 5 — infinite scale | 🟢 | 1 |
| **Autonomy** | 2 — alerts generated automatically; no autonomous execution | 3 — draft + 1-click approve | 5 — supervised autonomy with exception escalation | 5 — constitutional autonomous execution | 🟡 | 8 |
| **Permissions** | 4 — 5-role system + data-roles sidebar gating | 4 — same + action-level permissions | 5 — attribute-based access control (ABAC) | 5 — dynamic policy engine | 🟢 | 3 |
| **Economics** | 5 — $30/mo total cost | 5 — same; target $0 AI cost increase | 3 — some premium tools justified | 1 — unlimited spend | 🟢 | — |
| **Infrastructure** | 4 — Cloudflare + Supabase is solid | 4 — same + Cloudflare Workers for actions | 5 — dedicated infra + private models | 5 — custom everything | 🟢 | 2 |
| **Knowledge Graph** | 1 — no graph; disconnected entity silos | 4 — entity_relationships table + query layer | 5 — graph database + traversal engine | 5 — self-constructing knowledge graph | 🔴 | 9 |
| **Anomaly Detection** | 2 — rule-based alerts (score dropped ≥3 pts) | 3 — more rules + threshold tuning | 5 — statistical process control + ML models | 5 — unsupervised anomaly detection | 🟡 | 7 |
| **Self-Optimization** | 3 — BUILD_INTELLIGENCE.md is manual meta-learning | 3 — feedback loop: user accept/reject → recalibrate | 5 — automated A/B testing + model recalibration | 5 — self-modifying with constitutional constraints | 🔴 | 6 |

---

## PRIORITY RANKINGS

Sorted by: (Gap from current to bootstrapped) × (Leverage Score)

| Priority | Dimension | Current → Target Gap | Leverage | Why |
|---|---|---|---|---|
| 1 | **Episodic Memory (Event Stream)** | 1→4 | 10 | Foundation for everything else — no events = no temporal reasoning, no learning, no AI context |
| 2 | **Ontology (Entity Registry)** | 2→4 | 10 | Cross-module intelligence is impossible without a canonical entity graph |
| 3 | **Governance (Action Layer)** | 2→4 | 9 | Without this, AI features remain suggestions only; with it, they become operational |
| 4 | **AI Orchestration** | 1→3 | 9 | Current isolated fetch calls waste context and repeat work |
| 5 | **Temporal Awareness** | 2→4 | 9 | Can't answer "what changed?" without this |
| 6 | **Knowledge Graph** | 1→4 | 9 | Vendor ↔ rep ↔ product ↔ customer connections unlock major intelligence |
| 7 | **Semantic Memory** | 1→4 | 9 | Search becomes a competitive moat when it works semantically |
| 8 | **Observability** | 1→3 | 8 | Can't improve what you can't measure |
| 9 | **AI Reasoning (RAG)** | 2→4 | 8 | Current prompts are context-blind; retrieval changes the quality ceiling |
| 10 | **Autonomy** | 2→3 | 8 | Draft-and-approve is the near-term value unlock |

---

## WHAT UNLIMITED BUDGET DOESN'T FIX

Honest analysis of where money doesn't help:

| Problem | Why money doesn't fix it |
|---|---|
| Ontology design | Requires deep understanding of how Accent Lighting actually works — can't buy that |
| Data quality | 306 unverified vendor scores — no amount of money substitutes for actual outreach |
| Procedural knowledge | The "how we negotiate with Visual Comfort" knowledge lives in people's heads |
| Trust in AI outputs | Users only trust AI when it's right consistently — takes time and iteration, not money |
| Windward integration | Blocked on an internal political problem (Curtis), not a technical one |

**The most expensive thing you can't buy is organizational context.** That's the actual moat.

---

## UNLIMITED BUDGET ANALYSIS — HONEST VERSION

If budget were unlimited, the highest-ROI investments (not the coolest):

1. **Full-time ML engineer** to own the embedding pipeline, model training, and retrieval optimization. Current Claude API approach is good for 2 years; training on Accent-specific data unlocks the next order of magnitude.

2. **BigCommerce + Windward real-time integration** via proper ETL pipeline (not Supabase Edge Functions). The data quality improvement from live sync vs. CSV import is significant.

3. **Statistical process control** on vendor scores, deal probability, and customer segments. This requires a data scientist, not more compute.

4. **Private model fine-tuned on AccentOS data** for the lighting domain specifically. The "AI Lighting Consultant" gets dramatically better when the model knows your specific 478 vendors, their products, and Accent's margin structure.

**What unlimited budget does NOT change:**
- The ontology must still be designed manually
- The governance layer must still reflect real business judgment
- The data quality problems require human outreach
- The architecture must still resist entropy

---

## BOOTSTRAPPED MATURITY TARGETS (6-MONTH HORIZON)

| Dimension | Start | 6-Month Target | How |
|---|---|---|---|
| Episodic Memory | 1 | 4 | Instrument all save/delete/AI call events into system_events |
| Ontology | 2 | 4 | Entity registry table + document relationships |
| Governance | 2 | 4 | pending_actions table + approval UI |
| Orchestration | 1 | 3 | cognition.js module: router + retriever + synthesizer |
| Temporal Awareness | 2 | 4 | History tables for vendor_scores + deals + customer_segments |
| Observability | 1 | 3 | Instrument goTo() + modal open/close; telemetry dashboard |
| Semantic Memory | 1 | 3 | pgvector on articles + vendor notes; upgrade knowledge hub search |
| Action Execution | 2 | 4 | Draft layer for email scaffolds + co-op claim submissions |

---

*Next: See ONTOLOGY.md for the canonical organizational ontology design.*
