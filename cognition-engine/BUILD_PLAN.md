# Bootstrapped Build Plan — AccentOS → Organizational Cognition Engine
> Author: Claude Code | Date: 2026-05-08
> Constraint: Solo operator, $0 added cost, AI-assisted development, no rewrites

---

## SEQUENCING PHILOSOPHY

Three rules govern the order of everything:

1. **Foundation before intelligence.** You cannot build semantic memory before you have an entity ontology. You cannot build AI orchestration before you have retrieval. Do not skip layers.

2. **Immediate operational value.** Every phase must ship something Michael can use today, not just infrastructure for later. Infrastructure without immediate use degrades — it's not maintained, not understood, not trusted.

3. **No sunk costs.** If a phase's approach turns out wrong, the next phase should be able to ignore it without carrying the baggage. Each phase is reversible.

---

## CURRENT STATUS CHECK (as of 2026-05-08)

Track 5 is complete (16/16 items shipped). Track 6 is in progress.

**Unblocked Track 6 items (buildable now):**
- 6.5 Trade & Designer Portal (external-facing)
- 6.6 Vendor Rep Portal (external-facing)
- 6.10 AccentOS → accentlightinginc.com embed

**Cognition Engine work begins AFTER Track 6 unblocked items,** or in parallel on a separate branch.

---

## PHASE 0 — INSTRUMENTATION (0–2 weeks)
*"See what's actually happening."*

**Goal:** Turn on the observability that already exists but is dark.

### 0.1 Activate the Event Stream
Wire `system_events` writes to the 5 most important triggers:

```javascript
// In sbFetch() — detect mutating operations and emit events
if (['POST', 'PATCH', 'DELETE'].includes(method)) {
  emitEvent(deriveEntityType(url), entityId, mapMethodToEventType(method), payload);
}
```

These 5 triggers cover the entire system immediately:
- All CRUD saves (POST/PATCH)
- All deletes
- Alert generation (in the alert engine)
- AI call invocations (in the AI fetch wrapper)
- Page navigation (in goTo())

**Deliverable:** system_events starts populating. Activity Feed module can show a live system-wide event stream.

**Time estimate:** 1 session (~4 hours)

### 0.2 Activate Telemetry
Wire the existing (empty) `telemetry_events` table:
- goTo() → emit navigation event
- openModal() → emit modal_open event
- AI feature invocations → emit ai_call events

**Deliverable:** Owner Dashboard System tab shows real usage data.

**Time estimate:** 0.5 session (~2 hours)

### 0.3 Daily KPI Auto-Snapshot
Currently requires owner to manually click "Snapshot today." Replace with:
- Supabase Edge Function scheduled daily at 8 AM CT
- Computes all 8 KPIs and inserts into kpi_snapshots
- No owner action required

**Deliverable:** 30-day KPI trend is always available without manual intervention.

**Time estimate:** 0.5 session (~2 hours)

---

## PHASE 1 — ONTOLOGY & TEMPORAL FOUNDATION (2–6 weeks)
*"Know what things are and what changed."*

**Goal:** Install the entity registry and temporal versioning on the entities that matter most.

### 1.1 Entity Registry Table
Create `entities` and `entity_relationships` tables (SQL migration M41).

Do NOT migrate all existing records immediately — that is a multi-week project. Instead:
- New entities from this point forward register automatically
- Existing entities register on first touch (lazy registration)

**Deliverable:** cross-entity links can be created and queried.

**Time estimate:** 1 session

### 1.2 Vendor Score History
Add `vendor_score_history` table. Wire history writes alongside existing vendor_score upserts.

**Deliverable:** "View score history" button on vendor detail shows trend over time. The Vendor Intelligence module can display score trajectory charts.

**Time estimate:** 1 session

### 1.3 Customer Segment History
Add `customer_segment_history` table. When RFM recomputes and changes a customer's segment, write to history.

**Deliverable:** Customer detail shows "moved from Active → Lapsed on [date]." Churn detection becomes possible.

**Time estimate:** 0.5 session

### 1.4 Deal Stage History Enhancement
`pipeline_events` already exists — extend it to include the complete deal state snapshot (not just stage transition). This enables reconstruction of deal state at any point in time.

**Deliverable:** Deal detail shows "what this deal looked like at each stage."

**Time estimate:** 0.5 session

### 1.5 Canonical Ontology Document → `ontology.json`
Convert `ONTOLOGY.md` to a machine-readable `ontology.json` that the codebase can import:

```json
{
  "entities": {
    "vendor": { "canonical_id_field": "vendor_id", "history_table": "vendor_score_history", ... },
    "customer": { "canonical_id_field": "id", "history_table": "customer_segment_history", ... }
  },
  "relationships": [
    { "from": "vendor", "to": "parent_company", "type": "belongs_to", "table": "vendor_parents" }
  ]
}
```

**Deliverable:** The codebase has a single source of truth for entity relationships. Global search, AI context assembly, and the event router all read from `ontology.json`.

**Time estimate:** 0.5 session

---

## PHASE 2 — UNIFIED SEARCH (4–8 weeks)
*"Find anything, meaningfully."*

**Goal:** Replace the current siloed keyword search with unified semantic search.

### 2.1 pgvector Setup
Enable pgvector in Supabase (one SQL command). Add `embedding vector(1536)` column to articles table.

**Time estimate:** 15 minutes

### 2.2 Article Embedding Pipeline
When articles are saved, compute and store embeddings via the Anthropic proxy worker:

```javascript
// In knowledge_hub.js — after article save
async function embedAndStoreArticle(articleId, text) {
  const embedding = await computeEmbedding(text);  // Anthropic API call
  await sbFetch(`articles?id=eq.${articleId}`, 'PATCH', { embedding });
}
```

**Time estimate:** 1 session (includes backfill of existing articles)

### 2.3 Vendor Notes Embedding
Same as 2.2 for vendor override notes. When notes are saved, embed them.

**Time estimate:** 0.5 session

### 2.4 Upgrade Global Search
Extend the existing global_search.js to include semantic search across articles and vendor notes:
- Keyword search: existing (fast, exact)
- Semantic search: new (slower, by meaning)
- Combined result: keywords first, semantic matches below a separator

**Time estimate:** 1 session

### 2.5 Knowledge Hub Search Upgrade
Replace the LIKE filter with vector similarity search. Show similarity score.

**Time estimate:** 0.5 session

---

## PHASE 3 — AI ORCHESTRATION LAYER (6–10 weeks)
*"Give the AI real context and a real job."*

**Goal:** Replace isolated fetch calls with a proper context-aware orchestration pattern.

### 3.1 `cognition.js` Module
Create `js/cognition.js` with the four-role pattern from AGENT_HIERARCHY.md:
- `route(intent)` — intent classification
- `retrieve(intentType, entityContext)` — context assembly
- `synthesize(intentType, context, query)` — Claude API call
- `validate(synthesis, context)` — quality gate

**Time estimate:** 1.5 sessions

### 3.2 Wire Knowledge Engine to Cognition Layer
Replace the current ad-hoc fetch in the Knowledge Engine's "Ask the Engine" tab with `cognition.route() → retrieve() → synthesize() → validate()`.

**Deliverable:** The AI now has access to: relevant vendor data, recent events, active goals, applicable articles, and procedural templates — not just the system prompt.

**Time estimate:** 1 session

### 3.3 Confidence Indicator UI
Add a confidence indicator to all AI responses: green dot (high confidence), yellow dot (medium), red dot (low confidence / AI uncertain). When confidence is low, the deterministic fallback is shown as primary.

**Time estimate:** 0.5 session

### 3.4 Episodic Context in AI
Wire the Retriever to pull the last 20 system_events for the current entity before every AI call. This gives the AI temporal awareness ("the last 4 changes to this vendor's score were all declines").

**Time estimate:** 0.5 session

---

## PHASE 4 — ACTION LAYER (8–12 weeks)
*"Move from suggestions to drafts."*

**Goal:** Give the AI the ability to produce approved-action drafts, not just answers.

### 4.1 `pending_actions` Table
Create SQL migration M42:
```sql
pending_actions (id, action_type, entity_type, entity_id, payload JSONB,
                 status, requires_role, reviewed_by, reviewed_at, executed_at)
```

**Time estimate:** 0.5 session

### 4.2 Action Queue UI
New "Action Queue" module (sidebar, Owner/Manager only):
- List of pending actions by status
- Per-action: preview, approve, reject
- Approved actions trigger their execution handler

**Time estimate:** 1.5 sessions

### 4.3 Email Draft Generation
First action type: vendor outreach email drafts.

When a vendor alert fires (score_dropped, tier_risk), the Alert detail modal shows a "Draft Response" button. Clicking it:
1. Calls the Cognition layer with intent: DRAFT_COMMUNICATION
2. Retriever pulls vendor data + recent events + rep contact + email procedure template
3. Synthesizer generates a draft
4. Validator checks policy compliance
5. Draft is queued to `pending_actions` (status: pending_review)
6. User sees "Draft queued for review" notification

**Time estimate:** 1.5 sessions

### 4.4 Co-op Claim Draft
Second action type: co-op claim submissions.

When a co-op alert fires (deadline approaching), generate a claim summary document:
- Fund details
- Supporting PO/invoice references
- Claim template formatted per vendor requirements (from Knowledge Hub articles)
- Queue for owner approval

**Time estimate:** 1 session

### 4.5 Procedural Memory Table
Create `procedures` table. Seed with the 5 most common action templates:
- Vendor outreach (score drop)
- Vendor outreach (co-op expiring)
- Customer re-engagement (segment = Lapsed)
- Rep check-in (vendor going C-tier)
- PO request (reorder_now demand forecast)

**Time estimate:** 1 session

---

## PHASE 5 — INTELLIGENCE LAYER (12–18 weeks)
*"The system learns from what works."*

**Goal:** Close the feedback loop so the system improves from usage.

### 5.1 AI Acceptance Tracking
Add "Was this helpful?" to AI responses: 👍 / 👎 / "I edited this significantly."
- Thumbs up → `ai_accepted` event
- Thumbs down → `ai_rejected` event
- "Edited significantly" → diff stored in system_events payload

**Time estimate:** 0.5 session

### 5.2 Procedure Effectiveness Tracking
When a pending_action is approved and a result is tracked (email was sent → deal progressed), link the outcome back to the procedure template used. Update `procedures.metadata.success_count`.

**Time estimate:** 1 session

### 5.3 Deal Probability Recalibration
The current 8-factor probability model uses heuristic weights. With enough won/lost deals in the pipeline, recalibrate the weights from real data. Write the recalibrated weights to `probability_model_log`.

**Time estimate:** 1 session (requires 20+ won/lost deals as training data)

### 5.4 Customer Segment Personalization
Use per-customer `order_freq_baseline_days` (already in schema) to personalize all customer-related alerts:
- Stale customer threshold = 1.5x their personal baseline (not a fixed 60 days)
- Quote stale threshold = 1.5x their historical quote-to-close time

**Time estimate:** 0.5 session

---

## PHASE 6 — INTEGRATION COMPLETIONS (ongoing)
*"Connect the remaining data sources."*

**Priority order:**
1. BigCommerce REST (Track 6.3) — product + order data, high business value
2. Google Analytics 4 (Track 6.1) — e-commerce performance
3. Windward S5WebAPI (Track 6.11) — the real deal, when unblocked
4. Klaviyo (Track 6.4) — email marketing performance

Each integration feeds the Event Stream, which feeds Memory, which improves AI context quality.

---

## WHAT THIS BUILDS TOWARD

After Phase 5, AccentOS can:

✅ **Know** — what is the state of every entity, what changed, and when
✅ **Search** — find anything by meaning, not just keyword
✅ **Reason** — AI has real context about the business, not blank-slate prompts
✅ **Draft** — generate approved-action candidates that humans review
✅ **Learn** — improve from feedback on what worked

The Organizational Cognition Engine is not a destination. It is a direction. After Phase 5, the next phase is defined by what is measurably the bottleneck — data quality, AI reasoning quality, or execution coverage.

---

## TIME ESTIMATES SUMMARY

| Phase | Duration | Sessions | Prerequisites |
|---|---|---|---|
| 0 — Instrumentation | 0–2 weeks | 2 | None |
| 1 — Ontology & Temporal | 2–6 weeks | 4 | Phase 0 |
| 2 — Unified Search | 4–8 weeks | 3 | Phase 1 (partial) |
| 3 — AI Orchestration | 6–10 weeks | 4 | Phase 1 + 2 |
| 4 — Action Layer | 8–12 weeks | 6 | Phase 3 |
| 5 — Intelligence | 12–18 weeks | 4 | Phase 4 + real usage data |
| 6 — Integrations | Ongoing | Variable | Phase 0 (event stream) |

**Total to Phase 5:** ~18 weeks / ~23 sessions (assumes 1-2 sessions/week)

This is the realistic timeline for a solo operator building in parallel with ongoing AccentOS operations. There is no shortcut to Phase 3 that doesn't compromise the foundation.

---

*Next: See ENTROPY_PREVENTION.md for the anti-entropy governance system.*
