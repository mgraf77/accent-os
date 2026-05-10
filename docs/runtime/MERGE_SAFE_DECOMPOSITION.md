# MERGE-SAFE DECOMPOSITION
> AccentOS — Branch Lifespan + Merge Sequencing Doctrine  
> Status: PLANNING ONLY — no implementation authorized from this document  
> Last updated: 2026-05-10

---

## THE CORE CONSTRAINT

`index.html` is a single-file monolith. Every decomposition packet modifies it. That means:

> **No two decomposition branches can be open at the same time.**

This is not a preference — it is a hard constraint. Parallel branches targeting the same file produce conflicts that are not mechanically resolvable without re-doing the extraction work.

All other merge safety rules follow from this constraint.

---

## BRANCH AGING PREVENTION

**Maximum branch lifespan: 72 hours** from cut to merge.

A decomposition branch that stays open longer than 72 hours will:
- Age against `main` (feature commits accumulate on main while the branch waits)
- Require a rebase that re-introduces merge risk
- Become "stale context" — the operator who cut it may no longer recall what was extracted

### Aging Prevention Rules

| Rule | Detail |
|---|---|
| One branch at a time | Never cut the next packet branch until the current one is merged |
| No draft PRs older than 72h | If a decomposition PR is stale, close it; re-extract on a fresh branch |
| Rebase on `main` before merging | Always `git fetch origin main && git rebase origin/main` immediately before merge |
| No partial extraction branches left open | A branch with half an extraction is a bomb — merge it complete or abandon it |

### Aging Detection

Check `git log --oneline main..HEAD` before merging. If it shows > 5 commits behind main, the branch is aged. Steps:
1. Rebase on latest main
2. Re-run all verification checks (changes to main may have introduced new symbol usages)
3. Merge only after verification passes

---

## DECOMPOSITION MERGE SEQUENCING

Merge sequence is identical to packet execution order (see PHASE1_EXECUTION_PLAYBOOK.md). Below is the merge-gate table — what must be merged before what.

```
merge(PACKET-0: CSS)
    ↓
merge(PACKET-1: Utils)          ← GATE: all 5 typeof checks pass
    ↓
merge(PACKET-2: SB Core)        ← GATE: data loads confirmed on 3 pages
    ↓
merge(PACKET-3: Auth)           ← GATE: login + session restore + role gating work
    ↓
merge(PACKET-4: Vendor Data)    ← GATE: Vendor Ranking page loads + saves
    ↓
merge(PACKET-5: Co-op)          ← GATE: Co-op tab renders + saves
    ↓
merge(PACKET-6: Pipeline)       ← GATE: pipeline + deals all work
    ↓
merge(PACKET-7: Quotes)         ← GATE: quote create + AI parse + print all work
    ↓
merge(PACKET-8: Dashboard)      ← GATE: all 3 role dashboards render correctly
    ↓
merge(PACKET-9: Settings/Mgmt)  ← GATE: Settings + Mgmt all 5 sub-tabs work
    ↓
merge(PACKET-10: Shell Thin)    ← GATE: full smoke test all 30+ pages
```

**Do not skip gates.** A gate exists because the downstream packet has a dependency on the upstream packet's output being stable and merged.

---

## CONFLICT MINIMIZATION STRATEGIES

### 1. Extract Verbatim, Never Improve

The single greatest source of avoidable conflicts is "improvement" during extraction.
- No reformatting
- No renaming
- No comment additions
- No logic changes
- No variable scope adjustments

The output file must be a byte-for-byte copy of the extracted code, with one exception: the `'use strict';` directive may be added at the top of the new file if not already present.

### 2. Remove, Don't Replace

In `index.html`, the extraction operation is a pure deletion — the function group is removed and replaced with a `<script src>` tag. The `<script src>` tag goes at the same relative position as the function group it replaces.

### 3. Atomic Commits Per Packet

Each packet is exactly two files changed:
1. `index.html` — deletions only (plus one `<script src>` addition)
2. `js/[new-file].js` — new file containing exactly what was deleted from index.html

No other files may appear in a decomposition packet commit. If you need to fix a bug discovered during extraction, that fix is a separate commit on a separate branch that merges first.

### 4. Version Query String Protocol

Every new `<script src>` tag uses a query version string to bust CDN/browser cache:
```html
<script src="js/utils.js?v=1.0.0"></script>
```
Version is `1.0.0` for initial extraction. Subsequent changes increment the patch: `1.0.1`, `1.0.2`, etc. This prevents stale-cache silent failures.

---

## BOUNDED BRANCH LIFESPAN RULES

| Scenario | Rule |
|---|---|
| Packet is ready in < 1 hour | Cut branch, extract, verify, merge same session |
| Packet hits a blocker mid-extraction | Commit as `wip:` prefix, push, pause. Resume within 24h or abandon and re-extract fresh |
| Main receives a hotfix while packet branch is open | Rebase packet branch on new main BEFORE any verification. Do not merge against a stale base |
| Michael starts a new feature on a page covered by a pending packet | Freeze the packet branch. Let the feature merge first. Re-extract from the new main |
| Packet branch is 48h old without merging | Escalate: either merge today or close and re-cut from fresh main |

---

## DECOMPOSITION ISOLATION DOCTRINE

### What Isolation Means

Each decomposition packet is isolated if:
1. **Change surface = 2 files max** (index.html deletions + one new JS file)
2. **No side effects** on any other file in `js/`
3. **No new symbols added** — extracted code exports the same global functions, same names
4. **No new behavior** — extraction is not a refactor; functionality is preserved verbatim
5. **Independently revertible** — `git revert [one commit hash]` fully undoes the packet

### What Breaks Isolation

- Modifying an existing `js/` file during the same packet (e.g., "fixing" a dependency in `customers.js` while extracting pipeline)
- Extracting to a file that `import`s from another file (creates module coupling that didn't exist before)
- Splitting a function that was one unit into two functions during extraction
- Moving a constant that is used by 10 modules without auditing all 10

### The Two-File Rule

If a decomposition commit touches more than 2 files, it is not a decomposition commit — it is a refactor. Refactors are not allowed during Phase 1 decomposition. Separate the refactor from the extraction and ship them as separate commits on separate branches.

---

## HOTFIX COLLISION PROTOCOL

When a production bug requires a hotfix while a decomposition branch is in flight:

1. **Stop the decomposition branch** — do not merge it
2. **Cut hotfix from main** — `git checkout main && git checkout -b fix/[name]`
3. **Apply hotfix to `main`** — commit, push, deploy
4. **Rebase decomposition branch** on the new main — `git rebase origin/main`
5. **Re-run all verification checks** on the rebased decomposition branch
6. Only then resume the packet merge

Never hotfix on top of a decomposition branch. Never merge a decomposition branch over an unmerged hotfix.

---

## FEATURE COLLISION PROTOCOL

When a new feature needs to be built on a page that is the target of a pending extraction packet:

**Option A (preferred if feature is small):** Merge the extraction packet first, then build the feature on the extracted file (much easier to work in a clean standalone file).

**Option B (if feature is urgent):** Abandon the extraction packet branch. Let the feature merge to main. Re-extract the packet from the new main — the extraction will now include the new feature code automatically.

**Option C (never acceptable):** Build the feature on a branch cut from the decomposition packet branch. This creates a chain dependency that is unmergeable without conflicts.

---

## PRE-MERGE CHECKLIST

Before merging any decomposition packet branch:

```
[ ] git diff main -- index.html   → shows only deletions of the extracted group
[ ] git diff main -- js/[new].js  → shows only the new file
[ ] No other files in git status
[ ] <script src> tag version string set correctly
[ ] All packet verification steps passed (documented in SESSION_LOG.md)
[ ] SESSION_LOG.md entry written with rollback command
[ ] main is up to date (git fetch && git log main..HEAD shows 0 diverging commits on main)
```

A single unchecked box = do not merge.
