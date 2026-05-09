# MVHB_INDEX.md — AccentOS Operational Observability Layer Index

> Entry point for the sandbox observability layer.
> Maps all docs to use cases, reading order, ownership, and layer relationships.
> No governance ownership. No runtime authority.

---

## WHAT THIS LAYER IS

The MVHB (Minimum Viable Handoff Backbone) sandbox is the observability and
orchestration ergonomics design layer for AccentOS.

It defines:
- What operational state looks like (STATUS.md schema)
- What signals Claude naturally emits (telemetry catalog)
- How bottlenecks surface and get resolved (bottleneck visibility)
- How the Michael ↔ Claude relay loop works efficiently (orchestration ergonomics)
- What templates make the relay zero-friction on iPhone (handoff templates)
- How sessions are tracked and resumed (session state surface)

It does NOT define:
- Who has write authority over canonical state
- How sessions synchronize across governance boundaries
- Auto-remediation or notification systems
- Production runtime behavior

---

## FULL DOC SET (10 docs)

```
docs/mvhb/
├── STATUS_MD_V1.md
├── STATUS_MD_V2.md               ← canonical schema (use this one)
├── STATUS_MD_LIVE_EXAMPLE.md
├── OPERATIONAL_HUD_SPEC.md
├── PHONE_FIRST_DASHBOARD_CONCEPT.md
├── SESSION_STATE_SURFACE.md
├── TELEMETRY_SIGNAL_CATALOG.md
├── BOTTLENECK_VISIBILITY_SPEC.md
├── ORCHESTRATION_ERGONOMICS.md
└── RELAY_HANDOFF_TEMPLATES.md
```

---

## READING ORDER BY USE CASE

### Use case A — "I want to understand the STATUS.md format"
```
1. STATUS_MD_V2.md              ← canonical schema, field specs, formatting rules
2. STATUS_MD_LIVE_EXAMPLE.md    ← real example + gap analysis
3. STATUS_MD_V1.md              ← original (historical reference only)
```

### Use case B — "I want to understand the full HUD field set"
```
1. OPERATIONAL_HUD_SPEC.md      ← all 9 HUD fields, ownership, staleness signals
2. STATUS_MD_V2.md              ← how fields translate to STATUS.md
3. PHONE_FIRST_DASHBOARD_CONCEPT.md  ← how fields render on iPhone
```

### Use case C — "I need to triage the system from iPhone right now"
```
1. PHONE_FIRST_DASHBOARD_CONCEPT.md  ← 3-mode read, 20-second triage flow
2. BOTTLENECK_VISIBILITY_SPEC.md     ← 5-check minimum viable surface
3. RELAY_HANDOFF_TEMPLATES.md        ← T01–T08 for immediate action
```

### Use case D — "I want to understand the relay loop and fix friction"
```
1. ORCHESTRATION_ERGONOMICS.md       ← dual modes, fragmentation failure modes
2. RELAY_HANDOFF_TEMPLATES.md        ← 24 templates, copy-paste ready
3. BOTTLENECK_VISIBILITY_SPEC.md     ← relay friction type (TYPE 6)
```

### Use case E — "I need to understand session tracking and resume semantics"
```
1. SESSION_STATE_SURFACE.md          ← state machine, resume protocol
2. RELAY_HANDOFF_TEMPLATES.md        ← T01–T05 (resume/freeze/pause templates)
3. STATUS_MD_V2.md                   ← SESSION STATE + SESSION ROLE fields
```

### Use case F — "I want to build the telemetry tooling layer"
```
1. TELEMETRY_SIGNAL_CATALOG.md       ← 18 signals, collection methods, thresholds
2. BOTTLENECK_VISIBILITY_SPEC.md     ← how signals compose into bottleneck types
3. STATUS_MD_V2.md                   ← which fields accept tooling-derived values
4. STATUS_MD_LIVE_EXAMPLE.md         ← excluded fields list (tooling-dependent)
```

### Use case G — "I want to review this layer for governance approval"
```
1. This index                         ← layer summary and boundaries
2. ORCHESTRATION_ERGONOMICS.md       ← dual mode protocol (MODE 1 / MODE 2)
3. BOTTLENECK_VISIBILITY_SPEC.md     ← bottleneck taxonomy and escalation paths
4. STATUS_MD_V2.md                   ← canonical schema
5. TELEMETRY_SIGNAL_CATALOG.md       ← signal catalog and tooling boundary
6. SESSION_STATE_SURFACE.md          ← session state model
7. RELAY_HANDOFF_TEMPLATES.md        ← operational relay protocol
```

---

## DOC SUMMARIES

---

### STATUS_MD_V2.md
**What it is:** Canonical schema for the STATUS.md operational file.
**Key content:** 13 fields, formatting rules, field specs, mobile constraints,
v1→v2 delta, rejected proposals, excluded fields.
**Use it when:** Writing or reading STATUS.md. Onboarding a new session.
**Supersedes:** STATUS_MD_V1.md

---

### STATUS_MD_V1.md
**What it is:** Original STATUS.md schema (11 fields).
**Key content:** Initial field definitions, mobile rendering assumptions,
ownership model, forbidden elements.
**Use it when:** Historical reference. Understanding what changed in v2.
**Status:** Superseded by v2. Do not use for new STATUS.md writes.

---

### STATUS_MD_LIVE_EXAMPLE.md
**What it is:** Reality test of the v1 schema against real session state.
**Key content:** Live generated STATUS.md, 11 gap findings, schema scorecard,
5 v2 change recommendations, excluded field rationale.
**Use it when:** Understanding why v2 changes were made. Validating schema
against a new real-world scenario.

---

### OPERATIONAL_HUD_SPEC.md
**What it is:** Field-by-field definition of the 9 operational HUD fields.
**Key content:** Field purposes, write ownership, staleness signals,
Michael action requirements, anti-patterns, field dependency map.
**Use it when:** Understanding what each HUD field means semantically.
Implementing or auditing STATUS.md write logic.

---

### PHONE_FIRST_DASHBOARD_CONCEPT.md
**What it is:** UX design for iPhone-first operational visibility.
**Key content:** Single-screen rule, information priority order,
3 read modes (glance / status check / full triage), phone viewport constraints,
v1 scope limitations, escalation path.
**Use it when:** Designing any new operational surface. Validating that a
STATUS.md or HUD design works at 375px viewport.

---

### SESSION_STATE_SURFACE.md
**What it is:** Formal model for Claude session states, branch visibility,
and resume semantics.
**Key content:** Session vocabulary, state machine (ACTIVE/FROZEN/PAUSED/COMPLETE/ABANDONED),
state transitions, branch naming convention, orphan detection, queue ownership rules,
multi-session visibility model, 7 operational blind spots addressed.
**Use it when:** Starting, freezing, resuming, or abandoning a session.
Designing parallel session workflows.

---

### TELEMETRY_SIGNAL_CATALOG.md
**What it is:** Catalog of 18 operational signals Claude naturally emits.
**Key content:** 6 signal families (push freshness, queue pressure, gate/dependency,
session health, frozen aging, cadence degradation), baselines, thresholds,
mobile-visible indicators per signal, 6-signal MVHB floor (zero tooling),
7 high-value future overlays (tooling required).
**Use it when:** Building the telemetry tooling layer.
Understanding what signals already exist vs. what requires instrumentation.

---

### BOTTLENECK_VISIBILITY_SPEC.md
**What it is:** How telemetry signals compose into operator-visible bottlenecks.
**Key content:** 4 severity tiers (T0–T3), 6 bottleneck types with Michael-action mapping,
triage priority order, noise suppression rules, bottleneck interaction map,
operator overload indicator, 5-check minimum viable surface.
**Use it when:** Triaging a degraded system from iPhone.
Designing bottleneck detection or alerting overlays.

---

### ORCHESTRATION_ERGONOMICS.md
**What it is:** Formal protocol for the Michael ↔ Claude relay loop.
**Key content:** MODE 1 (handoff orchestrator) and MODE 2 (strategic interruption)
definitions, 7 MODE 2 trigger conditions, switching heuristics, operator cognitive
load model, 6 relay fragmentation failure modes (FRAG-1 through FRAG-6),
gate batching strategies, context compression principles, relay reset conditions,
7 orchestration quality signals, ideal and anti-patterns.
**Use it when:** Diagnosing relay friction. Training Claude on relay behavior.
Designing new orchestration flows.

---

### RELAY_HANDOFF_TEMPLATES.md
**What it is:** 24 copy-paste-ready relay templates for common orchestration flows.
**Key content:** T01–T24 covering resume, freeze, pause, gate resolution, branch handoff,
sandbox start, governance surface, MODE 1/MODE 2 formats, parallel coordination,
blocked recovery, bottleneck escalation, decision compression, relay reset,
DONE/KNOWN/NEXT, session wrap, orphan triage, scope confirmation.
Copy-paste optimization rules, mobile readability constraints, anti-patterns.
**Use it when:** Any relay action from iPhone. Building new templates.
Reducing relay friction in common orchestration flows.

---

## LAYER RELATIONSHIPS

```
DESIGN LAYER (what this sandbox produces)
  │
  ├── Operational State Model
  │   ├── STATUS_MD_V2.md          ← schema
  │   ├── OPERATIONAL_HUD_SPEC.md  ← field semantics
  │   └── SESSION_STATE_SURFACE.md ← session model
  │
  ├── Signal Layer
  │   ├── TELEMETRY_SIGNAL_CATALOG.md   ← 18 signals
  │   └── BOTTLENECK_VISIBILITY_SPEC.md ← signal → bottleneck composition
  │
  ├── Ergonomics Layer
  │   ├── ORCHESTRATION_ERGONOMICS.md   ← relay protocol
  │   ├── RELAY_HANDOFF_TEMPLATES.md    ← templates
  │   └── PHONE_FIRST_DASHBOARD_CONCEPT.md ← UX constraints
  │
  └── Validation Layer
      ├── STATUS_MD_LIVE_EXAMPLE.md ← reality test
      └── STATUS_MD_V1.md           ← historical baseline

IMPLEMENTATION LAYER (not built — depends on governance approval)
  │
  ├── STATUS.md live file (apply v2 schema at repo root)
  ├── Telemetry tooling (7 high-value overlays from signal catalog)
  ├── Gate timestamp automation (write gate-set time on gate declaration)
  └── Relay reset automation (RELAY_RESET.md generation script)

GOVERNANCE LAYER (external — defines write authority)
  │
  └── Determines: who can write canonical state, sync contracts,
      notification boundaries, multi-session orchestration authority
```

---

## WHAT IS READY TO IMPLEMENT (no governance required)

These artifacts can be created immediately from this sandbox layer without
waiting for governance approval — they are observability/read-only or
clearly scoped to a single session:

```
READY NOW:
1. STATUS.md at repo root — apply v2 schema, write current state
   (one file, one session, no cross-session authority)

2. T01–T24 relay templates — already usable, no implementation needed
   (copy-paste from RELAY_HANDOFF_TEMPLATES.md)

3. M29 gate registration — worker proxy deploy gate is informal,
   needs M-task number assigned in BUILD_PLAN_MICHAEL.md
   (one BUILD_PLAN_MICHAEL.md entry, scoped to one action)

4. Orphan branch detection — run `git branch -r | grep claude/`
   at session start per SESSION_STATE_SURFACE.md protocol
   (read-only git command, zero write side effects)
```

```
REQUIRES GOVERNANCE:
- STATUS.md auto-update hooks (write authority: who triggers updates?)
- Canonical state synchronization across sessions
- Notification/push system on HEALTH state changes
- Multi-session STATUS.md aggregation (parallel session root file)
```

---

## OPEN ITEMS FROM SPRINT

```
ITEM                STATUS          OWNER
──────────────────────────────────────────────────────────────
STATUS.md v2 live   not yet written   Claude (sandbox) or
at repo root        (spec done)       pending governance approval

M29 registration    not registered    Claude — add to
(worker proxy gate) gate is informal  BUILD_PLAN_MICHAEL.md

Telemetry tooling   not started       future layer
(7 overlay signals) design complete

Relay reset script  not started       future layer
(RELAY_RESET.md)    protocol defined

Gate timestamp      not wired         future layer
auto-write          spec complete
```

---

## SPRINT STATUS

```
Sandbox sprint:  COMPLETE
Docs shipped:    10
Commits:         10 (294415e → 9ec958d)
Branch:          claude/operational-hud-design-S1Eon
Next step:       freeze branch + return to main track
                 first action on main: register M29, fix worker proxy 400
```
