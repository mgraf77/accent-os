# SYSTEM_STATE.md — AccentOS Current System State
> Live snapshot of the system. Updated after every session that changes architecture, schema, or deployment state.

**Last updated:** 2026-05-08

---

## DEPLOYMENT

| Surface | URL | Status |
|---|---|---|
| Web App | https://accent-os.pages.dev | Live (Cloudflare Pages) |
| Anthropic Proxy Worker | https://accentos-anthropic-proxy.mgraf77.workers.dev | Deployed (pending redeploy for 2dca2a6) |
| Supabase DB | mgraf77.supabase.co | Live |

---

## CODEBASE STATE

| Item | State |
|---|---|
| index.html | 7,169 lines (718KB) — THE MONOLITH — do not heavily edit |
| js/ | 38 extracted module files (9 extracted v6.10.12, growing) |
| sql/ | M01–M40 migration files — pending Michael runs for most |
| worker/ | anthropic-proxy.js — deployed, 2dca2a6 NOT yet redeployed |
| wrangler.toml | Cloudflare Worker config — DO NOT TOUCH |
| ui/ | New in this session — isolated design system + prototype |
| docs/design/ | New in this session — design system documentation |

---

## ACTIVE BRANCH

`claude/implement-claude-design-ui-eFn9b` — UI foundation + design system session

---

## OPEN BUGS

| ID | Description | Status |
|---|---|---|
| BUG-01 | Quote Generator "Parse Notes" returns 400 from worker — worker may need redeploy | Blocked on Michael (redeploy + test) |

---

## MODULE STATUS

| Module | Status | Notes |
|---|---|---|
| Auth | ✅ Live | Supabase Auth, 5-role system, JWT |
| Vendor Intelligence | ✅ Live | Scores, overrides, co-op tracker |
| Quote Generator | ✅ Live (bug) | AI parse 400 bug pending worker redeploy |
| Sales Pipeline | ✅ Live | 8-factor probability model |
| CRM / Customers | ✅ Live | RFM segmentation |
| Employees | ✅ Live | Scorecards, Owner/Manager only |
| Daily Dashboard | ✅ Live | Role-aware, 6 modules |
| Product Lookup / Inventory | ✅ Live | CSV import, analytics |
| Price Book | ✅ Live | Computed over inventory |
| Purchase Orders | ✅ Live | Line items, receive flow |
| Knowledge Hub | ✅ Live | |
| Job Tracker | ✅ Live | |
| Calendar | ✅ Live | |
| Trade Partners | ✅ Live | |
| Warranty | ✅ Live | |
| Competitive Pricing | ✅ Live | Append-only observations |
| Marketing Hub | ✅ Live | 8 campaign types |
| Decision Engine | ✅ Live | Pure-compute over existing data |
| Deal Optimizer | ✅ Live | Pure-compute, heuristic recs |
| Reports | ✅ Live | |
| Deliveries | ✅ Live | |
| Showroom Displays | ✅ Live | |
| Service Tickets | ✅ Live | (schema pending) |
| AccentOS Shell (UI Foundation) | 🟡 New | Prototype + design system — this session |

---

## SCHEMA MIGRATION STATUS

| File | Status |
|---|---|
| M01 | Pending Michael run |
| M02 | Pending Michael run |
| M21–M40 | Pending Michael run |

---

## GOVERNANCE FLAGS

- R-01: index.html monolith at 7,169 lines — extraction ongoing
- R-02: Cloudflare Worker proxy needs redeploy for BUG-01 fix
- R-03: RLS not tightened yet (M01 pending)
- R-04: No real auth enforcement on new UI prototype — visibility-only planning
