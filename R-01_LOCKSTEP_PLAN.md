# R-01_LOCKSTEP_PLAN.md — vibe-speak Move Coordination

> **Status:** Documentation only. **No move performed yet.** No skill files relocated. No agentos-core repo created from this document.
>
> Authored: 2026-05-08, Phase 1 hardening session (`claude/governance-snapshot-prep-k3dBs`).
>
> **Purpose:** Define the exact set of changes that must land in **a single atomic commit** when vibe-speak is eventually relocated to `agentos-core`, so that no future Claude Code session boots into a broken state. This is the playbook executed in STABILIZATION_PROTOCOL.md Phase 4 (Wave 3). It exists today so the move is not improvised when the time comes.
>
> **Scope:** Mitigates GOVERNANCE_RISKS.md R-01 (vibe-speak path move could break every future session boot).

---

## 1. The Coupling Surface

The `.claude/CLAUDE.md` AUTO-EXECUTE block (lines 5–22) reads, in order:

| Step | Path expected | Move-time concern |
|---|---|---|
| 1.a | `skills/vibe-speak/profiles/_active.md` | Profile lives with user, not framework. Stays in accentos. |
| 1.a | `skills/vibe-speak/profiles/_default.md` | **Moves to agentos-core.** |
| 1.a | (detection chain) git config user.name → user.email | No file dep. |
| 1.b | `skills/vibe-speak/profiles/[active-user].md` (e.g. `michael.md`) | Per-user calibration; follows user. Stays in accentos OR moves to a user dotfiles-style location. **Decision deferred.** |
| 1.c | `skills/vibe-speak/session-handoff.md` | Per-session continuity log; instance stays in accentos, schema in agentos-core. |
| 1.d | `skills/vibe-speak/feedback-log.md` | Instance stays in accentos. |
| 1.e | `skills/vibe-speak/observation-log.md` | Instance stays in accentos. |
| 1.f | `skills/vibe-speak/kpi-log.md` | Instance stays in accentos. |
| 1.g | `skills/vibe-speak/modes/[default-mode].md` (e.g. `vibe.md`) | **Moves to agentos-core.** |
| 1.h | `skills/_index.md` | Forks: agentos-skills carries general entries, accentos keeps AL entries. |
| 1.i | `skills/vibe-speak/SKILL.md` (Step 7, 12, 23 references) | **Moves to agentos-core.** |
| 1.j | `skills/efficiency-monitor/session-end-summary.md` | Instance stays in accentos. |
| 1.j | `skills/efficiency-monitor/SKILL.md` | **Moves to agentos-core.** |
| 6 | `scripts/status.sh` | Stays — instance is AL. (Template lifts to agentos-command-center separately.) |

In addition, the `.claude/settings.json` Stop hook references `skills/efficiency-monitor/_aggregator.log` and `scripts/efficiency-aggregate.sh`. The SessionStart hook references `scripts/boot-smoke.sh`. None of these paths move in Wave 3; only the framework files do.

---

## 2. The Atomic Commit Contract

When the move executes, **one** commit on `claude/extract-vibe-speak-and-efficiency-monitor` (or similar) must do all of the following — split into smaller commits is forbidden because partial state means broken session boot:

### 2.1 Add resolution shims in accentos
Replace direct skill paths in `.claude/CLAUDE.md` with a fallback chain. Example for step 1.g:

> Old: read `skills/vibe-speak/modes/[default-mode].md`
> New: read `${AGENTOS_CORE:-skills}/vibe-speak/modes/[default-mode].md` if it exists, else fall back to `skills/vibe-speak/modes/[default-mode].md`.

A simpler approach (preferred): create a thin loader in accentos that resolves any `skills/vibe-speak/...` path to either the relocated path or the local copy, and update CLAUDE.md to invoke the loader rather than naming files directly.

**Decision (defer to move-time):** Two acceptable strategies. The move-time session will pick one and document choice in the commit message:

- **(A) Submodule.** `agentos-core` mounted as a git submodule under `skills/vibe-speak/` and `skills/efficiency-monitor/`. CLAUDE.md paths stay byte-identical. Risk: submodule ops add cognitive load, easy to ship broken.
- **(B) Symlink.** Skills copy lives in agentos-core; accentos has a checked-in symlink at `skills/vibe-speak` → external clone path. Path stays byte-identical. Risk: cross-platform; CI must clone agentos-core.
- **(C) Path constants.** CLAUDE.md is parameterized to `${VIBE_SPEAK_ROOT:-skills/vibe-speak}` and similar. Boot script resolves the variable. Risk: more invasive but cleanest.

**Recommendation as of 2026-05-08:** strategy **(C) path constants**, because it is the only approach that survives a fresh repo clone where agentos-core has not yet been fetched, and because it makes the smoke test trivial (just check both possible paths).

### 2.2 Update `.claude/CLAUDE.md`
- Lines 5–22: each `skills/vibe-speak/...` reference becomes `${VIBE_SPEAK_ROOT:-skills/vibe-speak}/...`.
- Lines for `skills/efficiency-monitor/...`: `${EFFICIENCY_MONITOR_ROOT:-skills/efficiency-monitor}/...`.
- Line for `skills/_index.md`: stays — registry is fork-on-move.

### 2.3 Update `.claude/settings.json`
- Stop hook command: replace literal `skills/efficiency-monitor/...` with same `${EFFICIENCY_MONITOR_ROOT:-skills/efficiency-monitor}/...`.
- Same for `scripts/efficiency-aggregate.sh` if it references the skill dir internally — it currently does (line 14, 15, 16). The script must accept env vars OR the .claude/settings.json command must export them before calling.

### 2.4 Update `scripts/efficiency-aggregate.sh`
- Lines 14–16: `LOG`, `CAND`, `THRESH` paths become `${EFFICIENCY_MONITOR_ROOT:-skills/efficiency-monitor}/...`.
- Add at top: `EFFICIENCY_MONITOR_ROOT="${EFFICIENCY_MONITOR_ROOT:-skills/efficiency-monitor}"`.

### 2.5 Update `scripts/boot-smoke.sh`
- Replace `require "skills/vibe-speak/..."` with a helper that checks both `${VIBE_SPEAK_ROOT:-skills/vibe-speak}/...` and (if that fails) the legacy `skills/vibe-speak/...`. Same for efficiency-monitor.
- Add an `--explain` mode that prints which root each skill resolved through, for debugging the first move.

### 2.6 Update `skills/_index.md`
- Append a note: framework skills (vibe-speak, efficiency-monitor) live in `agentos-core`. Document the `${VIBE_SPEAK_ROOT}` env var.
- AL-domain skills entries unchanged.

### 2.7 Cold-boot test
The commit cannot be merged until the move-time session opens a fresh Claude Code session against the post-move repo and verifies:

1. SessionStart hook runs without errors.
2. Boot smoke test passes with 0 errors (warnings allowed for optional logs).
3. vibe-speak boot chain (CLAUDE.md step 1.a–1.j) completes successfully — manually trigger by typing a message and observing that mode + profile loaded.
4. `/mode list` returns all 9 modes.
5. Stop hook fires after a commit and writes `_aggregator.log`.

Each of those 5 checks is a manual gate. Failing any one rolls the commit back.

### 2.8 Rollback procedure
If post-move boot fails:

1. `git revert <move-commit>` on `claude/extract-vibe-speak-and-efficiency-monitor`.
2. Confirm boot-smoke returns 0.
3. The `agentos-core` repo retains its first-import commit; we don't delete it from there. Just unwind the accentos shim.
4. Update GOVERNANCE_RISKS.md with the failure mode that was discovered.

---

## 3. The Test Protocol Before The Move

Before Phase 4 / Wave 3 begins, the move-time session must run, in order:

1. **Confirm GOVERNANCE_RISKS.md R-01 still says UNMITIGATED.** This document mitigates the *planning* risk, not the execution risk.
2. **Boot smoke must pass cleanly on `main`.**
3. **CI must be green** on the most recent PR. If `boot-smoke` workflow has never run, push a no-op commit to trigger it once.
4. **Create the agentos-core repo** at `mgraf77/agentos-core` (Michael, manual step).
5. **Decide strategy** (A/B/C in §2.1) and document in the move commit message.
6. **Execute the atomic commit.**
7. **Run the 5 cold-boot checks** in §2.7.
8. **Push only if checks pass.**

---

## 4. What This Document Does NOT Cover

- The actual content of `agentos-core` (which framework files, which scripts).
- Whether `agentos-core` should also include `efficiency-monitor` infrastructure beyond just `SKILL.md` (the aggregator script + log schemas).
- How `michael.md` (per-user calibration) is going to be distributed across multiple repos that all use agentos-core. This is a future open question.
- CI integration in the destination repo (agentos-core's own boot test).

These are deferred to the move-time session, not this Phase 1 doc.

---

## 5. Update Trigger

Update this document if any of:

- A new file is added to `.claude/CLAUDE.md` AUTO-EXECUTE chain.
- A new vibe-speak path appears in `.claude/settings.json` hooks.
- The `efficiency-aggregate.sh` script gains a new path dependency.
- Strategy (A/B/C) preference changes based on new information.

Otherwise the contract above is binding for the move.
