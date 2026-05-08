# Agent Hierarchy — AccentOS Organizational Cognition Engine
> Author: Claude Code | Date: 2026-05-08

---

## 1. CHALLENGE THE PREMISE FIRST

The handoff document proposes a 7-layer agent hierarchy:
> executive agents → orchestration → departmental → specialist → validator → governance → economic

**This is overengineered for AccentOS.** Here is why:

1. **Solo operator.** Michael manages AccentOS alone. A 7-layer hierarchy requires coordination overhead that costs more than it saves at this scale.

2. **Parallel agents = parallel costs.** Each agent call costs tokens and latency. A hierarchy with 5 agent calls to answer "which vendors should we focus on?" is 5x slower and 5x more expensive than one well-structured call.

3. **Agent spam is the primary risk.** The handoff document itself warns against it. A hierarchy is the architectural form of agent spam.

4. **Reliability beats intelligence.** Multi-agent systems have compound failure modes — if any agent in a chain hallucinates or stalls, the whole pipeline fails.

**The right architecture for AccentOS is not a hierarchy. It is a set of specialized roles that can be played by one model with good context.**

---

## 2. THE ACTUAL ARCHITECTURE — FOUR ROLES

For AccentOS, AI orchestration needs exactly four roles:

```
┌─────────────────────────────────────────────────────┐
│                   USER INTENT                        │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────┐
        │        ROUTER            │  — What is this request?
        │  (intent classification) │  — Which tools/context are needed?
        └──────────────┬───────────┘
                       │
                       ▼
        ┌──────────────────────────┐
        │       RETRIEVER          │  — Pull relevant memory
        │  (context assembly)      │  — Semantic + episodic + procedural
        └──────────────┬───────────┘
                       │
                       ▼
        ┌──────────────────────────┐
        │      SYNTHESIZER         │  — Call Claude with assembled context
        │  (response generation)   │  — Generate answer or draft action
        └──────────────┬───────────┘
                       │
                       ▼
        ┌──────────────────────────┐
        │       VALIDATOR          │  — Confidence check
        │  (quality gate)          │  — Policy compliance check
        └──────────────┬───────────┘
                       │
                  ┌────┴────┐
                  │         │
                ✅ OK    ⚠️ Low confidence
                  │         │
              Response   Deterministic
            + memory       fallback
              write        + "AI uncertain" label
```

These four roles are **functions in a single `cognition.js` module**, not separate services. They scale to separate services only if AccentOS eventually serves 50+ concurrent users with complex parallel workstreams — which is not the current or near-term reality.

---

## 3. THE ROUTER

**Responsibility:** Classify intent and select the right context + tools.

**Input:** User message / trigger context
**Output:** IntentClassification object

```javascript
// cognition.js
const INTENT_TYPES = {
  QUERY_VENDOR:       'query_vendor',        // "How is Minka Group performing?"
  QUERY_CUSTOMER:     'query_customer',      // "Tell me about this customer"
  QUERY_PIPELINE:     'query_pipeline',      // "What deals are at risk?"
  DRAFT_COMMUNICATION:'draft_communication', // "Draft an outreach to this vendor"
  ANALYZE_TREND:      'analyze_trend',       // "Why are our margins dropping?"
  RECOMMEND_ACTION:   'recommend_action',    // "What should I do about this alert?"
  EXPLAIN_CONCEPT:    'explain_concept',     // "What is a co-op fund?"
  SYSTEM_OPERATION:   'system_operation',    // "Run the demand forecast"
  UNKNOWN:            'unknown'
};

async function route(intent) {
  // Fast, deterministic routing via keyword matching first
  // Fall back to a lightweight Claude call only if ambiguous
  const keywords = intent.toLowerCase();
  if (keywords.match(/vendor|supplier|rep|score/)) return INTENT_TYPES.QUERY_VENDOR;
  if (keywords.match(/customer|client|contact/)) return INTENT_TYPES.QUERY_CUSTOMER;
  if (keywords.match(/deal|pipeline|stage|close/)) return INTENT_TYPES.QUERY_PIPELINE;
  if (keywords.match(/email|draft|write|outreach/)) return INTENT_TYPES.DRAFT_COMMUNICATION;
  if (keywords.match(/trend|why|analysis|dropping|growing/)) return INTENT_TYPES.ANALYZE_TREND;
  // ... etc.
  
  // Ambiguous → lightweight classification call
  return await classifyWithAI(intent);  // ~100 token call, not a full synthesis
}
```

**Why deterministic routing first:** Most user queries in a business system are predictable. Keyword matching handles 80% of cases at zero token cost. The 20% ambiguous cases go to AI classification. This pattern avoids paying for AI classification on obvious cases.

---

## 4. THE RETRIEVER

**Responsibility:** Assemble the minimal relevant context for the Synthesizer.

**Key principle:** The Retriever **minimizes** context, not maximizes it. The goal is to pass only what the Synthesizer needs — not everything that might be relevant. Over-retrieval = wasted tokens + reduced answer quality (model gets distracted by irrelevant context).

```javascript
async function retrieve(intentType, entityContext, userQuery) {
  const context = { intentType, userQuery };
  
  switch (intentType) {
    case INTENT_TYPES.QUERY_VENDOR:
      context.vendor = await getVendorWithScores(entityContext.vendorId);
      context.recentEvents = await getRecentEvents('vendor', entityContext.vendorId, 90);
      context.openCoopFunds = await getOpenCoopFunds(entityContext.vendorId);
      context.activePOs = await getActivePOs(entityContext.vendorId);
      context.relatedArticles = await semanticSearch(userQuery, { entityType: 'article', limit: 3 });
      // NOT included: all other vendors, all customers, all deals, etc.
      break;
      
    case INTENT_TYPES.ANALYZE_TREND:
      context.kpiTrends = await getKpiTrends(30);
      context.dealPipelineSnapshot = await getPipelineSummary();
      context.vendorScoreTrends = await getVendorScoreTrends(90);
      context.goals = await getActiveGoals();
      // Include breadth; exclude depth
      break;
      
    case INTENT_TYPES.DRAFT_COMMUNICATION:
      context.entityDetails = await getEntity(entityContext);
      context.procedures = await findProcedures(userQuery);
      context.recentInteractions = await getRecentEvents(entityContext.entityType, entityContext.entityId, 30);
      context.policies = await getApplicablePolicies('external_communication');
      break;
  }
  
  context.strategicContext = await getActiveGoals();  // always included
  return context;
}
```

**Retrieval budget by intent type:**

| Intent | Token Budget | Priority |
|---|---|---|
| Query entity | 2,000 tokens | Entity data first, events second, articles third |
| Analyze trend | 3,000 tokens | Breadth over depth |
| Draft communication | 2,500 tokens | Templates first, entity data second, policies third |
| Recommend action | 2,000 tokens | Relevant alerts first, procedures second |
| Explain concept | 500 tokens | Knowledge articles only |

---

## 5. THE SYNTHESIZER

**Responsibility:** Call Claude with assembled context and generate the response.

**This is the only place where Claude is called.** Everything else is deterministic.

```javascript
async function synthesize(intentType, context, userQuery) {
  const systemPrompt = buildSystemPrompt(intentType, context);
  const response = await callClaude({
    model: 'claude-sonnet-4-6',
    system: systemPrompt,
    messages: [{ role: 'user', content: userQuery }],
    max_tokens: getMaxTokens(intentType)  // query=1500, draft=2500, analyze=2000
  });
  
  return {
    content: response.content[0].text,
    confidence: estimateConfidence(response, context),
    model: 'claude-sonnet-4-6',
    contextTokens: context._tokenCount,
    generatedAt: new Date().toISOString()
  };
}
```

**System prompt structure:**
```
You are AccentOS — the operational intelligence system for Accent Lighting Inc.

ORGANIZATIONAL CONTEXT:
[strategic goals, active priorities]

RELEVANT ENTITY DATA:
[retrieved entity details]

RECENT EVENTS:
[episodic memory slice]

APPLICABLE PROCEDURES:
[procedural templates if any]

POLICIES:
[governance constraints]

INSTRUCTIONS:
- Be specific to Accent Lighting's situation — no generic advice
- When uncertain, say so and provide confidence level
- If recommending an action, identify who needs to approve it
- Keep responses under [limit] words
```

---

## 6. THE VALIDATOR

**Responsibility:** Quality-check the Synthesizer output before it reaches the user.

**What the Validator checks:**
1. Confidence score — did the Synthesizer hedge significantly? (hallucination signal)
2. Policy compliance — does the response violate any governance policy?
3. Factual consistency — do cited figures match the context data? (basic sanity check)
4. Action safety — if the response proposes an action, does it follow approval requirements?

```javascript
async function validate(synthesis, context, intentType) {
  const issues = [];
  
  // 1. Confidence check
  if (synthesis.confidence < 0.7) {
    issues.push({ type: 'low_confidence', severity: 'warning' });
  }
  
  // 2. Policy check — does the response propose actions that require approval?
  if (intentType === INTENT_TYPES.DRAFT_COMMUNICATION) {
    const policiesViolated = checkPolicies(synthesis.content, context.policies);
    if (policiesViolated.length > 0) {
      issues.push({ type: 'policy_violation', policies: policiesViolated, severity: 'block' });
    }
  }
  
  // 3. Factual consistency — spot check referenced numbers
  const citedNumbers = extractNumbers(synthesis.content);
  const contextNumbers = extractNumbers(JSON.stringify(context));
  const unverifiableNumbers = citedNumbers.filter(n => !contextNumbers.includes(n));
  if (unverifiableNumbers.length > 2) {
    issues.push({ type: 'unverifiable_figures', count: unverifiableNumbers.length, severity: 'warning' });
  }
  
  return {
    ...synthesis,
    validationIssues: issues,
    blocked: issues.some(i => i.severity === 'block'),
    displayConfidence: calculateDisplayConfidence(synthesis.confidence, issues)
  };
}
```

**Validation outcomes:**
- `blocked = true` → response is replaced with deterministic fallback + "AI uncertain" message
- `validationIssues` with warnings → response shown with confidence indicator and caveat
- No issues → response shown normally

---

## 7. SPECIALIZED TOOL AGENTS

Beyond the core four-role pattern, AccentOS needs a small set of **specialized tools** that the Synthesizer can call when needed. These are not separate agents — they are tool functions callable via Claude's tool use feature.

### 7.1 Alert Generator Tool
```
Tool: generate_alerts
Purpose: Run the alert engine and return alert objects
Input: modules to scan (or 'all')
Output: array of alert objects
Called by: Synthesizer when intent involves "what needs attention"
```

### 7.2 Demand Forecast Tool
```
Tool: compute_demand_forecast
Purpose: Run the demand forecast computation
Input: vendor_filter, sku_filter
Output: reorder recommendations with quantities
Called by: Synthesizer when intent involves inventory/reordering
```

### 7.3 Probability Computer Tool
```
Tool: compute_deal_probability
Purpose: Compute probability for one or all deals
Input: deal_id or 'all'
Output: probability scores with factor breakdown
Called by: Synthesizer when intent involves pipeline analysis
```

### 7.4 Draft Generator Tool
```
Tool: generate_draft
Purpose: Generate a structured draft (email, claim form, etc.)
Input: draft_type, entity_context, procedure_key
Output: draft object → queued to pending_actions
Called by: Synthesizer when intent is DRAFT_COMMUNICATION
Note: ALWAYS queued for approval; never auto-executed
```

### 7.5 Event Query Tool
```
Tool: query_events
Purpose: Pull temporal history for an entity
Input: entity_type, entity_id, days_back, event_types
Output: array of system_events
Called by: Synthesizer when time-based context is needed
```

---

## 8. ESCALATION PATHS

The system must know when to stop trying to answer autonomously and escalate to a human.

| Trigger | Action |
|---|---|
| Confidence < 0.5 | Show deterministic fallback only; add "AI unavailable" notice |
| Policy violation blocked | Show blocked message + link to policy; do not show partial answer |
| API error > 3 retries | Show fallback; log to system_events as 'ai_call_failed' |
| Response requires >$1,000 commitment | Always require explicit approval flow |
| Response involves external communication | Always route through pending_actions queue |
| Conflicting data sources | Surface the conflict explicitly; do not pick one silently |

---

## 9. WHAT NOT TO BUILD (YET)

| Rejected Architecture | Why |
|---|---|
| 7-layer agent hierarchy | 5x cost, compound failure modes, maintenance hell at this scale |
| Dedicated agent servers | Cloudflare Workers handles execution needs for current load |
| Autonomous email sending | Never without explicit human approval; removes accountability |
| Self-modifying agents | Not until the base memory + governance layer is solid (years away) |
| Multi-model deliberation | Claude Sonnet 4-6 is sufficient; multi-model adds cost + complexity |
| Streaming agent pipelines | Session-scoped compute is fine; streaming only needed for real-time UI |
| Memory consolidation agent | Manual BUILD_INTELLIGENCE.md updates work at current scale |

---

## 10. SCALING PATH

When AccentOS genuinely needs more agent capability (measurable signal: AI response quality is the bottleneck, not data quality or memory), the path is:

**Phase 1 (now):** Four-role pattern in one `cognition.js` module
**Phase 2 (6+ months):** Separate Cloudflare Worker for the Synthesizer (enables streaming responses)
**Phase 3 (12+ months):** Separate Retriever Worker (enables parallel retrieval across multiple memory types)
**Phase 4 (18+ months):** Domain-specific fine-tuned model for lighting domain (if Anthropic API quality becomes the ceiling)

Do not skip phases. Each phase is only warranted when the prior phase is measurably the bottleneck.

---

*Next: See BUILD_PLAN.md for the phased implementation roadmap.*
