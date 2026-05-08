# HANDOFF_FOR_GOVERNANCE_RESTRUCTURE.md

**Purpose:** prepare the upcoming AccentOS / AgentOS / Skills / Command Center restructure with a complete picture of what touches what.

**Branch:** `claude/accentos-roadmap-planning-PKRA0` @ `6690495`
**Mode:** Clean pause; no autonomous expansion past this point.

---

## 1. Systems touched this session

| System | File(s) | Change |
|---|---|---|
| Long-term plan | `ROADMAP_2026.md` | created v1, evolved to v3.1 across 5 stakeholder roleplay rounds |
| Build queue | `BUILD_PLAN_CLAUDE.md` | appended Tracks 7-14 (73 new tasks) |
| Owner blockers | `BUILD_PLAN_MICHAEL.md` | appended M30-M40 (11 new) |
| Live dashboard | `BUILD_STATUS.md` + `scripts/build-status.sh` | new auto-gen system |
| Hooks | `.claude/settings.json` Stop hook + `.git/hooks/pre-push` | new |
| Logs | `PROMPT_LOG.md` | append-only entries |
| Handoff docs (this set) | `SESSION_SUMMARY.md`, `CURRENT_STATE.md`, `NEXT_STEPS.md`, `KNOWN_ISSUES.md`, `HANDOFF_FOR_GOVERNANCE_RESTRUCTURE.md` | new |

**Crucially: no SPA code, no Supabase schema, no auth flow, no module loading mechanism was touched.**

## 2. Dependencies that exist

### File-level
- `BUILD_STATUS.md` regenerator depends on `BUILD_PLAN_CLAUDE.md` having `^## TRACK N ` headers and `- [x]` / `- [ ]` line patterns. Format change breaks regen.
- `BUILD_STATUS.md` regenerator reads `WORK_IN_PROGRESS.md` for `^**Current task:**` and `^**Step:**` lines.
- Stop hook calls `bash /home/user/accent-os/scripts/build-status.sh`. Hard-coded path. If repo moves, edit `.claude/settings.json`.
- `.git/hooks/pre-push` uses `git rev-parse --show-toplevel` so path-portable, but the hook itself is NOT tracked by git — must be re-installed on a new clone.
- `PROMPT_LOG.md`, `SESSION_LOG.md`, `WORK_IN_PROGRESS.md` are referenced from CLAUDE.md auto-execute and scripts/status.sh.

### Conceptual
- The whole roadmap assumes single-repo, single-tenant Accent Lighting deployment. If restructure introduces multi-tenancy or repo splits, principles 7 (security as gate) and the entire §10 module retrofit must be re-evaluated.
- `automation_events` (Phase 0.1) is the spine for ΔROI, dynamic thresholds, kill list, adoption telemetry, edit-distance, thumbs. If governance restructure relocates this table to a different repo / project, every Track 10 / 12 / 13 item rewires.

## 3. Assumptions made

### Architectural
- Vanilla JS SPA with `window` globals stays through Phase 0 (bundler cutover is Phase 0.6 itself).
- Supabase Postgres + RLS remain the persistence layer.
- Cloudflare Pages deploy continues.
- Anthropic Claude is the LLM provider; AI Gateway wraps all calls in Phase 0.2.
- Single Supabase project for v1; second project for personal/business wall is Phase 4.

### Operational
- Owner caps at 5h/wk (round-4 owner-time auditor). Office Hours pattern Tue 7-8a + Fri 4-4:30p.
- 16-week schedule W1-W16 to first end-to-end live state.
- 91-hour budget for 36-module retrofit across Phase 0+2.

### Governance (will be revisited in restructure)
- Skills live under `skills/` in this repo (vibe-speak, efficiency-monitor, etc.).
- Commands like `/mode`, slash routing handled by Claude Code via skills.
- `BUILD_PLAN_CLAUDE.md` is canonical task source; queue order matters.

## 4. What likely belongs where after restructure

### Likely → AccentOS (this repo)
- `index.html` SPA + `js/` modules
- Supabase schema (`sql/`)
- BUILD_PLAN_*, ROADMAP_2026, BUILD_STATUS, WORK_IN_PROGRESS, SESSION_LOG, PROMPT_LOG, BUILD_INTELLIGENCE, MASTER
- Module-specific data (vendor scoring, KPI definitions, customer interactions)
- Phase 1 integrations (BC, Windward) and Phase 2 RAG surfaces tied to AccentOS modules

### Likely → AgentOS (new repo)
- AI Gateway (Phase 0.2) — model tiering, caching, kill-switch, cost telemetry
- Threshold service (Phase 0.3) — Bayesian Beta-LCB, holdout counterfactual, anti-Goodhart guards
- `automation_events` schema and views (Phase 0.1) — the cross-system spine
- `agent_actions` queue table + state machine (Phase 3 Track 10)
- Δ-ROI aggregation views (`v_roi_by_action`, `v_roi_by_user`, `v_kill_candidates`)
- Promotion ladder logic (shadow → draft → auto)

### Likely → Skills repo
- Everything currently under `skills/`:
  - vibe-speak (and its 9 modes, profiles, logs)
  - efficiency-monitor (always-on observer)
  - skill-forge, supabase-sql-magic, gmc-feed-audit, broken-link-rescue, codex-review, decision-log, doc-drift, prompt-queue, repo-scout, schema-contract-tests, skill-eval-suite, vendor-cascade, vendor-clarity-test, vendor-onboard-checklist, vendor-risk-register, etc.
- `skills/_index.md` becomes the cross-repo skill registry

### Likely → Command Center (the orchestration layer, if introduced)
- Per-persona dashboards (heartbeat) — could live as a unified UI over AccentOS + AgentOS data
- Cmd-K command bar (currently planned in Phase 0.7) — natural fit as a Command Center UI
- The Friday "what shipped" Loom-generation pipeline (Phase 0.9)
- Cross-repo build status aggregator (the next iteration of `BUILD_STATUS.md` if multiple repos)

### Likely → BC Site / "AccentOS Theme"
Track 11 items (E1-E10) — Cornerstone fork, PDP/PLP redesigns, Core Web Vitals, customer panel. Standalone repo, depends on AccentOS via SDK.

## 5. Areas of high coupling (handle with care)

### Tightly coupled, hard to split cleanly
- **`automation_events` ↔ everything in Tracks 10, 12, 13.** If this table moves, every automation rewires.
- **`audit_log` ↔ Δ-ROI ↔ kill-list.** Currently in Supabase main DB; planned hash-chain + tamper detection in Phase 0.5.
- **Skills `_index.md` ↔ CLAUDE.md auto-execute ↔ `efficiency-monitor`.** Boot sequence reads all three; reordering risks broken activation.
- **Module Modes registry (`module_modes.json`) ↔ sidebar gating ↔ user overrides.** Per-user override layering described in BUILD_INTELLIGENCE #88.
- **vibe-speak feedback-log ↔ observation-log ↔ kpi-log ↔ session-handoff.** Tightly coupled persona calibration loop.

### Loosely coupled, easier to extract
- Each `js/<module>.js` file is mostly self-contained (state lets + persistence trio + render + edit modal). Easy to move.
- BC site theme work (Track 11) has well-defined boundaries via Stencil CLI.
- Specific automations (A1-A8) are independent of each other once they share the action queue interface.

## 6. Risky architectural zones

| Zone | Risk |
|---|---|
| Bundler cutover (Phase 0.6) | All-or-nothing transition from `window` globals to ESM imports. Plan keeps old path behind flag through W4. Restructure should respect this gate. |
| AI Gateway switch (Phase 0.2) | env-flag shim through W2; hard-cut W3. Restructure should not split before/after the cutover. |
| `automation_events` schema lock | Must lock shape before module #1 writes; migrations across 36 modules are painful. Restructure should freeze this schema first. |
| JWT `aud` claim split | Touched by all auth flows. Plan adds `internal` vs future `portal_*`. Restructure should preserve. |
| Hash-chained `audit_log` | Tamper-evident; chain breaks if a single row is rewritten outside the runner. |

## 7. Incomplete abstractions

- **Module retrofit kit** (Phase 0.13) — 6 primitives planned (`logEvent`, `aiCall`, `<thumbs-row>`, `<explain-link>`, `threshold()`, `registerCmdK`). Not yet built. Will likely live in AgentOS.
- **Heartbeat metrics derivation** — Phase 0.4 reads from existing tables, no new persistence. The derivation logic itself is missing; plan calls for `js/heartbeat.js`.
- **Per-persona control panel scaffold** (Phase 0.10) — `user_personas` table referenced (M33), schema not written.

## 8. Duplicate systems / handoff contracts

These were caught by red-team round 3 and have explicit handoff contracts in `ROADMAP_2026.md`:
- **A5 PDP rewrite drafts ↔ Phase 2 PDP copy gen** — ONE generator, two trigger paths (manual + scheduled). Don't re-implement.
- **A6 GMC fix drafts ↔ Phase 1 GMC monitor** — monitor emits alert; A6 subscribes to alert; ΔROI credited to A6 only.
- **`scripts/status.sh` (existing) ↔ `scripts/build-status.sh` (new)** — different purposes (ephemeral CLI print vs persistent dashboard), no duplication, but both should remain.

## 9. Recommended cleanup opportunities (do during restructure, not now)

- Move `.git/hooks/pre-push` into `scripts/git-hooks/pre-push` + add a `make install-hooks` target so cloning preserves it.
- Consolidate vibe-speak's many sub-files into a tighter folder structure when moving to Skills repo.
- Consider extracting `js/csv_import.js` (the helper from BUILD_INTELLIGENCE #80) into a shared utilities package.
- Per-module `audit_log.write` calls scattered across 36 modules — could centralize into AI Gateway / write-gateway primitive (Phase 0.13's `logEvent`).
- `MODULE_REGISTRY` refactor mentioned in BUILD_INTELLIGENCE #52 — collapse 4 shell touchpoints to 1 registry entry per module.

## 10. What the upcoming restructure should preserve

In priority order:
1. **`ROADMAP_2026.md` Decisions Log** — append-only history of 5 roleplay rounds. Don't lose.
2. **`BUILD_PLAN_CLAUDE.md` Tracks 7-14** — 73 ordered tasks tied to roadmap phases.
3. **`BUILD_PLAN_MICHAEL.md` M-blockers** — Owner action queue. Re-anchor paths if files move.
4. **`BUILD_INTELLIGENCE.md`** — 91 lessons from 36 shipped modules. Append-only; don't truncate.
5. **`PROMPT_LOG.md`** — verbatim prompt history. Mining target for future eval set.
6. **vibe-speak profiles + feedback-log + observation-log** — calibrated persona data. Slow to recreate.
7. **Module Modes registry + user overrides** — manual config the team has accumulated.
8. **Stop hook + pre-push hook wiring** — small but invisible-when-broken.

## 11. Final advisory

If the restructure is large enough to warrant new repo names (AgentOS / Skills / Command Center / BC Theme), do a **Decisions Log entry in `ROADMAP_2026.md`** capturing:
- Old → new path mapping
- Cross-repo dependency graph
- Which phase resumes in which repo
- Threshold score after restructure (likely temporary dip from re-anchoring)

Then resume per `NEXT_STEPS.md`.
