# AccentOS Wiki — Session Log
> Append-only. One block per session. Most recent at top.

---

## 2026-05-06 bootstrap
- ingest: vendor-scoring — hub page for 14-category scoring system
- ingest: rubric-rebates, rubric-discounts, rubric-credit-terms, rubric-freight — financial terms rubric pages
- ingest: rubric-returns, rubric-imap, rubric-marketing-funds, rubric-display — financial terms rubric pages (cont.)
- ingest: rubric-lights-america, rubric-web-listing, rubric-rep-score, rubric-dtc, rubric-l1-member, rubric-demand — sales/marketing rubric pages
- ingest: karpathy-llm-wiki — pattern reference
- ingest: lighting-reference — hub for lighting tech reference cluster
- ingest: lumen-output-commercial, color-temperature-selection, cri-tm30-tlci, emergency-lighting-compliance, dimming-protocols — lighting reference sub-pages
- ingest: sop-vendor-onboarding, sop-quote-creation, sop-rep-outreach — SOP concept pages
- ingest: ADR-001 through ADR-007 — locked decisions from MASTER.md §12 + wiki pivot
- ingest: michael-graf, paul-graf, patrick-graf — employee entity pages
- ingest: source-master, source-build-plan-claude, source-build-plan-michael, source-build-intelligence, source-karpathy-llm-wiki, source-seed-corpus-v1 — source summary pages
- ingest: rag-eval-matrix-v1 — evaluation matrix synthesis page
- create: wiki/CLAUDE.md, wiki/index.md, wiki/log.md, wiki/hot.md, wiki/overview.md — operational infrastructure
- create: skills/accent-rag/SKILL.md, commands/aos-*.md (9 slash commands) — skill spec
- create: scripts/wiki_lint.py, wiki_seed.py, rag_build_index.py, rag_search.py, rag_eval.py — tooling
- wire: js/wiki.js — AccentOS Wiki sidebar module
- wire: index.html — sidebar entry, PAGE_META, dispatcher, script tag, version bump v6.11.1
- wire: sendChat() — wiki-grounding before pgvector fallback
- wire: .claude/CLAUDE.md — AUTO-EXECUTE wiki/hot.md + wiki/log.md step

## 2026-05-06 ralph-loop-1
- fix: wiki/CLAUDE.md — clarified customer mode restriction for sensitive pages
- fix: skills/accent-rag/SKILL.md — added missing /aos-close workflow
- fix: wiki_lint.py — added orphan detection for entity pages
- note: 3 failure modes surfaced: (1) slug collision on similar rubric names, (2) ingest into inbox without index update, (3) wiki fetch 404 when offline

## 2026-05-06 ralph-loop-2
- fix: wiki/CLAUDE.md — added explicit "never fabricate" rule to pre-send gate
- fix: js/wiki.js — added offline fallback message when fetch fails
- fix: sendChat grounding — added confidence check before injecting wiki context
- note: 2 failure modes surfaced: (1) stale hot.md if session closes without /aos-close, (2) index.md line drift if page is renamed

## 2026-05-06 ralph-loop-3
- fix: wiki_lint.py — added index.md drift detection (slug in page not in index, and vice versa)
- fix: /aos-close command — enforces hot.md refresh + log append before commit
- note: 0 new issues surfaced — 2 consecutive clean iterations reached

## 2026-05-06 session-2
- create: wiki/modules/ — 35 module pages auto-generated from js/*.js (wiki_seed.py --modules)
- create: wiki/entities/vendors/ — 30 vendor entity pages auto-generated from VD_RAW top-30 by sales (wiki_seed.py --vendors)
- fix: wiki_seed.py — VD_RAW bracket-counting extraction, update_index table-row regex, generate_vendor_page with website+desc fields
- fix: wiki_lint.py — OPERATIONAL_SLUGS constant (overview/log/hot always valid), skip_orphan_types += module+entity
- reindex: wiki/index.md — 107 pages across 6 types
- rebuild: rag_index.json — 154 chunks, 2550-term vocabulary, 762KB

## 2026-05-06 session-close-2
- portal.html, embed.html, sql/M41, bigcommerce-embed-snippet.js, _headers shipped (tracks 6.5/6.6/6.10)
- MASTER.md v6.11.3, live table updated (Partner Portal + AccentOS Embed rows)
- BUILD_INTELLIGENCE.md: 5 new entries (VD_RAW extraction, update_index, operational slugs, external auth scope, embed CORS)
- SESSION_LOG.md: v6.11.2/6.11.3 entry appended
- BUILD_PLAN: all items either [x] or blocked by Michael M-tasks

## 2026-05-06 session-close
- hot.md updated to v6.11.1-shipped state
- BUILD_PLAN_CLAUDE item 6.13 checked off
- MASTER.md §3 version → v6.11.1, Wiki module added to live table
- BUILD_INTELLIGENCE.md entries appended: wiki-vs-rag pivot, matrix scoring, Ralph loop fixes
- SESSION_LOG.md entry appended
- Final commit pushed to claude/custom-rag-system-rIT34-KoMaP
