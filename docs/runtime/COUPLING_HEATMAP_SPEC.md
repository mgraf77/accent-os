# COUPLING HEATMAP SPEC
> AccentOS — Phase 2 Semantic Observability Prep Sprint
> Written: 2026-05-11 · Version: 1.0
> Status: SPEC ONLY — No implementation. No rendering. No visualization code.
> Purpose: Define scoring logic and visualization concepts for future coupling density visualization

---

## IMPORTANT SCOPE CONSTRAINT

This document is a **design specification**, not an implementation.

- NO canvas/SVG/D3 rendering code
- NO React/HTML component code
- NO data collection hooks
- NO dashboard pages

This spec exists so that a future implementation has a well-designed scoring model to target, rather than designing topology scoring ad-hoc.

---

## PURPOSE

A coupling heatmap would make the semantic dependency field visible at a glance. Without visualization, the topology exists only in text documents and requires careful reading to interpret. The heatmap spec defines:
- What to measure
- How to score it
- How to display it (conceptually)
- What orchestration risk overlays to show

---

## DATA SOURCE

The coupling heatmap is derived entirely from the AOS_REGISTRY (window.AOS_REGISTRY), populated by register() calls. No additional runtime collection is required for a static heatmap. Dynamic heatmaps (showing actual runtime coupling) would additionally require events from DEPENDENCY_VISIBILITY_EVENT_MODEL.md.

**Static heatmap:** Buildable today from register() substrate alone. Shows declared topology.
**Dynamic heatmap:** Requires runtime event model implementation. Shows actual exercised coupling.

This spec covers both, clearly marking which dimensions require runtime data.

---

## SCORING MODEL

### Cell Score: Module-to-Module Coupling Strength

For each pair (Module A, Module B), compute a coupling strength C(A→B):

```
C(A→B) = Σ weight(dep) for each dep in A.consumes[] where dep ∈ B.provides[]
```

Where dep weights are:

| Dep type | Weight |
|----------|--------|
| DEP-1 (hard) | 3.0 |
| DEP-2 (soft) | 1.5 |
| DEP-3 (runtime) | 2.0 |
| DEP-4 (init) | 3.5 |
| DEP-5 (shared-global) | 4.0 |
| DEP-6 (semantic) | 2.5 |
| DEP-7 (advisory) | 0.5 |
| DEP-8 (optional) | 0.0 |
| infrastructure (CU, $, esc, toast, sbFetch, sbConfigured) | 0.0 |

**Assumption:** Dep types are not currently stored in register(). For the static heatmap using current data, use a simplified model:
- Count non-infrastructure deps × 2.0 (flat weight)
- Penalty for undeclared deps: +1.0 per hidden dep

---

### Module Heat Score: Aggregate Coupling Density

For each module M, compute a heat score H(M):

```
H(M) = fan_out_score + fan_in_score + hidden_dep_penalty + init_chain_penalty

fan_out_score = number of unique provider modules M consumes from × 3
fan_in_score = number of modules that consume from M × 2
hidden_dep_penalty = undeclared_dep_count × 4
init_chain_penalty = init_chain_depth × 2
```

**Current computed values (static, from register() audit):**

| Module | Fan-out | Fan-in | Hidden | Init depth | H(M) |
|--------|---------|--------|--------|-----------|------|
| vendor_scoring_helpers | 2 | 7 | 1 (CAT_DEFS) | 1 | 6+14+4+2 = **26** |
| vendors_overflow | 5 | 1 | 1 (CAT_DEFS) | 3 | 15+2+4+6 = **27** |
| dashboard_module | 6 | 1 | 1 (CAT_DEFS) | 2 | 18+2+4+4 = **28** |
| vendors_module | 3 | 0 | 2 (AI-1, getVPCats) | 2 | 9+0+8+4 = **21** |
| pipeline_module | 0 | 5 | 0 | 0 | 0+10+0+0 = **10** |
| bulk_select | 0 | 4 | 0 | 0 | 0+8+0+0 = **8** |
| vendor_scoring | 1 | 2 | 0 | 0 | 3+4+0+0 = **7** |
| digest | 2 | 0 | 0 | 2 | 6+0+0+4 = **10** |
| deal_optimizer | 3 | 1 | 0 | 1 | 9+2+0+2 = **13** |
| calendar | 0 | 0 | 0 | 0 | **0** |
| knowledge_hub | 0 | 0 | 0 | 0 | **0** |
| marketing | 0 | 0 | 0 | 0 | **0** |

---

## VISUALIZATION CONCEPTS

### View 1: Coupling Matrix (Grid Heatmap)

**Layout:** N×N grid where N = registered module count.
**X axis:** Provider modules (sorted by fan-in score, highest left)
**Y axis:** Consumer modules (sorted by fan-out score, highest top)
**Cell color:** Coupling strength C(A→B) mapped to color scale
**Color scale:** white (0) → yellow (low) → orange (medium) → red (high)

**Expected hotspot cells:**
- dashboard_module × vendor_scoring_helpers: C=5+ (weightedScore, CHANGELOG)
- vendors_overflow × vendor_scoring_helpers: C=7+ (6 function deps)
- vendors_module × vendors_overflow: C=2 (exportCSV, openAddVendor)
- deliveries × customers: C=1 (CUSTOMERS)

**Infrastructure rows/columns:** Omit CU, $, esc, toast, sbFetch, sbConfigured from the grid (they add only noise).

---

### View 2: Coupling Bubble Chart

**Layout:** Each module is a bubble.
**Bubble size:** H(M) heat score
**Bubble color:** Tier classification from MODULE_ISOLATION_SCORING.md
  - Green: Tier 1 (IQS ≥ 80)
  - Yellow: Tier 2 (IQS 55–79)
  - Orange: Tier 3 (IQS 30–54)
  - Red: Tier 4 (IQS < 30)
**Position:** Group by domain cluster (vendor, pipeline, customer, operations, utility)
**Lines:** Drawn between modules with C(A→B) > 0. Line weight = coupling strength.

---

### View 3: Domain Cluster Map

**Layout:** Modules grouped by semantic domain. Domains as boxes.
**Within-domain connections:** Thin lines (same-domain coupling — lower SCI risk)
**Cross-domain connections:** Bold lines (cross-domain coupling — SCI risk signals)

**Expected domain clusters:**
- **Vendor domain:** vendor_scoring, vendor_scoring_helpers, vendors_module, vendors_overflow, vendor_filters, deal_optimizer, repoutreach_module
- **Pipeline domain:** pipeline_module, dashboard_module, mgmt_module, commission, pipeline_analytics, decision_engine, digest
- **Customer/ops domain:** customers, jobs, deliveries, warranty, trade_partners
- **Infrastructure:** bulk_select, csv_import, saved_filters, health, module_modes, settings_module
- **Content domain:** knowledge_hub, knowledge_module, calendar, internal_meetings, employees, marketing, my_tasks
- **Showroom domain:** showroom_displays, labels, competitive_pricing
- **Unregistered:** inventory, demand_forecast, inventory_analytics, price_book, purchase_orders, etc.

**Cross-domain connections (known):**
- vendors_overflow → deal_optimizer (cross: vendor → pipeline via getChangeLog)
- dashboard_module → vendor_scoring_helpers (cross: pipeline → vendor via weightedScore, CHANGELOG)
- mgmt_module → vendor_scoring_helpers (cross: pipeline → vendor via weightedScore)
- deliveries → customers, jobs (cross: ops → customer/ops)
- decision_engine → quotes_module (cross: pipeline → ordering via QUOTES)

---

## ORCHESTRATION RISK OVERLAYS

These are visual overlays that can be toggled on the heatmap to show specific risk dimensions.

### Overlay 1: SCI Risk Zones

Color each module border by its SCI class when paired with a selected reference module. When user clicks on Module A, show Module B's SCI class for the (A,B) pairing.

### Overlay 2: Init Chain Depth

Color modules by their initialization chain depth:
- White: depth 0 (loads independently)
- Yellow: depth 1
- Orange: depth 2
- Red: depth 3+

### Overlay 3: Substrate Completeness

Show which modules have:
- ✓ Registered
- ⚠ Registered but incomplete (dead refs, missing consumes)
- ✗ Unregistered

### Overlay 4: Batching Safety Groups

Given a proposed batch (list of modules), highlight:
- Green: Module is safe to include (no SCI with current batch)
- Yellow: Module has SCI-1 risk with current batch (declare and proceed)
- Red: Module has SCI-2+ risk with current batch (do not include without redesign)

---

## TOPOLOGY-DENSITY SCORING

For a given batch B of modules, compute the batch coupling density D(B):

```
D(B) = Σ C(A→X) for each A in B, for each X in B where X ≠ A

Normalized: D_norm(B) = D(B) / (|B| × (|B|-1))
```

D_norm(B) = 0.0 means zero internal coupling (ideal N=2 batch)
D_norm(B) = 1.0 means every module in the batch is coupled to every other module

**Experimental observations:**
- Runs 2–3 batches: D_norm ≈ 0.0 (zero-SCI design)
- Run 1 batch: D_norm > 0.0 (5 SCIs across a 13-module batch)

**Target for future runs:** D_norm(B) < 0.05 for any proposed batch before execution begins. Values above 0.05 require SCI pre-check review.

---

## IMPLEMENTATION NOTES (FOR FUTURE USE)

When implementing this spec:

1. Use AOS_REGISTRY as the data source. It's already populated by register() calls.
2. Add dep_type field to register() to enable weighted scoring (currently unweighted).
3. Build as a read-only diagnostic page, not a module configuration UI.
4. Static heatmap first, dynamic (runtime) heatmap later if event model is implemented.
5. No orchestration controls in the heatmap UI — visualization only.
