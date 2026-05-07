# Wiki Hot State
> Updated: 2026-05-07 — Module enrichment batch 2

## Current task
Module-page enrichment in progress (6 of 35 done). Pattern proven across 6 distinct module shapes (BM25 engine, plaintext export, CSV bulk import, signal aggregator, full CRUD with RFM, inline-edit grid). Remaining 29 stubs follow the same recipe.

## What shipped (this session)

### Module enrichment batch 2 (3 pages)
- **wiki/modules/alerts.md** — Track 6.8 cross-module signal aggregator: 9 generators with per-type severity rules, `(type, source_id)` dedupe, dismissed-can-resurface semantics, bell-icon `goTo()` wrapper. Confidence medium → high.
- **wiki/modules/customers.md** — Track 1.4 CRM hub: RFM compute thresholds, 5-segment classifier, 6-source name-match activity timeline, allow-listed inline edits, customer→deal preset with valueSeed, role-gate (Warehouse blocked). Confidence medium → high.
- **wiki/modules/inventory.md** — Track 5.3 phase 1: paginated 1000-row load, bulk upsert with `on_conflict (vendor_id, sku)`, inline-edit dependent-cell recompute (`qty_available` + low-stock styling), role-gated edits, inline RFC-4180 CSV parser shared with customers. Confidence medium → high.

### Module enrichment batch 1 (3 pages)
- **wiki/modules/wiki.md** — full BM25 grounding engine: 12 functions documented, 13-rule stemmer, `GRAPH_BOOST=0.2` graph re-rank, slug dedup, customer-mode entity exclusion, fallback path. Confidence medium → high.
- **wiki/modules/digest.md** — Daily Brief email export: 4 functions, role-aware `computeDailyBrief` reuse, plaintext output shape, `mailto:` export, failure modes. Confidence medium → high.
- **wiki/modules/vendor-score-import.md** — wide → long CSV import via `csvImportFlow` helper: `sbBulkSaveVendorScores`, `_buildVendorScoreAliasMap` auto-derivation from `CAT_DEFS`, `postProcess` vendor_id resolution, 0–10 score validation. Confidence medium → high.

## What shipped (prior sessions, retained for context)

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

1. **Wiki enrichment**: 29 module pages remaining in wiki/modules/ (6 of 35 enriched so far). Pattern: read `js/<name>.js` → write frontmatter + Functions table + Read deps + Shell touchpoints + Failure modes + cross-links to ADRs/concepts. Each page targets ≤700 words to stay below `wiki_lint.py` warning threshold.
2. **Vendor page enrichment**: wiki/entities/vendors/ has 30 pages — can be fleshed out as vendor data becomes available.
3. **pgvector path** (M42/M43): optional embedding upgrade — not started, not blocked.

## Suggested next enrichment batch

Pick high-fanout modules first (most cross-links, highest grounding value):
1. **pipeline-analytics** (`js/pipeline_analytics.js`) — pipeline forecast / win-rate analytics; pairs with the customers ↔ alerts triangle just enriched
2. **purchase-orders** (`js/purchase_orders.js`) — PO lifecycle + receipt flow that increments `inventory_items.qty_on_hand`; consumes inventory just enriched
3. **price-book** (`js/price_book.js`) — pure-compute over inventory + VD margin/markup; closes the inventory cluster

## Next-session entry point

1. Read BUILD_PLAN_MICHAEL.md — check which M-tasks Michael has completed since last session
2. If M41 done: test portal.html magic link flow end-to-end, confirm external_user_profiles provisioning
3. If M04 done: build 5.13 E-Commerce Command Center (BigCommerce REST + GMC)
4. If M06 done: build 6.1 (GA4) + 6.2 (GSC) integrations
5. If M09 done: build 6.4 Klaviyo integration
6. If nothing done: continue wiki/modules/ enrichment in the order suggested above (pipeline-analytics → purchase-orders → price-book). Read `js/<name>.js` first, then write following the batch-1/2 pattern.
