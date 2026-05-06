# AccentOS Wiki — Hot Cache

> Session context · ~500 words · **overwritten** (not appended) at the end of every `/aos-close`.
> Read silently at session start by Claude Code per `.claude/CLAUDE.md` AUTO-EXECUTE.
> Last overwritten: 2026-05-05 (wiki bootstrap session, v6.11.1).

---

## Current task
Pivoting `accent-rag` from a pure hybrid-RAG system (v6.11.0) to Andrej Karpathy's LLM Wiki pattern (v6.11.1) — markdown wiki at `wiki/` is now the primary knowledge layer; the prior pgvector + Cloudflare Worker + tsvector hybrid stack remains available as a secondary path for live operational data only. Pivot rationale captured in [[decisions/ADR-007-karpathy-wiki-pivot]].

## What just shipped (v6.11.1)
- `wiki/CLAUDE.md` — schema for AccentOS-flavored Karpathy wiki: page types (source / concept / entity / module / synthesis / decision), YAML frontmatter, naming conventions, cross-link discipline, three-layer rule.
- `wiki/index.md` + `wiki/log.md` + `wiki/hot.md` (this) + `wiki/overview.md` — the four operational wiki files.
- `wiki/concepts/` — 15 concept pages converted from v6.11.0 seed corpus (vendor scoring rubrics, lighting refs, SOPs, the Karpathy pattern itself).
- `wiki/decisions/` — ADRs 001-007 capturing pre-existing locked decisions plus the pivot ADR.
- `skills/accent-rag/SKILL.md` — re-framed: wiki primary, live-RAG secondary, BUILD-RAG dev tool.
- `skills/accent-rag/commands/` — slash command definitions (aos-ingest, aos-vendor, aos-customer, aos-recall, aos-lint, aos-today, aos-close, aos-process-inbox, aos-trace).
- `skills/accent-rag/scripts/wiki_lint.py` — offline linter (broken links, orphan pages, contradictions).
- `skills/accent-rag/scripts/wiki_seed.py` — bulk generator for module + vendor entity pages.
- `.claude/CLAUDE.md` — AUTO-EXECUTE step 6.5 added: read `wiki/hot.md` + last 10 `wiki/log.md` entries at session start.

## Open loops
- `wiki/modules/` not yet populated — `wiki_seed.py` runs against `js/*.js` to generate one page per module on next `/aos-close` or manually.
- `wiki/entities/vendors/` not yet populated for top 10 vendors — same path; needs VD_RAW data which lives in `index.html`. First-pass generation deferred to next session because VD_RAW is a JS array literal, not a JSON file, so wiki_seed.py needs an extraction step.
- 10 of the 14 scoring rubrics are still stubs in `wiki/index.md` — need their concept pages written. Cheap follow-up, ~30 min next session.
- Live-RAG pgvector path (M42 + M43 in BUILD_PLAN_MICHAEL.md) is now **optional** — should still ship eventually for live customer/GMC/sales data, but not blocking anything.
- AccentOS app sidebar Wiki entry (browses `wiki/` via fetch) was scoped but not built this session; it's the next high-value module after the wiki itself stabilizes.

## Next-session entry point
Read this file plus `wiki/log.md` last 10 entries (CLAUDE.md AUTO-EXECUTE handles both). Then `/aos-today` to get the morning briefing computed from wiki state + open loops + BUILD_PLAN deltas. The first concrete build target is the AccentOS-side **Wiki sidebar module**: a new `js/wiki.js` that fetches `wiki/index.md` and renders the catalog as a navigable list with a search input that calls BUILD-RAG against `wiki/`. Pattern is identical to existing Internal Docs (Track 5.1) except the data lives in static markdown files instead of Supabase. After that ship, the next batch of rubric concept pages closes out the vendor-scoring cluster.
