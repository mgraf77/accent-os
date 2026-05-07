## WORK IN PROGRESS
> Overwritten after every discrete build step.

**Last updated:** 2026-05-07 — RAG optimization loops complete
**Current task:** COMPLETE — recall 56.2% → 100%, composite 80.4% → 91.4%

**Completed this session:**
- rag_search.py: synthesis exclusion by default, --include-synthesis flag, stemmer, digit-tech tokenizer
- rag_build_index.py: suffix stemmer + digit-anchored tokenizer (0-10v, 2700k etc.)
- rag_eval.py: simple_search synthesis exclusion + matching tokenizer
- source-seed-corpus-v1: reclassified synthesis (was contaminating all clusters like rag-eval-matrix-v1)
- overview.md: reclassified concept (was synthesis → excluded from search), added team section
- wiki_lint.py: OPERATIONAL_SLUGS removes "overview", skip_files removes "overview.md"
- wiki/index.md: overview moved to concept pages, source-seed-corpus-v1 moved to synthesis
- 6 wiki pages enriched: rubric-rebates, rubric-imap, rubric-rep-score, sop-quote-creation, lumen-output-commercial, source-build-intelligence, employee pages (michael/paul/patrick)
- js/wiki.js wikiGroundQuery: upgraded from title-only to title+body two-pass re-ranking
- rag_index.json rebuilt: 155 chunks, 3166 terms, 936KB
- wiki/log.md + wiki/hot.md updated

**Commits this session:**
- 2b7530c: docs: v6.11.3 close-out (prior session)
- [pending]: rag: optimization loops 1-3 (100% recall)

**Next step if interrupted:**
1. Commit pending changes: git add rag scripts + wiki pages + js/wiki.js + rag_index.json
2. Push to claude/custom-rag-system-rIT34-KoMaP
3. Check BUILD_PLAN_MICHAEL.md for newly completed M-tasks
