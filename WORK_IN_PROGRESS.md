## WORK IN PROGRESS
> Overwritten after every discrete build step.

**Last updated:** 2026-05-07 — RAG optimization rounds 1-3 complete
**Current task:** COMPLETE — 3 optimization rounds shipped, composite 91.4% → 92.4%

**Completed this session:**
- Round 1: Stop word filtering (STOP_WORDS in rag_search.py + rag_eval.py) + CRI content enrichment
- Round 1: Precision 48.3% → 55.2%, Composite 91.4% → 92.5%
- Round 2: 4 content enrichments (lighting-reference, karpathy-llm-wiki, rubric-display, sop-rep-outreach)
- Round 2: Precision 55.2% → 56.2%, Composite 92.5% → 92.7%; karpathy+ADR-007 both surface for wiki-first query
- Round 3: Per-type wiki boost (concept 1.5×, decision 1.4×, entity 1.2×, module 1.1×, source 1.0×)
- Round 3: Golden set expanded 32 → 40 queries (entity, architecture, lighting edge case)
- Round 3: 100% recall maintained across all 40 queries, Composite 92.4%

**Commits this session:**
- 11f0591: rag: README.md (prior sub-session)
- ca95897: rag: 3-round optimization (stop words, content enrichment, per-type boost)

**Next step if interrupted:**
1. Check BUILD_PLAN_MICHAEL.md for newly completed M-tasks
2. If M41 done: test portal.html magic link flow
3. If M04 done: build 5.13 E-Commerce Command Center
