# AOS Module Registry — Clean Freeze Artifact
> State as of 2026-05-10. Branch: claude/setup-codex-integration-gMAyH.
> Commit: 2358b7b

---

## What Was Built

### shell_utils.js (commit 38df8bc)
Extracted from index.html UTILS block (lines 771-823, 53 lines verbatim).

**Provides (global scope):**
- `$` — getElementById shorthand
- `qsa` — querySelectorAll shorthand
- `esc` — HTML entity escape
- `v` — form value helper
- `csvStringify` — RFC 4180 CSV formatter
- `csvDownload` — triggers browser download of CSV rows
- `toast` — dedup toast notification (v6.10.57 implementation)
- `openModal` — opens the shared overlay modal
- `closeModal` — closes the shared overlay modal

**Script tag position:** FIRST in external module list (line 1204, before all other modules).

**Safety proof:** All utilities are referenced only inside function bodies throughout
the entire codebase — no top-level calls in any inline or external script. Safe to
externalize under the DOMContentLoaded-deferred BOOT architecture.

### AOS_REGISTRY + register() (commit be2a46d)
Added to shell_utils.js after utility definitions.

**Behavior:**
- `window.AOS_REGISTRY = {}` — plain object, DevTools-inspectable
- `window.register(def)` — stores `{name, provides[], consumes[]}` in registry
- Warns (console.warn) on duplicate module names
- Warns (console.warn) on unresolved consumes at registration time
- DOMContentLoaded hook runs final cross-check and logs `[AOS] Registry: [...]`
- Zero enforcement, zero lifecycle, zero throws

### First Cohort Registrations (commit 2358b7b)
`register()` call added to top of each module file (after header comment, before first declaration).

| Module | provides | consumes |
|---|---|---|
| digest | generateDailyDigest, showDailyDigest | computeDailyBrief, weightedScore |
| health | health | sbFetch |
| quick_actions | toggleQuickActions, qaActivate | goTo |

---

## Verification Checklist

```bash
# Shell utils removed from inline:
grep -n "function toast\|const \$\b\|function openModal" index.html  # expect 0

# Shell utils in module:
grep -c "^function\|^const" js/shell_utils.js  # expect ~10

# Registry visible:
grep -n "AOS_REGISTRY\|window.register" js/shell_utils.js  # expect 2

# First cohort registered:
grep -rn "^register(" js/  # expect 3 results
```

---

## What Was NOT Done

- No auth extraction
- No sidebar generation
- No orchestration features
- No lifecycle enforcement
- No ESM/build tooling
- No runtime wording in any output
- No autonomous wording
- No workers, queues, or supervisors

---

## Current index.html State

- Lines: **1,258** (down from 7,175 original)
- Reduction: **−82.4%**
- All remaining inline content is synchronous global infrastructure

---

## Next Packet: PHASE_A_STAGE2_REGISTER_COHORT2

```
══════════════════════════════════════════════════════════════
NEXT PROMPT — Cohort-2 Module Registrations
══════════════════════════════════════════════════════════════

Packet: PHASE_A_STAGE2_REGISTER_COHORT2
Branch: claude/setup-codex-integration-gMAyH
Prereq: PHASE_A_STAGE2_REGISTER_SUBSTRATE complete (commit 2358b7b)

Context:
AOS_REGISTRY substrate is live (window.AOS_REGISTRY, window.register()).
First cohort (digest, health, quick_actions) is registered.
Cohort 2 expands coverage to the Phase 1 decomposition modules.

Mission:
Add register() declarations to ALL 13 Phase 1/1.5 extracted modules.
Metadata-only — no behavior changes, no logic changes, no extraction.

Target modules (13 total):
  vendors_module.js, vendor_scoring.js, quotes_module.js,
  dashboard_module.js, mgmt_module.js, pipeline_module.js,
  repoutreach_module.js, settings_module.js, knowledge_module.js,
  vendors_overflow.js, vendor_filters.js, vendor_scoring_helpers.js,
  supabase_categories.js

For each module:
1. Read the file header + first ~30 lines to identify:
   - Public functions (provides[])
   - Global dependencies it calls from shell (consumes[])
2. Add register({name, provides:[], consumes:[]}) after the header comment
3. name = filename without .js (e.g. 'vendors_module')
4. provides = public page function + key public helpers
5. consumes = globals it calls that are now in shell_utils.js or are
   declared shell infrastructure (sbFetch, VD, CHANGELOG, etc.)

Rules:
- console.warn only — no throws (already in substrate)
- No logic changes
- No renames
- No new files
- No extraction work

Commit structure:
- One commit per logical group (e.g. vendor cluster, page modules)
- Or single commit for all 13 if clean

Read docs/runtime/CLEAN_FREEZE_PHASE_A_STAGE2.md for full substrate spec.

Forbidden:
- workers, queues, supervisors
- runtime/autonomous wording
- orchestration expansion
- auth extraction
- strict enforcement
- ESM/build tooling

Rollback: git revert <commit> --no-edit

══════════════════════════════════════════════════════════════
```
