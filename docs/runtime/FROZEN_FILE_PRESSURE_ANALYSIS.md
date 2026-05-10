# FROZEN_FILE_PRESSURE_ANALYSIS

> Pressure analysis of the frozen-class files in AccentOS, with primary focus on `index.html`.
> Analysis only — no implementation, no mutation. Companion to `REPO_TOPOLOGY_MAP.md`.
> Snapshot date: 2026-05-10.

---

## 0. EXECUTIVE READ

`index.html` is the single highest-pressure file in the repository on every axis we measured: size, mutation cadence, hidden coupling, patch fragility, and merge surface. It currently sits at **735 KB / 7,169 LOC, ~76 % of the 900 KB hard split-trigger declared in `MASTER.md` §3**, and it gains lines on most build sessions because adding any module requires touching it in three places (script tag, sidebar `<a data-roles>`, sometimes shell helper). Every other "frozen" file (worker, applied SQL migrations, design tokens) is genuinely cold — they are frozen by *contract*, not by *pressure*. `index.html` is frozen by user directive **and** under continuous structural strain. Decompose the shell first, in the order in §8.

A secondary pressure target is `internal_meetings.js` at 2,436 LOC / 120 KB — already 4× the median module size and structurally shell-shaped (six sub-features sharing one state namespace).

---

## 1. INVENTORY OF FROZEN-CLASS FILES

| File / Set | LOC | Size | Frozen by | Pressure rank |
|---|---|---|---|---|
| `index.html` | 7,169 | ~735 KB | User directive (this task) · production criticality · hard-cap proximity | **#1** |
| `js/internal_meetings.js` | 2,436 | 120 KB | Not frozen — but structurally shell-class | **#2** |
| `worker/anthropic-proxy.js` + `wrangler.toml` | 54 | ~1.4 KB | User directive · stable contract | #5 (nearly zero pressure) |
| `sql/M01..M40` (already applied) | 1,848 | 71 KB | Append-only migration discipline · Supabase MCP broken | #4 |
| Design system constants (CSS vars in `index.html` `<style>`) | inside #1 | inside #1 | "LOCKED — never changes" (`MASTER.md` §4) | #3 (constants under #1's pressure) |
| `module_modes.json` `live`-state entries | ≈30 of 45 entries | inside 63 LOC | Demoting a `live` module is high-blast | #6 |

The remainder of this document is about #1 and #2.

---

## 2. `index.html` — WHY IT KEEPS GROWING

### 2.1 Lines that should not be in a shell, but are
- **Inline `<style>` blocks** (3 of them, including the design system, layout, sidebar, table styles, vendor-page styles, modal/toast).
- **Vendor-page templates** (≈ lines 3663–4700) — fully-formed HTML for the Vendor Intelligence module's overview / rep info / sales chart / breakdowns / scoring tables.
- **Auth flow JS** (lines ≈528–720) — `sbAuthFetch`, `sbFetchProfile`, `sbAuditLog`, `applyRoleVisibility`, `doLogin`, `tryRestoreSession`, `activateApp`, `hydrateFromSupabase`, `doLogout`.
- **Shared utility JS** — `toast`, `openModal`, `csvStringify`, `csvDownload`, `esc`, `$`, `qsa`, `v`, FAB (`toggleQA`, `qaGo`).
- **Sidebar `<a data-roles>` HTML** for every module — duplicating data already in `module_modes.json`.
- **Quote-print HTML template** (line ≈5887) for the print-as-PDF flow.
- **Vendor side-panel + feedback panel + modal frame**.
- **Quick-Actions FAB markup**.
- **The 38-line `<script>` manifest** at the bottom — itself the script-tag dependency graph.

### 2.2 Why each module addition adds shell lines
Per `MASTER.md` §12.2 ("Never rewrite from scratch — always surgical `str_replace` patches"), every module addition is delivered as a single Claude-Code prompt that must:
1. Add `<script src="js/<new>.js?v=…">` near line 7167.
2. Add a sidebar `<a data-roles="…">` row.
3. Sometimes add an empty `<div id="page-<new>">` page anchor.
4. Sometimes wire a `goTo('<new>')` quick-action.
5. Bump the `?v=` cache-bust string of any other touched module's tag.

That is **3–5 surgical insertions per module** into a single file already at 76 % of cap. The cost compounds.

### 2.3 Visible growth signal
- `MASTER.md` (last edited 2026-05-04) records `index.html ~651 KB JS / ~680 KB total HTML, 76 % used`.
- File system today (2026-05-10): `index.html` is 735 KB → it has continued to grow ~55 KB in six days while the doc still says 680 KB and 76 %. **Pressure is accelerating** and the documented number is already stale.

---

## 3. HIDDEN COUPLING RISK

The shell does not just hold lines — it holds the **entire global namespace** that 38 modules silently depend on. Concretely:

| Coupling | Provider line in shell | Consumer count | If renamed/removed |
|---|---|---|---|
| `sbFetch` | inline JS (≈ line 545+) | 22 modules call it directly | App-wide REST failure |
| `CU` | line 529 (`let CU = null`) | every audit-aware path | Auth identity null in N modules |
| `applyRoleVisibility` | line 588 | sidebar gating | Wrong roles see wrong items |
| `toast` | line 792 | every interactive feedback | UI silent failures |
| `openModal` | line 815 | every detail/edit dialog | All modals dark |
| `csvDownload`, `csvStringify` | lines 775, 781 | 12+ export flows | Exports broken |
| `$`, `qsa`, `esc`, `v` | lines 771–773 | 38 modules | Mass parse/render breakage |
| `goTo` (wrapped) | shell + `module_modes.js` | every nav action | Cross-module navigation breaks |
| `MODULE_MODES` global | populated by `js/module_modes.js`, read by shell | sidebar visibility | Visibility resolver inert |
| Design tokens (CSS vars) | inline `<style>` | every visual element | Whole UI drifts |

This means **a precise edit to one shell line can break dozens of modules in invisible ways**, and there is no static check (no TS, no lint with global rules, no test suite) to catch it. Shell hidden-coupling risk is the dominant risk in the repo.

---

## 4. PATCH FRAGILITY

The build protocol mandates `str_replace`-style surgical patches. Two effects:

### 4.1 `old_string` uniqueness pressure
At 7,169 LOC with massive repetition of common substrings (`<script>`, `<div class="card">`, `data-roles=`, `onclick=`, `${`), unique `old_string` selection requires longer and longer context windows. Each new patch costs more model tokens to identify a unique anchor and is more likely to collide with an unintended match.

### 4.2 Tag-balance drift
`BUILD_INTELLIGENCE.md` already records two patch-fragility incidents:
- **2.1 Parent UI** — orphan `</label>` from a partial sibling-tag patch, "Recovered by adding a hidden dummy `<label>` for balance — works but ugly."
- **0.2.B Settings Users panel** — dangling reference to a removed `USERS{}` global that would have thrown `ReferenceError` in production.
Both rooted in the file being too large for a human or model to hold the surrounding tag context cleanly.

### 4.3 Inline-handler `${...}` rule
`MASTER.md` §4 (Code Patterns): "All `onclick` handlers must wrap dynamic values in `${...}` template literals to prevent null-id bugs." This rule exists *because* shell HTML mixes JS-templating with raw HTML — i.e., it is a workaround for a pressure pattern caused by the shell being templated in-place rather than rendered from data. Each new inline handler is one more place this discipline can slip.

---

## 5. TOKEN PRESSURE

Reading `index.html` end-to-end is a non-trivial fraction of a session's context budget. Practical implications:

- A model attempting a "look at the whole shell before patching" workflow consumes a meaningful slice of context just on the shell, leaving less for governance docs, the target module, the relevant SQL, and the working response.
- Sessions that need to read the shell *and* `BUILD_INTELLIGENCE.md` (~49 KB and growing) *and* `MASTER.md` (~43 KB) plus the active module begin to bump against context limits. The auto-execute startup chain in `.claude/CLAUDE.md` already prescribes reading several governance docs at boot, multiplying this cost.
- Mobile/iPhone sessions handing off Claude Code blocks cannot copy-paste a shell rewrite under any reasonable mobile clipboard limit — mandating surgical-only patching is partly a function of file size, not a free choice.

**The shell is now large enough that it limits the kinds of operations that can be performed against it in a single session.**

---

## 6. MERGE PRESSURE

Two parallel session protocols are documented:
- **Session A** = Production work on main → `accent-os.pages.dev`.
- **Session B** = Staging → `accent-os-staging.pages.dev`.

Implications for `index.html`:
- Two sessions independently editing different parts of `index.html` will produce conflicts whose resolution requires a human (or model) to read both branches' shell context — exactly the operation §5 says is most expensive.
- The single-Claude-Code-block protocol assumes one author at a time. Genuine parallel work on the shell is hostile under the current architecture.

`internal_meetings.js` has the same problem at smaller scale: any feature spanning two of its six internal subsystems creates a per-file conflict locus.

The rest of the repo (other modules, SQL, governance docs, skills) merges trivially because each file has a narrow author surface.

---

## 7. SPLIT URGENCY THRESHOLDS

Quantitative triggers for when the shell becomes operationally untenable. Listed in escalating order; each row is "if X, then split."

| Threshold | Source | Status |
|---|---|---|
| 900 KB hard limit on any single file | `MASTER.md` §3 | **76 % used → 81 % at current 735 KB** |
| Surgical patch fails to find unique `old_string` on first try | `BUILD_INTELLIGENCE.md` (recurrent pattern) | Already happening intermittently |
| Single shell read consumes >25 % of session context budget | Operational | Plausibly already true on smaller-context models |
| Mobile copy-block exceeds clipboard / message limits | Operational | Already binding — drives surgical-patch protocol |
| Two consecutive sessions both edit overlapping shell ranges | Merge | Has not happened yet (Session A only currently active) |
| `index.html` modification touches >3 distinct concerns in one patch | Discipline | Frequent, given the 4-touchpoint module-add corridor |

**`index.html` has crossed the operational thresholds. The hard size limit is the only one not yet crossed, but it is approaching faster than the stale documentation suggests.**

For `internal_meetings.js`:
- 2,436 LOC vs. ~300 LOC median module → 8× the median (already past the threshold that triggered the 0.1 file split for the original shell).
- Six sub-features (Platform Review, Agenda Builder, Notes, To-Dos, Follow-Ups, Transcripts) all sharing prefix-`IM_` state → its own internal cross-coupling pattern emerging.

---

## 8. SAFE DECOMPOSITION ORDER

Boundaries proposed; none of these is being executed in this task. Order is **safest yield first**.

### Stage 1 — Visual-only extraction (effectively zero functional risk)
1. Inline `<style>` blocks → `css/aos.css`. The `<link rel="stylesheet">` replaces three `<style>` blocks. Big LOC drop, no JS path touched.

### Stage 2 — Self-contained utility extraction (low risk)
2. Toast / Modal / CSV / `$` / `qsa` / `esc` / `v` / FAB helpers → `js/shell_utils.js`. All globals; call-sites unchanged. Verify `<script>` placement so `shell_utils.js` loads *before* every consumer.
3. Quote-print HTML template (line ~5887) → `js/quote_print.js` template literal.

### Stage 3 — Module-shaped HTML extraction (medium risk)
4. Vendor view templates (≈ lines 3663–4700) → loaded by `js/vendors.js` (the first "real" extraction in the spirit of the original 0.1 split).
5. Quick-Actions FAB markup + handlers → `js/quick_actions_fab.js` (mostly already in `js/quick_actions.js`; reconcile).
6. Vendor side-panel + feedback panel + modal frame → either kept as the only HTML in shell, or extracted into a `partials/` pattern.

### Stage 4 — Governance-collapse extraction (higher value, higher risk)
7. Sidebar `<a data-roles>` HTML → generated from `module_modes.json` at hydrate time. **This kills illusion zone §6.2 of `REPO_TOPOLOGY_MAP.md`** — already tracked as `module_registry_refactor` in `idea_only` state.

### Stage 5 — Auth extraction (highest blast radius — do last)
8. Auth block (lines ≈528–720) → `js/auth.js`. Touches `CU`, `sbAuthFetch`, `sbFetchProfile`, `sbAuditLog`, `applyRoleVisibility`, `doLogin`, `tryRestoreSession`, `activateApp`, `hydrateFromSupabase`, `doLogout`. Self-contained but production-critical: regression here is catastrophic.

### Parallel track — `internal_meetings.js`
A. Split by sub-feature into 4–6 files: `im_prep.js`, `im_agenda.js`, `im_notes.js`, `im_todos.js`, `im_followups.js`, `im_transcripts.js` (or fewer if some pair logically). Shared `IM_` state → `im_state.js`.

### Out-of-shell housekeeping
B. `patch_quote.js` — run-once and delete, or move to `patches/` (out of repo root).
C. Cache-bust `?v=…` — either automate via deploy-time hash injection or accept and document the discipline.

**Each stage drops shell LOC and reduces hidden coupling without altering any user-visible behavior.** Stages 1 and 2 should always be doable in a single session. Stages 4 and 5 likely warrant their own dedicated session each.

---

## 9. SECONDARY PRESSURE: `internal_meetings.js`

| Metric | Value |
|---|---|
| LOC | 2,436 |
| Size | 120 KB |
| State variables (top of file) | 18 (`IM_EL`, `IM_MEETINGS`, `IM_CUR_ID`, `IM_CUR_SUB`, `IM_NOTES`, `IM_TODOS`, `IM_FOLLOWUPS`, `IM_PREP`, `IM_AGENDA`, `IM_TRANSCRIPTS`, `IM_PREP_OPEN`, `IM_LOADED`, `IM_BUBBLE_OPEN`, `IM_BUBBLE_TYPE`, `IM_RT_CHANNEL`, `IM_RT_MEETING`, `IM_RT_LIST`, `IM_RT_LIVE_*`) |
| Sub-features | 6 (Platform Review, Agenda Builder, Notes + floating bubble, To-Dos, Follow-Ups, AI Notes/Transcripts) |
| Realtime channels | 2 (per-meeting + list-level) |
| Tables touched | `meetings`, `meeting_prep_sections`, `meeting_notes`, `meeting_todos`, `meeting_followups`, `meeting_transcripts` |

This file is on track to repeat `index.html`'s pattern at module scale. It is the **only module currently large enough to deserve its own pressure analysis**, and Stage A (parallel track in §8) addresses it.

---

## 10. INERT FROZEN ZONES (very low pressure)

For completeness — these files are frozen but **not** under pressure and can be left alone.

- `worker/anthropic-proxy.js` — 48 LOC pass-through; no internal complexity, no coupling.
- `wrangler.toml` — 6 LOC.
- `sql/M01..M40` already-applied — append-only by discipline; new migrations land as `M41+` with no edit pressure on prior files. The Supabase MCP block makes re-edits expensive (manual paste), reinforcing the discipline.
- Design tokens — locked by rule, but the **rule** has zero pressure; the *physical lines* are inside `index.html` and inherit its pressure (extracted in Stage 1 of §8).

---

## 11. SUMMARY

| Question | Answer |
|---|---|
| Single highest-pressure file | `index.html` |
| Why | Size (76 → 81 % of declared cap and rising), hidden coupling fan-out (1 → 38 modules), 4-touchpoint module-add corridor, mobile-handoff token pressure, surgical-patch fragility |
| Second highest | `js/internal_meetings.js` — module-scale repeat of the same pattern |
| What is genuinely safe and frozen | Worker, already-applied SQL migrations, design-system rule (the rule, not the lines) |
| Where pressure is accelerating fastest | The shell's script-tag manifest + sidebar `<a data-roles>` block — every module add costs lines there |
| Earliest decomposition with highest yield | Inline `<style>` → `css/aos.css` (Stage 1) — line-count drop with no JS path touched |
| Latest / highest-stakes decomposition | Auth block extraction (Stage 5) |

**The single most useful thing this analysis says: every other "frozen" file is frozen because it is *done* — `index.html` is frozen because it is *too risky to keep touching at this size*. Those are different conditions, and only the second one is unstable.**
