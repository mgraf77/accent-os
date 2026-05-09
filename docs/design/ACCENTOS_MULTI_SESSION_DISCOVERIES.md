# AccentOS Multi-Session Orchestration Discoveries
> **Doc type:** Planning / retrospective. Operational findings from this multi-session run.
> **Frame:** what worked, what hurt, what should eventually be automated. Grounded; no AGI theorizing.
> **Source:** the rollout-planning branch executed across ~10 sequential prompts, 5 alignment passes (initial → A → B → C → freeze packaging), 1 convergence pass, 1 canonical reconciliation pass.

---

## 1. What worked

### 1.1 Hub-and-spoke separation
Defining sessions as **Hub** (writes runtime + canonical) vs. **Spoke** (writes only `docs/design/*.md`) eliminated an entire class of failures up front. A spoke session that tried to edit `index.html` would be in violation by name. The branch pattern (`claude/<topic>-<suffix>`) carried the role information without requiring any tooling.

### 1.2 Prompt handoff chains
Each prompt ended with "exact next recommended prompt" — a self-contained instruction the next session could execute without re-deriving context. This made the sessions **composable**: each one's output was the next one's input. Failures in one session did not cascade because the next prompt could refer back to the freeze commit.

### 1.3 Branch isolation
Single branch for the entire planning arc (`claude/accentos-rollout-planning-UTElf`) meant zero merge conflicts internally. Canonical content lived on a separate branch and was consumed read-only — no contention with parallel work.

### 1.4 Atomic commits
"One alignment edit per commit" let any pass be partially executed and the rest retried. The C-priority pass produced 5 commits across 5 files; if commit 3 had failed, commits 1, 2, 4, 5 would still stand.

### 1.5 Contradiction audits
Authoring `ACCENTOS_GOVERNANCE_CONTRADICTIONS.md` and `ACCENTOS_CANONICAL_DELTA.md` *before* the alignment passes meant the passes had a finite, prioritized work list (A/B/C/D priority + 15 + 9 catalogued items). Without this, alignment work would have been an unbounded "fix things as we notice them" loop.

### 1.6 Governance layering
Stacking the 18 spoke planning files in a precedence order (escalation matrix → reconciliation → readiness → freeze protocol → terminology → contradictions → freeze snapshot) meant each doc had exactly one job. Updates to one rarely cascaded.

### 1.7 Additive-only discipline
Every action was a *new* commit, a *new* file, or a *flip* with an inverse-flip diff in the body. There were zero `git reset --hard` operations across the entire planning arc, zero force-pushes, zero deletions of prior content. Recovery from any state was always one `git revert` away.

---

## 2. Where coordination friction existed

### 2.1 The four canonical files were "missing" until they weren't
The initial rollout-strategy doc declared the four canonical governance files ("SYSTEM_STATE.md" et al.) as nonexistent. They actually existed on a parallel branch. **The friction:** sessions could not "see" branches they had not been told about. Resolution required Captain to point at the canonical branch by name. **Lesson:** future spoke sessions should run a one-line discovery (`git ls-remote --heads origin`) before declaring any artifact missing.

### 2.2 Phase-numbering collision
Both governance scopes (multi-repo restructure and shell-v2 rollout) had a "Phase 0" and a "Phase 1." Without explicit disambiguation, the same phrase meant two different things in two different contexts. **Resolution:** the A1 alignment edit added an explicit header note. **Lesson:** numbering across overlapping scopes needs a scope prefix from the first commit.

### 2.3 Documentation precedence was implicit until it wasn't
Authority order ("canonical > Hub > Spoke; recency-of-merge breaks ties") was assumed by every doc but stated only in `ACCENTOS_GOVERNANCE_RECONCILIATION.md`. Some docs cross-referenced it; others duplicated freeze conditions or risk lists locally. **Resolution:** the B-priority pass deduplicated. **Lesson:** authority should be cited by reference, never duplicated. Duplication is sprawl.

### 2.4 "Snapshot" and "Phase" were overloaded
Three different things were called "snapshot" (curl diff, system state, handoff packet). Two different ladders were called "Phase N." **Resolution:** `ACCENTOS_GOVERNANCE_TERMINOLOGY.md` plus the C9 disambiguation. **Lesson:** vocabulary normalization is cheap; vocabulary drift is expensive.

### 2.5 Captain-only items pile up silently
At freeze, four items remained Captain-only: R-02 worker proxy, two D-priority canonical edits, rollout Phase 1 authorization. None could be executed by Hub or Spoke. **Resolution:** `ACCENTOS_CAPTAIN_DECISION_QUEUE.md`. **Lesson:** Captain queue should be visible from session start, not assembled at the end.

### 2.6 Branch discovery is manual
Identifying which branch held the canonical files required `git ls-remote --heads origin` + a per-branch `git ls-tree`. There is no registry. **Lesson:** a `BRANCHES_REGISTRY.md` (one-line-per-branch role description) would be cheap and would prevent rediscovery cost on every session.

---

## 3. What should eventually become automated inside AccentOS

These are concrete, scoped automation candidates. Not blue-sky.

### 3.1 Branch-role auto-classification
A `scripts/branch-role.sh` that reads the current branch name and prints the role + permissions per `ACCENTOS_GOVERNANCE_BRANCH_LIFECYCLE.md`. Run by `.claude/CLAUDE.md` AUTO-EXECUTE on session start. Output goes to the status block.

### 3.2 Automatic contradiction-audit
A `scripts/governance-audit.sh` that walks `docs/design/*.md` and flags duplicate statements about freeze triggers, authority, scoring, etc. Run pre-commit on `claude/governance-*` and `claude/<topic>-*` branches. Doesn't fix; just flags.

### 3.3 Frozen-doc edit protection
A pre-commit hook that detects edits to files listed in `ACCENTOS_GOVERNANCE_FREEZE_NOTICE.md` and refuses unless an `--allow-frozen-edit` flag is passed (Captain override). Implementation: shell + grep; no framework.

### 3.4 Approval-gated `→ live` flip
A pre-commit hook that detects `module_modes.json` changes flipping any module to `live` and refuses unless SESSION_LOG.md contains a Captain "go" entry within the last 24h. Soft check — primary safeguard remains human review.

### 3.5 Phase-numbering linter
A pre-commit hook that flags commit subjects containing bare "Phase N" (no scope prefix). Forces "canonical Phase 1" or "rollout Phase 1." Tiny shell regex; high yield.

### 3.6 Captain queue surfacing
A `scripts/captain-queue.sh` that reads `ACCENTOS_CAPTAIN_DECISION_QUEUE.md` and prints a one-page summary at session start (alongside the existing status block). Keeps Captain decisions in continuous view.

### 3.7 Stale-branch reaper (advisory)
A weekly job (or a `scripts/stale-branches.sh` run on demand) that lists `claude/*` branches with no commits in 14 days. Suggests archive; does not delete. Reduces clutter on `git branch -a`.

### 3.8 Token-efficiency observability
The `efficiency-monitor` skill already exists. Extending its session-end summary to include "files re-read more than twice in one session" would catch governance-doc rediscovery cost — the prevention is the upstream `ACCENTOS_GOVERNANCE_INDEX.md` consumption order.

---

## 4. Orchestration supervisor concepts (grounded)

A future supervisor session — running on its own branch, observing other sessions read-only — could:

- Read the live `git ls-remote` and produce a fresh `BRANCHES_REGISTRY.md`.
- Read recent SESSION_LOG entries to detect role violations (a Spoke that committed runtime code).
- Detect contradictions across `docs/design/*.md` newer than the freeze.
- Surface Captain decisions when blockers age past a threshold.
- Refuse to start a new spoke session if a freeze is unresolved.

**The supervisor is advisory, not authoritative.** It flags; Captain decides. Implementation is shell scripts + the existing skills framework, not a framework rewrite.

---

## 5. Approval-gated automation philosophy

The discoveries above all share a pattern: **automation that detects and pauses, never automation that executes governance-affecting actions autonomously.**

- ✅ Pre-commit hook *flags* a frozen-doc edit → Captain decides.
- ❌ Pre-commit hook *reverts* a frozen-doc edit → bypasses Captain authority.
- ✅ Lint *suggests* "use 'rollout Phase 1'" → human edits.
- ❌ Lint *rewrites* commit subjects → governance silently mutated.
- ✅ Branch reaper *lists* stale branches → human archives.
- ❌ Branch reaper *deletes* stale branches → irreversible.

The default-safe principle from `ACCENTOS_GOVERNANCE_ESCALATION_MATRIX.md` extends to automation: when unsure, the action is *flag*, never *act*.

---

## 6. Anti-agent-chaos rules (lessons from this run)

1. **One Hub session at a time.** Two Hubs on `main` is incoherent.
2. **One Spoke per topic.** Don't open `claude/accentos-rollout-planning-2-*` while `-UTElf` is open.
3. **One canonical edit per commit.** Always.
4. **No silent role-switching.** A Spoke does not become a Hub mid-session.
5. **Freeze respects freeze.** A frozen doc is read-only across all sessions until Captain unfreezes.
6. **Default-safe on detection.** A session that detects ambiguity halts, does not interpret.
7. **Captain queue is global.** Adding to it requires no permissions; only Captain executes from it.

---

## 7. Token-efficiency discoveries

- **`ACCENTOS_GOVERNANCE_INDEX.md` §6 consumption order** halved the time to onboard a new session — read 10 minutes of curated docs, not 18 files cold.
- **`ACCENTOS_GOVERNANCE_FREEZE_SNAPSHOT.md` as the single 10-minute packet** was the most-cited doc across the alignment passes. The single-packet handoff is the highest-leverage artifact.
- **Single-file commits** keep diffs small and reviewable; large multi-file commits would have required re-reading more on review.
- **Citing by file path + section number** (e.g., "per `ACCENTOS_GOVERNANCE_RECONCILIATION.md` §4") rather than re-stating the rule kept message bodies short.
- **Per-prompt scope freezes** (DO NOT modify X) prevented exploration loops. Tightening scope is a token-saving operation.
- **Compact output formats** (the COPYABLE RESPONSE markers) saved render space and let Captain copy-forward without hand-editing.

---

## 8. The single most important discovery

> **Authority is structural, not editorial.**

A session's authority is not what it knows or how well it writes — it is which branch it is on. This single principle, baked into branch naming, handled hub/spoke separation, canonical ownership, merge sequencing, and conflict resolution. Everything else is bookkeeping around this structural fact.

If the multi-agent system in AccentOS keeps exactly one rule, this is the one.

---

*End of ACCENTOS_MULTI_SESSION_DISCOVERIES.md — orchestration retrospective.*
