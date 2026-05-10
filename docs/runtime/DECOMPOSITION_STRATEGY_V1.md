# DECOMPOSITION_STRATEGY_V1

> Safest ordering, dependency-aware sequencing, and rollback-safe staging for decomposing the AccentOS shell.
> Analysis only — no implementation, no mutation. Builds on `REPO_TOPOLOGY_MAP.md`,
> `FROZEN_FILE_PRESSURE_ANALYSIS.md`, `SAFE_MUTATION_ZONES.md`.
> Snapshot date: 2026-05-10.

---

## 0. ONE-PAGE THESIS

The shell (`index.html`, 7,169 LOC / ~735 KB, ~81 % of declared 900 KB cap) is the binding constraint. Every other "frozen" file is frozen because it is *done*; the shell is frozen because it is *risky to keep touching at this size*. Decomposition therefore is not an optional refactor — it is the load-bearing engineering work that lets every other build track keep moving.

But: *all the conventional decomposition starting points are wrong*. The ones that look natural (auth extraction, sbFetch extraction, sidebar extraction) are the highest blast-radius surfaces in the repo and must be done **last**. The shell must be drained from the outside in, not from the auth core out.

This doc gives the order, the dependency rules, the rollback plan, and the explicit classification of each candidate as **extract-first / defer / dangerous-to-split / governance-gated / runtime-gated**.

---

## 1. DECOMPOSITION PRINCIPLES

Six rules drive the ordering:

### Principle 1 — Drain visual mass before behavioral mass
CSS, HTML templates, and inert markup contribute LOC but no runtime risk. Extract them first. They free up shell tokens for *the act of* further decomposition. (Observation: the shell is now large enough that decomposing it costs context budget — see `FROZEN_FILE_PRESSURE_ANALYSIS.md` §5. Extracting visual mass *first* makes every later stage cheaper.)

### Principle 2 — One concept per stage
A stage extracts exactly one concern. Mixing "extract auth + reorganize sidebar + change `?v=` strategy" in one PR is the failure mode; each combination raises blast radius super-linearly.

### Principle 3 — No two stages share a `git revert` interaction
A stage must be revertible with a single `git revert` without leaving the runtime in a state where Stage N+1 has to be partially re-done. This kills certain orderings — e.g. you cannot extract auth before extracting `sbFetch`, because reverting the sbFetch extraction would leave auth-as-extracted depending on a global that is now back inside the shell.

### Principle 4 — Reduce coupling fan-out before extracting fanned-out surfaces
The 1→N coupling surfaces (sbFetch is 1→22 modules; `CU` is 1→~30 audit-aware paths) cannot be cleanly extracted while still 1→N. They must first be wrapped in something that survives extraction (a thin module-level adapter, a registration step, or an IIFE around the extracted file) — see `FUTURE_LOADER_BOUNDARIES.md` for the concept side. Until then, *do not extract*.

### Principle 5 — Governance state precedes physical decomposition for any zone with three sources of truth
The sidebar `data-roles` ⟷ `module_modes.json` ⟷ resolver illusion (TOPOLOGY §6.2) must be collapsed *before* the sidebar HTML moves out of the shell. Otherwise the move just relocates the illusion without removing it.

### Principle 6 — Production-critical surfaces are extracted last, not first
Auth, `sbFetch`, RLS-touching code, anthropic-proxy contract — these all stay in their current location until every neighbor has been removed *around* them, leaving them as the obvious self-contained core that can be lifted with minimal context. **Extracting auth first is the single most dangerous decomposition mistake available** in this repo. (See §11.)

---

## 2. DEPENDENCY GRAPH OF EXTRACTION CANDIDATES

```
                        ┌──────────────────────────────┐
                        │  index.html (shell, 735 KB)  │
                        └──────────────┬───────────────┘
                                       │
        ┌──────────────────────────────┼─────────────────────────────────┐
        │                              │                                 │
        ▼ (visual)                     ▼ (utility)                       ▼ (HTML mass)
   inline <style> blocks          toast/openModal/$/qsa/         vendor-view templates
   (3 of them)                    esc/csvDownload/v               (~3663–4700)
        │                              │                                 │
        │ INDEPENDENT                  │ DEPENDS ON nothing else         │ DEPENDS ON
        │ (no JS path touched)         │ being extracted                 │ shell-scoped
        ▼                              ▼                                 ▼ render entrypoint
   STAGE 1                        STAGE 2                           STAGE 4
   (CSS extract)                  (shell utils extract)             (vendor view extract)


    sidebar <a data-roles> HTML         module_modes.json governance collapse
            │                                    │
            └────────────► REQUIRES collapsing 3-source illusion FIRST
                            (governance-gated)
                                                 │
                                                 ▼
                                            STAGE 6


   internal_meetings.js (2,436 LOC)
            │
            │ INDEPENDENT of every shell stage
            │ (does not touch shell HTML or auth)
            ▼
   STAGE A (parallel track) — sub-file split inside the module


   Cache-bust ?v= automation
            │
            │ DEPENDS ON nothing; can be done in any stage
            │ but is governance-gated by deploy-time tooling decision
            ▼
   STAGE H (housekeeping)


   patch_quote.js relocation
            │
            ▼
   STAGE H (housekeeping)


   ─────────── PRODUCTION-CRITICAL CORE (extract LAST) ──────────────

   Quick-Actions FAB markup (mostly mirrored in js/quick_actions.js) → STAGE 5
   Auth block (lines ≈528–720)                                      → STAGE 7
   sbFetch + Supabase REST surface                                  → DEFER
   sidebar wired to module_modes.json (Principle 5 prerequisite)    → STAGE 6
   Design tokens (currently inside shell <style>)                   → carried by STAGE 1
```

The above is the *only* valid topological ordering. Stages 1–4 are mutually independent and could in principle be parallel; stages 5–7 form a strict chain because each depends on the previous having drained shell mass without breaking the implicit dependency graph at `index.html:7131-7167`.

---

## 3. STAGE-BY-STAGE EXTRACTION PLAN

Each stage is described with: **what extracts**, **rollback cost**, **blast radius**, **prerequisites**, **classification**.

### STAGE 1 — Inline `<style>` → `css/aos.css`
| Field | Value |
|---|---|
| Extracts | All three `<style>` blocks in `index.html`; design-system CSS variables (`--bg`, `--accent`, font tokens). |
| Rollback | Single `git revert`. CSS path replaced by inline blocks; zero JS path involved. |
| Blast radius | Visual only. No functional regression possible. Worst case: cache-busted CSS not delivered → unstyled flash on first hit. |
| Prerequisites | None. |
| Classification | **EXTRACT-FIRST.** |

### STAGE 2 — Shell utility helpers → `js/shell_utils.js`
| Field | Value |
|---|---|
| Extracts | `toast`, `openModal`, `$`, `qsa`, `esc`, `csvDownload`, `csvStringify`, `v`, FAB toggles. |
| Rollback | Single `git revert`. Helpers were globals before extraction and globals after — no call-site changes. |
| Blast radius | Wide name surface (every interactive feedback, every CSV export, every modal) but each function is small and pure-ish. Any single regression is a localized symptom. |
| Prerequisites | The script tag for `js/shell_utils.js` must load **before** any consumer. Practically: insert it as the first entry in the script-tag manifest at `index.html:7131`. |
| Classification | **EXTRACT-FIRST.** |

### STAGE 3 — Quote-print HTML template → `js/quote_print.js`
| Field | Value |
|---|---|
| Extracts | The `w.document.write` template at line ~5887 (Quote print/PDF flow). |
| Rollback | Single `git revert`. |
| Blast radius | One feature path (Quote → Print). Visible only at use time. |
| Prerequisites | None. |
| Classification | **EXTRACT-FIRST** (low yield but free). |

### STAGE 4 — Vendor view templates → `js/vendors.js`
| Field | Value |
|---|---|
| Extracts | ~1,000 LOC of vendor overview / rep info / sales chart / breakdowns / scoring tables HTML (lines ~3663–4700). |
| Rollback | Single `git revert`, but the page must be rendered into an empty `<div id="page-vendors">` anchor that remains in the shell. Anchor must not be removed by the same patch — keep anchor in shell across all stages. |
| Blast radius | Vendor Intelligence module dark if regressed. This is the *original 0.1 split's spirit* finally being honored. |
| Prerequisites | Vendor module must already have a render entrypoint. (It does — `js/` has vendor-related logic; verification required before extraction, but no new code is needed.) |
| Classification | **EXTRACT-FIRST.** |

### STAGE 5 — Quick-Actions FAB markup
| Field | Value |
|---|---|
| Extracts | FAB HTML + handlers; reconcile with existing `js/quick_actions.js`. |
| Rollback | Single `git revert`. |
| Blast radius | One UI affordance. |
| Prerequisites | Audit `js/quick_actions.js` for duplication; ensure no double-binding when FAB markup is emitted from JS rather than embedded in shell. |
| Classification | **EXTRACT-FIRST**, but secondary to 1–4. |

### STAGE 6 — Sidebar `<a data-roles>` ⇒ generated from `module_modes.json`
| Field | Value |
|---|---|
| Extracts | All sidebar nav HTML; replaces with a render call into a `<nav>` anchor that consumes `module_modes.json`. |
| Rollback | **NOT a single `git revert`.** Reverting requires also re-aligning the resolver if it was changed. Treat as two-step: (a) generator added in parallel to existing HTML and feature-flagged off, (b) HTML removed once generator is verified. |
| Blast radius | Role visibility — the highest non-auth security surface. Mistakes here cause **role leak**. |
| Prerequisites | The 3-source-of-truth illusion (TOPOLOGY §6.2) must be reduced to 2 first by ensuring `module_modes.json` `mode` and the corresponding `data-roles` are reconciled (governance-only prep step — produce a checked manifest, no code change). |
| Classification | **GOVERNANCE-GATED.** Cannot be done without first ratifying the module-mode → role-visibility resolution rule in `MODULE_MODES.md`. |

### STAGE 7 — Auth block → `js/auth.js`
| Field | Value |
|---|---|
| Extracts | Lines ~528–720: `sbAuthFetch`, `sbFetchProfile`, `sbAuditLog`, `applyRoleVisibility`, `doLogin`, `tryRestoreSession`, `activateApp`, `hydrateFromSupabase`, `doLogout`, `CU` declaration. |
| Rollback | Single `git revert`, but **only if** Stages 1–6 are already in place. If reverted while Stage 6 is shipped, sidebar generator may try to consult `applyRoleVisibility` that is no longer extracted — depending on staging this can dark the app. |
| Blast radius | Maximum. App-wide login/session/auth path. Any regression here = app dark. |
| Prerequisites | Stages 1, 2, 6 complete; `sbFetch` still in shell (auth depends on it). |
| Classification | **DANGEROUS-TO-SPLIT** until prerequisites land. Becomes EXTRACT-LAST after. |

### STAGE 8 — `sbFetch` + Supabase REST surface
| Field | Value |
|---|---|
| Extracts | The single function `sbFetch`, plus `sbConfigured`, `sbKey` helpers, `aos-sb-key` sessionStorage handling. |
| Rollback | Catastrophic if attempted in isolation — see Principle 4. 22 modules call this directly with no abstraction. |
| Blast radius | Maximum. Every Supabase-touching feature in the app. |
| Prerequisites | Either (a) wrap call sites with an adapter that survives extraction unchanged, or (b) accept `sbFetch` as the obvious self-contained core that stays in shell forever. |
| Classification | **DEFER.** Re-classify after enough other mass has been drained that the remaining shell is *just* this surface plus auth. At that point shell is no longer pressure-bound and extraction yield is mostly cosmetic. |

### STAGE A (parallel track) — `internal_meetings.js` sub-split
| Field | Value |
|---|---|
| Extracts | Six sub-features (Platform Review, Agenda Builder, Notes, To-Dos, Follow-Ups, Transcripts) into `im_prep.js`, `im_agenda.js`, `im_notes.js`, `im_todos.js`, `im_followups.js`, `im_transcripts.js`; shared `IM_*` state into `im_state.js`. |
| Rollback | Single `git revert`. |
| Blast radius | One module. Internal-meetings page only. |
| Prerequisites | None. Independent of every shell stage. |
| Classification | **EXTRACT-FIRST** within the parallel track. |

### STAGE H (housekeeping, can run any time)
| Field | Value |
|---|---|
| Extracts | (a) Decide `patch_quote.js` fate (run-once-and-delete, or relocate to `patches/`). (b) Decide `?v=` cache-bust automation (deploy-time hash injector, or accept and document). |
| Rollback | Trivial. |
| Blast radius | Negligible. |
| Prerequisites | None. |
| Classification | **EXTRACT-FIRST** for (a); **GOVERNANCE-GATED** for (b) (decision affects every module commit). |

---

## 4. CLASSIFICATION TABLE

| Candidate | Class | Why |
|---|---|---|
| Inline `<style>` → `css/aos.css` | EXTRACT-FIRST | Visual mass; zero JS path |
| Shell utility helpers | EXTRACT-FIRST | Globals stay globals; pre-position script tag |
| Quote-print template | EXTRACT-FIRST | One feature, free |
| Vendor view HTML | EXTRACT-FIRST | Largest pure-HTML mass; honors 0.1 split spirit |
| Quick-Actions FAB | EXTRACT-FIRST (secondary) | Reconcile with existing module |
| `internal_meetings.js` sub-split | EXTRACT-FIRST (parallel) | Module-internal only |
| `patch_quote.js` housekeeping | EXTRACT-FIRST | Trivial |
| Sidebar `<a data-roles>` | GOVERNANCE-GATED | Requires module-mode resolution rule first |
| Cache-bust automation | GOVERNANCE-GATED | Affects every commit's discipline |
| Auth block | DANGEROUS-TO-SPLIT (until 1, 2, 6 land) → then EXTRACT-LAST | Maximum blast radius |
| `sbFetch` REST surface | DEFER | Cannot extract cleanly while 1→22; may stay in shell forever |
| Anthropic worker | RUNTIME-GATED | Ties to deployed Cloudflare Worker name; no in-repo refactor possible without redeploy |
| Already-applied SQL `M01..M40` | DEFER permanently | Append-only by discipline; "extracted" already by being separate files |
| Design tokens | EXTRACT-FIRST (carried by Stage 1) | Move with the CSS |
| `MASTER.md` §3/§4 staleness | GOVERNANCE-GATED | Doc update needed before further structural narrative claims |

---

## 5. ROLLBACK-SAFE STAGE SCHEDULE

The full sequence, written as an executable schedule (still no mutation in this task — this is the *plan* the next session would execute):

```
T0  STAGE H(a)  — patch_quote.js: run once and delete (or move to patches/)
                  Rollback: trivial.

T1  STAGE 1     — Extract inline <style> blocks → css/aos.css
                  Rollback: single git revert. Largest LOC drop.

T2  STAGE 2     — Extract shell utilities → js/shell_utils.js
                  Rollback: single git revert. Insert script tag at top of manifest.

T3  STAGE 3     — Extract quote-print template → js/quote_print.js
                  Rollback: single git revert. Free.

T4  STAGE 4     — Extract vendor view HTML → loaded via js/vendors.js
                  Rollback: single git revert. Keeps page-vendors anchor in shell.

T4'  STAGE A    — (parallel track, no shell touch) Split internal_meetings.js
                  Rollback: single git revert.

T5  STAGE 5     — Extract Quick-Actions FAB markup
                  Rollback: single git revert.

— GOVERNANCE GATE —
T6 prep         — In MODULE_MODES.md / module_modes.json, ratify:
                  "data-roles is derived from mode + role-defaults" (no code change).

T7  STAGE 6     — Generate sidebar from module_modes.json (replaces <a data-roles>).
                  Two-step: (a) ship generator behind feature flag, (b) remove HTML
                  once verified. Rollback at (a) is a single git revert.

— GOVERNANCE GATE —
T8 prep         — Decide ?v= automation strategy. Update MASTER.md §12 accordingly.

T9  STAGE H(b)  — Implement cache-bust automation (or formalize manual rule).

— PRODUCTION-CRITICAL FROM HERE —
T10 STAGE 7     — Extract auth block → js/auth.js. Only after T1–T7 complete.
                  Rollback: single git revert IF T1–T6 still in place.

T11 STAGE 8     — DEFER decision: extract sbFetch or accept as shell core.
                  Likely answer: leave it. The shell at this point is small enough
                  that further extraction yield is cosmetic.
```

Each stage is a **single PR / single commit**. Stages 1–5 and A may be reordered relative to each other; Stages 6–11 are strictly sequential.

---

## 6. DEPENDENCY-AWARE SEQUENCING RULES

Five hard rules:

1. **Script-tag placement rule.** Whenever a new file is added to the manifest at `index.html:7131-7167`, it must be inserted *before* every consumer. Practical heuristic: utility-class files at the top, page-class files below, last-touched files at the bottom.
2. **Governance-before-physical rule.** Stages 6, 7, 9 require a **doc-only commit** ratifying the change first. This is a single-line update to `MASTER.md` or `MODULE_MODES.md`.
3. **No-mass-rewrite rule** (`MASTER.md` §12.2). Every stage is a surgical extraction, not a rewrite. The extracted file is *byte-for-byte* the same code, just relocated and re-script-tagged.
4. **Cache-bust rule.** Every stage that touches `index.html` requires a `?v=` bump on the next-committed module. This is honored even when the touch is "remove a `<style>` block" — Stage 1 still touches the shell.
5. **Two-step extraction for governance-gated stages.** Stage 6 (sidebar) and Stage 7 (auth) must ship the new file behind a feature-flag-equivalent mechanism (an `if (location.search.includes('next=1')) { …new path… } else { …existing… }` toggle, or simply a parallel render that runs alongside the old) before the old code is removed. This guarantees rollback within one commit at every cut-over.

---

## 7. COUPLING-REDUCTION STRATEGY

The shell exposes ~12 globals that are read by ~38 modules. Decomposition must reduce that fan-out without changing call sites (hard requirement: `MASTER.md` §12.2).

The strategy is **wrap, don't rename**:

| Coupling surface | Strategy | Effect on call sites |
|---|---|---|
| `sbFetch` | Keep in shell; never rename. Treat as the public API. | Zero call-site change. |
| `CU` | Same. The `let CU` declaration moves into `js/auth.js` in Stage 7, but the global binding is preserved. | Zero. |
| `toast`, `openModal`, `$`, `qsa`, `esc`, `v`, `csv*` | Move into `js/shell_utils.js` Stage 2, still attached to `window.*`. | Zero. |
| `applyRoleVisibility` | Moves into `js/auth.js` Stage 7. | Zero. |
| `MODULE_MODES` global | Already in `js/module_modes.js`. No change. | Zero. |
| Design tokens | Move into `css/aos.css` Stage 1. | Zero. |

**Net effect**: after Stages 1–7, the *physical location* of every coupling surface has moved, but the *logical surface* (the set of globals on `window`) is unchanged. This is intentional. Reducing the number of globals is a Phase 2 concern; Phase 1 is purely de-massification of the shell. **Do not combine them.**

---

## 8. FROZEN-FILE PRESSURE REDUCTION PATH

`FROZEN_FILE_PRESSURE_ANALYSIS.md` quantifies the shell at ~735 KB / 7,169 LOC. Estimated LOC drops per stage (order-of-magnitude only):

| Stage | Estimated LOC removed from shell |
|---|---|
| Stage 1 (CSS) | ~1,500–2,000 |
| Stage 2 (utils) | ~150–250 |
| Stage 3 (quote print) | ~30–60 |
| Stage 4 (vendor views) | ~1,000 |
| Stage 5 (FAB) | ~50 |
| Stage 6 (sidebar) | ~150–300 |
| Stage 7 (auth) | ~200–250 |
| **Cumulative** | **~3,000–4,000 LOC** (≈ 50 % of current shell) |

Post-decomposition target: shell at ~3,000–4,000 LOC, **comfortably below the 900 KB hard cap** with every line being either (a) the bootstrap script that loads modules, (b) the sbFetch surface, or (c) the explicit script-tag manifest. The shell becomes *small enough that surgical patching no longer compounds*.

---

## 9. BLAST-RADIUS MINIMIZATION LOGIC

Three rules to ensure no single mistake takes down production:

1. **Visible bisectability.** Each stage is one commit on a feature branch named `decomp/stage-N-<name>`. A bad deploy is bisected by reverting the most recent stage commit, not by trying to surgically undo within one giant PR.
2. **Idempotent extraction.** The new file (e.g. `js/shell_utils.js`) declares the same globals the shell did. If the script tag fails to load, the shell-side definitions are gone but the symbol space is the same — the failure is *visible* (modal/toast not working) rather than *silent* (wrong-data).
3. **Verify-before-remove.** For Stages 6 and 7, the new path is shipped *alongside* the old (parallel render or feature flag) and verified for one full session before the old HTML/JS is removed in a separate commit. This cuts the worst-case rollback window from "diagnose & revert prod" to "remove the new path's load tag."

---

## 10. EXTRACT-FIRST / DEFER / DANGEROUS / GOVERNANCE / RUNTIME — FULL CLASSIFICATION

| Class | Members | Notes |
|---|---|---|
| **EXTRACT-FIRST** | Stage 1 (CSS), Stage 2 (utils), Stage 3 (quote print), Stage 4 (vendor views), Stage 5 (FAB), Stage A (internal_meetings split), Stage H(a) (`patch_quote.js` housekeeping) | All independent or near-independent; none of them touches a production-critical surface; all single-revert rollback |
| **DEFER** | Stage 8 (`sbFetch` REST surface), already-applied SQL `M01..M40`, anthropic-proxy worker, `sbFetch` rename | After Stage 7, shell is small enough that further extraction yield is cosmetic; cost > benefit |
| **DANGEROUS-TO-SPLIT** | Stage 7 (auth) until Stages 1–6 land; any combined "extract auth + sidebar + sbFetch" PR; any rewrite-from-scratch of the shell | Rule of thumb: if a stage's prerequisites are not met, it is dangerous-to-split *today*. The classification is dynamic. |
| **GOVERNANCE-GATED** | Stage 6 (sidebar), Stage H(b) (cache-bust automation), `MASTER.md` §3/§4 staleness fix, ratifying the module-mode → role-visibility rule | Each requires a doc-only commit to land before the code change |
| **RUNTIME-GATED** | Anthropic-proxy worker rename / re-org (tied to Cloudflare Worker name in `wrangler.toml`); any change to applied SQL migrations (tied to live Supabase state); any change to RLS policies | Cannot be undone with a `git revert` alone — runtime state must also be reconciled |

---

## 11. THE SINGLE MOST DANGEROUS DECOMPOSITION MISTAKE

**Extracting the auth block first.**

Auth looks like the most cohesive block in the shell — ~200 LOC, all related, single concern, easy to spot. The intuitive instinct is to lift it into `js/auth.js` first because "it's the cleanest thing to extract."

Why this is wrong, in order:
1. Auth depends on `sbFetch` (still in shell), `applyRoleVisibility` (calls itself), `CU` (its own declaration), `toast` (utility), `openModal` (utility), and the sidebar `data-roles` HTML.
2. Extracting auth before extracting utilities means `js/auth.js` reads globals that are only sometimes loaded depending on script-tag order — silent breakage.
3. Extracting auth before collapsing the sidebar 3-source-of-truth means a subsequent sidebar generator (Stage 6) has to coordinate with both the shell-side sidebar HTML *and* the just-extracted auth. Double cost, double risk.
4. Auth has the highest blast radius in the repo (catastrophic). It is the *last thing* you want to be working on while you are still discovering what the shell silently depends on.
5. Once everything else is drained, auth becomes the *obvious* thing to extract because nothing else is in its way. **Decomposing the shell makes auth extraction trivial. Doing it first makes everything else harder.**

A very close second is **extracting `sbFetch` while it is still 1→22**. Same shape: looks cohesive from outside, would require refactoring 22 call sites that the protocol forbids touching in a single patch (`MASTER.md` §12.2), and offers low yield because `sbFetch` is small.

---

## 12. THE EARLIEST SAFE ENFORCEMENT BOUNDARY

The earliest place a real, **enforced** boundary can be placed is **between the shell and `js/shell_utils.js` after Stage 2**.

That boundary is enforced by a single rule, codified in `MODULE_MODES.md` or `MASTER.md` §12: *"The set of `window.*` symbols defined by `js/shell_utils.js` is the public utility surface. No other file may add to it; modules must consume from it."*

Concretely:
- Before Stage 2, every module is free to redefine `toast`, `openModal`, `$`, etc. (and would silently break if they collided). There is no enforcement, only convention.
- After Stage 2, the rule says: *one file owns these names*. A grep-based check in `scripts/` (`grep -nE 'function (toast|openModal|csvDownload)\b' js/`) becomes a meaningful precommit — finding a hit anywhere outside `js/shell_utils.js` is a violation.
- This is the first place where the discipline (`MASTER.md`'s "Module Isolation" claim) becomes machine-checkable. **Before this boundary exists, modularity is a story; after it exists, modularity has a substrate**, however minimal.

**The earliest safe enforcement boundary is "shell utilities are owned by one file, period."** Everything else can be staged on top.

---

## 13. THE MINIMUM VIABLE ARCHITECTURE SHIFT

Before the repo can scale further (more modules, more sub-features, more roles), one architectural shift must land. It is **not** a loader, **not** a build step, **not** a framework. It is:

> **A single explicit registration step, invoked by every module on script-tag load, that names the module and lists which `window.*` globals it provides and which it consumes.**

Conceptually (this is described in detail in `FUTURE_LOADER_BOUNDARIES.md` — this doc is the strategy, not the design):

- A small registry function in shell utils, e.g. `aosRegister({name, provides, consumes})`.
- Every module's first line calls it.
- Registry checks for collisions (`provides` overlap), missing dependencies (a `consumes` name not yet provided), and load-order surprises (a module providing a name another already consumed).
- On collision, registry warns to console, *does not throw* — it observes drift, doesn't enforce a stop, so existing modules are not blocked.
- Registry exposes its current state (`window.AOS_REGISTRY`) for debugging.

That single shift converts the silent N×N coupling matrix into an *observable* graph. Until that exists, scaling beyond the current 38 modules makes the modularity illusion (see `MODULARITY_ILLUSION_ANALYSIS.md`) progressively more expensive.

The shift is itself a one-file addition (in `js/shell_utils.js`, owned by Stage 2). It is **the smallest possible enforcement substrate** and is the prerequisite for every subsequent boundary claim.

---

## 14. SUMMARY

| Question | Answer |
|---|---|
| Safest decomposition order | Stage 1 (CSS) → 2 (utils) → 3 (quote print) → 4 (vendor views) → 5 (FAB) and Stage A (internal_meetings split) in parallel → Stage 6 (sidebar) → Stage 7 (auth) → DEFER `sbFetch` |
| Single most dangerous mistake | Extracting auth first |
| Earliest safe enforcement boundary | After Stage 2: "shell utilities owned by one file, period" |
| Minimum viable architecture shift | A single `aosRegister({name, provides, consumes})` call site invoked by every module — observation-only, non-blocking, owned by Stage 2 |
| Frozen-file pressure reduction projected | Cumulative ~3,000–4,000 LOC removed from shell across Stages 1–7 (~50 % drop) |
| Coupling reduction strategy | Wrap, don't rename. Move physical location; keep logical surface unchanged. Rename is Phase 2. |
| Rollback-safe property | Each stage is one commit, one revert. Stages 6 & 7 ship behind a feature flag and remove old code in a separate follow-up commit. |
| Production-critical surfaces | Stay in shell or move last (auth Stage 7; sbFetch DEFER; RLS / worker / applied SQL never touched here) |

---

*See `MODULARITY_ILLUSION_ANALYSIS.md` for why the current "modular" surface is not yet structural, and `FUTURE_LOADER_BOUNDARIES.md` for the conceptual shape of the registration substrate referenced in §13.*
