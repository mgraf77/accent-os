# N=2 EXPERIMENT — RUN 2 CORRIDOR
> AccentOS — Cohort-3 register() additions. Second supervised dual-Train run.
> Written: 2026-05-11 · Status: PENDING
> Protocol: N2_EXPERIMENT_PROTOCOL.md (v2, hardening rules HR-1 + HR-2 active)

---

## REALITY AUDIT

| Claim | Status |
|-------|--------|
| Run 2 corridor defined | EXPERIMENTAL |
| Batch definitions and SCI pre-check | PROVEN (pre-checked before corridor written) |
| Run 2 outcome | UNPROVEN — pending execution |

---

## RUN 2 CLASSIFICATION

- **Task:** Add `register({name, provides, consumes})` to 12 more modules (Cohort-3)
- **Batch A:** 6 modules (entity data + UI helper group)
- **Batch B:** 6 modules (utility/isolated group)
- **Cross-batch SCIs detected in pre-check:** 0
- **AI incidents carried from Run 1:** 1 (AI-1: openVendorScoreCsvPaste — see below)
- **Entry gate:** `grep -rn "^register(" js/ | grep -v shell_utils | wc -l` → 16
- **Exit gate:** → 28

**Scientific contrast with Run 1:** Run 1 had 5 SCIs (high semantic coupling). Run 2 has 0 pre-execution SCIs (clean disjointness). This tests whether OCL and coordination overhead drop when semantic coupling is eliminated.

---

## AI INCIDENT CARRY-FORWARD (from Run 1)

```
AI-1 (carried)
  type:     dead_reference
  severity: LOW (pre-existing bug, no functional impact on registry)
  location: js/vendors_module.js — calls openVendorScoreCsvPaste() which does not exist anywhere
  grep:     grep -rn "openVendorScoreCsvPaste" js/ → returns only the call site, no definition
  status:   DOCUMENTED. Not included in vendors_module provides[].
  Run 2 action: vendors_module.js is NOT in Run 2 batch — no action required during Run 2.
                Resolve in a separate cleanup pass before Run 3 if vendors_module is in Run 3 batch.
```

---

## SCI PRE-CHECK (HR-1 compliance — performed before corridor written)

**Methodology:** Read top-level declarations from all 12 target files. Cross-reference provides[] vs consumes[] across batches.

**Finding: ZERO cross-batch dependencies.**

```
Batch A → Batch B consumption: NONE
  customers:    consumes bulkSel* (bulk_select — SAME BATCH A) ✓
  jobs:         consumes bulkSel* (bulk_select — SAME BATCH A) ✓
  trade_partners: consumes bulkSel* (bulk_select — SAME BATCH A) ✓
  warranty:     consumes CUSTOMERS (customers — SAME BATCH A) ✓
  employees:    no cross-batch deps ✓
  bulk_select:  consumes $, toast (shell/inline) ✓

Batch B → Batch A consumption: NONE
  my_tasks:         consumes CU, $, esc, toast (shell/inline) ✓
  saved_filters:    consumes $, toast, CU (shell/inline) ✓
  module_modes:     consumes CU, $, toast (shell/inline) ✓
  calendar:         consumes sbFetch, CU, $, esc, toast (shell/inline) ✓
  knowledge_hub:    consumes sbFetch, CU, $, esc, toast (shell/inline) ✓
  internal_meetings: consumes sbFetch, CU, $, esc, toast (shell/inline) ✓
```

**SCI pre-check verdict:** CLEAR. No cross-batch provides/consumes pre-declaration required (HR-1 satisfied by absence).

**HR-2 check:** All provides[] entries below were verified against actual grep output before being written into this corridor.

---

## BATCH DEFINITIONS

### BATCH A — Entity Data + UI Helper (Branch A)

**Target files:**
```
js/customers.js
js/jobs.js
js/trade_partners.js
js/employees.js
js/warranty.js
js/bulk_select.js
```

**Planned register() calls (read-verified):**
```javascript
// js/customers.js
register({ name: 'customers', provides: ['customers','CUSTOMERS','CUSTOMER_INTERACTIONS','sbLoadCustomers','sbSaveCustomer','sbDeleteCustomer','sbLoadCustomerInteractions'], consumes: ['sbFetch','sbConfigured','CU','$','esc','toast','bulkSelRegister','bulkSelBar','bulkSelHeaderCheckbox','bulkSelCheckbox'] });

// js/jobs.js
register({ name: 'jobs', provides: ['jobs','JOBS','sbLoadJobs','sbSaveJob','sbBulkSaveJobs','sbDeleteJob'], consumes: ['sbFetch','sbConfigured','CU','$','esc','toast','bulkSelRegister','bulkSelBar','bulkSelHeaderCheckbox','bulkSelCheckbox'] });

// js/trade_partners.js
register({ name: 'trade_partners', provides: ['trade_partners','TRADE_PARTNERS','sbLoadTradePartners','sbSaveTradePartner','sbDeleteTradePartner','sbBulkSaveTradePartners'], consumes: ['sbFetch','sbConfigured','CU','$','esc','toast','bulkSelRegister','bulkSelBar','bulkSelHeaderCheckbox','bulkSelCheckbox'] });

// js/employees.js
register({ name: 'employees', provides: ['employees','EMPLOYEES','EMPLOYEE_SCORES','sbLoadEmployees','sbLoadEmployeeScores','sbSaveEmployee'], consumes: ['sbFetch','sbConfigured','CU','$','esc','toast'] });

// js/warranty.js
register({ name: 'warranty', provides: ['warranty','WARRANTY_CLAIMS','sbLoadWarrantyClaims','sbSaveWarrantyClaim','sbDeleteWarrantyClaim'], consumes: ['sbFetch','sbConfigured','CU','CUSTOMERS','$','esc','toast'] });

// js/bulk_select.js
register({ name: 'bulk_select', provides: ['bulkSelRegister','bulkSelGetIds','bulkSelClear','bulkSelToggle','bulkSelToggleAll','bulkSelCheckbox','bulkSelHeaderCheckbox','bulkSelBar','bulkSelInvoke'], consumes: ['$','toast'] });
```

**Insertion anchors:** After header comment line on each file. Verify with `head -2 [file]` before writing.

**Rollback (Batch A):**
```bash
git revert [batch-a-commit-hash]
# or manual: remove register() lines from each of the 6 files
```

---

### BATCH B — Utility / Isolated (Branch B)

**Target files:**
```
js/my_tasks.js
js/saved_filters.js
js/module_modes.js
js/calendar.js
js/knowledge_hub.js
js/internal_meetings.js
```

**Planned register() calls (read-verified):**
```javascript
// js/my_tasks.js
register({ name: 'my_tasks', provides: ['my_tasks','MY_TASKS','loadMyTasks','saveMyTasks'], consumes: ['CU','$','esc','toast'] });

// js/saved_filters.js
register({ name: 'saved_filters', provides: ['getSavedFilters','saveFilterSet','deleteFilterSet'], consumes: ['$','toast','CU'] });

// js/module_modes.js
register({ name: 'module_modes', provides: ['module_modes','MODULE_MODES','USER_OVERRIDES','canSeeModule'], consumes: ['CU','$','toast'] });

// js/calendar.js
register({ name: 'calendar', provides: ['calendar','CAL_EVENTS','sbLoadCalendarEvents','sbSaveCalendarEvent','sbDeleteCalendarEvent'], consumes: ['sbFetch','sbConfigured','CU','$','esc','toast'] });

// js/knowledge_hub.js
register({ name: 'knowledge_hub', provides: ['knowledge_hub','ARTICLES','sbLoadArticles','sbSaveArticle','sbDeleteArticle'], consumes: ['sbFetch','sbConfigured','CU','$','esc','toast'] });

// js/internal_meetings.js
register({ name: 'internal_meetings', provides: ['internal_meetings','IM_MEETINGS'], consumes: ['sbFetch','sbConfigured','CU','$','esc','toast'] });
```

**Insertion anchors:** After header comment line on each file. Verify with `head -4 [file]` before writing.

**Rollback (Batch B):**
```bash
git revert [batch-b-commit-hash]
# or manual: remove register() lines from each of the 6 files
```

---

## BRANCH SETUP

```
Branch A:  claude/setup-codex-integration-gMAyH  (current HEAD: f9c8b60)
Branch B:  new branch from Branch A HEAD          (name: claude/cohort3-reg-batch-b-n2)

Branch B creation:
  git checkout f9c8b60
  git checkout -b claude/cohort3-reg-batch-b-n2
  git push -u origin claude/cohort3-reg-batch-b-n2
```

**Disjoint ownership confirmation:**
```bash
# Both must return 0 lines (files are new — no prior history on either branch)
git log --oneline -- js/customers.js js/jobs.js js/trade_partners.js js/employees.js js/warranty.js js/bulk_select.js | grep "cohort3-reg-batch-b"
git log --oneline -- js/my_tasks.js js/saved_filters.js js/module_modes.js js/calendar.js js/knowledge_hub.js js/internal_meetings.js | grep "cohort3-reg-batch-b"
```

---

## ENTRY GATE

```bash
grep -rn "^register(" js/ | grep -v shell_utils | wc -l   # → 16 (current state)
ls js/customers.js js/jobs.js js/trade_partners.js js/employees.js js/warranty.js js/bulk_select.js   # all exist
ls js/my_tasks.js js/saved_filters.js js/module_modes.js js/calendar.js js/knowledge_hub.js js/internal_meetings.js  # all exist
grep -rn "^register(" js/customers.js js/jobs.js js/trade_partners.js js/employees.js js/warranty.js js/bulk_select.js js/my_tasks.js js/saved_filters.js js/module_modes.js js/calendar.js js/knowledge_hub.js js/internal_meetings.js  # → 0 lines (none pre-registered)
```

→ If register count > 16: some cohort-3 modules already have register() — check which, skip those.
→ If any module file missing: stop.
→ If any target file already has register(): skip that file, log as pre-condition note.

---

## EXECUTION SEQUENCE

```
T+0:00   Both entry gates run simultaneously.
         Record: actual count, any pre-condition notes.

T+0:05   Branch A: read all 6 file headers (head -4), confirm insertion anchors.
         Branch B: read all 6 file headers (head -4), confirm insertion anchors.

T+0:10   Branch A: write register() to all 6 Batch A files.
         Branch B: write register() to all 6 Batch B files.
         (If single-operator: A first, then context switch to B — record switch as CO-EVENT)

T+0:20   Branch A: verify 22 register() calls on Branch A (16 existing + 6 new).
         Branch B: verify 22 register() calls on Branch B (16 existing + 6 new).

T+0:25   Branch A: commit Batch A.
         Branch B: commit Batch B.

T+0:30   CHECKPOINT 1: both COMMITTED or explain why not.

T+0:35   Merge sequence: cherry-pick Batch B into Branch A.
         Run exit gate: 28.

T+0:40   Experiment end — record all telemetry.
```

---

## EXIT GATE

```bash
grep -rn "^register(" js/ | grep -v shell_utils | wc -l   # → 28
grep -rn "^register(" js/ | grep -v shell_utils            # inspect all entries
```

Expected: 28 = 16 (existing) + 6 (Batch A) + 6 (Batch B)

---

## MEASUREMENT LOG TEMPLATE (fill during execution)

```
RUN 2 EXPERIMENT TIMING

Experiment start:             [HH:MM]
Freeze cutoff:                [HH:MM]  (= start + 2:00)
Checkpoint 1 due:             [HH:MM]  (= start + 0:30)
Merge checkpoint:             [fill when both COMMITTED]
Experiment end:               [fill at close]

Branch A entry gate actual:   [HH:MM]  result: [count]  ✓/✗
Branch B entry gate actual:   [HH:MM]  result: [count]  ✓/✗
Branch A first IN_PROGRESS:   [HH:MM]
Branch B first IN_PROGRESS:   [HH:MM]
Branch A COMMITTED:           [HH:MM]  commit: [hash]
Branch B COMMITTED:           [HH:MM]  commit: [hash]
Merge complete:               [HH:MM]  commit: [hash]
Exit gate actual:             [count]  ✓/✗
```

**Telemetry counters (initialize at T+0:00, update live):**
```
context_switches:         0
uncertainty_incidents:    0
ambiguity_incidents (AI): 1  ← AI-1 carried from Run 1 (pre-resolved — no action needed in Run 2)
state_drift (SDI):        0
SCI (semantic collision): 0  ← pre-check confirmed 0 cross-batch deps
interruptions:            0
coordination_events:      0
```

**Expected Run 2 vs Run 1 comparison:**
| Metric | Run 1 actual | Run 2 target | Hypothesis |
|--------|-------------|--------------|-----------|
| context_switches | 2 | ≤2 | Similar (same operator config) |
| ambiguity (AI) | 1 | 0 new | No dead refs in Run 2 batch |
| SCI | 5 | 0 | Clean batch selection eliminates pre-execution SCI |
| interruptions | 1 | 0 | Context window managed better with summary |
| coordination_events | 6 | ≤4 | Simpler task, fewer coordination needs |
| OCL signal | moderate | lower | Zero semantic coupling should reduce uncertainty |

---

## STOP CONDITIONS

- Any file in target list doesn't exist → stop, log as pre-condition failure
- A `register()` already exists in a target file → skip that file, log as pre-condition note
- `window.register` undefined in DevTools → stop, substrate broken
- Any register() call found in a wrong file (file not in this run's batch) → stop, investigate
- SCI discovered during execution → stop both branches, log as SCI incident, pre-declare per HR-1, then resume

---

## CORRIDOR EXIT

After exit gate passes (count = 28):

**Session log entry (append to SESSION_LOG.md):**
```
## N=2 EXPERIMENT RUN 2 — MEASUREMENT LOG · [date]

[fill telemetry block]

Batch A commit: [hash]
Batch B commit: [hash]
Merge commit:   [hash]
Exit gate: 28 ✓

Run 2 vs Run 1 comparison:
  [fill actual vs expected table]
```

**FEEDS INTO:** Run 3 corridor (defined after Run 2 telemetry analyzed).
Run 3 may use a different task type (not register() additions) to test whether OCL pattern holds across task categories.
