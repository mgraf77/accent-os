# AccentOS — System State
_Overwritten on major state transitions. Not append-only._
_Last updated: 2026-05-13 — operational hardening session_

---

## Runtime State

| Layer | State | Version/Detail |
|---|---|---|
| **SPA** | LIVE | v6.10.75 · accent-os.pages.dev |
| **Cloudflare Worker** | PENDING DEPLOY | v3-env-fallback in repo; stale v1/v2 live until integration/reconcile → main merge |
| **AI Auth** | PARTIAL | env_key_set=true on secrets; worker not yet redeployed |
| **Supabase** | LIVE | hsyjcrrazrzqngwkqsqa · RLS active |
| **GitHub Actions** | CONFIGURED | deploy-worker.yml present; secrets confirmed |
| **integration/reconcile** | READY | 13 commits ahead of main; awaiting Michael approval to merge |

---

## Branch State

| Branch | Commits ahead of main | Status |
|---|---|---|
| `claude/audit-repository-Fg9xI` (remote: accent-work) | 12 | Active dev — operational hardening |
| `integration/reconcile` | 13 | Merge-ready; awaiting approval |
| `accent-work-514226236373803311` (Jules) | 1 | Integrated via cherry-pick into reconcile |
| `main` | 0 | Production — protected |

---

## Database State

| Migration | Status | Tables |
|---|---|---|
| M01 (RLS tightening) | PENDING MICHAEL | RLS policies |
| M02 (core schema) | PENDING MICHAEL | 18 tables |
| M21–M44 | Applied | All feature tables |
| M29 (marketing) | PENDING MICHAEL | marketing_campaigns, marketing_assets |

---

## Worker State

| Field | Value |
|---|---|
| WORKER_VERSION | v3-env-fallback |
| WORKER_BUILD | 2026-05-11 |
| Repository worker | `worker/anthropic-proxy.js` |
| Deployed worker | v1/v2 (stale) — until integration/reconcile merges |
| CF_API_TOKEN | Set in GitHub repo secrets |
| CF_ACCOUNT_ID | Set in GitHub repo secrets |
| ANTHROPIC_API_KEY | Bound in Cloudflare (confirmed) |

---

## Module Rollout State

See `module_modes.json` for per-module rollout status.

Active modules: Dashboard, Pipeline, Customers, Quotes, Jobs, POs, Trade Partners, Warranty, Showrooms, Labels, Deliveries, Decision Engine, Competitive Pricing, Demand Forecast, Alerts, My Tasks, Knowledge Engine, Vendor Ranking, Change Log, Calendar, Marketing Hub, Activity Feed, Reports, Portal Preview, Health Check, Roadmap, Mgmt Dashboard, Rep Outreach, Internal Meetings, Settings.

Blocked on M-tasks: E-Commerce (M04+M05), GA4 (M06), Klaviyo (M09), Windward (M03+M10).

---

## Performance Baseline

| Metric | Baseline | Captured |
|---|---|---|
| Hydration time | ~1,500–2,500ms (typical) | Via `window.__AOS_HYDRATE_MS__` |
| Worker probe | ~200–600ms (typical) | Via `window.__AOS_WORKER_PROBE_MS__` |
| index.html size | ~750 KB | Split trigger at 900 KB |
| External modules | 36 files, ~14,000 lines | Grows with each extraction |

---

## Known Issues

See `KNOWN_ISSUES.md` for the current issue register.

---

## Next State Transitions

| Transition | Trigger | Expected result |
|---|---|---|
| Merge integration/reconcile → main | Michael approves PR | Worker redeployed; SPA updated; AI fully operational |
| Run M01 + M02 SQL | Michael runs in Supabase | RLS + 18 core tables live |
| Run M29 SQL | Michael runs in Supabase | Marketing schema live |
| Add CF secrets (done) | Already complete | GitHub Actions can deploy |
