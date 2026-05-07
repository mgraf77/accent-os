# Wiki Hot State
> Updated: 2026-05-07 — Session close

## Current task
IDLE — All Claude-buildable features complete or blocked on Michael M-tasks. Wiki module pages (35) are stubs and can be enriched without Michael.

## What shipped (last two sessions)

### RAG precision optimization (+5.1pp total)
- Pass 1 (45.7% → 48.3%): golden set fix, lighting-reference stemmer fix, ADR-001 customer mode sentence, sop-vendor-onboarding key questions phrase, rubric-rep-score heading + density
- Pass 2 (48.3% → 50.8%): michael-graf team members sentence, circular graph boost fix (paul-graf/michael-graf related fields), paul-graf/patrick-graf body wikilink token leak fix, lighting-reference CRI retail line + dimming-protocols related removal
- Final eval: composite 90.7%, recall 100%, MRR 93.3%, precision 50.8%, entity cluster 86.1%
- rag-eval-matrix-v1.json committed

### Documentation
- RAG-EXPLAINER.md — beginner-friendly guide to the full RAG system (what it is, BM25, chunking, graph re-ranking, stemmer gotchas, 3 Python scripts, how to add knowledge, how to tune)

## Remaining precision misses (structural ceiling — do not retry)

1. **vendor-scoring / "3% rebate"** — "rebates"→"rebat" stem ≠ singular "rebate" query; adding singular causes regression (tested+reverted)
2. **rubric-rep-score / "rep score rubric"** — "rubric" IDF=0.315 (42% of chunks); rank10; gap 0.859; all boosts maxed
3. **vendor-scoring / "return policy high score"** — rubric-display rank1 via [[rubric-returns]] body wikilink; vendor-scoring gap 6.8; structural

Precision 50.8% = ~94% of achievable ceiling. Do not attempt further passes without corpus restructuring.

## Open loops — all blocked on Michael

| Task | Unblocks | Status |
|------|----------|--------|
| M41 (external_portals.sql + Supabase email auth) | partner portal live | [ ] |
| embed URL → update bigcommerce-embed-snippet.js | embed live on BC | needs Cloudflare Pages URL |
| M04 (BigCommerce API creds) | 5.13 + 6.3 | [ ] |
| M05 (GMC API access) | 6.3 side of 5.13 | [ ] |
| M06 (GA4 + GSC service account) | 6.1 + 6.2 | [ ] |
| M09 (Klaviyo API key) | 6.4 | [ ] |
| M03 + M10 (Windward confirmation + Curtis outreach) | 6.11 | [ ] |
| M40 (user_module_overrides SQL) | per-user module gating | [ ] |
| M24–M29 (schema runs) | already-shipped modules | [ ] |
| 6.12 Google Ads / Meta Ads | — | no API access |

## What Claude can build without Michael

1. **Wiki enrichment**: 35 module pages in wiki/modules/ are stubs (auto-gen, no real function docs). Can be enriched one-by-one using js/ source files as reference. High-value for Ask the Engine grounding.
2. **Vendor page enrichment**: wiki/entities/vendors/ has 30 pages — can be fleshed out as vendor data becomes available.
3. **pgvector path** (M42/M43): optional embedding upgrade — not started, not blocked.

## Next-session entry point

1. Read BUILD_PLAN_MICHAEL.md — check which M-tasks Michael has completed since last session
2. If M41 done: test portal.html magic link flow end-to-end, confirm external_user_profiles provisioning
3. If M04 done: build 5.13 E-Commerce Command Center (BigCommerce REST + GMC)
4. If M06 done: build 6.1 (GA4) + 6.2 (GSC) integrations
5. If M09 done: build 6.4 Klaviyo integration
6. If nothing done: enrich wiki/modules/ pages using js/ source files (start with wiki.js, then daily_brief.js, then vendor_scoring.js)
