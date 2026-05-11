# MODULE ISOLATION SCORING
> AccentOS — Phase 1 Semantic Topology Hardening Sprint
> Written: 2026-05-11 · Version: 1.0
> Purpose: Predict orchestration viability from topology quality

---

## PURPOSE

This scoring system assigns each module an Isolation Quality Score (IQS) across seven dimensions. The IQS predicts:
- Safety as a batching candidate in future N=2 runs
- SCI risk if paired with another given module
- Architectural coupling debt
- Priority for future semantic hardening

**IQS is observational, not enforcement.** A low score is a signal, not a blocker.

---

## SCORING DIMENSIONS

Each dimension is scored 0–3 (0 = poor, 3 = ideal).

| Dimension | ID | Max | Weight | Description |
|-----------|----|----|--------|-------------|
| Provides declaration accuracy | D1 | 3 | 1× | Are all provides[] items actually defined in the file? |
| Consumes declaration completeness | D2 | 3 | 1× | Are all actual dependencies in consumes[]? |
| Global mutation count | D3 | 3 | 1× | How many globals does this module write to? |
| Hidden dependency count | D4 | 3 | 1.5× | How many undeclared deps exist (DEP-5, DEP-6)? |
| Initialization coupling | D5 | 3 | 1.5× | How deep is the init-order constraint chain? |
| Ownership clarity | D6 | 3 | 1× | Is it clear what this module owns and doesn't own? |
| Semantic isolation quality | D7 | 3 | 2× | Does the module have a coherent, bounded semantic domain? |

**Maximum raw score: 21. Weighted maximum: 27.**
**IQS = weighted sum / 27 × 100 (0–100 scale)**

---

## DIMENSION RUBRICS

### D1 — Provides Declaration Accuracy
- 3: All provides[] items exist in the file. No dead references.
- 2: 1 dead reference or minor discrepancy.
- 1: 2–3 dead references or significantly inaccurate.
- 0: Provides[] is materially wrong or missing.

### D2 — Consumes Declaration Completeness
- 3: All consumed symbols are in consumes[]. No hidden consumption.
- 2: 1–2 undeclared consumptions (minor).
- 1: 3–4 undeclared consumptions, or 1 critical undeclared dep.
- 0: Consumes[] is incomplete, missing multiple critical deps.

### D3 — Global Mutation Count
- 3: Writes to 0–1 globals. Clean ownership.
- 2: Writes to 2–3 globals.
- 1: Writes to 4–5 globals.
- 0: Writes to 6+ globals or mutates globals owned by other modules.

### D4 — Hidden Dependency Count
- 3: Zero hidden dependencies (all deps declared or infrastructure).
- 2: 1 hidden dep (index.html global used without declaration).
- 1: 2–3 hidden deps.
- 0: 4+ hidden deps or consumes DEP-5 shared-globals without acknowledgment.

### D5 — Initialization Coupling
- 3: No init-time dependencies on other modules. Can load in any order.
- 2: 1-deep init chain (depends on one module being initialized first).
- 1: 2-deep init chain.
- 0: 3+ deep init chain, or circular init dependency.

### D6 — Ownership Clarity
- 3: Module has a single clear domain. Obvious what it owns. No overlap with other modules.
- 2: Mostly clear, minor overlap with one adjacent module.
- 1: Shared ownership of a concept with another module (e.g., CHANGELOG 3-way split).
- 0: Unclear domain, ownership conflicts with multiple other modules.

### D7 — Semantic Isolation Quality
- 3: Module is a coherent unit. Could be extracted without refactoring consumers.
- 2: Mostly coherent, one external coupling that could be eliminated.
- 1: Tightly coupled to 2–3 external modules through semantic assumptions.
- 0: Cannot be understood in isolation. Deeply entangled with multiple modules.

---

## SCORED MODULES

### Tier 1 — High Isolation (IQS 80–100) — Safe batching candidates

| Module | D1 | D2 | D3 | D4(×1.5) | D5(×1.5) | D6 | D7(×2) | Weighted | IQS |
|--------|----|----|----|----|----|----|-----|--------|-----|
| calendar | 3 | 3 | 1 | 3 | 3 | 3 | 3 | 26 | **96** |
| knowledge_hub | 3 | 3 | 1 | 3 | 3 | 3 | 3 | 26 | **96** |
| marketing | 3 | 3 | 1 | 3 | 3 | 3 | 3 | 26 | **96** |
| labels | 3 | 3 | 1 | 3 | 3 | 3 | 3 | 26 | **96** |
| internal_meetings | 3 | 3 | 1 | 3 | 3 | 3 | 3 | 26 | **96** |
| employees | 3 | 3 | 1 | 3 | 3 | 3 | 3 | 26 | **96** |
| my_tasks | 3 | 3 | 1 | 3 | 3 | 3 | 3 | 26 | **96** |
| saved_filters | 3 | 3 | 1 | 3 | 3 | 3 | 3 | 26 | **96** |
| health | 3 | 3 | 0 | 3 | 3 | 3 | 3 | 25.5 | **94** |
| csv_import | 3 | 3 | 0 | 3 | 3 | 3 | 3 | 25.5 | **94** |
| settings_module | 3 | 3 | 0 | 3 | 3 | 3 | 3 | 25.5 | **94** |
| knowledge_module | 3 | 3 | 1 | 3 | 3 | 3 | 3 | 26 | **96** |
| module_modes | 3 | 3 | 1 | 3 | 3 | 2 | 2 | 22 | **81** |
| bulk_select | 3 | 3 | 0 | 3 | 3 | 3 | 3 | 25.5 | **94** |
| alerts | 3 | 3 | 2 | 3 | 3 | 3 | 3 | 26 | **96** |
| supabase_categories | 3 | 3 | 0 | 3 | 3 | 3 | 3 | 25.5 | **94** |

### Tier 2 — Moderate Isolation (IQS 55–79) — Batchable with pre-check

| Module | D1 | D2 | D3 | D4(×1.5) | D5(×1.5) | D6 | D7(×2) | Weighted | IQS |
|--------|----|----|----|----|----|----|-----|--------|-----|
| pipeline_module | 3 | 3 | 2 | 3 | 3 | 2 | 2 | 22 | **81** |
| customers | 3 | 3 | 2 | 3 | 3 | 3 | 2 | 23 | **85** |
| jobs | 3 | 3 | 2 | 3 | 3 | 3 | 2 | 23 | **85** |
| trade_partners | 3 | 3 | 2 | 3 | 3 | 3 | 2 | 23 | **85** |
| competitive_pricing | 3 | 2 | 2 | 2 | 3 | 3 | 2 | 21 | **78** |
| showroom_displays | 3 | 3 | 2 | 2 | 2 | 3 | 2 | 20.5 | **76** |
| warranty | 3 | 3 | 1 | 2 | 1 | 3 | 2 | 18 | **67** |
| commission | 3 | 3 | 1 | 3 | 1 | 3 | 2 | 19.5 | **72** |
| pipeline_analytics | 3 | 3 | 0 | 3 | 1 | 3 | 2 | 19.5 | **72** |
| activity_feed | 3 | 3 | 2 | 2 | 2 | 2 | 2 | 18.5 | **69** |
| quick_actions | 3 | 2 | 0 | 2 | 3 | 3 | 2 | 19.5 | **72** |
| quotes_module | 3 | 2 | 1 | 3 | 2 | 3 | 2 | 20 | **74** |
| repoutreach_module | 3 | 1 | 0 | 1 | 2 | 2 | 2 | 15 | **56** |
| deliveries | 3 | 3 | 2 | 2 | 1 | 3 | 2 | 18 | **67** |

### Tier 3 — Low Isolation (IQS 30–54) — High-care batching only

| Module | D1 | D2 | D3 | D4(×1.5) | D5(×1.5) | D6 | D7(×2) | Weighted | IQS |
|--------|----|----|----|----|----|----|-----|--------|-----|
| vendor_filters | 3 | 2 | 1 | 1 | 2 | 2 | 2 | 15 | **56** |
| decision_engine | 3 | 3 | 0 | 1 | 2 | 2 | 2 | 14 | **52** |
| deal_optimizer | 3 | 3 | 1 | 1 | 2 | 1 | 2 | 14 | **52** |
| digest | 3 | 3 | 0 | 2 | 1 | 3 | 1 | 12.5 | **46** |
| mgmt_module | 3 | 2 | 1 | 1 | 2 | 2 | 1 | 12.5 | **46** |
| vendor_scoring | 3 | 3 | 3 | 3 | 2 | 1 | 1 | 14.5 | **54** |

### Tier 4 — Very Low Isolation (IQS 0–29) — Do not batch without full chain analysis

| Module | D1 | D2 | D3 | D4(×1.5) | D5(×1.5) | D6 | D7(×2) | Weighted | IQS |
|--------|----|----|----|----|----|----|-----|--------|-----|
| dashboard_module | 3 | 1 | 1 | 0 | 1 | 2 | 1 | 9.5 | **35** |
| vendors_module | 2 | 1 | 1 | 0 | 1 | 1 | 1 | 7 | **26** |
| vendor_scoring_helpers | 3 | 1 | 2 | 0 | 1 | 1 | 1 | 8 | **30** |
| vendors_overflow | 3 | 1 | 2 | 0 | 0 | 1 | 0 | 5 | **19** |

---

## INTERPRETATION

**IQS ≥ 80:** Safe to include in any N=2 zero-SCI batch without additional pre-check beyond the standard corridor protocol.

**IQS 55–79:** Viable with SCI pre-check. Verify that all consumed symbols from other modules are already registered (not in the same batch). One SCI risk is manageable.

**IQS 30–54:** Requires full SCI pre-check and explicit consumes pre-declaration. May carry 2–3 SCIs by design. Do not batch with any of its provider modules.

**IQS < 30:** Do not batch without auditing the full transitive dependency chain. These modules have multiple undeclared deps, deep init chains, and/or ownership conflicts. Treat as an isolation improvement target before including in any parallel execution.

---

## IMPROVEMENT OPPORTUNITIES

Modules where targeted register() hardening would most improve IQS:

| Module | Pre-Sprint IQS | Action | Status |
|--------|-------------|--------|------------------|
| dashboard_module | 35 | Declare CAT_DEFS in consumes[]; document VD dependency | **DONE** (sprint 2026-05-11) |
| vendors_module | 26 | Declare openVendorScoreCsvPaste in consumes[] | **DONE** (sprint 2026-05-11) |
| vendor_scoring_helpers | 30 | Declare CAT_DEFS in consumes[]; clarify CHANGELOG ownership vs vendor_scoring | OPEN — CAT_DEFS already declared; CHANGELOG ownership split documented but not refactored |
| vendors_overflow | 19 | Declare CAT_DEFS in consumes[]; document full init-chain | **DONE** (sprint 2026-05-11) |
| repoutreach_module | 56 | Declare CAT_DEFS in consumes[] | **DONE** (sprint 2026-05-11) |
| vendor_filters | 56* | Declare getVPCats in consumes[] (*was miscategorized as Tier 3) | **DONE** (sprint 2026-05-11) |
| vendor_scoring | 54 | Declare getVPCats in consumes[] | **DONE** (sprint 2026-05-11) |

---

## POST-SPRINT UPDATE · 2026-05-11

### Updated scores after Quick-Wins Sprint

The following modules changed tiers after register() hardening:

| Module | Pre-Sprint IQS | Post-Sprint D2 | Post-Sprint D4 | Post-Sprint IQS | Tier Change |
|--------|---------------|---------------|---------------|----------------|------------|
| dashboard_module | 35 | 1→3 (CAT_DEFS declared) | 0→3 (hidden dep cleared) | **63** | 4→2 |
| vendors_module | 26 | 1→3 (openVendorScoreCsvPaste declared) | 0→3 (AI-1 resolved) | **59** | 4→2 |
| vendors_overflow | 19 | 1→2 (CAT_DEFS declared, other deps remain) | 0→2 (1 hidden dep cleared) | **41** | stays 3 |
| repoutreach_module | 56 | 1→3 (CAT_DEFS declared) | 1→3 (hidden dep cleared) | **72** | stays 2, higher score |
| vendor_filters | 56* | 2→3 (getVPCats declared) | 1→3 (hidden dep cleared) | **76** | correctly Tier 2 |
| vendor_scoring | 54 | was already 3; getVPCats now accurate | 3→3 | **54** | stays 3 (score correct) |

*vendor_filters was incorrectly placed in Tier 3 table in v1.0; IQS=56 is Tier 2.

### Newly registered modules (12 added this sprint)

Previously invisible to the substrate. IQS assigned at registration time.

#### Tier 1 additions (IQS ≥ 80)

| Module | D1 | D2 | D3 | D4(×1.5) | D5(×1.5) | D6 | D7(×2) | Weighted | IQS |
|--------|----|----|----|----|----|----|-----|--------|-----|
| inventory | 3 | 3 | 2 | 3 | 3 | 3 | 3 | 26.0 | **96** |
| purchase_orders | 3 | 3 | 2 | 3 | 2 | 3 | 3 | 24.5 | **91** |
| bulk_vendor_ops | 3 | 3 | 1 | 3 | 2 | 3 | 3 | 23.5 | **87** |
| demand_forecast | 3 | 3 | 0 | 3 | 2 | 3 | 3 | 22.5 | **83** |
| inventory_analytics | 3 | 3 | 0 | 3 | 2 | 3 | 3 | 22.5 | **83** |
| price_book | 3 | 3 | 0 | 3 | 2 | 3 | 3 | 22.5 | **83** |
| reports | 3 | 3 | 0 | 3 | 2 | 3 | 3 | 22.5 | **83** |
| global_search | 3 | 3 | 0 | 3 | 2 | 3 | 3 | 22.5 | **83** |
| vendor_score_import | 3 | 3 | 0 | 3 | 2 | 3 | 3 | 22.5 | **83** |
| portal_preview | 3 | 3 | 1 | 3 | 2 | 3 | 2 | 21.5 | **80** |
| trade_designer_portal | 3 | 3 | 1 | 3 | 2 | 3 | 2 | 21.5 | **80** |
| vendor_rep_portal | 3 | 3 | 1 | 3 | 2 | 3 | 2 | 21.5 | **80** |

**D5 note:** All new modules score D5=2 (not D5=3) because they read from globals provided by other modules (INVENTORY, VD, CUSTOMERS, etc.) — the data must be loaded before the page renders. This is a soft 1-deep init dependency, not a hard ordering violation, but it is declared.

**D3 note:** inventory scores D3=2 (writes INVENTORY global); purchase_orders scores D3=2 (writes POS + PO_LINES). Others write no globals.

### Updated Tier 1 count

Pre-sprint Tier 1 (IQS ≥ 80): **16** modules (15 original + 1 correction: pipeline_module is listed in Tier 2 table but scored 81)
Post-sprint Tier 1 (IQS ≥ 80): **28** modules (+12 new registrations)

The inventory domain (inventory, inventory_analytics, price_book, purchase_orders, demand_forecast) is now fully visible to the substrate and all 5 modules are Tier 1 — safe for zero-SCI batching.
