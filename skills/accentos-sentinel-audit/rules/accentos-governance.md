# AccentOS Governance Rules

Master governance file. All other rule files are sub-specifications of these.

---

## 1. Repo Identity

- Repo: `github.com/mgraf77/accent-os`
- Deployment: Cloudflare Pages
- Backend: Supabase Postgres
- Primary frontend: `index.html` (monolith — modular extraction when >900KB)
- Module registry: `window.AccentOS.modules`
- Current active module: Vendor Intelligence

---

## 2. Source of Truth Hierarchy

1. `BUILD_INTELLIGENCE.md` — hard lessons, supersedes everything
2. `BUILD_PLAN_CLAUDE.md` — active task queue
3. `MASTER.md` — architecture decisions
4. This skill's rules — audit standards
5. Individual module docs

---

## 3. Code Ownership Zones

| Zone | Owner | Who Can Modify |
|---|---|---|
| Core AccentOS shell | Claude + Human | Both, with review |
| Module code | Claude / Codex | Per patch rules |
| SQL migrations | Claude + Human | Human approves prod runs |
| Worker/API proxy | Human approves | Claude drafts, Human deploys |
| Supabase RLS | Claude drafts | Human reviews before applying |
| Environment variables | Human only | Never auto-modify |

---

## 4. Change Safety Tiers

**Tier 1 — Free (no approval needed):**
- Adding new helper functions inside an existing module boundary
- Adding comments or docs
- Adding new columns to migrations (idempotent, non-breaking)
- Adding patch markers
- Adding/updating type definitions

**Tier 2 — Review (document before committing):**
- New module creation
- Changing vendor scoring weights or categories
- Changing write gateway interfaces
- Any Worker/proxy code changes
- Removing or renaming Supabase columns/tables
- Changing RLS policies

**Tier 3 — Human approval required:**
- Applying SQL migrations to production
- Changing Cloudflare Pages config
- Deploying Worker changes
- Changing environment variables
- Any change that modifies all-table write policies

---

## 5. AccentOS Watchlist (always monitored)

1. `index.html` size and complexity
2. Unsafe Supabase direct writes
3. Missing RLS policies
4. Broad `anon` permissions
5. Service role key exposure in Worker/API
6. Worker proxy hardening gaps
7. Vendor score/category logic drift
8. Missing employee help tabs per module
9. Lights America/data52 import assumptions
10. Vendor price book data freshness
11. Stale product image/doc URLs
12. Poor AI patch boundaries
13. Duplicate utility functions
14. Missing changelog entries
15. Undocumented environment variables

---

## 6. Commit and Documentation Obligations

Every substantial change MUST include:
- Changelog entry in `SESSION_LOG.md` or `MASTER.md`
- Updated `WORK_IN_PROGRESS.md` if mid-session
- Updated `BUILD_PLAN_CLAUDE.md` check-off if completing a tracked task

Architecture decisions MUST be recorded in `MASTER.md` or `decision-log` skill.

---

## 7. Emergency Stop Conditions

Immediately halt feature work and raise an audit-level alert if:
- `index.html` exceeds 900KB
- Any service role key found in non-Worker code
- Direct Supabase write detected outside approved gateway
- RLS disabled on any production table
- Worker CORS wildcard (`*`) without origin validation
- Vendor scoring data shows signs of data loss
