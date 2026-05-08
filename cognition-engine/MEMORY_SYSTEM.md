# Memory System Design — AccentOS Organizational Cognition Engine
> Author: Claude Code | Date: 2026-05-08

---

## 1. WHY MEMORY MATTERS MORE THAN PROMPTS

The current state: every AI feature in AccentOS is a cold start. When the user asks the Knowledge Engine "which vendors should we push this quarter?", the system:
1. Has no memory of what was asked last week
2. Has no memory of what decisions were made from prior answers
3. Has no access to the deal pipeline, vendor scores, or co-op balances unless manually injected
4. Produces an answer that is contextually blind

A proper memory architecture changes this completely. The same question retrieves:
- Last 90 days of deal pipeline by vendor
- Current tier status and score trends
- Open co-op fund balances by vendor
- Prior answers to similar questions and their outcomes
- Strategic goals that inform which vendors to prioritize

The AI's answer quality is a direct function of memory quality. Prompts are the interface; memory is the intelligence.

---

## 2. SIX MEMORY TYPES

### 2.1 WORKING MEMORY
**What it is:** The context available to the current session.
**Duration:** Session (browser tab / Claude Code session)
**Current state:** JS global arrays (VENDORS, CUSTOMERS, DEALS, etc.) — loaded once at hydrate, stale during session

**Target design:**
```javascript
// Module registry with type metadata and refresh timestamps
const MEMORY = {
  working: {
    vendors:    { data: [], loadedAt: null, ttl: 30 * 60 * 1000 },  // 30 min TTL
    customers:  { data: [], loadedAt: null, ttl: 5 * 60 * 1000 },   // 5 min TTL
    deals:      { data: [], loadedAt: null, ttl: 2 * 60 * 1000 },   // 2 min TTL
    // ...
  },
  session: {
    userId: null,
    role: null,
    currentModule: null,
    recentEntities: [],   // last 20 entities visited (for context)
    pendingActions: [],   // actions queued but not yet reviewed
  }
}

function getFromMemory(key) {
  const record = MEMORY.working[key];
  const age = Date.now() - (record.loadedAt || 0);
  if (age > record.ttl) {
    // refresh from Supabase
    return sbLoad(key).then(data => { record.data = data; record.loadedAt = Date.now(); return data; });
  }
  return Promise.resolve(record.data);
}
```

**What this unlocks:**
- Cross-module context without re-fetching everything
- Stale-data detection ("this vendor score is 4 hours old — want to refresh?")
- Session-scoped state that AI features can read without manual injection

---

### 2.2 EPISODIC MEMORY
**What it is:** A record of what happened in the system — the event log.
**Duration:** Indefinite (append-only)
**Current state:** `system_events` table exists; nothing writes to it. `audit_log` and `pipeline_events` capture partial traces.

**Target design:**

```sql
-- Already defined in ARCHITECTURE.md; repeating schema here for completeness
system_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ts          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  entity_type TEXT NOT NULL,
  entity_id   TEXT NOT NULL,
  event_type  TEXT NOT NULL,
  actor_type  TEXT,     -- 'user' | 'system' | 'ai' | 'import'
  actor_id    TEXT,     -- user_id or 'system'
  payload     JSONB,    -- the delta or relevant state snapshot
  session_id  TEXT
)
```

**Event taxonomy:**

| Event Type | Entity Type | Trigger |
|---|---|---|
| `score_updated` | vendor | Score edit save |
| `tier_changed` | vendor | Automatic when score crosses cutoff |
| `stage_changed` | deal | Pipeline stage drag/click |
| `quote_created` | quote | New quote save |
| `quote_sent` | quote | Manual flag |
| `order_placed` | purchase_order | PO save with status=ordered |
| `inventory_received` | purchase_order | "Mark Received" button |
| `alert_generated` | alert | Alert engine run |
| `alert_actioned` | alert | User marks actioned |
| `ai_call` | (context entity) | Any AI feature invocation |
| `ai_accepted` | (context entity) | User accepted AI suggestion |
| `ai_rejected` | (context entity) | User rejected AI suggestion |
| `coop_deadline_approaching` | coop_fund | System-generated at 14d |
| `action_queued` | pending_action | AI drafts an action |
| `action_approved` | pending_action | User approves |
| `action_executed` | pending_action | System executes |
| `module_visited` | (module key) | Navigation event |

**Instrumentation approach (bootstrapped):**
Don't add event writes to every function manually. Instead:
1. Wrap `sbFetch` (the existing Supabase helper) to emit events for: POST/PATCH/DELETE operations
2. Wrap the AI call helper to emit `ai_call` events
3. Wire alert engine to emit `alert_generated` events
4. Add `alert_actioned` to the existing alert action handlers

This covers ~80% of meaningful events with changes to 3-4 core utilities.

**Query patterns the event log enables:**

```sql
-- What changed for a vendor in the last 90 days?
SELECT * FROM system_events
WHERE entity_type = 'vendor' AND entity_id = '42' AND ts > NOW() - INTERVAL '90 days'
ORDER BY ts DESC;

-- Which AI suggestions does the user actually accept? (training signal)
SELECT event_type, COUNT(*) FROM system_events
WHERE actor_type = 'ai' AND entity_type = 'pending_action'
GROUP BY event_type;  -- ratio of ai_accepted to ai_rejected

-- What modules does this user actually use? (personalization)
SELECT payload->>'module' as module, COUNT(*) FROM system_events
WHERE actor_id = $userId AND event_type = 'module_visited'
GROUP BY module ORDER BY count DESC;
```

---

### 2.3 SEMANTIC MEMORY
**What it is:** The ability to find relevant information by meaning, not just exact text.
**Duration:** Indefinite
**Current state:** No vector search. Knowledge Hub search is case-insensitive LIKE filter on title + tags. Vendor notes are unsearchable.

**Target design:**
Use pgvector (already available in Supabase) to add semantic search to:
1. Knowledge articles (body + title)
2. Vendor notes and override text
3. Vendor scoring justifications
4. Meeting transcript summaries
5. Customer interaction notes

```sql
-- Enable pgvector (one-time)
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to articles
ALTER TABLE articles ADD COLUMN embedding vector(1536);

-- Index for fast similarity search
CREATE INDEX ON articles USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

**Embedding pipeline:**

```javascript
// cognition.js — semantic memory utilities
async function embedText(text) {
  // Use Claude's text-embedding-3-small via API, or reuse the Anthropic proxy
  // Store result in the entity's embedding column
}

async function semanticSearch(query, options = {}) {
  const { entityTypes = ['article'], limit = 10, threshold = 0.7 } = options;
  const queryEmbedding = await embedText(query);
  // Supabase RPC: SELECT id, title, 1 - (embedding <=> $queryEmbedding) as similarity ...
  // WHERE similarity > threshold ORDER BY similarity DESC LIMIT limit
}
```

**What semantic search unlocks:**
- "Find our return policy for lighting fixtures" → retrieves the relevant article without exact keyword match
- "Show me what we know about Visual Comfort Group" → retrieves vendor notes + articles + prior AI summaries
- "Find customers who mentioned budget constraints" → retrieves interaction notes by meaning
- AI context retrieval: instead of injecting all vendor data into prompts, retrieve only the semantically relevant slices

---

### 2.4 PROCEDURAL MEMORY
**What it is:** Knowledge of how to do things — proven workflows, templates, and patterns.
**Duration:** Indefinite; version-controlled
**Current state:** BUILD_INTELLIGENCE.md stores patterns manually. No machine-readable procedural knowledge.

**Target design:**

```sql
procedures (
  id          UUID PRIMARY KEY,
  key         TEXT UNIQUE NOT NULL,   -- e.g., 'email_outreach_vendor_score_drop'
  title       TEXT NOT NULL,
  description TEXT,
  trigger     TEXT,                   -- when to use this
  template    TEXT,                   -- the actual procedure (markdown or structured)
  metadata    JSONB,                  -- success_count, failure_count, last_used
  created_at  TIMESTAMPTZ,
  updated_at  TIMESTAMPTZ
)
```

**Example procedures:**

```
key: 'vendor_score_drop_outreach'
trigger: 'alert type=score_dropped AND vendor.tier=A'
template: |
  Subject: Checking in on [VENDOR_NAME] partnership
  
  Hi [REP_NAME],
  
  We've been reviewing our partnership with [VENDOR_NAME] and noticed [SPECIFIC_ISSUE].
  We value our relationship and wanted to discuss...
  
  Context to inject: vendor.avg_score, vendor.rep_contact, recent CHANGELOG entries
```

```
key: 'coop_claim_submission'
trigger: 'alert type=coop_deadline AND coop.days_remaining < 14'
steps:
  1. Pull co-op fund details from coop_tracker
  2. Pull recent invoices from Windward (or PO records)
  3. Draft claim document with amounts + invoice references
  4. Queue for owner review → email template
```

**Procedural memory builds over time:**
- When a user accepts an AI-drafted email, the template that worked gets a `success_count + 1`
- When a user significantly edits an AI draft before sending, the edit becomes a training signal
- High-success procedures are promoted to "verified" status and weighted higher in retrieval

---

### 2.5 STRATEGIC MEMORY
**What it is:** The organizational goals, priorities, and direction.
**Duration:** Indefinite; versioned by quarter/year
**Current state:** Goals + OKR module is built and functional (5-level hierarchy, progress bars). KPI registry is built. **This is the most mature memory type in AccentOS.**

**Gaps to close:**
1. Goals are not yet linked to operational data — a goal "increase Tier A vendor coverage by 20%" has no automatic progress computation from vendor_scores
2. KPI snapshots are manually triggered (owner clicks "Snapshot today") — should auto-run daily via Supabase Edge Function
3. Strategic memory should inform AI context: when answering "which vendors to focus on?", the AI should know the current strategic goals

**Target connection:**

```javascript
// When AI retrieves context for a vendor question
async function getStrategicContext() {
  const goals = await sbFetch('goals?status=active&parent_id=is.null');
  const kpiTrends = await sbFetch('kpi_snapshots?order=snapshot_date.desc&limit=30');
  return { goals, kpiTrends };  // injected into AI system prompt
}
```

---

### 2.6 GOVERNANCE MEMORY
**What it is:** The rules, policies, and constraints that govern system behavior.
**Duration:** Indefinite; change-controlled
**Current state:** Hard-coded in CLAUDE.md, MASTER.md, and JS role checks. No machine-readable policy store.

**Target design:**

```sql
policies (
  id          UUID PRIMARY KEY,
  key         TEXT UNIQUE NOT NULL,
  title       TEXT,
  description TEXT,
  rule_type   TEXT,  -- 'permission' | 'automation_gate' | 'approval_requirement' | 'data_quality'
  rule        JSONB, -- structured rule definition
  applies_to  TEXT[], -- entity types this applies to
  enforced_by TEXT,  -- 'ui' | 'api' | 'trigger' | 'ai'
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ
)
```

**Example policies:**

```json
{
  "key": "rep_score_visibility",
  "title": "Rep Score category must never be visible to vendors or reps",
  "rule_type": "permission",
  "rule": { "deny": ["rep_view", "vendor_view"], "allow": ["owner", "admin", "manager"] },
  "applies_to": ["vendor_score"],
  "enforced_by": "ui"
}

{
  "key": "ai_action_requires_approval",
  "title": "AI-generated external communications require human approval",
  "rule_type": "approval_requirement",
  "rule": { "categories": ["email_external", "claim_submission"], "min_role": "manager" },
  "applies_to": ["pending_action"],
  "enforced_by": "api"
}
```

Governance memory makes policies queryable rather than scattered across code. It also enables the AI to self-check: "before I draft this email, is there a policy that requires approval?"

---

## 3. MEMORY RETRIEVAL LOGIC

### For AI Context Assembly
Before any AI call, the system assembles context from all six memory types:

```javascript
async function assembleContext(intent, entityContext) {
  const [
    workingMemory,   // relevant globals from MEMORY.working
    episodicMemory,  // last 20 events for this entity
    semanticMemory,  // top-5 semantically relevant articles/notes
    proceduralMemory,// matching procedures for this intent
    strategicMemory, // active goals + recent KPI trend
    governanceMemory // applicable policies for this action type
  ] = await Promise.all([
    getWorkingContext(entityContext),
    getEpisodicContext(entityContext.entityType, entityContext.entityId),
    semanticSearch(intent, { limit: 5 }),
    findProcedures(intent),
    getStrategicContext(),
    getApplicablePolicies(intent)
  ]);

  return buildSystemPrompt({ workingMemory, episodicMemory, semanticMemory,
                              proceduralMemory, strategicMemory, governanceMemory });
}
```

### For Search
Search across AccentOS should query multiple memory types:

| Query type | Memory types searched | Method |
|---|---|---|
| Exact entity (name/SKU/ID) | Working | In-memory filter |
| Keyword | Working + Semantic | LIKE + vector similarity |
| Conceptual ("vendor who has co-op issues") | Semantic + Episodic | Vector search + event filter |
| Historical ("what happened to this vendor last quarter") | Episodic | Date-filtered event query |
| Procedural ("how do we handle warranty claims?") | Procedural + Semantic | Vector search in procedures |

---

## 4. DECAY POLICIES

Not all memory is equally valuable over time.

| Memory Type | Decay Model | Implementation |
|---|---|---|
| Working | TTL expiry (module-specific) | Refresh on TTL expiration |
| Episodic | No decay — events are immutable facts | Archive to cold storage after 2 years |
| Semantic | Stale when source document changes | Re-embed on document update |
| Procedural | Confidence decay — unused procedures deprioritized | `last_used` + `success_count` weighting |
| Strategic | Versioned by quarter — old goals archive | Mark `expires_at` on goal when period ends |
| Governance | No decay — policies are active until explicitly retired | `active` flag toggle |

---

## 5. TRUST SCORING

Every memory retrieval should carry a trust score:

| Source | Trust Score | Rationale |
|---|---|---|
| Live Supabase query | 1.0 | Direct from database |
| Cached working memory < TTL | 0.95 | Recent but not live |
| Cached working memory > TTL | 0.7 | Potentially stale |
| AI-generated summary (stored) | 0.8 | May have drifted from current reality |
| Semantic search result | 0.85 × similarity | Approximate by nature |
| Procedural template | 0.9 × success_rate | Proven but context-dependent |
| Manual entry (no verification) | 0.6 | Human-entered, potentially wrong |

Trust scores surface in the UI: "This recommendation is based on data from 4 hours ago (trust: 0.7)."

---

## 6. ARCHIVAL RULES

| Memory Type | Archive Trigger | Archive Location | Retrieval Path |
|---|---|---|---|
| system_events | > 2 years old | Supabase cold storage or compressed JSONL file | Offline query tool |
| AI conversations | > 6 months | Supabase (keep — storage is cheap) | Standard query |
| vendor_score_history | Never — too valuable | Keep in Supabase | Standard query |
| kpi_snapshots | > 5 years old | Compressed archive | Manual retrieval |
| audit_log | Never — compliance requires it | Keep in Supabase | Standard query |

---

*Next: See AGENT_HIERARCHY.md for the orchestration architecture design.*
