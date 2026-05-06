---
name: accent-rag
description: >
  Knowledge system for AccentOS at Accent Lighting Inc. Two coexisting paths under one skill:
  (a) PRIMARY — the AccentOS Wiki, an LLM-maintained markdown knowledge base at wiki/
  following Andrej Karpathy's LLM Wiki pattern: raw sources are immutable, the wiki is
  curated/compounding markdown that Claude Code maintains via slash commands, and
  wiki/CLAUDE.md is the schema that makes Claude a disciplined wiki maintainer rather than
  a generic chatbot. Vendor playbooks, scoring rubrics, SOPs, module docs, concept glossary
  — every stable knowledge artifact lives in wiki/, gets cross-linked via [[wikilinks]], and
  accumulates across sessions instead of being re-derived per query.
  (b) SECONDARY — Hybrid retrieval (Supabase pgvector + tsvector RRF + Cloudflare Workers AI
  embeddings + Claude reranker) for FAST-MOVING OPERATIONAL DATA the wiki can't compound
  around quickly enough: live vendor sales deltas, GMC issue feeds, customer interaction
  streams. Plus BUILD-RAG, a local BM25 index over the repo for Claude Code session-start
  retrieval (~1s reindex, no API calls).
  Trigger phrases: "/aos-ingest", "/aos-vendor", "/aos-customer", "/aos-recall",
  "/aos-lint", "/aos-today", "/aos-close", "ingest into the wiki", "update the wiki",
  "what does the wiki say about", "lint the wiki", "wiki this", "rag this", "build a wiki
  page for", "search the repo for", "did we ship".
  Use this skill any time Claude Code or AccentOS needs to ground a generation in retrieved
  AccentOS context, write a new wiki page, update an existing wiki page from a source,
  or audit the wiki for contradictions and orphan pages.
  Never use this skill for: short factual lookups already in CLAUDE.md, single-file edits
  where grep beats RAG, or generating fresh creative content the corpus has no business
  constraining.
---

# accent-rag — AccentOS Knowledge System

**Purpose.** Make AccentOS knowledge **compound** instead of re-derive. Three retrieval surfaces under one skill, but the **wiki is the canonical layer** — the other two exist to feed it or to handle data that moves faster than the wiki cycle.

| Surface | Pattern | When to use |
|---|---|---|
| **AccentOS Wiki** (primary) | Karpathy LLM Wiki — markdown, git-tracked, LLM-maintained | Stable, curated knowledge: vendor playbooks, scoring rubrics, SOPs, module docs, concepts, decision logs, syntheses. The default. |
| **Live RAG** (secondary) | Supabase pgvector + tsvector hybrid via RRF · free Workers AI embeddings · Claude Haiku rerank | Fast-moving operational data the wiki can't keep up with: customer interaction streams, GMC issue feeds, daily vendor sales deltas, ticket queues. **Optional** — system works without M42/M43. |
| **BUILD-RAG** (dev tool) | Local BM25 over the repo · pure stdlib · no API calls | Claude Code session-start retrieval over the entire repo. Always on. |

The AccentOS Wiki replaces what most teams use Notion for: a place where vendor knowledge, scoring decisions, gotchas, and architecture decisions accumulate. The difference is that **Claude Code maintains it**, not humans. Humans curate and direct; the LLM does the cross-referencing, contradiction-flagging, and indexing.

---

## The Wiki — three layers

### Layer 1 — Raw sources (immutable)
Claude reads them; Claude **never** modifies them. Live in the repo as they always have:
- `MASTER.md`, `BUILD_PLAN_CLAUDE.md`, `BUILD_PLAN_MICHAEL.md`, `BUILD_INTELLIGENCE.md`, `SESSION_LOG.md`, `PROMPT_LOG.md`, `WORK_IN_PROGRESS.md`, `KPI_CATALOG.md`, `MODULE_MODES.md`
- All `js/*.js`, `sql/M*.sql`, `index.html`
- All `skills/*/SKILL.md` and `skills/*/references/*.md`
- External imports (when added): `wiki/raw/articles/`, `wiki/raw/papers/`, `wiki/raw/transcripts/`, `wiki/raw/data/`

### Layer 2 — The Wiki (LLM-maintained)
Lives at `/home/user/accent-os/wiki/`. Pure markdown. Git-tracked. Editable by humans but generally written by Claude Code via the slash commands below.

```
wiki/
├── CLAUDE.md            # Layer 3 — schema (see below)
├── index.md             # Master catalog of every wiki page, by category
├── log.md               # Append-only chronological record of every wiki operation
├── hot.md               # Session context (~500 words, overwritten each /aos-close)
├── overview.md          # High-level AccentOS state synthesis
├── entities/
│   ├── vendors/         # one page per vendor (kebab-case slug)
│   ├── customers/       # one page per customer
│   ├── employees/       # one page per employee
│   └── reps/            # one page per rep group
├── concepts/            # vendor-scoring, rls-pattern, csv-import-flow, contextual-retrieval, etc.
├── modules/             # one page per AccentOS module (vendors, pipeline, customers, ...)
├── sources/             # summary page per raw source (master, build-intelligence, prompt-queue, ...)
├── syntheses/           # comparative analyses, decision logs, retrospectives
├── decisions/           # architecture decision records (ADRs)
└── inbox/               # drop-zone for fleeting notes; `/aos-process-inbox` integrates
```

### Layer 3 — Schema (`wiki/CLAUDE.md`)
The contract that turns Claude into a disciplined wiki maintainer. Defines page types, YAML frontmatter, workflows, naming, and safety rules. See `wiki/CLAUDE.md` itself — it's the source of truth.

---

## Slash commands

Defined in `skills/accent-rag/commands/`. Invoke them in Claude Code chat, or as ad-hoc instructions ("aos-ingest the new MAP violation memo at wiki/raw/articles/map-memo.md").

| Command | What it does |
|---|---|
| `/aos-ingest <path>` | Read a raw source, write a `wiki/sources/<slug>.md` summary, update relevant `wiki/concepts/` and `wiki/entities/` pages, append to `wiki/log.md`. Touches 5–15 wiki pages in one pass. |
| `/aos-vendor <vendor_id>` | Pull vendor data (VD_RAW + vendor_scores + vendor_overrides + sales) into `wiki/entities/vendors/<slug>.md`. Re-runs are idempotent — diffs into the existing page. |
| `/aos-customer <customer_id>` | Same shape for customers — pulls customer + customer_interactions + linked quotes/deals into `wiki/entities/customers/<slug>.md`. |
| `/aos-recall <topic>` | Wiki-aware retrieval: load the most relevant wiki pages into context, optionally also call BUILD-RAG. Output: ranked list with each page's head section + the wikilinks it points to. |
| `/aos-lint` | Health check: broken `[[wikilinks]]`, orphan pages, contradictions across pages, stale claims (last-updated > 90d), missing index entries, missing log entries. |
| `/aos-today` | Morning briefing: last 10 log entries + open loops + queued ingest items + things flagged "open question" or "low confidence" + AccentOS BUILD_PLAN deltas since last `/aos-close`. |
| `/aos-close` | Session summary: append a single `## [date] session-close` block to `wiki/log.md`, overwrite `wiki/hot.md` with a fresh ~500 word session-end snapshot. |
| `/aos-process-inbox` | Sweep `wiki/inbox/`, classify each note, integrate into the right concept / entity / synthesis page, then archive the inbox file under `wiki/raw/inbox-archive/<date>/`. |
| `/aos-trace <concept-slug>` | Concept archaeology: show how the page evolved across log entries, which sources contributed each claim, which contradictions were resolved when. |

Each command has its own markdown file in `skills/accent-rag/commands/`. Claude Code reads them at runtime when the user invokes the slash. They follow Claude Code's slash-command convention (frontmatter + body with explicit step-by-step instructions).

---

## Workflow — how it actually runs

### Daily / per-session
1. **Open Claude Code session** → CLAUDE.md auto-execute already runs. As of v6.11.1 it now also reads `wiki/hot.md` so the new session starts with last session's context loaded.
2. **`/aos-today`** — get the morning briefing.
3. **Build / fix / ship** — normal AccentOS work.
4. **`/aos-ingest <path>`** when a new external doc lands (Phase2B notes, vendor playbook, MAP memo, etc.).
5. **`/aos-vendor <id>` / `/aos-customer <id>`** when an entity gets significantly updated.
6. **`/aos-close`** at session end — updates `wiki/hot.md` and appends to `wiki/log.md`.

### Weekly
1. **`/aos-lint`** — find broken links, orphans, contradictions. Resolve as a small batch.

### Monthly
1. **`/aos-trace`** on 2–3 high-traffic concepts to spot drift.
2. Review `wiki/decisions/` — any ADR more than 6 months old still applicable?

---

## How the wiki appears inside AccentOS

The AccentOS app at `accent-os.pages.dev` gets a new sidebar entry: **Wiki** (under INTELLIGENCE). Renders any `wiki/` page on demand by `fetch('/wiki/<slug>.md')` against the deployed Cloudflare Pages origin (markdown is included in the deploy because it's just static files alongside `index.html`).

Ask the Engine grounds **first** on the wiki:
1. Query → `/aos-recall` (which BUILD-RAG-greps `wiki/` for the relevant pages and returns top-K markdown).
2. Prepend to system prompt under `<wiki-context>...</wiki-context>`.
3. Only fall back to live RAG (Supabase pgvector) if the wiki has no answer.

This means most queries skip the embedding/worker round-trip entirely — they're answered from a small handful of curated markdown pages with explicit cross-references already worked out.

---

## Files in this skill (post-pivot)

```
skills/accent-rag/
├── SKILL.md                                # this file
├── commands/                               # slash-command definitions
│   ├── aos-ingest.md
│   ├── aos-vendor.md
│   ├── aos-customer.md
│   ├── aos-recall.md
│   ├── aos-lint.md
│   ├── aos-today.md
│   ├── aos-close.md
│   ├── aos-process-inbox.md
│   └── aos-trace.md
├── references/
│   ├── architecture.md                     # full architecture + decision log
│   ├── wiki-pattern.md                     # the Karpathy pattern, AccentOS-adapted
│   ├── build-rag.md                        # BUILD-RAG implementation notes
│   ├── os-rag.md                           # secondary live-RAG implementation notes
│   ├── contextual-prompt.md                # the Claude Haiku prompt for context generation
│   ├── build-rag-stopwords.txt
│   └── ingest-prompt.md
├── scripts/
│   ├── rag_build_index.py                  # BUILD-RAG indexer (now wiki-weighted)
│   ├── rag_search.py                       # BUILD-RAG searcher
│   ├── wiki_lint.py                        # offline wiki linter (broken links, orphans, etc.)
│   └── wiki_seed.py                        # one-shot generator of seed wiki pages from MASTER + VD_RAW + js/
├── worker/
│   ├── embed-worker.js                     # Cloudflare Worker for live-RAG embeddings (optional)
│   ├── wrangler.toml.example
│   └── README.md
├── sql/
│   └── rag_pgvector.sql                    # mirrors sql/M42_rag_pgvector.sql (optional)
├── ingest-corpus/
│   └── seed.json                           # legacy seed (now mirrored as wiki/concepts/ pages)
└── .rag/                                   # generated, gitignored
    └── build-index.json
```

The `wiki/` directory is **at the repo root**, not inside the skill, because it's first-class AccentOS knowledge — owned by the project, not by the skill. The skill only contains the tools that maintain it.

---

## Anti-patterns

- **Never** modify a file under `wiki/raw/` or any of the existing immutable `MASTER.md` / `BUILD_*` / `SESSION_LOG.md` / `PROMPT_LOG.md` files in the name of "ingestion" — those are Layer 1, immutable. Ingest by **summarizing into `wiki/sources/<slug>.md`** and updating concept/entity pages.
- **Never** invent `[[wikilinks]]` to pages that don't exist. Either create the target page in the same pass, or use plain text.
- **Never** let `wiki/index.md` go stale — every ingest updates it.
- **Never** skip `wiki/log.md` — the log is what makes `/aos-trace` work later.
- **Never** ingest credential-bearing files (`.env`, anything from `_active.md`, sessionStorage dumps).
- **Never** re-derive what's already on a wiki page. If the question's already answered there, point at it. The whole pattern fails if knowledge stops compounding.
- **Never** use the live-RAG path for stable curated knowledge. That's what the wiki is for. Live-RAG is only for high-velocity operational data.
- **Never** ship a wiki page without YAML frontmatter — the lint pass + `/aos-trace` rely on it.
