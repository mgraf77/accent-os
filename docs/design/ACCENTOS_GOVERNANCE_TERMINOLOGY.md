# AccentOS Governance Terminology
> **Doc type:** Planning. Vocabulary normalization.
> **Rule:** one term = one meaning. Synonyms are listed and mapped to a canonical term. Off-list usage is a documentation bug.

---

## 1. Canonical terms (alphabetical)

### Authority
The right to authorize a state change. Has classes: **Captain**, **Hub**, **Spoke**. Authority is structural (branch + class), not editorial. See Multi-Session Constitution Article II.

### Block (verb / state)
A condition that prevents a phase advance. Two intensities: 🔴 hard block (no advance), 🟡 soft block (Captain may waive). Distinct from **Freeze** (freeze halts all forward motion; block halts only the specific advance).

### Canonical
A document or data file whose content is authoritative. Canonical files have single-writer rules and live on dedicated branches (`claude/governance-*`) or on `main`. Synonyms: "authoritative" (allowed), "source of truth" (allowed for `MASTER.md` only). Not synonyms: "approved", "merged", "official" — those mean different things.

### Captain
The human (Michael). Singular and final authority. Not a session class — Captain is human; sessions are Claude. Synonyms: **none**. Do not write "owner" when meaning Captain (owner is a role, not the person).

### Convergence
The state in which a set of planning documents are mutually consistent, no contradictions remain unresolved, and the set is ready for handoff. Distinct from **Completion** (completion = work is done; convergence = the work is internally coherent).

### Coexistence
The phase in which v1 and v2 surfaces both exist for the same module, with one user-visible per user per phase. Coexistence is a *temporary* state inside Phases 4–6. Not a synonym for "running in parallel" — coexistence has hardening rules (Rollout Strategy §17).

### Disablement
Removing a surface from user reach. Has layers (per Freeze Protocol §6): per-user override, module mode flip, role flip, CSS guard, `git revert`. **Disablement is reversible by definition.** If a removal cannot be reversed, it is not a disablement — it is a deletion.

### Escalation
Raising a decision from a lower-authority session to a higher one (Spoke → Hub → Captain). Escalation does not include lateral handoff between sessions of the same class. Synonyms: "raise". Not synonyms: "delegate" (downward), "notify" (informational only).

### Extraction
Pulling code out of `index.html` into a dedicated file. Has triggers (Rollout Strategy §13, Reconciliation §10 E1–E7). Not the same as **Migration** (migration = moving a surface from v1 to shell-v2; extraction = file split inside v1).

### Freeze
A halt of forward state changes (no flips, no code commits to `main`). Rollback is *always available during a freeze*. Distinct from **Halt** (halt = no commits at all, including rollback). Distinct from **Block** (block applies to one advance; freeze applies to all).

### Gate
A binary check that must pass before an advance. Gates are named (G1–G10 in Reconciliation §8, E1–E7 for extraction, C1–C10 for shell-v2 checkpoints). Distinct from **Score** (score is 0–10; gate is pass/fail).

### Halt (Production halt)
No commits to `main` at all. Stricter than **Freeze**. Triggers in Freeze Protocol §4. Resume requires Captain "resume" + SESSION_LOG.

### Hub
The authoritative implementation session. Branch: `main` (or fast-forward branch merging cleanly). Writes production code, schema, worker, `index.html`, `module_modes.json`, canonical docs. See Multi-Session Constitution Article I.

### Kill
*Reserved word — avoid in governance text.* The system has **no kill switch**. Use **Disablement** (with layer specified) or **Halt** instead. The phrase "kill switch" appears only in Freeze Protocol §3 to clarify its absence.

### Live
A `module_modes.json` mode. The module is shipped under normal role gating. Not a synonym for "deployed" — every commit deploys; only some modules are `live`. Not a synonym for "production" — production is the system; live is a module state.

### Migration
Moving a user-visible surface from v1 (in `index.html` or `js/*.js`) to shell-v2 (in `js/shell_v2/*.js`). Reads migrate before writes (Rollout Strategy Phase 4 → Phase 5). Distinct from **Extraction**.

### Module
A keyed entry in `module_modes.json` with a corresponding implementation. Each module has exactly one mode at a time. The same logical area may have multiple module keys during transition (`pipeline` v1 + `pipeline_read_v2`).

### Override (per-user)
An entry in `accentos_user_overrides` that grants (`allow`) or revokes (`deny`) a single user's access to a single module, regardless of role. Stored in localStorage v1 (Owner machine only). Future Supabase table is M30. Synonyms: "exception" (avoid; overloaded). Not synonyms: "role change", "promotion".

### Phase
A numbered step in the rollout (Phase 0 Stabilize, Phase 1 Beachhead, ..., Phase 6 Deprecate). Phases are global to a module's journey. Not synonyms: "stage", "step", "round" — phases are the only top-level rollout unit.

### Readiness
A measurable property of a module before a flip. Computed via the 5 sub-scores S/M/W/G/R into a composite (Readiness System §1). Not a synonym for "done" or "ready" — readiness is *the score*, not the binary.

### Revert
A `git revert <commit>` operation. Always additive (creates a new commit). Distinct from **Rollback** (rollback is the broader concept; revert is one mechanism). Distinct from **Reset** — `git reset --hard` is forbidden on `main` (MASTER §12).

### Rollback
Returning a module or system to a prior good state. Rollback is **always additive** (a new commit, a flip-back, a tag). Mechanisms: `module_modes.json` flip-back, per-user `deny`, `git revert`, `wrangler deploy` of prior worker. Distinct from **Revert** (revert is one mechanism). Distinct from **Reset** (forbidden).

### Bake period
The calendar interval a module spends at a given mode without P0/P1 incidents before it may advance to the next mode. Defined per phase in Rollout Strategy §3 (Phase 2: 7 days at `building`; Phase 3: 7+ days at `testing`; Phase 5 writes: ≥14 days). Distinct from **Re-score window** — bake measures absence-of-incident; re-score measures freshness-of-evaluation.

### Re-score window
The freshness interval after which a Readiness Score (per `ACCENTOS_ROLLOUT_READINESS_SYSTEM.md`) becomes stale and must be recomputed before the next flip. Per Readiness System §11: a module scored more than 7 days ago must be re-scored before any phase advance. Distinct from **Bake period** — re-score is about the evaluation; bake is about elapsed clean time.

### Score
A 0–10 number from the Readiness System. There are five sub-scores (S/M/W/G/R) and one composite. Score does not equal **Gate**: a high score with a failing veto is still NO-GO.

### Session
A bounded run of a Claude agent on a branch. Has a class (Hub / Spoke). Ends at SESSION_LOG entry + WIP empty. Not a synonym for "agent" or "instance".

### Shell-v2
The new command-center architecture, mounted inside `index.html` via lazy-loaded `js/shell_v2/<name>.js` files. Not a separate page, not a separate domain, not a separate auth. Born-extracted (Rollout Strategy §5).

### Snapshot
**Three distinct uses; never used unqualified in governance text.**
- **`curl` snapshot** — the pre-flip / post-flip output of `curl https://accent-os.pages.dev` (and the `module_modes.json` URL) used for diff verification around a deploy. Operational, ephemeral. See Rollout Strategy §10.
- **System-state snapshot** — canonical `SYSTEM_STATE.md` on `claude/governance-snapshot-prep-k3dBs` (snapshot 2026-05-08 against `969de17`). Authoritative repo state; updated by re-snapshot, not edit-in-place.
- **Handoff packet snapshot** — `docs/design/ACCENTOS_GOVERNANCE_FREEZE_SNAPSHOT.md` on this branch. The 10-minute consumer guide for future sessions. A planning artifact, not a system state record.

### Spoke
A non-authoritative planning session. Branch: `claude/<topic>-*`. Writes `docs/design/*.md` only. Drafts; does not adopt. See Multi-Session Constitution Article I.

### Stale (client)
A browser holding old shell code or old `module_modes.json`. Mitigation: `?v=<commit-sha>` cachebust. Service worker is post-Phase 6 only. See Failure Scenarios F9.

### Stale (branch)
A `claude/*` branch with no commits in 14 days. Presumed abandoned; canonical content overrides on conflict.

### Suppress
*Reserved — avoid.* Use **Disablement** (specifying layer) or **Block**. "Suppress" is overloaded across UI/marketing/security contexts; in governance text, prefer the precise term.

### Survivability
The property that a system can lose components and still serve users. Operationalized via: rollback paths always available; v1 retained as survival layer through Phase 6; partial disablements over global kills. The frame for *all* rollout decisions: survivability > velocity.

### Veto
A single check that turns GO into NO-GO regardless of composite score. Sub-score floors are vetoes (Readiness System §7). Captain can veto any advance. A veto is binary; it is not weighted.

### WIP (Work-In-Progress)
The single in-flight task tracked in `WORK_IN_PROGRESS.md`. WIP=0 is required for session end. WIP non-empty is a freeze trigger.

---

## 2. Forbidden / discouraged terms

| Term | Why | Use instead |
|---|---|---|
| Kill switch | Misleading — no global kill exists | Disablement (with layer) |
| Suppress | Overloaded | Disablement / Block |
| Owner (when meaning the human) | Owner is a role | Captain |
| Stage | Overloaded with sales pipeline | Phase |
| Approve | Overloaded | Captain go (logged) |
| Reset (git) | Forbidden on `main` | Revert |
| Hotfix | Tempts skipping gates | Emergency rollback (per Escalation Matrix §7) |
| Force-push | Forbidden on `main` | (no replacement; do not do it) |
| Sync (v1↔v2) | Synchronization is rejected as a goal | Per-record single-shell rule |
| Done | Ambiguous | Live / Score=N / Phase complete |

---

## 3. Term-pair clarifications

| Term A vs. Term B | The distinction |
|---|---|
| Freeze vs. Halt | Freeze allows rollback. Halt does not. |
| Block vs. Freeze | Block applies to one advance. Freeze applies to all. |
| Revert vs. Rollback | Revert is one mechanism. Rollback is the concept. |
| Migration vs. Extraction | Migration = v1→v2. Extraction = inside v1, move to its own file. |
| Score vs. Gate | Score is 0–10. Gate is pass/fail. Both must be satisfied. |
| Veto vs. Block | Veto is internal to scoring. Block is external (freeze, missing Captain go). |
| Override vs. Role | Override is per-user, per-module. Role is a class assignment. |
| Coexistence vs. Parallel | Coexistence = governed; parallel = unspecified. |
| Captain vs. Owner | Captain is the human. Owner is a role. |
| Canonical vs. Live | Canonical is doc authority. Live is module state. |

---

## 4. Mode glossary (`module_modes.json`)

Reproduced from `MODULE_MODES.md` for one-stop reference. **Authoritative source is `MODULE_MODES.md`.**

- `idea_only` — Owner-only. Captured, no design.
- `brainstorming` — Owner-only. Open scoping.
- `planning` — Owner-only. Spec being written.
- `blocked` — Owner-only. Waiting on external.
- `building` — Owner + override-allow. Active dev.
- `testing` — Owner + Admin + override-allow. QA.
- `live` — Per role-defaults + overrides. Shipped.
- `deprecated` — Override-allow only. Sunset.
- `hidden` — Never in sidebar. Internal use.

---

## 5. Lint rule (manual)

When authoring or editing a governance doc on this branch:

1. If a term in §1 is used, use it as defined.
2. If a forbidden term in §2 appears, replace with the recommended substitute.
3. New terms require an entry here in the same commit.
4. Synonyms are listed; usage outside the canonical list is a doc bug.
5. Authority order: this terminology doc is precedence #16 (per Index §4). It does not override `MASTER.md` §12 — but on conflicts within governance language, this doc resolves.

---

*End of ACCENTOS_GOVERNANCE_TERMINOLOGY.md — one term, one meaning.*
