# Wiki Hot State
> Updated: 2026-05-07 — RAG optimization complete

## Current task
COMPLETE — RAG optimization loops finished. All BUILD_PLAN items shipped or M-task blocked.

## What shipped (this session)
- RAG eval: recall 56.2% → 100%, composite 80.4% → 91.4% (3 optimization loops)
- Loop 1: synthesis contamination fix (rag-eval-matrix-v1 excluded by default)
- Loop 1: suffix stemmer + digit-anchored tech-term tokenizer in all 3 RAG scripts
- Loop 2: wikiGroundQuery upgraded — title+slug-component pass1, body-text re-rank pass2
- Loop 3: source-seed-corpus-v1 reclassified synthesis (provenance page contamination)
- Loop 3: overview.md reclassified concept (now indexed + searchable), team section added
- Loop 3: 6 wiki pages enriched (rubric-rebates, rubric-imap, rubric-rep-score, sop-quote-creation, lumen-output-commercial, source-build-intelligence, employee pages)
- Loop 3: wiki_lint.py OPERATIONAL_SLUGS + skip_files updated for overview change
- rag_index.json rebuilt: 155 chunks, 3166 terms, 936KB

## Open loops (unchanged from v6.11.3)
- M41: Michael runs M41_external_portals.sql + enables Supabase email auth (unblocks partner portal live)
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
5. Otherwise: continue wiki enrichment (module pages are stubs — enrich with real function docs)
