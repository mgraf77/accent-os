# AccentOS — Parallel Branch Reconciliation Plan
_Created: 2026-05-12 | Status: Plan only — no merge actions taken_

---

## Branch Topology

```
origin/main  (6fd059e)  ← common ancestor for BOTH branches
      │
      ├─── origin/accent-work-514226236373803311  (Jules)
      │         └── 441e5ed  "chore: repository audit and operational visibility improvements"
      │              1 commit ahead of main
      │              Files changed: 16
      │
      └─── origin/claude/audit-repository-Fg9xI  (Claude / this session)
                └── 11 commits ahead of main
                     1cb015a  MODULE_REGISTRY refactor
                     b9a65d9  pipeline analytics
                     832d7e6  auto-derive deal source
                     5a48639  KPI auto-snapshot
                     3a29a97  dashboard pinning
                     1daada6  csvDownload cleanup
                     6f9b5b1  session docs
                     e368a47  session docs
                     b858821  worker auth pipeline fix
                     03a4828  GitHub Actions workflow
                     0c35008  runtime documentation
                     Files changed: 15
```

**Relationship:** Both branches diverge from the same commit (`6fd059e`). Neither branch has seen the other's changes. No shared history beyond main.

---

## File-Level Overlap Matrix

### Files touched by BOTH branches

| File | Jules change | Claude change | Conflict risk |
|---|---|---|---|
| `index.html` | 4 deletion regions (dead code) | 15 insertion regions (new features) | **MEDIUM — line ranges do NOT overlap but git flags "changed in both"** |

### Files touched by Jules only

| File | Type | Risk to Claude branch |
|---|---|---|
| `AI_INTERACTION_MAP.md` | New file (root) | None — no filename clash |
| `AUDIT_SUMMARY.md` | New file (root) | None |
| `BUILD_PLAN_MICHAEL.md` | Modified (M45 added) | None — Claude doesn't touch this file |
| `DEPLOYMENT_FLOW_NOTES.md` | New file (root) | None — Claude's runtime docs are in `docs/runtime/` |
| `DUPLICATE_HELPER_PATTERNS.md` | New file (root) | None |
| `FRONTEND_RUNTIME_FLOW.md` | New file (root) | None |
| `INDEX_DECOMPOSITION_RISK_AUDIT.md` | New file (root) | None |
| `MODULE_DEPENDENCY_AUDIT.md` | New file (root) | None |
| `REMEDIATION_REPORT.md` | New file (root) | None |
| `RUNTIME_HEALTH_VERIFICATION.md` | New file (root) | None |
| `STARTUP_DEPENDENCY_ORDER.md` | New file (root) | None |
| `js/internal_meetings.js` | Deleted `imRtUnsubscribeList` | Not touched by Claude branch |
| `js/module_modes.js` | Deleted `moduleModeBadge` | Not touched by Claude branch |
| `module_modes.json` | Significant expansion | Not touched by Claude branch |
| `patch_quote.js` | **Deleted** (orphan Node script) | Not referenced anywhere in HTML/JS |

### Files touched by Claude only

| File | Type | Risk to Jules branch |
|---|---|---|
| `.github/workflows/deploy-worker.yml` | New file | None |
| `BUILD_INTELLIGENCE.md` | Modified | None |
| `PROMPT_LOG.md` | Modified | None |
| `SESSION_LOG.md` | Modified | None |
| `WORK_IN_PROGRESS.md` | Modified | None |
| `docs/runtime/*.md` (4 files) | New files in new dir | None |
| `js/csv_import.js` | Modified | None |
| `js/customers.js` | Modified | None |
| `js/jobs.js` | Modified | None |
| `js/trade_partners.js` | Modified | None |
| `worker/anthropic-proxy.js` | Modified | None |

---

## index.html Detailed Overlap Analysis

This is the only file requiring careful review. Both branches modify it but in non-overlapping regions.

### Jules' changes to index.html (all deletions)

| Approx. line (on main) | What Jules removes | Rationale |
|---|---|---|
| ~2128 | 1-line TODO comment about dynamic tier thresholds | Converted to M45 task in BUILD_PLAN_MICHAEL.md |
| ~2188 | `unverifiedCountFor()` function (2 lines) | Dead code — defined but never called externally |
| ~4273–4478 | `downloadScoringRubric()` (~100 LOC) | Dead or orphaned function |
| ~4273–4478 | `openRepOutreach()` helper (~100 LOC) | Dead or orphaned function |
| ~5053–5101 | ~49 lines after `exportCSV` | Dead or obsolete code block |

### Claude's changes to index.html (all insertions/modifications)

| Approx. line (on main) | What Claude changes |
|---|---|
| ~389 | Sidebar HTML replacement (static → injection target) |
| ~656 | `activateApp()` — added `buildSidebar()` call |
| ~693 | `hydrateFromSupabase()` — added `maybeAutoSnapshotKPIs()` |
| ~811–833 | Worker probe IIFE rewrite |
| ~887–952 | `MODULE_REGISTRY` + `PAGE_META` + `buildSidebar()` |
| ~958 | `goTo()` dispatcher simplification |
| ~3879–3922 | Vendor detail AI — preflight guard + error handling |
| ~5248 | `sbLoadPipeline` — `created_at` mapping |
| ~5396–5503 | `openPipelineAnalytics()` — full implementation |
| ~5513–5558 | `dealHTML()` additions |
| ~5971 | `updatePreview()` additions |
| ~6049 | `aiParseNotes()` preflight guard |
| ~6424–6500 | `sendChat()` rewrite with stale-worker handling |
| ~7234–7270 | `maybeAutoSnapshotKPIs()` + dashboard pinning |
| ~7682 | Dashboard header `📌 Pins` button |

### Overlap verdict

**No content overlap.** Jules' deletion regions (2128, 2188, 4273–4478, 5053–5101) and Claude's modification regions (389, 656, 693, 811, 887, 958, 3879, 5248, 5396, 5513, 5971, 6049, 6424, 7234, 7682) are in completely different parts of the file.

**Why git flags "changed in both":** git's file-level tracking detects that `index.html` appears in both diffs. This is expected — it does not mean the edits conflict. A 3-way merge will auto-resolve this correctly.

---

## Specific Risk Items

### Risk 1 — `unverifiedCountFor` function (LOW)

- **Jules deletes** the `unverifiedCountFor(v)` function definition from index.html (~line 2188 on main)
- **Claude's branch** still contains this function definition (at ~line 2194 on Claude's branch — same function, not modified)
- **Call site audit:** The function is defined but has no external callers in either branch. Jules correctly identified it as dead code.
- **Integration behaviour:** Cherry-picking Jules' deletion onto Claude's branch will delete the function. This is safe.
- **Manual review needed:** Confirm no call sites were missed before accepting the deletion.

### Risk 2 — `moduleModeBadge` in module_modes.js (LOW)

- Jules deletes `moduleModeBadge()` from `js/module_modes.js`
- Claude's branch does not touch `module_modes.js`
- **Call site audit needed:** Search index.html and all `js/*.js` files for `moduleModeBadge(` to confirm dead code before accepting.

### Risk 3 — `imRtUnsubscribeList` in internal_meetings.js (LOW)

- Jules deletes `imRtUnsubscribeList()` from `js/internal_meetings.js`
- Claude's branch does not touch `internal_meetings.js`
- **Call site audit needed:** Confirm no caller exists in the module or in index.html.

### Risk 4 — `patch_quote.js` deletion (VERY LOW)

- Jules deletes `patch_quote.js` (a 29-line Node.js patch script at repo root)
- No references to this file found in index.html, any JS module, or any markdown
- Safe to accept the deletion — it was a one-time migration script.

### Risk 5 — Docs namespace overlap (NONE)

- Jules' 11 new docs land in **repo root** (e.g., `AUDIT_SUMMARY.md`)
- Claude's 4 new docs land in **`docs/runtime/`** (e.g., `CLOUDFLARE_DEPLOYMENT_FLOW.md`)
- No filename collisions. No content duplication.
- Minor: Jules has a `DEPLOYMENT_FLOW_NOTES.md` at root; Claude has `CLOUDFLARE_DEPLOYMENT_FLOW.md` in `docs/runtime/`. Different scope, different depth. Both should be kept.

### Risk 6 — module_modes.json expansion (LOW)

- Jules significantly expands `module_modes.json` (from ~25 module entries to a much larger set)
- Claude's branch does not touch this file
- No conflict. Accept Jules' version.

---

## Merge Order Recommendation

### Recommended strategy: Cherry-pick Jules onto Claude branch → single PR to main

```
Step 1: Create integration branch from Claude's branch
        git checkout -b integration/reconcile origin/claude/audit-repository-Fg9xI

Step 2: Cherry-pick Jules' single commit
        git cherry-pick 441e5ed

Step 3: Inspect the result
        git diff HEAD~1 HEAD -- index.html
        Verify: Jules' 4 deletion regions applied cleanly
        Verify: Claude's additions are intact

Step 4: Run call-site audit on deleted functions (see verification checklist)

Step 5: Push integration branch and open PR to main
        git push -u origin integration/reconcile
```

**Why this order (Jules deletions before Claude additions):**
- Jules removes dead code. Dead code removal is cleaner to do on a smaller diff surface.
- Applying Jules' deletions first, then Claude's additions on top = logical authorship: "clean up legacy code, then add new features."
- Reverse order (Claude first, then Jules) risks Jules' deletion offsets being wrong if Claude's additions shifted lines significantly — but since cherry-pick uses 3-way merge internally, either order is technically safe.

### Alternative strategy: Sequential PRs (Jules first, Claude second)

```
PR A: Merge accent-work-514226236373803311 → main   (Jules, 1 commit)
PR B: Rebase claude/audit-repository-Fg9xI onto new main → merge
```

**Disadvantage:** Requires Claude's branch to rebase after Jules merges. 11 commits rebasing — higher mechanical risk, though not architecturally dangerous.

### Strategy NOT recommended: Direct merge of both branches to main in parallel

- Both PRs target the same file (`index.html`). The second one to merge will have a stale base and require conflict resolution without the context of what changed. Avoid.

---

## Dangerous Files — Manual Review Required Before Merge

| File | Why dangerous | Review action |
|---|---|---|
| `index.html` | Only overlapping file; both branches modified it | Do a final `git diff` after cherry-pick to confirm Claude's 15 addition regions are all present and Jules' 4 deletion regions are all gone |
| `js/module_modes.js` | Jules deletes `moduleModeBadge()` | Grep for `moduleModeBadge(` across entire codebase before accepting |
| `js/internal_meetings.js` | Jules deletes `imRtUnsubscribeList()` | Grep for `imRtUnsubscribeList(` before accepting |

---

## Rollback Strategy

### If cherry-pick produces unexpected conflicts

```bash
git cherry-pick --abort          # restore to pre-cherry-pick state
                                  # integration branch remains clean
```

### If integration branch merges to main and issues are found

```bash
# Immediate: revert the merge commit
git revert -m 1 <merge-commit-sha>
git push origin main

# Or: revert individual commits by SHA (11 Claude + 1 Jules)
```

### Safe fallback always available

Both source branches (`accent-work-514226236373803311` and `claude/audit-repository-Fg9xI`) remain untouched throughout this process. The integration branch is a third branch. If integration goes wrong, delete it and start over.

---

## Verification Checklist (Pre-Merge)

Before merging integration branch to main:

**index.html sanity checks:**
- [ ] `node --check index.html` passes (or equivalent JS extraction syntax check)
- [ ] `grep -n "MODULE_REGISTRY" index.html` — registry present (~line 887 area)
- [ ] `grep -n "buildSidebar" index.html` — function present
- [ ] `grep -n "_aiWorkerReady" index.html` — preflight helper present
- [ ] `grep -n "maybeAutoSnapshotKPIs" index.html` — KPI scheduler present
- [ ] `grep -n "downloadScoringRubric" index.html` — should NOT exist (Jules deleted it)
- [ ] `grep -n "openRepOutreach" index.html` — should NOT exist (Jules deleted it)
- [ ] `grep -n "unverifiedCountFor" index.html` — should NOT exist (Jules deleted it)

**Dead code call-site audits:**
- [ ] `grep -rn "moduleModeBadge(" js/ index.html` → zero results → safe to delete
- [ ] `grep -rn "imRtUnsubscribeList(" js/ index.html` → zero results → safe to delete
- [ ] `grep -rn "unverifiedCountFor(" index.html` → only the definition → safe Jules deleted it

**New files present:**
- [ ] `.github/workflows/deploy-worker.yml` exists
- [ ] `docs/runtime/CLOUDFLARE_DEPLOYMENT_FLOW.md` exists
- [ ] `docs/runtime/WORKER_RUNTIME_RECOVERY.md` exists
- [ ] `AI_INTERACTION_MAP.md` exists (Jules)
- [ ] `AUDIT_SUMMARY.md` exists (Jules)
- [ ] `module_modes.json` has expanded module list (Jules)

**Deleted files confirmed gone:**
- [ ] `patch_quote.js` does NOT exist

**Worker pipeline:**
- [ ] `worker/anthropic-proxy.js` contains `WORKER_VERSION = 'v3-env-fallback'`
- [ ] `wrangler.toml` is unchanged
- [ ] `.github/workflows/deploy-worker.yml` triggers on `worker/**` path

---

## Recommended Integration Sequence

```
T+0   Read this plan
T+5   Verify dead-code call sites (3 grep commands from checklist)
T+10  git checkout -b integration/reconcile origin/claude/audit-repository-Fg9xI
T+12  git cherry-pick 441e5ed  (Jules' commit)
T+15  Inspect cherry-pick result: git diff HEAD~1 HEAD -- index.html
T+20  Run full verification checklist
T+25  git push -u origin integration/reconcile
T+30  Open PR: integration/reconcile → main
T+35  Final review of PR diff
T+40  Merge PR (squash or merge commit — either is fine)
T+45  Verify: curl probe, check Actions tab for worker deploy trigger
```

---

## Operational Risk Assessment

| Dimension | Assessment |
|---|---|
| **Merge conflict probability** | Low. Single overlapping file; non-overlapping line regions. 3-way merge should auto-resolve. |
| **Data loss risk** | Very low. Jules' deletions are dead code only. Claude's additions are all new code. |
| **Rollback complexity** | Low. Both source branches preserved. Revert-on-main is straightforward. |
| **Regression risk** | Low-medium. index.html is 7,700+ lines; any edit to it carries regression risk. Verification checklist mitigates. |
| **Deployment risk** | Low. GitHub Actions workflow only fires when `worker/anthropic-proxy.js` or `wrangler.toml` changes. Integration docs don't trigger it. |
| **Overall integration complexity** | **Low.** One overlapping file, all non-conflicting regions, one small cherry-pick. This is a clean integration. |

---

## What Must NOT Happen

- Do not merge both branches simultaneously to main via parallel PRs
- Do not auto-resolve conflicts without reading both sides
- Do not rebase Claude's 11-commit branch onto Jules' branch (wrong direction — Jules is smaller)
- Do not delete either source branch before verifying the integration branch is clean
- Do not run `wrangler deploy` manually during integration — wait for GitHub Actions after merge

---

_Plan complete. No files modified. No merges executed. Awaiting approval to proceed._
