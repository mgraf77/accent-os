# N=2 EXPERIMENT — RUN 3 CORRIDOR
> AccentOS — Cohort-4 register() additions. Repeatability run.
> Written: 2026-05-11 · Status: PENDING
> Protocol: N2_EXPERIMENT_PROTOCOL.md (v2, hardening rules HR-1 + HR-2 active)

---

## REALITY AUDIT

| Claim | Status |
|-------|--------|
| Run 3 corridor defined | EXPERIMENTAL |
| Batch definitions and SCI pre-check | PROVEN (pre-checked before corridor written) |
| Run 3 outcome | UNPROVEN — pending execution |

---

## RUN 3 CLASSIFICATION

- **Objective:** Repeatability — validate Run 2 pattern under another low/zero-SCI batch
- **Task:** Add `register({name, provides, consumes})` to 12 more modules (Cohort-4)
- **Batch A:** 6 modules (pure-compute / analytics group)
- **Batch B:** 6 modules (standalone data modules group)
- **Cross-batch SCIs detected in pre-check:** 0
- **AI incidents carried:** 1 (AI-1: openVendorScoreCsvPaste — not in Run 3 batch)
- **Entry gate:** `grep -rn "^register(" js/ | grep -v shell_utils | wc -l` → 28
- **Exit gate:** → 40

**What Run 3 is:** A repeatability measurement. Same conditions as Run 2 (zero-SCI batch). Confirms whether coordination_events=6 and near-zero variable OCL are stable, not run-dependent.

**What Run 3 is not:** A stress test. Not a harder semantic coupling challenge. Not a capability expansion. Not a path to N=3.

**Promotion criterion:** If Run 3 confirms coordination_events≈6 and SCI=0 with a low/zero-SCI batch, N=2 bounded supervised parallelism may be promoted from EXPERIMENTAL to PROVEN for this task class.

---

## SCI PRE-CHECK (HR-1 + HR-2 compliance — performed before corridor written)

**Batch A modules:** commission, pipeline_analytics, deal_optimizer, decision_engine, alerts, activity_feed

**Batch B modules:** deliveries, labels, marketing, competitive_pricing, showroom_displays, csv_import

**Cross-batch dependency check:**

```
Batch A → Batch B consumption: NONE
  commission:        consumes DEALS (pipeline_module — already registered, not in this batch) ✓
  pipeline_analytics: consumes DEALS (same) ✓
  deal_optimizer:    consumes CHANGELOG, VD (already registered) ✓
  decision_engine:   consumes DEALS, VD, QUOTES (already registered) ✓
  alerts:            consumes sbFetch, CU (shell/inline) ✓
  activity_feed:     consumes CHANGELOG (already registered), sbFetch, CU ✓

Batch B → Batch A consumption: NONE
  deliveries:        consumes CUSTOMERS, JOBS (already registered Run 2) ✓
  labels:            consumes sbFetch, CU, $ (shell/inline) ✓
  marketing:         consumes sbFetch, CU, $ (shell/inline) ✓
  competitive_pricing: consumes VD (inline), sbFetch, CU ✓
  showroom_displays: consumes VD (inline), bulkSel* (registered Run 2), sbFetch, CU ✓
  csv_import:        consumes $, toast, CU (shell/inline) ✓
```

**SCI pre-check verdict:** CLEAR. No cross-batch provides/consumes pre-declaration required (HR-1 satisfied by absence).

**HR-2 check:** All provides[] entries below were verified against actual function declarations before being written into this corridor. `deal_optimizer` provides include `getAdaptiveTier` and `getChangeLog` — confirmed present at lines 160 and 286 respectively.

**Note:** Modules consuming already-registered globals (DEALS, CHANGELOG, CUSTOMERS, JOBS, VD) are not SCI incidents. SCI only applies to cross-batch-within-this-run dependencies.

---

## BATCH DEFINITIONS

### BATCH A — Pure-Compute / Analytics (Branch A)

**Target files:**
```
js/commission.js
js/pipeline_analytics.js
js/deal_optimizer.js
js/decision_engine.js
js/alerts.js
js/activity_feed.js
```

**Planned register() calls (read-verified):**
```javascript
// js/commission.js
register({ name: 'commission', provides: ['commission','_renderCommissionInner'], consumes: ['DEALS','CU','sbFetch','sbConfigured','$','esc','toast'] });

// js/pipeline_analytics.js
register({ name: 'pipeline_analytics', provides: ['pipeline_analytics','openPipelineAnalytics'], consumes: ['DEALS','$','esc'] });

// js/deal_optimizer.js
register({ name: 'deal_optimizer', provides: ['deal_optimizer','renderDealOptimizer','getAdaptiveTier','getChangeLog','saveChangeLog'], consumes: ['CHANGELOG','VD','DEALS','$','esc','toast'] });

// js/decision_engine.js
register({ name: 'decision_engine', provides: ['decisionengine','decision_engine','computeSalesDecisions'], consumes: ['DEALS','VD','QUOTES','CU','$','esc'] });

// js/alerts.js
register({ name: 'alerts', provides: ['alerts','ALERTS','sbLoadAlerts','sbInsertAlert','sbUpdateAlertStatus','alertsUnreadCount'], consumes: ['sbFetch','sbConfigured','CU','$','esc','toast'] });

// js/activity_feed.js
register({ name: 'activity_feed', provides: ['activity_feed','AF_AUDITS','AF_PIPELINE','sbLoadAuditLog','sbLoadPipelineEvents','renderActivityFeed'], consumes: ['sbFetch','sbConfigured','CU','CHANGELOG','$','esc','toast'] });
```

**Insertion anchors:** After header comment line(s) on each file. Verify with `head -5 [file]` before writing.

**Rollback (Batch A):**
```bash
git revert [batch-a-commit-hash]
```

---

### BATCH B — Standalone Data Modules (Branch B)

**Target files:**
```
js/deliveries.js
js/labels.js
js/marketing.js
js/competitive_pricing.js
js/showroom_displays.js
js/csv_import.js
```

**Planned register() calls (read-verified):**
```javascript
// js/deliveries.js
register({ name: 'deliveries', provides: ['deliveries','DELIVERIES','sbLoadDeliveries','sbSaveDelivery'], consumes: ['sbFetch','sbConfigured','CU','CUSTOMERS','JOBS','$','esc','toast'] });

// js/labels.js
register({ name: 'labels', provides: ['labels','LABEL_BATCHES'], consumes: ['sbFetch','sbConfigured','CU','$','esc','toast'] });

// js/marketing.js
register({ name: 'marketing', provides: ['marketing','MARKETING_CAMPAIGNS','MARKETING_ASSETS','sbLoadMarketingCampaigns'], consumes: ['sbFetch','sbConfigured','CU','$','esc','toast'] });

// js/competitive_pricing.js
register({ name: 'competitive_pricing', provides: ['competitive','COMPETITOR_PRICES','sbLoadCompetitorPrices','sbSaveCompetitorPrice','sbDeleteCompetitorPrice'], consumes: ['sbFetch','sbConfigured','CU','VD','$','esc','toast'] });

// js/showroom_displays.js
register({ name: 'showroom_displays', provides: ['showroomdisplays','SHOWROOM_DISPLAYS','sbLoadShowroomDisplays','sbSaveShowroomDisplay'], consumes: ['sbFetch','sbConfigured','CU','VD','$','esc','toast','bulkSelRegister','bulkSelBar','bulkSelHeaderCheckbox','bulkSelCheckbox'] });

// js/csv_import.js
register({ name: 'csv_import', provides: ['csvImportFlow','csvEnumNormalizer','csvNumberNormalizer'], consumes: ['$','toast','CU'] });
```

**Insertion anchors:** After header comment line(s) on each file. Verify with `head -5 [file]` before writing.

**Rollback (Batch B):**
```bash
git revert [batch-b-commit-hash]
```

---

## BRANCH SETUP

```
Branch A:  claude/setup-codex-integration-gMAyH  (current HEAD: 4cdceb0)
Branch B:  new branch from Branch A HEAD          (name: claude/cohort4-reg-batch-b-n2)

Branch B creation:
  git checkout -b claude/cohort4-reg-batch-b-n2
  git push -u origin claude/cohort4-reg-batch-b-n2
```

---

## ENTRY GATE

```bash
grep -rn "^register(" js/ | grep -v shell_utils | wc -l   # → 28
ls js/commission.js js/pipeline_analytics.js js/deal_optimizer.js js/decision_engine.js js/alerts.js js/activity_feed.js
ls js/deliveries.js js/labels.js js/marketing.js js/competitive_pricing.js js/showroom_displays.js js/csv_import.js
grep -rn "^register(" js/commission.js js/pipeline_analytics.js js/deal_optimizer.js js/decision_engine.js js/alerts.js js/activity_feed.js js/deliveries.js js/labels.js js/marketing.js js/competitive_pricing.js js/showroom_displays.js js/csv_import.js 2>/dev/null || echo "0 pre-registered"
```

---

## EXIT GATE

```bash
grep -rn "^register(" js/ | grep -v shell_utils | wc -l   # → 40
grep -rn "^register(" js/ | grep -v shell_utils            # inspect all entries
```

Expected: 40 = 28 (existing) + 6 (Batch A) + 6 (Batch B)

---

## MEASUREMENT LOG TEMPLATE

```
RUN 3 EXPERIMENT TIMING

Experiment start:             [HH:MM]
Freeze cutoff:                [HH:MM]  (= start + 2:00)
Branch A entry gate actual:   [HH:MM]  result: [count]  ✓/✗
Branch B entry gate actual:   [HH:MM]  result: [count]  ✓/✗
Branch A first IN_PROGRESS:   [HH:MM]
Branch B first IN_PROGRESS:   [HH:MM]
Branch A COMMITTED:           [HH:MM]  commit: [hash]
Branch B COMMITTED:           [HH:MM]  commit: [hash]
Merge complete:               [HH:MM]  commit: [hash]
Exit gate actual:             [count]  ✓/✗
```

**Telemetry counters (initialize at T+0:00):**
```
context_switches:         0
uncertainty_incidents:    0
ambiguity_incidents (AI): 1  ← AI-1 carried (pre-resolved, not in batch — no action)
state_drift (SDI):        0
SCI (semantic collision): 0  ← pre-check confirmed 0 cross-batch deps
interruptions:            0
coordination_events:      0
```

**Repeatability hypothesis — expected Run 3 vs Run 2:**
| Metric | Run 2 actual | Run 3 target | Pass condition |
|--------|-------------|--------------|---------------|
| context_switches | 1 | ≤2 | ✓ if ≤2 |
| ambiguity (AI) | 0 | 0 | ✓ if 0 |
| SCI | 0 | 0 | ✓ if 0 (pre-checked clean) |
| interruptions | 0 | 0 | ✓ if 0 |
| coordination_events | 6 | 5–7 | ✓ if within ±1 of Run 2 |
| exit gate | 28 ✓ | 40 ✓ | ✓ if passes |

**Promotion criterion:** If all pass conditions met → promote N=2 to PROVEN for this task class.

---

## STOP CONDITIONS

Same as Run 2. No additions — no scope expansion.

- Any target file missing → stop
- register() already in a target file → skip, log as pre-condition note
- SCI discovered during execution → stop both, log, pre-declare (HR-1), resume
- Dead reference found in any provides[] → remove, log as AI incident (HR-2)
