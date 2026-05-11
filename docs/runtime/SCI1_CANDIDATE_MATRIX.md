# SCI=1 CANDIDATE MATRIX
> AccentOS — Absorb Phase Quick-Wins Sprint
> Written: 2026-05-11 · Version: 1.0
> Purpose: Identify the cleanest SCI=1 contrast experiment candidates from the registered module substrate
> Status: ANALYSIS ONLY — No corridor built. No experiment run.

---

## SCOPE

This document identifies module pairs where exactly one declared cross-batch DEP-1 dependency exists. The goal is to select the cleanest SCI=1 setup for the next contrast experiment — one where the pre-check produces exactly one SCI, the dep type is well-understood, and the modules are otherwise high-IQS.

**This document does NOT:**
- Design the experiment corridor
- Implement any batch orchestration
- Make any changes to the runtime engine
- Schedule the experiment

---

## SCI=1 CLASSIFICATION

A batch qualifies as SCI=1 if:
- Exactly one declared cross-batch DEP-1 dependency exists between the two batches
- No undeclared cross-batch deps (D2=3 for both modules, or all undeclared deps resolved)
- The dep is a direct, hard-call relationship (not advisory or soft)
- Neither module has SCI-2+ transitive risk from the dep chain

---

## CANDIDATE SELECTION CRITERIA

Ranked by "corridor cleanliness":
1. **Dep count:** Exactly 1 cross-batch dep (ideally 0 transitive cascade)
2. **IQS quality:** Both modules IQS ≥ 67 after sprint hardening
3. **Dep type:** DEP-1 (hard function call or global read)
4. **Module pair SCI class:** SCI=1 with no ambiguity about additional hidden deps
5. **Empirical contrast value:** Pair produces a clear before/after signal vs. SCI=0 runs

---

## CANDIDATE MATRIX

### Tier A: Recommended — Clean, single DEP-1, high confidence

| # | Consumer Module | Provider Module | Cross-Dep Symbol | Dep Type | Consumer IQS | Provider IQS | Notes |
|---|----------------|----------------|-----------------|----------|------|------|-------|
| **A-1** | deliveries | customers | CUSTOMERS | DEP-1 (global read) | 67 | 85 | **Top candidate.** Single declared dep. deliveries reads CUSTOMERS to join customer name on delivery records. customers provides only CUSTOMERS from this pair. |
| **A-2** | commission | pipeline_module | DEALS, STAGES | DEP-1 (global read) | 72 | 81 | Two cross-batch deps, not one — disqualifies as SCI=1. Listed for comparison. Would be SCI=2. |
| **A-3** | digest | dashboard_module | computeDailyBrief | DEP-1 (function call) | 46 | 63* | Single dep. But digest has IQS=46 (Tier 3) and init-chain coupling to dashboard. *Dashboard updated to 63 post-sprint. |

*Post-sprint IQS after CAT_DEFS and VD fix.

### Tier B: Viable — One declared dep, but lower IQS or more complexity

| # | Consumer Module | Provider Module | Cross-Dep Symbol | Dep Type | Consumer IQS | Provider IQS | Notes |
|---|----------------|----------------|-----------------|----------|------|------|-------|
| **B-1** | pipeline_analytics | pipeline_module | DEALS, STAGES | DEP-1 | 72 | 81 | Two cross-batch deps — SCI=2, not SCI=1. Listed for completeness. |
| **B-2** | decision_engine | quotes_module | QUOTES | DEP-1 | 52 | 74 | Single dep (QUOTES). Consumer IQS=52 is low. Manageable SCI=1 if pipeline confirms QUOTES is the only cross-dep. |
| **B-3** | jobs | customers | CUSTOMERS | DEP-1 | 85 | 85 | Single dep. Both high IQS. But jobs also reads DEALS (pipeline_module) — confirm no DEALS in same batch. |

### Tier C: Not recommended for SCI=1 experiment

| # | Consumer Module | Provider Module | Reason not recommended |
|---|----------------|----------------|------------------------|
| C-1 | vendors_overflow | vendor_scoring_helpers | Multiple cross-deps (6+). SCI≥3. |
| C-2 | dashboard_module | vendor_scoring_helpers | Cross-domain, multiple deps. SCI=2+. |
| C-3 | vendors_module | vendor_scoring_helpers | Undeclared deps, deep init chain. |
| C-4 | deal_optimizer | vendor_scoring_helpers | 3-way CHANGELOG split. Too complex. |
| C-5 | digest | dashboard_module | Consumer IQS=46, init coupling (D5=1). |

---

## RECOMMENDED CANDIDATE: A-1 (deliveries × customers)

**Setup:**
- Batch X: `deliveries`
- Batch Y: some SCI-0 module (e.g., `calendar`, `knowledge_hub`)
- Cross-dep: `deliveries` reads `CUSTOMERS` (provided by `customers`)
- `customers` runs in a separate baseline batch

**Why this is the cleanest SCI=1 setup:**
1. `deliveries` has IQS=67 and only one declared cross-batch dep: CUSTOMERS
2. `customers` has IQS=85. It is a high-Tier-2 module with clean provides/consumes.
3. The dep is a simple global read (not a function call with side effects)
4. Neither module has init-time coupling to the other
5. No transitive cascades: CUSTOMERS is owned by customers, not re-exported through a chain
6. The SCI is visible: any agent working on `deliveries` must know `customers` is loaded first

**Expected pre-check output:**
```
SCI pre-check for batch [deliveries, ...]
  deliveries.consumes: [..., 'CUSTOMERS', ...]
  CUSTOMERS provider: customers (different batch)
  SCI count: 1
  SCI class: SCI-1 (single declared DEP-1, no transitive cascade)
  Verdict: PROCEED WITH DECLARATION
```

**What the experiment would measure:**
- Does one declared DEP-1 cross-batch dep produce observable variable OCL vs. SCI=0 runs?
- Is the coordination overhead proportional to SCI count (linear) or does it show threshold behavior?
- Does the SCI pre-check declaration step itself add fixed cost?

---

## PRE-CONDITIONS FOR RUNNING THE EXPERIMENT

Before scheduling the SCI=1 contrast experiment, verify:

| Pre-condition | Status |
|---------------|--------|
| deliveries.js register() complete and accurate | CONFIRMED (registered, pre-sprint) |
| customers.js register() complete and accurate | CONFIRMED (pre-sprint) |
| CUSTOMERS declared in deliveries.consumes[] | CONFIRMED (pre-sprint) |
| No undeclared deps in deliveries.js | NEEDS VERIFICATION — Run D2 audit on deliveries.js |
| No undeclared deps in customers.js | NEEDS VERIFICATION — Run D2 audit on customers.js |
| CAT_DEFS / VD substrate hardened (would affect pre-check accuracy) | COMPLETE (this sprint) |
| SCI=1 corridor design session completed | NOT YET |

**Estimated readiness:** One short audit + corridor design session.

---

## ALTERNATE CANDIDATES IF A-1 IS DEFERRED

If `deliveries × customers` is deferred (e.g., those modules are needed for a production batch), the next cleanest option is:

**Option 2: jobs × customers**
- jobs has IQS=85. customers has IQS=85.
- jobs reads CUSTOMERS. Single declared cross-dep.
- Confirm jobs doesn't also read DEALS in the same batch context.

**Option 3: decision_engine × quotes_module**
- decision_engine has IQS=52 (lower, Tier 3).
- Single QUOTES cross-dep.
- Higher risk of hidden undeclared deps due to lower IQS — requires full D2 audit first.

---

## RELATIONSHIP TO CORRIDOR DESIGN

This document provides the *candidate selection*, not the corridor design. A corridor design session would:
1. Define the two agents' task scopes for the SCI=1 run
2. Specify the pre-check output format for the SCI=1 declaration step
3. Define what "measuring OCL" means for a 1-SCI run vs. 0-SCI baseline
4. Set the comparison hypothesis and success criteria

Those steps are out of scope for this document.
