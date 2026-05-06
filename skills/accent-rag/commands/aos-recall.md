---
name: aos-recall
description: >
  Wiki-aware retrieval. Loads the most relevant wiki pages into context for a query, with
  a fallback grep over Layer-1 raw sources for any topic the wiki hasn't compounded yet.
  Output is a ranked list with each page's top section + the wikilinks it points to,
  plus a "candidate ingestion" list for any raw-source hit that lacks a wiki page.
trigger: "/aos-recall"
---

# /aos-recall <topic>

## Steps

1. **Search the wiki first.**
   ```bash
   python3 /home/user/accent-os/skills/accent-rag/scripts/rag_search.py "<topic>" \
     --k 8 --path-prefix wiki/ --format json
   ```
   Group hits by page (collapse multi-chunk hits to one row per page).

2. **Read the top 3–5 pages in full** via `Read`. Note each page's `confidence:` and `contradictions:` frontmatter.

3. **Search Layer-1 sources separately** to catch anything the wiki hasn't ingested yet:
   ```bash
   python3 /home/user/accent-os/skills/accent-rag/scripts/rag_search.py "<topic>" \
     --k 6 --format json
   # then drop any hit whose path starts with "wiki/"
   ```
   Each remaining hit is a **candidate ingestion**.

4. **Synthesize an answer.** Cite wiki pages by `[[slug]]`. State confidence. If contradictions exist on a cited page, surface them.

5. **If the answer is valuable enough to retain** — i.e. another session would re-ask the same question — file the synthesis as `wiki/syntheses/<topic-slug>.md` (`type: synthesis`) and append a `## [date] recall-filed | <topic>` entry to `wiki/log.md`.

6. **Output a "candidate ingestion" line** for any Layer-1 hit that wasn't already covered by a wiki page. Format: `Consider /aos-ingest <path> — <one-line reason>`.

## Output format

```
## /aos-recall · <topic>

**Wiki coverage:**
1. [[concepts/vendor-scoring]] · confidence:high · 2 contradictions flagged
2. [[entities/vendors/visual-comfort]] · confidence:high · last-updated 2026-04-22
3. [[syntheses/imap-enforcement-tier-correlation]] · confidence:medium

**Answer:** <synthesized response with [[wikilinks]]>

**Candidate ingestion (raw sources without wiki coverage):**
- /aos-ingest BUILD_INTELLIGENCE.md — entry on rubric drift not yet in wiki/concepts/vendor-scoring
- /aos-ingest sql/M21_phase3_schema.sql — articles table schema not in wiki/modules/knowledge-engine
```

## Anti-patterns

- Never answer from your own memory if the wiki has a page on the topic. Read the page.
- Never cite a wiki page by `wiki/...md` — use `[[slug]]`.
- Never skip the "candidate ingestion" output — it's what keeps the wiki growing.
