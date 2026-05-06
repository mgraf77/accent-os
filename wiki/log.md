# AccentOS Wiki — Session Log

> Append-only cross-session log. One entry per session that touches the wiki.

---

### 2026-05-06 — v6.11.1 wiki pivot (initial build)

**Branch:** claude/custom-rag-system-rIT34-Yl1By
**Built from scratch.** No prior wiki existed.

**Pages created:**
- clusters/indoor-decorative.md (weight 7)
- clusters/outdoor-architectural.md (weight 7)
- clusters/commercial-hospitality.md (weight 7)
- sops/sop-001-vendor-onboarding.md (weight 9)
- sops/sop-002-quote-to-close.md (weight 9)
- sops/sop-003-inventory-reorder.md (weight 9)
- adrs/adr-001-module-architecture.md (weight 7)
- adrs/adr-002-supabase-backend.md (weight 7)
- adrs/adr-003-localstorage-personal.md (weight 6)
- adrs/adr-004-inline-onclick.md (weight 5)
- adrs/adr-005-append-only-observations.md (weight 6)
- adrs/adr-006-csv-import-standard.md (weight 6)
- adrs/adr-007-wiki-rag-vs-pgvector.md (weight 8)
- entities/emp-owner.md (weight 6)
- entities/emp-sales.md (weight 6)
- entities/emp-warehouse.md (weight 6)
- sources/windward-erp.md (weight 5)
- sources/bigcommerce.md (weight 5)
- sources/supabase.md (weight 6)

**Tooling shipped:**
- scripts/wiki_lint.py — validates all pages against CLAUDE.md schema
- scripts/wiki_seed.py — generates _index.md + _index.json from all pages

**Skill shipped:**
- skills/accent-rag/SKILL.md (v1.0.0)
- skills/accent-rag/weighting.md
- skills/accent-rag/eval-matrix.md

**Eval result:** wiki-pattern scores 44/50 vs pgvector 33/50 (+11 total)

**Ralph loop summary:**
- Loop 1: baseline 38/50 — synonym miss gap found
- Loop 2: +3 (tag enrichment + synonym aliases added to clusters)
- Loop 3: +3 (weight tuning — SOPs → 9, source_summary → 4–5)
- Final: 44/50 ✓
