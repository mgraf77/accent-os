# BUILD-RAG · implementation notes

## What it indexes

| Source | Why |
|---|---|
| MASTER.md | Single source of truth for AccentOS state |
| BUILD_PLAN_CLAUDE.md | What's shipped, what's pending |
| BUILD_PLAN_MICHAEL.md | What Michael needs to do (M-tasks) |
| BUILD_INTELLIGENCE.md | Every gotcha + lesson from every shipped item |
| SESSION_LOG.md | Append-only session history |
| PROMPT_LOG.md | Verbatim prompts — Michael's voice, his trigger phrases |
| WORK_IN_PROGRESS.md | Current snapshot |
| KPI_CATALOG.md | KPI definitions + baselines |
| MODULE_MODES.md, module_modes.json | Rollout state per module |
| README.md | Repo overview |
| index.html (split by `// ── SECTION ──` markers) | Inline-shell code patterns |
| js/*.js | Every module — cross-module patterns + persistence trios |
| sql/M*.sql | Every migration — pattern reference for new schemas |
| skills/*/SKILL.md, skills/*/references/*.md | Existing skill triggers + workflows |

## Why no embeddings in BUILD-RAG

- BUILD-RAG queries are mostly proper nouns and structural ("vendor_score_states pattern", "RLS policy", "M21 schema", "csv import alias map"). BM25 nails these.
- No infra dependency = always available, even in a fresh Codespace before the user has set Supabase keys.
- Index builds in < 2 seconds for the whole repo. Re-running on every session start is cheap.
- Future: add an optional `--with-embeddings` mode that calls the same Cloudflare Worker, persists vectors next to BM25 postings. Defer until BM25 misses something obvious.

## Chunking strategy

| File type | Boundary |
|---|---|
| `.md` | `^## ` headings; cap at 700 tokens; sliding sub-split if larger |
| `.js` | `^(async )?function name(` declarations; one function per chunk |
| `.sql` | `-- ──` separator if present, else statement-level |
| `.html` | `// ── SECTION ──` markers |
| Other | Sliding 500-token windows with 60-token overlap |

The chunker keeps the heading / function name / section name in the chunk's `section` field so search results are scannable.

## Context prefix (no LLM)

BUILD-RAG generates the contextual prefix locally:
```
From <path>, in [<section>]: <first non-empty line of body, 160 chars max>
```
That's enough signal for BM25 — the section name carries the dominant topical token.

## CLI patterns Claude Code uses

```bash
# At session start (added to .claude/CLAUDE.md AUTO-EXECUTE):
python3 /home/user/accent-os/skills/accent-rag/scripts/rag_build_index.py --quiet

# Before implementing a new module — pull patterns from siblings:
python3 /home/user/accent-os/skills/accent-rag/scripts/rag_search.py \
  "csv import flow alias map preview commit" --k 6 --format md

# Before fixing a known-bug-class — pull the gotcha first:
python3 /home/user/accent-os/skills/accent-rag/scripts/rag_search.py \
  "onclick template literal handler null id bug" --k 4

# Find every spot a pattern is used:
python3 /home/user/accent-os/skills/accent-rag/scripts/rag_search.py \
  "sbFetch on_conflict" --path-prefix js/

# Audit a SQL migration for naming conflicts:
python3 /home/user/accent-os/skills/accent-rag/scripts/rag_search.py \
  "vendor_scores table" --path-prefix sql/

# Dump every gotcha for offline reading:
python3 /home/user/accent-os/skills/accent-rag/scripts/rag_search.py \
  --dump --path-prefix BUILD_INTELLIGENCE.md --format md > /tmp/gotchas.md
```

## Index hygiene

- The index is a single JSON file at `skills/accent-rag/.rag/build-index.json`.
- Gitignored by default — every dev rebuilds locally.
- File is small (~1-3MB even for the full repo). Could be git-tracked if cross-machine consistency is wanted; add to `.gitignore` to start.
- Re-index frequency: every session start (~2s), or after any large refactor.
