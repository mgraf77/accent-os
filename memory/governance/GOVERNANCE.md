# AccentOS Governance Rules
> Last updated: 2026-05-08 | Applies to all AI-assisted development

## Core Safety Rules
1. No direct production deploys by AI without human confirmation
2. All AI code changes via PR workflow when possible; direct-to-branch only in Codespace flow with Michael's explicit session instruction
3. All deployments auto-logged via Cloudflare Pages audit trail
4. Rollback plans required for any schema migration
5. Secrets must never be committed — API keys via sessionStorage, Supabase keys via Settings UI
6. Operationally critical changes (schema drops, bulk data deletes) require Michael's explicit approval
7. AI execution logs in BUILD_INTELLIGENCE.md and SESSION_LOG.md
8. Database migrations require corresponding rollback SQL noted in the M-task

## Protected Systems
- `main` branch → auto-deploys to production. No direct force-push.
- Supabase schema changes → Michael runs manually via SQL Editor (Supabase MCP has auth issues)
- Cloudflare Worker → requires `wrangler deploy` from Michael's local machine

## Role Hierarchy
| Role | Access |
|---|---|
| Owner | Everything |
| Admin | Everything except Owner-only settings |
| Manager | CORE + INTELLIGENCE + ADMIN (excluding user management) |
| Sales | CORE modules (no Mgmt Dashboard, no Purchase Orders) |
| Warehouse | Dashboard, Jobs, Inventory, Labels, Deliveries, Warranty |

## AI Development Governance
- Claude = principal architect and builder (primary)
- Codex = implementation tasks (secondary, via codex-review skill when M41 key installed)
- ChatGPT = business strategy and synthesis (tertiary)
- All AI work must be: reviewed, committed, pushed to branch, deployed through normal Cloudflare pipeline

## Spend Rules
- Zero added cost unless absolutely necessary
- Every integration built internally before evaluating paid tools
- No agency spend (Agital/Go Fish permanently dismissed 2026-04-29)

## Data Rules
- Blank beats guessed — no placeholders for real data
- `MASTER.md` = ultimate source of truth for all project context
- `BUILD_PLAN_CLAUDE.md` = autonomous build queue (Claude-owned)
- `BUILD_PLAN_MICHAEL.md` = human action queue (Michael-owned)
