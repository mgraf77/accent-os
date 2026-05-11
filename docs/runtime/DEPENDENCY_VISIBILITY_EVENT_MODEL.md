# DEPENDENCY VISIBILITY EVENT MODEL
> AccentOS — Phase 2 Semantic Observability Prep Sprint
> Written: 2026-05-11 · Version: 1.0
> Status: SPEC ONLY — No runtime implementation. No event listeners.
> Purpose: Define what events should eventually be observable in the dependency field

---

## IMPORTANT SCOPE CONSTRAINT

This document defines an **event schema** — not an implementation.

- NO runtime event listeners in this document
- NO WebSocket/EventSource/BroadcastChannel usage
- NO mutation observers
- NO window.postMessage routing
- NO orchestration engine

The event model exists so that when (and if) observability tooling is built, it has a clean, pre-designed schema to implement against rather than being designed ad-hoc at implementation time.

---

## PURPOSE

The register() substrate captures a static snapshot of module topology. It does not capture:
- When a module initializes
- When a global is first written
- When a dep is resolved vs. unresolved
- When a semantic collision occurs at runtime
- When ownership boundaries are violated

This event model defines what would need to be observable to make the dependency field visible at runtime.

---

## EVENT TAXONOMY

Events are grouped into four categories:
- **OWNERSHIP** — who holds what, when
- **RESOLUTION** — when deps become available
- **COUPLING** — when cross-module relationships are exercised
- **CONFLICT** — when semantic boundaries are violated

---

## EVENT SCHEMA

All events share a common envelope:

```javascript
{
  event_type: string,       // one of the event types below
  ts: ISO8601,              // event timestamp
  source_module: string,    // module emitting the event (register() name)
  symbol: string,           // the specific global, function, or global being described
  payload: object           // event-specific data (defined per type below)
}
```

---

## OWNERSHIP EVENTS

### OWN-1: module_registered

Emitted when register() is called for a module.

```javascript
{
  event_type: 'module_registered',
  source_module: 'calendar',
  symbol: null,
  payload: {
    provides: ['calendar','CAL_EVENTS','sbLoadCalendarEvents','sbSaveCalendarEvent','sbDeleteCalendarEvent'],
    consumes: ['sbFetch','sbConfigured','CU','$','esc','toast'],
    registration_order: 12  // sequential counter
  }
}
```

**Observable value:** Tracks which modules registered and in what order. Registration order correlates with load order.

---

### OWN-2: global_initialized

Emitted when a module writes its primary global for the first time.

```javascript
{
  event_type: 'global_initialized',
  source_module: 'pipeline_module',
  symbol: 'DEALS',
  payload: {
    value_type: 'object',   // 'array', 'object', 'function', 'primitive'
    key_count: 7,           // for objects: number of keys; for arrays: length
    initialized_at: ISO8601
  }
}
```

**Observable value:** Confirms initialization order. Detects when a dep is consumed before it's initialized (DEP-4 violations).

---

### OWN-3: global_mutated

Emitted when a module writes to a global it declared in provides[].

```javascript
{
  event_type: 'global_mutated',
  source_module: 'pipeline_module',
  symbol: 'DEALS',
  payload: {
    mutation_type: 'array_replace',  // 'array_replace', 'object_merge', 'property_set', 'full_replace'
    previous_length: 42,
    new_length: 45,
    trigger: 'sbLoadDeals'           // function that caused the mutation
  }
}
```

**Observable value:** Tracks mutation frequency and pattern. High-frequency mutation of a widely-consumed global is a coupling risk signal.

---

## RESOLUTION EVENTS

### RES-1: dependency_resolved

Emitted when a module first successfully calls or reads a declared dependency.

```javascript
{
  event_type: 'dependency_resolved',
  source_module: 'vendors_overflow',
  symbol: 'weightedScore',
  payload: {
    provider_module: 'vendor_scoring_helpers',
    resolution_type: 'function_call',   // 'function_call', 'global_read', 'global_write'
    resolved_at: ISO8601,
    time_since_registration_ms: 1240
  }
}
```

**Observable value:** Maps the actual dependency graph as it executes. Shows which declared deps are actually exercised vs. declared-but-unused.

---

### RES-2: dependency_unresolved

Emitted when a module tries to call/read a declared dependency that is not yet available.

```javascript
{
  event_type: 'dependency_unresolved',
  source_module: 'digest',
  symbol: 'computeDailyBrief',
  payload: {
    expected_provider: 'dashboard_module',
    resolution_attempt: 'function_call',
    result: 'undefined',   // 'undefined', 'null', 'not_function', 'not_array'
    recovered: false        // did the typeof guard / fallback catch it?
  }
}
```

**Observable value:** Reveals initialization ordering violations and DEP-1 vs DEP-2 classification accuracy.

---

### RES-3: undeclared_dep_consumed

Emitted when a module consumes a symbol that is NOT in its consumes[] array.

```javascript
{
  event_type: 'undeclared_dep_consumed',
  source_module: 'vendors_overflow',
  symbol: 'CAT_DEFS',
  payload: {
    dep_type: 'global_read',
    declared: false,
    in_provides_of: null,   // null if index.html-hosted or unknown
    risk_class: 'DEP-5'
  }
}
```

**Observable value:** This is the automated SCI detector. Every undeclared_dep_consumed event is a potential SCI incident for orchestration purposes.

---

## COUPLING EVENTS

### COUP-1: cross_module_call

Emitted when a function provided by one module is called by another module.

```javascript
{
  event_type: 'cross_module_call',
  source_module: 'dashboard_module',     // caller
  symbol: 'weightedScore',
  payload: {
    provider_module: 'vendor_scoring_helpers',
    call_type: 'sync_function',   // 'sync_function', 'async_function', 'global_read'
    call_depth: 2                 // nesting depth in call stack
  }
}
```

**Observable value:** Produces a runtime coupling map that supplements the static register() topology.

---

### COUP-2: initialization_chain_activated

Emitted when module A's initialization triggers module B's dep resolution (revealing an implicit init chain).

```javascript
{
  event_type: 'initialization_chain_activated',
  source_module: 'vendors_overflow',
  symbol: null,
  payload: {
    chain: ['vendor_scoring', 'vendor_scoring_helpers', 'vendors_overflow'],
    chain_depth: 3,
    trigger: 'page_load'
  }
}
```

**Observable value:** Makes DEP-4 initialization dependencies visible as they execute.

---

### COUP-3: shared_global_read_by_multiple

Emitted when a global is read by a second module after already being read by a different module in the same render cycle.

```javascript
{
  event_type: 'shared_global_read_by_multiple',
  symbol: 'VD',
  payload: {
    readers: ['vendors_module', 'vendors_overflow', 'vendor_filters'],
    read_cycle: 'render',   // 'render', 'user_action', 'load'
    write_count_since_load: 0
  }
}
```

**Observable value:** Identifies shared-global dependency hotspots (DEP-5 classification evidence).

---

## CONFLICT EVENTS

### CONF-1: global_mutation_overlap

Emitted when two modules write to the same global within the same user interaction cycle.

```javascript
{
  event_type: 'global_mutation_overlap',
  symbol: 'DEALS',
  payload: {
    first_writer: 'pipeline_module',
    second_writer: 'unknown_module',    // hypothetical — shouldn't happen in current arch
    write_interval_ms: 12,
    conflict_class: 'SCI-4'
  }
}
```

**Observable value:** The most serious conflict event. Would indicate a semantic collision in actual execution.

---

### CONF-2: ownership_violation

Emitted when a module mutates a global it does not declare in provides[].

```javascript
{
  event_type: 'ownership_violation',
  source_module: 'vendors_overflow',  // hypothetical
  symbol: 'CHANGELOG',
  payload: {
    declared_owner: 'vendor_scoring_helpers',
    mutation_type: 'array_push',
    violation_class: 'undeclared_mutation'
  }
}
```

**Observable value:** Detects writes that the dependency substrate does not account for. Any ownership_violation is a substrate inaccuracy.

---

### CONF-3: dead_reference_called

Emitted when a function in provides[] is called but does not exist in the module.

```javascript
{
  event_type: 'dead_reference_called',
  source_module: 'vendors_module',
  symbol: 'openVendorScoreCsvPaste',
  payload: {
    call_site: 'button.onclick',
    result: 'ReferenceError',
    ai_incident: 'AI-1'
  }
}
```

**Observable value:** Runtime confirmation of dead reference incidents. Validates HR-2 violations.

---

## EVENT PRIORITY FOR FUTURE IMPLEMENTATION

If observability tooling is ever built, implement in this order:

| Priority | Event | Reason |
|---------|-------|--------|
| 1 | OWN-1 (module_registered) | Already happens via register() — extend to emit |
| 2 | RES-3 (undeclared_dep_consumed) | Highest diagnostic value — automated SCI detector |
| 3 | OWN-2 (global_initialized) | Init order tracking |
| 4 | RES-2 (dependency_unresolved) | Surface DEP-4 violations |
| 5 | CONF-2 (ownership_violation) | Surface undeclared mutations |
| 6 | COUP-1 (cross_module_call) | Runtime coupling map |
| 7 | Others | Lower priority, higher implementation cost |

---

## NON-GOALS

This event model does NOT define:
- A runtime orchestration engine
- An event bus implementation
- Automated SCI prevention
- Real-time dashboard data feeds
- N=3 coordination signals

These are explicitly out of scope for this sprint and this document.
