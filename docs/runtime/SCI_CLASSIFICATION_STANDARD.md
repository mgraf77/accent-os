# SCI CLASSIFICATION STANDARD
> AccentOS — Phase 2 Semantic Observability Prep Sprint
> Written: 2026-05-11 · Version: 1.0
> Purpose: Formalize the Semantic Collision Incident severity scale for orchestration risk assessment

---

## DEFINITION

A **Semantic Collision Incident (SCI)** is any dependency between modules in different execution batches that was not pre-declared before execution began, OR any dependency that exists but creates coordination overhead during execution.

SCIs come in four operational forms (from N2_EXPERIMENT_PROTOCOL.md):
1. **shared_runtime_assumption** — both modules assume the same global has a particular shape or value
2. **hidden_dependency_overlap** — Module A calls a function or reads a global that Module B provides, without pre-declaration
3. **init_coupling** — Module A requires Module B's initialization to have completed before Module A can function
4. **global_mutation_overlap** — both modules write to the same global

---

## SCI SEVERITY SCALE

### SCI-0 — No Incident

**Definition:** No cross-batch semantic dependencies exist. All consuming modules in both batches consume only from already-registered modules or infrastructure globals.

**OCL impact:** None. Fixed coordination cost (6 events) only.

**Batching safety:** Full. Pre-check is fast and confirms clean topology.

**Experimental confirmation:** Runs 2 and 3 both achieved SCI-0. These are the repeatability baseline.

**Examples:**
- calendar.js + knowledge_hub.js in same batch
- Any combination of Tier 1 modules from MODULE_ISOLATION_SCORING.md

---

### SCI-1 — Single Declared Cross-Batch Dependency

**Definition:** Exactly one cross-batch dependency exists and was pre-declared before execution began (HR-1 compliant). Both provides[] and consumes[] entries are accurate.

**OCL impact:** Low. One pre-declaration step added to corridor. No ambiguity during execution if declared correctly.

**Batching safety:** Viable with explicit pre-declaration. Do not proceed without writing the dependency in both modules' register() calls before the run begins.

**Expected coordination amplification:** +1–2 coordination events (pre-declaration step + verification at entry gate).

**Examples:**
- deliveries.js (consumes CUSTOMERS from customers.js) if customers is in a different batch
- digest.js (consumes computeDailyBrief from dashboard_module) if dashboard is in a different batch

**Protocol requirement:** HR-1 — pre-declare in corridor document. Both provides[] and consumes[] verified against actual file contents (HR-2).

---

### SCI-2 — Multiple Declared Cross-Batch Dependencies (2–3)

**Definition:** 2–3 cross-batch dependencies exist, all pre-declared. Each is individually manageable but the combination requires careful pre-check.

**OCL impact:** Moderate. Pre-check labor increases. Each dependency is a potential ambiguity source during execution if any pre-declaration is inaccurate.

**Batching safety:** Viable but requires a more thorough pre-check pass. Higher probability that one declaration is slightly off.

**Expected coordination amplification:** +2–4 coordination events. Possible mid-run SCI discovery if one dep was missed.

**Examples:**
- deal_optimizer.js if batched against a module that provides any of: CHANGELOG, VD, DEALS
- decision_engine.js if batched against a module that provides any of: DEALS, VD, QUOTES

**Protocol requirement:** Full SCI pre-check table in corridor. All 3 deps enumerated with provider module, consuming module, and the specific symbol. HR-2 applied to all three.

---

### SCI-3 — High Cross-Batch Coupling (4–7 deps or chain depth ≥ 2)

**Definition:** 4–7 cross-batch dependencies exist, OR a transitive dependency chain of depth ≥ 2 is present.

**OCL impact:** High. Pre-check becomes a multi-step audit. Risk of missing one dep during pre-check is significant. Mid-run SCI discovery probable.

**Batching safety:** Possible only with an exhaustive corridor pre-check that explicitly maps every dependency. Highly inadvisable to batch this module with any module in its dependency chain.

**Expected coordination amplification:** +4–6 coordination events, potentially plus 1–2 mid-run SCI incidents.

**Examples:**
- vendors_overflow.js: 7+ declared cross-module deps across 5 provider modules
- dashboard_module.js: consumes from 6 modules (DEALS, STAGES, VD, weightedScore, CHANGELOG, CAT_DEFS)

**Protocol requirement:** Full SCI pre-check table + MODULE CONTRACT review. Consider splitting into smaller batches instead of running SCI-3 pair.

---

### SCI-4 — Systemic Coupling (8+ deps or circular dependency or global_mutation_overlap)

**Definition:** 8+ cross-batch dependencies, OR a global mutation overlap (both modules write to same global), OR a circular dependency where Module A → Module B → Module A.

**OCL impact:** Very high. Pre-check is unreliable at this scale. Execution will surface new SCIs that were not caught in pre-check. Coordination overhead approaches the cost of sequential execution.

**Batching safety:** Do not batch at N=2. The parallel execution cost exceeds the benefit. Run sequentially or redesign the module boundaries before attempting parallel execution.

**Expected coordination amplification:** +6–10 coordination events. Expected mid-run SCI incidents ≥ 2.

**Examples:**
- vendor_scoring_helpers paired with vendor_scoring (shared CHANGELOG/sbAppendChangelog mutual dependency)
- Any two modules that both mutate VD if VD is a mutable shared global

**Protocol requirement:** Do not proceed. Redesign module boundaries or run sequentially.

---

## SCI IMPACT TABLE

| Class | Deps | OCL Mult | Pre-check cost | Mid-run risk | Batching verdict |
|-------|------|---------|----------------|--------------|-----------------|
| SCI-0 | 0 | 1.0× | Minimal | None | Safe |
| SCI-1 | 1 | ~1.1× | Low | Very low | Safe with pre-decl |
| SCI-2 | 2–3 | ~1.2× | Medium | Low | Viable with care |
| SCI-3 | 4–7 | ~1.5× | High | Moderate | Inadvisable |
| SCI-4 | 8+ | ~2×+ | Very high | High | Do not batch |

---

## APPLYING THE STANDARD

### At corridor design time (pre-check)

1. For each module in Batch A, check its consumes[] against Batch B's provides[].
2. For each match, classify the SCI:
   - How many? → determines SCI class
   - Is it declared? → HR-1 compliance
   - Does the function actually exist? → HR-2 compliance
3. Record total SCI count for the run. SCI-0 is the target for repeatability runs.

### At run time (incident logging)

If a new SCI is discovered during execution (a dep was missed in pre-check):
1. Stop both branches.
2. Log the incident: module, symbol, provider, consumer, SCI form.
3. Pre-declare both sides (HR-1 retroactive).
4. Resume only after both register() calls are updated.
5. The run's final SCI count includes all discovered + pre-declared incidents.

### For batch composition decisions

Use the SCI class to filter batch candidates:
- Use MODULE_ISOLATION_SCORING.md Tier 1 modules for zero-SCI target runs.
- Use SCI class to predict risk when mixing Tier 1 with Tier 2 modules.
- Never pair Tier 4 modules with any other module in a different batch.

---

## RUN HISTORY — SCI ACTUALS

| Run | Batch combination | Pre-declared SCIs | Discovered SCIs | Total | Class |
|-----|------------------|--------------------|----------------|-------|-------|
| 1 | Cohort-2 (mixed coupling) | 4 | 1 (SCI-5, during) | 5 | SCI-3 |
| 2 | Cohort-3 (zero-SCI design) | 0 | 0 | 0 | SCI-0 |
| 3 | Cohort-4 (zero-SCI design) | 0 | 0 | 0 | SCI-0 |

Run 1 demonstrated: SCI-3 class conditions produce elevated OCL, ambiguity, and at least one mid-run discovery.
Runs 2–3 demonstrated: SCI-0 class conditions produce near-zero variable OCL. Repeatable.
