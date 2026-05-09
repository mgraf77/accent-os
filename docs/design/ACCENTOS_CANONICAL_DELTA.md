# AccentOS Canonical Delta
> **Doc type:** Read-only reconciliation. Identification, not edits.
> **Branch:** `claude/accentos-rollout-planning-UTElf` at `dffcc984` (convergence-frozen).
> **Canonical branch:** `claude/governance-snapshot-prep-k3dBs` (HEAD `2da4ae5` per `git ls-remote`).
> **Files read (read-only):** `SYSTEM_STATE.md` (152 lines), `GOVERNANCE_RISKS.md` (124 lines), `STABILIZATION_PROTOCOL.md` (186 lines), `MODULE_OWNERSHIP_MAP.md` (155 lines).
> **Output:** alignment requirements only. No canonical edits, no spoke-doc edits.

---

## 0. Headline finding (read this first)

The canonical governance branch and this rollout-planning branch describe **two different "big changes"** to AccentOS:

| Branch | Scope of "big change" |
|---|---|
| **Canonical** (`governance-snapshot-prep-k3dBs`) | **Multi-repo split** — lifting `skills/`, `scripts/`, framework code from `accent-os` into new repos: `agentos-core`, `agentos-command-center`, `agentos-skills`. Phases 0–7. `index.html` is **scope-out**. `worker/` is **scope-out**. |
| **This branch** (`accentos-rollout-planning-UTElf`) | **Shell-v2 progressive integration** — mounting a new command-center shell *inside* `index.html` via `js/shell_v2/*.js`, gated by `module_modes.json`. Phases 0–6. |

Both governance worlds are valid and they barely overlap — but **neither doc set acknowledges the other's existence.** The shell-v2 rollout effectively happens *after* (or within scope-frozen boundaries of) the multi-repo split, not in parallel.

This is the dominant reconciliation requirement: every rollout-planning doc must add a one-line reference acknowledging the canonical restructure scope and that shell-v2 work happens within its scope-out boundaries.

---

## 1. SYSTEM_STATE.md

### 1.1 Contracts asserted
- Snapshot date: 2026-05-08. Captured by `governance-snapshot-prep-k3dBs`.
- Repo HEAD at snapshot: `969de17` (pause-point — worker proxy WIP).
- Total commits on the canonical branch: 66.
- Working tree clean at snapshot.
- `index.html`: 735 KB / 7,169 lines (matches this branch's reading).
- `js/`: 37 files (matches).
- `sql/`: 25 migrations M01–M40 (this branch said 25; matches).
- `skills/`: 28 + framework (vibe-speak, efficiency-monitor).
- `worker/anthropic-proxy.js` deployed at `accentos-anthropic-proxy.mgraf77.workers.dev`.
- Cloudflare Pages auto-deploys `main`.
- Coupling inventory: 0/28 skills are clean lifts; every skill couples to AL infra.

### 1.2 Where this branch's planning cites or assumes these contracts
- **Rollout Strategy §1** ("Current shape of the system"): cites 7,169 lines, 37 modules, 1 worker. ✅ Aligned.
- **Freeze Snapshot §1**: cites the same numbers. ✅ Aligned.
- **Governance Index #1**: lists `MASTER.md`, `module_modes.json` etc. ✅ Aligned.
- This branch's docs implicitly assume the system state at HEAD `969de17`. ✅ Aligned (this branch's first commit was authored against that pause-point).

### 1.3 Contradictions found
- **None of substance.** Filesystem inventory matches. Module counts match. WIP description matches.
- **Minor:** SYSTEM_STATE.md says total commits "66" (canonical) vs. this branch now at `dffcc984` with additional planning commits — the count drifts naturally. Not a contradiction; a freshness gap.

### 1.4 Specific edits required to align
- ⚠️ Recommend adding to `ACCENTOS_GOVERNANCE_FREEZE_SNAPSHOT.md` §15 a one-line cross-reference: "*System-state baseline: see canonical `SYSTEM_STATE.md` on `claude/governance-snapshot-prep-k3dBs`, snapshot 2026-05-08.*"
- ⚠️ Recommend `ACCENTOS_GOVERNANCE_INDEX.md` row #8 (which lists `SYSTEM_STATE.md` ⚠️) be updated to show the actual canonical branch name once Captain authorizes the cross-reference.
- ❌ **Not required:** any rewrite of this branch's content. The factual baseline is the same.

---

## 2. GOVERNANCE_RISKS.md

### 2.1 Contracts asserted
Twelve risks (R-01 through R-12), severity-classified. Status as of 2026-05-08:

- **R-01** vibe-speak boot path break — PLAN DOCUMENTED (S/H, atomic-commit contract drafted)
- **R-02** worker-proxy redeploy pending — UNMITIGATED (B/M, blocks any `worker/` change)
- **R-03** no upstream tracking — Mitigated procedurally
- **R-04** 7,169-line `index.html` monolith — Mitigated by **scope discipline** ("do not touch `index.html` in the big-change phase")
- **R-05** zero clean-lift skills — Documented; per-skill action
- **R-06** Stop-hook absolute path — **MITIGATED** (commit `112c181`)
- **R-07** cross-skill companion references — Documented; per-wave action
- **R-08** origin not refreshed at snapshot — **MITIGATED** (Phase 1)
- **R-09** no CI / boot smoke test — **MITIGATED** (commit `fad519e`; CI gate active)
- **R-10** parallel WIP streams — **MITIGATED** (commit `690dc23`)
- **R-11** doc count → merge conflict surface — Procedural via STABILIZATION_PROTOCOL
- **R-12** repo split breaks `git log` continuity — Documented; `git filter-repo` technique

**Pre-restructure block list (canonical, post-Phase 1):**
- R-02 (worker proxy) — STILL OPEN
- R-04 (index.html scope-out) — enforced
- All others: mitigated or documented.

### 2.2 Where this branch's planning cites or assumes these risks
- **Rollout Strategy §0 / §11 / §12** explicitly says the four canonical files "do not exist" — **incorrect**, they exist on `governance-snapshot-prep-k3dBs`. (Already known: see `ACCENTOS_GOVERNANCE_CONTRADICTIONS.md` C1.)
- **Rollout Strategy Appendix B** has a 10-row internal risk table that does **not** map to R-01–R-12. (Known: C3.)
- **All freeze-trigger lists on this branch** treat the Anthropic-proxy WIP as a hard block. ✅ Aligned with R-02.
- **Rollout Strategy §13** says "do not extract anything else from `index.html` until Phase 1 ships." ✅ Aligned with R-04 (canonical says scope-out for the *restructure*, not specifically for shell-v2 rollout — but the spirit aligns).
- This branch never references R-01 (vibe-speak boot path), R-05–R-07, R-11–R-12. These are restructure-specific risks; this branch's planning is shell-v2-specific.

### 2.3 Contradictions found
- **C-Δ-1:** This branch's Appendix B risks (rollout-specific) and canonical R-01–R-12 (restructure-specific) coexist without cross-reference. Not contradictory — *complementary*. But a future session reading both will not know that.
- **C-Δ-2:** Canonical R-04 says `index.html` is scope-out for "the big change." This branch's rollout-strategy assumes shell-v2 will eventually mount inside `index.html` (via `<script src="js/shell_v2/*">`). **Resolution:** R-04 applies to the *multi-repo restructure*, not to shell-v2 rollout. But the rollout strategy must say so explicitly.
- **C-Δ-3:** Canonical R-02 (worker proxy) is identical to this branch's Phase-0 hard block. ✅ Same fact, same authority — no contradiction. The acknowledgment loop is reinforcing.

### 2.4 Specific edits required to align
- ⚠️ Add a paragraph to `ACCENTOS_PRODUCTION_ROLLOUT_STRATEGY.md` §0 (or a new §0.5) stating: "*Canonical `GOVERNANCE_RISKS.md` (on `governance-snapshot-prep-k3dBs`) catalogs restructure risks R-01 through R-12. This rollout-strategy doc covers shell-v2 rollout risks (Appendix B). The two are complementary; R-02 (worker proxy) is the only risk shared between them.*"
- ⚠️ Add a row to `ACCENTOS_GOVERNANCE_CONTRADICTIONS.md` (or note here) labelled **C-Δ-2**: clarify R-04's scope.
- ⚠️ Reframe `ACCENTOS_PRODUCTION_ROLLOUT_STRATEGY.md` Appendix B as "shell-v2 rollout risks (advisory)" with a footer pointing to canonical `GOVERNANCE_RISKS.md` for restructure-scope risks.
- ❌ **Do not duplicate R-01–R-12 into this branch.** Cite by reference only.

---

## 3. STABILIZATION_PROTOCOL.md

### 3.1 Contracts asserted
- **Phase 0 — Governance Baseline** (the snapshot session itself). Already complete on canonical branch.
- **Phase 1 — Pre-Restructure Hardening.** Resolve R-02, R-06, R-09, R-10. Phase 1 is acknowledged as substantially complete (R-06/R-09/R-10 marked MITIGATED).
- **Phases 2–6 — Wave 1–5 extractions** of skills/, scripts/, vibe-speak, efficiency-monitor, framework. Each wave has entry criteria, actions per asset, exit criteria, rollback.
- **Phase 7 — Cleanup.** Update MASTER.md §3/§4 to new repo topology.
- **STOP CONDITIONS** (5 listed): cold-boot fail, worker proxy state change, parallel-session merge conflict, data-loss event, undocumented coupling.
- **Authorization gate per phase:** Michael explicit "go" per phase.
- **Default behavior between phases:** pause and wait. Never auto-proceed.

### 3.2 Where this branch's planning cites or assumes this protocol
- **`ACCENTOS_PRODUCTION_ROLLOUT_STRATEGY.md` §11–§12 / §16.4** treats freeze rules as "provisional until `STABILIZATION_PROTOCOL.md` merges." ✅ Honest about not having read it.
- **`ACCENTOS_ROLLOUT_FREEZE_PROTOCOL.md` §1** lists 7 hard freeze triggers + 5 soft. Canonical STABILIZATION_PROTOCOL.md lists 5 STOP CONDITIONS but they are **restructure-scoped**, not rollout-scoped.
- **`ACCENTOS_GOVERNANCE_RECONCILIATION.md` §5** says "if rollout-strategy and STABILIZATION_PROTOCOL disagree, the rollout strategy gets corrected." ✅ Correct authority order; aligned.
- **Captain authorization gate per phase** — this branch says the same thing in `ACCENTOS_GOVERNANCE_ESCALATION_MATRIX.md` §1 ("Phase advance to `live` = Captain"). ✅ Aligned in spirit.

### 3.3 Contradictions found
- **C-Δ-4 (semantic):** canonical "Phase 0–7" and this branch's "Phase 0–6" use the same vocabulary for **different sequences**.
  - Canonical Phase 1 = pre-restructure hardening.
  - This branch's Phase 1 = shell-v2 beachhead.
  - Canonical Phase 6 = HOLD review.
  - This branch's Phase 6 = v1 deprecation.
  - **This is the highest-impact contradiction in the audit.** A future session will conflate these.
- **C-Δ-5:** Canonical STOP CONDITIONS include "cold-boot Claude session fails to load vibe-speak (R-01)." This is not a rollout-strategy concern, but it *is* a session-startup concern that affects every Hub session on this branch. Should be noted.
- **C-Δ-6:** Canonical Phase 4 includes the vibe-speak move with R-01 as the dominant risk. This branch's planning does not anticipate that the shell-v2 rollout could be paused by a vibe-speak relocation. The two phase-4s are unrelated; cross-reference is required to prevent confusion.
- **No content contradictions on freeze authority, rollback semantics, or default-pause behavior** — both sets agree.

### 3.4 Specific edits required to align
- ⚠️ **High priority — disambiguate Phase numbering.** Add to `ACCENTOS_PRODUCTION_ROLLOUT_STRATEGY.md` §3 a header note: "*The Phase 0–6 numbering used in this document refers exclusively to shell-v2 rollout. Canonical `STABILIZATION_PROTOCOL.md` uses Phase 0–7 numbering for the multi-repo restructure. The two are independent.*"
- ⚠️ Add a "**Restructure phase prerequisite**" callout to `ACCENTOS_PRODUCTION_ROLLOUT_STRATEGY.md` §3 Phase 0: shell-v2 Phase 1 (Beachhead) cannot start until canonical Phase 1 (pre-restructure hardening) has cleared R-02. This is already implicit because both rely on the same Anthropic-proxy fix; making it explicit prevents drift.
- ⚠️ Update `ACCENTOS_GOVERNANCE_INDEX.md` §6 (consumption order) to advise reading canonical `STABILIZATION_PROTOCOL.md` *before* this branch's `ACCENTOS_PRODUCTION_ROLLOUT_STRATEGY.md`, so the Phase numbering distinction is visible.
- ❌ **Do not adopt canonical Phase 0–7 numbering on this branch.** They describe different work.

---

## 4. MODULE_OWNERSHIP_MAP.md

### 4.1 Contracts asserted
Per-path ownership categories:
- **STAY (accentos)** — permanent in `accent-os` repo.
- **→ agentos-core** — agent operating system (vibe-speak, efficiency-monitor, modes/profiles).
- **→ agentos-command-center** — build orchestration (BUILD_PLAN format, BUILD_INTELLIGENCE format, autonomous-mode skill).
- **→ agentos-skills** — general-purpose skills (skill-forge, codex-review, repo-scout).
- **HOLD** — undecided.

Key asserted ownerships:
- `index.html` → STAY (permanent in accentos).
- `module_modes.json`, `MODULE_MODES.md` → STAY.
- `worker/anthropic-proxy.js` → STAY.
- `js/*.js` (all 37) → STAY.
- `sql/M*.sql` (all 25) → STAY.
- `wrangler.toml` → STAY.
- `MASTER.md` → STAY (with light decoupling: §2/§12 portable patterns).
- `BUILD_PLAN_CLAUDE.md`, `BUILD_INTELLIGENCE.md` → STAY (instance) + → agentos-command-center (pattern).

Lift tiers 1–5: Tier 1 = STAY permanently; Tier 5 = cannot move (path-bound).

### 4.2 Where this branch's planning cites or assumes ownership
- **`ACCENTOS_GOVERNANCE_INDEX.md` §1**: maps governance/planning artifacts. ✅ All listed artifacts are STAY-class — none would lift.
- **`ACCENTOS_PRODUCTION_ROLLOUT_STRATEGY.md` §5** introduces `js/shell_v2/*.js` as a new subdirectory. **Not in canonical map.**
- **`ACCENTOS_MULTI_SESSION_GOVERNANCE.md` Article VI** (write-permission boundaries) overlaps with canonical ownership — but for *runtime* surfaces, not lift destinations. ✅ Complementary.
- **`ACCENTOS_GOVERNANCE_RECONCILIATION.md` §4** assigns ownership at "code owner / spec owner / data-contract owner" granularity. Canonical assigns at "future home / decoupling-required" granularity. Different axes; both valid.

### 4.3 Contradictions found
- **C-Δ-7:** `js/shell_v2/*.js` is not classified in canonical MODULE_OWNERSHIP_MAP.md. By precedent (`js/*.js` → STAY), it should be STAY. **Not a contradiction; a gap.** Captain canonical edit needed to add the row, or this branch documents the implication.
- **C-Δ-8:** Canonical map says `MODULE_MODES.md` → STAY. This branch's `ACCENTOS_GOVERNANCE_TERMINOLOGY.md` recommends a module-key naming convention added to `MODULE_MODES.md` (per existing C12). The change site (`MODULE_MODES.md`) is canonical-edit territory; needs Captain.
- **C-Δ-9:** Canonical `MASTER.md` ownership says §2/§12 are "portable patterns" eligible for agentos-command-center extraction. This branch treats `MASTER.md` §12 as the supreme authority (Index §4 row 1). **Both can be true** — instance §12 stays in accentos as supreme; the *pattern* may be lifted as a template. No contradiction.
- **No conflicts on:** worker, sql, js, index.html, sessionStorage keys, design tokens — all STAY in canonical, all treated as runtime by this branch.

### 4.4 Specific edits required to align
- ⚠️ Add `js/shell_v2/*.js` row to canonical `MODULE_OWNERSHIP_MAP.md` (Captain canonical edit). Until then, `ACCENTOS_PRODUCTION_ROLLOUT_STRATEGY.md` §5 should add a footnote: "*`js/shell_v2/*.js` is implicit STAY by precedent of `js/*.js`. Canonical row to be added by Captain.*"
- ⚠️ Add the module-key naming convention (per C12 / C-Δ-8) to canonical `MODULE_MODES.md` (Captain canonical edit). This branch should document the proposed convention in `ACCENTOS_GOVERNANCE_TERMINOLOGY.md` for handoff.
- ⚠️ Resolve **C-Δ-9** by adding a one-liner to `ACCENTOS_GOVERNANCE_INDEX.md` §4 acknowledging that `MASTER.md` §12 has dual lifecycle (instance supreme + pattern portable). Non-blocking.
- ❌ **Do not re-classify any STAY items.** This branch has authored zero artifacts that would lift; no ownership conflict exists.

---

## 5. Resolution of the 15 in-branch contradictions (from `ACCENTOS_GOVERNANCE_CONTRADICTIONS.md`)

| # | Contradiction | Status after canonical read |
|---|---|---|
| C1 | Rollout §0/§11 says canonical files "do not exist" | **Confirmed wrong.** They exist on `governance-snapshot-prep-k3dBs`. Hub correction required. |
| C2 | Freeze conditions in three places | **Reinforced.** Canonical STABILIZATION_PROTOCOL.md is restructure-scoped; this branch's freeze list is rollout-scoped. They are *different* lists, not duplicates. Recommend keeping both with explicit scope labels. |
| C3 | Risk register duplicated | **Reinforced.** Canonical R-01–R-12 are restructure-scoped; Appendix B is rollout-scoped. Reframe Appendix B as advisory rollout-specific. |
| C4 | "Veto" used at two granularities | Unaffected by canonical content. |
| C5 | Override authority asymmetry | Unaffected. |
| C6 | Score thresholds Phase mapping | Unaffected. |
| C7 | "Bake period" duration ambiguity | Unaffected. |
| C8 | `MASTER.md` §3 module list vs. `module_modes.json` | Canonical confirms `module_modes.json` ownership = STAY. **Implied resolution:** `module_modes.json` is authoritative for live state; `MASTER.md` §3 is advisory (already this branch's position). |
| C9 | `→ deprecated` authority | Unaffected. |
| C10 | Worker authority vs. emergency | **Reinforced** by canonical R-02. Canonical confirms wrangler is Captain-only and worker is scope-frozen until WIP closes. |
| C11 | "Snapshot" verb vs. noun | **Newly clarified.** Canonical `SYSTEM_STATE.md` uses "snapshot" for system state. This branch's `Freeze Snapshot` is a different artifact. Terminology should distinguish. |
| C12 | Module-key naming convention not in `MODULE_MODES.md` | **Reinforced.** Canonical `MODULE_MODES.md` is STAY; convention should be added there via Captain canonical edit. |
| C13 | Mobile readiness threshold mismatch | Unaffected. |
| C14 | Override storage authority during multi-device era | **Partially resolved by canonical scope.** `accentos_user_overrides` localStorage is STAY by precedent. The Supabase migration (M30) is an in-accentos change, not a restructure event. |
| C15 | Captain go logged "where" | Canonical STABILIZATION_PROTOCOL.md uses "explicit go" without specifying log. Recommend keeping SESSION_LOG.md as the location. |

**New contradictions discovered by canonical read:**
- **C-Δ-1** rollout risks vs. restructure risks coexist without cross-reference.
- **C-Δ-2** R-04 (index.html scope-out) needs explicit scope label.
- **C-Δ-3** R-02 (worker proxy) reinforced as shared block.
- **C-Δ-4** Phase 0–6 (this branch) vs. Phase 0–7 (canonical) numbering collision — **highest impact**.
- **C-Δ-5** R-01 (vibe-speak boot) is a session-startup concern affecting every Hub session.
- **C-Δ-6** Canonical Phase 4 (vibe-speak relocation) could pause shell-v2 rollout if it lands first.
- **C-Δ-7** `js/shell_v2/*.js` row missing from canonical map.
- **C-Δ-8** Module-key naming convention belongs in canonical `MODULE_MODES.md`.
- **C-Δ-9** `MASTER.md` §12 has dual lifecycle (instance + pattern).

---

## 6. Alignment edits required (consolidated, prioritized)

These are **proposed**. They are not applied here. They become the input for the next Hub session that adopts this branch.

### A — Highest priority (prevents future-session confusion)
1. **Disambiguate Phase numbering** (`ACCENTOS_PRODUCTION_ROLLOUT_STRATEGY.md` §3 header note) — addresses **C-Δ-4**.
2. **Drop "do not exist" framing** for canonical files (`ACCENTOS_PRODUCTION_ROLLOUT_STRATEGY.md` §0/§11) — addresses C1, names canonical branch.
3. **Add restructure-scope acknowledgment** to rollout strategy §0 — addresses **C-Δ-1**, **C-Δ-2**, **C-Δ-6**.

### B — Medium priority (clarifies authority and references)
4. **Reframe rollout strategy Appendix B** as "shell-v2 rollout risks (advisory)"; cite canonical `GOVERNANCE_RISKS.md` for restructure risks — addresses C3, **C-Δ-1**.
5. **Replace rollout strategy §12 freeze list** with a reference to `ACCENTOS_ROLLOUT_FREEZE_PROTOCOL.md` §1, and note that canonical `STABILIZATION_PROTOCOL.md` STOP CONDITIONS are restructure-scoped — addresses C2.
6. **Update `ACCENTOS_GOVERNANCE_INDEX.md` §6** consumption order to read canonical `STABILIZATION_PROTOCOL.md` *before* this branch's rollout strategy.

### C — Low priority (touch-ups)
7. **Cross-reference SYSTEM_STATE.md** in Freeze Snapshot §15.
8. **Note `js/shell_v2/*.js` STAY by precedent** in rollout strategy §5 (footnote).
9. **Distinguish "snapshot" usages** in `ACCENTOS_GOVERNANCE_TERMINOLOGY.md` — addresses C11.
10. **Add "bake period" / "re-score window"** distinction to Terminology — addresses C7.
11. **Add `→ deprecated` authority row** to Escalation Matrix §1 — addresses C9.

### D — Captain canonical edits (cannot be done by Hub or Spoke)
12. **Add `js/shell_v2/*.js` row** to canonical `MODULE_OWNERSHIP_MAP.md` — addresses **C-Δ-7**.
13. **Add module-key naming convention** to canonical `MODULE_MODES.md` — addresses C12 / **C-Δ-8**.

---

## 7. Phase-0 readiness verdict

**BLOCKED** — but with much clearer blockers than before this audit.

Three blockers, in order:

1. **Canonical R-02 (worker proxy redeploy) — UNMITIGATED.** Canonical and this branch agree this is the single shared hard block. Michael action required (`wrangler deploy` from local).
2. **Phase numbering collision (C-Δ-4) — must be resolved before any Hub session executes either Phase 1.** A future session running canonical Phase 1 (pre-restructure hardening) and this branch's Phase 1 (shell-v2 beachhead) in the same window would have semantically identical commit subjects ("Phase 1 begins") meaning different things.
3. **Canonical Phase 1 (pre-restructure hardening) has standing precedence** per its STOP CONDITIONS and Authorization Gate. This branch's Phase 1 (shell-v2 beachhead) cannot run while canonical Phase 1 is in progress without Captain explicit ordering.

Phase 0 readiness goes from BLOCKED → CLEAR when:
- ✅ R-02 worker-proxy WIP closed.
- ✅ Phase numbering disambiguation landed (alignment edit A.1).
- ✅ Captain explicit ordering: "shell-v2 Phase 1 may begin" (independent of, or after, canonical restructure phase status).

---

## 8. What this delta does NOT change

- ❌ No canonical file edited.
- ❌ No spoke planning doc edited.
- ❌ No `module_modes.json` change.
- ❌ No production touched.
- ❌ No new governance subsystem invented.
- ❌ The 15 pre-existing contradictions remain catalogued in `ACCENTOS_GOVERNANCE_CONTRADICTIONS.md`; this delta annotates which canonical content affects them.

---

## 9. Recommendation

This branch is **ready for primary-session adoption merge to `main`** *as a planning artifact set*, contingent on:
- The next Hub session running the alignment edits in §6 (A and B priority) **before** any rollout-execution work.
- Captain awareness that canonical and rollout governance describe **different scopes** that must coexist without merging.

This branch is **not yet ready** for shell-v2 rollout execution — Phase 0 verdict above.

---

*End of ACCENTOS_CANONICAL_DELTA.md — read-only reconciliation. Identification, not edits.*
