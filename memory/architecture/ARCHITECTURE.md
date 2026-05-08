# AccentOS Architecture Memory
> Last updated: 2026-05-08 | Source of truth: MASTER.md §4

## Current Stack
| Layer | Technology | Notes |
|---|---|---|
| Frontend | Vanilla JS + HTML + CSS | No framework, no build step |
| Hosting | Cloudflare Pages | Auto-deploy from GitHub push, ~15s |
| Database | Supabase (PostgreSQL) | Project: hsyjcrrazrzqngwkqsqa |
| Auth | Supabase Auth | JWT-backed, 5 roles |
| AI (in-app) | Anthropic API → Cloudflare Worker proxy | Model: claude-sonnet-4-6 |
| Version control | GitHub | Repo: mgraf77/accent-os |

## Repo Structure
```
accent-os/
├── index.html              # Shell: nav, routing, auth, shared utilities, VD_RAW vendor data
├── js/                     # 40+ external module files (loaded via <script src>)
├── sql/                    # Schema migrations (M01–M40+, run manually by Michael in Supabase)
├── worker/                 # Cloudflare Worker proxy for Anthropic API
├── memory/                 # THIS DIRECTORY — organizational AI memory
├── skills/                 # Claude Code skills registry
└── *.md                    # MASTER.md, BUILD_PLAN_CLAUDE.md, BUILD_PLAN_MICHAEL.md, etc.
```

## Module Pattern (compact-CRUD)
Every module follows:
1. State `let`s at module top (`let THINGS = []`)
2. Persistence trio: `sbLoadX()`, `sbSaveX()`, `sbDeleteX()`
3. Render function `function modulename(c, actions)` — matches key in goTo dispatcher
4. Edit modal function `openXEdit(id)`
5. Four shell touchpoints in index.html: sidebar entry, PAGE_META, goTo pages map, `<script src>`

## Critical Code Rules (Never Break)
- `VD_RAW` = the vendor data array (not `VENDORS` or `VENDOR_DATA`)
- `sbFetch` must NOT call `response.json()` on `Prefer: return=minimal` responses
- All `onclick` handlers must use `${...}` template literals for dynamic values
- Never edit two modules in the same surgical patch
- Cross-module navigation: `goTo('page');setTimeout(()=>openX(id),80)` (80ms for DOM mount)

## AI Proxy
Worker URL: `https://accentos-anthropic-proxy.mgraf77.workers.dev/v1/messages`  
Worker file: `worker/anthropic-proxy.js`  
Model: `claude-sonnet-4-6` (updated 2026-05-08 from claude-sonnet-4-20250514)

## URLs
| Env | URL |
|---|---|
| Production | https://accent-os.pages.dev |
| Repo | https://github.com/mgraf77/accent-os |
| Supabase | https://hsyjcrrazrzqngwkqsqa.supabase.co |

## AEOS Modules (v6.11.0)
- `js/aeos_command.js` — AEOS Command Center + AI Router + Handoff Generator
  - Pages: `aeoscommand`, `airouter`, `handoffgen`
  - Sidebar section: AEOS (Owner/Admin/Manager only)
