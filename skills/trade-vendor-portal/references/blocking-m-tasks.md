# Blocking M-tasks — trade-vendor-portal

> Canonical list of every BUILD_PLAN_MICHAEL.md M-task that gates Trade Portal (Track 6.5) or Vendor Portal (Track 6.6) build. Mirror of the relevant rows in `/home/user/accent-os/BUILD_PLAN_MICHAEL.md`. The skill's Step 0 cross-checks this list against the live BUILD_PLAN file before deciding whether to ship the BLOCKED stub or proceed to Step 1.

## Why this list matters

The Trade & Designer Portal and Vendor Rep Portal are **external-facing surfaces** sitting on Accent Lighting's brand at `trade.accentlightinginc.com` and `vendors.accentlightinginc.com`. External-facing means:

- Real customers / real reps log in
- Data leaks have legal + reputational cost
- Auth must be hardened (no shared password, RLS isolation enforced server-side)
- Source-of-truth feeds (BigCommerce, Windward, Supabase) must all be live and credentialed

This skill is shipped as a **contract document**: the moment every blocking M-task flips to `[x]`, AccentOS has an unambiguous spec to build against. Until then, the skill returns a stub message that lists exactly what's blocking — no guesswork.

## The blocking stack

| M-task | Category | Status check | Blocks which portal | Why it's blocking |
|---|---|---|---|---|
| **M01** | RLS tightening | `[x]` (resolved 2026-05-04) | Both | Tightened RLS on existing `vendor_*` tables is a prerequisite for portal-scoped policies. Already done. |
| **M03** | Windward written confirmation | `[ ]` | Both | Trade balances and vendor cost/inventory feeds depend on Windward S5WebAPI access. Without confirmation that the API is read-only + included in license, no Windward integration ships. |
| **M04** | BigCommerce API credentials | `[ ]` | Trade primarily | Trade pricing list management, trade customer accounts, and trade order placement all read/write BigCommerce store-cwqiwcjxes via REST. No BC token = no Trade Portal MVP. |
| **M09** | Klaviyo API key | `[ ]` | Trade | Trade portal newsletter signup + order-confirmation email flows route through Klaviyo. Lower-priority blocker — Trade can ship without it and bolt on later. |
| **M10** | Curtis approval (Windward) | `[ ]` (depends on M03) | Both | Even with M03 confirmation, Curtis is the operational gatekeeper for Windward credentials. Without his approval, no live ERP feed. |
| **M11** | Supabase MCP permissions | `[ ]` | Both | Lets Claude provision portal-specific RLS policies via MCP instead of pasting SQL manually. Not strictly blocking — Michael can paste — but slows every iteration. |
| **M12** | Rotate shared `accentos` password | `[ ]` | Both (security gate) | The shared password is acceptable for the internal AccentOS staff app. It is **not** acceptable as the auth posture when external surfaces exist on the same Supabase project. Must rotate before any portal subdomain goes public. |
| **M18** | Website redesign owner approval | `[ ]` | Both (branding gate) | Portal subdomains inherit the redesigned visual system (dark hero, Playfair + Outfit, red accent). Without an approved redesign, portal styling is undefined. |
| **M24** | trade_partners + warranty_claims schema | `[ ]` | Trade primarily | Trade Portal account view reads from `trade_partners`. No table = no per-trade-customer scope to filter on. Hard blocker for Trade. |
| **M40** | user_module_overrides cross-device gating | `[ ]` | Both | Per-user portal access overrides need server-side enforcement, not Owner-only local browser state. Without M40, granting/revoking a specific trade user or vendor rep doesn't propagate. |

## Hard-blockers vs. soft-blockers

**Hard-blockers** (the skill returns BLOCKED if any of these are `[ ]`):

- M03 — Windward confirmation
- M04 — BC API credentials
- M11 — Supabase MCP permissions
- M24 — trade_partners schema
- M40 — user_module_overrides cross-device

These are the five gating M-tasks named in SKILL.md Step 0.3. If any one is open, the skill ships the stub. This is intentional — partial portal builds with incomplete scoping are worse than no portal build.

**Soft-blockers** (skill notes them but does not block on them):

- M09 — Klaviyo (Trade portal can ship without newsletter; bolt on after launch)
- M10 — Curtis approval (M03 must come first; M10 unlocks Vendor Portal cost surface)
- M12 — Password rotation (security hygiene, can be batched with portal launch)
- M18 — Website redesign (branding only — portal can ship in unstyled MVP form for internal QA)

The skill notes soft-blockers in the stub message but does not refuse to advance once the hard-blockers all resolve.

## Unblock priority order

When Michael asks "what unblocks the portals fastest," recommend this order (ROI-driven):

1. **M04** (BigCommerce API credentials) — single largest unlock. Trade Portal MVP becomes possible. Also unlocks Track 5.13 (E-Commerce Command Center) as a bonus.
2. **M24** (trade_partners schema) — pure SQL paste. Once M04 + M24 land, Trade Portal MVP is buildable.
3. **M03** (Windward confirmation) — email outreach, no technical block. Sets up M10.
4. **M40** (user_module_overrides) — pure SQL paste. Required for portal user gating to work cross-device.
5. **M11** (Supabase MCP) — quality-of-life; speeds every later iteration.
6. **M10** (Curtis approval) — depends on M03.
7. **M12** (password rotation) — security hygiene.
8. **M18** (redesign approval) — visual layer.
9. **M09** (Klaviyo key) — newsletter polish.

The skill's BLOCKED stub references this order so Michael always sees the next-best move.

## Cross-reference

- Live source of truth: `/home/user/accent-os/BUILD_PLAN_MICHAEL.md`
- Track 6.5 spec lives in: `MASTER.md` §5 Track 6 (Trade & Designer Portal row)
- Track 6.6 spec lives in: `MASTER.md` §5 Track 6 (Vendor Rep Portal row)
- Auth foundation: Track 0.2 in `MASTER.md` §5 Track 0
- This file's update cadence: re-sync after every BUILD_PLAN_MICHAEL.md edit that touches an M-task on this list
