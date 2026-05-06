# accent-rag — Page Weight Reference

> Formula: `final_score = keyword_score × (weight / 10)`
> Higher weight = page surfaces more aggressively in retrieval results.

## Default weights by type

| type | default weight | rationale |
|---|---|---|
| sop | 8 | Actionable procedures — almost always what users need for workflow Q&A |
| runbook | 8 | System-level procedures — same priority as SOP |
| adr | 7 | Architectural context — surfaces for "why" and "how" system design questions |
| cluster | 7 | Product knowledge — surfaces for product/quoting/inventory Q&A |
| entity | 6 | People/role context — supporting, not primary |
| source_summary | 5 | Integration background — surfaces only for integration Q&A |
| concept | 5 | Domain definitions — background context |

## Override rules

Individual page `weight:` in frontmatter takes precedence over type defaults.

**Use weight 9–10 when:**
- The page is the canonical answer to a frequently asked question
- Any mention of the topic should guarantee this page is returned
- Examples: SOP pages for the 3 most common workflows

**Use weight 1–4 when:**
- The page is historical reference only (deprecated process)
- The page is a stub (`status: draft`)
- Content is covered by a more specific page

## Current high-weight pages (weight ≥ 8)

| id | weight | type | rationale |
|---|---|---|---|
| sop-001-vendor-onboarding | 9 | sop | "add vendor" must always return this |
| sop-002-quote-to-close | 9 | sop | "create quote" / "close deal" must always return this |
| sop-003-inventory-reorder | 9 | sop | "reorder" / "low stock" / "PO" must always return this |
| adr-007-wiki-rag-vs-pgvector | 8 | adr | Canonical answer to "why not pgvector" |

## Full page weight table

| id | type | weight | status |
|---|---|---|---|
| sop-001-vendor-onboarding | sop | 9 | published |
| sop-002-quote-to-close | sop | 9 | published |
| sop-003-inventory-reorder | sop | 9 | published |
| adr-007-wiki-rag-vs-pgvector | adr | 8 | published |
| indoor-decorative | cluster | 7 | published |
| outdoor-architectural | cluster | 7 | published |
| commercial-hospitality | cluster | 7 | published |
| adr-001-module-architecture | adr | 7 | published |
| adr-002-supabase-backend | adr | 7 | published |
| emp-owner | entity | 6 | published |
| emp-sales | entity | 6 | published |
| emp-warehouse | entity | 6 | published |
| adr-003-localstorage-personal | adr | 6 | published |
| adr-005-append-only-observations | adr | 6 | published |
| adr-006-csv-import-standard | adr | 6 | published |
| supabase-source | source_summary | 6 | published |
| adr-004-inline-onclick | adr | 5 | published |
| windward-erp | source_summary | 5 | published |
| bigcommerce | source_summary | 5 | published |

## Weight audit protocol

Run a weight audit when:
- A new SOP is added (check if existing SOPs still warrant their weights)
- A page is renamed or split (reset weight review)
- Retrieval self-test in wiki_seed.py shows unexpected rank-1 failures

Tool: `python scripts/wiki_lint.py` flags draft pages with weight > 8.

Cadence: review after each session that adds ≥3 pages.
