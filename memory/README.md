# AccentOS Organizational Memory
> Created: 2026-05-08 | AEOS Phase 1

This directory contains persistent AI-readable organizational memory for AccentOS / Accent Lighting Inc.

## Directory Structure
```
memory/
  architecture/    ARCHITECTURE.md      — stack, module patterns, URLs, code rules
  governance/      GOVERNANCE.md        — safety rules, roles, spend rules
                   DECISIONS_LOG.md     — append-only decision log
  ai-workflows/    AI_RULES.md          — routing logic, model selection, session protocol
  vendors/         VENDOR_KNOWLEDGE.md  — vendor scoring, tiers, rep status
  operations/      OPERATIONS_SOPS.md   — daily SOPs for quotes, POs, deliveries, etc.
  sales/           (future)
  ecommerce/       (future)
  employees/       (future)
  automation/      (future)
  analytics/       (future)
```

## Purpose
- **Current value:** Human-readable cross-session context for Claude and the team
- **Future value:** RAG retrieval layer — files will be indexed for semantic search by AI agents
- **Update protocol:** Append to DECISIONS_LOG.md after any major architectural decision. Update memory files at end of each major build session.

## Update Cadence
- `DECISIONS_LOG.md` — every significant decision
- `ARCHITECTURE.md` — when stack or module structure changes
- `GOVERNANCE.md` — when rules change
- `AI_RULES.md` — when routing logic or model selection changes
- Domain files — when relevant knowledge grows

## Future Plans
- Embeddings index for RAG retrieval
- Auto-update hooks that write memory files on schema changes
- Agent-accessible memory API via Supabase Edge Function
