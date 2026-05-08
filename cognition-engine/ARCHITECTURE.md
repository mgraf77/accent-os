# Organizational Cognition Engine — Architecture v1
> AccentOS Evolution | Author: Claude Code | Date: 2026-05-08
> Branch: `claude/cognition-engine-architecture-Czqa7`

---

## 1. HONEST BASELINE

Before any architecture, the truth about where AccentOS stands today.

AccentOS is a **data read-write-display system with deterministic intelligence overlays.** That is a compliment, not a criticism — it is operationally grounded, ships real business value, and has 30+ modules covering the full business. Most "AI OS" projects don't even get here.

But calling it an Organizational Cognition Engine today would be dishonest. The gap is specific:

| What it IS | What an OCE requires |
|---|---|
| Pull-on-demand data display | Event-driven state propagation |
| Point-in-time snapshots | Temporal awareness (what changed, when, why) |
| Deterministic compute over globals | Hybrid deterministic + probabilistic reasoning |
| Flat Supabase tables | Memory hierarchy (working → episodic → semantic → procedural) |
| Ad-hoc `fetch` calls to Claude | Orchestrated AI with retrieval + context management |
| Keyword search | Semantic search (vector similarity) |
| Module isolation | Unified entity graph (entities relate across modules) |
| No event log | System-wide event stream |
| No action layer | Governed action execution with approval gates |

The path from here to there is not a rewrite. It is a series of layered additions to the existing foundation.

---

## 2. SYSTEM PHILOSOPHY

Three principles govern every architecture decision:

**1. Reliability beats intelligence.**
A system that answers correctly 80% of the time and fails gracefully 20% is worth 10x more than one that answers brilliantly 50% and fails opaquely 50%. Every AI feature must have a deterministic fallback.

**2. State is the product.**
Prompts are thin wires. The ontology, memory, and event log are the actual product. If the system state disappears, the intelligence disappears with it. Build state first.

**3. Entropy is the enemy.**
The system must actively resist becoming harder to understand over time. Every added capability either follows established patterns or updates those patterns — it never creates an isolated exception.

---

## 3. ARCHITECTURE LAYERS

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 5 — GOVERNANCE & AUDIT                                   │
│  Action approval gates · Role-based execution · Audit trail     │
│  Change governance · Schema contracts · Rollback registry       │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 4 — ACTION EXECUTION                                     │
│  Pending actions queue · Draft generator · External triggers    │
│  Email scaffolds · Claim submissions · Alert escalations        │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 3 — AI ORCHESTRATION                                     │
│  Intent router · Context retriever · Response synthesizer       │
│  Validator · Memory writer · Confidence threshold gate          │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 2 — MEMORY SYSTEM                                        │
│  Working memory (session) · Episodic (events log)               │
│  Semantic (vector embeddings) · Procedural (proven patterns)    │
│  Strategic (goals + OKRs) · Governance (policies + rules)       │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 1 — DATA FOUNDATION                                      │
│  Unified entity registry · Temporal versioning                  │
│  Event stream · Ontology graph · Supabase persistence           │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 0 — DATA SOURCES                                         │
│  Windward ERP · BigCommerce · GA4/GMC/GSC · Gmail/Calendar      │
│  Klaviyo · Clover · Manual input · External web data            │
└─────────────────────────────────────────────────────────────────┘
```

The current AccentOS operates primarily at Layer 0–1. Layers 2–5 are the evolution path.

---

## 4. LAYER 0 — DATA SOURCES

### Current
- Windward ERP: blocked (S5WebAPI auth); CSV import is the current path
- BigCommerce: REST API available; not yet connected
- GA4/GMC/GSC: free APIs; not yet connected
- Gmail/Calendar: MCP connected
- Manual input: 30+ CRUD modules cover this well

### Evolution
The data source layer does not change architecturally — it gets more connectors. The key shift is that connectors **emit events** rather than bulk-updating globals:

```
Windward order → system_events (entity_type: 'customer', event_type: 'order_placed', payload: {...})
score change → system_events (entity_type: 'vendor', event_type: 'score_updated', payload: {...})
```

This event emission is the foundation of temporal awareness.

---

## 5. LAYER 1 — DATA FOUNDATION

### 5.1 Unified Entity Registry

Every entity type in AccentOS has a canonical identity. Today, vendor identity is `vendor_id` (TEXT), customer identity is a UUID, employee identity is a UUID — but there is no cross-entity graph. A vendor contact and a trade partner may be the same person; there is no way to know.

The Entity Registry is not a new database. It is a **canonical identity mapping** that lives as:
- A set of conventions (entity_type + entity_id form every foreign key)
- A `entities` table for cross-module lookups
- A `entity_relationships` table for the graph

```sql
entities (
  id          UUID PRIMARY KEY,
  type        TEXT NOT NULL,  -- 'vendor' | 'customer' | 'employee' | 'product' | etc.
  external_id TEXT,           -- e.g., windward_id, sku
  display_name TEXT,
  created_at  TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
)

entity_relationships (
  from_entity UUID REFERENCES entities,
  to_entity   UUID REFERENCES entities,
  rel_type    TEXT,  -- 'owns' | 'employs' | 'supplies' | 'represents' | 'competes_with'
  metadata    JSONB,
  effective_at TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ
)
```

### 5.2 Temporal Versioning

The current schema has `updated_at` on most tables but no history. This means:
- You cannot answer "what was Minka Group's score 6 months ago?"
- You cannot see that deal value changed after a price negotiation
- You cannot track vendor tier changes over time

The fix is **append-only snapshot tables** for anything that changes meaningfully:

```sql
vendor_score_history (
  vendor_id       TEXT,
  category_key    TEXT,
  score           NUMERIC,
  changed_at      TIMESTAMPTZ,
  changed_by      TEXT,
  prior_score     NUMERIC
)
-- Current score: vendor_scores (upsert, single row)
-- History: vendor_score_history (append-only)
```

This pattern already exists partially (kpi_snapshots, pipeline_events, employee_scores).
It needs to be applied consistently across: vendor_scores, deals/stage changes, inventory prices, and customer segments.

### 5.3 System Event Stream

The `system_events` table is the central nervous system:

```sql
system_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ts          TIMESTAMPTZ DEFAULT NOW(),
  entity_type TEXT NOT NULL,
  entity_id   TEXT NOT NULL,
  event_type  TEXT NOT NULL,
  actor_type  TEXT,  -- 'user' | 'system' | 'ai' | 'import'
  actor_id    TEXT,
  payload     JSONB,
  session_id  TEXT
)
```

Every action in AccentOS writes to this table. This is how:
- Alerts know what changed
- Memory knows what happened
- Audit knows who did what
- The AI knows context without being told

---

## 6. LAYER 2 — MEMORY SYSTEM

See `MEMORY_SYSTEM.md` for full design. Summary:

| Memory Type | Storage | TTL | Purpose |
|---|---|---|---|
| Working | JS sessionStorage | Session | Current page context |
| Episodic | system_events | Indefinite | What happened |
| Semantic | pgvector (Supabase) | Indefinite | What things mean |
| Procedural | procedures table | Indefinite | How to do things |
| Strategic | goals + kpi_definitions | Version-controlled | Where we're going |
| Governance | policies table | Version-controlled | What is allowed |

---

## 7. LAYER 3 — AI ORCHESTRATION

### Current State (Honest)
Every AI feature is an independent `fetch` call to Claude. There is no shared context, no retrieval, no memory persistence. The AI starts cold for every request. This means:
- No learning from prior interactions
- No awareness of system state unless manually injected in the prompt
- Repeated context transmission (vendor data re-sent every call)
- No orchestration between features

### Target Architecture
Not a 7-layer agent hierarchy. For AccentOS, specifically:

```
User intent
    ↓
[ROUTER] — classify intent, select tool/path
    ↓
[RETRIEVER] — pull relevant memory/context from Supabase
    ↓
[SYNTHESIZER] — call Claude with context + tool results
    ↓
[VALIDATOR] — confidence check; deterministic fallback if below threshold
    ↓
[MEMORY WRITER] — persist new knowledge from this interaction
    ↓
Response / Action
```

These are **roles**, not separate services. Initially they are functions in a single `cognition.js` module. They become separate services only if load demands it.

### Prompt-as-wire, State-as-product
System state (vendor scores, active deals, customer segments, goals) must exist **in the database**, not in prompts. Prompts fetch relevant slices of state at call time. Prompts are never the authoritative source.

### Confidence Threshold Gate
Every AI response should carry a confidence signal. Below threshold → deterministic fallback displayed, AI response shown as suggestion only. This prevents hallucination from appearing authoritative.

---

## 8. LAYER 4 — ACTION EXECUTION

### Action Queue
Actions that AccentOS can draft or execute live in a pending queue with governance:

```sql
pending_actions (
  id            UUID PRIMARY KEY,
  created_at    TIMESTAMPTZ,
  action_type   TEXT,  -- 'email_draft' | 'coop_claim' | 'po_create' | 'alert_escalate'
  entity_type   TEXT,
  entity_id     TEXT,
  payload       JSONB,
  status        TEXT,  -- 'pending_review' | 'approved' | 'executed' | 'rejected'
  requires_role TEXT,
  reviewed_by   TEXT,
  reviewed_at   TIMESTAMPTZ,
  executed_at   TIMESTAMPTZ
)
```

### Automation Threshold Policy
Actions are gated by risk level:

| Risk Level | Examples | Gate |
|---|---|---|
| Low | Generate email draft | Auto-draft, user sends |
| Medium | Submit co-op claim | Draft + 1-click approve |
| High | PO creation, price change | Explicit approval + log |
| Critical | Delete records, send external comms | Double approval + audit |

---

## 9. LAYER 5 — GOVERNANCE & AUDIT

### Schema Governance
Every new table must:
- Include `created_at TIMESTAMPTZ DEFAULT NOW()`
- Be registered in the `entities` ontology if it represents an entity
- Have RLS policies before deployment
- Have a corresponding SQL migration file (M##)

### Action Governance
Every automated action must:
- Be queued in `pending_actions` before execution
- Have an explicit approver role
- Be logged in `audit_log` on execution
- Be reversible OR have a rollback record

### AI Output Governance
Every AI-generated output must:
- Display a confidence indicator
- Be labeled "AI-assisted" in the UI
- Not auto-write to production tables without human approval
- Log its source context for auditability

---

## 10. STATE MANAGEMENT

### Current Problem
AccentOS uses top-level `let VENDORS = []`, `let CUSTOMERS = []`, etc. These globals:
- Are loaded once per page session (stale mid-session)
- Have no change notification (other modules don't know when data updates)
- Create implicit coupling (anything can read/write to any global)

### Evolution Path
Phase 1: Document the full global registry. Know what exists.
Phase 2: Add a lightweight event bus — `window.emit('customers:updated', data)` — so modules can react without coupling.
Phase 3: Introduce a `MODULE_REGISTRY` (already identified in BUILD_INTELLIGENCE.md) that owns the global-to-module mapping.
Phase 4: Replace critical globals with reactive store objects (not a framework — just getter/setter wrappers that emit events on write).

This is not a full React/Redux migration. It is a progressive decoupling that the existing vanilla JS architecture can absorb without a rewrite.

---

## 11. OBSERVABILITY

### What to Measure
- **Operational:** module load times, API call latency, alert delivery rate
- **AI quality:** response confidence scores, user acceptance rate (did user accept the AI suggestion?), hallucination catches
- **Business:** KPI trend vs baseline, alert-to-action conversion, deal probability accuracy over time
- **System health:** event stream throughput, memory retrieval hit rate, action queue age

### Current State
`telemetry_events` table exists but nothing writes to it. This is the lowest-hanging observability fruit: instrument the existing `goTo()` function + modal open/close events to populate it.

### Minimum Viable Observability
1. `telemetry_events` write from: page navigation, module open, save actions, AI calls, alert interactions
2. Supabase Edge Function to compute daily telemetry summary → store in `kpi_snapshots`
3. System tab on Owner Dashboard shows telemetry summary

---

## 12. INFRASTRUCTURE CONSTRAINTS (LOCKED)

The following are not changing and the architecture must work within them:

| Decision | Why it's locked |
|---|---|
| Vanilla JS (no framework) | No build step, no dependencies, no terminal needed for iteration |
| Cloudflare Pages | Auto-deploy, ~15s, zero cost |
| Supabase PostgreSQL | Real data lives here; migration path from here is expensive |
| $0 added cost law | Every capability built internally unless impossible |
| Solo operator model | All automation must be auditable by one person |

### What This Means
- No separate vector database (pgvector is already in Supabase)
- No Kafka or Redis (Supabase Realtime fills the event notification role)
- No dedicated ML infrastructure (Anthropic API is the inference layer)
- No multi-region redundancy (single Supabase project is the reality)
- No separate agent servers (Cloudflare Workers are the execution layer)

---

## 13. SCALABILITY MODEL

AccentOS serves a ~10-person company with ~500 vendors and ~unknown customers. The scale constraints are:

- Supabase free tier: 500MB DB, 2GB bandwidth/mo — not a current constraint
- Anthropic API: cost scales with use; current use is low
- Cloudflare Pages: unlimited requests on free tier
- The architecture does not need to scale beyond 50 concurrent users for the foreseeable future

Scalability investments are **premature** at this stage. The right investment is correctness and maintainability, not horizontal scale.

---

## 14. HUMAN-AI COLLABORATION MODEL

### Where humans are irreplaceable
- Judgment calls on relationships (vendor negotiations, customer escalations)
- Strategic direction (which markets to enter, which vendors to exit)
- Creative work (marketing content, showroom design)
- Exception handling (anything unusual)
- Final approval on irreversible actions

### Where AI dominates
- Pattern recognition across large datasets (which vendors are declining?)
- Routine drafting (outreach emails, claim submissions)
- Synthesis across modules (why is this deal stalling? combine deal history + customer segment + quote age + communication recency)
- Anomaly detection (this vendor's score dropped 3 points — is that normal?)

### Where the system handles autonomously
- Alert generation (fully automated, no human needed to generate)
- Data enrichment (auto-populate fields from related records)
- Snapshot capture (daily KPI snapshots, score history)
- Event logging (every action automatically logged)

The human is always in the loop for: any external communication, any financial commitment, any record deletion.

---

## 15. ROLLBACK & RECOVERY

### Data Recovery
- All destructive operations must write the prior state to a `_deleted` or `_archive` table before execution
- Or use soft-delete: `archived_at TIMESTAMPTZ` pattern already present in some tables
- Supabase provides point-in-time recovery (PITR) at paid tiers; free tier has daily backups

### AI Decision Recovery
- Every AI-generated recommendation is stored in the action queue before user sees it
- If accepted and later found wrong, the action record shows: what was recommended, what context was used, what the outcome was
- This builds the feedback loop for model improvement

### Schema Recovery
- Every schema change is in a numbered SQL migration file
- Roll back = run the inverse SQL (documented in the migration file)
- New constraint: every migration file must include a commented-out `-- ROLLBACK:` section

---

*Next: See GAP_MATRIX.md for the dimensional comparison across current / bootstrapped / ideal / unlimited-budget targets.*
