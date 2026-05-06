# Wiki Hot State
> Updated: 2026-05-06 — v6.11.3 shipped

## Current task
COMPLETE — all unblocked BUILD_PLAN items shipped. Waiting for Michael M-tasks.

## What shipped (this session)
- wiki: +35 module pages + top-30 vendor entity pages = 107 total pages (0 errors, 0 warnings)
- wiki_seed.py: VD_RAW bracket-counting extraction fix, update_index table-row regex fix
- wiki_lint.py: OPERATIONAL_SLUGS constant (overview/log/hot), orphan suppression for module+entity types
- portal.html: standalone external Partner Portal (magic-link auth, Trade Partner + Vendor Rep views)
- sql/M41_external_portals.sql: schema + RLS + trigger for external_user_profiles
- portal_preview.js: "Provision Access" button → writes external_user_profiles
- embed.html: compact employee widget (4 tabs: inventory / quick quote / AI chat / settings)
- bigcommerce-embed-snippet.js: BC Script Manager snippet for accentlightinginc.com floating widget
- _headers: Cloudflare Pages CORS config (embed allows framing, index denies)
- BUILD_PLAN: [x] 6.5/6.6/6.10 + wiki seed tasks

## Open loops
- M41: Michael runs M41_external_portals.sql + enables Supabase email auth for external users (unblocks partner portal live)
- embed URL: update EMBED_URL in bigcommerce-embed-snippet.js after Cloudflare Pages URL confirmed
- M04, M05: BigCommerce + GMC API keys → unblocks 5.13 + 6.3
- M06: GA4 service account → unblocks 6.1 + 6.2
- M09: Klaviyo API key → unblocks 6.4
- M03, M10: Windward written confirmation + Curtis outreach → unblocks 6.11
- wiki/entities/customers/: intentionally empty (sensitive, never auto-gen)
- M42/M43: pgvector optional path (not started, not blocked)

## Next-session entry point
1. Check if Michael has completed any M-tasks (BUILD_PLAN_MICHAEL.md)
2. If M41 done: test portal.html magic link flow, confirm external_user_profiles provisioning
3. If M04 done: build 5.13 E-Commerce Command Center
4. If M06 done: build 6.1 (GA4) + 6.2 (GSC) integrations
5. Otherwise: run wiki_lint.py to verify zero errors, continue wiki enrichment
