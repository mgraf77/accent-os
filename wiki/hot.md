# Wiki Hot State
> Updated: 2026-05-06 — v6.11.1 shipped

## Current task
COMPLETE — v6.11.1 Karpathy LLM Wiki full build shipped.

## What shipped (this session)
- accent-rag skill: SKILL.md + 9 slash commands (aos-ingest/search/wiki/build/eval/lint/index/ralph/close)
- wiki infrastructure: CLAUDE.md schema, index.md, log.md, hot.md, overview.md
- 25 concept pages: vendor-scoring hub + 14 rubric pages + karpathy-llm-wiki + lighting-reference hub + 5 lighting sub-pages + 3 SOP pages
- 7 ADR decision pages (ADR-001 through ADR-007)
- 3 employee entity pages (michael-graf, paul-graf, patrick-graf)
- 6 source summary pages
- 1 synthesis page (rag-eval-matrix-v1)
- 5 Python tooling scripts (wiki_lint, wiki_seed, rag_build_index, rag_search, rag_eval)
- js/wiki.js — AccentOS Wiki sidebar module (two-pane layout, search, wikilinks)
- index.html — sidebar entry under INTELLIGENCE, PAGE_META, dispatcher, script tag, version v6.11.1
- sendChat() — wiki-grounding (term overlap → fetch wiki page → inject context → "Grounded · N wiki" pill)
- .claude/CLAUDE.md — AUTO-EXECUTE step reads wiki/hot.md + last 10 wiki/log.md entries
- rag_build_index.py — 1.3× BM25 boost for wiki/ chunks; --wiki-only flag
- rag_eval.py — 30 golden Q&A pairs, 6-dim scoring (recall, precision, coverage, latency, cost, maintenance)
- rag-eval-matrix-v1.md — synthesis page with scoreboard
- 3 Ralph loops run; 0 issues after loop 3
- BUILD_PLAN_CLAUDE item 6.13 checked off
- MASTER.md §3 version v6.11.1, Wiki module in live table

## Open loops
- wiki/entities/vendors/ — top 30 vendors by sales not yet populated (wiki_seed.py will auto-gen)
- wiki/modules/ — auto-gen from js/*.js pending (wiki_seed.py step 2)
- wiki/entities/customers/ — intentionally empty (sensitive, never auto-gen)
- M42/M43 pgvector — optional, not yet activated
- wiki_seed.py: VD_RAW extraction from index.html regex not yet run (manual step needed)

## Next-session entry point
1. Run: `python3 skills/accent-rag/scripts/wiki_seed.py --modules` to auto-gen wiki/modules/ from js/*.js
2. Run: `python3 skills/accent-rag/scripts/wiki_seed.py --vendors` to auto-gen wiki/entities/vendors/ from VD_RAW
3. Run: `python3 skills/accent-rag/scripts/wiki_lint.py` — verify zero errors
4. Run: `python3 skills/accent-rag/scripts/rag_build_index.py` — rebuild index with wiki boost
5. Run: `python3 skills/accent-rag/scripts/rag_eval.py` — verify scoreboard
6. If any lint errors or eval regressions: fix and re-run before pushing
