---
type: concept
title: Karpathy LLM Wiki
slug: karpathy-llm-wiki
aliases: [llm-wiki, llm-wiki-pattern, the-wiki-pattern]
sources: [[sources/karpathy-llm-wiki-gist]], [[sources/master]]
related: [[contextual-retrieval]], [[reciprocal-rank-fusion]], [[decisions/ADR-007-karpathy-wiki-pivot]]
cluster: accentos-patterns
cluster_role: leaf
confidence: high
contradictions: []
open_questions:
  - "How do we reconcile auto-generated entity pages (e.g. wiki/entities/vendors/<slug>.md) with human-curated freeform sections in the same file? Current rule: <!-- auto: --> markers protect overwrite zones."
  - "When should a synthesis be auto-promoted to a concept (i.e., it's referenced enough to deserve hub treatment)?"
created: 2026-05-05
updated: 2026-05-05
---

# Karpathy LLM Wiki

The pattern Andrej Karpathy proposed in April 2026 (gist `442a6bf555914893e9891c11519de94f`): instead of running RAG (retrieve chunks at query time) over your knowledge corpus, **maintain a structured markdown wiki** that the LLM curates. Three layers, slash-command-driven, knowledge compounds across sessions.

## Why this beats traditional RAG for AccentOS

Traditional RAG (the v6.11.0 design — see [[contextual-retrieval]] + [[reciprocal-rank-fusion]]) re-derives the answer from raw chunks every query. There's **no accumulation** — a complex question like "what's our IMAP enforcement posture across the Visual Comfort Group brands" requires the LLM to find and stitch fragments from 5 different sources every single time.

The wiki pattern pre-compiles that synthesis into [[entities/vendors/visual-comfort]] and [[rubric-imap-enforcement]] pages, with the cross-references already worked out and the contradictions already flagged. Subsequent queries just **load the page** instead of re-discovering.

For AccentOS specifically:
- Vanilla JS, no build step → markdown files alongside `index.html` ship cleanly via Cloudflare Pages.
- Knowledge artifacts (vendor playbooks, scoring rubrics, SOPs) are stable and benefit from compounding.
- Git-tracked → version history + diff review for every claim.
- Obsidian-compatible → graph view + backlinks panel for free.

## Three layers (AccentOS adaptation)

| Layer | Purpose | AccentOS path |
|---|---|---|
| 1. Raw sources | Immutable. Read freely; never modify. | `MASTER.md`, `BUILD_*.md`, `js/`, `sql/`, `index.html`, `wiki/raw/` |
| 2. The Wiki | LLM-maintained markdown. Cross-linked. Compounds. | `wiki/{concepts,entities,modules,sources,syntheses,decisions}/` |
| 3. Schema | Page types + workflows + safety rules. | `wiki/CLAUDE.md` |

## Slash commands

Defined in `skills/accent-rag/commands/`. See each command file for full step list.

- `/aos-ingest <path>` — read source, write summary, update concept/entity pages, append log
- `/aos-vendor <id>` — pull VD_RAW + Supabase data into entity page
- `/aos-customer <id>` — same shape for customers
- `/aos-recall <topic>` — wiki-aware retrieval; flags candidate ingestions
- `/aos-lint` — broken links, orphans, contradictions
- `/aos-today` — morning briefing
- `/aos-close` — session-close ritual
- `/aos-process-inbox` — sweep `wiki/inbox/`
- `/aos-trace <slug>` — concept archaeology

## When NOT to use the wiki

Per [[decisions/ADR-007-karpathy-wiki-pivot]], the wiki is for **stable curated knowledge**. Fast-moving operational data (live customer interaction streams, GMC issue feeds, daily vendor sales deltas) doesn't compound — it just changes. For those, AccentOS keeps the secondary live-RAG path (Supabase pgvector + Cloudflare Worker, see [[contextual-retrieval]] + [[reciprocal-rank-fusion]]) but treats it as **optional** — gated on Michael running M42 + M43 only when a use case actually needs it.

## Key insight

> Maintenance burden grows faster than value, causing humans to abandon wikis. LLMs don't forget cross-references or get bored with consistency work, making the maintenance cost near zero. — paraphrased from the original gist.

For AccentOS this insight is doubled because every session is already running Claude Code, which is already maintaining `MASTER.md` / `BUILD_PLAN_CLAUDE.md` / `BUILD_INTELLIGENCE.md` / `SESSION_LOG.md`. The wiki adds one more layer of maintenance that's marginally cheap on top of work that's happening anyway.
