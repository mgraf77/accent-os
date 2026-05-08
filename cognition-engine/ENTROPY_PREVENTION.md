# Architectural Entropy Prevention System
> Author: Claude Code | Date: 2026-05-08

---

## 1. ENTROPY IS THE PRIMARY RISK

The handoff document correctly identifies architectural entropy as the greatest risk. Let me be specific about what entropy looks like in AccentOS:

**Entropy already present:**
- `sbFetch` is called 200+ times across 30+ module files with slightly different patterns (some pass `Prefer: return=representation`, some pass `return=minimal`, some nothing)
- Global search requires manual registration of every dataset; 3 modules are already unregistered
- Cross-module navigation uses `goTo() + setTimeout(80ms)` — a known fragile pattern documented as technical debt
- `module_modes.json` is the source of truth for module visibility, but the UI toggles update in-memory state, not the file — requiring manual `/mode` commands to Claude
- 14 scoring categories are hardcoded in multiple places (VD_RAW, renderScores(), csvImportFlow config) — any change requires hunting them all down

**Entropy trajectory without governance:**
In 6 months at the current pace (30+ modules), the following will be true:
- 50+ modules with no registry
- 5 different patterns for the same CRUD operation
- AI context retrieval injecting stale data because TTLs aren't standardized
- Schema migrations that conflict because there's no schema governance checklist
- Event types that drift because there's no event taxonomy registry

**The cost of entropy:** It slows development, increases bugs, makes the AI's reasoning less reliable (it's reasoning about a system that isn't internally consistent), and makes it progressively harder to improve anything without breaking something else.

---

## 2. SIX ENTROPY VECTORS AND THEIR MITIGATIONS

### ENTROPY VECTOR 1: Schema Drift

**The problem:** New tables get added without consistent patterns. Some have `created_at`, some have `created_by`, some have neither. Some use UUIDs as PKs, some use TEXT. Some enable RLS, some don't.

**The mitigation: Schema Checklist**

Every new SQL migration must be reviewed against this checklist before Michael runs it:

```markdown
## Migration Checklist — required before running any M## migration

### Table Structure
- [ ] Primary key: UUID with `DEFAULT gen_random_uuid()` (or documented exception with reason)
- [ ] `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- [ ] `updated_at TIMESTAMPTZ` — if records are mutable (with trigger or manual update)
- [ ] Soft delete: `archived_at TIMESTAMPTZ` — if records should survive deletion

### RLS
- [ ] `ALTER TABLE <name> ENABLE ROW LEVEL SECURITY;`
- [ ] At minimum: authenticated read policy defined
- [ ] Write policies gated by role if data is role-sensitive

### Safety
- [ ] All `CREATE TABLE` uses `IF NOT EXISTS`
- [ ] All `CREATE INDEX` uses `IF NOT EXISTS`
- [ ] All `CREATE POLICY` preceded by `DROP POLICY IF EXISTS`
- [ ] Rollback SQL documented in comments at file bottom

### Ontology
- [ ] If this table represents an entity (not a junction or log), is it registered in ONTOLOGY.md?
- [ ] If this table represents a relationship, is it registered in the entity relationship map?
- [ ] If this table is a history/event table, does it follow the append-only pattern (no `updated_at`)?
```

This checklist lives as `sql/MIGRATION_CHECKLIST.md` and is referenced from every migration file's header comment.

---

### ENTROPY VECTOR 2: Module Registration Drift

**The problem:** AccentOS has 30+ modules. Adding a new module requires 4 manual shell touchpoints (sidebar entry, PAGE_META, pages dispatcher, hydrate call). Miss any one and the module silently breaks.

**The mitigation: MODULE_REGISTRY**

This is already identified in BUILD_INTELLIGENCE.md (v6.10.12 session). The implementation:

```javascript
// In index.html — one source of truth
const MODULE_REGISTRY = [
  {
    key: 'vendors',
    title: 'Vendor Ranking',
    section: 'INTELLIGENCE',
    roles: ['owner','admin','manager','sales'],
    hydrate: 'sbLoadVendors',
    defaultSubTab: null,
    searchable: true,
    searchDatasetKey: 'VD_RAW'
  },
  // ... all 30+ modules
];

// Shell derives sidebar, PAGE_META, dispatcher, global search registration
// from MODULE_REGISTRY — not from 4 separate hardcoded locations
```

**When to implement:** Next session after a module breaks due to a missed touchpoint registration (the signal that the pain is real), or as a deliberate Track 7 cleanup item.

---

### ENTROPY VECTOR 3: Prompt Lifecycle Drift

**The problem:** AI prompts are embedded inline in feature functions. When the system prompt for the Knowledge Engine evolves, there is no single place to update it. The "Customer Mode" toggle duplicates ~80% of the same system prompt with minor variations.

**The mitigation: Prompt Registry**

```javascript
// In cognition.js — all AI system prompts are centralized
const PROMPT_REGISTRY = {
  'knowledge_engine_internal': {
    version: '1.0',
    lastUpdated: '2026-05-08',
    template: `You are AccentOS — the internal operational intelligence system...`,
    variables: ['vendor_data', 'strategy_context']
  },
  'knowledge_engine_customer': {
    version: '1.0',
    lastUpdated: '2026-05-08',
    template: `You are the Accent Lighting Design Consultant...`,
    variables: []
  },
  'quote_parser': {
    version: '1.0',
    template: `Parse the following notes into a structured line item list...`,
    variables: []
  }
};
```

When a prompt needs updating, there is exactly one place. Prompts have versions and last-updated dates. Drift is visible when you list the registry.

---

### ENTROPY VECTOR 4: Event Type Drift

**The problem:** If every developer (in this case, every Claude session) invents event type strings ad-hoc, the event stream becomes unqueryable. `"score_updated"` vs `"score_changed"` vs `"vendor_score_update"` are all different strings that would produce three separate event types for the same thing.

**The mitigation: Event Type Registry**

```javascript
// In cognition.js or a dedicated events.js
const EVENT_TYPES = Object.freeze({
  // Vendor events
  VENDOR_SCORE_UPDATED:        'vendor:score:updated',
  VENDOR_TIER_CHANGED:         'vendor:tier:changed',
  VENDOR_NOTE_UPDATED:         'vendor:note:updated',
  VENDOR_ACTIVATED:            'vendor:activated',
  VENDOR_DEACTIVATED:          'vendor:deactivated',
  
  // Customer events
  CUSTOMER_CREATED:            'customer:created',
  CUSTOMER_SEGMENT_CHANGED:    'customer:segment:changed',
  CUSTOMER_INTERACTION_ADDED:  'customer:interaction:added',
  
  // Deal events
  DEAL_STAGE_CHANGED:          'deal:stage:changed',
  DEAL_PROBABILITY_UPDATED:    'deal:probability:updated',
  DEAL_WON:                    'deal:won',
  DEAL_LOST:                   'deal:lost',
  
  // Quote events
  QUOTE_CREATED:               'quote:created',
  QUOTE_SENT:                  'quote:sent',
  
  // AI events
  AI_CALL:                     'ai:call',
  AI_ACCEPTED:                 'ai:accepted',
  AI_REJECTED:                 'ai:rejected',
  
  // Action events
  ACTION_QUEUED:               'action:queued',
  ACTION_APPROVED:             'action:approved',
  ACTION_EXECUTED:             'action:executed',
  ACTION_REJECTED:             'action:rejected',
  
  // Navigation
  MODULE_VISITED:              'nav:module_visited',
});
```

Using namespaced event types (`entity:aspect:verb`) makes queries predictable: `WHERE event_type LIKE 'vendor:%'` finds all vendor events.

---

### ENTROPY VECTOR 5: Memory Pollution

**The problem:** As AccentOS accumulates data, not all of it remains relevant. Stale vendor scores, closed deals, archived customers — if these all carry equal weight in the working memory and AI context, the signal-to-noise ratio degrades.

**The mitigation: Memory Hygiene Policy**

```markdown
# Memory Hygiene Policies

## Working Memory (JS globals)
- Archived entities (archived_at IS NOT NULL) must be excluded from primary arrays
- Exception: explicit "show archived" toggle re-includes them
- Globals are refreshed on a per-module TTL, not held indefinitely

## Episodic Memory (system_events)
- Events older than 2 years move to cold archive (Supabase compressed backup)
- Events for deleted/archived entities are kept — they are historical facts

## Semantic Memory (embeddings)
- Re-embed document when source text changes by >10%
- Remove embeddings for archived articles
- Batch re-embedding run if model version changes (embeddings are model-specific)

## Working Memory Exclusion Rules (enforced in sbLoad functions)
- vendor queries: default WHERE inactive = false OR inactive IS NULL
- customer queries: default WHERE archived_at IS NULL
- deal queries: default WHERE status NOT IN ('archived') (unless Archive view is active)
```

---

### ENTROPY VECTOR 6: Tech Debt Accumulation

**The problem:** BUILD_INTELLIGENCE.md already documents 20+ known debt items (the `setTimeout(80ms)` pattern, the `delete-then-insert` PO pattern, the free-text name-match instead of UUID FK for customer-quote linking). These are tracked but never systematically addressed.

**The mitigation: Debt Ledger + Retirement Trigger**

Add a `TECH_DEBT.md` file with:
- Every known debt item from BUILD_INTELLIGENCE.md that is actionable
- A `retirement_trigger` for each: "retire when X happens" or "retire if Y is a bottleneck"
- A `risk_level` for each: 🔴 (breaks first at scale) | 🟡 (accumulates slowly) | 🟢 (cosmetic only)

This prevents debt from being invisible (it's not in a priority queue) while avoiding premature optimization (retirement is trigger-based, not calendar-based).

```markdown
# TECH_DEBT.md

| Item | Description | Retirement Trigger | Risk |
|---|---|---|---|
| setTimeout(80ms) cross-module nav | Fragile; misses if render is slow | When goTo() is refactored to accept a callback | 🟡 |
| Name-match customer→quote FK | Breaks on typos | When Quote save flow adds customer_id UUID dropdown | 🔴 |
| _toCsv() duplicated 3x | Copy-paste snowball | On 4th use | 🟡 |
| module_modes.json not browser-writable | Requires Claude command to persist | When a Supabase table or Cloudflare KV stores overrides | 🟢 |
| VD_RAW vendor_id is TEXT not UUID | Schema inconsistency with all other entity PKs | When Windward integration is live (natural migration point) | 🟡 |
```

---

## 3. AUDIT SYSTEMS

### Weekly Entropy Check (automated, run by scripts/status.sh)
Add to the existing `status.sh`:
```bash
# Check MODULE_REGISTRY completeness — every sidebar entry should be registered
# Check event type registry — every system_events.event_type should be in EVENT_TYPES
# Check schema compliance — every table should have created_at
# Check prompt registry — every AI fetch call should use PROMPT_REGISTRY key
echo "=== Entropy Score ==="
echo "Module registry: [X/30 registered]"
echo "Event types: [X/Y known types in registry]"
echo "Schema compliance: [X/40 tables checked]"
```

### Monthly Architecture Review (Michael + Claude, 30 minutes)
1. Run status.sh and review entropy score
2. Review TECH_DEBT.md — any retirement triggers hit?
3. Review BUILD_INTELLIGENCE.md — any patterns emerging that should be codified?
4. Review cognition-engine/ docs — do they still match reality?

---

## 4. DEPRECATION POLICY

When a feature, module, or API pattern is retired:

1. Add `deprecated_at` comment to the function/module
2. Add replacement path (what to use instead)
3. Keep for 2 sessions (allows in-flight work to complete)
4. Remove in session 3 — no backward compatibility shims

**Why no backward compatibility shims:** A shim is entropy in disguise. It hides the fact that the old pattern still exists while implying it doesn't. AccentOS is a solo-operator system — no other developers are depending on the old API. Remove cleanly.

---

## 5. ONTOLOGY ENFORCEMENT

The canonical ontology (ONTOLOGY.md + ontology.json) must be maintained as the system evolves.

**Enforcement triggers:**
- New entity type → update ONTOLOGY.md first, then build the table
- New relationship → register in entity_relationships map before using in code
- New event type → add to EVENT_TYPES registry first
- New AI prompt → add to PROMPT_REGISTRY first

**How to enforce this in practice:** The `CLAUDE.md` file already drives Claude's behavior at session start. Add an ontology check step:

```markdown
## AUTO-EXECUTE ON START — add to CLAUDE.md
After BUILD_INTELLIGENCE.md:
5. Read `cognition-engine/ONTOLOGY.md` — if you're about to create a new table, verify it's registered here first
6. Read `cognition-engine/ENTROPY_PREVENTION.md` — check current entropy score section
```

---

## 6. MODULE CONTRACT TEMPLATE

Every module must have a contract — a brief specification of what it owns, what it reads, and what it emits. This prevents implicit coupling.

```markdown
## MODULE CONTRACT — [module_name]

**Owns (authoritative for):**
- [list of Supabase tables this module writes to]

**Reads (no ownership):**
- [list of globals/tables read but not owned]

**Emits (events):**
- [list of event types this module writes to system_events]

**Side effects:**
- [any cross-module modifications this module makes]

**Depends on (load order):**
- [list of modules that must be hydrated first]
```

Short-term: document the 5 most complex modules (vendors, customers, pipeline, inventory, cognition).
Long-term: all 30+ modules have contracts, and `status.sh` can verify contract completeness.

---

*Next: See RECOMMENDATIONS.md for the final recommendations, risks, and sequencing guidance.*
