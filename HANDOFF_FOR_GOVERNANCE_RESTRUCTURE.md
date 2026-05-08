# Handoff for Governance Restructuring
**As of:** 2026-05-08
**Branch:** `claude/accentos-sentinel-audit-Q9E8o`
**Purpose:** Clean handoff context for the upcoming AccentOS governance and architecture restructuring.

---

## What Was Built This Session

The `accentos-sentinel-audit` skill — a periodic code audit system for AccentOS. It lives entirely in `skills/accentos-sentinel-audit/` and has no dependencies on any running system. It is a standalone inspection tool.

Nothing in the core app (`index.html`, `worker/`, `sql/`) was modified this session.

---

## Systems Touched

| System | Type of Touch | Risk |
|---|---|---|
| `skills/accentos-sentinel-audit/` | Created (new) | None — additive only |
| `skills/_index.md` | Modified (appended entry) | None |
| `CURRENT_STATE.md` | Created | None |
| `KNOWN_ISSUES.md` | Created | None |
| `NEXT_STEPS.md` | Created | None |
| `HANDOFF_FOR_GOVERNANCE_RESTRUCTURE.md` | Created (this file) | None |
| `WORK_IN_PROGRESS.md` | To be updated | None |

No core app code was touched. The sentinel audit skill is purely observational/documentation infrastructure.

---

## Dependencies and Coupling Analysis

### accentos-sentinel-audit skill

**Depends on:**
- Node.js (runtime for scanner scripts — no npm packages needed)
- Repo structure conventions (`/sql/`, `/worker/`, `/js/`, `/index.html`) — if these paths change, scanner scripts need path updates
- `skills/_index.md` — registered for vibe-speak routing

**Is depended on by:**
- Nothing in core app — it's a read-only tool

**Coupling risk:** LOW. The skill reads files and produces reports. It doesn't write to the app.

---

## What Belongs Where (Governance Restructuring Guidance)

### Keep in AccentOS repo
- `skills/accentos-sentinel-audit/` — it's AccentOS-specific by design. The rules encode AccentOS architectural decisions.
- `skills/_index.md` — routing index for session-time skill discovery

### Candidate for extraction to Skills repo (if one is created)
- The **skill framework patterns** (SKILL.md format, prompt templates, finding templates, changelog templates) are generic enough to reuse. The AccentOS-specific rule files should stay.
- `templates/` subdirectory — mostly reusable for any project audit skill

### Does NOT belong in AgentOS or Command Center
- The audit skill is a developer/governance tool, not an employee-facing product feature.

---

## Architectural Assumptions Made During This Session

1. **Scanner scripts run from repo root** using `process.argv[2] || process.cwd()`. If the repo is moved or the working directory convention changes, all scanner scripts need the path argument updated.

2. **AccentOS module registry pattern** (`window.AccentOS.modules`) is assumed stable. If this is renamed or replaced, `scan_accentos_patterns.js` will miss modules.

3. **SQL migrations follow `M[NN]_*.sql` convention** in `/sql/`. If this changes, `scan_sql_migrations.js` needs a path update.

4. **Single Worker file at `worker/anthropic-proxy.js`**. If the Worker is split or moved, `scan_worker_security.js` needs updating.

5. **Health score weights** (architecture 20%, supabase 20%, security 20%, AI patching 15%, product logic 15%, docs 10%) are baked into `generate_audit_report.js`. If priorities shift, these weights should be updated.

---

## Risks After Governance Restructure

### High risk
- **If folder structure changes:** Scanner `walkDir` functions use hardcoded relative paths. All 5 scanners would need path config updates. Mitigate: extract paths to a single config object at the top of each scanner.
- **If Worker is replaced or moved:** `scan_worker_security.js` checks `worker/` directory specifically.

### Medium risk
- **If module registry pattern changes:** The module contract scanner won't detect new modules.
- **If SQL migration folder is split:** The SQL scanner only scans `/sql/`.

### Low risk
- **If index.html is modularized:** The `collect_repo_metrics.js` and `scan_ai_patch_boundaries.js` still check individual files — they'd just check more files. The logic holds.

---

## Incomplete Abstractions

1. **Rate limiting in Worker** — the rule exists, the scanner detects absence, but the implementation (KV namespace) isn't set up. This is an infrastructure gap, not a code gap.

2. **Module detection by scanner** — `scan_accentos_patterns.js` searches for `window.AccentOS.modules.X = {` but the current `index.html` either doesn't use this pattern or uses it in a way the regex doesn't match. The scanner currently reports "no modules detected" — this is a scanner false negative, not an app issue. The app's module registry approach needs a consistent, scannable pattern.

3. **Documentation health score** — currently hardcoded at `7/10` in `generate_audit_report.js` because doc health requires semantic review (Claude). A placeholder note exists in the report. Full docs scoring requires the Claude-layer audit.

---

## Duplicate Systems / Overlap to Resolve

| Potential Overlap | Current State | Recommendation |
|---|---|---|
| `doc-drift` skill vs sentinel `documentation-drift-review.md` | Separate tools with overlapping scope | Sentinel audit calls `doc-drift` skill as a sub-step rather than duplicating |
| `codex-review` skill vs sentinel Codex delegation prompts | Different abstraction level — codex-review is general, sentinel prompts are AccentOS-specific | Keep both; sentinel generates AccentOS-specific Codex tasks |
| `schema-contract-tests` vs sentinel SQL scanner | `schema-contract-tests` generates test SQL; sentinel scanner reads migration files | Complementary, not duplicate |
| `vendor-cascade` vs sentinel vendor logic rules | `vendor-cascade` is a query/trace tool; sentinel rules are audit checks | Complementary |

---

## Recommended Cleanup Opportunities

1. **`scan_accentos_patterns.js` module detection regex** — should handle both `window.AccentOS.modules.X = {` and patterns where the module is defined outside that exact assignment syntax.

2. **Scanner path config** — extract all `path.join(REPO_ROOT, ...)` hardcoded paths to a `PATHS` config object at the top of each script. Makes restructuring easier.

3. **`generate_audit_report.js` health score weights** — extract to a constants block at the top so they're easy to tune.

4. **WORK_IN_PROGRESS.md** — still reflects the prior session's Worker 400 bug. Should be updated to reflect clean state.

---

## Areas of High Coupling (AccentOS Risk Zones)

These are the areas most likely to be impacted by or to complicate governance restructuring:

| Area | Coupling Risk | Why |
|---|---|---|
| `index.html` (718KB) | HIGH | Monolith — everything is in one file. Any structural change touches it. |
| `worker/anthropic-proxy.js` | HIGH | Has critical security issues. Must be fixed before any other Worker work. |
| Supabase auth + RLS policies | MEDIUM | Cross-cutting — every module depends on auth state and RLS. |
| `skills/_index.md` | LOW | Simple routing index — easy to update. |
| SQL migrations (M01–M40) | LOW | Append-only by convention — low coupling risk. |

---

## Session-End State

- Working tree: **clean**
- Branch: **pushed to remote**
- No uncommitted work
- No broken imports introduced
- No core app code modified
- Repo is fully resumable from this state
