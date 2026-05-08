# STABILIZATION_PROTOCOL.md — Safest Path To The Big Change

> The exact sequence to execute the accentos / agentos-* split. Each phase has entry criteria, exit criteria, and rollback. **Do not start a phase until the previous phase's exit criteria are met.**
>
> Companion to: SYSTEM_STATE.md (snapshot), ACTIVE_SESSION_REGISTRY.md (session coordination), MODULE_OWNERSHIP_MAP.md (path mapping), EXTRACTION_CANDIDATES.md (per-asset disposition), GOVERNANCE_RISKS.md (risk register).

**Last updated:** 2026-05-08

---

## Phase 0 — Governance Baseline (THIS SESSION)

**Goal:** Produce the six governance artifacts and pause.

- **Entry criteria:** Clean working tree on `claude/governance-snapshot-prep-k3dBs`. ✅
- **Actions:**
  1. Snapshot repo state → SYSTEM_STATE.md ✅
  2. Register sessions → ACTIVE_SESSION_REGISTRY.md ✅
  3. Map ownership → MODULE_OWNERSHIP_MAP.md ✅
  4. Classify extraction candidates → EXTRACTION_CANDIDATES.md ✅
  5. Rank risks → GOVERNANCE_RISKS.md ✅
  6. Define this protocol → STABILIZATION_PROTOCOL.md ✅
  7. Update WORK_IN_PROGRESS.md to reflect governance baseline + paused worker-proxy task.
  8. Commit all artifacts in one commit.
  9. Push to origin: `git push -u origin claude/governance-snapshot-prep-k3dBs`.
- **Exit criteria:**
  - All six artifacts exist on disk.
  - Single commit, pushed.
  - WORK_IN_PROGRESS.md reflects current state.
  - ACTIVE_SESSION_REGISTRY.md flags this session as `paused-clean` and `clearance-for-restructure: YES`.
- **Rollback:** None needed — all changes are documentation only.
- **Stop here.** **Do not proceed to Phase 1 in this session.**

---

## Phase 1 — Pre-Restructure Hardening (NEXT SESSION)

**Goal:** Mitigate every block-list risk from GOVERNANCE_RISKS.md before any structural change.

- **Entry criteria:**
  - Phase 0 commit pushed and visible on `mgraf77/accent-os` remote.
  - Michael has read SYSTEM_STATE.md + GOVERNANCE_RISKS.md and approved entry.
  - `git fetch origin && git log HEAD..origin/main --oneline` shows no surprise advance OR conflicts have been resolved.
- **Actions (ordered):**
  1. **Resolve R-02 (worker proxy):** Michael runs `wrangler deploy` from local machine. Verify in browser console that proxy returns "Missing x-api-key" for empty POST. Mark WORK_IN_PROGRESS.md as resolved. Commit on `claude/post-worker-deploy` or main.
  2. **Resolve R-09 (boot smoke test):** Use the `session-start-hook` skill to add a SessionStart hook that exits 0 if all CLAUDE.md AUTO-EXECUTE step-1 files are readable. Add minimal CI workflow `.github/workflows/boot-smoke.yml` running `bash scripts/boot-smoke.sh`.
  3. **Resolve R-06 (Stop hook absolute path):** Replace `/home/user/accent-os/...` with relative or `$CLAUDE_PROJECT_DIR/...`. Test by running a session-end commit and checking `_aggregator.log`.
  4. **Resolve R-08 (origin sync):** Confirmed by entry criterion above; no separate action.
  5. **Resolve R-10 (WIP stream):** Already addressed in Phase 0 commit.
  6. **Confirm scope freeze on `worker/` and `index.html`** — neither will be touched in Phase 2/3.
- **Exit criteria:**
  - Worker proxy responds correctly per WORK_IN_PROGRESS.md test.
  - Boot smoke test passes locally and in CI.
  - Stop hook fires without absolute paths.
  - GOVERNANCE_RISKS.md updated to mark R-02, R-06, R-09, R-10 as `MITIGATED`.
- **Rollback:** Each fix is its own commit; revert independently if a fix fails.

---

## Phase 2 — Wave 1 Extraction (lowest-risk skills)

**Goal:** Lift the 3 READY-class assets to prove the migration pattern. Use this as the canary.

- **Entry criteria:**
  - Phase 1 exit criteria met.
  - `agentos-skills` and `agentos-core` repos created on `mgraf77` (Michael does this manually before this phase begins).
  - Branch protection on `main` for both new repos: PRs only, 1 approving review.
- **Targets:**
  - `community-skill-vet` → agentos-skills
  - `skill-eval-suite` → agentos-skills
  - `skills/vibe-speak/modes/` → agentos-core
- **Actions per asset (do one at a time, full cycle each):**
  1. Create branch `extract/<skill-name>` on the **destination** repo.
  2. Use `git filter-repo --path skills/<name>/ --path-rename skills/<name>/:<name>/` against an accentos clone, then push as the seed of the new repo path. (Preserves history per R-12.)
  3. Update destination's README to record source provenance.
  4. Manually invoke the skill once in a test session against the destination repo. Verify it works.
  5. Open PR, merge.
  6. On accentos `claude/extract-wave-1` branch: delete the source path with a single commit `chore: relocate <skill> to agentos-*`.
  7. Update `skills/_index.md` (regenerable). Commit.
  8. Update SYSTEM_STATE.md skill counts.
- **Exit criteria:**
  - All 3 assets live in destination repos with history.
  - All 3 invocable from a fresh Claude session.
  - accentos `claude/extract-wave-1` PR merged to `main`.
- **Rollback:** Revert the deletion commit on accentos. Destination repos can be deleted entirely if the experiment fails.

---

## Phase 3 — Wave 2 Extraction (light de-couple)

**Goal:** Lift 8 LIGHT-DECOUPLE skills.

- **Entry criteria:** Phase 2 exit criteria met. No regression issues filed against agentos-skills or agentos-core.
- **Targets:** `codex-review`, `repo-scout`, `analysis-snapshot`, `schema-contract-tests`, `table-eda`, `decision-log`, `autonomous-mode`, `prompt-queue`.
- **Actions per skill:** Same as Phase 2, prefixed by a decouple commit:
  1. On accentos `claude/decouple-<skill>`, apply the de-couple steps from EXTRACTION_CANDIDATES.md.
  2. Verify the skill still works in accentos.
  3. Then proceed with the Phase 2 lift cycle.
- **Exit criteria:** All 8 in destination, all invocable, accentos clean.
- **Rollback:** Same as Phase 2.

---

## Phase 4 — Wave 3 Extraction (medium de-couple, including vibe-speak)

**Goal:** Lift the framework — vibe-speak, efficiency-monitor, skill-forge, the build orchestration skills.

- **Entry criteria:**
  - Phase 3 exit criteria met.
  - **Special:** Update `.claude/CLAUDE.md` AUTO-EXECUTE step 1 in lockstep with the vibe-speak move (R-01). Test session boot from cold immediately after.
- **Targets:** `efficiency-monitor`, `skill-forge`, `vibe-speak` (whole framework), `supabase-sql-magic`, `build-plan-status`, `doc-drift`, `bottleneck-finder`, `priority-articulation`.
- **Actions:** Per-skill, with extra rigor:
  1. De-couple commit on accentos.
  2. Move to destination.
  3. Update `.claude/CLAUDE.md` boot path in accentos.
  4. **Cold-boot test:** open a fresh Claude session in accentos. Verify vibe-speak loads, modes work, efficiency-monitor activates.
  5. Cold-boot test in another repo (any one) that depends on agentos-core: same checks.
- **Exit criteria:** All Wave 3 skills moved, both cold-boot tests pass.
- **Rollback:** Revert the AUTO-EXECUTE update + the deletion commit on accentos. The destination repo's added files can stay (they don't affect accentos).

---

## Phase 5 — Wave 4 Templates (extract patterns from large docs)

**Goal:** Extract reusable templates from MASTER.md, BUILD_PLAN_CLAUDE.md, BUILD_INTELLIGENCE.md, scripts/status.sh, PROMPT_LOG.md.

- **Entry criteria:** Phase 4 exit criteria met.
- **Actions:** For each doc:
  1. Identify the portable section (preamble, schema, methodology).
  2. Copy to `agentos-command-center/templates/<doc>.template.md`.
  3. The accentos instance keeps everything (templates remain in their original docs as the live form).
  4. Add a footer link in the accentos doc pointing to the template.
- **Exit criteria:** 5 templates in agentos-command-center, accentos docs unchanged in content.
- **Rollback:** Delete the templates from agentos-command-center. Zero risk.

---

## Phase 6 — Wave 5 HOLD review

**Goal:** Inspect and classify items currently in HOLD (per EXTRACTION_CANDIDATES.md section E).

- **Entry criteria:** Phase 5 exit criteria met.
- **Targets:** `scripts/auto-categorize.js`, `skills/vibe-speak/benchmarks/`, `skills/vibe-speak/corpus/`, `.claude/output-styles/`.
- **Actions:** Read each, classify, then either include in a future wave or mark STAY permanent.

---

## Phase 7 — Cleanup

- Update MASTER.md §3 + §4 to reflect new repo topology.
- Update README.md with the multi-repo overview and a "where do I work?" decision tree.
- Sunset SYSTEM_STATE.md (replace with a per-repo SYSTEM_STATE.md series).
- Archive ACTIVE_SESSION_REGISTRY.md or move it to a top-level `agentos-meta` repo if multi-repo coordination becomes necessary.

---

## STOP CONDITIONS — Abort restructure if any of these occur

- A cold-boot Claude session fails to load vibe-speak (R-01).
- Worker proxy state changes during the operation (R-02).
- A merge conflict appears against `main` from a parallel session (R-11).
- Any data-loss event in agentos-* repos (no R-XX assigned; would be highest severity).
- A skill is found to have undocumented coupling that wasn't classified in EXTRACTION_CANDIDATES.md.

If any stop condition fires:
1. Halt the current wave.
2. Update GOVERNANCE_RISKS.md with the new risk entry.
3. Notify Michael.
4. Do not proceed without an explicit "go" from Michael.

---

## Authorization Gate Per Phase

| Phase | Authorization required from Michael |
|---|---|
| 0 | Already authorized — the prompt that started this session is the authorization. |
| 1 | Required — explicit "begin Phase 1 hardening" or equivalent. |
| 2 | Required — explicit "begin Wave 1 extraction" + confirmation that destination repos exist. |
| 3 | Required — explicit "Wave 2 go". |
| 4 | Required — explicit "Wave 3 go" + acknowledgment of R-01 (vibe-speak boot risk). |
| 5 | Required — "Wave 4 go". |
| 6 | Required — "HOLD review go". |
| 7 | Required — "cleanup go". |

**Default behavior between phases:** pause and wait. Never auto-proceed to the next phase.
