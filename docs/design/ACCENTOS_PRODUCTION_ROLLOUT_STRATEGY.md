# AccentOS Production Rollout Strategy
> **Doc type:** Planning only — non-implementing spoke session output
> **Status:** Draft v1 — for review by primary UI session before any code execution
> **Scope:** Safest progressive integration of the approved AccentOS shell architecture into the live monolith over time
> **Production:** `accent-os.pages.dev` (Cloudflare Pages, auto-deploy from `main`)
> **Non-goals:** Big-bang rewrites, framework introduction, simultaneous multi-module migrations, breaking the live monolith
> **Branch context:** Authored on `claude/accentos-rollout-planning-UTElf` — no production files modified.

---

## 0. Required-reading reconciliation

The strategist prompt named four documents that do **not** currently exist in the repo:

- `SYSTEM_STATE.md`
- `GOVERNANCE_RISKS.md`
- `STABILIZATION_PROTOCOL.md`
- `MODULE_OWNERSHIP_MAP.md`
- `docs/design/*` (directory was empty until this doc)

This strategy is therefore derived from the canonical sources that **do** exist:

- `MASTER.md` (sections 3, 4, 5, 12 — current state, architecture, build plan, hard rules)
- `MODULE_MODES.md` + `module_modes.json` (the existing rollout-state machine)
- `WORK_IN_PROGRESS.md` (active bug surface — Anthropic worker / Quote Generator parse)
- `BUILD_PLAN_CLAUDE.md`, `BUILD_PLAN_MICHAEL.md`, `BUILD_INTELLIGENCE.md`
- Live repo layout: `index.html` (7,169 lines), `js/*.js` (37 module files), `worker/anthropic-proxy.js`, `sql/`, `wrangler.toml`

**Recommendation (governance):** before this strategy is executed, the four named documents should be authored or explicitly retired. They are referenced in this plan as "future governance artifacts" wherever useful. See §11 — Governance Checkpoints.

---

## 1. Current shape of the system (what we are migrating *from*)

The system today is a **partially split monolith**:

- `index.html` — 7,169-line shell carrying nav, routing, shared utilities, auth bootstrapping, design tokens, and the bulk of the original v6 surface area.
- `js/*.js` — 37 lazy-loaded module files (vendor, pipeline, customers, employees, knowledge, marketing, calendar, jobs, deliveries, inventory, alerts, internal_meetings @ 2,436 lines, etc.). These were extracted under Track 0.1.
- `worker/anthropic-proxy.js` — Cloudflare Worker proxy at `accentos-anthropic-proxy.mgraf77.workers.dev`. Currently the only out-of-process surface. Carries an active bug (commit `2dca2a6` not redeployed; Quote Generator Parse Notes 400s).
- `sql/` + manual Supabase SQL Editor workflow (MCP is broken on project `hsyjcrrazrzqngwkqsqa`).
- `module_modes.json` + `js/module_modes.js` — **already-shipped feature-flag plus state-machine** (`idea_only` → `brainstorming` → `planning` → `blocked` → `building` → `testing` → `live` → `deprecated` → `hidden`) with per-user overrides. This is the single most important asset for safe rollout: **it already exists, it is already wired into the sidebar gate, and it should be the primary rollout instrument.**

The "approved AccentOS shell architecture" referenced in the prompt is assumed to be the next-generation command-center shell (route-based, mobile/PWA-aware, role-driven dashboards, agentic capability-ladder L3+). This document treats it as a directionally-correct prototype that has **not** been merged.

---

## 2. Coexistence strategy with the current monolith

### 2.1 Two-shell coexistence (the load-bearing decision)

Run the new shell **inside** `index.html` for the entire rollout. Do **not** introduce a second top-level entry point, a second deploy target, or a second domain. Reasons:

- Cloudflare Pages auto-deploys `main`. A second entry point doubles the blast radius.
- Auth (Supabase session, anon key in `sessionStorage['aos-sb-key']`, JWT) is bootstrapped exactly once in the current shell. Re-bootstrapping it in a second shell creates a session-fork class of bugs.
- The design system (`#f4f4f2`, `#ed1c24`, Outfit/DM Mono) is enforced by global CSS in `index.html`. Forking it forks visual identity.

Mechanism: the new shell mounts as a **sub-region** of the existing layout — initially under a single route/tab gated by `module_modes.json` at `mode: building` (Owner-only). Everything else in production keeps working unchanged.

### 2.2 Use `module_modes.json` as the rollout dial

The rollout machine is **already built and shipped**. We do not need a parallel feature-flag system. Every new shell-based surface enters the system as a `module_modes.json` entry and walks the existing ladder:

```
idea_only → brainstorming → planning → blocked → building → testing → live → deprecated
```

`testing` already grants Owner+Admin preview; `building` is Owner-only; per-user `allow` overrides exist for early access without role changes. This is the **lowest-entropy rollout instrument we have** — every new shell module should ride it.

### 2.3 Worker boundary stays narrow

Today there is exactly one Worker (Anthropic proxy). Until the WIP bug (`2dca2a6` redeploy + Parse Notes 400) is resolved, **do not expand worker surface area**. Resolve before rollout phase 1.

---

## 3. Rollout phases (rollback-safe)

> **Phase-numbering disambiguation (read before reading anything else in this section).** Two independent phase ladders are active in AccentOS governance and they share digits without sharing meaning:
>
> - **Canonical Phase 0–7** — defined in canonical `STABILIZATION_PROTOCOL.md` on branch `claude/governance-snapshot-prep-k3dBs`. These phases govern the **multi-repo restructure** (lifting `skills/`, `scripts/`, framework code from `accent-os` into `agentos-core` / `agentos-command-center` / `agentos-skills`). Their Phase 1 is "pre-restructure hardening." Their Phase 4 includes the vibe-speak relocation.
> - **Rollout Phase 0–6** — defined in this section. These phases govern the **shell-v2 progressive rollout** (mounting new command-center modules inside `index.html` via `js/shell_v2/*.js`, gated by `module_modes.json`). Their Phase 1 is "shell beachhead." Their Phase 6 is "v1 deprecation."
>
> The two ladders are **separate scopes**. Neither ladder replaces the other. Neither ladder's Phase N maps to the other ladder's Phase N. Any future prompt, commit subject, SESSION_LOG entry, or session handoff that uses a "Phase N" reference **must state which ladder it means** — write "canonical Phase 1" or "rollout Phase 1," never bare "Phase 1." Failure to disambiguate is a documentation bug.

Each phase has: a single dial (`module_modes.json` entry), an exit criterion, a rollback path, and a max-duration budget. **No phase advances until the prior phase's exit criterion is met.**

### Phase 0 — Stabilize (prerequisite — NOT part of rollout)
- **Exit criteria:** WIP Anthropic-proxy bug closed (`2dca2a6` deployed, Parse Notes returns 200 on golden path); SESSION_LOG.md initialized; the four missing governance docs (§0) authored or retired; Supabase MCP either fixed or formally documented as "manual SQL paste only."
- **Rollback:** N/A — pre-rollout.
- **Budget:** 1–2 sessions.

### Phase 1 — Shell beachhead (read-only, Owner-only)
- **Mechanism:** Add one new shell-region entry to `module_modes.json` at `mode: building` (Owner-only). It mounts inside `index.html` as a single sidebar item ("Command Center v2" or similar). It reads existing data; it does **not** write.
- **Surface:** One screen — recommend the **Daily Command Center** because it is read-mostly, role-aware, already live in v1, and is the natural anchor for the future shell topology.
- **Exit criteria:** 7 consecutive days of Owner-only use without regressions in the v1 Daily Command Center; visual parity verified on `accent-os.pages.dev`.
- **Rollback:** flip the module to `idea_only` in `module_modes.json` → it disappears from the sidebar instantly. No deploy required beyond the JSON commit.
- **Budget:** 1 session to scaffold, 1 week to bake.

### Phase 2 — Admin preview (`testing` mode)
- **Mechanism:** Flip the Phase 1 module from `building` → `testing`. Owner+Admin (Paul, Patrick) now see it. Any per-user `allow` overrides apply.
- **Exit criteria:** No regressions reported; Admin sign-off; telemetry (or session logs) show no error spikes.
- **Rollback:** flip back to `building` (Admins lose access; Owner keeps it).
- **Budget:** 1 week.

### Phase 3 — Read-only `live` (gated by role)
- **Mechanism:** Flip module to `live`. `data-roles` whitelist on the sidebar item controls who sees it. **The v1 surface stays live alongside.** Both routes are present.
- **Exit criteria:** ≥2 weeks of co-existence, zero P0/P1 issues, ≥80% of target-role users have actively opened it at least once (or explicit Owner waiver).
- **Rollback:** flip to `testing` to retract from regular roles without removing from Admin/Owner.
- **Budget:** 2–3 weeks.

### Phase 4 — Module-by-module migration into the new shell
- **Order (lowest risk first):**
  1. **Daily Command Center** (Phase 1–3 above)
  2. **Owner / Mgmt Dashboard** — read-mostly, role-narrow, already live
  3. **Pipeline read views** (list/forecast) — write paths stay in v1
  4. **Quote Generator read views** — write paths stay in v1 *and* the live WIP bug must be closed first
  5. **Vendor Intelligence read views** — highest data complexity; migrate read first, write last
  6. **Settings / Users** — last because it touches auth/roles
- **Per-module mechanism:** each module gets its own `module_modes.json` entry walking `building → testing → live`. Reads migrate before writes. Writes remain in the v1 monolith until the new-shell read view has ≥2 weeks of clean operation.
- **Exit criteria (per module):** v2 view is at parity with v1 view; rollback dial verified working; Michael signs off.
- **Rollback:** per-module dial — never a global rollback.
- **Budget:** 1 module per 2–3 sessions; total 6–10 weeks.

### Phase 5 — Write-path migration (per module, smallest writes first)
- **Mechanism:** A single write surface (e.g., "create quote line") moves into the new shell. The v1 write path is left intact and reachable via a "Classic" toggle on the same screen for at least 2 weeks.
- **Exit criteria:** zero data-loss incidents; Supabase-side reads of v2-written rows match v1-written rows byte-for-byte (jsonb / numeric parity).
- **Rollback:** flip back to v1 write path; the "Classic" toggle becomes the default.

### Phase 6 — v1 deprecation
- **Mechanism:** v1 surfaces flip to `mode: deprecated` (visible only to override-allow users). They remain in the codebase but are removed from the default sidebar. After 30 days without override use, the v1 code path is deletable.
- **Exit criteria:** 30 days of zero `deprecated`-route usage.
- **Rollback:** flip back to `live`.

---

## 4. Low-risk integration boundaries

The boundaries below are where shell-v2 should plug into the live monolith. Each has been chosen because the contract is already stable.

| Boundary | Stable? | Use it for | Avoid |
|---|---|---|---|
| `module_modes.json` registry + `canSeeModule` resolver | ✅ shipped | Rollout gating | Adding a parallel flag system |
| Supabase REST + `sbFetch` helper in `index.html` | ✅ shipped | All data access | Direct `fetch` to Supabase from new shell code |
| `sessionStorage['aos-sb-key']` + auth bootstrap | ✅ shipped | Reading the active session | Re-implementing auth |
| `worker/anthropic-proxy.js` | ⚠️ active bug | AI calls — **only after WIP fix** | Adding new worker routes pre-fix |
| Design tokens in `index.html` `<style>` | ✅ shipped, locked | Visual parity | Inline restyling, alternate themes |
| `data-roles` sidebar gating | ✅ shipped | Role visibility | Building a parallel role check |
| Per-user override layer (`accentos_user_overrides` localStorage) | ⚠️ v1, single-browser | Owner-machine early access | Treating as cross-device authoritative |

---

## 5. Module injection strategy

**Single rule:** new-shell modules are injected into the running monolith via the **same lazy-load pattern used by Track 0.1** — a `<script src="js/shell_v2/<name>.js" defer>` (or dynamic `import()`) loaded only when the module's tab is activated **and** `canSeeModule(user, key)` returns true.

- Initial page load is unaffected (zero-impact on existing users).
- Each shell-v2 module is one file under `js/shell_v2/` (new subdirectory; non-overlapping with the existing 37 module files).
- Each module exports a single `mount(rootEl, ctx)` / `unmount()` pair. `ctx` carries the existing helpers (`sbFetch`, current user, role, design tokens) — no re-implementation.
- No bundler. No build step. No framework. (Hard rule from MASTER §12.)

This keeps the 900KB-per-file split-trigger discipline intact and avoids growing `index.html` beyond its current 7,169 lines.

---

## 6. Shell migration sequencing (dependency-first)

```
[A] WIP bug fix (Anthropic proxy)            ── unblocks AI-using surfaces
        │
[B] Track 0.4 Core DB schema                  ── unblocks persistence parity
        │
[C] Daily Command Center → shell v2           ── beachhead, read-only
        │
[D] Mgmt Dashboard → shell v2                 ── read-only, role-narrow
        │
[E] Pipeline read → shell v2                  ── after [B]
        │
[F] Quote Generator read → shell v2           ── after [A] verified
        │
[G] Vendor Intelligence read → shell v2       ── highest entropy module
        │
[H] Write paths, smallest first               ── one module at a time
        │
[I] v1 deprecation                            ── 30-day cooldown
```

Sequencing law (from MASTER §5 "Dependency-first"): nothing built until its infrastructure is confirmed complete.

---

## 7. Future route architecture

Recommended target topology (long-term, post-Phase 6):

```
/                           → role-aware landing (Daily Command Center)
/vendors                    → Vendor Intelligence
/pipeline                   → Sales Pipeline
/quotes                     → Quote Generator
/customers                  → CRM / Customer 360
/employees                  → Employee Scorecards
/mgmt                       → Owner / Manager Dashboard
/mgmt/modes                 → module_modes.json UI
/settings                   → Settings (Users, Integrations)
/m/*                        → mobile-optimized (PWA shell — see §15)
```

Routing should be hash-based (`#/vendors`) until a Worker-side router exists — Cloudflare Pages serves a single `index.html` and we cannot add server-side routes without expanding worker surface (deferred until post-Phase 6).

---

## 8. Operational cutover strategy

- **Cloudflare auto-deploy:** stays as-is. Every cutover is a single `main` commit.
- **Cutover unit:** one `module_modes.json` flip per cutover. Never bundle two flips in one deploy.
- **Cutover window:** weekday morning, never Friday afternoon, never during showroom peak hours (Sat 10–3).
- **Pre-cutover checklist:**
  1. Verify `accent-os.pages.dev` is currently green.
  2. Verify the inverse flip (rollback) has been dry-run on staging (`accent-os-staging.pages.dev`).
  3. Confirm WORK_IN_PROGRESS.md has no incomplete tasks.
  4. Print the rollback command in the commit body.
- **Post-cutover:** check live URL, watch for 5 minutes, log to SESSION_LOG.md.

---

## 9. Survivability strategy during rollout

- **The monolith is the survival layer.** v1 surfaces remain reachable for the entire rollout (Phases 1–5) and for 30 days after Phase 6.
- **No shared mutable state between v1 and v2 in the same session for the same record.** Concretely: if a user has v2 open on a quote, v1's edit form for that quote is hidden via `module_modes` resolution, not by client-side coordination.
- **Data writes are journaled.** Every Supabase write from shell v2 includes a `source: 'shell_v2'` column (or jsonb metadata) so that, in the event of a rollback, v2-only writes can be identified and replayed/reverted.
- **Per-user override = pressure valve.** Any user who hits a v2 regression can be flipped back to v1 individually without disturbing anyone else.
- **No destructive migrations during rollout.** No `DROP COLUMN`, no `RENAME`, no backfills that mutate v1-readable shape. Additive-only.

---

## 10. Integration testing philosophy

Given the no-framework / no-build constraint and the absence of an existing test suite:

- **Golden-path manual checklists per module** (markdown, in `docs/design/test/<module>.md`). Each checklist has ≤10 steps, takes ≤5 minutes, and is run before every state flip.
- **Live URL is the only test environment.** Staging exists (`accent-os-staging.pages.dev`) and should mirror main pre-flip.
- **Snapshot test:** `curl https://accent-os.pages.dev` before and after each cutover; diff non-trivially. Used to detect accidental shell-wide regressions.
- **Behaviour telemetry (planned, MASTER §4 LAYER 0):** once `telemetry_events` is live, page-load and module-mount events become the lightweight regression signal. Until then, manual checklists are authoritative.
- **Anti-pattern:** introducing a JS test framework as part of this rollout. That is its own project; it is **not** a prerequisite for safe rollout because `module_modes.json` already provides per-user rollback granularity.

---

## 11. Governance checkpoints

A flip from one phase to the next requires **all** of:

1. ✅ Prior phase exit criteria met and logged in SESSION_LOG.md.
2. ✅ Rollback dry-run executed on `accent-os-staging.pages.dev`.
3. ✅ Michael's explicit go (per MASTER §2 — strategy decisions affecting architecture pause for Captain).
4. ✅ WORK_IN_PROGRESS.md is empty (no in-flight WIP commit).
5. ✅ The module's golden-path checklist passes.

Future governance artifacts to author (currently missing — see §0):

- `SYSTEM_STATE.md` — single-page snapshot of monolith state, module modes, worker state, DB schema version. Updated each session-end.
- `GOVERNANCE_RISKS.md` — running risk register: each row = (risk, owner, mitigation, status). Phase advancement requires no `🔴` rows.
- `STABILIZATION_PROTOCOL.md` — the freeze rules in §12 below, formalized.
- `MODULE_OWNERSHIP_MAP.md` — for every module key in `module_modes.json`, who owns the spec, who owns the code, who owns the data contract.

---

## 12. Production freeze conditions

Freeze = no `module_modes.json` flips and no shell-v2 commits to `main`. Triggers:

- 🔴 **WIP bug open in WORK_IN_PROGRESS.md.** (Today: yes — Anthropic proxy.)
- 🔴 Any P0/P1 reported on a `live` module within the last 48h.
- 🔴 Cloudflare Pages most-recent deploy is failed/red.
- 🔴 Supabase outage or MCP-permissions degradation that blocks SQL paste workflow.
- 🟡 Showroom peak hours (Sat 10–3 CT) — soft freeze for cutovers.
- 🟡 Any vendor / external-comm crisis active (MAP violation response, GMC enforcement event).

Unfreeze = explicit Owner sign-off + a SESSION_LOG entry naming the resolved trigger.

---

## 13. Recommended extraction timing

"Extraction" = pulling a module out of `index.html` into its own file (the Track 0.1 pattern). For shell-v2 modules, extraction happens **at birth** (each shell-v2 module is born as its own `js/shell_v2/<name>.js`).

For remaining v1 surfaces still living in `index.html`:

- **Trigger A (size):** `index.html` exceeds 800KB (89% of the 900KB hard limit). Today: ~680KB / 76%. Headroom remains; do not preemptively extract.
- **Trigger B (churn):** any single subsystem in `index.html` receives ≥3 commits in a 2-week window. That subsystem is extracted.
- **Trigger C (shell-v2 dependency):** if shell-v2 needs to import a helper currently inlined in `index.html`, extract the helper (not the whole subsystem) into `js/shared/<helper>.js` first.
- **Anti-trigger:** never extract during a freeze, never extract in the same commit as a `module_modes.json` flip, never extract more than one subsystem per session.

**Concrete recommendation:** do **not** extract anything else from `index.html` until Phase 1 ships and the WIP bug is closed. The current 76% utilization is comfortable.

---

## 14. Long-term command-center topology

Target end-state (Phase 4 of MASTER §14, EOY 2026):

```
                       ┌──────────────────────────────────────────┐
                       │  index.html  (shell host, ~700KB cap)    │
                       │   - design tokens                        │
                       │   - auth bootstrap                       │
                       │   - module_modes resolver                │
                       │   - hash router                          │
                       └──────────────┬───────────────────────────┘
                                      │ lazy import()
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
   js/shared/*                  js/shell_v2/*                  js/v1/*
   (helpers, sbFetch,           (new command-center            (legacy modules,
    design utils)                modules — born here)           deprecated path)
        │                             │
        └────────────┬────────────────┘
                     │
                ┌────▼──────────┐
                │  Supabase     │  ── single DB, additive schema
                │  (Postgres)   │     RLS gates writes by role
                └────┬──────────┘
                     │
                ┌────▼──────────┐
                │  Workers      │  ── narrow surface
                │  (Anthropic   │     one worker per external API
                │   proxy, …)   │     never trusted with secrets in URL
                └───────────────┘
```

Long-term laws:

- One shell host. One DB. N narrow workers.
- Every module is registered in `module_modes.json`.
- Every external call is proxied through a worker (zero browser-side API keys beyond Supabase anon).
- Every role-gated surface checks `canSeeModule` — never re-implements the check.

---

## 15. Mobile / PWA rollout considerations

- **Defer the PWA manifest until Phase 4** (after Daily Command Center has shipped in shell v2). A PWA shipped over a half-migrated UI traps users in cached old shells and is operationally painful to reverse.
- **Mobile-first within the desktop shell.** Each shell-v2 module must be usable on iPhone Safari at 390px width before it leaves `building` mode. Michael uses Claude on iPhone (MASTER §2) — mobile parity is non-optional.
- **Touch-target budget:** 44×44pt minimum for all interactive elements in shell v2. v1 is allowed to remain non-compliant during coexistence.
- **Service worker:** introduced **only** after Phase 6 (v1 deprecation). Service-worker caching + an in-flight rollout = unrecoverable user-side staleness.
- **Offline:** explicitly not in scope for this rollout. Daily Command Center is the natural first offline target post-Phase 6.
- **App icon / install prompt:** wait until shell v2 is the default; otherwise installed users see v1 forever.

---

## Appendix A — Single-page rollout checklist (per phase flip)

```
[ ] Freeze conditions clear (§12)
[ ] WORK_IN_PROGRESS.md empty
[ ] Prior-phase exit criteria logged in SESSION_LOG.md
[ ] Golden-path checklist for the module passes on staging
[ ] Rollback flip dry-run on staging
[ ] curl snapshot of accent-os.pages.dev captured
[ ] module_modes.json edited (single flip, single commit)
[ ] Commit body includes the rollback command
[ ] Cloudflare deploy green within 60s
[ ] curl snapshot post-deploy diff reviewed
[ ] Michael's explicit go before flipping to `live`
```

---

## Appendix B — Risks ranked

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | Anthropic proxy WIP bug widens scope mid-rollout | High | High | Phase 0 hard-blocks rollout until closed |
| 2 | Two-shell coexistence creates session/state forks | Medium | High | One shell host (`index.html`); shell v2 mounts inside it |
| 3 | Supabase MCP remains broken; schema drift | Medium | Medium | Manual SQL paste workflow, additive-only, schema-version note in SYSTEM_STATE.md |
| 4 | A module flip skips the ladder (`building` → `live` in one commit) | Medium | High | Governance checkpoint #3 (§11) — Michael's explicit go |
| 5 | `index.html` blows past 900KB during rollout | Low | Medium | Born-extracted shell-v2 modules; no inlining |
| 6 | Mobile parity is treated as a Phase-4 problem | High | Medium | §15 — mobile-first inside `building` mode |
| 7 | Per-user overrides drift across browsers (localStorage v1) | Medium | Low | Treat overrides as Owner-machine only until M30 (Supabase table) lands |
| 8 | PWA / service worker introduced too early | Low | High | §15 — strictly post-Phase 6 |
| 9 | Cloudflare Pages deploy fails on a flip-only commit | Low | Medium | Pre-flip staging dry-run; flip-only commits never bundle code changes |
| 10 | Showroom-hours regression on Saturday | Medium | Medium | §12 soft freeze + cutover window rule |

---

## 16. Rollout metrics + gates (operationally measurable)

> Added in v1.1 reconciliation pass. Replaces vague "no regressions" / "Owner sign-off" language with measurable thresholds. Authority order: this section is advisory; `STABILIZATION_PROTOCOL.md` (canonical) supersedes on conflict.

### 16.1 Per-phase go / no-go criteria

| Phase | GO requires (all) | NO-GO if any |
|---|---|---|
| Phase 0 Stabilize | WIP empty; Anthropic proxy 200 on 5/5 Parse Notes calls; SESSION_LOG.md initialized | WIP non-empty; CF deploy red <24h |
| Phase 1 Beachhead | New module entry at `building`; Owner-only verified on 2 devices (desktop + iPhone 390px); v1 surface unchanged on snapshot diff | Visible to non-Owner; v1 snapshot diff non-trivial |
| Phase 2 Admin testing | Owner+Admin verified; 7 calendar days at `building` with 0 P0/P1; rollback dry-run on staging passes | Any P0/P1 in last 7d; rollback dry-run failure |
| Phase 3 Read-only live | 7 calendar days at `testing`, 0 P0/P1; ≥3 Admin sessions logged opening the module; per-role visibility check passes for all 5 roles | <3 Admin sessions; any role-visibility mismatch |
| Phase 4 Per-module reads | Per module: parity checklist passes; mobile parity at 390px; `source: 'shell_v2'` tag absent (read-only phase) | Parity miss; mobile fails; v1 surface broken |
| Phase 5 Smallest writes | Per write: 0 data-loss in 14d; v1↔v2 row parity = 100% on byte-level Supabase diff; `source: 'shell_v2'` tag present on 100% of writes | Any parity miss; any untagged v2 write |
| Phase 6 Deprecate | 30 calendar days zero `deprecated`-route hits in audit_log | Any hit in window |

### 16.2 Rollout readiness score (per module, 0–10)

Compute before each phase advancement. Module advances only at score ≥8.

| Component | Weight | Source |
|---|---|---|
| Golden-path checklist pass rate | 2 | manual |
| Mobile parity at 390px (binary) | 2 | manual |
| Rollback dry-run success on staging (binary) | 2 | manual |
| Days since last P0/P1 on this module ≥ 7 | 1 | audit_log / report |
| `module_modes.json` parses cleanly (binary) | 1 | `jq .` |
| Cloudflare last deploy green (binary) | 1 | CF dashboard |
| Captain go logged in SESSION_LOG (binary; required only for `→ live` and `→ deprecated`) | 1 | SESSION_LOG.md |

Score <8 = no advancement. Score <5 = freeze candidate.

### 16.3 Rollback trigger thresholds (auto-rollback recommended)

Any one triggers an immediate flip-back of the offending module:

- ≥1 P0 (data loss, role-visibility breach, write-write conflict involving v2) — instant.
- ≥3 P1 (broken module load, blank panel, mobile unusable) within 24h — instant.
- ≥5 user reports of stale-client behavior on the module within 24h — flip-back; bump cachebust.
- `module_modes.json` parse failure on `main` — instant `git revert`.
- v1↔v2 byte-level row diff >0 on a sample of 20 records during Phase 5 — instant; freeze writes.
- Cloudflare deploy red for >5 minutes following a flip — investigate; flip-back if not green within 15 min.

### 16.4 Operational stability metrics (running gauges)

Tracked manually in SESSION_LOG until telemetry is wired:

| Metric | Healthy | Warn | Freeze |
|---|---|---|---|
| `index.html` size | <800KB | 800–860KB | ≥860KB |
| Open WIP count | 0 | 1 | ≥2 |
| Days since last green deploy | <2 | 2–5 | ≥5 |
| Active P0 | 0 | n/a | ≥1 |
| Active P1 | ≤2 | 3–4 | ≥5 |
| Per-user override count vs. justified | match | +1 | +2 or more |
| `module_modes.json` modules in `building` | <5 | 5–8 | ≥9 (rollout congestion) |
| Days since last `STABILIZATION_PROTOCOL.md` review | <30 | 30–60 | ≥60 |

### 16.5 Cognitive-load metrics

Heuristic, but operationally useful:

- Sessions per week handling rollout > 4 → slow down (one phase per week max).
- New surfaces in `building` at once > 3 → freeze new entries until ≤3.
- Number of `claude/*` branches open > 4 → triage and close stale.
- Captain context-switches per session (different modules touched) > 3 → consolidate.

### 16.6 Mobile readiness gates

A shell-v2 module cannot leave `building` without all of:

- iPhone Safari 390px viewport: zero horizontal scroll on the default view.
- All interactive elements ≥44×44pt.
- No `position: fixed` overlay obscuring primary content at 390×844 viewport.
- Initial mount on a cold cache <2.5s on a throttled 4G profile (manual estimate acceptable).
- Captain confirms "usable on iPhone" in SESSION_LOG.

### 16.7 Shell adoption signals

Observable, no telemetry required:

- Phase 3 (`live`) advancement requires ≥80% of target-role users having opened the module ≥1× within 7 days, OR Captain waiver in SESSION_LOG.
- Phase 5 (`writes`) advancement requires the v2 write path being used in ≥50% of writes by target users for 7 days, with v1 still available — measured via `source: 'shell_v2'` tag on Supabase rows.
- Phase 6 (`deprecate`) requires 30 days of zero v1-route hits per audit_log.

---

## 17. Shell-v2 coexistence hardening

> Added in v1.1. Deepens §2 (coexistence strategy) with operational rules.

### 17.1 Coexistence lifecycle (per module)

```
v1 only
   │
   ▼
v1 + v2(read, building) ──── Owner only
   │
   ▼
v1 + v2(read, testing) ───── Owner + Admin
   │
   ▼
v1 + v2(read, live) ──────── Per-role gating; both surfaces clickable; v1 default
   │
   ▼
v1 + v2(read+write split) ── v1 default; v2 write behind a "Try new" toggle
   │
   ▼
v2 default + v1(deprecated) ─ v1 reachable only via override
   │
   ▼
v2 only ──────────────────── after 30-day cooldown
```

Each transition is one `module_modes.json` flip + (optional) one default-toggle flip. Never combined.

### 17.2 v1 / v2 synchronization philosophy

**Synchronization is rejected as a goal.** v1 and v2 do not synchronize state. They share *only* the database. Implications:

- No client-side event bus between v1 and v2.
- No shared in-memory cache between v1 and v2.
- No "live update v1 when v2 writes" mechanism.
- A user with both surfaces open in different tabs is responsible for refreshing — and during Phase 4–5, this is rare because v2 writes are gated.

The only synchronization point is **Supabase**. The contract is: read-after-write within a single tab; eventual consistency across tabs.

### 17.3 State ownership boundaries

| State category | Owned by | Who may write |
|---|---|---|
| Supabase rows (canonical data) | DB | v1 *or* v2 — never both for same record type per Phase |
| `sessionStorage['aos-sb-key']` | Auth bootstrap (in `index.html`) | Bootstrap only; both shells read |
| `sessionStorage['aos-api']` | Settings UI | Settings only; both shells read |
| `localStorage['accentos_user_overrides']` | Owner machine | Owner UI only; both shells read |
| In-memory module state | The shell that mounted it | That shell only; never cross-shell |
| URL hash route | Whichever shell handles the route | Single owner per route — `module_modes.json` decides |
| Design tokens (CSS) | `index.html` `<style>` | Captain; both shells consume |

### 17.4 Module authority boundaries

- A module has exactly one *active* surface per user per phase. Either v1 or v2, never both visible to the same user simultaneously for the same module.
- `canSeeModule` is the arbitrator. If both v1 and v2 entries exist for the same module key, the resolver returns at most one as visible based on phase.
- Two module *keys* may coexist (e.g., `pipeline` and `pipeline_v2`) during transition; the resolver shows one or the other, never both.

### 17.5 Event propagation philosophy

- **No global event bus.** Any cross-module signal goes through Supabase (write a row, the other module reads it next mount).
- **Mount/unmount is the only lifecycle event.** No `onShow`, `onHide`, `onFocus` hooks. Modules that need polling implement their own interval, scoped to their `mount` lifetime, cleared on `unmount`.
- **No `window`-scoped pub/sub.** Reduces cross-shell leakage and stale-listener bugs.
- **No `BroadcastChannel`.** Cross-tab coordination is out of scope until Phase 6.

### 17.6 Lazy-load governance

- Shell-v2 modules load via `import('/js/shell_v2/<name>.js?v=<commit-sha>')` from `mount`-time code paths only. Never on shell init.
- One dynamic-import level per module (per F2 prevention).
- Sub-dependencies are static `import` statements at the top of the module file.
- A module that fails to load logs to console and presents a passive "Module unavailable — retry later" placeholder; it does not throw to the parent shell.
- Bundle/chunk caching is governed by the `?v=<commit-sha>` cachebust — the only cache key the rollout depends on.

### 17.7 Rollback-safe injection mechanics

Each shell-v2 module exports:

```
mount(rootEl, ctx) → handle    // returns { unmount, version }
```

Mechanics:

- `rootEl` is the only DOM node the module may write to.
- The module attaches *one* event-listener registration helper that auto-cleans on `unmount`.
- The module never adds nodes to `document.body` outside `rootEl` (no portals, no tooltips appended to body during the rollout — they leak across mounts).
- `ctx` carries: current user, role, `sbFetch`, design tokens reference, `canSeeModule` resolver. The module never reaches outside `ctx` for these.
- `unmount()` is idempotent. Calling it twice is safe.
- Rollback = host calls `unmount` on every active v2 mount, then refuses to mount until the flip is reversed.

### 17.8 Coexistence anti-patterns (forbidden during rollout)

- Mixing v1 and v2 markup inside the same panel.
- v2 importing v1 helpers from `index.html` inline scope (use `js/shared/*` or pass via `ctx`).
- v2 writing to `localStorage` keys v1 owns.
- v1 reading `localStorage` keys v2 added.
- Cross-shell DOM queries (`document.querySelector` reaching into the other shell's tree).
- Any `setTimeout`/`setInterval` not anchored to a `mount` lifetime.
- Any third-party script tag added during rollout (zero new dependencies — MASTER §12).

---

*End of ACCENTOS_PRODUCTION_ROLLOUT_STRATEGY.md — planning only. No production files modified.*
