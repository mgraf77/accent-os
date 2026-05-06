# wiki/CLAUDE.md — AccentOS Wiki Schema

> This file turns Claude Code into a disciplined wiki maintainer for the AccentOS Wiki at `wiki/`.
> Following Andrej Karpathy's LLM Wiki pattern, AccentOS-flavored.
> Skill: `skills/accent-rag/`

## Domain

**Accent Lighting Inc.** — commercial + residential lighting distributor in Wichita, KS. AccentOS is the agentic operating system being built for the company. This wiki captures every stable knowledge artifact the business and the system depend on.

## Three-layer rule

| Layer | Path | Rule |
|---|---|---|
| 1. Raw sources | `MASTER.md`, `BUILD_*.md`, `SESSION_LOG.md`, `PROMPT_LOG.md`, `js/`, `sql/`, `index.html`, `wiki/raw/` | **Immutable.** Read freely. **Never modify** during ingestion. |
| 2. Wiki | `wiki/` (every dir except `raw/` and `inbox/`) | **LLM-owned.** Created and maintained by Claude Code. Humans curate; Claude writes. |
| 3. Schema | `wiki/CLAUDE.md` (this file) | The contract. Update only by deliberate ADR. |

## Page types

Every wiki page has YAML frontmatter and a `type:` field. Allowed types and their schemas:

### `type: source`
Summary of a single raw source. Lives in `wiki/sources/`.
```yaml
---
type: source
title: "<title verbatim or close>"
source_path: <repo-relative path or URL>
date_ingested: YYYY-MM-DD
date_published: YYYY-MM-DD
key_claims:
  - claim 1
  - claim 2
related: [[concept-or-entity-slug]], [[other-slug]]
confidence: high | medium | low
---
```
Body: 3-section minimum — Summary (≤200 words), Key Claims (bulleted, sourced), Cross-refs.

### `type: concept`
A reusable idea. Lives in `wiki/concepts/`.
```yaml
---
type: concept
title: <Title Case>
slug: <kebab-case>
aliases: [alt-name, abbreviation]
sources: [[source-slug]], [[other-source-slug]]
related: [[concept-slug]], [[entity-slug]]
cluster: <cluster-name or null>
cluster_role: hub | member | leaf
confidence: high | medium | low
contradictions: []
open_questions: []
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```
Body: Definition · Key claims (sourced) · In this cluster (if hub) · Related concepts · Open questions · Contradictions.

### `type: entity`
A real-world thing AccentOS tracks. Lives in `wiki/entities/{vendors|customers|employees|reps}/`.
```yaml
---
type: entity
entity_kind: vendor | customer | employee | rep | parent_company
title: <name verbatim>
slug: <kebab-case>
external_ids:
  vendor_id: <if vendor>
  customer_id: <if customer>
  user_id: <if employee>
status: active | inactive | archived | prospect
tier: A | B | C | null
parent: [[parent-company-slug]] | null
sources: [[source-slug]], ...
related: [[concept-slug]], ...
created: YYYY-MM-DD
updated: YYYY-MM-DD
data_snapshot_date: YYYY-MM-DD
---
```
Body: Profile · Terms (vendors) or RFM (customers) · Score Breakdown (vendors) · History · Linked records · Open Loops.

### `type: module`
An AccentOS code module. Lives in `wiki/modules/`.
```yaml
---
type: module
title: <module-name>
slug: <module-name>
file: js/<module-name>.js
sidebar_entry: <PAGE_META key>
roles: [Owner, Admin, Manager, Sales, Warehouse]
shipped_in: vX.Y.Z
status: live | building | deprecated | hidden
depends_on: [<table>, <module>, ...]
sources: [[build-plan-claude]], [[build-intelligence]]
related: [[concept-slug]], ...
updated: YYYY-MM-DD
---
```
Body: Purpose · Persistence · UI · Cross-module reads · Gotchas (sourced from BUILD_INTELLIGENCE) · Open Loops.

### `type: synthesis`
Comparative analysis or filed answer. Lives in `wiki/syntheses/`.
```yaml
---
type: synthesis
title: <Title Case>
sources: [[source-slug]], ...
related: [[concept-slug]], ...
filed_from_query: true | false
date: YYYY-MM-DD
confidence: high | medium | low
---
```

### `type: decision`
Architecture decision record. Lives in `wiki/decisions/`. Numbered: `decisions/ADR-NNN-<slug>.md`.
```yaml
---
type: decision
adr: NNN
title: <decision title>
status: proposed | accepted | superseded | deprecated
superseded_by: ADR-XXX | null
date: YYYY-MM-DD
deciders: [Michael, Claude]
related: [[concept-slug]], ...
---
```
Body: Context · Decision · Consequences · Alternatives considered · Sources.

## Workflows

### Ingest workflow (`/aos-ingest <path>`)
1. Read the source verbatim.
2. Discuss 3–5 takeaways with Michael IF the run is interactive; otherwise extract them.
3. Create or update `wiki/sources/<source-slug>.md` (page type `source`).
4. For each entity / concept the source touches, **create or revise** the relevant `wiki/entities/...` or `wiki/concepts/<slug>.md` page. Add a `[[source-slug]]` reference to the `sources:` field.
5. Update `wiki/index.md` — add new pages under their category, update one-line summaries on revised pages.
6. Append a `## [YYYY-MM-DD] ingest | <source title>` block to `wiki/log.md` listing every page created and updated.
7. Flag any contradictions explicitly inline as `> ⚠️ Contradicts [[other-page]]: ...` AND in the affected page's `contradictions:` frontmatter.

### Query workflow (`/aos-recall <topic>`)
1. Run `python3 skills/accent-rag/scripts/rag_search.py "<topic>" --k 8 --path-prefix wiki/ --format json`.
2. Group results by page (a single page may have multiple chunks).
3. Read the top 3-5 wiki pages in full.
4. Optionally also call BUILD-RAG without the `--path-prefix wiki/` filter to surface raw-source hits the wiki hasn't compounded yet — flag those as "candidate ingestion."
5. Synthesize an answer that cites pages by `[[slug]]`. If the answer becomes valuable enough, file it as a `wiki/syntheses/<slug>.md`.

### Lint workflow (`/aos-lint`)
Run `python3 skills/accent-rag/scripts/wiki_lint.py`. Reports:
- Broken `[[wikilinks]]` (link target doesn't exist)
- Orphan pages (page exists but no other page links to it AND it's not in `wiki/index.md`)
- Pages older than 90 days flagged `confidence: low` (re-evaluate with current data)
- Pages whose `sources:` list contains a slug that doesn't exist
- Contradictions: any frontmatter `contradictions:` non-empty list
- Index drift: pages that exist on disk but aren't in `wiki/index.md`
- Log drift: log entries that name pages that don't exist

Output goes to stdout. Resolve in a focused batch — don't dribble fixes across many sessions.

### Session-start workflow (auto, per `.claude/CLAUDE.md`)
1. After the existing AUTO-EXECUTE steps, also read `wiki/hot.md` (~500 words, last session's snapshot).
2. Re-read `wiki/log.md` last 10 entries.
3. Apply both as additional context for the session.

### Session-close workflow (`/aos-close`)
1. Append a `## [YYYY-MM-DD] session-close` block to `wiki/log.md` listing every page touched + the user-facing changes shipped (cross-ref the SESSION_LOG.md entry).
2. **Overwrite** `wiki/hot.md` with a fresh ~500 word session-end snapshot. Format: Current task (1 sentence) · What just shipped (3–5 bullets) · Open loops (3–5 bullets) · Next-session entry point (1 paragraph).

### Inbox workflow (`/aos-process-inbox`)
1. List every file in `wiki/inbox/`.
2. For each: classify (which page type), integrate into the appropriate concept/entity/synthesis page, then **move** the inbox file to `wiki/raw/inbox-archive/<YYYY-MM-DD>/`.
3. Append the integrations to `wiki/log.md` as a single `## [YYYY-MM-DD] inbox-process` block.

## Naming conventions

- Slugs: kebab-case, lowercase, no punctuation, no numbers unless meaningful (e.g. `m42-pgvector` is OK; `customer-1234` is OK).
- File names match slugs: `wiki/concepts/vendor-scoring.md`, `wiki/entities/vendors/visual-comfort.md`.
- `[[wikilinks]]` use the slug, not the title: `[[vendor-scoring]]`, not `[[Vendor Scoring]]`.
- ADR files: `wiki/decisions/ADR-007-rag-vs-wiki-pivot.md` — three-digit zero-padded sequence.
- Vendor entity slugs derived from vendor name, lowercased, kebab. Drop suffixes like `INC`, `LLC` unless ambiguous.

## Safety rules

1. **Never modify Layer 1** under any circumstance. If a raw source seems wrong, ingest it AS IS and write a contradiction note in the relevant concept page.
2. **Always update `wiki/index.md`** when creating or renaming a page.
3. **Always append to `wiki/log.md`** when running an ingest, lint, recall-that-files-a-synthesis, or session-close.
4. **Mark low-confidence claims** with `confidence: low` in frontmatter AND inline as `> _Low confidence — derived from a single source._`.
5. **Never silently delete a page.** Renames go through git mv with a redirect stub left at the old path for one ingest cycle.
6. **PII and credentials never enter the wiki.** Customer phone/email is OK for entity pages (it's already in Supabase); credentials, API keys, and `_active.md` content are not.

## Cross-link discipline

- Concept pages SHOULD link upward to a hub concept and downward to source pages.
- Entity pages SHOULD link to all concepts they exemplify and all sources that mention them.
- Synthesis pages MUST link to every concept and source they synthesize from.
- ADR pages MUST link to the concept(s) the decision affects.
- A page with zero links inbound and outbound is an orphan and gets flagged on lint.

## Confidence rubric

| Level | Meaning |
|---|---|
| `high` | ≥ 2 independent sources agree, OR a single authoritative source (vendor playbook signed by vendor, MASTER.md statement). |
| `medium` | 1 reliable source, no contradictions detected. |
| `low` | Single source AND that source is hearsay, undated, or known-imperfect (e.g. rep verbal claim, "I think we did X"). |

## Cluster topology

The wiki is a **tree**, not a graph soup. Hub concepts list their members; members link upward; syntheses are leaves. Avoid cycles. If two concepts seem to mutually depend, hoist the shared idea into a third concept and have both children point at it.

Example cluster:
- `[[vendor-scoring]]` (hub)
  - `[[rubric-discount]]` (member)
  - `[[rubric-imap]]` (member)
  - `[[rubric-freight]]` (member)
  - ... 11 more rubrics
  - `[[rubric-rep-score]]` (member, admin-only)
- syntheses: `[[scoring-curve-bell-distribution]]`, `[[unverified-vs-confirmed-absent]]`

## What this wiki is NOT

- Not a place to dump raw documents. Those go in `wiki/raw/` (Layer 1).
- Not a chat log. SESSION_LOG.md handles that.
- Not a build queue. BUILD_PLAN_CLAUDE.md handles that.
- Not a per-session scratch pad. WORK_IN_PROGRESS.md handles that.
- Not a backup. The wiki is **derived knowledge**; the source-of-truth tables are still in Supabase / VD_RAW / Windward.
