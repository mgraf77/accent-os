# FUTURE CORE CONCEPTS

> Lightweight placeholders for concepts that belong to the AgentOS Core future, not the
> AccentOS proving ground. **No implementation here.** Tags + intent + queue routing only.
> tag: CORE  · queue: Q4 (Vision)

## Strategic Context (compressed)
- AccentOS is now the **incubation / proving-ground deployment**.
- Long-term direction: **AgentOS Core** as a generalized substrate for orchestration,
  governance, memory/runtime, telemetry, evolutionary coordination.
- Future deployments expected on top of AgentOS Core: AccentOS, MichaelOS, BetIQ, …
- AccentOS is **NOT** the permanent core. Future clean-room extraction is anticipated.
- Implication: do **not** optimize for permanent AccentOS coupling. Tag everything
  per `policies/ARCHITECTURE_TAGS.md`.

## Concept Placeholders

### CP-1 — Temporal / Bottleneck Awareness (TOR)  [Q4 Vision · FUTURE CORE CONCEPT]
Future runtime that observes time-shaped signals across orchestration:
- task duration tracking
- queue aging
- session stall awareness
- bottleneck awareness
- cadence awareness
- runtime pacing
- escalation timing
- orchestration load awareness

**Status at P1:** placeholder only. Do not build.
**DER entry:** der-0002 (Q4 Vision).
**Intersections:** governance_lag (M5) and orchestration_load (M11) are early proxies
that may inform a future TOR; they remain inside METRICS_REGISTER for now.

### CP-2 — Evolution Governance Runtime (EGR)  [Q4 Vision · FUTURE CORE CONCEPT]
Future runtime that governs distributed deployment evolution safely:
- deployment lineage
- selective propagation
- governed evolution
- telemetry abstraction
- mutation sandboxing
- deployment sovereignty

**Status at P1:** placeholder only. Do not build.
**DER entry:** der-0003 (Q4 Vision).
**Intersections:** MUTATION_POLICY + ROLLOUT_PLAN are single-deployment scaffolding
that an EGR would generalize across deployments. Keep them deployment-local at P1.

## What "Placeholder" Means Here
- The concept is **named** so future ideas can reference a stable id (CP-1, CP-2).
- The intent is **frozen** at the level of bullet points; no expansion this cycle.
- No code, no schemas, no governance edits derived from these placeholders at P1.
- Routing for any related idea: append to DER under Q4 with `prerequisites: CP-1` or
  `CP-2` so the lineage is preserved.

## Anti-Patterns (specific to future-core thinking)
- **Premature generalization.** Do not refactor AccentOS-specific code "to make AgentOS
  Core easier later." Tag, don't refactor. Extraction happens later.
- **Specification creep.** A placeholder that grows past 1 page in this file becomes a
  liability. Keep it terse; details go to DER.
- **Cross-deployment leakage.** Do not write code in this repo that assumes other
  deployments exist. Tag accordingly with `BUSINESS_SPECIFIC` or `DEPLOYMENT`.
