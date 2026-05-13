# AccentOS — Runtime Map
_Last updated: 2026-05-13_

---

## System Topology

```
                         ┌─────────────────────────────────────┐
                         │     Cloudflare Pages (CDN)          │
                         │     accent-os.pages.dev             │
                         │     Auto-deploys from: main         │
                         │     Deploy time: ~15s               │
                         └──────────────┬──────────────────────┘
                                        │  serves
                                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Browser (AccentOS SPA)                        │
│                    index.html + 36 js/modules                    │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │   Auth/     │  │   Global     │  │   Runtime Flags       │  │
│  │   Session   │  │   State      │  │   __AOS_WORKER_*      │  │
│  │   CU object │  │   VD,DEALS,  │  │   __AOS_HYDRATE_MS__  │  │
│  │   JWT token │  │   CUSTOMERS, │  │   __AOS_WORKER_       │  │
│  └──────┬──────┘  │   QUOTES...  │  │   PROBE_MS__          │  │
│         │         └──────┬───────┘  └───────────────────────┘  │
└─────────┼────────────────┼────────────────────────────────────── ┘
          │                │
          │ auth           │ REST API
          ▼                ▼
┌──────────────────────────────────────────────┐
│         Supabase PostgreSQL                   │
│         hsyjcrrazrzqngwkqsqa                  │
│                                              │
│  Auth service (/auth/v1/*)                   │
│  REST API (/rest/v1/*)                       │
│  44 migration files applied (M01–M44)        │
│  RLS: enabled on all tables                  │
└──────────────────────────────────────────────┘

          │ POST /v1/messages
          ▼
┌──────────────────────────────────────────────┐
│     Cloudflare Worker                         │
│     accentos-anthropic-proxy.mgraf77.         │
│     workers.dev                               │
│                                              │
│  Version: v3-env-fallback (repo)             │
│  Auth: env.ANTHROPIC_API_KEY (primary)       │
│        x-api-key header (fallback)           │
│  Deploy: GitHub Actions (on worker/** push)  │
└──────────────────────┬───────────────────────┘
                       │ POST /v1/messages
                       ▼
┌──────────────────────────────────────────────┐
│     Anthropic Claude API                      │
│     Model: claude-sonnet-4-5                 │
│     Used by: aiParseNotes, sendChat,         │
│              vendor AI detail               │
└──────────────────────────────────────────────┘
```

---

## URL Registry

| Endpoint | URL | Purpose |
|---|---|---|
| Production SPA | https://accent-os.pages.dev/ | Live app |
| Staging SPA | https://accent-os-staging.pages.dev/ | Staging |
| Worker | https://accentos-anthropic-proxy.mgraf77.workers.dev/ | AI proxy |
| Worker probe | `GET /` or `GET /v1/version` | Version + health |
| Worker AI | `POST /v1/messages` | AI calls |
| Supabase REST | `{SUPABASE_URL}/rest/v1/*` | Data API |
| Supabase Auth | `{SUPABASE_URL}/auth/v1/*` | Auth API |

---

## Network Request Classification

| Request | From | To | Auth | Frequency |
|---|---|---|---|---|
| Worker probe | SPA (boot IIFE) | Worker | None | Once per session |
| AI parse | SPA (aiParseNotes) | Worker → Anthropic | env key or x-api-key | On user action |
| AI chat | SPA (sendChat) | Worker → Anthropic | env key or x-api-key | On user message |
| Vendor AI | SPA (openVendorDetail) | Worker → Anthropic | env key or x-api-key | On vendor open |
| Session restore | SPA (tryRestoreSession) | Supabase Auth | JWT | Once per page load |
| Login | SPA (doLogin) | Supabase Auth | email+password | On login |
| sbLoad* | SPA (hydrateFromSupabase) | Supabase REST | anon key + JWT | Once per session |
| sbSave* | SPA (user actions) | Supabase REST | anon key + JWT | On save |
| Audit log | SPA (sbAuditLog) | Supabase REST | anon key + JWT | On significant actions |
| Google Fonts | Browser | fonts.googleapis.com | None | Once per page |

---

## localStorage Keys

| Key | Value | Owner | Purpose |
|---|---|---|---|
| `aos-api` | Anthropic API key (encrypted at rest) | Settings | User-supplied AI key |
| `aos-sb-url` | Supabase URL | Settings | Database URL |
| `aos-sb-key` | Supabase anon key | Settings | Database key |
| `aos-jwt` | Supabase JWT | Auth | Session token |
| `aos_kpi_snapped_YYYY-MM-DD` | `"1"` | KPI | Daily snap dedup |
| `aos_dash_pins_<uid>` | JSON array | Dashboard | Pinned module keys |
| `accentos_my_tasks_<uid>` | JSON array | My Tasks | Personal task list |
| `aos-chat-mode` | `"internal"` or `"customer"` | Chat | AI consultant mode |
| `aos_module_modes` | JSON object | Module Modes | Per-module rollout state cache |

---

## sessionStorage Keys

| Key | Value | Purpose |
|---|---|---|
| `aos-chat-mode` | `"internal"` or `"customer"` | AI chat mode (session-scoped) |

---

## Deployment Pipeline

```
Developer pushes to accent-work (local)
         │
         │ git push origin accent-work:claude/audit-repository-Fg9xI
         ▼
GitHub: origin/claude/audit-repository-Fg9xI
         │
         │ (Michael creates PR)
         ▼
GitHub PR: integration/reconcile → main
         │
         │ Merge
         ▼
GitHub: main branch updated
         │
         ├── Cloudflare Pages webhook ──→ Pages auto-deploys SPA (~15s)
         │
         └── GitHub Actions (if worker/** changed) ──→ wrangler deploy (~2min)
                                                   └──→ curl probe verify
```

---

## Module File Map (36 external modules)

| Module | File | Primary global | Lines |
|---|---|---|---|
| Customers | js/customers.js | CUSTOMERS | 873 |
| Employees | js/employees.js | EMPLOYEES | 406 |
| Knowledge Hub | js/knowledge_hub.js | ARTICLES | — |
| Jobs | js/jobs.js | JOBS | 615 |
| Purchase Orders | js/purchase_orders.js | PO_LINES, PO_ITEMS | 493 |
| Calendar | js/calendar.js | CALENDAR_EVENTS | 399 |
| Inventory | js/inventory.js | INVENTORY | 470 |
| CSV Import Helper | js/csv_import.js | csvImportFlow | 287 |
| Vendor Score Import | js/vendor_score_import.js | — | — |
| Price Book | js/price_book.js | (pure-compute) | — |
| Deal Optimizer | js/deal_optimizer.js | (pure-compute) | 303 |
| Trade Partners | js/trade_partners.js | TRADE_PARTNERS | 515 |
| Warranty | js/warranty.js | WARRANTY_CLAIMS | 487 |
| Showroom Displays | js/showroom_displays.js | SHOWROOM_DISPLAYS | 428 |
| Labels | js/labels.js | LABEL_BATCHES | — |
| Deliveries | js/deliveries.js | DELIVERIES | 406 |
| Decision Engine | js/decision_engine.js | (pure-compute) | — |
| Competitive Pricing | js/competitive_pricing.js | COMPETITOR_PRICES | 293 |
| Marketing | js/marketing.js | MARKETING_CAMPAIGNS | 556 |
| Alerts | js/alerts.js | ALERTS | 504 |
| Demand Forecast | js/demand_forecast.js | (pure-compute) | — |
| Global Search | js/global_search.js | openGlobalSearch | 403 |
| Reports | js/reports.js | (pure-compute) | — |
| Bulk Vendor Ops | js/bulk_vendor_ops.js | — | 356 |
| Activity Feed | js/activity_feed.js | — | — |
| Commission | js/commission.js | — | — |
| Pipeline Analytics | js/pipeline_analytics.js | openPipelineAnalytics | — |
| Quick Actions | js/quick_actions.js | — | — |
| Portal Preview | js/portal_preview.js | — | — |
| Health Check | js/health.js | — | — |
| Inventory Analytics | js/inventory_analytics.js | — | — |
| Digest | js/digest.js | — | — |
| My Tasks | js/my_tasks.js | MY_TASKS | — |
| Saved Filters | js/saved_filters.js | savedFiltersBar | — |
| Bulk Select | js/bulk_select.js | bulkSelBar | — |
| Module Modes | js/module_modes.js | applyModuleModesAfterHydrate | 486 |
| Internal Meetings | js/internal_meetings.js | INTERNAL_MEETINGS | 2,436 |

---

_Update when new modules are added, URLs change, or runtime topology changes._
