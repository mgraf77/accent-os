# DEPENDENCY CONTRACT TEMPLATE
> AccentOS — Phase 1 Semantic Topology Hardening Sprint
> Written: 2026-05-11 · Template version: 1.0
> Purpose: Formalize the semantic contract for each module beyond the minimal register() call

---

## PURPOSE

The register() substrate captures name, provides[], and consumes[]. This template extends that baseline into a full dependency contract that makes initialization assumptions, global mutation behavior, ownership boundaries, and SCI risk classification explicit.

**Use this template when:**
- Registering a new module for the first time
- Auditing an existing module for SCI pre-check
- Designing a new run corridor batch
- Documenting a module after a semantic incident

**Do not use this template for:**
- Runtime enforcement (observational only)
- Replacing the register() call (this supplements it)
- Speculative future behavior (describe only current state)

---

## CONTRACT TEMPLATE

```markdown
# MODULE CONTRACT: [module_name]
> File: js/[module_name].js
> Version: v[N.M.P]
> Contract written: [YYYY-MM-DD]
> Last verified: [YYYY-MM-DD]

## IDENTITY

| Field | Value |
|-------|-------|
| Module name | [name as in register()] |
| File | js/[module_name].js |
| Domain | [vendor / pipeline / customer / infrastructure / utility / analytics] |
| Class | A (touches index.html) / B (js/ only) |

## REGISTER() CALL

```javascript
register({
  name: '[name]',
  provides: ['fn1', 'GLOBAL1', 'fn2'],
  consumes: ['DEP1', 'DEP2', 'fn3']
});
```

## OWNERSHIP

| Aspect | Owner | Notes |
|--------|-------|-------|
| Primary data global | [GLOBAL_NAME or NONE] | [describe mutation model] |
| Runtime state | [describe] | [singleton / per-user / per-session] |
| Persistence layer | [Supabase / localStorage / none] | [table name if applicable] |
| UI responsibility | [page or sub-component] | [describe] |

## PROVIDES — DETAIL

| Symbol | Type | Description | Stability |
|--------|------|-------------|-----------|
| `fn1` | function | [what it does, side effects] | stable / volatile |
| `GLOBAL1` | array/object | [what it holds, mutation model] | stable / volatile |

## CONSUMES — DETAIL

| Symbol | Provider module | Type | Hard/Soft | Init-time? |
|--------|----------------|------|-----------|-----------|
| `DEP1` | [module_name] | global | hard | yes |
| `fn3` | [module_name] | function | soft | no |

**Hard dependency:** Module will error or produce wrong output if this is not present.
**Soft dependency:** Module degrades gracefully if absent (typeof guard or fallback used).
**Init-time:** Must be present before this module's first function call / page load.

## GLOBALS TOUCHED

| Global | Read/Write | Owns? | Notes |
|--------|-----------|-------|-------|
| `GLOBAL1` | write | yes | Initialized on load, mutated by sbLoad* calls |
| `DEP1` | read | no | Read-only consumer |
| `window.someState` | write | yes | Side effect — documents window mutation |

## INITIALIZATION ASSUMPTIONS

List any implicit load-order dependencies NOT captured in consumes[]:

- [ ] Requires [ModuleX] to have run sbLoad* before first use
- [ ] Requires [GlobalY] to be non-null at page load time
- [ ] Assumes [FrameworkZ] is already in the DOM
- [ ] Assumes CU.user_id is populated before first render

**Init coupling risk:** LOW / MEDIUM / HIGH

## SIDE EFFECTS

| Effect | Trigger | Scope | Notes |
|--------|---------|-------|-------|
| Writes to localStorage | saveMyTasks() | per-user | Key: accentos_[name]_[user_id] |
| Mutates window.goTo | module_modes wraps goTo | global | Intercepts navigation |
| Fires sbAuditLog | on save/delete | Supabase | audit_log table |

## SCI RISK CLASSIFICATION

| Dimension | Value |
|-----------|-------|
| SCI class | [SCI-0 / SCI-1 / SCI-2 / SCI-3 / SCI-4] |
| Safe to batch with infrastructure modules | YES / NO |
| Safe to batch with same-domain modules | YES / conditional / NO |
| Cross-batch dependency count | [N] |
| Initialization chain depth | [N] |
| Global mutation count | [N] |

**SCI risk summary:** [1-2 sentence plain description of what makes this module risky or safe]

## ROLLBACK CONCERNS

| Concern | Details |
|---------|---------|
| Reversible by git revert | YES / PARTIAL / NO |
| Supabase state side effects | YES (describe) / NO |
| localStorage side effects | YES (key) / NO |
| Other persistent mutations | [describe or NONE] |

## KNOWN ISSUES / OPEN QUESTIONS

- [ ] AI-[N]: [description of dead reference or ambiguity]
- [ ] Missing consumes declaration: [symbol]
- [ ] Undeclared global mutation: [symbol]
- [ ] Unclear provider: [symbol] consumed but no module declares it
```

---

## COMPLETED CONTRACT EXAMPLES

### Example: calendar.js (low-complexity reference)

```markdown
# MODULE CONTRACT: calendar
> File: js/calendar.js · Contract written: 2026-05-11

## IDENTITY
Domain: operations · Class: B

## REGISTER() CALL
register({
  name: 'calendar',
  provides: ['calendar','CAL_EVENTS','sbLoadCalendarEvents','sbSaveCalendarEvent','sbDeleteCalendarEvent'],
  consumes: ['sbFetch','sbConfigured','CU','$','esc','toast']
});

## OWNERSHIP
Primary data global: CAL_EVENTS (array, loaded on page visit)
Persistence: Supabase (calendar_events table)
UI: calendar page

## SCI RISK CLASSIFICATION
SCI class: SCI-0
Safe to batch with infrastructure modules: YES
Safe to batch with same-domain modules: YES
Cross-batch dependency count: 0
Initialization chain depth: 1 (sbConfigured check only)
Global mutation count: 1 (CAL_EVENTS)

SCI risk summary: No unique semantic dependencies. Zero cross-batch coupling risk.
Infrastructure-only consumes. Ideal batching candidate.
```

### Example: vendors_overflow.js (high-complexity reference)

```markdown
# MODULE CONTRACT: vendors_overflow
> File: js/vendors_overflow.js · Contract written: 2026-05-11

## IDENTITY
Domain: vendor · Class: B

## SCI RISK CLASSIFICATION
SCI class: SCI-3 (multiple undeclared + declared cross-module dependencies)
Safe to batch with infrastructure modules: NO (high transitive coupling)
Safe to batch with same-domain modules: CONDITIONAL (must batch with all upstream providers)
Cross-batch dependency count: 7+ (CHANGELOG, getChangeLog, computeVendorTier, weightedScore,
  scoreColor, dispScore, fmt$, colSummary, CAT_DEFS*)
Initialization chain depth: 3 (vendor_scoring → vendor_scoring_helpers → vendors_overflow)

SCI risk summary: Highest coupling-density module in the vendor domain. Consumes from 5+
provider modules. CAT_DEFS consumption is undeclared. Cannot be safely batched with any
module that could be in a different batch from its upstream chain. Treat as a batch of one
or batch together with its entire upstream dependency chain.
```

---

## FIELD GUIDANCE

**SCI class assignment:**
- SCI-0: Zero cross-module semantic deps. Infrastructure only.
- SCI-1: 1 unique cross-module dependency. Manageable with pre-declaration.
- SCI-2: 2–3 unique cross-module deps. Requires careful SCI pre-check.
- SCI-3: 4–7 unique cross-module deps. High OCL amplification risk.
- SCI-4: 8+ unique cross-module deps or transitive chain depth ≥4. Do not batch.

**Undeclared consumption:**
If a module uses a symbol not in its consumes[], mark it with asterisk and note "undeclared" in the SCI risk section. This is a contract deficiency, not a blocker — but it means the register() substrate is misleading for that module.

**Index.html-hosted globals:**
CAT_DEFS, REP_DIRECTORY, getVPCats, goTo, VD — these have no module provider. If a module consumes them, list in consumes[] with a comment "(index.html-hosted)" to distinguish from module-provided dependencies.
