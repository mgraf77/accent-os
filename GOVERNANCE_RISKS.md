# GOVERNANCE_RISKS.md — Ranked Risks Before Big Change

> Top governance and execution risks that could cause data loss, broken sessions, or downstream operational damage if restructuring proceeds without mitigation.
>
> Each risk: severity (S=session-breaking, B=business-breaking, D=data-loss, R=reversible-rework), likelihood (H/M/L), blast radius, mitigation, owner, status.
>
> **Rule:** Any risk at severity S or B with likelihood H **must** be mitigated before the restructure phase is cleared.

**Last updated:** 2026-05-08

---

## R-01 · Session boot breaks if `vibe-speak` is moved without bridge — SEVERITY: S · LIKELIHOOD: H
- **Blast radius:** Every future Claude Code session in any repo. `.claude/CLAUDE.md` AUTO-EXECUTE step 1 reads `skills/vibe-speak/profiles/...`, `modes/`, etc. If the path moves before the auto-instructions are updated, every session boots in a degraded state.
- **Mitigation:**
  1. Update `.claude/CLAUDE.md` AUTO-EXECUTE step 1 in the SAME commit that relocates the skill.
  2. Add a fallback chain: try `${AGENTOS_CORE_PATH}/skills/vibe-speak/...` → fall back to local `skills/vibe-speak/...`.
  3. Manually boot a session after the move and verify all 9 mode-switch phrases work.
- **Owner:** Michael + next-phase Claude session.
- **Status:** UNMITIGATED. Block restructure until fix is committed.

## R-02 · Worker proxy redeploy still pending — SEVERITY: B · LIKELIHOOD: M
- **Blast radius:** "⚡ Parse Notes" in Quote Generator is broken in production until commit `2dca2a6` is deployed via `wrangler deploy`. Restructuring `worker/` while it's in this half-deployed state risks deploying yet-newer code while the old code still runs.
- **Mitigation:**
  1. Resolve WORK_IN_PROGRESS.md task BEFORE any restructure that touches `worker/` or `wrangler.toml`.
  2. OR: snapshot the deployed worker state externally (Cloudflare dashboard → version log) and freeze `worker/` from any change in Wave 1–4.
- **Owner:** Michael (only he can `wrangler deploy` from his local machine).
- **Status:** UNMITIGATED. Block any change to `worker/` until resolved.

## R-03 · No upstream tracking on current branch — SEVERITY: R · LIKELIHOOD: H
- **Blast radius:** First push fails or pushes to wrong remote slot if invoked without `-u origin claude/governance-snapshot-prep-k3dBs`.
- **Mitigation:** Always use `git push -u origin claude/governance-snapshot-prep-k3dBs` for first push from this branch (per the project Git Operations rules). Subsequent pushes can drop the `-u`.
- **Owner:** Claude (this session).
- **Status:** Mitigated by following project rules; flagged here so the next session sees it.

## R-04 · 7,169-line `index.html` monolith blocks safe modular extraction — SEVERITY: B · LIKELIHOOD: H
- **Blast radius:** Any restructure that touches `index.html` is high-risk: cross-module reads through `window.X` globals (`$`, `esc`, `sbFetch`, `openModal`) mean a renamed file or a moved script tag silently breaks features. Quote Generator, Pipeline, Daily Brief, Customers, Vendor scoring all share globals.
- **Mitigation:**
  1. **Do not touch `index.html` in the big-change phase.** Keep it 100% in accentos. Lift only `skills/`, `scripts/`, and template extracts in this round.
  2. Independent of restructuring, continue extraction to `js/` modules track in BUILD_PLAN_CLAUDE.md.
- **Owner:** future Claude sessions.
- **Status:** Mitigated by scope discipline (restructure does not touch index.html).

## R-05 · Zero clean-lift skills — every skill couples to AL — SEVERITY: R · LIKELIHOOD: H
- **Blast radius:** Naive `git mv skills/X` to a new repo carries hard-coded AL references. Any agentos-* user other than Michael would hit broken paths or AL-vocabulary leakage.
- **Mitigation:** Per EXTRACTION_CANDIDATES.md, every skill has a `decouple-steps` block. Apply de-coupling commit BEFORE the move, not after.
- **Owner:** future Claude session per skill.
- **Status:** Documented; mitigation is a per-skill action item.

## R-06 · `.claude/settings.json` Stop hook hard-codes absolute path — SEVERITY: S · LIKELIHOOD: M
- **Blast radius:** The Stop hook command is `bash /home/user/accent-os/scripts/efficiency-aggregate.sh ...`. If the repo is moved to a different working directory or restructured, the hook silently breaks (`|| true` swallows errors), and efficiency-monitor stops aggregating.
- **Mitigation:**
  1. Replace absolute path with `${CLAUDE_PROJECT_DIR}/scripts/efficiency-aggregate.sh` if the harness exposes it; otherwise `$(pwd)/...`.
  2. After any move, manually trigger a session-end and confirm the aggregator wrote to `_aggregator.log`.
- **Owner:** Claude (next phase).
- **Status:** UNMITIGATED. Low priority — does not break sessions, just silently disables the observer.

## R-07 · Cross-skill companion references break on partial extraction — SEVERITY: R · LIKELIHOOD: H
- **Blast radius:** `skills/_index.md` lists `companion: skill-forge, codex-review` etc. If `skill-forge` moves to agentos-skills and `vendor-cascade` stays in accentos, the registry entry now points to a skill in a different repo. Same for SKILL.md companion fields.
- **Mitigation:**
  1. After each wave, regenerate `skills/_index.md` (it's auto-regenerable per the registry header).
  2. Adopt fully-qualified companion references: `agentos-skills:skill-forge` vs. `accentos:vendor-cascade`.
- **Owner:** future Claude session.
- **Status:** Documented; mitigation is per-wave action.

## R-08 · Snapshot is read-only — origin remote not refreshed — SEVERITY: R · LIKELIHOOD: M
- **Blast radius:** This snapshot did not run `git fetch origin`. If origin/main has advanced since the prior session paused, restructuring against this stale baseline would conflict.
- **Mitigation:** First action of the next phase: `git fetch origin && git log HEAD..origin/main --oneline`. If non-empty, update SYSTEM_STATE.md before proceeding.
- **Owner:** Claude (next phase).
- **Status:** Mitigated by procedural step in STABILIZATION_PROTOCOL.md.

## R-09 · No CI / automated boot test — SEVERITY: B · LIKELIHOOD: M
- **Blast radius:** There is no automated check that "Claude Code can boot a session in this repo cleanly." A botched move to vibe-speak or efficiency-monitor only gets caught at the next manual session start, which may be hours or days later.
- **Mitigation:**
  1. Build a minimal smoke test: a script that exits 0 if `.claude/CLAUDE.md` boot chain reads all referenced files without error.
  2. Add as `.claude/settings.json` SessionStart hook AND as a CI check (per the `session-start-hook` skill).
- **Owner:** Michael decides whether to invest in this before or after restructure.
- **Status:** UNMITIGATED. Recommended as a Wave 0 prerequisite.

## R-10 · Two parallel WORK_IN_PROGRESS / pause-marker streams — SEVERITY: R · LIKELIHOOD: L
- **Blast radius:** WORK_IN_PROGRESS.md still describes the worker-proxy task. The current governance session is also a "session" but is not represented in WORK_IN_PROGRESS.md (it's in ACTIVE_SESSION_REGISTRY.md instead). A future Claude session might read WIP.md, see the worker task, and try to resume it before the governance commit lands.
- **Mitigation:**
  1. WORK_IN_PROGRESS.md should be updated *before* this session ends to point at "governance baseline established; worker-proxy task deferred to post-restructure session."
  2. ACTIVE_SESSION_REGISTRY.md becomes the canonical multi-session tracker; WIP.md remains for the single active build task.
- **Owner:** Claude (this session, before final commit).
- **Status:** Will be mitigated as part of this session's commit.

## R-11 · Heavy doc count creates merge conflict surface during restructuring — SEVERITY: R · LIKELIHOOD: M
- **Blast radius:** ~10 large markdown docs in repo root + 28 SKILL.md files. Any parallel session that touches MASTER.md, SESSION_LOG.md, BUILD_PLAN_CLAUDE.md while a restructure branch is open creates conflicts.
- **Mitigation:**
  1. Freeze rule: while a restructure branch is open, NO non-restructure commits to `main` or any feature branch that touches the listed docs.
  2. Communicate via ACTIVE_SESSION_REGISTRY.md.
- **Owner:** Michael + Claude.
- **Status:** Procedural; enforced by STABILIZATION_PROTOCOL.

## R-12 · Repo split breaks `git log` continuity for AL history — SEVERITY: R · LIKELIHOOD: H
- **Blast radius:** Lifting `skills/X` to a new repo without `git filter-repo --subdirectory-filter` loses the per-skill commit history. Diagnosing "why was this skill written this way" 6 months later becomes harder.
- **Mitigation:**
  1. Use `git filter-repo --path skills/<name>/` (or `git subtree split`) to preserve history per skill.
  2. Document in each agentos-* repo README which accentos commit range its first commits derive from.
- **Owner:** future Claude session executing the split.
- **Status:** Documented; mitigation is per-wave technique.

---

## Severity × Likelihood Matrix (current)

| | L=Low | L=Med | L=High |
|---|---|---|---|
| **S=Session-breaking** | — | R-06 | **R-01** |
| **S=Business-breaking** | — | R-02, R-09 | **R-04** |
| **S=Data-loss** | — | — | — |
| **S=Reversible rework** | R-10 | R-08, R-11 | R-03, R-05, R-07, R-12 |

### Pre-restructure block list (must clear before next phase)
- R-01 (vibe-speak path bridge) — fix in same commit as the move.
- R-02 (worker proxy) — resolve OR scope-out the `worker/` directory.
- R-04 (index.html) — scope-out from this round.
- R-09 (boot smoke test) — strongly recommended Wave 0.
