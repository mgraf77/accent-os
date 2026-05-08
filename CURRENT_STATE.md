# AccentOS — Current State
> Last updated: 2026-05-08 | Post AEOS Phase 1

## System Status: OPERATIONAL

### Live App
- **URL:** Cloudflare Pages auto-deploy from `main` branch (~15s)
- **Backend:** Supabase project `hsyjcrrazrzqngwkqsqa`
- **AI Proxy:** `https://accentos-anthropic-proxy.mgraf77.workers.dev/v1/messages`
- **Model:** `claude-sonnet-4-6` (fixed this session)

### Working Features (pre-AEOS)
- Dashboard / Owner Dashboard / Daily Command Center
- Quote Generator (AI parse notes — model ID now fixed)
- Vendor Ranking (14-category scoring, co-op funds, rep list)
- Purchase Orders
- Deliveries
- Warranty Tracking
- Internal Meetings
- Decision Engine
- Employee Portal / Manager Portal
- Job Tracker
- Inventory
- Portal Preview (Trade Partner + Vendor Rep — phase 1 of 6.5/6.6)

### AEOS Phase 1 — Newly Added (this branch, not yet on main)
- **AEOS Command Center** (`aeoscommand`) — live KPI strip, attention panel, opportunities panel, quick actions, build status
- **AI Router** (`airouter`) — task type + description → routing recommendation → send to Handoff Generator
- **Handoff Generator** (`handoffgen`) — template picker, form, formatted packet, localStorage history
- **Organizational Memory System** (`/memory/`) — 8 seed files seeding future RAG layer

### Current Branch
- `claude/accentos-master-handoff-Xd0fY` — all AEOS Phase 1 work
- Not yet merged to `main`

## Architecture
```
index.html          — single-page shell, all modules loaded as scripts
js/[module].js      — one file per module, compact-CRUD pattern
Supabase            — PostgreSQL, REST API, row-level security
Cloudflare Worker   — Anthropic API proxy
Cloudflare Pages    — hosting + auto-deploy from GitHub
```

## Known Working AI Features
- Quote Generator → Parse Notes (AI extract line items from fixture schedules)
- AEOS AI Router → routing recommendation
- AEOS Handoff Generator → formatted build packets

## Known Limitations
- AEOS KPI strip uses hardcoded placeholder data (no Supabase queries yet)
- AEOS "What Needs Attention" uses placeholder tiles (no live alert engine yet)
- No embeddings/RAG on memory files yet (human-readable only)
- Supabase MCP auth issues (project `hsyjcrrazrzqngwkqsqa`) — schema changes must be run manually by Michael via SQL Editor
