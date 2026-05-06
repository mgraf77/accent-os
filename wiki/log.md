# AccentOS Wiki — Log

> Append-only chronological record of every wiki operation. Most recent at bottom.
> Format: `## [YYYY-MM-DD] <operation> | <title>` followed by structured fields.
> Schema: see [`wiki/CLAUDE.md`](./CLAUDE.md).

---

## [2026-05-05] bootstrap | wiki/ created (v6.11.1)

**Trigger:** Karpathy LLM Wiki pivot — see [[decisions/ADR-007-karpathy-wiki-pivot]].
**Operation:** Initial scaffold of the AccentOS Wiki.
**Pages created:**
- `wiki/CLAUDE.md` — schema (Layer 3)
- `wiki/index.md` — master catalog
- `wiki/log.md` — this file
- `wiki/hot.md` — session context
- `wiki/overview.md` — high-level synthesis
- Directory structure: `wiki/{entities,concepts,modules,sources,syntheses,decisions,inbox,raw}/`
- ADRs 001–007 (covering pre-existing locked decisions in MASTER.md plus this pivot)
**Pages updated:** none (bootstrap)
**Source ingested:** none (this is structural setup)
**Contradictions flagged:** none
**Notes:** Layer 1 raw sources remain in repo root unchanged — `MASTER.md`, `BUILD_PLAN_*.md`, `BUILD_INTELLIGENCE.md`, `SESSION_LOG.md`, `PROMPT_LOG.md`, `js/`, `sql/`, `index.html`, `skills/`. The wiki layer reads from them but never writes back. `wiki/raw/` is reserved for **external** raw sources (PDFs, articles, transcripts) that get added via `/aos-ingest`.

---

## [2026-05-05] ingest-batch | seed concepts from corpus

**Trigger:** Convert the v6.11.0 `skills/accent-rag/ingest-corpus/seed.json` (15 entries) into proper wiki concept pages with frontmatter + cross-links + cluster topology.
**Source ingested:** [[sources/seed-corpus-v1]] (the JSON file, treated as a Layer-1 source)
**Pages created:**
- `wiki/concepts/vendor-scoring.md` (cluster hub)
- `wiki/concepts/rubric-discount.md`
- `wiki/concepts/rubric-imap-enforcement.md`
- `wiki/concepts/rubric-freight.md`
- `wiki/concepts/rubric-rep-score.md` (admin-only — see [[decisions/ADR-003-rep-score-admin-only]])
- `wiki/concepts/lighting-reference.md` (cluster hub)
- `wiki/concepts/lumen-output-commercial.md`
- `wiki/concepts/color-temperature-selection.md`
- `wiki/concepts/cri-tm30-tlci.md`
- `wiki/concepts/emergency-lighting-compliance.md`
- `wiki/concepts/dimming-protocols.md`
- `wiki/concepts/sop-vendor-onboarding.md`
- `wiki/concepts/sop-quote-creation.md`
- `wiki/concepts/sop-rep-outreach.md`
- `wiki/concepts/karpathy-llm-wiki.md`
- `wiki/syntheses/vendor-data-state-2026-05-05.md` (snapshot synthesis)
**Pages updated:** `wiki/index.md` (registered all new pages under their clusters)
**Contradictions flagged:** none
**Notes:** Remaining 10 scoring rubrics (returns-policy, lead-time, marketing-funds, display-allowance, spiff, web-listing, dtc-consumer-direct, consumer-demand, rebates, coop) and ~7 more concept pages will materialize as the corpus expands beyond the seed.

---

## [2026-05-05] decisions-batch | ADR-001 through ADR-007 filed

**Trigger:** Capture the seven pre-existing locked decisions in MASTER.md (plus the wiki pivot) as proper ADR pages so future sessions can `/aos-trace` them.
**Pages created:**
- `wiki/decisions/ADR-001-vanilla-js-no-build.md`
- `wiki/decisions/ADR-002-supabase-pgvector-mcp-broken.md`
- `wiki/decisions/ADR-003-rep-score-admin-only.md`
- `wiki/decisions/ADR-004-zero-added-cost.md`
- `wiki/decisions/ADR-005-session-log-replaces-notion.md`
- `wiki/decisions/ADR-006-module-modes-registry.md`
- `wiki/decisions/ADR-007-karpathy-wiki-pivot.md`
**Pages updated:** `wiki/index.md` (Decisions section)
**Notes:** ADR-007 supersedes the earlier "build pgvector + worker as primary" approach implied by v6.11.0; the pgvector path is preserved as a SECONDARY surface for live operational data, not the primary knowledge layer.

---
