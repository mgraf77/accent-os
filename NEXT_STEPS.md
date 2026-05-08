# AccentOS — Next Steps
> Last updated: 2026-05-08 | Post AEOS Phase 1 stabilization

## Immediate (Post-Governance Restructure)

### 1. Governance Restructure (Michael's decision — required before proceeding)
- Review HANDOFF_FOR_GOVERNANCE_RESTRUCTURE.md
- Decide: AccentOS vs AgentOS vs Skills repo vs Command Center boundaries
- Decide: Supabase schema ownership + migration process
- Decide: AEOS Phase 2 scope and sequencing
- Merge or discard `claude/accentos-master-handoff-Xd0fY`

### 2. BUILD_PLAN 6.5 — Trade & Designer Portal (first unblocked item after governance)
- External-facing portal for trade customers + designers
- `js/portal_preview.js` already has phase 1 preview — extend it
- Requires: customer auth, product catalog, quote request flow

### 3. BUILD_PLAN 6.6 — Vendor Rep Portal
- External-facing portal for vendor reps
- Phase 1 preview already in `js/portal_preview.js`

## AEOS Phase 2 (after 6.5/6.6 or in parallel)
- Fixture Finder module (product search + recommendation)
- Quote Intelligence expansion (AI-assisted margin analysis, competitive pricing)
- Ecommerce Intelligence module (website performance, conversion tracking)
- Live KPI feeds in AEOS Command Center (replace placeholder data with real Supabase queries)
- Live alert engine for "What Needs Attention" tiles

## AEOS Phase 3 (deferred — not before Phase 2 fully adopted)
- Next.js migration planning
- TypeScript + Tailwind + shadcn/ui evaluation
- Only after current vanilla JS stack is at capacity

## Memory System Evolution
- Add embeddings index for RAG retrieval
- Auto-update hooks that write memory files on schema changes
- Agent-accessible memory API via Supabase Edge Function

## Operational
- Add Supabase migration for AEOS-specific tables (if Phase 2 needs persistence beyond localStorage)
- Resolve Supabase MCP auth issues or establish permanent bypass SOP
