# AccentOS — Current Priorities
_Last updated: 2026-05-13_

> Live priority tracker. Updated at session start when context shifts. Always read in conjunction with BUILD_PLAN_CLAUDE.md (which tracks specific task completion) and BUILD_PLAN_MICHAEL.md (which tracks Michael's open items).

---

## Status Legend

| Symbol | Meaning |
|---|---|
| 🟢 | Active — work this now |
| 🟡 | Ready — can start, not urgent |
| 🔴 | Blocked — waiting on external input |
| ✅ | Done — completed, not to be re-done |
| ⏸️ | Paused — was in progress, paused for context switch |

---

## Tier 1 — Critical Path (Do These First)

| # | Priority | Task | Status | Blocked by |
|---|---|---|---|---|
| 1 | Worker v3 deploy + key binding | Operator must redeploy Cloudflare Worker and verify ANTHROPIC_API_KEY secret is bound | 🔴 | Michael / ops |
| 2 | integration/reconcile → main PR | PR ready. All 13 commits verified. Merge triggers auto-deploy. | 🔴 | Michael approval |
| 3 | M29 — Marketing schema SQL | SQL migration not yet run; marketing module is blocked | 🔴 | Michael |

---

## Tier 2 — Active Autonomous Build (Next Sessions)

| # | Priority | Task | Status | Notes |
|---|---|---|---|---|
| 4 | Quote Save Atomicity (KI-002) | Wrap sbSaveQuote in Supabase RPC transaction | 🟡 | When quote volume warrants |
| 5 | Dashboard Pinning → S1 | Migrate localStorage pins to `user_module_overrides` Supabase table | 🟡 | Requires M30 SQL migration |
| 6 | index.html size (KI-001) | 755 KB → extract next 2–3 large inline sections | 🟡 | No blocker; incremental |
| 7 | MODULE_REGISTRY refactor | Collapse 4 shell touchpoints to 1 declarative entry | 🟡 | High leverage, safe to start |
| 8 | WORKER_BUILD auto-inject | `sed` in GitHub Actions to set build date | 🟡 | Next worker touch |
| 9 | Pure-compute S1 → S2 | Add empty-state guards to pipeline_analytics, decision_engine | 🟡 | Low priority |

---

## Tier 3 — Blocked on Michael (M-tasks)

| M-task | What's needed | Blocks |
|---|---|---|
| M03 | Windward ERP S5WebAPI credentials | ERP Live integration |
| M04 | BigCommerce API key | E-Commerce Command Center |
| M05 | Google Merchant Center (GMC) | E-Commerce Command Center |
| M06 | GA4 service account JSON | GA4 Integration |
| M09 | Klaviyo API key | Klaviyo Integration |
| M10 | Curtis outreach (distributor rep) | Vendor data enrichment |
| M18 | Website approval | AccentOS embed on public site |
| M29 | Marketing schema SQL run | Marketing hub schema |
| M30 | `user_module_overrides` SQL run | Dashboard pinning S0→S1 |

---

## Completed This Session

| Task | Commit | Description |
|---|---|---|
| Worker probe hardening | b858821 | Dual-probe, stale detection, error surfaces |
| status.sh rewrite | 95f806e | Color output, live worker probe, thresholds |
| Session doc bundle | 937d838 | SESSION_LOG, BUILD_INTELLIGENCE, WORK_IN_PROGRESS |
| Decomposition intelligence | b86ed7e | 5 new governance/ops docs |
| System state tracking | 4da6770 | SYSTEM_STATE, KNOWN_ISSUES, ACTION_LEDGER, RUNTIME_MAP |
| Health.js two-phase render | b9d9268 | Runtime + schema sections, severity model |
| Startup + deployment docs | 28c4c3d | STARTUP_PERFORMANCE_PROFILE, DEPLOYMENT_FORENSICS_GUIDE |
| Quote NaN safety | f12590d | 3 arithmetic fixes in updatePreview/renderLI/saveQ |
| Quote + stability docs | 1006869 | QUOTE_EDGE_CASE_MATRIX, FEATURE_STABILITY_MATRIX |
| Module governance docs | 1c61f59 | MODULE_DEPENDENCY_TIERS, RUNTIME_CRITICAL_PATHS, EXECUTION_LANE_OWNERSHIP |
| Survivability docs | 7336ada | RUNTIME_SURVIVABILITY_MODEL, FAILURE_RECOVERY_PATHS, DEGRADED_RUNTIME_SPEC |

---

## Session-End Sync (Do Before Committing WIP)

- [ ] Update `WORK_IN_PROGRESS.md` with final state
- [ ] Update `SESSION_LOG.md` with session summary
- [ ] Check off completed items in `BUILD_PLAN_CLAUDE.md`
- [ ] Append efficiency signals to `skills/efficiency-monitor/efficiency-log.md`
- [ ] Push to `origin/claude/audit-repository-Fg9xI`

---

_Read this at session start. Update whenever priorities shift._
