# AccentOS — Feature Stability Matrix
_Last updated: 2026-05-13_

---

## Purpose

Tracks the production maturity of every module/feature in AccentOS. Used to decide where defensive hardening is needed and to communicate system state to operators.

---

## Stability Definitions

| Level | Label | Meaning |
|---|---|---|
| S0 | **BETA** | Feature works but edge cases unhandled; requires careful use |
| S1 | **STABLE** | Core functionality proven; known edge cases handled |
| S2 | **HARDENED** | Edge cases handled; error boundaries added; telemetry present |
| B | **BLOCKED** | Waiting on external dependency (M-task, API key, etc.) |
| D | **DEPRECATED** | Planned for removal or replacement |

---

## Core Infrastructure

| Feature | Stability | Notes |
|---|---|---|
| Auth + Session | S2 | tryRestoreSession, JWT, profile lookup all hardened |
| Supabase client | S2 | sbFetch error handling mature |
| goTo / MODULE_REGISTRY | S2 | Fully data-driven; defensive fallback to `{t:page}` |
| Sidebar / role visibility | S2 | buildSidebar + applyRoleVisibility ordering verified |
| Worker probe + flags | S2 | Probe IIFE, `__AOS_WORKER_*` flags, telemetry |
| `_aiWorkerReady()` preflight | S2 | Guards all 3 AI surfaces; auto-clears on 401 |
| `_runtimeHealth()` | S2 | Structured health object, logged at boot |
| Toast system | S2 | Dedup + count badge on rapid repeat messages |
| CSV utilities | S2 | RFC4180 quoting; used by all export surfaces |
| csvImportFlow helper | S1 | Config-driven; used by 6+ modules |

---

## CRUD Modules

| Module | Stability | Primary risks |
|---|---|---|
| Customers (CRM) | S1 | CSV import: enum normalization edge cases |
| Sales Pipeline | S1 | Stage transitions: no revert from won/lost without manual |
| Quote Generator | S1 | sbSaveQuote: delete+insert non-atomic |
| Job Tracker | S1 | Job number gaps if delete before save completes |
| Purchase Orders | S1 | PO receipt: inventory update non-atomic |
| Employees | S1 | — |
| Calendar | S1 | ICS export: RFC5545 encoding edge cases handled |
| Inventory | S1 | Inline edit: optimistic update (revert-on-fail) |
| Trade Partners | S1 | — |
| Warranty | S1 | — |
| Showroom Displays | S1 | — |
| Labels | S1 | QR via external API (api.qrserver.com) — network dependent |
| Deliveries | S1 | — |
| Competitive Pricing | S1 | Append-only; latest-per-pair computed in JS |

---

## Intelligence Modules (Pure-Compute)

| Module | Stability | Notes |
|---|---|---|
| Vendor Ranking | S2 | 478 vendors, mature scoring, parent grouping |
| Pipeline Analytics | S1 | Good coverage; no edge-case handling for 0-deal state |
| Decision Engine | S1 | 5 recommendation kinds; heuristics tunable |
| Deal Optimizer | S1 | Heuristic thresholds documented in constants |
| Demand Forecast | S1 | PO-line proxy; not true sales velocity |
| Price Book | S2 | Pure-compute; zero DB writes; no risk |
| Competitive Pricing | S1 | Append-only observations |
| Global Search | S1 | Indexes 16 globals at search time |

---

## AI Features

| Feature | Stability | Notes |
|---|---|---|
| Quote AI Parse (aiParseNotes) | S2 | All error paths handled; NaN guards added; preflight; undo-parse button |
| AI Chat (sendChat) | S2 | Preflight guard; graceful 503/401/network paths |
| Vendor AI Detail | S1 | Preflight guard; error shown inline |
| AI Chat — Customer Mode | S1 | Mode toggle; different system prompt |

---

## Infrastructure Features

| Feature | Stability | Notes |
|---|---|---|
| Alerts Engine | S1 | 9 alert generators; dedup by (type, source_id) |
| Module Modes | S1 | Permission resolution order documented |
| Dashboard Pinning | S0 | localStorage v1; no cross-device sync |
| KPI Auto-snapshot | S1 | Double-dedup (localStorage + in-memory) |
| Reports Center | S1 | 19 CSVs; all read-only |
| Activity Feed | S1 | Lazy-loaded; no hardened error paths |
| Health Check | S2 | Upgraded with runtime observability section |
| Internal Meetings | S1 | Largest module (2,436 lines); complex but stable |

---

## Blocked Features

| Feature | Blocked on | Status |
|---|---|---|
| E-Commerce Command Center | M04 (BigCommerce), M05 (GMC) | B — waiting |
| GA4 Integration | M06 (service account) | B — waiting |
| Klaviyo Integration | M09 (API key) | B — waiting |
| Windward ERP Live | M03 + M10 | B — waiting |
| AccentOS embed (public site) | M18 (website approval) | B — waiting |
| Marketing schema | M29 (SQL not run) | B — waiting |

---

## Upgrade Roadmap

| Feature | From | Target | Trigger |
|---|---|---|---|
| Dashboard Pinning | S0 → S1 | Supabase `user_module_overrides` table | M30 task |
| Quote Save | S1 → S2 | Atomic save via Supabase RPC | When quote volume warrants |
| `WORKER_BUILD` auto-inject | INFO → resolved | `sed` in GitHub Actions workflow | Next worker touch |
| All pure-compute modules | S1 → S2 | Add empty-state guards | Low priority |

---

_Review this matrix quarterly. Promote a module to S2 only when all primary risks have been addressed._
