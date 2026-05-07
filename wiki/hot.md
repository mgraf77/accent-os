# Wiki Hot State
> Updated: 2026-05-07 — Module enrichment COMPLETE (35/35)

## Current task
IDLE — ALL 35 wiki/modules/ stubs enriched in 6 batches (5 sequential + 1 parallel). Confidence: medium → high across the board. Lint clean (0 errors, 2 unrelated pre-existing warnings).

## What shipped (this session)

### Module enrichment — full backlog cleared
- **Batches 1–5 (sequential, 15 pages)**: wiki, digest, vendor-score-import, alerts, customers, inventory, pipeline-analytics, purchase-orders, price-book, deal-optimizer, demand-forecast, decision-engine, jobs, deliveries, warranty
- **Batch 6 (parallel — 4 general-purpose subagents, 5 modules each, 20 pages)**:
  - **Vendor cluster**: trade-partners, bulk-vendor-ops, competitive-pricing, commission, showroom-displays
  - **External + Knowledge**: portal-preview, marketing, calendar, labels, module-modes
  - **Cross-cut UX helpers**: activity-feed, bulk-select, global-search, quick-actions, saved-filters
  - **System + Ops**: health, inventory-analytics, my-tasks, reports, employees

Pattern proven across all 9+ module shapes (BM25 engine, plaintext export, CSV bulk import, signal aggregator, RFM CRM, inline-edit grid, pure-compute analytics, header+lines workflow, helper registries, role-gated diagnostics, scorecard pivots).

### Methodology (reusable for future stub backlogs)
1. Read js/<name>.js source (read full file, no skim)
2. Read existing stub for frontmatter shape
3. Read 2-3 reference enriched pages for tone match
4. Write: frontmatter (high confidence + today's date) + Purpose + Functions table + domain-specific section(s) + State + Read deps + Shell touchpoints + Related cross-links
5. Stay ≤700 words (lint warn threshold)
6. Verify all `[[wikilinks]]` resolve to real slugs
7. Lint after each batch — 0 errors required before commit

## What shipped (prior sessions, retained for context)

### RAG precision optimization (+5.1pp total)
- Pass 1 (45.7% → 48.3%): golden set fix, lighting-reference stemmer fix, ADR-001 customer mode sentence, sop-vendor-onboarding key questions phrase, rubric-rep-score heading + density
- Pass 2 (48.3% → 50.8%): michael-graf team members sentence, circular graph boost fix (paul-graf/michael-graf related fields), paul-graf/patrick-graf body wikilink token leak fix, lighting-reference CRI retail line + dimming-protocols related removal
- Final eval: composite 90.7%, recall 100%, MRR 93.3%, precision 50.8%, entity cluster 86.1%
- rag-eval-matrix-v1.json committed

### Documentation
- RAG-EXPLAINER.md — beginner-friendly guide to the full RAG system

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

1. ~~**Wiki module enrichment**~~ — DONE (35/35 in this session).
2. **Vendor entity enrichment**: wiki/entities/vendors/ has 30 medium-confidence stub pages. Same 4-agent parallel pattern as batch 6 would clear them in one session once vendor data sources are stable.
3. **Concept page expansion**: wiki/concepts/ may have under-detailed pages (lighting-reference is the hub with low CRI/TM-30 density per the eval matrix).
4. **pgvector path** (M42/M43): optional embedding upgrade — not started, not blocked.

## Next-session entry point

1. Read BUILD_PLAN_MICHAEL.md — check which M-tasks Michael has completed since last session
2. If M41 done: test portal.html magic link flow end-to-end, confirm external_user_profiles provisioning
3. If M04 done: build 5.13 E-Commerce Command Center (BigCommerce REST + GMC)
4. If M06 done: build 6.1 (GA4) + 6.2 (GSC) integrations
5. If M09 done: build 6.4 Klaviyo integration
6. If nothing done: pick from "What Claude can build without Michael" above. Vendor entity enrichment (item 2) is the most direct continuation of this session's pattern.
