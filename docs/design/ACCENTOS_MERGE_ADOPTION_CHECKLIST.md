# AccentOS Merge Adoption Checklist
> **Doc type:** Operational merge runbook.
> **Use:** the Captain (or a Hub session under Captain authorization) follows this top-to-bottom when adopting `claude/accentos-rollout-planning-UTElf` to `main`.
> **Time budget:** 15–30 minutes for the merge itself; rollout-execution criteria are time-independent (they are gates, not deadlines).

---

## 1. Pre-merge checks (run on a clean shell, no other sessions active)

```
[ ] Working tree clean on main: `git -C /home/user/accent-os status` → "nothing to commit"
[ ] Fetch all relevant branches: `git fetch origin claude/accentos-rollout-planning-UTElf claude/governance-snapshot-prep-k3dBs main`
[ ] Verify rollout-planning HEAD is the freeze commit or descendant (per ACCENTOS_GOVERNANCE_FREEZE_NOTICE.md)
[ ] Verify canonical governance branch HEAD is the snapshot or descendant
[ ] Confirm no third party (other Claude session, contributor) has commits on either branch in the last 24h: `git log --since=24h <branch>`
[ ] Read ACCENTOS_GOVERNANCE_FREEZE_SNAPSHOT.md (10 min) — single-page handoff packet
[ ] Confirm WORK_IN_PROGRESS.md state matches expectation (worker-proxy WIP may still be open at merge time — does NOT block doc-only merge)
[ ] `module_modes.json` parses cleanly: `jq . module_modes.json > /dev/null`
[ ] Cloudflare last deploy is green (Pages dashboard)
```

---

## 2. Merge ordering (canonical first)

Per `ACCENTOS_MULTI_SESSION_GOVERNANCE.md` Article IV — **canonical-doc PRs merge before code or planning PRs that depend on them.**

```
Step A: Merge canonical claude/governance-snapshot-prep-k3dBs to main
        (or confirm it has already merged)
Step B: Merge canonical D-priority edits if Captain has prepared them
        (js/shell_v2/*.js row in MODULE_OWNERSHIP_MAP.md;
         module-key naming convention in MODULE_MODES.md)
Step C: Merge claude/accentos-rollout-planning-UTElf (this branch) to main
Step D: Tag the merge commit: `aos-rollout-planning-frozen-v1`
```

If Step A is skipped (canonical adoption deferred), Step C is still safe **as a documentation merge** — but the rollout-strategy §0/§0.1 references will point at unmerged content. Acceptable; flag it in SESSION_LOG.

If Step B is skipped (D-priority deferred), the C8 footnote in rollout-strategy §5 covers the gap; no blocker.

---

## 3. Branch sequencing (parallel-session safety)

While the merge is in progress:

- **All other `claude/*` branches that touch governance must pause** (per multi-session constitution Article IX).
- **No new flips to `module_modes.json`** during the merge window.
- **No new commits to canonical files** on any branch during the merge window.

Detect parallel work: `git ls-remote --heads origin 'claude/*'` — review last-commit timestamps; pause coordination needed if any has a commit in the last 24h.

---

## 4. Captain-only gates (cannot be bypassed)

| Gate | Required for | Captain action |
|---|---|---|
| **G-merge-1** | Step A merge | Captain "go" in chat or PR review |
| **G-merge-2** | Step B (if executing) | Captain authors the canonical edits on `claude/governance-*` branch |
| **G-merge-3** | Step C merge of this planning branch | Captain "go" in chat or PR review |
| **G-rollout-Phase-1** | Beginning rollout Phase 1 (shell beachhead) | Captain "rollout Phase 1 may begin" logged in SESSION_LOG.md |

G-rollout-Phase-1 is **independent of the merge**. The merge can complete without authorizing Phase 1; doc adoption is one decision, rollout execution is another.

---

## 5. Post-merge validation

```
[ ] git log main --oneline -5  → confirm merge commit visible
[ ] curl https://accent-os.pages.dev  → unchanged (doc-only merge has zero runtime effect)
[ ] curl https://accent-os.pages.dev/module_modes.json  → unchanged
[ ] Cloudflare deploy green within 60s of merge (auto-deploy of doc-only commit is harmless but should still succeed)
[ ] index.html size unchanged: `wc -c index.html` matches pre-merge
[ ] All 18 spoke planning files visible at main: `ls docs/design/*.md | wc -l` → 18 (plus test/ subdir)
[ ] SESSION_LOG.md updated with merge entry (commit hashes, time, Captain authorizer)
```

If any post-merge check fails, treat as F1/F6 per `ACCENTOS_ROLLOUT_FAILURE_SCENARIOS.md` and execute rollback (§7 below).

---

## 6. Adoption verification (canonical and rollout governance both navigable from `main`)

```
[ ] `cat MASTER.md | grep -c '## 12'` → §12 hard rules present
[ ] `ls SYSTEM_STATE.md GOVERNANCE_RISKS.md STABILIZATION_PROTOCOL.md MODULE_OWNERSHIP_MAP.md` → all four present (if Step A merged)
[ ] `ls docs/design/ACCENTOS_GOVERNANCE_*.md docs/design/ACCENTOS_PRODUCTION_ROLLOUT_STRATEGY.md docs/design/ACCENTOS_CANONICAL_DELTA.md` → all spoke docs present
[ ] Read ACCENTOS_GOVERNANCE_INDEX.md §6 consumption order — verify it reads canonical STABILIZATION_PROTOCOL.md before rollout strategy
[ ] Read ACCENTOS_PRODUCTION_ROLLOUT_STRATEGY.md §0 + §0.1 — verify two-scope precedence is intact
[ ] Open one test checklist (e.g., docs/design/test/daily_command_center.md) — verify it loads and references frozen docs by path
```

---

## 7. Rollback procedure (if merge causes a problem)

The merge is documentation-only; rollback is low-risk:

```
1. git revert <merge-commit-sha> on main, push.
2. Cloudflare auto-redeploys (no runtime effect either way).
3. SESSION_LOG.md entry: rollback rationale, what specifically failed.
4. Return to spoke planning branch state at HEAD f6fb703 (delta) or 1db969b (C-pass) for re-work.
```

Never `git reset --hard` on `main`. Always `git revert` (additive, reversible).

---

## 8. "Safe to begin rollout execution" criteria

Doc merge ≠ rollout-execution authorization. **All of the following** must be true before any session may begin shell-v2 Phase 1 work:

```
[ ] Documentation merge complete (Steps A, C above; B optional)
[ ] R-02 worker-proxy mitigation complete:
    - `2dca2a6` deployed via wrangler from Captain's local
    - Parse Notes returns 200 on a golden-path call
    - WORK_IN_PROGRESS.md updated to reflect resolved state
    - SESSION_LOG.md entry confirming
[ ] Captain explicit "rollout Phase 1 may begin" in SESSION_LOG.md
[ ] No active P0/P1 on any live module within last 48h
[ ] Cloudflare last deploy green
[ ] No conflicting Hub session on a parallel branch (per multi-session constitution Article IX)
[ ] Operational confidence score ≥ 6 (per ACCENTOS_ROLLOUT_READINESS_SYSTEM.md §8)
```

Until **all** boxes are checked, the rollout strategy's Phase 0 verdict remains BLOCKED and no shell-v2 mount, `module_modes.json` flip toward shell-v2 modules, or `js/shell_v2/*.js` file may be created.

---

## 9. Session-log requirements

After the merge (or any partial execution of this checklist), append one entry to `SESSION_LOG.md` containing:

- Date.
- Branches merged (in order).
- Commit hashes (canonical, this branch, merge commit).
- Captain authorizer signal (chat / PR review / verbal).
- Post-merge check status (pass / fail per item).
- Phase-0 verdict at end of session (BLOCKED / CLEAR).
- Next decision queued (per `ACCENTOS_CAPTAIN_DECISION_QUEUE.md`).

This is the audit trail. Future sessions read it to know what state the merge left the repo in.

---

*End of ACCENTOS_MERGE_ADOPTION_CHECKLIST.md — operational merge runbook.*
