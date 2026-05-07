# Portal Spec — Trade & Designer Portal + Vendor Rep Portal

> Source-of-truth contract for AccentOS's two external-facing portals. Read by `trade-vendor-portal` SKILL.md Step 2 to produce paste-ready surface inventories. Update this file when scoping decisions change; the SKILL.md is a thin wrapper over this contract.

## Two portals, one skill

The gap-optimizer queue framed this as a single skill (rank 15) because both portals share:

- Auth provider (Supabase Auth `hsyjcrrazrzqngwkqsqa`, separate audiences)
- Hosting (Cloudflare Pages, separate subdomain per portal)
- Backend RLS pattern (audience-scoped policies)
- Companion-skill data feeds
- M-task blocking stack

They differ in:

- User persona (B2B trade buyers vs. external vendor reps)
- Source-of-truth bindings (BC + Windward customer data vs. Supabase vendor scores + forecast)
- Write-back surface (trade order placement vs. vendor price-update submission)

Both portals get a clearly delineated section below. The SKILL.md surfaces the right section based on Michael's trigger phrase.

---

## TRADE & DESIGNER PORTAL (Track 6.5)

### User persona

Accent Lighting's B2B trade customers:

- Designers (interior, lighting, residential)
- Electricians and electrical contractors
- Architects working on residential / commercial projects
- Builders and general contractors with active project pipelines

Approximately 100–300 active trade accounts at any given time (refined once `trade_partners` table from M24 is populated). Mix of repeat designers placing per-project orders and new applicants requesting trade tier eligibility.

### Primary jobs-to-be-done

1. **Browse the trade-pricing catalog** — see the same product list a consumer sees on accentlightinginc.com, but with the trade member's tiered pricing applied. Filter by category, brand, lead time.
2. **Place trade orders** — reserve / order product without re-entering account info. Net 30 / Net 60 terms applied where eligible.
3. **Manage trade account** — update billing/shipping addresses, contact info, project-team members under the same trade entity.
4. **View co-op accruals (where visible)** — see which Accent vendors offer trade-side rebates and what the trade member has accrued / claimed.
5. **Order history + reorder** — pull up past orders, re-order line items.
6. **(Phase 2) Save project boards** — collect SKUs into named project lists for client presentations.

### Surface inventory

| Surface | Page | Data source | Notes |
|---|---|---|---|
| Login | `/login` | Supabase Auth, audience=trade | OAuth or magic-link; never the shared `accentos` password |
| Dashboard | `/` | `trade_partners` row + recent orders | Summary tiles: open orders, account balance, accruals |
| Catalog | `/catalog` | BigCommerce store-cwqiwcjxes | Trade-tier pricing applied at render |
| Product detail | `/catalog/:sku` | BC product API + trade tier | Includes trade-only spec sheet, lead time, pricing |
| Cart + checkout | `/cart`, `/checkout` | BC cart/order API | Net terms applied where eligible |
| Order history | `/orders` | BC orders API filtered to `bc_customer_id` | Re-order button on each line |
| Project boards (Phase 2) | `/projects` | `trade_project_boards` (proposed) | Saved SKU collections |
| Co-op visibility | `/coop` | `coop_claims` filtered to trade-eligible vendors | Read-only — claims happen internal-side |
| Account settings | `/account` | `trade_partners` write | Address book, team members, contact prefs |

### Source-of-truth bindings

| Portal field | Source | Companion skill |
|---|---|---|
| Trade tier (price level) | `trade_partners.tier` (M24 schema) | n/a (set by Accent staff in AccentOS internal) |
| Account balance / open AR | Windward customer ledger | (Track 6.11 live integration once M03+M10) |
| Order history | BigCommerce orders API | `bc-rest-bridge` |
| Catalog + pricing | BigCommerce price lists | `bc-rest-bridge` |
| Co-op accruals visible to trade | `coop_claims` table, filtered | `coop-claim-drafter` |
| Newsletter / order email | Klaviyo flows | `klaviyo-flows` (post-M09) |

### RLS scoping

Every Supabase query from the trade portal is scoped by `auth.jwt()->>'sub'` mapped to `trade_partners.user_id`. RLS policies enforce:

- `trade_partners`: USING (`user_id` = auth.uid()) — trade member sees only their own row
- `bc_orders` (mirror, if used): USING (`bc_customer_id` = trade_partners.bc_customer_id WHERE user_id = auth.uid())
- `coop_claims`: USING (`vendor_id` IN (SELECT vendor_id FROM trade_eligible_vendors)) — never per-claim per-customer; aggregated trade visibility only

Internal AccentOS tables (`vendor_scores`, `vendor_overrides`, `customer_records`, `pipeline_deals`, etc.) are **not readable** by trade portal sessions. Audience claim mismatch causes RLS to deny.

---

## VENDOR REP PORTAL (Track 6.6)

### User persona

External vendor reps representing Accent Lighting's 475+ active vendors:

- Manufacturer rep group employees (e.g. Williams Lighting Source rep, Visual Comfort rep)
- Direct factory reps for vendors that don't use rep groups
- Vendor-side account managers handling Accent specifically

Approximately 20–40 active rep logins at MVP scale (one per active rep group). Grows as more vendors opt in to the portal.

### Primary jobs-to-be-done

1. **View their vendor scorecard** — the rep sees how Accent has scored their vendor across the 14 categories (Discount, Freight, Returns Policy, etc.) with the **exception of Rep Score** (hidden from rep view per Hard Rule §12.6 in MASTER.md).
2. **Submit price updates** — push proposed cost / MAP / MSRP changes to Accent for approval (writes route through `action-queue` for staff approval before merging to BC).
3. **View co-op claims and decisions** — see which co-op claims Accent has filed against the vendor's rebate programs, claim states, and dollar amounts.
4. **See Accent's purchase forecast** — the rep sees a 90-day rolling forecast of Accent's expected purchases of their SKUs (output from `demand-forecaster-skill`), aggregated to vendor level (no SKU-level competitor leakage).
5. **(Phase 2) Submit promotion proposals** — push new spiffs, marketing funds offers, display allowances into Accent's `promotions_inbox` for evaluation.
6. **(Phase 2) View Accent's stock + sell-through** — limited inventory visibility for their own SKUs only.

### Surface inventory

| Surface | Page | Data source | Notes |
|---|---|---|---|
| Login | `/login` | Supabase Auth, audience=vendor | OAuth or magic-link |
| Dashboard | `/` | Aggregated tiles per vendor | Scorecard headline, claims summary, forecast snapshot |
| Scorecard | `/scorecard` | `vendor_scores` filtered to their `vendor_id` | **Excludes Rep Score category** |
| Co-op claims | `/coop-claims` | `coop_claims` filtered to their `vendor_id` | Claim state, dollar amount, decision date |
| Forecast | `/forecast` | `demand_forecast` aggregated by vendor | 90-day rolling, vendor-level only |
| Submit price update | `/submit/price` | Write to `vendor_price_updates` (proposed schema) | Routes to `action-queue` for staff approval |
| Submit promotion (Phase 2) | `/submit/promotion` | Write to `promotions_inbox` (proposed) | Routes to `action-queue` |
| Account | `/account` | `vendors` row write (limited fields) | Update rep contact info |

### Source-of-truth bindings

| Portal field | Source | Companion skill |
|---|---|---|
| Vendor score (per category, ex-Rep Score) | `vendor_scores` table | `vendor-cascade` |
| Co-op claim states | `coop_claims` table | `coop-claim-drafter` |
| 90-day demand forecast | `demand_forecast` output | `demand-forecaster-skill` |
| Aggregated PO / sell-through | `po_lines` aggregated by vendor | (Track 5.4 + `windward-bridge`) |
| Submitted price updates | `vendor_price_updates` (proposed) | `action-queue` |
| Submitted promotions | `promotions_inbox` (proposed) | `action-queue` |

### RLS scoping

Every Supabase query from the vendor portal is scoped by `auth.jwt()->>'sub'` mapped to `vendor_reps.user_id` joined to `vendors.id`. RLS policies enforce:

- `vendor_scores`: USING (`vendor_id` = (SELECT vendor_id FROM vendor_reps WHERE user_id = auth.uid()) AND `category_key` <> 'rep_score')
- `coop_claims`: USING (`vendor_id` = (SELECT vendor_id FROM vendor_reps WHERE user_id = auth.uid()))
- `demand_forecast`: USING (`vendor_id` = ...) with SKU-level rows hidden — vendor sees only category aggregates
- `vendor_price_updates`: INSERT scoped to their vendor_id; staff-only UPDATE on the approval state column

Critically: **Rep Score is never readable from the vendor portal.** This is enforced both at the RLS layer (`category_key <> 'rep_score'`) and at the API layer (the GET /scorecard endpoint filters before serializing).

Internal AccentOS tables (`pipeline_deals`, `customer_records`, `trade_partners`, other vendors' scores) are not readable by vendor portal sessions.

---

## SHARED CONTRACT (both portals)

### Auth model

Recommended pattern: **Supabase Auth with audience claims**.

- Single Supabase project: `hsyjcrrazrzqngwkqsqa`
- Two audiences: `trade` and `vendor`
- Authentication options:
  - OAuth (Google) — preferred for designers / architects who already use G Suite
  - Magic-link email — simpler onboarding for reps without Google
  - Email + password — fallback only
- JWT carries:
  - `sub` (user_id, links to `auth.users`)
  - `audience` (`trade` | `vendor`)
  - `role` (`trade_partner` | `vendor_rep`) — for in-portal feature gating
  - `scope` — the partner-id or vendor-id the user maps to

Sessions are **never shared** across portals. A user authenticated to the Trade Portal cannot use the same JWT against the Vendor Portal — the audience claim mismatch fails at the gateway.

### RBAC isolation

| Audience | Can read | Cannot read |
|---|---|---|
| `trade` | `trade_partners` (own row), `bc_orders` (own bc_customer_id), `bc_products` (trade-tier), `coop_claims` (trade-eligible vendors aggregated), Klaviyo subscription status | `vendor_scores`, `vendor_overrides`, other trade members' data, `pipeline_deals`, `customer_records`, internal AccentOS state |
| `vendor` | `vendor_scores` (own vendor, ex-Rep Score), `coop_claims` (own vendor), `demand_forecast` (own SKUs aggregated), `po_lines` (own SKUs aggregated) | `trade_partners`, `customer_records`, other vendors' data, `pipeline_deals`, internal AccentOS state, **Rep Score category for any vendor including own** |
| Owner / Admin (internal) | Bypass — internal AccentOS surface is unaffected | n/a |

### Hosting

| Portal | Subdomain | CF Pages project | Notes |
|---|---|---|---|
| Trade & Designer | `trade.accentlightinginc.com` | `accent-trade-portal` | Independent deploy, independent feature flags, independent rollback |
| Vendor Rep | `vendors.accentlightinginc.com` | `accent-vendor-portal` | Same isolation |

Both portals use a portal-specific **publishable** Supabase key (not the AccentOS internal anon key — separate key per portal lets us rotate without nuking AccentOS). RLS is the security boundary, not the key.

Anthropic API access (e.g. Trade Portal's lighting consultant chatbot, or Vendor Portal's "explain this score" helper) routes through a **Cloudflare Worker proxy** holding `ANTHROPIC_API_KEY`. Portal JS never sees the key.

### Companion skills

Both portals consume data from existing AccentOS skills:

| Skill | Trade Portal use | Vendor Portal use |
|---|---|---|
| `bc-rest-bridge` | Catalog, pricing, orders, account sync | n/a |
| `coop-claim-drafter` | Trade-side accrual visibility (filtered) | Per-vendor claim history |
| `vendor-cascade` | n/a | Source for scorecard rendering |
| `demand-forecaster-skill` | n/a | Vendor-level forecast surface |
| `action-queue` | n/a | Vendor write-back approval gate (price updates, promotions) |
| `daily-brief-composer` | Tile in Owner brief: "Trade portal activity last 24h" | Tile: "Vendor portal submissions awaiting review" |
| `klaviyo-flows` | Newsletter / order-confirmation email triggers | n/a |
| `windward-bridge` | Trade balances + AR (post-M03+M10) | Vendor cost / inventory feed (post-M03+M10) |

### Build sequencing (post-unblock)

Once the M-task stack resolves, AccentOS builds the portals in this order:

1. **Auth foundation** — Supabase Auth with audience claims, OAuth provider config, magic-link template
2. **Trade Portal MVP** — login + dashboard + catalog + order history + account view (account info CRUD only — no order placement yet)
3. **Vendor Portal MVP** — login + dashboard + scorecard read-only + claims read-only + forecast read-only
4. **Trade Portal v1** — adds order placement, cart, checkout, Net terms
5. **Vendor Portal v1** — adds price-update submission with `action-queue` approval gate
6. **Phase 2 add-ons** — project boards (Trade), promotion submissions (Vendor), inventory visibility (Vendor)

Each step is its own deploy + verify cycle. The portal skills aren't built until the contract is locked here — and the contract is locked here.

---

## Update protocol

This file is updated when:

- A blocking M-task flips status (touch the relevant table row)
- A new portal surface is added or removed
- An RLS rule changes
- A companion-skill binding changes
- Hosting / subdomain plan changes

The SKILL.md does not need to be edited on routine spec changes — it reads this file at Step 2.
