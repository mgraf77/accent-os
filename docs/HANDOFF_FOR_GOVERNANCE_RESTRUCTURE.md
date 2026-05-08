# Handoff for Governance Restructuring

> Written 2026-05-08. Prepared as a clean-pause artifact before AccentOS ecosystem governance restructuring begins.

---

## Systems Touched (This Repo)

| System | Location | Status |
|---|---|---|
| App shell | `index.html` | Active; last modified 2026-05-07 |
| JS modules | `js/` (37 files) | Active; extracted from monolith |
| Cloudflare Worker proxy | `worker/anthropic-proxy.js` | Deployed; 400 bug open (KI-001) |
| SQL migrations | `sql/` | M01 + M02 written; neither run yet |
| Skills | `skills/` | 20+ skills; mixed AccentOS-local + reusable |
| Docs | `docs/` | New this session; 7 files |
| Build artifacts | `BUILD_PLAN_CLAUDE.md`, `BUILD_INTELLIGENCE.md`, `MASTER.md`, `SESSION_LOG.md` | Active governance docs |

---

## Dependencies and Coupling

### Inter-module coupling (high)
All 37 files in `js/` communicate via globals on `window`. There is no import/export system. Module isolation is naming-convention only. Splitting any module into a separate repo requires resolving this first.

Key shared globals: `$`, `esc`, `sbFetch`, `openModal`, `currentUser`, `sessionRole`.

### Supabase coupling (high)
Nearly every JS module reads/writes Supabase directly via `sbFetch`. The Supabase project URL and anon key are embedded in `index.html`. Any repo split must carry these or replace them with a config layer.

### Cloudflare Worker coupling (medium)
Four fetch calls in `index.html` point to `accentos-anthropic-proxy.mgraf77.workers.dev`. The Worker is a separate Cloudflare project (`wrangler.toml` at root). It is already logically separate but physically co-located in this repo.

### Skills coupling (medium)
`skills/` contains both AccentOS-specific skills (efficiency-monitor, vibe-speak, autonomous-mode) and potentially reusable skills (repo-scout, broken-link-rescue, bulk-meta-description). No formal registry distinguishes them — only `skills/_index.md`.

---

## What Belongs Where (Governance Recommendation)

### Keep in AccentOS repo
- `index.html` + all `js/` modules — this is the product
- `sql/` — schema migrations for this product
- `worker/anthropic-proxy.js` — infra for this product
- `skills/efficiency-monitor/` — AccentOS session-specific
- `skills/vibe-speak/` — AccentOS session-specific
- `skills/autonomous-mode/` — AccentOS session-specific
- `skills/build-plan-status/` — AccentOS session-specific
- All root governance docs (`BUILD_PLAN_CLAUDE.md`, `MASTER.md`, etc.)

### Candidates for Skills Repo (Reusable)
- `skills/repo-scout/`
- `skills/broken-link-rescue/`
- `skills/bulk-meta-description/`
- `skills/gmc-feed-audit/`
- `skills/bc-business-review/`
- `skills/community-skill-vet/`
- `skills/codex-review/`

### Candidates for AgentOS
- `skills/autonomous-mode/` — if AgentOS formalizes autonomous execution
- `skills/decision-log/`
- `skills/prompt-queue/`

### Candidates for Command Center
- Daily Command Center logic (currently embedded in `index.html` inline script)
- Digest / alert system (`js/digest.js`, `js/alerts.js`)
- KPI snapshot pipeline (`js/health.js`, `js/reports.js`)

---

## Areas of High Coupling (Risky Zones)

1. **`index.html` inline script block** — still contains significant logic not yet extracted to `js/`. Any restructuring that moves modules will need to audit what remains inline.

2. **`js/customers.js` + `js/pipeline_analytics.js` + `js/deal_optimizer.js`** — all read customer data via name-matching rather than UUID linkage. Fragile if customer names change.

3. **`skills/vibe-speak/`** — deeply integrated with session startup hooks and CLAUDE.md auto-execute. Moving it requires updating CLAUDE.md references and `.claude/settings.json` hooks simultaneously.

4. **`worker/anthropic-proxy.js`** — co-located but separately deployed. If this repo splits, the Worker needs its own Cloudflare project or the proxy needs to move.

---

## Incomplete Abstractions

- **UUID linkage** (KI-004): customer / quote / deal relationships use name-matching, not FK references. The schema supports it; the code does not.
- **Module loader**: `js/` files loaded via `<script src>` tags in `index.html`. No bundler, no dependency graph. Extraction order is implicit and fragile.
- **Role system**: 5-role system exists but Warehouse and Sales roles have no real users yet. Role-gated UI surfaces exist without real validation in the field.

---

## Duplicate Systems

- `js/reports.js` and `js/pipeline_analytics.js` likely overlap in forecast / revenue aggregation logic. Not audited this session.
- `js/digest.js` and `js/alerts.js` may have overlapping alert-generation logic.

---

## Recommended Cleanup Opportunities (Post-Restructure)

1. Audit `index.html` inline script — extract remaining logic to `js/`.
2. Replace window-global module communication with a lightweight event bus or explicit import map.
3. Deduplicate reports vs pipeline_analytics forecast logic.
4. Wire UUID linkage in save flows (customers ↔ quotes ↔ deals).
5. Formalize skills registry with explicit `scope: accents-os | shared | agent-os` field in `_index.md`.

---

## Migration Concerns

- Any repo split of `js/` modules requires resolving the global-on-window coupling first — otherwise split modules will silently fail when referenced globals are undefined.
- If `skills/vibe-speak/` moves, CLAUDE.md auto-execute Step 1 must be updated to the new path, and the Stop hook in `.claude/settings.json` must be re-pointed.
- The Supabase project is shared — any split must coordinate on schema migrations to avoid conflicts.
