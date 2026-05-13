# AccentOS — System State
_Overwritten on major state transitions. Not append-only._
_Last updated: 2026-05-13 — RUNTIME_CONSOLIDATION_V1_

---

## Runtime State

| Layer | State | Version / Detail |
|---|---|---|
| **SPA** | LIVE | v6.10.75 · accent-os.pages.dev |
| **Cloudflare Worker** | LIVE | v3-env-fallback · env_key_set=true confirmed |
| **AI Auth** | LIVE | ANTHROPIC_API_KEY bound · env key active |
| **Supabase** | LIVE | hsyjcrrazrzqngwkqsqa · RLS active |
| **GitHub Actions** | LIVE | deploy-worker.yml · CF_API_TOKEN + CF_ACCOUNT_ID set |
| **integration/reconcile** | MERGED/OBSOLETE | Worker v3 active; branch fully integrated |

---

## Branch State

| Branch | Commits ahead of main | Status |
|---|---|---|
| `claude/audit-repository-Fg9xI` (remote: accent-work) | ~17 | Active dev — runtime consolidation |
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
| WORKER_BUILD | 2026-05-11 (hardcoded — KI-002) |
| env_key_set | true (ANTHROPIC_API_KEY bound) |
| Deployed | LIVE — GitHub Actions workflow active |
| Probe URL | GET https://accentos-anthropic-proxy.mgraf77.workers.dev/ |

---

## Module Rollout State

See `module_modes.json` for per-module rollout status.

Active: Dashboard, Pipeline, Customers, Quotes, Jobs, POs, Trade Partners, Warranty, Showrooms, Labels, Deliveries, Decision Engine, Competitive Pricing, Demand Forecast, Alerts, My Tasks, Knowledge Engine, Vendor Ranking, Change Log, Calendar, Marketing Hub, Activity Feed, Reports, Portal Preview, Health Check, Roadmap, Mgmt Dashboard, Rep Outreach, Internal Meetings, Settings.

Blocked on M-tasks: E-Commerce (M04+M05), GA4 (M06), Klaviyo (M09), Windward (M03+M10).

---

## Performance Baseline

| Metric | Baseline | Signal |
|---|---|---|
| Hydration time | ~1,500–2,500ms | `window.__AOS_RUNTIME__.hydrate.ms` |
| Worker probe | ~200–600ms | `window.__AOS_RUNTIME__.worker.probe_ms` |
| index.html size | ~756 KB | Split trigger at 900 KB |
| External modules | 37 files | Verified by scripts/status.sh |

---

## Known Issues

See `KNOWN_ISSUES.md` for the active register.

---

## Next State Transitions

| Transition | Trigger | Expected result |
|---|---|---|
| Run M01 + M02 SQL | Michael runs in Supabase | RLS + 18 core tables live |
| Run M29 SQL | Michael runs in Supabase | Marketing schema live |
| Module extraction | index.html approaches 850 KB | Decomp plan in docs/decomp/ |
