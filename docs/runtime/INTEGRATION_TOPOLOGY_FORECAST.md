# INTEGRATION_TOPOLOGY_FORECAST

> Forecast of the topology AccentOS will inhabit once Phase 4 integrations land.
> Analysis only — no implementation, no integration work, no runtime change.
> Continues the cartography pack: `REPO_TOPOLOGY_MAP.md`, `FROZEN_FILE_PRESSURE_ANALYSIS.md`,
> `SAFE_MUTATION_ZONES.md`, `DECOMPOSITION_STRATEGY_V1.md`,
> `MODULARITY_ILLUSION_ANALYSIS.md`, `FUTURE_LOADER_BOUNDARIES.md`.
> Snapshot date: 2026-05-10.

---

## 0. ONE-PAGE THESIS

Today AccentOS has one external coupling surface (the Anthropic Worker proxy) and one internal one (Supabase REST). Phase 4 (`MASTER.md` §5 Track 6) adds at minimum **seven** more: Windward ERP, BigCommerce, Klaviyo, GA4, GSC, Google Ads, plus Trade and Vendor Rep portals. Each is currently scored as a "simple integration" — connect-not-build, zero new cost, single-page module. None of them are simple. The simplicity is a *property of the read-only one-shot*, not of the integration itself; once writes, real-time syncs, or webhook callbacks land, each one becomes a small distributed system with its own authority claims, retry logic, and failure modes.

The single biggest forecast: **integration entropy will not accumulate at the integration boundary itself**. It will accumulate at the *coordination surface between integrations* — the place where "Windward says X, BigCommerce says Y, Klaviyo already sent Z" must be reconciled. Today that surface does not exist. Once it does, it becomes the next `index.html`-class frozen file unless its shape is decided up front.

The single most dangerous future integration pattern is not any specific connector. It is **dual-write without a declared authority** — when two integrations both have permission to update the same field on the same record, with no rule about which one wins. Every other listed risk is a special case of this.

---

## 1. CURRENT INTEGRATION SURFACE (BASELINE)

| Surface | Direction | Auth | State today |
|---|---|---|---|
| Supabase REST (`sbFetch`) | bidirectional | anon JWT in sessionStorage | live, 22 modules consume |
| Supabase Realtime | server → browser | anon JWT | live, used by `internal_meetings.js` only |
| Anthropic API | browser → CF Worker → Anthropic | server-held secret | live, ~50 LOC worker |
| BigCommerce script-manager DOM patch | one-way (header script) | none | live (structured-data fix) |
| GMC product feed | one-way (Feedenomics outbound) | external auth chain | live but degraded (20K+ image issues) |
| Klaviyo / GA4 / GSC / Ads / Windward / Portals | — | — | not connected |

The codebase today integrates with **two external systems** in a meaningful sense. Everything described as "Phase 4" is greenfield from AccentOS's perspective.

---

## 2. PHASE 4 INTEGRATION INVENTORY (PER MASTER.md)

| Integration | Current mode (`module_modes.json`) | Documented direction | Authority question |
|---|---|---|---|
| `windward` | `blocked` | read primarily; eventually write back? | Windward = canonical for inventory + customer + orders |
| `bigcommerce` | `blocked` | read products + orders; write product overrides? | BigCommerce = canonical for ecommerce orders |
| `klaviyo` | `blocked` | write segments + flows; read campaign stats | Klaviyo = canonical for email engagement |
| `ga4` | `blocked` | read only | GA4 = canonical for site behavior |
| `gsc` | `blocked` | read only | GSC = canonical for search performance |
| `ads` | `blocked` (no API) | manual only | n/a — out of band |
| `portal_trade` | `planning` | external auth, scoped DB read+write | new identity domain |
| `portal_rep` | `planning` | external auth, scoped DB read+write | new identity domain |
| `embed` | `idea_only` | one-way (AccentOS embedded on public site) | n/a |
| `ailighting` | `idea_only` | bidirectional chat | Anthropic via existing worker |

Plus the latent integration the `MASTER.md` §11 already names as "connected" but unused by code: Gmail / Calendar (MCP), Notion (MCP, deliberately disabled for Accent), Chrome MCP (admin-side only, not runtime).

---

## 3. INTEGRATION-COUPLING TAXONOMY

Each integration couples AccentOS along several axes simultaneously. The axes:

| Axis | What it measures |
|---|---|
| **Identity coupling** | Whose user model is canonical for an actor (employee, trade partner, customer, anonymous shopper) |
| **Data coupling** | Whose record is canonical for a row (product, order, customer profile, segment, score) |
| **Schema coupling** | How tightly AccentOS's column projections track the external system's payload shape |
| **Auth coupling** | Where credentials are stored and who refreshes them |
| **Lifecycle coupling** | Who owns "create / update / delete / archive" for a given record |
| **Eventing coupling** | Who emits state-change events; who consumes them; latency tolerance |
| **Audit coupling** | Where the truth of "what changed when, and by whom" lives |

A "simple integration" is one where every axis points at one direction and one authority. Real ones rarely look like that. A spreadsheet view of where each Phase 4 integration places its coupling pressure:

| Integration | Identity | Data | Schema | Auth | Lifecycle | Eventing | Audit |
|---|---|---|---|---|---|---|---|
| Windward | external (employees as Windward users) | external (canonical for inventory + customer history) | tight (column-mapped) | external creds (Curtis) | external-create, internal-annotate | poll or webhook (TBD) | external (Windward log) + internal mirror |
| BigCommerce | external (customer accounts) | external (canonical for orders) | tight | API keys | external-create, internal-annotate | webhooks possible | external mirror to Supabase |
| Klaviyo | external (subscriber identity) | mixed (segments owned by both) | partial | API keys | both create | webhooks both directions | mixed |
| GA4 | n/a | external (read-only) | loose | OAuth | external-only | poll | external |
| GSC | n/a | external (read-only) | loose | OAuth | external-only | poll | external |
| Trade Portal | new internal identity | internal | n/a | own auth | internal | n/a | internal |
| Rep Portal | new internal identity | internal | n/a | own auth | internal | n/a | internal |
| Embed | n/a | n/a (read-only display) | n/a | none | external (embedding site) | n/a | n/a |
| AI Consultant | n/a | n/a | n/a | server | external (Anthropic) | per-message | logs in shell |

Notice the rows where multiple cells say "mixed" or "both" — those are the failure-prone integrations. **Klaviyo is the most coupling-mixed integration in the plan.** Windward and BigCommerce are simpler in shape because their authority is unambiguously external; AccentOS only mirrors and annotates.

---

## 4. OWNERSHIP BOUNDARIES

For each integration, the boundary question is: *if a row in AccentOS disagrees with a row in the external system, who wins?*

### 4.1 Windward
- **External wins on:** product master, inventory levels, customer order history, employee identity (eventually).
- **Internal wins on:** AccentOS-only annotations (vendor scores, custom categories, KPI snapshots, build events, audit log entries that don't exist in Windward).
- **Conflict zone:** customer profile fields that exist in both. AccentOS's `customer_records` will accumulate fields like `segment`, `lifetime_value`, `notes` that have no Windward analog — but `name`, `email`, `phone` exist in both. Authority must be declared per-field, not per-record.

### 4.2 BigCommerce
- **External wins on:** ecommerce order rows, product catalog, customer account email, BigCommerce-side metadata.
- **Internal wins on:** AccentOS-derived enrichment (RFM scores, alerts, internal categorization).
- **Conflict zone:** customer identity reconciliation. A walk-in showroom customer with a Windward record may also have an ecommerce account with a different email. Three-way merge (Windward × BigCommerce × Accent) is on the path.

### 4.3 Klaviyo
- **External wins on:** subscription state, suppression list, send history.
- **Internal wins on:** segment definitions (built from RFM/Windward/Accent data and pushed *to* Klaviyo).
- **Conflict zone:** segments. A Klaviyo user can edit a segment in the Klaviyo UI and overwrite the AccentOS-pushed definition. **This is dual-write without a declared authority** — the canonical example of the §10 risk.

### 4.4 GA4 / GSC
- Read-only. No conflict zone. These are the *easy* ones.

### 4.5 Portals (Trade, Rep)
- **Internal wins on everything.** These are AccentOS-native identity domains. Conflict zone is *with future external CRMs* if any are ever connected — out of current scope.

### 4.6 Embed
- One-way push of AccentOS UI fragments into the public website. Authority is unambiguous; but embed is an XSS / content-policy surface (see §7).

### 4.7 AI Consultant
- Stateless per-message; no authority question. Logs are internal.

---

## 5. SYNCHRONIZATION SURFACES

For each integration that is *not* purely read-only, there is a sync surface — the code path that reconciles state. AccentOS today has zero. Forecasted surfaces:

| Surface | Direction | Cadence | Owner |
|---|---|---|---|
| Windward → Supabase mirror | inbound poll or webhook | daily or near-real-time | Edge Function (planned, not built) |
| BigCommerce → Supabase mirror | webhook + reconciliation poll | event + nightly | Edge Function (planned) |
| Supabase → Klaviyo segments | outbound write | nightly or on-change | Edge Function or scheduled task |
| Klaviyo → Supabase events (opens/clicks) | inbound webhook | event-stream | Edge Function |
| GA4 → Supabase rollups | outbound pull | daily | scheduled task |
| GSC → Supabase rollups | outbound pull | daily | scheduled task |
| Portal auth ↔ Supabase | bidirectional (login + role mapping) | on-request | shell + portal-side code |
| Trade portal data scoping | inbound from portal-side request | on-request | RLS + role-claim |

Common shape: **inbound webhook + nightly reconciliation poll**. None of this code exists. There is no scheduler, no webhook receiver, and no Edge Function infrastructure beyond the Anthropic proxy. The Cloudflare Worker pattern that today serves a 48-line proxy will need to host (or coexist with) every one of these surfaces, **or** Supabase Edge Functions will need to be adopted as a parallel orchestration tier.

The choice between "Cloudflare Worker grows" vs "Supabase Edge Functions adopted" is **the single largest unmade architecture decision in Phase 4.** It is not in `MASTER.md` and not in `BUILD_PLAN`.

---

## 6. DATA AUTHORITY MODEL

Authority is the answer to "if two systems disagree about field X on record Y, which one writes the next state of X?"

### 6.1 Per-field authority
The most useful model is **per-field, per-record-class** authority, not per-system.

Example (illustrative):
```
record: customer
  field: email             → external (Windward) when present, else BigCommerce, else local
  field: phone             → external (Windward)
  field: lifetime_value    → AccentOS (computed)
  field: segment           → AccentOS (pushed to Klaviyo)
  field: subscription      → Klaviyo
  field: last_order_amount → external (Windward or BC, whichever is newer)
```

This table does not exist. It cannot exist as code today because the integrations are not built. It also cannot be inferred later from the integration code — by the time it can be inferred, the system has already shipped at least one bug from getting it wrong.

**Recommendation (analysis-level):** before any Phase 4 integration writes its first row, the per-field authority table is itself a deliverable — a markdown doc in `docs/runtime/` (out of scope for this task, but a forecast item).

### 6.2 Authority classes
- **Hard external:** AccentOS never writes; only mirrors. (Windward inventory, GA4 metrics.)
- **Soft external:** AccentOS may stage-write but rejects on conflict. (Windward customer fields with no AccentOS equivalent.)
- **Hard internal:** AccentOS owns; pushed to external as a one-way derivation. (RFM segments → Klaviyo.)
- **Soft internal:** AccentOS owns but tolerates external override. (Klaviyo-side segment edits.)
- **Unowned:** field exists in both, no rule. **This class must be empty** — every unowned field is a future bug.

---

## 7. BLAST-RADIUS PROPAGATION

A failure inside one integration does not stay there. The propagation paths under the current shape:

| Trigger | Direct effect | First-order propagation | Second-order propagation |
|---|---|---|---|
| Windward S5WebAPI 401/403 (today's state) | No customer mirror | RFM engine has no input | Alerts engine has no triggers |
| Anthropic API outage | AI features dark | Quote AI parse fails, AI consultant fails | Drafts unsent; users typing manually |
| Supabase outage | App dark for write | Read may also dark depending on cache | All modules degrade simultaneously |
| BigCommerce webhook missed | Order not mirrored | Pipeline stage doesn't advance | Sales rep isn't notified; alert silence |
| Klaviyo segment overwritten in their UI | Local segment def stale | Next push detects nothing changed; drift persists | RFM-derived behavior diverges |
| GA4 quota exceeded | Daily rollup missing | KPI panel shows stale numbers | Owner-dashboard reports wrong delta |
| Portal auth mis-issues a token | Wrong user sees wrong data | RLS may catch it; may not | **Data leak — security blast** |

The pattern: **most blast radii compound through Supabase as the intermediate**, because Supabase is the single mirror that every integration writes to. Supabase becomes the de-facto orchestration surface — by accident, not by design.

This is the core integration-topology risk: **Supabase is being used as a message bus without being one**. It accumulates state from every connector, every UI module reads from it, and there is no concept of "this row is stale because Klaviyo's last sync was 30 minutes ago." Staleness is invisible.

---

## 8. ORCHESTRATION PRESSURE POINTS

The places where multiple integrations have to agree, in priority order:

1. **Customer identity reconciliation.** Windward `customer_id` × BigCommerce `customer_id` × walk-in (no ID) × ecommerce-anonymous. The `customer_records` table has been planned but not built. Identity reconciliation is the *first* thing to break under any real integration load and is invisible until it does.

2. **Inventory truth.** Windward owns the master, but PO-receiving, returns, and damage flows can update it from inside AccentOS (Track 5 / Phase 3). The current `M22_inventory_schema.sql` is internal-only; reconciliation with Windward isn't expressed.

3. **Order timeline.** Quote → BigCommerce ecommerce order vs Quote → Windward sales order vs internal pipeline stage. Three different "what happened" timelines for the same logical transaction. No reconciler.

4. **Segment definition.** RFM (AccentOS-computed) → Klaviyo segment → marketing campaign → Klaviyo-side edit. Already discussed in §4.3 as the canonical dual-write hazard.

5. **Behavior signals.** GA4 site behavior + BigCommerce cart abandonment + Klaviyo open/click + Windward purchase. Combining these into one customer activity stream (the planned `telemetry_events` table) is downstream of every connector working.

6. **Authentication subject.** Five role types in AccentOS today (Owner/Admin/Manager/Sales/Warehouse) plus future trade-partner identity (portal_trade) plus rep identity (portal_rep). Six identity domains; one `user_profiles` table; not yet expressed.

7. **Audit log unification.** AccentOS-side `audit_log`, Windward-side log, BigCommerce-side log, Klaviyo-side log. "Who changed this customer record?" already has 4 answers depending on which system you ask.

Each of these is a **future frozen file in waiting** — once the reconciler logic for any of them is written, it will be hostile to refactor (high blast radius, business-critical) and will accrete edge cases until it dominates a code surface the way `index.html` dominates today.

---

## 9. WHERE INTEGRATION ENTROPY WILL ACCUMULATE

Three predicted concentration points, in escalating concern:

### 9.1 Concentration point #1 — The reconciler
Every "near-real-time mirror" pattern produces a reconciler. There will be one per inbound integration (Windward, BigCommerce, Klaviyo events, GA4, GSC). Each reconciler has the same shape: fetch-or-receive → diff against Supabase → write changes → log. They will be implemented separately, in five different places, with five different retry/backoff/error-handling regimes — **unless** a shared reconciler pattern is adopted up front.

This is exactly the `MASTER.md` §5 "intelligence compounds — every module makes every other module smarter" claim, but at the *integration* layer. The principle is sound; the substrate to enforce it does not yet exist.

### 9.2 Concentration point #2 — The Edge Function tier
Today there is one Cloudflare Worker (Anthropic proxy). Tomorrow there are ~7 webhook receivers + ~5 scheduled syncs + ~3 outbound writers. They are either:
- **(a)** all in `worker/`, growing the Anthropic proxy file or sibling files in the same Cloudflare account → tight coupling to one deploy unit.
- **(b)** distributed across Cloudflare Workers + Supabase Edge Functions → split deploy story.
- **(c)** all in Supabase Edge Functions → ties all integration to Supabase (which is also the mirror).

Each option has different blast-radius properties (covered in `COUPLING_REDUCTION_PATTERNS.md`). The choice is undeclared.

### 9.3 Concentration point #3 — The role-claim surface
Two new external identity domains (Trade Portal, Rep Portal) plus the existing 5-role internal model plus future Windward-mapped employee identity = a JWT-claim surface that needs to express which records each subject can read/write. RLS in `M01_rls_tightening.sql` is currently anon-permissive — every Phase 4 portal addition tightens it, and tightening RLS is the single most blast-prone SQL change available (a too-tight policy darkens the app for that role; a too-loose one is a data leak).

---

## 10. WHERE "SIMPLE INTEGRATIONS" BECOME ARCHITECTURAL TRAPS

For each Phase 4 integration, the moment it stops being simple:

| Integration | Simple as long as… | Becomes a trap when… |
|---|---|---|
| GA4 / GSC | read-only daily pulls | KPI panel needs hourly resolution → quota tuning + auth refresh + rate limit retry |
| Anthropic Worker | one endpoint, one model | per-feature prompt routing → first request gets template, branches by feature, system-prompt versioning |
| BigCommerce | one-time daily reconciliation pull | webhooks added → out-of-order delivery + idempotency keys + dead-letter queue |
| Windward | mirror-only inbound | first AccentOS-side write back to Windward → conflict resolution + transactional boundary |
| Klaviyo | push segments only | ingest opens/clicks → mapping Klaviyo events to AccentOS customer IDs → identity reconciliation problem from §8 |
| Portals | own auth, own data | portal users need access to internal records → cross-domain RLS with tenant scoping |
| Embed | static fragment | embed-side wants to read AccentOS state → CORS + auth proxy + content-policy negotiation |
| AI Consultant | stateless chat | session memory desired → state-store + per-user retention + deletion compliance |

**Pattern:** the trap is always *the second feature*. The first integration is one direction, one cadence, one surface. The second feature on the same integration adds bidirectionality, real-time eventing, or stateful memory — and that is when the architecture decision that *should* have been made up front becomes unavoidably retrofit.

---

## 11. WHERE OWNERSHIP AMBIGUITY BECOMES DANGEROUS

Five forecasted ambiguity zones, ranked by blast severity:

1. **Customer record ownership across Windward + BigCommerce + AccentOS.** No single ID space. A trade-partner with an ecommerce account, a Windward record, and a sales-rep-entered note is the same human in three databases. *Already an open loop in `MASTER.md` §13.*

2. **Klaviyo segment ownership.** Local definition, remote edit, both writable. Discussed in §4.3 / §8.

3. **Vendor identity vs Rep identity.** A vendor (`VD_RAW`) is not a rep (rep group). One vendor may have multiple rep groups; one rep group may cover multiple vendors. The current `vendor_overrides` and rep tables overlap. Adding a `portal_rep` external identity layer on top is the first thing that makes the conflation visible.

4. **Quote authorship.** A quote drafted by AI, edited by a salesperson, sent to a customer, modified by the customer in a portal, accepted, and converted to a Windward sales order has at least four "modified by" claimants. Audit log unification (§8 #7) is the only path.

5. **Inventory adjustment.** Windward POS sale, internal damage write-off, return-to-vendor, PO receipt — four events that all reduce/increase the same `inventory_levels` row. Today's `M22` is internal-write-only; once Windward syncs in, dual-write hazard appears.

---

## 12. FUTURE ORCHESTRATION SUBSTRATE

The conceptual shape (drawing on `FUTURE_LOADER_BOUNDARIES.md` thinking, applied to integrations):

A future orchestration substrate would express, for every external system:

1. **Connector identity.** Name + version + auth strategy.
2. **Authority claims.** Per-field, per-record class (§6).
3. **Sync surface(s).** Inbound, outbound, cadence, retry policy.
4. **Idempotency contract.** How a duplicate event is detected.
5. **Reconciliation contract.** What's done when local and remote disagree.
6. **Failure modes.** What happens when the connector is down (degrade-read? block-write? warn?).
7. **Observable state.** Last successful sync, current backlog, error rate.

This is structurally analogous to `register({name, provides, consumes, ...})` but operating on integrations rather than UI modules. It is **the same idea at a different layer** — an observation-first, non-blocking declaration of who-touches-what.

The substrate is *not* a new framework. It is one shared module (perhaps `js/connector_registry.js` plus matching Edge-Function-side helpers) that every integration calls into. ~50–100 LOC plus the contract docs.

---

## 13. THE SINGLE MOST DANGEROUS FUTURE INTEGRATION PATTERN

**Dual-write without a declared authority.**

That is the umbrella name for: Klaviyo segments overwritten in their UI; a Windward customer field updated in AccentOS that Curtis later re-imports the old value over; a BigCommerce inventory level pulled while AccentOS is mid-update from a damage write-off. In each case, two systems both have permission to write the same field on the same record, and there is no rule about which one wins. The losing write is *silent* — nothing logs it as a conflict; the database just shows the most recent value.

Why it is the worst possible pattern:
- **Silent.** No symptom unless someone notices the value is wrong.
- **Compounding.** The next sync re-sets the field; the next user-edit re-overrides; the field oscillates.
- **Trust-eroding.** Operators stop believing any field on any record. "Don't trust the customer notes — they get overwritten" is a category of trust loss that does not recover.
- **Onboarding-poisoning.** Future operators inherit the bug-class without inheriting the awareness; they ship more dual-writes on top.
- **Architecture-locking.** Once enough fields are dual-written, the cost of declaring authority retroactively exceeds the cost of building it correctly the first time.

Every other forecasted risk in this document — orchestration concentration, sync surface fragmentation, Edge-Function tier choice — is recoverable with a refactor. **Dual-write without declared authority is the only one that silently rots data**, and data rot is the one thing that cannot be reverted by `git revert`.

---

## 14. CURRENT HIGHEST HIDDEN-COUPLING ZONE

Distinct from §13 (which is forecast). For *current state*:

The highest hidden-coupling zone is the implicit **`sbFetch` ⇒ Supabase REST URL strings ⇒ SQL schema** chain. Every module hard-codes the table name and the column projection it expects in the URL string passed to `sbFetch`. There is no schema layer between them. A column rename in `sql/M*.sql` (a normal migration activity) is a silent runtime breakage in N modules, with N undeclared and discoverable only by grep.

This is hidden coupling because:
- The SQL file does not list its consumers.
- The module does not declare its tables.
- The shell does not validate the request.
- The Supabase REST layer returns 400 / 404 only at *use* time.

`MODULARITY_ILLUSION_ANALYSIS.md` covers the namespace illusion at the module ↔ shell boundary. The same shape exists one layer down at the module ↔ database boundary, and it is *more* dangerous because schema changes are governed by an out-of-band manual paste workflow (`MASTER.md` §3 — Supabase MCP errors → manual SQL Editor) that does not run any cross-reference at all.

---

## 15. SUMMARY

| Question | Answer |
|---|---|
| Where will integration entropy accumulate? | At the *coordination surface between integrations*, not at any single integration boundary; specifically, the reconciler, the Edge-Function tier, and the role-claim surface |
| Where do "simple integrations" become architectural traps? | At the second feature on each integration — the first is always one-direction, simple; the second adds bidirectionality, eventing, or state |
| Where does ownership ambiguity become dangerous? | Customer-record reconciliation across Windward × BigCommerce × AccentOS is already an open loop and is the first to fail |
| Single most dangerous future integration pattern | Dual-write without a declared authority — silent, compounding, trust-eroding, irreversible |
| Current highest hidden-coupling zone | Module → `sbFetch` URL strings → SQL schema, governed by an out-of-band manual paste workflow with no cross-reference |
| Single largest unmade Phase 4 architecture decision | Cloudflare Workers vs Supabase Edge Functions for the orchestration tier |
| Cheapest mitigation | A per-field authority table as a `docs/runtime/` deliverable *before* any Phase 4 connector is built; analogous to `register()` substrate but at the integration layer |
| Status | Not in `MASTER.md`, not in `BUILD_PLAN`, not on any backlog. Forecast-only here. |

---

*See `COUPLING_REDUCTION_PATTERNS.md` for the pattern catalog this forecast draws on, and `ARCHITECTURAL_DRIFT_MODEL.md` for the drift-class accounting that makes the absence of these decisions visible.*
