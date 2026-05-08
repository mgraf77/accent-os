---
name: trade-vendor-portal
description: >
  Contract-and-scaffold skill for Accent Lighting's two external-facing portals — the
  Trade & Designer Portal (Track 6.5) and the Vendor Rep Portal (Track 6.6). This skill
  documents the auth model, data flows, RBAC boundaries, hosting plan, and source-of-truth
  bindings so that when the blocking M-tasks resolve, AccentOS can build the actual portal
  surfaces without re-deriving the contract from scratch. Use this skill when Michael says:
  "6.5/6.6 portal phase 2", "trade portal", "designer portal", "vendor portal", "vendor rep
  portal", "portal phase 2", "portal preview phase 2", "scope the portals", "scoping the
  portals", "what's blocking the portals", "external portal spec", "portal RBAC", "portal
  contract", "portal data flow", "portal SSO", "Track 6.5", "Track 6.6", "Trade & Designer
  Portal", or any phrasing that asks for portal scoping, portal access design, or "whats the
  plan for the portals." Do not use this skill to actually build portal pages
  (those tracks are auth-walled until the blocking M-tasks land — Cloudflare Pages subdomain
  spin-up, Supabase RLS portal policies, and BigCommerce trade pricing list provisioning all
  belong to the eventual Track 6.5/6.6 build skills, not here). Always ships portal-spec
  documentation and the BLOCKED stub message — never simulates portal logins, never writes
  portal frontend code, never bypasses the M-task gate.
---

# trade-vendor-portal

**Purpose:** Hold the production contract for AccentOS's two external-facing portals (Trade & Designer; Vendor Rep) so the build is unambiguous the moment the blocking M-tasks resolve. This skill is **specification, not execution** — it ships documentation, RBAC tables, and the stub message that explains exactly which M-tasks are gating the live build.

This skill is intentionally narrow in shipped behavior because Tracks 6.5 + 6.6 are heavily blocked. Every workflow step output is a paste-ready section of the portal spec, not a portal interaction.

---

## Trigger Recognition

Run this skill when Michael says anything like:
- "6.5/6.6 portal phase 2" / "portal phase 2" / "portals phase 2"
- "trade portal" / "designer portal" / "trade and designer portal" / "Trade & Designer Portal"
- "vendor portal" / "vendor rep portal" / "Vendor Rep Portal"
- "Track 6.5" / "Track 6.6" / "6.5" / "6.6" / "external-facing portal"
- "portal preview phase 2" / "Portal Preview phase 2" (phase 1 already shipped as Portal Preview)
- "scope the portals" / "scoping the portals" / "needs scoping" (portal context)
- "portal RBAC" / "portal SSO" / "portal access model"
- "portal contract" / "portal data flow" / "what data goes into the portals"
- "whats the plan for the portals" / "are we ready to build the portals yet"
- "portal hosting" / "portal subdomain"

Also trigger when Michael asks "is anything blocking the portals", "what M-tasks does the trade portal need", or "are the portals unblocked yet."

---

## Step 0 — Preflight (BLOCKED gate)

This skill is gated on a **stack of M-tasks** spanning auth, schema, ERP credentials, and external-API access. Until the gating set resolves, this skill produces only the portal contract — not portal interactions.

1. Read the blocking-M-task list from `/home/user/accent-os/skills/trade-vendor-portal/references/blocking-m-tasks.md`. This is the canonical list (mirrors BUILD_PLAN_MICHAEL.md). Cross-check against the live BUILD_PLAN_MICHAEL.md to surface any items that have flipped to `[x]` since the reference file was last updated. **Failure path:** if the reference file is missing, fall back to BUILD_PLAN_MICHAEL.md as the sole source and surface a one-line "reference drift — blocking-m-tasks.md missing, used BUILD_PLAN_MICHAEL.md only" warning. If BUILD_PLAN_MICHAEL.md itself is unreadable, abort with the BLOCKED stub and a "cannot verify M-task status — check repo integrity" note.
2. For each M-task in the reference list, check status:
   - **M01** (RLS tightened on vendor_* tables) — `[x]` per BUILD_PLAN_MICHAEL.md as of 2026-05-04. Required for any external-facing read of vendor data.
   - **M03** + **M10** (Windward written confirmation + Curtis approval) — `[ ]`. Trade Portal trade-customer balances and Vendor Portal cost/inventory feeds depend on Windward live data.
   - **M04** (BigCommerce API credentials) — `[ ]`. Trade pricing list, trade customer accounts, and trade order placement all need BC API.
   - **M09** (Klaviyo API key) — `[ ]`. Trade portal newsletter / order-confirmation flows.
   - **M11** (Supabase MCP permissions) — `[ ]`. Lets Claude provision portal RLS policies without manual SQL.
   - **M12** (rotate shared `accentos` password) — `[ ]`. Required hygiene before any external auth surface goes live.
   - **M18** (website redesign owner approval) — `[ ]`. Portal subdomain branding inherits from the approved redesign visual system.
   - **M24** (trade_partners + warranty_claims schema) — `[ ]`. Trade Portal account view reads from `trade_partners`.
   - **M40** (user_module_overrides cross-device gating) — `[ ]`. Per-user portal access overrides need server-side enforcement, not Owner-only local state.
3. If **any** of M03, M04, M11, M24, or M40 is `[ ]`, return the stub message and exit:

   > skill `trade-vendor-portal` is BLOCKED on the external-portal M-task stack.
   >
   > Trade and Vendor portals are external-facing systems gated on the following M-tasks (status from `/home/user/accent-os/BUILD_PLAN_MICHAEL.md`):
   >
   > - M03 — Windward S5WebAPI written confirmation [status]
   > - M04 — BigCommerce API credentials [status]
   > - M09 — Klaviyo API key [status]
   > - M10 — Curtis approval (depends on M03) [status]
   > - M11 — Supabase MCP permissions [status]
   > - M12 — Rotate shared password [status]
   > - M18 — Website redesign owner approval [status]
   > - M24 — trade_partners + warranty_claims schema [status]
   > - M40 — user_module_overrides cross-device gating [status]
   >
   > Until **all** of these resolve, this skill produces only documentation, not portal interactions. The contract for what the portals will do once unblocked is fully specified in `references/portal-spec.md`. Run `/forge` again after the blocking M-tasks land — the skill will then proceed to Step 1+ automatically.
   >
   > To unblock fastest: prioritize M04 (BC creds) and M24 (trade schema). Those two unblock the Trade Portal MVP; M03+M10 unblock the Vendor Portal cost/inventory surface.

4. If **all** blocking M-tasks have flipped to `[x]`, proceed to Step 1.

---

## Step 1 — Pick scope (Trade / Vendor / Both) and state it; never ask

Parse the trigger phrase to determine scope:

| Phrase contains | Run scope |
|---|---|
| "trade", "designer", "6.5" | Trade & Designer Portal only |
| "vendor", "rep", "6.6" | Vendor Rep Portal only |
| "portals" (plural), "both" | Both portals |
| Ambiguous | Both portals (default — single-skill design covers both) |

Output a one-line confirmation: `Scope: [Trade | Vendor | Both]`. Do not ask Michael to disambiguate — pick and state.

---

## Step 2 — Load the portal contract

Read `/home/user/accent-os/skills/trade-vendor-portal/references/portal-spec.md`. This file holds:

- Per-portal user persona, primary jobs-to-be-done, and surface inventory
- Source-of-truth bindings (which AccentOS table / BC API / Windward field feeds which portal view)
- Auth + RBAC model (SSO recommended; per-portal isolation rules)
- Cloudflare Pages subdomain hosting plan
- Companion-skill data feeds

Output the relevant per-portal section(s) as a paste-ready block. If scope is "Both", concatenate Trade then Vendor sections with a divider.

**Failure path:** if `references/portal-spec.md` is missing or empty, do not fabricate a portal contract. Emit the BLOCKED stub with an extra line: "spec file missing — cannot produce contract from memory; restore `references/portal-spec.md` before re-running" and exit. Surface to skill-health-monitor for structural fix.

---

## Step 3 — Surface the data-flow contract

For the in-scope portal(s), output a 4-column data-flow table:

| Portal view | Data source | Companion skill providing data | RLS / scoping rule |
|---|---|---|---|

Examples (Trade Portal):

| Portal view | Data source | Companion skill providing data | RLS / scoping rule |
|---|---|---|---|
| Trade pricing catalog | BigCommerce store-cwqiwcjxes price list | `bc-rest-bridge` | Customer sees only their assigned trade tier |
| Trade account balance | Windward customer ledger | (Track 6.11 live integration) | Customer sees only their `trade_partners.id` row |
| Co-op accruals visible to trade | Co-op claim states from `coop_claims` table | `coop-claim-drafter` | Filtered to trade-eligible vendors only |
| Order history | BigCommerce orders API | `bc-rest-bridge` | `bc_customer_id` matches authenticated trade user |

Examples (Vendor Portal):

| Portal view | Data source | Companion skill providing data | RLS / scoping rule |
|---|---|---|---|
| Vendor scorecard | Supabase `vendor_scores` table | `vendor-cascade` | `vendor_id` matches authenticated rep's assigned vendor |
| Co-op claim states | `coop_claims` table | `coop-claim-drafter` | Vendor sees only their own claims |
| Demand forecast for their SKUs | `demand_forecast` output | `demand-forecaster-skill` | Filtered to vendor's own SKUs |
| Submit price update | Write to `vendor_price_updates` (proposed) | `action-queue` (approval gate) | Vendor writes; Accent Lighting reviews |
| Purchase forecast surface | Aggregate of `po_lines` + forecast | `demand-forecaster-skill` | Anonymized — vendor sees only their own SKUs |

---

## Step 4 — Surface the auth + RBAC contract

Output the auth contract block (see `references/portal-spec.md` §Auth for the full version):

```
AUTH MODEL
  Recommended: SSO via Supabase Auth (OAuth or magic-link) with per-portal claims
  Trade portal:  audience = "trade",  role claim = "trade_partner",  scope = trade_partners.id
  Vendor portal: audience = "vendor", role claim = "vendor_rep",     scope = vendors.id
  Single auth provider, two audiences. Portals never share session state.

RBAC ISOLATION
  Trade users: read-only on bc_products (trade tier filtered), bc_orders (own only),
               trade_partners (own row), coop_claims (trade-eligible vendors only).
               Cannot read vendor_scores, vendor_overrides, or any internal AccentOS table.
  Vendor reps: read-only on vendor_scores (own vendor), coop_claims (own vendor),
               demand_forecast (own SKUs), po_lines (own SKUs aggregated only).
               Cannot read trade_partners, customer data, or other vendors' data.
  Owner / Admin: bypass — internal AccentOS surface stays the source of truth for staff.

RLS POLICIES (Supabase hsyjcrrazrzqngwkqsqa)
  Every portal-readable table needs a "portal_" RLS policy beside the existing internal
  policy. Pattern: USING (auth.jwt()->>'audience' = 'trade' AND <scope check>).
```

---

## Step 5 — Surface the hosting + deployment contract

Output the hosting plan block:

```
HOSTING (Cloudflare Pages, consistent with main AccentOS)
  Trade portal:  trade.accentlightinginc.com    → CF Pages project "accent-trade-portal"
  Vendor portal: vendors.accentlightinginc.com  → CF Pages project "accent-vendor-portal"
  Each portal is its own deploy target — independent rollback, independent feature flags.
  Both portals call the same Supabase project (hsyjcrrazrzqngwkqsqa) but with a portal-
  specific publishable key (not the AccentOS internal key).
  Anthropic API access for portal-side AI (e.g. trade portal lighting consultant) routes
  through a Cloudflare Worker proxy holding ANTHROPIC_API_KEY — never exposed to portal JS.
```

---

## Step 6 — Output the portal contract report

Combine Steps 1–5 into a single scan-block report:

```
PORTAL CONTRACT — [date]

Scope: [Trade | Vendor | Both]
Blocked status: [N of M blocking M-tasks resolved]

═══ BLOCK 1: PORTAL SURFACE INVENTORY ═══
[from Step 2]

═══ BLOCK 2: DATA FLOW ═══
[Step 3 table]

═══ BLOCK 3: AUTH + RBAC ═══
[Step 4 block]

═══ BLOCK 4: HOSTING ═══
[Step 5 block]

═══ BLOCK 5: COMPANION SKILLS ═══
Trade portal feeds:  bc-rest-bridge, coop-claim-drafter, daily-brief-composer
Vendor portal feeds: vendor-cascade, coop-claim-drafter, demand-forecaster-skill,
                     action-queue, daily-brief-composer

═══ BLOCK 6: NEXT STEPS ═══
[List of M-tasks still blocked, in dependency order — what to do next]
```

---

## Output format

A single message containing all six blocks above when unblocked. When blocked (Step 0), a single stub message naming every blocking M-task and the unblock priority order. Both forms are paste-ready — no prose intro, no follow-up questions.

**Partial-output rules:**

- If a companion skill cited as a data feed (e.g. `bc-rest-bridge`, `vendor-cascade`) does not yet exist in `skills/_index.md`, render its row in BLOCK 5 with a `(skill not yet forged)` annotation rather than removing the row. The contract still names the intended feed; the gap is explicit.
- If only a subset of blocking M-tasks have flipped to `[x]` (e.g. M01 done, M03/M04/M11/M24/M40 still `[ ]`), the BLOCKED stub still wins — never produce a "partial portal contract" because the read-side RBAC isolation hinges on every blocker, not just the cheapest one.
- If `references/portal-spec.md` parses but is missing the in-scope portal section (e.g. asks for Trade but spec only documents Vendor), emit the BLOCKED stub with a "spec section missing — [Trade|Vendor] block absent in portal-spec.md" line.
- If BUILD_PLAN_MICHAEL.md and `references/blocking-m-tasks.md` disagree on a task's status, BUILD_PLAN_MICHAEL.md wins and the reference file gets a one-line "reference drift detected" footer in the output.

---

## AccentOS context

- **Stack:** Cloudflare Pages (per-portal subdomain), Supabase `hsyjcrrazrzqngwkqsqa` (shared backend, portal-scoped RLS), BigCommerce store-cwqiwcjxes (trade pricing + orders), Windward S5WebAPI (trade balances + cost feeds), Anthropic API via `ANTHROPIC_API_KEY` (Cloudflare Worker proxy for portal AI features), Klaviyo (trade newsletter)
- **Project:** AccentOS — internal operating system for Accent Lighting (residential lighting retailer)
- **Paths:** `/home/user/accent-os/skills/trade-vendor-portal/` (Codespace alt: `/workspaces/accent-os/skills/trade-vendor-portal/`)
- **Companion skills:**
  - `vendor-cascade` — vendor scorecard data feed (Vendor Portal)
  - `bc-rest-bridge` — trade pricing list management (Trade Portal)
  - `coop-claim-drafter` — co-op claim state feed (both portals)
  - `demand-forecaster-skill` — vendor purchase forecast surface (Vendor Portal)
  - `action-queue` — vendor-side claim/price-update approvals queue (Vendor Portal write-back)
  - `daily-brief-composer` — portal usage summary tile in daily brief once portals are live
- **BUILD_PLAN tracks closed by this skill (when unblocked):** Track 6.5 (Trade & Designer Portal), Track 6.6 (Vendor Rep Portal)

---

## Anti-patterns

- **Never** simulate a portal login or pretend a portal page exists. The portals are not built; this skill ships the contract, not the artifact.
- **Never** write portal frontend code (HTML, JS, React) inside this skill. Portal-build skills come after the M-task stack resolves and live in their own skill directories or in the AccentOS repo.
- **Never** skip Step 0's M-task gate. If any of M03, M04, M11, M24, or M40 is `[ ]`, the only correct output is the BLOCKED stub.
- **Never** re-derive the portal contract from scratch — read `references/portal-spec.md`. That's the source of truth for portal scoping decisions.
- **Never** propose portal RBAC that lets one trade customer see another trade customer's data, or one vendor rep see another vendor's scores. RLS isolation is non-negotiable — the portals are external-facing.
- **Never** modify the AccentOS internal SKILL.md / RBAC for staff users while editing portal contracts. The internal AccentOS app and the portals are separate audiences with separate auth scopes.
- **Never** ask Michael to disambiguate "which portal" — pick from Step 1's table and state the choice in the output.
- **Never** push portal credentials, BC tokens, or Windward passwords into Cloudflare Pages env vars at the portal layer. Portal AI/ERP calls route through a Cloudflare Worker proxy that holds the secrets.
- **Never** silently swallow a missing `references/portal-spec.md` or a missing companion-skill cite — both are explicit failure paths in Steps 2 and 6's partial-output rules. Fabricating a contract from memory or omitting a feed row is how RBAC drift starts.
- **Never** treat a partial M-task unblock (e.g. M01+M04 done but M03/M11/M24 still `[ ]`) as "good enough to start the build." The read-side isolation contract requires the full blocking set; downgrade-by-default is the only safe failure mode.
